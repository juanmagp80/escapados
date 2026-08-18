"use client";

import { useToast } from "@/components/common/ToastProvider";
import { useState, useEffect, useMemo } from "react";

// Toggle para activar/desactivar alertas de precio diarias.
// Re-lanza la búsqueda guardada cada día y notifica por Telegram
// cuando algún precio baja.
export default function PriceAlertToggle({ query, hasTelegram = false }) {
  const notify = useToast();
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [checked, setChecked] = useState(false);
  const [alertId, setAlertId] = useState(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    }
    return p;
  }, [query]);

  useEffect(() => {
    fetch(`/api/price-alerts?check=1&${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.active) {
          setActive(true);
          setAlertId(data.alert?.id || null);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [params]);

  function toggle() {
    if (loading || !checked) return;

    if (!hasTelegram) {
      notify(
        "Configura tu chat ID de Telegram en /perfil para recibir notificaciones.",
        "error"
      );
      return;
    }

    setLoading(true);
    const method = active ? "DELETE" : "POST";
    const body = active
      ? JSON.stringify({ alertId })
      : JSON.stringify({ ...query, label: "Búsqueda desde /buscar" });

    fetch("/api/price-alerts", {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          notify(data.error, "error");
        } else {
          setActive(!active);
          if (!active) setAlertId(data.alert?.id);
          notify(
            active
              ? "Alerta de precios desactivada."
              : "Alerta de precios activada. Te notificaremos por Telegram cuando baje el precio."
          );
        }
      })
      .catch(() => {
        notify("No hemos podido actualizar la alerta.", "error");
      })
      .finally(() => setLoading(false));
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !checked}
      className={`text-sm ${
        active
          ? "btn-primary"
          : "btn-ghost"
      }`}
      title="Notificación diaria por Telegram cuando baje el precio"
    >
      {loading
        ? "Procesando…"
        : active
          ? "🔔 Alerta activada"
          : "🔕 Avisarme si baja (Telegram)"}
    </button>
  );
}
