alter table public.applications
  add column if not exists interview_scheduled_at timestamptz,
  add column if not exists interview_location text;

comment on column public.applications.interview_scheduled_at is
  'Date and time proposed by the venue when requesting an interview.';

comment on column public.applications.interview_location is
  'Human-readable interview location, such as the venue address, phone, or video call.';
