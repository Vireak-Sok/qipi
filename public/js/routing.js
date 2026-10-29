import { PAGE_PATHS, RESERVED_SEGMENTS, profilePath, postPath } from "./route-config.js";
export function createRouter(state, { location = window.location, history = window.history } = {}) {
  const reservedPaths = RESERVED_SEGMENTS;
  function usernameFromPath() {
    const match = location.pathname.match(/^\/([^/]+)\/?$/);
    if (!match) return "";
    let segment = match[1];
    try { segment = decodeURIComponent(segment); } catch {}
    return reservedPaths.has(segment.toLowerCase()) || segment.toLowerCase() === "index.html" ? "" : segment;
  }
  function profileIdFromLocation() {
    const username = usernameFromPath();
    if (username) return username;
    const match = location.pathname.match(/^\/profile\/([^/]+)\/?$/);
    if (match) {
      try { return decodeURIComponent(match[1]); } catch { return match[1]; }
    }
    if (["/", "/index.html"].includes(location.pathname) && (!location.hash || ["#profile", "#entry"].includes(location.hash))) {
      return new URLSearchParams(location.search).get("profile") || "";
    }
    return "";
  }
  function pagePath(view) {
    if (view === "profile") return state.profileUsername ? profilePath(state.profileUsername) : "/profile";
    if (view === "messages" && state.conversationId) return `/messages/${encodeURIComponent(state.conversationId)}`;
    return PAGE_PATHS[view] || "/feed";
  }
  function pageUrl(view) {
    const path = pagePath(view);
    const params = new URLSearchParams();
    if (view === "profile" && ["saved", "joining"].includes(state.profileTab)) params.set("tab", state.profileTab);
    if (view === "search-results" && state.search) params.set("q", state.search);
    return path + (params.size ? "?" + params.toString() : "");
  }
  function viewFromLocation(hasProfile = false) {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/messages" || /^\/messages\/[0-9a-f-]{36}$/i.test(path)) return "messages";
    if (path === "/safety/live") return "safety-live";
    if (path === "/profile") return "profile";
    if (/^\/profile\/[^/]+$/.test(path) || usernameFromPath()) return hasProfile ? "profile" : "feed";
    const paths = {
      "/": "feed", "/index.html": "feed", "/feed": "feed", "/explore": "explore", "/routes": "explore",
      "/trips": "trips", "/saved": "saved", "/settings": "settings", "/safety": "explore", "/search": "search-results",
      "/entry": "entry", "/signup": "signup"
    };
    if ((path === "/" || path === "/index.html") && location.hash) {
      const legacy = {
        "#feed": "feed", "#routes": "explore", "#trips": "trips", "#saved": "saved",
        "#settings": "settings", "#search": "search-results", "#entry": "entry", "#signup": "signup",
        "#profile": hasProfile ? "profile" : "feed"
      };
      if (legacy[location.hash]) return legacy[location.hash];
    }
    if (path === "/post" || /^\/post\/[^/]+$/.test(path)) return "feed";
    return paths[path] || "feed";
  }

  function setLink(param, id) {
    if (param === "profile" && id) {
      const tab = ["saved", "joining"].includes(state.profileTab) ? "?tab=" + state.profileTab : "";
      history.replaceState({}, "", profilePath(id) + tab);
      return;
    }
    if (param === "trip" && id) {
      history.replaceState({}, "", postPath(id));
      return;
    }
    const url = new URL(pageUrl(state.view), location.origin);
    if (param && id) url.searchParams.set(param, id);
    history.replaceState({}, "", url.pathname + url.search);
  }

  return { usernameFromPath, profileIdFromLocation, pagePath, pageUrl, viewFromLocation, setLink };
}
