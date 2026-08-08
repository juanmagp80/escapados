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

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
