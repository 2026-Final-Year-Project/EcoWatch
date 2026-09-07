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

The `/printable` page loads the newest persisted incident and authority list from Express and renders a printable report. The backend also exposes generated PDF downloads for the latest report or an incident selected by ID.

Incident endpoints support filtering, creation, and status updates. Creation and status changes require an admin or authority bearer token. Incidents, accounts, sessions, community reports and prediction history persist in SQLite across restarts. See [database.md](database.md) for setup, schema, normalization and backups.

## Architecture and data flow

```text
Browser (Next.js client components)
  |  NEXT_PUBLIC_API_BASE_URL, JSON over HTTP
  v
Express API (/api)
  |-- authentication and authorization
  |-- community report clustering and SQLite storage
  |-- prediction history in SQLite
  |-- persistent incidents, accounts, sessions and derived reports
  |
  |  MODEL_API_URL, server-to-server JSON over HTTP
  v
External imagery and segmentation model service
```

## Technology

- JavaScript
- Next.js
- React
- Express
- Tailwind CSS
- Leaflet
- GSAP
- jsPDF
- html2canvas

## Run locally

### Prerequisites

- Node.js 22.12 or newer (the backend uses built-in SQLite)
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

## Routes

Frontend routes:

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/monitor` | Interactive satellite map and coordinate analysis |
| `/report` | Community reporting and grouped sites |
| `/history` | Recorded model-analysis history |
| `/auth` | Community sign-up and sign-in |
| `/printable` | Latest printable incident report |

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
| `POST /api/incidents` | Create a persisted incident | Admin/authority |
| `PATCH /api/incidents/:id/status` | Change an incident status | Admin/authority |
| `GET /api/reports` | List reports derived from incidents | Public |
| `GET /api/reports/latest` | Return the newest report | Public |
| `GET /api/reports/:id` | Return a report by incident ID | Public |
| `GET /api/reports/latest/pdf` | Download the newest report PDF | Public |
| `GET /api/reports/:id/pdf` | Download a report PDF by incident ID | Public |
| `GET /api/authorities` | List escalation authorities | Public |
| `GET /api/stats` | Return aggregate incident statistics | Public |

Incident list filters are supplied as `type`, `severity`, and `status` query parameters.

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
backend/data/            SQLite database and legacy import source files
scripts/                 Reference-site import tooling
```

## Reference-site attribution

See `public/REFERENCE_SITES_ATTRIBUTION.md` for the provenance and usage caveats associated with `public/reference-mining-sites.geojson`. Reference candidates and demo sites must not be presented as confirmed EcoWatch predictions or allegations.
