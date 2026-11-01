// Static, trusted markup. Dynamic values belong in the page controller.
export const feed = {
  tag: "section",
  props: {"className": "feed-trips", "id": "trips", "aria-labelledby": "trips-title"},
  html: `<div id="feed-refresh-indicator" class="feed-refresh-indicator" role="status" aria-live="polite" aria-busy="false" hidden><span class="feed-refresh-spinner" aria-hidden="true"></span><span id="feed-refresh-label" data-i18n="pullToRefresh">Pull to refresh</span></div><section class="traveler-strip" id="traveler-strip" aria-labelledby="traveler-strip-title" hidden><div class="feed-section-head"><h2 id="traveler-strip-title" data-i18n="travelersToDiscover">Travelers</h2></div><div class="traveler-strip-list" id="traveler-strip-list" aria-live="polite"></div></section><div class="feed-section-head"><h2 id="trips-title" data-i18n="forYou">For you</h2></div><div id="trip-list" class="trip-list" aria-live="polite"></div>`
};
