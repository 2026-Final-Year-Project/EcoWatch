import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { importLegacyData } from '../database/importLegacy.js';
const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
export const databasePath = process.env.DATABASE_PATH ? resolve(process.env.DATABASE_PATH) : resolve(backendRoot, 'data/ecowatch.sqlite');
mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA synchronous = FULL;');
export function transaction(work) {
 db.exec('BEGIN IMMEDIATE');
 try { const result = work(); db.exec('COMMIT'); return result; }
 catch (error) { db.exec('ROLLBACK'); throw error; }
}
db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL) STRICT');
const migrations = new URL('../database/migrations/', import.meta.url);
for (const version of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) {
 transaction(() => {
  if (db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get(version)) return;
  db.exec(readFileSync(new URL(version, migrations), 'utf8'));
  db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(version, new Date().toISOString());
 });
}
transaction(() => {
 if (db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get('legacy-import-v1')) return;
 importLegacyData(db, process.env.LEGACY_DATA_DIR || resolve(backendRoot, 'data'));
 db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run('legacy-import-v1', new Date().toISOString());
});
