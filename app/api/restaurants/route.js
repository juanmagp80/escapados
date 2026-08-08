import { NextResponse } from "next/server";
import { getPlaces } from "@/lib/serpapi/providers/places";
import { withFallback } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category") || "restaurants";
  if (!q)
    return NextResponse.json({ error: "Falta el destino" }, { status: 400 });

  const result = await withFallback(
    () => getPlaces({ q, category }),
    { items: [], source: "Google Maps" }
  );

  if (!result.items || result.items.length === 0) {
    return NextResponse.json({
      items: [],
      source: "Google Maps",
      notice: "No hemos podido obtener resultados ahora mismo.",
    });
  }
  return NextResponse.json(result);
}
