import { createHash, randomBytes } from "node:crypto";
import { HttpError, body, createResponder } from "./http.mjs";
import { text, choice } from "./validation.mjs";

const uuid = /^[0-9a-f-]{36}$/i;
const tokenHash = value => createHash("sha256").update(value).digest("hex");
const publicContact = row => ({ id: row.id, name: row.name, phone: row.phone });
const publicSession = row => ({ id: row.id, latitude: row.latitude, longitude: row.longitude, accuracy: row.accuracy_m, positionAt: row.position_at, expiresAt: row.expires_at, active: !row.stopped_at && Date.parse(row.expires_at) > Date.now() });

export async function handleSafetyRoutes({ req, res, path, method, userFor, safety }) {
  if (!path.startsWith("/api/safety/")) return false;
  const respond = createResponder(res);
  if (path === "/api/safety/live" && method === "GET") {
    const shareToken = req.headers["x-qipi-share-token"];
    if (typeof shareToken !== "string" || !/^[A-Za-z0-9_-]{40,100}$/.test(shareToken)) throw new HttpError(404, "Share link not found");
    const row = await safety.sessionByHash(tokenHash(shareToken));
    if (!row || row.stopped_at || Date.parse(row.expires_at) <= Date.now()) throw new HttpError(404, "This share link has ended");
    return respond(200, { session: publicSession(row) });
  }
  const user = await userFor(req, { required: true });
  if (!user) throw new HttpError(401, "Sign in to use private safety tools");
  if (path === "/api/safety/contacts" && method === "GET") {
    const rows = await safety.list("contacts", user.id);
    return respond(200, { contacts: rows.map(publicContact) });
  }
  if (path === "/api/safety/contacts" && method === "POST") {
    const input = await body(req);
    const name = text(input.name, "name", 1, 80);
    const phone = text(input.phone, "phone", 3, 40);
    if (!/^[+0-9() .-]+$/.test(phone)) throw new HttpError(400, "Enter a valid phone number");
    const existing = await safety.list("contacts", user.id);
    if (existing.length >= 5) throw new HttpError(409, "You can save up to five trusted contacts");
    const row = await safety.insert("contacts", { user_id: user.id, name, phone });
    return respond(201, { contact: publicContact(row) });
  }
  const contactMatch = /^\/api\/safety\/contacts\/([0-9a-f-]{36})$/.exec(path);
  if (contactMatch && method === "DELETE" && uuid.test(contactMatch[1])) {
    if (!await safety.remove("contacts", contactMatch[1], user.id)) throw new HttpError(404, "Contact not found");
    return respond(200, { ok: true });
  }
  if (path === "/api/safety/sessions" && method === "GET") {
    const rows = await safety.list("sessions", user.id);
    return respond(200, { sessions: rows.map(publicSession) });
  }
  if (path === "/api/safety/sessions" && method === "POST") {
    const input = await body(req);
    const minutes = Number(input.minutes);
    if (![15, 30, 60].includes(minutes)) throw new HttpError(400, "Choose 15, 30, or 60 minutes");
    const existing = await safety.list("sessions", user.id);
    if (existing.some(row => !row.stopped_at && Date.parse(row.expires_at) > Date.now())) throw new HttpError(409, "Stop your current location share first");
    const token = randomBytes(32).toString("base64url");
    const row = await safety.insert("sessions", { user_id: user.id, token_hash: tokenHash(token), expires_at: new Date(Date.now() + minutes * 60000).toISOString() });
    return respond(201, { session: publicSession(row), token });
  }
  const sessionMatch = /^\/api\/safety\/sessions\/([0-9a-f-]{36})$/.exec(path);
  if (sessionMatch && uuid.test(sessionMatch[1]) && method === "PATCH") {
    const input = await body(req);
    const rows = await safety.list("sessions", user.id);
    const row = rows.find(item => item.id === sessionMatch[1]);
    if (!row) throw new HttpError(404, "Share session not found");
    if (input.stop === true) {
      const stopped = await safety.update("sessions", row.id, user.id, { stopped_at: new Date().toISOString() });
      return respond(200, { session: publicSession(stopped) });
    }
    if (row.stopped_at || Date.parse(row.expires_at) <= Date.now()) throw new HttpError(409, "This share has ended");
    const latitude = Number(input.latitude), longitude = Number(input.longitude), accuracy = Number(input.accuracy);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100000) {
      throw new HttpError(400, "Invalid location");
    }
    const updated = await safety.update("sessions", row.id, user.id, { latitude, longitude, accuracy_m: accuracy, position_at: new Date().toISOString() });
    return respond(200, { session: publicSession(updated) });
  }
  if (path === "/api/safety/checkins" && method === "GET") {
    const rows = await safety.list("checkins", user.id);
    return respond(200, { checkins: rows.map(row => ({ id: row.id, status: row.status, tripId: row.trip_id, createdAt: row.created_at })) });
  }
  if (path === "/api/safety/checkins" && method === "POST") {
    const input = await body(req);
    const status = choice(input.status, "status", ["safe", "arrived"]);
    const tripId = input.tripId == null || input.tripId === "" ? null : text(input.tripId, "tripId", 36, 36);
    if (tripId && !uuid.test(tripId)) throw new HttpError(400, "Invalid trip");
    const row = await safety.insert("checkins", { user_id: user.id, trip_id: tripId, status });
    return respond(201, { checkin: { id: row.id, status: row.status, tripId: row.trip_id, createdAt: row.created_at } });
  }
  throw new HttpError(404, "Safety action not found");
}
