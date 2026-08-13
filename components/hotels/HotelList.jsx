import { hotelReserveUrl } from "@/lib/booking/deeplinks";
import { formatEuro } from "@/lib/utils/format";

function HotelCard({ hotel, cheapest, reserve }) {
  return (
    <a
      href={reserve}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative flex gap-3 rounded-2xl border p-3 transition active:scale-[0.99] ${
        cheapest
          ? "border-brand-300 bg-brand-50"
          : "border-stone-100 bg-white"
      }`}
    >
      {cheapest && (
        <span className="absolute -top-2 left-3 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Más barato
        </span>
      )}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-100">
        {hotel.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hotel.image} alt={hotel.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">🏨</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{hotel.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
          {hotel.rating ? (
            <span>
              ⭐ {hotel.rating.toFixed ? hotel.rating.toFixed(1) : hotel.rating}
            </span>
          ) : null}
          {hotel.reviews ? <span>({hotel.reviews})</span> : null}
          {hotel.distanceKm != null ? (
            <span>📍 a {hotel.distanceKm} km del centro</span>
          ) : null}
        </div>
        {hotel.address ? (
          <p className="truncate text-xs text-stone-400">{hotel.address}</p>
        ) : null}
        <div className="mt-1 text-sm">
          {hotel.pricePerNight ? (
            <span className="font-semibold text-ink">
              {formatEuro(hotel.pricePerNight)}/noche
            </span>
          ) : (
            <span className="text-stone-400">Precio no disponible</span>
          )}
          {hotel.priceTotal ? (
            <span className="ml-2 text-stone-500">
              {formatEuro(hotel.priceTotal)} total
            </span>
          ) : null}
        </div>
        <div className="mt-2 inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white">
          🛎️ Reservar →
        </div>
      </div>
    </a>
  );
}

export default function HotelList({ items, data, checkIn, checkOut, guests }) {
  const showNoPricing =
    data?.source === "fallback" && items.some((h) => !h.pricePerNight);
  const firstPricedIndex = items.findIndex((h) => h.pricePerNight != null);
  return (
    <div className="space-y-2">
      {data?.cheapestPrice != null && (
        <p className="text-sm font-medium text-stone-600">
          💰 Desde{" "}
          <span className="font-bold text-brand-700">
            {formatEuro(data.cheapestPrice)}
          </span>{" "}
          /noche
        </p>
      )}
      {items.map((h, i) => (
        <HotelCard
          key={i}
          hotel={h}
          cheapest={i === firstPricedIndex}
          reserve={hotelReserveUrl(h, { checkIn, checkOut, adults: guests })}
        />
      ))}
      {showNoPricing && (
        <p className="pt-1 text-xs text-stone-400">
          Los alojamientos aparecen sin precio porque las APIs de precios están
          sin cuota o sin clave válida. Están sacados del mapa (OpenStreetMap).
        </p>
      )}
    </div>
  );
}
