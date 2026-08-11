"use client";

import { useState } from "react";

// Chat conversacional para refinar el itinerario con Gemini.
export default function ItineraryChat({ destination, itinerary, onRefined }) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    if (!itinerary || !itinerary.days || itinerary.days.length === 0) return null;

    const SUGGESTIONS = [
        "Prefiero algo más tranquilo",
        "Quita el tercer día y añade un balneario",
        "Añade más planes gastronómicos",
        "Hazlo más romántico",
    ];

    async function handleSubmit(e) {
        e.preventDefault();
        const text = message.trim();
        if (!text || loading) return;

        setLoading(true);
        setError(null);
        setHistory((h) => [...h, { role: "user", text }]);
        setMessage("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destination,
                    currentItinerary: itinerary,
                    message: text,
                }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                setHistory((h) => [...h, { role: "assistant", text: data.error }]);
                return;
            }
            setHistory((h) => [...h, { role: "assistant", text: "Itinerario actualizado ✅" }]);
            onRefined?.(data);
        } catch {
            setError("No hemos podido conectar con la IA ahora mismo.");
            setHistory((h) => [...h, { role: "assistant", text: "No hemos podido conectar con la IA ahora mismo." }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-4 border-t border-stone-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                💬 Refina tu itinerario con IA
            </p>

            {history.length > 0 && (
                <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                    {history.map((h, i) => (
                        <div
                            key={i}
                            className={`rounded-xl px-3 py-2 text-sm ${h.role === "user"
                                    ? "ml-8 bg-brand-50 text-brand-800"
                                    : "mr-8 bg-stone-100 text-stone-700"
                                }`}
                        >
                            {h.text}
                        </div>
                    ))}
                </div>
            )}

            <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setMessage(s)}
                        className="chip bg-white active:scale-95"
                    >
                        {s}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    className="field flex-1"
                    placeholder="Ej. quita el tercer día y añade un balneario…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" className="btn-primary shrink-0 !px-4" disabled={loading}>
                    {loading ? "…" : "Enviar"}
                </button>
            </form>

            {error && (
                <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}