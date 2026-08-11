import { NextResponse } from "next/server";
import { geocode } from "@/lib/maps/geocoder";
import { getRoute } from "@/lib/routing/osrm";
import { withFallback } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to)
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  const [fromCoords, toCoords] = await Promise.all([
    withFallback(() => geocode(from), null),
    withFallback(() => geocode(to), null),
  ]);
  if (!fromCoords || !toCoords)
    return NextResponse.json({ error: "Origen o destino no localizado" }, { status: 422 });

  const route = await withFallback(
    () => getRoute(fromCoords, toCoords),
    null
  );
  if (!route)
    return NextResponse.json(
      { error: "No hemos podido calcular la ruta." },
      { status: 502 }
    );

  return NextResponse.json(route);
}
