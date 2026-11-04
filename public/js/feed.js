import { $, esc, icon, dateToday } from "./core.js";

export function createFeedController({ state, t, label, routeFor, syncEnhancedSelect, tripCardMarkup, api, setPageView, renderRoutesLoading, renderTripListLoading, renderLoadingError, toast, applyLanguage, safety }) {
  // Feed, search and page rendering.
  function renderRoutes() {
    const routeGrid = $("#route-grid");
    if (!routeGrid) return;
    const destinations = new Map();
    for (const trip of state.trips) {
      const place = (trip.destination || label(routeFor(trip.routeId)?.title) || "").trim();
      if (!place) continue;
      const key = place.toLocaleLowerCase();
      destinations.set(key, { name: place, count: (destinations.get(key)?.count || 0) + 1, mediaPath: destinations.get(key)?.mediaPath || trip.mediaPath });
    }
    routeGrid.setAttribute("aria-busy", "false");
    routeGrid.innerHTML = [...destinations.values()].sort((a, b) => b.count - a.count).map(place => `<button class="destination-card" type="button" data-action="explore-destination" data-destination="${esc(place.name)}"><span class="destination-card-art">${icon("map-pin")}</span><strong>${esc(place.name)}</strong><small>${place.count} ${place.count === 1 ? "post" : "posts"}</small></button>`).join("") || `<p class="small-copy">Destinations will appear as travelers share posts.</p>`;
  }
  function renderFilter() {
    syncSearchFilterControls();
  }
  function syncSearchFilterControls() {
    const upcoming = $("#search-upcoming-only"), transport = $("#search-transport-filter");
    if (upcoming) upcoming.checked = state.searchFilters.upcoming;
    if (transport) transport.value = state.searchFilters.transport;
    if (transport) syncEnhancedSelect(transport);
    const allButton = $(".search-filter-all");
    const allActive = !state.searchFilters.upcoming && !state.searchFilters.transport;
    allButton?.classList.toggle("is-active", allActive);
    allButton?.setAttribute("aria-pressed", String(allActive));
  }
  function renderTrips() {
    const isSearchResults = state.view === "search-results";
    const tripList = $(isSearchResults ? "#search-results-list" : "#trip-list");
    if (!tripList) return;
    if (isSearchResults && state.searchTripsLoading) return;
    const sourceTrips = isSearchResults ? state.searchTrips : state.trips;
    const filtered = sourceTrips.filter((trip) =>
      (isSearchResults || !state.filter || (trip.kind || "trip") === state.filter) &&
      (!isSearchResults || !state.search || `${trip.title} ${trip.notes} ${trip.hostName} ${trip.destination || ""} ${label(routeFor(trip.routeId)?.title)}`.toLowerCase().includes(state.search)) &&
      (!isSearchResults || (!state.searchFilters.transport || trip.transport === state.searchFilters.transport) && (!state.searchFilters.upcoming || ((trip.kind || "trip") === "trip" && trip.date >= dateToday()))));
    tripList.setAttribute("aria-busy", "false");
    let endNote = isSearchResults ? $("#search-results-end") : $("#feed-list-end");
    if (isSearchResults && !endNote) {
      endNote = document.createElement("p");
      endNote.id = "search-results-end";
      endNote.className = "list-end-note";
      tripList.after(endNote);
    }
    if (endNote) { endNote.hidden = !filtered.length; endNote.textContent = t("endOfFeed"); }
    if (isSearchResults) {
      const countLabel = state.lang === "en" && filtered.length === 1 ? t("searchTripFound") : t("searchResultCount");
      $("#search-results-trips-title").textContent = `${t("searchResults")} · ${filtered.length} ${countLabel}`;
    }
    else $("#trips-title").textContent = t(state.view === "trips" ? "navTrips" : "forYou");
    if (!filtered.length) {
      tripList.innerHTML = `<div class="empty-trips"><div class="empty-icon">${icon(isSearchResults ? "search" : "map-pin")}</div><h3>${esc(isSearchResults ? t("noSearchResults") : state.filter ? t("noTripsFilter") : t("tripBoardEmptyTitle"))}</h3><p>${esc(isSearchResults ? t("searchTryAnother") : t("tripBoardEmptyBody"))}</p>${isSearchResults ? `<button class="button button-ghost" type="button" data-action="reset-search-filters">${esc(t("allTrips"))}</button>` : `<button class="button button-primary" type="button" data-action="create-trip">${esc(t("createPostAction"))} ${icon("arrow-up-right")}</button>`}</div>`;
      return;
    }
    tripList.innerHTML = filtered.map(tripCardMarkup).join("");
  }
  async function loadTrips() {
    const result = await api(state.view === "trips" ? "/api/trips?upcoming=true" : "/api/trips");
    state.trips = result.trips;
    renderRoutes();
    renderTrips();
  }

  async function openFeedPage() {
    setPageView("feed");
    renderFeedLoading();
    await loadFeedData();
  }

  async function openExplorePage() {
    await safety.openExploreMap();
  }

  async function openTripsPage() {
    setPageView("trips");
    renderTripListLoading("#trip-list", 2);
    try { await loadTrips(); }
    catch (error) { renderLoadingError("#trip-list", "retry-trips"); toast(error.message || t("failed")); }
  }

  function renderFeedLoading() {
    const endNote = $("#feed-list-end");
    if (endNote) endNote.hidden = true;
    $("#trip-list").setAttribute("aria-busy", "true");
    renderTripListLoading("#trip-list", 2);
  }

  function renderFeedError() {
    const endNote = $("#feed-list-end");
    if (endNote) endNote.hidden = true;
    const routeGrid = $("#route-grid");
    if (routeGrid) { routeGrid.setAttribute("aria-busy", "false"); routeGrid.replaceChildren(); }
    $("#trip-list").setAttribute("aria-busy", "false");
    $("#trip-list").innerHTML = `<div class="feed-load-error" role="alert"><p>${esc(t("feedLoadError"))}</p><button class="button button-ghost" type="button" data-action="retry-feed">${esc(t("retry"))}</button></div>`;
  }

  async function loadFeedData({ preserveContent = false } = {}) {
    if (state.feedRequestActive) return false;
    state.feedRequestActive = true;
    if (!preserveContent && $("#route-grid")?.getAttribute("aria-busy") !== "true") renderFeedLoading();
    try {
      const [routeResult, tripResult] = await Promise.all([api("/api/routes"), api("/api/trips")]);
      state.routes = routeResult.routes;
      state.trips = tripResult.trips;
      applyLanguage();
      return true;
    } catch (error) {
      if (!preserveContent || $("#trip-list")?.getAttribute("aria-busy") === "true") renderFeedError();
      toast(error.message || t("failed"));
      return false;
    } finally {
      state.feedRequestActive = false;
    }
  }

  return { renderRoutes, renderFilter, syncSearchFilterControls, renderTrips, loadTrips, openFeedPage, openExplorePage, openTripsPage, renderFeedLoading, renderFeedError, loadFeedData };
}
