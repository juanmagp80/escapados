import { calculateFuel, carTotalCost, blablacarIncome, carSeatsAvailable, suggestedPricePerSeat, blablacarEffectiveCost } from "@/lib/fuel/cost";
import { nightsBetween, formatEuro, slugify } from "@/lib/utils/format";
import { scoreDestination, DEFAULT_SCORING_WEIGHTS } from "@/lib/destinations/scoring";
import { parsePlaces, parseItinerary, buildMapsLink } from "@/lib/ai/gemini";
import { normalizeTrips, parsePrice } from "@/lib/blablacar/client";
import {
  runMultiOriginSearch,
  splitOrigins,
} from "@/lib/search/runMultiOrigin";

jest.mock("@/lib/search/runSearch", () => ({
  runSearch: jest.fn(),
}));
import { runSearch } from "@/lib/search/runSearch";

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

describe("ai/gemini", () => {
  test("parsePlaces - valid JSON", () => {
    const items = parsePlaces(
      JSON.stringify({
        items: [
          {
            name: "Restaurante A",
            type: "Local",
            priceLevel: "€€",
            address: "Calle 1",
            description: "Cocina local",
          },
        ],
      })
    );
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Restaurante A");
    expect(items[0].priceLevel).toBe("€€");
    expect(items[0].description).toBe("Cocina local");
  });

  test("parsePlaces - strips markdown fences", () => {
    const items = parsePlaces('```json\n{"items":[{"name":"Museo"}]}\n```');
    expect(items[0].name).toBe("Museo");
  });

  test("parsePlaces - filters invalid entries and caps at 8", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `Lugar ${i}` }));
    const withInvalid = parsePlaces(JSON.stringify({ items: [...many, { name: "" }] }));
    expect(withInvalid).toHaveLength(8);
    expect(withInvalid.every((p) => p.name)).toBe(true);
  });

  test("parsePlaces - invalid JSON throws", () => {
    expect(() => parsePlaces("no json aquí")).toThrow();
  });

  test("buildMapsLink - builds Google Maps search url", () => {
    const link = buildMapsLink(
      { name: "Museo del Prado", address: "Paseo del Prado s/n", },
      "Madrid"
    );
    expect(link).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    expect(decodeURIComponent(link)).toContain("Museo del Prado, Paseo del Prado s/n, Madrid");
  });

  test("buildMapsLink - falls back to name or destination", () => {
    expect(
      buildMapsLink({ name: "La Alhambra" }, "Granada")
    ).toContain(encodeURIComponent("La Alhambra, Granada"));
    expect(buildMapsLink(null, "Granada")).toContain(encodeURIComponent("Granada"));
    expect(buildMapsLink({}, null)).toBeNull();
  });

  test("parseItinerary - valid JSON", () => {
    const itinerary = parseItinerary(
      JSON.stringify({
        summary: "s",
        notes: "n",
        days: [
          {
            day: 1,
            title: "t",
            activities: [
              { time: "10:00", name: "a", description: "d", duration: "2h" },
            ],
            restaurants: ["r"],
          },
        ],
      })
    );
    expect(itinerary.days).toHaveLength(1);
    expect(itinerary.days[0].activities[0].name).toBe("a");
    expect(itinerary.days[0].restaurants).toEqual(["r"]);
  });

  test("parseItinerary - filters days without day number", () => {
    const itinerary = parseItinerary(
      JSON.stringify({
        days: [{ day: 0, title: "x", activities: [] }, { day: 2, title: "y", activities: [] }],
      })
    );
    expect(itinerary.days).toHaveLength(1);
    expect(itinerary.days[0].day).toBe(2);
  });

  test("parseItinerary - missing days throws", () => {
    expect(() => parseItinerary(JSON.stringify({ summary: "s" }))).toThrow();
  });
});

describe("blablacar/client", () => {
  test("parsePrice - handles string, number and decimal comma", () => {
    expect(parsePrice("15.00")).toBe(15);
    expect(parsePrice("12,50")).toBe(12.5);
    expect(parsePrice(20)).toBe(20);
    expect(parsePrice("9 €")).toBe(9);
    expect(parsePrice(null)).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });

  test("normalizeTrips - maps fields and sorts by price ascending", () => {
    const trips = normalizeTrips([
      {
        link: "https://www.blablacar.es/trip/1",
        waypoints: [
          { place: { city: "Madrid" }, date_time: "2026-08-15T08:00:00" },
          { place: { city: "Segovia" }, date_time: "2026-08-15T09:00:00" },
        ],
        duration_in_seconds: 3600,
        price: { amount: "10.00", currency: "EUR" },
        seats_left: 3,
        vehicle: { make: "Seat", model: "Ibiza" },
      },
      {
        link: "https://www.blablacar.es/trip/2",
        waypoints: [
          { place: { city: "Madrid" }, date_time: "2026-08-15T10:00:00" },
          { place: { city: "Segovia" }, date_time: "2026-08-15T11:00:00" },
        ],
        duration_in_seconds: 3600,
        price: { amount: "7.00", currency: "EUR" },
        seats_left: 2,
      },
    ]);
    expect(trips).toHaveLength(2);
    expect(trips[0].price).toBe(7);
    expect(trips[0].departureCity).toBe("Madrid");
    expect(trips[0].arrivalCity).toBe("Segovia");
    expect(trips[0].seatsLeft).toBe(2);
    expect(trips[1].vehicle).toBe("Seat Ibiza");
  });

  test("normalizeTrips - drops trips without valid price", () => {
    const trips = normalizeTrips([
      { price: { amount: null } },
      { price: { amount: "0" } },
      { price: { amount: "5" } },
    ]);
    expect(trips).toHaveLength(1);
    expect(trips[0].price).toBe(5);
  });
});

describe("search/runMultiOrigin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("splitOrigins - splits by comma and semicolon", () => {
    expect(splitOrigins("Málaga, Granada")).toEqual(["Málaga", "Granada"]);
    expect(splitOrigins("Málaga; Granada; Sevilla")).toEqual(["Málaga", "Granada", "Sevilla"]);
    expect(splitOrigins("  Madrid , Córdoba ")).toEqual(["Madrid", "Córdoba"]);
    expect(splitOrigins("")).toEqual([]);
    expect(splitOrigins(null)).toEqual([]);
  });

  test("dedupes by slug keeping the best origin with alternatives", async () => {
    const make = (slug, name, score, estimatedCost, transportCost) => ({
      name,
      slug,
      score,
      estimatedCost,
      transportCost,
      region: "interior",
    });
    runSearch
      .mockResolvedValueOnce({
        destinations: [make("granada", "Granada", 0.8, 240, 45)],
      })
      .mockResolvedValueOnce({
        destinations: [make("granada", "Granada", 0.9, 300, 90)],
      });

    const { destinations, best, error } = await runMultiOriginSearch({
      origins: ["Cártama", "Madrid"],
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 2,
      transport: "car",
    });

    expect(error).toBeUndefined();
    expect(destinations).toHaveLength(1);
    expect(destinations[0].originRef).toBe("Madrid");
    expect(destinations[0].altOrigins).toEqual([
      expect.objectContaining({ origin: "Cártama" }),
    ]);
    expect(best.originRef).toBe("Madrid");
  });

  test("plane keeps the cheapest origin per destination", async () => {
    runSearch
      .mockResolvedValueOnce({
        destinations: [
          { name: "Lisboa", slug: "lisboa", estimatedCost: 320, score: 0.7 },
        ],
      })
      .mockResolvedValueOnce({
        destinations: [
          { name: "Lisboa", slug: "lisboa", estimatedCost: 210, score: 0.6 },
        ],
      });

    const { destinations } = await runMultiOriginSearch({
      origins: ["Madrid", "Barcelona"],
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 2,
      transport: "plane",
    });

    expect(destinations).toHaveLength(1);
    expect(destinations[0].originRef).toBe("Barcelona");
    expect(destinations[0].estimatedCost).toBe(210);
  });

  test("reports failed origins but keeps valid results", async () => {
    runSearch
      .mockResolvedValueOnce({ error: "no-origin" })
      .mockResolvedValueOnce({
        destinations: [
          { name: "Sevilla", slug: "sevilla", score: 0.8, estimatedCost: 200 },
        ],
      });

    const { destinations, failedOrigins, error } = await runMultiOriginSearch({
      origins: ["Atlántida", "Cártama"],
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 2,
      transport: "car",
    });

    expect(error).toBeUndefined();
    expect(failedOrigins).toEqual(["Atlántida"]);
    expect(destinations).toHaveLength(1);
    expect(destinations[0].name).toBe("Sevilla");
  });

  test("returns error when all origins fail", async () => {
    runSearch.mockResolvedValue({ error: "no-origin" });

    const { error, failedOrigins, originsSearched } = await runMultiOriginSearch({
      origins: ["A", "B"],
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 2,
      transport: "car",
    });

    expect(error).toBe("no-origin");
    expect(failedOrigins).toHaveLength(2);
    expect(originsSearched).toBe(2);
  });

  test("tolerates thrown errors per origin", async () => {
    runSearch.mockRejectedValueOnce(new Error("boom"));

    const { error, failedOrigins } = await runMultiOriginSearch({
      origins: ["Cártama"],
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 2,
      transport: "car",
    });

    expect(error).toBe("no-origin");
    expect(failedOrigins).toEqual(["Cártama"]);
  });
});