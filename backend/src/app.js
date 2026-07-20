// Import Express for routing and middleware composition.
import express from "express";

// Import CORS so the Next.js frontend can call the API during local development.
import cors from "cors";

// Import route modules for each backend area.
import authRoutes from "./routes/authRoutes.js";
import authorityRoutes from "./routes/authorityRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

// Import the shared error handler used at the end of the middleware chain.
import { errorHandler } from "./middleware/errorHandler.js";

// Create a single Express app instance for the project.
const app = express();

// Allow the configured frontend origin to call this API.
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));

// Parse JSON request bodies sent by the frontend or admin tools.
app.use(express.json());

// Provide a tiny health check for uptime checks and local debugging.
app.get("/api/health", (_req, res) => {
  // Return a stable health payload for callers.
  res.json({ status: "ok", service: "ecowatch-api" });
});

// Mount authentication endpoints.
app.use("/api/auth", authRoutes);

// Mount authority lookup endpoints.
app.use("/api/authorities", authorityRoutes);

// Mount incident CRUD and live-map endpoints.
app.use("/api/incidents", incidentRoutes);

// Mount report and PDF generation endpoints.
app.use("/api/reports", reportRoutes);

// Mount statistics endpoints for dashboard summaries.
app.use("/api/stats", statsRoutes);

// Convert thrown errors into consistent JSON responses.
app.use(errorHandler);

// Export the configured app for the server entry point and future tests.
export default app;
