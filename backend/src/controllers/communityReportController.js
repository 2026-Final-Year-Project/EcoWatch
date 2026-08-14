import { addCommunityReport, CLUSTER_RADIUS_METRES, listCommunitySites, saveSitePrediction } from "../services/communityReportService.js";
import { recordPredictionRun } from "../services/predictionHistoryService.js";

const modelUrl = () => process.env.MODEL_API_URL || "http://localhost:8000";

export function getCommunitySites(_req, res) {
  res.json({ clusterRadiusMetres: CLUSTER_RADIUS_METRES, sites: listCommunitySites() });
}

export async function postCommunityReport(req, res, next) {
  const { latitude, longitude, accuracy, notes } = req.body;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ message: "latitude and longitude must be numbers." });
  }
  try {
    const { site, isNewSite } = addCommunityReport({ latitude, longitude, accuracy, notes, reporterId: req.user.sub });
    let prediction = null;
    let predictionError = null;
    try {
      const response = await fetch(`${modelUrl()}/v1/predict/coordinate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: site.latitude, longitude: site.longitude }), signal: AbortSignal.timeout(60000),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "Model inference failed.");
      prediction = body;
      saveSitePrediction(site.id, prediction);
      recordPredictionRun({ latitude: site.latitude, longitude: site.longitude, prediction, source: "community-report" });
    } catch (error) {
      predictionError = error.message;
    }
    const refreshed = listCommunitySites().find((candidate) => candidate.id === site.id);
    return res.status(201).json({ site: refreshed, isNewSite, prediction, predictionError, clusterRadiusMetres: CLUSTER_RADIUS_METRES });
  } catch (error) {
    return next(error);
  }
}
