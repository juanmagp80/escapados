const ENDPOINT = "https://api.stayingapi.com/v1/search";

// StayingAPI: precios reales de alojamientos (Booking.com, Google Hotels…)
// en un esquema unificado.
// Las claves `stay_test_` (sandbox) devuelven SIEMPRE las mismas fixtures de
// ejemplo, sin relación con el destino pedido, así que se ignoran para no
// mostrar apartamentos de Croacia al buscar Conil. Solo `stay_live_` sirve.
const STAYINGAPI_KEY = process.env.STAYINGAPI_KEY;
const IS_SANDBOX = String(STAYINGAPI_KEY || "").startsWith("stay_test_");

export async function getHotelsFromStaying({
  q,
  checkIn,
  checkOut,
  guests = 2,
  lat,
  lon,
  maxPricePerNight,
}) {
  if (!STAYINGAPI_KEY || IS_SANDBOX) return [];
  if (!q || !checkIn || !checkOut) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set("location", q);
  url.searchParams.set("checkIn", checkIn);
  url.searchParams.set("checkOut", checkOut);
  url.searchParams.set("adults", String(guests));
  url.searchParams.set("currency", "EUR");
  url.searchParams.set("platforms", "booking");
  url.searchParams.set("limit", "8");
  url.searchParams.set("sort", "price_asc");

  let res;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${STAYINGAPI_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
  } catch {
    return [];
  }

  // La API live procesa la búsqueda en segundo plano: lanza un job (202)
  // que hay que consultar hasta que termina (suele tardar 15-90 s).
  let body;
  try {
    body = await res.json();
  } catch {
    return [];
  }

  const data = body?.data;
  let items = Array.isArray(data) ? data : null;
  if (!items && data?.jobId) {
    const polled = await pollJob(data.jobId);
    items = Array.isArray(polled) ? polled : null;
  }
  if (!items) return [];

  const limit = Number.isFinite(Number(maxPricePerNight))
    ? Number(maxPricePerNight)
    : null;
  return items
    .map((p) => {
      const pn = p.price?.nightlyPrice;
      const total = p.price?.totalPrice;
      return {
        name: p.name || "Alojamiento",
        image: Array.isArray(p.images) ? p.images[0] : null,
        lat: p.location?.lat ?? null,
        lon: p.location?.lng ?? null,
        pricePerNight: Number.isFinite(pn) ? pn : null,
        priceTotal: Number.isFinite(total) ? total : null,
        rating:
          typeof p.guestRating === "number" && (p.ratingScale || 10)
            ? Math.round((p.guestRating / (p.ratingScale || 10)) * 5 * 10) / 10
            : p.starRating
              ? Number(p.starRating)
              : null,
        reviews: p.reviewCount ?? null,
        nights: p.price?.nights ?? null,
        address: p.location?.address ?? null,
        distanceKm:
          lat != null && lon != null && p.location?.lat != null
            ? Math.round(
                distKm(lat, lon, p.location.lat, p.location.lng) * 10
              ) / 10
            : null,
        link:
          p.price?.url ||
          p.url ||
          (p.location?.lat != null
            ? `https://www.google.com/maps/search/?api=1&query=${p.location.lat},${p.location.lng}`
            : null),
      };
    })
    .filter((h) => h.pricePerNight != null)
    .filter((h) => limit == null || h.pricePerNight <= limit)
    .slice(0, 8);
}

// Consulta el estado de un job hasta que termina (o hasta el timeout).
// Se limita a 30 s: si StayingAPI no responde a tiempo, la cadena cae a
// Stay22 (rápido) o Overpass en lugar de bloquear la página durante minutos.
async function pollJob(jobId, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`https://api.stayingapi.com/v1/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${STAYINGAPI_KEY}` },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const body = await res.json();
      const status = body?.data?.status;
      if (status === "completed") return Array.isArray(body?.data?.result) ? body.data.result : [];
      if (status === "failed" || status === "cancelled") return null;
    } catch {
      // reintentar hasta que se agote el tiempo
    }
    await sleep(5000);
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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