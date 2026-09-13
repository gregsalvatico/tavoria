-- Existing workers keep their data and visibility. Unknown preferences remain unknown.
alter table public.workers
  add column if not exists job_preferences jsonb not null default '{}'::jsonb,
  add column if not exists photo_urls jsonb not null default '[]'::jsonb,
  add column if not exists video_urls jsonb not null default '[]'::jsonb,
  add column if not exists last_seen_at timestamptz;

alter table public.shifts
  add column if not exists worker_requirements jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'workers_job_preferences_object') then
    alter table public.workers add constraint workers_job_preferences_object check (jsonb_typeof(job_preferences) = 'object');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'workers_photo_slots') then
    alter table public.workers add constraint workers_photo_slots check (jsonb_typeof(photo_urls) = 'array' and jsonb_array_length(photo_urls) <= 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'workers_video_slots') then
    alter table public.workers add constraint workers_video_slots check (jsonb_typeof(video_urls) = 'array' and jsonb_array_length(video_urls) <= 3);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'shifts_worker_requirements_object') then
    alter table public.shifts add constraint shifts_worker_requirements_object check (jsonb_typeof(worker_requirements) = 'object');
  end if;
end $$;

-- These columns inherit the existing owner-write policies; no new public grants.
comment on column public.workers.job_preferences is
  'Self-declared availability, openToWork, travelRadiusKm, minimumHourlyPay and roleExperience. Missing values are unknown.';
comment on column public.workers.photo_urls is
  'Additional public photo slots 1..4. Slot 0 remains workers.photo_url for backwards compatibility.';
comment on column public.workers.video_urls is
  'Additional public video slots 1 (pitch) and 2 (language). Intro remains workers.video_url.';
comment on column public.shifts.worker_requirements is
  'Optional minimumExperience (years) and required language codes.';

notify pgrst, 'reload schema';
