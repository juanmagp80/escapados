import { getSupabaseServer } from "@/lib/supabase/server";
import { formatEuro } from "@/lib/utils/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ComunidadPage() {
    const supabase = getSupabaseServer();
    let trips = [];
    if (supabase) {
        const { data } = await supabase
            .from("published_trips")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(30);
        trips = data || [];
    }

    return (
        <main className="container-app">
            <header className="mb-6">
                <Link href="/" className="text-sm text-stone-400">
                    ← Volver
                </Link>
                <h1 className="mt-2 text-3xl font-extrabold text-ink">
                    🌍 Escapadas de la comunidad
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                    Escapadas reales publicadas por otros usuarios. Inspírate y haz la
                    tuya.
                </p>
            </header>

            {trips.length === 0 ? (
                <div className="rounded-2xl bg-stone-50 p-8 text-center">
                    <p className="text-2xl">🏝️</p>
                    <p className="mt-2 font-medium text-stone-600">
                        Todavía no hay escapadas publicadas
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                        Guarda un viaje y publícalo para compartirlo con la comunidad.
                    </p>
                    <Link href="/" className="btn-primary mt-4">
                        Planificar una escapada
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {trips.map((trip) => (
                        <article key={trip.id} className="card overflow-hidden">
                            {trip.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={trip.image}
                                    alt={trip.destination}
                                    className="h-40 w-full object-cover"
                                />
                            )}
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-ink">
                                            {trip.destination}
                                        </h2>
                                        {trip.summary && (
                                            <p className="mt-1 text-sm text-stone-500">
                                                {trip.summary}
                                            </p>
                                        )}
                                    </div>
                                    {trip.estimated_cost && (
                                        <p className="shrink-0 text-lg font-extrabold text-brand-600">
                                            {formatEuro(trip.estimated_cost)}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                                    {trip.origin && (
                                        <span className="chip bg-stone-50">📍 {trip.origin}</span>
                                    )}
                                    {trip.start_date && (
                                        <span className="chip bg-stone-50">
                                            📅 {trip.start_date} → {trip.end_date}
                                        </span>
                                    )}
                                    <span className="chip bg-stone-50">
                                        {trip.transport === "car" ? "🚗 Coche" : "✈️ Avión"}
                                    </span>
                                    <span className="chip bg-stone-50">
                                        👥 {trip.travelers} viajeros
                                    </span>
                                    <span className="chip bg-stone-50">❤️ {trip.likes || 0}</span>
                                </div>
                                <Link
                                    href={`/destinos/${trip.slug || trip.destination.toLowerCase().replace(/\s+/g, "-")}?origin=${encodeURIComponent(trip.origin || "")}&startDate=${trip.start_date || ""}&endDate=${trip.end_date || ""}&travelers=${trip.travelers || 2}&transport=${trip.transport || "car"}`}
                                    className="btn-primary mt-4 w-full !py-2 text-sm"
                                >
                                    Ver escapada
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}