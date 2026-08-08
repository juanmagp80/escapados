import { NextResponse } from "next/server";
import { searchHotels, searchFlights, searchPlaces } from "@/lib/serpapi/client";
import { withFallback } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "hotels";
  const q = searchParams.get("q");
  if (!q)
    return NextResponse.json({ error: "Falta el destino" }, { status: 400 });

  try {
    let data = null;
    if (type === "hotels") {
      data = await withFallback(
        () =>
          searchHotels({
            q,
            checkIn: searchParams.get("checkIn"),
            checkOut: searchParams.get("checkOut"),
            guests: searchParams.get("guests") || 2,
          }),
        { properties: [] }
      );
    } else if (type === "flights") {
      data = await withFallback(
        () =>
          searchFlights({
            departureId: searchParams.get("from"),
            arrivalId: searchParams.get("to"),
            outboundDate: searchParams.get("outbound"),
            returnDate: searchParams.get("ret"),
            adults: searchParams.get("guests") || 2,
          }),
        { best_flights: [], other_flights: [] }
      );
    } else if (type === "places") {
      data = await withFallback(
        () =>
          searchPlaces({
            q,
            type: searchParams.get("category") || "atracciones",
          }),
        { places: [] }
      );
    }
    return NextResponse.json(data || {});
  } catch (err) {
    return NextResponse.json(
      { error: "No hemos podido obtener los datos." },
      { status: 502 }
    );
  }
}
