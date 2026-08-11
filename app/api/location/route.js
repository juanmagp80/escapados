import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/maps/geocoder";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const result = await reverseGeocode(lat, lon);

  if (!result) {
    return NextResponse.json(
      { error: "No hemos podido determinar la ubicación." },
      { status: 422 }
    );
  }

  return NextResponse.json({ name: result.name, lat, lon });
}