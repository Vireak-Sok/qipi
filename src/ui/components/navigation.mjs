import { PRIMARY_NAV, PAGE_PATHS } from "../../../public/js/route-config.js";
import { icon, esc } from "../../../public/js/core.js";
export function navigation({ mobile = false } = {}) {
  const labelTag = mobile ? "small" : "span";
  return PRIMARY_NAV.map((item) => {
    const create = mobile && item.view === "messages" ? `<button type="button" data-action="create-trip" class="mobile-create" aria-label="Create a post" data-i18n-aria-label="createPostAction">${icon("plus")}</button>` : "";
    const badge = item.view === "messages" ? `<b class="nav-message-badge" data-message-badge aria-hidden="true" hidden></b>` : "";
    const label = `${icon(item.icon)}<${labelTag} data-i18n="${item.label}">${esc(item.fallback)}</${labelTag}>${badge}`;
    return create + (item.view ? `<a href="${PAGE_PATHS[item.view]}" data-page-view="${item.view}">${label}</a>` : `<button type="button" data-action="${item.action}">${label}</button>`);
  }).join("");
}
