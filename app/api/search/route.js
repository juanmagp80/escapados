import { NextResponse } from "next/server";
import { runSearch } from "@/lib/search/runSearch";
import { getClientIp, rateLimit } from "@/lib/utils/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const limit = rateLimit(getClientIp(request), { windowMs: 60 * 1000, max: 15 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Inténtalo en unos segundos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetInMs / 1000)) } }
    );
  }

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
      flexible: body.flexible === true,
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
