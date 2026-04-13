create table if not exists public.artist_communication_events (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artist_profiles(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  template_key text not null,
  channel text not null default 'email',
  recipient_email text,
  subject text not null,
  status text not null,
  message_id text,
  error text,
  payload jsonb not null default '{}'::jsonb,
  triggered_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists artist_communication_events_artist_id_idx
  on public.artist_communication_events (artist_id);

create index if not exists artist_communication_events_user_id_idx
  on public.artist_communication_events (user_id);

create index if not exists artist_communication_events_event_name_idx
  on public.artist_communication_events (event_name);

create index if not exists artist_communication_events_status_idx
  on public.artist_communication_events (status);

drop trigger if exists set_updated_at_on_artist_communication_events on public.artist_communication_events;
create trigger set_updated_at_on_artist_communication_events
before update on public.artist_communication_events
for each row
execute function public.set_updated_at_timestamp();
