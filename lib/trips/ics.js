import { localIso } from "@/lib/utils/format";

// Genera un evento .ics (todo el día) para un viaje guardado.
export function formatICSDate(dateStr) {
  if (!dateStr) return "";
  return String(dateStr).replace(/-/g, "");
}

export function buildTripICS({
  id = "",
  origin = "",
  destination = "",
  startDate = "",
  endDate = "",
  travelers = 2,
  transport = "car",
  budget = null,
}) {
  const today = new Date();
  const stamp = `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, "0")}${String(today.getUTCDate()).padStart(2, "0")}T${String(today.getUTCHours()).padStart(2, "0")}${String(today.getUTCMinutes()).padStart(2, "0")}${String(today.getUTCSeconds()).padStart(2, "0")}Z`;

  const start = formatICSDate(startDate);
  const end = new Date(`${endDate}T12:00:00`);
  end.setDate(end.getDate() + 1);
  const endICS = formatICSDate(localIso(end));

  const summary = `Escapada a ${destination}${origin ? ` (salida desde ${origin})` : ""}`;
  let description = `${travelers} viajero(s) · ${transport === "car" ? "Coche" : "Avión"}`;
  if (budget) description += ` · Presupuesto: ${budget} €`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Escapa2//ES//",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:escapa2-${id || Date.now()}@escapa2.es`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${endICS}`,
    `SUMMARY:${summary}`,
    "DESCRIPTION:" + description.replace(/[\r\n]/g, " "),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // El estándar termina cada línea con CRLF.
  return lines.join("\r\n") + "\r\n";
}