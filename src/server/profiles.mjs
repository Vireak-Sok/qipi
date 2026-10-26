import { profileUsername } from "../../public/js/shared.js";

// Persist only public fields from the verified Auth user. Never copy email or tokens.
// A stored username survives display-name changes; IDs remain the lookup key.
export function syncPublicProfile(data, user) {
  data.profiles ||= [];
  const existing = data.profiles.find(profile => profile.id === user.id);
  let username = existing?.username || profileUsername(user.displayName, user.id);
  const occupied = new Set([
    ...data.profiles.filter(profile => profile.id !== user.id).map(profile => profile.username),
    ...(data.demoUsers || []).map(profile => profileUsername(profile.displayName, profile.id))
  ]);
  if (occupied.has(username)) username = "traveler-" + user.id;
  const profile = {
    id: user.id, username, displayName: user.displayName,
    avatarPath: user.avatarPath || "", homeBase: user.homeBase || "",
    interests: user.interests || [], bio: user.bio || "", isDemo: false
  };
  if (existing) Object.assign(existing, profile);
  else data.profiles.push(profile);
  return profile;
}
