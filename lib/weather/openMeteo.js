export async function getWeather(lat, lon) {
  if (lat === undefined || lon === undefined) return null;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,precipitation_probability,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max,sunrise,sunset,daylight_duration");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("weather failed");
  return res.json();
}

// Calidad del aire (Open-Meteo Air Quality). Gratis, sin API key.
export async function getAirQuality(lat, lon) {
  if (lat === undefined || lon === undefined) return null;
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "us_aqi,pm2_5,pm10,ozone");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("air quality failed");
  const data = await res.json();
  return data?.current || null;
}

// Océano: temperatura del agua y altura de ola (relevante para costa).
export async function getMarine(lat, lon) {
  if (lat === undefined || lon === undefined) return null;
  const url = new URL("https://marine-api.open-meteo.com/v1/marine");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("daily", "sea_surface_temperature_max,wave_height_max");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("marine failed");
  const data = await res.json();
  return data?.daily || null;
}

// Etiqueta de la calidad del aire (índice US AQI) en español.
export function describeAirQuality(usAqi) {
  if (usAqi === null || usAqi === undefined || Number.isNaN(usAqi)) return null;
  if (usAqi <= 50) return { label: "Buena", emoji: "🟢" };
  if (usAqi <= 100) return { label: "Moderada", emoji: "🟡" };
  if (usAqi <= 150) return { label: "Algo insalubre", emoji: "🟠" };
  return { label: "Insalubre", emoji: "🔴" };
}

// Índice UV según escala estándar.
export function describeUvIndex(uv) {
  if (uv === null || uv === undefined || Number.isNaN(uv)) return null;
  if (uv < 3) return { label: "Bajo", emoji: "🟢" };
  if (uv < 6) return { label: "Moderado", emoji: "🟡" };
  if (uv < 8) return { label: "Alto", emoji: "🟠" };
  if (uv < 11) return { label: "Muy alto", emoji: "🔴" };
  return { label: "Extremo", emoji: "🟣" };
}

// Hora (HH:MM) de una fecha ISO de Open-Meteo en la zona horaria local del sitio.
export function timeOfDay(iso) {
  if (!iso) return null;
  return iso.slice(11, 16);
}

const WEATHER_CODES = {
  0: { label: "Despejado", emoji: "☀️" },
  1: { label: "Mayormente despejado", emoji: "🌤️" },
  2: { label: "Parcialmente nuboso", emoji: "⛅" },
  3: { label: "Nuboso", emoji: "☁️" },
  45: { label: "Niebla", emoji: "🌫️" },
  48: { label: "Niebla helada", emoji: "🌫️" },
  51: { label: "Llovizna leve", emoji: "🌦️" },
  53: { label: "Llovizna", emoji: "🌦️" },
  55: { label: "Llovizna intensa", emoji: "🌧️" },
  61: { label: "Lluvia leve", emoji: "🌧️" },
  63: { label: "Lluvia", emoji: "🌧️" },
  65: { label: "Lluvia intensa", emoji: "🌧️" },
  66: { label: "Lluvia helada", emoji: "🌧️" },
  67: { label: "Lluvia helada intensa", emoji: "🌧️" },
  71: { label: "Nieve leve", emoji: "🌨️" },
  73: { label: "Nieve", emoji: "🌨️" },
  75: { label: "Nieve intensa", emoji: "❄️" },
  80: { label: "Chubascos", emoji: "🌦️" },
  81: { label: "Chubascos", emoji: "🌧️" },
  82: { label: "Chubascos intensos", emoji: "⛈️" },
  95: { label: "Tormenta", emoji: "⛈️" },
  96: { label: "Tormenta con granizo", emoji: "⛈️" },
  99: { label: "Tormenta con granizo", emoji: "⛈️" },
};

export function describeWeatherCode(code) {
  return WEATHER_CODES[code] || { label: "Tiempo variable", emoji: "🌡️" };
}

// Códigos que implican lluvia o mal tiempo (para el Plan B meteorológico).
const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

export function isRainyCode(code) {
  return RAIN_CODES.has(code);
}

// Devuelve las fechas con lluvia en el pronóstico diario.
export function rainyDays(forecast) {
  if (!forecast?.daily?.time) return [];
  const { time, precipitation_probability_max, weather_code } = forecast.daily;
  return time
    .map((t, i) => ({
      date: t,
      precip: precipitation_probability_max?.[i] ?? 0,
      code: weather_code?.[i],
    }))
    .filter((d) => isRainyCode(d.code) || d.precip >= 60);
}

// ¿El viaje coincide con días de lluvia? Devuelve las fechas afectadas.
export function tripRainyDays(forecast, startDate, endDate) {
  if (!startDate || !endDate) return [];
  return rainyDays(forecast).filter((d) => d.date >= startDate && d.date <= endDate);
}
