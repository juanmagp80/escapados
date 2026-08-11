"use client";

import { formatEuro } from "@/lib/utils/format";
import { useState } from "react";

// Calendario de precios: muestra las opciones de vuelo del mes como un
// heatmap de fechas, resaltando la más barata.
export default function PriceCalendar({ options = [], onSelect, selectedDate }) {
    const [expanded, setExpanded] = useState(false);
    if (!options || options.length === 0) return null;

    const sorted = [...options].sort((a, b) => a.totalPrice - b.totalPrice);
    const min = sorted[0]?.totalPrice || 0;
    const max = sorted[sorted.length - 1]?.totalPrice || min + 1;
    const range = Math.max(max - min, 1);

    function heatColor(price) {
        // Verde (barato) → rojo (caro)
        const t = (price - min) / range;
        const r = Math.round(34 + t * 200);
        const g = Math.round(197 - t * 160);
        const b = Math.round(94 - t * 60);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function dayLabel(dateStr) {
        const d = new Date(dateStr + "T12:00:00");
        return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
    }

    const visible = expanded ? sorted : sorted.slice(0, 6);

    return (
        <div className="mt-3 border-t border-stone-100 pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                📅 Calendario de precios — {sorted.length} opciones
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {visible.map((opt) => {
                    const isSelected =
                        selectedDate && opt.outbound === selectedDate;
                    const isCheapest = opt.totalPrice === min;
                    return (
                        <button
                            key={`${opt.outbound}-${opt.returnDate}`}
                            type="button"
                            onClick={() => onSelect?.(opt)}
                            className={`rounded-lg p-2 text-left text-xs transition hover:scale-[1.02] ${isSelected ? "ring-2 ring-brand-500" : ""
                                }`}
                            style={{ backgroundColor: heatColor(opt.totalPrice) }}
                        >
                            <p className="font-semibold text-white drop-shadow">
                                {dayLabel(opt.outbound)} → {dayLabel(opt.returnDate)}
                            </p>
                            <p className="font-bold text-white drop-shadow">
                                {formatEuro(opt.totalPrice)}
                                {isCheapest && <span className="ml-1">🏷️</span>}
                            </p>
                            <p className="text-[10px] text-white/80">{opt.nights} noches</p>
                        </button>
                    );
                })}
            </div>
            {sorted.length > 6 && (
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs font-medium text-brand-600"
                >
                    {expanded ? "▲ Ver menos" : `▼ Ver las ${sorted.length} opciones`}
                </button>
            )}
            <p className="mt-2 text-[10px] text-stone-400">
                🏷️ = opción más barata. Los colores van de verde (barato) a rojo (caro).
            </p>
        </div>
    );
}