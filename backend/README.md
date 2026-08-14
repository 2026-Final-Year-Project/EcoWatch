# EcoWatch Backend

Express API for EcoWatch incidents, history, reports, PDF downloads, and simple admin/authority authentication.

## Community reporting accounts

`POST /api/auth/register` creates a community account with a salted `scrypt` password hash. Community submissions to `POST /api/community-reports` require its bearer token, and a single account can contribute only once to the same 250 m report cluster. Set `AUTH_SECRET` to a long random value (see `.env.example`) before deploying. Local accounts are persisted in `data/community-users.json`; replace this file store with a managed database and add email verification/rate limiting for a public deployment.

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
