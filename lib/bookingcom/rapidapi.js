// Booking.com RapidAPI Integration (booking-com15.p.rapidapi.com)
// Based on the API structure you shared

const RAPIDAPI_KEY = process.env.BOOKINGCOM_RAPIDAPI_KEY;
const RAPIDAPI_HOST = "booking-com15.p.rapidapi.com";

async function bookingComGet(endpoint, params) {
  if (!RAPIDAPI_KEY) throw new Error("BOOKINGCOM_RAPIDAPI_KEY not configured");
  
  const url = new URL(`https://${RAPIDAPI_HOST}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }

  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Booking.com RapidAPI ${endpoint} failed: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Search destinations/cities (autocomplete)
 * Use this to get destination_id for hotel search
 */
export async function searchDestinations({ query, languagecode = "es-es" }) {
  const response = await bookingComGet("/api/v1/hotels/searchDestination", {
    query,
    languagecode,
  });
  
  return response?.data || [];
}

/**
 * Get nearby cities (what you showed in the example)
 * Useful for "destinations near X" features
 */
export async function getNearbyCities({ latitude, longitude, languagecode = "es-es" }) {
  const response = await bookingComGet("/api/v1/hotels/getNearbyCities", {
    latitude,
    longitude,
    languagecode,
  });
  
  return response?.data || [];
}

/**
 * Search hotels - MAIN ENDPOINT YOU NEED
 * Requires destination_id from searchDestinations
 */
export async function searchHotelsBookingCom({
  destinationId,
  checkIn,
  checkOut,
  adults = 2,
  children = 0,
  rooms = 1,
  currency = "EUR",
  languagecode = "es-es",
  minPrice,
  maxPrice,
  starRating,
  sort = "price",
}) {
  const searchParams = {
    destination_id: destinationId,
    checkin_date: checkIn,
    checkout_date: checkOut,
    adults_number: adults,
    children_number: children,
    room_number: rooms,
    currency_code: currency,
    languagecode,
    order_by: sort, // price, review_score, distance, etc.
    page_number: 0,
    include_adjacency: true,
  };

  if (minPrice) searchParams.min_price = minPrice;
  if (maxPrice) searchParams.max_price = maxPrice;
  if (starRating) searchParams.class = starRating; // 1-5 stars

  const response = await bookingComGet("/api/v1/hotels/searchHotels", searchParams);
  
  const hotels = response?.data?.hotels || [];
  
  return hotels.map(h => ({
    id: h.hotel_id || h.id,
    name: h.hotel_name || h.name,
    image: h.main_photo_url || h.max_photo_url || h.photos?.[0]?.url || null,
    pricePerNight: h.min_total_price ? Number(h.min_total_price) / (h.nights || 1) : 
                   h.composite_price_breakdown?.gross_amount ? Number(h.composite_price_breakdown.gross_amount) / (h.nights || 1) : null,
    priceTotal: h.min_total_price ? Number(h.min_total_price) : 
                h.composite_price_breakdown?.gross_amount ? Number(h.composite_price_breakdown.gross_amount) : null,
    currency: h.currency_code || currency,
    rating: h.review_score ? Number(h.review_score) : null,
    reviews: h.review_count ? Number(h.review_count) : null,
    address: h.address || h.full_address,
    lat: h.latitude ? Number(h.latitude) : null,
    lon: h.longitude ? Number(h.longitude) : null,
    starRating: h.class ? Number(h.class) : null,
    distanceFromCenter: h.distance_to_center ? Number(h.distance_to_center) : null,
    link: h.url ? `https://www.booking.com${h.url}` : `https://www.booking.com/hotel/${h.hotel_id || h.id}.html`,
    source: "Booking.com",
    breakfastIncluded: h.is_free_cancellation || h.includes_breakfast,
    freeCancellation: h.is_free_cancellation,
  })).filter(h => h.pricePerNight != null || h.priceTotal != null);
}

/**
 * Get hotel details (photos, amenities, policies, etc.)
 */
export async function getHotelDetailsBookingCom({
  hotelId,
  checkIn,
  checkOut,
  adults = 2,
  currency = "EUR",
  languagecode = "es-es",
}) {
  const response = await bookingComGet("/api/v1/hotels/getHotelDetails", {
    hotel_id: hotelId,
    checkin_date: checkIn,
    checkout_date: checkOut,
    adults_number: adults,
    currency_code: currency,
    languagecode,
  });
  
  const hotel = response?.data;
  if (!hotel) return null;
  
  return {
    id: hotel.hotel_id || hotel.id,
    name: hotel.hotel_name || hotel.name,
    description: hotel.description?.text || hotel.summary,
    images: hotel.photos?.map(p => p.url) || [],
    amenities: hotel.facilities?.map(f => f.name) || [],
    policies: hotel.policies?.text || null,
    address: hotel.address || hotel.full_address,
    lat: hotel.latitude ? Number(hotel.latitude) : null,
    lon: hotel.longitude ? Number(hotel.longitude) : null,
    rating: hotel.review_score ? Number(hotel.review_score) : null,
    reviews: hotel.review_count ? Number(hotel.review_count) : null,
    starRating: hotel.class ? Number(hotel.class) : null,
    pricePerNight: hotel.min_total_price ? Number(hotel.min_total_price) / (hotel.nights || 1) : null,
    priceTotal: hotel.min_total_price ? Number(hotel.min_total_price) : null,
    currency: hotel.currency_code || currency,
    link: hotel.url ? `https://www.booking.com${hotel.url}` : `https://www.booking.com/hotel/${hotel.hotel_id || hotel.id}.html`,
    source: "Booking.com",
  };
}

/**
 * Adapter for existing hotel search interface
 */
export async function getHotelsFromBookingCom({
  q,
  checkIn,
  checkOut,
  guests = 2,
  lat,
  lon,
  maxPricePerNight,
}) {
  if (!q || !checkIn || !checkOut) return [];
  
  try {
    // First, search for destination
    const destinations = await searchDestinations({ query: q, languagecode: "es-es" });
    const destination = destinations.find(d => d.type === "city" || d.type === "district" || d.type === "hotel") || destinations[0];
    
    if (!destination?.dest_id) {
      console.warn("No destination found for:", q);
      return [];
    }
    
    // Then search hotels
    const hotels = await searchHotelsBookingCom({
      destinationId: destination.dest_id,
      checkIn,
      checkOut,
      adults: guests,
      maxPrice: maxPricePerNight,
      sort: "price",
    });
    
    return hotels.slice(0, 8).map(h => ({
      name: h.name,
      image: h.image,
      pricePerNight: h.pricePerNight,
      priceTotal: h.priceTotal,
      rating: h.rating,
      reviews: h.reviews,
      lat: h.lat,
      lon: h.lon,
      address: h.address,
      starRating: h.starRating,
      link: h.link,
      source: "Booking.com",
    }));
  } catch (error) {
    console.error("Booking.com API error:", error);
    return [];
  }
}