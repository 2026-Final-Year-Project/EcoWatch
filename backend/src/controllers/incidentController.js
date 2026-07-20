// Import incident service functions.
import {
  createIncident,
  getIncidentById,
  listIncidents,
  listLiveIncidents,
  updateIncidentStatus,
} from "../services/incidentService.js";

// Return filterable incident data for reports.
export function getIncidents(req, res) {
  // Pass query filters through to the incident service.
  res.json(listIncidents(req.query));
}

// Return the active incidents used by the live map.
export function getLiveIncidents(_req, res) {
  // Send only the live-map incident subset.
  res.json(listLiveIncidents());
}

// Return one incident by ID.
export function getIncident(req, res) {
  // Look up the incident from the route parameter.
  const incident = getIncidentById(req.params.id);

  // Return a 404 when the incident does not exist.
  if (!incident) return res.status(404).json({ message: "Incident not found." });

  // Return the matching incident.
  return res.json(incident);
}

// Create a new incident from an authenticated request.
export function postIncident(req, res) {
  // Store the incident through the service layer.
  const incident = createIncident(req.body);

  // Return the created incident with a 201 status.
  res.status(201).json(incident);
}

// Update an incident status from an authenticated request.
export function patchIncidentStatus(req, res) {
  // Save the requested status change.
  const incident = updateIncidentStatus(req.params.id, req.body.status);

  // Return a 404 when the incident does not exist.
  if (!incident) return res.status(404).json({ message: "Incident not found." });

  // Return the updated incident.
  return res.json(incident);
}
