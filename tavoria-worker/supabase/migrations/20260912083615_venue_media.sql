-- Public media attached to a venue's shift/request. The existing venues.photo_url
-- remains the venue identity image; these arrays describe the specific opening.
alter table public.shifts
  add column if not exists photo_urls jsonb not null default '[]'::jsonb,
  add column if not exists video_urls jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shifts_photo_slots') then
    alter table public.shifts add constraint shifts_photo_slots
      check (jsonb_typeof(photo_urls) = 'array' and jsonb_array_length(photo_urls) <= 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'shifts_video_slots') then
    alter table public.shifts add constraint shifts_video_slots
      check (jsonb_typeof(video_urls) = 'array' and jsonb_array_length(video_urls) <= 3);
  end if;
end $$;

comment on column public.shifts.photo_urls is
  'Public venue media for this shift/request, up to 5 image URLs.';
comment on column public.shifts.video_urls is
  'Public venue media for this shift/request, up to 3 video URLs.';

-- Venue sessions are anonymous authenticated sessions today, so ownership is
-- represented by the first folder segment (the current auth user id).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-shift-media',
  'venue-shift-media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = 104857600,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']::text[];

drop policy if exists "venue owners upload shift media" on storage.objects;
create policy "venue owners upload shift media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'venue-shift-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venue owners update shift media" on storage.objects;
create policy "venue owners update shift media"
on storage.objects for update to authenticated
using (
  bucket_id = 'venue-shift-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'venue-shift-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venue owners delete shift media" on storage.objects;
create policy "venue owners delete shift media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'venue-shift-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';
