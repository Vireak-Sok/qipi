(() => {
  const root = document.documentElement;
  let preference = "system";
  try {
    const storedPreference = localStorage.getItem("qipi:theme");
    if (["system", "light", "dark"].includes(storedPreference)) preference = storedPreference;
  } catch {}

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
  const dark = preference === "dark" || (preference === "system" && prefersDark);
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePreference = preference;

  let recovering = false;
  try {
    recovering = new URLSearchParams(location.hash.replace(/^#/, "")).get("type") === "recovery";
    if (!recovering && !sessionStorage.getItem("qipi:entry-choice")) {
      root.dataset.entryPending = "true";
    }
  } catch {
    if (!recovering) root.dataset.entryPending = "true";
  }

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = dark ? "#10191B" : "#F1F7F6";
})();
