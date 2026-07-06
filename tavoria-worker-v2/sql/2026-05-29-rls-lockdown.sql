-- ============================================================================
-- 2026-05-29 — RLS lockdown for launch
-- ============================================================================
-- Closes the gaps left by the demo-friendly "USING (true)" policies.
--
-- Threat model:
--   * Anyone with the public anon key (which ships in the mobile bundle) can
--     hit our Supabase REST endpoints.
--   * Once they sign up they have a real auth.uid().
--   * Before this migration, an authenticated user could UPDATE any application
--     row (e.g. set someone else's pending app to "declined") and edit any
--     worker row. This migration closes both.
--
-- Policy model:
--   * SELECT on workers / venues / shifts stays open to authenticated users —
--     the app legitimately needs to show worker cards on venue side, venues
--     on worker side, and shifts on the discover feed. We can't tighten this
--     without breaking the product. (Anonymous = unauthenticated = blocked.)
--   * INSERT / UPDATE / DELETE on every table must verify auth.uid()
--     ownership.
--   * applications: workers can only see their own apps + insert their own.
--     Venues can only see + update applications for shifts that belong to
--     venues they own.
--
-- Run this once in Supabase SQL Editor. Idempotent — drop + recreate.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. WORKERS
-- ----------------------------------------------------------------------------
alter table public.workers enable row level security;

-- SELECT (open to authenticated — needed by venue inbox & discover-workers)
drop policy if exists "auth read workers" on public.workers;
create policy "auth read workers"
on public.workers for select to authenticated
using (true);

-- INSERT (only with your own user_id)
drop policy if exists "workers insert own" on public.workers;
create policy "workers insert own"
on public.workers for insert to authenticated
with check (auth.uid() = user_id);

-- UPDATE (only your own row)
drop policy if exists "workers update own" on public.workers;
create policy "workers update own"
on public.workers for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- DELETE (only your own row)
drop policy if exists "workers delete own" on public.workers;
create policy "workers delete own"
on public.workers for delete to authenticated
using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 2. VENUES
-- ----------------------------------------------------------------------------
alter table public.venues enable row level security;

-- SELECT (open to authenticated — workers browse venues in /discover etc.)
drop policy if exists "auth read venues" on public.venues;
create policy "auth read venues"
on public.venues for select to authenticated
using (true);

-- INSERT (only with your own user_id)
drop policy if exists "venues insert own" on public.venues;
create policy "venues insert own"
on public.venues for insert to authenticated
with check (auth.uid() = user_id);

-- UPDATE (only your own venue row)
drop policy if exists "venues update own" on public.venues;
create policy "venues update own"
on public.venues for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- DELETE (only your own venue row)
drop policy if exists "venues delete own" on public.venues;
create policy "venues delete own"
on public.venues for delete to authenticated
using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 3. SHIFTS
-- ----------------------------------------------------------------------------
alter table public.shifts enable row level security;

-- SELECT (open to authenticated — discover feed reads all live shifts)
drop policy if exists "auth read shifts" on public.shifts;
create policy "auth read shifts"
on public.shifts for select to authenticated
using (true);

-- INSERT (only into a venue you own)
drop policy if exists "shifts insert own venue" on public.shifts;
create policy "shifts insert own venue"
on public.shifts for insert to authenticated
with check (
  exists (
    select 1 from public.venues v
    where v.id = shifts.venue_id
      and v.user_id = auth.uid()
  )
);

-- UPDATE (only shifts belonging to a venue you own)
drop policy if exists "shifts update own venue" on public.shifts;
create policy "shifts update own venue"
on public.shifts for update to authenticated
using (
  exists (
    select 1 from public.venues v
    where v.id = shifts.venue_id
      and v.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.venues v
    where v.id = shifts.venue_id
      and v.user_id = auth.uid()
  )
);

-- DELETE (only shifts belonging to a venue you own)
drop policy if exists "shifts delete own venue" on public.shifts;
create policy "shifts delete own venue"
on public.shifts for delete to authenticated
using (
  exists (
    select 1 from public.venues v
    where v.id = shifts.venue_id
      and v.user_id = auth.uid()
  )
);


-- ----------------------------------------------------------------------------
-- 4. APPLICATIONS  (this is where the biggest hole was)
-- ----------------------------------------------------------------------------
alter table public.applications enable row level security;

-- Drop the loose demo policies
drop policy if exists "auth read applications" on public.applications;
drop policy if exists "auth update applications" on public.applications;
drop policy if exists "users insert own applications" on public.applications;

-- SELECT: worker sees their own apps; venue owner sees apps for their venues' shifts
drop policy if exists "applications select own" on public.applications;
create policy "applications select own"
on public.applications for select to authenticated
using (
  -- Worker viewing their own applications
  auth.uid() = worker_user_id
  -- Or venue owner viewing applications for one of their venues
  or exists (
    select 1 from public.venues v
    where v.id = applications.venue_id
      and v.user_id = auth.uid()
  )
);

-- INSERT: worker can only insert their own application
drop policy if exists "applications insert own" on public.applications;
create policy "applications insert own"
on public.applications for insert to authenticated
with check (auth.uid() = worker_user_id);

-- UPDATE: only the venue owner can update (Decline / Star / Interview / Hire)
-- The worker who created the application can also update *their own* row
-- (covers edge cases like editing the message before the venue responds).
drop policy if exists "applications update own venue or worker" on public.applications;
create policy "applications update own venue or worker"
on public.applications for update to authenticated
using (
  auth.uid() = worker_user_id
  or exists (
    select 1 from public.venues v
    where v.id = applications.venue_id
      and v.user_id = auth.uid()
  )
)
with check (
  auth.uid() = worker_user_id
  or exists (
    select 1 from public.venues v
    where v.id = applications.venue_id
      and v.user_id = auth.uid()
  )
);

-- DELETE: only the worker who owns the application can delete it
drop policy if exists "applications delete own" on public.applications;
create policy "applications delete own"
on public.applications for delete to authenticated
using (auth.uid() = worker_user_id);


-- ----------------------------------------------------------------------------
-- 5. STORAGE — venue-photos bucket (worker buckets already locked in
--    sql/storage-buckets.sql; adding venue parity here.)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('venue-photos', 'venue-photos', true)
on conflict (id) do nothing;

drop policy if exists "venues upload own photos" on storage.objects;
create policy "venues upload own photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venues update own photos" on storage.objects;
create policy "venues update own photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venues delete own photos" on storage.objects;
create policy "venues delete own photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "public read venue photos" on storage.objects;
create policy "public read venue photos"
on storage.objects for select to public
using (bucket_id = 'venue-photos');


-- ----------------------------------------------------------------------------
-- Done — reload schema cache so PostgREST picks up the new policies.
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';
