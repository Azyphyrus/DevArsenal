-- =====================================================================
-- 0001_sync_schema.sql
-- Google auth + cross-device sync schema.
--
-- HOW TO APPLY:
--   Supabase Dashboard → SQL Editor → New query → paste this file → Run.
--
-- DELETION MODEL:
--   Deletes are recorded in the deleted_records ledger (see
--   0002_deletion_ledger.sql) and rows are HARD-deleted from these tables.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Users (used by Google OAuth; session payload references users.id)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  google_id text unique,
  email text not null unique,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_google_id_idx on public.users (google_id);

-- ---------------------------------------------------------------------
-- Devices (one row per browser per user)
-- ---------------------------------------------------------------------
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  device_id text not null unique,
  device_name text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_devices_user_idx on public.user_devices (user_id);

-- ---------------------------------------------------------------------
-- Syncable collections.
-- Composite PK (user_id, id) so every user fully owns their records and
-- cross-user id collisions are impossible.
--   updated_at = LWW conflict-resolution timestamp
--   deleted_at = soft-delete tombstone (NULL = live)
-- ---------------------------------------------------------------------
create table if not exists public.snippets (
  user_id uuid not null references public.users (id) on delete cascade,
  id text not null,
  title text not null default '',
  language text not null default 'javascript',
  code text not null default '',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create index if not exists snippets_user_updated_idx on public.snippets (user_id, updated_at);

create table if not exists public.notes (
  user_id uuid not null references public.users (id) on delete cascade,
  id text not null,
  title text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at);

create table if not exists public.tasks (
  user_id uuid not null references public.users (id) on delete cascade,
  id text not null,
  title text not null default '',
  description text not null default '',
  created_at timestamptz,
  deadline text not null default '',
  status text not null default 'Backlog',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create index if not exists tasks_user_updated_idx on public.tasks (user_id, updated_at);

-- ---------------------------------------------------------------------
-- Sync audit log
-- ---------------------------------------------------------------------
create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  device_id text,
  pushed_snapshots int not null default 0,
  pulled_rows int not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists sync_logs_user_created_idx on public.sync_logs (user_id, created_at);

-- ---------------------------------------------------------------------
-- Existing export table: optionally track which user created a backup.
-- ---------------------------------------------------------------------
alter table public.data_exports
  add column if not exists user_id uuid references public.users (id) on delete set null;

-- ---------------------------------------------------------------------
-- Security note:
-- These tables are only ever read/written from server API routes using the
-- service-role key (the session cookie authenticates the user). If you want
-- defence-in-depth, enable RLS on each table and add policies scoped to a
-- `user_id = (select id from public.users where id = auth.uid())` pattern —
-- but keep in mind this app does NOT use Supabase Auth sessions, so RLS
-- using `auth.uid()` will not match anything until you also adopt
-- Supabase-native auth.
-- ---------------------------------------------------------------------