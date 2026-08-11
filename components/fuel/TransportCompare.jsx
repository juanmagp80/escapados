"use client";

import { formatEuro } from "@/lib/utils/format";

// Compara coche vs tren vs avión vs BlaBlaCar según coste y duración.
export default function TransportCompare({ modes = [], carCost, distanceKm }) {
    if (!modes || modes.length === 0) return null;

    const cheapest = [...modes].sort((a, b) => (a.cost || Infinity) - (b.cost || Infinity))[0];
    const fastest = [...modes].sort((a, b) => (a.duration || Infinity) - (b.duration || Infinity))[0];

    return (
        <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
            <p className="text-sm font-semibold text-stone-600">
                🚦 Comparativa de transportes
                {distanceKm ? ` · ${Math.round(distanceKm)} km` : ""}
            </p>
            {modes.map((m) => (
                <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm"
                >
                    <span className="font-medium text-ink">{m.label}</span>
                    <span className="flex items-center gap-2">
                        {m.duration && <span className="text-xs text-stone-400">{m.duration}</span>}
                        <span className="font-semibold text-brand-600">
                            {formatEuro(m.cost)}
                        </span>
                        {(cheapest.id === m.id || fastest.id === m.id) && (
                            <span>{(cheapest.id === m.id && fastest.id === m.id) ? "🏆" : cheapest.id === m.id ? "💰" : "⚡"}</span>
                        )}
                    </span>
                </div>
            ))}
            <p className="text-[10px] text-stone-400">
                💰 = más barato · ⚡ = más rápido · 🏆 = ambos
            </p>
        </div>
    );
}