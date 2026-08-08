import { searchHotels } from "@/lib/serpapi/client";

export async function getHotels({ q, checkIn, checkOut, guests = 2 }) {
  const data = await searchHotels({ q, checkIn, checkOut, guests });
  const properties = Array.isArray(data?.properties) ? data.properties : [];

  const hotels = properties
    .map((p) => ({
      name: p.name || "Alojamiento",
      image:
        p.images?.[0]?.thumbnail ||
        p.images?.[0]?.original_image ||
        p.thumbnail,
      pricePerNight: parsePrice(p.rate_per_night?.lowest ?? p.price?.extracted_lowest),
      priceTotal: parsePrice(
        p.total_rate?.lowest ?? p.total_rate?.extracted_lowest
      ),
      rating: p.overall_rating ? Number(p.overall_rating) : null,
      reviews: p.reviews ? Number(p.reviews) : null,
      nights: p.extracted_nights ?? null,
      link: p.link || null,
      source: "Google Hotels",
    }))
    .filter((h) => h.name && h.image)
    .slice(0, 8);

  return { hotels, source: "Google Hotels" };
}

function parsePrice(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return value;
  const cleaned = String(value)
    .replace(/[^0-9.,]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
