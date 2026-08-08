function priceLabel(price) {
  if (!price) return null;
  const p = String(price);
  if (p.includes("€")) return p.trim();
  const map = { "$": "Barato", "$$": "Precio medio", "$$$": "Especial" };
  return map[p] || null;
}

function PlaceCard({ place, icon }) {
  const label = priceLabel(place.priceLevel);
  return (
    <a
      href={place.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-2xl border border-stone-100 p-3 transition active:scale-[0.99]"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-100">
        {place.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">
            {icon}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{place.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
          {place.rating ? <span>⭐ {place.rating.toFixed(1)}</span> : null}
          {place.reviews ? <span>({place.reviews})</span> : null}
          {label ? <span>· {label}</span> : null}
        </div>
        {place.address ? (
          <p className="truncate text-xs text-stone-400">{place.address}</p>
        ) : null}
      </div>
    </a>
  );
}

export default function PlaceList({ items, data, icon = "📍" }) {
  return (
    <div className="space-y-2">
      {items.map((p, i) => (
        <PlaceCard key={i} place={p} icon={icon} />
      ))}
      {data?.source && (
        <p className="pt-1 text-xs text-stone-400">Fuente: {data.source}</p>
      )}
    </div>
  );
}