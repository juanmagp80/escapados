"use client";

import { useEffect, useState } from "react";
import HotelList from "@/components/hotels/HotelList";
import PlaceList from "@/components/places/PlaceList";

function Skeleton({ lines = 2 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-stone-200" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-2/3 rounded bg-stone-200" />
            <div className="h-3 w-1/3 rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ notice }) {
  return (
    <p className="text-sm text-stone-400">
      {notice || "No hay datos disponibles en este momento."}
    </p>
  );
}

export default function SerpFetcher({
  endpoint,
  query,
  kind = "hotels",
  icon = "📍",
  checkIn,
  checkOut,
  guests,
  lat,
  lon,
}) {
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    if (!query) {
      setState({ status: "empty", data: { notice: "Falta el destino." } });
      return;
    }
    const params = new URLSearchParams();
    params.set("q", query);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    if (lat != null) params.set("lat", String(lat));
    if (lon != null) params.set("lon", String(lon));
    const ctrl = new AbortController();
    setState({ status: "loading", data: null });

    fetch(`/api/${endpoint}?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const items = data.hotels || data.items || [];
        if (!items.length) setState({ status: "empty", data });
        else setState({ status: "done", data: { ...data, items } });
      })
      .catch(() =>
        setState({
          status: "empty",
          data: { notice: "No hemos podido obtener los datos." },
        })
      );

    return () => ctrl.abort();
  }, [endpoint, query, checkIn, checkOut, guests, lat, lon]);

  if (state.status === "loading") return <Skeleton />;
  if (state.status === "empty") return <Empty notice={state.data?.notice} />;

  const items = state.data.items;
  if (kind === "hotels")
    return <HotelList items={items} data={state.data} />;
  return <PlaceList items={items} data={state.data} icon={icon} />;
}
