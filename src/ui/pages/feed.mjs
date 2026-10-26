// Static, trusted markup. Dynamic values belong in the page controller.
export const feed = {
  tag: "section",
  props: {"className": "feed-trips", "id": "trips", "aria-labelledby": "trips-title"},
  html: `<div class="feed-section-head"><h2 id="trips-title" data-i18n="forYou">For you</h2><div class="feed-filter"><svg class="heroicon filter-icon" aria-hidden="true"><use href="/icons.svg#funnel"></use></svg><span class="visually-hidden" id="trip-route-filter-label" data-i18n="filterByRoute">Filter by route</span><select id="trip-route-filter" aria-labelledby="trip-route-filter-label"><option value="" data-i18n="allRoutes">All routes</option></select></div></div><div id="trip-list" class="trip-list" aria-live="polite"></div>`
};
