# Escapa2

Asistente para planificar escapadas y viajes en pareja. Responde a:
**"¿A dónde podemos escaparnos esos días y cuánto nos costaría?"**

## Tecnologías

- **Next.js 14** (App Router) + React + JavaScript (sin TypeScript)
- **Tailwind CSS** (mobile-first, responsive)
- **Supabase** (PostgreSQL + Auth + Row Level Security)
- **SerpAPI** (Google Hotels, Google Flights, Google Maps)
- **Open-Meteo** (meteorología, sin API key)
- **OSRM** (rutas en coche, sin API key)
- **Wikipedia + Wikimedia Commons** (descripciones y fotos reales de cada destino, sin API key)
- **Geoapify / Nominatim** (geocodificación, con fallback)
- **Gemini 2.5 Flash** (restaurantes, atracciones e itinerarios IA)
- **Overpass API** (gasolineras, OpenStreetMap)
- **Leaflet** (mapas interactivos)
- **PWA** (Service Worker, manifest, instalable)

## Instalación

```bash
# Clonar e instalar dependencias
git clone <repo>
cd escapa2
npm install --legacy-peer-deps

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves

# Ejecutar en desarrollo
npm run dev
# Abre http://localhost:3000 (o http://<IP-LAN>:3000 en móvil)
```

## Variables de entorno (`.env.local`)

```env
# Supabase (obligatorio para auth y guardado)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Solo servidor

# SerpAPI (Google Hotels, Flights, Maps)
SERPAPI_KEY=tu_clave_serpapi

# Gemini (recomendaciones e itinerarios IA)
GEMINI_API_KEY=tu_clave_gemini
GEMINI_MODEL=gemini-2.5-flash  # Opcional, por defecto gemini-2.5-flash

# BlaBlaCar (precios reales de coche compartido, API oficial)
# Solicitar clave: https://support.blablacar.com/hc/es (Formulario "Developer BlaBlaCar API")
BLABLACAR_API_KEY=tu_clave_blablacar

# Geocodificación (opcional): Geoapify 3000 req/día gratis; sin clave se usa Nominatim
GEOAPIFY_API_KEY=tu_clave_geoapify
```

> **Seguridad**: Las claves `SERPAPI_KEY`, `GEMINI_API_KEY`, `BLABLACAR_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` **nunca** llegan al navegador. Todas las llamadas externas se hacen desde Route Handlers / Server Actions del servidor.

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia **Project URL** y **anon public key** a `.env.local`.
3. En **SQL Editor**, ejecuta el contenido de `supabase/migrations/0001_init.sql`:
   - Crea tablas: `profiles`, `trips`, `saved_destinations`, `saved_trips`, `preferences`
   - Activa **Row Level Security** (cada usuario solo ve lo suyo)
   - Trigger automático: crea perfil al registrarse
4. En **Authentication > Providers**, habilita **Email** (password). Opcional: Google OAuth.

## Cómo ejecutar

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build && npm start

# Lint
npm run lint

# Tests unitarios
npm test
```

## Arquitectura

```
escapa2/
├── app/
│   ├── page.js                    # Home con formulario responsive
│   ├── buscar/page.js             # Lista destinos con filtros
│   ├── comparar/page.js           # Comparador avanzado (CSV, share)
│   ├── destinos/[slug]/page.js    # Ficha: mapa, gasolineras, vuelos, hoteles, itinerario IA
│   ├── comunidad/[slug]/page.js   # Pueblos de una comunidad autónoma (lista de escapadas)
│   ├── login|registro/page.js     # Auth Supabase
│   ├── viajes|favoritos/page.js   # Datos guardados (requiere login)
│   └── api/
│       ├── search/route.js        # POST: búsqueda principal (runSearch)
│       ├── hotels/route.js        # SerpAPI Google Hotels (+ respaldo OSM)
│       ├── restaurants|attractions/route.js  # Recomendaciones Gemini
│       ├── itinerary/route.js     # Itinerario IA (Gemini)
│       ├── blablacar/route.js     # Precios reales BlaBlaCar (ida y vuelta)
│       ├── destination-info/route.js  # Wikipedia + fotos Commons (sin key)
│       ├── weather-extras/route.js    # UV, amanecer, aire y mar (sin key)
│       └── save-trip|save-destination/route.js
├── components/
│   ├── search/SearchForm.jsx      # Formulario con región + maxKm
│   ├── destinations/
│   │   ├── DestinationCard.jsx    # Tarjeta con imagen, badge costa/interior
│   │   ├── Comparator.jsx         # Tabla ordenable, CSV, share, breakdown
│   │   └── SaveButtons.jsx        # Guardar viaje/favorito
│   ├── places/SerpFetcher.jsx     # Fetch progresivo con skeleton
│   ├── hotels/HotelList.jsx
│   ├── places/PlaceList.jsx
│   ├── destinations/DestinationInfo.jsx  # Descripción y fotos (Wikipedia/Commons)
│   ├── weather/WeatherExtras.jsx   # UV, aire, amanecer y mar
│   ├── itinerary/Itinerary.jsx    # Timeline móvil
│   ├── maps/RouteMap.jsx          # Leaflet (client-only, dynamic import)
│   ├── fuel/GasStationsList.jsx   # Overpass API
│   ├── fuel/BlaBlaCarSimulator.jsx # Ofertas reales + simulador manual
│   ├── auth/AuthForm.jsx, LogoutButton.jsx
│   └── layout/TopNav.jsx
├── lib/
│   ├── search/runSearch.js        # Orquestador principal (coche vs avión)
│   ├── destinations/
│   │   ├── catalog.js             # 45 destinos con coords, aeropuerto, región, imagen
│   │   ├── airports.js            # Mapa nombre → IATA
│   │   ├── detail.js              # Ficha usando catálogo + vuelos
│   │   ├── communities.js         # Comunidades autónomas → pueblos más demandados
│   │   ├── communitySearch.js     # Búsqueda dentro de una comunidad
│   │   ├── holidays.js            # Festivos España + detección de puentes (sin key)
│   │   └── scoring.js             # Pesos configurables
│   ├── wiki/
│   │   └── client.js              # Wikipedia + Wikimedia Commons (descripción y fotos)
│   ├── serpapi/
│   │   ├── client.js              # Cliente base (server-only)
│   │   └── providers/             # hotels, flights, places
│   ├── ryanair/fares.js           # Tarifas por día Ryanair (fallback de vuelos)
│   ├── ai/gemini.js               # Restaurantes, atracciones e itinerario (prompt + parse validado)
│   ├── blablacar/client.js        # API oficial BlaBlaCar (precios reales)
│   ├── serpapi/providers/flights.js
│   ├── fuel/cost.js, gasStations.js
│   ├── maps/geocoder.js            # Geoapify + fallback Nominatim
│   ├── maps/geocodePlaces.js       # Coordenadas para restaurantes/atracciones
│   ├── maps/nominatim.js, knownOrigins.js
│   ├── routing/osrm.js
│   ├── weather/openMeteo.js
│   ├── supabase/                  # server/client client, actions, sesión
│   └── utils/cache.js, format.js
├── components/maps/RouteMap.jsx   # Leaflet (dynamic import, no SSR)
├── public/
│   ├── manifest.json, sw.js       # PWA
│   ├── icon-192.png, icon-512.png
├── supabase/migrations/0001_init.sql
├── tests/core.test.js             # Jest + babel-jest (30 tests)
├── jest.config.js, babel.config.json
└── README.md
```

## Flujo principal

1. **Home** → Usuario introduce: origen, fechas, viajeros, transporte (coche/avión), presupuesto opcional, región (costa/interior/todo), km máx., o elige destino en modo "Elegir destino". Si el destino es una **comunidad autónoma** (Asturias, Andalucía…), se muestra `/comunidad/[slug]` con sus pueblos más demandados.
2. **Buscar** → `runSearch`:
   - **Coche**: OSRM ruta + coste combustible + peajes + estimaciones hotel/comida/actividades. Ordena por score.
   - **Avión**: Solo destinos ≥ 350 km y aeropuerto distinto. SerpAPI Google Flights → precio real + aerolínea; si falla (cuota agotada), respaldo **Ryanair API** (tarifa por día, ida+vuelta). Ordena por precio vuelo.
3. **Comparar** → Tabla ordenable (Total, Hotel, Transporte, Comida, Actividades, Distancia, Score). Exportar CSV, compartir URL, breakdown expandible.
4. **Detalle destino** → Imagen Unsplash, badge costa/interior, **mapa Leaflet** con ruta, **gasolineras** (Overpass API), **vuelos** (precio, aerolínea, enlace Google Flights o Ryanair), **hoteles** (SerpAPI Google Hotels + respaldo OSM), **restaurantes/atracciones/itinerario** (Gemini), **precios reales BlaBlaCar**, coste total, botones guardar. Los apartados que cargan datos (hoteles, gasolineras, restaurantes, itinerario…) muestran un **SectionLoader animado** mientras buscan y un mensaje si no hay datos. La búsqueda principal muestra la animación **EscapadaLoader** con porcentaje.
5. **Auth** → Login/Registro Supabase. Guardar viaje/favorito requiere sesión. `/viajes` y `/favoritos` listan lo guardado.

## PWA (Instalable / Offline básico)

- `public/manifest.json` + `public/sw.js`
- Service Worker: cachea assets estáticos, network-first para páginas, salta APIs
- Iconos: `public/icon-192.png`, `public/icon-512.png`
- Registro automático en `layout.js`

## Notificaciones push de puentes (cron de los jueves)

- **`/api/cron/puente`** calcula el próximo puente (`lib/destinations/holidays.js`) y
  envía un push con fechas y una escapada sugerida a quienes activaron las notificaciones.
  Solo se ejecuta los jueves (defensa extra: miramos el día); para probar en local:
  `curl "http://localhost:3000/api/cron/puente?force=1"`.
- **Vercel Cron**: `vercel.json` programa `0 12 * * 4` (jueves 12:00). En despliegue propio
  hay que lanzar esa ruta con un cron externo (crontab, GitHub Actions…) o no se disparará.
- Requiere en `.env.local` las claves VAPID (ver `.env.example`; genéralas con
  `npx web-push generate-vapid-keys`) y `SUPABASE_SERVICE_ROLE_KEY` (para leer todas las
  suscripciones, bypass de RLS). El service worker ya abre el `url` del payload al pulsar.

## Dato real de gasto («lo que cuesta de verdad») y reserva directa

- **`/reportar?destination=X`**: página dedicada (requiere login) para reportar el gasto
  real tras el viaje. Alimenta `trip_expenses`.
- **`/api/expense-stats?destination=X`**: percentiles (p25/mediana/p75) del gasto real.
  Solo se publican con ≥ 5 muestras (`lib/destinations/expenseStats.js`), para no sacar
  conclusiones con datos anecdóticos. Se muestra en la ficha del destino.
- **Deep links de reserva**: cada alojamiento y la tarjeta de coste enlazan a la reserva
  real (link del proveedor con afiliación, o fallback a Booking.com con destino, fechas y
  viajeros pre-cargados en `lib/booking/deeplinks.js`).

## Búsqueda por planes predefinidos («¿Qué os apetece?»)

- La página principal de búsqueda ofrece categorías predefinidas (Playas sorprendentes,
  Pueblos con encanto, Naturaleza, Aventura, Cultura, Gastronomía, Romántico…). Al elegir
  una, la búsqueda prioriza los destinos que encajan con ese plan.
- Definidas en `lib/destinations/categories.js`, cada una mapea a intereses del catálogo.
  El `interest` viaja en la URL de `/buscar` y `runSearch` lo pasa a `scoreDestination`
  para ponderar el ranking; no excluye destinos, solo reordena. El filtro activo se
  muestra en un aviso en los resultados.

## Modo vacaciones (todas las combinaciones de fechas)

- En el formulario (avión o coche), activando **«Mis vacaciones»** eliges el inicio y el fin
  de tus vacaciones y la app combina **escapadas de 2, 3, 4 y 5 días** con todos los días
  del período (`vacationPairs` en `lib/search/runSearch.js`). En avión busca el vuelo de
  cada combinación; en coche calcula el coste total de cada combinación. Todas se muestran
  con su destino y fechas, ordenadas de más barato a más caro.
- Las combinaciones se limitan a 48 por destino para no disparar las llamadas a las APIs
  de vuelos en ventanas muy largas. El parámetro es `vacations=1`.

## Tests

```bash
npm test
# 25 tests: fuel/cost, utils/format, destinations/scoring, ai/gemini
# Jest + babel-jest + jsdom
```

## Lint & Build

```bash
npm run lint   # ESLint (Next.js config)
npm run build  # Next.js production build
```

## Datos mejorados sin API key

Tres mejoras de datos añadidas sin necesitar claves nuevas:

- **Contenido real del destino (`/api/destination-info`)**: la ficha muestra la descripción de Wikipedia en español con enlace y una galería de fotos geolocalizadas reales de Wikimedia Commons. Ya no se depende solo del catálogo o de Gemini para describir el lugar.
- **Extras meteorológicos (`/api/weather-extras`)**: además del tiempo (Open-Meteo), la ficha muestra índice UV, amanecer/atardecer y hora de luz, calidad del aire (índice US AQI) y, para destinos de costa, temperatura del agua y altura de ola (Open-Meteo Marine). Todo sin API key.
- **Festivos y puentes (`lib/destinations/holidays.js`)**: calendario de festivos nacionales y regionales habituales (la Semana Santa se calcula con el algoritmo de Pascua, sin llamadas a APIs). Las tarjetas y la ficha marcan los puentes con la fecha y el festivo concreto; en modo "mes completo" cada vuelo indica si cae en puente.
- **Mapa del viaje con todas las capas**: el mapa unificado (`UnifiedTripMap`) ahora muestra hoteles, restaurantes, atracciones y gasolineras. Las secciones publican sus resultados en un bus de datos por destino (`lib/client/tripDataBus.js`) y los botones de capa filtran los marcadores. Para que restaurantes y atracciones tengan posición, `/api/restaurants` y `/api/attractions` geocodifican cada resultado con Geoapify (`lib/maps/geocodePlaces.js`, con caché; solo se ejecuta si hay `GEOAPIFY_API_KEY` para no saturar Nominatim).

## Limitaciones conocidas

- **SerpAPI**: La clave actual solo habilita `google_hotels`; `google_flights` queda como fallback a Ryanair cuando falla. `google_maps` ya no se usa (restaurantes/atracciones ahora via Gemini).
- **Geocodificación**: Usa **Geoapify** si está configurado (3000 req/día gratis); sin clave cae a **Nominatim** (rate-limit 1 req/s). `knownOrigins` cubre orígenes comunes.
- **Precios**: Vuelos/hoteles son estimaciones en tiempo real; no se cachean indefinidamente.
- **Otras aerolíneas**: easyJet, Wizz Air, Norwegian y Transavia no tienen API pública gratuita (Akamai/DataDome/Cloudflare devuelven 403/429 con challenge JS; Kiwi Tequila es invite-only). Solo Ryanair tiene una API gratuita estable, por eso es el único fallback de vuelos.
- **Gemini**: Recomienda restaurantes, atracciones e itinerario. Respuestas en JSON validado; no inventa precios/horarios exactos.
- **Festivos**: `lib/destinations/holidays.js` cubre los festivos nacionales obligatorios y los regionales más habituales (sin API). Un festivo local concreto de una provincia concreta puede no aparecer; es orientativo, no un calendario laboral oficial.
- **Gasolineras**: Overpass API (OpenStreetMap) → sin precios tiempo real, solo ubicaciones.
- **BlaBlaCar**: Ofertas en tiempo real vía API oficial (requiere `BLABLACAR_API_KEY`). Sin clave o sin ofertas disponibles, se muestra el simulador manual orientativo (sin reserva real).

## Contribuir

1. Fork → rama `feature/nueva-funcionalidad`
2. `npm run lint && npm test && npm run build`
3. Commit convencional (`feat:`, `fix:`, `chore:`)
4. PR con descripción clara

## Licencia

MIT — libre para uso personal y comercial.