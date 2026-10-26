import { esc, icon } from "./core.js";
export const PROFILE_TABS = [
  { id: "posts", label: "profilePosts", icon: "calendar" },
  { id: "joining", label: "joining", icon: "users" },
  { id: "saved", label: "saved", icon: "bookmark" }
];
export function profileTabs({ active = "posts", t }) {
  return `<nav class="profile-tabs" aria-label="${esc(t("profilePageTitle"))}">${PROFILE_TABS.map(tab => `<button type="button" class="profile-tab ${active === tab.id ? "is-active" : ""}" data-action="profile-tab" data-id="${tab.id}" aria-pressed="${active === tab.id}" aria-controls="profile-tab-panel">${icon(tab.icon)}<span>${esc(t(tab.label))}</span></button>`).join("")}</nav>`;
}
