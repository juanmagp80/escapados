const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export async function getGasStationsAlongRoute(
  origin,
  destination,
  { count = 5, route } = {}
) {
  if (!origin || !destination) return [];

  try {
    const { getCheapestStationsAlongRoute } = await import("@/lib/fuel/prices");
    const stations = await getCheapestStationsAlongRoute(origin, destination, {
      count,
      route,
    });
    if (stations.length > 0) return stations;
  } catch {
    // Si la API de precios falla, usamos Overpass como respaldo.
  }

  return getGasStationsFromOverpass(origin, destination, { count, route });
}

function sampleAlongRoute(coords, stepKm = 12) {
  const points = [];
  if (!coords || coords.length < 2) return points;
  points.push({ lat: coords[0][0], lon: coords[0][1] });
  let acc = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lat, lon] = coords[i];
    const prev = coords[i - 1];
    const d = distKm(prev[0], prev[1], lat, lon);
    acc += d;
    if (acc >= stepKm) {
      points.push({ lat, lon });
      acc = 0;
    }
  }
  const last = coords[coords.length - 1];
  if (distKm(points[points.length - 1].lat, points[points.length - 1].lon, last[0], last[1]) > 1) {
    points.push({ lat: last[0], lon: last[1] });
  }
  return points;
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

function distanceToSegmentKm(lat, lon, aLat, aLon, bLat, bLon) {
  const dAB = distKm(lat, lon, aLat, aLon);
  const dAC = distKm(lat, lon, bLat, bLon);
  const dBC = distKm(aLat, aLon, bLat, bLon);
  if (dBC === 0) return dAB;
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

function distanceToPolylineKm(lat, lon, pts) {
  let min = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanceToSegmentKm(
      lat,
      lon,
      pts[i].lat,
      pts[i].lon,
      pts[i + 1].lat,
      pts[i + 1].lon
    );
    if (d < min) min = d;
  }
  return Number.isFinite(min) ? min : null;
}

// Posición del punto a lo largo de la polilínea de la ruta (km desde el
// origen, km totales y % de avance), usando los mismos puntos muestreados.
function routeProgressKm(lat, lon, pts) {
  if (!pts || pts.length < 2) return { kmAlong: null, totalKm: null, pct: null };
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distKm(pts[i].lat, pts[i].lon, pts[i + 1].lat, pts[i + 1].lon);
    segs.push(d);
    total += d;
  }
  let before = 0;
  let bestT = null;
  let bestD = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const aLat = pts[i].lat;
    const aLon = pts[i].lon;
    const bLat = pts[i + 1].lat;
    const bLon = pts[i + 1].lon;
    const dAB = distKm(lat, lon, aLat, aLon);
    if (segs[i] === 0) {
      if (dAB < bestD) {
        bestD = dAB;
        bestT = before;
      }
      before += segs[i];
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
    if (d < bestD) {
      bestD = d;
      bestT = before + tc * segs[i];
    }
    before += segs[i];
  }
  if (bestT === null) return { kmAlong: null, totalKm: null, pct: null };
  return {
    kmAlong: total > 0 ? Math.round(bestT * 10) / 10 : null,
    totalKm: total > 0 ? Math.round(total) : null,
    pct: total > 0 ? Math.round((bestT / total) * 100) : null,
  };
}

async function getGasStationsFromOverpass(
  origin,
  destination,
  { count = 5, route } = {}
) {
  const routeCoords =
    Array.isArray(route) && route.length >= 2
      ? route
      : route?.coordinates && route.coordinates.length >= 2
        ? route.coordinates
        : null;
  let points = sampleAlongRoute(routeCoords);
  if (points.length < 2) {
    const { getRoute } = await import("@/lib/routing/osrm");
    try {
      const r = await getRoute(origin, destination, { geometry: true });
      if (r?.coordinates) points = sampleAlongRoute(r.coordinates);
    } catch {
      points = [];
    }
  }
  if (points.length < 2) {
    points = [
      { lat: origin.lat, lon: origin.lon },
      { lat: destination.lat, lon: destination.lon },
    ];
  }

  const corridorMeters = 15000;
  const queryParts = points
    .map(
      (p) =>
        `node["amenity"="fuel"](around:${corridorMeters},${p.lat},${p.lon});` +
        `way["amenity"="fuel"](around:${corridorMeters},${p.lat},${p.lon});`
    )
    .join("\n");

  const overpassQuery = `
    [out:json][timeout:30];
    (
      ${queryParts}
    );
    out center tags;
  `;

  try {
    let data = null;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Escapa2/1.0 (contacto: escapas@example.com)",
          },
          body: new URLSearchParams({ data: overpassQuery }),
          cache: "no-store",
        });
        if (!res.ok) continue;
        const json = await res.json();
        if (Array.isArray(json.elements)) {
          data = json;
          break;
        }
      } catch {
        continue;
      }
    }
    if (!data) return [];

    const seen = new Set();
    const stations = (data.elements || [])
      .map((el) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        if (el.id && seen.has(el.id)) return null;
        if (el.id) seen.add(el.id);
        const progress = routeProgressKm(lat, lon, points);
        return {
          id: el.id,
          name: el.tags?.name || "Gasolinera",
          brand: el.tags?.brand || null,
          lat,
          lon,
          address: [
            el.tags?.["addr:street"],
            el.tags?.["addr:housenumber"],
            el.tags?.["addr:postcode"],
            el.tags?.["addr:city"],
          ].filter(Boolean).join(", ") || null,
          price: null,
          gasoline: null,
          diesel: null,
          distanceKm:
            points.length >= 2
              ? Math.round(distanceToPolylineKm(lat, lon, points) * 10) / 10
              : null,
          kmAlongRoute: progress.kmAlong,
          routeTotalKm: progress.totalKm,
          routePct: progress.pct,
          mapsUrl:
            lat && lon
              ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
              : null,
          currency: "EUR",
          openingHours: el.tags?.opening_hours || null,
          payment: el.tags?.payment || null,
        };
      })
      .filter(Boolean);

    return stations
      .filter((s) => s.lat && s.lon)
      .slice(0, count)
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } catch {
    return [];
  }
}

export async function getGasStationsNear(lat, lon, radiusKm = 10) {
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["amenity"="fuel"](around:${radiusKm * 1000},${lat},${lon});
      way["amenity"="fuel"](around:${radiusKm * 1000},${lat},${lon});
    );
    out center tags;
  `;

  try {
    let data = null;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Escapa2/1.0 (contacto: escapas@example.com)",
          },
          body: new URLSearchParams({ data: overpassQuery }),
          cache: "no-store",
        });
        if (!res.ok) continue;
        const json = await res.json();
        if (Array.isArray(json.elements)) {
          data = json;
          break;
        }
      } catch {
        continue;
      }
    }
    if (!data) return [];
    return (data.elements || []).map((el) => ({
      id: el.id,
      name: el.tags?.name || "Gasolinera",
      brand: el.tags?.brand || null,
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon,
      address: [
        el.tags?.["addr:street"],
        el.tags?.["addr:housenumber"],
        el.tags?.["addr:postcode"],
        el.tags?.["addr:city"],
      ].filter(Boolean).join(", ") || null,
      price: null,
      openingHours: el.tags?.opening_hours || null,
    })).filter((s) => s.lat && s.lon).slice(0, 15);
  } catch {
    return [];
  }
}