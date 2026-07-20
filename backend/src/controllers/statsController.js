// Import incidents so stats always reflect the same source as reports.
import { listIncidents } from "../services/incidentService.js";

// Return dashboard statistics for the current incident set.
export function getStats(_req, res) {
  // Load all incidents in the current backend state.
  const incidents = listIncidents();

  // Count incidents that need immediate attention.
  const critical = incidents.filter((incident) => incident.severity === "critical").length;

  // Sum affected area across all incidents.
  const totalHectares = incidents.reduce((sum, incident) => sum + incident.hectares, 0);

  // Calculate average confidence safely.
  const avgConfidence = incidents.length
    ? incidents.reduce((sum, incident) => sum + incident.confidence, 0) / incidents.length
    : 0;

  // Return the aggregate stats.
  res.json({
    total: incidents.length,
    critical,
    totalHectares,
    avgConfidence: Number(avgConfidence.toFixed(1)),
  });
}
