// Estimación de peajes en España por tramos de autopista.
// Datos orientativos 2024-2025. Tarifa media por km: ~0,08 €/km en autopista.
// Se aproxima el peaje en función de la distancia de la ruta que pasa por
// autovías/autopistas (no se puede conocer exactamente sin datos de peaje
// reales de cada concesionaria).

const TOLL_RATE_PER_KM = 0.08; // €/km en autopista de peaje
const EXPRESSWAY_SHARE = 0.35; // % de la ruta que suele ser autopista de peaje

export function estimateTolls(distanceKm, { highwayShare = EXPRESSWAY_SHARE } = {}) {
    if (!distanceKm || distanceKm <= 0) return 0;
    // Solo se paga peaje en un tramo de la ruta
    const tollKm = distanceKm * highwayShare;
    return Math.round(tollKm * TOLL_RATE_PER_KM);
}

// Comparación coche vs tren vs avión vs BlaBlaCar
export function compareModes({
    distanceKm,
    carCost,
    trainCost,
    planeCost,
    blablacarCost,
    busCost,
    carDuration,
    trainDuration,
    planeDuration,
    busDuration,
}) {
    const modes = [];
    if (carCost) {
        modes.push({
            id: "car",
            label: "🚗 Coche",
            cost: carCost,
            duration: carDuration,
        });
    }
    if (trainCost) {
        modes.push({ id: "train", label: "🚆 Tren", cost: trainCost, duration: trainDuration });
    }
    if (planeCost) {
        modes.push({ id: "plane", label: "✈️ Avión", cost: planeCost, duration: planeDuration });
    }
    if (blablacarCost) {
        modes.push({
            id: "blablacar",
            label: "🤝 BlaBlaCar",
            cost: blablacarCost,
            duration: carDuration,
        });
    }
    if (busCost) {
        modes.push({ id: "bus", label: "🚌 Autobús", cost: busCost, duration: busDuration });
    }
    return modes.sort((a, b) => (a.cost || Infinity) - (b.cost || Infinity));
}