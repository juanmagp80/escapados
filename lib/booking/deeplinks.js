// Deep links de reserva. Escapa2 es afiliado indirecto vía los enlaces de
// Stay22/SerpAPI; cuando el proveedor no trae link (modo fallback), generamos
// un enlace directo de Booking.com con destino y fechas precargados.

// Buscador de Booking.com con lugar, fechas y adultos prefijados.
export function bookingSearchUrl({ name, checkIn, checkOut, adults = 2 }) {
  const params = new URLSearchParams();
  if (name) params.set("ss", name);
  if (checkIn) params.set("checkin", checkIn);
  if (checkOut) params.set("checkout", checkOut);
  params.set("group_adults", String(Math.max(1, Number(adults) || 1)));
  params.set("no_rooms", "1");
  params.set("lang", "es");
  return `https://www.booking.com/searchresults.es.html?${params.toString()}`;
}

// El mejor enlace para reservar un alojamiento: el del proveedor (suele ser
// de afiliado) o, si falta o es un enlace genérico de mapas, uno de Booking
// con las fechas del viaje.
export function hotelReserveUrl(
  hotel,
  { checkIn, checkOut, adults = 2 } = {}
) {
  const own = hotel?.link;
  if (own && !/maps\.google/i.test(own)) return own;
  return bookingSearchUrl({
    name: hotel?.name,
    checkIn,
    checkOut,
    adults,
  });
}
