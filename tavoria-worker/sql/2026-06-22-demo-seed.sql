-- ============================================================================
-- 2026-06-22 — Demo seed data for Thursday sushi pitch
-- ============================================================================
-- Populates 1 sushi venue + 1 active shift + 3 realistic worker profiles so
-- when the sushi owner browses the platform, it looks alive instead of empty.
--
-- IMPORTANT: this assumes you've already signed up 4 test auth.users on the
-- app. The cleanest way is:
--   1. Open https://tavoria-worker.vercel.app on 4 different browsers (or
--      use Chrome incognito 4 times)
--   2. Sign up: 1 as a venue ("Sushi Demo Milano"), 3 as workers (Marco / Sofia / Yuki)
--   3. Fill in basics on each (photo, position, languages, video if possible)
--   4. Grab the auth.users.id values from the Supabase Auth Users dashboard
--   5. Paste them into the variables below, then run this script
--
-- This script then PATCHES the test rows so they have realistic Italian
-- hospitality content + sets `last_seen_at = now()` so the "Available now"
-- pill shows. After Thursday, delete these rows with the cleanup section at
-- the bottom.
-- ============================================================================

-- ---- 1. Fill in the auth.users.id values you got from Supabase Dashboard ----
-- Replace these placeholder UUIDs with the real ones BEFORE running:

\set VENUE_USER_ID  'paste-venue-auth-user-uuid-here'
\set WORKER1_ID     'paste-worker1-auth-user-uuid-here'
\set WORKER2_ID     'paste-worker2-auth-user-uuid-here'
\set WORKER3_ID     'paste-worker3-auth-user-uuid-here'

-- ---- 2. Patch the venue row ----

update public.venues
   set name = 'Sushi Demo Milano',
       address = 'Via Solferino 18, 20121 Milano',
       venue_type = 'restaurant',
       venue_style = 'casual',
       email = 'demo@sushi-demo.it',
       phone = '+39 02 1234 5678',
       updated_at = now()
 where user_id = :'VENUE_USER_ID';

-- Add a juicy "ASAP" shift to that venue (apply now flow demo)

insert into public.shifts (
  venue_id, roles, pay_amount, pay_schedule, hours_per_week,
  days_of_week, contract_type, when_start, status, created_at, updated_at
)
select id, ARRAY['waiter','runner'], 14, 'hour', 30,
       ARRAY['tue','wed','thu','fri','sat','sun'],
       'part_time', 'asap', 'live', now(), now()
  from public.venues
 where user_id = :'VENUE_USER_ID'
on conflict do nothing;

-- ---- 3. Patch the 3 worker rows with realistic Italian hospitality content ----

-- Worker 1: Marco — experienced waiter, EU citizen, Italian primary
update public.workers
   set first_name = 'Marco',
       last_name = 'Bianchi',
       phone = '+39 348 123 4567',
       phone_visible = true,
       age_range = '26-30',
       city = 'Milano',
       country = 'Italy',
       nationality = 'IT',
       work_eligibility_it = 'eu_citizen',
       years_exp = '3-5 anni',
       positions = ARRAY['waiter','runner'],
       languages = ARRAY['it','en'],
       last_seen_at = now(),
       updated_at = now()
 where user_id = :'WORKER1_ID';

-- Worker 2: Sofia — bartender + barista, 1-2 years exp
update public.workers
   set first_name = 'Sofia',
       last_name = 'Romano',
       phone = '+39 339 234 5678',
       phone_visible = true,
       age_range = '21-25',
       city = 'Milano',
       country = 'Italy',
       nationality = 'IT',
       work_eligibility_it = 'eu_citizen',
       years_exp = '1-2 anni',
       positions = ARRAY['bartender','barista'],
       languages = ARRAY['it','en','es'],
       last_seen_at = now(),
       updated_at = now()
 where user_id = :'WORKER2_ID';

-- Worker 3: Yuki — Japanese sushi chef, perfect for sushi demo!
update public.workers
   set first_name = 'Yuki',
       last_name = 'Tanaka',
       phone = '+39 351 345 6789',
       phone_visible = true,
       age_range = '31-40',
       city = 'Milano',
       country = 'Japan',
       nationality = 'JP',
       work_eligibility_it = 'permit',
       years_exp = '5+ anni',
       positions = ARRAY['cook','chef'],
       languages = ARRAY['it','en','zh'],
       last_seen_at = now(),
       updated_at = now()
 where user_id = :'WORKER3_ID';

-- ---- 4. Verify the seed worked ----

select 'venues' as table, count(*) as rows from public.venues where name = 'Sushi Demo Milano'
 union all
select 'live shifts', count(*) from public.shifts s
   join public.venues v on s.venue_id = v.id
  where v.name = 'Sushi Demo Milano' and s.status = 'live'
 union all
select 'workers with last_seen', count(*) from public.workers
  where first_name in ('Marco','Sofia','Yuki') and last_seen_at > now() - interval '1 hour';

-- Expected: venues=1, live shifts=1, workers with last_seen=3

-- ============================================================================
-- CLEANUP (run after the sushi demo Thursday)
-- ============================================================================
--   delete from public.shifts where venue_id in (
--     select id from public.venues where name = 'Sushi Demo Milano'
--   );
--   delete from public.venues where name = 'Sushi Demo Milano';
--   delete from public.workers where first_name in ('Marco','Sofia','Yuki')
--     and last_name in ('Bianchi','Romano','Tanaka');
--   -- And manually delete the 4 auth.users from Supabase Dashboard → Authentication
-- ============================================================================
