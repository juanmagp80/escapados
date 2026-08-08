export async function getWeather(lat, lon) {
  if (lat === undefined || lon === undefined) return null;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,precipitation_probability,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("weather failed");
  return res.json();
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
