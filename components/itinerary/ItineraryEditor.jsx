"use client";

import { useState } from "react";

const DRAG_TYPES = { ACTIVITY: "activity", DAY: "day" };

// Editor visual del itinerario: permite reordenar días completos y
// mover actividades entre días mediante arrastrar y soltar (drag & drop).
export default function ItineraryEditor({ days, onChange }) {
    const [drag, setDrag] = useState(null);

    function handleDrop(targetDayIdx, targetItemIdx) {
        if (!drag) return;

        const next = days.map((d) => ({
            ...d,
            activities: [...(d.activities || [])],
        }));

        if (drag.type === DRAG_TYPES.DAY) {
            const [moved] = next.splice(drag.dayIdx, 1);
            next.splice(targetDayIdx, 0, moved);
            const renumbered = next.map((d, i) => ({ ...d, day: i + 1 }));
            onChange(renumbered);
        } else if (drag.type === DRAG_TYPES.ACTIVITY) {
            const fromDay = next[drag.dayIdx];
            const [moved] = fromDay.activities.splice(drag.itemIdx, 1);

            const insertAt = targetItemIdx ?? fromDay.activities.length;
            const toDay = next[targetDayIdx];
            const clamp = Math.max(0, Math.min(insertAt, toDay.activities.length));
            toDay.activities.splice(clamp, 0, moved);
            const renumbered = next.map((d, i) => ({ ...d, day: i + 1 }));
            onChange(renumbered);
        }

        setDrag(null);
    }

    return (
        <div className="space-y-3">
            <p className="text-xs text-stone-400">
                🖱️ Arrastra las actividades para reordenarlas o moverlas entre días.
            </p>
            {days.map((d, di) => (
                <div
                    key={d.day ?? di}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(di, null);
                    }}
                    className={`rounded-xl2 border-2 border-dashed p-3 transition ${drag?.dayIdx === di
                            ? "border-brand-400 bg-brand-50/50"
                            : "border-stone-100 bg-white"
                        }`}
                >
                    <div
                        draggable
                        onDragStart={(e) => {
                            const payload = JSON.stringify({
                                type: DRAG_TYPES.DAY,
                                dayIdx: di,
                            });
                            e.dataTransfer.setData("text/plain", payload);
                            setDrag({ type: DRAG_TYPES.DAY, dayIdx: di });
                        }}
                        onDragEnd={() => setDrag(null)}
                        className="mb-2 flex cursor-grab items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 active:cursor-grabbing"
                        title="Arrastra para mover el día completo"
                    >
                        <span className="text-stone-400">⠿</span>
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-sm font-bold text-brand-700">
                            Día {d.day ?? di + 1}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium text-ink">
                            {d.title}
                        </span>
                    </div>

                    <ul className="space-y-1">
                        {(d.activities || []).map((a, ai) => (
                            <li
                                key={`${di}-${ai}`}
                                draggable
                                onDragStart={(e) => {
                                    const payload = JSON.stringify({
                                        type: DRAG_TYPES.ACTIVITY,
                                        dayIdx: di,
                                        itemIdx: ai,
                                    });
                                    e.dataTransfer.setData("text/plain", payload);
                                    setDrag({
                                        type: DRAG_TYPES.ACTIVITY,
                                        dayIdx: di,
                                        itemIdx: ai,
                                    });
                                }}
                                onDragEnd={() => setDrag(null)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDrop(di, ai);
                                }}
                                className={`group flex cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 transition active:cursor-grabbing ${drag?.type === DRAG_TYPES.ACTIVITY &&
                                        drag?.dayIdx === di &&
                                        drag?.itemIdx === ai
                                        ? "opacity-40"
                                        : "hover:bg-brand-50"
                                    }`}
                            >
                                <span className="text-stone-300 group-hover:text-brand-400">
                                    ⠿
                                </span>
                                <span className="w-10 shrink-0 text-xs font-semibold text-brand-600">
                                    {a.time}
                                </span>
                                <span className="flex-1 text-sm text-stone-700">
                                    {a.name}
                                </span>
                            </li>
                        ))}
                        {(d.activities || []).length === 0 && (
                            <li className="px-2 py-1 text-xs text-stone-400">
                                Sin actividades — arrastra una aquí.
                            </li>
                        )}
                    </ul>

                    {d.restaurants?.length > 0 && (
                        <p className="mt-1 pl-2 text-xs text-stone-500">
                            🍽️ {d.restaurants.join(" · ")}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}