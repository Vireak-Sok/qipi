import { TRAVEL_OPTIONS } from "./js/shared.js";
import { QipiAuth } from "./auth.js";
import { copy } from "./i18n.js";

import { $, icon, esc, profileUsernameForId, saveLocal, dateToday } from "./js/core.js";
import { createRouter } from "./js/routing.js";
import { createSelectControls } from "./js/selects.js";
import { createLoadingViews } from "./js/loading.js";
import { createApiClient } from "./js/api.js";
import { createMediaClient } from "./js/media.js";
import { createSearchController } from "./js/search.js";
import { createProfileController } from "./js/profile.js";
import { createFeedController } from "./js/feed.js";
import { createTripCard } from "./js/trip-card.js";
import { createAppState } from "./js/state.js";

// Application state and shared helpers.
const auth = new QipiAuth();
const state = createAppState();
const t = (key) => copy[state.lang][key] || copy.en[key] || key;
const label = (value) => value?.[state.lang] || value?.en || "";
const displayName = () => auth.user?.user_metadata?.display_name?.trim() || auth.user?.email?.split("@")[0] || "";
let toastTimeout;

// Controllers share the same state; render callbacks run only after initialization.
const { usernameFromPath, profileIdFromLocation, pageUrl, viewFromLocation, setLink } = createRouter(state);
const { enhanceSelects, syncEnhancedSelect, syncEnhancedSelects, closeEnhancedSelect } = createSelectControls();
const { showDialogLoading, renderDialogError, renderSettingsAccountLoading, skeletonPostsMarkup, renderTripListLoading, renderRoutesLoading, renderLoadingError } = createLoadingViews({ t, showDialog });
const { api, event } = createApiClient({ auth, state, t });
const { appMediaUrl, storagePublicUrl, avatarContents, uploadImage } = createMediaClient({ auth, t });
const tripCardMarkup = createTripCard({ state, t, label, dateParts, dateLabel, routeFor, avatarContents, appMediaUrl });
const { renderRoutes, renderFilter, syncSearchFilterControls, renderTrips, loadTrips, openFeedPage, openExplorePage, openTripsPage, renderFeedLoading, loadFeedData } = createFeedController({
  state, t, label, routeFor, syncEnhancedSelect, api, setPageView, renderRoutesLoading, renderTripListLoading, renderLoadingError, toast, applyLanguage,
  tripCardMarkup: (trip) => tripCardMarkup(trip)
});
const { setSearch, submitSearch, loadSearchResults, renderSearchRecents, closeDesktopSearch, openMobileSearch, closeMobileSearch, bindSearchEvents } = createSearchController({
  state, t, api, renderRoutes, renderTrips, syncSearchFilterControls, setPageView, renderTripListLoading, renderLoadingError, toast
});
const { openProfile, renderProfileLoading, renderProfile, selectProfileTab } = createProfileController({
  state, auth, t, label, displayName, usernameFromPath, setLink, setPageView, api, renderFilter, renderRoutes, refreshMe, renderLoadingError, toast,
  dateParts, dateLabel, routeFor, avatarContents, appMediaUrl, skeletonPostsMarkup, tripCardMarkup, loadSavedTrips
});

const ENTRY_CHOICE_KEY = "qipi:entry-choice";
function entryChoice() { try { return sessionStorage.getItem(ENTRY_CHOICE_KEY); } catch { return "guest"; } }
function saveEntryChoice(value) { try { sessionStorage.setItem(ENTRY_CHOICE_KEY, value); } catch {} }
let entryReturnView = "feed";
async function restoreEntryReturnView() {
  if (entryReturnView === "saved") await openSavedTrips();
  else if (entryReturnView === "profile") {
    state.profileId = profileIdFromLocation();
    state.profileUsername = state.profileId;
    renderProfileLoading();
    setPageView("profile", { preserveUrl: true });
  }
  else setPageView(entryReturnView);
}
function routeFor(id) { return state.routes.find((route) => route.id === id); }
function dateLabel(date) {
  const locale = state.lang === "km" ? "km-KH" : state.lang === "zh" ? "zh-CN" : "en-GB";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
function dateParts(date) {
  const parsed = new Date(`${date}T00:00:00Z`);
  const locale = state.lang === "km" ? "km-KH" : state.lang === "zh" ? "zh-CN" : "en-GB";
  return {
    day: new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone: "UTC" }).format(parsed),
    month: new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(parsed)
  };
}
function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove("show"), 3500);
}
function setError(form, message) {
  const box = form.querySelector(".error-message");
  if (box) { box.textContent = message; box.classList.add("show"); }
}
function closeDialogs() {
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
}
function showDialog(id, html) {
  closeDialogs();
  const dialog = document.getElementById(id);
  dialog.querySelector("[id$='-content']").innerHTML = html;
  enhanceSelects(dialog);
  dialog.showModal();
}
function applyLanguage() {
  document.documentElement.lang = state.lang === "zh" ? "zh-Hans" : state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => { node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel)); });
  if ($("#settings-language")) $("#settings-language").value = state.lang;
  renderAccount(); renderRoutes(); renderFilter(); renderTrips();
  if (state.view === "profile") renderProfile();
  if (state.view === "settings") renderSettings();
  syncEnhancedSelects();
}

function renderAccount() {
  const name = displayName();
  const signedIn = Boolean(auth.user);
  $("#account-label").textContent = name || t("signIn");
  $("#account-label").hidden = signedIn;
  $("#account-button").classList.toggle("is-profile-only", signedIn);
  const avatarPath = auth.user?.user_metadata?.avatar_path || "";
  $("#account-avatar").innerHTML = name ? avatarContents(name, avatarPath) : icon("user");
  $("#rail-avatar").innerHTML = avatarContents(name || "Q", avatarPath);
  $("#composer-avatar").innerHTML = avatarContents(name || "Q", avatarPath);
  $("#rail-user-name").textContent = name || t("guestTraveler");
  const profileLabel = name ? `${t("profile")}: ${name}` : t("signIn");
  $("#account-button").setAttribute("aria-label", profileLabel);
  $(".rail-profile")?.setAttribute("aria-label", profileLabel);
}

function renderSettings() {
  const content = $("#settings-account-content");
  if (!content) return;
  content.setAttribute("aria-busy", "false");
  const name = displayName();
  content.innerHTML = auth.user
    ? `<div class="settings-profile"><span class="profile-avatar">${avatarContents(name, auth.user.user_metadata?.avatar_path || "")}</span><div><strong>${esc(name)}</strong><small>${esc(auth.user.email || "")}</small></div></div><div class="settings-account-actions"><button class="button button-primary" type="button" data-action="account">${icon("user")} ${esc(t("profilePageTitle"))}</button><button class="settings-signout" type="button" data-action="sign-out">${esc(t("signOut"))}</button></div>`
    : `<p class="settings-guest-copy">${esc(t("guestProfileText"))}</p><button class="button button-primary" type="button" data-action="settings-sign-in">${esc(t("signIn"))}</button>`;
  $("#settings-language").value = state.lang;
  $("#settings-theme").value = state.theme;
  $("#settings-transport").value = state.preferences.defaultTransport;
  $("#settings-cost-style").value = state.preferences.defaultCostStyle;
  $("#settings-safety-reminders").checked = state.preferences.safetyReminders;
  syncEnhancedSelects();
}

function setPageView(view, { preserveUrl = false } = {}) {
  if (view === "saved") view = "feed"; // Legacy URL resolves through openSavedTrips after authentication.
  state.view = view;
  const main = $("#main");
  const settings = $("#settings-view");
  const isEntry = view === "entry";
  const isSettings = view === "settings";
  const isExplore = view === "explore";
  const isSearchResults = view === "search-results";
  const isSignup = view === "signup";
  const isProfile = view === "profile";
  main.classList.toggle("entry-open", isEntry);
  main.classList.toggle("settings-open", isSettings);
  main.classList.toggle("signup-open", isSignup);
  main.classList.toggle("explore-open", isExplore);
  main.classList.toggle("search-results-open", isSearchResults);
  main.classList.toggle("profile-open", isProfile);
  $("#search-filter-panel").hidden = !isSearchResults;
  document.querySelectorAll('.rail-nav [data-page-view="feed"], .mobile-nav [data-page-view="feed"]').forEach((item) => item.classList.toggle("active", view === "feed"));
  document.querySelectorAll('.rail-nav [data-page-view="explore"], .mobile-nav [data-page-view="explore"]').forEach((item) => item.classList.toggle("active", isExplore));
  document.querySelectorAll('.rail-nav [data-page-view="trips"], .mobile-nav [data-page-view="trips"]').forEach((item) => item.classList.toggle("active", view === "trips"));
  document.querySelectorAll('.rail-nav [data-action="open-settings"], .mobile-nav [data-action="open-settings"]').forEach((item) => item.classList.toggle("active", isSettings));
  document.querySelectorAll(".mobile-nav [data-page-view], .mobile-nav [data-action='open-settings']").forEach((item) => {
    if (item.classList.contains("active")) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  document.querySelectorAll(".feed-column > :not(#entry-view):not(#settings-view):not(#profile-view):not(#signup-view)").forEach((section) => {
    section.hidden = isEntry || isSettings || isProfile || isSignup || (isExplore && section.id !== "routes") || (isSearchResults && section.id !== "trips");
  });
  $("#entry-view").hidden = !isEntry;
  settings.hidden = !isSettings;
  $("#profile-view").hidden = !isProfile;
  $("#signup-view").hidden = !isSignup;
  if (isSettings) renderSettings();
  if (isProfile) renderProfile();
  renderRoutes();
  if (isEntry) document.documentElement.removeAttribute("data-entry-pending");
  document.documentElement.removeAttribute("data-profile-pending");
  const nextLocation = pageUrl(view);
  if (!preserveUrl && location.pathname + location.search + location.hash !== nextLocation) {
    history.replaceState(history.state, "", nextLocation);
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setSettingsView(open) { setPageView(open ? "settings" : "feed"); }

async function openSettings() {
  closeDialogs();
  setSettingsView(true);
  if (auth.user) {
    renderSettingsAccountLoading();
    await refreshMe();
    renderSettings();
  }
}

async function refreshMe() {
  if (!auth.user) { state.me = null; return; }
  try {
    const { profile } = await api("/api/me/profile", { method: "PUT" });
    state.me = { ...await api("/api/me"), profile };
  }
  catch { state.me = null; }
}

async function navigateToView(view) {
  if (view === "feed") return openFeedPage();
  if (view === "explore") return openExplorePage();
  if (view === "trips") return openTripsPage();
  if (view === "saved") return openSavedTrips();
  if (view === "settings") return openSettings();
  if (view === "search-results") {
    setPageView(view);
    renderTripListLoading("#trip-list", 2);
    return loadSearchResults();
  }
  setPageView(view);
}

// Route and trip actions.
async function openRoute(id, deepLink = true) {
  const requestId = ++state.routeRequestId;
  showDialogLoading("route-dialog", "route-dialog-title");
  try {
    const { route, updates } = await api(`/api/routes/${encodeURIComponent(id)}`);
    if (requestId !== state.routeRequestId) return;
    if (deepLink) setLink("route", id);
    event("route_viewed", id);
    showDialog("route-dialog", `
      <p class="dialog-kicker">${esc(t("routeGuide"))} / ${esc(label(route.label))}</p><h2 id="route-dialog-title">${esc(label(route.title))}</h2><p class="dialog-intro">${esc(label(route.summary))}</p>
      <div class="detail-facts"><span class="fact-pill">${icon("clock")} ${esc(label(route.duration))}</span><span class="fact-pill">${icon("truck")} ${esc(label(route.mode))}</span><span class="fact-pill">${icon("sparkles")} ${esc(label(route.level))}</span></div>
      <div class="dialog-section"><h3>${esc(t("routeStops"))}</h3><ol class="stop-list">${route.stops.map((stop) => `<li>${esc(label(stop))}</li>`).join("")}</ol></div>
      <div class="dialog-section"><h3>${esc(t("costChecklist"))}</h3><ul class="stop-list">${route.costChecklist.map((cost) => `<li>${esc(label(cost))}</li>`).join("")}</ul></div>
      <div class="note-box"><strong>${esc(t("routeNote"))}</strong>${esc(label(route.note))}</div>
      <p class="source-line">${esc(t("reviewed"))}: ${esc(dateLabel(route.reviewedAt))} · <a href="${esc(route.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(t("routeSource"))} ${icon("arrow-up-right")}</a></p>
      <div class="dialog-actions"><a class="button button-ghost" href="${esc(route.mapUrl)}" target="_blank" rel="noopener noreferrer">${esc(t("openMap"))} ${icon("arrow-up-right")}</a><button class="button button-primary" type="button" data-action="show-route-trips" data-id="${esc(id)}">${esc(t("findTripsHere"))} ${icon("arrow-right")}</button></div>
      <div class="dialog-section"><h3>${esc(t("recentNotes"))}</h3><div class="updates-list">${updates.length ? updates.map((update) => `<div class="update-item"><strong>${esc(update.nickname)}</strong><small>${esc(dateLabel(update.visitedOn))} · ${esc(t(update.condition === "mixed" ? "mixedCondition" : update.condition))}</small><p>${esc(update.note)}</p></div>`).join("") : `<p class="small-copy">${esc(t("noNotes"))}</p>`}</div><div class="dialog-actions"><button class="plain-button" type="button" data-action="open-update" data-id="${esc(id)}">${esc(t("addRouteNote"))} ${icon("arrow-up-right")}</button><button class="plain-button danger-link" type="button" data-action="open-report" data-type="route" data-id="${esc(id)}">${esc(t("reportRoute"))}</button></div></div>
      <p class="small-copy">${esc(t("routeNotLive"))}</p>`);
  } catch (error) { if (requestId === state.routeRequestId) { renderDialogError("route-dialog", "retry-route", id); toast(error.message || t("failed")); } }
}

async function openTrip(id, deepLink = true) {
  const requestId = ++state.tripRequestId;
  showDialogLoading("trip-dialog", "trip-dialog-title");
  try {
    const { trip } = await api(`/api/trips/${encodeURIComponent(id)}`);
    if (requestId !== state.tripRequestId) return;
    if (deepLink) setLink("trip", id);
    event("trip_viewed", id);
    let requestStatus = state.me?.requests.find((request) => request.trip.id === id)?.status || "";
    const ownRequest = state.requestKeys[id];
    if (!requestStatus && ownRequest) {
      try {
        const result = await api(`/api/trips/${encodeURIComponent(id)}/requests/${encodeURIComponent(ownRequest.id)}`, { headers: { "x-request-token": ownRequest.token } });
        requestStatus = result.request.status;
      } catch { requestStatus = ""; }
    }
    if (requestId !== state.tripRequestId) return;
    const isHost = Boolean(state.hostKeys[id] || state.me?.trips.some((owned) => owned.id === id));
    const statusText = requestStatus ? t(requestStatus === "approved" ? "requestApproved" : requestStatus === "declined" ? "requestDeclined" : "requestPending") : "";
    const primary = isHost
      ? `<button class="button button-primary" type="button" data-action="manage-trip" data-id="${esc(id)}">${esc(t("manageRequests"))} ${icon("arrow-up-right")}</button>`
      : requestStatus
        ? `<span class="status-chip ${esc(requestStatus)}">${esc(statusText)}</span>`
        : trip.status === "closed"
          ? `<span class="status-chip closed">${esc(t("closedTrip"))}</span>`
          : trip.availableSpots === 0
            ? ""
            : `<button class="button button-primary" type="button" data-action="join-trip" data-id="${esc(id)}">${esc(t("joinTrip"))} ${icon("arrow-up-right")}</button>`;
    showDialog("trip-dialog", `
      <p class="dialog-kicker">${esc(label(routeFor(trip.routeId)?.title))} / ${esc(dateLabel(trip.date))}</p><h2 id="trip-dialog-title">${esc(trip.title)}</h2><p class="dialog-intro">${esc(t("hostedBy"))} ${esc(trip.hostName)} · ${esc(trip.availableSpots)} ${esc(t("spots"))}</p>
      <div class="detail-facts"><span class="fact-pill">${icon("clock")} ${esc(trip.departureTime)}</span><span class="fact-pill">${icon("truck")} ${esc(trip.transport === "motorbike" ? t("motorbike") : trip.transport === "car" ? t("car") : t("mixed"))}</span><span class="fact-pill">${icon("users")} ${esc(trip.costStyle === "shared" ? t("sharedCosts") : trip.costStyle === "free" ? t("freeTrip") : t("ownCosts"))}</span></div>
      <div class="dialog-section"><h3>${esc(t("meetingArea"))}</h3><p class="dialog-intro">${esc(trip.meetingArea)}</p></div>
      <div class="dialog-section"><h3>${esc(t("aboutTrip"))}</h3><p class="dialog-intro">${esc(trip.notes || "—")}</p></div>
      <div class="note-box">${esc(t("noContact"))}</div>
      <div class="dialog-actions">${primary}<button class="button button-ghost" type="button" data-action="share-trip" data-id="${esc(id)}">${esc(t("shareTrip"))} ${icon("arrow-up-right")}</button></div>
      <div id="requests-panel"></div>
      <div class="dialog-section"><div class="dialog-actions">${isHost && trip.status === "open" ? `<button class="plain-button" type="button" data-action="close-trip" data-id="${esc(id)}">${esc(t("closeTrip"))}</button>` : ""}<button class="plain-button danger-link" type="button" data-action="open-report" data-type="trip" data-id="${esc(id)}">${esc(t("reportTrip"))}</button></div></div>`);
  } catch (error) { if (requestId === state.tripRequestId) { renderDialogError("trip-dialog", "retry-trip", id); toast(error.message || t("failed")); } }
}

function openCreate(selectedRoute = "") {
  showDialog("create-dialog", `
    <p class="dialog-kicker">QIPI / ${esc(t("postTrip"))}</p><h2 id="create-dialog-title">${esc(t("createTitle"))}</h2><p class="dialog-intro">${esc(t("createIntro"))}</p>
    <form id="create-form"><div class="form-grid">
      <div class="field"><label for="host-name">${esc(t("yourName"))}</label><input id="host-name" name="hostName" maxlength="40" minlength="2" required value="${esc(displayName() || localStorage.getItem("qipi:nickname") || "")}" /></div>
      <div class="field"><label for="trip-title">${esc(t("tripTitle"))}</label><input id="trip-title" name="title" maxlength="80" minlength="5" required /></div>
      <div class="field span-2"><label for="trip-route">${esc(t("route"))}</label><select id="trip-route" name="routeId" required><option value="">—</option>${state.routes.map((route) => `<option value="${esc(route.id)}" ${route.id === selectedRoute ? "selected" : ""}>${esc(label(route.title))}</option>`).join("")}</select></div>
      <div class="field"><label for="trip-date">${esc(t("travelDate"))}</label><input id="trip-date" name="date" type="date" min="${dateToday()}" required /></div>
      <div class="field"><label for="trip-time">${esc(t("departureTime"))}</label><input id="trip-time" name="departureTime" type="time" value="07:00" required /></div>
      <div class="field"><label for="trip-transport">${esc(t("transport"))}</label><select id="trip-transport" name="transport"><option value="motorbike" ${state.preferences.defaultTransport === "motorbike" ? "selected" : ""}>${esc(t("motorbike"))}</option><option value="car" ${state.preferences.defaultTransport === "car" ? "selected" : ""}>${esc(t("car"))}</option><option value="mixed" ${state.preferences.defaultTransport === "mixed" ? "selected" : ""}>${esc(t("mixed"))}</option></select></div>
      <div class="field"><label for="trip-seats">${esc(t("openPlaces"))}</label><input id="trip-seats" name="seats" type="number" min="1" max="12" value="3" required /></div>
      <div class="field span-2"><label for="trip-meeting">${esc(t("meetingAreaLabel"))}</label><input id="trip-meeting" name="meetingArea" minlength="3" maxlength="80" required /><small>${esc(t("meetingAreaHint"))}</small></div>
      <div class="field span-2"><label for="trip-cost">${esc(t("costStyle"))}</label><select id="trip-cost" name="costStyle"><option value="own" ${state.preferences.defaultCostStyle === "own" ? "selected" : ""}>${esc(t("ownCosts"))}</option><option value="shared" ${state.preferences.defaultCostStyle === "shared" ? "selected" : ""}>${esc(t("sharedCosts"))}</option><option value="free" ${state.preferences.defaultCostStyle === "free" ? "selected" : ""}>${esc(t("freeTrip"))}</option></select></div>
      <div class="field span-2"><label for="trip-image">${esc(t("tripPhotoLabel"))}</label><input id="trip-image" type="file" accept="image/jpeg,image/png,image/webp" /><small>${esc(t("imageUploadHint"))}</small><div id="trip-image-preview" class="trip-image-preview" hidden></div></div>
      <div class="field span-2"><label for="trip-notes">${esc(t("tripNotes"))}</label><textarea id="trip-notes" name="notes" maxlength="500" placeholder="${esc(t("tripNotesHint"))}"></textarea></div>
    </div>${state.preferences.safetyReminders ? `<div class="note-box settings-safety-note">${esc(t("safetyReminder"))}</div>` : ""}<div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("createTripButton"))} ${icon("arrow-up-right")}</button><p class="small-copy">${esc(t("hostDeviceNote"))}</p></form>`);
}
function openJoin(id) {
  showDialog("join-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("joinTrip"))}</p><h2 id="join-dialog-title">${esc(t("joinTitle"))}</h2><p class="dialog-intro">${esc(t("joinIntro"))}</p><form id="join-form" data-trip-id="${esc(id)}"><div class="field"><label for="join-name">${esc(t("travelerName"))}</label><input id="join-name" name="travelerName" minlength="2" maxlength="40" required value="${esc(displayName() || localStorage.getItem("qipi:nickname") || "")}" /></div><div class="field"><label for="join-message">${esc(t("shortMessage"))}</label><textarea id="join-message" name="message" maxlength="280"></textarea></div><div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("sendRequest"))} ${icon("arrow-up-right")}</button></form>`);
}
async function manageTrip(id) {
  try {
    const result = await api(`/api/trips/${encodeURIComponent(id)}/requests`, { headers: { "x-host-token": state.hostKeys[id] || "" } });
    const panel = $("#requests-panel");
    if (!panel) return;
    panel.innerHTML = `<div class="dialog-section"><h3>${esc(t("requestList"))}</h3>${result.requests.length ? result.requests.map((request) => `<div class="request-row"><strong>${esc(request.travelerName)}</strong> <span class="status-chip ${esc(request.status)}">${esc(request.status)}</span><p>${esc(request.message || "—")}</p>${request.status === "pending" ? `<div class="dialog-actions"><button class="button button-primary" type="button" data-action="decide-request" data-id="${esc(id)}" data-request="${esc(request.id)}" data-decision="approved">${esc(t("approve"))}</button><button class="button button-ghost" type="button" data-action="decide-request" data-id="${esc(id)}" data-request="${esc(request.id)}" data-decision="declined">${esc(t("decline"))}</button></div>` : ""}</div>`).join("") : `<p class="small-copy">${esc(t("noRequests"))}</p>`}</div>`;
  } catch (error) { toast(error.message || t("failed")); }
}

async function openSavedTrips() {
  if (!auth.user) { await openFeedPage(); pendingAction = openSavedTrips; openAuth("signin"); return; }
  await openProfile(auth.user.id, true, "saved");
}
async function loadSavedTrips() {
  const requestId = ++state.savedRequestId;
  state.savedLoading = true;
  state.savedError = false;
  if (state.view === "profile") renderProfile();
  try {
    // Fetch only saved IDs. This boundary can use indexed SQL without changing UI.
    const trips = [];
    for (let offset = 0; offset < state.savedTrips.length; offset += 100) {
      const ids = state.savedTrips.slice(offset, offset + 100);
      const result = await api("/api/trips?includeClosed=true&ids=" + encodeURIComponent(ids.join(",")));
      trips.push(...result.trips);
      if (requestId !== state.savedRequestId) return;
    }
    if (requestId !== state.savedRequestId) return;
    state.savedTripRecords = trips;
  } catch (error) {
    if (requestId !== state.savedRequestId) return;
    state.savedError = true;
    toast(error.message || t("failed"));
  } finally {
    if (requestId === state.savedRequestId) {
      state.savedLoading = false;
      if (state.view === "profile") renderProfile();
    }
  }
}

function openUpdate(id) {
  showDialog("update-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("addRouteNote"))}</p><h2 id="update-dialog-title">${esc(t("updateTitle"))}</h2><p class="dialog-intro">${esc(t("updateIntro"))}</p><form id="update-form" data-route-id="${esc(id)}"><div class="form-grid"><div class="field"><label for="update-name">${esc(t("yourName"))}</label><input id="update-name" name="nickname" minlength="2" maxlength="40" required value="${esc(displayName() || localStorage.getItem("qipi:nickname") || "")}" /></div><div class="field"><label for="update-date">${esc(t("visitDate"))}</label><input id="update-date" type="date" name="visitedOn" max="${dateToday()}" required /></div><div class="field span-2"><label for="update-condition">${esc(t("condition"))}</label><select id="update-condition" name="condition"><option value="good">${esc(t("good"))}</option><option value="mixed">${esc(t("mixedCondition"))}</option><option value="caution">${esc(t("caution"))}</option></select></div><div class="field span-2"><label for="update-note">${esc(t("routeUpdateNote"))}</label><textarea id="update-note" name="note" minlength="10" maxlength="500" required></textarea></div></div><div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("submitUpdate"))} ${icon("arrow-up-right")}</button></form>`);
}
function openReport(type, id) {
  showDialog("report-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("reportTitle"))}</p><h2 id="report-dialog-title">${esc(t("reportTitle"))}</h2><p class="dialog-intro">${esc(t("reportIntro"))}</p><form id="report-form" data-target-type="${esc(type)}" data-target-id="${esc(id)}"><div class="field"><label for="report-reason">${esc(t("reason"))}</label><select id="report-reason" name="reason"><option value="inaccurate">${esc(t("inaccurate"))}</option><option value="unsafe">${esc(t("unsafe"))}</option><option value="spam">${esc(t("spam"))}</option><option value="other">${esc(t("other"))}</option></select></div><div class="field"><label for="report-details">${esc(t("details"))}</label><textarea id="report-details" name="details" maxlength="500"></textarea></div><div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("sendReport"))} ${icon("arrow-up-right")}</button></form>`);
}
async function shareTrip(id) {
  const url = new URL("/post/" + encodeURIComponent(id), location.origin);
  try { await navigator.clipboard.writeText(url.toString()); toast(t("copied")); }
  catch { window.prompt(t("shareTrip"), url.toString()); }
}
async function shareProfile(id) {
  const profile = state.profile?.id === id ? state.profile : null;
  const trip = [...state.trips, ...state.savedTripRecords].find((item) => item.profileId === id);
  const username = profile?.username || (id === usernameFromPath() ? id : profileUsernameForId(id, trip?.hostName));
  const url = new URL("/" + encodeURIComponent(username), location.origin);
  try { await navigator.clipboard.writeText(url.toString()); toast(t("copied")); }
  catch { window.prompt(t("shareProfile"), url.toString()); }
}

// Sign-up and authentication flows.
let pendingAction = null;
let signupReturnTarget = { view: "feed", dialog: null };
function signupError(message = "") {
  const box = document.querySelector('.signup-step:not([hidden]) .error-message');
  if (box) { box.textContent = message; box.classList.toggle("show", Boolean(message)); }
}
function setSignupStep(step) {
  document.querySelectorAll("[data-signup-step]").forEach((section) => { section.hidden = Number(section.dataset.signupStep) !== step; });
  document.querySelectorAll("[data-signup-progress]").forEach((item) => {
    const number = Number(item.dataset.signupProgress);
    item.classList.toggle("is-current", number === step);
    item.classList.toggle("is-complete", number < step);
  });
  signupError();
}
function validateSignupAccount() {
  for (const input of document.querySelectorAll('[data-signup-step="1"] input')) {
    if (!input.checkValidity()) { setSignupStep(1); input.reportValidity(); input.focus(); return false; }
  }
  if ($("#signup-password").value !== $("#signup-confirm-password").value) {
    setSignupStep(1);
    signupError(t("signupPasswordMismatch"));
    $("#signup-confirm-password").focus();
    return false;
  }
  signupError();
  return true;
}
function openSignupPage(source = null) {
  if (auth.user) { openSettings(); return; }
  if (state.view !== "signup") {
    signupReturnTarget = {
      view: state.view === "search-results" ? "feed" : state.view,
      dialog: source === "entry" || source === "signin" ? source : null
    };
  }
  closeDialogs();
  document.documentElement.removeAttribute("data-entry-pending");
  document.documentElement.removeAttribute("data-signup-pending");
  saveEntryChoice("account");
  $("#signup-form").reset();
  $("#signup-confirmation").hidden = true;
  $("#signup-form .signup-progress").hidden = false;
  setSignupStep(1);
  setPageView("signup");
}
function requireSignIn(action) {
  if (!auth.enabled || auth.user) { action(); return; }
  pendingAction = action;
  openAuth("signin");
}

function openAuth(mode = "signin") {
  if (mode === "signup") { openSignupPage("signin"); return; }
  if (!auth.enabled) {
    showDialog("auth-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("profile"))}</p><h2 id="auth-dialog-title">${esc(t("profile"))}</h2><p class="dialog-intro">${esc(t("authUnavailable"))}</p>`);
    return;
  }
  if (mode === "profile" && auth.user) { openProfile(auth.user.id); return; }
  const recover = mode === "recover";
  const reset = mode === "reset";
  const title = t(recover ? "authHeadingRecover" : reset ? "authHeadingReset" : "authHeadingSignIn");
  const description = recover ? t("authDescriptionRecover") : "";
  const passwordField = (showRecoveryLink = false, autocomplete = "current-password") => `
    <div class="field">
      <div class="field-label-row"><label for="auth-password">${esc(t("password"))}</label>${showRecoveryLink ? `<button class="auth-forgot" type="button" data-action="auth-mode" data-mode="recover">${esc(t("forgotPassword"))}</button>` : ""}</div>
      <div class="password-control"><input id="auth-password" name="password" type="password" minlength="8" autocomplete="${autocomplete}" required /><button type="button" class="password-toggle" data-action="toggle-password" data-target="auth-password" aria-controls="auth-password" aria-pressed="false" aria-label="${esc(t("showPassword"))}">${esc(t("showPassword"))}</button></div>
    </div>`;
  const submitLabel = recover ? t("sendReset") : reset ? t("resetPassword") : t("signIn");
  const form = reset
    ? `<form class="auth-form" id="auth-form" data-mode="reset">${passwordField(false, "new-password")}<div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(submitLabel)}</button></form>`
    : `<form class="auth-form" id="auth-form" data-mode="${esc(mode)}"><div class="field"><label for="auth-email">${esc(t("email"))}</label><input id="auth-email" name="email" type="email" autocomplete="email" required /></div>${recover ? "" : passwordField(true, "current-password")}<div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(submitLabel)}</button></form>`;
  const switcher = reset ? "" : `<div class="auth-switch"><span>${esc(t(recover ? "haveAccount" : "needAccount"))}</span><button type="button" data-action="auth-mode" data-mode="${recover ? "signin" : "signup"}">${esc(t(recover ? "signIn" : "signUp"))}</button></div>`;
  showDialog("auth-dialog", `<div class="auth-brand-lockup"><span class="brand-mark" aria-hidden="true"><span></span><span></span></span><span class="auth-brand-name">Qipi</span></div><h2 id="auth-dialog-title">${esc(title)}</h2>${description ? `<p class="dialog-intro auth-intro">${esc(description)}</p>` : ""}${form}${switcher}`);
}

async function openStartupDeepLink() {
  const query = new URLSearchParams(location.search);
  const pending = state.startupDeepLink;
  state.startupDeepLink = null;
  const postMatch = location.pathname.match(/^\/post\/([^/]+)\/?$/);
  if (pending?.routeId || query.has("route")) {
    const id = pending?.routeId || query.get("route");
    setLink("route", id);
    await openRoute(id, false);
  }
  else if (pending?.tripId || query.has("trip") || postMatch) {
    let id = pending?.tripId || query.get("trip") || postMatch[1];
    try { id = decodeURIComponent(id); } catch {}
    setLink("trip", id);
    await openTrip(id, false);
  }
  else if (profileIdFromLocation()) {
    const profileId = profileIdFromLocation();
    if (!state.profile || state.profile.id !== profileId) await openProfile(profileId, false, query.get("tab") || "posts");
  }
}

async function authSuccess() {
  await refreshMe();
  renderAccount();
  renderSettings();
  renderTrips();
  const wasEntryPage = state.view === "entry";
  if (wasEntryPage) await restoreEntryReturnView();
  closeDialogs();
  const action = pendingAction;
  pendingAction = null;
  if (action) action();
  else {
    // A shared profile link should resume on that profile without first
    // fetching or painting the feed.
    if (wasEntryPage && entryReturnView !== "profile") await loadFeedData();
    await openStartupDeepLink();
  }
}

// Delegated UI actions and form submissions.
document.addEventListener("click", async (eventTarget) => {
  const button = eventTarget.target.closest("[data-action]");
  if (!button) return;
  const { action, id, type, request, decision, mode } = button.dataset;
  if (action === "toggle-password") {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    button.setAttribute("aria-pressed", String(visible));
    button.textContent = t(visible ? "hidePassword" : "showPassword");
    button.setAttribute("aria-label", t(visible ? "hidePassword" : "showPassword"));
    input.focus({ preventScroll: true });
    return;
  }
  if (action === "open-mobile-search") { openMobileSearch(); return; }
  if (action === "close-mobile-search") { closeMobileSearch(); return; }
  if (action === "clear-mobile-search") { $("#mobile-feed-search").value = ""; $(".search-clear").hidden = true; renderSearchRecents(); $("#mobile-feed-search")?.focus(); return; }
  if (action === "select-recent-search") { submitSearch(button.dataset.query || ""); return; }
  if (action === "remove-recent-search") {
    state.recentSearches = state.recentSearches.filter((item) => item !== button.dataset.query);
    saveLocal("qipi:recent-searches", state.recentSearches);
    renderSearchRecents();
    return;
  }
  if (action === "reset-search-filters") { state.searchFilters = { upcoming: false, routeId: "", transport: "" }; syncSearchFilterControls(); renderTrips(); return; }
  if (action === "close-search-results") {
    state.filter = "";
    state.searchFilters = { upcoming: false, routeId: "", transport: "" };
    setSearch("");
    syncSearchFilterControls();
    closeDesktopSearch();
    closeMobileSearch({ save: false });
    await openFeedPage();
    return;
  }
  if (action === "toggle-notifications") {
    const panel = $("#notifications-panel");
    panel.hidden = !panel.hidden;
    button.setAttribute("aria-expanded", String(!panel.hidden));
    return;
  }
  if (action === "close-notifications") {
    $("#notifications-panel").hidden = true;
    $("[data-action='toggle-notifications']").setAttribute("aria-expanded", "false");
    return;
  }
  if (action === "entry-guest") {
    button.disabled = true;
    saveEntryChoice("guest");
    await restoreEntryReturnView();
    // Profile deep links have their own data request and loading state.
    if (entryReturnView !== "profile") await loadFeedData();
    await openStartupDeepLink();
    return;
  }
  if (action === "entry-account") { openSignupPage("entry"); return; }
  if (action === "entry-sign-in") { saveEntryChoice("account"); openAuth("signin"); return; }
  if (action === "signup-next") { if (validateSignupAccount()) setSignupStep(2); return; }
  if (action === "signup-previous") { setSignupStep(1); return; }
  if (action === "signup-exit") {
    await navigateToView(signupReturnTarget.view);
    if (signupReturnTarget.dialog === "signin") openAuth("signin");
    return;
  }
  if (action === "signup-sign-in") { openAuth("signin"); return; }
  if (action === "retry-feed") { await loadFeedData(); return; }
  if (action === "retry-explore") { await openExplorePage(); return; }
  if (action === "retry-trips") { await openTripsPage(); return; }
  if (action === "retry-search") { await loadSearchResults(); return; }
  if (action === "retry-saved") { await loadSavedTrips(); return; }
  if (action === "profile-tab") { await selectProfileTab(id); return; }
  if (action === "retry-profile") { await openProfile(id); return; }
  if (action === "retry-route") { await openRoute(id); return; }
  if (action === "retry-trip") { await openTrip(id); return; }
  if (action === "edit-profile") { state.profileEditing = true; renderProfile(); return; }
  if (action === "cancel-profile-edit") { state.profileEditing = false; renderProfile(); return; }
  if (action === "close-dialog") { closeDialogs(); setLink(); }
  if (action === "open-route") openRoute(id);
  if (action === "open-profile") { await openProfile(id); return; }
  if (action === "profile-back") {
    const returnView = state.profileReturnView || "feed";
    state.profile = null;
    state.profileId = "";
    state.profileUsername = "";
    state.profileRequestId += 1;
    setLink();
    await navigateToView(returnView);
    return;
  }
  if (action === "open-trip") openTrip(id);
  if (action === "create-trip") requireSignIn(() => openCreate(id || state.filter));
  if (action === "join-trip") requireSignIn(() => openJoin(id));
  if (action === "saved-trips") openSavedTrips();
  if (action === "open-settings") openSettings();
  if (action === "back-to-feed") { await openFeedPage(); }
  if (action === "settings-sign-in") openAuth("signin");
  if (action === "account") {
    pendingAction = null;
    if (auth.user) await openProfile(auth.user.id);
    else openAuth("signin");
  }
  if (action === "auth-mode") openAuth(mode);
  if (action === "sign-out") { state.savedRequestId++; state.savedTripRecords = []; state.profileTab = "posts"; await auth.signOut(); state.me = null; renderAccount(); renderSettings(); renderTrips(); if (state.view === "profile") renderProfile(); closeDialogs(); }
  if (action === "toggle-save") {
    state.savedTrips = state.savedTrips.includes(id) ? state.savedTrips.filter((item) => item !== id) : [...state.savedTrips, id];
    saveLocal("qipi:saved-trips", state.savedTrips);
    renderTrips();
    if (state.view === "profile") renderProfile();
  }
  if (action === "toggle-like") {
    if (state.pendingLikes.has(id)) return;
    const sourceTrip = state.trips.find((trip) => trip.id === id)
      || state.savedTripRecords.find((trip) => trip.id === id)
      || state.profile?.trips.find((trip) => trip.id === id);
    if (!sourceTrip) return;
    const previous = {
      likedByViewer: Boolean(sourceTrip.likedByViewer),
      likesCount: Number(sourceTrip.likesCount) || 0
    };
    const liked = !previous.likedByViewer;
    const optimistic = {
      likedByViewer: liked,
      likesCount: Math.max(0, previous.likesCount + (liked ? 1 : -1))
    };
    const updateTrip = (trip, values) => trip.id === id ? { ...trip, ...values } : trip;
    const updateLikeState = (values) => {
      state.trips = state.trips.map((trip) => updateTrip(trip, values));
      state.savedTripRecords = state.savedTripRecords.map((trip) => updateTrip(trip, values));
      if (state.profile) state.profile = { ...state.profile, trips: state.profile.trips.map((trip) => updateTrip(trip, values)) };
    };
    const renderLikeState = () => {
      renderTrips();
      if (state.view === "profile") renderProfile();
    };
    updateLikeState(optimistic);
    state.pendingLikes.add(id);
    renderLikeState();
    try {
      const result = await api(`/api/trips/${encodeURIComponent(id)}/like`, { method: "POST", data: { liked } });
      updateLikeState(result);
    } catch (error) {
      updateLikeState(previous);
      toast(error.message || t("failed"));
    } finally {
      state.pendingLikes.delete(id);
      renderLikeState();
    }
    return;
  }
  if (action === "toggle-follow") {
    if (!state.profile || state.profile.id !== id) return;
    button.disabled = true;
    try {
      const following = button.getAttribute("aria-pressed") !== "true";
      const result = await api(`/api/profiles/${encodeURIComponent(id)}/follow`, { method: "POST", data: { following } });
      if (state.profile?.id === id) {
        state.profile = { ...state.profile, ...result };
        renderProfile();
      }
    } catch (error) { toast(error.message || t("failed")); }
    finally { if (button.isConnected) button.disabled = false; }
    return;
  }
  if (action === "manage-trip") manageTrip(id);
  if (action === "open-update") requireSignIn(() => openUpdate(id));
  if (action === "open-report") openReport(type, id);
  if (action === "share-trip") shareTrip(id);
  if (action === "share-profile") shareProfile(id);
  if (action === "show-route-trips") {
    state.filter = id; renderFilter(); renderTrips(); closeDialogs(); setLink(); $("#trips").scrollIntoView({ behavior: "smooth" });
  }
  if (action === "decide-request") {
    try {
      await api(`/api/trips/${encodeURIComponent(id)}/requests/${encodeURIComponent(request)}/decision`, {
        method: "POST", data: { decision }, headers: { "x-host-token": state.hostKeys[id] || "" }
      });
      toast(t("decisionSuccess")); await manageTrip(id); await loadTrips();
    } catch (error) { toast(error.message || t("failed")); }
  }
  if (action === "close-trip") {
    if (!window.confirm(t("confirmClose"))) return;
    try {
      await api(`/api/trips/${encodeURIComponent(id)}/close`, { method: "POST", data: {}, headers: { "x-host-token": state.hostKeys[id] || "" } });
      toast(t("tripClosed")); await refreshMe(); await loadTrips(); await openTrip(id);
    } catch (error) { toast(error.message || t("failed")); }
  }
});

document.addEventListener("click", (eventTarget) => {
  if (eventTarget.target.closest(".notification-wrap")) return;
  const panel = $("#notifications-panel");
  if (!panel.hidden) {
    panel.hidden = true;
    $("[data-action='toggle-notifications']").setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (eventTarget) => {
  if (eventTarget.key !== "Escape") return;
  const panel = $("#notifications-panel");
  if (!panel.hidden) {
    panel.hidden = true;
    $("[data-action='toggle-notifications']").setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("change", (eventTarget) => {
  const input = eventTarget.target;
  if (input.id === "trip-image") {
    const file = input.files?.[0];
    const preview = $("#trip-image-preview");
    if (!file || !preview) return;
    const url = URL.createObjectURL(file);
    const image = document.createElement("img");
    image.alt = "";
    image.onload = image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
    preview.replaceChildren(image);
    preview.hidden = false;
  }
  if (input.id === "profile-avatar-file") {
    const file = input.files?.[0];
    const form = $("#profile-edit-form");
    const uploadLabel = document.querySelector('label[for="profile-avatar-file"]');
    if (!file || !form || !auth.user) return;
    input.disabled = true;
    uploadLabel.textContent = t("uploadingImage");
    uploadLabel.classList.add("is-uploading");
    uploadImage(file, "profile").then(async (path) => {
      await auth.updateAvatar(path);
      await api("/api/me/avatar", { method: "POST", data: { avatarPath: path } });
      if (state.profile?.id === auth.user.id) state.profile = { ...state.profile, avatarPath: path };
      renderAccount();
      const avatar = form.querySelector(".profile-photo-edit .profile-avatar");
      if (avatar) avatar.innerHTML = avatarContents(state.profile?.displayName, path);
      const overviewAvatar = $("#profile-content .profile-avatar-large");
      if (overviewAvatar) overviewAvatar.innerHTML = avatarContents(state.profile?.displayName, path);
      toast(t("profilePhotoSaved"));
    }).catch((error) => setError(form, error.message || t("imageUploadError")))
      .finally(() => {
        input.disabled = false;
        input.value = "";
        uploadLabel.textContent = t("changeProfilePhoto");
        uploadLabel.classList.remove("is-uploading");
      });
  }
  if (input.matches('input[name="travelStyle"]') && input.checked) {
    const form = input.closest("form");
    if (form?.querySelectorAll('input[name="travelStyle"]:checked').length > 3) {
      input.checked = false;
      if (form.id === "signup-form") signupError(t("signupStyleLimit"));
      else setError(form, t("signupStyleLimit"));
    } else if (form?.id === "signup-form") signupError();
  }
});

document.addEventListener("error", (eventTarget) => {
  const image = eventTarget.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.mediaPath) return;
  const publicUrl = storagePublicUrl(image.dataset.mediaPath);
  if (!image.dataset.fallbackTried && publicUrl && image.src !== publicUrl) {
    image.dataset.fallbackTried = "true";
    image.src = publicUrl;
    return;
  }
  image.remove(); // Keep the avatar initials or route art visible if both sources fail.
}, true);

document.addEventListener("submit", async (eventTarget) => {
  const form = eventTarget.target;
  if (form.id === "profile-edit-form") {
    eventTarget.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      const travelStyles = [...form.querySelectorAll('input[name="travelStyle"]:checked')].map((input) => input.value);
      if (travelStyles.length > 3) throw new Error(t("signupStyleLimit"));
      await auth.updateProfile({ displayName: values.displayName.trim(), homeBase: values.homeBase.trim(), travelStyles, bio: values.bio.trim() });
      renderAccount();
      state.profileEditing = false;
      await openProfile(auth.user.id, false);
      toast(t("profileSaved"));
    } catch (error) { setError(form, error.message || t("profileSaveError")); }
    finally { if (submit.isConnected) submit.disabled = false; }
    return;
  }
  if (form.id === "signup-form") {
    eventTarget.preventDefault();
    if (!validateSignupAccount()) return;
    const travelStyles = [...form.querySelectorAll('input[name="travelStyle"]:checked')].map((input) => input.value);
    if (!travelStyles.length) { signupError(t("signupChooseStyle")); return; }
    if (travelStyles.length > 3) { signupError(t("signupStyleLimit")); return; }
    const submit = form.querySelector('[data-signup-step="2"] button[type="submit"]');
    submit.disabled = true;
    const values = Object.fromEntries(new FormData(form));
    try {
      const signedIn = await auth.signUp({ email: values.email.trim(), password: values.password, displayName: values.displayName.trim(), homeBase: values.homeBase.trim(), travelStyles, bio: values.bio.trim() });
      if (signedIn) { await authSuccess(); setPageView("feed"); toast(t("profileSaved")); }
      else {
        form.querySelectorAll(".signup-step").forEach((step) => { step.hidden = true; });
        form.querySelector(".signup-progress").hidden = true;
        $("#signup-confirmation").hidden = false;
      }
    } catch (error) { signupError(error.message || t("failed")); }
    finally { submit.disabled = false; }
    return;
  }
  if (form.id === "auth-form") {
    eventTarget.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    const originalLabel = submit.innerHTML;
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    if (form.dataset.mode === "signin") submit.innerHTML = `<span class="button-spinner" aria-hidden="true"></span><span role="status">${esc(t("signingIn"))}</span>`;
    const values = Object.fromEntries(new FormData(form));
    try {
      if (form.dataset.mode === "signin") {
        await auth.signIn(values);
        await authSuccess();
      } else if (form.dataset.mode === "recover") {
        await auth.recover(values.email);
        form.insertAdjacentHTML("beforeend", `<p class="auth-status">${esc(t("resetSent"))}</p>`);
      } else if (form.dataset.mode === "reset") {
        await auth.updatePassword(values.password);
        toast(t("passwordUpdated"));
        await authSuccess();
      }
    } catch (error) { setError(form, error.message || t("failed")); }
    finally { submit.disabled = false; submit.innerHTML = originalLabel; form.removeAttribute("aria-busy"); }
    return;
  }
  if (!["create-form", "join-form", "update-form", "report-form"].includes(form.id)) return;
  eventTarget.preventDefault();
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  const values = Object.fromEntries(new FormData(form));
  try {
    if (form.id === "create-form") {
      const image = form.querySelector("#trip-image")?.files?.[0];
      if (image) values.mediaPath = await uploadImage(image, "trips");
      const { trip, ownerToken } = await api("/api/trips", { method: "POST", data: values });
      if (ownerToken) { state.hostKeys[trip.id] = ownerToken; saveLocal("qipi:host-keys", state.hostKeys); }
      localStorage.setItem("qipi:nickname", values.hostName);
      toast(t("saveSuccess")); await refreshMe(); await loadTrips(); await openTrip(trip.id);
    }
    if (form.id === "join-form") {
      const id = form.dataset.tripId;
      const { request, requestToken } = await api(`/api/trips/${encodeURIComponent(id)}/requests`, { method: "POST", data: values });
      if (requestToken) { state.requestKeys[id] = { id: request.id, token: requestToken }; saveLocal("qipi:request-keys", state.requestKeys); }
      localStorage.setItem("qipi:nickname", values.travelerName);
      toast(t("requestSuccess")); await refreshMe(); renderTrips(); await openTrip(id);
    }
    if (form.id === "update-form") {
      await api(`/api/routes/${encodeURIComponent(form.dataset.routeId)}/updates`, { method: "POST", data: values });
      localStorage.setItem("qipi:nickname", values.nickname);
      closeDialogs(); toast(t("updateSuccess"));
    }
    if (form.id === "report-form") {
      await api("/api/reports", { method: "POST", data: { ...values, targetType: form.dataset.targetType, targetId: form.dataset.targetId } });
      closeDialogs(); toast(t("reportSuccess"));
    }
  } catch (error) { setError(form, error.message || t("failed")); }
  finally { submit.disabled = false; }
});

enhanceSelects();
$("#trip-route-filter").addEventListener("change", (eventTarget) => { state.filter = eventTarget.target.value; renderTrips(); });
bindSearchEvents();
$("#search-upcoming-only").addEventListener("change", (eventTarget) => { state.searchFilters.upcoming = eventTarget.target.checked; syncSearchFilterControls(); renderTrips(); });
$("#search-route-filter").addEventListener("change", (eventTarget) => { state.searchFilters.routeId = eventTarget.target.value; syncSearchFilterControls(); renderTrips(); });
$("#search-transport-filter").addEventListener("change", (eventTarget) => { state.searchFilters.transport = eventTarget.target.value; syncSearchFilterControls(); renderTrips(); });
$("#settings-language").addEventListener("change", (eventTarget) => {
  state.lang = ["en", "km", "zh"].includes(eventTarget.target.value) ? eventTarget.target.value : "en";
  localStorage.setItem("qipi:language", state.lang);
  applyLanguage();
});
$("#settings-theme").addEventListener("change", (eventTarget) => {
  state.theme = window.qipiTheme.setPreference(eventTarget.target.value);
});
$("#settings-transport").addEventListener("change", (eventTarget) => {
  state.preferences.defaultTransport = ["motorbike", "car", "mixed"].includes(eventTarget.target.value) ? eventTarget.target.value : "motorbike";
  saveLocal("qipi:preferences", state.preferences);
});
$("#settings-cost-style").addEventListener("change", (eventTarget) => {
  state.preferences.defaultCostStyle = ["own", "shared", "free"].includes(eventTarget.target.value) ? eventTarget.target.value : "own";
  saveLocal("qipi:preferences", state.preferences);
});
$("#settings-safety-reminders").addEventListener("change", (eventTarget) => {
  state.preferences.safetyReminders = eventTarget.target.checked;
  saveLocal("qipi:preferences", state.preferences);
});
document.querySelectorAll("a[data-page-view]").forEach((anchor) => anchor.addEventListener("click", (eventTarget) => {
  if (eventTarget.button !== 0 || eventTarget.metaKey || eventTarget.ctrlKey || eventTarget.shiftKey || eventTarget.altKey) return;
  eventTarget.preventDefault();
  navigateToView(anchor.dataset.pageView);
}));
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (eventTarget) => {
    if (eventTarget.target === dialog) {
      if (dialog.id === "search-dialog") closeMobileSearch();
      else { dialog.close(); setLink(); }
    }
  });
});

// Load the app state before routing to the requested screen.
async function initialize() {
  const currentPath = location.pathname.replace(/\/+$/, "") || "/";
  const signupRoute = currentPath === "/signup" || location.hash === "#signup";
  const startupQuery = new URLSearchParams(location.search);
  const startupProfileId = profileIdFromLocation();
  const postPath = currentPath.match(/^\/post\/([^/]+)$/);
  state.startupDeepLink = {
    routeId: startupQuery.get("route") || "",
    tripId: startupQuery.get("trip") || (postPath ? decodeURIComponent(postPath[1]) : "")
  };
  const hasStartupProfile = Boolean(startupProfileId && !signupRoute && !auth.recovery);
  state.profileId = hasStartupProfile ? startupProfileId : "";
  state.profileUsername = hasStartupProfile ? usernameFromPath() || startupProfileId : "";
  entryReturnView = hasStartupProfile ? "profile" : viewFromLocation(Boolean(startupProfileId));
  if (entryReturnView === "search-results") {
    state.search = (startupQuery.get("q") || "").trim().toLocaleLowerCase();
    if ($("#feed-search")) $("#feed-search").value = startupQuery.get("q") || "";
  }
  const legacyHash = ["#feed", "#routes", "#trips", "#saved", "#settings", "#search", "#entry", "#signup", "#profile"].includes(location.hash);
  if (currentPath === "/index.html" || (currentPath === "/" && legacyHash)) {
    history.replaceState(history.state, "", pageUrl(entryReturnView));
  }
  const showEntryImmediately = !signupRoute && !auth.session && !auth.recovery && !entryChoice();
  if (showEntryImmediately) {
    document.documentElement.dataset.entryPending = "true";
  }
  if (!showEntryImmediately && !signupRoute) {
    if (hasStartupProfile) {
      state.profileId = startupProfileId;
      setPageView("profile", { preserveUrl: true });
      renderProfileLoading();
    } else {
      setPageView(entryReturnView, { preserveUrl: true });
      if (entryReturnView === "feed") renderFeedLoading();
      else if (entryReturnView === "explore") renderRoutesLoading();
      else if (["trips", "search-results"].includes(entryReturnView)) renderTripListLoading("#trip-list", 2);
      else if (entryReturnView === "saved") renderTripListLoading("#trip-list", 2);
    }
  }
  try {
    await auth.initialize();
    if (auth.user) await refreshMe();
  } catch (error) { toast(error.message || t("failed")); }
  renderAccount();
  if (state.view === "settings" || (signupRoute && auth.user)) renderSettings();
  if (auth.user) {
    saveEntryChoice("account");
    document.documentElement.removeAttribute("data-entry-pending");
  } else if (!signupRoute && !auth.recovery && !entryChoice()) {
    setPageView("entry", { preserveUrl: true });
  } else {
    document.documentElement.removeAttribute("data-entry-pending");
  }
  if (signupRoute && !auth.user) openSignupPage();
  else {
    document.documentElement.removeAttribute("data-signup-pending");
    if (signupRoute && auth.user) setPageView("settings");
  }
  if (state.view !== "entry" && !signupRoute) {
    if (hasStartupProfile) {
      // openStartupDeepLink below fetches the linked profile after auth initializes.
    } else if (entryReturnView === "saved") await openSavedTrips();
    else if (["feed", "explore", "trips", "search-results"].includes(entryReturnView)) {
      await loadFeedData();
      if (entryReturnView === "explore" && $("#trip-list [data-action='retry-feed']")) renderLoadingError("#route-grid", "retry-explore");
    }
  }
  if (state.view !== "entry") await openStartupDeepLink();
  if (auth.recovery) openAuth("reset");
}
initialize();
