import { navigation } from "./navigation.mjs";
// Static, trusted markup. Dynamic values belong in the page controller.
export const mobileNav = {
  tag: "nav",
  props: {"className": "mobile-nav", "aria-label": "Mobile navigation"},
  html: navigation({ mobile: true })
};
