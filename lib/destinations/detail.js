import { geocode } from "@/lib/maps/nominatim";
import { getRoute } from "@/lib/routing/osrm";
import { getWeather, describeWeatherCode } from "@/lib/weather/openMeteo";
import { carTotalCost } from "@/lib/fuel/cost";
import { searchFlights } from "@/lib/serpapi/providers/flights";
import { airportFor, originAirport } from "@/lib/destinations/airports";
import { findDestination } from "@/lib/destinations/catalog";
import { formatEuro, formatKm, formatDuration, nightsBetween } from "@/lib/utils/format";
import { withFallback } from "@/lib/utils/cache";

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

export async function getDestinationDetail({ slug, origin, transport, startDate, endDate, travelers = 2, consumption = 6.5, fuelPrice = 1.55 }) {
  const catalog = findDestination(slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  const name = catalog?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  if (transport === "car" && route) {
    carCost = carTotalCost({ distanceMeters: route.distance * 2, consumptionL100: consumption, fuelPrice });
  } else if (transport === "plane") {
    const fromAirport = originAirport(origin);
    const toAirport = catalog?.airport || airportFor(name);
    const distanceKm =
      originCoords && destinationData?.lat
        ? haversine(originCoords.lat, originCoords.lon, destinationData.lat, destinationData.lon)
        : 0;
    if (
      fromAirport &&
      toAirport &&
      fromAirport !== toAirport &&
      distanceKm >= MIN_FLIGHT_KM
    ) {
      flight = await withFallback(
        () =>
          searchFlights({
            departureId: fromAirport,
            arrivalId: toAirport,
            outboundDate: startDate,
            returnDate: endDate,
            adults: travelers,
          }),
        null
      );
      if (flight && !flight.found) flight = null;
    }
  }

  return {
    name,
    destination: destinationData,
    image: catalog?.image || null,
    region: catalog?.region || null,
    route,
    weather,
    carCost,
    flight,
    origin: originCoords ? { lat: originCoords.lat, lon: originCoords.lon, name: origin } : null,
  };
}
