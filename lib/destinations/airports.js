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
  // Destinos internacionales habituales (write-the-destination).
  budapest: "BUD",
  viena: "VIE",
  "venecia": "VCE",
  "milán": "MXP",
  milan: "MXP",
  florencia: "FLR",
  praga: "PRG",
  berlín: "BER",
  berlin: "BER",
  amsterdam: "AMS",
  bruselas: "BRU",
  dublín: "DUB",
  atenas: "ATH",
  estambul: "IST",
  varsovia: "WAW",
  cracovia: "KRK",
  zagreb: "ZAG",
  "nueva york": "JFK",
  "nueva-york": "JFK",
  londres: "LHR",
  parís: "CDG",
  roma: "FCO",
  lisboa: "LIS",
  porto: "OPO",
  oporto: "OPO",
  niza: "NCE",
};

export function airportFor(name) {
  if (!name) return null;
  return AIRPORTS[name.trim().toLowerCase()] || null;
}

export function originAirport(origin) {
  return airportFor(origin) || "MAD";
}
