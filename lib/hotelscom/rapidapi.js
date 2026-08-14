// Hotels.com Provider API via RapidAPI
// Docs: https://rapidapi.com/ (Hotels com Provider)
// Host: hotels-com-provider.p.rapidapi.com
// Endpoints: /v2/regions (destinos), /v3/hotels/search (hoteles)

const RAPIDAPI_KEY = process.env.HOTELSCOM_RAPIDAPI_KEY;
const RAPIDAPI_HOST = "hotels-com-provider.p.rapidapi.com";
const HOTELSCOM_SITE_ID = process.env.HOTELSCOM_SITE_ID || "300000008";

async function rapidapiGet(endpoint, params) {
  if (!RAPIDAPI_KEY) throw new Error("HOTELSCOM_RAPIDAPI_KEY not configured");
  
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
    throw new Error(`Hotels.com Provider ${endpoint} failed: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Search destination to get region_id
 * Endpoint: GET /v2/regions
 */
export async function searchDestinationCom({ query, locale = "es_ES", domain = "ES" }) {
  const response = await rapidapiGet("/v2/regions", {
    query,
    locale,
    domain,
  });
  
  const regions = response?.data || [];
  
  return regions.map(r => ({
    name: r.regionNames?.shortName || r.regionNames?.primaryDisplayName || query,
    type: r.type,
    region_id: r.gaiaId,
    id: r.gaiaId,
    lat: r.coordinates?.lat ? Number(r.coordinates.lat) : null,
    lon: r.coordinates?.long ? Number(r.coordinates.long) : null,
  }));
}

/**
 * Search hotels by region_id
 * Endpoint: GET /v3/hotels/search
 */
export async function searchHotelsComApi({
  regionId,
  checkIn,
  checkOut,
  adults = 2,
  children = 0,
  childrenAges,
  currency = "EUR",
  locale = "es_ES",
  domain = "ES",
  minPrice,
  maxPrice,
  starRatingIds,
  amenities,
  sort = "PRICE_LOW_TO_HIGH",
  pageNumber = 1,
  pageSize = 20,
}) {
  const params = {
    domain,
    locale,
    sort_order: sort,
    region_id: regionId,
    checkin_date: checkIn,
    checkout_date: checkOut,
    adults_number: adults,
    children_ages: childrenAges || (children > 0 ? Array(children).fill(0).join(",") : undefined),
    currency_code: currency,
    page_number: pageNumber,
    page_size: pageSize,
  };

  if (minPrice) params.price_min = minPrice;
  if (maxPrice) params.price_max = maxPrice;
  if (starRatingIds) params.star_rating_ids = starRatingIds;
  if (amenities) params.amenities = amenities;
  
  const lodgingTypes = ["HOSTEL", "APARTMENT", "BED_AND_BREAKFAST", "HOSTAL", "HOTEL"];
  params.lodging_type = lodgingTypes.join(",");
  
  params.available_filter = "SHOW_AVAILABLE_ONLY";

  const response = await rapidapiGet("/v3/hotels/search", params);
  
  const properties = response?.data?.properties || [];
  
  // Para cada hotel, obtener su slug real usando /v2/hotels/summary
  const hotelsWithSlugs = await Promise.all(
    properties.slice(0, 20).map(async (p) => {
      const priceSummary = p?.price?.priceSummary?.definition || {};
      const displayPrice = priceSummary.displayPrice;
      
      let slug = p.slug || null;
      if (!slug && p.id) {
        try {
          const summary = await rapidapiGet("/v2/hotels/summary", {
            domain,
            locale,
            hotel_id: p.id,
          });
          slug = summary?.data?.summary?.slug || null;
        } catch {
          // Si falla, usar el ID como fallback
          slug = String(p.id);
        }
      }
      
      return {
        id: p.id,
        slug: slug,
        name: p.name,
        image: p.photoMainUrl || p.photoUrls?.[0] || null,
        pricePerNight: displayPrice ? Number(displayPrice.replace(/[^0-9.,]/g, "").replace(",", ".")) : null,
        priceTotal: p?.price?.priceSummary?.totalPrice?.amount 
          ? Number(p.price.priceSummary.totalPrice.amount) 
          : null,
        currency: p?.price?.priceSummary?.totalPrice?.currency || currency,
        rating: p.guestRating?.rating || null,
        reviews: p.guestRating?.reviewsCount || null,
        address: p?.address?.addressLine || null,
        lat: p?.mapMarker?.latLong?.latitude ? Number(p.mapMarker.latLong.latitude) : null,
        lon: p?.mapMarker?.latLong?.longitude ? Number(p.mapMarker.latLong.longitude) : null,
        starRating: p.starRating || null,
        distanceFromCenter: p?.destinationInfo?.distanceFromDestination?.value 
          ? Number(p.destinationInfo.distanceFromDestination.value) 
          : null,
        link: buildHotelsComLink({ id: p.id, slug, url: p.url }, domain, locale),
        source: "Hotels.com",
        breakfastIncluded: p.amenities?.includes("FREE_BREAKFAST") || false,
        freeCancellation: p.paymentPreference?.freeCancellation || false,
      };
    })
  );
  
  return hotelsWithSlugs.filter(h => h.pricePerNight != null || h.priceTotal != null);
}

function buildHotelsComLink(hotel, domain, locale) {
  const subdomain = domain === "ES" ? "es" : domain === "GB" ? "uk" : "www";
  const baseUrl = `https://${subdomain}.hoteles.com`;
  const params = new URLSearchParams({
    locale: locale.replace("_", "-"),
    siteid: HOTELSCOM_SITE_ID,
  });
  
  if (hotel.url) {
    return `${baseUrl}${hotel.url}?${params.toString()}`;
  }
  
  if (hotel.slug && hotel.slug !== String(hotel.id)) {
    return `${baseUrl}/hotel/${hotel.slug}.html?${params.toString()}`;
  }
  
  if (hotel.id) {
    return `${baseUrl}/hotel/${hotel.id}.html?${params.toString()}`;
  }
  
  return baseUrl;
}

/**
 * Adapter for existing hotel search interface
 */
export async function getHotelsFromHotelsCom({
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
    // Step 1: Search destination (region)
    const destinations = await searchDestinationCom({ 
      query: q, 
      locale: "es_ES", 
      domain: "ES" 
    });
    
    const cityDest = destinations.find(d => d.type === "CITY") || destinations[0];
    
    if (!cityDest?.region_id) {
      console.warn("No destination found for:", q);
      return [];
    }
    
    // Step 2: Search hotels by region_id
    const hotels = await searchHotelsComApi({
      regionId: cityDest.region_id,
      checkIn,
      checkOut,
      adults: guests,
      maxPrice: maxPricePerNight,
      sort: "PRICE_LOW_TO_HIGH",
      domain: "ES",
      locale: "es_ES",
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
      source: "Hotels.com",
    }));
  } catch (error) {
    console.error("Hotels.com Provider API error:", error);
    return [];
  }
}