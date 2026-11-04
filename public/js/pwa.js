import { $, esc, icon } from "./core.js";

function isInstalled() {
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);
}

function isIosSafari() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

export function createPwaController({ t, toast }) {
  let installPrompt = null;
  let registration = null;
  let updateButton = null;
  let updatePhase = "idle";
  let updatePercent = 0;
  let oldController = navigator.serviceWorker?.controller || null;
  let trackedWorker = null;
  let updateTimer = null;

  function clearUpdateTimer() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = null;
  }

  function renderUpdateStatus() {
    if (!navigator.serviceWorker?.controller || updatePhase === "idle") {
      if (updateButton) updateButton.hidden = true;
      return;
    }
    if (!updateButton) {
      updateButton = document.createElement("button");
      updateButton.type = "button";
      updateButton.className = "pwa-update-button";
      updateButton.setAttribute("aria-live", "polite");
      document.body.append(updateButton);
    }
    updateButton.hidden = false;
    updateButton.dataset.phase = updatePhase;
    updateButton.dataset.pwaUpdate = updatePhase === "error" ? "retry" : "status";
    updateButton.disabled = updatePhase !== "error";
    updateButton.textContent = updatePhase === "downloading"
      ? `${t("pwaUpdateDownloading")} ${updatePercent}%`
      : updatePhase === "installing" ? t("pwaUpdateInstalling")
        : `${t("pwaUpdateFailed")} ${t("retry")}`;
  }

  function scheduleUpdateTimeout(duration) {
    clearUpdateTimer();
    updateTimer = setTimeout(() => {
      if (updatePhase === "idle" || updatePhase === "error") return;
      if (navigator.serviceWorker.controller && navigator.serviceWorker.controller !== oldController) {
        window.location.reload();
        return;
      }
      updatePhase = "error";
      renderUpdateStatus();
    }, duration);
    updateTimer.unref?.();
  }

  function activateWaitingUpdate() {
    if (!registration?.waiting || !navigator.serviceWorker?.controller) return;
    oldController = navigator.serviceWorker.controller;
    updatePhase = "installing";
    updatePercent = 100;
    renderUpdateStatus();
    try { registration.waiting.postMessage({ type: "QIPI_ACTIVATE_UPDATE" }); }
    catch { /* The worker may already be activating automatically. */ }
    scheduleUpdateTimeout(15000);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pwa-update='retry']");
    if (!button) return;
    if (registration?.waiting) { activateWaitingUpdate(); return; }
    updatePhase = "downloading";
    updatePercent = 0;
    renderUpdateStatus();
    scheduleUpdateTimeout(30000);
    registration?.update().catch(() => { clearUpdateTimer(); updatePhase = "error"; renderUpdateStatus(); });
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type !== "QIPI_UPDATE_PROGRESS" || updatePhase !== "downloading" || !registration?.installing || !navigator.serviceWorker.controller) return;
      updatePercent = Math.max(updatePercent, Math.min(100, Number(event.data.percent) || 0));
      renderUpdateStatus();
      scheduleUpdateTimeout(30000);
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (updatePhase === "idle" || !oldController || navigator.serviceWorker.controller === oldController) return;
      clearUpdateTimer();
      updatePhase = "idle";
      window.location.reload();
    });
  }

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
      registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const watchInstalling = () => {
        const installing = registration.installing;
        if (!installing || !navigator.serviceWorker.controller || installing === trackedWorker) return;
        trackedWorker = installing;
        oldController = navigator.serviceWorker.controller;
        updatePhase = "downloading";
        updatePercent = 0;
        renderUpdateStatus();
        scheduleUpdateTimeout(30000);
        const handleStateChange = () => {
          if (installing.state === "installed") {
            updatePhase = "installing";
            updatePercent = 100;
            renderUpdateStatus();
            if (registration.waiting) activateWaitingUpdate();
            else scheduleUpdateTimeout(15000);
          } else if (installing.state === "redundant") {
            clearUpdateTimer();
            updatePhase = "error";
            renderUpdateStatus();
          }
        };
        installing.addEventListener("statechange", handleStateChange);
        handleStateChange();
      };
      registration.addEventListener("updatefound", watchInstalling);
      watchInstalling();
      if (registration.waiting) activateWaitingUpdate();
      else registration.update().catch(() => {});
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
  window.addEventListener("offline", () => toast(t("pwaOffline")));
  window.addEventListener("online", () => toast(t("pwaOnline")));
  window.addEventListener("DOMContentLoaded", () => { void registerServiceWorker(); }, { once: true });
  if (document.readyState !== "loading") void registerServiceWorker();

  return { install, renderInstallSettings };
}
