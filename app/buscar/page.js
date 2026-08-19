import DestinationCard from "@/components/destinations/DestinationCard";
import SurpriseMode from "@/components/destinations/SurpriseMode";
import CityResults from "@/components/search/CityResults";
import PriceAlertToggle from "@/components/search/PriceAlertToggle";
import { categoryById } from "@/lib/destinations/categories";
import { analyzeBridge } from "@/lib/destinations/holidays";
import { runMultiOriginSearch, splitOrigins } from "@/lib/search/runMultiOrigin";
import { runSearch } from "@/lib/search/runSearch";
import { formatEuro } from "@/lib/utils/format";
import { getCurrentUser } from "@/lib/supabase/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
    vacations: searchParams.vacations === "1",
    interest: searchParams.interest || "",
  };

  const selectedCategory = categoryById(query.interest);

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
  const interests = selectedCategory ? selectedCategory.interests : [];
  const result =
    origins.length > 1
      ? await runMultiOriginSearch({ ...query, origins, interests })
      : await runSearch({ ...query, interests });

  if (result.error) {
    return (
      <main className="container-narrow text-center">
        <p className="text-stone-600">
          No hemos podido localizar &ldquo;{query.origin}&rdquo;.
        </p>
        <Link href="/" className="btn-ghost mt-4">
          Probar otro origen
        </Link>
      </main>
    );
  }

  const { destinations, best, failedOrigins = [] } = result;

  // Usuario conectado y telegram configurado
  const user = await getCurrentUser();
  const hasTelegram = Boolean(user);
  const showAlertToggle = user && (query.vacations || query.wholeMonth);

  // Todas las combinaciones del período, organizadas por ciudad.
  // Avión: cada combinación de fechas con su vuelo. Coche: cada combinación
  // de 2-5 días con su coste total estimado.
  // Dentro de cada ciudad, de más barato a más caro. Las ciudades sin vuelos
  // aparecen al final.
  const showCombos = query.wholeMonth || query.vacations;
  const combos = [];
  if (showCombos) {
    if (query.transport === "car") {
      for (const d of destinations) {
        for (const opt of d.comboOptions || []) {
          combos.push({
            name: d.name,
            slug: d.slug,
            image: d.image,
            outbound: opt.outbound,
            returnDate: opt.returnDate,
            nights: opt.nights,
            price: opt.estimatedCost,
            transport: "car",
            distanceLabel: opt.distanceLabel,
            durationLabel: opt.durationLabel,
            originRef: d.originRef || query.origin,
          });
        }
      }
    } else {
      for (const d of destinations) {
        for (const opt of d.flightOptions || []) {
          combos.push({
            name: d.name,
            slug: d.slug,
            image: d.image,
            airport: d.airport,
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
            bridge: analyzeBridge(opt.outbound, opt.returnDate),
          });
        }
      }
    }
  }

  // Agrupar combinaciones por ciudad y ordenar dentro de cada ciudad.
  const cityMap = new Map();
  for (const d of destinations) {
    if (cityMap.has(d.slug)) continue;
    cityMap.set(d.slug, {
      name: d.name,
      slug: d.slug,
      image: d.image,
      airport: d.airport,
      distanceKm: d.distanceKm,
      estimatedCost: d.estimatedCost,
      noFlights: d.noFlights || false,
      priceHint: d.priceHint,
      options: [],
    });
  }
  for (const opt of combos) {
    const group = cityMap.get(opt.slug);
    if (group) group.options.push(opt);
  }
  for (const group of cityMap.values()) {
    group.options.sort(
      (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)
    );
  }
  // Ciudades con opciones primero (ordenadas por la más barata), luego las
  // sin vuelos.
  const cityGroups = [...cityMap.values()].sort((a, b) => {
    if (a.options.length > 0 && b.options.length > 0) {
      return (a.options[0].price ?? Infinity) - (b.options[0].price ?? Infinity);
    }
    if (a.options.length > 0) return -1;
    if (b.options.length > 0) return 1;
    return (a.estimatedCost ?? Infinity) - (b.estimatedCost ?? Infinity);
  });

  const cityFilter = searchParams.city || "todas";

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
          {query.vacations
            ? `Todas las escapadas de tus vacaciones (${query.startDate} → ${query.endDate}) · ${query.travelers} viajeros · ${query.transport === "car" ? "🚗 Coche (combinaciones de 2-5 días)" : "✈️ Avión (combinaciones de 2-5 días)"}`
            : query.wholeMonth
              ? `Vuelos de ${new Date(query.startDate).toLocaleDateString("es-ES", { month: "long", year: "numeric" })} · ${query.travelers} viajeros · ✈️ Avión`
              : `${query.startDate} → ${query.endDate} · ${query.travelers} viajeros · ${query.transport === "car" ? "🚗 Coche" : "✈️ Avión"}${query.flexible ? " · fechas flexibles" : ""}`}
        </p>
      </header>

      {failedOrigins.length > 0 && (
        <aside className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No hemos podido localizar{" "}
          {failedOrigins.map((o) => `"${o}"`).join(", ")}. Mostramos las
          escapadas desde {origins.filter((o) => !failedOrigins.includes(o)).join(" y ")}.
        </aside>
      )}

      {selectedCategory && (
        <aside className="mb-5 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          🎯 Buscando escapadas de{" "}
          <span className="font-bold">{selectedCategory.label}</span>
          {selectedCategory.description
            ? ` — ${selectedCategory.description}`
            : ""}
          . Los destinos que encajan aparecen primero.
        </aside>
      )}

{showCombos ? (
        <CityResults
          cities={cityGroups}
          initialFilter={cityFilter}
          totalCombos={combos.length}
          transport={query.transport}
          vacations={query.vacations}
          wholeMonth={query.wholeMonth}
          travelers={query.travelers}
          budget={query.budget}
          maxKm={query.maxKm}
          multiOrigin={origins.length > 1}
          showAlertToggle={showAlertToggle}
          hasTelegram={hasTelegram}
          query={query}
        />
      ) : (
        <>
          {best && !query.vacations && (
            <section className="mb-6 rounded-xl2 bg-brand-600 p-5 text-white shadow-card">
              <p className="text-sm font-medium text-white/80">
                🏆 Nuestra recomendación
              </p>
              <div className="mt-1 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold">{best.name}</h2>
                  <p className="text-sm text-white/90">
                    {query.transport === "plane" && best.flight?.airline
                      ? `✈️ ${best.flight?.airline}`
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

          <SurpriseMode
            destinations={destinations}
            origin={query.origin}
            budget={query.budget}
          />
        </>
      )}
    </main>
  );
}
