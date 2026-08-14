// Import Express router creation.
import { Router } from "express";

// Import auth controller functions.
import { login, register } from "../controllers/authController.js";

// Import request validation middleware.
import { requireFields } from "../middleware/validateRequest.js";

// Create the auth router.
const router = Router();

// Log in an admin or authority user.
router.post("/login", requireFields("email", "password"), login);
router.post("/register", requireFields("name", "email", "password"), register);

// Export the configured auth router.
export default router;
