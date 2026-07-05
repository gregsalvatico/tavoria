-- ============================================================================
-- 2026-06-26 — FULL DATABASE RESET (use after demos before real launch)
-- ============================================================================
--
-- This wipes ALL user data — applications, shifts, workers, venues, and
-- auth.users. It KEEPS the schema, RLS policies, edge functions, storage
-- bucket configs, triggers, and indexes.
--
-- ⚠️  IRREVERSIBLE. Run only when you genuinely want a clean slate.
-- ⚠️  Take a snapshot first if you might want anything back:
--         Supabase Dashboard → Project Settings → Database → Backups
--
-- HOW TO RUN:
--   1. Take a backup (Project Settings → Database → Backups → New backup)
--   2. Open Supabase Dashboard → SQL Editor → paste this whole file → Run
--   3. After ~5 seconds you'll see the final NOTIFY result confirming
--      "Database wiped. Schema intact."
--   4. Empty the storage buckets manually:
--        Storage → worker-photos → select all → delete
--        Storage → worker-videos → select all → delete
--        Storage → venue-photos → select all → delete
--
-- ============================================================================

begin;

-- 1. Delete app data in FK-safe order (child tables first)
delete from public.applications;
delete from public.shifts;
delete from public.workers;
delete from public.venues;

-- 2. Delete every auth user (workers + venues + admins).
--    The "supabase_admin" + service role accounts stay because they're not
--    in auth.users — they live in the supabase_auth_admin schema.
delete from auth.users;

-- 3. Defensive: if any orphan rows survived FK constraints, surface them.
do $$
declare
  app_count int;
  shift_count int;
  worker_count int;
  venue_count int;
  user_count int;
begin
  select count(*) into app_count from public.applications;
  select count(*) into shift_count from public.shifts;
  select count(*) into worker_count from public.workers;
  select count(*) into venue_count from public.venues;
  select count(*) into user_count from auth.users;

  raise notice '─────────────────────────────────────────────';
  raise notice 'Database wiped. Remaining counts:';
  raise notice '  applications: %', app_count;
  raise notice '  shifts:       %', shift_count;
  raise notice '  workers:      %', worker_count;
  raise notice '  venues:       %', venue_count;
  raise notice '  auth.users:   %', user_count;
  raise notice '─────────────────────────────────────────────';
  raise notice 'Schema intact. RLS intact. Edge functions intact.';
  raise notice 'Don''t forget to manually empty Storage buckets:';
  raise notice '  worker-photos, worker-videos, venue-photos';
  raise notice '─────────────────────────────────────────────';
end $$;

-- 4. Reload the PostgREST schema cache so the API picks up cleanly.
notify pgrst, 'reload schema';

commit;
