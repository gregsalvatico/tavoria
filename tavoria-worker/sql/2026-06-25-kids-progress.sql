-- ============================================================================
-- 2026-06-25 — Cloud sync for the family kids' webapp at tavoriapp.com/oli-blu
-- ============================================================================
--
-- Stores per-profile progress (Blu and Oli) so that work done on one device
-- (e.g. iPad) is visible on another (e.g. mum's laptop). The page is on a
-- hidden URL — no auth, intentionally simple.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste this whole file → Run
--
-- ============================================================================

begin;

-- Two-row table — one row per profile.
create table if not exists public.kids_progress (
  profile     text primary key check (profile in ('blu', 'oli')),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Seed both profiles so the API can always update without first inserting.
insert into public.kids_progress (profile, data)
values
  ('blu', '{}'::jsonb),
  ('oli', '{}'::jsonb)
on conflict (profile) do nothing;

-- Auto-bump updated_at on every write so we can resolve "who-wrote-last" if
-- two devices race.
create or replace function public.kids_progress_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists kids_progress_touch on public.kids_progress;
create trigger kids_progress_touch
  before update on public.kids_progress
  for each row execute function public.kids_progress_touch();

-- Lock down: the table is read/write only via the service_role key
-- (server-side from our Next.js API route). The public anon key cannot
-- touch it directly, so even if a script kiddie finds /oli-blu they
-- can't overwrite Blu's progress without going through our API.
alter table public.kids_progress enable row level security;

-- No policies means: no anon access. service_role bypasses RLS by design.

notify pgrst, 'reload schema';

commit;
