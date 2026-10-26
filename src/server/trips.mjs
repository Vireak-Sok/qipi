import { randomUUID } from "node:crypto";
import { HttpError } from "./http.mjs";

function publicTrip(trip, data, actorId = "", counts = null) {
  const approvedCount = counts?.approvedByTrip.get(trip.id) ?? data.joinRequests.filter(
    (request) => request.tripId === trip.id && request.status === "approved"
  ).length;
  const likes = counts?.likesByTrip.get(trip.id) ?? (data.likes || []).filter((like) => like.tripId === trip.id);
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
    hostAvatarPath: trip.hostAvatarPath || "",
    mediaPath: trip.mediaPath || "",
    profileId: trip.demoUserId || trip.hostUserId || null,
    hostVerified: Boolean(trip.hostUserId),
    likesCount: likes.length,
    likedByViewer: Boolean(actorId && likes.some((like) => like.actorId === actorId)),
    status: trip.status,
    createdAt: trip.createdAt
  };
}

function publicTrips(trips, data, actorId = "") {
  const approvedByTrip = new Map();
  for (const request of data.joinRequests) {
    if (request.status === "approved") approvedByTrip.set(request.tripId, (approvedByTrip.get(request.tripId) || 0) + 1);
  }

  const likesByTrip = new Map();
  for (const like of data.likes || []) {
    const likes = likesByTrip.get(like.tripId) || [];
    likes.push(like);
    likesByTrip.set(like.tripId, likes);
  }

  const counts = { approvedByTrip, likesByTrip };
  return trips.map((trip) => publicTrip(trip, data, actorId, counts));
}

function findTrip(data, id, { includeHidden = false } = {}) {
  const trip = data.trips.find((item) => item.id === id);
  if (!trip || (!includeHidden && trip.hidden)) throw new HttpError(404, "Trip not found");
  return trip;
}

function addEvent(data, type, targetId = "") {
  data.events.push({ id: randomUUID(), type, targetId, at: new Date().toISOString() });
  if (data.events.length > 3000) data.events.splice(0, data.events.length - 3000);
}

export { publicTrip, publicTrips, findTrip, addEvent };
