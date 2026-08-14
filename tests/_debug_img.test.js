import { cityImages } from "@/lib/travelpayouts/travelpayouts";

beforeAll(() => {
  if (typeof globalThis.fetch === "undefined") {
    globalThis.fetch = require("node-fetch");
  }
});

describe("debug images", () => {
  test("capitals resolve to representative photos", async () => {
    const imgs = await cityImages([
      "Londres", "París", "Roma", "Lisboa", "Niza", "Ámsterdam", "Berlín",
      "Viena", "Budapest", "Praga", "Dublín", "Bruselas", "Atenas", "Estambul",
      "Milán", "Varsovia", "Copenhague", "Estocolmo", "Múnich", "Zúrich",
      "Edimburgo", "Mánchester", "Nueva York", "Barcelona", "Madrid", "Valencia",
      "Bilbao", "Sevilla", "Santiago de Compostela",
    ]);
    for (const [k, v] of Object.entries(imgs)) {
      console.log(k, "->", v || "LARGE/NONE");
    }
  });
});