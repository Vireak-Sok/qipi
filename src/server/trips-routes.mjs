import { randomUUID } from "node:crypto";
import { routeById } from "../routes.mjs";
import { todayInCambodia } from "../../public/js/shared.js";
import { HttpError, body, createResponder } from "./http.mjs";
import { token, digest, sameSecret, owner } from "./security.mjs";
import { text, optionalText, choice, dateField, timeField } from "./validation.mjs";
import { publicTrip, publicTrips, findTrip, addEvent } from "./trips.mjs";

function tripCursor(trip) {
  return Buffer.from(JSON.stringify([trip.date, trip.departureTime, trip.id])).toString("base64url");
}

function readTripCursor(value) {
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!Array.isArray(decoded) || decoded.length !== 3 ||
      typeof decoded[0] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(decoded[0]) ||
      typeof decoded[1] !== "string" || !/^\d{2}:\d{2}$/.test(decoded[1]) ||
      typeof decoded[2] !== "string" || !/^[a-z0-9-]{1,64}$/i.test(decoded[2])) {
      throw new Error("invalid cursor");
    }
    return decoded;
  } catch {
    throw new HttpError(400, "Invalid trip cursor");
  }
}

function compareTripCursor(trip, cursor) {
  return trip.date.localeCompare(cursor[0]) || trip.departureTime.localeCompare(cursor[1]) || trip.id.localeCompare(cursor[2]);
}

export async function handleTripsRoutes({ req, res, path, method, url, store, userFor }) {
  const respond = createResponder(res);
  if (path === "/api/trips" && method === "GET") {
    const data = await store.read();
    const actorId = req.headers["x-qipi-actor"] || "";
    const routeId = url.searchParams.get("route");
    const upcomingOnly = url.searchParams.get("upcoming") === "true";
    const ids = url.searchParams.has("ids") ? url.searchParams.get("ids").split(",").filter(Boolean) : null;
    if (ids && (ids.length > 100 || ids.some(id => !/^[a-z0-9-]{1,64}$/i.test(id)))) throw new HttpError(400, "Provide at most 100 valid trip IDs");
    const selectedIds = ids ? new Set(ids) : null;
    const limitValue = url.searchParams.get("limit");
    const limit = limitValue === null ? null : Number(limitValue);
    if (limit !== null && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
      throw new HttpError(400, "Trip page limit must be between 1 and 100");
    }
    const cursor = readTripCursor(url.searchParams.get("cursor"));
    if (cursor && limit === null) throw new HttpError(400, "A trip cursor requires a page limit");
    const today = todayInCambodia();
    let trips = data.trips
      .filter((trip) => !trip.hidden && (!upcomingOnly || ((trip.kind || "trip") === "trip" && trip.status === "open" && trip.date >= today)))
      .filter((trip) => (!routeId || trip.routeId === routeId) && (!selectedIds || selectedIds.has(trip.id)))
      .sort((a, b) => upcomingOnly || limit !== null
        ? a.date.localeCompare(b.date) || a.departureTime.localeCompare(b.departureTime) || a.id.localeCompare(b.id)
        : b.createdAt.localeCompare(a.createdAt));
    if (cursor) trips = trips.filter((trip) => compareTripCursor(trip, cursor) > 0);
    const hasMore = limit !== null && trips.length > limit;
    if (limit !== null) trips = trips.slice(0, limit);
    const nextCursor = hasMore ? tripCursor(trips.at(-1)) : null;
    return respond(200, {
      trips: publicTrips(trips, data, actorId),
      ...(limit === null ? {} : { nextCursor })
    });
  }

  const likeMatch = /^\/api\/trips\/([0-9a-f-]+)\/like$/.exec(path);
  if (likeMatch && method === "POST") {
    const input = await body(req);
    const actorId = req.headers["x-qipi-actor"];
    if (typeof actorId !== "string" || !/^[0-9a-f-]{36}$/.test(actorId)) {
      throw new HttpError(400, "A valid viewer id is required");
    }
    if (typeof input.liked !== "boolean") throw new HttpError(400, "liked must be true or false");
    const result = await store.mutate((data) => {
      const trip = findTrip(data, likeMatch[1]);
      data.likes ||= [];
      const existingIndex = data.likes.findIndex((like) => like.tripId === trip.id && like.actorId === actorId);
      if (input.liked && existingIndex === -1) {
        data.likes.push({ tripId: trip.id, actorId, createdAt: new Date().toISOString() });
      } else if (!input.liked && existingIndex !== -1) {
        data.likes.splice(existingIndex, 1);
      }
      const likesCount = data.likes.filter((like) => like.tripId === trip.id).length;
      return { likedByViewer: input.liked, likesCount };
    });
    return respond(200, result);
  }

  if (path === "/api/trips" && method === "POST") {
    const user = await userFor(req, { required: true });
    const input = await body(req);
    const kind = input.kind === "story" ? "story" : "trip";
    const routeId = input.routeId && routeById.has(input.routeId) ? input.routeId : "";
    const destination = text(input.destination || (routeId ? routeById.get(routeId).title.en : ""), "destination", 2, 120);
    const mediaPath = input.mediaPath == null || input.mediaPath === "" ? "" : text(input.mediaPath, "mediaPath", 1, 180);
    if (mediaPath && (!user || !new RegExp(`^users/${user.id}/trips/[0-9a-f-]{36}\\.(?:jpg|png|webp)$`, "i").test(mediaPath))) {
      throw new HttpError(400, "Trip image must be uploaded to your account");
    }
    const seats = kind === "story" ? 0 : Number(input.seats);
    if (kind === "trip" && (!Number.isInteger(seats) || seats < 1 || seats > 12)) {
      throw new HttpError(400, "seats must be between 1 and 12");
    }
    const ownerToken = user ? null : token();
    const trip = {
      id: randomUUID(),
      kind,
      routeId,
      destination,
      title: text(input.title, "title", 5, 80),
      date: kind === "story" ? todayInCambodia() : dateField(input.date, "date", { future: true }),
      departureTime: kind === "story" ? "00:00" : timeField(input.departureTime),
      transport: kind === "story" ? "mixed" : choice(input.transport, "transport", ["motorbike", "car", "mixed"]),
      seats,
      meetingArea: kind === "story" ? "" : text(input.meetingArea, "meetingArea", 3, 80),
      costStyle: kind === "story" ? "free" : choice(input.costStyle, "costStyle", ["own", "shared", "free"]),
      notes: optionalText(input.notes, "notes", 500),
      hostName: text(input.hostName, "hostName", 2, 40),
      hostAvatarPath: user?.avatarPath || "",
      mediaPath,
      ownerTokenHash: ownerToken ? digest(ownerToken) : null,
      hostUserId: user?.id || null,
      status: kind === "story" ? "published" : "open",
      hidden: false,
      createdAt: new Date().toISOString()
    };
    const publicRecord = await store.mutate((data) => {
      data.trips.push(trip);
      addEvent(data, "trip_created", trip.id);
      return publicTrip(trip, data);
    });
    return respond(201, { trip: publicRecord, ...(ownerToken ? { ownerToken } : {}) });
  }

  const tripMatch = /^\/api\/trips\/([0-9a-f-]+)$/.exec(path);
  if (tripMatch && method === "GET") {
    const data = await store.read();
    return respond(200, { trip: publicTrip(findTrip(data, tripMatch[1]), data, req.headers["x-qipi-actor"] || "") });
  }

  const closeMatch = /^\/api\/trips\/([0-9a-f-]+)\/close$/.exec(path);
  if (closeMatch && method === "POST") {
    const user = await userFor(req);
    const result = await store.mutate((data) => {
      const trip = findTrip(data, closeMatch[1]);
      owner(req, trip, user);
      trip.status = "closed";
      addEvent(data, "trip_closed", trip.id);
      return publicTrip(trip, data);
    });
    return respond(200, { trip: result });
  }

  const requestsMatch = /^\/api\/trips\/([0-9a-f-]+)\/requests$/.exec(path);
  if (requestsMatch && method === "GET") {
    const user = await userFor(req);
    const data = await store.read();
    const trip = findTrip(data, requestsMatch[1]);
    owner(req, trip, user);
    return respond(200, {
      requests: data.joinRequests
        .filter((request) => request.tripId === trip.id)
        .map(({ id, travelerName, message, status, createdAt }) => ({ id, travelerName, message, status, createdAt }))
    });
  }
  if (requestsMatch && method === "POST") {
    const user = await userFor(req, { required: true });
    const input = await body(req);
    const requestToken = user ? null : token();
    const request = await store.mutate((data) => {
      const trip = findTrip(data, requestsMatch[1]);
      if (trip.kind === "story") throw new HttpError(409, "This post is not a trip");
      if (user && trip.hostUserId === user.id) throw new HttpError(409, "You cannot join your own trip");
      if (user && data.joinRequests.some((item) => item.tripId === trip.id && item.travelerUserId === user.id)) {
        throw new HttpError(409, "You have already requested to join this trip");
      }
      if (trip.status !== "open") throw new HttpError(409, "This trip is closed");
      if (trip.date < todayInCambodia()) throw new HttpError(409, "This trip has passed");
      if (publicTrip(trip, data).availableSpots === 0) throw new HttpError(409, "This trip is full");
      const record = {
        id: randomUUID(),
        tripId: trip.id,
        travelerName: text(input.travelerName, "travelerName", 2, 40),
        message: optionalText(input.message, "message", 280),
        requestTokenHash: requestToken ? digest(requestToken) : null,
        travelerUserId: user?.id || null,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      data.joinRequests.push(record);
      addEvent(data, "join_requested", trip.id);
      return { id: record.id, status: record.status };
    });
    return respond(201, { request, ...(requestToken ? { requestToken } : {}) });
  }

  const requestMatch = /^\/api\/trips\/([0-9a-f-]+)\/requests\/([0-9a-f-]+)$/.exec(path);
  if (requestMatch && method === "GET") {
    const user = await userFor(req);
    const data = await store.read();
    findTrip(data, requestMatch[1]);
    const request = data.joinRequests.find((item) => item.id === requestMatch[2] && item.tripId === requestMatch[1]);
    if (!request) throw new HttpError(404, "Request not found");
    if (!(request.travelerUserId && user?.id === request.travelerUserId) &&
        !sameSecret(req.headers["x-request-token"], request.requestTokenHash)) {
      throw new HttpError(403, "This request belongs to another traveler");
    }
    return respond(200, { request: {
      id: request.id,
      travelerName: request.travelerName,
      status: request.status,
      createdAt: request.createdAt
    } });
  }

  const decisionMatch = /^\/api\/trips\/([0-9a-f-]+)\/requests\/([0-9a-f-]+)\/decision$/.exec(path);
  if (decisionMatch && method === "POST") {
    const user = await userFor(req);
    const input = await body(req);
    const decision = choice(input.decision, "decision", ["approved", "declined"]);
    const result = await store.mutate((data) => {
      const trip = findTrip(data, decisionMatch[1]);
      owner(req, trip, user);
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
    return respond(200, { request: result });
  }
  return false;
}
