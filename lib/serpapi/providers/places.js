import { searchPlaces } from "@/lib/serpapi/client";

const CATEGORY_QUERIES = {
  restaurants: "restaurantes",
  attractions: "qué ver",
};

export async function getPlaces({ q, category = "restaurants" }) {
  const type = CATEGORY_QUERIES[category] || category;
  const data = await searchPlaces({ q, type });
  const localResults = data?.local_results;

  const raw = Array.isArray(localResults) ? localResults : [];

  const items = raw
    .map((p) => ({
      name: p.title || "Sin nombre",
      rating: p.rating ? Number(p.rating) : null,
      reviews: p.reviews ? Number(p.reviews) : null,
      type: p.category || p.type || null,
      priceLevel: p.price || null,
      address: p.address || null,
      image: p.thumbnail || null,
      link: p.place_id_search || p.reviews_link || null,
      source: "Google Maps",
    }))
    .filter((x) => x.name && x.image)
    .slice(0, 8);

  return { items, source: "Google Maps" };
}