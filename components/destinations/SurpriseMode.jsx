"use client";

import { formatEuro } from "@/lib/utils/format";
import Link from "next/link";
import { useMemo, useState } from "react";

// Modo sorpresa: dado un origen y presupuesto, sugiere 3 destinos al azar
// con un argumento de venta. Muy viral para compartir con la pareja.
const SELLING_POINTS = {
    costa: ["playa tranquila", "atardeceres espectaculares", "chiringuitos con encanto", "paseos junto al mar"],
    interior: ["pueblo con mucha gastronomía", "rincones con historia", "naturaleza y senderismo", "escapada rural auténtica"],
};

export default function SurpriseMode({ destinations = [], origin = "", budget = "" }) {
    const [seed, setSeed] = useState(0);

    const picks = useMemo(() => {
        if (!destinations || destinations.length === 0) return [];
        const budgetNum = Number(budget) || 0;
        const affordable = budgetNum > 0
            ? destinations.filter((d) => (d.estimatedCost || 0) <= budgetNum)
            : destinations;
        const pool = affordable.length > 0 ? affordable : destinations;
        // Barajado determinista según seed
        const shuffled = [...pool].sort((a, b) => {
            const ha = hash(a.slug + seed);
            const hb = hash(b.slug + seed);
            return ha - hb;
        });
        return shuffled.slice(0, 3);
    }, [destinations, budget, seed]);

    if (picks.length === 0) return null;

    function hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (h << 5) - h + str.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h);
    }

    function sellingPoint(d) {
        const list = SELLING_POINTS[d.region] || SELLING_POINTS.interior;
        return list[hash(d.slug + seed) % list.length];
    }

    return (
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 p-5">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">🎲 Modo sorpresa</h3>
                <button
                    type="button"
                    onClick={() => setSeed(seed + 1)}
                    className="chip bg-white active:scale-95"
                >
                    🔄 Otras opciones
                </button>
            </div>
            <p className="mb-4 text-sm text-stone-600">
                {origin ? `Desde ${origin}, ` : ""}¿qué tal estas 3 escapadas?
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {picks.map((d, i) => (
                    <Link
                        key={d.slug}
                        href={`/destinos/${d.slug}?origin=${encodeURIComponent(origin || "")}&startDate=${encodeURIComponent(d.startDate || "")}&endDate=${encodeURIComponent(d.endDate || "")}&travelers=2&transport=car`}
                        className="group relative overflow-hidden rounded-xl bg-white shadow-card transition hover:shadow-lg"
                    >
                        <div className="relative h-32 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={d.image}
                                alt={d.name}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
                                #{i + 1}
                            </span>
                        </div>
                        <div className="p-3">
                            <p className="font-bold text-ink">{d.name}</p>
                            <p className="text-xs text-stone-500">✨ {sellingPoint(d)}</p>
                            {d.estimatedCost && (
                                <p className="mt-1 text-sm font-semibold text-brand-600">
                                    {formatEuro(d.estimatedCost)} aprox.
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}