import { esc, icon } from "../../../public/js/core.js";
export function pageHeading({ id, label, title, backAction = "back-to-feed" }) {
  return `<header class="settings-header"><button type="button" class="settings-back" data-action="${esc(backAction)}" aria-label="Back to feed" data-i18n-aria-label="backToFeed">${icon("arrow-left")}</button><h1 id="${esc(id)}" data-i18n="${esc(label)}">${esc(title)}</h1></header>`;
}
