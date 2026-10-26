// Shared URL contract for Next routing, navigation, and client links.
export const PAGE_PATHS = Object.freeze({
  feed: "/feed", explore: "/explore", trips: "/trips", saved: "/saved",
  settings: "/settings", "search-results": "/search", entry: "/", signup: "/signup"
});
export const RESERVED_SEGMENTS = new Set([
  ...Object.values(PAGE_PATHS).map(path => path.slice(1)),
  "routes", "entry", "profile", "post", "media", "api", "admin", "index.html"
]);
export const profilePath = username => "/" + encodeURIComponent(username);
export const postPath = id => "/post/" + encodeURIComponent(id);
export const mediaPath = id => "/media/" + encodeURIComponent(id);
export function isSupportedPage(segments) {
  if (segments.length === 1) return /^[a-z0-9][a-z0-9-]{0,63}$/i.test(segments[0]) || segments[0] === "index.html";
  return segments.length === 2 && ["post", "profile"].includes(segments[0]) && /^[a-z0-9][a-z0-9-]{0,63}$/i.test(segments[1]);
}
export const PRIMARY_NAV = [
  { view: "feed", icon: "home", label: "home", fallback: "Home" },
  { view: "explore", icon: "compass", label: "explore", fallback: "Explore" },
  { view: "trips", icon: "calendar", label: "navTrips", fallback: "Upcoming trips" },
  { action: "open-settings", icon: "settings", label: "settings", fallback: "Settings" }
];
