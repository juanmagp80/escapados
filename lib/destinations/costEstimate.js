import { nightsBetween } from "@/lib/utils/format";

const ECONOMY = [
  "Ronda", "Nerja", "Frigiliana", "Motril", "Conil de la Frontera",
  "Vejer de la Frontera", "Mijas", "Guadix", "Lucena", "Osuna",
  "Écija", "Baeza", "Antequera", "Priego de Córdoba", "Tarifa",
];

const EXPENSIVE = [
  "Madrid", "Barcelona", "Bilbao", "San Sebastián", "Lisboa",
  "Roma", "París", "Londres", "Niza", "Marbella", "Santiago de Compostela",
];

function costLevel(name) {
  if (ECONOMY.includes(name)) return 1;
  if (EXPENSIVE.includes(name)) return 3;
  return 2;
}

export function estimateTripCost({
  name,
  region,
  startDate,
  endDate,
  travelers = 2,
  transportCost = 0,
  hotelCost, // si se pasa, se usa el precio real en vez de la estimación fija
}) {
  const nights = nightsBetween(startDate, endDate);
  const level = costLevel(name);
  const baseHotelPerNight = region === "costa" ? 75 : 60;
  const effectiveHotelCost =
    typeof hotelCost === "number" && hotelCost > 0
      ? Math.round(hotelCost)
      : Math.round(baseHotelPerNight * nights);
  const transport = Math.round(transportCost);

  // El total solo incluye alojamiento + transporte.
  const estimatedCost = effectiveHotelCost + transport;

  // Gastos aparte, orientativos y variables según el destino.
  const foodPerPersonDay = { 1: 15, 2: 20, 3: 28 }[level];
  const activitiesPerPersonNight = { 1: 8, 2: 12, 3: 18 }[level];
  const foodCost = Math.round(foodPerPersonDay * (nights + 1) * travelers);
  const activitiesCost = Math.round(activitiesPerPersonNight * nights * travelers);

  return {
    nights,
    hotelCost: effectiveHotelCost,
    hotelCostReal: typeof hotelCost === "number" && hotelCost > 0,
    foodCost,
    activitiesCost,
    transportCost: transport,
    estimatedCost,
    perPerson: Math.round(estimatedCost / (travelers || 1)),
  };
}