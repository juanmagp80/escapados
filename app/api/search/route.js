import { NextResponse } from "next/server";
import { runSearch } from "@/lib/search/runSearch";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { origin, startDate, endDate, travelers, transport, budget } = body;

    if (!origin) {
      return NextResponse.json(
        { error: "Falta el origen" },
        { status: 400 }
      );
    }

    const result = await runSearch({
      origin,
      startDate,
      endDate,
      travelers: travelers ? Number(travelers) : 2,
      transport: transport || "car",
      budget: budget ? Number(budget) : undefined,
      region: body.region || undefined,
      maxKm: body.maxKm ? Number(body.maxKm) : undefined,
      wholeMonth: body.wholeMonth === true,
      consumption: body.consumption ?? 6.5,
      fuelPrice: body.fuelPrice ?? 1.55,
    });

    if (result.error) {
      return NextResponse.json(
        { error: "No hemos podido localizar el origen." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      destinations: result.destinations,
      origin: result.origin,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "No hemos podido completar la búsqueda." },
      { status: 500 }
    );
  }
}
