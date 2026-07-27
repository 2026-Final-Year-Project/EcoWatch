# EcoWatch Backend

Express API for EcoWatch incidents, history, reports, PDF downloads, and simple admin/authority authentication.

## Run Locally

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:5050` by default. Override it with the `PORT`
environment variable when needed.

## Demo Accounts

- Admin: `admin@ecowatch.local` / `admin123`
- Authority: `authority@ecowatch.local` / `authority123`

Use `POST /api/auth/login` to get a bearer token for protected incident actions.
