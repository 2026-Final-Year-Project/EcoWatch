const CSV_COLUMNS = [
  ['Incident ID', incident => incident.id],
  ['Date', incident => incident.date],
  ['Time', incident => incident.time],
  ['Type', incident => incident.type],
  ['Coordinates', incident => incident.coords],
  ['Latitude', incident => incident.lat],
  ['Longitude', incident => incident.lng],
  ['Area (ha)', incident => incident.hectares],
  ['Confidence (%)', incident => incident.confidence],
  ['Severity', incident => incident.severity],
  ['Status', incident => incident.status],
  ['Resolved Date', incident => incident.resolved],
  ['Notes', incident => incident.notes],
  ['Recommendation', incident => incident.recommendation],
  ['Authorities', incident => incident.authorities?.join('; ')],
]

export function escapeCsvValue(value) {
  const text = value == null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function incidentsToCsv(incidents) {
  const header = CSV_COLUMNS.map(([label]) => escapeCsvValue(label)).join(',')
  const rows = incidents.map(incident =>
    CSV_COLUMNS
      .map(([, getValue]) => escapeCsvValue(getValue(incident)))
      .join(',')
  )

  return [header, ...rows].join('\r\n')
}

export function createIncidentCsvFilename(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `ecowatch-incidents-${year}-${month}-${day}.csv`
}
