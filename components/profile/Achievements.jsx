"use client";

import { useMemo } from "react";

// Logros e insignias por actividades del usuario.
const ACHIEVEMENTS = [
    {
        id: "first_trip",
        icon: "🌊",
        label: "Primera escapada",
        desc: "Guarda tu primer viaje",
        check: (stats) => stats.trips >= 1,
    },
    {
        id: "coast_lover",
        icon: "🏖️",
        label: "Amante de la costa",
        desc: "Guarda 3 escapadas de costa",
        check: (stats) => stats.coastTrips >= 3,
    },
    {
        id: "interior_explorer",
        icon: "🏞️",
        label: "Explorador de interior",
        desc: "Guarda 3 escapadas de interior",
        check: (stats) => stats.interiorTrips >= 3,
    },
    {
        id: "five_destinations",
        icon: "🗺️",
        label: "Coleccionista",
        desc: "Guarda 5 destinos distintos",
        check: (stats) => stats.destinations >= 5,
    },
    {
        id: "traveler",
        icon: "✈️",
        label: "Viajero frecuente",
        desc: "Guarda 5 viajes",
        check: (stats) => stats.trips >= 5,
    },
    {
        id: "community_publisher",
        icon: "🌍",
        label: "Embajador",
        desc: "Publica una escapada en la comunidad",
        check: (stats) => stats.published >= 1,
    },
];

// Muestra las insignias conseguidas por el usuario.
export default function Achievements({ stats = {} }) {
    const earned = useMemo(
        () => ACHIEVEMENTS.filter((a) => a.check(stats)),
        [stats]
    );
    const total = ACHIEVEMENTS.length;

    if (earned.length === 0 && (stats.trips || 0) === 0) return null;

    return (
        <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
                <span>🏆</span>
                Logros
            </h2>
            <p className="mb-3 text-sm text-stone-500">
                {earned.length} de {total} conseguidos
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ACHIEVEMENTS.map((a) => {
                    const done = earned.includes(a);
                    return (
                        <div
                            key={a.id}
                            className={`rounded-xl p-3 text-center ${done ? "bg-brand-50" : "bg-stone-50 opacity-60"
                                }`}
                            title={a.desc}
                        >
                            <p className={`text-2xl ${done ? "" : "grayscale"}`}>{a.icon}</p>
                            <p className="mt-1 text-xs font-semibold text-ink">{a.label}</p>
                            <p className="text-[10px] text-stone-400">{a.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}