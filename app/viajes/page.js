import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/session";
import { getSupabaseServer } from "@/lib/supabase/server";
import { formatEuro } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function ViajesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-narrow text-center">
        <h1 className="text-2xl font-bold text-ink">Tus viajes</h1>
        <p className="mt-2 text-stone-500">
          Inicia sesión para ver y guardar tus escapadas.
        </p>
        <Link href="/login" className="btn-primary mt-5">
          Entrar
        </Link>
      </main>
    );
  }

  const supabase = getSupabaseServer();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="container-app">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Tus viajes</h1>
        <p className="text-sm text-stone-500">
          {trips?.length || 0} escapada(s) guardada(s).
        </p>
      </header>

      {trips && trips.length > 0 ? (
        <div className="space-y-3">
          {trips.map((t) => (
            <article key={t.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    {t.destination || "Escapada"}
                  </h2>
                  <p className="text-sm text-stone-500">
                    {t.origin} → {t.destination}
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    {t.start_date} → {t.end_date} · {t.travelers} viajeros ·{" "}
                    {t.transport === "car" ? "🚗 Coche" : "✈️ Avión"}
                  </p>
                </div>
                {t.budget ? (
                  <span className="chip">💰 {formatEuro(t.budget)}</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-stone-500">Aún no has guardado ninguna escapada.</p>
          <Link href="/" className="btn-ghost mt-4">
            Buscar escapadas
          </Link>
        </div>
      )}
    </main>
  );
}
