alter table if exists public.artist_profiles
  add column if not exists preferred_working_locations text;
