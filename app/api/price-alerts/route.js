import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildQueryParams(searchParams) {
  return {
    origin: searchParams.get("origin") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    travelers: searchParams.get("travelers") || "2",
    transport: searchParams.get("transport") || "car",
    budget: searchParams.get("budget") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    maxKm: searchParams.get("maxKm") || "",
    wholeMonth: searchParams.get("wholeMonth") === "1",
    flexible: searchParams.get("flexible") === "1",
    vacations: searchParams.get("vacations") === "1",
    interest: searchParams.get("interest") || "",
  };
}

function searchKey(params) {
  const o = { ...params };
  const keys = Object.keys(o).sort();
  return JSON.stringify(
    keys.reduce((acc, k) => {
      acc[k] = o[k];
      return acc;
    }, {})
  );
}

export async function GET(request) {
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

  // ?check=1 → devolver si hay una alerta activa para los params enviados
  const isCheck = request.nextUrl.searchParams.get("check") === "1";

  if (isCheck) {
    const params = buildQueryParams(request.nextUrl.searchParams);
    const key = searchKey(params);

    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", user.id)
      .eq("search_key", key)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ active: false });
    }
    return NextResponse.json({
      active: Boolean(data?.active),
      alert: data || null,
    });
  }

  // Sin params → listar todas las alertas del usuario
  const { data, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar las alertas." }, { status: 500 });
  }

  return NextResponse.json({ alerts: data || [] });
}

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

  const body = await request.json();
  const { origin, startDate, endDate, travelers, transport, budget, maxPrice, maxKm, wholeMonth, flexible, vacations, interest, label } = body;

  const query_params = {
    origin,
    startDate,
    endDate,
    travelers,
    transport,
    budget,
    maxPrice,
    maxKm,
    wholeMonth,
    flexible,
    vacations,
    interest,
  };

  const key = searchKey(query_params);

  const payload = {
    user_id: user.id,
    label: label || null,
    query_params,
    search_key: key,
    active: true,
  };

  const { data, error } = await supabase
    .from("price_alerts")
    .upsert(payload, { onConflict: "user_id,search_key" })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No hemos podido guardar la alerta." },
      { status: 500 }
    );
  }

  return NextResponse.json({ alert: data });
}

export async function DELETE(request) {
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

  const { alertId } = await request.json();
  if (!alertId) {
    return NextResponse.json({ error: "Falta el ID de la alerta." }, { status: 400 });
  }

  const { error } = await supabase
    .from("price_alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "No hemos podido eliminar la alerta." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
