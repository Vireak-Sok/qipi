import { $, esc, icon } from "./core.js";

function isInstalled() {
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);
}

function isIosSafari() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

export function createPwaController({ t, toast }) {
  let installPrompt = null;

  function renderInstallSettings() {
    const content = $("#settings-install-content");
    if (!content) return;

    if (isInstalled()) {
      content.innerHTML = `<p class="settings-install-status">${esc(t("pwaInstalled"))}</p>`;
    } else if (installPrompt) {
      content.innerHTML = `<button class="button button-ghost settings-install-button" type="button" data-action="install-app">${icon("download")}<span>${esc(t("pwaInstallAction"))}</span></button>`;
    } else {
      const message = isIosSafari() ? t("pwaIosHint") : t("pwaInstallUnavailable");
      content.innerHTML = `<p class="settings-install-status">${esc(message)}</p>`;
    }
  }

  async function install() {
    if (!installPrompt) {
      renderInstallSettings();
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === "accepted") toast(t("pwaInstallStarted"));
    } catch {
      toast(t("pwaInstallUnavailable"));
    } finally {
      renderInstallSettings();
    }
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      registration.update().catch(() => {});
    } catch {
      // The app stays usable when service workers are blocked or unavailable.
    }
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    renderInstallSettings();
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    renderInstallSettings();
    toast(t("pwaInstalled"));
  });
  window.addEventListener("DOMContentLoaded", () => { void registerServiceWorker(); }, { once: true });
  if (document.readyState !== "loading") void registerServiceWorker();

  return { install, renderInstallSettings };
}
