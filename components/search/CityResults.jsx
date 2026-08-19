"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CityFilter from "@/components/search/CityFilter";
import PriceAlertToggle from "@/components/search/PriceAlertToggle";
import { formatEuro } from "@/lib/utils/format";

function monthLabel(date) {
  const d = new Date(date);
  const fecha = d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return fecha.charAt(0).toUpperCase() + fecha.slice(1).replace(".", "");
}

export default function CityResults({
  cities,
  initialFilter = "todas",
  totalCombos,
  transport,
  vacations,
  wholeMonth,
  travelers,
  budget,
  maxKm,
  multiOrigin = false,
  showAlertToggle = false,
  hasTelegram = false,
  query = null,
}) {
  const [cityFilter, setCityFilter] = useState(initialFilter);

  const filteredCities = useMemo(() => {
    if (cityFilter === "todas") return cities;
    return cities.filter((city) => city.slug === cityFilter);
  }, [cities, cityFilter]);

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2">
        <p className={showAlertToggle ? "text-sm font-medium text-stone-500" : "mb-3 text-sm font-medium text-stone-500"}>
          {cities.length} ciudades · {totalCombos} combinaciones, ordenadas de la
          más barata a la más cara
        </p>
        {showAlertToggle && (
          <PriceAlertToggle query={query} hasTelegram={hasTelegram} />
        )}
      </div>

      {cities.length > 1 && (
        <CityFilter cities={cities} value={cityFilter} onChange={setCityFilter} />
      )}

      <div className="space-y-5">
        {filteredCities.map((city) => (
          <div key={city.slug}>
            <div className="mb-2 flex items-center gap-3 border-b border-stone-200 pb-2">
              <div className="relative h-10 w-10 shrink-0">
                {city.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={city.image}
                    alt={city.name}
                    className="h-full w-full rounded object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded bg-gradient-to-br from-brand-300 to-brand-500" />
                )}
              </div>
              <h2 className="text-lg font-bold text-ink">
                {city.name}
              </h2>
              {city.options.length > 0 ? (
                <span className="ml-auto text-sm font-bold text-brand-600">
                  desde {formatEuro(city.options[0].price)}
                </span>
              ) : city.noFlights ? (
                <span className="ml-auto text-sm text-stone-400">
                  Sin vuelos en este período
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              {city.options.length === 0 && city.noFlights ? (
                <p className="text-sm text-stone-500">
                  No hay vuelos disponibles para este período. Prueba otras
                  fechas.
                </p>
              ) : (
                city.options.map((opt) => {
                  const detailQuery = new URLSearchParams({
                    origin: opt.originRef,
                    startDate: opt.outbound,
                    endDate: opt.returnDate,
                    travelers,
                    transport,
                    budget,
                    maxKm,
                  });
                  if (opt.airport) detailQuery.set("airport", opt.airport);
                  if (wholeMonth) detailQuery.set("wholeMonth", "1");
                  if (vacations) detailQuery.set("vacations", "1");
                  return (
                    <article
                      key={`${opt.slug}-${opt.originRef}-${opt.outbound}-${opt.returnDate}`}
                      className="card overflow-hidden"
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm text-stone-500">
                                {monthLabel(opt.outbound)} →{" "}
                                {monthLabel(opt.returnDate)}{" "}
                                <span className="text-stone-400">
                                  ({opt.nights} noches)
                                </span>
                                {opt.bridge?.isBridge && (
                                  <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                                    📅 Puente
                                  </span>
                                )}
                              </p>
                              {opt.transport === "car" && (
                                <p className="text-xs text-stone-400">
                                  🚗 {opt.distanceLabel}
                                  {opt.durationLabel && opt.durationLabel !== "—"
                                    ? ` · ${opt.durationLabel}`
                                    : ""}
                                </p>
                              )}
                              {multiOrigin && (
                                <p className="text-xs text-brand-600">
                                  📍 Desde {opt.originRef}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-extrabold text-brand-600">
                                {formatEuro(opt.price)}
                              </p>
                              <p className="text-xs text-stone-400">
                                {opt.transport === "car"
                                  ? "🚗 Coste total"
                                  : opt.airline
                                    ? `✈️ ${opt.airline}`
                                    : ""}
                              </p>
                              {opt.transport !== "car" && (
                                <p className="text-xs font-medium text-brand-600">
                                  Ida y vuelta · {travelers || 2} personas
                                </p>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/destinos/${opt.slug}?${detailQuery.toString()}`}
                            className="btn-primary mt-2 w-fit !px-4 !py-2 text-sm"
                          >
                            Ver escapada
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        ))}
        {totalCombos === 0 && (
          <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-500">
            {vacations
              ? transport === "car"
                ? "No hemos encontrado escapadas para ninguna combinación de fechas de tus vacaciones."
                : "No hemos encontrado vuelos para ninguna combinación de fechas de tus vacaciones."
              : "No hemos encontrado vuelos para ninguna fin de semana de este mes."}
          </p>
        )}
      </div>
    </section>
  );
}