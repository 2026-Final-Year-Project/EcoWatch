import { jsPDF } from 'jspdf'

const COLUMNS = [
  { label: 'ID', width: 14, value: incident => incident.id },
  { label: 'Detected', width: 29, value: incident => `${incident.date} ${incident.time}` },
  { label: 'Type', width: 27, value: incident => incident.type },
  { label: 'Severity', width: 20, value: incident => incident.severity },
  { label: 'Status', width: 23, value: incident => incident.status },
  { label: 'Area (ha)', width: 17, value: incident => incident.hectares },
  { label: 'Confidence', width: 20, value: incident => `${incident.confidence}%` },
  { label: 'Coordinates', width: 43, value: incident => incident.coords },
  { label: 'Resolved', width: 25, value: incident => incident.resolved },
  { label: 'Notes', width: 55, value: incident => incident.notes },
]

export function normalizePdfText(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
}

export function createHistoryAnalyticsFilename(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `ecowatch-history-analytics-${year}-${month}-${day}.pdf`
}

export function createHistoricalReportFilename(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `ecowatch-historical-report-${year}-${month}-${day}.pdf`
}

export function buildHistoryAnalyticsPdf(
  incidents,
  generatedAt = new Date(),
  title = 'EcoWatch History Analytics'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const tableWidth = COLUMNS.reduce((sum, column) => sum + column.width, 0)
  const lineHeight = 3.1
  const rowPadding = 2
  let pageNumber = 1
  let cursorY = 0

  const drawPageHeader = () => {
    doc.setFillColor(74, 94, 26)
    doc.rect(0, 0, pageWidth, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(normalizePdfText(title), margin, 11)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(
      `${incidents.length} filtered incident${incidents.length === 1 ? '' : 's'} | Generated ${generatedAt.toLocaleString()}`,
      margin,
      18
    )

    doc.setFillColor(232, 237, 218)
    doc.rect(margin, 30, tableWidth, 8, 'F')
    doc.setTextColor(45, 55, 35)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)

    let x = margin
    COLUMNS.forEach(column => {
      doc.text(column.label, x + 1.5, 35)
      x += column.width
    })
    cursorY = 38
  }

  const drawPageFooter = () => {
    doc.setDrawColor(210, 215, 205)
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9)
    doc.setTextColor(110, 115, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 5, { align: 'right' })
  }

  drawPageHeader()

  incidents.forEach((incident, index) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)

    const cells = COLUMNS.map(column => {
      const text = normalizePdfText(column.value(incident))
      return doc.splitTextToSize(text, column.width - 3)
    })
    const rowHeight = Math.max(8, Math.max(...cells.map(lines => lines.length)) * lineHeight + rowPadding * 2)

    if (cursorY + rowHeight > pageHeight - 12) {
      drawPageFooter()
      doc.addPage()
      pageNumber += 1
      drawPageHeader()
    }

    if (index % 2 === 1) {
      doc.setFillColor(247, 248, 243)
      doc.rect(margin, cursorY, tableWidth, rowHeight, 'F')
    }

    doc.setDrawColor(225, 228, 218)
    doc.line(margin, cursorY + rowHeight, margin + tableWidth, cursorY + rowHeight)
    doc.setTextColor(45, 50, 42)

    let x = margin
    cells.forEach((lines, columnIndex) => {
      doc.text(lines, x + 1.5, cursorY + rowPadding + 2.2)
      x += COLUMNS[columnIndex].width
    })
    cursorY += rowHeight
  })

  if (incidents.length === 0) {
    doc.setTextColor(100, 105, 95)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.text('No incidents match the selected filters.', margin + 2, cursorY + 7)
  }

  drawPageFooter()
  return doc
}
