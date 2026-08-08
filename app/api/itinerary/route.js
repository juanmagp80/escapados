import { NextResponse } from "next/server";
import { buildItinerary } from "@/lib/ai/itineraryProvider";
import { withFallback } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination");
  if (!destination)
    return NextResponse.json({ error: "Falta el destino" }, { status: 400 });

  try {
    const itinerary = await buildItinerary({
      destination,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      travelers: searchParams.get("travelers") || 2,
      budget: searchParams.get("budget") || undefined,
    });
    return NextResponse.json(itinerary);
  } catch (err) {
    return NextResponse.json(
      { error: "No hemos podido generar el itinerario ahora mismo." },
      { status: 502 }
    );
  }
}
