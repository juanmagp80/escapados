import {
  analyzeBridge,
  dayOfWeekLabel,
  getHolidays,
  nextPuente,
} from "@/lib/destinations/holidays";

describe("destinations/holidays", () => {
  test("getHolidays - festivos nacionales fijos", () => {
    const h = getHolidays(2026);
    const dates = h.map((x) => x.date);
    expect(dates).toContain("2026-01-01"); // Año Nuevo
    expect(dates).toContain("2026-01-06"); // Epifanía
    expect(dates).toContain("2026-05-01"); // Fiesta del Trabajo
    expect(dates).toContain("2026-08-15"); // Asunción
    expect(dates).toContain("2026-10-12"); // Fiesta Nacional
    expect(dates).toContain("2026-12-08"); // Inmaculada
    expect(dates).toContain("2026-12-25"); // Navidad
  });

  test("getHolidays - Semana Santa calculada a partir de Pascua", () => {
    const h = getHolidays(2026);
    const byDate = new Map(h.map((x) => [x.date, x]));
    // Pascua 2026 = 5 abril → Jueves Santo 2, Viernes Santo 3.
    expect(byDate.get("2026-04-03")?.name).toBe("Viernes Santo");
    expect(byDate.get("2026-04-02")?.kind).toBe("regional");
    expect(byDate.get("2026-04-06")?.name).toBe("Lunes de Pascua");

    // La Semana Santa cambia de año a año (2027 corre a finales de marzo).
    const h27 = new Map(getHolidays(2027).map((x) => [x.date, x]));
    expect(h27.get("2027-03-26")?.name).toBe("Viernes Santo"); // Pascua 28/03
    expect(h27.get("2027-03-29")?.name).toBe("Lunes de Pascua");
  });

  test("analyzeBridge - sin festivos no hay puente", () => {
    const res = analyzeBridge("2026-09-10", "2026-09-13");
    expect(res.isBridge).toBe(false);
    expect(res.holidays).toHaveLength(0);
  });

  test("analyzeBridge - festivo en sábado no crea puente", () => {
    // Asunción 2026 cae en sábado: el viaje la incluye, pero no alarga nada.
    const res = analyzeBridge("2026-08-13", "2026-08-16");
    expect(res.holidays).toHaveLength(1);
    expect(res.holidays[0].name).toBe("Asunción de la Virgen");
    expect(res.isBridge).toBe(false);
  });

  test("analyzeBridge - festivo en martes sí es puente", () => {
    // Inmaculada 2026 cae en martes 8/12: viernes→martes es puente.
    const res = analyzeBridge("2026-12-04", "2026-12-08");
    expect(res.isBridge).toBe(true);
    expect(res.holidayWorkdays.length).toBeGreaterThan(0);
    expect(res.bridgeHint).toMatch(/Inmaculada/);
  });

  test("analyzeBridge - Jueves Santo (regional) cuenta como puente", () => {
    const res = analyzeBridge("2026-04-02", "2026-04-05");
    expect(res.isBridge).toBe(true);
    expect(res.holidays[0].name).toBe("Jueves Santo");
  });

  test("analyzeBridge - datos inválidos devuelven null", () => {
    expect(analyzeBridge(null, "2026-08-16")).toBeNull();
    expect(analyzeBridge("", "")).toBeNull();
    expect(analyzeBridge("2026-08-20", "2026-08-16")).toBeNull();
  });

  test("dayOfWeekLabel - devuelve una etiqueta en español", () => {
    const label = dayOfWeekLabel("2026-08-15");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(3);
    expect(label).not.toContain("undefined");
  });

  test("nextPuente - encuentra Inmaculada 2026 (martes) con ventana viernes→martes", () => {
    const puente = nextPuente("2026-11-20", 45);
    expect(puente).not.toBeNull();
    expect(puente.holiday.name).toMatch(/Inmaculada/);
    expect(puente.holiday.day).toMatch(/Martes/i);
    expect(puente.window.outbound).toBe("2026-12-04");
    expect(puente.window.returnDate).toBe("2026-12-08");
    expect(puente.window.nights).toBe(4);
  });

  test("nextPuente - viernes festivo (Viernes Santo 2027) sugiere jueves→domingo", () => {
    // Jueves Santo (25/03, jueves): el puente es jueves→domingo.
    const puente = nextPuente("2027-03-20", 45);
    expect(puente).not.toBeNull();
    expect(puente.holiday.name).toMatch(/Jueves Santo/);
    expect(puente.window.outbound).toBe("2027-03-25");
    expect(puente.window.returnDate).toBe("2027-03-28");
    expect(puente.window.nights).toBe(3);
  });

  test("nextPuente - sin festivo laborable en el horizonte devuelve null", () => {
    // Desde el 20/08/2026, los siguientes 30 días no tienen festivo laborable.
    expect(nextPuente("2026-08-20", 30)).toBeNull();
    expect(nextPuente("")).toBeNull();
  });
});