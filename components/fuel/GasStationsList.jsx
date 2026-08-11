"use client";

import SectionLoader from "@/components/loading/SectionLoader";
import { useEffect, useState } from "react";

function price(value) {
  return typeof value === "number" && value > 0 ? `${value.toFixed(3)} €/L` : "—";
}

// Etiqueta de posición a lo largo de la ruta según el % de avance.
function routePositionLabel(pct) {
  if (pct == null || !Number.isFinite(pct)) return null;
  if (pct < 20) return { label: "Inicio de ruta", dot: "bg-emerald-500" };
  if (pct <= 80) return { label: "Mitad de ruta", dot: "bg-amber-500" };
  return { label: "Final de ruta", dot: "bg-sky-500" };
}

// Acota la polilínea a un máximo de puntos para no superar el límite de URL.
function sampleRoute(coords, maxPoints = 100) {
  if (!Array.isArray(coords) || coords.length <= maxPoints) return coords;
  const stride = Math.ceil((coords.length - 1) / (maxPoints - 1));
  const out = [];
  for (let i = 0; i < coords.length; i += stride) out.push(coords[i]);
  const last = coords[coords.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

function GasStationCard({ station }) {
  const content = (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-xl">
        ⛽
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">{station.name}</p>
        {station.address && (
          <p className="text-xs text-stone-500 truncate">📍 {station.address}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500">
          {station.diesel != null && (
            <span>Diésel: <span className="font-medium text-ink">{price(station.diesel)}</span></span>
          )}
          {station.gasoline != null && (
            <span>Gasolina: <span className="font-medium text-ink">{price(station.gasoline)}</span></span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
          {(() => {
            const pos = routePositionLabel(station.routePct);
            if (pos) {
              return (
                <span className="inline-flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${pos.dot}`} />
                  <span className="font-medium text-ink">{pos.label}</span>
                </span>
              );
            }
            return null;
          })()}
          {(station.kmAlongRoute != null && station.routeTotalKm != null) && (
            <span>km {Math.round(station.kmAlongRoute)} de {station.routeTotalKm}</span>
          )}
          {station.distanceKm != null && (
            <span>· a {station.distanceKm} km de la ruta</span>
          )}
        </div>
        {station.openingHours && (
          <p className="text-xs text-stone-400">🕐 {station.openingHours}</p>
        )}
      </div>
      {station.mapsUrl && (
        <span className="mt-1 text-xs font-medium text-brand-600 underline italic">
          Google Maps ↗
        </span>
      )}
    </>
  );

  return station.mapsUrl ? (
    <a
      href={station.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 transition active:scale-[0.99]"
    >
      {content}
    </a>
  ) : (
    <div className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
      {content}
    </div>
  );
}

export default function GasStationsList({
  originLat,
  originLon,
  destLat,
  destLon,
  routeCoordinates,
}) {
  const [state, setState] = useState({ status: "loading", stations: [] });

  useEffect(() => {
    const params = new URLSearchParams({
      originLat: String(originLat),
      originLon: String(originLon),
      destLat: String(destLat),
      destLon: String(destLon),
    });

    if (
      Array.isArray(routeCoordinates) &&
      routeCoordinates.length >= 2
    ) {
      params.set("route", JSON.stringify(sampleRoute(routeCoordinates)));
    }

    const ctrl = new AbortController();
    const startTime = Date.now();
    setState({ status: "loading", stations: [] });

    fetch(`/api/gas-stations?${params.toString()}&count=5`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const elapsed = Date.now() - startTime;
        const minDelay = 4000;
        const remaining = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          if (data.stations && data.stations.length > 0) {
            setState({ status: "done", stations: data.stations });
          } else {
            setState({ status: "empty", stations: [] });
          }
        }, remaining);
      })
      .catch((err) => {
        const elapsed = Date.now() - startTime;
        const minDelay = 4000;
        const remaining = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          setState({ status: "empty", stations: [] });
        }, remaining);
      });

    return () => ctrl.abort();
  }, [originLat, originLon, destLat, destLon, routeCoordinates]);

  if (state.status === "loading")
    return <SectionLoader label="Buscando gasolineras en la ruta…" />;
  if (state.status === "empty" || state.stations.length === 0)
    return (
      <p className="text-sm text-stone-400 text-center py-4">
        No se encontraron gasolineras cerca de la ruta.
      </p>
    );

  return (
    <div className="space-y-2">
      {state.stations.map((s, i) => (
        <GasStationCard key={s.id ?? i} station={s} />
      ))}
      <p className="text-xs text-stone-400 text-center pt-2">
        Las 5 gasolineras más baratas de la ruta · Precios actuales del Ministerio
        de Transición Ecológica · Pulsa una para verla en Google Maps
      </p>
    </div>
  );
}