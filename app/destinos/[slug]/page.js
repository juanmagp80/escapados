import ShareButton from "@/components/common/ShareButton";
import ExpenseReport from "@/components/destinations/ExpenseReport";
import PriceAlert from "@/components/destinations/PriceAlert";
import PriceCalendar from "@/components/destinations/PriceCalendar";
import RatingForm from "@/components/destinations/RatingForm";
import SaveButtons from "@/components/destinations/SaveButtons";
import BlaBlaCarSimulator from "@/components/fuel/BlaBlaCarSimulator";
import EVChargersList from "@/components/fuel/EVChargersList";
import GasStationsList from "@/components/fuel/GasStationsList";
import TransportCompare from "@/components/fuel/TransportCompare";
import Itinerary from "@/components/itinerary/Itinerary";
import RouteMap from "@/components/maps/RouteMap";
import SerpFetcher from "@/components/places/SerpFetcher";
import RainPlanB from "@/components/weather/RainPlanB";
import { findCommunity } from "@/lib/destinations/communities";
import { estimateTripCost } from "@/lib/destinations/costEstimate";
import { getDestinationDetail } from "@/lib/destinations/detail";
import { estimateTolls } from "@/lib/routing/tolls";
import { getHotels } from "@/lib/serpapi/providers/hotels";
import { withFallback } from "@/lib/utils/cache";
import { formatDuration, formatEuro, formatKm, nightsBetween } from "@/lib/utils/format";
import { describeWeatherCode, tripRainyDays } from "@/lib/weather/openMeteo";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }) {
  const name = (searchParams?.destination || params.slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `Escapada a ${name} — Escapa2`;
  const description = `Planifica tu escapada a ${name}: transporte, alojamiento, restaurantes, atracciones e itinerario personalizado.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_ES",
      siteName: "Escapa2",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function Section({ icon, title, children }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const label = d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

export default async function DestinoPage({ params, searchParams }) {
  const community = findCommunity(params.slug);
  if (community) {
    const communityQuery = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams || {})) {
      if (v) communityQuery.set(k, v);
    }
    if (!communityQuery.get("destination")) {
      communityQuery.set("destination", community.name);
    }
    redirect(`/comunidad/${community.slug}?${communityQuery.toString()}`);
  }

  const query = {
    origin: searchParams.origin || "",
    destination: searchParams.destination || "",
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
    travelers: Number(searchParams.travelers) || 2,
    transport: searchParams.transport || "car",
    budget: searchParams.budget || "",
    maxPrice: searchParams.maxPrice || "",
    flexible: searchParams.flexible === "1",
    wholeMonth: searchParams.wholeMonth === "1",
  };

  const detail = await getDestinationDetail({
    slug: params.slug,
    destinationName: query.destination,
    ...query,
  });
  if (!detail) {
    return (
      <main className="container-narrow text-center">
        <p className="text-stone-600">No hemos podido cargar este destino.</p>
        <Link href="/" className="btn-ghost mt-4">Ir al inicio</Link>
      </main>
    );
  }

  const { name, destination, route, weather, carCost, flight, image, region } = detail;
  const nights = nightsBetween(query.startDate, query.endDate);
  const weatherNow = weather?.current;

  const dailyForecast = (weather?.daily?.time || []).map((t, i) => ({
    date: t,
    max: weather.daily.temperature_2m_max?.[i],
    min: weather.daily.temperature_2m_min?.[i],
    precip: weather.daily.precipitation_probability_max?.[i],
    code: weather.daily.weather_code?.[i],
  }));

  // Solo los días que coinciden con las fechas del viaje.
  const tripForecast = (query.startDate && query.endDate)
    ? dailyForecast.filter((f) => f.date >= query.startDate && f.date <= query.endDate)
    : [];

  const rainyTripDays = tripRainyDays(weather, query.startDate, query.endDate);

  const transportCost = carCost ? carCost.effective : detail.flight ? detail.flight.totalPrice : 0;
  const tolls = route ? estimateTolls(route.distance / 1000) : 0;
  const transportModes = [];
  if (carCost) {
    transportModes.push({
      id: "car",
      label: "🚗 Coche",
      cost: carCost.effective + tolls,
      duration: route ? formatDuration(route.duration) : null,
    });
  }
  if (detail.flight) {
    transportModes.push({
      id: "plane",
      label: "✈️ Avión",
      cost: detail.flight.totalPrice,
      duration: null,
    });
  }

  let hotels = [];
  if (query.startDate && query.endDate) {
    const result = await withFallback(
      () =>
        getHotels({
          q: name,
          checkIn: query.startDate,
          checkOut: query.endDate,
          guests: query.travelers,
          lat: destination.lat,
          lon: destination.lon,
          maxPricePerNight: query.maxPrice
            ? Number(query.maxPrice)
            : undefined,
        }),
      { hotels: [] }
    );
    hotels = result.hotels || [];
  }

  const realHotelNight = hotels
    .map((h) => h.pricePerNight)
    .filter((p) => typeof p === "number" && p > 0)
    .sort((a, b) => a - b)[0];
  const realHotelCost =
    typeof realHotelNight === "number" ? realHotelNight * Math.max(nights, 1) : null;

  const costEstimate = estimateTripCost({
    name,
    region,
    startDate: query.startDate,
    endDate: query.endDate,
    travelers: query.travelers,
    transportCost,
    hotelCost: realHotelCost,
  });

  return (
    <main className="container-app">
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-brand-300 to-brand-600">
        {detail.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={detail.image}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10">
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <Link
              href={query.destination ? "/" : `/buscar?${new URLSearchParams(query).toString()}`}
              className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-stone-700"
            >
              ← Volver
            </Link>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h1 className="text-3xl font-extrabold text-white drop-shadow">
              {name}
            </h1>
            {query.startDate && (
              <p className="text-sm text-white/90">
                {query.startDate} → {query.endDate}
                {nights ? ` · ${nights} noches` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        {weatherNow && (
          <div className="sm:col-span-2">
            <Section icon="☀️" title="Meteorología">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-ink">
                    {Math.round(weatherNow.temperature_2m)}ºC
                  </p>
                  <p className="text-sm text-stone-500">
                    {describeWeatherCode(weatherNow.weather_code).label}
                  </p>
                </div>
                <div className="text-right text-sm text-stone-600">
                  <p>💧 Lluvia: {weatherNow.precipitation_probability ?? "—"}%</p>
                  <p>💨 Viento: {Math.round(weatherNow.wind_speed_10m)} km/h</p>
                </div>
              </div>
              {tripForecast.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-stone-400">
                    Previsión para tus fechas
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {tripForecast.map((f) => (
                      <div key={f.date} className="rounded-xl bg-brand-50 p-2 text-center">
                        <p className="text-xs font-medium text-stone-500">
                          {dayLabel(f.date)}
                        </p>
                        <p className="text-sm font-bold text-ink">
                          {Math.round(f.max)}º / {Math.round(f.min)}º
                        </p>
                        <p className="text-xs text-stone-500">
                          {describeWeatherCode(f.code).emoji}
                          {f.precip != null ? ` ${Math.round(f.precip)}% lluvia` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <RainPlanB rainyDays={rainyTripDays} />
            </Section>
          </div>
        )}

        {query.transport === "car" && route && (
          <Section icon="🚗" title="Ruta en coche">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="text-stone-500">Distancia</p>
                <p className="text-lg font-bold text-ink">
                  {formatKm(route.distance)}
                </p>
              </div>
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="text-stone-500">Duración</p>
                <p className="text-lg font-bold text-ink">
                  {formatDuration(route.duration)}
                </p>
              </div>
            </div>
            {carCost && (
              <div className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm">
                <Row label="⛽ Combustible" value={formatEuro(carCost.fuel.cost)} />
                <Row label="🛣️ Peajes (aprox.)" value={formatEuro(tolls)} />
                <div className="flex justify-between border-t border-stone-100 pt-2 font-semibold">
                  <span>Coste efectivo</span>
                  <span>{formatEuro(carCost.effective + tolls)}</span>
                </div>
              </div>
            )}
            <TransportCompare modes={transportModes} distanceKm={route?.distance / 1000} />
          </Section>
        )}

        {query.transport === "plane" && (
          <Section icon="✈️" title="Vuelo">
            {detail.flight ? (
              <div className="space-y-1 text-sm">
                <Row label="💶 Precio total" value={formatEuro(detail.flight.totalPrice)} />
                <Row
                  label="👤 Por persona"
                  value={formatEuro(detail.flight.pricePerPerson)}
                />
                {detail.flight.airline && (
                  <Row label="🛫 Aerolínea" value={detail.flight.airline} />
                )}
                {detail.flight.link && (
                  <a
                    href={detail.flight.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-medium text-brand-600"
                  >
                    Ver en {detail.flight.source === "Ryanair" ? "Ryanair" : "Google Flights"} →
                  </a>
                )}
                <p className="pt-1 text-xs text-stone-400">
                  Fuente: {detail.flight.source || "Google Flights"}
                </p>
                {detail.flightOptions.length > 0 && (
                  <div className="mt-3 border-t border-stone-100 pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                      Opciones baratas del mes
                    </p>
                    <ul className="space-y-1.5">
                      {detail.flightOptions.map((opt) => (
                        <li key={`${opt.outbound}-${opt.returnDate}`}>
                          <a
                            href={`/destinos/${params.slug}?${new URLSearchParams({
                              ...query,
                              startDate: opt.outbound,
                              endDate: opt.returnDate,
                            }).toString()}`}
                            className="flex justify-between rounded-lg px-2 py-1 text-sm transition hover:bg-brand-50"
                          >
                            <span className="text-stone-600">
                              {dayLabel(opt.outbound)} → {dayLabel(opt.returnDate)}{" "}
                              <span className="text-stone-400">({opt.nights} noches)</span>
                            </span>
                            <span className="font-semibold text-ink">
                              {formatEuro(opt.totalPrice)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.flexibleOptions.length > 0 && (
                  <div className="mt-3 border-t border-stone-100 pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                      Las 5 fechas más baratas (±2 días)
                    </p>
                    <ul className="space-y-1.5">
                      {detail.flexibleOptions.map((opt) => (
                        <li key={`${opt.outbound}-${opt.returnDate}`}>
                          <a
                            href={`/destinos/${params.slug}?${new URLSearchParams({
                              ...query,
                              startDate: opt.outbound,
                              endDate: opt.returnDate,
                            }).toString()}`}
                            className="flex justify-between rounded-lg px-2 py-1 text-sm transition hover:bg-brand-50"
                          >
                            <span className="text-stone-600">
                              {dayLabel(opt.outbound)} → {dayLabel(opt.returnDate)}{" "}
                              <span className="text-stone-400">({opt.nights} noches)</span>
                            </span>
                            <span className="font-semibold text-ink">
                              {formatEuro(opt.totalPrice)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <PriceCalendar
                  options={detail.flightOptions.length > 0 ? detail.flightOptions : detail.flexibleOptions}
                  selectedDate={query.startDate}
                />
                <PriceAlert
                  from={query.origin}
                  to={name}
                  date={query.startDate}
                  currentPrice={detail.flight.totalPrice}
                />
              </div>
            ) : (
              <p className="text-sm text-stone-400">
                No hemos encontrado vuelos para estas fechas. Prueba otras
                fechas o cambia a coche.
              </p>
            )}
          </Section>
        )}

        <Section icon="🗺️" title="Mapa de la ruta">
          <RouteMap
            origin={{ name: query.origin, lat: detail.origin?.lat, lon: detail.origin?.lon }}
            destination={{ name: name, lat: destination.lat, lon: destination.lon }}
            transport={query.transport}
            route={route}
          />
        </Section>

        {query.transport === "car" && route && (
          <Section icon="⛽" title="Gasolineras en ruta">
            <GasStationsList
              originLat={detail.origin?.lat}
              originLon={detail.origin?.lon}
              destLat={destination.lat}
              destLon={destination.lon}
              routeCoordinates={route.coordinates}
            />
          </Section>
        )}

        {query.transport === "car" && (
          <Section icon="⚡" title="Puntos de carga eléctrica">
            <EVChargersList lat={destination.lat} lon={destination.lon} />
          </Section>
        )}

        {query.transport === "car" && carCost && (
          <Section icon="🤝" title="Compartir coche (BlaBlaCar)">
            <BlaBlaCarSimulator
              carCost={carCost}
              travelers={query.travelers}
              originLat={detail.origin?.lat}
              originLon={detail.origin?.lon}
              destLat={destination.lat}
              destLon={destination.lon}
              startDate={query.startDate}
              endDate={query.endDate}
            />
          </Section>
        )}

        <Section icon="🏨" title="Alojamiento">
          <SerpFetcher
            endpoint="hotels"
            query={name}
            kind="hotels"
            icon="🏨"
            checkIn={query.startDate}
            checkOut={query.endDate}
            guests={query.travelers}
            lat={destination?.lat}
            lon={destination?.lon}
            maxPrice={query.maxPrice}
          />
          {query.startDate && (
            <p className="pt-2 text-xs text-stone-400">
              {query.startDate} → {query.endDate} · {query.travelers} personas.
              Si algún alojamiento no muestra precio, es una referencia del
              lugar sin tarifa disponible para estas fechas.
            </p>
          )}
        </Section>

        <Section icon="🍽️" title="Dónde comer">
          <SerpFetcher
            endpoint="restaurants"
            query={name}
            kind="places"
            icon="🍽️"
          />
        </Section>

        <Section icon="🏛️" title="Qué ver">
          <SerpFetcher
            endpoint="attractions"
            query={name}
            kind="places"
            icon="🏛️"
          />
        </Section>

        <Section icon="🗓️" title="Itinerario personalizado">
          <Itinerary destination={name} query={query} />
        </Section>

        <div className="rounded-xl2 bg-brand-600 p-5 text-white shadow-card sm:col-span-2">
          <p className="text-sm text-white/80">
            Coste estimado (transporte + alojamiento)
          </p>
          <p className="text-2xl font-extrabold">
            {formatEuro(costEstimate.estimatedCost)}
          </p>
          <p className="text-sm text-white/90">
            {formatEuro(costEstimate.estimatedCost / (query.travelers || 1))} por
            persona · {costEstimate.nights} noches
          </p>
          <div className="mt-3 space-y-1 border-t border-white/20 pt-3 text-sm text-white/90">
            <div className="flex justify-between">
              <span>🏨 Alojamiento ({costEstimate.nights} noches)</span>
              <span className="font-semibold">{formatEuro(costEstimate.hotelCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                {query.transport === "car" ? "🚗 Combustible (ida y vuelta)" : "✈️ Vuelo"}
              </span>
              <span className="font-semibold">{formatEuro(costEstimate.transportCost)}</span>
            </div>
            <div className="flex justify-between border-t border-white/20 pt-2 text-base font-bold text-white">
              <span>Total</span>
              <span>{formatEuro(costEstimate.estimatedCost)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-1 rounded-xl2 bg-white p-3 text-sm text-stone-700">
            <p className="font-medium text-stone-400">
              Extras orientativos, no incluidos en el total
            </p>
            <div className="flex justify-between">
              <span>🍽️ Comida estimada ({costEstimate.nights + 1} días × {query.travelers || 2} pers.)</span>
              <span className="font-semibold">{formatEuro(costEstimate.foodCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>🏛️ Actividades estimadas</span>
              <span className="font-semibold">{formatEuro(costEstimate.activitiesCost)}</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-white/70">
            {costEstimate.hotelCostReal
              ? "El alojamiento usa el precio más barato disponible con disponibilidad real para tus fechas."
              : "No encontramos disponibilidad de alojamiento para estas fechas; el alojamiento mostrado es una estimación orientativa."}{" "}
            El transporte se calcula con la distancia real de la ruta. Comida y
            actividades son extras orientativos, no incluidos en el total.
          </p>
        </div>

        <div className="rounded-xl2 bg-white p-4 shadow-card sm:col-span-2">
          <SaveButtons
            destination={name}
            lat={destination.lat}
            lon={destination.lon}
            query={query}
          />
          <RatingForm destination={name} />
          <ExpenseReport destination={name} />
          <div className="mt-3 border-t border-stone-100 pt-3">
            <ShareButton
              url={`/destinos/${params.slug}?${new URLSearchParams(query).toString()}`}
              title={`Escapada a ${name}`}
            />
          </div>
          <p className="mt-2 text-center text-xs text-stone-400">
            Inicia sesión para guardar tus escapadas y destinos.
          </p>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
