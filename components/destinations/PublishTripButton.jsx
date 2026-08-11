"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Publica una escapada guardada en la comunidad.
export default function PublishTripButton({ trip }) {
    const router = useRouter();
    const [publishing, setPublishing] = useState(false);
    const [message, setMessage] = useState(null);

    if (!trip) return null;

    async function handlePublish() {
        setPublishing(true);
        setMessage(null);
        try {
            const res = await fetch("/api/publish-trip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripId: trip.id }),
            });
            const data = await res.json();
            if (data.error) {
                setMessage({ type: "error", text: data.error });
            } else {
                setMessage({ type: "success", text: "Escapada publicada en la comunidad 🎉" });
                router.refresh();
            }
        } catch {
            setMessage({ type: "error", text: "No hemos podido publicar la escapada." });
        } finally {
            setPublishing(false);
        }
    }

    return (
        <div>
            <button
                onClick={handlePublish}
                disabled={publishing}
                className="btn-ghost text-sm"
            >
                {publishing ? "Publicando…" : "🌍 Publicar en comunidad"}
            </button>
            {message && (
                <p
                    className={`mt-2 rounded-xl px-3 py-2 text-sm ${message.type === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                >
                    {message.text}
                </p>
            )}
        </div>
    );
}