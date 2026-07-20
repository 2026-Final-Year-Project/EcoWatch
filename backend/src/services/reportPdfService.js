// Escape special PDF text characters so generated documents stay valid.
function escapePdfText(value) {
  // Convert the value to a string and escape backslashes and parentheses.
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

// Create a compact PDF buffer from report lines using plain PDF syntax.
export function generateReportPdf(report) {
  // Build the lines that will be drawn into the PDF page.
  const lines = [
    "EcoWatch Incident Report",
    `Report ID: ${report.id}`,
    `Incident ID: ${report.incidentId}`,
    `Title: ${report.title}`,
    `Reporter: ${report.reporter}`,
    `Location: ${report.location}`,
    `Date: ${report.date} ${report.time}`,
    `Status: ${report.status}`,
    `Authorities: ${report.authorities.join(", ") || "Pending assignment"}`,
    `Recommendation: ${report.recommendation}`,
    `Description: ${report.description}`,
  ];

  // Draw each report line at a decreasing y position.
  const textCommands = lines
    .map((line, index) => `BT /F1 12 Tf 50 ${760 - index * 28} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  // Define the PDF objects needed for one-page text output.
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(textCommands)} >>\nstream\n${textCommands}\nendstream`,
  ];

  // Start the PDF document with the required header.
  let pdf = "%PDF-1.4\n";

  // Track object offsets for the cross-reference table.
  const offsets = [0];

  // Append every PDF object and record its byte offset.
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  // Record the xref start offset after all objects are written.
  const xrefStart = Buffer.byteLength(pdf);

  // Write the cross-reference table.
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  // Add each object offset in fixed-width PDF format.
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  // Finish the PDF trailer.
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  // Return the complete PDF as a binary buffer.
  return Buffer.from(pdf, "utf8");
}
