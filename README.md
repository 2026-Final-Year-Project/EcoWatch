# EcoWatch

EcoWatch is an environmental monitoring web application focused on identifying possible illegal-mining activity from satellite imagery and community observations. It combines an interactive map, a separately deployed imagery/model service, community reporting, analysis history, seeded incidents, and printable reports.

This repository contains two applications:

- a Next.js 16/React 19 frontend in `src/`;
- an Express API in `backend/`.

The satellite imagery and segmentation model service is **not included in this repository**. The Express API expects that service to run separately and forwards analysis requests to it.

## What the application does

### Live map

The `/monitor` page displays an Esri World Imagery basemap with Leaflet. A user can select a point, choose a bundled reference site, or move the map to their device location. The frontend then asks Express for an illegal-mining prediction and for older/current satellite images. It displays the returned detection level, probability, affected area, imagery, and model metadata, and can download the result as JSON.

Successful prediction runs are recorded in backend analysis history. Markers loaded from `public/demo-sites.geojson` are reference/demo locations, not live detections.

### Community reports

The `/report` page accepts a device location or manually entered coordinates and optional notes. Anyone can view community sites, but submitting requires a community account.

Reports within 250 metres are grouped into one site. An account can contribute only once to a site, preventing repeated submissions by the same account from increasing its community corroboration score. After storing a report, the backend asks the model service to analyse the site's centroid. A report remains stored if that satellite check fails.

Community corroboration measures agreement among independent reports; it is not model confidence and does not establish that mining is illegal.

### Analysis history

The `/history` page retrieves completed model runs from Express. It supports filtering by result and source, timeline/list views, summary statistics, and client-side PDF export. History includes analyses initiated from the live map and community-reporting flow.

### Incident reports

The `/printable` page loads the newest seeded incident and authority list from Express and renders a printable report. The backend also exposes generated PDF downloads for the latest report or an incident selected by ID.

Incident endpoints support filtering, creation, and status updates. Creation and status changes require an admin or authority bearer token. Incident data starts in `backend/src/data/incidents.js`; API changes last only until the backend restarts.

## Architecture and data flow

```text
Browser (Next.js client components)
  |  NEXT_PUBLIC_API_BASE_URL, JSON over HTTP
  v
Express API (/api)
  |-- authentication and authorization
  |-- community report clustering and JSON-file storage
  |-- prediction history JSON-file storage
  |-- seeded, in-memory incidents and derived reports
  |
  |  MODEL_API_URL, server-to-server JSON over HTTP
  v
External imagery and segmentation model service
```

The frontend centralizes API access in `src/lib/api.js`. By default, browser requests go to `http://localhost:5050/api`. Interactive App Router pages are client components because they use browser APIs such as geolocation and `localStorage`, plus React state and effects.

Authentication returns an eight-hour HMAC-signed bearer token. The frontend stores the community session in browser `localStorage` and includes the token in protected requests.

The browser never contacts the model service directly:

- `POST /api/predictions/coordinate` proxies to `POST /v1/predict/coordinate` and records successful runs;
- `POST /api/predictions/imagery/coordinate` proxies to `POST /v1/imagery/coordinate`;
- a community submission is stored first, then triggers `/v1/predict/coordinate` and records the result when available.

Express allows `http://localhost:3000` through CORS by default. Set `CLIENT_ORIGIN` when the frontend is hosted elsewhere.

## Technology

- Next.js 16 App Router and React 19
- Tailwind CSS 4
- Leaflet with Esri satellite tiles
- GSAP
- jsPDF and html2canvas
- Express 4 and CORS
- Node.js crypto and filesystem APIs

## Run locally

### Prerequisites

- Node.js 18 or newer (the backend uses built-in `fetch` and `AbortSignal.timeout`)
- npm
- a compatible imagery/model API if you want live analysis and imagery comparison

Install both sets of dependencies:

```bash
npm install
cd backend
npm install
cd ..
```

Start Express in one terminal:

```bash
cd backend
npm run dev
```

Start Next.js in another terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API health check is at [http://localhost:5050/api/health](http://localhost:5050/api/health).

Without the external model service, the landing page, authentication, community-site listing, seeded incidents, and printable reports still work. Live map analysis fails, while community reports are saved without a model result.

## Configuration

Create an uncommitted `.env.local` for Next.js as needed. Environment files are ignored by Git. The backend does not load `.env` files itself, so export its variables in the shell or provide them through your process manager.

Frontend (`.env.local`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5050/api` | Browser API base URL; include `/api`. |

Backend process environment:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5050` | Express listening port. |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Origin allowed by CORS. |
| `MODEL_API_URL` | `http://localhost:8000` | External model-service base URL; omit `/v1`. |
| `AUTH_SECRET` | `dev-ecowatch-secret` | Bearer-token signing secret. Set a long random value outside local development. |

The model service must accept:

- `POST /v1/predict/coordinate` with `latitude`, `longitude`, and optional `date_start`/`date_end`;
- `POST /v1/imagery/coordinate` with the same coordinate and optional date fields.

Predictions are expected to provide fields such as `mining_detected`, `detection_level`, `probability` or `mean_probability`, `mining_fraction`, `affected_area_m2`, `largest_component_pixels`, `threshold`, and `model_version`. Imagery responses provide image data used by the comparison UI.

## Routes

Frontend routes:

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/monitor` | Interactive satellite map and coordinate analysis |
| `/report` | Community reporting and grouped sites |
| `/history` | Recorded model-analysis history |
| `/auth` | Community sign-up and sign-in |
| `/printable` | Latest printable seeded incident report |

Express endpoints:

| Method and path | Purpose | Access |
| --- | --- | --- |
| `GET /api/health` | API health check | Public |
| `POST /api/auth/register` | Create a community account | Public |
| `POST /api/auth/login` | Sign in and receive a bearer token | Public |
| `GET /api/community-reports` | List grouped community sites | Public |
| `POST /api/community-reports` | Store a report and run a satellite check | Authenticated |
| `POST /api/predictions/coordinate` | Run and record a coordinate prediction | Public |
| `POST /api/predictions/imagery/coordinate` | Retrieve coordinate imagery | Public |
| `GET /api/predictions/history` | List recorded prediction runs | Public |
| `GET /api/incidents` | List/filter incidents | Public |
| `GET /api/incidents/live` | Return the newest live-map incident subset | Public |
| `GET /api/incidents/:id` | Return one incident | Public |
| `POST /api/incidents` | Create an in-memory incident | Admin/authority |
| `PATCH /api/incidents/:id/status` | Change an incident status | Admin/authority |
| `GET /api/reports` | List reports derived from incidents | Public |
| `GET /api/reports/latest` | Return the newest report | Public |
| `GET /api/reports/:id` | Return a report by incident ID | Public |
| `GET /api/reports/latest/pdf` | Download the newest report PDF | Public |
| `GET /api/reports/:id/pdf` | Download a report PDF by incident ID | Public |
| `GET /api/authorities` | List escalation authorities | Public |
| `GET /api/stats` | Return aggregate incident statistics | Public |

Incident list filters are supplied as `type`, `severity`, and `status` query parameters.

## Demo privileged accounts

These seed accounts are intended only for local development and protected incident API calls:

- Admin: `admin@ecowatch.local` / `admin123`
- Authority: `authority@ecowatch.local` / `authority123`

Community users register through `/auth` or `POST /api/auth/register`. Their passwords are salted and hashed with `scrypt` before storage.

## Storage and production considerations

The current persistence model is prototype-oriented:

- `backend/data/community-reports.json` stores grouped sites and reports;
- `backend/data/community-users.json` is created for registered users and ignored by Git;
- `backend/data/prediction-history.json` stores up to 1,000 completed analyses and is ignored by Git;
- incidents are seeded in source and mutations are not persisted across restarts.

JSON updates use a temporary file followed by a rename, but the stores are not designed for multiple backend instances or concurrent production workloads. Before public deployment, use a managed database, remove demo credentials, set `AUTH_SECRET`, add rate limiting and account verification, review location-data retention and access controls, and serve both applications over HTTPS.

## Repository layout

```text
src/app/                 Next.js routes and layouts
src/components/          Interactive UI and printable-report components
src/lib/                 Frontend API and session helpers
src/utils/               Client-side CSV/PDF utilities
public/                  Images, GeoJSON reference data, and attribution
backend/src/routes/      Express route definitions
backend/src/controllers/ HTTP request handlers
backend/src/services/    Auth, storage, incident, history, and PDF logic
backend/src/data/        Seed incidents, authorities, and privileged users
backend/data/            Runtime JSON stores
scripts/                 Reference-site import tooling
```

## Useful commands

Frontend:

```bash
npm run dev
npm run lint
npm run build
npm start
```

Backend:

```bash
cd backend
npm run dev
npm start
```

The frontend development and build scripts intentionally use webpack for this Next.js version.

## Reference-site attribution

See `public/REFERENCE_SITES_ATTRIBUTION.md` for the provenance and usage caveats associated with `public/reference-mining-sites.geojson`. Reference candidates and demo sites must not be presented as confirmed EcoWatch predictions or allegations.
