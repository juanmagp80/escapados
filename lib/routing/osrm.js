export async function getRoute(origin, destination, { geometry = true } = {}) {
  if (!origin || !destination) return null;
  const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const url = new URL(`https://router.project-osrm.org/route/v1/driving/${coords}`);
  url.searchParams.set("overview", geometry ? "full" : "false");
  url.searchParams.set("geometries", "geojson");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("route failed");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes || data.routes.length === 0)
    return null;

  const route = data.routes[0];
  return {
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry,
    coordinates: route.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || [],
  };
}