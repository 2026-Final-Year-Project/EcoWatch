// Import the in-memory seed incident collection.
import { incidents } from "../data/incidents.js";

// Import the model factory used for new incidents.
import { createIncidentModel } from "../models/Incident.js";

// List incidents with optional filtering and sorting.
export function listIncidents(query = {}) {
  // Copy the array so sorting never mutates the seed order unexpectedly.
  let result = [...incidents];

  // Filter by incident type when requested.
  if (query.type && query.type !== "all") result = result.filter((item) => item.type === query.type);

  // Filter by severity when requested.
  if (query.severity && query.severity !== "all") result = result.filter((item) => item.severity === query.severity);

  // Filter by status when requested.
  if (query.status && query.status !== "all") result = result.filter((item) => item.status === query.status);

  // Sort incidents by detection timestamp from newest to oldest by default.
  result.sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));

  // Return the filtered incident list.
  return result;
}

// Return active incidents suitable for the live map.
export function listLiveIncidents() {
  // Keep the live map focused on the newest active detections.
  return listIncidents().slice(0, 2).map((incident) => ({
    ...incident,
    timeAgo: incident.timeAgo || "Recently detected",
  }));
}

// Find a single incident by numeric ID.
export function getIncidentById(id) {
  // Convert route params to numbers for consistent matching.
  return incidents.find((incident) => incident.id === Number(id));
}

// Create and store a new incident in the in-memory collection.
export function createIncident(payload) {
  // Calculate the next integer ID from the current collection.
  const nextId = Math.max(...incidents.map((incident) => incident.id)) + 1;

  // Normalize the submitted payload through the incident model.
  const incident = createIncidentModel(payload, nextId);

  // Store the incident for the lifetime of the running server.
  incidents.unshift(incident);

  // Return the newly created incident to the caller.
  return incident;
}

// Update the status of an existing incident.
export function updateIncidentStatus(id, status) {
  // Locate the incident by ID.
  const incident = getIncidentById(id);

  // Return null when no incident exists.
  if (!incident) return null;

  // Save the new response status.
  incident.status = status;

  // Return the updated incident.
  return incident;
}
