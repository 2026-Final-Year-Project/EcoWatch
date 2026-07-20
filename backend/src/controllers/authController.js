// Import the auth service used to verify credentials.
import { loginUser } from "../services/authService.js";

// Handle admin and authority login requests.
export function login(req, res) {
  // Pull credentials from the JSON request body.
  const { email, password } = req.body;

  // Attempt to authenticate the user.
  const session = loginUser(email, password);

  // Reject invalid credentials without exposing which field failed.
  if (!session) return res.status(401).json({ message: "Invalid email or password." });

  // Return the signed token and safe user profile.
  return res.json(session);
}
