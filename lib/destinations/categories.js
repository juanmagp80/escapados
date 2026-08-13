// Predefinidas «¿Qué os apetece?» de la búsqueda principal. Cada categoría
// mapea a intereses del catálogo (lib/destinations/interests.js) que ponderan
// el scoring: los destinos que encajan suben en el ranking, sin excluir al
// resto. `interests` se envía como parámetro de búsqueda `interest` y runSearch
// lo pasa a scoreDestination.

export const TRIP_CATEGORIES = [
  {
    id: "beach",
    label: "🏖️ Playas sorprendentes",
    description: "Arenales, calas y agua clara",
    interests: ["beach"],
  },
  {
    id: "medieval",
    label: "🏰 Pueblos con encanto",
    description: "Cascos históricos y casas blancas",
    interests: ["culture", "romantic"],
  },
  {
    id: "nature",
    label: "🌲 Naturaleza sorprendente",
    description: "Montaña, parques y paisajes",
    interests: ["nature"],
  },
  {
    id: "adventure",
    label: "🧗 Aventura",
    description: "Senderismo, surf y adrenalina",
    interests: ["adventure"],
  },
  {
    id: "culture",
    label: "🏛️ Cultura y monumentos",
    description: "Alcazabas, catedrales y arte",
    interests: ["culture"],
  },
  {
    id: "gastronomy",
    label: "🍽️ Gastronomía",
    description: "Tapas, mercados y vino",
    interests: ["gastronomy"],
  },
  {
    id: "romantic",
    label: "💗 Romántico",
    description: "Atardeceres y planes en pareja",
    interests: ["romantic"],
  },
];

export function categoryById(id) {
  return TRIP_CATEGORIES.find((c) => c.id === id) || null;
}