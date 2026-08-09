import { NextResponse } from "next/server";
import { getGasStationsAlongRoute } from "@/lib/fuel/gasStations";
import { withFallback } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

function parseRouteCoords(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length >= 2 &&
      parsed.every((p) => Array.isArray(p) && p.length === 2)
    ) {
      return parsed;
    }
  } catch {
    // ignorar geometría inválida
  }
  return null;
}

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
        {
          count: parseInt(searchParams.get("count"), 10) || 5,
          route: parseRouteCoords(searchParams.get("route")),
        }
      ),
    []
  );

  return NextResponse.json({ stations });
}