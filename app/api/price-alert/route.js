import { checkPriceAlert } from "@/lib/notifications/priceAlerts";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
    try {
        const { from, to, date, currentPrice } = await request.json();
        if (!from || !to || !date || !currentPrice) {
            return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
        }

        const isDrop = checkPriceAlert({
            from,
            to,
            date,
            currentPrice: Number(currentPrice),
        });

        return NextResponse.json({ ok: true, isDrop });
    } catch {
        return NextResponse.json(
            { error: "No hemos podido activar la alerta." },
            { status: 500 }
        );
    }
}