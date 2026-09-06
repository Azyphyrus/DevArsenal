import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TABLES: Record<string, string> = {
  snippets: 'snippets',
  notes: 'notes',
  tasks: 'tasks',
};

/** Server row → client record. */
function fromServerRow(row: Record<string, unknown>) {
  const { id, updated_at, deleted_at, created_at, ...rest } = row;
  const client: Record<string, unknown> = {
    id,
    updatedAt: updated_at,
    deletedAt: deleted_at ?? null,
    ...rest,
  };
  if (created_at) client.createdAt = created_at;
  return client;
}

function migrationResponse() {
  return NextResponse.json(
    {
      snippets: [],
      notes: [],
      tasks: [],
      deletions: [],
      serverTime: new Date().toISOString(),
      needsMigration: true,
      error:
        'Sync tables are missing. Run the SQL migration in supabase/migrations/0002_deletion_ledger.sql, then retry.',
    },
    { status: 200 }
  );
}

/**
 * Hard-delete rows that were soft-deleted (tombstoned) longer than the
 * retention window ago. Legacy rows only — the current model never writes
 * in-table tombstones, but rows from before 0002 may still exist.
 */
async function purgeExpiredTombstones(table: string, userId: string): Promise<number> {
  const days = Number(process.env.SYNC_TOMBSTONE_RETENTION_DAYS);
  const retentionDays = Number.isFinite(days) && days >= 0 ? days : 7;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  // `lt('deleted_at', ...)` never matches NULL, so live rows are untouched.
  const { data, error } = await getSupabaseAdmin()
    .from(table)
    .delete()
    .eq('user_id', userId)
    .lt('deleted_at', cutoff)
    .select('id');
  if (error) throw error;
  return (data ?? []).length;
}

/** Expire deletion-ledger entries past the retention window. */
async function purgeExpiredLedgerEntries(userId: string): Promise<number> {
  const days = Number(process.env.SYNC_TOMBSTONE_RETENTION_DAYS);
  const retentionDays = Number.isFinite(days) && days >= 0 ? days : 7;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await getSupabaseAdmin()
    .from('deleted_records')
    .delete()
    .eq('user_id', userId)
    .lt('deleted_at', cutoff)
    .select('record_id');
  if (error) throw error;
  return (data ?? []).length;
}

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const since = req.nextUrl.searchParams.get('since') || null;
  const userId = session.userId;
  const result: Record<string, unknown[]> = { snippets: [], notes: [], tasks: [] };
  const deletions: { collection: string; id: string; deletedAt: string }[] = [];
  let purged = 0;

  for (const [collection, table] of Object.entries(TABLES)) {
    try {
      // Live rows only — in-table tombstones are a legacy of the old model.
      let query = getSupabaseAdmin()
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);
      if (since) {
        query = query.gt('updated_at', since);
      }
      const { data, error } = await query;
      if (error) throw error;
      result[collection] = (data ?? []).map((row) => fromServerRow(row as Record<string, unknown>));

      // Deletions this user made since the caller's last pull. These tell the
      // client to drop local copies the server has already hard-deleted.
      let delQuery = getSupabaseAdmin()
        .from('deleted_records')
        .select('record_id, deleted_at')
        .eq('user_id', userId)
        .eq('table_name', table);
      delQuery = delQuery.gt('deleted_at', since ?? '1970-01-01T00:00:00.000Z');
      const { data: delRows, error: delErr } = await delQuery;
      if (delErr) throw delErr;
      for (const row of (delRows ?? []) as { record_id: string; deleted_at: string }[]) {
        deletions.push({ collection, id: row.record_id, deletedAt: row.deleted_at });
      }

      // Opportunistic cleanup of legacy in-table tombstones. Never allowed to
      // break the pull itself.
      try {
        purged += await purgeExpiredTombstones(table, userId);
      } catch (purgeErr) {
        console.warn(`[sync/pull] ${collection} tombstone purge failed`, purgeErr);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const message = String((err as Error)?.message ?? '');
      if (code === '42P01' || message.includes('does not exist') || code === 'PGRST205') {
        return migrationResponse();
      }
      console.error(`[sync/pull] ${collection} failed`, err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'pull_failed' },
        { status: 500 }
      );
    }
  }

  // Expire old ledger entries (same retention window as legacy tombstones).
  try {
    purged += await purgeExpiredLedgerEntries(userId);
  } catch (purgeErr) {
    console.warn('[sync/pull] deletion-ledger purge failed', purgeErr);
  }

  return NextResponse.json({
    ...result,
    deletions,
    serverTime: new Date().toISOString(),
    purged,
  });
}