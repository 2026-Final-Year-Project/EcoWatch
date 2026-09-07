// Shared inserts keep migrations and API writes on the same schema.
export function insertIncident(db, incident, createdBy = null) {
 const keys = ['type','lat','lng','severity','hectares','confidence','date','time','resolved','status','color','notes','recommendation'];
 const result = db.prepare(`INSERT INTO incidents (id,${keys.join(',')},created_by) VALUES (${Array(15).fill('?').join(',')})`)
  .run(incident.id ?? null, ...keys.map(key => incident[key] ?? null), createdBy);
 const id = Number(result.lastInsertRowid);
 for (const name of new Set(incident.authorities)) {
  const authority = db.prepare('SELECT id FROM authorities WHERE name=?').get(name);
  if (!authority) throw Object.assign(new Error(`Unknown authority: ${name}`), { status: 400 });
  db.prepare('INSERT INTO incident_authorities VALUES (?,?)').run(id, authority.id);
 }
 return id;
}
export function insertPrediction(db, record, siteId = null, prediction = null) {
 const keys = ['id','analysedAt','source','latitude','longitude','dateStart','dateEnd','miningDetected','detectionLevel','meanProbability','miningFraction','affectedAreaM2','largestComponentPixels','threshold','modelVersion'];
 db.prepare(`INSERT INTO prediction_runs (id,analysed_at,source,latitude,longitude,date_start,date_end,mining_detected,detection_level,mean_probability,mining_fraction,affected_area_m2,largest_component_pixels,threshold,model_version,site_id,result_json) VALUES (${Array(17).fill('?').join(',')})`)
 .run(...keys.map(key => key === 'miningDetected' ? Number(Boolean(record[key])) : record[key] ?? null), siteId, prediction ? JSON.stringify(prediction) : null);
}
export function predictionRecord({ id, analysedAt, latitude, longitude, dateStart, dateEnd, prediction, source }) {
 return { id, analysedAt, source, latitude, longitude, dateStart: dateStart || null, dateEnd: dateEnd || null,
 miningDetected: Boolean(prediction.mining_detected), detectionLevel: prediction.detection_level || 'none',
 meanProbability: Number(prediction.probability ?? prediction.mean_probability ?? 0),
 miningFraction: Number(prediction.mining_fraction || 0), affectedAreaM2: Number(prediction.affected_area_m2 || 0),
 largestComponentPixels: Number(prediction.largest_component_pixels || 0), threshold: Number(prediction.threshold || 0), modelVersion: prediction.model_version || 'unknown' };
}
