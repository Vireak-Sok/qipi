// Shared URL contract for Next routing, navigation, and client links.
export const PAGE_PATHS = Object.freeze({
  feed: "/feed", explore: "/explore", trips: "/trips", saved: "/saved",
  settings: "/settings", messages: "/messages", notifications: "/notifications", safety: "/explore", "safety-live": "/safety/live", "search-results": "/search", entry: "/", signup: "/signup"
});
export const RESERVED_SEGMENTS = new Set([
  ...Object.values(PAGE_PATHS).map(path => path.slice(1)),
  "routes", "entry", "profile", "post", "media", "api", "admin", "safety", "index.html"
]);
export const profilePath = username => "/" + encodeURIComponent(username);
export const postPath = id => "/post/" + encodeURIComponent(id);
export const mediaPath = id => "/media/" + encodeURIComponent(id);
export const normalizeUsername = value => String(value || "").trim().replace(/^@/, "").normalize("NFC").toLocaleLowerCase();
export const isValidUsername = value => {
  const username = normalizeUsername(value);
  return username.length >= 3 && username.length <= 64 && /^[\p{L}\p{N}][\p{L}\p{N}\p{M}._-]*[\p{L}\p{N}\p{M}]$/u.test(username);
};
export function isSupportedPage(segments) {
  if (segments.length === 1) {
    let segment;
    try { segment = decodeURIComponent(segments[0]); } catch { return false; }
    return (!segment.startsWith("@") && isValidUsername(segment)) || segment === "index.html";
  }
  return segments.length === 2 && ["post", "profile", "messages"].includes(segments[0]) && /^[a-z0-9][a-z0-9-]{0,63}$/i.test(segments[1]) || segments.length === 2 && segments[0] === "safety" && segments[1] === "live";
}
export const PRIMARY_NAV = [
  { view: "feed", icon: "home", label: "home", fallback: "Home" },
  { view: "explore", icon: "compass", label: "explore", fallback: "Explore" },
  { view: "messages", icon: "chat", label: "messages", fallback: "Messages" },
  { action: "open-settings", icon: "settings", label: "settings", fallback: "Settings" }
];
