export function calculateFuel(distanceMeters, consumptionL100, fuelPrice) {
  if (
    distanceMeters === null ||
    distanceMeters === undefined ||
    !consumptionL100 ||
    !fuelPrice
  ) {
    return { liters: 0, cost: 0 };
  }
  const km = distanceMeters / 1000;
  const liters = (km * consumptionL100) / 100;
  const cost = liters * fuelPrice;
  return { liters: round2(liters), cost: round2(cost) };
}

export function carTotalCost({
  distanceMeters,
  consumptionL100,
  fuelPrice,
  tolls = 0,
  blablacarIncome = 0,
}) {
  const fuel = calculateFuel(distanceMeters, consumptionL100, fuelPrice);
  const effective = Math.max(0, fuel.cost + (tolls || 0) - (blablacarIncome || 0));
  return {
    fuel,
    tolls: tolls || 0,
    blablacarIncome: blablacarIncome || 0,
    effective: round2(effective),
  };
}

export function blablacarIncome(pricePerSeat, seats) {
  const p = Number(pricePerSeat) || 0;
  const s = Number(seats) || 0;
  return round2(p * s);
}

// Plazas libres para pasajeros en un coche de `carSeats` (ocupantes incluye al conductor).
export function carSeatsAvailable(travelers, carSeats = 5) {
  const t = Math.max(1, Number(travelers) || 1);
  return Math.max(0, carSeats - t);
}

// Precio sugerido por pasajero que reparte el coste compartido (combustible + peajes)
// entre todas las personas que viajan en el coche (conductor + pasajeros).
export function suggestedPricePerSeat({ fuelCost = 0, tolls = 0, occupants = 1 }) {
  const n = Math.max(1, Number(occupants) || 1);
  const shared = (Number(fuelCost) || 0) + (Number(tolls) || 0);
  return round2(shared / n);
}

// Coste efectivo para el conductor tras descontar los ingresos del resto de pasajeros.
export function blablacarEffectiveCost(totalCost, income) {
  return round2(Math.max(0, (Number(totalCost) || 0) - (Number(income) || 0)));
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
