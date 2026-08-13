// Bus de datos del viaje (cliente). Cada sección que carga datos con
// coordenadas (hoteles, restaurantes, atracciones, gasolineras) los publica
// aquí con el ámbito del destino; el mapa se suscribe y los dibuja.
// Está acotado por nombre de destino para no mezclar datos entre páginas.

const store = new Map(); // scope -> { hotels, restaurants, attractions, fuelStations }
const listeners = new Set();

function defaultScope() {
  return { hotels: [], restaurants: [], attractions: [], fuelStations: [] };
}

export function publishTripData(scope, category, items) {
  if (!scope || !category) return;
  const current = store.get(scope) || defaultScope();
  current[category] = Array.isArray(items) ? items : [];
  store.set(scope, current);
  listeners.forEach((cb) => cb(scope, current));
}

// Devuelve una función de limpieza. Si ya hay datos del ámbito, los reenvía
// inmediatamente para que el mapa no se quede esperando.
export function subscribeTripData(scope, cb) {
  if (!cb) return () => {};
  const current = store.get(scope);
  if (current) cb(scope, current);
  const handler = (s, data) => {
    if (s === scope) cb(s, data);
  };
  listeners.add(handler);
  return () => listeners.delete(handler);
}