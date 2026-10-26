import { $, esc } from "./js/core.js";

let token = sessionStorage.getItem("qipi:admin-token") || "";

async function call(path, method = "GET", data) {
  const response = await fetch(path, {
    method,
    headers: { "x-admin-token": token, ...(data ? { "content-type": "application/json" } : {}) },
    body: data ? JSON.stringify(data) : undefined
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}

async function refresh() {
  const overview = await call("/api/admin/overview");
  $("#admin-login").hidden = true;
  $("#admin-dashboard").hidden = false;
  const counts = overview.eventCounts;
  $("#admin-stats").innerHTML = [
    ["Route views", counts.route_viewed || 0],
    ["Trip posts", counts.trip_created || 0],
    ["Join requests", counts.join_requested || 0]
  ].map(([name, number]) => `<div class="stat"><strong>${number}</strong><span>${name}</span></div>`).join("");
  $("#admin-reports").innerHTML = overview.reports.length
    ? overview.reports.map((report) => `<div class="admin-row"><strong>${esc(report.reason)} · ${esc(report.targetType)}</strong><p>${esc(report.details || "No additional details")}</p><small>${esc(report.targetId)}</small><div class="admin-actions"><button data-action="resolve-report" data-id="${esc(report.id)}">Resolve</button></div></div>`).join("")
    : `<p class="small-copy">No pending reports.</p>`;
  $("#admin-updates").innerHTML = overview.updates.length
    ? overview.updates.map((update) => `<div class="admin-row"><strong>${esc(update.nickname)} · ${esc(update.routeId)}</strong><p>${esc(update.note)}</p><small>${esc(update.visitedOn)} · ${esc(update.condition)}</small><div class="admin-actions"><button data-action="decide-update" data-id="${esc(update.id)}" data-decision="approved">Approve</button><button class="secondary" data-action="decide-update" data-id="${esc(update.id)}" data-decision="rejected">Reject</button></div></div>`).join("")
    : `<p class="small-copy">No route notes waiting for review.</p>`;
  $("#admin-trips").innerHTML = overview.trips.length
    ? overview.trips.map((trip) => `<div class="admin-row"><strong>${esc(trip.title)}</strong><p>${esc(trip.hostName)} · ${esc(trip.date)} · ${esc(trip.meetingArea)}</p><div class="admin-actions"><button class="secondary" data-action="hide-trip" data-id="${esc(trip.id)}">Hide trip</button></div></div>`).join("")
    : `<p class="small-copy">No visible trips yet.</p>`;
}

$("#admin-login").addEventListener("submit", async (event) => {
  event.preventDefault();
  token = $("#admin-token").value;
  try {
    await refresh();
    sessionStorage.setItem("qipi:admin-token", token);
  } catch (error) {
    $("#admin-login-error").textContent = error.message;
    $("#admin-login-error").classList.add("show");
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  button.disabled = true;
  try {
    if (button.dataset.action === "resolve-report") await call(`/api/admin/reports/${button.dataset.id}/resolve`, "POST", {});
    if (button.dataset.action === "decide-update") await call(`/api/admin/updates/${button.dataset.id}/decision`, "POST", { decision: button.dataset.decision });
    if (button.dataset.action === "hide-trip") {
      if (!window.confirm("Hide this trip from the public board?")) return;
      await call(`/api/admin/trips/${button.dataset.id}/hide`, "POST", {});
    }
    await refresh();
  } catch (error) { window.alert(error.message); }
  finally { button.disabled = false; }
});

if (token) refresh().catch(() => { sessionStorage.removeItem("qipi:admin-token"); token = ""; });
