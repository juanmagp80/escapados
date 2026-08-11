import { generateItinerary, generatePlaces } from "@/lib/ai/gemini";
import { getWeather } from "@/lib/weather/openMeteo";
import { geocode } from "@/lib/maps/geocoder";
import { withFallback } from "@/lib/utils/cache";

export async function buildItinerary({ destination, startDate, endDate, travelers, budget }) {
  const coords = await withFallback(() => geocode(destination), null);

  const [attractions, restaurants, weather] = await Promise.all([
    withFallback(
      () => generatePlaces({ q: destination, category: "attractions" }),
      { items: [] }
    ),
    withFallback(
      () => generatePlaces({ q: destination, category: "restaurants" }),
      { items: [] }
    ),
    coords
      ? withFallback(() => getWeather(coords.lat, coords.lon), null)
      : null,
  ]);

  const weatherSummary = weather
    ? {
        current: weather.current
          ? {
              temperature: weather.current.temperature_2m,
              rain: weather.current.precipitation_probability,
            }
          : null,
        daily: weather.daily
          ? weather.daily.time?.slice(0, 7).map((t, i) => ({
              date: t,
              max: weather.daily.temperature_2m_max?.[i],
              min: weather.daily.temperature_2m_min?.[i],
            }))
          : null,
      }
    : null;

  const itinerary = await generateItinerary({
    destination,
    startDate,
    endDate,
    travelers,
    budget,
    weather: weatherSummary,
    attractions: attractions.items || [],
    restaurants: restaurants.items || [],
  });

  return itinerary;
}
