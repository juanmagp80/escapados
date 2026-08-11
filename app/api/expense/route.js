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

    const { destination, total, hotel, transport, food, activities, travelers, nights } =
        await request.json();
    if (!destination || !total) {
        return NextResponse.json({ error: "Faltan datos del gasto." }, { status: 400 });
    }

    const { error } = await supabase.from("trip_expenses").insert({
        user_id: user.id,
        destination,
        total_spent: Number(total) || 0,
        hotel_spent: hotel ? Number(hotel) : null,
        transport_spent: transport ? Number(transport) : null,
        food_spent: food ? Number(food) : null,
        activities_spent: activities ? Number(activities) : null,
        travelers: Number(travelers) || 2,
        nights: Number(nights) || 2,
    });

    if (error) {
        return NextResponse.json(
            { error: "No hemos podido guardar el gasto." },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}