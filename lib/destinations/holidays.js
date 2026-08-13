import { addDaysIso, localIso } from "@/lib/utils/format";

// Festivos en España (nacionales obligatorios + algunos regionales habituales).
// Sin llamadas a APIs: los festivos variables (Semana Santa) se calculan a
// partir del domingo de Pascua (algoritmo gregoriano anónimo).
// Fuentes: art. 37.2 del E.T. y calendarios de las comunidades autónomas.
// Nota: hay 1-2 festivos regionales más por cada comunidad; aquí se incluyen
// los más extendidos para que la detección de puentes no dependa de una API.

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Festivo derivado de la Pascua.
function easterOffset(easter, days, name, kind) {
  return [{ date: addDaysIso(easter, days), name, kind }];
}

// Festivos nacionales fijos (cuando caen en día laborable el calendario
// laboral los traslada, pero para planificar la fecha es la correcta).
const FIXED_NATIONAL = [
  ["01-01", "Año Nuevo"],
  ["01-06", "Epifanía del Señor"],
  ["05-01", "Fiesta del Trabajo"],
  ["08-15", "Asunción de la Virgen"],
  ["10-12", "Fiesta Nacional de España"],
  ["11-01", "Todos los Santos"],
  ["12-06", "Día de la Constitución"],
  ["12-08", "Inmaculada Concepción"],
  ["12-25", "Navidad"],
];

// Festivos regionales habituales (no están en todas las comunidades).
const REGIONAL = [
  ["02-28", "Día de Andalucía"],
  ["03-19", "San José"],
  ["06-24", "San Juan"],
  ["07-07", "San Fermín"],
  ["07-25", "Santiago Apóstol"],
  ["12-26", "San Esteban"],
];

export function getHolidays(year) {
  const easter = easterSunday(year);
  const list = [
    ...FIXED_NATIONAL.map(([mmdd, name]) => ({
      date: `${year}-${mmdd}`,
      name,
      kind: "national",
    })),
    ...easterOffset(easter, -3, "Jueves Santo", "regional"),
    ...easterOffset(easter, -2, "Viernes Santo", "national"),
    ...easterOffset(easter, 1, "Lunes de Pascua", "regional"),
    ...REGIONAL.map(([mmdd, name]) => ({
      date: `${year}-${mmdd}`,
      name,
      kind: "regional",
    })),
  ];
  return list.sort((a, b) => (a.date < b.date ? -1 : 1));
}

function getEasterYearOf(dateIso) {
  const d = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

function isWeekend(dateIso) {
  const d = new Date(`${dateIso}T12:00:00`);
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

export function dayOfWeekLabel(dateIso) {
  const d = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })
    .replace(/^./, (c) => c.toUpperCase());
}

// Analiza si el rango [startDate, endDate] coincide con festivos y si forma
// un "puente" (festivo en día laborable dentro del viaje).
export function analyzeBridge(startDate, endDate) {
  if (!startDate || !endDate) return null;
  if (startDate > endDate) return null;

  const year = getEasterYearOf(startDate);
  if (!year) return null;

  // Cubre el rango completo aunque atraviese dos años.
  const years = new Set([year, getEasterYearOf(endDate)].filter(Boolean));
  const holidaysByDate = new Map();
  for (const y of years) {
    for (const h of getHolidays(y)) holidaysByDate.set(h.date, h);
  }

  const inTrip = [];
  let d = startDate;
  while (d <= endDate) {
    const h = holidaysByDate.get(d);
    if (h) inTrip.push({ ...h, day: dayOfWeekLabel(d), isWeekend: isWeekend(d) });
    d = addDaysIso(d, 1);
  }

  if (inTrip.length === 0) return { isBridge: false, holidays: [] };

  // Puente: festivo en día laborable (viernes, lunes, jueves o martes)
  // dentro del viaje. Un festivo en sábado/domingo no alarga el fin de semana.
  const workdayHolidays = inTrip.filter((h) => !h.isWeekend);
  const isBridge = workdayHolidays.length > 0;

  const bridgeWorkday = workdayHolidays[0];
  return {
    isBridge,
    holidays: inTrip.map((h) => ({
      date: h.date,
      name: h.name,
      kind: h.kind,
      day: h.day,
    })),
    holidayWorkdays: workdayHolidays.map((h) => ({
      date: h.date,
      name: h.name,
      day: h.day,
    })),
    bridgeHint: isBridge
      ? `Puente: ${bridgeWorkday.name} es fiesta (${bridgeWorkday.day})`
      : null,
  };
}

// Última fecha de festivo del año dada (helpers de calendario/quick picks).
export function holidaysInWindow(startIso, endIso) {
  const bridge = analyzeBridge(startIso, endIso);
  return bridge?.isBridge ? bridge.bridgeHint : null;
}

// Ventana de escapada recomendada en torno a un festivo laborable.
// Jue: jueves→domingo · Vie: jueves→domingo · Lun: jueves→lunes · Mar: viernes→martes
function suggestBridgeWindow(holidayDate) {
  const d = new Date(`${holidayDate}T12:00:00`);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return null;
  const outbound =
    dow === 4 ? holidayDate : dow === 5 ? addDaysIso(holidayDate, -1) : addDaysIso(holidayDate, -4);
  const returnDate = addDaysIso(holidayDate, dow === 4 ? 3 : dow === 5 ? 2 : 0);
  return { outbound, returnDate, nights: nightsBetween(outbound, returnDate) };
}

// Siguiente puente en los próximos `horizonDays` días a partir de `fromIso`.
// Devuelve el primer festivo laborable con su ventana de escapada, o null si
// no hay ninguno. Útil para las notificaciones push de los jueves.
export function nextPuente(fromIso, horizonDays = 45) {
  if (!fromIso) return null;
  const year = getEasterYearOf(fromIso);
  if (!year) return null;

  const holidays = [...getHolidays(year), ...getHolidays(year + 1)];
  const max = addDaysIso(fromIso, Number(horizonDays) || 45);

  for (const h of holidays) {
    if (h.date < fromIso || h.date > max) continue;
    const window = suggestBridgeWindow(h.date);
    if (!window) continue;
    return {
      holiday: { date: h.date, name: h.name, day: dayOfWeekLabel(h.date) },
      window,
    };
  }
  return null;
}

function nightsBetween(start, end) {
  if (!start || !end) return 0;
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  return Math.round((b - a) / 86400000);
}

// Fecha local de hoy, útil para módulos de calendario.
export { localIso };