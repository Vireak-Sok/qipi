import { pageRegions, shellRegions } from "./regions.mjs";
import { esc } from "../../public/js/core.js";
export function regionMarkup({ tag, props, html }) {
  const attrs = Object.entries(props).map(([key, value]) => `${key === "className" ? "class" : key}${value === true ? "" : `="${esc(value)}"`}`).join(" ");
  return `<${tag} ${attrs}>${html}</${tag}>`;
}
const { skipLink, topbar, leftRail, rightRail, mobileSearch, mobileNav, dialogs, toast } = shellRegions;
export const pageMarkup = [regionMarkup(skipLink), regionMarkup(topbar), `<div class="app-layout shell" id="main">${regionMarkup(leftRail)}<main class="feed-column" id="feed">${pageRegions.map(regionMarkup).join("\n")}</main>${regionMarkup(rightRail)}</div>`, regionMarkup(mobileSearch), regionMarkup(mobileNav), ...dialogs.map(regionMarkup), regionMarkup(toast)].join("\n");
