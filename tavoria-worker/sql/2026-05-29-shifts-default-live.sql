-- ============================================================================
-- 2026-05-29 — Force shifts.status default to 'live' + backfill any 'open' rows
-- ============================================================================
-- shift-status.sql used ADD COLUMN IF NOT EXISTS … DEFAULT 'live', which is
-- a no-op if the column was already there with a different default ('open').
-- This migration forces the default and rewrites all existing 'open' rows.
-- ============================================================================

-- 1. Force the column default to 'live' for any future insert.
alter table public.shifts
  alter column status set default 'live';

-- 2. Backfill: any shift currently marked 'open' becomes 'live' so workers see it.
update public.shifts
  set status = 'live'
  where status = 'open';

-- 3. Belt-and-braces: any shift with NULL status also goes to 'live'.
update public.shifts
  set status = 'live'
  where status is null;

notify pgrst, 'reload schema';
