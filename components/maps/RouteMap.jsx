"use client";

import { useEffect, useRef, useState } from "react";

export default function RouteMap({ origin, destination, transport, route }) {
  const mapRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    let mapInstance = null;
    let rafId = null;

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
      }).setView(
        [
          (origin.lat + destination.lat) / 2,
          (origin.lon + destination.lon) / 2,
        ],
        transport === "plane" ? 5 : 8
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapInstance);

      const originIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const destIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      L.marker([origin.lat, origin.lon], { icon: originIcon })
        .addTo(mapInstance)
        .bindPopup(`<b>Origen:</b> ${origin.name}`);

      L.marker([destination.lat, destination.lon], { icon: destIcon })
        .addTo(mapInstance)
        .bindPopup(`<b>Destino:</b> ${destination.name}`);

      const fitAll = () => {
        let bounds;
        if (route && route.coordinates && route.coordinates.length > 1) {
          const line = L.polyline(route.coordinates, {
            color: "#ea580c",
            weight: 4,
            opacity: 0.8,
            dashArray: transport === "plane" ? "10, 10" : undefined,
          }).addTo(mapInstance);
          bounds = line.getBounds();
        } else {
          bounds = L.latLngBounds([
            [origin.lat, origin.lon],
            [destination.lat, destination.lon],
          ]);
        }
        bounds = bounds.isValid()
          ? bounds
          : L.latLngBounds([
              [origin.lat, origin.lon],
              [destination.lat, destination.lon],
            ]);
        mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: transport === "plane" ? 6 : 10 });
      };

      fitAll();

      // En rutas largas el contenedor aún no ha renderizado con su tamaño
      // definitivo; invalidar y reajustar tras el layout evita mapas en blanco.
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!mapInstance) return;
          mapInstance.invalidateSize();
          fitAll();
        });
      });
      rafId = raf;
    };

    initMap();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
    };
  }, [origin, destination, transport, route, mounted]);

  if (!mounted) {
    return <div className="w-full h-72 rounded-xl2 bg-stone-100 animate-pulse" />;
  }

  return <div ref={mapRef} className="w-full h-72 rounded-xl2" style={{ zIndex: 0 }} />;
}