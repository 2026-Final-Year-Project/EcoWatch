// Wrap an authority name in a stable API shape for future metadata expansion.
export function createAuthorityModel(name, index) {
  // Keep IDs deterministic while the project uses seed data.
  return {
    id: index + 1,
    name,
  };
}
