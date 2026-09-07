import type { SyncEntity } from "./types";

/**
 * Last-write-wins conflict resolution for synced collections.
 *
 * Rules per record id:
 * - A remote tombstone (`deletedAt` set) removes the local copy unless the
 *   local copy's `updatedAt` is strictly newer (that device "wins").
 * - A live remote record replaces the local one when its `updatedAt` is equal
 *   or newer. Local-only records are kept untouched.
 *
 * Timestamps are compared as instants (Date.parse), NOT as strings: the server
 * emits `+00:00` offsets while the client emits `Z`, and lexicographic order
 * differs between those suffixes — string comparison would misresolve ties.
 */
function toTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

export function mergeRemoteLocal<T extends SyncEntity>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);

  for (const remoteItem of remote) {
    const localItem = byId.get(remoteItem.id);
    if (remoteItem.deletedAt) {
      // Tombstone: drop the local copy unless the local copy is strictly newer.
      if (!localItem || toTime(localItem.updatedAt) < toTime(remoteItem.updatedAt)) {
        byId.delete(remoteItem.id);
      }
    } else {
      // LWW: server wins ties and anything equal-or-newer.
      if (!localItem || toTime(remoteItem.updatedAt) >= toTime(localItem.updatedAt)) {
        byId.set(remoteItem.id, remoteItem);
      }
    }
  }
  return [...byId.values()];
}