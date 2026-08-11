import { estimateTripCost } from "@/lib/destinations/costEstimate";
import { searchFlightsRyanair } from "@/lib/ryanair/fares";

jest.mock("@/lib/utils/cache", () => {
  const never = {
    get: () => null,
    set: (k, v) => v,
  };
  return {
    inMemoryCache: () => never,
    withFallback: async (fn, fb) => {
      try {
        return await fn();
      } catch {
        return fb;
      }
    },
  };
});

jest.mock("@/lib/utils/cacheServer", () => ({
  fileCache: () => ({
    get: () => null,
    set: (k, v) => v,
  }),
}));

jest.mock("@/lib/serpapi/client", () => ({
  searchHotels: jest.fn(),
}));
import { searchHotels } from "@/lib/serpapi/client";

jest.mock("@/lib/serpapi/providers/hotelsOverpass", () => ({
  getHotelsFromOverpass: jest.fn(),
}));
import { getHotelsFromOverpass } from "@/lib/serpapi/providers/hotelsOverpass";

jest.mock("@/lib/stayingapi/hotels", () => ({
  getHotelsFromStaying: jest.fn(),
}));
import { getHotelsFromStaying } from "@/lib/stayingapi/hotels";

jest.mock("@/lib/stayingapi/stay22", () => ({
  getHotelsFromStay22: jest.fn(),
}));
import { getHotelsFromStay22 } from "@/lib/stayingapi/stay22";

import {
  getHotels,
  getHotelsFromGoogle,
} from "@/lib/serpapi/providers/hotels";

describe("destinations/costEstimate", () => {
  test("interior nivel económico: hotel 60€/noche y extras low-cost", () => {
    const est = estimateTripCost({
      name: "Ronda",
      region: "interior",
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 2,
      transportCost: 45,
    });
    expect(est.nights).toBe(3);
    expect(est.hotelCost).toBe(180); // 60 × 3
    expect(est.foodCost).toBe(120); // 15 €/día × 4 × 2
    expect(est.activitiesCost).toBe(48); // 8 €/noche × 3 × 2
    expect(est.estimatedCost).toBe(225); // hotel + transporte
    expect(est.perPerson).toBe(113);
  });

  test("costa usa 75€/noche", () => {
    const est = estimateTripCost({
      name: "Nerja",
      region: "costa",
      startDate: "2026-08-15",
      endDate: "2026-08-16",
      travelers: 2,
    });
    expect(est.hotelCost).toBe(75);
  });

  test("hotel con precio real sustituye a la estimación", () => {
    const est = estimateTripCost({
      name: "Ronda",
      region: "interior",
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 2,
      transportCost: 100,
      hotelCost: 210,
    });
    expect(est.hotelCost).toBe(210);
    expect(est.hotelCostReal).toBe(true);
    expect(est.estimatedCost).toBe(310);
  });

  test("destino caro: extras nivel 3", () => {
    const est = estimateTripCost({
      name: "Madrid",
      region: "interior",
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 2,
    });
    expect(est.foodCost).toBe(28 * 4 * 2);
    expect(est.activitiesCost).toBe(18 * 3 * 2);
  });

  test("sin fechas válidas: 0 noches y un día de comida", () => {
    const est = estimateTripCost({ name: "Ronda", region: "interior", travelers: 2 });
    expect(est.nights).toBe(0);
    expect(est.hotelCost).toBe(0);
    expect(est.estimatedCost).toBe(0);
    expect(est.perPerson).toBe(0);
  });
});

describe("ryanair/fares", () => {
  function mockCheapest(fares) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ outbound: { fares }, inbound: { fares } }),
    });
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("suma ida y vuelta y marca fuente Ryanair", async () => {
    mockCheapest([
      { day: "2026-08-14", price: { value: 20 } },
      { day: "2026-08-15", price: { value: 25 } },
      { day: "2026-08-16", price: { value: 30 } },
      { day: "2026-08-18", price: { value: 40 } },
    ]);

    const res = await searchFlightsRyanair({
      departureId: "MAD",
      arrivalId: "GRX",
      outboundDate: "2026-08-15",
      returnDate: "2026-08-18",
      adults: 2,
    });

    expect(res.found).toBe(true);
    expect(res.airline).toBe("Ryanair");
    expect(res.source).toBe("Ryanair");
    expect(res.totalPrice).toBe(65); // 25 + 40
    expect(res.pricePerPerson).toBe(32.5);
    expect(res.link).toContain("ryanair.com");
    expect(res.link).toContain("originIata=MAD");
  });

  test("sin vuelta solo cuenta la ida", async () => {
    mockCheapest([{ day: "2026-08-15", price: { value: 25 } }]);

    const res = await searchFlightsRyanair({
      departureId: "MAD",
      arrivalId: "GRX",
      outboundDate: "2026-08-15",
      adults: 2,
    });

    expect(res.found).toBe(true);
    expect(res.totalPrice).toBe(25);
    expect(res.inbound).toBeNull();
    expect(res.link).toContain("isReturn=false");
  });

  test("acepta flexibilidad de ±2 días", async () => {
    mockCheapest([{ day: "2026-08-13", price: { value: 18 } }]);

    const res = await searchFlightsRyanair({
      departureId: "MAD",
      arrivalId: "GRX",
      outboundDate: "2026-08-15",
      returnDate: "2026-08-15",
      adults: 2,
    });

    expect(res.found).toBe(true);
    expect(res.outbound.date).toBe("2026-08-13");
    expect(res.totalPrice).toBe(36); // ida y vuelta el mismo día barato
  });

  test("devuelve found=false si no hay tarifa cercana", async () => {
    mockCheapest([{ day: "2099-01-01", price: { value: 5 } }]);

    const res = await searchFlightsRyanair({
      departureId: "MAD",
      arrivalId: "GRX",
      outboundDate: "2026-08-15",
      returnDate: "2026-08-18",
      adults: 2,
    });

    expect(res.found).toBe(false);
  });
});

describe("serpapi/providers/hotels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getHotelsFromGoogle normaliza precios y campos", async () => {
    searchHotels.mockResolvedValue({
      properties: [
        {
          name: "Hotel A",
          images: [{ thumbnail: "https://img" }],
          rate_per_night: { lowest: "150.00" },
          total_rate: { lowest: "450.00" },
          overall_rating: 4.5,
          reviews: 120,
          link: "https://hotel-a",
        },
        { name: "Hotel B", total_rate: { extracted_lowest: "96,00" } },
        { name: "Hotel sin precio", images: [], rate_per_night: { lowest: null } },
        { name: "" },
      ],
    });

    const { hotels, source } = await getHotelsFromGoogle({
      q: "Granada",
      checkIn: "2026-08-15",
      checkOut: "2026-08-18",
      guests: 2,
    });

    expect(source).toBe("primary");
    expect(hotels).toHaveLength(4); // el sin nombre queda como "Alojamiento"
    expect(hotels[0]).toMatchObject({
      name: "Hotel A",
      rating: 4.5,
      reviews: 120,
      pricePerNight: 150,
      priceTotal: 450,
    });
    expect(hotels[1]).toMatchObject({
      name: "Hotel B",
      pricePerNight: null,
      priceTotal: 96,
    });
    expect(hotels[3].name).toBe("Alojamiento");
  });

  test("getHotels cae a Overpass si Google falla", async () => {
    searchHotels.mockRejectedValue(new Error("quota"));
    getHotelsFromStaying.mockResolvedValue([]);
    getHotelsFromStay22.mockResolvedValue([]);
    getHotelsFromOverpass.mockResolvedValue([
      { name: "Alojamiento OSM", lat: 37.1, lon: -3.6, distanceKm: 0.4 },
    ]);

    const { hotels, source } = await getHotels({
      q: "Granada",
      checkIn: "2026-08-15",
      checkOut: "2026-08-18",
      lat: 37.1,
      lon: -3.6,
    });

    expect(source).toBe("fallback");
    expect(hotels[0].name).toBe("Alojamiento OSM");
    expect(hotels[0].lat).toBe(37.1);
  });

  test("getHotels usa Stay22 cuando Google y Staying fallan", async () => {
    searchHotels.mockRejectedValue(new Error("quota"));
    getHotelsFromStaying.mockResolvedValue([]);
    getHotelsFromStay22.mockResolvedValue([
      {
        name: "Hotel Stay22",
        pricePerNight: 80,
        priceTotal: 240,
        source: "stay22",
      },
    ]);
    getHotelsFromOverpass.mockResolvedValue([
      { name: "Alojamiento OSM", lat: 37.1, lon: -3.6, distanceKm: 0.4 },
    ]);

    const { hotels, source } = await getHotels({
      q: "Granada",
      checkIn: "2026-08-15",
      checkOut: "2026-08-18",
      lat: 37.1,
      lon: -3.6,
    });

    expect(source).toBe("stay22");
    expect(hotels[0].name).toBe("Hotel Stay22");
    expect(getHotelsFromOverpass).not.toHaveBeenCalled();
  });

  test("getHotels respeta maxPricePerNight sobre Stay22", async () => {
    searchHotels.mockRejectedValue(new Error("quota"));
    getHotelsFromStaying.mockResolvedValue([]);
    getHotelsFromStay22.mockResolvedValue([
      { name: "Caro", pricePerNight: 200 },
      { name: "Barato", pricePerNight: 90 },
    ]);

    const { hotels } = await getHotels({
      q: "Granada",
      checkIn: "2026-08-15",
      checkOut: "2026-08-18",
      lat: 37.1,
      lon: -3.6,
      maxPricePerNight: 150,
    });

    expect(hotels.map((h) => h.name)).toEqual(["Barato"]);
  });

  test("getHotels ordena por precio y expone el más barato", async () => {
    searchHotels.mockRejectedValue(new Error("quota"));
    getHotelsFromStaying.mockResolvedValue([]);
    getHotelsFromStay22.mockResolvedValue([
      { name: "Caro", pricePerNight: 250 },
      { name: "Sin precio", pricePerNight: null },
      { name: "Medio", pricePerNight: 120 },
      { name: "Barato", pricePerNight: 60 },
    ]);

    const { hotels, cheapestPrice } = await getHotels({
      q: "Granada",
      checkIn: "2026-08-15",
      checkOut: "2026-08-18",
      lat: 37.1,
      lon: -3.6,
    });

    expect(hotels.map((h) => h.name)).toEqual([
      "Barato",
      "Medio",
      "Caro",
      "Sin precio",
    ]);
    expect(cheapestPrice).toBe(60);
  });

  test("getHotels sin resultados: cheapestPrice es null", async () => {
    searchHotels.mockRejectedValue(new Error("quota"));
    getHotelsFromStaying.mockResolvedValue([]);
    getHotelsFromStay22.mockResolvedValue([]);
    getHotelsFromOverpass.mockResolvedValue([]);

    const { hotels, cheapestPrice } = await getHotels({
      q: "Granada",
      checkIn: "2026-08-15",
      checkOut: "2026-08-18",
      lat: 37.1,
      lon: -3.6,
    });

    expect(hotels).toEqual([]);
    expect(cheapestPrice).toBeNull();
  });

  test("getHotels devuelve listas vacías si ambas fuentes fallan", async () => {
    searchHotels.mockRejectedValue(new Error("quota"));
    getHotelsFromStaying.mockResolvedValue([]);
    getHotelsFromStay22.mockResolvedValue([]);
    getHotelsFromOverpass.mockResolvedValue([]);

    const { hotels, source } = await getHotels({
      q: "Granada",
      checkIn: "2026-08-15",
      checkOut: "2026-08-18",
      lat: 37.1,
      lon: -3.6,
    });

    expect(hotels).toEqual([]);
    expect(source).toBe("fallback");
  });
});