-- Escapa2 — Compartir escapadas, checklists y suscripciones push
create table if not exists public.shared_trips (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner_id uuid references auth.users(id) on delete set null,
  destination text not null,
  origin text,
  title text,
  summary text,
  start_date date,
  end_date date,
  travelers integer default 2,
  transport text default 'car',
  budget numeric,
  image text,
  itinerary jsonb default '[]',
  options jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.trip_checklists (
  id uuid primary key default gen_random_uuid(),
  shared_trip_id uuid references public.shared_trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  destination text not null,
  name text default 'Checklist de viaje',
  items jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text unique not null,
  keys jsonb not null,
  created_at timestamptz default now()
);

alter table public.shared_trips enable row level security;
alter table public.trip_checklists enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "shared_trips_select" on public.shared_trips;
create policy "shared_trips_select" on public.shared_trips
  for select using (true);

drop policy if exists "shared_trips_insert" on public.shared_trips;
create policy "shared_trips_insert" on public.shared_trips
  for insert with check (true);

drop policy if exists "shared_trips_update" on public.shared_trips;
create policy "shared_trips_update" on public.shared_trips
  for update using (true) with check (true);

drop policy if exists "shared_trips_delete" on public.shared_trips;
create policy "shared_trips_delete" on public.shared_trips
  for delete using (auth.uid() = owner_id);

drop policy if exists "checklists_select" on public.trip_checklists;
create policy "checklists_select" on public.trip_checklists
  for select using (true);

drop policy if exists "checklists_insert" on public.trip_checklists;
create policy "checklists_insert" on public.trip_checklists
  for insert with check (true);

drop policy if exists "checklists_update" on public.trip_checklists;
create policy "checklists_update" on public.trip_checklists
  for update using (true) with check (true);

drop policy if exists "checklists_delete" on public.trip_checklists;
create policy "checklists_delete" on public.trip_checklists
  for delete using (true);

drop policy if exists "push_sub_select" on public.push_subscriptions;
create policy "push_sub_select" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push_sub_insert" on public.push_subscriptions;
create policy "push_sub_insert" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_sub_delete" on public.push_subscriptions;
create policy "push_sub_delete" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

create index if not exists idx_shared_slug on public.shared_trips(slug);
create index if not exists idx_checklist_shared on public.trip_checklists(shared_trip_id);