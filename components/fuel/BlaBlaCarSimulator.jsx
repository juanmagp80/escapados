"use client";

import { useState } from "react";
import { formatEuro } from "@/lib/utils/format";

export default function BlaBlaCarSimulator({ carCost, travelers }) {
  const [pricePerSeat, setPricePerSeat] = useState(0);
  const [seatsOffered, setSeatsOffered] = useState(Math.max(1, travelers - 1));
  const [showSimulator, setShowSimulator] = useState(false);

  const maxSeats = Math.max(1, 4 - travelers);
  const potentialIncome = pricePerSeat * seatsOffered;
  const effectiveCost = Math.max(0, (carCost?.effective || 0) - potentialIncome);
  const costPerPerson = travelers > 0 ? effectiveCost / travelers : 0;

  if (!carCost || !showSimulator && carCost.effective === 0) return null;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setShowSimulator(!showSimulator)}
        className="w-full text-left btn-ghost"
      >
        {showSimulator ? "🔽 Ocultar simulador" : "🚗 Simular compartir coche (BlaBlaCar)"}
      </button>

      {showSimulator && (
        <div className="rounded-xl bg-brand-50 p-4 border border-brand-100 space-y-4">
          <p className="text-sm text-stone-600">
            Estima cuánto podrías recuperar llevando pasajeros. <strong>No es una reserva real en BlaBlaCar.</strong>
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
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">
                Plazas que ofreces
              </label>
              <select
                className="field"
                value={seatsOffered}
                onChange={(e) => setSeatsOffered(Number(e.target.value))}
              >
                {[...Array(maxSeats)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} plaza{s > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 border border-stone-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Coste total coche (combustible + peajes)</span>
              <span className="font-medium text-ink">{formatEuro(carCost.effective)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Ingresos estimados ({seatsOffered} plaza{seatsOffered > 1 ? "s" : ""} × {formatEuro(pricePerSeat)})</span>
              <span className="font-semibold">- {formatEuro(potentialIncome)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 font-semibold text-lg">
              <span>Coste efectivo</span>
              <span className="text-brand-700">{formatEuro(effectiveCost)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-500">
              <span>Coste por persona ({travelers} viajero{travelers > 1 ? "s" : ""})</span>
              <span className="font-medium">{formatEuro(costPerPerson)}</span>
            </div>
          </div>

          <p className="text-xs text-stone-400 text-center">
            Simulación orientativa. El precio real en BlaBlaCar puede variar según demanda, fechas y comisión de la plataforma.
          </p>
        </div>
      )}
    </div>
  );
}