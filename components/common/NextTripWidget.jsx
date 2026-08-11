"use client";

import { getItem } from "@/components/common/OfflineCache";
import Link from "next/link";
import { useEffect, useState } from "react";

// Widget de próximo viaje: muestra la cuenta atrás del próximo viaje guardado.
export default function NextTripWidget() {
    const [trip, setTrip] = useState(null);

    useEffect(() => {
        getItem("next-trip")
            .then((cached) => {
                if (cached?.data) setTrip(cached.data);
            })
            .catch(() => { });
    }, []);

    if (!trip) return null;

    const start = new Date(trip.start_date + "T12:00:00");
    const now = new Date();
    const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null;

    return (
        <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-4 text-white shadow-card">
            <p className="text-xs font-medium text-white/80">🗓️ Próximo viaje</p>
            <div className="mt-1 flex items-end justify-between">
                <div>
                    <p className="text-lg font-bold">{trip.destination}</p>
                    <p className="text-sm text-white/90">
                        {trip.start_date} → {trip.end_date}
                    </p>
                </div>
                <p className="text-2xl font-extrabold">
                    {diffDays === 0 ? "¡Hoy!" : `${diffDays} días`}
                </p>
            </div>
            <Link
                href={`/destinos/${trip.slug || trip.destination.toLowerCase().replace(/ /g, "-")}`}
                className="mt-3 inline-block text-xs font-medium text-white/90 hover:opacity-90"
            >
                Ver detalles
            </Link>
        </div>
    );
}