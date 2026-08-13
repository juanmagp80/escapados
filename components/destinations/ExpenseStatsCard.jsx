"use client";

import { formatEuro } from "@/lib/utils/format";
import Link from "next/link";
import { useEffect, useState } from "react";

// Muestra «lo que cuesta de verdad» para un destino: percentiles del gasto
// real reportado por usuarios que ya han vuelto. Tiende a no renderizar el
// número hasta que hay suficientes muestras (muralla anti-conclusiones).
export default function ExpenseStatsCard({ destination }) {
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!destination) return;
    const params = new URLSearchParams({ destination });
    fetch(`/api/expense-stats?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data?.stats || null);
      })
      .catch(() => setStats(null))
      .finally(() => setLoaded(true));
  }, [destination]);

  const reportUrl = `/reportar?${new URLSearchParams({ destination }).toString()}`;

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        📊 Lo que cuesta de verdad
      </p>
      <p className="text-xs text-stone-500">
        Gasto real reportado por quienes ya han vuelto de {destination}
      </p>

      {loaded && stats && stats.count > 0 && (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-ink">
              {formatEuro(stats.median)}
            </span>
            <span className="text-xs text-stone-500">/ viaje (mediana)</span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            La mayoría de viajes cuesta entre{" "}
            <span className="font-semibold">{formatEuro(stats.p25)}</span> y{" "}
            <span className="font-semibold">{formatEuro(stats.p75)}</span>
          </p>
          {stats.perPersonNight?.median != null && (
            <p className="text-sm text-stone-600">
              ≈{" "}
              <span className="font-semibold">
                {formatEuro(stats.perPersonNight.median)}
              </span>{" "}
              €/persona/noche
            </p>
          )}
          <p className="mt-2 text-xs text-stone-400">
            Basado en {stats.count} escapadas reales a {destination}
          </p>
        </div>
      )}

      {loaded && !stats && (
        <p className="mt-2 text-xs text-stone-400">
          Aún no tenemos suficientes reportes de {destination} para dar un
          dato de confianza.
        </p>
      )}

      <Link
        href={reportUrl}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
      >
        ¿Ya has vuelto? Cuenta cuánto gastasteis →
      </Link>
    </div>
  );
}