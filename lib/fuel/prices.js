import { inMemoryCache } from "@/lib/utils/cache";
import { getRoute } from "@/lib/routing/osrm";

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

function distanceToPolylineKm(lat, lon, coords) {
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = distanceToSegment(
      lat,
      lon,
      coords[i][0],
      coords[i][1],
      coords[i + 1][0],
      coords[i + 1][1]
    );
    if (d < min) min = d;
  }
  return Number.isFinite(min) ? min : null;
}

// Calcula la posición de un punto a lo largo de la ruta: km recorridos desde
// el origen, km totales y % de avance. Se proyecta sobre la polilínea y se
// suma la longitud de los segmentos previos + la fracción del segmento actual.
function routeProgressKm(lat, lon, coords) {
  if (!coords || coords.length < 2) return { kmAlong: null, totalKm: null, pct: null };

  const segmentLengths = [];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = distKm(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    segmentLengths.push(d);
    total += d;
  }

  let best = { segIndex: -1, t: 0, dist: Infinity };
  for (let i = 0; i < coords.length - 1; i++) {
    const aLat = coords[i][0];
    const aLon = coords[i][1];
    const bLat = coords[i + 1][0];
    const bLon = coords[i + 1][1];
    const dAB = distKm(lat, lon, aLat, aLon);
    const dBC = segmentLengths[i];
    if (dBC === 0) {
      if (dAB < best.dist) best = { segIndex: i, t: 0, dist: dAB };
      continue;
    }
    const ABx = (bLon - aLon) * Math.cos((aLat * Math.PI) / 180);
    const ABy = bLat - aLat;
    const t =
      (((lon - aLon) * Math.cos((aLat * Math.PI) / 180)) * ABx + (lat - aLat) * ABy) /
      (ABx * ABx + ABy * ABy);
    const tc = Math.max(0, Math.min(1, t));
    const projLat = aLat + tc * ABy;
    const projLon = aLon + (tc * ABx) / Math.cos((aLat * Math.PI) / 180);
    const d = distKm(lat, lon, projLat, projLon);
    if (d < best.dist) best = { segIndex: i, t: tc, dist: d };
  }

  if (best.segIndex < 0) return { kmAlong: null, totalKm: null, pct: null };
  let before = 0;
  for (let i = 0; i < best.segIndex; i++) before += segmentLengths[i];
  const kmAlong = before + best.t * segmentLengths[best.segIndex];
  return {
    kmAlong: total > 0 ? Math.round(kmAlong * 10) / 10 : null,
    totalKm: total > 0 ? Math.round(total) : null,
    pct: total > 0 ? Math.round((kmAlong / total) * 100) : null,
  };
}

export async function getCheapestStationsAlongRoute(
  origin,
  destination,
  { count = 5, maxDistanceKm = 15, route } = {}
) {
  if (!origin || !destination) return [];

  let routeCoords =
    Array.isArray(route) && route.length >= 2
      ? route
      : route?.coordinates && route.coordinates.length >= 2
        ? route.coordinates
        : null;
  if (!routeCoords) {
    try {
      const r = await getRoute(origin, destination, { geometry: true });
      if (r?.coordinates?.length >= 2) routeCoords = r.coordinates;
    } catch {
      routeCoords = null;
    }
  }

  const measure =
    routeCoords && routeCoords.length >= 2
      ? (s) => distanceToPolylineKm(s.lat, s.lon, routeCoords)
      : (s) =>
          distanceToSegment(
            s.lat,
            s.lon,
            origin.lat,
            origin.lon,
            destination.lat,
            destination.lon
          );

  const stations = await getAllFuelStations();

  return stations
    .map((s) => {
      const distanceKm = measure(s);
      const progress = routeCoords
        ? routeProgressKm(s.lat, s.lon, routeCoords)
        : { kmAlong: null, totalKm: null, pct: null };
      return {
        ...s,
        distanceKm:
          typeof distanceKm === "number"
            ? Math.round(distanceKm * 10) / 10
            : null,
        kmAlongRoute: progress.kmAlong,
        routeTotalKm: progress.totalKm,
        routePct: progress.pct,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`,
        price: Math.min(
          ...[s.gasoline, s.diesel].filter((p) => p !== null)
        ),
      };
    })
    .filter((s) => s.distanceKm !== null && s.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.price - b.price)
    .slice(0, count);
}