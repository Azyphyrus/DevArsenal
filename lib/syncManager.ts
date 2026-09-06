import {
  stores,
  readOutbox,
  clearDirtyCollection,
  listDirtyCollections,
  markSnapshotDirty,
} from "./localStorage";
import {
  SyncEntity,
  SyncCollection,
  SyncStatus,
} from "./types";

/**
 * Browser-side sync engine.
 *
 * - Every UI mutation marks the affected collection's snapshot dirty (outbox).
 * - `syncNow()` pushes all dirty snapshots to the server, pulls back the merged
 *   state for every collection and applies it locally (LWW + tombstones).
 * - A device id is generated once per browser and sent with every request.
 */

// ---------- Constants ----------

const DEVICE_ID_KEY = "devtools_device_id";
const LAST_SYNC_KEY = "devtools_last_sync_at";
const LAST_PULL_KEY = "devtools_last_pull_at";

const DEFAULT_INTERVAL_MS = 30_000;

export function getSyncIntervalMs(): number {
  const raw = Number(process.env.NEXT_PUBLIC_SYNC_INTERVAL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_INTERVAL_MS;
}

// ---------- Device identity ----------

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const platform = navigator.platform || navigator.userAgent || "Unknown device";
  return platform.slice(0, 64);
}

// ---------- Status store / subscriptions ----------

const initStatus: SyncStatus = {
  phase: "idle",
  lastSyncAt: null,
  pendingCollections: [],
};

let currentStatus: SyncStatus = { ...initStatus };
const listeners = new Set<(status: SyncStatus) => void>();

function refreshPending(): SyncCollection[] {
  return listDirtyCollections();
}

function publish(next: SyncStatus) {
  currentStatus = next;
  listeners.forEach((listener) => listener(next));
}

function setPartial(partial: Partial<SyncStatus>) {
  publish({ ...currentStatus, ...partial, pendingCollections: refreshPending() });
}

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

export function subscribeSync(listener: (status: SyncStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called by useSync when the signed-in user changes or logs out. */
export function resetSyncState() {
  currentStatus = { ...initStatus };
  listeners.forEach((listener) => listener(currentStatus));
}

// ---------- Low level HTTP ----------

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string; needsMigration?: boolean };
  if (!res.ok || body?.needsMigration) {
    const err = new Error(body?.error || `Sync request failed (${res.status})`);
    if (body?.needsMigration) {
      (err as Error & { needsMigration: boolean }).needsMigration = true;
    }
    throw err;
  }
  return body;
}
// ---------- Push ----------

interface PushResponse {
  ok: boolean;
  upserted: number;
  tombstoned: number;
  needsMigration?: boolean;
}

async function pushCollection(collection: SyncCollection): Promise<number> {
  const outbox = readOutbox();
  const snapshot = outbox[collection];
  if (!snapshot) return 0;

  // `knownThrough` = the last moment this device successfully pulled from the
  // server. The server only tomb-stones rows the device has actually seen,
  // which prevents a stale device from deleting newer data.
  const response = await api<PushResponse>("/api/sync/push", {
    method: "POST",
    body: JSON.stringify({
      collection,
      snapshot,
      deviceId: getDeviceId(),
      knownThrough: getLastPullAt(),
    }),
  });

  if (response.ok) {
    clearDirtyCollection(collection);
  }
  return snapshot.items.length;
}

// ---------- Pull ----------

interface PullResponse {
  snippets: SyncEntity[];
  notes: SyncEntity[];
  tasks: SyncEntity[];
  deletions?: { collection: string; id: string; deletedAt: string }[];
  serverTime: string;
  needsMigration?: boolean;
}

async function pullAll(): Promise<number> {
  const since = getLastPullAt();
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const data = await api<PullResponse>(`/api/sync/pull${query}`);

  let pulled = 0;
  for (const collection of ["snippets", "notes", "tasks"] as SyncCollection[]) {
    const remote = (data[collection] ?? []) as SyncEntity[];
    const store = stores[collection];
    store.applyRemote(remote);
    pulled += remote.length;
  }

  // Server-confirmed deletions: convert each into a synthetic tombstone and
  // merge it locally. Records whose local copy is genuinely newer survive
  // (they will legitimately re-upload on push — LWW); everything else is
  // dropped, so a row the server hard-deleted disappears here too.
  const deletions = data.deletions ?? [];
  if (deletions.length > 0) {
    const byCollection = new Map<SyncCollection, SyncEntity[]>();
    for (const d of deletions) {
      if (d.collection !== "snippets" && d.collection !== "notes" && d.collection !== "tasks") {
        continue;
      }
      const list = byCollection.get(d.collection) ?? [];
      list.push({ id: d.id, updatedAt: d.deletedAt, deletedAt: d.deletedAt } as SyncEntity);
      byCollection.set(d.collection, list);
    }
    for (const [collection, tombstones] of byCollection) {
      stores[collection].applyRemote(tombstones);
      pulled += tombstones.length;
    }
  }

  const serverTime = data.serverTime || new Date().toISOString();
  setLastPullAt(serverTime);
  setLastSyncAt(serverTime);
  return pulled;
}

// ---------- Timestamps ----------

export function getLastSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

function setLastSyncAt(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

/** Last timestamp this device pulled server state up to (server clock). */
function getLastPullAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_PULL_KEY);
}

function setLastPullAt(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_PULL_KEY, iso);
}

const ALL_COLLECTIONS: SyncCollection[] = ["snippets", "notes", "tasks"];
// ---------- Main entry point ----------

/**
 * Runs one full sync cycle: pull server state, then push local changes.
 * Pull-first ordering makes a device authoritative before it pushes, which is
 * what makes the server's tomb-stone sweep safe.
 * Safe to call repeatedly (concurrent runs are ignored).
 */
export async function syncNow(): Promise<SyncStatus> {
  if (typeof window === "undefined") return currentStatus;
  if (currentStatus.phase === "syncing") return currentStatus;

  setPartial({ phase: "syncing", error: undefined, needsMigration: false });

  try {
    // 1) Pull first. On the very first sync (no lastPullAt yet) this returns
    //    every server row, so the subsequent push snapshot is authoritative.
    const hadPulledBefore = !!getLastPullAt();
    const pulled = await pullAll();

    // 2) First-sync bootstrap: queue local-only data — including records saved
    //    before the sync feature existed — so it reaches the server now.
    if (!hadPulledBefore) {
      for (const collection of ALL_COLLECTIONS) {
        const items = stores[collection].getAll();
        if (items.length > 0) markSnapshotDirty(collection, items);
      }
    }

    // 3) Push every dirty collection.
    const dirty = listDirtyCollections();
    let pushed = 0;
    for (const collection of dirty) {
      try {
        pushed += await pushCollection(collection);
      } catch (err) {
        const needsMigration = (err as Error & { needsMigration?: boolean }).needsMigration === true;
        if (needsMigration) {
          setPartial({ needsMigration: true, phase: "error", error: (err as Error).message });
          return currentStatus;
        }
        throw err;
      }
    }

    const lastSyncAt = getLastSyncAt();

    publish({
      phase: "success",
      lastSyncAt,
      pendingCollections: refreshPending(),
      error: undefined,
      needsMigration: false,
    });

    if (pushed > 0 || pulled > 0) {
      console.log(`[sync] pushed ${pushed}, pulled ${pulled} rows`);
    }
    return currentStatus;
  } catch (err) {
    console.error("[sync] cycle failed", err);
    const message = err instanceof Error ? err.message : "Unknown sync error";
    publish({
      phase: "error",
      lastSyncAt: getLastSyncAt(),
      pendingCollections: refreshPending(),
      error: message,
      needsMigration: (err as Error & { needsMigration?: boolean }).needsMigration === true,
    });
    return currentStatus;
  }
}

/** Convenience re-export used by UI components. */
export { listDirtyCollections as getPendingCollections };