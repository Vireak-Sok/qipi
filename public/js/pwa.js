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
  let updateNotice = null;
  let updateRequested = false;
  let updateDismissed = false;
  let reloadAfterUpdate = false;
  let updatePhase = "idle";
  let updatePercent = 0;

  function updateMustWait() {
    return Boolean(document.querySelector("#main.explore-open, #main.messages-thread-open, #main.signup-open, #main.entry-open, dialog[open]"));
  }

  function renderUpdateNotice() {
    if (!navigator.serviceWorker?.controller || updateDismissed) return;
    const phase = updateRequested ? "installing" : registration?.waiting ? "ready" : updatePhase;
    if (!["downloading", "ready", "installing", "error"].includes(phase)) {
      if (updateNotice) updateNotice.hidden = true;
      return;
    }
    if (updateMustWait()) {
      if (updateNotice) updateNotice.hidden = true;
      return;
    }
    if (!updateNotice) {
      updateNotice = document.createElement("aside");
      updateNotice.className = "pwa-update-notice";
      updateNotice.setAttribute("role", "status");
      updateNotice.setAttribute("aria-live", "polite");
      document.body.append(updateNotice);
    }
    updateNotice.dataset.phase = phase;
    const status = phase === "downloading" ? `${t("pwaUpdateDownloading")} ${updatePercent}%`
      : phase === "installing" ? t("pwaUpdateInstalling")
        : phase === "error" ? t("pwaUpdateFailed") : t("pwaUpdateReady");
    updateNotice.innerHTML = `<div class="pwa-update-copy"><span>${esc(status)}</span>${phase === "downloading" ? `<div class="pwa-update-track" role="progressbar" aria-label="${esc(t("pwaUpdateDownloading"))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${updatePercent}"><i style="width:${updatePercent}%"></i></div>` : phase === "installing" ? `<small>${esc(t("pwaUpdateDownloaded"))} · 100%</small><div class="pwa-update-installing" aria-hidden="true"><i></i></div>` : ""}</div>${phase === "ready" ? `<div class="pwa-update-actions"><button type="button" data-pwa-update="apply">${esc(t("pwaUpdateAction"))}</button><button type="button" class="pwa-update-later" data-pwa-update="later">${esc(t("pwaUpdateLater"))}</button></div>` : phase === "error" ? `<div class="pwa-update-actions"><button type="button" data-pwa-update="retry">${esc(t("retry"))}</button></div>` : ""}`;
    updateNotice.hidden = false;
  }

  function watchCriticalViews() {
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(renderUpdateNotice);
    const app = document.getElementById("main");
    if (app) observer.observe(app, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["open"], subtree: true });
  }

  function applyUpdate() {
    const waiting = registration?.waiting;
    if (!waiting || updateRequested) return;
    const hasOpenDialog = Boolean(document.querySelector("dialog[open]"));
    const hasUnsentText = [...document.querySelectorAll("input, textarea")].some((field) => {
      if (field.disabled || field.type === "hidden" || field.type === "button" || field.type === "submit" || field.type === "reset") return false;
      if (field.form?.getAttribute("role") === "search" || field.type === "search") return false;
      return field.value !== field.defaultValue;
    });
    const hasPendingUpload = [...document.querySelectorAll('input[type="file"]')].some((field) => field.files?.length);
    if ((hasOpenDialog || hasUnsentText || hasPendingUpload) && !window.confirm(t("pwaUpdateUnsavedConfirm"))) return;
    updateRequested = true;
    reloadAfterUpdate = true;
    updatePhase = "installing";
    renderUpdateNotice();
    waiting.postMessage({ type: "QIPI_ACTIVATE_UPDATE" });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pwa-update]");
    if (!button) return;
    if (button.dataset.pwaUpdate === "apply") applyUpdate();
    if (button.dataset.pwaUpdate === "later") {
      updateDismissed = true;
      if (updateNotice) updateNotice.hidden = true;
    }
    if (button.dataset.pwaUpdate === "retry") {
      updatePhase = "downloading";
      updatePercent = 0;
      renderUpdateNotice();
      registration?.update().catch(() => { updatePhase = "error"; renderUpdateNotice(); });
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type !== "QIPI_UPDATE_PROGRESS" || !registration?.installing || !navigator.serviceWorker.controller) return;
      updatePhase = "downloading";
      updatePercent = Math.max(updatePercent, Math.min(100, Number(event.data.percent) || 0));
      renderUpdateNotice();
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloadAfterUpdate) return;
      reloadAfterUpdate = false;
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
        if (!installing || !navigator.serviceWorker.controller) return;
        updatePhase = "downloading";
        updatePercent = 0;
        renderUpdateNotice();
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") { updatePhase = "ready"; updatePercent = 100; }
          else if (installing.state === "redundant") updatePhase = "error";
          renderUpdateNotice();
        });
      };
      registration.addEventListener("updatefound", watchInstalling);
      watchInstalling();
      watchCriticalViews();
      renderUpdateNotice();
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
  window.addEventListener("offline", () => toast(t("pwaOffline")));
  window.addEventListener("online", () => toast(t("pwaOnline")));
  window.addEventListener("DOMContentLoaded", () => { void registerServiceWorker(); }, { once: true });
  if (document.readyState !== "loading") void registerServiceWorker();

  return { install, renderInstallSettings };
}
