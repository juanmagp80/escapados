import { getSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
    const supabase = getSupabaseServer();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const { tripId } = await request.json();
    if (!tripId) {
        return NextResponse.json({ error: "Falta el viaje." }, { status: 400 });
    }

    // Obtener el viaje guardado del usuario
    const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (tripError || !trip) {
        return NextResponse.json({ error: "No hemos encontrado ese viaje." }, { status: 404 });
    }

    const { error } = await supabase.from("published_trips").upsert(
        {
            user_id: user.id,
            destination: trip.destination,
            slug: trip.slug,
            image: trip.image,
            summary: `Escapada a ${trip.destination} desde ${trip.origin || "casa"}`,
            origin: trip.origin,
            start_date: trip.start_date,
            end_date: trip.end_date,
            travelers: trip.travelers,
            transport: trip.transport,
            estimated_cost: trip.budget || null,
        },
        { onConflict: "user_id,destination,start_date" }
    );

    if (error) {
        return NextResponse.json(
            { error: "No hemos podido publicar la escapada." },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}