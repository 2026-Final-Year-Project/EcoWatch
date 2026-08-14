import { Router } from "express";
import { listPredictionHistory, recordPredictionRun } from "../services/predictionHistoryService.js";

const router = Router();
const modelUrl = () => process.env.MODEL_API_URL || "http://localhost:8000";

router.get("/history", (_req, res) => {
  res.json({ runs: listPredictionHistory() });
});

router.post("/coordinate", async (req, res, next) => {
  const { latitude, longitude, date_start, date_end } = req.body;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ message: "latitude and longitude must be numbers." });
  }
  try {
    const response = await fetch(`${modelUrl()}/v1/predict/coordinate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, date_start, date_end }), signal: AbortSignal.timeout(60000),
    });
    const rawBody = await response.text();
    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      body = { detail: rawBody || "The model service returned an invalid response." };
    }
    if (response.ok) {
      recordPredictionRun({ latitude, longitude, dateStart: date_start, dateEnd: date_end, prediction: body, source: "map" });
      return res.status(response.status).json(body);
    }
    return res.status(response.status).json({ message: body.detail || "Prediction failed." });
  } catch (error) { return next(error); }
});

router.post("/imagery/coordinate", async (req, res, next) => {
  const { latitude, longitude, date_start, date_end } = req.body;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ message: "latitude and longitude must be numbers." });
  }
  try {
    const response = await fetch(`${modelUrl()}/v1/imagery/coordinate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, date_start, date_end }), signal: AbortSignal.timeout(60000),
    });
    const rawBody = await response.text();
    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      body = { detail: rawBody || "The model service returned an invalid response." };
    }
    return res.status(response.status).json(response.ok ? body : { message: body.detail || "Imagery request failed." });
  } catch (error) { return next(error); }
});
export default router;
