-- Escapa2 — Schema inicial + Row Level Security
-- Ejecutar en el SQL editor de Supabase.

-- Perfiles (relacionado con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz default now()
);

-- Viajes guardados
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  origin text,
  destination text,
  start_date date,
  end_date date,
  travelers int,
  transport text,
  budget numeric,
  created_at timestamptz default now()
);

-- Destinos favoritos
create table if not exists public.saved_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  destination text,
  country text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

-- Viajes guardados (referencia a trips)
create table if not exists public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Preferencias
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  preferred_transport text,
  max_budget numeric,
  preferred_trip_duration int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices
create index if not exists idx_trips_user on public.trips(user_id);
create index if not exists idx_saved_dest_user on public.saved_destinations(user_id);
create index if not exists idx_saved_trips_user on public.saved_trips(user_id);

-- Habilitar RLS
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.saved_destinations enable row level security;
alter table public.saved_trips enable row level security;
alter table public.preferences enable row level security;

-- Perfiles: cada usuario solo ve/modifica los suyos
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trips
drop policy if exists "trips_owner" on public.trips;
create policy "trips_owner" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Saved destinations
drop policy if exists "saved_dest_owner" on public.saved_destinations;
create policy "saved_dest_owner" on public.saved_destinations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Saved trips
drop policy if exists "saved_trips_owner" on public.saved_trips;
create policy "saved_trips_owner" on public.saved_trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Preferences
drop policy if exists "prefs_owner" on public.preferences;
create policy "prefs_owner" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, name)
  values (new.id, new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
