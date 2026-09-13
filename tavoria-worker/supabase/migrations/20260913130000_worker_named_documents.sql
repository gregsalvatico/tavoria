-- Allow workers to add multiple private documents with their own display names.
-- Existing CV/reference/ID rows remain valid and keep their metadata.

alter table public.worker_documents
  drop constraint if exists worker_documents_document_type_check;

alter table public.worker_documents
  add constraint worker_documents_document_type_check
  check (document_type in ('cv', 'reference', 'ref', 'id', 'document'));

alter table public.worker_documents
  drop constraint if exists worker_documents_user_id_document_type_key;

alter table public.worker_documents
  add column if not exists display_name text;

update public.worker_documents
set display_name = coalesce(
  nullif(trim(original_name), ''),
  case document_type
    when 'cv' then 'CV'
    when 'reference' then 'Reference'
    when 'ref' then 'Reference'
    when 'id' then 'ID / Right to work'
    else 'Document'
  end
)
where display_name is null;

alter table public.worker_documents
  add constraint worker_documents_display_name_check
  check (display_name is null or char_length(trim(display_name)) between 1 and 120);

create index if not exists worker_documents_user_created_idx
  on public.worker_documents (user_id, created_at desc);

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif'
]::text[]
where id = 'worker-documents';

notify pgrst, 'reload schema';
