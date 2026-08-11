-- Preferencias ampliadas y valoraciones de destinos
alter table public.preferences
  add column if not exists interests text[] default '{}',
  add column if not exists pace text default 'relaxed',
  add column if not exists pets boolean default false,
  add column if not exists default_budget numeric,
  add column if not exists default_travelers integer default 2;

-- Escapadas públicas (para la comunidad)
create table if not exists public.published_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  destination text not null,
  slug text,
  image text,
  summary text,
  itinerary jsonb default '[]',
  estimated_cost numeric,
  origin text,
  start_date date,
  end_date date,
  travelers integer default 2,
  transport text default 'car',
  likes integer default 0,
  created_at timestamptz default now(),
  unique (user_id, destination, start_date)
);

-- Valoraciones de destinos
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  destination text not null,
  value_for_money integer check (value_for_money between 1 and 5),
  romance integer check (romance between 1 and 5),
  gastronomy integer check (gastronomy between 1 and 5),
  activities integer check (activities between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (user_id, destination)
);

-- Gastos reales reportados por usuarios
create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  destination text not null,
  total_spent numeric,
  hotel_spent numeric,
  transport_spent numeric,
  food_spent numeric,
  activities_spent numeric,
  travelers integer default 2,
  nights integer default 2,
  created_at timestamptz default now()
);

-- Likes a escapadas públicas
create table if not exists public.trip_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references public.published_trips(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, trip_id)
);

-- RLS: public_published_trips lectura pública, escritura solo autor
alter table public.published_trips enable row level security;
alter table public.ratings enable row level security;
alter table public.trip_expenses enable row level security;
alter table public.trip_likes enable row level security;

drop policy if exists "published_trips_select" on public.published_trips;
create policy "published_trips_select" on public.published_trips
  for select using (true);

drop policy if exists "published_trips_insert" on public.published_trips;
create policy "published_trips_insert" on public.published_trips
  for insert with check (auth.uid() = user_id);

drop policy if exists "published_trips_delete" on public.published_trips;
create policy "published_trips_delete" on public.published_trips
  for delete using (auth.uid() = user_id);

drop policy if exists "ratings_select" on public.ratings;
create policy "ratings_select" on public.ratings
  for select using (true);

drop policy if exists "ratings_upsert" on public.ratings;
create policy "ratings_upsert" on public.ratings
  for insert with check (auth.uid() = user_id)
  using (auth.uid() = user_id);

drop policy if exists "trip_expenses_select" on public.trip_expenses;
create policy "trip_expenses_select" on public.trip_expenses
  for select using (true);

drop policy if exists "trip_expenses_insert" on public.trip_expenses;
create policy "trip_expenses_insert" on public.trip_expenses
  for insert with check (auth.uid() = user_id);

drop policy if exists "trip_likes_select" on public.trip_likes;
create policy "trip_likes_select" on public.trip_likes
  for select using (true);

drop policy if exists "trip_likes_insert" on public.trip_likes;
create policy "trip_likes_insert" on public.trip_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "trip_likes_delete" on public.trip_likes;
create policy "trip_likes_delete" on public.trip_likes
  for delete using (auth.uid() = user_id);