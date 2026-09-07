const KEY = 'ecowatch-analysis-report-draft'

export function saveAnalysisReportDraft(prediction) {
  if (!prediction.analysisId) throw new Error('Run the map analysis again to prepare a report with its saved results.')
  const { latitude, longitude, mining_detected, probability, affected_area_m2, largest_component_pixels, model_version } = prediction
  const summary = [
    'Map analysis supplied by reporter:',
    `Coordinates: ${latitude}, ${longitude}`,
    `Model result: ${mining_detected ? 'Mining signal detected' : 'No mining signal detected'}`,
    `Average tile probability: ${(probability * 100).toFixed(2)}% (not detection confidence)`,
    `Affected area: ${(affected_area_m2 / 10000).toFixed(2)} ha`,
    `Largest connected region: ${largest_component_pixels} pixels`,
    `Model: ${String(model_version || 'Unavailable').slice(0, 100)}`,
  ].join('\n')
  window.sessionStorage.setItem(KEY, JSON.stringify({ latitude, longitude, summary, analysisId: prediction.analysisId }))
}

export function readAnalysisReportDraft() {
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(KEY) || 'null')
    return draft && typeof draft.analysisId === 'string' && draft.analysisId.length > 0 && Number.isFinite(draft.latitude) && Math.abs(draft.latitude) <= 90
      && Number.isFinite(draft.longitude) && Math.abs(draft.longitude) <= 180
      && typeof draft.summary === 'string' && draft.summary.length <= 2000 ? draft : null
  } catch {
    return null
  }
}

export function clearAnalysisReportDraft() {
  try { window.sessionStorage.removeItem(KEY) } catch { /* Storage may be unavailable. */ }
}
