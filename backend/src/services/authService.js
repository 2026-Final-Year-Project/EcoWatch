// Import Node crypto for password comparison helpers and signed token creation.
import crypto from "crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Import demo users until a database-backed user table is added.
import { users } from "../data/users.js";

// Resolve the signing secret from the environment with a local-only fallback.
const secret = process.env.AUTH_SECRET || "dev-ecowatch-secret";
const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const communityUsersPath = resolve(moduleDirectory, "../../data/community-users.json");

function readCommunityUsers() {
  if (!existsSync(communityUsersPath)) return [];
  return JSON.parse(readFileSync(communityUsersPath, "utf8"));
}

function writeCommunityUsers(users) {
  const temporaryPath = `${communityUsersPath}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(users, null, 2));
  renameSync(temporaryPath, communityUsersPath);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function passwordMatches(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const calculated = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(calculated, "hex"));
}

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

function createSession(user) {
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  return {
    token: `${encodedPayload}.${sign(encodedPayload)}`,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

// Authenticate a demo user and return a signed token.
export function loginUser(email, password) {
  // Find a matching demo account by email and password.
  const user = users.find((item) => item.email === email && item.password === password);

  // Return null when the credentials do not match.
  if (user) return createSession(user);

  const communityUser = readCommunityUsers().find((item) => item.email === email.trim().toLowerCase());
  if (!communityUser || !passwordMatches(password, communityUser.passwordHash)) return null;
  return createSession(communityUser);
}

export function registerCommunityUser(name, email, password) {
  const normalizedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedName || normalizedName.length > 80) throw new Error("Enter a name of up to 80 characters.");
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error("Enter a valid email address.");
  if (typeof password !== "string" || password.length < 8) throw new Error("Use a password of at least 8 characters.");

  const communityUsers = readCommunityUsers();
  if (users.some((item) => item.email === normalizedEmail) || communityUsers.some((item) => item.email === normalizedEmail)) {
    throw new Error("An account already exists for that email address.");
  }

  const user = { id: crypto.randomUUID(), name: normalizedName, email: normalizedEmail, passwordHash: hashPassword(password), role: "community" };
  communityUsers.push(user);
  writeCommunityUsers(communityUsers);
  return createSession(user);
}

// Verify a bearer token and return the decoded user payload.
export function verifyToken(token) {
  // Split the token into payload and signature sections.
  const [encodedPayload, signature] = token.split(".");

  // Reject malformed tokens before doing any signature checks.
  if (!encodedPayload || !signature) return null;

  // Compare the provided signature with the expected HMAC signature.
  const expectedSignature = sign(encodedPayload);
  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

  // Decode the payload JSON after the signature is trusted.
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  // Reject expired tokens.
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  // Return the verified user payload.
  return payload;
}
