// Limitador de peticiones simple por IP (ventana deslizante en memoria).
// Suficiente para frenar abusos básicos contra las APIs de pago (SerpAPI,
// BlaBlaCar...), sin penalizar a usuarios normales.
const buckets = new Map();
const MAX_BUCKETS = 5000;

export function rateLimit(
  identifier,
  { windowMs = 60 * 1000, max = 30 } = {}
) {
  if (!identifier) identifier = "unknown";
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [key, entry] of buckets) {
      if (now - entry.resetAt > windowMs) buckets.delete(key);
    }
  }

  const entry = buckets.get(identifier);
  if (!entry || now >= entry.resetAt) {
    buckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetInMs: windowMs };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { ok: false, remaining: 0, resetInMs: entry.resetAt - now };
  }
  return { ok: true, remaining: max - entry.count, resetInMs: entry.resetAt - now };
}

export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}