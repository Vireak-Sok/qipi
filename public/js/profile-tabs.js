import { esc, icon } from "./core.js";
export const PROFILE_TABS = [
  { id: "posts", label: "profilePosts", icon: "calendar" },
  { id: "joining", label: "profileJoiningTab", icon: "users" },
  { id: "saved", label: "saved", icon: "bookmark" }
];
export function profileTabs({ active = "posts", t, tabs = PROFILE_TABS }) {
  return `<nav class="profile-tabs" aria-label="${esc(t("profilePageTitle"))}">${tabs.map(tab => `<button type="button" class="profile-tab ${active === tab.id ? "is-active" : ""}" data-action="profile-tab" data-id="${tab.id}" aria-label="${esc(t(tab.label))}" title="${esc(t(tab.label))}" aria-pressed="${active === tab.id}" aria-controls="profile-tab-panel">${icon(tab.icon)}<span class="visually-hidden">${esc(t(tab.label))}</span></button>`).join("")}</nav>`;
}
