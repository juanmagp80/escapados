import {
  TRIP_CATEGORIES,
  categoryById,
} from "@/lib/destinations/categories";

describe("destinations/categories", () => {
  test("categorías predefinidas con intereses del catálogo", () => {
    expect(TRIP_CATEGORIES.length).toBeGreaterThanOrEqual(6);
    for (const c of TRIP_CATEGORIES) {
      expect(c.id).toBeTruthy();
      expect(c.label).toMatch(/^[^\s]+/);
      expect(Array.isArray(c.interests)).toBe(true);
      expect(c.interests.length).toBeGreaterThan(0);
    }
  });

  test("playas sorprendentes prioriza el interés de playa", () => {
    const beach = categoryById("beach");
    expect(beach.interests).toContain("beach");
  });

  test("pueblos con encanto prioriza cultura y romántico", () => {
    const medieval = categoryById("medieval");
    expect(medieval.interests).toContain("culture");
    expect(medieval.interests).toContain("romantic");
  });

  test("categoría desconocida devuelve null", () => {
    expect(categoryById("no-existe")).toBeNull();
    expect(categoryById("")).toBeNull();
  });
});