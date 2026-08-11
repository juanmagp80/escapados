import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/session";
import { getSupabaseServer } from "@/lib/supabase/server";
import DeleteButton from "@/components/common/DeleteButton";
import DownloadICSButton from "@/components/common/DownloadICSButton";
import { formatEuro, slugify } from "@/lib/utils/format";
import { buildTripICS } from "@/lib/trips/ics";

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
          {trips.map((t) => {
            const detailHref = `/destinos/${t.slug || slugify(t.destination)}?${new URLSearchParams({
              origin: t.origin || "",
              destination: t.destination || "",
              startDate: t.start_date || "",
              endDate: t.end_date || "",
              travelers: String(t.travelers || 2),
              transport: t.transport || "car",
              budget: t.budget ? String(t.budget) : "",
            }).toString()}`;
            return (
              <div key={t.id} className="card relative overflow-hidden">
                <Link
                  href={detailHref}
                  aria-label={`Ver detalles de ${t.destination || "la escapada"}`}
                  className="absolute inset-0 z-0 rounded-2xl"
                />
                {t.image && (
                  <div className="relative z-10 h-28 bg-gradient-to-br from-brand-300 to-brand-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.image}
                      alt={t.destination || "Destino"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="pointer-events-none relative z-10">
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
                  </div>
                  <div className="relative z-10 mt-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-brand-600">
                      Ver detalles →
                    </p>
                    <span className="pointer-events-auto flex items-center gap-2">
                      <DownloadICSButton
                        icsContent={buildTripICS({
                          id: t.id,
                          origin: t.origin,
                          destination: t.destination,
                          startDate: t.start_date,
                          endDate: t.end_date,
                          travelers: t.travelers,
                          transport: t.transport,
                          budget: t.budget,
                        })}
                        filename={`escapa2-${t.slug || "viaje"}.ics`}
                      />
                      <DeleteButton table="trips" id={t.id} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
