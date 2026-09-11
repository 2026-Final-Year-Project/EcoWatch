import { randomUUID } from 'node:crypto';
import { db } from '../config/db.js';
import { insertPrediction, predictionRecord } from '../database/records.js';
export function listPredictionHistory() {
 return db.prepare(`SELECT id, analysed_at AS analysedAt, source, latitude, longitude,
 date_start AS dateStart,date_end AS dateEnd,mining_detected AS miningDetected,
 detection_level AS detectionLevel,mean_probability AS meanProbability,mining_fraction AS miningFraction,
 affected_area_m2 AS affectedAreaM2,largest_component_pixels AS largestComponentPixels,
 threshold,model_version AS modelVersion FROM prediction_runs ORDER BY analysed_at DESC,rowid DESC`).all()
 .map(row => ({ ...row, miningDetected: Boolean(row.miningDetected) }));
}
export function recordPredictionRun(input) {
 const record = predictionRecord({ ...input, id: randomUUID(), analysedAt: new Date().toISOString() });
 insertPrediction(db, record, input.siteId || null, input.prediction);
 return record;
}

export function getMapPredictionRun(id, latitude, longitude) {
 const run = typeof id === 'string' ? db.prepare("SELECT * FROM prediction_runs WHERE id=? AND source='map'").get(id) : null;
 if (!run || run.latitude !== latitude || run.longitude !== longitude || !run.result_json) {
  throw Object.assign(new Error('The original map analysis could not be matched to this location. Run the map analysis again before reporting.'), { status: 400 });
 }
 return { prediction: JSON.parse(run.result_json), latitude: run.latitude, longitude: run.longitude, dateStart: run.date_start, dateEnd: run.date_end };
}
