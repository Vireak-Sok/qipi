import { $, esc } from "./core.js";

export function createLoadingViews({ t, showDialog }) {
  function showDialogLoading(id, titleId) {
    showDialog(id, `<h2 class="visually-hidden" id="${esc(titleId)}">${esc(t("loading"))}</h2><div class="skeleton-dialog" aria-hidden="true"><span class="skeleton-dialog-line short"></span><span class="skeleton-dialog-line wide"></span><span class="skeleton-dialog-line"></span><div class="skeleton-dialog-facts"><i></i><i></i><i></i></div><span class="skeleton-dialog-block"></span><span class="skeleton-dialog-line wide"></span><span class="skeleton-dialog-line short"></span></div>`);
  }
  function renderDialogError(id, action, targetId = "") {
    const content = $(`#${id} [id$='-content']`);
    if (!content) return;
    content.innerHTML = `<div class="feed-load-error" role="alert"><p>${esc(t("feedLoadError"))}</p><button class="button button-ghost" type="button" data-action="${esc(action)}" ${targetId ? `data-id="${esc(targetId)}"` : ""}>${esc(t("retry"))}</button></div>`;
  }

  function renderSettingsAccountLoading() {
    const content = $("#settings-account-content");
    if (!content) return;
    content.setAttribute("aria-busy", "true");
    content.innerHTML = `<div class="skeleton-settings" aria-hidden="true"><i></i><span><b></b><b></b></span></div><div class="skeleton-settings-actions" aria-hidden="true"><i></i><i></i></div>`;
  }

  function skeletonPostsMarkup(count = 2) {
    return `<div class="skeleton-posts" aria-hidden="true">${Array.from({ length: count }, () => `<article class="skeleton-post"><span class="skeleton-post-head"><i></i><b></b></span><span class="skeleton-media"></span><div class="skeleton-post-body"><span class="skeleton-copy"></span><span class="skeleton-copy short"></span><span class="skeleton-journey"></span><span class="skeleton-post-actions"><i></i><i></i><i></i><b></b></span></div></article>`).join("")}</div>`;
  }

  function renderTripListLoading(selector = "#trip-list", count = 2) {
    const list = $(selector);
    if (!list) return;
    list.setAttribute("aria-busy", "true");
    list.innerHTML = skeletonPostsMarkup(count);
  }

  function renderRoutesLoading(inExplore = false) {
    const grid = $("#route-grid");
    grid.setAttribute("aria-busy", "true");
    grid.innerHTML = inExplore
      ? `<div class="skeleton-explore-routes" aria-hidden="true">${Array.from({ length: 3 }, () => `<span class="skeleton-explore-card"><i></i><b></b><b></b></span>`).join("")}</div>`
      : `<div class="skeleton-routes" aria-hidden="true">${Array.from({ length: 3 }, () => `<span class="skeleton-story"><i></i><b></b></span>`).join("")}</div>`;
  }

  function renderLoadingError(selector, action, id = "") {
    const target = $(selector);
    if (!target) return;
    target.setAttribute("aria-busy", "false");
    target.innerHTML = `<div class="feed-load-error" role="alert"><p>${esc(t("feedLoadError"))}</p><button class="button button-ghost" type="button" data-action="${esc(action)}" ${id ? `data-id="${esc(id)}"` : ""}>${esc(t("retry"))}</button></div>`;
  }

  return { showDialogLoading, renderDialogError, renderSettingsAccountLoading, skeletonPostsMarkup, renderTripListLoading, renderRoutesLoading, renderLoadingError };
}
