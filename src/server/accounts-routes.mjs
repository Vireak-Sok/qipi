import { syncPublicProfile } from "./profiles.mjs";
import { profileUsername } from "../../public/js/shared.js";
import { HttpError, body, createResponder } from "./http.mjs";
import { text } from "./validation.mjs";
import { publicTrip } from "./trips.mjs";

export async function handleAccountsRoutes({ req, res, path, method, store, userFor }) {
  const respond = createResponder(res);
  if (path === "/api/profiles/search" && method === "GET") {
    const query = new URL(req.url || "/", "http://localhost").searchParams.get("q")?.trim().slice(0, 80) || "";
    if (query.length < 2) return respond(200, { profiles: [] });
    const data = await store.read();
    const matches = new Map();
    const addProfile = (profile) => {
      if (!profile?.id || matches.has(profile.id)) return;
      const displayName = String(profile.displayName || "Traveler");
      const username = String(profile.username || profileUsername(displayName, profile.id));
      if (`${displayName} ${username}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) {
        matches.set(profile.id, { id: profile.id, displayName, username, avatarPath: profile.avatarPath || "" });
      }
    };
    (data.profiles || []).forEach(addProfile);
    (data.demoUsers || []).forEach((profile) => addProfile({ ...profile, username: profileUsername(profile.displayName, profile.id) }));
    for (const trip of data.trips || []) {
      if (trip.hidden || !trip.hostUserId) continue;
      addProfile({ id: trip.hostUserId, displayName: trip.hostName, avatarPath: trip.hostAvatarPath || "" });
    }
    const profiles = [...matches.values()].sort((a, b) => a.displayName.localeCompare(b.displayName)).slice(0, 12);
    return respond(200, { profiles });
  }
  if (path === "/api/profiles/suggestions" && method === "GET") {
    const user = await userFor(req);
    const actorId = req.headers["x-qipi-actor"] || "";
    const viewerId = user ? `user:${user.id}` : actorId ? `device:${actorId}` : "";
    const data = await store.read();
    const people = new Map();
    const addPerson = (person, isDemo = false) => {
      if (!person?.id || person.id === user?.id || !/^[a-z0-9-]{1,64}$/i.test(String(person.id))) return;
      const id = String(person.id);
      const existing = people.get(id) || {};
      const displayName = String(person.displayName || person.hostName || existing.displayName || "Traveler");
      people.set(id, {
        id,
        displayName,
        username: String(person.username || existing.username || profileUsername(displayName, id)),
        avatarPath: person.avatarPath || person.hostAvatarPath || existing.avatarPath || "",
        isDemo: Boolean(isDemo || existing.isDemo),
        postCount: existing.postCount || 0
      });
    };
    (data.profiles || []).forEach((profile) => addPerson(profile));
    (data.demoUsers || []).forEach((profile) => addPerson(profile, true));
    for (const trip of data.trips || []) {
      if (trip.hidden) continue;
      const id = trip.demoUserId || trip.hostUserId;
      if (!id) continue;
      addPerson({ id, hostName: trip.hostName, hostAvatarPath: trip.hostAvatarPath }, Boolean(trip.demoUserId));
      const person = people.get(String(id));
      if (person) person.postCount += 1;
    }
    const follows = data.follows || [];
    const suggestions = [...people.values()]
      .filter((person) => !viewerId || !follows.some((follow) => follow.targetId === person.id && follow.followerId === viewerId))
      .map((person) => ({
        ...person,
        followerCount: follows.filter((follow) => follow.targetId === person.id).length,
        followedByViewer: Boolean(viewerId && follows.some((follow) => follow.targetId === person.id && follow.followerId === viewerId))
      }))
      .sort((a, b) => b.postCount - a.postCount || b.followerCount - a.followerCount || a.displayName.localeCompare(b.displayName))
      .slice(0, 5);
    return respond(200, { profiles: suggestions });
  }
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
  if (path === "/api/me/saved" && method === "GET") {
    const user = await userFor(req, { required: true });
    if (!user) throw new HttpError(503, "Authentication is not configured");
    const data = await store.read();
    const tripsById = new Map(data.trips.filter((trip) => !trip.hidden).map((trip) => [trip.id, trip]));
    const tripIds = (data.bookmarks || [])
      .filter((bookmark) => bookmark.userId === user.id && tripsById.has(bookmark.tripId))
      .sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")))
      .map((bookmark) => bookmark.tripId);
    return respond(200, { tripIds });
  }
  if (path === "/api/me/saved" && method === "PUT") {
    const user = await userFor(req, { required: true });
    if (!user) throw new HttpError(503, "Authentication is not configured");
    const input = await body(req);
    const tripId = text(input.tripId, "tripId", 36, 36);
    if (!/^[0-9a-f-]{36}$/i.test(tripId)) throw new HttpError(400, "tripId is invalid");
    if (typeof input.saved !== "boolean") throw new HttpError(400, "saved must be true or false");
    const result = await store.mutate((data) => {
      data.bookmarks ||= [];
      if (input.saved) {
        const trip = data.trips.find((item) => item.id === tripId && !item.hidden);
        if (!trip) throw new HttpError(404, "Post not found");
        if (!data.bookmarks.some((bookmark) => bookmark.userId === user.id && bookmark.tripId === tripId)) {
          data.bookmarks.push({ userId: user.id, tripId, savedAt: new Date().toISOString() });
        }
      } else {
        data.bookmarks = data.bookmarks.filter((bookmark) => !(bookmark.userId === user.id && bookmark.tripId === tripId));
      }
      const visibleIds = new Set(data.trips.filter((trip) => !trip.hidden).map((trip) => trip.id));
      const tripIds = data.bookmarks
        .filter((bookmark) => bookmark.userId === user.id && visibleIds.has(bookmark.tripId))
        .sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")))
        .map((bookmark) => bookmark.tripId);
      return { tripIds };
    });
    return respond(200, result);
  }
  if (path === "/api/me/saved/import" && method === "POST") {
    const user = await userFor(req, { required: true });
    if (!user) throw new HttpError(503, "Authentication is not configured");
    const input = await body(req);
    if (!Array.isArray(input.tripIds) || input.tripIds.length > 100 || input.tripIds.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) {
      throw new HttpError(400, "Provide up to 100 valid post IDs");
    }
    const tripIds = [...new Set(input.tripIds)];
    const result = await store.mutate((data) => {
      data.bookmarks ||= [];
      const available = new Set(data.trips.filter((trip) => !trip.hidden).map((trip) => trip.id));
      let imported = 0;
      for (const tripId of tripIds) {
        if (!available.has(tripId) || data.bookmarks.some((bookmark) => bookmark.userId === user.id && bookmark.tripId === tripId)) continue;
        data.bookmarks.push({ userId: user.id, tripId, savedAt: new Date().toISOString() });
        imported += 1;
      }
      return { imported };
    });
    return respond(200, result);
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
