"use client";

import HotelList from "@/components/hotels/HotelList";
import SectionLoader from "@/components/loading/SectionLoader";
import PlaceList from "@/components/places/PlaceList";
import PoiMap from "@/components/maps/PoiMap";
import { useEffect, useState } from "react";

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
  maxPrice,
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
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    const ctrl = new AbortController();
    const startTime = Date.now();
    setState({ status: "loading", data: null });

    fetch(`/api/${endpoint}?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const elapsed = Date.now() - startTime;
        const minDelay = 4000;
        const remaining = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          const items = data.hotels || data.items || [];
          if (!items.length) setState({ status: "empty", data });
          else setState({ status: "done", data: { ...data, items } });
        }, remaining);
      })
      .catch((err) => {
        const elapsed = Date.now() - startTime;
        const minDelay = 4000;
        const remaining = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          setState({
            status: "empty",
            data: { notice: "No hemos podido obtener los datos." },
          });
        }, remaining);
      });

    return () => ctrl.abort();
  }, [endpoint, query, checkIn, checkOut, guests, lat, lon, maxPrice]);

  if (state.status === "loading")
    return (
      <SectionLoader
        label={
          kind === "hotels"
            ? "Buscando alojamientos…"
            : "Buscando lugares…"
        }
      />
    );
  if (state.status === "empty") return <Empty notice={state.data?.notice} />;

  const items = state.data.items;
  if (kind === "hotels")
    return (
      <>
        <HotelList items={items} data={state.data} />
        {lat != null && lon != null && (
          <div className="mt-3">
            <PoiMap center={{ lat: Number(lat), lon: Number(lon) }} points={items} />
          </div>
        )}
      </>
    );
  return <PlaceList items={items} data={state.data} icon={icon} />;
}
