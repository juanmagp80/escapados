// Estadísticas reales de gasto agregadas de trip_expenses.
// "Lo que cuesta de verdad": percentiles de gasto total reportado por
// usuarios reales que ya han vuelto. Se normaliza a "por persona y noche"
// para poder comparar viajes con distinto grupo y duración.
//
// Mínimo de muestras para publicar datos: sin volumen suficiente no se
// muestran percentiles (evita conclusiones con 2 viajes).

export const MIN_EXPENSE_SAMPLES = 5;

const NUM = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Rows vienen de trip_expenses: { total_spent, travelers, nights, ... }.
export function computeExpenseStats(rows) {
  const totals = (rows || [])
    .map((r) => NUM(r?.total_spent))
    .filter((v) => v != null && v > 0);
  if (totals.length < MIN_EXPENSE_SAMPLES) return null;

  const sorted = [...totals].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  // Por persona y noche: escala para que 2 personas 3 noches valga
  // comparable a 1 persona 1 noche.
  const perPersonNights = (rows || [])
    .map((r) => {
      const total = NUM(r?.total_spent);
      const travelers = NUM(r?.travelers) || 1;
      const nights = NUM(r?.nights) || 1;
      if (total == null || total <= 0) return null;
      return total / Math.max(1, travelers) / Math.max(1, nights);
    })
    .filter((v) => v != null)
    .sort((a, b) => a - b);

  return {
    count: totals.length,
    avg: Math.round(sum / totals.length),
    p25: percentile(sorted, 25),
    median: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    perPersonNight: {
      avg: avgOrNull(perPersonNights),
      p25: percentileOrNull(perPersonNights, 25),
      median: percentileOrNull(perPersonNights, 50),
      p75: percentileOrNull(perPersonNights, 75),
    },
  };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return Math.round(sorted[0]);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * frac);
}

function percentileOrNull(sorted, p) {
  if (sorted.length < MIN_EXPENSE_SAMPLES) return null;
  return percentile(sorted, p);
}

function avgOrNull(sorted) {
  if (sorted.length === 0) return null;
  return Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
}
