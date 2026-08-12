"use client";

import ItineraryEditor from "@/components/itinerary/ItineraryEditor";
import UnifiedTripMap from "@/components/maps/UnifiedTripMap";
import TripChecklist from "@/components/destinations/TripChecklist";
import { useToast } from "@/components/common/ToastProvider";
import { useState } from "react";

// Vista cliente de un plan compartido: permite editar en colaboración
// el título, el itinerario (drag & drop) y el checklist.
export default function ShareTripView({ trip }) {
    const notify = useToast();
    const [title, setTitle] = useState(trip.title || `Escapada a ${trip.destination}`);
    const [days, setDays] = useState(trip.itinerary || []);
    const [saving, setSaving] = useState(false);

    async function save(patch) {
        setSaving(true);
        try {
            const res = await fetch("/api/shared-trips", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: trip.slug, patch }),
            });
            if (!res.ok) {
                const data = await res.json();
                notify(data.error || "No hemos podido guardar.", "error");
                return;
            }
            notify("Cambios guardados ✓");
        } catch {
            notify("No hemos podido guardar.", "error");
        } finally {
            setSaving(false);
        }
    }

    function handleTitleChange(e) {
        const value = e.target.value;
        setTitle(value);
        save({ title: value });
    }

    function handleDaysChange(nextDays) {
        setDays(nextDays);
        save({ itinerary: nextDays });
    }

    return (
        <div className="space-y-4">
            <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600">
                {trip.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={trip.image}
                        alt={trip.destination}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                    <input
                        value={title}
                        onChange={handleTitleChange}
                        aria-label="Título del plan"
                        className="w-full rounded-xl bg-black/30 px-3 py-2 text-2xl font-extrabold text-white outline-none backdrop-blur-sm"
                    />
                    <p className="mt-1 text-sm text-white/90">
                        {trip.origin} → {trip.destination}
                        {trip.start_date ? ` · ${trip.start_date} → ${trip.end_date || ""}` : ""}
                        {trip.travelers ? ` · ${trip.travelers} viajeros` : ""}
                    </p>
                </div>
            </div>

            <section className="card p-5">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
                    <span>🗺️</span> Mapa del viaje
                </h2>
                <UnifiedTripMap
                    origin={{ name: trip.origin, lat: trip.origin_lat, lon: trip.origin_lon }}
                    destination={{ name: trip.destination, lat: trip.dest_lat, lon: trip.dest_lon }}
                    transport={trip.transport}
                    route={trip.route}
                    days={days}
                />
            </section>

            <section className="card p-5">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
                    <span>📝</span> Itinerario
                </h2>
                {saving && (
                    <p className="mb-2 text-xs text-brand-600">Guardando…</p>
                )}
                {days.length > 0 ? (
                    <ItineraryEditor days={days} onChange={handleDaysChange} />
                ) : (
                    <p className="text-sm text-stone-400">
                        Este plan aún no tiene itinerario. Edítalo más abajo o usa el chat IA.
                    </p>
                )}
            </section>

            <section className="card p-5">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
                    <span>✅</span> Checklist colaborativo
                </h2>
                <TripChecklist slug={trip.slug} destination={trip.destination} />
            </section>
        </div>
    );
}