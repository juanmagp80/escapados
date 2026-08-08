const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function serpapiGet(endpoint, params) {
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY not configured");
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", endpoint);
  url.searchParams.set("api_key", SERPAPI_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`serpapi ${endpoint} failed`);
  return res.json();
}

export async function searchFlights({
  departureId,
  arrivalId,
  outboundDate,
  returnDate,
  adults = 2,
  currency = "EUR",
}) {
  const data = await serpapiGet("google_flights", {
    departure_id: departureId,
    arrival_id: arrivalId,
    outbound_date: outboundDate,
    return_date: returnDate,
    adults,
    currency,
  });

  if (data.error) throw new Error(data.error);

  const flights = Array.isArray(data.best_flights)
    ? data.best_flights
    : [];
  const best = flights[0];

  return {
    found: flights.length > 0,
    pricePerPerson:
      typeof best?.price === "number" ? best.price / (adults || 2) : null,
    totalPrice: typeof best?.price === "number" ? best.price : null,
    airline: best?.flights?.[0]?.airline || null,
    link: best?.link || data.search_metadata?.google_flights_url || null,
    source: "Google Flights",
  };
}
