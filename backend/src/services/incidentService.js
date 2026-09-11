import { db, transaction } from '../config/db.js';
import { createIncidentModel } from '../models/Incident.js';
import { insertIncident } from '../database/records.js';
function hydrate(row) {
 if (!row) return null;
 const { created_by, ...incident } = row;
 return { ...incident, coords: `${Math.abs(row.lat).toFixed(4)}° ${row.lat < 0 ? 'S' : 'N'}, ${Math.abs(row.lng).toFixed(4)}° ${row.lng < 0 ? 'W' : 'E'}`,
 authorities: db.prepare('SELECT a.name FROM authorities a JOIN incident_authorities ia ON a.id=ia.authority_id WHERE ia.incident_id=? ORDER BY a.id').all(row.id).map(a => a.name) };
}
export function listIncidents(query = {}) {
 const filters = ['type','severity','status'].filter(key => query[key] && query[key] !== 'all');
 return db.prepare(`SELECT * FROM incidents ${filters.length ? 'WHERE ' + filters.map(key => `${key}=?`).join(' AND ') : ''} ORDER BY date DESC,time DESC,id DESC`).all(...filters.map(key => String(query[key]))).map(hydrate);
}
export function listLiveIncidents() { return listIncidents().filter(i => i.status !== 'Resolved').slice(0,2).map(i => ({ ...i, timeAgo: 'Recently detected' })); }
export function getIncidentById(id) { return hydrate(db.prepare('SELECT * FROM incidents WHERE id=?').get(Number(id))); }
export function createIncident(payload, createdBy = null) {
 const incident = createIncidentModel(payload);
 const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
 if (typeof incident.type !== 'string' || !incident.type.trim()) invalid('type is required.');
 if (!Number.isFinite(incident.lat) || !Number.isFinite(incident.lng) || Math.abs(incident.lat)>90 || Math.abs(incident.lng)>180) invalid('Invalid coordinates.');
 if (!['low','medium','high','critical'].includes(incident.severity) || !Number.isFinite(incident.hectares) || incident.hectares < 0 || !Number.isFinite(incident.confidence) || incident.confidence < 0 || incident.confidence > 100) invalid('Invalid severity, hectares or confidence.');
 if (!Array.isArray(incident.authorities) || incident.authorities.some(a => typeof a !== 'string')) invalid('authorities must be a list of names.');
 validateStatus(incident.status);
 return transaction(() => getIncidentById(insertIncident(db, incident, createdBy)));
}
function validateStatus(status) { if (!['Monitoring','Reported','Escalated','Resolved'].includes(status)) throw Object.assign(new Error('Invalid incident status.'), { status: 400 }); }
export function updateIncidentStatus(id, status) {
 validateStatus(status);
 db.prepare('UPDATE incidents SET status=?,resolved=? WHERE id=?').run(status, status === 'Resolved' ? new Date().toISOString().slice(0,10) : null, Number(id));
 return getIncidentById(id);
}
