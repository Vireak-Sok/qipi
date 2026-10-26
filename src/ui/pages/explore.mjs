// Static, trusted markup. Dynamic values belong in the page controller.
export const explore = {
  tag: "section",
  props: {"className": "stories-section", "id": "routes", "aria-labelledby": "routes-title"},
  html: `<div class="feed-section-head"><h2 id="routes-title" data-i18n="explore">Explore</h2><a class="text-link" href="/trips" data-page-view="trips" data-i18n="seeAll">See all</a></div><p class="explore-description" data-i18n="routesSubtitle" hidden>Route guides to help plan your trip. Check live conditions before you leave.</p><div id="route-grid" class="route-grid story-list" aria-live="polite"></div>`
};
