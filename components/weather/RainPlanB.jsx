"use client";

import { describeWeatherCode } from "@/lib/weather/openMeteo";
import { useState } from "react";

// Plan B meteorológico: cuando el pronóstico del viaje da lluvia, sugiere
// alternativas de interior cercanas al destino.
const INDOOR_PLANS = [
    { emoji: "🏛️", label: "Museos y exposiciones", tip: "Busca museos municipales o centros de interpretación." },
    { emoji: "🍷", label: "Bodegas y catas", tip: "Muchos pueblos tienen bodegas con visitas guiadas." },
    { emoji: "♨️", label: "Balnearios y spas", tip: "Plan perfecto para parejas en un día lluvioso." },
    { emoji: "🍽️", label: "Gastronomía local", tip: "Aprovecha para probar los platos típicos del lugar." },
    { emoji: "🎭", label: "Teatros y espectáculos", tip: "Consulta la cartelera local para esa noche." },
    { emoji: "📚", label: "Librerías y cafés", tip: "Librerías con encanto y cafeterías acogedoras." },
    { emoji: "⛪", label: "Iglesias y monumentos", tip: "El patrimonio religioso suele estar abierto todo el día." },
    { emoji: "🧀", label: "Mercados y degustaciones", tip: "Mercados de abastos con productos locales." },
];

export default function RainPlanB({ rainyDays = [] }) {
    const [expanded, setExpanded] = useState(false);
    if (!rainyDays || rainyDays.length === 0) return null;

    const dates = rainyDays
        .map((d) => {
            const date = new Date(d.date + "T12:00:00");
            return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
        })
        .join(", ");

    const visible = expanded ? INDOOR_PLANS : INDOOR_PLANS.slice(0, 4);

    return (
        <div className="mt-3 rounded-xl2 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
                🌧️ Plan B para día de lluvia ({dates})
            </p>
            <p className="mt-1 text-xs text-amber-700">
                El pronóstico indica lluvia para tus fechas. Aquí tienes alternativas
                de interior para no perder la escapada:
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {visible.map((p) => (
                    <div key={p.label} className="rounded-xl bg-white p-3">
                        <p className="text-sm font-medium text-ink">
                            {p.emoji} {p.label}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">{p.tip}</p>
                    </div>
                ))}
            </div>
            {INDOOR_PLANS.length > 4 && (
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs font-medium text-brand-600"
                >
                    {expanded ? "▲ Ver menos" : "▼ Más ideas"}
                </button>
            )}
            <p className="mt-2 text-[10px] text-amber-600/70">
                Sugerencias orientativas. {rainyDays.map((d) => describeWeatherCode(d.code).emoji).join(" ")}
            </p>
        </div>
    );
}