import { $, esc, icon, saveLocal } from "./core.js";

export function createSearchController({ state, t, api, renderRoutes, renderTrips, syncSearchFilterControls, setPageView, renderTripListLoading, renderLoadingError, toast }) {
  let searchRequestId = 0;
  function setSearch(value) {
    const query = value.trim();
    state.search = query.toLocaleLowerCase();
    const input = $("#home-search-input");
    if (input) input.value = query;
    const clear = $(".home-search-clear");
    if (clear) clear.hidden = !query;
    const results = $("#user-search-results");
    if (results && (state.view !== "search-results" || !query)) results.hidden = true;
    renderRoutes();
    renderTrips();
  }

  function renderUserSearchResults(profiles = [], query = state.search) {
    const target = $("#user-search-results");
    if (!target) return;
    const matches = (profiles || []).filter((profile) => profile.id !== state.me?.id);
    target.hidden = false;
    target.innerHTML = `<div class="user-search-results-head"><h2>${esc(t("searchPeopleHeading"))}</h2><span>${matches.length}</span></div>${matches.length
      ? `<div class="user-search-result-list">${matches.map((profile) => {
        const name = profile.displayName || profile.username || t("traveler");
        const letter = Array.from(name.trim())[0] || "Q";
        const username = profile.username || profile.id;
        return `<a class="user-search-result" href="/${encodeURIComponent(username)}" data-action="open-profile" data-id="${esc(profile.id)}"><span class="user-search-avatar">${esc(letter.toLocaleUpperCase())}</span><span><strong>${esc(name)}</strong><small>@${esc(username)}</small></span><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#arrow-right"></use></svg></a>`;
      }).join("")}</div>`
      : `<p class="user-search-empty">${esc(t("searchPeopleEmpty"))}</p>`}`;
  }

  function submitSearch(value) {
    const query = value.trim();
    setSearch(query);
    saveRecentSearch(query);
    state.filter = "";
    state.searchFilters = { upcoming: false, routeId: "", transport: "" };
    state.searchProfiles = [];
    syncSearchFilterControls();
    closeDesktopSearch();
    setPageView("search-results");
    const userResults = $("#user-search-results");
    if (userResults) userResults.hidden = true;
    renderTripListLoading("#trip-list", 2);
    void loadSearchResults();
  }

  async function loadSearchResults({ loadPosts = true } = {}) {
    const query = state.search.trim();
    const requestId = ++searchRequestId;
    const tripRequest = (loadPosts ? api("/api/trips") : Promise.resolve({ trips: state.trips })).then((result) => {
      if (requestId !== searchRequestId || state.view !== "search-results") return;
      state.trips = result.trips || [];
      renderTrips();
    }).catch((error) => {
      if (requestId !== searchRequestId || state.view !== "search-results") return;
      renderLoadingError("#trip-list", "retry-search");
      toast(error.message || t("failed"));
    });
    const peopleRequest = (query ? api(`/api/profiles/search?q=${encodeURIComponent(query)}`) : Promise.resolve({ profiles: [] })).then((result) => {
      if (requestId !== searchRequestId || state.view !== "search-results") return;
      state.searchProfiles = result.profiles || [];
      renderUserSearchResults(state.searchProfiles, query);
    }).catch(() => {
      if (requestId !== searchRequestId || state.view !== "search-results") return;
      state.searchProfiles = [];
      renderUserSearchResults([], query);
    });
    await Promise.allSettled([tripRequest, peopleRequest]);
  }

  function saveRecentSearch(value) {
    const query = value.trim();
    if (!query) return;
    state.recentSearches = [query, ...state.recentSearches.filter((item) => item.toLocaleLowerCase() !== query.toLocaleLowerCase())].slice(0, 8);
    saveLocal("qipi:recent-searches", state.recentSearches);
    renderSearchRecents();
  }

  function renderSearchRecents() {
    const target = $("#home-search-recents");
    if (!target) return;
    const query = $("#home-search-input")?.value.trim().toLocaleLowerCase() || "";
    const rowMarkup = (item) => `<li class="search-recent-row"><button type="button" class="search-recent-select" data-action="select-recent-search" data-query="${esc(item)}"><span class="search-recent-icon">${icon("clock")}</span><span class="search-recent-text">${esc(item)}</span></button><button type="button" class="search-recent-remove" data-action="remove-recent-search" data-query="${esc(item)}" aria-label="${esc(t("removeRecentSearch"))}: ${esc(item)}"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#close"></use></svg></button></li>`;
    const recent = state.recentSearches.filter((item) => !query || item.toLocaleLowerCase().includes(query));
    target.innerHTML = recent.length
      ? `<ul class="search-recent-list">${recent.map(rowMarkup).join("")}</ul>`
      : `<p class="search-recents-empty">${esc(query ? t("searchRecentNoMatch") : t("searchRecentEmpty"))}</p>`;
  }

  function openDesktopSearch() {
    const panel = $("#home-search-recents-panel");
    if (!panel) return;
    panel.hidden = false;
    $("#home-search-input")?.setAttribute("aria-expanded", "true");
    renderSearchRecents();
  }

  function closeDesktopSearch() {
    const panel = $("#home-search-recents-panel");
    if (panel) panel.hidden = true;
    $("#home-search-input")?.setAttribute("aria-expanded", "false");
  }

  function bindSearchEvents() {
    const form = $("#home-search-form");
    const input = $("#home-search-input");
    if (!form || !input) return;
    input.addEventListener("focus", openDesktopSearch);
    input.addEventListener("input", () => {
      $(".home-search-clear").hidden = !input.value;
      renderSearchRecents();
    });
    form.addEventListener("submit", (eventTarget) => {
      eventTarget.preventDefault();
      submitSearch(input.value);
      input.blur();
    });
    document.addEventListener("click", (eventTarget) => {
      if (!$("#home-search")?.contains(eventTarget.target)) closeDesktopSearch();
    });
    document.addEventListener("keydown", (eventTarget) => {
      const panel = $("#home-search-recents-panel");
      if (eventTarget.key === "Escape" && panel && !panel.hidden) {
        closeDesktopSearch();
        input.blur();
      }
    });
  }

  return { setSearch, submitSearch, loadSearchResults, renderSearchRecents, closeDesktopSearch, bindSearchEvents };
}
