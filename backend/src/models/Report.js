// Build a report object from an incident so API responses stay consistent.
export function createReportFromIncident(incident) {
  // Convert incident details into the printable report fields.
  return {
    id: `REP-${String(incident.id).padStart(3, "0")}`,
    incidentId: incident.id,
    title: `${incident.type} Incident`,
    reporter: "EcoWatch Detection Engine",
    location: incident.coords,
    date: incident.date,
    time: incident.time,
    description: incident.notes,
    recommendation: incident.recommendation,
    authorities: incident.authorities,
    status: incident.status,
  };
}
