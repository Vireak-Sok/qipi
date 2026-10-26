import { pageHeading } from "../components/page-heading.mjs";
// Static, trusted markup. Dynamic values belong in the page controller.
export const profile = {
  tag: "section",
  props: {"className": "profile-page settings-page", "id": "profile-view", "aria-labelledby": "profile-page-title", "hidden": true},
  html: `${pageHeading({"id": "profile-page-title", "label": "profilePageTitle", "title": "Profile", "backAction": "profile-back"})}
          <div id="profile-content" aria-live="polite"></div>`
};
