import { refineItinerary } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
    try {
        const { destination, currentItinerary, message } = await request.json();
        if (!destination || !message || !currentItinerary) {
            return NextResponse.json(
                { error: "Faltan datos para refinar el itinerario" },
                { status: 400 }
            );
        }

        const refined = await refineItinerary({
            destination,
            currentItinerary,
            userMessage: message,
        });

        if (!refined.days || refined.days.length === 0) {
            return NextResponse.json(
                { error: "No hemos podido refinar el itinerario" },
                { status: 200 }
            );
        }

        return NextResponse.json(refined);
    } catch (err) {
        return NextResponse.json(
            { error: "No hemos podido refinar el itinerario ahora mismo." },
            { status: 500 }
        );
    }
}