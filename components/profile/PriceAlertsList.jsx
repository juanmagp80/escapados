"use client";

import { useToast } from "@/components/common/ToastProvider";
import { useState, useTransition } from "react";

// Lista de alertas de precio guardadas con botón para eliminarlas.
export default function PriceAlertsList({ initialAlerts }) {
  const notify = useToast();
  const [alerts, setAlerts] = useState(initialAlerts || []);
  const [pending, startTransition] = useTransition();

  function remove(alertId) {
    startTransition(async () => {
      const res = await fetch("/api/price-alerts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      const data = await res.json();
      if (data.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        notify("Alerta eliminada.");
      } else {
        notify(data.error || "Error al eliminar.", "error");
      }
    });
  }

  function formatParams(params) {
    if (!params) return "…";
    const parts = [];
    if (params.transport === "plane") parts.push("✈️ Avión");
    else parts.push("🚗 Coche");
    if (params.vacations) parts.push("vacaciones");
    if (params.wholeMonth) parts.push("mes completo");
    parts.push(`${params.origin || "?"} → ${new Date().toLocaleDateString("es-ES", { month: "short" })}`);
    return parts.join(" · ");
  }

  if (alerts.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No tienes alertas de precio guardadas. En la página de resultados de
        búsqueda, activa la opción &ldquo;Avisarme si baja&rdquo; para crear una.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between rounded-lg border border-stone-200 p-3"
        >
          <div>
            <p className="font-medium text-ink">
              {alert.label || formatParams(alert.query_params)}
            </p>
            <p className="text-xs text-stone-500">
              {alert.active ? "Activa" : "Inactiva"} ·{" "}
              {alert.last_checked
                ? `Última revisión: ${new Date(alert.last_checked).toLocaleDateString("es-ES")}`
                : "Sin revisar todavía"}
            </p>
            {alert.last_price && (
              <p className="text-xs text-stone-500">
                Último precio más bajo: {alert.last_price} €
              </p>
            )}
          </div>
          <button
            onClick={() => remove(alert.id)}
            disabled={pending}
            className="text-xs text-stone-500 underline hover:text-red-600"
          >
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
