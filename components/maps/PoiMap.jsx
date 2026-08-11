"use client";

import { useEffect, useRef, useState } from "react";
import { formatEuro } from "@/lib/utils/format";

// Mapa con marcadores (p.ej. hoteles). Si no hay puntos con coordenadas,
// muestra la zona del destino con un marcador central.
export default function PoiMap({ center, points = [], title = "" }) {
  const mapRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;
    if (!center || center.lat === undefined || center.lon === undefined) return;

    let mapInstance = null;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      import("leaflet/dist/leaflet.css");

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      mapInstance = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([center.lat, center.lon], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapInstance);

      const hotelIcon = L.divIcon({
        html: `<div style="background:#f97316;border:2px solid #fff;border-radius:9999px;width:18px;height:18px;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const withCoords = points.filter(
        (p) => p && p.lat !== undefined && p.lon !== undefined
      );

      L.marker([center.lat, center.lon], { icon: hotelIcon })
        .addTo(mapInstance)
        .bindPopup(`<b>${title || "Zona de alojamientos"}</b>`);

      for (const p of withCoords) {
        const price = p.pricePerNight
          ? ` ${formatEuro(p.pricePerNight)}/noche`
          : "";
        L.marker([p.lat, p.lon])
          .addTo(mapInstance)
          .bindPopup(`<b>${p.name}</b>${price}`);
      }

      if (withCoords.length > 1) {
        const bounds = L.latLngBounds(withCoords.map((p) => [p.lat, p.lon]));
        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!mapInstance) return;
          mapInstance.invalidateSize();
        });
      });
    };

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
    };
  }, [center, points, mounted, title]);

  if (!mounted) {
    return <div className="w-full h-56 rounded-xl2 bg-stone-100 animate-pulse" />;
  }

  return <div ref={mapRef} className="w-full h-56 rounded-xl2" style={{ zIndex: 0 }} />;
}