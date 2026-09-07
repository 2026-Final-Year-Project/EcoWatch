# EcoWatch Backend

Express API backed by SQLite for accounts, sessions, incidents, community reports, authorities and prediction history. Printable reports and statistics derive from persisted records.

Requires Node.js 22.12 or newer. From this directory:

```bash
npm install
cp .env.example .env
npm run db:init
npm run dev
```

The API listens on `http://localhost:5050`. Startup automatically applies migrations and imports existing local JSON records once. The default database is `data/ecowatch.sqlite`; set `DATABASE_PATH` to use another durable location.

Development databases seed `admin@ecowatch.local` / `admin123` and `authority@ecowatch.local` / `authority123`. Production disables demo seeding by default. Public registration creates community accounts. Authentication uses eight-hour database sessions and salted scrypt password hashes.

```bash
npm test
npm run db:check
npm run db:backup -- /absolute/path/new-backup.sqlite
```

See [database.md](../database.md) for the full schema, relationships, normalization, production setup, account provisioning, import rules, backups and operational limits.
