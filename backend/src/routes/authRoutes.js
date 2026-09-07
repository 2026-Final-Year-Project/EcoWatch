import { revokeToken } from "../services/authService.js";
import { requireAuth } from "../middleware/authMiddleware.js";
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

router.post('/logout', requireAuth, (req, res) => {
  revokeToken(req.headers.authorization.slice(7));
  res.sendStatus(204);
});
router.get('/me', requireAuth, (req, res) => res.json({ id: req.user.sub, name: req.user.name, email: req.user.email, role: req.user.role }));
// Export the configured auth router.
export default router;
