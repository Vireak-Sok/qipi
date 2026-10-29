// Static, trusted markup. Dynamic values belong in the page controller.
export const mobileSearch = {
  tag: "dialog",
  props: {"className": "search-dialog", "id": "search-dialog", "aria-label": "Search Qipi"},
  html: `<div class="search-screen">
        <header class="search-screen-header">
          <button class="search-back" type="button" data-action="close-mobile-search" aria-label="Back"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#arrow-left"></use></svg></button>
          <label class="search-screen-field"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#search"></use></svg><input id="mobile-feed-search" name="qipi-mobile-search" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" data-i18n-placeholder="searchPlaceholder" data-i18n-aria-label="searchPlaceholder" placeholder="Search posts and places" aria-label="Search posts and places" /><button class="search-clear" type="button" data-action="clear-mobile-search" aria-label="Clear search" hidden><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#close"></use></svg></button></label>
        </header>
        <section class="search-recents" aria-labelledby="search-recents-title"><div class="search-recents-head"><h2 id="search-recents-title" data-i18n="recentSearches">Recent</h2></div><div id="search-recents-list"></div></section>
      </div>`
};
