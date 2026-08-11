"use client";

import { useMemo } from "react";

// Agrupa las actividades del día por cercanía geográfica para evitar
// desplazamientos innecesarios (mañana en un barrio, tarde en otro).
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Devuelve grupos de actividades que están a menos de `maxDistanceKm` entre sí.
function groupByProximity(activities, maxDistanceKm = 4) {
    if (!activities || activities.length === 0) return [];
    const groups = [];
    const used = new Set();

    for (let i = 0; i < activities.length; i++) {
        if (used.has(i)) continue;
        const group = [activities[i]];
        used.add(i);
        for (let j = i + 1; j < activities.length; j++) {
            if (used.has(j)) continue;
            const a = activities[i];
            const b = activities[j];
            if (
                a.lat != null &&
                a.lon != null &&
                b.lat != null &&
                b.lon != null &&
                haversine(a.lat, a.lon, b.lat, b.lon) <= maxDistanceKm
            ) {
                group.push(activities[j]);
                used.add(j);
            }
        }
        groups.push(group);
    }
    return groups;
}

function ActivityItem({ a }) {
    return (
        <li className="flex gap-3">
            <div className="flex w-14 shrink-0 flex-col items-end pt-0.5 text-right">
                <span className="text-sm font-semibold text-brand-600">{a.time}</span>
                {a.duration && (
                    <span className="text-xs text-stone-400">{a.duration}</span>
                )}
            </div>
            <div className="flex-1 border-l border-stone-200 pb-3 pl-4">
                <p className="font-semibold text-ink">{a.name}</p>
                {a.description && (
                    <p className="mt-0.5 text-sm text-stone-500">{a.description}</p>
                )}
                {a.lat != null && a.lon != null && (
                    <a
                        href={`https://www.google.com/maps?q=${a.lat},${a.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-brand-600"
                    >
                        📍 Ver en mapa
                    </a>
                )}
            </div>
        </li>
    );
}

export default function ItineraryGeo({ days = [] }) {
    const groupedDays = useMemo(
        () =>
            days.map((d) => ({
                ...d,
                groups: groupByProximity(d.activities || []),
            })),
        [days]
    );

    return (
        <div className="space-y-4">
            {groupedDays.map((d) => (
                <div key={d.day}>
                    <h3 className="mb-2 flex items-center gap-2 font-bold text-ink">
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-sm text-brand-700">
                            Día {d.day}
                        </span>
                        {d.title}
                    </h3>

                    {d.groups.length > 0 ? (
                        d.groups.map((group, gi) => (
                            <div key={gi} className="mb-3">
                                {group.length > 1 && (
                                    <p className="mb-1.5 pl-[3.5rem] text-xs font-medium text-stone-400">
                                        🗺️ Zona cercana — {group.map((a) => a.name.split(" ")[0]).join(", ")}…
                                    </p>
                                )}
                                <ul>
                                    {group.map((a, i) => (
                                        <ActivityItem key={i} a={a} />
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <ul>
                            {(d.activities || []).map((a, i) => (
                                <ActivityItem key={i} a={a} />
                            ))}
                        </ul>
                    )}

                    {d.restaurants?.length > 0 && (
                        <p className="mt-1 pl-[4.5rem] text-sm text-stone-500">
                            🍽️ {d.restaurants.join(" · ")}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}