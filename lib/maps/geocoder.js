import { inMemoryCache } from "../utils/cache";
import { fileCache } from "../utils/cacheServer";
import { geocode as nominatimGeocode } from "./nominatim";

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;
const geocodeCache = inMemoryCache(1000 * 60 * 60 * 24);
const geocodeDisk = fileCache("geocode", 1000 * 60 * 60 * 24 * 7);

function cacheGet(key) {
  return geocodeCache.get(key) || geocodeDisk.get(key);
}

function cacheSet(key, value) {
  geocodeCache.set(key, value);
  geocodeDisk.set(key, value);
  return value;
}

// Geocodificador principal: Geoapify si hay clave (3000 req/día gratis),
// con respaldo a Nominatim (OpenStreetMap) y caché en memoria + disco.
export async function geocode(query) {
  if (!query) return null;
  const key = query.trim().toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;

  if (GEOAPIFY_KEY) {
    const result = await withNull(() => geoapifyGeocode(query));
    if (result) return cacheSet(key, result);
  }

  const result = await withNull(() => nominatimGeocode(query));
  if (result) return cacheSet(key, result);
  return null;
}

async function geoapifyGeocode(query) {
  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", query);
  url.searchParams.set("apiKey", GEOAPIFY_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "es");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  if (results.length === 0) return null;

  // Preferimos lugares (ciudad/pueblo) sobre calles homónimas y, entre
  // ellos, los de España. Así "Budapest" resuelve a la ciudad húngara y
  // no a alguna calle española con ese nombre.
  const TOWN_TYPES = new Set([
    "city", "town", "village", "hamlet", "municipality", "county",
    "state", "province", "region", "country",
  ]);
  const towns = results.filter((r) => TOWN_TYPES.has(r.result_type));
  const pool = towns.length > 0 ? towns : results;
  const place =
    pool.find((r) => r.country_code === "es") || pool[0] || results[0];
  const name =
    place.name ||
    place.city ||
    place.county ||
    place.town ||
    place.formatted?.split(",")[0] ||
    query;
  const lat = Number(place.lat);
  const lon = Number(place.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    name,
    fullName: place.formatted || query,
    lat,
    lon,
  };
}

export async function reverseGeocode(lat, lon) {
  if (lat == null || lon == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) return null;
  const key = `r:${lat},${lon}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  if (GEOAPIFY_KEY) {
    const result = await withNull(() => geoapifyReverseGeocode(lat, lon));
    if (result) return cacheSet(key, result);
  }

  const result = await withNull(() => nominatimReverseGeocode(lat, lon));
  if (result) return cacheSet(key, result);
  return null;
}

async function geoapifyReverseGeocode(lat, lon) {
  const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("apiKey", GEOAPIFY_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", "es");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const place = Array.isArray(data?.results) ? data.results[0] : null;
  if (!place) return null;

  const name =
    place.city ||
    place.town ||
    place.village ||
    place.municipality ||
    place.county ||
    place.name ||
    place.formatted?.split(",")[0] ||
    null;
  if (!name) return null;
  return { name, fullName: place.formatted || name, lat: Number(lat), lon: Number(lon) };
}

async function nominatimReverseGeocode(lat, lon) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("accept-language", "es");

  const res = await fetch(url, {
    headers: { "User-Agent": "Escapa2/1.0 (escapas@example.com)" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const name =
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.municipality ||
    data.name ||
    (data.display_name || "").split(",")[0] ||
    null;
  if (!name) return null;
  return { name, fullName: data.display_name || name, lat: Number(lat), lon: Number(lon) };
}

async function withNull(fn) {
  try {
    return (await fn()) || null;
  } catch {
    return null;
  }
}