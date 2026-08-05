alter table public.venues
  add column if not exists website_url text;

comment on column public.venues.website_url is
  'Optional public website link for the venue.';

-- A venue can invite a worker directly by creating an interview-requested
-- application without a shift. The ownership checks keep the action scoped to
-- the venue owner and make sure the worker id belongs to the target user.
drop policy if exists "users insert own applications" on public.applications;

create policy "workers or venue owners can create applications"
on public.applications
for insert
to authenticated
with check (
  (select auth.uid()) = worker_user_id
  or (
    (select auth.uid()) = venue_user_id
    and exists (
      select 1
      from public.venues
      where venues.id = applications.venue_id
        and venues.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.workers
      where workers.id = applications.worker_id
        and workers.user_id = applications.worker_user_id
    )
  )
);
