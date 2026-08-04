-- Contact details are shared only after a venue has requested an interview or
-- hired a worker. These preferences let each venue choose which methods appear.
alter table public.venues
  add column if not exists contact_email_enabled boolean not null default true,
  add column if not exists contact_phone_enabled boolean not null default true,
  add column if not exists contact_in_person_enabled boolean not null default false;

comment on column public.venues.contact_email_enabled is
  'Share the venue email with workers after interview request or hire.';
comment on column public.venues.contact_phone_enabled is
  'Share the venue phone and WhatsApp contact after interview request or hire.';
comment on column public.venues.contact_in_person_enabled is
  'Share the venue address as an in-person visit option after interview request or hire.';
