import { nextPuente } from "@/lib/destinations/holidays";
import { DESTINATIONS } from "@/lib/destinations/catalog";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { localIso } from "@/lib/utils/format";
import { NextResponse } from "next/server";
import webpush from "web-push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Los jueves (12:00) avisamos por push del próximo puente con fechas y una
// sugerencia de escapada. Programado con Vercel Cron:
//   vercel.json → { "crons": [{ "path": "/api/cron/puente", "schedule": "0 12 * * 4" }] }
// Para probarlo en local/log: GET /api/cron/puente?force=1
export async function GET(request) {
  const force = request.nextUrl.searchParams.get("force") === "1";
  const now = new Date();
  const dow = now.getDay();
  if (dow !== 4 && !force) {
    return NextResponse.json(
      { skipped: "Solo se envía los jueves." },
      { status: 403 }
    );
  }

  const vaporConfig = setupVapid();
  if (!vaporConfig.ok) {
    return NextResponse.json({ error: vaporConfig.error }, { status: 500 });
  }

  const puente = nextPuente(localIso(now), 45);
  if (!puente) {
    return NextResponse.json({ ok: true, sent: 0, reason: "Sin puente próximo" });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase de servicio no configurado" },
      { status: 500 }
    );
  }

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys");
  if (error) {
    return NextResponse.json(
      { error: "No se pudo leer las suscripciones." },
      { status: 500 }
    );
  }

  const payload = buildPayload(puente);
  let sent = 0;
  const dead = [];

  for (const sub of subs || []) {
    if (!sub?.endpoint || !sub?.keys) continue;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (err) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) dead.push(sub.id);
    }
  }

  if (dead.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", dead);
  }

  return NextResponse.json({
    ok: true,
    puente: {
      name: puente.holiday.name,
      day: puente.holiday.day,
      outbound: puente.window.outbound,
      returnDate: puente.window.returnDate,
    },
    sent,
    pruned: dead.length,
  });
}

function setupVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hola@escapa2.es";
  if (!publicKey || !privateKey) {
    return { ok: false, error: "Faltan las claves VAPID en el entorno." };
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return { ok: true };
}

// Escapada sugerida de forma determinista a partir del día del festivo.
function buildPayload(puente) {
  const dayOfYear = Number(
    puente.holiday.date.slice(5, 7) + puente.holiday.date.slice(8, 10)
  );
  const popular = DESTINATIONS.filter((d) =>
    ["Granada", "Sevilla", "Córdoba", "Cádiz", "Madrid", "Barcelona", "Bilbao", "Valencia"].includes(
      d.name
    )
  );
  const dest = popular[dayOfYear % popular.length];
  const { window } = puente;

  return {
    title: `📅 Puente: ${puente.holiday.name} (${puente.holiday.day.split(" ")[0]})`,
    body: `${window.outbound} → ${window.returnDate} (${window.nights} noches). Escapada sugerida: ${dest.name}. Reserva antes de que suban los precios.`,
    url: `/destinos/${dest.slug}`,
  };
}