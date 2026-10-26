import { profileUsername, todayInCambodia } from "./shared.js";

const $ = (selector) => document.querySelector(selector);
const icon = (name, className = "heroicon") => `<svg class="${className}" aria-hidden="true"><use href="/icons.svg#${name}"></use></svg>`;
function getLikeActorId() {
  let id = localStorage.getItem("qipi:like-actor");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("qipi:like-actor", id);
  }
  return id;
}
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const initials = (value) => {
  const parts = String(value || "Q").match(/[\p{L}\p{N}]+/gu) || [];
  return parts.slice(0, 2).map((part) => Array.from(part)[0] || "").join("").toUpperCase() || "Q";
};
function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}
function saveLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

const dateToday = todayInCambodia;
const profileUsernameForId = (id, name = "") => profileUsername(name, id);

export { $, icon, esc, initials, getLikeActorId, readLocal, saveLocal, dateToday, profileUsernameForId };
