import { $, esc, icon, saveLocal } from "./core.js";

export function createSearchController({ state, t, api, renderRoutes, renderTrips, syncSearchFilterControls, setPageView, renderTripListLoading, renderLoadingError, toast }) {
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
    const rowMarkup = (query) => '<li class="search-recent-row"><button type="button" class="search-recent-select" data-action="select-recent-search" data-query="' + esc(query) + '"><span class="search-recent-icon">' + icon("clock") + '</span><span class="search-recent-text">' + esc(query) + '</span></button><button type="button" class="search-recent-remove" data-action="remove-recent-search" data-query="' + esc(query) + '" aria-label="' + esc(t("removeRecentSearch")) + ': ' + esc(query) + '"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#close"></use></svg></button></li>';
    const desktopQuery = $("#feed-search")?.value.trim().toLocaleLowerCase() || "";
    const mobileQuery = $("#mobile-feed-search")?.value.trim().toLocaleLowerCase() || "";
    for (const [id, query] of [["search-recents-list", mobileQuery], ["desktop-search-recents", desktopQuery]]) {
      const list = $("#" + id);
      if (!list) continue;
      const recent = state.recentSearches.filter((item) => !query || item.toLocaleLowerCase().includes(query));
      list.innerHTML = recent.length
        ? '<ul class="search-recent-list">' + recent.map(rowMarkup).join("") + '</ul>'
        : '<p class="search-recents-empty">' + esc(query ? t("searchRecentNoMatch") : t("searchRecentEmpty")) + '</p>';
    }
  }

  function openDesktopSearch() {
    const panel = $("#desktop-search-panel");
    if (!panel || window.matchMedia("(max-width: 700px)").matches) return;
    panel.hidden = false;
    renderSearchRecents();
  }

  function closeDesktopSearch() {
    const panel = $("#desktop-search-panel");
    if (panel) panel.hidden = true;
  }

  function openMobileSearch() {
    const dialog = $("#search-dialog");
    if (!dialog?.open) dialog?.showModal();
    renderSearchRecents();
    requestAnimationFrame(() => $("#mobile-feed-search")?.focus());
  }

  function closeMobileSearch({ save = true } = {}) {
    if (save) saveRecentSearch($("#mobile-feed-search")?.value || "");
    $("#search-dialog")?.close();
  }

  function bindSearchEvents() {
    $("#feed-search").addEventListener("focus", openDesktopSearch);
    $("#feed-search").addEventListener("input", renderSearchRecents);
    $("#feed-search").addEventListener("keydown", (eventTarget) => { if (eventTarget.key === "Enter") { eventTarget.preventDefault(); submitSearch(eventTarget.target.value); eventTarget.target.blur(); } });
    $("#mobile-feed-search").addEventListener("input", (eventTarget) => { $(".search-clear").hidden = !eventTarget.target.value; renderSearchRecents(); });
    $("#mobile-feed-search").addEventListener("keydown", (eventTarget) => { if (eventTarget.key === "Enter") { eventTarget.preventDefault(); submitSearch(eventTarget.target.value); eventTarget.target.blur(); } });
    document.addEventListener("click", (eventTarget) => { if (!$("#desktop-search-wrap")?.contains(eventTarget.target)) closeDesktopSearch(); });
    document.addEventListener("keydown", (eventTarget) => {
      const panel = $("#desktop-search-panel");
      if (eventTarget.key === "Escape" && panel && !panel.hidden) { closeDesktopSearch(); $("#feed-search").blur(); }
    });
  }

  return { setSearch, submitSearch, loadSearchResults, renderSearchRecents, openDesktopSearch, closeDesktopSearch, openMobileSearch, closeMobileSearch, bindSearchEvents };
}
