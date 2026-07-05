-- Storage buckets for worker photos + videos
-- Run once in Supabase SQL Editor

-- Create buckets (public-read so candidate cards can show without auth)
insert into storage.buckets (id, name, public)
values
  ('worker-photos', 'worker-photos', true),
  ('worker-videos', 'worker-videos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder ({user_id}/...)
drop policy if exists "workers upload own photos" on storage.objects;
create policy "workers upload own photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'worker-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "workers upload own videos" on storage.objects;
create policy "workers upload own videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'worker-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/replace their own files (re-upload photo/video)
drop policy if exists "workers update own photos" on storage.objects;
create policy "workers update own photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'worker-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "workers update own videos" on storage.objects;
create policy "workers update own videos"
on storage.objects for update to authenticated
using (
  bucket_id = 'worker-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read (candidate cards / discover feed)
drop policy if exists "public read worker photos" on storage.objects;
create policy "public read worker photos"
on storage.objects for select to public
using (bucket_id = 'worker-photos');

drop policy if exists "public read worker videos" on storage.objects;
create policy "public read worker videos"
on storage.objects for select to public
using (bucket_id = 'worker-videos');

-- Add photo_url + video_url columns to workers table
alter table public.workers
  add column if not exists photo_url text,
  add column if not exists video_url text;

notify pgrst, 'reload schema';
