import { NextResponse } from "next/server";
import { searchTrips } from "@/lib/blablacar/client";
import { withFallback } from "@/lib/utils/cache";
import { getClientIp, rateLimit } from "@/lib/utils/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const limit = rateLimit(getClientIp(request), { windowMs: 60 * 1000, max: 20 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Inténtalo en unos segundos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetInMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const fromLat = searchParams.get("fromLat");
  const fromLon = searchParams.get("fromLon");
  const toLat = searchParams.get("toLat");
  const toLon = searchParams.get("toLon");
  if (
    fromLat === null ||
    fromLon === null ||
    toLat === null ||
    toLon === null
  ) {
    return NextResponse.json(
      { error: "Faltan coordenadas de origen y destino." },
      { status: 400 }
    );
  }

  const date = searchParams.get("date");
  const returnDate = searchParams.get("returnDate");

  const [outbound, ret] = await Promise.all([
    withFallback(
      () =>
        searchTrips({
          fromLat,
          fromLon,
          toLat,
          toLon,
          date,
        }),
      []
    ),
    returnDate
      ? withFallback(
          () =>
            searchTrips({
              fromLat: toLat,
              fromLon: toLon,
              toLat: fromLat,
              toLon: fromLon,
              date: returnDate,
            }),
          []
        )
      : Promise.resolve([]),
  ]);

  const hasAny = outbound.length > 0 || ret.length > 0;
  if (!hasAny) {
    return NextResponse.json({
      outbound: [],
      return: [],
      notice: "No hay ofertas reales de BlaBlaCar para este trayecto.",
    });
  }
  return NextResponse.json({ outbound, return: ret });
}
