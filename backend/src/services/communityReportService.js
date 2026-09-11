import { randomUUID } from 'node:crypto';
import { db, transaction } from '../config/db.js';
import { recordPredictionRun } from './predictionHistoryService.js';
export const CLUSTER_RADIUS_METRES = 250;

function distanceMetres(latitudeA, longitudeA, latitudeB, longitudeB) {
  const earthRadius = 6_371_000;
  const radians = (value) => value * Math.PI / 180;
  const deltaLatitude = radians(latitudeB - latitudeA);
  const deltaLongitude = radians(longitudeB - longitudeA);
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function communityCorroboration(reportCount) {
  // This measures agreement among reports, not a probability that mining is illegal.
  return Math.round(100 * (1 - Math.exp(-reportCount / 4)));
}

function hydrate(site) {
 const latest = db.prepare('SELECT result_json,analysed_at FROM prediction_runs WHERE site_id=? ORDER BY analysed_at DESC,rowid DESC LIMIT 1').get(site.id);
 return { ...site,
  reports: db.prepare('SELECT id,reporter_id AS reporterId,latitude,longitude,accuracy,notes,reported_at AS reportedAt FROM community_reports WHERE site_id=? ORDER BY reported_at,id').all(site.id),
  latestPrediction: latest ? { ...JSON.parse(latest.result_json || '{}'), analysedAt: latest.analysed_at } : null,
  communityCorroboration: communityCorroboration(site.reportCount) };
}
export function listCommunitySites() {
 return db.prepare('SELECT * FROM community_site_summary ORDER BY lastReportedAt DESC,id').all().map(hydrate);
}
export function addCommunityReport({ latitude, longitude, accuracy, notes, reporterId }) {
 if (!Number.isFinite(latitude) || Math.abs(latitude)>90 || !Number.isFinite(longitude) || Math.abs(longitude)>180
  || (accuracy != null && (!Number.isFinite(accuracy) || accuracy < 0))
  || (notes != null && (typeof notes !== 'string' || notes.length > 5000))) {
  throw Object.assign(new Error('Invalid coordinates, accuracy or notes (maximum 5000 characters).'), { status: 400 });
 }
 if (!reporterId) throw Object.assign(new Error('Authentication required.'), { status: 401 });
 return transaction(() => {
  const sites = db.prepare('SELECT * FROM community_site_summary ORDER BY firstReportedAt,id').all();
  const site = sites.find(candidate => distanceMetres(latitude,longitude,candidate.latitude,candidate.longitude) <= CLUSTER_RADIUS_METRES);
  if (site && db.prepare('SELECT 1 FROM community_reports WHERE site_id=? AND reporter_id=?').get(site.id,String(reporterId))) {
   throw Object.assign(new Error('You have already reported this site. Additional reports from the same account do not increase corroboration.'), { status: 409 });
  }
  const id = site?.id || randomUUID();
  if (!site) db.prepare('INSERT INTO community_sites VALUES (?)').run(id);
  db.prepare('INSERT INTO community_reports VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(),id,String(reporterId),latitude,longitude,accuracy ?? null,notes?.trim() || null,new Date().toISOString());
  return { site: hydrate(db.prepare('SELECT * FROM community_site_summary WHERE id=?').get(id)), isNewSite: !site };
 });
}
export function saveSitePrediction(siteId, prediction, coordinates = {}) {
 const site = db.prepare('SELECT * FROM community_site_summary WHERE id=?').get(siteId);
 if (!site) return null;
 recordPredictionRun({ latitude: coordinates.latitude ?? site.latitude, longitude: coordinates.longitude ?? site.longitude,
  dateStart: coordinates.dateStart, dateEnd: coordinates.dateEnd,
  prediction, source: 'community-report', siteId });
 return hydrate(site);
}
