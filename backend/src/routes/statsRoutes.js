// Import Express router creation.
import { Router } from "express";

// Import stats controller functions.
import { getStats } from "../controllers/statsController.js";

// Create the stats router.
const router = Router();

// Return aggregate incident stats.
router.get("/", getStats);

// Export the configured stats router.
export default router;
