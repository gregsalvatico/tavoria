-- Private storage and metadata for worker CVs.
-- CVs are sensitive documents and must never use a public bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'worker-documents',
  'worker-documents',
  false,
  10485760,
  array['application/pdf']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf']::text[];

drop policy if exists "workers upload own documents" on storage.objects;
create policy "workers upload own documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'worker-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "workers read own documents" on storage.objects;
create policy "workers read own documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'worker-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "workers update own documents" on storage.objects;
create policy "workers update own documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'worker-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'worker-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create table if not exists public.worker_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('cv', 'reference', 'id')),
  storage_path text not null,
  original_name text,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, document_type)
);

alter table public.worker_documents enable row level security;

drop policy if exists "workers insert own documents" on public.worker_documents;
create policy "workers insert own documents"
on public.worker_documents for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "workers read own documents" on public.worker_documents;
create policy "workers read own documents"
on public.worker_documents for select to authenticated
using (user_id = auth.uid());

drop policy if exists "workers update own documents" on public.worker_documents;
create policy "workers update own documents"
on public.worker_documents for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "workers delete own documents" on public.worker_documents;
create policy "workers delete own documents"
on public.worker_documents for delete to authenticated
using (user_id = auth.uid());

notify pgrst, 'reload schema';
