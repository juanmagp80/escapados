import Link from "next/link";
import { runSearch } from "@/lib/search/runSearch";
import { runMultiOriginSearch, splitOrigins } from "@/lib/search/runMultiOrigin";
import DestinationCard from "@/components/destinations/DestinationCard";
import { formatEuro } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

function monthLabel(date) {
  const d = new Date(date);
  const fecha = d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return fecha.charAt(0).toUpperCase() + fecha.slice(1).replace(".", "");
}

export default async function BuscarPage({ searchParams }) {
  const query = {
    origin: searchParams.origin || "",
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
    travelers: searchParams.travelers || "2",
    transport: searchParams.transport || "car",
    budget: searchParams.budget || "",
    maxPrice: searchParams.maxPrice || "",
    region: searchParams.region || "",
    maxKm: searchParams.maxKm || "",
    wholeMonth: searchParams.wholeMonth === "1",
    flexible: searchParams.flexible === "1",
  };

  if (!query.origin) {
    return (
      <main className="mx-auto max-w-md px-5 py-12 text-center">
        <p className="text-stone-600">No hay búsqueda. Vuelve a empezar.</p>
        <Link href="/" className="btn-ghost mt-4">
          Ir al inicio
        </Link>
      </main>
    );
  }

  const origins = splitOrigins(query.origin);
  const result =
    origins.length > 1
      ? await runMultiOriginSearch({ ...query, origins })
      : await runSearch(query);

  if (result.error) {
    return (
      <main className="container-narrow text-center">
        <p className="text-stone-600">
          No hemos podido localizar “{query.origin}”.
        </p>
        <Link href="/" className="btn-ghost mt-4">
          Probar otro origen
        </Link>
      </main>
    );
  }

  const { destinations, best, failedOrigins = [] } = result;

  // Todas las opciones de vuelo del mes, ordenadas de menor a mayor precio.
  const monthOptions = [];
  if (query.wholeMonth) {
    for (const d of destinations) {
      for (const opt of d.flightOptions || []) {
        monthOptions.push({
          name: d.name,
          slug: d.slug,
          image: d.image,
          outbound: opt.outbound,
          returnDate: opt.returnDate,
          nights: opt.nights,
          price: opt.totalPrice,
          pricePerPerson: opt.pricePerPerson,
          airline: opt.airline,
          link: opt.link,
          distanceKm: d.distanceKm,
          estimatedCost: d.estimatedCost,
          originRef: opt.originRef || d.originRef || query.origin,
        });
      }
    }
    monthOptions.sort((a, b) => a.price - b.price);
  }

  const originLabel = origins.length > 1
    ? origins.join(" o ")
    : query.origin;

  return (
    <main className="container-app">
      <header className="mb-5">
        <Link href="/" className="text-sm text-stone-400">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          Escapadas desde {originLabel}
        </h1>
        <p className="text-sm text-stone-500">
          {query.wholeMonth
            ? `Vuelos de ${new Date(query.startDate).toLocaleDateString("es-ES", { month: "long", year: "numeric" })} · ${query.travelers} viajeros · ✈️ Avión`
            : `${query.startDate} → ${query.endDate} · ${query.travelers} viajeros · ${query.transport === "car" ? "🚗 Coche" : "✈️ Avión"}${query.flexible ? " · fechas flexibles" : ""}`}
        </p>
      </header>

      {failedOrigins.length > 0 && (
        <aside className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No hemos podido localizar{" "}
          {failedOrigins.map((o) => `“${o}”`).join(", ")}. Mostramos las
          escapadas desde {origins.filter((o) => !failedOrigins.includes(o)).join(" y ")}.
        </aside>
      )}

      {query.wholeMonth ? (
        <section>
          <p className="mb-3 text-sm font-medium text-stone-500">
            {monthOptions.length} opciones de vuelo, de la más barata a la más cara
          </p>
          <div className="space-y-3">
            {monthOptions.map((opt) => {
              const detailQuery = new URLSearchParams({
                origin: opt.originRef,
                startDate: opt.outbound,
                endDate: opt.returnDate,
                travelers: query.travelers,
                transport: "plane",
                budget: query.budget,
                region: query.region,
                maxKm: query.maxKm,
                wholeMonth: "1",
              });
              return (
                <article key={`${opt.slug}-${opt.originRef}-${opt.outbound}`} className="card overflow-hidden">
                  <div className="flex gap-4">
                    <div className="hidden h-full w-28 sm:block">
                      {opt.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={opt.image} alt={opt.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{opt.name}</p>
                          <p className="text-sm text-stone-500">
                            {monthLabel(opt.outbound)} → {monthLabel(opt.returnDate)}{" "}
                            <span className="text-stone-400">({opt.nights} noches)</span>
                          </p>
                          {origins.length > 1 && (
                            <p className="text-xs text-brand-600">📍 Desde {opt.originRef}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold text-brand-600">
                            {formatEuro(opt.price)}
                          </p>
                          <p className="text-xs text-stone-400">
                            {opt.airline ? `✈️ ${opt.airline}` : ""}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/destinos/${opt.slug}?${detailQuery.toString()}`}
                        className="btn-primary mt-2 w-fit !px-4 !py-2 text-sm"
                      >
                        Ver escapada
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
            {monthOptions.length === 0 && (
              <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">
                No hemos encontrado vuelos para ninguna fin de semana de este mes.
              </p>
            )}
          </div>
        </section>
      ) : (
        <>
          {best && (
            <section className="mb-6 rounded-xl2 bg-brand-600 p-5 text-white shadow-card">
              <p className="text-sm font-medium text-white/80">
                🏆 Nuestra recomendación
              </p>
              <div className="mt-1 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold">{best.name}</h2>
                  <p className="text-sm text-white/90">
                    {query.transport === "plane" && best.flight?.airline
                      ? `✈️ ${best.flight.airline}`
                      : best.distanceLabel && best.distanceLabel !== "—"
                      ? `${best.distanceLabel} · `
                      : ""}
                    {query.transport === "car" &&
                    best.durationLabel &&
                    best.durationLabel !== "—"
                      ? best.durationLabel
                      : ""}
                  </p>
                </div>
                <p className="text-right text-lg font-bold">
                  {best.estimatedCost ? formatEuro(best.estimatedCost) : "—"}
                </p>
              </div>
            </section>
          )}

          <p className="mb-3 text-sm font-medium text-stone-500">
            {destinations.length} destinos encontrados
          </p>

          {query.transport === "plane" && destinations.length === 0 && (
            <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">
              No hemos encontrado vuelos para estas fechas. Puede que estén
              pasadas o demasiado lejanas (las tarifas cubren ~12 meses), o que
              no haya conexión directa al destino. Prueba otras fechas, cambia
              a coche, o activa «Ver el mes completo» o «Fechas flexibles».
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {destinations.map((dest) => {
              const cardQuery = {
                ...query,
                origin: dest.originRef || query.origin,
                startDate: dest.bestDates?.outbound || query.startDate,
                endDate: dest.bestDates?.returnDate || query.endDate,
              };
              return (
                <DestinationCard
                  key={`${dest.originRef || query.origin}-${dest.slug}`}
                  dest={dest}
                  query={cardQuery}
                  multiOrigin={origins.length > 1}
                />
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}