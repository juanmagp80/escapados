import { geocode } from "@/lib/maps/geocoder";
import { knownOrigin } from "@/lib/maps/knownOrigins";
import { getRoute } from "@/lib/routing/osrm";
import { carTotalCost } from "@/lib/fuel/cost";
import { getWeather, describeWeatherCode } from "@/lib/weather/openMeteo";
import { scoreDestination } from "@/lib/destinations/scoring";
import { estimateTripCost } from "@/lib/destinations/costEstimate";
import { searchFlights } from "@/lib/serpapi/providers/flights";
import { originAirport } from "@/lib/destinations/airports";
import { withFallback } from "@/lib/utils/cache";
import { formatKm, formatDuration } from "@/lib/utils/format";

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

export async function searchCommunity({
  community,
  origin,
  startDate,
  endDate,
  travelers = 2,
  transport = "car",
  budget,
  consumption = 6.5,
  fuelPrice = 1.55,
}) {
  const towns = community?.towns || [];
  if (towns.length === 0) return { error: "no-community" };

  const originCoords =
    (await withFallback(() => geocode(origin), null)) || knownOrigin(origin);
  const hasOrigin = Boolean(originCoords);
  const oLat = originCoords?.lat ?? null;
  const oLon = originCoords?.lon ?? null;
  const fromAirport = originAirport(origin);
  const MIN_FLIGHT_KM = 500;

  const destinations = (
    await Promise.all(
      towns.map(async (t) => {
        const dest = {
          name: t.name,
          slug: t.slug,
          lat: t.lat,
          lon: t.lon,
          region: t.region,
          airport: t.airport,
          image: t.image,
          distanceKm: hasOrigin ? haversine(oLat, oLon, t.lat, t.lon) : 0,
          noOrigin: !hasOrigin,
        };

        if (transport === "car") {
          if (hasOrigin) {
            const route = await withFallback(
              () => getRoute(originCoords, t),
              null
            );
            dest.distanceMeters = route ? route.distance : dest.distanceKm * 1000;
            dest.durationSeconds = route ? route.duration : null;
            dest.distanceLabel = route
              ? formatKm(route.distance)
              : `${dest.distanceKm} km`;
            dest.durationLabel = route ? formatDuration(route.duration) : "—";
            dest.carCost = carTotalCost({
              distanceMeters: dest.distanceMeters * 2,
              consumptionL100: consumption,
              fuelPrice,
            });
            dest.transportCost = dest.carCost.effective;
          } else {
            dest.transportCost = 0;
          }
          dest.transportLabel = hasOrigin
            ? "🚗 Coche (ida y vuelta)"
            : undefined;
        } else if (transport === "plane") {
          dest.transportLabel = "✈️ Vuelo";
          const canFly =
            hasOrigin &&
            t.airport &&
            t.airport !== fromAirport &&
            dest.distanceKm >= MIN_FLIGHT_KM;
          if (canFly) {
            const flight = await withFallback(
              () =>
                searchFlights({
                  departureId: fromAirport,
                  arrivalId: t.airport,
                  outboundDate: startDate,
                  returnDate: endDate,
                  adults: travelers,
                }),
              null
            );
            if (flight && flight.found) {
              dest.flight = flight;
              dest.transportCost = flight.totalPrice;
              dest.transportLabel = `✈️ ${flight.airline || "Vuelo"}`;
            } else {
              return null;
            }
          } else {
            return null;
          }
        }

        dest.transportCost = dest.transportCost || 0;
        const est = estimateTripCost({
          name: dest.name,
          region: dest.region,
          startDate,
          endDate,
          travelers: Number(travelers) || 2,
          transportCost: dest.transportCost,
        });
        dest.nights = est.nights;
        dest.hotelCost = est.hotelCost;
        dest.foodCost = est.foodCost;
        dest.activitiesCost = est.activitiesCost;
        dest.estimatedCost = est.estimatedCost;

        const weather = await withFallback(() => getWeather(t.lat, t.lon), null);
        if (weather && weather.current) {
          dest.weatherCode = weather.current.weather_code;
          dest.weatherLabel = `${Math.round(weather.current.temperature_2m)}ºC · ${describeWeatherCode(weather.current.weather_code).emoji}`;
          dest.weather = weather;
        }

        const { score, reasons } = scoreDestination(dest, {
          budget: budget ? Number(budget) : null,
        });
        dest.score = score;
        dest.reasons = reasons;
        return dest;
      })
    )
  ).filter(Boolean);

  destinations.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.estimatedCost || 0) - (a.estimatedCost || 0));

  return {
    origin: originCoords || null,
    destinations,
    best: destinations[0],
    noOrigin: !hasOrigin,
    community,
  };
}