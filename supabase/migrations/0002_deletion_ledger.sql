-- =====================================================================
-- 0002_deletion_ledger.sql
-- "Deleted means gone": hard deletes with a side-table tombstone ledger.
--
-- HOW TO APPLY:
--   Supabase Dashboard → SQL Editor → New query → paste this file → Run.
--
-- MODEL (supersedes the in-table soft delete from 0001):
--   When a device deletes a record, the sync API immediately HARD-deletes
--   the row from notes/snippets/tasks and writes an entry here instead.
--   The data tables therefore only ever contain live rows.
--   Other devices learn about the deletion by pulling recent entries from
--   this ledger, and entries older than SYNC_TOMBSTONE_RETENTION_DAYS are
--   purged automatically (same retention safety as before).
-- =====================================================================

create table if not exists public.deleted_records (
  user_id uuid not null references public.users (id) on delete cascade,
  table_name text not null,
  record_id text not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id, table_name, record_id)
);

create index if not exists deleted_records_user_time_idx
  on public.deleted_records (user_id, deleted_at);
