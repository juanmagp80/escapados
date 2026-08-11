import { geocode } from "../maps/geocoder";
import { getRoute } from "../routing/osrm";
import { withFallback } from "../utils/cache";
import { formatKm, formatDuration } from "../utils/format";

export const MAX_DISTANCE_BY_DAYS = {
  2: 250,
  3: 500,
  4: 500,
  5: 800,
  6: 800,
  7: 800,
};

export function maxDistanceKm(days) {
  if (days <= 2) return MAX_DISTANCE_BY_DAYS[2];
  if (days <= 4) return MAX_DISTANCE_BY_DAYS[4];
  return MAX_DISTANCE_BY_DAYS[7];
}

const CURATED_ORIGINS = {
  default: [
    "Granada", "Córdoba", "Sevilla", "Cádiz", "Ronda", "Nerja", "Frigiliana",
    "Almería", "Jaén", "Málaga", "Úbeda", "Baeza", "Antequera", "Motril",
    "Conil de la Frontera", "Vejer de la Frontera", "Tarifa", "Gibraltar",
    "Marbella", "Estepona", "Mijas", "Caminito del Rey", "Sierra Nevada",
    "Guadix", "Priego de Córdoba", "Lucena", "Osuna", "Écija",
  ],
};

export function candidateDestinations(originQuery) {
  return CURATED_ORIGINS.default.filter(
    (d) => d.toLowerCase() !== (originQuery || "").toLowerCase()
  );
}

export async function buildDestination(origin, name) {
  const destination = await withFallback(() => geocode(name), null);
  if (!destination) return null;

  const route = await withFallback(
    () => getRoute(origin, destination),
    null
  );

  return {
    name,
    slug: slugByName(name),
    lat: destination.lat,
    lon: destination.lon,
    distanceMeters: route ? route.distance : null,
    durationSeconds: route ? route.duration : null,
    distanceLabel: route ? formatKm(route.distance) : "—",
    durationLabel: route ? formatDuration(route.duration) : "—",
  };
}

function slugByName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
