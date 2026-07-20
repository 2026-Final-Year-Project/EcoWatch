// Centralize the backend URL so every frontend fetch uses the same API base.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

// Fetch JSON from the Express API and throw useful errors for the UI.
export async function fetchJson(path, options = {}) {
  // Send the request to the configured backend.
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  // Turn non-2xx responses into readable JavaScript errors.
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: "API request failed." }));
    throw new Error(errorBody.message || "API request failed.");
  }

  // Return parsed JSON for successful responses.
  return response.json();
}

// Build a full API URL for links and downloads.
export function apiUrl(path) {
  // Join the configured API base with the provided route path.
  return `${API_BASE_URL}${path}`;
}
