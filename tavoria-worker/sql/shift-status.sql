-- Add a status column to shifts so venues can pause/unpause posts.
-- Values:
--   live   — visible to workers in /discover (default)
--   paused — hidden from /discover, still shown in venue's "My shifts"
--
-- The worker discover query filters status='live'. The venue's own list
-- shows everything regardless of status (so historical posts stay visible).

alter table public.shifts
  add column if not exists status text not null default 'live';

create index if not exists shifts_status_idx on public.shifts (status);

notify pgrst, 'reload schema';
