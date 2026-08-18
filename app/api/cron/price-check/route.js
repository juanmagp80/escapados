import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { runSearch } from "@/lib/search/runSearch";
import { runMultiOriginSearch, splitOrigins } from "@/lib/search/runMultiOrigin";
import { formatEuro } from "@/lib/utils/format";
import { sendTelegramMessage, hasTelegramToken } from "@/lib/telegram";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// Cron diario (Vercel): re-lanza todas las alertas de precios activas,
// compara con el último precio conocido y notifica por Telegram si bajó.
// Programado en vercel.json: "0 9 * * *" (todos los días a las 09:00 UTC).
// Para probar en local: GET /api/cron/price-check?force=1
export async function GET(request) {
  const force = request.nextUrl.searchParams.get("force") === "1";

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase de servicio no configurado" },
      { status: 500 }
    );
  }

  if (!hasTelegramToken()) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN no configurado" },
      { status: 500 }
    );
  }

  const { data: alerts, error } = await admin
    .from("price_alerts")
    .select("id, user_id, label, query_params, last_price, active")
    .eq("active", true);

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las alertas." },
      { status: 500 }
    );
  }

  let checked = 0;
  let notified = 0;
  const errors = [];

  for (const alert of alerts || []) {
    if (!force) {
      const last = alert.last_checked;
      if (last) {
        const diffHours =
          (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60);
        if (diffHours < 20) continue;
      }
    }

    try {
      const q = alert.query_params || {};
      const prefs = await admin
        .from("preferences")
        .select("telegram_chat_id")
        .eq("user_id", alert.user_id)
        .maybeSingle();

      const chatId = prefs.data?.telegram_chat_id;

      const origins = q.origin ? splitOrigins(q.origin) : [q.origin];

      let result;
      if (origins.length > 1) {
        result = await runMultiOriginSearch({ ...q, origins });
      } else {
        result = await runSearch({ ...q, origin: q.origin });
      }

      if (result.error) {
        errors.push({ id: alert.id, error: result.error });
        continue;
      }

      const destinations = result.destinations || [];

      // En modo vacaciones, extraer las opciones de vuelo para comparar precios
      let cheapest = null;
      let summary = [];

      if (q.vacations) {
        for (const d of destinations) {
          if (d.flightOptions && d.flightOptions.length > 0) {
            const opts = d.flightOptions.map((opt) => ({
              name: d.name,
              slug: d.slug,
              price: opt.totalPrice,
              outbound: opt.outbound,
              returnDate: opt.returnDate,
              nights: opt.nights,
              airline: opt.airline,
            }));
            summary = summary.concat(opts);
          }
        }
      } else {
        for (const d of destinations) {
          if (d.estimatedCost != null) {
            summary.push({
              name: d.name,
              slug: d.slug,
              price: d.estimatedCost,
              outbound: d.bestDates?.outbound,
              returnDate: d.bestDates?.returnDate,
              nights: d.nights,
              airline: d.flight?.airline,
            });
          }
        }
      }

      summary.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
      cheapest = summary[0];

      if (!cheapest) {
        continue;
      }

      checked += 1;

      const oldPrice = alert.last_price;
      const newPrice = cheapest.price;

      if (chatId && oldPrice != null && newPrice < oldPrice) {
        const dropped = formatEuro(oldPrice - newPrice);
        let msg = `🔻 <b>Precio más bajo!</b>\n\n`;
        msg += `<b>${cheapest.name}</b>\n`;
        msg += `${formatEuro(newPrice)} (antes ${formatEuro(oldPrice)}, -${dropped})\n`;
        msg += `${cheapest.outbound} → ${cheapest.returnDate} (${cheapest.nights} noches)`;
        if (cheapest.airline) msg += `\n✈️ ${cheapest.airline}`;
        msg += `\n\n<a href="https://escapa2.es/destinos/${cheapest.slug}">Ver detalles</a>`;

        const res = await sendTelegramMessage(chatId, msg);
        if (res.ok) {
          notified += 1;
        } else {
          errors.push({ id: alert.id, error: res.error });
        }
      }

      await admin
        .from("price_alerts")
        .update({
          last_price: newPrice,
          last_results: summary,
          last_checked: new Date().toISOString(),
        })
        .eq("id", alert.id);
    } catch (err) {
      errors.push({ id: alert.id, error: err.message });
    }
  }

  return NextResponse.json({
    ok: true,
    alerts: alerts?.length || 0,
    checked,
    notified,
    errors: errors.length > 0 ? errors : undefined,
  });
}
