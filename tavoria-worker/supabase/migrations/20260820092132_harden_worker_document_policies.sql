-- Anonymous Supabase sessions also use the authenticated Postgres role.
-- Keep sensitive CV metadata and files limited to real Tavoria accounts.

drop policy if exists "workers upload own documents" on storage.objects;
create policy "workers upload own documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'worker-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

drop policy if exists "workers read own documents" on storage.objects;
create policy "workers read own documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'worker-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

drop policy if exists "workers update own documents" on storage.objects;
create policy "workers update own documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'worker-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
)
with check (
  bucket_id = 'worker-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

drop policy if exists "workers insert own documents" on public.worker_documents;
create policy "workers insert own documents"
on public.worker_documents for insert to authenticated
with check (
  user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

drop policy if exists "workers read own documents" on public.worker_documents;
create policy "workers read own documents"
on public.worker_documents for select to authenticated
using (
  user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

drop policy if exists "workers update own documents" on public.worker_documents;
create policy "workers update own documents"
on public.worker_documents for update to authenticated
using (
  user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
)
with check (
  user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

drop policy if exists "workers delete own documents" on public.worker_documents;
create policy "workers delete own documents"
on public.worker_documents for delete to authenticated
using (
  user_id = auth.uid()
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);
