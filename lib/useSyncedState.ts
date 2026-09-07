"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SyncEntity } from "./types";
import type { CollectionStore } from "./localStorage";
import { getSyncChannel } from "./localStorage";

/**
 * Drop-in replacement for `useState<T[]>` that is bound to a collection store.
 *
 * Every write is persisted to localStorage through the store and marks the
 * collection's snapshot dirty, so the sync engine picks it up on the next
 * sync cycle.
 *
 * Supports both plain values and functional updates, so existing component
 * code keeps working: `const [tasks, setTasks] = useSyncedCollection(taskStore)`.
 */
export function useSyncedCollection<T extends SyncEntity>(
  store: CollectionStore<T>
): [T[], (nextOrFn: T[] | ((prev: T[]) => T[])) => void] {
  const [items, setItems] = useState<T[]>(() => store.getAll());
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  });

  // Refresh the UI whenever the sync engine applies server state locally
  // (same tab via the window event, other tabs via BroadcastChannel).
  useEffect(() => {
    const onSyncApplied = (e: Event) => {
      const detail = (e as CustomEvent<{ collection?: string }>).detail;
      if (!detail?.collection) return;
      if (detail.collection !== storeRef.current.collection) return;
      setItems(storeRef.current.getAll());
    };
    window.addEventListener("devtools:sync:applied", onSyncApplied);
    return () => window.removeEventListener("devtools:sync:applied", onSyncApplied);
  }, []);

  useEffect(() => {
    const channel = getSyncChannel();
    if (!channel) return;
    const onMessage = (e: MessageEvent<{ collection?: string }>) => {
      if (!e.data?.collection) return;
      if (e.data.collection !== storeRef.current.collection) return;
      setItems(storeRef.current.getAll());
    };
    channel.addEventListener("message", onMessage);
    return () => channel.removeEventListener("message", onMessage);
  }, []);

  const setItemsPersisted = useCallback(
    (nextOrFn: T[] | ((prev: T[]) => T[])) => {
      setItems((prev) => {
        const next = typeof nextOrFn === "function" ? (nextOrFn as (p: T[]) => T[])(prev) : nextOrFn;
        try {
          storeRef.current.saveAll(next);
        } catch (err) {
          console.error("[useSyncedCollection] failed to persist", err);
        }
        return next;
      });
    },
    []
  );

  return [items, setItemsPersisted];
}

/**
 * Generic single-value variant (e.g. profile fields) backed by a plain key.
 * The value is read lazily and written through on every update.
 */
export function useSyncedState<T>(
  key: string,
  initialValue: T
): [T, (nextOrFn: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const raw = localStorage.getItem(key);
    if (raw == null) return initialValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  const setValuePersisted = useCallback(
    (nextOrFn: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof nextOrFn === "function" ? (nextOrFn as (p: T) => T)(prev) : nextOrFn;
        if (typeof window !== "undefined") {
          localStorage.setItem(key, JSON.stringify(next));
        }
        return next;
      });
    },
    [key]
  );

  return [value, setValuePersisted];
}