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
  let updateDismissed = false;
  try { updateDismissed = sessionStorage.getItem("qipi:update-dismissed") === "true"; } catch {}

  function clearUpdateTimer() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = null;
  }

  function renderUpdateStatus() {
    const available = Boolean(navigator.serviceWorker?.controller && updatePhase !== "idle");
    const showFloating = available && !(updateDismissed && updatePhase === "available");
    if (showFloating && !updateButton) {
      updateButton = document.createElement("div");
      updateButton.className = "pwa-update-floating";
      updateButton.setAttribute("role", "status");
      updateButton.setAttribute("aria-live", "polite");
      document.body.append(updateButton);
    }
    if (updateButton) {
      updateButton.hidden = !showFloating;
      updateButton.dataset.phase = updatePhase;
      if (showFloating) updateButton.innerHTML = updatePhase === "available"
        ? `<strong>${esc(t("pwaUpdateAvailable"))}</strong><div><button type="button" class="pwa-update-action" data-pwa-update="start">${esc(t("pwaUpdateNow"))}</button><button type="button" class="pwa-update-dismiss" data-pwa-update="later">${esc(t("pwaUpdateLater"))}</button></div>`
        : `<button type="button" class="pwa-update-action" data-pwa-update="${updatePhase === "error" ? "retry" : "status"}" ${updatePhase === "error" ? "" : "disabled"}>${esc(updatePhase === "downloading" ? `${t("pwaUpdateDownloading")} ${updatePercent}%` : updatePhase === "installing" ? t("pwaUpdateInstalling") : `${t("pwaUpdateFailed")} ${t("retry")}`)}</button>`;
    }
    renderSettingsReminder();
  }

  function renderSettingsReminder() {
    const settings = $("#settings-view");
    if (!settings) return;
    let reminder = $("#settings-update-reminder");
    if (!reminder && updateDismissed && updatePhase === "available") {
      reminder = document.createElement("section");
      reminder.id = "settings-update-reminder";
      reminder.className = "settings-update-reminder";
      settings.prepend(reminder);
    }
    if (!reminder) return;
    reminder.hidden = !(updateDismissed && updatePhase === "available");
    if (!reminder.hidden) reminder.innerHTML = `<span><strong>${esc(t("pwaUpdateAvailable"))}</strong><small>${esc(t("pwaUpdateSettingsHint"))}</small></span><button type="button" data-pwa-update="start">${esc(t("pwaUpdateNow"))}</button>`;
  }

  function scheduleUpdateTimeout(duration) {
    clearUpdateTimer();
    updateTimer = setTimeout(() => {
      if (!["downloading", "installing"].includes(updatePhase)) return;
      if (navigator.serviceWorker.controller && navigator.serviceWorker.controller !== oldController) {
        window.location.reload();
        return;
      }
      updatePhase = "error";
      renderUpdateStatus();
    }, duration);
    updateTimer.unref?.();
  }

  function downloadWaitingUpdate() {
    if (!registration?.waiting || !navigator.serviceWorker?.controller) return;
    oldController = navigator.serviceWorker.controller;
    updateDismissed = false;
    try { sessionStorage.removeItem("qipi:update-dismissed"); } catch {}
    updatePhase = "downloading";
    updatePercent = 0;
    renderUpdateStatus();
    try { registration.waiting.postMessage({ type: "QIPI_DOWNLOAD_UPDATE" }); }
    catch { updatePhase = "error"; renderUpdateStatus(); return; }
    scheduleUpdateTimeout(30000);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pwa-update]");
    if (!button) return;
    if (button.dataset.pwaUpdate === "later") {
      updateDismissed = true;
      try { sessionStorage.setItem("qipi:update-dismissed", "true"); } catch {}
      renderUpdateStatus();
    } else if (["start", "retry"].includes(button.dataset.pwaUpdate)) {
      if (registration?.waiting) downloadWaitingUpdate();
      else registration?.update().catch(() => { updatePhase = "error"; renderUpdateStatus(); });
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type !== "QIPI_UPDATE_PROGRESS" || updatePhase !== "downloading" || !navigator.serviceWorker.controller) return;
      updatePercent = Math.max(updatePercent, Math.min(100, Number(event.data.percent) || 0));
      if (updatePercent >= 100) updatePhase = "installing";
      renderUpdateStatus();
      scheduleUpdateTimeout(updatePhase === "installing" ? 15000 : 30000);
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!["downloading", "installing"].includes(updatePhase) || !oldController || navigator.serviceWorker.controller === oldController) return;
      clearUpdateTimer();
      updatePhase = "idle";
      window.location.reload();
    });
  }

  function renderInstallSettings() {
    const content = $("#settings-install-content");
    if (!content) return;
    renderSettingsReminder();

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
        const handleStateChange = () => {
          if (installing.state === "installed") {
            updatePhase = "available";
            renderUpdateStatus();
          } else if (installing.state === "redundant") {
            clearUpdateTimer();
            updatePhase = "idle";
            renderUpdateStatus();
          }
        };
        installing.addEventListener("statechange", handleStateChange);
        handleStateChange();
      };
      registration.addEventListener("updatefound", watchInstalling);
      watchInstalling();
      if (registration.waiting) { updatePhase = "available"; renderUpdateStatus(); }
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
