// Import the configured Express application.
import app from "./app.js";

// Read the API port from the environment and use 5050 by default to avoid macOS AirPlay's port 5000.
const port = process.env.PORT || 5050;

// Start the HTTP server for the EcoWatch API.
app.listen(port, () => {
  // Log the local API URL so developers can connect the Next.js frontend.
  console.log(`EcoWatch API running on http://localhost:${port}`);
});
