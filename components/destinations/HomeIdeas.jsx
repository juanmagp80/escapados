"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DESTINATIONS } from "@/lib/destinations/catalog";
import { COMMUNITIES } from "@/lib/destinations/communities";
import { addDaysIso, nextFridayIso } from "@/lib/utils/format";

const FEATURED = ["Granada", "Cádiz", "Ronda", "Nerja", "Barcelona", "San Sebastián"];

const ORIGIN_KEY = "escapa2_last_origin";

function buildQuery(extra = {}, origin = "") {
  const params = new URLSearchParams({
    startDate: nextFridayIso(),
    endDate: addDaysIso(nextFridayIso(), 2),
    travelers: "2",
    ...(origin ? { origin } : {}),
    ...extra,
  });
  return params.toString();
}

export default function HomeIdeas() {
  const [origin, setOrigin] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setOrigin(localStorage.getItem(ORIGIN_KEY) || "");
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  async function useMyLocation() {
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
            localStorage.setItem(ORIGIN_KEY, data.name);
            setOrigin(data.name);
          } else {
            setError("No hemos podido identificar la ciudad exacta.");
          }
        } catch {
          setError("No pudimos determinar tu ubicación.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError("No pudimos obtener tu ubicación.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3 text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-medium uppercase tracking-wide">
          Inspiración
        </span>
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-stone-600">
            ✨ Destinos populares este fin de semana
          </h3>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="chip self-start bg-brand-50 active:scale-95 sm:self-auto"
            title="Indica tu ciudad de salida para calcular la ruta, el coste de coche y las gasolineras"
          >
            {locating ? "Localizando…" : origin ? `📍 Desde ${origin}` : "📍 Usar mi ubicación"}
          </button>
        </div>
        {error && (
          <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}
        {origin && (
          <p className="mb-3 text-xs text-stone-400">
            Cálculo de ruta, coste de coche y gasolineras desde {origin}.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURED.map((name) => {
            const d = DESTINATIONS.find((x) => x.name === name);
            if (!d) return null;
            return (
              <Link
                key={d.slug}
                href={`/destinos/${d.slug}?${buildQuery({ destination: d.name, transport: "car" }, origin)}`}
                className="group block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.98]"
              >
                <div className="relative h-24 sm:h-28">
                  {d.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.image}
                      alt={d.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <p className="absolute inset-x-0 bottom-0 p-2 text-sm font-bold text-white drop-shadow">
                    {d.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-stone-600">
          🗺️ O por comunidades
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COMMUNITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/comunidad/${c.slug}?${buildQuery({ transport: "car" }, origin)}`}
              className="group flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.98]"
            >
              <div className="relative h-20">
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-2 text-xs font-bold text-white drop-shadow">
                  {c.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}