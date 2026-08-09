import { NextResponse } from "next/server";
import { getHotels } from "@/lib/serpapi/providers/hotels";
import { withFallback } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q)
    return NextResponse.json({ error: "Falta el destino" }, { status: 400 });

  const result = await withFallback(
    () =>
      getHotels({
        q,
        checkIn: searchParams.get("checkIn") || undefined,
        checkOut: searchParams.get("checkOut") || undefined,
        guests: searchParams.get("guests") || 2,
        lat: searchParams.get("lat")
          ? parseFloat(searchParams.get("lat"))
          : undefined,
        lon: searchParams.get("lon")
          ? parseFloat(searchParams.get("lon"))
          : undefined,
      }),
    { hotels: [], source: "Google Hotels" }
  );

  if (!result.hotels || result.hotels.length === 0) {
    return NextResponse.json({
      hotels: [],
      source: result.source || "Google Hotels",
      notice:
        "No hemos podido obtener alojamientos ahora mismo (Google Hotels sin cuota y/o servidores del mapa ocupados).",
    });
  }
  return NextResponse.json(result);
}
