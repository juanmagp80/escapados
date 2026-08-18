-- Alertas de precios: el usuario guarda una búsqueda y la app la re-lanza
-- diariamente, notificando por Telegram si los precios bajan.

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  label text,
  query_params jsonb not null,
  search_key text not null,
  active boolean default true,
  last_price numeric,
  last_results jsonb,
  last_checked timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_price_alerts_user on public.price_alerts(user_id);
create index if not exists idx_price_alerts_active on public.price_alerts(active) where active = true;
create unique index if not exists idx_price_alerts_user_search on public.price_alerts(user_id, search_key);

alter table public.price_alerts enable row level security;

drop policy if exists "price_alerts_owner" on public.price_alerts;
create policy "price_alerts_owner" on public.price_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chat ID de Telegram para notificaciones (en preferencias)
alter table public.preferences
  add column if not exists telegram_chat_id text;

-- Trigger de updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_price_alerts on public.price_alerts;
create trigger set_updated_at_price_alerts
  before update on public.price_alerts
  for each row execute function public.set_updated_at();
