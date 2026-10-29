import { HttpError, body, createResponder } from "./http.mjs";

function coordinates(value) {
  if (!Array.isArray(value) || value.length !== 2) throw new HttpError(400, "Choose a valid start and destination");
  const [longitude, latitude] = value.map(Number);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new HttpError(400, "Choose a valid start and destination");
  }
  return [longitude, latitude];
}

export async function handleMapRoutes({ res, path, method, req, config }) {
  if (path !== "/api/map/directions") return false;
  if (method !== "POST") throw new HttpError(405, "Method not allowed");
  if (!config.openrouteserviceKey) throw new HttpError(503, "In-app directions are not configured yet");
  const input = await body(req);
  const start = coordinates(input.start);
  const end = coordinates(input.end);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch("https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: { Authorization: config.openrouteserviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [start, end], instructions: true, language: "en" }),
      signal: controller.signal
    });
  } catch { throw new HttpError(502, "Directions are temporarily unavailable"); }
  finally { clearTimeout(timer); }
  if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502, response.status === 429 ? "Map request limit reached. Try later" : "No driving route was found");
  const payload = await response.json();
  const route = payload.features?.[0];
  if (!route) throw new HttpError(404, "No driving route was found");
  const summary = route.properties?.summary || {};
  const steps = (route.properties?.segments || []).flatMap(segment => segment.steps || []).slice(0, 120).map(step => ({
    instruction: String(step.instruction || "").slice(0, 300),
    distance: Number(step.distance) || 0,
    duration: Number(step.duration) || 0
  }));
  return createResponder(res)(200, { distance: Number(summary.distance) || 0, duration: Number(summary.duration) || 0, steps });
}
