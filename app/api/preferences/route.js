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

    const formData = await request.formData();
    let interests = [];
    try {
        interests = JSON.parse(formData.get("interests") || "[]");
    } catch {
        interests = [];
    }

    const payload = {
        user_id: user.id,
        interests,
        pace: formData.get("pace") || "relaxed",
        pets: formData.get("pets") === "1",
        default_budget: formData.get("default_budget")
            ? Number(formData.get("default_budget"))
            : null,
        default_travelers: Number(formData.get("default_travelers")) || 2,
    };

    const { error } = await supabase
        .from("preferences")
        .upsert(payload, { onConflict: "user_id" });

    if (error) {
        return NextResponse.json(
            { error: "No hemos podido guardar las preferencias." },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}