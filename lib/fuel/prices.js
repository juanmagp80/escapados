import { inMemoryCache } from "@/lib/utils/cache";

const CACHE_TTL_MS = 60 * 60 * 1000;
const PRICES_URL =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/";

const cache = inMemoryCache(CACHE_TTL_MS);

function parsePrice(value) {
  if (value === undefined || value === null || String(value).trim() === "")
    return null;
  const n = parseFloat(String(value).trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseCoord(value) {
  if (value === undefined || value === null) return null;
  const n = parseFloat(String(value).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function getAllFuelStations() {
  const cached = cache.get("stations");
  if (cached) return cached;

  const res = await fetch(PRICES_URL, {
    cache: "no-store",
    headers: { "User-Agent": "Escapa2/1.0" },
  });
  if (!res.ok) throw new Error("fuel prices request failed");

  const data = await res.json();
  const raw = Array.isArray(data?.ListaEESSPrecio)
    ? data.ListaEESSPrecio
    : [];

  const stations = raw
    .map((s) => ({
      name: s["Rótulo"] || "Gasolinera",
      address: [
        s["Dirección"],
        s["Localidad"],
        s["Municipio"],
        s["Provincia"],
      ].filter(Boolean).join(", "),
      lat: parseCoord(s["Latitud"]),
      lon: parseCoord(s["Longitud (WGS84)"]),
      gasoline: parsePrice(s["Precio Gasolina 95 E5"]),
      diesel: parsePrice(s["Precio Gasoleo A"]),
      openingHours: s["Horario"] || null,
    }))
    .filter((s) => s.lat !== null && s.lon !== null)
    .filter((s) => s.gasoline !== null || s.diesel !== null);

  cache.set("stations", stations);
  return stations;
}

function distKm(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function distanceToSegment(lat, lon, aLat, aLon, bLat, bLon) {
  const dAB = distKm(lat, lon, aLat, aLon);
  const dAC = distKm(lat, lon, bLat, bLon);
  const dBC = distKm(aLat, aLon, bLat, bLon);
  if (dBC === 0) return dAB;
  // Projección del punto sobre el segmento (aproximación plana).
  const ABx = (bLon - aLon) * Math.cos((aLat * Math.PI) / 180);
  const ABy = bLat - aLat;
  const t =
    (((lon - aLon) * Math.cos((aLat * Math.PI) / 180)) * ABx +
      (lat - aLat) * ABy) /
    (ABx * ABx + ABy * ABy);
  if (t < 0) return dAB;
  if (t > 1) return dAC;
  const projLat = aLat + t * ABy;
  const projLon = aLon + (t * ABx) / Math.cos((aLat * Math.PI) / 180);
  return distKm(lat, lon, projLat, projLon);
}

export async function getCheapestStationsAlongRoute(
  origin,
  destination,
  { count = 5, maxDistanceKm = 25 } = {}
) {
  if (!origin || !destination) return [];

  const stations = await getAllFuelStations();

  return stations
    .map((s) => ({
      ...s,
      distanceKm: Math.round(
        distanceToSegment(
          s.lat,
          s.lon,
          origin.lat,
          origin.lon,
          destination.lat,
          destination.lon
        ) * 10
      ) / 10,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`,
      price: Math.min(
        ...[s.gasoline, s.diesel].filter((p) => p !== null)
      ),
    }))
    .filter((s) => s.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.price - b.price)
    .slice(0, count);
}