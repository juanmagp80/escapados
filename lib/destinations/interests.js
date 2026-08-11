// Mapa de intereses → destinos del catálogo.
// Cada interés incluye los slugs de destinos que encajan, para ponderar
// el scoring cuando el usuario marca sus preferencias.
export const INTERESTS = {
    romantic: ["granada", "sevilla", "ronda", "venecia", "paris", "santiago-de-compostela", "combarro"],
    gastronomy: ["san-sebastian", "sevilla", "granada", "madrid", "barcelona", "valencia", "logrono", "caceres"],
    nature: ["sierra-nevada", "picos-de-europa", "ordesa", "ancares", "garrotxa", "ronda", "nerja"],
    adventure: ["sierra-nevada", "ancares", "picos-de-europa", "ordesa", "grazalema", "tarifa"],
    culture: ["granada", "cordoba", "sevilla", "baeza", "ubeda", "toledo", "santiago-de-compostela"],
    beach: ["cadiz", "nerja", "tarifa", "conil-de-la-frontera", "vejer-de-la-frontera", "marbella", "benidorm"],
    wellness: ["ancares", "sierra-nevada", "combarro", "caldes-de-montbui"],
    nightlife: ["madrid", "barcelona", "valencia", "sevilla", "bilbao"],
};

// Relationship vibes para cada destino basadas en características conocidas.
export const DESTINATION_VIBES = {
    granada: ["romantic", "culture", "gastronomy"],
    cordoba: ["culture", "romantic", "gastronomy"],
    sevilla: ["romantic", "gastronomy", "nightlife", "culture"],
    cadiz: ["beach", "gastronomy"],
    ronda: ["romantic", "nature", "adventure"],
    nerja: ["beach", "nature", "romantic"],
    frigiliana: ["romantic", "culture", "beach"],
    almeria: ["beach", "nature"],
    jaen: ["gastronomy", "nature"],
    ubeda: ["culture", "romantic"],
    baeza: ["culture", "romantic"],
    antequera: ["culture", "nature"],
    motril: ["beach", "gastronomy"],
    "conil-de-la-frontera": ["beach", "romantic"],
    "vejer-de-la-frontera": ["beach", "romantic", "culture"],
    tarifa: ["beach", "adventure", "nature"],
    marbella: ["beach", "nightlife"],
    estepona: ["beach", "romantic"],
    mijas: ["beach", "romantic"],
    "sierra-nevada": ["nature", "adventure", "romantic"],
    "priego-de-cordoba": ["romantic", "culture", "gastronomy"],
    osuna: ["culture", "romantic"],
    ecija: ["culture"],
    madrid: ["nightlife", "culture", "gastronomy"],
    barcelona: ["nightlife", "culture", "gastronomy", "beach"],
    valencia: ["beach", "gastronomy", "nightlife", "culture"],
    bilbao: ["gastronomy", "culture", "nightlife"],
    zaragoza: ["culture", "gastronomy"],
    "san-sebastian": ["gastronomy", "romantic", "beach"],
    "santiago-de-compostela": ["culture", "romantic", "gastronomy"],
    lisboa: ["romantic", "culture", "gastronomy", "nightlife"],
    porto: ["romantic", "culture", "gastronomy"],
};

// Devuelve los intereses de un destino según el mapa de vibes.
export function destinationInterests(slug) {
    return DESTINATION_VIBES[slug] || [];
}