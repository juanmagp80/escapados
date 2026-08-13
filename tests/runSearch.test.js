import { vacationPairs, weekendPairsInMonth } from "@/lib/search/runSearch";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

describe("search/runSearch - weekendPairsInMonth", () => {
  test("todos los pares tienen fechas de ida y vuelta válidas", () => {
    const pairs = weekendPairsInMonth("2026-08-01");
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) {
      expect(p.outbound).toMatch(ISO);
      expect(p.returnDate).toMatch(ISO);
      expect(p.returnDate > p.outbound).toBe(true);
    }
  });

  test("el viernes produce par a domingo y a lunes", () => {
    const pairs = weekendPairsInMonth("2026-08-01");
    const fridayOut = pairs.filter((p) => p.outbound === "2026-08-21");
    const returns = fridayOut.map((p) => p.returnDate).sort();
    expect(returns).toEqual(["2026-08-23", "2026-08-24"]);
  });

  test("el sábado produce par que vuelve el lunes", () => {
    const pairs = weekendPairsInMonth("2026-08-01");
    const satPair = pairs.find((p) => p.outbound === "2026-08-22");
    expect(satPair.returnDate).toBe("2026-08-24");
  });

  test("el jueves produce par que vuelve el lunes", () => {
    const pairs = weekendPairsInMonth("2026-08-01");
    const thuPair = pairs.find((p) => p.outbound === "2026-08-20");
    expect(thuPair.returnDate).toBe("2026-08-24");
  });

  test("ninguna fecha de vuelta es vacía ni inválida (bug de 'Invalid Date')", () => {
    const pairs = weekendPairsInMonth("2026-08-01");
    for (const p of pairs) {
      expect(p.returnDate).not.toBe("");
      expect(Number.isNaN(new Date(p.returnDate).getTime())).toBe(false);
    }
  });
});

describe("search/runSearch - vacationPairs", () => {
  const nights = (p) =>
    Math.round(
      (new Date(p.returnDate) - new Date(p.outbound)) / 86400000
    );

  test("combina periodos de 2, 3, 4 y 5 días dentro de la ventana", () => {
    const pairs = vacationPairs("2026-08-10", "2026-08-24");
    expect(pairs.length).toBeGreaterThan(0);
    const periodosUsados = new Set(pairs.map((p) => p.nights));
    for (const p of pairs) {
      expect(p.outbound >= "2026-08-10").toBe(true);
      expect(p.returnDate <= "2026-08-24").toBe(true);
      expect(p.returnDate > p.outbound).toBe(true);
      expect(nights(p)).toBeGreaterThanOrEqual(2);
      expect(nights(p)).toBeLessThanOrEqual(5);
      expect(p.nights).toBe(nights(p));
    }
    // Todos los periodos de 2 a 5 se usan en una ventana de 15 días.
    for (const d of [2, 3, 4, 5]) expect(periodosUsados.has(d)).toBe(true);
  });

  test("ventana de 4 días: solo caben periodos de 2 y 3 días", () => {
    const pairs = vacationPairs("2026-08-10", "2026-08-13");
    const periodosUsados = [...new Set(pairs.map((p) => p.nights))].sort();
    expect(periodosUsados).toEqual([2, 3]);
  });

  test("una ventana demasiado corta no genera combinaciones", () => {
    expect(vacationPairs("2026-08-10", "2026-08-11")).toEqual([]);
    expect(vacationPairs("", "")).toEqual([]);
    expect(vacationPairs("2026-08-20", "2026-08-01")).toEqual([]);
  });

  test("una ventana muy larga se limita a 48 combinaciones", () => {
    const pairs = vacationPairs("2026-08-01", "2026-09-30");
    expect(pairs.length).toBeLessThanOrEqual(48);
  });

  test("solo genera los periodos pedidos si se pasan explícitos", () => {
    const pairs = vacationPairs("2026-08-10", "2026-08-24", [3, 5]);
    const periodosUsados = new Set(pairs.map((p) => p.nights));
    expect([...periodosUsados].sort()).toEqual([3, 5]);
  });
});