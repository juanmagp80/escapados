# AGENTS.md — Escapa2

## 1. Descripción del proyecto

**Escapa2** es una aplicación web para planificar escapadas y viajes en pareja.

La aplicación debe permitir introducir:

- Fecha de salida.
- Fecha de regreso.
- Duración del viaje.
- Posibilidad de seleccionar días concretos.
- Número de viajeros.
- Origen del viaje.
- Medio de transporte:
  - Coche.
  - Avión.
  - Opcionalmente otros medios en el futuro.

A partir de esos datos, Escapa2 debe buscar y comparar diferentes opciones de viaje y mostrar una estimación del coste total.

El objetivo es que el usuario pueda responder rápidamente a:

> "¿A dónde podemos escaparnos esos días y cuánto nos costaría?"

El proyecto debe tener una interfaz moderna, sencilla, responsive y especialmente cómoda para utilizar desde móvil.

---

# 2. Stack tecnológico obligatorio

## Frontend

- Next.js
- React
- JavaScript
- Tailwind CSS
- HTML
- CSS

**NO utilizar TypeScript salvo que sea absolutamente imprescindible.**

Utilizar preferentemente:

- Next.js App Router.
- Server Components cuando tenga sentido.
- Client Components solamente cuando sean necesarios.
- Server Actions cuando sean apropiadas.

## Backend

Utilizar el propio backend de Next.js:

- Route Handlers.
- Server Actions.
- Server-side fetching.

No crear inicialmente un backend independiente con Express.

## Base de datos

Utilizar:

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage únicamente si fuese necesario.

## IA

Utilizar la API de:

- Google Gemini

La API key será proporcionada mediante variable de entorno.

Gemini se utilizará principalmente para:

- Crear itinerarios.
- Recomendar lugares.
- Organizar las visitas por días.
- Recomendar restaurantes.
- Adaptar el itinerario al número de días.
- Resumir las mejores opciones de cada destino.

## Búsquedas

Utilizar:

- SerpAPI

La API key será proporcionada mediante variable de entorno.

SerpAPI será utilizada principalmente para realizar búsquedas relacionadas con:

- Alojamientos.
- Vuelos.
- Restaurantes.
- Atracciones.
- Información turística.
- Otros datos que no dispongan de una API especializada.

---

# 3. APIs externas

El proyecto debe diseñarse utilizando APIs gratuitas o con free tier siempre que sea posible.

No asumir que una API gratuita estará disponible indefinidamente.

Crear una capa de abstracción para que cada proveedor pueda sustituirse fácilmente.

## APIs/proveedores recomendados

### SerpAPI

Ya se dispone de una API key.

Variable:

```env
SERPAPI_KEY=
```

Utilizar SerpAPI para búsquedas de:

- Google Hotels.
- Google Flights.
- Google Maps / lugares cuando estén disponibles.
- Google Search.
- Restaurantes.
- Atracciones.

No llamar directamente a SerpAPI desde el navegador.

Todas las llamadas deben pasar por el servidor de Next.js.

---

### Gemini

Variable:

```env
GEMINI_API_KEY=
```

Utilizar Gemini para generación de itinerarios y recomendaciones.

No utilizar Gemini para datos que puedan obtenerse de APIs estructuradas.

Por ejemplo:

Correcto:

```text
API de hoteles -> precio
API de vuelos -> precio
Gemini -> organiza el viaje
```

Incorrecto:

```text
Gemini -> inventa precios de hoteles
```

Gemini nunca debe inventar precios, horarios, vuelos, alojamientos o datos económicos.

---

### Open-Meteo

Utilizar Open-Meteo cuando sea posible para información meteorológica.

No requiere API key para usos normales.

Información útil:

- Temperatura.
- Previsión.
- Lluvia.
- Viento.
- Meteorología del destino.

Esto permitirá mostrar algo como:

```text
🌤️ 22ºC
Probabilidad de lluvia: 15%
```

La meteorología debe utilizarse también como contexto opcional para el itinerario.

---

### OpenStreetMap / Nominatim / Geoapify

Usar `lib/maps/geocoder.js` para geocodificación (Geoapify si `GEOAPIFY_API_KEY` está configurada, con fallback a Nominatim/OpenStreetMap).

Permitir convertir:

```text
Málaga
```

en coordenadas:

```text
36.7213, -4.4214
```

No abusar del servicio.

Implementar cache cuando sea necesario.

---

### OSRM

Utilizar OSRM para calcular rutas por carretera cuando sea posible.

Permite obtener:

- Distancia.
- Duración aproximada.
- Ruta.

Por ejemplo:

```text
Cártama -> Granada

Distancia: 126 km
Duración: 1h 25min
```

Utilizarlo principalmente para cálculos de viaje en coche.

---

### OpenChargeMap

Opcionalmente utilizar OpenChargeMap para mostrar puntos de carga de vehículos eléctricos.

Debe ser una funcionalidad opcional.

No hacer que la aplicación dependa de ella.

---

# 4. Cálculo de viajes en coche

Cuando el usuario seleccione coche, calcular:

### Distancia

```text
origen -> destino
```

### Combustible

Solicitar al usuario:

- Consumo del vehículo en l/100 km.
- Precio aproximado del combustible.

Valores por defecto configurables.

Ejemplo:

```text
Consumo: 6.5 l/100 km
Precio combustible: 1.55 €/l
```

Fórmula:

```text
litros = distancia * consumo / 100
```

```text
coste combustible = litros * precio/litro
```

---

# 5. Peajes

Cuando sea posible, detectar si la ruta puede tener peajes.

Si no existe una API gratuita fiable para obtener el precio:

- No inventar el precio.
- Mostrar:

```text
Peajes: consultar
```

o una estimación claramente marcada como estimación.

Nunca presentar una estimación como precio real.

---

# 6. Gasolineras

Buscar gasolineras próximas al destino y/o a la ruta.

Mostrar:

- Nombre.
- Distancia.
- Precio si está disponible.
- Ubicación.
- Tipo de combustible cuando esté disponible.

Priorizar fuentes/API que proporcionen precios reales.

Si no existe precio actualizado:

```text
Precio no disponible
```

No inventar precios.

---

# 7. BlaBlaCar / compartir coche

La aplicación muestra ofertas **reales** de BlaBlaCar para el trayecto (API oficial `public-api.blablacar.com/api/v3/trips`) y calcula el coste efectivo del coche descontando los ingresos a precio real.

IMPORTANTE:

- Se usa la API oficial de BlaBlaCar (`lib/blablacar/client.js`) que requiere `BLABLACAR_API_KEY` (solicitarla en el formulario "Developer BlaBlaCar API"). Consulta ida y vuelta por coordenadas y fecha.
- Si no hay clave o no hay ofertas para el trayecto, se muestra el simulador manual como respaldo (el usuario introduce precio por pasajero y plazas).
- El adapter vive en `lib/blablacar/` y el endpoint en `app/api/blablacar/route.js`.

Cálculo con precio real:

```text
Combustible (ida y vuelta): 42 €
Precio real BlaBlaCar ida (más barato): 8 €
Precio real BlaBlaCar vuelta (más barato): 7 €
Ingresos = (8 + 7) * plazas libres del coche

Coste efectivo = max(0, 42 - ingresos)
```

Mostrar claramente:

> Precios reales que se están ofertando ahora en BlaBlaCar. No representa una reserva real.

---

# 8. Vuelos

Cuando el usuario seleccione avión, buscar:

- Aeropuerto de origen.
- Aeropuerto de destino.
- Fecha salida.
- Fecha regreso.
- Número de pasajeros.

Mostrar:

- Aerolínea.
- Horarios.
- Duración.
- Escalas.
- Precio.
- Enlace al proveedor cuando sea posible.

No inventar resultados.

Los resultados obtenidos mediante SerpAPI deben conservar la fuente/enlace cuando esté disponible.

---

# 9. Alojamientos

Buscar alojamientos utilizando SerpAPI/Google Hotels u otras fuentes disponibles.

Mostrar:

- Nombre.
- Imagen.
- Precio por noche.
- Precio total si está disponible.
- Valoración.
- Número de noches.
- Ubicación.
- Servicios destacados.
- Enlace de reserva.

Permitir ordenar por:

- Precio.
- Valoración.
- Distancia al centro.
- Recomendación.

---

# 10. Restaurantes

Buscar restaurantes del destino.

Mostrar:

- Nombre.
- Valoración.
- Tipo de cocina.
- Rango de precio.
- Ubicación.
- Horarios cuando estén disponibles.
- Enlace.
- Imágenes cuando estén disponibles.

Categorías:

- Barato.
- Precio medio.
- Especial.
- Romántico.
- Cocina local.
- Vegetariano.
- Tapas.
- Desayuno.

---

# 11. Atracciones

Buscar lugares interesantes:

- Monumentos.
- Museos.
- Miradores.
- Playas.
- Parques.
- Cascos históricos.
- Actividades.
- Experiencias.

Mostrar:

- Nombre.
- Descripción.
- Valoración.
- Ubicación.
- Precio cuando esté disponible.
- Horarios cuando estén disponibles.

---

# 12. Flujo principal de Escapa2

El flujo principal debe ser:

```text
Inicio
   ↓
¿Desde dónde salís?
   ↓
¿Cuándo queréis viajar?
   ↓
¿Cuántas personas?
   ↓
¿Coche o avión?
   ↓
Buscar escapadas
   ↓
Destinos recomendados
   ↓
Seleccionar destino
   ↓
Detalles del viaje
   ↓
Alojamiento
   ↓
Transporte
   ↓
Coste total
   ↓
Itinerario Gemini
```

---

# 13. Pantalla inicial

Crear una home atractiva.

Título:

```text
¿Dónde nos escapamos?
```

Subtítulo:

```text
Encuentra destinos, alojamiento, transporte y planes
para vuestra próxima escapada.
```

Formulario:

```text
Origen
Fecha de salida
Fecha de regreso
Viajeros
Transporte
Presupuesto aproximado
```

Botón:

```text
Buscar escapadas
```

Permitir seleccionar:

### Fin de semana

Ejemplos:

```text
Viernes → Domingo
Sábado → Domingo
```

### Días concretos

Ejemplo:

```text
15 agosto → 18 agosto
```

---

# 14. Generación de destinos

Si el usuario no proporciona destino concreto:

Escapa2 debe generar posibles destinos.

Ejemplo:

```text
Origen: Cártama
Fechas: 15-18 agosto
2 personas
Coche
```

Resultados:

```text
Granada
Córdoba
Sevilla
Cádiz
Ronda
Nerja
Frigiliana
Almería
Jaén
etc.
```

No limitarse exclusivamente a destinos cercanos.

Calcular distancia máxima razonable según duración.

Ejemplo:

### 2 días

Priorizar:

```text
0-250 km
```

### 3-4 días

```text
0-500 km
```

### 5-7 días

```text
0-800 km
```

Estos valores deben ser configurables.

---

# 15. Tarjeta de destino

Cada destino debe tener una tarjeta visual.

Ejemplo:

```text
┌───────────────────────────────┐
│          IMAGEN               │
│                               │
│ Granada                       │
│ ⭐ 4.7                         │
│                               │
│ 🚗 1h 20min                   │
│ 🏨 Desde 65 €/noche           │
│ 🍽️ Desde 15 €                 │
│ ☀️ 27ºC                       │
│                               │
│ Coste estimado para 2         │
│ personas: 240 €               │
│                               │
│       VER ESCAPADA            │
└───────────────────────────────┘
```

---

# 16. Coste total

Crear un sistema de cálculo de coste.

Ejemplo:

```text
ALOJAMIENTO
3 noches x 70 €
= 210 €

TRANSPORTE
Combustible
= 45 €

Peajes
= 0 €

COMIDAS
Estimación
= 120 €

ACTIVIDADES
= 50 €

────────────────

TOTAL
425 €

POR PERSONA
212,50 €
```

Separar:

### Costes conocidos

Datos proporcionados por APIs.

### Costes estimados

Cálculos realizados por Escapa2.

Mostrar claramente la diferencia.

---

# 17. Presupuesto

Permitir al usuario introducir:

```text
Presupuesto máximo
```

Ejemplo:

```text
300 €
```

Los resultados deben poder clasificarse:

```text
🟢 Dentro del presupuesto

🟡 Cerca del presupuesto

🔴 Por encima del presupuesto
```

---

# 18. Página de detalle

Ruta:

```text
/destinos/[slug]
```

Debe contener:

### Cabecera

- Imagen.
- Nombre.
- Descripción.
- Fechas.

### Transporte

- Coche.
- Avión.
- Coste.

### Alojamientos

Lista de opciones.

### Qué ver

Atracciones.

### Dónde comer

Restaurantes.

### Meteorología

Previsión.

### Coste total

Resumen económico.

### Itinerario

Generado por Gemini.

---

# 19. Gemini — itinerarios

Cuando el usuario seleccione un destino:

Enviar a Gemini información estructurada.

Ejemplo:

```json
{
  "destination": "Granada",
  "startDate": "2026-08-15",
  "endDate": "2026-08-18",
  "travelers": 2,
  "budget": 400,
  "weather": {},
  "attractions": [],
  "restaurants": []
}
```

Gemini debe devolver JSON estructurado.

Ejemplo:

```json
{
  "summary": "...",
  "days": [
    {
      "day": 1,
      "title": "Centro histórico",
      "activities": [
        {
          "time": "10:00",
          "name": "Alhambra",
          "description": "...",
          "duration": "3h"
        }
      ],
      "restaurants": []
    }
  ]
}
```

Nunca aceptar respuestas no estructuradas si pueden romper la interfaz.

Validar la respuesta antes de mostrarla.

---

# 20. Prompt de Gemini

Crear un servicio específico:

```text
lib/ai/gemini.js
```

No colocar prompts gigantes dentro de componentes React.

El prompt debe indicar a Gemini:

- No inventar precios.
- No inventar horarios.
- No inventar disponibilidad.
- Utilizar únicamente los datos proporcionados.
- Si falta información, indicarlo.
- Optimizar desplazamientos.
- Evitar recorridos innecesarios.
- Adaptar las actividades al número de días.
- Priorizar lugares importantes.
- Incluir tiempo libre.
- Recomendar restaurantes próximos a las actividades.
- Tener en cuenta meteorología cuando exista.
- Adaptar el itinerario a pareja.
- Evitar sobrecargar los días.

---

# 21. Base de datos Supabase

Diseñar inicialmente las siguientes tablas.

## profiles

```text
id
user_id
name
created_at
```

## trips

```text
id
user_id
origin
destination
start_date
end_date
travelers
transport
budget
created_at
```

## saved_destinations

```text
id
user_id
destination
country
latitude
longitude
created_at
```

## saved_trips

```text
id
user_id
trip_id
created_at
```

## preferences

```text
id
user_id
preferred_transport
max_budget
preferred_trip_duration
created_at
updated_at
```

No guardar resultados temporales de APIs en Supabase salvo que sea necesario.

---

# 22. Autenticación

Utilizar Supabase Auth.

Permitir inicialmente:

- Email/password.
- Login con Google si se decide implementarlo.

Pero la aplicación debe poder utilizarse inicialmente sin registrarse para realizar búsquedas.

El login será necesario para:

- Guardar viajes.
- Guardar destinos.
- Guardar preferencias.
- Recuperar itinerarios.

---

# 23. RLS

Activar Row Level Security.

Un usuario solamente podrá acceder a:

```text
sus propios viajes
sus propios favoritos
sus propias preferencias
```

Nunca confiar únicamente en comprobaciones del frontend.

Las reglas deben estar implementadas en Supabase.

---

# 24. Arquitectura del proyecto

Utilizar una estructura similar a:

```text
escapa2/
│
├── app/
│   ├── page.js
│   ├── buscar/
│   │   └── page.js
│   ├── destinos/
│   │   └── [slug]/
│   │       └── page.js
│   ├── viajes/
│   │   ├── page.js
│   │   └── [id]/
│   │       └── page.js
│   ├── favoritos/
│   │   └── page.js
│   └── api/
│       ├── search/
│       ├── hotels/
│       ├── flights/
│       ├── routes/
│       ├── weather/
│       ├── places/
│       ├── fuel/
│       └── itinerary/
│
├── components/
│   ├── search/
│   ├── destinations/
│   ├── hotels/
│   ├── flights/
│   ├── itinerary/
│   ├── budget/
│   └── ui/
│
├── lib/
│   ├── supabase/
│   ├── serpapi/
│   ├── gemini/
│   ├── weather/
│   ├── maps/
│   ├── routing/
│   ├── fuel/
│   └── utils/
│
├── hooks/
│
├── types/
│
├── public/
│
├── supabase/
│   └── migrations/
│
├── .env.local
├── .env.example
├── AGENTS.md
├── package.json
└── README.md
```

---

# 25. Capa de proveedores

Es MUY IMPORTANTE no acoplar toda la aplicación a una única API.

Crear interfaces/adapters conceptualmente similares a:

```text
HotelProvider
FlightProvider
WeatherProvider
PlacesProvider
RoutingProvider
GeocodingProvider
```

Ejemplo:

```text
SerpApiHotelProvider
OpenMeteoWeatherProvider
OSRMRouteProvider
NominatimGeocodingProvider
```

Esto permitirá sustituir proveedores posteriormente.

---

# 26. Variables de entorno

Crear:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

SERPAPI_KEY=

GEMINI_API_KEY=
```

No subir `.env.local` a Git.

Crear:

```text
.env.example
```

con las variables necesarias pero sin secretos.

---

# 27. Seguridad

Nunca exponer:

```text
SERPAPI_KEY
GEMINI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

al navegador.

Nunca utilizar:

```javascript
process.env.SERPAPI_KEY
```

dentro de un Client Component.

Las APIs externas deben ser llamadas desde:

```text
Route Handlers
```

o:

```text
Server Actions
```

---

# 28. Gestión de errores

Todas las APIs externas pueden fallar.

La aplicación debe continuar funcionando aunque una API no responda.

Ejemplo:

```text
SerpAPI ❌
Open-Meteo ✅
OSRM ✅
Gemini ❌
```

La aplicación debe mostrar:

```text
No hemos podido obtener algunos datos.
Puedes continuar viendo el resto de la escapada.
```

Nunca mostrar errores técnicos al usuario.

No utilizar:

```text
TypeError: Cannot read properties of undefined
```

como mensaje de interfaz.

---

# 29. Loading states

Todas las búsquedas deben tener estados de carga.

Ejemplo:

```text
Buscando escapadas...
```

Utilizar skeletons cuando sea posible.

No bloquear toda la interfaz esperando a que todas las APIs terminen.

Mostrar resultados progresivamente cuando tenga sentido.

---

# 30. Caché

Evitar realizar llamadas innecesarias a las APIs.

Aplicar caching cuando sea posible.

Especialmente para:

- Geocodificación.
- Meteorología.
- Destinos.
- Información turística.
- Resultados que no cambien frecuentemente.

No almacenar indefinidamente precios de vuelos/hoteles.

Los precios deben considerarse temporales.

---

# 31. Rate limiting

Implementar mecanismos básicos para evitar abuso de las APIs.

Especialmente:

```text
/api/search
/api/itinerary
```

No permitir que un usuario pueda realizar cientos de peticiones simultáneas.

---

# 32. UX

La aplicación debe ser:

- Moderna.
- Minimalista.
- Rápida.
- Mobile-first.
- Responsive.
- Fácil de entender.

No crear una interfaz excesivamente empresarial.

Debe transmitir:

```text
viaje
escapada
pareja
descubrimiento
ocio
```

Utilizar tarjetas, imágenes, mapas y elementos visuales.

---

# 33. Diseño

Nombre:

# Escapa2

Logo conceptual:

```text
Escapa²
```

o:

```text
Escapa2
```

La identidad visual debe ser sencilla y reconocible.

Usar iconos para:

```text
🚗 transporte
✈️ vuelos
🏨 hoteles
🍽️ restaurantes
📍 lugares
☀️ meteorología
💰 presupuesto
❤️ favoritos
```

No abusar de emojis en la interfaz final; utilizar una librería de iconos cuando sea apropiado.

---

# 34. Página principal

Debe tener un diseño similar conceptualmente a:

```text
                 Escapa2

       ¿Dónde nos escapamos?

 Encuentra vuestra próxima escapada
       sin perder horas buscando.

 ┌────────────────────────────────────┐
 │ 📍 Desde                           │
 │ Cártama                            │
 ├────────────────────────────────────┤
 │ 📅 Fechas                          │
 │ 15 Ago → 18 Ago                    │
 ├────────────────────────────────────┤
 │ 👥 Viajeros                        │
 │ 2                                  │
 ├────────────────────────────────────┤
 │ 🚗 Transporte                      │
 │ Coche                              │
 └────────────────────────────────────┘

        [ Buscar escapadas ]

       💡 ¿No sabes dónde ir?
       Nosotros buscamos por ti.
```

---

# 35. Comparador

La aplicación debe permitir comparar destinos.

Ejemplo:

| Destino | Transporte | Hotel | Comida | Total |
|---|---:|---:|---:|---:|
| Granada | 45 € | 210 € | 120 € | 375 € |
| Córdoba | 38 € | 180 € | 110 € | 328 € |
| Cádiz | 52 € | 240 € | 130 € | 422 € |

Permitir ordenar por:

- Precio.
- Distancia.
- Valoración.
- Mejor opción.
- Tiempo de viaje.

---

# 36. "Mejor escapada"

Crear un algoritmo de puntuación.

Ejemplo:

```text
score =
  precio +
  distancia +
  valoración +
  duración +
  interés turístico
```

No hace falta que sea perfecto inicialmente.

Debe estar implementado de forma modular para poder mejorarlo posteriormente.

Mostrar:

```text
🏆 Nuestra recomendación
```

---

# 37. Itinerario

El resultado de Gemini debe mostrarse visualmente.

Ejemplo:

```text
DÍA 1
────────────────────

09:30
☕ Desayuno

10:30
🏛️ Visita al centro histórico

13:30
🍽️ Almuerzo

16:00
🌳 Paseo

20:30
🍷 Cena
```

Cada actividad debe poder mostrar:

- Hora.
- Duración.
- Lugar.
- Descripción.
- Distancia desde el punto anterior.
- Enlace al mapa si existe.

---

# 38. No inventar información

REGLA CRÍTICA.

El sistema no debe inventar:

- Precios.
- Hoteles.
- Vuelos.
- Horarios.
- Restaurantes.
- Disponibilidad.
- Gasolineras.
- Distancias.

Cuando un dato sea estimado:

```text
Estimación
```

Cuando no exista:

```text
No disponible
```

Cuando venga de una fuente externa:

```text
Fuente: Google Hotels
```

o la fuente correspondiente.

---

# 39. Desarrollo por fases

No intentar desarrollar toda la aplicación de golpe.

## Fase 1 — MVP

Implementar:

1. Next.js.
2. Tailwind.
3. Home.
4. Formulario de búsqueda.
5. Destinos.
6. SerpAPI.
7. Open-Meteo.
8. OSRM.
9. Cálculo de coche.
10. Resultados básicos.

---

## Fase 2

Implementar:

1. Hoteles.
2. Vuelos.
3. Restaurantes.
4. Atracciones.
5. Comparador.
6. Presupuesto.

---

## Fase 3

Implementar:

1. Supabase.
2. Auth.
3. Favoritos.
4. Guardar viajes.
5. Historial.

---

## Fase 4

Implementar:

1. Gemini.
2. Itinerarios.
3. Recomendaciones.
4. Restaurantes adaptados al itinerario.
5. Optimización por días.

---

## Fase 5

Implementar:

1. Mejor algoritmo de recomendación.
2. Mapas.
3. Gasolineras.
4. Compartir coche.
5. Optimización de rutas.
6. Mejoras UX.

---

# 40. Testing

Crear tests para:

- Cálculo de combustible.
- Cálculo de costes.
- Cálculo de ingresos por pasajeros.
- Fechas.
- Número de noches.
- Puntuación de destinos.
- Validación de respuestas de APIs.
- Parsing de Gemini.

Ejemplo:

```text
distancia = 300 km
consumo = 6 l/100km
precio = 1.50 €/l
```

Resultado:

```text
27 €
```

---

# 41. Git

Utilizar commits pequeños y descriptivos.

Ejemplos:

```text
feat: create trip search form
feat: add serpapi hotel provider
feat: add osrm route calculation
feat: add weather service
feat: add supabase authentication
feat: add gemini itinerary generator
fix: handle missing hotel prices
```

No hacer commits gigantes con toda la aplicación.

---

# 42. README

Crear un README completo que explique:

- Qué es Escapa2.
- Tecnologías.
- Instalación.
- Variables de entorno.
- APIs utilizadas.
- Configuración de Supabase.
- Cómo ejecutar el proyecto.
- Arquitectura.
- Limitaciones conocidas.

---

# 43. Principios de desarrollo

Prioridades:

```text
1. Funcionalidad
2. Seguridad
3. Experiencia de usuario
4. Arquitectura mantenible
5. Rendimiento
```

No sobreingenierizar el proyecto.

Preferir código sencillo y fácil de mantener.

No crear abstracciones innecesarias.

---

# 44. Regla para el agente de IA

Antes de implementar una funcionalidad:

1. Analizar el código existente.
2. Comprobar qué servicios ya existen.
3. Reutilizar componentes.
4. No duplicar lógica.
5. Comprobar las variables de entorno.
6. Comprobar si existe un adapter para la API.
7. Implementar la funcionalidad.
8. Ejecutar lint.
9. Ejecutar tests cuando existan.
10. Comprobar que la aplicación compila.

No eliminar funcionalidades existentes para solucionar un problema.

No cambiar la arquitectura completa sin una razón clara.

---

# 45. Regla sobre APIs

Antes de integrar una API externa:

1. Comprobar que es realmente pública.
2. Comprobar sus límites.
3. Comprobar si requiere API key.
4. Comprobar si tiene free tier.
5. Comprobar qué datos devuelve.
6. Crear un adapter.
7. Implementar manejo de errores.
8. Implementar fallback cuando sea posible.

No asumir que una API dispone de endpoints simplemente porque otra aplicación ofrece esa información.

---

# 46. Objetivo final

Escapa2 debe convertirse en un asistente de escapadas.

El usuario debería poder entrar y decir:

```text
Somos 2.
Salimos desde Cártama.
Tenemos libre del 15 al 18 de agosto.
Queremos gastar como máximo 400 €.
Preferimos coche.
```

Y Escapa2 debería devolver:

```text
🏆 5 escapadas recomendadas

1. Granada
   375 €
   ⭐ Mejor opción

2. Córdoba
   328 €
   💰 Más económica

3. Cádiz
   422 €
   🌊 Mejor para playa

...

```

Después de seleccionar Granada:

```text
🏨 Hoteles
🚗 Ruta
⛽ Gasolineras
💰 Coste coche
👥 Coste compartiendo coche
🍽️ Restaurantes
🏛️ Qué ver
☀️ Meteorología
🗺️ Mapa
🤖 Itinerario personalizado
```

Y finalmente:

```text
          TU ESCAPADA

           GRANADA

       15 → 18 AGOSTO

          375 € total
          187,50 €/persona

        ─────────────

        DÍA 1
        Centro histórico

        DÍA 2
        Alhambra + Albaicín

        DÍA 3
        Sacromonte + miradores

        DÍA 4
        Desayuno + regreso
```

El objetivo no es crear simplemente un buscador.

**El objetivo es crear una herramienta que reduzca al mínimo el tiempo necesario para decidir dónde ir, cuánto costará y qué hacer allí.**