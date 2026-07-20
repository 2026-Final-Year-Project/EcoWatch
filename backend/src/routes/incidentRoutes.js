// Import Express router creation.
import { Router } from "express";

// Import incident controller functions.
import {
  getIncident,
  getIncidents,
  getLiveIncidents,
  patchIncidentStatus,
  postIncident,
} from "../controllers/incidentController.js";

// Import auth and validation middleware.
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { requireFields } from "../middleware/validateRequest.js";

// Create the incident router.
const router = Router();

// Return incidents for report and history screens.
router.get("/", getIncidents);

// Return the latest active incidents for the live map.
router.get("/live", getLiveIncidents);

// Return a single incident by ID.
router.get("/:id", getIncident);

// Create incidents only as authenticated admins or authorities.
router.post("/", requireAuth, requireRole("admin", "authority"), requireFields("type", "lat", "lng"), postIncident);

// Update status only as authenticated admins or authorities.
router.patch("/:id/status", requireAuth, requireRole("admin", "authority"), requireFields("status"), patchIncidentStatus);

// Export the configured incident router.
export default router;
