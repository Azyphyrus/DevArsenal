"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./AuthContext";
import {
  getSyncIntervalMs,
  getSyncStatus,
  subscribeSync,
  syncNow,
  resetSyncState,
  getDeviceName,
  getDeviceId,
} from "./syncManager";
import type { SyncStatus } from "./types";

/**
 * Subscribes a component to the global sync status (used by the header
 * indicator, etc.). Works without an authenticated user.
 */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus);
}

/**
 * App-wide sync controller. Should be mounted once (e.g. in the root layout).
 *
 * - Starts an interval-based auto-sync while a user is signed in.
 * - Triggers an immediate sync when the tab regains focus or the browser
 *   goes back online.
 * - Resets the status when the signed-in user changes or logs out.
 */
export function useSync(): { status: SyncStatus; syncNow: typeof syncNow } {
  const { user, loading } = useAuth();
  const status = useSyncStatus();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (loading) return;
    resetSyncState();
    if (!userId) return;

    // Register this browser as a known device and run an initial sync.
    syncNow()
      .then(() => {
        void fetch("/api/sync/device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: getDeviceId(), deviceName: getDeviceName() }),
          cache: "no-store",
        }).catch(() => {});
      })
      .catch(() => {});

    const intervalAt = getSyncIntervalMs();
    const interval = setInterval(() => {
      syncNow().catch(() => {});
    }, intervalAt);

    const onVisibility = () => {
      if (!document.hidden) syncNow().catch(() => {});
    };
    const onOnline = () => {
      syncNow().catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      resetSyncState();
    };
  }, [userId, loading]);

  return { status, syncNow };
}