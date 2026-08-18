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
  const chatId = formData.get("telegram_chat_id");
  if (!chatId || !chatId.trim()) {
    return NextResponse.json({ error: "Falta el chat ID." }, { status: 400 });
  }

  const { error } = await supabase
    .from("preferences")
    .upsert(
      {
        user_id: user.id,
        telegram_chat_id: chatId.trim(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json(
      { error: "No hemos podido guardar el chat ID." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
