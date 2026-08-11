"use client";

import { useState } from "react";

// Alerta de precio: el usuario se suscribe a una ruta+fecha y recibe
// notificación cuando el precio baja.
export default function PriceAlert({ from, to, date, currentPrice }) {
    const [subscribed, setSubscribed] = useState(false);
    const [message, setMessage] = useState(null);

    if (!from || !to || !date || !currentPrice) return null;

    async function handleSubscribe() {
        try {
            const res = await fetch("/api/price-alert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from, to, date, currentPrice }),
            });
            const data = await res.json();
            if (data.error) {
                setMessage({ type: "error", text: data.error });
            } else {
                setSubscribed(true);
                setMessage({
                    type: "success",
                    text: data.isDrop
                        ? "🔔 ¡Este precio está por debajo de la media reciente!"
                        : "🔔 Te avisaremos si el precio baja.",
                });
            }
        } catch {
            setMessage({ type: "error", text: "No hemos podido activar la alerta." });
        }
    }

    return (
        <div className="mt-3 border-t border-stone-100 pt-3">
            <button
                onClick={handleSubscribe}
                disabled={subscribed}
                className="chip bg-white active:scale-95"
            >
                {subscribed ? "🔔 Alerta activada" : "🔔 Avisarme si baja"}
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