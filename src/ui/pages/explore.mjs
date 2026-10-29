// Static, trusted markup. Dynamic values belong in the page controller.
export const explore = {
  tag: "section",
  props: {"className": "stories-section", "id": "routes", "aria-labelledby": "routes-title"},
  html: `<div class="feed-section-head"><h1 id="routes-title" data-i18n="explore">Explore</h1></div><div id="explore-map-content" aria-live="polite" aria-busy="true"></div>`
};
