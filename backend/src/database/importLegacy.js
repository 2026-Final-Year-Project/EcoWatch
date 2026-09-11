import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { incidents } from '../data/incidents.js';
import { authorities } from '../data/authorities.js';
import { users } from '../data/users.js';
import { hashPassword } from './password.js';
import { insertIncident, insertPrediction, predictionRecord } from './records.js';
export function importLegacyData(db, directory) {
 const read = name => { const path = resolve(directory, name); return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : []; };
 const demo = process.env.SEED_DEMO_DATA === 'true' || (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_DATA !== 'false');
 const insertUser = db.prepare('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)');
 for (const user of [...(demo ? users : []), ...read('community-users.json')]) {
  insertUser.run(String(user.id), user.name, user.email.trim().toLowerCase(), user.passwordHash || hashPassword(user.password), user.role);
 }
 authorities.forEach((name, index) => db.prepare('INSERT INTO authorities VALUES (?,?)').run(index + 1, name));
 if (demo) incidents.forEach(incident => insertIncident(db, incident));
 for (const site of read('community-reports.json')) {
  db.prepare('INSERT INTO community_sites VALUES (?)').run(site.id);
  for (const report of site.reports) {
   const reporterId = report.reporterId == null ? null : String(report.reporterId);
   // Preserve orphan historical IDs without inventing credentials or an identity.
   if (reporterId && !db.prepare('SELECT 1 FROM users WHERE id=?').get(reporterId)) {
    db.prepare("INSERT INTO users (id,name,role,disabled) VALUES (?,'Legacy reporter','community',1)").run(reporterId);
   }
   db.prepare('INSERT INTO community_reports VALUES (?,?,?,?,?,?,?,?)').run(report.id, site.id, reporterId, report.latitude, report.longitude, report.accuracy ?? null, report.notes ?? null, report.reportedAt);
  }
  if (site.latestPrediction) {
   const prediction = site.latestPrediction;
   insertPrediction(db, predictionRecord({ id: randomUUID(), analysedAt: prediction.analysedAt || site.lastReportedAt, latitude: prediction.latitude ?? site.latitude, longitude: prediction.longitude ?? site.longitude, prediction, source: 'legacy-site' }), site.id, prediction);
  }
 }
 for (const record of read('prediction-history.json')) insertPrediction(db, record);
}
