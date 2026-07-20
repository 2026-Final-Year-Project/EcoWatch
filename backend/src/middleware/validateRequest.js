// Validate that a request body contains required fields.
export function requireFields(...fields) {
  // Return middleware configured for the provided field list.
  return (req, res, next) => {
    // Find the first missing or empty field.
    const missing = fields.find((field) => req.body[field] === undefined || req.body[field] === "");

    // Reject invalid payloads with a useful message.
    if (missing) return res.status(400).json({ message: `${missing} is required.` });

    // Continue when all required fields exist.
    return next();
  };
}
