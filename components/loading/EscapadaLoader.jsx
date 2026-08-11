"use client";

import { useEffect, useState } from "react";

const STAGES = [
  { max: 18, emoji: "🧭", text: "Buscando destinos con encanto…" },
  { max: 38, emoji: "🚗", text: "Calculando distancias y rutas…" },
  { max: 58, emoji: "🏨", text: "Comparando hoteles y precios…" },
  { max: 78, emoji: "🍽️", text: "Eligiendo restaurantes y planes…" },
  { max: 94, emoji: "✨", text: "Diseñando la escapada perfecta…" },
  { max: 100, emoji: "🧳", text: "Preparando las maletas…" },
];

export default function EscapadaLoader() {
  const [pct, setPct] = useState(4);

  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => {
        if (p >= 96) return p;
        const increment = Math.max(0.4, Math.random() * (96 - p) * 0.06);
        return Math.min(96, p + increment);
      });
    }, 220);
    return () => clearInterval(id);
  }, []);

  const rounded = Math.round(pct);
  const stage =
    STAGES.find((s) => rounded < s.max) || STAGES[STAGES.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sky-100 via-cream to-white px-6">
      {/* ✨ Cielo con sol y nubes */}
      <div className="absolute left-8 top-8 select-none text-4xl escapada-float opacity-80">
        ☁️
      </div>
      <div
        className="absolute right-10 top-14 select-none text-3xl escapada-float opacity-60"
        style={{ animationDelay: "0.8s" }}
      >
        ☁️
      </div>
      <div className="absolute right-6 top-4 select-none text-5xl escapada-float">
        ☀️
      </div>

      {/* 💑 Pareja escapando sobre una carretera */}
      <div className="relative flex h-40 w-64 items-end justify-center overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-10 rounded-t-[3rem] bg-stone-600">
          <div
            className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 escapada-road"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #fde68a 0 16px, transparent 16px 32px)",
            }}
          />
        </div>

        <div className="absolute bottom-7 flex items-end gap-1">
          <span className="text-4xl escapada-walk select-none">👩</span>
          <span
            className="text-4xl escapada-walk select-none"
            style={{ animationDelay: "0.15s" }}
          >
            👨
          </span>
          <span
            className="text-3xl escapada-swing select-none"
            style={{ animationDelay: "0.3s" }}
          >
            🧳
          </span>
        </div>

        <span
          className="absolute bottom-16 left-8 select-none text-2xl escapada-heart"
          style={{ animationDelay: "0.3s" }}
        >
          💕
        </span>
        <span
          className="absolute bottom-14 right-8 select-none text-2xl escapada-heart"
          style={{ animationDelay: "1.1s" }}
        >
          💖
        </span>
        <span
          className="absolute bottom-12 left-1/2 ml-6 select-none text-xl escapada-heart"
          style={{ animationDelay: "1.9s" }}
        >
          💗
        </span>
      </div>

      {/* 📊 Progreso con porcentaje */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-5xl font-extrabold tabular-nums text-brand-600">
          {rounded}%
        </p>
        <div className="h-2.5 w-64 max-w-[80vw] overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-300 ease-out"
            style={{ width: `${rounded}%` }}
          />
        </div>
        <p className="text-sm text-stone-500">
          {stage.emoji} {stage.text}
        </p>
        <p className="text-xs text-stone-400">
          Buscando vuestra escapada perfecta…
        </p>
      </div>
    </div>
  );
}