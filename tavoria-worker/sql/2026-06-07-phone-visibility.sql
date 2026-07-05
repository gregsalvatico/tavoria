-- ============================================================================
-- 2026-06-07 — Phone visibility consent for workers
-- ============================================================================
-- Workers can opt out of sharing their phone number with venues even after
-- they're hired or invited to interview. Defaults to TRUE (opt-out model)
-- so existing workers + new signups continue to enable contact unless they
-- explicitly disable it on the experience screen.
-- ============================================================================

alter table public.workers
  add column if not exists phone_visible boolean default true;

-- Backfill any existing rows that may have NULL (shouldn't happen with the
-- default, but defensive).
update public.workers
  set phone_visible = true
  where phone_visible is null;

notify pgrst, 'reload schema';
