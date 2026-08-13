import {
  MIN_EXPENSE_SAMPLES,
  computeExpenseStats,
} from "@/lib/destinations/expenseStats";

describe("destinations/expenseStats", () => {
  const sample = (total, travelers = 2, nights = 3) => ({
    total_spent: total,
    travelers,
    nights,
  });

  test("sin muestras suficientes devuelve null", () => {
    expect(
      computeExpenseStats([sample(300), sample(400), sample(500), sample(600)])
    ).toBeNull();
    expect(computeExpenseStats([])).toBeNull();
  });

  test("con las muestras justas devuelve percentiles", () => {
    const rows = [100, 200, 300, 400, 500].map((t) => sample(t));
    const stats = computeExpenseStats(rows);
    expect(stats.count).toBe(5);
    expect(stats.avg).toBe(300);
    expect(stats.median).toBe(300);
    expect(stats.p25).toBe(200);
    expect(stats.p75).toBe(400);
  });

  test("normaliza a por persona y noche", () => {
    // 2 personas, 4 noches, 1200 € total → 150 €/persona/noche.
    const rows = [
      { total_spent: 1200, travelers: 2, nights: 4 },
      { total_spent: 2400, travelers: 2, nights: 4 },
      { total_spent: 3000, travelers: 2, nights: 4 },
      { total_spent: 6000, travelers: 2, nights: 4 },
      { total_spent: 4000, travelers: 2, nights: 4 },
    ];
    const stats = computeExpenseStats(rows);
    expect(stats.perPersonNight.median).toBe(375);
  });

  test("ignora gastos nulos o cero", () => {
    const rows = [sample(100), sample(""), sample(0), sample(null)];
    expect(computeExpenseStats(rows)).toBeNull();

    const ok = [sample(100), sample(200), sample(300), sample(400), sample(500)];
    ok.push({ total_spent: undefined });
    expect(computeExpenseStats(ok).count).toBe(5);
  });

  test("constante de mínimo de muestras coherente", () => {
    expect(MIN_EXPENSE_SAMPLES).toBe(5);
  });
});