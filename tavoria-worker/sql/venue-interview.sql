-- Venue's ideal-candidate answers to the same interview QCM workers take.
-- Same shape as workers.interview_answers.
-- Lets us compute match score: % of questions where worker's answer matches venue's preference.

alter table public.venues
  add column if not exists preferred_interview_answers jsonb,
  add column if not exists preferred_interview_completed_at timestamptz;

notify pgrst, 'reload schema';
