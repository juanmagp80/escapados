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
- **Nominatim / OpenStreetMap** (geocodificación)
- **Gemini 2.5 Flash** (itinerarios IA)
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

# Gemini (itinerarios IA)
GEMINI_API_KEY=tu_clave_gemini
GEMINI_MODEL=gemini-2.5-flash  # Opcional, por defecto gemini-2.5-flash
```

> **Seguridad**: Las claves `SERPAPI_KEY`, `GEMINI_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` **nunca** llegan al navegador. Todas las llamadas externas se hacen desde Route Handlers / Server Actions del servidor.

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
│   ├── login|registro/page.js     # Auth Supabase
│   ├── viajes|favoritos/page.js   # Datos guardados (requiere login)
│   └── api/
│       ├── search/route.js        # POST: búsqueda principal (runSearch)
│       ├── hotels|restaurants|attractions|itinerary|gas-stations/route.js
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
│   ├── itinerary/Itinerary.jsx    # Timeline móvil
│   ├── maps/RouteMap.jsx          # Leaflet (client-only, dynamic import)
│   ├── fuel/GasStationsList.jsx   # Overpass API
│   ├── fuel/BlaBlaCarSimulator.jsx
│   ├── auth/AuthForm.jsx, LogoutButton.jsx
│   └── layout/TopNav.jsx
├── lib/
│   ├── search/runSearch.js        # Orquestador principal (coche vs avión)
│   ├── destinations/
│   │   ├── catalog.js             # 45 destinos con coords, aeropuerto, región, imagen
│   │   ├── airports.js            # Mapa nombre → IATA
│   │   ├── detail.js              # Ficha usando catálogo + vuelos
│   │   └── scoring.js             # Pesos configurables
│   ├── serpapi/
│   │   ├── client.js              # Cliente base (server-only)
│   │   └── providers/             # hotels, flights, places
│   ├── ai/gemini.js               # Prompt estricto + parse validado
│   ├── serpapi/providers/flights.js
│   ├── fuel/cost.js, gasStations.js
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
├── tests/core.test.js             # Jest + babel-jest (15 tests)
├── jest.config.js, babel.config.json
└── README.md
```

## Flujo principal

1. **Home** → Usuario introduce: origen, fechas, viajeros, transporte (coche/avión), presupuesto opcional, región (costa/interior/todo), km máx.
2. **Buscar** → `runSearch`:
   - **Coche**: OSRM ruta + coste combustible + peajes + estimaciones hotel/comida/actividades. Ordena por score.
   - **Avión**: Solo destinos ≥ 350 km y aeropuerto distinto. SerpAPI Google Flights → precio real + aerolínea. Ordena por precio vuelo.
3. **Comparar** → Tabla ordenable (Total, Hotel, Transporte, Comida, Actividades, Distancia, Score). Exportar CSV, compartir URL, breakdown expandible.
4. **Detalle destino** → Imagen Unsplash, badge costa/interior, **mapa Leaflet** con ruta, **gasolineras** (Overpass API), **vuelos** (precio, aerolínea, enlace Google Flights), **hoteles/restaurantes/atracciones** (SerpAPI), **itinerario IA** (Gemini), **simulador BlaBlaCar**, coste total, botones guardar.
5. **Auth** → Login/Registro Supabase. Guardar viaje/favorito requiere sesión. `/viajes` y `/favoritos` listan lo guardado.

## PWA (Instalable / Offline básico)

- `public/manifest.json` + `public/sw.js`
- Service Worker: cachea assets estáticos, network-first para páginas, salta APIs
- Iconos: `public/icon-192.png`, `public/icon-512.png`
- Registro automático en `layout.js`

## Tests

```bash
npm test
# 15 tests: fuel/cost, utils/format, destinations/scoring
# Jest + babel-jest + jsdom
```

## Lint & Build

```bash
npm run lint   # ESLint (Next.js config)
npm run build  # Next.js production build
```

## Limitaciones conocidas

- **SerpAPI**: La clave actual solo habilita `google_hotels`. `google_flights` funciona pero `google_maps` (restaurantes/atracciones) devuelve "Invalid API key" → la UI muestra aviso amigable.
- **Nominatim**: Rate-limit 1 req/s. Usa `knownOrigins` como fallback para orígenes comunes.
- **Precios**: Vuelos/hoteles son estimaciones en tiempo real; no se cachean indefinidamente.
- **Gemini**: Prompt estricto (no inventa precios/horarios). Valida JSON de respuesta.
- **Gasolineras**: Overpass API (OpenStreetMap) → sin precios tiempo real, solo ubicaciones.
- **BlaBlaCar**: Simulación orientativa, no reserva real.

## Contribuir

1. Fork → rama `feature/nueva-funcionalidad`
2. `npm run lint && npm test && npm run build`
3. Commit convencional (`feat:`, `fix:`, `chore:`)
4. PR con descripción clara

## Licencia

MIT — libre para uso personal y comercial.