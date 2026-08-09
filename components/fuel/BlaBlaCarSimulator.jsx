"use client";

import { useMemo, useState } from "react";
import { formatEuro } from "@/lib/utils/format";
import {
  blablacarIncome,
  blablacarEffectiveCost,
  carSeatsAvailable,
  suggestedPricePerSeat,
} from "@/lib/fuel/cost";

export default function BlaBlaCarSimulator({ carCost, travelers }) {
  const maxSeats = carSeatsAvailable(travelers, 5);
  const [seatsOffered, setSeatsOffered] = useState(maxSeats);
  const [pricePerSeat, setPricePerSeat] = useState(0);
  const [showSimulator, setShowSimulator] = useState(false);

  const suggestedPrice = useMemo(() => {
    if (!carCost || maxSeats <= 0) return 0;
    if (seatsOffered <= 0) return 0;
    return suggestedPricePerSeat({
      fuelCost: carCost.fuel?.cost || 0,
      tolls: carCost.tolls || 0,
      occupants: travelers + seatsOffered,
    });
  }, [carCost, maxSeats, seatsOffered, travelers]);

  const hasPrice = pricePerSeat > 0;
  const income = blablacarIncome(pricePerSeat, seatsOffered);
  const effectiveCost = blablacarEffectiveCost(carCost?.effective || 0, income);
  const costWithoutIncome = blablacarEffectiveCost(carCost?.effective || 0, 0);
  const remainingPerSeat = [
    ...(seatsOffered > 0 ? [costWithoutIncome / seatsOffered] : []),
  ][0] || 0;

  if (!carCost || carCost.effective === 0) return null;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setShowSimulator(!showSimulator)}
        className="w-full text-left btn-ghost"
      >
        {showSimulator
          ? "🔽 Ocultar simulador"
          : "🚗 Simular compartir coche (BlaBlaCar)"}
      </button>

      {showSimulator && (
        <div className="rounded-xl bg-brand-50 p-4 border border-brand-100 space-y-4">
          <p className="text-sm text-stone-600">
            Estima cuánto podrías recuperar llevando pasajeros.{" "}
            <strong>No es una reserva real en BlaBlaCar.</strong>
          </p>

          <div className="grid grid-cols-2 gap-4">
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

          {!hasPrice && suggestedPrice > 0 && (
            <p className="rounded-lg bg-white p-3 text-xs text-stone-500 border border-stone-100">
              💡 Introduce un precio o usa la sugerencia para repartir el coste
              del viaje entre todos los ocupantes.
            </p>
          )}

          <div className="rounded-xl bg-white p-4 border border-stone-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">
                Coste total coche (combustible + peajes)
              </span>
              <span className="font-medium text-ink">
                {formatEuro(costWithoutIncome)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>
                Ingresos estimados ({seatsOffered} plaza
                {seatsOffered > 1 ? "s" : ""} × {formatEuro(pricePerSeat)})
              </span>
              <span className="font-semibold">
                {hasPrice ? `- ${formatEuro(income)}` : "—"}
              </span>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 font-semibold text-lg">
              <span>Coste efectivo</span>
              <span className="text-brand-700">{formatEuro(effectiveCost)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-500">
              <span>
                Coste por persona del grupo ({travelers} persona
                {travelers > 1 ? "s" : ""})
              </span>
              <span className="font-medium">
                {travelers > 0 ? formatEuro(effectiveCost / travelers) : "—"}
              </span>
            </div>
            {hasPrice && seatsOffered > 0 && (
              <div
                className={`flex justify-between text-sm ${
                  pricePerSeat >= remainingPerSeat
                    ? "text-green-700"
                    : "text-stone-500"
                }`}
              >
                <span>Coste a cubrir por plaza con pasajeros</span>
                <span className="font-medium">
                  {formatEuro(remainingPerSeat)}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-stone-400 text-center">
            Simulación orientativa. El precio real en BlaBlaCar puede variar
            según demanda, fechas y comisión de la plataforma.
          </p>
        </div>
      )}
    </div>
  );
}