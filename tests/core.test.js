import { calculateFuel, carTotalCost, blablacarIncome, carSeatsAvailable, suggestedPricePerSeat, blablacarEffectiveCost } from "@/lib/fuel/cost";
import { nightsBetween, formatEuro, slugify } from "@/lib/utils/format";
import { scoreDestination, DEFAULT_SCORING_WEIGHTS } from "@/lib/destinations/scoring";

describe("fuel/cost", () => {
  test("calculateFuel - basic calculation", () => {
    const result = calculateFuel(300000, 6.5, 1.55); // 300km, 6.5L/100km, 1.55€/L
    expect(result.liters).toBeCloseTo(19.5, 1);
    expect(result.cost).toBeCloseTo(30.23, 1);
  });

  test("calculateFuel - zero distance", () => {
    const result = calculateFuel(0, 6.5, 1.55);
    expect(result.liters).toBe(0);
    expect(result.cost).toBe(0);
  });

  test("calculateFuel - null inputs", () => {
    const result = calculateFuel(null, 6.5, 1.55);
    expect(result.liters).toBe(0);
    expect(result.cost).toBe(0);
  });

  test("carTotalCost - with tolls and blablacar", () => {
    const result = carTotalCost({
      distanceMeters: 300000,
      consumptionL100: 6.5,
      fuelPrice: 1.55,
      tolls: 15,
      blablacarIncome: 30,
    });
    expect(result.fuel.cost).toBeCloseTo(30.23, 1);
    expect(result.tolls).toBe(15);
    expect(result.blablacarIncome).toBe(30);
    expect(result.effective).toBeCloseTo(15.23, 1);
  });

  test("carTotalCost - no negative effective cost", () => {
    const result = carTotalCost({
      distanceMeters: 100000,
      consumptionL100: 5,
      fuelPrice: 1.5,
      tolls: 0,
      blablacarIncome: 100,
    });
    expect(result.effective).toBe(0);
  });

  test("blablacarIncome - basic", () => {
    expect(blablacarIncome(15, 3)).toBe(45);
    expect(blablacarIncome(0, 3)).toBe(0);
    expect(blablacarIncome(15, 0)).toBe(0);
  });

  test("carSeatsAvailable - free passenger seats", () => {
    expect(carSeatsAvailable(1, 5)).toBe(4);
    expect(carSeatsAvailable(2, 5)).toBe(3);
    expect(carSeatsAvailable(5, 5)).toBe(0);
    expect(carSeatsAvailable(0, 5)).toBe(4);
  });

  test("suggestedPricePerSeat - fair split among occupants", () => {
    expect(suggestedPricePerSeat({ fuelCost: 50, tolls: 10, occupants: 4 })).toBe(15);
    expect(suggestedPricePerSeat({ fuelCost: 42, tolls: 0, occupants: 5 })).toBeCloseTo(8.4, 1);
    expect(suggestedPricePerSeat({ fuelCost: 0, tolls: 0, occupants: 3 })).toBe(0);
    expect(suggestedPricePerSeat({ occupants: 1 })).toBe(0);
  });

  test("blablacarEffectiveCost - never negative", () => {
    expect(blablacarEffectiveCost(50, 40)).toBe(10);
    expect(blablacarEffectiveCost(50, 60)).toBe(0);
    expect(blablacarEffectiveCost(0, 40)).toBe(0);
    expect(blablacarEffectiveCost(50, 0)).toBe(50);
  });
});

describe("utils/format", () => {
  test("nightsBetween - basic", () => {
    expect(nightsBetween("2026-08-15", "2026-08-18")).toBe(3);
    expect(nightsBetween("2026-08-15", "2026-08-16")).toBe(1);
    expect(nightsBetween("2026-08-15", "2026-08-15")).toBe(0);
  });

  test("nightsBetween - invalid dates", () => {
    expect(nightsBetween(null, "2026-08-18")).toBe(0);
    expect(nightsBetween("2026-08-18", null)).toBe(0);
    expect(nightsBetween("2026-08-20", "2026-08-15")).toBe(0);
  });

  test("formatEuro - basic", () => {
    expect(formatEuro(30.23)).toMatch(/30,23\s*€/);
    expect(formatEuro(100)).toMatch(/100,00\s*€/);
    expect(formatEuro(0)).toMatch(/0,00\s*€/);
    expect(formatEuro(null)).toBe("—");
    expect(formatEuro(NaN)).toBe("—");
  });

  test("slugify - basic", () => {
    expect(slugify("Granada")).toBe("granada");
    expect(slugify("San Sebastián")).toBe("san-sebastian");
    expect(slugify("Cádiz")).toBe("cadiz");
    expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
  });
});

describe("destinations/scoring", () => {
  const baseDest = {
    distanceKm: 150,
    distanceMeters: 150000,
    estimatedCost: 200,
    rating: 4.5,
    region: "costa",
    distanceMeters: 150000,
    durationSeconds: 7200,
  };

  test("scoreDestination - within budget", () => {
    const { score, reasons } = scoreDestination(baseDest, { budget: 300, maxDistanceKm: 500 });
    expect(score).toBeGreaterThan(0);
    expect(reasons).toContain("💰 Dentro del presupuesto");
    expect(reasons).toContain("⭐ Excelente valoración");
    expect(reasons).toContain("🏖️ Destino de costa");
  });

  test("scoreDestination - over budget", () => {
    const { score, reasons } = scoreDestination(baseDest, { budget: 170, maxDistanceKm: 500 });
    expect(score).toBeGreaterThan(0);
    expect(reasons.some(r => r.includes("por encima") || r.includes("Ligeramente"))).toBe(true);
  });

  test("scoreDestination - interior region", () => {
    const interiorDest = { ...baseDest, region: "interior" };
    const { reasons } = scoreDestination(interiorDest, { budget: 300, maxDistanceKm: 500 });
    expect(reasons).toContain("🏞️ Destino de interior");
  });

  test("scoreDestination - custom weights", () => {
    const customWeights = { ...DEFAULT_SCORING_WEIGHTS, price: 0.5, distance: 0.1 };
    const { score: scoreCustom } = scoreDestination(baseDest, { 
      budget: 300, 
      maxDistanceKm: 500,
      weights: customWeights 
    });
    const { score: scoreDefault } = scoreDestination(baseDest, { 
      budget: 300, 
      maxDistanceKm: 500 
    });
    expect(scoreCustom).not.toBe(scoreDefault);
  });

  test("DEFAULT_SCORING_WEIGHTS - sums to 1", () => {
    const sum = Object.values(DEFAULT_SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 2);
  });
});