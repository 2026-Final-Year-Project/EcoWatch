// This project starts with JSON seed data so the backend is easy to run locally.
// Replace this file with a MongoDB or PostgreSQL adapter when persistence is needed.
export const db = {
  // Keep the storage mode explicit so services can branch later without guessing.
  mode: "json-seed",
};
