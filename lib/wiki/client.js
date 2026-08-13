import { inMemoryCache } from "@/lib/utils/cache";

// Contenido real de los destinos desde Wikimedia (Wikipedia + Commons).
// 100% gratuito y sin API key. Requisito: enviar un User-Agent informativo.
// https://www.mediawiki.org/wiki/API:REST_API / https://commons.wikimedia.org/w/api.php

const UA = "Escapa2/1.0 (asistente de escapadas; contacto: escapas@example.com)";
const LANG = "es";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
const cache = inMemoryCache(CACHE_TTL_MS);

async function fetchJson(url, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Ignora acentos para reintentar títulos tipo "Cadiz" o "San Sebastian".
function normalizeTitle(title) {
  return String(title)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/’/g, "'");
}

function unAccent(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Resumen en español de la página de Wikipedia de un lugar.
// Devuelve { title, extract, pageUrl, thumbnail } o null si no existe.
export async function getArticleSummary(name, lang = LANG) {
  const normalized = normalizeTitle(name);
  if (!normalized) return null;

  const cacheKey = `summary::${lang}::${normalized.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const candidates = [
    normalized,
    unAccent(normalized),
    `${normalized}, España`,
    `${unAccent(normalized)}, Espana`,
  ];

  let summary = null;
  for (const title of candidates) {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
    try {
      const data = await fetchJson(url);
      if (!data || !data.title || !data.extract) continue;
      if (data.type === "disambiguation") continue;
      summary = {
        title: data.displaytitle || data.title,
        extract: data.extract,
        pageUrl: data.content_urls?.desktop?.page || null,
        thumbnail: data.thumbnail?.source || null,
      };
      break;
    } catch {
      // 404 u otro error: inténtalo con el siguiente título candidato.
    }
  }

  if (summary) cache.set(cacheKey, summary);
  return summary;
}

// Fotos reales del entorno de unas coordenadas desde Wikimedia Commons.
// Usa geosearch: busca imágenes geolocalizadas en un radio del destino.
const IMAGE_FILE_RE = /\.(jpe?g|png)$/i;
const BAD_IMAGE_RE = /log[oó]|icon|mapa|plan|bandera|escudo|coat|svg|gif|locator/i;

export async function getCommonsImages(lat, lon, limit = 6) {
  if (lat === undefined || lon === undefined || lon === null) return [];

  const cacheKey = `images::${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "geosearch");
  url.searchParams.set("ggscoord", `${lat}|${lon}`);
  url.searchParams.set("ggsradius", "5000");
  url.searchParams.set("ggslimit", "30");
  url.searchParams.set("ggsnamespace", "6"); // Solo archivos/imágenes
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");
  url.searchParams.set("iiurlwidth", "960");

  let images = [];
  try {
    const data = await fetchJson(url.toString());
    const pages = Object.values(data?.query?.pages || {});
    images = pages
      .filter((p) => p?.title && IMAGE_FILE_RE.test(p.title) && !BAD_IMAGE_RE.test(p.title))
      .map((p) => {
        const info = p.imageinfo?.[0] || {};
        return {
          title: p.title,
          thumb: info.thumburl || null,
          full: info.url || null,
          width: info.thumbwidth || null,
          height: info.thumbheight || null,
        };
      })
      .filter((i) => i.thumb || i.full)
      .slice(0, limit);
  } catch {
    images = [];
  }

  if (images.length > 0) cache.set(cacheKey, images);
  return images;
}

// Paquete de contenido del destino: resumen + fotos. Todo opcional.
export async function getDestinationInfo({ name, lat, lon }) {
  const [summary, images] = await Promise.all([
    getArticleSummary(name),
    getCommonsImages(lat, lon, 6),
  ]);
  if (!summary && images.length === 0) return null;
  return {
    description: summary?.extract || null,
    title: summary?.title || name,
    wikiUrl: summary?.pageUrl || null,
    thumbnail: summary?.thumbnail || null,
    images,
  };
}