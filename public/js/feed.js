import { $, esc, icon, dateToday } from "./core.js";

export function createFeedController({ state, t, label, routeFor, syncEnhancedSelect, tripCardMarkup, api, setPageView, renderRoutesLoading, renderTripListLoading, renderLoadingError, toast, applyLanguage }) {
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
    const tripList = $("#trip-list");
    const sourceTrips = state.trips;
    const filtered = sourceTrips.filter((trip) =>
      (state.view === "search-results" || !state.filter || trip.routeId === state.filter) &&
      (!state.search || `${trip.title} ${trip.notes} ${trip.hostName} ${label(routeFor(trip.routeId)?.title)}`.toLowerCase().includes(state.search)) &&
      (state.view !== "search-results" || (!state.searchFilters.routeId || trip.routeId === state.searchFilters.routeId) && (!state.searchFilters.transport || trip.transport === state.searchFilters.transport) && (!state.searchFilters.upcoming || trip.date >= dateToday())));
    tripList.setAttribute("aria-busy", "false");
    if (state.view === "search-results") $("#trips-title").textContent = `${t("searchResults")} · ${filtered.length} ${t("searchResultCount")}`;
    else $("#trips-title").textContent = t(state.view === "trips" ? "navTrips" : "forYou");
    if (!filtered.length) {
      tripList.innerHTML = `<div class="empty-trips"><div class="empty-icon">${icon(state.view === "search-results" ? "search" : "calendar")}</div><h3>${esc(state.view === "search-results" ? t("noSearchResults") : state.filter ? t("noTripsFilter") : t("tripBoardEmptyTitle"))}</h3><p>${esc(state.view === "search-results" ? t("searchTryAnother") : t("tripBoardEmptyBody"))}</p>${state.view === "search-results" ? `<button class="button button-ghost" type="button" data-action="reset-search-filters">${esc(t("allTrips"))}</button>` : `<button class="button button-primary" type="button" data-action="create-trip">${esc(t("postTrip"))} ${icon("arrow-up-right")}</button>`}</div>`;
      return;
    }
    tripList.innerHTML = filtered.map(tripCardMarkup).join("");
  }
  async function loadTrips() {
    const result = await api("/api/trips");
    state.trips = result.trips;
    renderTrips();
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

  return { renderRoutes, renderFilter, syncSearchFilterControls, renderTrips, loadTrips, openFeedPage, openExplorePage, openTripsPage, renderFeedLoading, renderFeedError, loadFeedData };
}
