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

    const { destination, ratings, comment } = await request.json();
    if (!destination) {
        return NextResponse.json({ error: "Falta el destino." }, { status: 400 });
    }

    const payload = {
        user_id: user.id,
        destination,
        value_for_money: ratings?.value_for_money || null,
        romance: ratings?.romance || null,
        gastronomy: ratings?.gastronomy || null,
        activities: ratings?.activities || null,
        comment: comment || null,
    };

    const { error } = await supabase
        .from("ratings")
        .upsert(payload, { onConflict: "user_id,destination" });

    if (error) {
        return NextResponse.json(
            { error: "No hemos podido guardar la valoración." },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}