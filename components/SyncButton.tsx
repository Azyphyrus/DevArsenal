'use client';

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useSyncStatus } from "@/lib/useSync";
import { syncNow } from "@/lib/syncManager";
import {
  RiRefreshLine,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiLoginCircleLine,
} from "react-icons/ri";

type SyncButtonProps = {
  /** "solid" = prominent button (Dashboard hero), "compact" = toolbar-sized */
  variant?: "solid" | "compact";
};

/**
 * Manual "Sync now" button. Runs the same sync engine as the background
 * auto-sync (lib/syncManager.syncNow) and reflects the live sync status.
 */
const SyncButton = ({ variant = "compact" }: SyncButtonProps) => {
  const { user, loading } = useAuth();
  const status = useSyncStatus();

  const solid = variant === "solid";
  const size = solid
    ? "h-10 px-6 rounded-lg text-sm"
    : "h-8 px-3 rounded-md text-xs";

  // Signed out → invite to sign in instead of attempting a 401 sync.
  if (!loading && !user) {
    return (
      <Link
        href="/login"
        className={`inline-flex items-center gap-2 font-semibold border border-[#333333] bg-[#252525] text-[#aaaaaa] hover:text-white hover:border-[#00d9ff] transition-colors ${size}`}
      >
        <RiLoginCircleLine />
        Sign in to sync
      </Link>
    );
  }

  let label = "Sync now";
  let Icon = RiRefreshLine;
  let spin = false;
  let accent = solid ? "text-[#1a1a1a]" : "text-[#00d9ff]";
  let buttonBg = solid
    ? "bg-[#00d9ff] hover:bg-[#00c4ea]"
    : "bg-[#252525] border border-[#333333] hover:border-[#00d9ff]";

  if (status.needsMigration) {
    label = solid ? "DB migration needed" : "Migration needed";
    Icon = RiErrorWarningFill;
    accent = solid ? "text-[#ffb347]" : "text-[#ffb347]";
    if (solid) buttonBg = "bg-[#3a2f1f] hover:bg-[#45381f]";
  } else if (status.phase === "syncing") {
    label = "Syncing…";
    spin = true;
  } else if (status.phase === "error") {
    label = solid ? "Sync failed — Retry" : "Retry sync";
    Icon = RiErrorWarningFill;
    accent = solid ? "text-[#ff8080]" : "text-red-400";
    if (solid) buttonBg = "bg-[#3a1f1f] hover:bg-[#452424]";
  } else if (status.phase === "success" && status.lastSyncAt) {
    const time = new Date(status.lastSyncAt).toLocaleTimeString();
    label = solid ? `Synced ${time}` : "Synced";
    Icon = RiCheckboxCircleFill;
    accent = solid ? "text-[#1a1a1a]" : "text-[#00ff88]";
  } else if (status.pendingCollections.length > 0) {
    label = `Sync now · ${status.pendingCollections.length} pending`;
  }

  return (
    <button
      type="button"
      onClick={() => {
        void syncNow();
      }}
      disabled={status.phase === "syncing"}
      title={status.error || "Sync your data with the cloud now"}
      className={`inline-flex items-center gap-2 font-semibold transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${size} ${buttonBg} ${accent}`}
    >
      <Icon className={spin ? "animate-spin" : ""} />
      {label}
    </button>
  );
};

export default SyncButton;