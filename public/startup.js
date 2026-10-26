(() => {
  const root = document.documentElement;
  root.dataset.themeBooting = "true";

  const validPreferences = ["system", "light", "dark"];
  let preference = "system";
  try {
    const saved = localStorage.getItem("qipi:theme");
    if (validPreferences.includes(saved)) preference = saved;
  } catch {}

  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const apply = () => {
    const dark = preference === "dark" || (preference === "system" && Boolean(media?.matches));
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.themePreference = preference;
    if (themeColor) themeColor.content = dark ? "#10191B" : "#F1F7F6";
  };
  const setPreference = (next) => {
    preference = validPreferences.includes(next) ? next : "system";
    try { localStorage.setItem("qipi:theme", preference); } catch {}
    apply();
    return preference;
  };

  apply();
  media?.addEventListener?.("change", () => {
    if (preference === "system") apply();
  });
  window.qipiTheme = Object.freeze({
    getPreference: () => preference,
    setPreference
  });

  let recovering = false;
  try {
    recovering = new URLSearchParams(location.hash.replace(/^#/, "")).get("type") === "recovery";
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const reservedPaths = new Set(["feed", "explore", "routes", "trips", "saved", "settings", "search", "entry", "signup", "profile", "post", "media", "api", "admin", "index.html"]);
    const segments = path.split("/").filter(Boolean);
    const profilePath = segments.length === 1 && !reservedPaths.has(segments[0].toLowerCase());
    const legacyProfile = ["/", "/index.html"].includes(path) && new URLSearchParams(location.search).has("profile") &&
      (!location.hash || ["#profile", "#entry"].includes(location.hash));
    const signupRoute = path === "/signup" || location.hash === "#signup";
    if (profilePath || legacyProfile || /^\/profile\/[^/]+\/?$/.test(path)) root.dataset.profilePending = "true";
    if (signupRoute) root.dataset.signupPending = "true";
    if (!recovering && !signupRoute && !sessionStorage.getItem("qipi:entry-choice")) {
      root.dataset.entryPending = "true";
    }
  } catch {
    if (!recovering && location.pathname !== "/signup") root.dataset.entryPending = "true";
  }

  const reveal = () => { delete root.dataset.themeBooting; };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reveal, { once: true });
  } else {
    reveal();
  }
})();
