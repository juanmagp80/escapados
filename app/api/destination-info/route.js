import { NextResponse } from "next/server";
import { withFallback } from "@/lib/utils/cache";
import { getDestinationInfo } from "@/lib/wiki/client";

export const dynamic = "force-dynamic";

// Devuelve contenido real del destino (Wikipedia + fotos de Commons).
// Con `min=1` añade el resumen para buenas prácticas de fuentes; siempre opcional.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") || "").trim();
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));
  if (!name || Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(
      { error: "Falta el destino o las coordenadas." },
      { status: 400 }
    );
  }

  const info = await withFallback(() => getDestinationInfo({ name, lat, lon }), null);
  if (!info)
    return NextResponse.json(
      { error: "No hemos podido obtener información de este destino." },
      { status: 502 }
    );

  return NextResponse.json(info);
}