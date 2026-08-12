"use client";

import { useToast } from "@/components/common/ToastProvider";
import { useState } from "react";

// Permite compartir un viaje guardado creando un enlace público
// con edición colaborativa para la pareja.
export default function ShareTripButton({ tripId }) {
    const notify = useToast();
    const [loading, setLoading] = useState(false);

    async function share() {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch("/api/shared-trips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripId }),
            });
            const data = await res.json();
            if (!res.ok || !data.url) {
                notify(data.error || "No hemos podido compartir.", "error");
                return;
            }
            const fullUrl = new URL(data.url, window.location.origin).toString();
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: "Nuestra escapada 🌍",
                        text: "¡Mira el plan de nuestra escapada y edítalo juntos!",
                        url: fullUrl,
                    });
                    return;
                } catch {
                    // Usuario canceló; copiamos igualmente.
                }
            }
            await navigator.clipboard.writeText(fullUrl);
            notify("Enlace copiado ✓ Compártelo con tu pareja");
        } catch {
            notify("No hemos podido compartir.", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={share}
            disabled={loading}
            className="btn-ghost text-sm"
            title="Compartir este plan para editar en pareja"
        >
            {loading ? "Creando enlace…" : "👫 Compartir plan"}
        </button>
    );
}