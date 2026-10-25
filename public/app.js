import { QipiAuth } from "./auth.js?v=profile-loading-20261025";
import { copy } from "./i18n.js?v=profile-loading-20261025";

const icon = (name, className = "heroicon") => `<svg class="${className}" aria-hidden="true"><use href="/icons.svg#${name}"></use></svg>`;

function getLikeActorId() {
  let id = localStorage.getItem("qipi:like-actor");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("qipi:like-actor", id);
  }
  return id;
}

// Application state and shared helpers.
const auth = new QipiAuth();
const state = {
  lang: ["en", "km", "zh"].includes(localStorage.getItem("qipi:language")) ? localStorage.getItem("qipi:language") : "en",
  routes: [], trips: [], savedTripRecords: [], filter: "", search: "", me: null, view: "feed",
  likeActorId: getLikeActorId(), profile: null, profileId: "", profileReturnView: "feed",
  profileRequestId: 0, routeRequestId: 0, tripRequestId: 0,
  feedRequestActive: false,
  savedTrips: Array.isArray(readLocal("qipi:saved-trips")) ? readLocal("qipi:saved-trips") : [],
  theme: window.qipiTheme?.getPreference() || "system",
  preferences: { defaultTransport: "motorbike", defaultCostStyle: "own", safetyReminders: true, ...readLocal("qipi:preferences") },
  hostKeys: readLocal("qipi:host-keys"), requestKeys: readLocal("qipi:request-keys"),
  recentSearches: Array.isArray(readLocal("qipi:recent-searches")) ? readLocal("qipi:recent-searches") : [], searchEditing: false,
  searchFilters: { upcoming: false, routeId: "", transport: "" }
};
const $ = (selector) => document.querySelector(selector);
const t = (key) => copy[state.lang][key] || copy.en[key] || key;
const label = (value) => value?.[state.lang] || value?.en || "";
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const initials = (value) => {
  const parts = String(value || "Q").match(/[\p{L}\p{N}]+/gu) || [];
  return parts.slice(0, 2).map((part) => Array.from(part)[0] || "").join("").toUpperCase() || "Q";
};
const displayName = () => auth.user?.user_metadata?.display_name?.trim() || auth.user?.email?.split("@")[0] || "";
const dateToday = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Phnom_Penh", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const part = (name) => parts.find((item) => item.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};
let toastTimeout;

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}
function saveLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
const ENTRY_CHOICE_KEY = "qipi:entry-choice";
function entryChoice() { try { return sessionStorage.getItem(ENTRY_CHOICE_KEY); } catch { return "guest"; } }
function saveEntryChoice(value) { try { sessionStorage.setItem(ENTRY_CHOICE_KEY, value); } catch {} }
let entryReturnView = "feed";
function viewFromHash(hash) {
  return ({ "#routes": "explore", "#trips": "trips", "#saved": "saved" })[hash] || "feed";
}
async function restoreEntryReturnView() {
  if (entryReturnView === "saved") await openSavedTrips();
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
async function api(path, { method = "GET", data, headers = {} } = {}) {
  const accessToken = await auth.accessToken();
  const response = await fetch(path, {
    method,
    headers: { "x-qipi-actor": state.likeActorId, ...(data ? { "content-type": "application/json" } : {}), ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...headers },
    body: data ? JSON.stringify(data) : undefined
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || t("failed"));
  return result;
}
function event(type, targetId) { api("/api/events", { method: "POST", data: { type, targetId } }).catch(() => {}); }
function setError(form, message) {
  const box = form.querySelector(".error-message");
  if (box) { box.textContent = message; box.classList.add("show"); }
}
function closeDialogs() {
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
}
// Accessible custom select controls.
let openSelectControl = null;
let selectTypeahead = "";
let selectTypeaheadTimer;

function syncEnhancedSelect(select) {
  const shell = select?.closest(".select-control");
  const trigger = shell?.querySelector(".select-trigger");
  if (!trigger) return;
  const option = select.options[select.selectedIndex];
  trigger.querySelector(".select-current").textContent = option?.textContent?.trim() || "—";
  trigger.setAttribute("aria-valuetext", option?.textContent?.trim() || "");
  trigger.disabled = select.disabled;
}

function closeEnhancedSelect(returnFocus = false) {
  if (!openSelectControl) return;
  const { trigger, menu } = openSelectControl;
  trigger.setAttribute("aria-expanded", "false");
  trigger.removeAttribute("aria-activedescendant");
  trigger.removeAttribute("aria-controls");
  menu.remove();
  openSelectControl = null;
  if (returnFocus) trigger.focus();
}

function focusSelectOption(index) {
  if (!openSelectControl) return;
  const options = [...openSelectControl.menu.querySelectorAll("[role='option']")];
  if (!options.length) return;
  const next = (index + options.length) % options.length;
  options[next].focus();
  openSelectControl.trigger.setAttribute("aria-activedescendant", options[next].id);
}

function chooseEnhancedOption(index) {
  if (!openSelectControl) return;
  const { select, trigger } = openSelectControl;
  const option = select.options[index];
  if (!option || option.disabled) return;
  select.value = option.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  syncEnhancedSelect(select);
  closeEnhancedSelect(true);
}

function openEnhancedSelect(select) {
  if (openSelectControl?.select === select) { closeEnhancedSelect(); return; }
  closeEnhancedSelect();
  const shell = select.closest(".select-control");
  const trigger = shell?.querySelector(".select-trigger");
  if (!trigger || select.disabled) return;
  const menu = document.createElement("div");
  menu.className = "select-options";
  menu.id = `${trigger.id}-options`;
  menu.setAttribute("role", "listbox");
  if (trigger.getAttribute("aria-labelledby")) menu.setAttribute("aria-labelledby", trigger.getAttribute("aria-labelledby"));
  else menu.setAttribute("aria-label", trigger.getAttribute("aria-label") || "Options");
  menu.innerHTML = [...select.options].map((option, index) => `<button type="button" role="option" id="${menu.id}-option-${index}" class="select-option" data-option-index="${index}" aria-selected="${index === select.selectedIndex}" ${option.disabled ? "disabled" : ""}>${esc(option.textContent.trim())}${index === select.selectedIndex ? icon("check", "heroicon select-option-check") : ""}</button>`).join("");
  const host = select.closest("dialog") || document.body;
  host.append(menu);
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(Math.max(rect.width, 190), window.innerWidth - 24);
  const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
  const desiredHeight = Math.min(280, menu.scrollHeight);
  const below = Math.max(0, window.innerHeight - rect.bottom - 12);
  const above = Math.max(0, rect.top - 12);
  const opensBelow = below >= desiredHeight || below >= above;
  const available = opensBelow ? below : above;
  const maxHeight = Math.min(280, Math.max(72, available));
  const visibleHeight = Math.min(desiredHeight, maxHeight);
  const rawTop = opensBelow ? rect.bottom + 6 : rect.top - visibleHeight - 6;
  const top = Math.max(8, Math.min(rawTop, window.innerHeight - visibleHeight - 8));
  Object.assign(menu.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, maxHeight: `${maxHeight}px` });
  trigger.setAttribute("aria-expanded", "true");
  trigger.setAttribute("aria-controls", menu.id);
  openSelectControl = { select, trigger, menu };
  menu.addEventListener("click", (eventTarget) => {
    const option = eventTarget.target.closest("[data-option-index]");
    if (option) chooseEnhancedOption(Number(option.dataset.optionIndex));
  });
  menu.addEventListener("keydown", (eventTarget) => {
    const current = Number(eventTarget.target.closest("[data-option-index]")?.dataset.optionIndex || 0);
    if (eventTarget.key === "ArrowDown") { eventTarget.preventDefault(); focusSelectOption(current + 1); }
    else if (eventTarget.key === "ArrowUp") { eventTarget.preventDefault(); focusSelectOption(current - 1); }
    else if (eventTarget.key === "Home") { eventTarget.preventDefault(); focusSelectOption(0); }
    else if (eventTarget.key === "End") { eventTarget.preventDefault(); focusSelectOption(select.options.length - 1); }
    else if (eventTarget.key === "Enter" || eventTarget.key === " ") { eventTarget.preventDefault(); chooseEnhancedOption(current); }
    else if (eventTarget.key === "Escape") { eventTarget.preventDefault(); closeEnhancedSelect(true); }
    else if (eventTarget.key === "Tab") closeEnhancedSelect();
    else if (eventTarget.key.length === 1 && !eventTarget.ctrlKey && !eventTarget.metaKey) {
      selectTypeahead += eventTarget.key.toLocaleLowerCase();
      clearTimeout(selectTypeaheadTimer);
      selectTypeaheadTimer = setTimeout(() => { selectTypeahead = ""; }, 650);
      const match = [...select.options].findIndex((option) => option.textContent.trim().toLocaleLowerCase().startsWith(selectTypeahead));
      if (match >= 0) { eventTarget.preventDefault(); focusSelectOption(match); }
    }
  });
  menu.querySelector(`[data-option-index="${Math.max(select.selectedIndex, 0)}"]`)?.focus();
}

function enhanceSelects(root = document) {
  const selects = [...(root.matches?.("select") ? [root] : []), ...root.querySelectorAll("select")];
  for (const select of selects) {
    if (select.classList.contains("select-native")) continue;
    const shell = document.createElement("div");
    shell.className = "select-control";
    select.before(shell);
    shell.append(select);
    select.classList.add("select-native");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "select-trigger";
    trigger.id = `${select.id || "qipi-select"}-trigger`;
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const labelledBy = select.getAttribute("aria-labelledby");
    const labels = [...(select.labels || [])];
    if (!labelledBy && labels.length) {
      const ids = labels.map((label) => { if (!label.id) label.id = `${select.id}-label`; label.htmlFor = trigger.id; return label.id; });
      trigger.setAttribute("aria-labelledby", ids.join(" "));
    } else if (labelledBy) trigger.setAttribute("aria-labelledby", labelledBy);
    else trigger.setAttribute("aria-label", select.getAttribute("aria-label") || "Choose an option");
    trigger.innerHTML = `<span class="select-current"></span>${icon("chevron-down", "heroicon select-chevron")}`;
    shell.append(trigger);
    trigger.addEventListener("click", () => openEnhancedSelect(select));
    trigger.addEventListener("keydown", (eventTarget) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(eventTarget.key)) { eventTarget.preventDefault(); openEnhancedSelect(select); }
    });
    select.addEventListener("change", () => syncEnhancedSelect(select));
    syncEnhancedSelect(select);
  }
}

function syncEnhancedSelects(root = document) {
  const selects = [...(root.matches?.("select") ? [root] : []), ...root.querySelectorAll("select")];
  selects.forEach(syncEnhancedSelect);
}

document.addEventListener("pointerdown", (eventTarget) => {
  if (openSelectControl && !openSelectControl.menu.contains(eventTarget.target) && !openSelectControl.trigger.contains(eventTarget.target)) closeEnhancedSelect();
});
window.addEventListener("resize", () => closeEnhancedSelect());
window.addEventListener("scroll", () => closeEnhancedSelect(), true);

function showDialog(id, html) {
  closeDialogs();
  const dialog = document.getElementById(id);
  dialog.querySelector("[id$='-content']").innerHTML = html;
  enhanceSelects(dialog);
  dialog.showModal();
}
function showDialogLoading(id, titleId) {
  showDialog(id, `<h2 class="visually-hidden" id="${esc(titleId)}">${esc(t("loading"))}</h2><div class="skeleton-dialog" aria-hidden="true"><span class="skeleton-dialog-line wide"></span><span class="skeleton-dialog-line"></span><span class="skeleton-dialog-block"></span><span class="skeleton-dialog-line wide"></span><span class="skeleton-dialog-line short"></span></div>`);
}
function renderDialogError(id, action, targetId = "") {
  const content = $(`#${id} [id$='-content']`);
  if (!content) return;
  content.innerHTML = `<div class="feed-load-error" role="alert"><p>${esc(t("feedLoadError"))}</p><button class="button button-ghost" type="button" data-action="${esc(action)}" ${targetId ? `data-id="${esc(targetId)}"` : ""}>${esc(t("retry"))}</button></div>`;
}
function setLink(param, id) {
  const url = new URL(location.href);
  url.search = "";
  if (param && id) url.searchParams.set(param, id);
  history.replaceState({}, "", url);
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
  $("#account-label").textContent = name || t("signIn");
  const avatarPath = auth.user?.user_metadata?.avatar_path || "";
  $("#account-avatar").innerHTML = name ? avatarContents(name, avatarPath) : icon("user");
  $("#rail-avatar").innerHTML = avatarContents(name || "Q", avatarPath);
  $("#composer-avatar").innerHTML = avatarContents(name || "Q", avatarPath);
  $("#rail-user-name").textContent = name || t("guestTraveler");
}

const IMAGE_BUCKET = "qipi-images";
const IMAGE_TYPES = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
function storagePublicUrl(path) {
  if (!path || !auth.url) return "";
  const encodedPath = path.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${auth.url}/storage/v1/object/public/${IMAGE_BUCKET}/${encodedPath}`;
}
function avatarContents(name, path = "") {
  const url = storagePublicUrl(path);
  return url ? `<img class="avatar-image" src="${esc(url)}" alt="" loading="lazy" decoding="async" />` : esc(initials(name));
}
async function uploadImage(file, area) {
  if (!auth.user) throw new Error(t("imageSignInRequired"));
  const extension = IMAGE_TYPES.get(file?.type);
  if (!extension) throw new Error(t("imageTypeError"));
  if (file.size > MAX_IMAGE_BYTES) throw new Error(t("imageSizeError"));
  const accessToken = await auth.accessToken();
  if (!accessToken) throw new Error(t("imageSignInRequired"));
  const path = `users/${auth.user.id}/${area}/${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${auth.url}/storage/v1/object/${IMAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: {
      apikey: auth.key,
      authorization: `Bearer ${accessToken}`,
      "content-type": file.type,
      "cache-control": "31536000",
      "x-upsert": "false"
    },
    body: file
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || result.error || t("imageUploadError"));
  }
  return path;
}

function setSearch(value) {
  const query = value.trim();
  state.search = query.toLocaleLowerCase();
  if ($("#feed-search")) $("#feed-search").value = query;
  if ($("#mobile-feed-search")) $("#mobile-feed-search").value = query;
  if ($(".search-clear")) $(".search-clear").hidden = !query;
  renderRoutes(); renderTrips();
}

function submitSearch(value) {
  setSearch(value);
  saveRecentSearch(value);
  state.filter = "";
  state.searchFilters = { upcoming: false, routeId: "", transport: "" };
  syncSearchFilterControls();
  closeDesktopSearch();
  closeMobileSearch({ save: false });
  setPageView("search-results");
  renderTripListLoading("#trip-list", 2);
  loadSearchResults();
}

async function loadSearchResults() {
  try {
    const { trips } = await api("/api/trips");
    state.trips = trips;
    renderTrips();
  } catch (error) {
    renderLoadingError("#trip-list", "retry-search");
    toast(error.message || t("failed"));
  }
}

function saveRecentSearch(value) {
  const query = value.trim();
  if (!query) return;
  state.recentSearches = [query, ...state.recentSearches.filter((item) => item.toLocaleLowerCase() !== query.toLocaleLowerCase())].slice(0, 8);
  saveLocal("qipi:recent-searches", state.recentSearches);
  renderSearchRecents();
}

function renderSearchRecents() {
  document.querySelectorAll("[data-action='toggle-search-edit']").forEach((button) => { button.textContent = state.searchEditing ? t("doneEditingSearches") : t("editSearches"); });
  const rowMarkup = (query) => `<li class="search-recent-row"><button type="button" class="search-recent-select" data-action="select-recent-search" data-query="${esc(query)}"><span class="search-recent-icon">${icon("clock")}</span><span class="search-recent-text">${esc(query)}</span></button><button type="button" class="search-recent-remove" data-action="remove-recent-search" data-query="${esc(query)}" aria-label="${esc(t("removeRecentSearch"))}: ${esc(query)}"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#close"></use></svg></button></li>`;
  const desktopQuery = $("#feed-search")?.value.trim().toLocaleLowerCase() || "";
  const mobileQuery = $("#mobile-feed-search")?.value.trim().toLocaleLowerCase() || "";
  for (const [id, query] of [["search-recents-list", mobileQuery], ["desktop-search-recents", desktopQuery]]) {
    const list = $(`#${id}`);
    if (!list) continue;
    list.classList.toggle("is-editing", state.searchEditing);
    const recent = state.recentSearches.filter((item) => !query || item.toLocaleLowerCase().includes(query));
    list.innerHTML = recent.length ? `<ul class="search-recent-list">${recent.map(rowMarkup).join("")}</ul>` : `<p class="search-recents-empty">${esc(query ? t("searchRecentNoMatch") : t("searchRecentEmpty"))}</p>`;
  }
}

function openDesktopSearch() {
  const panel = $("#desktop-search-panel");
  if (!panel || window.matchMedia("(max-width: 700px)").matches) return;
  const wasHidden = panel.hidden;
  panel.hidden = false;
  if (wasHidden) { state.searchEditing = false; renderSearchRecents(); }
}

function closeDesktopSearch() {
  const panel = $("#desktop-search-panel");
  if (panel) panel.hidden = true;
}

function openMobileSearch() {
  const dialog = $("#search-dialog");
  if (!dialog?.open) dialog?.showModal();
  state.searchEditing = false;
  renderSearchRecents();
  requestAnimationFrame(() => $("#mobile-feed-search")?.focus());
}

function closeMobileSearch({ save = true } = {}) {
  if (save) saveRecentSearch($("#mobile-feed-search")?.value || "");
  $("#search-dialog")?.close();
}

function renderSettings() {
  const content = $("#settings-account-content");
  if (!content) return;
  content.setAttribute("aria-busy", "false");
  const name = displayName();
  const metadata = auth.user?.user_metadata || {};
  const travelStyles = Array.isArray(metadata.travel_styles) ? metadata.travel_styles : [];
  const travelOptions = [["solo", "travelSolo"], ["backpacking", "travelBackpacking"], ["adventure", "travelAdventure"], ["motor-trips", "travelMotorTrips"], ["road-trips", "travelRoadTrips"], ["group-trips", "travelGroupTrips"]];
  content.innerHTML = auth.user
    ? `<div class="settings-profile"><span class="profile-avatar" id="settings-profile-avatar">${avatarContents(name, metadata.avatar_path || "")}</span><div><strong>${esc(name)}</strong><small>${esc(auth.user.email || "")}</small><label class="photo-upload-button" for="settings-avatar-file">${esc(t("changeProfilePhoto"))}</label><input id="settings-avatar-file" class="visually-hidden-file" type="file" accept="image/jpeg,image/png,image/webp" /></div></div>
      <form id="settings-profile-form"><div class="field"><label for="settings-profile-name">${esc(t("profileName"))}</label><input id="settings-profile-name" name="displayName" value="${esc(name)}" minlength="2" maxlength="40" required /></div><div class="field"><label for="settings-home-base">${esc(t("signupHomeBase"))}</label><input id="settings-home-base" name="homeBase" value="${esc(metadata.home_base || "")}" maxlength="80" /></div><fieldset class="signup-interests"><legend>${esc(t("signupInterests"))}</legend><p>${esc(t("signupInterestsHint"))}</p><div class="signup-interest-grid">${travelOptions.map(([value, key]) => `<label><input type="checkbox" name="travelStyle" value="${value}" ${travelStyles.includes(value) ? "checked" : ""} /><span>${esc(t(key))}</span></label>`).join("")}</div></fieldset><div class="field"><label for="settings-bio">${esc(t("signupBio"))}</label><textarea id="settings-bio" name="bio" rows="3" maxlength="160">${esc(metadata.bio || "")}</textarea></div><div class="error-message" role="alert"></div><button class="button button-primary" type="submit">${esc(t("saveProfile"))}</button><button class="settings-signout" type="button" data-action="sign-out">${esc(t("signOut"))}</button></form>`
    : `<p class="settings-guest-copy">${esc(t("guestProfileText"))}</p><button class="button button-primary" type="button" data-action="settings-sign-in">${esc(t("signIn"))}</button>`;
  $("#settings-language").value = state.lang;
  $("#settings-theme").value = state.theme;
  $("#settings-transport").value = state.preferences.defaultTransport;
  $("#settings-cost-style").value = state.preferences.defaultCostStyle;
  $("#settings-safety-reminders").checked = state.preferences.safetyReminders;
  syncEnhancedSelects();
}

function setPageView(view) {
  state.view = view;
  const main = $("#main");
  const settings = $("#settings-view");
  const isEntry = view === "entry";
  const isSettings = view === "settings";
  const isExplore = view === "explore";
  const isSearchResults = view === "search-results";
  const isSaved = view === "saved";
  const isSignup = view === "signup";
  const isProfile = view === "profile";
  main.classList.toggle("entry-open", isEntry);
  main.classList.toggle("settings-open", isSettings || isSaved);
  main.classList.toggle("signup-open", isSignup);
  main.classList.toggle("explore-open", isExplore);
  main.classList.toggle("search-results-open", isSearchResults);
  main.classList.toggle("profile-open", isProfile);
  $("#search-filter-panel").hidden = !isSearchResults;
  $("#saved-view").hidden = !isSaved;
  document.querySelectorAll('.rail-nav a[href="#feed"], .mobile-nav a[href="#feed"]').forEach((item) => item.classList.toggle("active", view === "feed"));
  document.querySelectorAll('.rail-nav a[href="#routes"], .mobile-nav a[href="#routes"]').forEach((item) => item.classList.toggle("active", isExplore));
  document.querySelectorAll('.rail-nav a[href="#trips"], .mobile-nav a[href="#trips"]').forEach((item) => item.classList.toggle("active", view === "trips"));
  document.querySelectorAll('.rail-nav [data-action="open-settings"], .mobile-nav [data-action="open-settings"]').forEach((item) => item.classList.toggle("active", isSettings));
  document.querySelectorAll('.rail-nav [data-action="saved-trips"], .mobile-nav [data-action="saved-trips"]').forEach((item) => item.classList.toggle("active", isSaved));
  document.querySelectorAll(".feed-column > :not(#entry-view):not(#settings-view):not(#saved-view):not(#profile-view):not(#signup-view)").forEach((section) => {
    section.hidden = isEntry || isSettings || isSaved || isProfile || isSignup || (isExplore && section.id !== "routes") || (isSearchResults && section.id !== "trips");
  });
  $("#entry-view").hidden = !isEntry;
  settings.hidden = !isSettings;
  $("#saved-view").hidden = !isSaved;
  $("#profile-view").hidden = !isProfile;
  $("#signup-view").hidden = !isSignup;
  if (isSettings) renderSettings();
  if (isSaved) renderTrips();
  if (isProfile) renderProfile();
  renderRoutes();
  const targetHash = isEntry ? "#entry" : isSignup ? "#signup" : isSettings ? "#settings" : isSaved ? "#saved" : isProfile ? "#profile" : isExplore ? "#routes" : isSearchResults ? "#search" : view === "trips" ? "#trips" : "#feed";
  if (isEntry) document.documentElement.removeAttribute("data-entry-pending");
  if (location.hash !== targetHash) history.replaceState(history.state, "", `${location.pathname}${location.search}${targetHash}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setSettingsView(open) { setPageView(open ? "settings" : "feed"); }

function renderSettingsAccountLoading() {
  const content = $("#settings-account-content");
  if (!content) return;
  content.setAttribute("aria-busy", "true");
  content.innerHTML = `<div class="skeleton-settings" aria-hidden="true"><i></i><span><b></b><b></b></span></div><div class="skeleton-field"></div>`;
}

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
  try { state.me = await api("/api/me"); }
  catch { state.me = null; }
}

// Feed, search and page rendering.
function renderRoutes() {
  const routeGrid = $("#route-grid");
  const visible = state.routes.filter((route) => !state.search || `${label(route.title)} ${label(route.summary)}`.toLowerCase().includes(state.search));
  const inExplore = state.view === "explore";
  const routeSection = $("#routes");
  routeSection.classList.toggle("explore-mode", inExplore);
  $("#routes-title").textContent = inExplore ? t("exploreRoutes") : t("explore");
  $("#routes .text-link").hidden = inExplore;
  $("#routes .explore-description").hidden = !inExplore;
  routeGrid.setAttribute("aria-busy", "false");
  routeGrid.innerHTML = visible.length ? visible.map((route, index) => inExplore ? `
    <button type="button" class="explore-route-card ${esc(route.accent)}" data-action="open-route" data-id="${esc(route.id)}" aria-label="${esc(t("viewRoute"))}: ${esc(label(route.title))}">
      <span class="explore-route-art"><span class="explore-route-index">0${index + 1}</span><span class="explore-route-mark">${icon("map-pin")}</span><span class="explore-route-kind">${esc(label(route.label))}</span></span>
      <span class="explore-route-copy"><strong>${esc(label(route.title))}</strong><span>${esc(label(route.summary))}</span><small>${icon("clock")} ${esc(label(route.duration))} <span>·</span> ${icon("truck")} ${esc(label(route.mode))}</small><b>${esc(t("viewRoute"))} ${icon("arrow-right")}</b></span>
    </button>` : `
    <button type="button" class="route-story ${esc(route.accent)}" data-action="open-route" data-id="${esc(route.id)}" aria-label="${esc(t("viewRoute"))}: ${esc(label(route.title))}">
      <span class="story-avatar"><span class="story-art"><span class="story-road"></span><span class="story-count">0${index + 1}</span></span></span>
      <span class="story-name">${esc(label(route.title))}</span>
    </button>`).join("") : `<p class="small-copy">${esc(t("routeFilterEmpty"))}</p>`;
}
function renderFilter() {
  $("#trip-route-filter").innerHTML = `<option value="">${esc(t("allRoutes"))}</option>` + state.routes.map((route) => `<option value="${esc(route.id)}">${esc(label(route.title))}</option>`).join("");
  $("#trip-route-filter").value = state.filter;
  syncEnhancedSelect($("#trip-route-filter"));
  const searchRoute = $("#search-route-filter");
  if (searchRoute) {
    searchRoute.innerHTML = `<option value="">${esc(t("allRoutes"))}</option>` + state.routes.map((route) => `<option value="${esc(route.id)}">${esc(label(route.title))}</option>`).join("");
    searchRoute.value = state.searchFilters.routeId;
    syncEnhancedSelect(searchRoute);
  }
  syncSearchFilterControls();
}
function syncSearchFilterControls() {
  const upcoming = $("#search-upcoming-only"), route = $("#search-route-filter"), transport = $("#search-transport-filter");
  if (upcoming) upcoming.checked = state.searchFilters.upcoming;
  if (route) route.value = state.searchFilters.routeId;
  if (transport) transport.value = state.searchFilters.transport;
  if (route) syncEnhancedSelect(route);
  if (transport) syncEnhancedSelect(transport);
  const allButton = $(".search-filter-all");
  const allActive = !state.searchFilters.upcoming && !state.searchFilters.routeId && !state.searchFilters.transport;
  allButton?.classList.toggle("is-active", allActive);
  allButton?.setAttribute("aria-pressed", String(allActive));
}
function renderTrips() {
  const isSaved = state.view === "saved";
  const tripList = $(isSaved ? "#saved-trip-list" : "#trip-list");
  const sourceTrips = isSaved ? state.savedTripRecords : state.trips;
  const filtered = sourceTrips.filter((trip) => isSaved ? state.savedTrips.includes(trip.id) :
    (state.view === "search-results" || !state.filter || trip.routeId === state.filter) &&
    (!state.search || `${trip.title} ${trip.notes} ${trip.hostName} ${label(routeFor(trip.routeId)?.title)}`.toLowerCase().includes(state.search)) &&
    (state.view !== "search-results" || (!state.searchFilters.routeId || trip.routeId === state.searchFilters.routeId) && (!state.searchFilters.transport || trip.transport === state.searchFilters.transport) && (!state.searchFilters.upcoming || trip.date >= dateToday())));
  tripList.setAttribute("aria-busy", "false");
  if (state.view === "search-results") $("#trips-title").textContent = `${t("searchResults")} · ${filtered.length} ${t("searchResultCount")}`;
  else $("#trips-title").textContent = t("forYou");
  if (!filtered.length) {
    tripList.innerHTML = `<div class="empty-trips"><div class="empty-icon">${icon(isSaved ? "bookmark" : state.view === "search-results" ? "search" : "calendar")}</div><h3>${esc(isSaved ? t("savedEmptyTitle") : state.view === "search-results" ? t("noSearchResults") : state.filter ? t("noTripsFilter") : t("tripBoardEmptyTitle"))}</h3><p>${esc(isSaved ? t("savedEmptyBody") : state.view === "search-results" ? t("searchTryAnother") : t("tripBoardEmptyBody"))}</p>${state.view === "search-results" ? `<button class="button button-ghost" type="button" data-action="reset-search-filters">${esc(t("allTrips"))}</button>` : isSaved ? `<button class="button button-primary" type="button" data-action="back-to-feed">${esc(t("home"))}</button>` : `<button class="button button-primary" type="button" data-action="create-trip">${esc(t("postTrip"))} ${icon("arrow-up-right")}</button>`}</div>`;
    return;
  }
  tripList.innerHTML = filtered.map(tripCardMarkup).join("");
}
async function loadTrips() {
  const result = await api("/api/trips");
  state.trips = result.trips;
  renderTrips();
}

function skeletonPostsMarkup(count = 2) {
  return `<div class="skeleton-posts" aria-hidden="true">${Array.from({ length: count }, () => `<article class="skeleton-post"><span class="skeleton-post-head"><i></i><b></b></span><span class="skeleton-media"></span><span class="skeleton-copy"></span><span class="skeleton-copy short"></span></article>`).join("")}</div>`;
}

function renderTripListLoading(selector = "#trip-list", count = 2) {
  const list = $(selector);
  if (!list) return;
  list.setAttribute("aria-busy", "true");
  list.innerHTML = skeletonPostsMarkup(count);
}

function renderRoutesLoading() {
  const grid = $("#route-grid");
  grid.setAttribute("aria-busy", "true");
  grid.innerHTML = `<div class="skeleton-routes" aria-hidden="true">${Array.from({ length: 3 }, () => `<span class="skeleton-story"><i></i><b></b></span>`).join("")}</div>`;
}

function renderLoadingError(selector, action, id = "") {
  const target = $(selector);
  if (!target) return;
  target.setAttribute("aria-busy", "false");
  target.innerHTML = `<div class="feed-load-error" role="alert"><p>${esc(t("feedLoadError"))}</p><button class="button button-ghost" type="button" data-action="${esc(action)}" ${id ? `data-id="${esc(id)}"` : ""}>${esc(t("retry"))}</button></div>`;
}

async function openFeedPage() {
  setPageView("feed");
  renderFeedLoading();
  await loadFeedData();
}

async function openExplorePage() {
  setPageView("explore");
  renderRoutesLoading();
  try {
    const { routes } = await api("/api/routes");
    state.routes = routes;
    renderFilter();
    renderRoutes();
  } catch (error) {
    renderLoadingError("#route-grid", "retry-explore");
    toast(error.message || t("failed"));
  }
}

async function openTripsPage() {
  setPageView("trips");
  renderTripListLoading("#trip-list", 2);
  try { await loadTrips(); }
  catch (error) { renderLoadingError("#trip-list", "retry-trips"); toast(error.message || t("failed")); }
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

function renderFeedLoading() {
  $("#route-grid").setAttribute("aria-busy", "true");
  $("#trip-list").setAttribute("aria-busy", "true");
  renderRoutesLoading();
  renderTripListLoading("#trip-list", 2);
}

function renderFeedError() {
  $("#route-grid").setAttribute("aria-busy", "false");
  $("#route-grid").replaceChildren();
  $("#trip-list").setAttribute("aria-busy", "false");
  $("#trip-list").innerHTML = `<div class="feed-load-error" role="alert"><p>${esc(t("feedLoadError"))}</p><button class="button button-ghost" type="button" data-action="retry-feed">${esc(t("retry"))}</button></div>`;
}

async function loadFeedData() {
  if (state.feedRequestActive) return;
  state.feedRequestActive = true;
  if ($("#route-grid").getAttribute("aria-busy") !== "true") renderFeedLoading();
  try {
    const [routeResult, tripResult] = await Promise.all([api("/api/routes"), api("/api/trips")]);
    state.routes = routeResult.routes;
    state.trips = tripResult.trips;
    applyLanguage();
  } catch (error) {
    renderFeedError();
    toast(error.message || t("failed"));
  } finally {
    state.feedRequestActive = false;
  }
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
            ? `<span class="status-chip closed">${esc(t("fullTrip"))}</span>`
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

async function openProfile(id, deepLink = true) {
  const requestId = ++state.profileRequestId;
  if (state.view !== "profile") state.profileReturnView = state.view === "entry" ? "feed" : state.view;
  state.profile = null;
  state.profileId = id;
  if (deepLink) setLink("profile", id);
  renderProfileLoading();
  setPageView("profile");
  try {
    const { profile, trips } = await api(`/api/profiles/${encodeURIComponent(id)}`);
    if (requestId !== state.profileRequestId) return;
    state.profile = { ...profile, trips };
    renderProfile();
  } catch (error) {
    if (requestId === state.profileRequestId) {
      renderLoadingError("#profile-content", "retry-profile", id);
      toast(error.message || t("failed"));
    }
  }
}

function tripCardMarkup(trip) {
  const date = dateParts(trip.date);
  const route = routeFor(trip.routeId);
  const saved = state.savedTrips.includes(trip.id);
  const liked = Boolean(trip.likedByViewer);
  const isHost = Boolean(state.hostKeys[trip.id] || state.me?.trips.some((owned) => owned.id === trip.id));
  const request = state.me?.requests.find((item) => item.trip.id === trip.id);
  const isRequested = Boolean(request || state.requestKeys[trip.id]);
  const ctaAction = isHost || isRequested || trip.availableSpots === 0 ? "open-trip" : "join-trip";
  const ctaLabel = isHost ? t("manageRequests") : isRequested
    ? t(request?.status === "approved" ? "requestApproved" : request?.status === "declined" ? "requestDeclined" : "requestPending")
    : trip.availableSpots === 0 ? t("fullTrip") : t("requestJoin");
  const transport = trip.transport === "motorbike" ? t("motorbike") : trip.transport === "car" ? t("car") : t("mixed");
  const author = `<span class="post-avatar">${avatarContents(trip.hostName, trip.hostAvatarPath || "")}</span><span class="post-byline"><strong>${esc(trip.hostName)} ${trip.hostVerified ? `<span class="verified-dot" title="${esc(t("member"))}">${icon("check")}</span>` : ""}</strong><small>${esc(t("guestHost"))} · ${esc(dateLabel(trip.date))}</small></span>`;
  return `<article class="trip-card">
    <div class="post-head">${trip.profileId ? `<button class="post-profile-link" type="button" data-action="open-profile" data-id="${esc(trip.profileId)}">${author}</button>` : `<span class="post-profile-static">${author}</span>`}<button class="post-save ${saved ? "saved" : ""}" type="button" data-action="toggle-save" data-id="${esc(trip.id)}" aria-label="${esc(t(saved ? "unsave" : "save"))}">${icon("bookmark")}</button></div>
    <div class="post-media ${esc(route?.accent || "weekend")} ${trip.mediaPath ? "has-upload" : ""}" aria-hidden="true">${trip.mediaPath ? `<img class="post-media-image" src="${esc(storagePublicUrl(trip.mediaPath))}" alt="" loading="lazy" decoding="async" />` : `<span class="post-media-hill"></span><span class="post-media-road"></span><span class="post-media-title">${esc(label(route?.title))}</span>`}</div>
    <h3 class="post-title">${esc(trip.title)}</h3><p class="post-note">${esc((trip.notes || `${label(routeFor(trip.routeId)?.title)} · ${trip.meetingArea}`).slice(0, 170))}</p>
    <div class="post-journey"><span class="post-date"><strong>${date.day}</strong><small>${date.month}</small></span><span class="post-route"><strong>${esc(label(routeFor(trip.routeId)?.title))}</strong><small>${esc(trip.meetingArea)} · ${esc(trip.departureTime)} · ${esc(transport)}</small></span><span class="post-spots">${trip.availableSpots} ${esc(t("spots"))}</span></div>
    <div class="post-actions"><button class="post-like ${liked ? "liked" : ""}" type="button" data-action="toggle-like" data-id="${esc(trip.id)}" aria-pressed="${liked}" aria-label="${esc(t(liked ? "unlike" : "like"))}">${icon("heart")}<span>${esc(t(liked ? "unlike" : "like"))}</span><span class="like-count">${Number(trip.likesCount) || 0}</span></button><button type="button" data-action="share-trip" data-id="${esc(trip.id)}">${icon("share")} ${esc(t("shareTrip"))}</button><button type="button" data-action="open-trip" data-id="${esc(trip.id)}">${icon("chat")} ${esc(t("discussTrip"))}</button><button type="button" data-action="${ctaAction}" data-id="${esc(trip.id)}">${esc(ctaLabel)} ${icon("arrow-right")}</button></div>
  </article>`;
}

function renderProfileLoading() {
  const content = $("#profile-content");
  if (!content) return;
  content.setAttribute("aria-busy", "true");
  content.innerHTML = `<div class="skeleton-profile" aria-hidden="true"><div class="skeleton-profile-cover"></div><div class="skeleton-profile-card"><i class="skeleton-profile-avatar"></i><div class="skeleton-profile-title"><b></b><span></span></div><div class="skeleton-profile-stats"><i></i><i></i><i></i></div><span class="skeleton-copy"></span><span class="skeleton-copy short"></span></div><div class="skeleton-profile-posts">${skeletonPostsMarkup(2)}</div></div>`;
}

function renderProfile() {
  const content = $("#profile-content");
  if (!content) return;
  if (!state.profile) return;
  const { profile, trips } = { profile: state.profile, trips: state.profile.trips || [] };
  const routeCount = Number(profile.routeCount) || new Set(trips.map((trip) => trip.routeId)).size;
  const location = [profile.homeBase, ...(profile.languages || [])].filter(Boolean).join(" · ");
  const styles = profile.interests || [];
  content.setAttribute("aria-busy", "false");
  content.innerHTML = `<section class="profile-card settings-card">
    <div class="profile-cover ${profile.isDemo ? "is-demo" : "is-member"}"><span class="profile-cover-mark">Qipi</span></div>
    <div class="profile-overview"><span class="profile-avatar profile-avatar-large">${avatarContents(profile.displayName, profile.avatarPath || "")}</span><div class="profile-identity"><span class="profile-demo-label">${esc(t(profile.isDemo ? "demoProfile" : "profileMember"))}</span><h2>${esc(profile.displayName || t("guestTraveler"))}</h2>${location ? `<small>${esc(location)}</small>` : ""}</div><button class="button button-ghost profile-share" type="button" data-action="share-profile" data-id="${esc(profile.id)}">${icon("share")}<span>${esc(t("shareProfile"))}</span></button></div>
    <div class="profile-stats"><div><strong>${Number(profile.postCount) || 0}</strong><span>${esc(t("posts"))}</span></div><div><strong>${routeCount}</strong><span>${esc(t("profileRoutes"))}</span></div><div><strong>${trips.filter((trip) => trip.date >= dateToday()).length}</strong><span>${esc(t("profileUpcoming"))}</span></div></div>
    ${profile.bio ? `<p class="profile-bio">${esc(profile.bio)}</p>` : ""}${styles.length ? `<div class="profile-interests">${styles.map((interest) => `<span>${esc(interest)}</span>`).join("")}</div>` : ""}
  </section><section class="profile-posts"><div class="feed-section-head"><h2>${esc(t("profilePosts"))}</h2></div><div class="trip-list">${trips.length ? trips.map(tripCardMarkup).join("") : `<div class="empty-trips"><h3>${esc(t("noPosts"))}</h3></div>`}</div></section>`;
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

async function openMyTrips() {
  if (auth.enabled && !auth.user) { openAuth("signin"); return; }
  showDialogLoading("my-dialog", "my-dialog-title");
  try {
    if (auth.user) await refreshMe();
    const { trips } = await api("/api/trips?includeClosed=true");
    const hosted = [...(state.me?.trips || []), ...trips.filter((trip) => state.hostKeys[trip.id])]
      .filter((trip, index, all) => all.findIndex((item) => item.id === trip.id) === index);
    const legacyRequests = await Promise.all(Object.entries(state.requestKeys).map(async ([tripId, request]) => {
      try {
        const [tripResult, requestResult] = await Promise.all([
          api(`/api/trips/${encodeURIComponent(tripId)}`),
          api(`/api/trips/${encodeURIComponent(tripId)}/requests/${encodeURIComponent(request.id)}`, { headers: { "x-request-token": request.token } })
        ]);
        return { trip: tripResult.trip, status: requestResult.request.status };
      } catch { return null; }
    }));
    const requests = [...(state.me?.requests || []).map(({ trip, status }) => ({ trip, status })), ...legacyRequests.filter(Boolean)]
      .filter((item, index, all) => all.findIndex((entry) => entry.trip.id === item.trip.id) === index);
    $("#my-dialog-content").innerHTML = `<p class="dialog-kicker">QIPI / ${esc(t("myTrips"))}</p><h2 id="my-dialog-title">${esc(t("myTitle"))}</h2><p class="dialog-intro">${esc(t("myIntro"))}</p>
      <div class="dialog-section"><h3>${esc(t("hosting"))}</h3><div class="my-list">${hosted.length ? hosted.map((trip) => `<div class="my-card"><div><strong>${esc(trip.title)}</strong><p>${esc(dateLabel(trip.date))} · ${esc(t(trip.status))}</p></div><button type="button" data-action="open-trip" data-id="${esc(trip.id)}">${esc(t("open"))} ${icon("arrow-up-right")}</button></div>`).join("") : `<p class="small-copy">${esc(t("noHosted"))}</p>`}</div></div>
      <div class="dialog-section"><h3>${esc(t("joining"))}</h3><div class="my-list">${requests.length ? requests.map(({ trip, status }) => `<div class="my-card"><div><strong>${esc(trip.title)}</strong><p>${esc(dateLabel(trip.date))} · ${esc(status === "approved" ? t("requestApproved") : status === "declined" ? t("requestDeclined") : t("requestPending"))}</p></div><button type="button" data-action="open-trip" data-id="${esc(trip.id)}">${esc(t("open"))} ${icon("arrow-up-right")}</button></div>`).join("") : `<p class="small-copy">${esc(t("noJoined"))}</p>`}</div></div>`;
  } catch (error) { renderDialogError("my-dialog", "retry-my-trips"); toast(error.message || t("failed")); }
}

async function openSavedTrips() {
  setPageView("saved");
  renderTripListLoading("#saved-trip-list", 2);
  try {
    const { trips } = await api("/api/trips?includeClosed=true");
    state.savedTripRecords = trips.filter((trip) => state.savedTrips.includes(trip.id));
    renderTrips();
  } catch (error) { renderLoadingError("#saved-trip-list", "retry-saved"); toast(error.message || t("failed")); }
}

function openUpdate(id) {
  showDialog("update-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("addRouteNote"))}</p><h2 id="update-dialog-title">${esc(t("updateTitle"))}</h2><p class="dialog-intro">${esc(t("updateIntro"))}</p><form id="update-form" data-route-id="${esc(id)}"><div class="form-grid"><div class="field"><label for="update-name">${esc(t("yourName"))}</label><input id="update-name" name="nickname" minlength="2" maxlength="40" required value="${esc(displayName() || localStorage.getItem("qipi:nickname") || "")}" /></div><div class="field"><label for="update-date">${esc(t("visitDate"))}</label><input id="update-date" type="date" name="visitedOn" max="${dateToday()}" required /></div><div class="field span-2"><label for="update-condition">${esc(t("condition"))}</label><select id="update-condition" name="condition"><option value="good">${esc(t("good"))}</option><option value="mixed">${esc(t("mixedCondition"))}</option><option value="caution">${esc(t("caution"))}</option></select></div><div class="field span-2"><label for="update-note">${esc(t("routeUpdateNote"))}</label><textarea id="update-note" name="note" minlength="10" maxlength="500" required></textarea></div></div><div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("submitUpdate"))} ${icon("arrow-up-right")}</button></form>`);
}
function openReport(type, id) {
  showDialog("report-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("reportTitle"))}</p><h2 id="report-dialog-title">${esc(t("reportTitle"))}</h2><p class="dialog-intro">${esc(t("reportIntro"))}</p><form id="report-form" data-target-type="${esc(type)}" data-target-id="${esc(id)}"><div class="field"><label for="report-reason">${esc(t("reason"))}</label><select id="report-reason" name="reason"><option value="inaccurate">${esc(t("inaccurate"))}</option><option value="unsafe">${esc(t("unsafe"))}</option><option value="spam">${esc(t("spam"))}</option><option value="other">${esc(t("other"))}</option></select></div><div class="field"><label for="report-details">${esc(t("details"))}</label><textarea id="report-details" name="details" maxlength="500"></textarea></div><div class="error-message" role="alert"></div><button class="button button-primary form-submit" type="submit">${esc(t("sendReport"))} ${icon("arrow-up-right")}</button></form>`);
}
async function shareTrip(id) {
  const url = new URL(location.origin + "/");
  url.searchParams.set("trip", id);
  try { await navigator.clipboard.writeText(url.toString()); toast(t("copied")); }
  catch { window.prompt(t("shareTrip"), url.toString()); }
}
async function shareProfile(id) {
  const url = new URL(location.origin + "/");
  url.searchParams.set("profile", id);
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
  if (mode === "profile" && auth.user) {
    const name = displayName();
    showDialog("auth-dialog", `<p class="dialog-kicker">QIPI / ${esc(t("profile"))}</p><h2 id="auth-dialog-title">${esc(t("profileTitle"))}</h2><div class="profile-summary"><span class="profile-avatar">${esc(initials(name))}</span><div><strong>${esc(name)}</strong><small>${esc(auth.user.email || "")}</small></div></div><div class="dialog-actions"><button class="button button-primary" type="button" data-action="my-trips">${esc(t("myTrips"))}</button><button class="button button-ghost" type="button" data-action="sign-out">${esc(t("signOut"))}</button></div>`);
    return;
  }
  const recover = mode === "recover";
  const reset = mode === "reset";
  const title = t(recover ? "authHeadingRecover" : reset ? "authHeadingReset" : "authHeadingSignIn");
  const description = recover ? t("authDescriptionRecover") : "";
  const passwordField = (showRecoveryLink = false, autocomplete = "current-password") => `
    <div class="field">
      <div class="field-label-row"><label for="auth-password">${esc(t("password"))}</label>${showRecoveryLink ? `<button class="auth-forgot" type="button" data-action="auth-mode" data-mode="recover">${esc(t("forgotPassword"))}</button>` : ""}</div>
      <input id="auth-password" name="password" type="password" minlength="8" autocomplete="${autocomplete}" required />
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
  if (query.has("route")) await openRoute(query.get("route"), false);
  else if (query.has("trip")) await openTrip(query.get("trip"), false);
  else if (query.has("profile")) await openProfile(query.get("profile"), false);
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
    if (wasEntryPage) await loadFeedData();
    await openStartupDeepLink();
  }
}

// Delegated UI actions and form submissions.
document.addEventListener("click", async (eventTarget) => {
  const button = eventTarget.target.closest("[data-action]");
  if (!button) return;
  const { action, id, type, request, decision, mode } = button.dataset;
  if (action === "open-mobile-search") { openMobileSearch(); return; }
  if (action === "close-mobile-search") { closeMobileSearch(); return; }
  if (action === "clear-mobile-search") { $("#mobile-feed-search").value = ""; renderSearchRecents(); $("#mobile-feed-search")?.focus(); return; }
  if (action === "toggle-search-edit") { state.searchEditing = !state.searchEditing; renderSearchRecents(); return; }
  if (action === "select-recent-search") { submitSearch(button.dataset.query || ""); return; }
  if (action === "remove-recent-search") { state.recentSearches = state.recentSearches.filter((item) => item !== button.dataset.query); saveLocal("qipi:recent-searches", state.recentSearches); renderSearchRecents(); return; }
  if (action === "reset-search-filters") { state.searchFilters = { upcoming: false, routeId: "", transport: "" }; syncSearchFilterControls(); renderTrips(); return; }
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
    await loadFeedData();
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
  if (action === "retry-saved") { await openSavedTrips(); return; }
  if (action === "retry-profile") { await openProfile(id); return; }
  if (action === "retry-route") { await openRoute(id); return; }
  if (action === "retry-trip") { await openTrip(id); return; }
  if (action === "retry-my-trips") { await openMyTrips(); return; }
  if (action === "close-dialog") { closeDialogs(); setLink(); }
  if (action === "open-route") openRoute(id);
  if (action === "open-profile") { await openProfile(id); return; }
  if (action === "profile-back") {
    const returnView = state.profileReturnView || "feed";
    state.profile = null;
    state.profileId = "";
    state.profileRequestId += 1;
    setLink();
    await navigateToView(returnView);
    return;
  }
  if (action === "open-trip") openTrip(id);
  if (action === "create-trip") requireSignIn(() => openCreate(id || state.filter));
  if (action === "join-trip") requireSignIn(() => openJoin(id));
  if (action === "my-trips") openMyTrips();
  if (action === "saved-trips") openSavedTrips();
  if (action === "open-settings") openSettings();
  if (action === "back-to-feed") { await openFeedPage(); }
  if (action === "settings-sign-in") openAuth("signin");
  if (action === "account") { pendingAction = null; openAuth(auth.user ? "profile" : "signin"); }
  if (action === "auth-mode") openAuth(mode);
  if (action === "sign-out") { await auth.signOut(); state.me = null; renderAccount(); renderSettings(); renderTrips(); closeDialogs(); }
  if (action === "toggle-save") {
    state.savedTrips = state.savedTrips.includes(id) ? state.savedTrips.filter((item) => item !== id) : [...state.savedTrips, id];
    saveLocal("qipi:saved-trips", state.savedTrips);
    renderTrips();
  }
  if (action === "toggle-like") {
    button.disabled = true;
    try {
      const liked = button.getAttribute("aria-pressed") !== "true";
      const result = await api(`/api/trips/${encodeURIComponent(id)}/like`, { method: "POST", data: { liked } });
      const updateTrip = (trip) => trip.id === id ? { ...trip, ...result } : trip;
      state.trips = state.trips.map(updateTrip);
      state.savedTripRecords = state.savedTripRecords.map(updateTrip);
      if (state.profile) state.profile = { ...state.profile, trips: state.profile.trips.map(updateTrip) };
      renderTrips();
      if (state.view === "profile") renderProfile();
    } catch (error) { toast(error.message || t("failed")); }
    finally { button.disabled = false; }
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
  if (input.id === "settings-avatar-file") {
    const file = input.files?.[0];
    const form = $("#settings-profile-form");
    const uploadLabel = document.querySelector('label[for="settings-avatar-file"]');
    if (!file || !form) return;
    input.disabled = true;
    uploadLabel.textContent = t("uploadingImage");
    uploadLabel.classList.add("is-uploading");
    uploadImage(file, "profile").then(async (path) => {
      await auth.updateAvatar(path);
      await api("/api/me/avatar", { method: "POST", data: { avatarPath: path } });
      renderAccount();
      $("#settings-profile-avatar").innerHTML = avatarContents(displayName(), path);
      await loadTrips();
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

document.addEventListener("submit", async (eventTarget) => {
  const form = eventTarget.target;
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
  if (form.id === "settings-profile-form") {
    eventTarget.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      const travelStyles = [...form.querySelectorAll('input[name="travelStyle"]:checked')].map((input) => input.value);
      if (travelStyles.length > 3) throw new Error(t("signupStyleLimit"));
      await auth.updateProfile({ displayName: values.displayName.trim(), homeBase: values.homeBase.trim(), travelStyles, bio: values.bio.trim() });
      renderAccount(); renderSettings(); toast(t("profileSaved"));
    } catch (error) { setError(form, error.message || t("profileSaveError")); }
    finally { submit.disabled = false; }
    return;
  }
  if (form.id === "auth-form") {
    eventTarget.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
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
    finally { submit.disabled = false; }
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
$("#feed-search").addEventListener("focus", openDesktopSearch);
$("#feed-search").addEventListener("input", renderSearchRecents);
$("#feed-search").addEventListener("keydown", (eventTarget) => { if (eventTarget.key === "Enter") { eventTarget.preventDefault(); submitSearch(eventTarget.target.value); eventTarget.target.blur(); } });
$("#mobile-feed-search").addEventListener("input", renderSearchRecents);
$("#mobile-feed-search").addEventListener("keydown", (eventTarget) => { if (eventTarget.key === "Enter") { eventTarget.preventDefault(); submitSearch(eventTarget.target.value); eventTarget.target.blur(); } });
document.addEventListener("click", (eventTarget) => { if (!$("#desktop-search-wrap")?.contains(eventTarget.target)) closeDesktopSearch(); });
document.addEventListener("keydown", (eventTarget) => { if (eventTarget.key === "Escape" && !$("#desktop-search-panel").hidden) { closeDesktopSearch(); $("#feed-search").blur(); } });
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
document.querySelectorAll("a[href^='#']").forEach((anchor) => anchor.addEventListener("click", (eventTarget) => {
  const target = anchor.getAttribute("href");
  if (target === "#routes") { eventTarget.preventDefault(); openExplorePage(); }
  else if (target === "#feed") { eventTarget.preventDefault(); openFeedPage(); }
  else if (target === "#trips") {
    eventTarget.preventDefault();
    openTripsPage();
    requestAnimationFrame(() => $("#trips").scrollIntoView({ behavior: "smooth", block: "start" }));
  }
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
  const signupRoute = location.hash === "#signup";
  entryReturnView = viewFromHash(location.hash);
  const showEntryImmediately = !signupRoute && !auth.session && !auth.recovery && !entryChoice();
  if (showEntryImmediately) {
    document.documentElement.dataset.entryPending = "true";
  }
  renderFeedLoading();
  try {
    await auth.initialize();
    if (auth.user) await refreshMe();
  } catch (error) { toast(error.message || t("failed")); }
  if (auth.user) {
    saveEntryChoice("account");
    document.documentElement.removeAttribute("data-entry-pending");
  } else if (!signupRoute && !auth.recovery && !entryChoice()) {
    setPageView("entry");
  } else {
    document.documentElement.removeAttribute("data-entry-pending");
  }
  if (signupRoute && !auth.user) openSignupPage();
  else {
    document.documentElement.removeAttribute("data-signup-pending");
    if (signupRoute && auth.user) setPageView("settings");
  }
  if (state.view !== "entry") await loadFeedData();
  if ($("#trip-list [data-action='retry-feed']")) return;
  if (state.view !== "entry" && state.view !== "signup" && !signupRoute) {
    if (entryReturnView === "saved") await openSavedTrips();
    else setPageView(entryReturnView);
  }
  if (state.view !== "entry") await openStartupDeepLink();
  if (auth.recovery) openAuth("reset");
}
initialize();
