import { NextResponse } from "next/server";
import { getGasStationsAlongRoute } from "@/lib/fuel/gasStations";
import { withFallback } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const originLat = parseFloat(searchParams.get("originLat"));
  const originLon = parseFloat(searchParams.get("originLon"));
  const destLat = parseFloat(searchParams.get("destLat"));
  const destLon = parseFloat(searchParams.get("destLon"));

  if (
    Number.isNaN(originLat) ||
    Number.isNaN(originLon) ||
    Number.isNaN(destLat) ||
    Number.isNaN(destLon)
  ) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const stations = await withFallback(
    () =>
      getGasStationsAlongRoute(
        { lat: originLat, lon: originLon },
        { lat: destLat, lon: destLon },
        parseInt(searchParams.get("count"), 10) || 5
      ),
    []
  );

  return NextResponse.json({ stations });
}