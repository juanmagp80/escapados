const WM = {
  "Granada": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg/960px-Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg",
  "Córdoba": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Mosque_Cordoba_edited.jpg",
  "Sevilla": "https://upload.wikimedia.org/wikipedia/commons/c/cb/Catedral_de_Sevilla_fachada_este_2.jpg",
  "Cádiz": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Catedral_de_C%C3%A1diz%2C_Espa%C3%B1a%2C_2015-12-08%2C_DD_56.JPG/960px-Catedral_de_C%C3%A1diz%2C_Espa%C3%B1a%2C_2015-12-08%2C_DD_56.JPG",
  "Ronda": "https://upload.wikimedia.org/wikipedia/commons/9/98/%22Puente_Nuevo%22_de_Ronda.jpg",
  "Nerja": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Nerja%2C_house_on_the_street_%22Calle_Axarqu%C3%ADa%22.jpg/960px-Nerja%2C_house_on_the_street_%22Calle_Axarqu%C3%ADa%22.jpg",
  "Frigiliana": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Espagne_Frigiliana_-_panoramio.jpg/960px-Espagne_Frigiliana_-_panoramio.jpg",
  "Almería": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Alcazaba_1%2C_Almeria%2C_Spain.jpg/960px-Alcazaba_1%2C_Almeria%2C_Spain.jpg",
  "Jaén": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Jaen_Cathedral_2023_-_west_fa%C3%A7ade_1.jpg/960px-Jaen_Cathedral_2023_-_west_fa%C3%A7ade_1.jpg",
  "Úbeda": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Iglesia_del_salvador_ubeda_001.jpg",
  "Baeza": "https://upload.wikimedia.org/wikipedia/commons/5/52/Fuente_de_baeza_-_panoramio.jpg",
  "Antequera": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Antequera_Alcazaba.jpg/960px-Antequera_Alcazaba.jpg",
  "Motril": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Puerto_de_Motril_%2820095947769%29.jpg/960px-Puerto_de_Motril_%2820095947769%29.jpg",
  "Conil": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Cala_del_Frailecillo%2C_Conil_de_la_Frontera_-_panoramio.jpg/960px-Cala_del_Frailecillo%2C_Conil_de_la_Frontera_-_panoramio.jpg",
  "Vejer": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Vejer_de_la_Frontera_-_panoramio.jpg/960px-Vejer_de_la_Frontera_-_panoramio.jpg",
  "Tarifa": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Tarifa_-_panoramio_%282%29.jpg/960px-Tarifa_-_panoramio_%282%29.jpg",
  "Marbella": "https://upload.wikimedia.org/wikipedia/commons/b/b9/Marbella_old_town_%289%29.jpg",
  "Estepona": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Callejeando_por_Estepona_%2833582239882%29.jpg/960px-Callejeando_por_Estepona_%2833582239882%29.jpg",
  "Mijas": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Flemenco_dancers_mijas_-_panoramio.jpg/960px-Flemenco_dancers_mijas_-_panoramio.jpg",
  "Sierra Nevada": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Sierra_Nevada_-_panoramio_%283%29.jpg/960px-Sierra_Nevada_-_panoramio_%283%29.jpg",
  "Guadix": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Alcazaba_de_Guad%C3%ADx.jpg/960px-Alcazaba_de_Guad%C3%ADx.jpg",
  "Priego": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Priego_de_C%C3%B3rdoba_plaza_de_San_Antonio_-_Barrio_de_la_Villa.jpg/960px-Priego_de_C%C3%B3rdoba_plaza_de_San_Antonio_-_Barrio_de_la_Villa.jpg",
  "Lucena": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Rio_Lucena_-_panoramio.jpg",
  "Osuna": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Osuna_view.jpg/960px-Osuna_view.jpg",
  "Écija": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/%C3%89cija_%2816163977653%29.jpg/960px-%C3%89cija_%2816163977653%29.jpg",
  "Madrid": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Puerta_de_Alcal%C3%A1_2025.jpg/960px-Puerta_de_Alcal%C3%A1_2025.jpg",
  "Barcelona": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Sagrada_Familia_01.jpg/960px-Sagrada_Familia_01.jpg",
  "Valencia": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ciudad_de_las_Artes_y_las_Ciencias.jpg/960px-Ciudad_de_las_Artes_y_las_Ciencias.jpg",
  "Bilbao": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Museo_Guggenheim%2C_Bilbao_%2831273245344%29.jpg/960px-Museo_Guggenheim%2C_Bilbao_%2831273245344%29.jpg",
  "Zaragoza": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Zaragoza_-_Basilica_de_Nuestra_Se%C3%B1ora_del_Pilar_01.jpg/960px-Zaragoza_-_Basilica_de_Nuestra_Se%C3%B1ora_del_Pilar_01.jpg",
  "San Sebastián": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Haizearen_orrazia_0006.jpg",
  "Santiago de Compostela": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Santiago_cathedral_2021.jpg",
  "Lisboa": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Bel%C3%A9m_Tower_in_Lisbon%2C_Portugal.jpg",
  "Porto": "https://upload.wikimedia.org/wikipedia/commons/d/d1/Torre_de_los_Cl%C3%A9rigos%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_04.JPG",
  "Niza": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Avenue_Jean_Medecin_-_panoramio.jpg/960px-Avenue_Jean_Medecin_-_panoramio.jpg",
  "Roma": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/960px-Colosseo_2020.jpg",
  "París": "https://upload.wikimedia.org/wikipedia/commons/d/d2/Eiffelturm.JPG",
  "Londres": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Clock_Tower_-_Palace_of_Westminster%2C_London_-_September_2006.jpg/960px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_September_2006.jpg",
  "Ámsterdam": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Rijksmuseum_Amsterdam_ca_1895.jpg/960px-Rijksmuseum_Amsterdam_ca_1895.jpg",
  "Berlín": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/960px-Brandenburger_Tor_abends.jpg",
  "Viena": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Stephansdom_Wien.jpg/960px-Stephansdom_Wien.jpg",
  "Budapest": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Parliament_Building_Budapest_Hungary.jpg/960px-Parliament_Building_Budapest_Hungary.jpg",
  "Praga": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Karl%C5%AFv_most_z_Kampy.JPG/960px-Karl%C5%AFv_most_z_Kampy.JPG",
  "Dublín": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Trinity_College_Dublin_Campanile.jpg",
  "Bruselas": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Grand-Place%2C_Brussels_-_panorama%2C_June_2018.jpg/960px-Grand-Place%2C_Brussels_-_panorama%2C_June_2018.jpg",
  "Atenas": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Parthenon_in_Athens.jpg/960px-The_Parthenon_in_Athens.jpg",
  "Estambul": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hagia_Sophia_Mars_2013.jpg/960px-Hagia_Sophia_Mars_2013.jpg",
  "Milán": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Duomo_di_Milano.jpg/960px-Duomo_di_Milano.jpg",
  "Varsovia": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Warsaw_Palace_of_Culture_and_Science.jpg",
  "Copenhague": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/The_Little_Mermaid_home.jpg/960px-The_Little_Mermaid_home.jpg",
  "Estocolmo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Skeppsbrokajen_Gamla_Stan_from_Skeppsholmen_Stockholm_2016_01.jpg/960px-Skeppsbrokajen_Gamla_Stan_from_Skeppsholmen_Stockholm_2016_01.jpg",
  "Múnich": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Marienplatz%2C_Munich.jpg/960px-Marienplatz%2C_Munich.jpg",
  "Zúrich": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Grossm%C3%BCnster_Z%C3%BCrich.jpg/960px-Grossm%C3%BCnster_Z%C3%BCrich.jpg",
  "Edimburgo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Edinburgh_Castle_from_the_south_east.JPG/960px-Edinburgh_Castle_from_the_south_east.JPG",
  "Mánchester": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Manchester_Town_Hall_from_Lloyd_Street.jpg/960px-Manchester_Town_Hall_from_Lloyd_Street.jpg",
  "Nueva York": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/960px-Statue_of_Liberty_7.jpg",
};

const I = (k) => WM[k] || null;

export const DESTINATIONS = [
  { name: "Granada", slug: "granada", lat: 37.1773, lon: -3.5986, airport: "GRX", region: "interior", image: I("Granada") },
  { name: "Córdoba", slug: "cordoba", lat: 37.8882, lon: -4.7794, airport: "ODB", region: "interior", image: I("Córdoba") },
  { name: "Sevilla", slug: "sevilla", lat: 37.3891, lon: -5.9845, airport: "SVQ", region: "interior", image: I("Sevilla") },
  { name: "Cádiz", slug: "cadiz", lat: 36.5298, lon: -6.2929, airport: "SVQ", region: "costa", image: I("Cádiz") },
  { name: "Ronda", slug: "ronda", lat: 36.7408, lon: -5.1673, airport: "AGP", region: "interior", image: I("Ronda") },
  { name: "Nerja", slug: "nerja", lat: 36.7519, lon: -3.8748, airport: "AGP", region: "costa", image: I("Nerja") },
  { name: "Frigiliana", slug: "frigiliana", lat: 36.7917, lon: -3.8946, airport: "AGP", region: "costa", image: I("Frigiliana") },
  { name: "Almería", slug: "almeria", lat: 36.834, lon: -2.4637, airport: "LEI", region: "costa", image: I("Almería") },
  { name: "Jaén", slug: "jaen", lat: 37.7692, lon: -3.7907, airport: "GRX", region: "interior", image: I("Jaén") },
  { name: "Úbeda", slug: "ubeda", lat: 38.0093, lon: -3.3704, airport: "GRX", region: "interior", image: I("Úbeda") },
  { name: "Baeza", slug: "baeza", lat: 37.9944, lon: -3.4705, airport: "GRX", region: "interior", image: I("Baeza") },
  { name: "Antequera", slug: "antequera", lat: 37.0191, lon: -4.5605, airport: "AGP", region: "interior", image: I("Antequera") },
  { name: "Motril", slug: "motril", lat: 36.7508, lon: -3.5175, airport: "GRX", region: "costa", image: I("Motril") },
  { name: "Conil de la Frontera", slug: "conil-de-la-frontera", lat: 36.2775, lon: -6.1494, airport: "SVQ", region: "costa", image: I("Conil") },
  { name: "Vejer de la Frontera", slug: "vejer-de-la-frontera", lat: 36.311, lon: -6.0321, airport: "SVQ", region: "costa", image: I("Vejer") },
  { name: "Tarifa", slug: "tarifa", lat: 36.0136, lon: -5.6013, airport: "SVQ", region: "costa", image: I("Tarifa") },
  { name: "Marbella", slug: "marbella", lat: 36.5102, lon: -4.8823, airport: "AGP", region: "costa", image: I("Marbella") },
  { name: "Estepona", slug: "estepona", lat: 36.4264, lon: -5.1457, airport: "AGP", region: "costa", image: I("Estepona") },
  { name: "Mijas", slug: "mijas", lat: 36.5955, lon: -4.6373, airport: "AGP", region: "costa", image: I("Mijas") },
  { name: "Sierra Nevada", slug: "sierra-nevada", lat: 37.0999, lon: -3.1314, airport: "GRX", region: "interior", image: I("Sierra Nevada") },
  { name: "Guadix", slug: "guadix", lat: 37.2994, lon: -3.1391, airport: "GRX", region: "interior", image: I("Guadix") },
  { name: "Priego de Córdoba", slug: "priego-de-cordoba", lat: 37.4381, lon: -4.1958, airport: "GRX", region: "interior", image: I("Priego") },
  { name: "Lucena", slug: "lucena", lat: 37.4087, lon: -4.4852, airport: "AGP", region: "interior", image: I("Lucena") },
  { name: "Osuna", slug: "osuna", lat: 37.2379, lon: -5.1113, airport: "SVQ", region: "interior", image: I("Osuna") },
  { name: "Écija", slug: "ecija", lat: 37.5423, lon: -5.0814, airport: "SVQ", region: "interior", image: I("Écija") },
  { name: "Madrid", slug: "madrid", lat: 40.4168, lon: -3.7038, airport: "MAD", region: "interior", image: I("Madrid") },
  { name: "Barcelona", slug: "barcelona", lat: 41.3851, lon: 2.1734, airport: "BCN", region: "costa", image: I("Barcelona") },
  { name: "Valencia", slug: "valencia", lat: 39.4699, lon: -0.3763, airport: "VLC", region: "costa", image: I("Valencia") },
  { name: "Bilbao", slug: "bilbao", lat: 43.263, lon: -2.935, airport: "BIO", region: "costa", image: I("Bilbao") },
  { name: "Zaragoza", slug: "zaragoza", lat: 41.6488, lon: -0.8892, airport: "ZAZ", region: "interior", image: I("Zaragoza") },
  { name: "San Sebastián", slug: "san-sebastian", lat: 43.3183, lon: -1.9812, airport: "EAS", region: "costa", image: I("San Sebastián") },
  { name: "Santiago de Compostela", slug: "santiago-de-compostela", lat: 42.8782, lon: -8.5448, airport: "SCQ", region: "costa", image: I("Santiago de Compostela") },
  { name: "Lisboa", slug: "lisboa", lat: 38.7223, lon: -9.1393, airport: "LIS", region: "costa", image: I("Lisboa") },
  { name: "Porto", slug: "porto", lat: 41.1579, lon: -8.6291, airport: "OPO", region: "costa", image: I("Porto") },
  { name: "Niza", slug: "niza", lat: 43.7102, lon: 7.262, airport: "NCE", region: "costa", image: I("Niza") },
  { name: "Roma", slug: "roma", lat: 41.9028, lon: 12.4964, airport: "FCO", region: "interior", image: I("Roma") },
  { name: "París", slug: "paris", lat: 48.8566, lon: 2.3522, airport: "CDG", region: "interior", image: I("París") },
  { name: "Londres", slug: "londres", lat: 51.5074, lon: -0.1278, airport: "LON", region: "interior", image: I("Londres") },
  // Europa y mundo: siempre disponibles en modo avión (flightDestinations los
  // fusiona aunque esa fecha aún no tenga vuelo barato cacheado).
  { name: "Ámsterdam", slug: "amsterdam", lat: 52.3676, lon: 4.9041, airport: "AMS", region: "interior", image: I("Ámsterdam") },
  { name: "Berlín", slug: "berlin", lat: 52.52, lon: 13.405, airport: "BER", region: "interior", image: I("Berlín") },
  { name: "Viena", slug: "viena", lat: 48.2082, lon: 16.3738, airport: "VIE", region: "interior", image: I("Viena") },
  { name: "Budapest", slug: "budapest", lat: 47.4979, lon: 19.0402, airport: "BUD", region: "interior", image: I("Budapest") },
  { name: "Praga", slug: "praga", lat: 50.0755, lon: 14.4378, airport: "PRG", region: "interior", image: I("Praga") },
  { name: "Dublín", slug: "dublin", lat: 53.3498, lon: -6.2603, airport: "DUB", region: "interior", image: I("Dublín") },
  { name: "Bruselas", slug: "bruselas", lat: 50.8503, lon: 4.3517, airport: "BRU", region: "interior", image: I("Bruselas") },
  { name: "Atenas", slug: "atenas", lat: 37.9838, lon: 23.7275, airport: "ATH", region: "costa", image: I("Atenas") },
  { name: "Estambul", slug: "estambul", lat: 41.0082, lon: 28.9784, airport: "IST", region: "interior", image: I("Estambul") },
  { name: "Milán", slug: "milan", lat: 45.4642, lon: 9.19, airport: "MXP", region: "interior", image: I("Milán") },
  { name: "Varsovia", slug: "varsovia", lat: 52.2297, lon: 21.0122, airport: "WAW", region: "interior", image: I("Varsovia") },
  { name: "Copenhague", slug: "copenhague", lat: 55.6761, lon: 12.5683, airport: "CPH", region: "interior", image: I("Copenhague") },
  { name: "Estocolmo", slug: "estocolmo", lat: 59.3293, lon: 18.0686, airport: "STO", region: "interior", image: I("Estocolmo") },
  { name: "Múnich", slug: "munich", lat: 48.1351, lon: 11.582, airport: "MUC", region: "interior", image: I("Múnich") },
  { name: "Zúrich", slug: "zurich", lat: 47.3769, lon: 8.5417, airport: "ZRH", region: "interior", image: I("Zúrich") },
  { name: "Edimburgo", slug: "edimburgo", lat: 55.9533, lon: -3.1883, airport: "EDI", region: "interior", image: I("Edimburgo") },
  { name: "Mánchester", slug: "manchester", lat: 53.4808, lon: -2.2426, airport: "MAN", region: "interior", image: I("Mánchester") },
  { name: "Nueva York", slug: "nueva-york", lat: 40.7128, lon: -74.006, airport: "JFK", region: "interior", image: I("Nueva York") },
];

export function candidateDestinations(originQuery, { region, maxKm, originLat, originLon } = {}) {
  let list = DESTINATIONS.filter((d) => d.name.toLowerCase() !== (originQuery || "").toLowerCase());
  if (region === "costa" || region === "interior") { list = list.filter((d) => d.region === region); }
  if (typeof maxKm === "number" && originLat != null && originLon != null) { list = list.filter((d) => haversine(originLat, originLon, d.lat, d.lon) <= maxKm); }
  return list;
}

export function findDestination(name) {
  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return (
    DESTINATIONS.find((d) => norm(d.name) === norm(name)) || null
  );
}

function haversine(lat1, lon1, lat2, lon2) { const R = 6371; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLon = ((lon2 - lon1) * Math.PI) / 180; const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2; return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); }
