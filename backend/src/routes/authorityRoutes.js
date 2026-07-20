// Import Express router creation.
import { Router } from "express";

// Import authority controller functions.
import { getAuthorities } from "../controllers/authorityController.js";

// Create the authority router.
const router = Router();

// Return authorities that can receive escalations.
router.get("/", getAuthorities);

// Export the configured authority router.
export default router;
