import { localIso } from "@/lib/utils/format";

const BLABLACAR_KEY = process.env.BLABLACAR_API_KEY;

export async function searchTrips({
  fromLat,
  fromLon,
  toLat,
  toLon,
  date,
  count = 5,
}) {
  if (!BLABLACAR_KEY) throw new Error("BLABLACAR_API_KEY not configured");

  const url = new URL("https://public-api.blablacar.com/api/v3/trips");
  url.searchParams.set("key", BLABLACAR_KEY);
  url.searchParams.set("from_coordinate", `${fromLat},${fromLon}`);
  url.searchParams.set("to_coordinate", `${toLat},${toLon}`);
  url.searchParams.set("locale", "es-ES");
  url.searchParams.set("currency", "EUR");
  url.searchParams.set("start_date_local", `${date || today()}T00:00:00`);
  url.searchParams.set("count", String(count));

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`blablacar failed: ${res.status}`);
  const data = await res.json();
  return normalizeTrips(data?.trips || []);
}

export function normalizeTrips(trips) {
  return trips
    .map((t) => {
      const waypoints = Array.isArray(t.waypoints) ? t.waypoints : [];
      const first = waypoints[0];
      const last = waypoints[waypoints.length - 1];
      const price = parsePrice(t.price?.amount);
      return {
        id: t.link || null,
        link: t.link || null,
        departureTime: first?.date_time || null,
        arrivalTime: last?.date_time || null,
        departureCity: first?.place?.city || null,
        arrivalCity: last?.place?.city || null,
        durationSeconds: t.duration_in_seconds || null,
        price,
        currency: t.price?.currency || "EUR",
        seatsLeft: Number.isFinite(Number(t.seats_left))
          ? Number(t.seats_left)
          : null,
        vehicle: t.vehicle?.make
          ? [t.vehicle.make, t.vehicle.model].filter(Boolean).join(" ")
          : null,
      };
    })
    .filter((t) => t.price !== null && t.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 10);
}

export function parsePrice(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? round2(value) : null;
  const cleaned = String(value)
    .replace(/[^0-9.,]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? round2(n) : null;
}

function today() {
  return localIso();
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}