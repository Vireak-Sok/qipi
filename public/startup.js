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
    const profileHash = !location.hash || ["#profile", "#entry"].includes(location.hash);
    if (profileHash && new URLSearchParams(location.search).has("profile")) root.dataset.profilePending = "true";
    if (location.hash === "#signup") root.dataset.signupPending = "true";
    if (!recovering && location.hash !== "#signup" && !sessionStorage.getItem("qipi:entry-choice")) {
      root.dataset.entryPending = "true";
    }
  } catch {
    if (!recovering && location.hash !== "#signup") root.dataset.entryPending = "true";
  }

  const reveal = () => { delete root.dataset.themeBooting; };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reveal, { once: true });
  } else {
    reveal();
  }
})();
