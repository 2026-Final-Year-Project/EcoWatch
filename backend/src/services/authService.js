// Import Node crypto for password comparison helpers and signed token creation.
import crypto from "crypto";

// Import demo users until a database-backed user table is added.
import { users } from "../data/users.js";

// Resolve the signing secret from the environment with a local-only fallback.
const secret = process.env.AUTH_SECRET || "dev-ecowatch-secret";

// Convert JSON to URL-safe base64 so tokens can travel in HTTP headers.
function base64url(value) {
  // Encode text and remove padding characters for a compact token.
  return Buffer.from(value).toString("base64url");
}

// Sign token content with HMAC so the API can verify it later.
function sign(value) {
  // Create a SHA-256 signature using the configured secret.
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

// Authenticate a demo user and return a signed token.
export function loginUser(email, password) {
  // Find a matching demo account by email and password.
  const user = users.find((item) => item.email === email && item.password === password);

  // Return null when the credentials do not match.
  if (!user) return null;

  // Keep the token payload small and avoid storing the password in it.
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  };

  // Encode and sign the token payload.
  const encodedPayload = base64url(JSON.stringify(payload));

  // Return the token plus safe user profile details.
  return {
    token: `${encodedPayload}.${sign(encodedPayload)}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

// Verify a bearer token and return the decoded user payload.
export function verifyToken(token) {
  // Split the token into payload and signature sections.
  const [encodedPayload, signature] = token.split(".");

  // Reject malformed tokens before doing any signature checks.
  if (!encodedPayload || !signature) return null;

  // Compare the provided signature with the expected HMAC signature.
  if (signature !== sign(encodedPayload)) return null;

  // Decode the payload JSON after the signature is trusted.
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

  // Reject expired tokens.
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  // Return the verified user payload.
  return payload;
}
