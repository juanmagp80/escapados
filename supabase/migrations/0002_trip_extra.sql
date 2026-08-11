-- Escapa2 — Columnas extra en viajes (slug e imagen del destino)
alter table public.trips
  add column if not exists slug text,
  add column if not exists image text;