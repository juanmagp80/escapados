export const AIRPORTS = {
  málaga: "AGP",
  cártama: "AGP",
  sevilla: "SVQ",
  granada: "GRX",
  córdoba: "ODB",
  cadiz: "SVQ",
  cádiz: "SVQ",
  jerez: "XRY",
  ronda: "AGP",
  nerja: "AGP",
  frigiliana: "AGP",
  almería: "LEI",
  jaén: "GRX",
  madrid: "MAD",
  barcelona: "BCN",
  valencia: "VLC",
  bilbao: "BIO",
  zaragoza: "ZAZ",
  "san sebastián": "EAS",
  "la coruña": "LCG",
  vigo: "VGO",
  palma: "PMI",
  tenerife: "TFS",
  "gran canaria": "LPA",
  lanzarote: "ACE",
  fuerteventura: "FUE",
};

export function airportFor(name) {
  if (!name) return null;
  return AIRPORTS[name.trim().toLowerCase()] || null;
}

export function originAirport(origin) {
  return airportFor(origin) || "MAD";
}
