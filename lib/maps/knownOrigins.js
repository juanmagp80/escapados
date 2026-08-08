export const KNOWN_ORIGINS = {
  cártama: { name: "Cártama", lat: 36.7079, lon: -4.6278 },
  málaga: { name: "Málaga", lat: 36.7213, lon: -4.4214 },
  sevilla: { name: "Sevilla", lat: 37.3891, lon: -5.9845 },
  granada: { name: "Granada", lat: 37.1773, lon: -3.5986 },
  córdoba: { name: "Córdoba", lat: 37.8882, lon: -4.7794 },
  cadiz: { name: "Cádiz", lat: 36.5298, lon: -6.2929 },
  cádiz: { name: "Cádiz", lat: 36.5298, lon: -6.2929 },
  madrid: { name: "Madrid", lat: 40.4168, lon: -3.7038 },
  barcelona: { name: "Barcelona", lat: 41.3851, lon: 2.1734 },
  valencia: { name: "Valencia", lat: 39.4699, lon: -0.3763 },
  bilbao: { name: "Bilbao", lat: 43.263, lon: -2.935 },
  zaragoza: { name: "Zaragoza", lat: 41.6488, lon: -0.8891 },
};

export function knownOrigin(query) {
  if (!query) return null;
  return KNOWN_ORIGINS[query.trim().toLowerCase()] || null;
}
