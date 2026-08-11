// Sistema de alertas de precio: acumula histórico de vuelos y permite
// detectar cuándo baja el precio. Se usa un archivo de caché en disco.
import { fileCache } from "@/lib/utils/cacheServer";

const cache = fileCache("price-alerts", 1000 * 60 * 60 * 24 * 30); // 30 días

// Guarda el precio observado de una ruta + fecha.
export function recordPrice({ from, to, date, price }) {
    if (!from || !to || !date || !price) return;
    const key = `${from}->${to}:${date}`;
    const history = cache.get(key) || [];
    history.push({ price, ts: Date.now() });
    cache.set(key, history.slice(-30)); // máx 30 observaciones
}

// Media de los últimos precios de una ruta+fecha.
export function averagePrice({ from, to, date }) {
    const key = `${from}->${to}:${date}`;
    const history = cache.get(key) || [];
    if (history.length === 0) return null;
    const sum = history.reduce((acc, h) => acc + h.price, 0);
    return sum / history.length;
}

// ¿Ha bajado el precio respecto a la media reciente?
export function isPriceDrop(currentPrice, { from, to, date, threshold = 0.85 }) {
    const avg = averagePrice({ from, to, date });
    if (!avg) return false;
    return currentPrice <= avg * threshold;
}

// Alerta de "precio bajo" para una ruta+fecha.
export function checkPriceAlert({ from, to, date, currentPrice }) {
    recordPrice({ from, to, date, price: currentPrice });
    return isPriceDrop(currentPrice, { from, to, date });
}