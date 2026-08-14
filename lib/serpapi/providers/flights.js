import { searchFlightsTravelpayouts } from "@/lib/travelpayouts/travelpayouts";
import { searchFlightOptionsTravelpayouts } from "@/lib/travelpayouts/travelpayouts";
import { searchFlightsRyanair } from "@/lib/ryanair/fares";

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
  // Fuente principal: Travelpayouts (Aviasales). Datos agregados/cacheados.
  try {
    const result = await searchFlightsTravelpayouts({
      departureId,
      arrivalId,
      outboundDate,
      returnDate,
      adults,
      currency,
    });
    if (result?.found) return result;
  } catch {
    // Travelpayouts sin token o con error → siguiente fuente.
  }

  try {
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

    if (flights.length > 0) {
      return {
        found: true,
        pricePerPerson:
          typeof best?.price === "number" ? best.price / (adults || 2) : null,
        totalPrice: typeof best?.price === "number" ? best.price : null,
        airline: best?.flights?.[0]?.airline || null,
        link: best?.link || data.search_metadata?.google_flights_url || null,
        source: "Google Flights",
      };
    }
  } catch {
    // SerpAPI sin cuota o con error → respaldo Ryanair.
  }

  return searchFlightsRyanair({
    departureId,
    arrivalId,
    outboundDate,
    returnDate,
    adults,
    currency,
  });
}

// Todas las combinaciones ida+vuelta del período (modo vacaciones).
// Fuente principal: Travelpayouts. Si falla, vuelve al bucle simple por fecha.
export async function searchFlightOptions({
  departureId,
  arrivalId,
  startDate,
  endDate,
  adults = 2,
  currency = "EUR",
  minNights = 2,
  maxNights = 5,
}) {
  try {
    const options = await searchFlightOptionsTravelpayouts({
      departureId,
      arrivalId,
      startDate,
      endDate,
      adults,
      currency,
      minNights,
      maxNights,
    });
    if (Array.isArray(options) && options.length > 0) {
      return options.map((o) => ({ ...o, airline: o.airline || "Aviasales" }));
    }
  } catch {
    // Travelpayouts sin token o con error → bucle de fechas por abajo.
  }

  const results = [];
  const nights = (maxNights && minNights) ? maxNights : 5;
  for (let n = minNights || 2; n <= nights; n++) {
    const outbound = startDate;
    const returnDate = new Date(new Date(startDate).getTime() + n * 86400000)
      .toISOString()
      .slice(0, 10);
    if (endDate && returnDate > endDate) break;
    const flight = await searchFlights({
      departureId,
      arrivalId,
      outboundDate: outbound,
      returnDate,
      adults,
      currency,
    });
    if (flight && flight.found) {
      results.push({ ...flight, outbound, returnDate, nights: n });
    }
  }
  results.sort((a, b) => a.totalPrice - b.totalPrice);
  return results.slice(0, 30);
}