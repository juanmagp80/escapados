"use client";

import { useToast } from "@/components/common/ToastProvider";
import { useEffect, useState } from "react";

const CATEGORIES = {
    maleta: "🧳 Maleta",
    reservas: "📋 Reservas",
    documentos: "🪪 Documentos",
    extras: "✨ Extras",
};

const DEFAULT_ITEMS = [
    { id: "doc-dni", category: "documentos", label: "DNI / pasaporte", done: false },
    { id: "doc-tarjetas", category: "documentos", label: "Tarjetas de crédito / efectivo", done: false },
    { id: "doc-movil", category: "documentos", label: "Móvil y cargador", done: false },
    { id: "mal-medic", category: "maleta", label: "Medicación", done: false },
    { id: "mal-ropa", category: "maleta", label: "Ropa adecuada al clima", done: false },
    { id: "mal-aseo", category: "maleta", label: "Artículos de aseo", done: false },
    { id: "res-hotel", category: "reservas", label: "Confirmación de alojamiento", done: false },
    { id: "res-transporte", category: "reservas", label: "Billetes de transporte", done: false },
];

// Checklist de viaje por escapada: maleta, reservas y documentos.
// Se sincroniza con Supabase vía la API de checklists.
export default function TripChecklist({ slug, destination }) {
    const notify = useToast();
    const [items, setItems] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState("");
    const [newCat, setNewCat] = useState("maleta");

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await fetch(`/api/checklists?slug=${slug}`);
                const data = await res.json();
                if (active) {
                    if (Array.isArray(data.items)) setItems(data.items);
                    else setItems(DEFAULT_ITEMS);
                }
            } catch {
                if (active) setItems(DEFAULT_ITEMS);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [slug]);

    async function persist(next) {
        setItems(next);
        try {
            await fetch("/api/checklists", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, items: next }),
            });
        } catch {
            notify("No hemos podido guardar.", "error");
        }
    }

    function toggle(itemId) {
        if (!items) return;
        persist(items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)));
    }

    function remove(itemId) {
        if (!items) return;
        persist(items.filter((it) => it.id !== itemId));
    }

    function add() {
        const label = newItem.trim();
        if (!label) return;
        const id = `item-${Date.now()}`;
        persist([...items, { id, category: newCat, label, done: false }]);
        setNewItem("");
    }

    if (loading) {
        return (
            <div className="animate-pulse rounded-xl2 bg-stone-100 p-4 text-sm text-stone-400">
                Cargando checklist…
            </div>
        );
    }

    const doneCount = items?.filter((i) => i.done).length || 0;
    const total = items?.length || 0;
    const pct = total ? Math.round((doneCount / total) * 100) : 0;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Checklist de viaje</p>
                <span className="text-xs text-stone-400">
                    {doneCount}/{total} · {pct}%
                </span>
            </div>
            <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Progreso del checklist"
            >
                <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {Object.entries(CATEGORIES).map(([key, label]) => {
                const catItems = items.filter((i) => i.category === key);
                if (catItems.length === 0) return null;
                return (
                    <div key={key}>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">
                            {label}
                        </p>
                        <ul className="space-y-1">
                            {catItems.map((it) => (
                                <li
                                    key={it.id}
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-stone-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={it.done}
                                        onChange={() => toggle(it.id)}
                                        className="h-4 w-4 accent-brand-500"
                                        aria-label={`Marcar ${it.label}`}
                                    />
                                    <span
                                        className={`flex-1 text-sm ${it.done
                                                ? "text-stone-400 line-through"
                                                : "text-stone-700"
                                            }`}
                                    >
                                        {it.label}
                                    </span>
                                    <button
                                        onClick={() => remove(it.id)}
                                        className="text-xs text-stone-300 hover:text-red-400"
                                        aria-label={`Eliminar ${it.label}`}
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}

            <div className="flex gap-2 pt-1">
                <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="rounded-lg border border-stone-200 bg-white px-2 py-2 text-sm text-ink"
                    aria-label="Categoría del nuevo elemento"
                >
                    {Object.keys(CATEGORIES).map((k) => (
                        <option key={k} value={k}>
                            {CATEGORIES[k]}
                        </option>
                    ))}
                </select>
                <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && add()}
                    placeholder="Añadir elemento…"
                    className="field flex-1 !py-2 text-sm"
                    aria-label="Nuevo elemento del checklist"
                />
                <button
                    onClick={add}
                    className="btn-ghost !px-3 !py-2 text-sm"
                    aria-label="Añadir"
                >
                    +
                </button>
            </div>
        </div>
    );
}