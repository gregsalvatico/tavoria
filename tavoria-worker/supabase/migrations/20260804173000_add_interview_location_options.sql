alter table public.venues
  add column if not exists interview_location_options text[] not null
  default array['venue', 'phone', 'video']::text[];

comment on column public.venues.interview_location_options is
  'Interview formats the venue offers: venue, phone, video, or other.';
