import { fileCache } from "@/lib/utils/cacheServer";

const OVERPASS_ENDPOINTS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

const LODGING_TAGS = [
  "hotel",
  "motel",
  "hostel",
  "guest_house",
  "bed_and_breakfast",
  "apartment",
  "camp_site",
];

// Los alojamientos de una zona apenas cambian: cacheamos 24 h para evitar
// saturar los servidores Overpass gratuitos y dar respuesta instantánea.
const cache = fileCache("overpass-hotels", 24 * 60 * 60 * 1000);

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

export async function getHotelsFromOverpass({ lat, lon, radiusKm = 4 }) {
  if (lat === undefined || lon === undefined) return [];

  const key = `${Math.round(lat * 1000) / 1000},${Math.round(lon * 1000) / 1000}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const filter = `["tourism"~"^(${LODGING_TAGS.join("|")})$"]`;
  const m = Math.round(radiusKm * 1000);

  const overpassQuery = `
    [out:json][timeout:15];
    (
      node${filter}(around:${m},${lat},${lon});
      way${filter}(around:${m},${lat},${lon});
    );
    out center tags 30;
  `;

  let data = null;
  const deadline = Date.now() + 25000;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (Date.now() > deadline) break;
    const remaining = Math.max(5000, deadline - Date.now());
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(remaining, 12000));
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Escapa2/1.0 (contacto: escapas@example.com)",
        },
        body: new URLSearchParams({ data: overpassQuery }),
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (Array.isArray(json.elements)) {
        data = json;
        break;
      }
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  // No cacheamos el fallo: si todos los endpoints fallan (caída o timeout),
  // devolvemos [] pero sin guardarlo, para que el siguiente intento reintente
  // en vez de quedar "vacío" durante las 24 h de TTL.
  if (!data) return [];

  const seen = new Set();
  const hotels = (data.elements || [])
    .map((el) => {
      if (el.id && seen.has(el.id)) return null;
      if (el.id) seen.add(el.id);
      const centerLat = el.lat || el.center?.lat;
      const centerLon = el.lon || el.center?.lon;
      if (!centerLat || !centerLon) return null;
      const name =
        el.tags?.name ||
        el.tags?.["addr:street"] ||
        el.tags?.brand ||
        "Alojamiento sin nombre";
      const stars = el.tags?.stars
        ? Number(String(el.tags.stars).replace(",", "."))
        : null;
      return {
        name,
        image: null,
        lat: centerLat,
        lon: centerLon,
        pricePerNight: null,
        priceTotal: null,
        rating: Number.isFinite(stars) && stars > 0 ? stars : null,
        reviews: null,
        nights: null,
        distanceKm: Math.round(distKm(lat, lon, centerLat, centerLon) * 10) / 10,
        address: [
          el.tags?.["addr:street"],
          el.tags?.["addr:housenumber"],
          el.tags?.["addr:postcode"],
          el.tags?.["addr:city"],
        ].filter(Boolean).join(", "),
        link: `https://www.google.com/maps/search/?api=1&query=${centerLat},${centerLon}`,
      };
    })
    .filter(Boolean);

  const result = hotels
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, 8);

  cache.set(key, result);
  return result;
}