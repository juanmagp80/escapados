"use client";

import { describeAirQuality, describeUvIndex, timeOfDay } from "@/lib/weather/openMeteo";
import { useEffect, useState } from "react";

function roundTime(totalSec) {
  if (totalSec == null || Number.isNaN(totalSec)) return null;
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Extras de clima: índice UV, amanecer/atardecer, calidad del aire y, en
// costa, temperatura del agua y altura de ola. Carga progresiva.
export default function WeatherExtras({ lat, lon, coast = false }) {
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    if (lat == null || lon == null) {
      setState({ status: "empty", data: null });
      return;
    }
    const params = new URLSearchParams();
    params.set("lat", String(lat));
    params.set("lon", String(lon));
    if (coast) params.set("coast", "1");

    const ctrl = new AbortController();
    const startTime = Date.now();
    setState({ status: "loading", data: null });

    fetch(`/api/weather-extras?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not ok"))))
      .then((data) => {
        const hasSomething =
          data?.astronomy || data?.airQuality || data?.marine;
        if (!hasSomething) {
          setState({ status: "empty", data: null });
          return;
        }
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 800 - elapsed);
        setTimeout(() => setState({ status: "done", data }), remaining);
      })
      .catch(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 800 - elapsed);
        setTimeout(() => setState({ status: "empty", data: null }), remaining);
      });

    return () => ctrl.abort();
  }, [lat, lon, coast]);

  if (state.status === "loading")
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-stone-500">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        Mirando UV, aire y mar…
      </div>
    );
  if (state.status !== "done") return null;

  const { astronomy, airQuality, marine } = state.data || {};
  if (!astronomy && !airQuality && !marine) return null;

  const aqi = describeAirQuality(airQuality?.us_aqi);
  const uv = describeUvIndex(astronomy?.uvIndexMax);
  const sunrise = timeOfDay(astronomy?.sunrise);
  const sunset = timeOfDay(astronomy?.sunset);
  const daylight = roundTime(astronomy?.daylightDuration);
  const waterTemp = marine?.sea_surface_temperature_max?.[0];
  const wave = marine?.wave_height_max?.[0];

  const chips = [];
  if (sunrise && sunset)
    chips.push(`🌅 ${sunrise} → ${sunset}${daylight ? ` · ${daylight} de luz` : ""}`);
  if (uv) chips.push(`☀️ UV ${astronomy.uvIndexMax} (${uv.label})`);
  if (aqi) chips.push(`${aqi.emoji} Aire: ${aqi.label}`);
  if (coast && waterTemp != null)
    chips.push(`🌊 Agua ${Math.round(waterTemp)}ºC${wave != null ? ` · ola ${wave.toFixed(1)} m` : ""}`);

  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}