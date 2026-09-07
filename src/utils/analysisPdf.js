import { jsPDF } from 'jspdf'

// Convert remote imagery to embedded pixels so the PDF also works offline.
export function loadPdfImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timer = setTimeout(() => finish(new Error('Image download timed out. Please try again.')), 30000)
    const finish = (error, value) => {
      clearTimeout(timer)
      image.onload = null
      image.onerror = null
      if (error) reject(error)
      else resolve(value)
    }
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
        canvas.width = Math.round(image.naturalWidth * scale)
        canvas.height = Math.round(image.naturalHeight * scale)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        finish(null, { data: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height })
      } catch {
        finish(new Error('An image could not be embedded in the PDF. Please try again.'))
      }
    }
    image.onerror = () => finish(new Error('An image could not be downloaded. Please try again.'))
    image.src = url
  })
}

export async function buildAnalysisPdf(prediction, comparison, { loadImage = loadPdfImage, generatedAt = new Date() } = {}) {
  const years = [2022, 2023, 2024, 2025, 2026]
  if (!prediction?.previewUrl || !years.every(year => comparison?.some(item => item.year === year && item.image_url))) {
    throw new Error('Wait for all five Sentinel images before downloading the PDF.')
  }
  const annual = years.map(year => comparison.find(item => item.year === year))
  const images = await Promise.all([prediction.previewUrl, ...annual.map(item => item.image_url)].map(loadImage))
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const coordinates = `${prediction.latitude.toFixed(5)}, ${prediction.longitude.toFixed(5)}`
  const header = (title) => {
    doc.setFillColor(31, 59, 23)
    doc.rect(0, 0, 210, 32, 'F')
    doc.setTextColor(255)
    doc.setFontSize(18)
    doc.text(title, 15, 15)
    doc.setFontSize(9)
    doc.text(`Selected location: ${coordinates}`, 15, 24)
    doc.setTextColor(30, 41, 59)
  }
  const paragraph = (text, y) => {
    doc.setFontSize(10)
    doc.text(doc.splitTextToSize(text, 180), 15, y)
  }
  const drawImage = (image, y, maxHeight) => {
    const scale = Math.min(180 / image.width, maxHeight / image.height)
    const width = image.width * scale
    doc.addImage(image.data, 'PNG', (210 - width) / 2, y, width, image.height * scale)
  }
  const number = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : 'Unavailable'
  header('EcoWatch Analysis Report')
  paragraph(`Generated: ${generatedAt.toISOString()}`, 43)
  paragraph(`Model result: ${prediction.mining_detected ? 'Mining signal detected' : 'No mining signal detected'}`, 54)
  paragraph(`Detection level: ${String(prediction.detection_level || 'Unavailable').replaceAll('_', ' ')}`, 65)
  paragraph(`Average tile probability: ${number(prediction.probability * 100)}% (not detection confidence)`, 76)
  paragraph(`Affected area: ${number(prediction.affected_area_m2 / 10000)} ha`, 87)
  paragraph(`Largest connected mining region: ${number(prediction.largest_component_pixels, 0)} pixels`, 98)
  paragraph(`Model version: ${prediction.model_version || 'Unavailable'}`, 109)
  paragraph('Detection uses connected mining pixels: 25 pixels (0.25 ha) confirms a signal; 100 pixels (1 ha) is high confidence.', 124)
  paragraph('Land view at the analysed location', 146)
  drawImage(images[0], 153, 105)
  paragraph('Source: Esri World Imagery. Basemap imagery is not a live capture and may differ from the Sentinel analysis scene.', 269)
  annual.forEach((item, index) => {
    doc.addPage()
    header(`Sentinel-2 land view - ${item.year}`)
    paragraph(`Requested imagery window: ${item.year}-01-01 to ${item.year + 1}-01-01`, 45)
    drawImage(images[index + 1], 57, 198)
    paragraph('Source: Sentinel-2 imagery returned by EcoWatch. Annual views show the same selected location for comparison.', 267)
  })
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`EcoWatch | ${page} / ${doc.getNumberOfPages()}`, 15, 289)
  }
  return doc
}
