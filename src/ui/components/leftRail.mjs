import { navigation } from "./navigation.mjs";
// Static, trusted markup. Dynamic values belong in the page controller.
export const leftRail = {
  tag: "aside",
  props: {"className": "left-rail", "aria-label": "Community navigation"},
  html: `<button class="rail-profile" type="button" data-action="account" aria-label="View profile"><span class="profile-avatar" id="rail-avatar">Q</span><div><strong id="rail-user-name" data-i18n="guestTraveler">Guest traveler</strong></div></button>
        <nav class="rail-nav">${navigation()}</nav>`
};
