-- ============================================================================
-- 2026-05-29 — HOTFIX shifts RLS
-- ============================================================================
-- The previous EXISTS subquery referenced `shifts.venue_id` qualified, which
-- doesn't reliably resolve to the NEW row in PostgreSQL INSERT WITH CHECK
-- expressions. Rewriting using the canonical Supabase IN-subquery pattern,
-- which references the unqualified column on the new/existing row directly.
-- ============================================================================

-- INSERT
drop policy if exists "shifts insert own venue" on public.shifts;
create policy "shifts insert own venue"
on public.shifts for insert to authenticated
with check (
  venue_id in (select id from public.venues where user_id = auth.uid())
);

-- UPDATE
drop policy if exists "shifts update own venue" on public.shifts;
create policy "shifts update own venue"
on public.shifts for update to authenticated
using (
  venue_id in (select id from public.venues where user_id = auth.uid())
)
with check (
  venue_id in (select id from public.venues where user_id = auth.uid())
);

-- DELETE
drop policy if exists "shifts delete own venue" on public.shifts;
create policy "shifts delete own venue"
on public.shifts for delete to authenticated
using (
  venue_id in (select id from public.venues where user_id = auth.uid())
);

-- Also rewrite applications policies that used the same pattern, just in case.

drop policy if exists "applications select own" on public.applications;
create policy "applications select own"
on public.applications for select to authenticated
using (
  auth.uid() = worker_user_id
  or venue_id in (select id from public.venues where user_id = auth.uid())
);

drop policy if exists "applications update own venue or worker" on public.applications;
create policy "applications update own venue or worker"
on public.applications for update to authenticated
using (
  auth.uid() = worker_user_id
  or venue_id in (select id from public.venues where user_id = auth.uid())
)
with check (
  auth.uid() = worker_user_id
  or venue_id in (select id from public.venues where user_id = auth.uid())
);

notify pgrst, 'reload schema';

-- ============================================================================
-- Diagnostic — paste in SQL Editor AFTER running the policies above
-- to confirm that your auth.uid() matches your venue's user_id.
-- Replace 'YOUR-USERNAME' with the username you signed up with.
-- ============================================================================
--
-- select v.id, v.name, v.user_id, u.email
-- from public.venues v
-- left join auth.users u on u.id = v.user_id
-- where u.email like 'YOUR-USERNAME@%';
--
-- If v.user_id is NULL or doesn't match the auth.users.id of your current
-- session, no shifts insert will pass RLS until you fix the venue row.
