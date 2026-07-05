-- 2026-05-27 — record T&C acceptance per user (audit trail)
-- Run this once in Supabase SQL Editor before publishing the new build.

alter table public.workers
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

alter table public.venues
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

-- Helpful indexes if you ever need to query who accepted what
create index if not exists workers_terms_accepted_at_idx
  on public.workers (terms_accepted_at);
create index if not exists venues_terms_accepted_at_idx
  on public.venues (terms_accepted_at);
