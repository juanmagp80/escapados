import { formatEuro } from "@/lib/utils/format";

function HotelCard({ hotel }) {
  return (
    <a
      href={hotel.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-2xl border border-stone-100 p-3 transition active:scale-[0.99]"
    >
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
          {hotel.rating ? <span>⭐ {hotel.rating.toFixed(1)}</span> : null}
          {hotel.reviews ? <span>({hotel.reviews})</span> : null}
        </div>
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
      </div>
    </a>
  );
}

export default function HotelList({ items, data }) {
  return (
    <div className="space-y-2">
      {items.map((h, i) => (
        <HotelCard key={i} hotel={h} />
      ))}
      {data?.source && (
        <p className="pt-1 text-xs text-stone-400">Fuente: {data.source}</p>
      )}
    </div>
  );
}
