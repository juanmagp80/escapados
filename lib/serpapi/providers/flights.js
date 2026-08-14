import { searchFlightsTravelpayouts } from "@/lib/travelpayouts/travelpayouts";
import { searchFlightOptionsTravelpayouts } from "@/lib/travelpayouts/travelpayouts";
import { searchFlightsRyanair } from "@/lib/ryanair/fares";
import { inMemoryCache } from "@/lib/utils/cache";

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Caché en memoria para resultados de búsqueda de vuelos (10 minutos)
const flightSearchCache = inMemoryCache(10 * 60 * 1000);

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
  const cacheKey = `flight:${departureId}-${arrivalId}:${outboundDate}:${returnDate}:${adults}:${currency}`;
  const cached = flightSearchCache.get(cacheKey);
  if (cached) return cached;

  // Fuente principal: Travelpayouts (Aviasales). Datos agregados/cacheados.
  // Usa caché de viajes redondos (3h) para consistencia.
  let result;
  try {
    result = await searchFlightsTravelpayouts({
      departureId,
      arrivalId,
      outboundDate,
      returnDate,
      adults,
      currency,
    });
    if (result?.found) {
      flightSearchCache.set(cacheKey, result);
      return result;
    }
  } catch {
    // Travelpayouts sin token o con error → siguiente fuente.
  }

  // Segunda fuente: SerpAPI Google Flights (tiempo real pero cuota limitada)
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
      result = {
        found: true,
        pricePerPerson:
          typeof best?.price === "number" ? best.price / (adults || 2) : null,
        totalPrice: typeof best?.price === "number" ? best.price : null,
        airline: best?.flights?.[0]?.airline || null,
        link: best?.link || data.search_metadata?.google_flights_url || null,
        source: "Google Flights",
      };
      flightSearchCache.set(cacheKey, result);
      return result;
    }
  } catch {
    // SerpAPI sin cuota o con error → respaldo Ryanair.
  }

  // Último recurso: Ryanair (solo vuelos Ryanair)
  result = await searchFlightsRyanair({
    departureId,
    arrivalId,
    outboundDate,
    returnDate,
    adults,
    currency,
  });
  
  if (result?.found) {
    flightSearchCache.set(cacheKey, result);
  }
  return result;
}

// Todas las combinaciones ida+vuelta del período (modo vacaciones).
// Fuente principal: Travelpayouts cheap API (precios reales ida+vuelta).
// Si falla, usa month-matrix combinado. Último recurso: bucle simple por fecha.
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
  const cacheKey = `flight-options:${departureId}-${arrivalId}:${startDate}:${endDate}:${adults}:${currency}:${minNights}:${maxNights}`;
  const cached = flightSearchCache.get(cacheKey);
  if (cached) return cached;

  let result;
  try {
    result = await searchFlightOptionsTravelpayouts({
      departureId,
      arrivalId,
      startDate,
      endDate,
      adults,
      currency,
      minNights,
      maxNights,
    });
    if (Array.isArray(result) && result.length > 0) {
      result = result.map((o) => ({ ...o, airline: o.airline || "Aviasales" }));
      flightSearchCache.set(cacheKey, result);
      return result;
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
  result = results.slice(0, 30);
  flightSearchCache.set(cacheKey, result);
  return result;
}