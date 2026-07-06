-- Add nationality (ISO 3166-1 alpha-2 code, e.g. "IT", "FR")
-- and Italy work eligibility status to workers.
--
-- work_eligibility_it values:
--   eu_citizen   — EU passport, automatic right to work
--   permit       — Has a valid Italian work permit
--   pending      — Permit application in process
--   need_help    — Needs help with paperwork
--   not_eligible — Not yet eligible

alter table public.workers
  add column if not exists nationality text,
  add column if not exists work_eligibility_it text;

-- Index for venue-side filtering by eligibility
create index if not exists workers_work_eligibility_it_idx
  on public.workers (work_eligibility_it);

notify pgrst, 'reload schema';
