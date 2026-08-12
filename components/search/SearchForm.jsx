"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify, localIso } from "@/lib/utils/format";
import { findCommunity } from "@/lib/destinations/communities";
import { splitOrigins } from "@/lib/search/splitOrigins";
import EscapadaLoader from "@/components/loading/EscapadaLoader";

const TRANSPORTS = [
  { id: "car", label: "Coche", emoji: "🚗" },
  { id: "plane", label: "Avión", emoji: "✈️" },
];

const QUICK = [
  { label: "🌙 Fin de semana", days: 2 },
  { label: "🎉 Puente 3 días", days: 3 },
  { label: "🗓️ Semana corta", days: 5 },
  { label: "🔥 Última hora", days: 2, lastMinute: true },
];

const MODES = [
  { id: "any", label: "Sorpréndeme", emoji: "✨" },
  { id: "chosen", label: "Elegir destino", emoji: "🎯" },
];

const RECENT_KEY = "escapa2_recent_searches";
const ORIGIN_KEY = "escapa2_last_origin";

function isoDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return localIso(d);
  }

function readRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function SearchForm({ defaultOrigin = "" }) {
  const router = useRouter();
  const [origin, setOrigin] = useState(defaultOrigin);
  const [startDate, setStartDate] = useState(isoDate(7));
  const [endDate, setEndDate] = useState(isoDate(10));
  const [travelers, setTravelers] = useState(2);
  const [transport, setTransport] = useState("car");
  const [budget, setBudget] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [region, setRegion] = useState("any");
  const [maxKm, setMaxKm] = useState("");
  const [wholeMonth, setWholeMonth] = useState(false);
  const [flexible, setFlexible] = useState(false);
  const [mode, setMode] = useState("any");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  // Valida fechas y horizonte de vuelos antes de buscar.
  function dateError() {
    if (!startDate || !endDate) return "Elige fecha de salida y de regreso.";
    if (startDate > endDate) return "El regreso debe ser después de la salida.";
    if (transport === "plane") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(`${startDate}T12:00:00`);
      if (start < today) return "La fecha de salida no puede estar en el pasado.";
      const horizon = new Date(today);
      horizon.setDate(horizon.getDate() + 370);
      if (start > horizon)
        return "Las tarifas de vuelos solo cubren unos 12 meses. Elige fechas más cercanas.";
    }
    return null;
  }

  function saveRecent(entry) {
    const list = readRecent().filter(
      (r) => !(r.origin === entry.origin && r.destination === entry.destination)
    );
    list.unshift(entry);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
    setRecent(list.slice(0, 5));
  }

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
          if (data.name) {
            setOrigin(data.name);
            try {
              localStorage.setItem(ORIGIN_KEY, data.name);
            } catch {
              /* localStorage no disponible */
            }
          } else setError("No hemos podido identificar la ciudad exacta.");
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

  function applyQuick(q) {
    if (q.lastMinute) {
      setStartDate(isoDate(0));
      setEndDate(isoDate(2));
      return;
    }
    setStartDate(isoDate(7));
    setEndDate(localIso(new Date(Date.now() + (7 + q.days) * 86400000)));
  }

  function applyRecent(r) {
    setOrigin(r.origin);
    setStartDate(r.startDate);
    setEndDate(r.endDate);
    setTravelers(r.travelers);
    setTransport(r.transport);
    setBudget(r.budget || "");
    setMaxPrice(r.maxPrice || "");
    setRegion(r.region || "any");
    setMaxKm(r.maxKm || "");
    setFlexible(!!r.flexible);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!origin.trim()) return;
    const dErr = dateError();
    if (dErr) {
      setError(dErr);
      return;
    }
    setError(null);
    setLoading(true);

    if (mode === "chosen") {
      try {
        if (!destination.trim()) {
          throw new Error("Escribe a dónde quieres ir.");
        }
        const params = new URLSearchParams({
          origin,
          destination,
          startDate,
          endDate,
          travelers,
          transport,
          budget: budget || "",
          maxPrice: maxPrice || "",
        });
        const community = findCommunity(destination);
        const target = community
          ? `/comunidad/${community.slug}`
          : `/destinos/${slugify(destination)}`;
        try {
          localStorage.setItem(ORIGIN_KEY, origin.trim());
        } catch {
          /* localStorage no disponible */
        }
        await router.push(`${target}?${params.toString()}`);
      } catch (err) {
        setError(err.message || "No hemos podido buscar ahora mismo.");
        setLoading(false);
      }
      return;
    }

    const origins = splitOrigins(origin);
    const params = new URLSearchParams({
      origin: origins.join(","),
      startDate,
      endDate,
      travelers,
      transport,
      budget: budget || "",
      maxPrice: maxPrice || "",
      region: region !== "any" ? region : "",
      maxKm: maxKm || "",
      wholeMonth: transport === "plane" && wholeMonth ? "1" : "",
      flexible: transport === "plane" && flexible ? "1" : "",
    });

    // No validamos antes: /buscar resuelve las búsquedas y muestra sus
    // propios mensajes de error y su loader. Así evitamos ejecutar la
    // búsqueda completa (OSRM, clima, vuelos) dos veces.
    saveRecent({
      origin: origins.join(", "),
      startDate,
      endDate,
      travelers,
      transport,
      budget: budget || "",
      maxPrice: maxPrice || "",
      region: region !== "any" ? region : "",
      maxKm: maxKm || "",
      flexible: transport === "plane" && flexible ? "1" : "",
    });
    try {
      if (origins[0]) localStorage.setItem(ORIGIN_KEY, origins[0]);
    } catch {
      /* localStorage no disponible */
    }
    router.push(`/buscar?${params.toString()}`);
  }

  return (
    <>
      {loading && <EscapadaLoader />}
      <form onSubmit={handleSubmit} className="space-y-4">
      {recent.length > 0 && mode === "any" && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
            Búsquedas recientes
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                type="button"
                key={`${r.origin}-${r.destination || "any"}`}
                onClick={() => applyRecent(r)}
                className="chip bg-white active:scale-95"
              >
                {r.origin}
                {r.destination ? ` → ${r.destination}` : ""} ·
                {r.transport === "plane" ? " ✈️" : " 🚗"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-600">
          Modo de búsqueda
        </label>
        <div className="grid grid-cols-2 gap-3">
          {MODES.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition active:scale-[0.98] ${
                mode === m.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-600">
          📍 Desde {mode === "any" && <span className="font-normal text-stone-400">(varios con “,”)</span>}
        </label>
        <div className="flex gap-2">
          <input
            className="field flex-1"
            placeholder="Ej. Cártama o Madrid, Sevilla"
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

      {mode === "chosen" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            🎯 Hacia
          </label>
          <input
            className="field w-full"
            placeholder="Ej. Sevilla"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
      )}

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
            onClick={() => applyQuick(q)}
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
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            🏨 Máx. alojamiento/noche
          </label>
          <input
            type="number"
            min={0}
            step={5}
            className="field"
            placeholder="Opcional"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
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

      {transport === "plane" && mode === "any" && (
        <div className="space-y-2">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={flexible}
              onChange={(e) => setFlexible(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            🔀 Fechas flexibles (±2 días): pruebo las salidas cercanas y me
            quedo con la más barata
          </label>
        </div>
      )}

      {mode === "any" && (
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
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Buscando escapadas..." : "Buscar escapadas"}
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="text-center text-sm text-stone-500">
        {mode === "chosen"
          ? "🎯 Te montamos la escapada completa para tu destino."
          : "💡 ¿No sabes dónde ir? Nosotros buscamos por ti."}
      </p>
      </form>
    </>
  );
}