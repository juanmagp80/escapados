import Link from "next/link";
import { runSearch } from "@/lib/search/runSearch";
import Comparator from "@/components/destinations/Comparator";
import { formatEuro } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function CompararPage({ searchParams }) {
  const query = {
    origin: searchParams.origin || "",
    startDate: searchParams.startDate || "",
    endDate: searchParams.endDate || "",
    travelers: searchParams.travelers || "2",
    transport: searchParams.transport || "car",
    budget: searchParams.budget || "",
  };

  const result = await runSearch(query);
  if (result.error || !result.destinations?.length) {
    return (
      <main className="container-narrow text-center">
        <p className="text-stone-600">No hay destinos para comparar.</p>
        <Link href="/" className="btn-ghost mt-4">Ir al inicio</Link>
      </main>
    );
  }

  return (
    <main className="container-app">
      <header className="mb-5">
        <Link
          href={`/buscar?${new URLSearchParams(query).toString()}`}
          className="text-sm text-stone-400"
        >
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          Comparar escapadas
        </h1>
        <p className="text-sm text-stone-500">
          {result.destinations.length} destinos · {query.transport === "car" ? "🚗 Coche" : "✈️ Avión"}
        </p>
      </header>

      <section className="card p-5">
        <Comparator destinations={result.destinations} query={query} />
      </section>

      <p className="mt-3 text-xs text-stone-400">
        El coste es una estimación (incluye combustible para coche). Toca una
        fila para ver el detalle del destino.
      </p>
    </main>
  );
}
