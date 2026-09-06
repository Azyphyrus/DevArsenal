'use client';

import { useSyncStatus } from "@/lib/useSync";
import { syncNow } from "@/lib/syncManager";
import { useAuth } from "@/lib/AuthContext";
import {
  RiRefreshLine,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiDatabase2Line,
} from "react-icons/ri";

/**
 * Tiny status chip shown in the header: syncing / synced / error / needs migration.
 * When signed in, clicking it triggers a manual sync.
 */
const SyncIndicator = () => {
  const status = useSyncStatus();
  const { user } = useAuth();

  let label = "Sync idle";
  let color = "text-[#8a8a8a]";
  let bg = "bg-[#252525] border-[#333333]";
  let Icon = RiDatabase2Line;
  let spin = false;

  if (status.needsMigration) {
    label = "DB migration needed";
    color = "text-[#ffb347]";
    bg = "bg-[#3a2f1f] border-[#6b521c]";
    Icon = RiErrorWarningFill;
  } else if (status.phase === "syncing") {
    label = "Syncing…";
    color = "text-[#00d9ff]";
    bg = "bg-[#1f2a3a] border-[#0e3a4a]";
    Icon = RiRefreshLine;
    spin = true;
  } else if (status.phase === "error") {
    label = "Sync error";
    color = "text-red-400";
    bg = "bg-[#3a1f1f] border-[#6b1c1c]";
    Icon = RiErrorWarningFill;
  } else if (status.phase === "success" && status.lastSyncAt) {
    label = `Synced ${new Date(status.lastSyncAt).toLocaleTimeString()}`;
    color = "text-[#00ff88]";
    bg = "bg-[#1f3a2a] border-[#0e4a2a]";
    Icon = RiCheckboxCircleFill;
  } else if (status.pendingCollections.length > 0) {
    label = `${status.pendingCollections.length} pending`;
    color = "text-[#ffd166]";
    Icon = RiDatabase2Line;
  }

  const className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${bg} ${color}`;
  const content = (
    <>
      <Icon className={`text-sm ${spin ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{label}</span>
    </>
  );

  // Signed out: plain status chip. Signed in: click to sync now.
  if (!user) {
    return (
      <span title={status.error || label} className={className}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        void syncNow();
      }}
      disabled={status.phase === "syncing"}
      title={(status.error || label) + " — click to sync now"}
      className={`${className} cursor-pointer hover:brightness-125 transition disabled:cursor-not-allowed`}
    >
      {content}
    </button>
  );
};

export default SyncIndicator;