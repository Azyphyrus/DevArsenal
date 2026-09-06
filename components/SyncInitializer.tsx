'use client';

import { useSync } from "@/lib/useSync";

/**
 * Mounted once in the root layout. Drives the auto-sync engine (interval,
 * tab-focus, reconnection) whenever a user is signed in.
 */
export default function SyncInitializer({ children }: { children: React.ReactNode }) {
  useSync();
  return <>{children}</>;
}