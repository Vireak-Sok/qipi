import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { JsonStore, SupabaseStore } from "./src/store.mjs";
import { routeById, routes } from "./src/routes.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const defaultDataFile = join(root, "data", "store.json");
const defaultPublicDir = join(root, "public");
const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/admin.html", ["admin.html", "text/html; charset=utf-8"]],
  ["/admin.js", ["admin.js", "text/javascript; charset=utf-8"]],
  ["/favicon.svg", ["favicon.svg", "image/svg+xml"]]
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const token = () => randomBytes(24).toString("base64url");
const digest = (value) => createHash("sha256").update(value).digest("hex");

function sameSecret(provided, expectedHash) {
  if (typeof provided !== "string" || !provided || !expectedHash) return false;
  const received = Buffer.from(digest(provided), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function text(value, field, min, max) {
  if (typeof value !== "string") throw new HttpError(400, `${field} is required`);
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length < min || clean.length > max) {
    throw new HttpError(400, `${field} must be ${min}–${max} characters`);
  }
  return clean;
}

function optionalText(value, field, max) {
  if (value == null || value === "") return "";
  return text(value, field, 0, max);
}

function choice(value, field, allowed) {
  if (!allowed.includes(value)) throw new HttpError(400, `${field} is invalid`);
  return value;
}

function dateField(value, field, { future = false, past = false } = {}) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${field} must be YYYY-MM-DD`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${field} is invalid`);
  }
  const today = todayInCambodia();
  if (future && value < today) throw new HttpError(400, `${field} must be today or later`);
  if (past && value > today) throw new HttpError(400, `${field} cannot be in the future`);
  return value;
}

function todayInCambodia() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Phnom_Penh", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const part = (name) => parts.find((item) => item.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function timeField(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new HttpError(400, "departureTime must be HH:MM");
  }
  return value;
}

async function body(req) {
  if (typeof req.headers["content-type"] !== "string" ||
      !req.headers["content-type"].startsWith("application/json")) {
    throw new HttpError(415, "Send JSON content");
  }
  let raw;
  if (req.body !== undefined && req.body !== null) {
    raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  } else {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16_384) throw new HttpError(413, "Request is too large");
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  }
  if (Buffer.byteLength(raw, "utf8") > 16_384) throw new HttpError(413, "Request is too large");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("object required");
    return value;
  } catch {
    throw new HttpError(400, "Invalid JSON object");
  }
}

function json(res, status, value) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  res.end(JSON.stringify(value));
}

function publicTrip(trip, data) {
  const approvedCount = data.joinRequests.filter(
    (request) => request.tripId === trip.id && request.status === "approved"
  ).length;
  return {
    id: trip.id,
    routeId: trip.routeId,
    title: trip.title,
    date: trip.date,
    departureTime: trip.departureTime,
    transport: trip.transport,
    seats: trip.seats,
    availableSpots: Math.max(0, trip.seats - approvedCount),
    meetingArea: trip.meetingArea,
    costStyle: trip.costStyle,
    notes: trip.notes,
    hostName: trip.hostName,
    status: trip.status,
    createdAt: trip.createdAt
  };
}

function findTrip(data, id, { includeHidden = false } = {}) {
  const trip = data.trips.find((item) => item.id === id);
  if (!trip || (!includeHidden && trip.hidden)) throw new HttpError(404, "Trip not found");
  return trip;
}

function owner(req, trip) {
  if (!sameSecret(req.headers["x-host-token"], trip.ownerTokenHash)) {
    throw new HttpError(403, "This trip belongs to another host");
  }
}

function admin(req, adminToken) {
  if (!adminToken) throw new HttpError(503, "Admin access is not configured");
  if (typeof req.headers["x-admin-token"] !== "string" ||
      !sameSecret(req.headers["x-admin-token"], digest(adminToken))) {
    throw new HttpError(403, "Admin token is invalid");
  }
}

function addEvent(data, type, targetId = "") {
  data.events.push({ id: randomUUID(), type, targetId, at: new Date().toISOString() });
  if (data.events.length > 3000) data.events.splice(0, data.events.length - 3000);
}

export function createQipiHandler({
  dataFile = defaultDataFile,
  publicDir = defaultPublicDir,
  adminToken = process.env.QIPI_ADMIN_TOKEN || "",
  store = process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
    ? new SupabaseStore({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SECRET_KEY })
    : new JsonStore(dataFile)
} = {}) {
  const recentWrites = new Map();

  function limitWrites(req) {
    const key = (typeof req.headers["x-real-ip"] === "string" && req.headers["x-real-ip"]) ||
      req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const recent = (recentWrites.get(key) || []).filter((time) => now - time < 15 * 60_000);
    if (recent.length >= 80) throw new HttpError(429, "Too many requests; try again later");
    recent.push(now);
    recentWrites.set(key, recent);
  }

  const handler = async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const rewrittenPath = url.pathname === "/api/index" ? url.searchParams.get("_qipi_path") : null;
      const path = rewrittenPath ? `/api/${rewrittenPath.replace(/^\/+/, "")}` : url.pathname;
      const method = req.method || "GET";
      if (method !== "GET" && method !== "HEAD") limitWrites(req);

      if (path === "/api/health" && method === "GET") {
        await store.read();
        return json(res, 200, { ok: true, name: "Qipi", storage: store instanceof SupabaseStore ? "supabase" : "local" });
      }
      if (path === "/api/routes" && method === "GET") return json(res, 200, { routes });

      const routeMatch = /^\/api\/routes\/([a-z0-9-]+)$/.exec(path);
      if (routeMatch && method === "GET") {
        const route = routeById.get(routeMatch[1]);
        if (!route) throw new HttpError(404, "Route not found");
        const data = await store.read();
        const updates = data.routeUpdates
          .filter((update) => update.routeId === route.id && update.status === "approved")
          .sort((a, b) => b.visitedOn.localeCompare(a.visitedOn));
        return json(res, 200, { route, updates });
      }

      const updateMatch = /^\/api\/routes\/([a-z0-9-]+)\/updates$/.exec(path);
      if (updateMatch && method === "POST") {
        if (!routeById.has(updateMatch[1])) throw new HttpError(404, "Route not found");
        const input = await body(req);
        const update = {
          id: randomUUID(),
          routeId: updateMatch[1],
          nickname: text(input.nickname, "nickname", 2, 40),
          visitedOn: dateField(input.visitedOn, "visitedOn", { past: true }),
          condition: choice(input.condition, "condition", ["good", "mixed", "caution"]),
          note: text(input.note, "note", 10, 500),
          status: "pending",
          createdAt: new Date().toISOString()
        };
        await store.mutate((data) => { data.routeUpdates.push(update); addEvent(data, "route_update", update.routeId); });
        return json(res, 201, { id: update.id, status: update.status });
      }

      if (path === "/api/trips" && method === "GET") {
        const data = await store.read();
        const routeId = url.searchParams.get("route");
        const includeClosed = url.searchParams.get("includeClosed") === "true";
        const today = todayInCambodia();
        const trips = data.trips
          .filter((trip) => !trip.hidden && (includeClosed || (trip.status === "open" && trip.date >= today)))
          .filter((trip) => !routeId || trip.routeId === routeId)
          .sort((a, b) => a.date.localeCompare(b.date) || a.departureTime.localeCompare(b.departureTime))
          .map((trip) => publicTrip(trip, data));
        return json(res, 200, { trips });
      }

      if (path === "/api/trips" && method === "POST") {
        const input = await body(req);
        if (!routeById.has(input.routeId)) throw new HttpError(400, "Choose a route");
        const seats = Number(input.seats);
        if (!Number.isInteger(seats) || seats < 1 || seats > 12) {
          throw new HttpError(400, "seats must be between 1 and 12");
        }
        const ownerToken = token();
        const trip = {
          id: randomUUID(),
          routeId: input.routeId,
          title: text(input.title, "title", 5, 80),
          date: dateField(input.date, "date", { future: true }),
          departureTime: timeField(input.departureTime),
          transport: choice(input.transport, "transport", ["motorbike", "car", "mixed"]),
          seats,
          meetingArea: text(input.meetingArea, "meetingArea", 3, 80),
          costStyle: choice(input.costStyle, "costStyle", ["own", "shared", "free"]),
          notes: optionalText(input.notes, "notes", 500),
          hostName: text(input.hostName, "hostName", 2, 40),
          ownerTokenHash: digest(ownerToken),
          status: "open",
          hidden: false,
          createdAt: new Date().toISOString()
        };
        const publicRecord = await store.mutate((data) => {
          data.trips.push(trip);
          addEvent(data, "trip_created", trip.id);
          return publicTrip(trip, data);
        });
        return json(res, 201, { trip: publicRecord, ownerToken });
      }

      const tripMatch = /^\/api\/trips\/([0-9a-f-]+)$/.exec(path);
      if (tripMatch && method === "GET") {
        const data = await store.read();
        return json(res, 200, { trip: publicTrip(findTrip(data, tripMatch[1]), data) });
      }

      const closeMatch = /^\/api\/trips\/([0-9a-f-]+)\/close$/.exec(path);
      if (closeMatch && method === "POST") {
        const result = await store.mutate((data) => {
          const trip = findTrip(data, closeMatch[1]);
          owner(req, trip);
          trip.status = "closed";
          addEvent(data, "trip_closed", trip.id);
          return publicTrip(trip, data);
        });
        return json(res, 200, { trip: result });
      }

      const requestsMatch = /^\/api\/trips\/([0-9a-f-]+)\/requests$/.exec(path);
      if (requestsMatch && method === "GET") {
        const data = await store.read();
        const trip = findTrip(data, requestsMatch[1]);
        owner(req, trip);
        return json(res, 200, {
          requests: data.joinRequests
            .filter((request) => request.tripId === trip.id)
            .map(({ id, travelerName, message, status, createdAt }) => ({ id, travelerName, message, status, createdAt }))
        });
      }
      if (requestsMatch && method === "POST") {
        const input = await body(req);
        const requestToken = token();
        const request = await store.mutate((data) => {
          const trip = findTrip(data, requestsMatch[1]);
          if (trip.status !== "open") throw new HttpError(409, "This trip is closed");
          if (trip.date < todayInCambodia()) throw new HttpError(409, "This trip has passed");
          if (publicTrip(trip, data).availableSpots === 0) throw new HttpError(409, "This trip is full");
          const record = {
            id: randomUUID(),
            tripId: trip.id,
            travelerName: text(input.travelerName, "travelerName", 2, 40),
            message: optionalText(input.message, "message", 280),
            requestTokenHash: digest(requestToken),
            status: "pending",
            createdAt: new Date().toISOString()
          };
          data.joinRequests.push(record);
          addEvent(data, "join_requested", trip.id);
          return { id: record.id, status: record.status };
        });
        return json(res, 201, { request, requestToken });
      }

      const requestMatch = /^\/api\/trips\/([0-9a-f-]+)\/requests\/([0-9a-f-]+)$/.exec(path);
      if (requestMatch && method === "GET") {
        const data = await store.read();
        findTrip(data, requestMatch[1]);
        const request = data.joinRequests.find((item) => item.id === requestMatch[2] && item.tripId === requestMatch[1]);
        if (!request) throw new HttpError(404, "Request not found");
        if (!sameSecret(req.headers["x-request-token"], request.requestTokenHash)) {
          throw new HttpError(403, "This request belongs to another traveler");
        }
        return json(res, 200, { request: {
          id: request.id,
          travelerName: request.travelerName,
          status: request.status,
          createdAt: request.createdAt
        } });
      }

      const decisionMatch = /^\/api\/trips\/([0-9a-f-]+)\/requests\/([0-9a-f-]+)\/decision$/.exec(path);
      if (decisionMatch && method === "POST") {
        const input = await body(req);
        const decision = choice(input.decision, "decision", ["approved", "declined"]);
        const result = await store.mutate((data) => {
          const trip = findTrip(data, decisionMatch[1]);
          owner(req, trip);
          const request = data.joinRequests.find((item) => item.id === decisionMatch[2] && item.tripId === trip.id);
          if (!request) throw new HttpError(404, "Request not found");
          if (request.status !== "pending") throw new HttpError(409, "Request is already decided");
          if (decision === "approved" && publicTrip(trip, data).availableSpots === 0) {
            throw new HttpError(409, "No places remain");
          }
          request.status = decision;
          addEvent(data, `join_${decision}`, trip.id);
          return { id: request.id, status: request.status };
        });
        return json(res, 200, { request: result });
      }

      if (path === "/api/reports" && method === "POST") {
        const input = await body(req);
        const targetType = choice(input.targetType, "targetType", ["trip", "route"]);
        const targetId = text(input.targetId, "targetId", 3, 80);
        const data = await store.read();
        if (targetType === "route" && !routeById.has(targetId)) throw new HttpError(404, "Route not found");
        if (targetType === "trip") findTrip(data, targetId);
        const report = {
          id: randomUUID(), targetType, targetId,
          reason: choice(input.reason, "reason", ["inaccurate", "unsafe", "spam", "other"]),
          details: optionalText(input.details, "details", 500),
          status: "pending", createdAt: new Date().toISOString()
        };
        await store.mutate((current) => { current.reports.push(report); });
        return json(res, 201, { id: report.id, status: report.status });
      }

      if (path === "/api/admin/overview" && method === "GET") {
        admin(req, adminToken);
        const data = await store.read();
        const eventCounts = Object.fromEntries(
          [...new Set(data.events.map((event) => event.type))].map((type) => [type, data.events.filter((event) => event.type === type).length])
        );
        return json(res, 200, {
          reports: data.reports.filter((report) => report.status === "pending"),
          updates: data.routeUpdates.filter((update) => update.status === "pending"),
          trips: data.trips.filter((trip) => !trip.hidden).map((trip) => publicTrip(trip, data)),
          eventCounts
        });
      }

      const adminReportMatch = /^\/api\/admin\/reports\/([0-9a-f-]+)\/resolve$/.exec(path);
      if (adminReportMatch && method === "POST") {
        admin(req, adminToken);
        await store.mutate((data) => {
          const report = data.reports.find((item) => item.id === adminReportMatch[1]);
          if (!report) throw new HttpError(404, "Report not found");
          report.status = "resolved";
        });
        return json(res, 200, { ok: true });
      }

      const adminUpdateMatch = /^\/api\/admin\/updates\/([0-9a-f-]+)\/decision$/.exec(path);
      if (adminUpdateMatch && method === "POST") {
        admin(req, adminToken);
        const input = await body(req);
        const decision = choice(input.decision, "decision", ["approved", "rejected"]);
        await store.mutate((data) => {
          const update = data.routeUpdates.find((item) => item.id === adminUpdateMatch[1]);
          if (!update) throw new HttpError(404, "Update not found");
          update.status = decision;
        });
        return json(res, 200, { ok: true });
      }

      const adminTripMatch = /^\/api\/admin\/trips\/([0-9a-f-]+)\/hide$/.exec(path);
      if (adminTripMatch && method === "POST") {
        admin(req, adminToken);
        await store.mutate((data) => {
          const trip = findTrip(data, adminTripMatch[1], { includeHidden: true });
          trip.hidden = true;
        });
        return json(res, 200, { ok: true });
      }

      if (path === "/api/events" && method === "POST") {
        const input = await body(req);
        const eventType = choice(input.type, "type", ["route_viewed", "trip_viewed"]);
        const targetId = text(input.targetId, "targetId", 3, 80);
        if (eventType === "route_viewed" && !routeById.has(targetId)) throw new HttpError(400, "Unknown route");
        await store.mutate((data) => {
          if (eventType === "trip_viewed") findTrip(data, targetId);
          addEvent(data, eventType, targetId);
        });
        return json(res, 202, { ok: true });
      }

      if ((method === "GET" || method === "HEAD") && staticFiles.has(path)) {
        const [file, contentType] = staticFiles.get(path);
        const content = await readFile(resolve(publicDir, file));
        res.writeHead(200, {
          "content-type": contentType,
          "content-length": content.length,
          "cache-control": "no-cache",
          "x-content-type-options": "nosniff",
          "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"
        });
        return res.end(method === "HEAD" ? undefined : content);
      }

      throw new HttpError(404, "Page not found");
    } catch (error) {
      if (!(error instanceof HttpError)) console.error(error);
      json(res, error instanceof HttpError ? error.status : 500, {
        error: error instanceof HttpError ? error.message : "Unexpected server error"
      });
    }
  };
  return { handler, ready: store.ready };
}

export function createQipiServer(options = {}) {
  const { handler, ready } = createQipiHandler(options);
  return { server: createServer(handler), ready };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server, ready } = createQipiServer();
  await ready;
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || "127.0.0.1";
  server.listen(port, host, () => {
    console.log(`Qipi running at http://${host}:${port}`);
    if (!process.env.QIPI_ADMIN_TOKEN) {
      console.log("Admin moderation is disabled. Set QIPI_ADMIN_TOKEN to enable /admin.html.");
    }
  });
}
