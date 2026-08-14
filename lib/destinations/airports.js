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
  // LON = código de metro de Londres: agrupa LHR/LGW/STN/LTN/SEN e incluye
  // las tarifas baratas directas (Ryanair/easyJet). LHR fijo infla el precio
  // (1 escala, ~2x), mientras Aviasales cotiza siempre el metro LON.
  londres: "LON",
  parís: "CDG",
  roma: "FCO",
  lisboa: "LIS",
  porto: "OPO",
  oporto: "OPO",
  niza: "NCE",
  // Islas y destinos dinámicos habituales (write-the-destination).
  ibiza: "IBZ",
  mallorca: "PMI",
  menorca: "MAH",
  tenerife: "TFS",
  "gran canaria": "LPA",
  lanzarote: "ACE",
  fuerteventura: "FUE",
  "la palma": "SPC",
  chisinau: "RMO",
  erevan: "EVN",
  tiflis: "TBS",
  batumi: "BUS",
  kutaisi: "KUT",
  dortmund: "DTM",
  "estambul": "IST",
};

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const AIRPORT_LOOKUP = Object.entries(AIRPORTS).reduce((acc, [k, v]) => {
  acc[norm(k)] = v;
  return acc;
}, {});

export function airportFor(name) {
  if (!name) return null;
  return AIRPORT_LOOKUP[norm(name)] || null;
}

export function originAirport(origin) {
  return airportFor(origin) || "MAD";
}
