"use client";

import SectionLoader from "@/components/loading/SectionLoader";
import { useEffect, useState } from "react";

// Descripción real e imágenes del destino (Wikipedia + Wikimedia Commons).
// Carga progresiva para no bloquear el resto de la ficha.
export default function DestinationInfo({ name, lat, lon }) {
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    if (!name) {
      setState({ status: "empty", data: null });
      return;
    }
    const params = new URLSearchParams();
    params.set("name", name);
    if (lat != null) params.set("lat", String(lat));
    if (lon != null) params.set("lon", String(lon));

    const ctrl = new AbortController();
    const startTime = Date.now();
    setState({ status: "loading", data: null });

    fetch(`/api/destination-info?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not ok"))))
      .then((data) => {
        if (!data || !data.description) {
          setState({ status: "empty", data: null });
          return;
        }
        const elapsed = Date.now() - startTime;
        const minDelay = 800;
        const remaining = Math.max(0, minDelay - elapsed);
        setTimeout(() => setState({ status: "done", data }), remaining);
      })
      .catch(() => {
        const elapsed = Date.now() - startTime;
        const minDelay = 800;
        const remaining = Math.max(0, minDelay - elapsed);
        setTimeout(() => setState({ status: "empty", data: null }), remaining);
      });

    return () => ctrl.abort();
  }, [name, lat, lon]);

  if (state.status === "loading")
    return (
      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
          <span>📖</span>
          Sobre {name}
        </h2>
        <SectionLoader label="Conociendo el destino…" />
      </section>
    );
  if (state.status !== "done" || !state.data) return null;

  const { description, wikiUrl, images = [] } = state.data;
  const gallery = images.slice(0, 4);

  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
        <span>📖</span>
        Sobre {name}
      </h2>
      <div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600">
          {description.length > 500 ? `${description.slice(0, 500)}…` : description}
        </p>
      {wikiUrl && (
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-medium text-brand-600"
        >
          Leer más en Wikipedia →
        </a>
      )}

      {gallery.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {gallery.map((img) => (
            <a
              key={img.title}
              href={img.full || img.thumb}
              target="_blank"
              rel="noopener noreferrer"
              className="overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumb || img.full}
                alt={img.title || name}
                loading="lazy"
                className="h-24 w-full object-cover transition hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11px] text-stone-400">
        Fuente: Wikipedia y Wikimedia Commons ({images.length} fotos geolocalizadas)
      </p>
      </div>
    </section>
  );
}