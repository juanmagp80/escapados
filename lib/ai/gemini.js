const GEMINI_KEY = process.env.GEMINI_API_KEY;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export function buildItineraryPrompt(input) {
  const {
    destination,
    startDate,
    endDate,
    travelers,
    budget,
    weather,
    attractions = [],
    restaurants = [],
  } = input;

  const weatherText = weather
    ? `Meteorología prevista: ${JSON.stringify(weather)}`
    : "Meteorología no disponible.";

  const attractionsText = attractions.length
    ? attractions.map((a) => `- ${a.name}${a.type ? " (" + a.type + ")" : ""}`).join("\n")
    : "Sin lugares sugeridos.";

  const restaurantsText = restaurants.length
    ? restaurants.map((r) => `- ${r.name}`).join("\n")
    : "Sin restaurantes sugeridos.";

  return `Eres un planificador de escapadas para parejas. Genera un itinerario para:
Destino: ${destination}
Fecha inicio: ${startDate}
Fecha fin: ${endDate}
Viajeros: ${travelers}
Presupuesto: ${budget ? budget + " EUR" : "no especificado"}

${weatherText}

Lugares de interés conocidos:
${attractionsText}

Restaurantes conocidos:
${restaurantsText}

REGLAS ESTRICTAS (crítico):
- NO inventes precios, horarios de apertura, disponibilidad ni datos económicos.
- NO inventes lugares que no aparezcan en las listas proporcionadas. Si necesitas sugerir algo genérico, márcalo como "sugerido".
- Usa ÚNICAMENTE los datos proporcionados.
- Si falta información, indícalo en el campo "notes".
- Optimiza desplazamientos, evita recorridos innecesarios.
- Adapta las actividades al número de días.
- Prioriza lugares importantes y emblemáticos.
- Incluye tiempo libre.
- Recomienda restaurantes próximos a las actividades del día.
- Ten en cuenta la meteorología cuando exista.
- Adapta el itinerario a pareja; evita sobrecargar los días.
- Responde SOLO con JSON válido, sin texto adicional, sin markdown.

Formato JSON exacto:
{
  "summary": "string",
  "notes": "string",
  "days": [
    {
      "day": 1,
      "title": "string",
      "activities": [
        { "time": "10:00", "name": "string", "description": "string", "duration": "2h" }
      ],
      "restaurants": [ "string" ]
    }
  ]
}`;
}

export async function generateItinerary(input) {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not configured");

  const prompt = buildItineraryPrompt(input);
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  };

  const res = await fetch(`${ENDPOINT}?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`gemini failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("gemini empty response");
  return parseItinerary(text);
}

export function parseItinerary(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("invalid itinerary json");
    json = JSON.parse(match[0]);
  }
  if (!json || !Array.isArray(json.days)) {
    throw new Error("itinerary missing days");
  }
  return {
    summary: typeof json.summary === "string" ? json.summary : "",
    notes: typeof json.notes === "string" ? json.notes : "",
    days: json.days
      .map((d) => ({
        day: Number(d.day) || 0,
        title: typeof d.title === "string" ? d.title : "",
        activities: Array.isArray(d.activities)
          ? d.activities.map((a) => ({
              time: typeof a.time === "string" ? a.time : "",
              name: typeof a.name === "string" ? a.name : "",
              description: typeof a.description === "string" ? a.description : "",
              duration: typeof a.duration === "string" ? a.duration : "",
            }))
          : [],
        restaurants: Array.isArray(d.restaurants) ? d.restaurants : [],
      }))
      .filter((d) => d.day > 0),
  };
}
