"use client";

import { useState } from "react";

const CATEGORIES = [
    { id: "value_for_money", label: "Calidad/precio", emoji: "💶" },
    { id: "romance", label: "Romanticismo", emoji: "💕" },
    { id: "gastronomy", label: "Gastronomía", emoji: "🍷" },
    { id: "activities", label: "Actividades", emoji: "🏛️" },
];

// Valoración de un destino tras el viaje. Alimenta el scoring de la comunidad.
export default function RatingForm({ destination }) {
    const [ratings, setRatings] = useState({});
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    function setRating(cat, value) {
        setRatings((prev) => ({ ...prev, [cat]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const filled = Object.values(ratings).filter(Boolean);
        if (filled.length === 0) {
            setMessage({ type: "error", text: "Valora al menos una categoría." });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/rating", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destination, ratings, comment }),
            });
            const data = await res.json();
            if (data.error) {
                setMessage({ type: "error", text: data.error });
            } else {
                setMessage({ type: "success", text: "¡Gracias por tu valoración! ⭐" });
            }
        } catch {
            setMessage({ type: "error", text: "No hemos podido guardar la valoración." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-stone-100 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                ⭐ ¿Ya has estado? Valora este destino
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="rounded-xl bg-stone-50 p-2 text-center">
                        <p className="text-xs text-stone-500">
                            {cat.emoji} {cat.label}
                        </p>
                        <div className="mt-1 flex justify-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(cat.id, star)}
                                    className={`text-lg transition active:scale-90 ${(ratings[cat.id] || 0) >= star ? "" : "opacity-30 grayscale"
                                        }`}
                                    aria-label={`${star} estrellas`}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <textarea
                className="field w-full"
                placeholder="Cuéntanos tu experiencia (opcional)…"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit" className="btn-ghost text-sm" disabled={saving}>
                {saving ? "Guardando…" : "Enviar valoración"}
            </button>
            {message && (
                <p
                    className={`rounded-xl px-3 py-2 text-sm ${message.type === "success"
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