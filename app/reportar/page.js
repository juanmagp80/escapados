import ExpenseReport from "@/components/destinations/ExpenseReport";
import { getCurrentUser } from "@/lib/supabase/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const destination = (searchParams?.destination || "").trim();
  return {
    title: destination
      ? `Reporta tu gasto en ${destination} — Escapa2`
      : "Reporta tu gasto — Escapa2",
  };
}

export default async function ReportarPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/reportar");

  const destination = (searchParams?.destination || "").trim();

  return (
    <main className="container-narrow py-8">
      <h1 className="text-2xl font-extrabold text-ink">💶 Cuéntanos cuánto gastasteis</h1>
      <p className="mt-1 text-sm text-stone-500">
        Tu reporte alimenta el dato real de «lo que cuesta de verdad» que
        mostramos a quien busca escapadas a este destino. Solo hacen falta unos
        números aproximados.
      </p>

      <div className="card mt-6 p-5">
        <ExpenseReport destination={destination} />
      </div>
    </main>
  );
}