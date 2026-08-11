import { findEVChargers } from "@/lib/fuel/evChargers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));
    const radiusKm = Number(searchParams.get("radiusKm")) || 10;

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return NextResponse.json({ chargers: [] });
    }

    const chargers = await findEVChargers({ lat, lon, radiusKm });
    return NextResponse.json({ chargers });
}