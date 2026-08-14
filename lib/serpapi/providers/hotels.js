import { searchHotels } from "@/lib/serpapi/client";
import { getHotelsFromOverpass } from "@/lib/serpapi/providers/hotelsOverpass";
import { getHotelsFromStay22 } from "@/lib/stayingapi/stay22";
import { getHotelsFromStaying } from "@/lib/stayingapi/hotels";
import { getHotelsFromHotelsCom } from "@/lib/hotelscom/rapidapi";
import { getHotelsFromBookingCom } from "@/lib/bookingcom/rapidapi";

export async function getHotelsFromGoogle({ q, checkIn, checkOut, guests = 2 }) {
  const data = await searchHotels({ q, checkIn, checkOut, guests });
  const properties = Array.isArray(data?.properties) ? data.properties : [];
  const hotels = properties
    .map((p) => ({
      name: p.name || "Alojamiento",
      image:
        p.images?.[0]?.thumbnail ||
        p.images?.[0]?.original_image ||
        p.thumbnail,
      pricePerNight: parsePrice(
        p.rate_per_night?.lowest ?? p.price?.extracted_lowest
      ),
      priceTotal: parsePrice(
        p.total_rate?.lowest ?? p.total_rate?.extracted_lowest
      ),
      rating: p.overall_rating ? Number(p.overall_rating) : null,
      reviews: p.reviews ? Number(p.reviews) : null,
      nights: p.extracted_nights ?? null,
      link: p.link || null,
    }))
    .filter((h) => h.name)
    .slice(0, 8);
  return { hotels, source: "primary" };
}

export async function getHotels({
  q,
  checkIn,
  checkOut,
  guests = 2,
  lat,
  lon,
  maxPricePerNight,
}) {
  let source = "primary";
  const filter = (hs) =>
    maxPricePerNight != null
      ? hs.filter(
          (h) =>
            h.pricePerNight == null || h.pricePerNight <= Number(maxPricePerNight)
        )
      : hs;

  // 1. Hotels.com RapidAPI (principal - más variedad: hostales, B&B, apartamentos, mejor filtro precio)
  try {
    const hotelsCom = await getHotelsFromHotelsCom({
      q,
      checkIn,
      checkOut,
      guests,
      lat,
      lon,
      maxPricePerNight,
    });
    const filtered = filter(hotelsCom);
    if (filtered.length > 0) return finalize(filtered, "hotelscom");
  } catch {
    // Hotels.com falló → SerpAPI Google Hotels
  }

  // 2. SerpAPI Google Hotels (fallback)
  try {
    const { hotels } = await getHotelsFromGoogle({ q, checkIn, checkOut, guests });
    const filtered = filter(hotels);
    if (filtered.length > 0) return finalize(filtered, source);
  } catch {
    // SerpAPI sin cuota o fallo → Booking.com (RapidAPI)
  }

  // 3. Booking.com RapidAPI (fallback)
  try {
    const bookingCom = await getHotelsFromBookingCom({
      q,
      checkIn,
      checkOut,
      guests,
      lat,
      lon,
      maxPricePerNight,
    });
    const filtered = filter(bookingCom);
    if (filtered.length > 0) return finalize(filtered, "bookingcom");
  } catch {
    // Booking.com falló → StayingAPI
  }

  // 4. StayingAPI
  const withPrices = await getHotelsFromStaying({
    q,
    checkIn,
    checkOut,
    guests,
    lat,
    lon,
    maxPricePerNight,
  });
  if (withPrices.length > 0) return finalize(withPrices, "stayingapi");

  // 5. Stay22
  const stay22 = await getHotelsFromStay22({
    q,
    checkIn,
    checkOut,
    guests,
    lat,
    lon,
    maxPricePerNight,
  });
  const filteredStay22 = filter(stay22);
  if (filteredStay22.length > 0) return finalize(filteredStay22, "stay22");

  // 6. OpenStreetMap (fallback sin precios)
  const fallback = await getHotelsFromOverpass({ lat, lon });
  const filteredFallback = filter(fallback);
  if (filteredFallback.length > 0) return finalize(filteredFallback, "fallback");
  
  return { hotels: [], source: "fallback", cheapestPrice: null };
}

// Ordena de más barato a más caro (los que no tienen precio al final) y
// expone el precio mínimo por noche para mostrarlo en la UI.
function finalize(hotels, source) {
  const sorted = [...hotels].sort((a, b) => {
    const pa = a.pricePerNight == null ? Infinity : a.pricePerNight;
    const pb = b.pricePerNight == null ? Infinity : b.pricePerNight;
    return pa - pb;
  });
  const withPrice = sorted.filter((h) => h.pricePerNight != null);
  const cheapestPrice = withPrice.length
    ? Math.min(...withPrice.map((h) => h.pricePerNight))
    : null;
  return { hotels: sorted, source, cheapestPrice };
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
