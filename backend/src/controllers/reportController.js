// Import incident lookup helpers for report generation.
import { getIncidentById, listIncidents } from "../services/incidentService.js";

// Import the report model helper.
import { createReportFromIncident } from "../models/Report.js";

// Import the PDF generation service.
import { generateReportPdf } from "../services/reportPdfService.js";

// Return reports derived from all incidents.
export function getReports(_req, res) {
  // Convert each incident into report summary data.
  res.json(listIncidents().map(createReportFromIncident));
}

// Return a printable report for the newest incident.
export function getLatestReport(_req, res) {
  // Select the newest incident after service-level sorting.
  const [incident] = listIncidents();

  // Return the derived latest report.
  res.json(createReportFromIncident(incident));
}

// Return a single report derived from an incident ID.
export function getReport(req, res) {
  // Find the source incident for this report.
  const incident = getIncidentById(req.params.id);

  // Return a 404 when no incident matches.
  if (!incident) return res.status(404).json({ message: "Report not found." });

  // Return the derived report.
  return res.json(createReportFromIncident(incident));
}

// Generate and download a PDF report for an incident.
export function downloadReportPdf(req, res) {
  // Use the latest incident when the route has no ID or explicitly asks for latest.
  const incident = !req.params.id || req.params.id === "latest" ? listIncidents()[0] : getIncidentById(req.params.id);

  // Return a 404 when no incident can be found.
  if (!incident) return res.status(404).json({ message: "Report not found." });

  // Convert the incident into report data.
  const report = createReportFromIncident(incident);

  // Generate the PDF document as a binary buffer.
  const pdf = generateReportPdf(report);

  // Send headers that make browsers download the generated PDF.
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${report.id}.pdf"`);

  // Return the generated PDF bytes.
  res.send(pdf);
}
