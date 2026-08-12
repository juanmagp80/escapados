"use client";

import { useToast } from "@/components/common/ToastProvider";
import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Permite al usuario activar/desactivar notificaciones push
// (alertas de precio y cambios de meteorología) en la PWA instalada.
export default function PushNotificationsToggle() {
    const notify = useToast();
    const [supported, setSupported] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            "PushManager" in window
        ) {
            setSupported(true);
            navigator.serviceWorker.ready
                .then((reg) => reg.pushManager.getSubscription())
                .then((sub) => setEnabled(Boolean(sub)))
                .catch(() => setEnabled(false));
        }
    }, []);

    async function subscribe() {
        if (!VAPID_PUBLIC_KEY) {
            notify("Las notificaciones no están configuradas.", "error");
            return;
        }
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const res = await fetch("/api/push-subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sub),
            });
            const data = await res.json();
            if (!res.ok) {
                notify(data.error || "No hemos podido activar.", "error");
                return;
            }
            setEnabled(true);
            notify("Notificaciones activadas ✓");
        } catch (err) {
            notify(
                err?.name === "NotAllowedError"
                    ? "Has bloqueado las notificaciones en el navegador."
                    : "No hemos podido activar las notificaciones.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }

    async function unsubscribe() {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                await fetch("/api/push-subscribe", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                });
            }
            setEnabled(false);
            notify("Notificaciones desactivadas.");
        } catch {
            notify("No hemos podido desactivar.", "error");
        } finally {
            setLoading(false);
        }
    }

    if (!supported) {
        return (
            <p className="text-xs text-stone-400">
                Las notificaciones no están disponibles en este navegador.
            </p>
        );
    }

    return (
        <button
            onClick={enabled ? unsubscribe : subscribe}
            disabled={loading}
            className={`btn-ghost text-sm ${enabled ? "!border-brand-500 !text-brand-600" : ""}`}
            title="Alertas de precios y meteorología en tu dispositivo"
        >
            {loading
                ? "Procesando…"
                : enabled
                    ? "🔔 Notificaciones activadas"
                    : "🔕 Activar notificaciones"}
        </button>
    );
}