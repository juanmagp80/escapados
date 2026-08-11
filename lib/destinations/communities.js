import { DESTINATIONS } from "./catalog";

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Busca primero en el catálogo (imagen/aeropuerto/región ya conocidos) y
// completa con datos propios si el lugar no está en el catálogo.
function town(name, extra = {}) {
  const inCatalog =
    DESTINATIONS.find((d) => d.name.toLowerCase() === name.toLowerCase()) ||
    null;
  return {
    name,
    slug: inCatalog?.slug || slugify(name),
    lat: inCatalog?.lat ?? extra.lat,
    lon: inCatalog?.lon ?? extra.lon,
    airport: inCatalog?.airport || extra.airport || null,
    region: inCatalog?.region || extra.region || "interior",
    image: inCatalog?.image || extra.image || null,
  };
}

export const COMMUNITIES = [
  {
    name: "Asturias",
    slug: "asturias",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Picos_de_Europa_-_Covadonga.jpg/960px-Picos_de_Europa_-_Covadonga.jpg",
    towns: [
      town("Oviedo", {
        lat: 43.3619,
        lon: -5.8448,
        airport: "OVD",
        region: "interior",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Sierra_Naranco_%28panorama%29%2C_Oviedo%2C_Espa%C3%B1a.jpg/960px-Sierra_Naranco_%28panorama%29%2C_Oviedo%2C_Espa%C3%B1a.jpg",
      }),
      town("Gijón", {
        lat: 43.5322,
        lon: -5.6611,
        airport: "OVD",
        region: "costa",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Gijon-playa_san_lorenzo_y_Cimadevilla.JPG/960px-Gijon-playa_san_lorenzo_y_Cimadevilla.JPG",
      }),
      town("Cangas de Onís", {
        lat: 43.3506,
        lon: -5.1464,
        airport: "OVD",
        region: "interior",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Plaza_del_Mercado._Cangas_de_On%C3%ADs.jpg/960px-Plaza_del_Mercado._Cangas_de_On%C3%ADs.jpg",
      }),
      town("Llanes", {
        lat: 43.4199,
        lon: -4.753,
        airport: "OVD",
        region: "costa",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/c/cc/Faro_llanes_asturias.jpg",
      }),
      town("Ribadesella", {
        lat: 43.4619,
        lon: -5.0575,
        airport: "OVD",
        region: "costa",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Ribadesella_%28Asturias%29_01.jpg/960px-Ribadesella_%28Asturias%29_01.jpg",
      }),
      town("Avilés", {
        lat: 43.5568,
        lon: -5.9252,
        airport: "OVD",
        region: "costa",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/5/59/Puerto_de_Avil%C3%A9s.jpg",
      }),
      town("Cudillero", {
        lat: 43.5632,
        lon: -6.1443,
        airport: "OVD",
        region: "costa",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Cudillero1.jpg/960px-Cudillero1.jpg",
      }),
      town("Villaviciosa", {
        lat: 43.4819,
        lon: -5.4427,
        airport: "OVD",
        region: "interior",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Villaviciosa_03_by-dpc.jpg/960px-Villaviciosa_03_by-dpc.jpg",
      }),
      town("Lastres", {
        lat: 43.5141,
        lon: -5.2689,
        airport: "OVD",
        region: "costa",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Lastres%2C_Asturias.jpg/960px-Lastres%2C_Asturias.jpg",
      }),
    ],
  },
  {
    name: "Andalucía",
    slug: "andalucia",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Sevilla_Cathedral_At_Night_%2825573985%29.jpeg/960px-Sevilla_Cathedral_At_Night_%2825573985%29.jpeg",
    towns: [
      town("Sevilla"),
      town("Granada"),
      town("Córdoba"),
      town("Cádiz"),
      town("Málaga", { lat: 36.7213, lon: -4.4214, airport: "AGP", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Malaga_2023.jpg/960px-Malaga_2023.jpg" }),
      town("Ronda"),
      town("Nerja"),
      town("Marbella"),
      town("Tarifa"),
      town("Almería"),
      town("Úbeda"),
    ],
  },
  {
    name: "Cataluña",
    slug: "cataluna",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Gaudi_Park_Barcelona_%28186293145%29.jpeg/960px-Gaudi_Park_Barcelona_%28186293145%29.jpeg",
    towns: [
      town("Barcelona"),
      town("Girona", { lat: 41.9794, lon: 2.8214, airport: "GRO", region: "interior", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Pont_Eiffel_and_river_Onyar_in_Girona%2C_Catalonia%2C_Spain.JPG/960px-Pont_Eiffel_and_river_Onyar_in_Girona%2C_Catalonia%2C_Spain.JPG" }),
      town("Tarragona", { lat: 41.1189, lon: 1.2445, airport: "BCN", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Amphitheatre_of_Tarragona_01.jpg/960px-Amphitheatre_of_Tarragona_01.jpg" }),
      town("Sitges", { lat: 41.2348, lon: 1.8116, airport: "BCN", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Sitges%2C_Spain_-_50070080061.jpg/960px-Sitges%2C_Spain_-_50070080061.jpg" }),
      town("Cadaqués", { lat: 42.2883, lon: 3.2749, airport: "GRO", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Cadaqu%C3%A9s_BW_2019-10-08_11-05-39.jpg/960px-Cadaqu%C3%A9s_BW_2019-10-08_11-05-39.jpg" }),
      town("Tossa de Mar", { lat: 41.7206, lon: 2.9355, airport: "GRO", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tossa_de_Mar_-_49760880158.jpg/960px-Tossa_de_Mar_-_49760880158.jpg" }),
    ],
  },
  {
    name: "Galicia",
    slug: "galicia",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Catedral_de_Santiago_de_Compostela%2C_agosto_2018_19.jpg/960px-Catedral_de_Santiago_de_Compostela%2C_agosto_2018_19.jpg",
    towns: [
      town("Santiago de Compostela"),
      town("A Coruña", { lat: 43.3623, lon: -8.4115, airport: "LCG", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Torre_de_H%C3%A9rcules%2C_La_Coru%C3%B1a%2C_Espa%C3%B1a%2C_2015-09-24%2C_DD_12-15_PAN.JPG/960px-Torre_de_H%C3%A9rcules%2C_La_Coru%C3%B1a%2C_Espa%C3%B1a%2C_2015-09-24%2C_DD_12-15_PAN.JPG" }),
      town("Vigo", { lat: 42.2406, lon: -8.7207, airport: "VGO", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/2018_Vigo_Galiza._Galicia-1.jpg/960px-2018_Vigo_Galiza._Galicia-1.jpg" }),
      town("Lugo", { lat: 43.012, lon: -7.5569, airport: "SCQ", region: "interior", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lugo%2C_Galicia_07.jpg/960px-Lugo%2C_Galicia_07.jpg" }),
      town("Ourense", { lat: 42.3358, lon: -7.8638, airport: "SCQ", region: "interior", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Termas_de_Outariz%2C_Canedo%2C_Ourense.jpg/960px-Termas_de_Outariz%2C_Canedo%2C_Ourense.jpg" }),
      town("Pontevedra", { lat: 42.4306, lon: -8.6444, airport: "VGO", region: "interior", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Pontevedra-Vista_parcial_%288663003044%29.jpg/960px-Pontevedra-Vista_parcial_%288663003044%29.jpg" }),
    ],
  },
  {
    name: "País Vasco",
    slug: "pais-vasco",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Curved_bilbao_skyscraper_%28Unsplash%29.jpg/960px-Curved_bilbao_skyscraper_%28Unsplash%29.jpg",
    towns: [
      town("Bilbao"),
      town("San Sebastián"),
      town("Vitoria", { lat: 42.8466, lon: -2.6716, airport: "VIT", region: "interior", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Catedral_de_Santa_Mar%C3%ADa%2C_Vitoria-Gasteiz.jpg/960px-Catedral_de_Santa_Mar%C3%ADa%2C_Vitoria-Gasteiz.jpg" }),
      town("Getxo", { lat: 43.3501, lon: -3.0107, airport: "BIO", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Getxo_Ilunabarrean.jpg/960px-Getxo_Ilunabarrean.jpg" }),
      town("Zarautz", { lat: 43.2846, lon: -2.1728, airport: "EAS", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/E4781-Zarautz-beach-Raton.JPG/960px-E4781-Zarautz-beach-Raton.JPG" }),
      town("Mundaka", { lat: 43.4061, lon: -2.6992, airport: "BIO", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Mundaka.JPG/960px-Mundaka.JPG" }),
    ],
  },
  {
    name: "Cantabria",
    slug: "cantabria",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Palacio_de_la_Magdalena_%28Santander%29.jpg/960px-Palacio_de_la_Magdalena_%28Santander%29.jpg",
    towns: [
      town("Santander", { lat: 43.4623, lon: -3.81, airport: "SDR", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Muelle_de_Albareda%2C_Santander.jpg/960px-Muelle_de_Albareda%2C_Santander.jpg" }),
      town("Comillas", { lat: 43.3854, lon: -4.2888, airport: "SDR", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Vista_de_Comillas.jpg/960px-Vista_de_Comillas.jpg" }),
      town("Castro Urdiales", { lat: 43.382, lon: -3.215, airport: "BIO", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Castro_Urdiales_night.jpg/960px-Castro_Urdiales_night.jpg" }),
      town("Laredo", { lat: 43.4079, lon: -3.4169, airport: "SDR", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/7/75/Laredo.jpg" }),
      town("Potes", { lat: 43.1534, lon: -4.6225, airport: "SDR", region: "interior", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Potes%2C_Cantabria_08.jpg/960px-Potes%2C_Cantabria_08.jpg" }),
      town("San Vicente de la Barquera", { lat: 43.3867, lon: -4.4021, airport: "SDR", region: "costa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/J23_115_San_Vicente_de_la_Barquera%2C_Hafen.jpg/960px-J23_115_San_Vicente_de_la_Barquera%2C_Hafen.jpg" }),
    ],
  },
];

export function findCommunity(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return (
    COMMUNITIES.find(
      (c) => c.name.toLowerCase() === n || c.slug === slugify(n)
    ) || null
  );
}

export function communityTowns(community, originQuery) {
  if (!community) return [];
  return community.towns.filter(
    (t) => t.name.toLowerCase() !== (originQuery || "").toLowerCase()
  );
}