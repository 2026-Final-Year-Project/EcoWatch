import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const storePath = resolve(moduleDirectory, "../../data/prediction-history.json");
const MAX_HISTORY_RECORDS = 1_000;

function readHistory() {
  if (!existsSync(storePath)) return [];
  return JSON.parse(readFileSync(storePath, "utf8"));
}

function writeHistory(history) {
  const temporaryPath = `${storePath}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(history, null, 2));
  renameSync(temporaryPath, storePath);
}

export function listPredictionHistory() {
  return readHistory().sort((left, right) => new Date(right.analysedAt) - new Date(left.analysedAt));
}

export function recordPredictionRun({ latitude, longitude, dateStart, dateEnd, prediction, source }) {
  const history = readHistory();
  const record = {
    id: randomUUID(),
    analysedAt: new Date().toISOString(),
    source,
    latitude,
    longitude,
    dateStart: dateStart || null,
    dateEnd: dateEnd || null,
    miningDetected: Boolean(prediction.mining_detected),
    detectionLevel: prediction.detection_level || "none",
    meanProbability: Number(prediction.probability ?? prediction.mean_probability ?? 0),
    miningFraction: Number(prediction.mining_fraction || 0),
    affectedAreaM2: Number(prediction.affected_area_m2 || 0),
    largestComponentPixels: Number(prediction.largest_component_pixels || 0),
    threshold: Number(prediction.threshold || 0),
    modelVersion: prediction.model_version || "unknown",
  };
  history.unshift(record);
  writeHistory(history.slice(0, MAX_HISTORY_RECORDS));
  return record;
}
