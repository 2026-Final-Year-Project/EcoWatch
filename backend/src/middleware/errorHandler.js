// Convert thrown errors into a predictable JSON response.
export function errorHandler(err, _req, res, _next) {
  // Log the error for local debugging.
  console.error(err);

  // Return the provided status code or a generic server error.
  res.status(err.status || 500).json({
    message: err.message || "Unexpected server error.",
  });
}
