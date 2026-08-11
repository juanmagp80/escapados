import { fileCache } from "@/lib/utils/cacheServer";

// API pública (no oficial) de Ryanair para tarifas diarias. Sin clave.
// Documentada públicamente y usada por la librería OSS @2bad/ryanair.
// Endpoint: GET /farfnd/v4/oneWayFares/{from}/{to}/cheapestPerDay?outboundMonthOfDate=YYYY-MM-01

const FARE_FINDER_API = "https://www.ryanair.com/api/farfnd/v4";

const DAY_MS = 1000 * 60 * 60 * 24;

// Las tarifas cambian a diario: caché corta, pero persistente en disco.
const cache = fileCache("ryanair-fares", 60 * 60 * 1000);

function firstDayOfMonth(date) {
  return `${date.slice(0, 8)}01`;
}

async function getCheapestPerDay(from, to, monthDate) {
  if (!from || !to) return [];
  const key = `${from}->${to}:${firstDayOfMonth(monthDate)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL(`${FARE_FINDER_API}/oneWayFares/${from}/${to}/cheapestPerDay`);
  url.searchParams.set("outboundMonthOfDate", firstDayOfMonth(monthDate));
  url.searchParams.set("currency", "EUR");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    cache: "no-store",
  });
  if (!res.ok) return cache.set(key, []);

  const data = await res.json();
  const fares = Array.isArray(data?.outbound?.fares) ? data.outbound.fares : [];
  const result = fares
    .map((f) => ({
      day: f.day || null,
      departureDate: f.departureDate || null,
      arrivalDate: f.arrivalDate || null,
      price: typeof f.price?.value === "number" ? f.price.value : null,
    }))
    .filter((f) => f.price !== null && f.day);
  return cache.set(key, result);
}

// Busca la tarifa de un día concreto (acepta flexibilidad de ±2 días).
function fareForDate(fares, date) {
  if (!date) return null;
  const exact = fares.find((f) => f.day === date);
  if (exact) return exact;
  const target = new Date(date).getTime();
  let best = null;
  for (const f of fares) {
    const diff = Math.abs(new Date(f.day).getTime() - target);
    if (diff <= 2 * DAY_MS && (!best || diff < best.diff)) best = { ...f, diff };
  }
  return best;
}

export async function searchFlightsRyanair({
  departureId,
  arrivalId,
  outboundDate,
  returnDate,
  adults = 2,
  currency = "EUR",
}) {
  const [outboundMonthly, inboundMonthly] = await Promise.all([
    getCheapestPerDay(departureId, arrivalId, outboundDate),
    returnDate ? getCheapestPerDay(arrivalId, departureId, returnDate) : Promise.resolve([]),
  ]);

  const outbound = fareForDate(outboundMonthly, outboundDate);
  const inbound = returnDate ? fareForDate(inboundMonthly, returnDate) : null;

  if (!outbound) return { found: false };

  const totalPrice =
    inbound && inbound.price !== null
      ? outbound.price + inbound.price
      : outbound.price;

  const link = new URL("https://www.ryanair.com/es/es/trip/flights/select");
  link.searchParams.set("originIata", departureId);
  link.searchParams.set("destinationIata", arrivalId);
  link.searchParams.set("adults", String(adults));
  link.searchParams.set("dateOut", outbound.day);
  if (inbound) link.searchParams.set("dateIn", inbound.day);
  link.searchParams.set("isReturn", inbound ? "true" : "false");

  return {
    found: true,
    totalPrice,
    pricePerPerson: adults > 0 ? Number((totalPrice / adults).toFixed(2)) : totalPrice,
    airline: "Ryanair",
    link: link.toString(),
    source: "Ryanair",
    outbound: {
      date: outbound.day,
      departure: outbound.departureDate,
      arrival: outbound.arrivalDate,
      price: outbound.price,
    },
    inbound: inbound
      ? {
          date: inbound.day,
          departure: inbound.departureDate,
          arrival: inbound.arrivalDate,
          price: inbound.price,
        }
      : null,
  };
}