"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/utils/format";

const COLUMNS = [
  { key: "name", label: "Destino", sortable: false, width: "w-32" },
  { key: "estimatedCost", label: "Total est. (no incluye extras)", numeric: true, width: "w-24" },
  { key: "hotelCost", label: "Hotel", numeric: true, width: "w-20" },
  { key: "transportCost", label: "Transporte", numeric: true, width: "w-24" },
  { key: "foodCost", label: "Comida extra", numeric: true, width: "w-20" },
  { key: "activitiesCost", label: "Actividades extra", numeric: true, width: "w-24" },
  { key: "distanceKm", label: "Distancia", numeric: true, width: "w-20" },
  { key: "score", label: "Score", numeric: true, width: "w-16" },
];

function fmtDistance(km) {
  if (km === null || km === undefined) return "—";
  return `${Math.round(km)} km`;
}

function BudgetBadge({ cost, budget }) {
  if (!budget || !cost) return <span className="text-stone-400">—</span>;
  const ratio = cost / budget;
  if (ratio <= 1) return <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">🟢 {Math.round((1-ratio)*100)}%</span>;
  if (ratio <= 1.15) return <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full text-xs font-medium">🟡 +{Math.round((ratio-1)*100)}%</span>;
  return <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">🔴 +{Math.round((ratio-1)*100)}%</span>;
}

function BreakdownRow({ label, value, icon }) {
  if (!value && value !== 0) return null;
  return (
    <tr className="border-t border-stone-100">
      <td className="py-1.5 px-3 text-xs text-stone-500 flex items-center gap-1">{icon} {label}</td>
      <td className="py-1.5 px-3 text-xs font-medium text-ink text-right">{formatEuro(value)}</td>
    </tr>
  );
}

export default function Comparator({ destinations, query }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState("estimatedCost");
  const [dir, setDir] = useState(1);
  const [showBreakdown, setShowBreakdown] = useState({});

  const budget = query.budget ? Number(query.budget) : null;

  const sorted = useMemo(() => {
    return [...destinations].sort((a, b) => {
      const av = a[sortKey] ?? Infinity;
      const bv = b[sortKey] ?? Infinity;
      return (av - bv) * dir;
    });
  }, [destinations, sortKey, dir]);

  function toggleSort(key) {
    if (sortKey === key) setDir(-dir);
    else { setSortKey(key); setDir(1); }
  }

  function toggleBreakdown(slug) {
    setShowBreakdown(prev => ({ ...prev, [slug]: !prev[slug] }));
  }

  function cell(dest, key) {
    switch (key) {
      case "name":
        return (
          <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleBreakdown(dest.slug); }}>
            <span className="font-semibold text-ink">{dest.name}</span>
            <span className="text-xs text-stone-400">{showBreakdown[dest.slug] ? "▲" : "▼"}</span>
          </div>
        );
      case "estimatedCost":
        return (
          <div className="flex flex-col items-end">
            <span className="font-medium text-ink">{dest.estimatedCost ? formatEuro(dest.estimatedCost) : "—"}</span>
            {budget && dest.estimatedCost && <BudgetBadge cost={dest.estimatedCost} budget={budget} />}
          </div>
        );
      case "hotelCost":
        return dest.hotelCost ? formatEuro(dest.hotelCost) : "—";
      case "transportCost":
        return dest.transportCost ? formatEuro(dest.transportCost) : "—";
      case "foodCost":
        return dest.foodCost ? formatEuro(dest.foodCost) : "—";
      case "activitiesCost":
        return dest.activitiesCost ? formatEuro(dest.activitiesCost) : "—";
      case "distanceKm":
        return fmtDistance(dest.distanceKm);
      case "score":
        return dest.score != null ? dest.score : "—";
      default:
        return "—";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sortKey}
          onChange={(e) => { setSortKey(e.target.value); setDir(1); }}
          className="field py-2 px-3 text-sm"
        >
          {COLUMNS.filter(c => c.sortable !== false).map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <button onClick={() => setDir(-dir)} className="btn-ghost text-xs">
          {dir === 1 ? "▲ Asc" : "▼ Desc"}
        </button>
        <button
          onClick={() => {
            const csv = [
              COLUMNS.map(c => c.label).join(","),
              ...sorted.map(d => COLUMNS.map(c => {
                const val = cell(d, c.key);
                return typeof val === "object" ? "" : String(val).replace(/[€,]/g, "");
              }).join(","))
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `comparacion-${query.origin}-${query.startDate}.csv`;
            a.click(); URL.revokeObjectURL(url);
          }}
          className="btn-ghost text-xs"
        >
          📥 Exportar CSV
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Enlace copiado al portapapeles");
          }}
          className="btn-ghost text-xs"
        >
          🔗 Compartir
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-500">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={`py-2 pr-3 font-medium ${c.sortable === false ? "" : "cursor-pointer select-none"}`}
                  style={{ width: c.width }}
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                >
                  {c.label}
                  {sortKey === c.key ? (dir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <React.Fragment key={d.slug}>
                <tr
                  onClick={() => router.push(`/destinos/${d.slug}?${new URLSearchParams(query).toString()}`)}
                  className="cursor-pointer border-b border-stone-100 transition hover:bg-brand-50/50"
                >
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={`py-3 pr-3 ${c.numeric ? "text-right font-medium text-ink" : "font-semibold text-ink"}`}>
                      {cell(d, c.key)}
                    </td>
                  ))}
                </tr>
                {showBreakdown[d.slug] && (
                  <tr className="bg-stone-50">
                    <td colSpan={COLUMNS.length} className="p-0">
                      <table className="w-full text-left text-xs">
                        <tbody>
                          <BreakdownRow label="Alojamiento" value={d.hotelCost} icon="🏨" />
                          <BreakdownRow label="Transporte" value={d.transportCost} icon={d.transportLabel?.includes("✈️") ? "✈️" : "🚗"} />
                          <BreakdownRow label="Total" value={d.estimatedCost} icon="💰" />
                          <BreakdownRow label="Comida (extras)" value={d.foodCost} icon="🍽️" />
                          <BreakdownRow label="Actividades (extras)" value={d.activitiesCost} icon="🏛️" />
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {budget && (
        <p className="text-xs text-stone-500 text-center">
          🟢 Dentro de presupuesto · 🟡 Cerca (≤15%) · 🔴 Por encima
        </p>
      )}
    </div>
  );
}