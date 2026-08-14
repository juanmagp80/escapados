// Monumentos emblemáticos por ciudad. Se usan para mostrar imágenes
// representativas de cada destino (un monumento icónico) en lugar de una
// foto genérica de la ciudad.
//
// Cada entrada tiene:
//   - article: nombre del artículo de Wikipedia (español) del monumento,
//     usado como fallback para resolver la imagen dinámicamente.
//   - image: URL directa de Wikimedia Commons (960px) ya verificada, para
//     evitar llamadas al API en runtime cuando es posible.
export const LANDMARKS = {
    // Andalucía
    "Granada": {
        article: "Alhambra",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg/960px-Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg",
    },
    "Córdoba": {
        article: "Mezquita-catedral de Córdoba",
        image: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Mosque_Cordoba_edited.jpg",
    },
    "Sevilla": {
        article: "Catedral de Sevilla",
        image: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Catedral_de_Sevilla_fachada_este_2.jpg",
    },
    "Cádiz": {
        article: "Catedral de Cádiz",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Catedral_de_C%C3%A1diz%2C_Espa%C3%B1a%2C_2015-12-08%2C_DD_56.JPG/960px-Catedral_de_C%C3%A1diz%2C_Espa%C3%B1a%2C_2015-12-08%2C_DD_56.JPG",
    },
    "Ronda": {
        article: "Puente Nuevo (Ronda)",
        image: "https://upload.wikimedia.org/wikipedia/commons/9/98/%22Puente_Nuevo%22_de_Ronda.jpg",
    },
    "Nerja": { article: "Balcón de Europa" },
    "Frigiliana": { article: "Frigiliana" },
    "Almería": {
        article: "Alcazaba de Almería",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Alcazaba_1%2C_Almeria%2C_Spain.jpg/960px-Alcazaba_1%2C_Almeria%2C_Spain.jpg",
    },
    "Jaén": {
        article: "Catedral de Jaén",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Jaen_Cathedral_2023_-_west_fa%C3%A7ade_1.jpg/960px-Jaen_Cathedral_2023_-_west_fa%C3%A7ade_1.jpg",
    },
    "Úbeda": {
        article: "Plaza Vázquez de Molina",
        image: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Iglesia_del_salvador_ubeda_001.jpg",
    },
    "Baeza": { article: "Plaza del Pópulo" },
    "Antequera": {
        article: "Alcazaba de Antequera",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Antequera_Alcazaba.jpg/960px-Antequera_Alcazaba.jpg",
    },
    "Motril": { article: "Motril" },
    "Conil de la Frontera": { article: "Conil de la Frontera" },
    "Vejer de la Frontera": { article: "Vejer de la Frontera" },
    "Tarifa": { article: "Castillo de Guzmán el Bueno" },
    "Marbella": { article: "Marbella" },
    "Estepona": { article: "Estepona" },
    "Mijas": { article: "Mijas" },
    "Sierra Nevada": { article: "Sierra Nevada (España)" },
    "Guadix": { article: "Cuevas de Guadix" },
    "Priego de Córdoba": { article: "Fuente del Rey (Priego de Córdoba)" },
    "Lucena": { article: "Castillo del Moral" },
    "Osuna": { article: "Colegiata de Osuna" },
    "Écija": { article: "Écija" },

    // España
    "Madrid": {
        article: "Puerta de Alcalá",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Puerta_de_Alcal%C3%A1_2025.jpg/960px-Puerta_de_Alcal%C3%A1_2025.jpg",
    },
    "Barcelona": {
        article: "Sagrada Familia",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Sagrada_Familia_01.jpg/960px-Sagrada_Familia_01.jpg",
    },
    "Valencia": {
        article: "Ciudad de las Artes y las Ciencias",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ciudad_de_las_Artes_y_las_Ciencias.jpg/960px-Ciudad_de_las_Artes_y_las_Ciencias.jpg",
    },
    "Bilbao": {
        article: "Museo Guggenheim Bilbao",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Museo_Guggenheim%2C_Bilbao_%2831273245344%29.jpg/960px-Museo_Guggenheim%2C_Bilbao_%2831273245344%29.jpg",
    },
    "Zaragoza": {
        article: "Basílica del Pilar",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Zaragoza_-_Basilica_de_Nuestra_Se%C3%B1ora_del_Pilar_01.jpg/960px-Zaragoza_-_Basilica_de_Nuestra_Se%C3%B1ora_del_Pilar_01.jpg",
    },
    "San Sebastián": {
        article: "Peine del Viento",
        image: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Haizearen_orrazia_0006.jpg",
    },
    "Santiago de Compostela": {
        article: "Catedral de Santiago de Compostela",
        image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Santiago_cathedral_2021.jpg",
    },

    // Europa
    "Lisboa": {
        article: "Torre de Belém",
        image: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Bel%C3%A9m_Tower_in_Lisbon%2C_Portugal.jpg",
    },
    "Porto": {
        article: "Torre de los Clérigos",
        image: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Torre_de_los_Cl%C3%A9rigos%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_04.JPG",
    },
    "Niza": {
        article: "Paseo de los Ingleses",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Nizza-C%C3%B4te_d%27Azur.jpg/960px-Nizza-C%C3%B4te_d%27Azur.jpg",
    },
    "Roma": {
        article: "Coliseo",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/960px-Colosseo_2020.jpg",
    },
    "París": {
        article: "Torre Eiffel",
        image: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Eiffelturm.JPG",
    },
    "Londres": {
        article: "Big Ben",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Clock_Tower_-_Palace_of_Westminster%2C_London_-_September_2006.jpg/960px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_September_2006.jpg",
    },
    "Ámsterdam": {
        article: "Rijksmuseum",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Rijksmuseum_Amsterdam_ca_1895.jpg/960px-Rijksmuseum_Amsterdam_ca_1895.jpg",
    },
    "Berlín": {
        article: "Puerta de Brandeburgo",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/960px-Brandenburger_Tor_abends.jpg",
    },
    "Viena": {
        article: "Catedral de San Esteban",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Stephansdom_Wien.jpg/960px-Stephansdom_Wien.jpg",
    },
    "Budapest": {
        article: "Parlamento de Budapest",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Parliament_Building_Budapest_Hungary.jpg/960px-Parliament_Building_Budapest_Hungary.jpg",
    },
    "Praga": {
        article: "Puente de Carlos",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Karl%C5%AFv_most_z_Kampy.JPG/960px-Karl%C5%AFv_most_z_Kampy.JPG",
    },
    "Dublín": {
        article: "Trinity College (Dublín)",
        image: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Trinity_College_Dublin_Campanile.jpg",
    },
    "Bruselas": {
        article: "Grand Place",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Grand-Place%2C_Brussels_-_panorama%2C_June_2018.jpg/960px-Grand-Place%2C_Brussels_-_panorama%2C_June_2018.jpg",
    },
    "Atenas": {
        article: "Acrópolis de Atenas",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Parthenon_in_Athens.jpg/960px-The_Parthenon_in_Athens.jpg",
    },
    "Estambul": {
        article: "Santa Sofía",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hagia_Sophia_Mars_2013.jpg/960px-Hagia_Sophia_Mars_2013.jpg",
    },
    "Milán": {
        article: "Catedral de Milán",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Duomo_di_Milano.jpg/960px-Duomo_di_Milano.jpg",
    },
    "Varsovia": {
        article: "Palacio de la Cultura y la Ciencia",
        image: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Warsaw_Palace_of_Culture_and_Science.jpg",
    },
    "Copenhague": {
        article: "La Sirenita",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/The_Little_Mermaid_home.jpg/960px-The_Little_Mermaid_home.jpg",
    },
    "Estocolmo": {
        article: "Gamla Stan",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Skeppsbrokajen_Gamla_Stan_from_Skeppsholmen_Stockholm_2016_01.jpg/960px-Skeppsbrokajen_Gamla_Stan_from_Skeppsholmen_Stockholm_2016_01.jpg",
    },
    "Múnich": {
        article: "Marienplatz",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Marienplatz%2C_Munich.jpg/960px-Marienplatz%2C_Munich.jpg",
    },
    "Zúrich": {
        article: "Grossmünster",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Grossm%C3%BCnster_Z%C3%BCrich.jpg/960px-Grossm%C3%BCnster_Z%C3%BCrich.jpg",
    },
    "Edimburgo": {
        article: "Castillo de Edimburgo",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Edinburgh_Castle_from_the_south_east.JPG/960px-Edinburgh_Castle_from_the_south_east.JPG",
    },
    "Mánchester": {
        article: "Ayuntamiento de Mánchester",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Manchester_Town_Hall_from_Lloyd_Street.jpg/960px-Manchester_Town_Hall_from_Lloyd_Street.jpg",
    },

    // América
    "Nueva York": {
        article: "Estatua de la Libertad",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/960px-Statue_of_Liberty_7.jpg",
    },
};

// Devuelve la entrada del monumento emblemático de una ciudad, o null.
export function landmarkFor(cityName) {
    if (!cityName) return null;
    return LANDMARKS[cityName] || null;
}

// Devuelve la URL directa de la imagen del monumento si existe, o null.
export function landmarkImage(cityName) {
    const landmark = landmarkFor(cityName);
    return landmark?.image || null;
}