import { geocode } from "@/lib/maps/geocoder";

// Adjunta coordenadas (lat/lon) a restaurantes y atracciones generados por
// Gemini o SerpAPI, que no incluyen posición. Se usa el geocodificador con
// caché existente (Geoapify 3000 req/día, fallback Nominatim).
// Solo se ejecuta si hay Geoapify configurado: hacer 6-8 geocodificaciones
// con Nominatim (1 req/s) por cada sección alargaría demasiado la espera.
const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

export async function enrichPlacesWithCoords(items, destination) {
  if (!GEOAPIFY_KEY || !Array.isArray(items) || items.length === 0) return items;

  const results = await Promise.all(
    items.map(async (p) => {
      if (p && p.lat != null && p.lon != null) return p;
      const query = [p?.name, p?.address, destination].filter(Boolean).join(", ");
      if (!query) return p;
      let coords = null;
      try {
        coords = await geocode(query);
      } catch {
        coords = null;
      }
      if (!coords) return p;
      return { ...p, lat: coords.lat, lon: coords.lon };
    })
  );
  return results;
}