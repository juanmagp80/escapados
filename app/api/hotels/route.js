import { getHotels } from "@/lib/serpapi/providers/hotels";
import { withFallback } from "@/lib/utils/cache";
import { getClientIp, rateLimit } from "@/lib/utils/rateLimit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const limit = rateLimit(getClientIp(request), { windowMs: 60 * 1000, max: 30 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Inténtalo en unos segundos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetInMs / 1000)) } }
    );
  }

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
        maxPricePerNight: searchParams.get("maxPrice")
          ? parseFloat(searchParams.get("maxPrice"))
          : undefined,
      }),
    { hotels: [], source: "fallback" }
  );

  if (!result.hotels || result.hotels.length === 0) {
    const maxPrice = searchParams.get("maxPrice");
    const notice = maxPrice
      ? `No hay alojamientos disponibles por ${maxPrice} €/noche o menos en estas fechas. Prueba a subir el precio máximo.`
      : "No hemos podido obtener alojamientos ahora mismo. Inténtalo de nuevo en unos instantes.";
    return NextResponse.json({ hotels: [], source: "fallback", notice });
  }
  return NextResponse.json(result);
}
