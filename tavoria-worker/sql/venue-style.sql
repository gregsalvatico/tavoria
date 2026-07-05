-- Add venue_style column to venues
-- Tracks the pace / level the workers will operate in

alter table public.venues
  add column if not exists venue_style text;

notify pgrst, 'reload schema';
