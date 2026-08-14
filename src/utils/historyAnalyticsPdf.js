import { jsPDF } from 'jspdf'

const COLUMNS = [
  { label: 'Analysed', width: 31, value: run => new Date(run.analysedAt).toLocaleString() },
  { label: 'Source', width: 25, value: run => run.source === 'community-report' ? 'Community report' : 'Map analysis' },
  { label: 'Result', width: 28, value: run => run.miningDetected ? 'Mining signal detected' : 'No mining detected' },
  { label: 'Level', width: 20, value: run => run.detectionLevel || 'none' },
  { label: 'Mean probability', width: 27, value: run => `${(run.meanProbability * 100).toFixed(2)}%` },
  { label: 'Affected area', width: 25, value: run => `${(run.affectedAreaM2 / 10_000).toFixed(3)} ha` },
  { label: 'Largest region', width: 25, value: run => `${run.largestComponentPixels} px` },
  { label: 'Coordinates', width: 42, value: run => `${run.latitude.toFixed(5)}, ${run.longitude.toFixed(5)}` },
  { label: 'Inference window', width: 40, value: run => run.dateStart && run.dateEnd ? `${run.dateStart} to ${run.dateEnd}` : 'Latest available scene' },
  { label: 'Model version', width: 30, value: run => run.modelVersion },
]

export function createHistoryAnalyticsFilename(date = new Date()) {
  return `ecowatch-history-analytics-${date.toISOString().slice(0, 10)}.pdf`
}

export function createHistoricalReportFilename(date = new Date()) {
  return `ecowatch-historical-report-${date.toISOString().slice(0, 10)}.pdf`
}

export function buildHistoryAnalyticsPdf(runs, generatedAt = new Date(), title = 'EcoWatch Model Analysis History') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const tableWidth = COLUMNS.reduce((sum, column) => sum + column.width, 0)
  const lineHeight = 3.2
  let pageNumber = 1
  let cursorY = 0

  const drawHeader = () => {
    doc.setFillColor(31, 59, 23)
    doc.rect(0, 0, pageWidth, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(title, margin, 11)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`${runs.length} recorded model run${runs.length === 1 ? '' : 's'} | Generated ${generatedAt.toLocaleString()}`, margin, 18)
    doc.setFillColor(232, 237, 218)
    doc.rect(margin, 30, tableWidth, 8, 'F')
    doc.setTextColor(45, 55, 35)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    let x = margin
    COLUMNS.forEach(column => { doc.text(column.label, x + 1.3, 35); x += column.width })
    cursorY = 38
  }

  const drawFooter = () => {
    doc.setDrawColor(210, 215, 205)
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9)
    doc.setTextColor(110, 115, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 5, { align: 'right' })
  }

  drawHeader()
  runs.forEach((run, index) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.2)
    const cells = COLUMNS.map(column => doc.splitTextToSize(String(column.value(run) ?? ''), column.width - 2.6))
    const rowHeight = Math.max(8, Math.max(...cells.map(lines => lines.length)) * lineHeight + 4)
    if (cursorY + rowHeight > pageHeight - 12) {
      drawFooter()
      doc.addPage()
      pageNumber += 1
      drawHeader()
    }
    if (index % 2 === 1) { doc.setFillColor(247, 248, 243); doc.rect(margin, cursorY, tableWidth, rowHeight, 'F') }
    doc.setDrawColor(225, 228, 218)
    doc.line(margin, cursorY + rowHeight, margin + tableWidth, cursorY + rowHeight)
    doc.setTextColor(45, 50, 42)
    let x = margin
    cells.forEach((lines, columnIndex) => { doc.text(lines, x + 1.3, cursorY + 3.3); x += COLUMNS[columnIndex].width })
    cursorY += rowHeight
  })
  if (runs.length === 0) {
    doc.setTextColor(100, 105, 95)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('No model analyses match the selected filters.', margin + 2, cursorY + 8)
  }
  drawFooter()
  return doc
}
