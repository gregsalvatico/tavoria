-- Allow any authenticated user to read worker rows.
-- DEMO-friendly: lets venues see applicant profiles via the venue inbox.
-- TIGHTEN LATER: restrict to workers who have an application to the user's venues.

drop policy if exists "auth read workers" on public.workers;
create policy "auth read workers"
on public.workers for select to authenticated
using (true);

notify pgrst, 'reload schema';
