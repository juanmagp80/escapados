export function formatEuro(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return (
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace("EUR", "€")
  );
}

export function formatKm(meters) {
  if (meters === null || meters === undefined || Number.isNaN(meters))
    return "—";
  const km = meters / 1000;
  return `${Math.round(km).toLocaleString("es-ES")} km`;
}

export function formatDuration(seconds) {
  if (!seconds) return "—";
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function nightsBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Fecha ISO local (AAAAMM-DD) a partir de un objeto Date. A diferencia de
// toISOString(), no depende de UTC y no se desplaza un día en zonas horarias
// como España.
export function localIso(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Suma días a una fecha ISO (AAAAMM-DD) en hora local.
export function addDaysIso(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return localIso(d);
}

// Próximo viernes a partir de hoy (mínimo dentro de 2 días) como fecha ISO local.
export function nextFridayIso() {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let delta = (5 - d.getDay() + 7) % 7;
  if (delta < 2) delta += 7;
  d.setDate(d.getDate() + delta);
  return localIso(d);
}
