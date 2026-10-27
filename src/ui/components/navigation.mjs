import { PRIMARY_NAV, PAGE_PATHS } from "../../../public/js/route-config.js";
import { icon, esc } from "../../../public/js/core.js";
export function navigation({ mobile = false } = {}) {
  const labelTag = mobile ? "small" : "span";
  return PRIMARY_NAV.map((item) => {
    const create = mobile && item.view === "messages" ? `<button type="button" data-action="create-trip" class="mobile-create" aria-label="Post a trip" data-i18n-aria-label="postTrip">${icon("plus")}</button>` : "";
    const label = `${icon(item.icon)}<${labelTag} data-i18n="${item.label}">${esc(item.fallback)}</${labelTag}>`;
    return create + (item.view ? `<a href="${PAGE_PATHS[item.view]}" data-page-view="${item.view}">${label}</a>` : `<button type="button" data-action="${item.action}">${label}</button>`);
  }).join("");
}
