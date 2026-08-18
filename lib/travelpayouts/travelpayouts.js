import { DESTINATIONS } from "@/lib/destinations/catalog";
import { landmarkFor } from "@/lib/destinations/landmarks";
import { fileCache } from "@/lib/utils/cacheServer";

// Travelpayouts (red de Aviasales) Data API. Fuente principal de vuelos.
// Autenticación: header X-Access-Token con el token personal del afiliado.
// Estrategia:
//   - Los precios que muestra Aviasales son las tarifas de IDA Y VUELTA que
//     devuelven /v2/prices/latest (one_way=false) y /v1/prices/cheap.
//   - El month-matrix, por defecto, devuelve billetes de SOLO ida por día;
//     sumar dos (ida+vuelta) infla el precio (p. ej. 88+88 en vez de ~65).
//   - Por eso se usan las tarifas reales de ida y vuelta cuando existen y se
//     recurre al month-matrix solo como respaldo.
// Los datos son agregados/cacheados por Aviasales (no en tiempo real).

const API = "https://api.travelpayouts.com";

const DAY_MS = 1000 * 60 * 60 * 24;

// Matriz mensual por día: caché larga (precios estáticos).
const cache = fileCache("travelpayouts-matrix", 6 * 60 * 60 * 1000);

// Tarifas reales de ida y vuelta (one_way=false): caché media (precios 48h).
const roundTripCache = fileCache("travelpayouts-roundtrips", 3 * 60 * 60 * 1000);

// Imágenes reales de las ciudades (Wikipedia): caché larga (7 días).
const cityImageCache = fileCache("travelpayouts-city-images", 7 * 24 * 60 * 60 * 1000);

function firstDayOfMonth(date) {
  return `${date.slice(0, 8)}01`;
}

function addDaysIso(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function getMonthMatrix({
  origin,
  destination,
  monthDate,
  currency = "eur",
}) {
  const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
  if (!TOKEN) throw new Error("TRAVELPAYOUTS_TOKEN not configured");
  const month = firstDayOfMonth(monthDate);
  const key = `${origin}->${destination}:${month}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL(`${API}/v2/prices/month-matrix`);
  url.searchParams.set("currency", currency.toLowerCase());
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("month", month);
  url.searchParams.set("show_to_affiliates", "true");
  url.searchParams.set("token", TOKEN);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return cache.set(key, []);

  const data = await res.json();
  const items = Array.isArray(data?.data) ? data.data : [];
  return cache.set(
    key,
    items.map((f) => ({
      date: f.depart_date || null,
      price: typeof f.value === "number" ? f.value : null,
      gate: f.gate || null,
      changes: typeof f.number_of_changes === "number" ? f.number_of_changes : null,
      duration: typeof f.duration === "number" ? f.duration : null,
    }))
  );
}

// El precio más barato para el día exacto; con ±flexibleDías de holgura.
function cheapestForDate(fares, date, flexibleDays = 2) {
  if (!date) return null;
  const target = new Date(date).getTime();
  let best = null;
  let bestDist = Infinity;
  for (const f of fares) {
    if (f.price === null || !f.date) continue;
    const dist = Math.abs(new Date(f.date).getTime() - target) / DAY_MS;
    if (dist <= flexibleDays && dist < bestDist) {
      bestDist = dist;
      best = { ...f, dist };
    }
  }
  return best;
}

// Construye el enlace de reserva de Aviasales con parámetros prefijados.
// Usa la ruta canónica /search/{ORIGEN}{DDMM}{DESTINO}{DDMM}{clase}{viajeros},
// que Aviasales sí decodifica (el formato con query params redirige a .ru y pierde todo).
function pad2(n) {
  return String(n).padStart(2, "0");
}

function ddmm(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return pad2(d.getUTCDate()) + pad2(d.getUTCMonth() + 1);
}

export function aviasalesReservationLink({
  origin,
  destination,
  outbound,
  returnDate,
  adults = 2,
  currency = "EUR",
}) {
  const pax = Math.max(1, Math.min(9, Number(adults) || 1));
  const base = `https://www.aviasales.com/search/${origin}${ddmm(outbound)}${destination}`;
  if (returnDate) {
    const path = `${base}${ddmm(returnDate)}e${pax}`;
    const link = new URL(path);
    link.searchParams.set("currency", currency.toLowerCase());
    const MARKER = process.env.TRAVELPAYOUTS_MARKER;
    if (MARKER) link.searchParams.set("marker", MARKER);
    return link.toString();
  }
  const link = new URL(`${base}2`);
  link.searchParams.set("currency", currency.toLowerCase());
  const MARKER = process.env.TRAVELPAYOUTS_MARKER;
  if (MARKER) link.searchParams.set("marker", MARKER);
  return link.toString();
}

// Búsqueda simple: la mejor combinación ida+vuelta para unas fechas.
export async function searchFlightsTravelpayouts({
  departureId,
  arrivalId,
  outboundDate,
  returnDate,
  adults = 2,
  currency = "EUR",
}) {
  // Primero intentamos buscar en la caché de viajes redondos (precios reales ida+vuelta)
  const roundTripKey = `${departureId}-${arrivalId}-${outboundDate}-${returnDate}`;
  const cachedRoundTrip = roundTripCache.get(roundTripKey);
  if (cachedRoundTrip) {
    return {
      found: true,
      pricePerPerson: cachedRoundTrip.pricePerPerson,
      totalPrice: cachedRoundTrip.totalPrice,
      airline: cachedRoundTrip.airline,
      link: cachedRoundTrip.link,
      source: cachedRoundTrip.source || "Aviasales (cached)",
    };
  }

  const [outbound, inbound] = await Promise.all([
    getMonthMatrix({
      origin: departureId,
      destination: arrivalId,
      monthDate: outboundDate,
      currency,
    }),
    returnDate
      ? getMonthMatrix({
          origin: arrivalId,
          destination: departureId,
          monthDate: returnDate,
          currency,
        })
      : Promise.resolve([]),
  ]);

  const out = cheapestForDate(outbound, outboundDate, 3);
  if (!out) return { found: false };

  let ret = null;
  if (returnDate) {
    ret = cheapestForDate(inbound, returnDate, 3);
    if (!ret) return { found: false };
  }

  const costPerPerson = ret ? out.price + ret.price : out.price;
  const totalPrice = costPerPerson * (Math.max(1, Number(adults) || 1));

  const result = {
    found: true,
    pricePerPerson: costPerPerson,
    totalPrice,
    airline: ret ? out.gate : out.gate,
    link: aviasalesReservationLink({
      origin: departureId,
      destination: arrivalId,
      outbound: out.date,
      returnDate: ret?.date || returnDate,
      adults,
      currency,
    }),
    source: out.gate || "Aviasales",
    outbound: { date: out.date, price: out.price },
    inbound: ret ? { date: ret.date, price: ret.price } : null,
  };

  // Guardar en caché de viajes redondos para futuras consultas (3 horas)
  roundTripCache.set(roundTripKey, {
    pricePerPerson: costPerPerson,
    totalPrice,
    airline: result.airline,
    link: result.link,
    source: result.source,
  });

  return result;
}

// Todas las combinaciones ida+vuelta dentro de [startDate, endDate] para
// escapadas de 2-N noches. Usado por el modo "vacaciones".
export async function searchFlightOptionsTravelpayouts({
  departureId,
  arrivalId,
  startDate,
  endDate,
  adults = 2,
  currency = "EUR",
  minNights = 2,
  maxNights = 5,
}) {
  const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
  if (!TOKEN) throw new Error("TRAVELPAYOUTS_TOKEN not configured");

  // Primero intentamos usar /v1/prices/cheap que devuelve precios reales ida+vuelta
  // para un rango de fechas (mes). Esto es más preciso que combinar matrices mensuales.
  const startMonth = firstDayOfMonth(startDate);
  const endMonth = firstDayOfMonth(endDate || addDaysIso(startDate, 7));
  
  // Cache key for this route and date range
  const cacheKey = `cheap-options:${departureId}-${arrivalId}:${startMonth}:${endMonth}:${minNights}:${maxNights}`;
  const cached = dirCache.get(cacheKey);
  if (cached) {
    return cached.slice(0, 60);
  }

  try {
    // Usar el endpoint cheap con one_way=false para precios reales de ida y vuelta
    const url = new URL(`${API}/v1/prices/cheap`);
    url.searchParams.set("origin", departureId);
    url.searchParams.set("destination", arrivalId);
    url.searchParams.set("depart_date", startMonth);
    url.searchParams.set("return_date", endMonth);
    url.searchParams.set("one_way", "false");
    url.searchParams.set("currency", currency.toLowerCase());
    url.searchParams.set("token", TOKEN);

    const json = await fetchJsonRetry(url);
    const entries = json?.data?.data || json?.data || {};
    
    if (Object.keys(entries).length > 0) {
      const options = [];
      // El endpoint cheap devuelve un objeto con el código de destino como clave
      // y un array de ofertas. Cada oferta tiene precio, fechas, etc.
      for (const [destCode, offers] of Object.entries(entries)) {
        if (!Array.isArray(offers)) continue;
        for (const offer of offers) {
          if (!offer || typeof offer.price !== "number") continue;
          if (!offer.depart_date || !offer.return_date) continue;
          
          const outbound = offer.depart_date;
          const returnDate = offer.return_date;
          
          // Filtrar por rango de fechas solicitado
          if (outbound < startDate || outbound > (endDate || addDaysIso(startDate, 7))) continue;
          if (returnDate > (endDate || addDaysIso(startDate, 7))) continue;
          
          const nights = Math.round((new Date(returnDate) - new Date(outbound)) / DAY_MS);
          if (nights < minNights || nights > maxNights) continue;
          
          const costPerPerson = offer.price;
          options.push({
            outbound,
            returnDate,
            nights,
            pricePerPerson: costPerPerson,
            totalPrice: costPerPerson * (Math.max(1, Number(adults) || 1)),
            airline: offer.airline || offer.gate || "Aviasales",
            link: aviasalesReservationLink({
              origin: departureId,
              destination: arrivalId,
              outbound,
              returnDate,
              adults,
              currency,
            }),
            source: offer.gate || "Aviasales",
          });
        }
      }
      
      if (options.length > 0) {
        options.sort((a, b) => a.totalPrice - b.totalPrice);
        const result = options.slice(0, 60);
        // Cachear por 6 horas
        dirCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (error) {
    // Si falla el endpoint cheap, continuamos con el método de matriz mensual
    console.warn("Cheap API failed for flight options, falling back to month matrix:", error);
  }

  // Fallback: método original con matriz mensual (precios solo ida combinados)
  const lastDay = endDate || addDaysIso(startDate, 7);
  const options = [];

  // La ventana puede cruzar meses: la ida que salga en septiembre y vuelva
  // en octubre necesita la matrix de vuelta de AMBOS meses. Recolectamos
  // todos los meses del intervalo [startDate, endDate] en cada dirección.
  const months = [];
  let m = firstDayOfMonth(startDate);
  const mEnd = firstDayOfMonth(lastDay);
  while (m <= mEnd) {
    months.push(m);
    const d = new Date(m);
    d.setUTCMonth(d.getUTCMonth() + 1);
    m = d.toISOString().slice(0, 10);
  }

  const [outboundFares, inboundFares] = await Promise.all([
    Promise.all(
      months.map((month) =>
        getMonthMatrix({
          origin: departureId,
          destination: arrivalId,
          monthDate: month,
          currency,
        })
      )
    ),
    Promise.all(
      months.map((month) =>
        getMonthMatrix({
          origin: arrivalId,
          destination: departureId,
          monthDate: month,
          currency,
        })
      )
    ),
  ]);
  const outbound = outboundFares.flat();
  const inbound = inboundFares.flat();

  for (const o of outbound) {
    if (o.price === null || !o.date) continue;
    if (o.date < startDate || o.date > lastDay) continue;
    for (const r of inbound) {
      if (r.price === null || !r.date) continue;
      if (r.date <= o.date) continue;
      const nights = Math.round(
        (new Date(r.date) - new Date(o.date)) / DAY_MS
      );
      if (nights < minNights || nights > maxNights) continue;
      // La vuelta nunca puede superar el final del período solicitado.
      if (r.date > lastDay) continue;
      const costPerPerson = o.price + r.price;
      options.push({
        outbound: o.date,
        returnDate: r.date,
        nights,
        pricePerPerson: costPerPerson,
        totalPrice: costPerPerson * (Math.max(1, Number(adults) || 1)),
        airline: o.gate || "Aviasales",
        link: aviasalesReservationLink({
          origin: departureId,
          destination: arrivalId,
          outbound: o.date,
          returnDate: r.date,
          adults,
          currency,
        }),
        source: o.gate || "Aviasales",
      });
    }
  }

  if (options.length === 0) return [];

  options.sort((a, b) => a.totalPrice - b.totalPrice);
  return options.slice(0, 60);
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Destinos disponibles con vuelos reales desde un aeropuerto de origen.
// Usa /v1/prices/cheap (destinos con vuelo dentro de las fechas + precio real)
// + el catálogo de ciudades de Aviasales (coordenadas/nombre) para construir
// candidatos. Es el endpoint más fiable (sin el rate-limit de city-directions).
// Se ordena por precio y SIEMPRE se fusionan las ciudades del catálogo propio
// (incluidos Londres, Nueva York, capitales europeas...) aunque esa fecha aún
// no tenga vuelo barato cacheado, para que nunca falten destinos conocidos.
const cityCatalogCache = fileCache("travelpayouts-cities", 7 * 24 * 60 * 60 * 1000);
const dirCache = fileCache("travelpayouts-directions", 6 * 60 * 60 * 1000);

const COASTAL_CODES = new Set([
  "PMI", "IBZ", "TCI", "ACE", "LPA", "FUE", "TFS", "GMZ", "VLC", "ALC", "AGP",
  "BIO", "EAS", "SCQ", "LIS", "OPO", "NCE", "LCA", "HER", "ATH", "FAO", "CAG",
  "NAP", "KGS", "RHO", "JMK", "BCN", "MIL", "VCE", "SAL", "BDS", "CTA", "BUD",
]);

// Destinos de vuelo garantizados: capitales y ciudades internacionales que
// SIEMPRE deben aparecer en el modo avión, aunque esa combinación de fechas no
// tenga aún vuelo barato cacheado en /v1/prices/cheap. Referencian el catálogo
// propio (catalog.js). Solo se fusionan estos, no todo el catálogo de carretera.
const GUARANTEED_FLIGHT_SLUGS = [
  "londres", "paris", "roma", "lisboa", "porto", "niza",
  "amsterdam", "berlin", "viena", "budapest", "praga", "dublin", "bruselas",
  "atenas", "estambul", "milan", "varsovia", "copenhague", "estocolmo",
  "munich", "zurich", "edimburgo", "manchester", "nueva-york",
  "barcelona", "madrid", "valencia", "bilbao", "sevilla", "santiago-de-compostela",
  // Ciudades españolas adicionales
  "cordoba", "zaragoza", "almeria", "guadix", "priego-de-cordoba",
  "lucena", "ubeda", "osuna", "ecija", "ronda", "marbella", "mijas",
  "estepona", "antequera", "vejer-de-la-frontera", "tarifa",
  "conil-de-la-frontera", "motril", "frigiliana", "nerja",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GET con reintentos ante la respuesta vacía del rate-limit del proveedor.
async function fetchJsonRetry(url, { attempts = 3, waitMs = 1500 } = {}) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    const value = json?.data ?? json;
    if (res.ok && value && (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0)) {
      return json;
    }
    last = json;
    await delay(waitMs * (i + 1));
  }
  return last;
}

async function getCitiesCatalog() {
  const cached = cityCatalogCache.get("es");
  if (cached) return cached;
  const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
  if (!TOKEN) throw new Error("TRAVELPAYOUTS_TOKEN not configured");
  const res = await fetch(`${API}/data/es/cities.json?token=${TOKEN}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const cities = await res.json();
  const byCode = {};
  if (Array.isArray(cities)) {
    for (const c of cities) {
      if (c?.code && c?.name) {
        byCode[c.code] = {
          name: c.name,
          lat: c.coordinates?.lat ?? null,
          lon: c.coordinates?.lon ?? null,
          country: c.country_code || null,
        };
      }
    }
  }
  cityCatalogCache.set("es", byCode);
  return byCode;
}

// Foto real de una ciudad desde la Wikipedia en español (imagen principal del
// artículo). Se cachea por nombre (7 días). Solo se aceptan fotos
// representativas (no banderas/escudos .svg ni collages/montajes), y se piden
// a una resolución decente. Fallback: loremflickr para que nunca falte imagen.
function wikiThumbUpscale(url) {
  // Pide la miniatura a una resolución decente (640px) en vez de la de 330px.
  const clean = url.split("?")[0];
  if (clean.includes("/thumb/")) {
    return clean.replace(/\/(\d+)px-/, "/640px-");
  }
  return clean;
}

function isRepresentativePhoto(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.endsWith(".svg") || lower.endsWith(".svg.png")) return false; // banderas/escudos
  if (/collage|montage|montaj|composit/i.test(lower)) return false; // composiciones
  if (/bandera|escudo|flag|coat|location_map|mapa_de_localizaci/i.test(lower)) return false;
  return true;
}

// Resuelve la imagen de un artículo de Wikipedia (ciudad o monumento).
async function fetchWikiImage(name) {
  try {
    const res = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.originalimage?.source || data?.thumbnail?.source || null;
    if (!thumb || !isRepresentativePhoto(thumb)) return null;
    return wikiThumbUpscale(thumb);
  } catch {
    return null;
  }
}

export async function cityImages(names) {
  const unique = [...new Set(names.map((n) => String(n).trim()).filter(Boolean))];
  const cached = {};
  const toFetch = [];
  for (const name of unique) {
    // Las URLs directas de monumentos emblemáticos SIEMPRE ganan, aunque haya
    // una imagen antigua cacheada de la ciudad (evita fotos genéricas).
    const landmark = landmarkFor(name);
    if (landmark?.image) {
      cached[name] = landmark.image;
      continue;
    }
    const hit = cityImageCache.get(name);
    if (hit && isRepresentativePhoto(hit)) cached[name] = hit;
    else toFetch.push(name);
  }

  async function fetchOne(name) {
    // Prioridad: monumento emblemático de la ciudad (imagen representativa).
    const landmark = landmarkFor(name);
    if (landmark) {
      // Si ya tenemos la URL directa del monumento, la usamos sin llamar al API.
      if (landmark.image) {
        cityImageCache.set(name, landmark.image);
        return { name, url: landmark.image };
      }
      // Fallback: resolver la imagen del artículo del monumento.
      const landmarkUrl = await fetchWikiImage(landmark.article);
      if (landmarkUrl) {
        cityImageCache.set(name, landmarkUrl);
        return { name, url: landmarkUrl };
      }
    }
    // Fallback: imagen principal del artículo de la ciudad.
    const cityUrl = await fetchWikiImage(name);
    if (cityUrl) {
      cityImageCache.set(name, cityUrl);
      return { name, url: cityUrl };
    }
    return { name, url: null };
  }

  // Concurrencia limitada + un reintento para los que fallen por rate-limit.
  const results = [];
  for (let i = 0; i < toFetch.length; i += 10) {
    const batch = toFetch.slice(i, i + 10);
    const batchRes = await Promise.all(batch.map(fetchOne));
    results.push(...batchRes);
  }
  const retry = results.filter((r) => !r.url).map((r) => r.name);
  if (retry.length > 0) {
    await delay(300);
    const retried = await Promise.all(retry.slice(0, 20).map(fetchOne));
    for (const r of retried) {
      const idx = results.findIndex((x) => x.name === r.name);
      if (idx >= 0 && r.url) results[idx] = r;
    }
  }

  const byName = { ...cached };
  for (const r of results) byName[r.name] = r.url;
  return byName;
}

// Lista los destinos con vuelo real desde el origen en [startDate, endDate].
export async function flightDestinations(
  departureId,
  { limit = 20, startDate, endDate } = {}
) {
  const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
  if (!TOKEN) throw new Error("TRAVELPAYOUTS_TOKEN not configured");
  const start = startDate ? startDate.slice(0, 7) : null;
  const end = endDate ? endDate.slice(0, 7) : start;
  const cacheKey = `${departureId}:${start}:${end}`;
  const cached = dirCache.get(cacheKey);
  let directions = cached;
  if (!directions) {
    const url = new URL(`${API}/v1/prices/cheap`);
    url.searchParams.set("origin", departureId);
    if (start) url.searchParams.set("depart_date", start);
    if (end) url.searchParams.set("return_date", end);
    url.searchParams.set("one_way", "false");
    url.searchParams.set("currency", "eur");
    url.searchParams.set("token", TOKEN);

    const json = await fetchJsonRetry(url);
    const entries = json?.data?.data || json?.data || {};
    directions = Object.entries(entries).map(([code, v]) => {
      const offers = Object.values(v || {});
      const best = offers[0] || {};
      return {
        code,
        price: typeof best?.price === "number" ? best.price : null,
        airline: best?.airline || null,
      };
    });
    if (directions.length > 0) dirCache.set(cacheKey, directions);
  }

  const cities = await getCitiesCatalog();
  const result = [];
  const seen = new Set();
  const imageNames = [];
  // El cheap solo trae destinos con vuelo barato cacheado; añadimos precio.
  for (const d of directions) {
    if (d.code === departureId) continue;
    const city = cities[d.code];
    if (!city) continue;
    const name = city.name;
    const slug = slugify(name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    imageNames.push(name);
    result.push({
      name,
      slug,
      lat: city.lat,
      lon: city.lon,
      country: city.country,
      region: COASTAL_CODES.has(d.code) ? "costa" : "interior",
      airport: d.code,
      priceHint: d.price,
      airline: d.airline,
      image: null,
    });
  }

  // Fusionamos el catálogo propio garantizado (solo destinos de vuelo
  // curados) para que Londres, París, Nueva York... SIEMPRE aparezcan, aunque
  // esa combinación de fechas no tenga vuelo barato cacheado todavía.
  const catalogBySlug = new Map(DESTINATIONS.map((d) => [d.slug, d]));
  for (const slug of GUARANTEED_FLIGHT_SLUGS) {
    const cat = catalogBySlug.get(slug);
    if (!cat || cat.airport === departureId || !cat.airport) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    imageNames.push(cat.name);
    result.push({ ...cat, priceHint: null, airline: null, image: cat.image || null });
  }

  // Resolvemos las fotos reales de cada ciudad en paralelo (con caché).
  // Prioridad: Wikipedia > imagen del catálogo > loremflickr (respaldo).
  const images = await cityImages(imageNames);
  for (const d of result) {
    const real = d.name && images[d.name];
    if (real) {
      d.image = real;
    } else if (!d.image) {
      // Fallback: si el destino dinámico coincide con el catálogo propio
      // (mismo slug), usamos su imagen de Wikimedia antes de loremflickr.
      const cat = catalogBySlug.get(d.slug);
      d.image =
        (cat && cat.image) ||
        `https://loremflickr.com/800/600/${encodeURIComponent(d.name)}`;
    }
  }

  // Los destinos con precio real primero (más baratos arriba); el catálogo
  // sin precio al final, para que los vuelos baratos ganen siempre.
  result.sort((a, b) => {
    const ap = a.priceHint ?? Number.MAX_SAFE_INTEGER;
    const bp = b.priceHint ?? Number.MAX_SAFE_INTEGER;
    return ap - bp;
  });
  return result.slice(0, limit);
}