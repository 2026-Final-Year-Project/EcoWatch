// Import token verification from the auth service.
import { verifyToken } from "../services/authService.js";

// Require a valid bearer token for protected routes.
export function requireAuth(req, res, next) {
  // Read the Authorization header from the request.
  const authHeader = req.headers.authorization || "";

  // Extract the token from a standard Bearer header.
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // Verify the token and decode the user payload.
  const user = token ? verifyToken(token) : null;

  // Reject missing or invalid tokens.
  if (!user) return res.status(401).json({ message: "Authentication required." });

  // Attach the user payload for downstream controllers.
  req.user = user;

  // Continue to the protected controller.
  return next();
}

// Restrict a route to one or more roles.
export function requireRole(...roles) {
  // Return middleware that checks the authenticated user's role.
  return (req, res, next) => {
    // Reject users whose role is not allowed for this action.
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: "Permission denied." });

    // Continue when the role is allowed.
    return next();
  };
}
