const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export async function getGasStationsAlongRoute(origin, destination, count = 5) {
  if (!origin || !destination) return [];

  try {
    const { getCheapestStationsAlongRoute } = await import("@/lib/fuel/prices");
    const stations = await getCheapestStationsAlongRoute(origin, destination, {
      count,
    });
    if (stations.length > 0) return stations;
  } catch {
    // Si la API de precios falla, usamos Overpass como respaldo.
  }

  return getGasStationsFromOverpass(origin, destination, count);
}

async function getGasStationsFromOverpass(origin, destination, count = 5) {
  const midLat = (origin.lat + destination.lat) / 2;
  const midLon = (origin.lon + destination.lon) / 2;
  const radiusKm = Math.max(
    20,
    Math.round(
      Math.sqrt(
        Math.pow(origin.lat - destination.lat, 2) +
          Math.pow(origin.lon - destination.lon, 2)
      ) * 111 / 2
    )
  );

  const overpassQuery = `
    [out:json][timeout:15];
    (
      node["amenity"="fuel"](around:${radiusKm * 1000},${midLat},${midLon});
      way["amenity"="fuel"](around:${radiusKm * 1000},${midLat},${midLon});
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

    const stations = (data.elements || []).map((el) => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
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
        distanceKm: null,
        mapsUrl:
          lat && lon
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            : null,
        currency: "EUR",
        openingHours: el.tags?.opening_hours || null,
        payment: el.tags?.payment || null,
      };
    });

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