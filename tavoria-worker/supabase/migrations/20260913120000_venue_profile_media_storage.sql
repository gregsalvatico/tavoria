-- Complete the storage policies for venue profile media.
-- The profile editor uploads a new object for every replacement, so the
-- insert policy is the critical path; update/delete policies keep the bucket
-- safe for future cleanup and direct replacements.

alter table public.venues
  add column if not exists photo_urls jsonb not null default '[]'::jsonb,
  add column if not exists video_urls jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'venues_photo_slots') then
    alter table public.venues add constraint venues_photo_slots
      check (jsonb_typeof(photo_urls) = 'array' and jsonb_array_length(photo_urls) <= 4);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'venues_video_slots') then
    alter table public.venues add constraint venues_video_slots
      check (jsonb_typeof(video_urls) = 'array' and jsonb_array_length(video_urls) <= 3);
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-photos',
  'venue-photos',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = 104857600,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-videos',
  'venue-videos',
  true,
  104857600,
  array['video/mp4', 'video/quicktime', 'video/webm']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = 104857600,
    allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm']::text[];

drop policy if exists "venues upload own photos" on storage.objects;
create policy "venues upload own photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venues update own photos" on storage.objects;
create policy "venues update own photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venues delete own photos" on storage.objects;
create policy "venues delete own photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venues upload own videos" on storage.objects;
create policy "venues upload own videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'venue-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venues update own videos" on storage.objects;
create policy "venues update own videos"
on storage.objects for update to authenticated
using (
  bucket_id = 'venue-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'venue-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "venues delete own videos" on storage.objects;
create policy "venues delete own videos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'venue-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';
