import { NextResponse } from "next/server";
import { withFallback } from "@/lib/utils/cache";
import { getAirQuality, getMarine, getWeather } from "@/lib/weather/openMeteo";

export const dynamic = "force-dynamic";

// Extras meteorológicos: calidad del aire + índices astronómicos (UV,
// amanecer/atardecer) y, para costa, temperatura/mar. Todo Open-Meteo gratis.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));
  const coast = searchParams.get("coast") === "1";
  if (Number.isNaN(lat) || Number.isNaN(lon))
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });

  const [weather, airQuality, marine] = await Promise.all([
    withFallback(() => getWeather(lat, lon), null),
    withFallback(() => getAirQuality(lat, lon), null),
    coast ? withFallback(() => getMarine(lat, lon), null) : null,
  ]);

  return NextResponse.json({
    astronomy: weather?.daily
      ? {
          uvIndexMax: weather.daily.uv_index_max?.[0] ?? null,
          sunrise: weather.daily.sunrise?.[0] ?? null,
          sunset: weather.daily.sunset?.[0] ?? null,
          daylightDuration: weather.daily.daylight_duration?.[0] ?? null,
        }
      : null,
    airQuality,
    marine,
  });
}