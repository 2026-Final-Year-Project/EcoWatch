// Import the seed authority list.
import { authorities } from "../data/authorities.js";

// Import the authority model helper.
import { createAuthorityModel } from "../models/Authority.js";

// Return all authorities available for escalation.
export function getAuthorities(_req, res) {
  // Wrap authority names in objects for a future-proof API response.
  res.json(authorities.map(createAuthorityModel));
}
