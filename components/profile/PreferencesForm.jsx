"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INTERESTS = [
    { id: "romantic", label: "Romántico", emoji: "💕" },
    { id: "gastronomy", label: "Gastronómico", emoji: "🍷" },
    { id: "nature", label: "Naturaleza", emoji: "🌲" },
    { id: "adventure", label: "Aventura", emoji: "🧗" },
    { id: "culture", label: "Cultura", emoji: "🏛️" },
    { id: "beach", label: "Playa", emoji: "🏖️" },
    { id: "wellness", label: "Bienestar", emoji: "♨️" },
    { id: "nightlife", label: "Vida nocturna", emoji: "🌃" },
];

const PACES = [
    { id: "relaxed", label: "Relajado", emoji: "😌" },
    { id: "balanced", label: "Equilibrado", emoji: "⚖️" },
    { id: "intense", label: "Intenso", emoji: "🔥" },
];

export default function PreferencesForm({ preferences = {} }) {
    const router = useRouter();
    const [interests, setInterests] = useState(preferences.interests || []);
    const [pace, setPace] = useState(preferences.pace || "relaxed");
    const [pets, setPets] = useState(Boolean(preferences.pets));
    const [defaultBudget, setDefaultBudget] = useState(preferences.default_budget || "");
    const [defaultTravelers, setDefaultTravelers] = useState(preferences.default_travelers || 2);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    function toggleInterest(id) {
        setInterests((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const formData = new FormData();
        formData.set("interests", JSON.stringify(interests));
        formData.set("pace", pace);
        formData.set("pets", pets ? "1" : "");
        formData.set("default_budget", defaultBudget);
        formData.set("default_travelers", defaultTravelers);

        try {
            const res = await fetch("/api/preferences", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.error) {
                setMessage({ type: "error", text: data.error });
            } else {
                setMessage({ type: "success", text: "Preferencias guardadas ✅" });
                router.refresh();
            }
        } catch {
            setMessage({ type: "error", text: "No hemos podido guardar las preferencias." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card space-y-6 p-5">
            <div>
                <p className="mb-2 text-sm font-medium text-stone-600">
                    🎯 Intereses
                </p>
                <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((i) => (
                        <button
                            key={i.id}
                            type="button"
                            onClick={() => toggleInterest(i.id)}
                            className={`chip transition active:scale-95 ${interests.includes(i.id)
                                    ? "border-brand-500 bg-brand-50 text-brand-700"
                                    : "bg-white text-stone-600"
                                }`}
                        >
                            {i.emoji} {i.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium text-stone-600">
                    🏃 Ritmo de viaje
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {PACES.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setPace(p.id)}
                            className={`rounded-xl border py-2.5 text-sm font-medium transition active:scale-95 ${pace === p.id
                                    ? "border-brand-500 bg-brand-50 text-brand-700"
                                    : "border-stone-200 bg-white text-stone-600"
                                }`}
                        >
                            {p.emoji} {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
                <input
                    type="checkbox"
                    checked={pets}
                    onChange={(e) => setPets(e.target.checked)}
                    className="h-4 w-4 accent-brand-500"
                />
                🐾 Viajamos con mascota
            </label>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-600">
                        💰 Presupuesto por defecto
                    </label>
                    <input
                        type="number"
                        min={0}
                        className="field"
                        placeholder="Opcional"
                        value={defaultBudget}
                        onChange={(e) => setDefaultBudget(e.target.value)}
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-600">
                        👥 Viajeros por defecto
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={12}
                        className="field"
                        value={defaultTravelers}
                        onChange={(e) => setDefaultTravelers(Number(e.target.value))}
                    />
                </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? "Guardando…" : "Guardar preferencias"}
            </button>

            {message && (
                <p
                    className={`rounded-xl px-3 py-2 text-center text-sm ${message.type === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                >
                    {message.text}
                </p>
            )}
        </form>
    );
}