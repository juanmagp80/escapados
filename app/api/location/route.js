import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("accept-language", "es");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Escapa2/1.0 (escapas@example.com)" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("reverse geocode failed");
    const data = await res.json();

    const name =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      data.name ||
      (data.display_name || "").split(",")[0] ||
      null;

    if (!name) {
      return NextResponse.json({ error: "Ubicación no encontrada" }, { status: 422 });
    }

    return NextResponse.json({ name, lat, lon });
  } catch {
    return NextResponse.json(
      { error: "No hemos podido determinar la ubicación." },
      { status: 502 }
    );
  }
}