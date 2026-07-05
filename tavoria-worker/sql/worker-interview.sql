-- Add interview QCM answers to workers
-- Each row in the jsonb array: { q_id, q_text, role, a_id, a_text }
-- Storing full text means admin display doesn't need a Q lookup
-- and question-bank changes don't break old answers.

alter table public.workers
  add column if not exists interview_answers jsonb,
  add column if not exists interview_completed_at timestamptz;

notify pgrst, 'reload schema';
