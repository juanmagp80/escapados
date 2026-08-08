import { NextResponse } from "next/server";
import { getWeather } from "@/lib/weather/openMeteo";
import { withFallback } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));
  if (Number.isNaN(lat) || Number.isNaN(lon))
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });

  const weather = await withFallback(() => getWeather(lat, lon), null);
  if (!weather)
    return NextResponse.json(
      { error: "No hemos podido obtener la meteorología." },
      { status: 502 }
    );

  return NextResponse.json(weather);
}
