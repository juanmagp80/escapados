import { formatEuro } from "@/lib/utils/format";
import Link from "next/link";

export default function DestinationCard({ dest, query, multiOrigin = false }) {
  const href = `/destinos/${dest.slug}?${new URLSearchParams(query).toString()}`;
  return (
    <Link href={href} className="block">
      <article className="card overflow-hidden transition active:scale-[0.99]">
        <div className="relative h-40 w-full bg-gradient-to-br from-brand-300 to-brand-500">
          {dest.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dest.image}
              alt={dest.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4">
            <div>
              <h3 className="text-xl font-bold text-white drop-shadow">
                {dest.name}
              </h3>
              {dest.region && (
                <p className="text-xs font-medium text-white/90">
                  {dest.region === "costa" ? "🏖️ Costa" : "🏞️ Interior"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 p-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
            {multiOrigin && query.origin && (
              <span className="font-medium text-brand-600">📍 Desde {query.origin}</span>
            )}
            {dest.bridge?.isBridge && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                📅 Puente
              </span>
            )}
            {dest.transportLabel && <span>{dest.transportLabel}</span>}
            {dest.distanceLabel && dest.distanceLabel !== "—" && (
              <span>🚗 {dest.distanceLabel}</span>
            )}
            {dest.durationLabel && dest.durationLabel !== "—" && (
              <span>⏱️ {dest.durationLabel}</span>
            )}
            {dest.weatherLabel && <span>☀️ {dest.weatherLabel}</span>}
          </div>

          {dest.bridge?.holidays?.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              🎉 {dest.bridge.holidays.map((h) => `${h.name} (${h.day})`).join(" · ")}
            </div>
          )}

          {dest.altOrigins && dest.altOrigins.length > 0 && (
            <div className="rounded-lg bg-stone-50 p-2 text-xs text-stone-500">
              {dest.altOrigins.map((alt) => (
                <div key={alt.origin} className="flex justify-between">
                  <span>🔄 También desde {alt.origin}</span>
                  <span className="font-medium text-ink">
                    {alt.estimatedCost != null ? formatEuro(alt.estimatedCost) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between border-t border-stone-100 pt-3">
            <div>
              <p className="text-xs text-stone-500">Total estimado (transporte + alojamiento)</p>
              <p className="text-lg font-bold text-ink">
                {dest.estimatedCost
                  ? formatEuro(dest.estimatedCost)
                  : "Por calcular"}
              </p>
              <p className="text-xs text-stone-400">
                para {query.travelers || 2} personas · {dest.nights || 0} noches
              </p>
              {query.transport === "plane" && dest.flight && (
                <p className="text-xs font-medium text-brand-600">
                  ✈️ Ida y vuelta · {query.travelers || 2} personas
                </p>
              )}
            </div>
            <span className="btn-primary shrink-0 !px-4 !py-2 text-sm">Ver escapada →</span>
          </div>

          <div className="border-t border-stone-100 pt-2 text-xs text-stone-500">
            <div className="flex justify-between">
              <span>🏨 Alojamiento est. ({dest.nights || 0} noches)</span>
              <span className="font-medium text-ink">{formatEuro(dest.hotelCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>🚗 Combustible (ida y vuelta)</span>
              <span className="font-medium text-ink">{formatEuro(dest.transportCost)}</span>
            </div>
          </div>

          <div className="rounded-lg bg-stone-50 p-2 text-xs text-stone-500">
            <p className="font-medium text-stone-400">Extras orientativos, no incluidos</p>
            <div className="mt-1 flex justify-between">
              <span>🍽️ Comida estimada</span>
              <span className="font-medium text-ink">{formatEuro(dest.foodCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>🏛️ Actividades estimadas</span>
              <span className="font-medium text-ink">{formatEuro(dest.activitiesCost)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
