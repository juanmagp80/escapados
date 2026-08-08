const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function serpapiGet(endpoint, params) {
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY not configured");
  const url = new URL(`https://serpapi.com/search.json`);
  url.searchParams.set("engine", endpoint);
  url.searchParams.set("api_key", SERPAPI_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`serpapi ${endpoint} failed`);
  return res.json();
}

export async function searchHotels({ q, checkIn, checkOut, guests, currency = "EUR" }) {
  return serpapiGet("google_hotels", {
    q,
    check_in_date: checkIn,
    check_out_date: checkOut,
    adults: guests,
    currency,
  });
}

export async function searchFlights({
  departureId,
  arrivalId,
  outboundDate,
  returnDate,
  adults,
  currency = "EUR",
}) {
  return serpapiGet("google_flights", {
    departure_id: departureId,
    arrival_id: arrivalId,
    outbound_date: outboundDate,
    return_date: returnDate,
    adults,
    currency,
  });
}

export async function searchPlaces({ q, type, hl = "es", gl = "es" }) {
  return serpapiGet("google_maps", { q: `${type} en ${q}`, hl, gl, type: "search" });
}

export async function searchGoogle({ q }) {
  return serpapiGet("google", { q, hl: "es", gl: "es" });
}
