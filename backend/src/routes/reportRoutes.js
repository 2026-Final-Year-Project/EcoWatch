// Import Express router creation.
import { Router } from "express";

// Import report controller functions.
import { downloadReportPdf, getLatestReport, getReport, getReports } from "../controllers/reportController.js";

// Create the report router.
const router = Router();

// Return all report summaries.
router.get("/", getReports);

// Return the latest printable report data.
router.get("/latest", getLatestReport);

// Download a PDF for the latest report.
router.get("/latest/pdf", downloadReportPdf);

// Return one report by incident ID.
router.get("/:id", getReport);

// Download a generated PDF by incident ID.
router.get("/:id/pdf", downloadReportPdf);

// Export the configured report router.
export default router;
