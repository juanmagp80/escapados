// Helpers para enviar mensajes a Telegram vía Bot API.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export function hasTelegramToken() {
  return Boolean(TOKEN);
}

export async function sendTelegramMessage(chatId, message, opts = {}) {
  if (!TOKEN) return { ok: false, error: "No TELEGRAM_BOT_TOKEN configured" };
  if (!chatId) return { ok: false, error: "No chat id provided" };

  const params = new URLSearchParams({
    chat_id: String(chatId),
    text: message,
    parse_mode: opts.parse_mode || "HTML",
    disable_web_page_preview: opts.disable_web_page_preview || true,
  });

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.description || "Telegram API error" };
  }
  return { ok: true, message_id: data.message_id };
}
