// Static, trusted markup. Dynamic values belong in the page controller.
export const explore = {
  tag: "section",
  props: {"className": "stories-section", "id": "routes", "aria-label": "Map"},
  html: `<div id="explore-map-content" aria-live="polite" aria-busy="true"><div class="explore-map-initial-skeleton" aria-hidden="true"><i></i><i></i><i></i></div></div>`
};
