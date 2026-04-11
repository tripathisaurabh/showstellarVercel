alter table if exists public.artist_profiles
  add column if not exists profile_image_cropped text;

alter table if exists public.artist_profiles
  add column if not exists profile_image_original text;
