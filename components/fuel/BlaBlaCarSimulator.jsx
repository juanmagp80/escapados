"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/utils/format";
import SectionLoader from "@/components/loading/SectionLoader";
import {
  blablacarIncome,
  blablacarEffectiveCost,
  carSeatsAvailable,
  suggestedPricePerSeat,
} from "@/lib/fuel/cost";

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} · ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

function TripRow({ trip, icon }) {
  return (
    <a
      href={trip.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-2 rounded-xl border border-stone-100 bg-white px-3 py-2 text-sm transition active:scale-[0.99]"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">
          {formatTime(trip.departureTime) || "Sin hora"}
        </p>
        <p className="truncate text-xs text-stone-400">
          {[trip.departureCity, trip.arrivalCity].filter(Boolean).join(" → ")}
          {trip.seatsLeft !== null ? ` · ${trip.seatsLeft} plaza${trip.seatsLeft > 1 ? "s" : ""}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trip.price !== null && (
          <span className="font-bold text-brand-700">
            {formatEuro(trip.price)}
          </span>
        )}
        <span className="text-stone-300">{icon}</span>
      </div>
    </a>
  );
}

export default function BlaBlaCarSimulator({
  carCost,
  travelers,
  originLat,
  originLon,
  destLat,
  destLon,
  startDate,
  endDate,
}) {
  const maxSeats = carSeatsAvailable(travelers, 5);
  const [open, setOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [offers, setOffers] = useState({
    status: "idle",
    outbound: [],
    return: [],
    notice: "",
  });

  const canFetch =
    originLat !== undefined &&
    originLat !== null &&
    originLon !== undefined &&
    originLon !== null &&
    destLat !== undefined &&
    destLat !== null &&
    destLon !== undefined &&
    destLon !== null;

  useEffect(() => {
    if (!open || !canFetch) return;
    const ctrl = new AbortController();
    const params = new URLSearchParams({
      fromLat: String(originLat),
      fromLon: String(originLon),
      toLat: String(destLat),
      toLon: String(destLon),
    });
    if (startDate) params.set("date", startDate);
    if (endDate) params.set("returnDate", endDate);
    setOffers((prev) => ({ ...prev, status: "loading" }));

    fetch(`/api/blablacar?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const hasAny = data.outbound?.length > 0 || data.return?.length > 0;
        setOffers({
          status: hasAny ? "done" : "empty",
          outbound: data.outbound || [],
          return: data.return || [],
          notice: data.notice || "",
        });
      })
      .catch(() =>
        setOffers((prev) => ({
          ...prev,
          status: "empty",
          notice: "No hemos podido consultar BlaBlaCar ahora mismo.",
        }))
      );

    return () => ctrl.abort();
  }, [open, canFetch, originLat, originLon, destLat, destLon, startDate, endDate]);

  const realPrices = useMemo(() => {
    const cheapest = (list) =>
      list.length ? Math.min(...list.map((t) => t.price ?? Infinity)) : null;
    const out = cheapest(offers.outbound);
    const ret = cheapest(offers.return);
    const perSeat = (out || 0) + (ret || 0);
    const hasReal = out !== null || ret !== null;
    const income = hasReal && maxSeats > 0 ? blablacarIncome(perSeat, maxSeats) : 0;
    return {
      out,
      ret,
      perSeat,
      hasReal,
      income,
      effective: blablacarEffectiveCost(carCost?.effective || 0, income),
    };
  }, [offers, maxSeats, carCost]);

  const [seatsOffered, setSeatsOffered] = useState(maxSeats);
  const [pricePerSeat, setPricePerSeat] = useState(0);

  const suggestedPrice = useMemo(() => {
    if (!carCost || maxSeats <= 0) return 0;
    if (seatsOffered <= 0) return 0;
    return suggestedPricePerSeat({
      fuelCost: carCost.fuel?.cost || 0,
      tolls: carCost.tolls || 0,
      occupants: travelers + seatsOffered,
    });
  }, [carCost, maxSeats, seatsOffered, travelers]);

  const manualIncome = blablacarIncome(pricePerSeat, seatsOffered);
  const manualEffective = blablacarEffectiveCost(carCost?.effective || 0, manualIncome);

  if (!carCost || carCost.effective === 0) return null;

  const noRealData =
    offers.status === "empty" ||
    offers.status === "idle" ||
    (offers.status === "done" && !realPrices.hasReal);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left btn-ghost"
      >
        {open
          ? "🔽 Ocultar BlaBlaCar"
          : "🤝 Compartir coche (precios reales BlaBlaCar)"}
      </button>

      {open && (
        <div className="space-y-4 rounded-xl border border-brand-100 bg-brand-50 p-4">
          {offers.status === "loading" && (
            <SectionLoader label="Consultando ofertas reales de BlaBlaCar…" />
          )}

          {offers.status === "done" && realPrices.hasReal && (
            <>
              <p className="text-sm text-stone-600">
                Precios <strong>reales</strong> que se están ofertando ahora en
                BlaBlaCar para este trayecto. <em>No es una reserva.</em>
              </p>

              <div className="space-y-3">
                {offers.outbound.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                      🚗 Ida ({startDate || "próximos días"})
                    </p>
                    <div className="space-y-1.5">
                      {offers.outbound.map((t, i) => (
                        <TripRow key={i} trip={t} icon="↗️" />
                      ))}
                    </div>
                  </div>
                )}
                {offers.return.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                      🔄 Vuelta ({endDate || "próximos días"})
                    </p>
                    <div className="space-y-1.5">
                      {offers.return.map((t, i) => (
                        <TripRow key={i} trip={t} icon="↙️" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-stone-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Tu coste si cobras el precio real
                </p>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Coste coche (combustible + peajes)
                    </span>
                    <span className="font-medium text-ink">
                      {formatEuro(carCost.effective)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Precio real por plaza (ida{realPrices.ret ? " + vuelta" : ""})
                    </span>
                    <span className="font-medium text-ink">
                      {formatEuro(realPrices.perSeat)}/plaza
                    </span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>
                      Ingresos ({maxSeats} plaza{maxSeats > 1 ? "s" : ""} libres)
                    </span>
                    <span className="font-semibold">
                      − {formatEuro(realPrices.income)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-stone-100 pt-2 text-lg font-semibold">
                    <span>Coste efectivo</span>
                    <span className="text-brand-700">
                      {formatEuro(realPrices.effective)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>
                      Coste por persona del grupo ({travelers} persona
                      {travelers > 1 ? "s" : ""})
                    </span>
                    <span className="font-medium">
                      {travelers > 0 ? formatEuro(realPrices.effective / travelers) : "—"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-stone-400">
                  Ingresos calculados con el precio más barato de cada tramo y
                  las plazas libres de tu coche ({maxSeats}). BlaBlaCar aplica
                  su propia comisión al pasajero.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowManual(!showManual)}
                className="text-xs font-medium text-brand-600 underline underline-offset-2"
              >
                {showManual ? "Ocultar simulación manual" : "Simular con otro precio por plaza"}
              </button>
            </>
          )}

          {(noRealData || showManual) && (
            <div className="space-y-4">
              {noRealData && !showManual && (
                <p className="text-sm text-stone-500">
                  {offers.notice ||
                    "No hay ofertas reales disponibles para este trayecto. Puedes estimarlo manualmente:"}
                </p>
              )}

              <div className="rounded-xl border border-stone-100 bg-white p-4">
                <p className="text-sm font-semibold text-ink">
                  💡 Simulación con precio propio
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Estima cuánto podrías recuperar llevando pasajeros.{" "}
                  <strong>No es una reserva real en BlaBlaCar.</strong>
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-600">
                      Precio por plaza (€)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="field"
                      value={pricePerSeat}
                      onChange={(e) => setPricePerSeat(Number(e.target.value) || 0)}
                      placeholder="Ej. 15"
                    />
                    {suggestedPrice > 0 && (
                      <button
                        type="button"
                        onClick={() => setPricePerSeat(suggestedPrice)}
                        className="mt-1 text-xs font-medium text-brand-600 underline underline-offset-2"
                      >
                        Sugerencia: {formatEuro(suggestedPrice)}/plaza
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-600">
                      Plazas que ofreces
                    </label>
                    <select
                      className="field"
                      value={seatsOffered}
                      onChange={(e) => setSeatsOffered(Number(e.target.value))}
                      disabled={maxSeats === 0}
                    >
                      {maxSeats === 0 ? (
                        <option value={0}>0 plazas</option>
                      ) : (
                        [...Array(maxSeats)].map((_, i) => {
                          const s = i + 1;
                          return (
                            <option key={s} value={s}>
                              {s} plaza{s > 1 ? "s" : ""}
                            </option>
                          );
                        })
                      )}
                    </select>
                    {maxSeats === 0 && (
                      <p className="mt-1 text-xs text-stone-400">
                        Tu coche ya va lleno.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2 rounded-xl bg-brand-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Coste total coche (combustible + peajes)
                    </span>
                    <span className="font-medium text-ink">
                      {formatEuro(carCost.effective)}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>
                      Ingresos ({seatsOffered} plaza
                      {seatsOffered > 1 ? "s" : ""} × {formatEuro(pricePerSeat)})
                    </span>
                    <span className="font-semibold">
                      {pricePerSeat > 0 ? `− ${formatEuro(manualIncome)}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-stone-100 pt-2 text-lg font-semibold">
                    <span>Coste efectivo</span>
                    <span className="text-brand-700">
                      {formatEuro(manualEffective)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>
                      Coste por persona del grupo ({travelers} persona
                      {travelers > 1 ? "s" : ""})
                    </span>
                    <span className="font-medium">
                      {travelers > 0 ? formatEuro(manualEffective / travelers) : "—"}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-center text-xs text-stone-400">
                  Simulación orientativa. El precio real en BlaBlaCar varía
                  según demanda, fechas y comisión de la plataforma.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
