import Link from "next/link";
import { DESTINATIONS } from "@/lib/destinations/catalog";
import { COMMUNITIES } from "@/lib/destinations/communities";
import { addDaysIso, nextFridayIso } from "@/lib/utils/format";

const FEATURED = ["Granada", "Cádiz", "Ronda", "Nerja", "Barcelona", "San Sebastián"];

function buildQuery(extra = {}) {
  const params = new URLSearchParams({
    startDate: nextFridayIso(),
    endDate: addDaysIso(nextFridayIso(), 2),
    travelers: "2",
    ...extra,
  });
  return params.toString();
}

export default function HomeIdeas() {
  const featured = FEATURED.map((name) =>
    DESTINATIONS.find((d) => d.name === name)
  ).filter(Boolean);

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3 text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-medium uppercase tracking-wide">
          Inspiración
        </span>
        <span className="h-px flex-1 bg-stone-200" />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-600">
          ✨ Destinos populares este fin de semana
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((d) => (
            <Link
              key={d.slug}
              href={`/destinos/${d.slug}?${buildQuery({ destination: d.name, transport: "car" })}`}
              className="group block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.98]"
            >
              <div className="relative h-24 sm:h-28">
                {d.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.image}
                    alt={d.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-2 text-sm font-bold text-white drop-shadow">
                  {d.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-stone-600">
          🗺️ O por comunidades
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COMMUNITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/comunidad/${c.slug}?${buildQuery({ transport: "car" })}`}
              className="group flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.98]"
            >
              <div className="relative h-20">
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-2 text-xs font-bold text-white drop-shadow">
                  {c.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}