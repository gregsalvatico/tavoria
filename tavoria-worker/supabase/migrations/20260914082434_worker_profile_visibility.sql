-- Workers can pause availability without hiding their profile. This separate
-- flag controls whether the profile appears in venue discovery.
alter table public.workers
  add column if not exists profile_visible boolean not null default true;

comment on column public.workers.profile_visible is
  'Whether this worker appears in venue discovery. Existing profiles stay visible by default.';

notify pgrst, 'reload schema';
