-- Applications table: tracks worker applications to shifts/venues
-- and the actions the venue takes on each one.

drop table if exists public.applications cascade;

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references public.workers(id) on delete cascade,
  shift_id uuid references public.shifts(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  worker_user_id uuid not null,
  venue_user_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'declined', 'interview_requested', 'hired', 'starred')),
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index applications_worker_idx on public.applications(worker_id);
create index applications_venue_idx on public.applications(venue_id);
create index applications_status_idx on public.applications(status);

-- Row-Level Security
alter table public.applications enable row level security;

-- Authenticated users can insert their own application
drop policy if exists "users insert own applications" on public.applications;
create policy "users insert own applications"
on public.applications for insert to authenticated
with check (auth.uid() = worker_user_id);

-- Authenticated users can see all applications (DEMO — tighten later)
drop policy if exists "auth read applications" on public.applications;
create policy "auth read applications"
on public.applications for select to authenticated
using (true);

-- Authenticated users can update any application (DEMO — tighten later)
drop policy if exists "auth update applications" on public.applications;
create policy "auth update applications"
on public.applications for update to authenticated
using (true);

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
