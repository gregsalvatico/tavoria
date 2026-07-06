-- ============================================================================
-- 2026-05-29 — Worker phone for post-hire WhatsApp / Call contact
-- ============================================================================
-- Workers add an optional phone on their profile. After a venue interviews
-- or hires them, the phone is revealed to the venue so they can message
-- via WhatsApp / call directly. Same on the worker side — they see the
-- venue's existing phone after the same status change.
-- ============================================================================

alter table public.workers
  add column if not exists phone text;

notify pgrst, 'reload schema';
