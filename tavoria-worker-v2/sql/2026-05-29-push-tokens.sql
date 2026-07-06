-- ============================================================================
-- 2026-05-29 — Push notification support
-- ============================================================================
-- Adds:
--   * push_token text — Expo push token (ExponentPushToken[...]) that the
--     Edge Function targets when delivering a notification.
--   * language text — IETF tag ("en", "it", "fr", "es"). Lets the Edge
--     Function pick the right copy for the push body.
-- ============================================================================

alter table public.workers
  add column if not exists push_token text,
  add column if not exists language text;

alter table public.venues
  add column if not exists push_token text,
  add column if not exists language text;

-- Cheap indexes — push_token lookups happen on every application change
create index if not exists workers_push_token_idx
  on public.workers (push_token)
  where push_token is not null;

create index if not exists venues_push_token_idx
  on public.venues (push_token)
  where push_token is not null;

notify pgrst, 'reload schema';
