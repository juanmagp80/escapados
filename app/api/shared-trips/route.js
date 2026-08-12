import { getSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_OPTIONS = {
    checklist: [
        "Documentación (DNI / pasaporte)",
        "Tarjetas de crédito / efectivo",
        "Móvil y cargador",
        "Medicación",
        "Ropa adecuada al clima",
        "Artículos de aseo",
        "Adaptador de enchufe",
        "Cámara / fotos",
    ],
};

function makeSlug() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < 10; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

// Crea una escapada compartible a partir de un viaje guardado.
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

    const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (tripError || !trip) {
        return NextResponse.json({ error: "No hemos encontrado ese viaje." }, { status: 404 });
    }

    const slug = makeSlug();
    const { data, error } = await supabase
        .from("shared_trips")
        .insert({
            slug,
            owner_id: user.id,
            destination: trip.destination,
            origin: trip.origin,
            title: `Escapada a ${trip.destination}`,
            summary: `Escapada a ${trip.destination} desde ${trip.origin || "casa"}`,
            start_date: trip.start_date,
            end_date: trip.end_date,
            travelers: trip.travelers,
            transport: trip.transport,
            budget: trip.budget,
            image: trip.image,
            itinerary: trip.itinerary || [],
            options: DEFAULT_OPTIONS,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: "No hemos podido compartir la escapada." },
            { status: 500 }
        );
    }

    return NextResponse.json({ slug: data.slug, url: `/compartir/${data.slug}` });
}

// Obtiene una escapada compartida por slug.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
        return NextResponse.json({ error: "Falta el slug." }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
    }

    const { data, error } = await supabase
        .from("shared_trips")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (error || !data) {
        return NextResponse.json({ error: "Escapada no encontrada." }, { status: 404 });
    }

    return NextResponse.json(data);
}

// Actualiza (edición colaborativa) el contenido de una escapada compartida.
export async function PUT(request) {
    const supabase = getSupabaseServer();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
    }

    const { slug, patch } = await request.json();
    if (!slug || !patch) {
        return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }

    const allowed = [
        "title",
        "summary",
        "start_date",
        "end_date",
        "travelers",
        "transport",
        "budget",
        "itinerary",
        "options",
    ];

    const clean = {};
    for (const key of allowed) {
        if (patch[key] !== undefined) clean[key] = patch[key];
    }
    if (Object.keys(clean).length === 0) {
        return NextResponse.json({ error: "Sin cambios." }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("shared_trips")
        .update({ ...clean, updated_at: new Date().toISOString() })
        .eq("slug", slug)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: "No hemos podido actualizar." }, { status: 500 });
    }

    return NextResponse.json(data);
}