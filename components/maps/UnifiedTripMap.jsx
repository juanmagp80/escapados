"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = {
    origin: "#10b981",
    hotel: "#f97316",
    restaurant: "#ef4444",
    attraction: "#8b5cf6",
    fuel: "#0ea5e9",
    day: [
        "#f97316",
        "#8b5cf6",
        "#0ea5e9",
        "#10b981",
        "#ef4444",
        "#eab308",
        "#ec4899",
        "#14b8a6",
    ],
};

function iconHtml(color, label) {
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
      <div style="background:${color};border:2px solid #fff;border-radius:9999px;width:16px;height:16px;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:9px;line-height:1">${label}</div>
    </div>`;
}

// Mapa unificado: ruta + hoteles + restaurantes + atracciones + gasolineras,
// con capas agrupadas por día del itinerario y por categoría.
export default function UnifiedTripMap({
    origin,
    destination,
    transport,
    route,
    days = [],
    hotels = [],
    restaurants = [],
    attractions = [],
    fuelStations = [],
    height = "h-96",
}) {
    const mapRef = useRef(null);
    const [mounted, setMounted] = useState(false);
    const [visibleLayers, setVisibleLayers] = useState({
        route: true,
        hotels: true,
        restaurants: true,
        attractions: true,
        fuel: true,
    });

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
                iconRetinaUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const center = destination?.lat != null
                ? [destination.lat, destination.lon]
                : origin?.lat != null
                    ? [origin.lat, origin.lon]
                    : [40.4168, -3.7038];

            mapInstance = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: false,
            }).setView(center, transport === "plane" ? 5 : 10);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 18,
                attribution: "&copy; OpenStreetMap",
            }).addTo(mapInstance);

            const allPoints = [];
            const addMarker = (lat, lon, { icon, popup, group }) => {
                if (lat == null || lon == null) return;
                allPoints.push({ lat, lon, group });
                const m = L.marker([lat, lon], { icon }).addTo(mapInstance);
                if (popup) m.bindPopup(popup);
                return m;
            };

            // Ruta
            if (route && route.coordinates && route.coordinates.length > 1) {
                L.polyline(route.coordinates, {
                    color: "#ea580c",
                    weight: 4,
                    opacity: 0.85,
                    dashArray: transport === "plane" ? "10, 10" : undefined,
                }).addTo(mapInstance);
            }
            if (origin?.lat != null && origin?.lon != null) {
                addMarker(origin.lat, origin.lon, {
                    icon: L.divIcon({
                        html: iconHtml(COLORS.origin, "A"),
                        className: "",
                        iconSize: [18, 18],
                        iconAnchor: [9, 9],
                    }),
                    popup: `<b>Origen:</b> ${origin.name || ""}`,
                    group: "route",
                });
            }

            // Actividades del itinerario agrupadas por día
            days.forEach((d, di) => {
                const color = COLORS.day[di % COLORS.day.length];
                (d.activities || []).forEach((a, ai) => {
                    if (a.lat == null || a.lon == null) return;
                    const label = String(di + 1);
                    addMarker(a.lat, a.lon, {
                        icon: L.divIcon({
                            html: iconHtml(color, label),
                            className: "",
                            iconSize: [18, 18],
                            iconAnchor: [9, 9],
                        }),
                        popup: `<b>Día ${d.day || di + 1} · ${a.name}</b><br/>${a.description || ""
                            }${a.time ? `<br/>🕐 ${a.time}` : ""}`,
                        group: "attractions",
                    });
                });
            });

            // Hoteles
            (hotels || []).forEach((h) => {
                if (h.lat == null || h.lon == null) return;
                const price = h.pricePerNight ? ` · ${h.pricePerNight}€/noche` : "";
                addMarker(h.lat, h.lon, {
                    icon: L.divIcon({
                        html: iconHtml(COLORS.hotel, "H"),
                        className: "",
                        iconSize: [18, 18],
                        iconAnchor: [9, 9],
                    }),
                    popup: `<b>🏨 ${h.name}</b>${price}`,
                    group: "hotels",
                });
            });

            // Restaurantes
            (restaurants || []).forEach((r) => {
                if (r.lat == null || r.lon == null) return;
                addMarker(r.lat, r.lon, {
                    icon: L.divIcon({
                        html: iconHtml(COLORS.restaurant, "R"),
                        className: "",
                        iconSize: [18, 18],
                        iconAnchor: [9, 9],
                    }),
                    popup: `<b>🍽️ ${r.name || r.title || ""}</b>`,
                    group: "restaurants",
                });
            });

            // Otras atracciones
            (attractions || []).forEach((a) => {
                if (a.lat == null || a.lon == null) return;
                addMarker(a.lat, a.lon, {
                    icon: L.divIcon({
                        html: iconHtml(COLORS.attraction, "★"),
                        className: "",
                        iconSize: [18, 18],
                        iconAnchor: [9, 9],
                    }),
                    popup: `<b>🏛️ ${a.name || a.title || ""}</b>`,
                    group: "attractions",
                });
            });

            // Gasolineras / puntos de carga
            (fuelStations || []).forEach((f) => {
                if (f.lat == null || f.lon == null) return;
                addMarker(f.lat, f.lon, {
                    icon: L.divIcon({
                        html: iconHtml(COLORS.fuel, "⛽"),
                        className: "",
                        iconSize: [18, 18],
                        iconAnchor: [9, 9],
                    }),
                    popup: `<b>⛽ ${f.name || "Gasolinera"}</b>`,
                    group: "fuel",
                });
            });

            if (allPoints.length > 1) {
                const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lon]));
                if (bounds.isValid()) {
                    mapInstance.fitBounds(bounds, {
                        padding: [40, 40],
                        maxZoom: transport === "plane" ? 6 : 13,
                    });
                }
            }

            rafId = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!mapInstance) return;
                    mapInstance.invalidateSize();
                });
            });
        };

        initMap();

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            if (mapInstance) {
                mapInstance.remove();
                mapInstance = null;
            }
        };
    }, [origin, destination, transport, route, days, hotels, restaurants, attractions, fuelStations, mounted]);

    if (!mounted) {
        return <div className={`w-full ${height} rounded-xl2 bg-stone-100 animate-pulse`} />;
    }

    const layerToggles = [
        { key: "route", label: "Ruta" },
        { key: "hotels", label: "Hoteles" },
        { key: "restaurants", label: "Restaurantes" },
        { key: "attractions", label: "Atracciones" },
        { key: "fuel", label: "Gasolineras" },
    ];

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Capas del mapa">
                {layerToggles.map((l) => (
                    <button
                        key={l.key}
                        onClick={() =>
                            setVisibleLayers((v) => ({ ...v, [l.key]: !v[l.key] }))
                        }
                        aria-pressed={visibleLayers[l.key]}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${visibleLayers[l.key]
                                ? "bg-brand-500 text-white"
                                : "bg-stone-100 text-stone-500"
                            }`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>
            <div ref={mapRef} className={`w-full ${height} rounded-xl2`} style={{ zIndex: 0 }} />
        </div>
    );
}