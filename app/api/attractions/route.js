import { generatePlaces } from "@/lib/ai/gemini";
import { enrichPlacesWithCoords } from "@/lib/maps/geocodePlaces";
import { getPlaces } from "@/lib/serpapi/providers/places";
import { withFallback } from "@/lib/utils/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q)
    return NextResponse.json({ error: "Falta el destino" }, { status: 400 });

  const result = await withFallback(
    () => generatePlaces({ q, category: "attractions" }),
    { items: [], source: "fallback" }
  );

  if (!result.items || result.items.length === 0) {
    const fallback = await getPlaces({ q, category: "attractions" });
    if (fallback.items && fallback.items.length > 0) {
      fallback.items = await enrichPlacesWithCoords(fallback.items, q);
      return NextResponse.json(fallback);
    }
    return NextResponse.json({
      items: [],
      source: "fallback",
      notice: "No hemos podido obtener recomendaciones ahora mismo.",
    });
  }
  result.items = await enrichPlacesWithCoords(result.items, q);
  return NextResponse.json(result);
}