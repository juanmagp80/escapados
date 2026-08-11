// Stay22: precios reales y reservas (Booking.com, VRBO, Expedia, Hotels.com)
// en un esquema unificado. Gratis al registrarse (150 req/min con clave).
// Clave: https://hub.stay22.com (API key → X-API-KEY).
// Restricción: no se pueden guardar los listados en BD; se consumen en vivo.
const ENDPOINT = "https://api.stay22.com/v2/accommodations";

const STAY22_API_KEY = process.env.STAY22_API_KEY;

export async function getHotelsFromStay22({
  q,
  checkIn,
  checkOut,
  guests = 2,
  lat,
  lon,
  maxPricePerNight,
}) {
  if (!STAY22_API_KEY) return [];
  if (!q && (lat == null || lon == null)) return [];

  const url = new URL(ENDPOINT);
  if (lat != null && lon != null) {
    // El método por coordenadas resuelve mejor pueblos y playas pequeños;
    // `address` solo funciona bien con ciudades grandes.
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lon));
    url.searchParams.set("radius", "10000");
  } else if (q) {
    url.searchParams.set("address", q);
  } else {
    return [];
  }
  if (checkIn) url.searchParams.set("checkin", checkIn);
  if (checkOut) url.searchParams.set("checkout", checkOut);
  url.searchParams.set("adults", String(guests));
  url.searchParams.set("currency", "EUR");
  url.searchParams.set("lang", "es");
  url.searchParams.set("pageSize", "8");

  let res;
  try {
    res = await fetch(url, {
      headers: { "X-API-KEY": STAY22_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return [];
  } catch {
    return [];
  }

  let body;
  try {
    body = await res.json();
  } catch {
    return [];
  }

  const results = Array.isArray(body?.results) ? body.results : [];
  if (!results.length) return [];

  const nights = Number(body?.meta?.nights) || 1;
  const limit = Number.isFinite(Number(maxPricePerNight))
    ? Number(maxPricePerNight)
    : null;

  return results
    .map((p) => {
      const suppliers = p.suppliers || {};
      // Mejor oferta disponible entre los proveedores del alojamiento.
      const best = Object.entries(suppliers)
        .map(([provider, s]) => ({ provider, ...s }))
        .sort(
          (a, b) => (a.price?.total ?? Infinity) - (b.price?.total ?? Infinity)
        )[0];
      const total = best?.price?.total ?? null;
      const perNight =
        Number.isFinite(total) && nights > 0
          ? Math.round((total / nights) * 100) / 100
          : null;
      const value = p.rating?.value;
      return {
        name: p.name || "Alojamiento",
        image: p.media?.thumbnail || null,
        lat: p.location?.coordinates?.lat ?? null,
        lon: p.location?.coordinates?.lng ?? null,
        pricePerNight: perNight,
        priceTotal: Number.isFinite(total) ? total : null,
        rating:
          typeof value === "number"
            ? Math.round((value / 2) * 10) / 10
            : p.rating?.hotelStars ?? null,
        reviews: p.rating?.count ?? null,
        nights: nights,
        address: p.location?.address ?? null,
        distanceKm: null,
        link: best?.link || p.url || null,
      };
    })
    .filter((h) => h.pricePerNight != null)
    .filter((h) => limit == null || h.pricePerNight <= limit)
    .slice(0, 8);
}
