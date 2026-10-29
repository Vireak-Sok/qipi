import { navigation } from "./navigation.mjs";
// Static, trusted markup. Dynamic values belong in the page controller.
export const leftRail = {
  tag: "aside",
  props: {"className": "left-rail", "aria-label": "Community navigation"},
  html: `<button class="rail-profile" type="button" data-action="account" aria-label="View profile"><span class="profile-avatar" id="rail-avatar">Q</span><div><strong id="rail-user-name" data-i18n="guestTraveler">Guest traveler</strong></div></button>
        <section class="search-filter-panel" id="search-filter-panel" aria-label="Search filters" hidden>
          <div class="search-results-title-row"><button class="search-results-back" type="button" data-action="close-search-results" aria-label="Back to feed" data-i18n-aria-label="backToFeed"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#arrow-left"></use></svg><span data-i18n="backToFeed">Back to feed</span></button><h1 data-i18n="searchResults">Search results</h1></div><h2 data-i18n="filters">Filters</h2>
          <button type="button" class="search-filter-all is-active" data-action="reset-search-filters" aria-pressed="true"><span class="filter-all-icon"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#calendar"></use></svg></span><span data-i18n="allTrips">All trips</span></button>
          <label class="search-filter-toggle"><span data-i18n="upcomingOnly">Upcoming trips</span><input id="search-upcoming-only" type="checkbox" /></label>
          <label class="search-filter-field"><span data-i18n="transport">Transport</span><select id="search-transport-filter"><option value="" data-i18n="allTransport">All transport</option><option value="motorbike" data-i18n="motorbike">Motorbike</option><option value="car" data-i18n="car">Car</option><option value="mixed" data-i18n="mixed">Mixed group</option></select></label>
        </section>
        <nav class="rail-nav">${navigation()}</nav>`
};
