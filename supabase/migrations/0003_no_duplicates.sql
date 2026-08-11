-- Escapa2 — Evitar duplicados en favoritos y viajes guardados
-- Ejecutar en el SQL editor de Supabase después de 0002.

-- Limpiar duplicados existentes antes de crear las restricciones únicas.
delete from public.saved_destinations a
using public.saved_destinations b
where a.user_id = b.user_id
  and a.destination = b.destination
  and a.id > b.id;

delete from public.trips a
using public.trips b
where a.user_id = b.user_id
  and a.origin = b.origin
  and a.destination = b.destination
  and a.start_date = b.start_date
  and a.end_date = b.end_date
  and a.id > b.id;

-- Un favorito por usuario y destino.
alter table public.saved_destinations
  add constraint saved_dest_unique unique (user_id, destination);

-- Un viaje guardado idéntico por usuario (mismo origen, destino y fechas).
alter table public.trips
  add constraint trips_unique unique (user_id, origin, destination, start_date, end_date);