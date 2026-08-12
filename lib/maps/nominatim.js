import { inMemoryCache } from "../utils/cache";

const geocodeCache = inMemoryCache(1000 * 60 * 60 * 24);

export async function geocode(query) {
  if (!query) return null;
  const key = query.trim().toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "es");

  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "Accept-Language": "es", "User-Agent": "Escapa2/1.0" },
        cache: "no-store",
      });
      if (res.status === 429) {
        lastError = new Error("rate-limited");
        await sleep(600 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error("geocode failed");
      const data = await res.json();
      if (!data || data.length === 0) return null;

      // Preferimos lugares (ciudad/pueblo) sobre calles homónimas y, entre
      // ellos, las de España. Así "Budapest" resuelve a la ciudad húngara.
      const TOWN_TYPES = new Set([
        "city", "town", "village", "hamlet", "municipality", "county",
        "state", "province", "region", "country", "administrative",
      ]);
      const towns = data.filter((p) => TOWN_TYPES.has(p.type));
      const pool = towns.length > 0 ? towns : data;
      const place =
        pool.find((p) =>
          (p.display_name || "").toLowerCase().includes("españa")
        ) ||
        pool[0] ||
        data[0];

      const result = {
        name: place.display_name.split(",")[0],
        fullName: place.display_name,
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
      };
      return geocodeCache.set(key, result);
    } catch (err) {
      lastError = err;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastError || new Error("geocode failed");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

