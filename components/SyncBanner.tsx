'use client';

import { useEffect, useState } from "react";
import { useSyncStatus } from "@/lib/useSync";
import { syncNow } from "@/lib/syncManager";
import { useAuth } from "@/lib/AuthContext";
import { RiRefreshLine, RiErrorWarningFill } from "react-icons/ri";

/**
 * A prominent banner shown at the top of the page when sync needs attention:
 * - Stale: the device hasn't synced in a while (background-tab throttling)
 * - Pending: local changes are queued but not yet pushed
 * - Error: the last sync failed
 *
 * More visible than the header chip — this is the user's cue to take action.
 */
export default function SyncBanner() {
  const status = useSyncStatus();
  const { user } = useAuth();
  // Tick every 30s so staleness (which depends on the current time) re-evaluates.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const STALE_MS = 70000;
  const lastSyncMs = status.lastSyncAt ? new Date(status.lastSyncAt).getTime() : 0;
  const isStale = status.phase !== "syncing" && now - lastSyncMs > STALE_MS;

  let message: string | null = null;
  let tone: "warning" | "error" | "info" = "warning";
  const actionLabel = "Sync now";
  const onAction = () => void syncNow();

  if (status.phase === "error") {
    message = `Sync failed: ${status.error || "unknown error"}`;
    tone = "error";
  } else if (isStale && status.pendingCollections.length > 0) {
    message = `You have unsaved changes and haven't synced recently. Other devices may be out of date.`;
    tone = "warning";
  } else if (status.pendingCollections.length > 0) {
    message = `${status.pendingCollections.length} collection(s) waiting to sync.`;
    tone = "info";
  } else if (isStale) {
    message = "This device hasn't synced recently. Click to check for updates from other devices.";
    tone = "warning";
  }

  if (!message) return null;

  const styles = {
    warning: "bg-[#3a2f1f] border-[#6b521c] text-[#ffd166]",
    error: "bg-[#3a1f1f] border-[#6b1c1c] text-red-400",
    info: "bg-[#1f2a3a] border-[#0e3a4a] text-[#00d9ff]",
  }[tone];

  const Icon = status.phase === "error" ? RiErrorWarningFill : RiRefreshLine;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 border-b text-sm ${styles}`}
      role="status"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="text-base shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={status.phase === "syncing"}
        className="shrink-0 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition disabled:opacity-50 font-medium"
      >
        {status.phase === "syncing" ? "Syncing…" : actionLabel}
      </button>
    </div>
  );
}
