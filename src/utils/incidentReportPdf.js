import { buildHistoryAnalyticsPdf } from './historyAnalyticsPdf.js'

export function createIncidentReportFilename(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `ecowatch-incident-report-${year}-${month}-${day}.pdf`
}

export function buildIncidentReportPdf(incidents, generatedAt = new Date()) {
  return buildHistoryAnalyticsPdf(incidents, generatedAt, 'EcoWatch Incident Report')
}
