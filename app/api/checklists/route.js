import { getSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getServer() {
    return getSupabaseServer();
}

// Obtiene el checklist de una escapada compartida por slug.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
        return NextResponse.json({ error: "Falta el slug." }, { status: 400 });
    }

    const supabase = getServer();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
    }

    const { data: trip } = await supabase
        .from("shared_trips")
        .select("id, destination")
        .eq("slug", slug)
        .maybeSingle();
    if (!trip) {
        return NextResponse.json({ error: "Escapada no encontrada." }, { status: 404 });
    }

    const { data } = await supabase
        .from("trip_checklists")
        .select("*")
        .eq("shared_trip_id", trip.id)
        .maybeSingle();

    return NextResponse.json({
        items: data?.items || [],
        destination: trip.destination,
    });
}

// Crea o actualiza el checklist (edición colaborativa).
export async function PUT(request) {
    const supabase = getServer();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
    }

    let userId = null;
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id || null;
    } catch {
        userId = null;
    }

    const { slug, items } = await request.json();
    if (!slug || !Array.isArray(items)) {
        return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }

    const { data: trip, error: tripError } = await supabase
        .from("shared_trips")
        .select("id, destination")
        .eq("slug", slug)
        .maybeSingle();
    if (tripError || !trip) {
        return NextResponse.json({ error: "Escapada no encontrada." }, { status: 404 });
    }

    const { data: existing } = await supabase
        .from("trip_checklists")
        .select("id")
        .eq("shared_trip_id", trip.id)
        .maybeSingle();

    const payload = {
        shared_trip_id: trip.id,
        user_id: userId,
        destination: trip.destination,
        items,
        updated_at: new Date().toISOString(),
    };

    if (existing) {
        const { error } = await supabase
            .from("trip_checklists")
            .update(payload)
            .eq("id", existing.id);
        if (error) {
            return NextResponse.json(
                { error: "No hemos podido guardar." },
                { status: 500 }
            );
        }
        return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.from("trip_checklists").insert(payload);
    if (error) {
        return NextResponse.json({ error: "No hemos podido guardar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}