// Static, trusted markup. Dynamic values belong in the page controller.
export const feed = {
  tag: "section",
  props: {"className": "feed-trips", "id": "trips", "aria-labelledby": "trips-title"},
  html: `<section id="user-search-results" class="user-search-results" aria-live="polite" hidden></section><div class="feed-section-head"><h2 id="trips-title" data-i18n="forYou">For you</h2><div class="feed-filter"><svg class="heroicon filter-icon" aria-hidden="true"><use href="/icons.svg#funnel"></use></svg><span class="visually-hidden" id="trip-kind-filter-label">Filter posts</span><select id="trip-kind-filter" aria-labelledby="trip-kind-filter-label"><option value="">All posts</option><option value="story">Stories</option><option value="trip">Trips</option></select></div></div><div id="trip-list" class="trip-list" aria-live="polite"></div>`
};
