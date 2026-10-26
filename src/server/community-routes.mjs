import { randomUUID } from "node:crypto";
import { routeById, routes } from "../routes.mjs";
import { HttpError, body, createResponder } from "./http.mjs";
import { admin } from "./security.mjs";
import { text, optionalText, choice, dateField } from "./validation.mjs";
import { publicTrip, findTrip, addEvent } from "./trips.mjs";

export async function handleCommunityRoutes({ req, res, path, method, store, userFor, adminToken }) {
  const respond = createResponder(res);
  if (path === "/api/routes" && method === "GET") return respond(200, { routes });

  const routeMatch = /^\/api\/routes\/([a-z0-9-]+)$/.exec(path);
  if (routeMatch && method === "GET") {
    const route = routeById.get(routeMatch[1]);
    if (!route) throw new HttpError(404, "Route not found");
    const data = await store.read();
    const updates = data.routeUpdates
      .filter((update) => update.routeId === route.id && update.status === "approved")
      .sort((a, b) => b.visitedOn.localeCompare(a.visitedOn));
    return respond(200, { route, updates });
  }

  const updateMatch = /^\/api\/routes\/([a-z0-9-]+)\/updates$/.exec(path);
  if (updateMatch && method === "POST") {
    if (!routeById.has(updateMatch[1])) throw new HttpError(404, "Route not found");
    const user = await userFor(req, { required: true });
    const input = await body(req);
    const update = {
      id: randomUUID(),
      routeId: updateMatch[1],
      nickname: text(input.nickname, "nickname", 2, 40),
      userId: user?.id || null,
      visitedOn: dateField(input.visitedOn, "visitedOn", { past: true }),
      condition: choice(input.condition, "condition", ["good", "mixed", "caution"]),
      note: text(input.note, "note", 10, 500),
      status: "pending",
      createdAt: new Date().toISOString()
    };
    await store.mutate((data) => { data.routeUpdates.push(update); addEvent(data, "route_update", update.routeId); });
    return respond(201, { id: update.id, status: update.status });
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
    return respond(201, { id: report.id, status: report.status });
  }

  if (path === "/api/admin/overview" && method === "GET") {
    admin(req, adminToken);
    const data = await store.read();
    const eventCounts = Object.fromEntries(
      [...new Set(data.events.map((event) => event.type))].map((type) => [type, data.events.filter((event) => event.type === type).length])
    );
    return respond(200, {
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
    return respond(200, { ok: true });
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
    return respond(200, { ok: true });
  }

  const adminTripMatch = /^\/api\/admin\/trips\/([0-9a-f-]+)\/hide$/.exec(path);
  if (adminTripMatch && method === "POST") {
    admin(req, adminToken);
    await store.mutate((data) => {
      const trip = findTrip(data, adminTripMatch[1], { includeHidden: true });
      trip.hidden = true;
    });
    return respond(200, { ok: true });
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
    return respond(202, { ok: true });
  }
  return false;
}
