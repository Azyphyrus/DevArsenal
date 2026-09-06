import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TABLES: Record<string, string> = {
  snippets: 'snippets',
  notes: 'notes',
  tasks: 'tasks',
};

/** Client record → server row. */
function toServerItem(col: string, item: Record<string, unknown>) {
  const { id, updatedAt, deletedAt, createdAt, ...rest } = item;
  const row: Record<string, unknown> = {
    id,
    updated_at: updatedAt,
    deleted_at: deletedAt ?? null,
    ...rest,
  };
  // `tasks` keeps its own `created_at` column.
  if (col === 'tasks') {
    row.created_at = (createdAt as string) ?? new Date().toISOString();
  }
  return row;
}

function isMigrationError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const message = String((err as Error)?.message ?? '');
  return code === '42P01' || message.includes('does not exist') || code === 'PGRST205';
}

function migrationResponse() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Sync tables are missing. Run the SQL migration in supabase/migrations/0001_sync_schema.sql, then retry.',
      needsMigration: true,
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: { collection?: string; snapshot?: { updatedAt?: string; items?: unknown[] } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const collection = body.collection;
  const table = TABLES[collection ?? ''];
  const snapshot = body.snapshot;
  if (!table || !snapshot || !Array.isArray(snapshot.items)) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }

  const userId = session.userId;
  const admin = getSupabaseAdmin();
  const snapshotAt = new Date(snapshot.updatedAt || Date.now()).toISOString();
  // `knownThrough` is the last time this device pulled server state (server
  // clock). The tomb-stone sweep below will NEVER delete a row the device
  // hasn't seen yet, i.e. rows with updated_at after this value.
  const knownThrough = (body as { knownThrough?: string }).knownThrough ?? null;
  const incoming = (snapshot.items as unknown[])
    .filter(
      (it) =>
        typeof it === 'object' &&
        it !== null &&
        typeof (it as Record<string, unknown>).id === 'string'
    )
    .map((it) => toServerItem(collection!, it as Record<string, unknown>));

  let upserted = 0;
  let deletedCount = 0;

  try {
    const incomingIds = incoming.map((i) => i.id as string);

    // 0) Load the deletion ledger for the incoming ids, so we can do
    //    last-write-wins between "a device edited it" and "a device deleted it".
    const ledgerByItem = new Map<string, string>();
    if (incomingIds.length > 0) {
      const { data: ledgerRows, error: ledgerErr } = await admin
        .from('deleted_records')
        .select('record_id, deleted_at')
        .eq('user_id', userId)
        .eq('table_name', table)
        .in('record_id', incomingIds);
      if (ledgerErr) {
        if (isMigrationError(ledgerErr)) return migrationResponse();
        throw ledgerErr;
      }
      for (const row of (ledgerRows ?? []) as { record_id: string; deleted_at: string }[]) {
        ledgerByItem.set(row.record_id, row.deleted_at);
      }
    }

    // Current server rows for the incoming ids (for row-level LWW).
    const existingByKey = new Map<string, string>();
    if (incomingIds.length > 0) {
      const { data: existingRows, error: existErr } = await admin
        .from(table)
        .select('id, updated_at')
        .eq('user_id', userId)
        .in('id', incomingIds);
      if (existErr) throw existErr;
      for (const row of (existingRows ?? []) as { id: string; updated_at: string }[]) {
        existingByKey.set(row.id, row.updated_at);
      }
    }

    // 1) Apply the incoming snapshot.
    for (const item of incoming) {
      const incomingUpdatedAt = (item.updated_at as string) || snapshotAt;
      const incomingTime = new Date(incomingUpdatedAt).getTime();

      if (item.deleted_at) {
        // Legacy in-table tombstone (client on the old model): record the
        // deletion in the ledger, then remove any remaining row.
        const { error: ledgerErr } = await admin.from('deleted_records').upsert(
          {
            user_id: userId,
            table_name: table,
            record_id: item.id as string,
            deleted_at: incomingUpdatedAt,
          },
          { onConflict: 'user_id,table_name,record_id' }
        );
        if (ledgerErr) {
          if (isMigrationError(ledgerErr)) return migrationResponse();
          throw ledgerErr;
        }
        const { error: delErr } = await admin
          .from(table)
          .delete()
          .eq('user_id', userId)
          .eq('id', item.id as string);
        if (delErr) throw delErr;
        deletedCount += 1;
        continue;
      }

      // A deletion newer than this edit wins — the record stays deleted.
      const ledgerDeletedAt = ledgerByItem.get(item.id as string);
      if (ledgerDeletedAt && new Date(ledgerDeletedAt).getTime() > incomingTime) {
        continue;
      }
      // This edit is newer than the recorded deletion → legitimate resurrect.
      if (ledgerDeletedAt) {
        const { error } = await admin
          .from('deleted_records')
          .delete()
          .eq('user_id', userId)
          .eq('table_name', table)
          .eq('record_id', item.id as string);
        if (error) throw error;
      }

      // Row-level LWW: only write when equal-or-newer than the server row.
      const existingUpdatedAt = existingByKey.get(item.id as string);
      const shouldWrite =
        !existingUpdatedAt || incomingTime >= new Date(existingUpdatedAt).getTime();
      if (!shouldWrite) continue;

      const { error } = await admin.from(table).upsert(
        { ...item, user_id: userId, updated_at: incomingUpdatedAt },
        { onConflict: 'user_id,id' }
      );
      if (error) throw error;
      upserted += 1;
    }

    // 2) Deletion sweep: rows this device no longer has AND has actually
    //    seen (updated_at not after knownThrough) are HARD-deleted from the
    //    data table and recorded in the deletion ledger. Other devices
    //    discover the deletion by pulling recent ledger entries, so nothing
    //    is resurrected; ledger retention provides the same offline safety
    //    window the old in-table tombstones did.
    if (knownThrough) {
      const { data: liveRows, error: liveErr } = await admin
        .from(table)
        .select('id, updated_at')
        .eq('user_id', userId)
        .is('deleted_at', null);
      if (liveErr) throw liveErr;

      const incomingIdSet = new Set(incoming.map((i) => i.id as string));
      const sweepAt = new Date().toISOString();
      const knownThroughTime = new Date(knownThrough).getTime();

      const toDelete: string[] = [];
      for (const row of (liveRows ?? []) as { id: string; updated_at: string }[]) {
        if (incomingIdSet.has(row.id)) continue;
        const rowUpdated = new Date(row.updated_at).getTime();
        if (rowUpdated > knownThroughTime) continue; // unseen row → keep
        toDelete.push(row.id);
      }

      if (toDelete.length > 0) {
        // Ledger first: if this fails (e.g. migration missing), the rows stay
        // untouched so no deletion can ever be lost.
        const { error: ledgerErr } = await admin.from('deleted_records').upsert(
          toDelete.map((id) => ({
            user_id: userId,
            table_name: table,
            record_id: id,
            deleted_at: sweepAt,
          })),
          { onConflict: 'user_id,table_name,record_id' }
        );
        if (ledgerErr) {
          if (isMigrationError(ledgerErr)) return migrationResponse();
          throw ledgerErr;
        }

        const { error: delErr } = await admin
          .from(table)
          .delete()
          .eq('user_id', userId)
          .in('id', toDelete);
        if (delErr) throw delErr;
        deletedCount += toDelete.length;
      }
    }
  } catch (err) {
    if (isMigrationError(err)) return migrationResponse();
    console.error(`[sync/push] ${collection} failed`, err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'push_failed' },
      { status: 500 }
    );
  }

  // Audit trail (best effort).
  try {
    await admin
      .from('sync_logs')
      .insert({
        user_id: userId,
        device_id: (body as unknown as { deviceId?: string }).deviceId ?? null,
        pushed_snapshots: upserted + deletedCount > 0 ? 1 : 0,
        pulled_rows: 0,
        error: null,
      });
  } catch (err) {
    console.warn('[sync/push] failed to write sync_log', err);
  }

  return NextResponse.json({ ok: true, upserted, tombstoned: deletedCount });
}