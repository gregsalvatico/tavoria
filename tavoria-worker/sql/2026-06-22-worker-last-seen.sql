-- Adds last_seen_at to workers so the "Available now" pill on candidate.tsx
-- and profile.tsx can be gated on real recent activity instead of being shown
-- on every profile (which feels misleading).
--
-- Until we wire client-side heartbeats (on app focus / on auth refresh), this
-- column will mirror created_at for new rows and remain unset for old rows.
-- The UI keeps the pill hidden until the column has meaningful values.

alter table public.workers
  add column if not exists last_seen_at timestamptz default now();

-- Backfill: for existing workers, treat created_at as their last-seen time
-- so they don't all show up as "active right now" the moment we ship.
update public.workers
  set last_seen_at = created_at
  where last_seen_at is null;

-- Index helps the discover/browse list filter on "active in last 24h"
-- without a full scan once we wire the pill back on.
create index if not exists workers_last_seen_at_idx
  on public.workers (last_seen_at desc);
