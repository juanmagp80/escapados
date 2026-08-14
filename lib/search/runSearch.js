import { originAirport } from "@/lib/destinations/airports";
import { candidateDestinations } from "@/lib/destinations/catalog";
import { estimateTripCost } from "@/lib/destinations/costEstimate";
import { analyzeBridge } from "@/lib/destinations/holidays";
import { destinationInterests } from "@/lib/destinations/interests";
import { scoreDestination } from "@/lib/destinations/scoring";
import { carTotalCost } from "@/lib/fuel/cost";
import { geocode } from "@/lib/maps/geocoder";
import { knownOrigin } from "@/lib/maps/knownOrigins";
import { getRoute } from "@/lib/routing/osrm";
import { searchFlights } from "@/lib/serpapi/providers/flights";
import { searchFlightOptions } from "@/lib/serpapi/providers/flights";
import { flightDestinations } from "@/lib/travelpayouts/travelpayouts";
import { withFallback } from "@/lib/utils/cache";
import { addDaysIso, formatDuration, formatKm, localIso } from "@/lib/utils/format";
import { describeWeatherCode, getWeather } from "@/lib/weather/openMeteo";

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

function iso(offsetDays) {
  return localIso(new Date(Date.now() + offsetDays * 86400000));
}

function addDays(dateStr, days) {
  return addDaysIso(dateStr, days);
}

function nightsBetweenOut(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function weekendPairsInMonth(startDate) {
  const d = new Date(startDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const pairs = [];
  const last = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day + 3 <= last; day++) {
    const dow = new Date(year, month, day).getDay(); // 4=Thu, 5=Fri, 6=Sat
    const isoBase = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dow === 4) {
      pairs.push({ outbound: isoBase, returnDate: addDays(isoBase, 4) }); // jue→lun
    } else if (dow === 5) {
      pairs.push({ outbound: isoBase, returnDate: addDays(isoBase, 2) }); // vie→dom
      pairs.push({ outbound: isoBase, returnDate: addDays(isoBase, 3) }); // vie→lun
    } else if (dow === 6) {
      pairs.push({ outbound: isoBase, returnDate: addDays(isoBase, 2) }); // sáb→lun
    }
  }
  return pairs;
}

// Periodos de escapada considerados en el modo vacaciones: 2, 3, 4 y 5 días.
const VACATION_PERIODS = [2, 3, 4, 5];
// Límite de combinaciones por destino para no disparar las llamadas a las
// APIs de vuelos en ventanas muy largas. Con 2-5 días cubre una ventana de
// ~16 días por completo; más allá se trunca (cronológico).
const VACATION_MAX_PAIRS = 80;

// Todas las combinaciones posibles de (ida, vuelta) dentro de un período de
// vacaciones [startDate, endDate]: para cada día de inicio y cada periodo de
// 2-5 días que quepa en la ventana. Ordenadas cronológicamente.
export function vacationPairs(startDate, endDate, periods = VACATION_PERIODS) {
  if (!startDate || !endDate || startDate > endDate) return [];
  const durations = Array.isArray(periods) && periods.length ? periods : VACATION_PERIODS;
  const minPeriod = Math.min(...durations);
  const pairs = [];
  let outbound = startDate;
  while (outbound <= addDays(endDate, -minPeriod)) {
    for (const d of durations) {
      if (d < minPeriod) continue;
      const returnDate = addDays(outbound, d);
      if (returnDate > endDate) break;
      pairs.push({ outbound, returnDate, nights: d });
      if (pairs.length >= VACATION_MAX_PAIRS) return pairs;
    }
    outbound = addDays(outbound, 1);
  }
  return pairs;
}

export async function runSearch({
  origin,
  startDate,
  endDate,
  travelers,
  transport,
  budget,
  region,
  maxKm,
  wholeMonth = false,
  flexible = false,
  vacations = false,
  consumption = 6.5,
  fuelPrice = 1.55,
  interests = [],
}) {
  const normalizedMaxKm =
    maxKm !== undefined && maxKm !== null && maxKm !== "" ? Number(maxKm) : undefined;
  const normalizedRegion =
    region && region !== "any" ? region : undefined;
  const originCoords =
    (await withFallback(() => geocode(origin), null)) || knownOrigin(origin);
  if (!originCoords) return { error: "no-origin" };

  const oLat = originCoords.lat ?? knownOrigin(origin)?.lat;
  const oLon = originCoords.lon ?? knownOrigin(origin)?.lon;

  const fromAirport = originAirport(origin);
  const MIN_FLIGHT_KM = 500;

  // En modo avión, candidatos dinámicos (destinos con vuelos reales desde el
  // aeropuerto de origen) en lugar del catálogo fijo de carretera.
  let names = candidateDestinations(origin, {
    region: normalizedRegion,
    maxKm: normalizedMaxKm,
    originLat: oLat,
    originLon: oLon,
  });
  if (transport === "plane" && fromAirport) {
    const dynamic = await withFallback(
      () =>
        flightDestinations(fromAirport, {
          limit: 80,
          startDate,
          endDate,
        }),
      []
    );
    if (dynamic.length > 0) {
      const catalogBySlug = names.reduce((acc, d) => {
        acc[d.slug] = d;
        return acc;
      }, {});
      const merged = [];
      const added = new Set();
      // En modo avión usamos SOLO destinos con vuelo real (los dinámicos).
      // Si un destino dinámico coincide con el catálogo local, nos quedamos
      // con la versión del catálogo (imagen/región/airport fiables).
      for (const d of dynamic) {
        const key = d.slug;
        if (added.has(key)) continue;
        const existing = catalogBySlug[key];
        // La imagen del dinámico ya está resuelta con prioridad Wikipedia
        // (monumentos/edificios reales), así que gana. El catálogo local solo
        // se usa como respaldo cuando el dinámico no aporta foto.
        const bestImage =
          d.image && !d.image.includes("loremflickr")
            ? d.image
            : existing?.image || d.image;
        merged.push(
          existing
            ? { ...existing, priceHint: d.priceHint, image: bestImage }
            : { ...d, image: bestImage }
        );
        added.add(key);
      }
      names = merged;
    }
  }

  const destinations = (
    await Promise.all(
      names.map(async (d) => {
        const dest = {
          name: d.name,
          slug: d.slug,
          lat: d.lat,
          lon: d.lon,
          region: d.region,
          image: d.image,
          interests: destinationInterests(d.slug),
          distanceKm: haversine(oLat, oLon, d.lat, d.lon),
        };
        if (d.airport) dest.airport = d.airport;

        if (transport === "car") {
          const route = await withFallback(
            () => getRoute(originCoords, d),
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
          dest.transportLabel = "🚗 Coche (ida y vuelta)";

          // Vacaciones en coche: combina escapadas de 2-5 días dentro de la
          // ventana. El coste de transporte es fijo; el alojamiento, comida y
          // actividades escalan con las noches de cada combinación.
          if (vacations && startDate && endDate) {
            dest.comboOptions = vacationPairs(startDate, endDate).map((p) => {
              const est = estimateTripCost({
                name: dest.name,
                region: dest.region,
                startDate: p.outbound,
                endDate: p.returnDate,
                travelers: Number(travelers) || 2,
                transportCost: dest.carCost.effective,
              });
              return {
                outbound: p.outbound,
                returnDate: p.returnDate,
                nights: p.nights,
                transportCost: dest.carCost.effective,
                estimatedCost: est.estimatedCost,
                distanceLabel: dest.distanceLabel,
                durationLabel: dest.durationLabel,
                image: dest.image,
              };
            });
          }
        } else if (transport === "plane") {
          const toAirport = d.airport;
          dest.transportLabel = "✈️ Vuelo";
          const canFly =
            toAirport && toAirport !== fromAirport && dest.distanceKm >= MIN_FLIGHT_KM;

          if (canFly && (wholeMonth || vacations) && startDate) {
            // Todas las combinaciones posibles dentro del período: un mes
            // entero de fines de semana o la ventana completa de vacaciones.
            const pairs = vacations
              ? vacationPairs(startDate, endDate)
              : weekendPairsInMonth(startDate);
            let monthFlights = [];
            if (vacations) {
              // Travelpayouts: todas las combinaciones ida+vuelta del período
              // en una sola llamada (más opciones y más baratas).
              monthFlights = await withFallback(
                () =>
                  searchFlightOptions({
                    departureId: fromAirport,
                    arrivalId: toAirport,
                    startDate,
                    endDate,
                    adults: travelers,
                    minNights: Math.min(...VACATION_PERIODS),
                    maxNights: Math.max(...VACATION_PERIODS),
                  }),
                []
              );
            }
            if (vacations && monthFlights.length === 0) {
              // Fallback: bucle por cada par de fechas.
              for (const { outbound, returnDate } of pairs) {
                const flight = await withFallback(
                  () =>
                    searchFlights({
                      departureId: fromAirport,
                      arrivalId: toAirport,
                      outboundDate: outbound,
                      returnDate,
                      adults: travelers,
                    }),
                  null
                );
                if (flight && flight.found) {
                  monthFlights.push({
                    ...flight,
                    outbound,
                    returnDate,
                    nights: nightsBetweenOut(outbound, returnDate),
                  });
                }
              }
            } else if (!vacations) {
              for (const { outbound, returnDate } of pairs) {
                const flight = await withFallback(
                  () =>
                    searchFlights({
                      departureId: fromAirport,
                      arrivalId: toAirport,
                      outboundDate: outbound,
                      returnDate,
                      adults: travelers,
                    }),
                  null
                );
                if (flight && flight.found) {
                  monthFlights.push({
                    ...flight,
                    outbound,
                    returnDate,
                    nights: nightsBetweenOut(outbound, returnDate),
                  });
                }
              }
            }
            if (monthFlights.length > 0) {
              monthFlights.sort((a, b) => a.totalPrice - b.totalPrice);
              dest.flightOptions = monthFlights;
              dest.flight = monthFlights[0];
              dest.bestDates = {
                outbound: monthFlights[0].outbound,
                returnDate: monthFlights[0].returnDate,
              };
              dest.transportCost = monthFlights[0].totalPrice;
              dest.transportLabel = `✈️ ${monthFlights[0].airline || "Vuelo"} (${vacations ? "vacaciones" : "mes"})`;
            } else {
              return null;
            }
          } else if (canFly && flexible && startDate && endDate) {
            // Fechas flexibles: prueba ±2 días de salida manteniendo las noches.
            const nights = nightsBetweenOut(startDate, endDate) || 2;
            const flexibleFlights = [];
            for (let delta = -2; delta <= 2; delta++) {
              const outbound = addDays(startDate, delta);
              const returnDate = addDays(outbound, nights);
              const flight = await withFallback(
                () =>
                  searchFlights({
                    departureId: fromAirport,
                    arrivalId: toAirport,
                    outboundDate: outbound,
                    returnDate,
                    adults: travelers,
                  }),
                null
              );
              if (flight && flight.found) {
                flexibleFlights.push({ ...flight, outbound, returnDate });
              }
            }
            if (flexibleFlights.length > 0) {
              flexibleFlights.sort((a, b) => a.totalPrice - b.totalPrice);
              dest.flexibleOptions = flexibleFlights.map((f) => ({
                ...f,
                nights,
              }));
              dest.flight = flexibleFlights[0];
              dest.bestDates = {
                outbound: flexibleFlights[0].outbound,
                returnDate: flexibleFlights[0].returnDate,
              };
              dest.transportCost = flexibleFlights[0].totalPrice;
              dest.transportLabel = `✈️ ${flexibleFlights[0].airline || "Vuelo"} (fechas flexibles)`;
            } else {
              return null;
            }
          } else if (canFly) {
            const flight = await withFallback(
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

        // Cost breakdown estimates
        dest.transportCost = dest.transportCost || 0;

        // ¿Coinciden las fechas con un festivo o puente?
        const tripStart = dest.bestDates?.outbound || startDate;
        const tripEnd = dest.bestDates?.returnDate || endDate;
        dest.bridge = analyzeBridge(tripStart, tripEnd);

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

        const weather = await withFallback(
          () => getWeather(d.lat, d.lon),
          null
        );
        if (weather && weather.current) {
          dest.weatherCode = weather.current.weather_code;
          dest.weatherLabel = `${Math.round(weather.current.temperature_2m)}ºC · ${describeWeatherCode(weather.current.weather_code).emoji}`;
          dest.weather = weather;
        }

        const { score, reasons } = scoreDestination(dest, {
          budget: budget ? Number(budget) : null,
          maxDistanceKm: maxKm || 800,
          interests,
        });
        dest.score = score;
        dest.reasons = reasons;
        return dest;
      })
    )
  ).filter(Boolean);

  if (transport === "plane") {
    const withPrice = destinations.filter(
      (d) => d.estimatedCost !== null && d.estimatedCost !== undefined
    );
    const noPrice = destinations.filter(
      (d) => d.estimatedCost === null || d.estimatedCost === undefined
    );
    withPrice.sort((a, b) => a.estimatedCost - b.estimatedCost);
    noPrice.sort((a, b) => (b.score || 0) - (a.score || 0));
    destinations.length = 0;
    destinations.push(...withPrice, ...noPrice);
  } else if (vacations) {
    // Vacaciones en coche: todas las escapadas del período, de la más
    // barata a la más cara (con el coste total estimado).
    destinations.sort(
      (a, b) =>
        (a.estimatedCost ?? Number.MAX_SAFE_INTEGER) -
        (b.estimatedCost ?? Number.MAX_SAFE_INTEGER)
    );
  } else {
    destinations.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  const best = destinations[0];
  return { origin: originCoords, destinations, best, transport };
}
