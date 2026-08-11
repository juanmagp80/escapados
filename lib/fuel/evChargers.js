// Búsqueda de puntos de carga eléctrica en OpenStreetMap vía Overpass API.
// Sin API key, gratis, con rate-limit razonable.

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export async function findEVChargers({ lat, lon, radiusKm = 10, limit = 20 }) {
    if (lat === undefined || lon === undefined) return [];

    const radiusMeters = radiusKm * 1000;
    const query = `
    [out:json][timeout:15];
    (
      node["amenity"="charging_station"](around:${radiusMeters},${lat},${lon});
      way["amenity"="charging_station"](around:${radiusMeters},${lat},${lon});
    );
    out center ${limit};
  `;

    try {
        const res = await fetch(OVERPASS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `data=${encodeURIComponent(query)}`,
            cache: "no-store",
        });
        if (!res.ok) throw new Error(`overpass failed: ${res.status}`);
        const data = await res.json();

        return (data.elements || [])
            .map((el) => {
                const c = el.center || el;
                return {
                    id: el.id,
                    name: el.tags?.name || el.tags?.operator || "Punto de carga",
                    operator: el.tags?.operator || null,
                    lat: c.lat,
                    lon: c.lon,
                    sockets: el.tags?.socket || null,
                    capacity: el.tags?.capacity || null,
                    fee: el.tags?.fee || null,
                    access: el.tags?.access || null,
                };
            })
            .filter((c) => c.lat && c.lon)
            .slice(0, limit);
    } catch {
        return [];
    }
}