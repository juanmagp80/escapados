"use client";

import SectionLoader from "@/components/loading/SectionLoader";
import { useEffect, useState } from "react";

// Lista de puntos de carga eléctrica cerca del destino (OSM / Overpass).
export default function EVChargersList({ lat, lon, radiusKm = 10 }) {
    const [state, setState] = useState({ status: "loading", chargers: [] });

    useEffect(() => {
        if (lat === undefined || lon === undefined) {
            setState({ status: "empty", chargers: [] });
            return;
        }
        const ctrl = new AbortController();
        fetch(
            `/api/ev-chargers?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`,
            { signal: ctrl.signal }
        )
            .then((r) => r.json())
            .then((data) => {
                setState({
                    status: data.chargers?.length ? "done" : "empty",
                    chargers: data.chargers || [],
                });
            })
            .catch(() => setState({ status: "empty", chargers: [] }));
        return () => ctrl.abort();
    }, [lat, lon, radiusKm]);

    if (state.status === "loading")
        return <SectionLoader label="Buscando puntos de carga…" />;
    if (state.status === "empty")
        return (
            <p className="text-sm text-stone-400">
                No hay puntos de carga cercanos.
            </p>
        );

    return (
        <ul className="space-y-2">
            {state.chargers.map((c) => (
                <li key={c.id} className="rounded-xl bg-brand-50 p-3 text-sm">
                    <p className="font-semibold text-ink">⚡ {c.name}</p>
                    <p className="text-xs text-stone-500">
                        {c.operator ? `${c.operator} · ` : ""}
                        {c.sockets ? `🔌 ${c.sockets} · ` : ""}
                        {c.capacity ? `Aparatos: ${c.capacity} · ` : ""}
                        {c.fee === "yes" ? "💰 De pago" : c.fee === "no" ? "🆓 Gratis" : ""}
                    </p>
                    <a
                        href={`https://www.google.com/maps?q=${c.lat},${c.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-brand-600"
                    >
                        📍 Ver en mapa
                    </a>
                </li>
            ))}
        </ul>
    );
}