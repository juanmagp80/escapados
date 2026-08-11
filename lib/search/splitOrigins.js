// Separa la cadena de orígenes ("Málaga, Granada") en un array.
// Módulo puro: sin dependencias de Node ni de servidor, importable desde el
// cliente sin arrastrar runSearch ni la caché persistente.
export function splitOrigins(value) {
  return String(value || "")
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}