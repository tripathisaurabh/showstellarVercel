-- ============================================================
-- Migration: Create email change request queue
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.email_change_requests (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  current_email text not null,
  requested_email text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_change_requests_artist_id_idx on public.email_change_requests (artist_id);
create index if not exists email_change_requests_user_id_idx on public.email_change_requests (user_id);
create index if not exists email_change_requests_status_idx on public.email_change_requests (status);
create unique index if not exists email_change_requests_single_pending_idx
  on public.email_change_requests (user_id)
  where status = 'pending';

alter table if exists public.email_change_requests enable row level security;

drop policy if exists "Users can view own email change requests" on public.email_change_requests;
create policy "Users can view own email change requests"
  on public.email_change_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own email change requests" on public.email_change_requests;
create policy "Users can create own email change requests"
  on public.email_change_requests
  for insert
  with check (auth.uid() = user_id);
