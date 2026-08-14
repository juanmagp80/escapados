import { airportFor, originAirport } from "@/lib/destinations/airports";
import { findDestination } from "@/lib/destinations/catalog";
import { analyzeBridge } from "@/lib/destinations/holidays";
import { carTotalCost } from "@/lib/fuel/cost";
import { geocode } from "@/lib/maps/geocoder";
import { getRoute } from "@/lib/routing/osrm";
import { searchFlights } from "@/lib/serpapi/providers/flights";
import { searchFlightOptions } from "@/lib/serpapi/providers/flights";
import { withFallback } from "@/lib/utils/cache";
import { addDaysIso, nightsBetween } from "@/lib/utils/format";
import { getWeather } from "@/lib/weather/openMeteo";

const MIN_FLIGHT_KM = 500;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Fines de semana del mes: jue→lun, vie→dom, vie→lun y sáb→lun.
function weekendPairsInMonth(startDate) {
  const d = new Date(`${startDate}T12:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  const pairs = [];
  const last = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day + 3 <= last; day++) {
    const dow = new Date(year, month, day).getDay();
    const isoBase = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dow === 4) {
      pairs.push({ outbound: isoBase, returnDate: addDaysIso(isoBase, 4) });
    } else if (dow === 5) {
      pairs.push({ outbound: isoBase, returnDate: addDaysIso(isoBase, 2) });
      pairs.push({ outbound: isoBase, returnDate: addDaysIso(isoBase, 3) });
    } else if (dow === 6) {
      pairs.push({ outbound: isoBase, returnDate: addDaysIso(isoBase, 2) });
    }
  }
  return pairs;
}

async function flightFor(dept, arr, outboundDate, returnDate, adults) {
  const f = await withFallback(
    () => searchFlights({ departureId: dept, arrivalId: arr, outboundDate, returnDate, adults }),
    null
  );
  return f && f.found ? f : null;
}

export async function getDestinationDetail({
  slug,
  destinationName,
  origin,
  transport,
  startDate,
  endDate,
  travelers = 2,
  consumption = 6.5,
  fuelPrice = 1.55,
  flexible = false,
  wholeMonth = false,
  vacations = false,
  airport,
}) {
  const fromSlug = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const catalog =
    findDestination(fromSlug) ||
    (destinationName ? findDestination(destinationName) : null);
  const name = destinationName?.trim() || catalog?.name || fromSlug;
  const destination = await withFallback(() => geocode(name), null);
  if (!destination && !catalog) return null;

  const destinationData = destination || (catalog ? { lat: catalog.lat, lon: catalog.lon } : null);
  if (!destinationData) return null;

  const originCoords = await withFallback(() => geocode(origin), null);
  let route = null;
  if (originCoords) route = await withFallback(() => getRoute(originCoords, destinationData, { geometry: true }), null);

  const weather = await withFallback(() => getWeather(destinationData.lat, destinationData.lon), null);

  let carCost = null;
  let flight = null;
  let flightOptions = [];
  let flexibleOptions = [];
  if (transport === "car" && route) {
    carCost = carTotalCost({ distanceMeters: route.distance * 2, consumptionL100: consumption, fuelPrice });
  } else if (transport === "plane") {
    const fromAirport = originAirport(origin);
    const toAirport = airport || catalog?.airport || airportFor(name);
    const distanceKm =
      originCoords && destinationData?.lat
        ? haversine(originCoords.lat, originCoords.lon, destinationData.lat, destinationData.lon)
        : 0;
    const canFly =
      fromAirport &&
      toAirport &&
      fromAirport !== toAirport &&
      distanceKm >= MIN_FLIGHT_KM;

    if (canFly && vacations && startDate && endDate) {
      // Vacaciones: todas las combinaciones ida+vuelta de 2-5 noches dentro
      // del período (igual que en la búsqueda principal).
      const options = await withFallback(
        () =>
          searchFlightOptions({
            departureId: fromAirport,
            arrivalId: toAirport,
            startDate,
            endDate,
            adults: travelers,
            minNights: 2,
            maxNights: 5,
          }),
        []
      );
      flightOptions = options.map((o) => ({
        ...o,
        nights: nightsBetween(o.outbound, o.returnDate) || 0,
      }));
      flightOptions.sort((a, b) => a.totalPrice - b.totalPrice);
      flight = flightOptions[0] || null;
    } else if (canFly && wholeMonth && startDate) {
      const nights = nightsBetween(startDate, endDate) || 2;
      for (const { outbound, returnDate } of weekendPairsInMonth(startDate)) {
        const f = await flightFor(fromAirport, toAirport, outbound, returnDate, travelers);
        if (f) flightOptions.push({ ...f, outbound, returnDate, nights });
      }
      flightOptions.sort((a, b) => a.totalPrice - b.totalPrice);
      flight = flightOptions[0] || null;
    } else if (canFly && flexible && startDate && endDate) {
      const nights = nightsBetween(startDate, endDate) || 2;
      for (let delta = -2; delta <= 2; delta++) {
        const outbound = addDaysIso(startDate, delta);
        const f = await flightFor(fromAirport, toAirport, outbound, addDaysIso(outbound, nights), travelers);
        if (f) flexibleOptions.push({ ...f, outbound, returnDate: addDaysIso(outbound, nights), nights });
      }
      flexibleOptions.sort((a, b) => a.totalPrice - b.totalPrice);
      flight = flexibleOptions[0] || null;
    } else if (canFly) {
      flight = await flightFor(fromAirport, toAirport, startDate, endDate, travelers);
    }
  }

  return {
    name,
    destination: destinationData,
    image:
      catalog?.image ||
      `https://loremflickr.com/800/600/${encodeURIComponent(name)}`,
    region: catalog?.region || null,
    bridge: analyzeBridge(startDate, endDate),
    route,
    weather,
    carCost,
    flight,
    flightOptions,
    flexibleOptions,
    origin: originCoords ? { lat: originCoords.lat, lon: originCoords.lon, name: origin } : null,
  };
}
