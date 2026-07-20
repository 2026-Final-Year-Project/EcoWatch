// Normalize incoming incident payloads into the shape the frontend expects.
export function createIncidentModel(payload, nextId) {
  // Use the submitted coordinates to build a display-friendly coordinate string.
  const coords = `${Number(payload.lat).toFixed(4)}° N, ${Math.abs(Number(payload.lng)).toFixed(4)}° W`;

  // Return a complete incident object with safe defaults.
  return {
    id: nextId,
    type: payload.type,
    lat: Number(payload.lat),
    lng: Number(payload.lng),
    severity: payload.severity || "medium",
    hectares: Number(payload.hectares || 0),
    confidence: Number(payload.confidence || 0),
    date: payload.date || new Date().toISOString().slice(0, 10),
    time: payload.time || new Date().toTimeString().slice(0, 5),
    resolved: payload.resolved || null,
    status: payload.status || "Monitoring",
    coords,
    color: payload.color || "#eab308",
    notes: payload.notes || "New incident submitted for review.",
    recommendation: payload.recommendation || "Review incident and assign authority response.",
    authorities: payload.authorities || [],
  };
}
