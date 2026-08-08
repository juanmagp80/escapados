"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TRANSPORTS = [
  { id: "car", label: "Coche", emoji: "🚗" },
  { id: "plane", label: "Avión", emoji: "✈️" },
];

const QUICK = [
  { label: "Fin de semana", days: 2 },
  { label: "Puente 3 días", days: 3 },
  { label: "Semana corta", days: 5 },
];

function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function SearchForm({ defaultOrigin = "" }) {
  const router = useRouter();
  const [origin, setOrigin] = useState(defaultOrigin);
  const [startDate, setStartDate] = useState(isoDate(7));
  const [endDate, setEndDate] = useState(isoDate(10));
  const [travelers, setTravelers] = useState(2);
  const [transport, setTransport] = useState("car");
  const [budget, setBudget] = useState("");
  const [region, setRegion] = useState("any");
  const [maxKm, setMaxKm] = useState("");
  const [wholeMonth, setWholeMonth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  async function detectLocation() {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no permite conocer tu ubicación.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/location?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { cache: "no-store" }
          );
          const data = await res.json();
          if (data.name) setOrigin(data.name);
          else setError("No hemos podido identificar la ciudad exacta.");
        } catch {
          setError("No pudimos determinar tu ubicación.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError("No pudimos obtener tu ubicación. Escríbelo manualmente.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  function applyQuick(days) {
    setStartDate(isoDate(7));
    const end = new Date();
    end.setDate(end.getDate() + 7 + days);
    setEndDate(end.toISOString().slice(0, 10));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!origin.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          startDate,
          endDate,
          travelers,
          transport,
          budget: budget ? Number(budget) : undefined,
          region: region !== "any" ? region : undefined,
          maxKm: maxKm ? Number(maxKm) : undefined,
          wholeMonth: transport === "plane" && wholeMonth,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No hemos podido buscar ahora mismo.");
      const params = new URLSearchParams({
        origin,
        startDate,
        endDate,
        travelers,
        transport,
        budget: budget || "",
        region: region !== "any" ? region : "",
        maxKm: maxKm || "",
        wholeMonth: transport === "plane" && wholeMonth ? "1" : "",
      });
      router.push(`/buscar?${params.toString()}`);
    } catch (err) {
      setError(err.message || "No hemos podido buscar ahora mismo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-600">
          📍 Desde
        </label>
        <div className="flex gap-2">
          <input
            className="field flex-1"
            placeholder="Ej. Cártama"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="btn-ghost shrink-0 !px-3 !py-2"
            title="Usar mi ubicación"
          >
            {locating ? "…" : "📍"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            📅 Salida
          </label>
          <input
            type="date"
            className="field"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            📅 Regreso
          </label>
          <input
            type="date"
            className="field"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            type="button"
            key={q.label}
            onClick={() => applyQuick(q.days)}
            className="chip active:scale-95"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            👥 Viajeros
          </label>
          <input
            type="number"
            min={1}
            max={12}
            className="field"
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            💰 Presupuesto
          </label>
          <input
            type="number"
            min={0}
            className="field"
            placeholder="Opcional"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-600">
          🚦 Transporte
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TRANSPORTS.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTransport(t.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-base font-semibold transition active:scale-[0.98] ${
                transport === t.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {transport === "plane" && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={wholeMonth}
            onChange={(e) => setWholeMonth(e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          📅 Ver el mes completo: busco el vuelo más barato cada fin de
          semana y te muestro todas las opciones
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            🏞️ Zona
          </label>
          <select
            className="field"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="any">Cualquiera</option>
            <option value="costa">Costa</option>
            <option value="interior">Interior</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            📏 Km máximo
          </label>
          <input
            type="number"
            min={0}
            className="field"
            placeholder="Opcional"
            value={maxKm}
            onChange={(e) => setMaxKm(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Buscando escapadas..." : "Buscar escapadas"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="text-center text-sm text-stone-500">
        💡 ¿No sabes dónde ir? Nosotros buscamos por ti.
      </p>
    </form>
  );
}
