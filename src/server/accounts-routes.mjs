import { syncPublicProfile } from "./profiles.mjs";
import { profileUsername } from "../../public/js/shared.js";
import { HttpError, body, createResponder } from "./http.mjs";
import { text } from "./validation.mjs";
import { publicTrip } from "./trips.mjs";

export async function handleAccountsRoutes({ req, res, path, method, store, userFor }) {
  const respond = createResponder(res);
  if (path === "/api/me/profile" && method === "PUT") {
    const user = await userFor(req, { required: true });
    if (!user) throw new HttpError(503, "Authentication is not configured");
    const current = await store.read();
    const next = syncPublicProfile(structuredClone(current), user);
    const previous = (current.profiles || []).find(profile => profile.id === user.id);
    const profile = JSON.stringify(previous) === JSON.stringify(next) ? previous
      : await store.mutate(data => syncPublicProfile(data, user));
    return respond(200, { profile });
  }
  if (path === "/api/me" && method === "GET") {
    const user = await userFor(req, { required: true });
    if (!user) throw new HttpError(503, "Authentication is not configured");
    const data = await store.read();
    return respond(200, {
      user,
      trips: data.trips.filter((trip) => trip.hostUserId === user.id).map((trip) => publicTrip(trip, data)),
      requests: data.joinRequests.filter((request) => request.travelerUserId === user.id)
        .map((request) => ({
          id: request.id, status: request.status,
          trip: data.trips.find((trip) => trip.id === request.tripId)
        }))
        .filter((item) => item.trip && !item.trip.hidden)
        .map((item) => ({ id: item.id, status: item.status, trip: publicTrip(item.trip, data) }))
    });
  }
  if (path === "/api/me/avatar" && method === "POST") {
    const user = await userFor(req, { required: true });
    if (!user) throw new HttpError(503, "Authentication is not configured");
    const input = await body(req);
    const avatarPath = input.avatarPath == null || input.avatarPath === "" ? "" : text(input.avatarPath, "avatarPath", 1, 180);
    if (avatarPath && !new RegExp(`^users/${user.id}/profile/[0-9a-f-]{36}\\.(?:jpg|png|webp)$`, "i").test(avatarPath)) {
      throw new HttpError(400, "Profile photo must be uploaded to your account");
    }
    const result = await store.mutate((data) => {
      let updatedCount = 0;
      for (const trip of data.trips) {
        if (trip.hostUserId === user.id) {
          trip.hostAvatarPath = avatarPath;
          updatedCount += 1;
        }
      }
      const publicProfile = (data.profiles || []).find((profile) => profile.id === user.id);
      if (publicProfile) publicProfile.avatarPath = avatarPath;
      data.media = (data.media || []).filter((media) => !(media.ownerId === user.id && media.kind === "profile"));
      if (avatarPath) {
        const mediaId = avatarPath.match(/([0-9a-f-]{36})\.(?:jpg|png|webp)$/i)?.[1]?.toLowerCase();
        if (mediaId) data.media.push({ id: mediaId, ownerId: user.id, kind: "profile", path: avatarPath });
      }
      return { updatedCount };
    });
    return respond(200, result);
  }
  const profileMatch = /^\/api\/profiles\/([a-z0-9-]{1,64})$/i.exec(path);
  if (profileMatch && method === "GET") {
    const user = await userFor(req);
    const data = await store.read();
    const actorId = req.headers["x-qipi-actor"] || "";
    const identifier = profileMatch[1];
    const storedProfile = (data.profiles || []).find(profile => profile.id === identifier || profile.username === identifier);
    const demoProfile = (data.demoUsers || []).find((item) =>
      item.id === identifier || profileUsername(item.displayName, item.id) === identifier
    );
    const ownProfile = user && (user.id === identifier || storedProfile?.id === user.id || profileUsername(user.displayName, user.id) === identifier)
      ? {
          id: user.id,
          displayName: user.displayName,
          avatarPath: user.avatarPath || "",
          homeBase: user.homeBase || "",
          interests: user.interests || [],
          bio: user.bio || "",
          isDemo: false
        }
      : null;
    const matchingMemberTrip = demoProfile ? null : data.trips.find((trip) =>
      !trip.hidden && trip.hostUserId &&
      (trip.hostUserId === identifier || profileUsername(trip.hostName, trip.hostUserId) === identifier)
    );
    const id = ownProfile?.id || demoProfile?.id || storedProfile?.id || matchingMemberTrip?.hostUserId || identifier;
    const followerId = user ? `user:${user.id}` : actorId ? `device:${actorId}` : "";
    const follows = data.follows || [];
    const memberTrips = demoProfile ? [] : data.trips
      .filter((trip) => trip.hostUserId === id && !trip.hidden)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((trip) => publicTrip(trip, data, actorId));
    const profile = ownProfile || demoProfile || storedProfile || (memberTrips.length ? {
      id,
      displayName: memberTrips[0].hostName,
      avatarPath: memberTrips[0].hostAvatarPath || "",
      isDemo: false
    } : null);
    if (!profile) throw new HttpError(404, "Profile not found");
    const trips = demoProfile
      ? data.trips
        .filter((trip) => trip.demoUserId === id && !trip.hidden)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((trip) => publicTrip(trip, data, actorId))
      : memberTrips;
    return respond(200, {
      profile: {
        id: profile.id,
        username: storedProfile?.username || profileUsername(profile.displayName, profile.id),
        displayName: profile.displayName,
        avatarPath: profile.avatarPath || "",
        homeBase: profile.homeBase || "",
        languages: profile.languages || [],
        interests: profile.interests || [],
        bio: profile.bio || "",
        isDemo: Boolean(demoProfile),
        postCount: trips.length,
        followerCount: follows.filter((follow) => follow.targetId === id).length,
        followedByViewer: Boolean(followerId && follows.some((follow) => follow.targetId === id && follow.followerId === followerId))
      },
      trips
    });
  }

  const followMatch = /^\/api\/profiles\/([a-z0-9-]{1,64})\/follow$/i.exec(path);
  if (followMatch && method === "POST") {
    const user = await userFor(req);
    const input = await body(req);
    const actorId = req.headers["x-qipi-actor"];
    if (!user && (typeof actorId !== "string" || !/^[0-9a-f-]{36}$/i.test(actorId))) {
      throw new HttpError(400, "A valid viewer id is required");
    }
    if (typeof input.following !== "boolean") throw new HttpError(400, "following must be true or false");
    const targetId = followMatch[1];
    if (user?.id === targetId) throw new HttpError(400, "You cannot follow your own profile");
    const followerId = user ? `user:${user.id}` : `device:${actorId}`;
    const result = await store.mutate((data) => {
      const isDemoProfile = (data.demoUsers || []).some((profile) => profile.id === targetId);
      const isMemberProfile = (data.profiles || []).some(profile => profile.id === targetId) || data.trips.some((trip) => trip.hostUserId === targetId && !trip.hidden);
      if (!isDemoProfile && !isMemberProfile) throw new HttpError(404, "Profile not found");
      data.follows ||= [];
      const existingIndex = data.follows.findIndex((follow) => follow.targetId === targetId && follow.followerId === followerId);
      if (input.following && existingIndex === -1) {
        data.follows.push({ targetId, followerId, createdAt: new Date().toISOString() });
      } else if (!input.following && existingIndex !== -1) {
        data.follows.splice(existingIndex, 1);
      }
      return {
        following: input.following,
        followerCount: data.follows.filter((follow) => follow.targetId === targetId).length,
        followedByViewer: input.following
      };
    });
    return respond(200, result);
  }
  return false;
}
