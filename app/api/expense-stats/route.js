import { computeExpenseStats } from "@/lib/destinations/expenseStats";
import { getSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/expense-stats?destination=Granada
// Devuelve estadísticas agregadas reales de gasto (percentiles) para un
// destino. Si no hay suficientes muestras, stats es null.
export async function GET(request) {
  const destination = request.nextUrl.searchParams
    .get("destination")
    ?.trim();
  if (!destination) {
    return NextResponse.json({ error: "Falta el destino." }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("trip_expenses")
    .select(
      "total_spent, hotel_spent, transport_spent, food_spent, activities_spent, travelers, nights"
    )
    .ilike("destination", destination);

  if (error) {
    return NextResponse.json({ stats: null });
  }

  return NextResponse.json({
    destination,
    stats: computeExpenseStats(data || []),
  });
}