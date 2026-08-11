import Link from "next/link";
import { findCommunity } from "@/lib/destinations/communities";
import { searchCommunity } from "@/lib/destinations/communitySearch";
import DestinationCard from "@/components/destinations/DestinationCard";

export const dynamic = "force-dynamic";

export default async function ComunidadPage({ params, searchParams }) {
  const community = findCommunity(params.slug);
  if (!community) {
    return (
      <main className="container-narrow text-center">
        <p className="text-stone-600">
          No hemos podido cargar esta comunidad.
        </p>
        <Link href="/" className="btn-ghost mt-4">
          Ir al inicio
        </Link>
      </main>
    );
  }

  const query = {
    origin: searchParams.origin || "",
    destination: community.name,
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
    travelers: searchParams.travelers || "2",
    transport: searchParams.transport || "car",
    budget: searchParams.budget || "",
    maxPrice: searchParams.maxPrice || "",
  };

  const result = await searchCommunity({
    community,
    origin: query.origin,
    startDate: query.startDate,
    endDate: query.endDate,
    travelers: Number(query.travelers) || 2,
    transport: query.transport,
    budget: query.budget || undefined,
  });

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

  const { destinations, noOrigin } = result;

  return (
    <main className="container-app">
      <header className="mb-5">
        <Link href="/" className="text-sm text-stone-400">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          Escapadas por {community.name}
        </h1>
        <p className="text-sm text-stone-500">
          Los pueblos y ciudades más demandados de {community.name}
          {query.origin ? ` desde ${query.origin}` : ""} · {query.travelers} viajeros
          {query.transport === "car" ? " · 🚗 Coche" : " · ✈️ Avión"}
        </p>
      </header>

      {noOrigin && (
        <aside className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Muestra sin origen como inspiración. Vuelve al inicio escribiendo
          desde dónde salís para ver distancia y coste de transporte en cada
          pueblo.
        </aside>
      )}

      <p className="mb-3 text-sm font-medium text-stone-500">
        {destinations.length} destinos en {community.name}
      </p>

      {destinations.length === 0 ? (
        <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">
          No hemos encontrado resultados para {community.name} con estas
          fechas. Prueba otro transporte o fechas distintas.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {destinations.map((dest) => (
            <DestinationCard
              key={dest.slug}
              dest={dest}
              query={{ ...query, destination: dest.name }}
            />
          ))}
        </div>
      )}
    </main>
  );
}