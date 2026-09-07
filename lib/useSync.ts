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
  startScheduler,
  getLastSyncAt,
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
    const stopScheduler = startScheduler(intervalAt, () => {
      syncNow().catch(() => {});
    });

    const onVisibility = () => {
      if (!document.hidden) syncNow().catch(() => {});
    };
    const onOnline = () => {
      syncNow().catch(() => {});
    };
    const onFocus = () => {
      syncNow().catch(() => {});
    };
    // Background tabs get their intervals throttled or frozen by the browser;
    // focusing the window is the reliable moment to catch up, so a device that
    // was left in the background syncs immediately when the user returns.
    //
    // Additionally, a device that's been idle (no sync) for a while should
    // re-sync when the user clearly returns to the machine — mousemove/keydown
    // after inactivity is a strong signal the tab is live again.
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const onActivity = () => {
      if (idleTimer) return; // already armed
      idleTimer = setTimeout(() => {
        idleTimer = null;
      }, intervalAt * 2);
      // Only sync if we're actually stale — avoids a tight loop of syncs.
      const last = getLastSyncAt();
      const lastMs = last ? new Date(last).getTime() : 0;
      if (Date.now() - lastMs > intervalAt) {
        syncNow().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    document.addEventListener("mousemove", onActivity, { passive: true });
    document.addEventListener("keydown", onActivity, { passive: true });

    return () => {
      stopScheduler();
      if (idleTimer) clearTimeout(idleTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      document.removeEventListener("mousemove", onActivity);
      document.removeEventListener("keydown", onActivity);
      resetSyncState();
    };
  }, [userId, loading]);

  return { status, syncNow };
}