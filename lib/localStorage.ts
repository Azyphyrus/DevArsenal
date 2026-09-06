import {
  Snippet,
  Note,
  NoteBlock,
  Task,
  TaskStatus,
  SyncEntity,
  SyncCollection,
  SyncSnapshot,
} from "./types";
import { mergeRemoteLocal } from "./conflictResolver";

/**
 * Local persistence for every syncable collection.
 *
 * Model: each change made by the UI writes the FULL collection to localStorage
 * and records a dirty "snapshot" in a sync outbox. The sync engine later
 * pushes each dirty snapshot to the server and pulls back the merged state,
 * which is written back here with `applyRemote()` (silent, no new snapshot).
 *
 * Conflict policy: last-write-wins on `updatedAt` per record.
 */

// ---------- Storage keys ----------
// The first key in each list is the canonical key. Legacy keys are read once
// and migrated, so data saved by the earlier raw-localStorage versions is not lost.
const COLLECTION_KEYS: Record<SyncCollection, string[]> = {
  snippets: ["devtools_snippets", "code_snippets"],
  notes: ["notes", "notes_data"],
  tasks: ["taskboard_tasks"],
};

const OUTBOX_KEY = "devtools_sync_outbox";

// ---------- Generic helpers ----------

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  if (isBrowser() && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error("localStorage: failed to parse JSON, resetting to fallback");
    return fallback;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return safeParse<T>(raw, fallback);
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Read the first key that exists (migrates legacy keys into the canonical one).
function readFirstExisting<T>(keys: string[], fallback: T): { value: T; usedLegacy: boolean } {
  for (const key of keys) {
    if (isBrowser() && localStorage.getItem(key) != null) {
      return {
        value: safeParse<T>(localStorage.getItem(key) as string, fallback),
        usedLegacy: key !== keys[0],
      };
    }
  }
  return { value: fallback, usedLegacy: false };
}

// ---------- Schema validation ----------

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isOptionalString(v: unknown): boolean {
  return v == null || typeof v === "string";
}

export function isValidSnippet(v: unknown): v is Snippet {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    isNonEmptyString(s.id) &&
    isString(s.title) &&
    isString(s.language) &&
    isString(s.code) &&
    isString(s.updatedAt) &&
    isOptionalString(s.deletedAt)
  );
}

function isValidNoteBlock(v: unknown): v is NoteBlock {
  if (typeof v !== "object" || v === null) return false;
  const b = v as Record<string, unknown>;
  const validTypes = ["text", "image"];
  return (
    isNonEmptyString(b.id) &&
    typeof b.type === "string" &&
    validTypes.includes(b.type) &&
    isString(b.content) &&
    (b.src === undefined || isString(b.src))
  );
}

export function isValidNote(v: unknown): v is Note {
  if (typeof v !== "object" || v === null) return false;
  const n = v as Record<string, unknown>;
  return (
    isNonEmptyString(n.id) &&
    isString(n.title) &&
    Array.isArray(n.blocks) &&
    n.blocks.every(isValidNoteBlock) &&
    isString(n.updatedAt) &&
    isOptionalString(n.deletedAt)
  );
}

const VALID_STATUSES: TaskStatus[] = ["Backlog", "In Progress", "Review", "Done"];

export function isValidTask(v: unknown): v is Task {
  if (typeof v !== "object" || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    isNonEmptyString(t.id) &&
    isString(t.title) &&
    isString(t.description) &&
    isString(t.createdAt) &&
    isString(t.deadline) &&
    typeof t.status === "string" &&
    VALID_STATUSES.includes(t.status as TaskStatus) &&
    isString(t.updatedAt) &&
    isOptionalString(t.deletedAt)
  );
}
// ---------- Sync outbox (dirty snapshots) ----------

export function readOutbox(): Partial<Record<SyncCollection, SyncSnapshot>> {
  return readJson<Partial<Record<SyncCollection, SyncSnapshot>>>(OUTBOX_KEY, {});
}

function writeOutbox(outbox: Partial<Record<SyncCollection, SyncSnapshot>>): void {
  writeJson(OUTBOX_KEY, outbox);
}

export function listDirtyCollections(): SyncCollection[] {
  const outbox = readOutbox();
  return Object.keys(outbox) as SyncCollection[];
}

/** Called by the stores after any mutation so the engine knows what to push. */
export function markSnapshotDirty(collection: SyncCollection, items: SyncEntity[]): void {
  const outbox = readOutbox();
  outbox[collection] = { updatedAt: nowIso(), items: items.slice() };
  writeOutbox(outbox);
}

export function clearDirtyCollection(collection: SyncCollection): void {
  const outbox = readOutbox();
  delete outbox[collection];
  writeOutbox(outbox);
}

// ---------- Change detection ----------

/** Payload used to decide whether a record actually changed (ignores sync metadata). */
function contentOf(item: SyncEntity): string {
  const { id, updatedAt, deletedAt, ...rest } = item as unknown as Record<string, unknown>;
  void id;
  void updatedAt;
  void deletedAt;
  return JSON.stringify(rest);
}

// ---------- Per-collection store ----------

export interface CollectionStore<T extends SyncEntity> {
  collection: SyncCollection;
  getAll(): T[];
  getById(id: string): T | undefined;
  upsert(item: T): T[];
  remove(id: string): T[];
  saveAll(items: T[]): T[];
  applyRemote(remote: T[]): T[];
  clear(): void;
}
function createStore<T extends SyncEntity>(
  collection: SyncCollection,
  validate: (v: unknown) => v is T
): CollectionStore<T> {
  const keys = COLLECTION_KEYS[collection];
  const canonicalKey = keys[0];

  function readRaw(): T[] {
    const { value, usedLegacy } = readFirstExisting<T[]>(keys, []);
    const valid = normalize(value);
    if (usedLegacy) {
      writeJson(canonicalKey, valid); // migrate legacy key into the canonical one
    }
    if (valid.length !== value.length) {
      const dropped = value.length - valid.length;
      if (dropped > 0) {
        console.warn(`localStorage[${collection}]: dropped ${dropped} invalid record(s)`);
        writeJson(canonicalKey, valid);
      }
    }
    return valid;
  }

  /**
   * Normalise raw stored records:
   *  - fills in `updatedAt` for records created before the sync feature existed,
   *  - ensures `deletedAt` defaults to null,
   *  - runs the schema validator (via `validate`) using the server-style shape.
   */
  function normalize(value: unknown[]): T[] {
    const out: T[] = [];
    for (const raw of value) {
      if (typeof raw !== "object" || raw === null) continue;
      const rec = raw as Record<string, unknown>;
      if (typeof rec.id !== "string" || !rec.id.trim()) continue;
      const candidate = {
        ...(rec as object),
        updatedAt: typeof rec.updatedAt === "string" ? rec.updatedAt : nowIso(),
        deletedAt: rec.deletedAt ?? null,
      } as T;
      if (validate(candidate)) out.push(candidate);
    }
    return out;
  }

  function writeRaw(items: T[]): void {
    const valid = items.filter(validate);
    writeJson(canonicalKey, valid);
  }

  /** Bump updatedAt for items whose content differs from what is currently stored. */
  function assignUpdatedAt(items: T[], current: Map<string, T>): T[] {
    return items.map((item) => {
      const existing = current.get(item.id);
      const existingContent = existing ? contentOf(existing) : null;
      if (!existing || existingContent !== contentOf(item)) {
        return { ...item, updatedAt: nowIso(), deletedAt: item.deletedAt ?? null };
      }
      return { ...item, updatedAt: existing.updatedAt, deletedAt: item.deletedAt ?? null };
    });
  }

  return {
    collection,

    getAll(): T[] {
      return readRaw();
    },

    getById(id: string): T | undefined {
      return readRaw().find((item) => item.id === id);
    },

    upsert(item: T): T[] {
      const current = readRaw();
      const existing = current.find((i) => i.id === item.id);
      const finalItem = { ...item, id: item.id || generateId() } as T;
      const next = existing
        ? current.map((i) => (i.id === item.id ? finalItem : i))
        : [...current, finalItem];
      const assigned = assignUpdatedAt(next, new Map(current.map((i) => [i.id, i])));
      writeRaw(assigned);
      markSnapshotDirty(collection, assigned);
      return assigned;
    },

    remove(id: string): T[] {
      const next = readRaw().filter((item) => item.id !== id);
      writeRaw(next);
      markSnapshotDirty(collection, next);
      return next;
    },

    saveAll(items: T[]): T[] {
      const current = readRaw();
      const assigned = assignUpdatedAt(items, new Map(current.map((i) => [i.id, i])));
      writeRaw(assigned);
      markSnapshotDirty(collection, assigned);
      return assigned;
    },

    applyRemote(remote: T[]): T[] {
      const current = readRaw();
      const merged = mergeRemoteLocal(current, remote);
      writeRaw(merged);
      // Notify open pages so their React state reflects the pulled changes.
      if (isBrowser()) {
        window.dispatchEvent(
          new CustomEvent("devtools:sync:applied", { detail: { collection } })
        );
      }
      return merged;
    },

    clear(): void {
      if (!isBrowser()) return;
      localStorage.removeItem(canonicalKey);
    },
  };
}

// ---------- Public API ----------

export const snippetStore = createStore<Snippet>("snippets", isValidSnippet);
export const noteStore = createStore<Note>("notes", isValidNote);
export const taskStore = createStore<Task>("tasks", isValidTask);

export const stores: Record<SyncCollection, CollectionStore<SyncEntity>> = {
  snippets: snippetStore as unknown as CollectionStore<SyncEntity>,
  notes: noteStore as unknown as CollectionStore<SyncEntity>,
  tasks: taskStore as unknown as CollectionStore<SyncEntity>,
};