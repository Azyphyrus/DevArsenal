import type { SyncEntity } from "./types";

/**
 * Last-write-wins conflict resolution for synced collections.
 *
 * Rules per record id:
 * - A remote tombstone (`deletedAt` set) removes the local copy unless the
 *   local copy's `updatedAt` is strictly newer (that device "wins").
 * - A live remote record replaces the local one when its `updatedAt` is equal
 *   or newer. Local-only records are kept untouched.
 */
export function mergeRemoteLocal<T extends SyncEntity>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);

  for (const remoteItem of remote) {
    const localItem = byId.get(remoteItem.id);
    if (remoteItem.deletedAt) {
      // Tombstone: drop the local copy unless the local copy is strictly newer.
      if (!localItem || localItem.updatedAt < remoteItem.updatedAt) {
        byId.delete(remoteItem.id);
      }
    } else {
      // LWW: server wins ties and anything equal-or-newer.
      if (!localItem || remoteItem.updatedAt >= localItem.updatedAt) {
        byId.set(remoteItem.id, remoteItem);
      }
    }
  }
  return [...byId.values()];
}