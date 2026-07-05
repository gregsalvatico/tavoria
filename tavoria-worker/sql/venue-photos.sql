-- Venue logo/storefront photo bucket + column
-- Run in Supabase SQL Editor

insert into storage.buckets (id, name, public)
values ('venue-photos', 'venue-photos', true)
on conflict (id) do nothing;

-- Authenticated users can upload to their own folder ({user_id}/...)
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
);

drop policy if exists "public read venue photos" on storage.objects;
create policy "public read venue photos"
on storage.objects for select to public
using (bucket_id = 'venue-photos');

-- Add photo_url column to venues table
alter table public.venues
  add column if not exists photo_url text;

notify pgrst, 'reload schema';
