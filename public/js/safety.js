import { $, esc } from "./core.js";

const safetyMap = (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  const lat = Math.max(-90, Math.min(90, latitude));
  const lon = Math.max(-180, Math.min(180, longitude));
  const span = 0.012;
  const bbox = [lon - span, lat - span, lon + span, lat + span].map(n => n.toFixed(5)).join("%2C");
  return `<div class="safety-map"><iframe title="Location map" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lon.toFixed(5)}"></iframe><a href="https://www.openstreetmap.org/?mlat=${lat.toFixed(5)}&mlon=${lon.toFixed(5)}#map=14/${lat.toFixed(5)}/${lon.toFixed(5)}" target="_blank" rel="noopener noreferrer">Open larger map · © OpenStreetMap contributors</a></div>`;
};
const locationError = error => error?.code === 1 ? "Location permission was denied." : error?.code === 2 ? "Your location is unavailable. Check your device settings." : "Could not get your location. Try again.";
function position() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Location is unavailable in this browser.")); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 });
  });
}

export function createSafetyController({ api, auth, setPageView, toast, openAuth }) {
  let contacts = [], checkins = [], session = null, shareToken = "", watchId = null, viewerTimer = null, lastPositionAt = 0;
  let mapConfig = null, destinations = [], currentPoint = null, selectedPlace = null, mapPanel = "", searchQuery = "", originQuery = "", emergencyRecipients = [];
  const fallbackPoint = { latitude: 11.5564, longitude: 104.9282, label: "Phnom Penh, Cambodia" };
  let mapPoint = fallbackPoint;
  const content = () => $("#safety-content");
  const mapContent = () => $("#explore-map-content");
  const shareLink = () => `${location.origin}/safety/live#${shareToken}`;
  const setNotice = message => { const node = $("#safety-notice") || $("#explore-map-notice"); if (node) node.textContent = message; };
  const phoneLink = phone => `tel:${encodeURIComponent(phone.replace(/[^+0-9]/g, ""))}`;
  const mapIcon = name => `<svg class="heroicon" aria-hidden="true"><use href="/icons.svg#${name}"></use></svg>`;
  const visibleSettings = () => { const view = $("#settings-view"); return Boolean(view && !view.hidden); };

  function contactsMarkup({ compact = false } = {}) {
    if (!auth.user) return `<div class="safety-contacts-empty"><p>Sign in to keep trusted contacts private to your account.</p><button class="button button-secondary" type="button" data-action="safety-sign-in">Sign in</button></div>`;
    if (!contacts.length) return `<p class="safety-empty">No trusted contacts yet.</p>`;
    return `<div class="safety-contact-list${compact ? " is-compact" : ""}">${contacts.map(item => `<div class="safety-contact"><span><strong>${esc(item.name)}</strong><small>${esc(item.phone)}</small></span><a href="${phoneLink(item.phone)}" aria-label="Call ${esc(item.name)}">Call</a>${compact ? "" : `<button type="button" data-action="safety-delete-contact" data-id="${esc(item.id)}" aria-label="Remove ${esc(item.name)}">Remove</button>`}</div>`).join("")}</div>`;
  }

  function contactFormMarkup() {
    return auth.user ? `<form id="safety-contact-form" class="safety-contact-form"><div class="safety-form-row"><label>Name<input id="safety-contact-name" name="name" maxlength="80" autocomplete="name" required /></label><label>Phone<input id="safety-contact-phone" name="phone" type="tel" maxlength="40" autocomplete="tel" required /></label><button class="button button-secondary" type="submit">Add contact</button></div></form>` : "";
  }

  function mapFrameMarkup(point = mapPoint) {
    const map = safetyMap(point.latitude, point.longitude);
    return map || `<div class="safety-map-fallback"><span>${mapIcon("map-pin")}</span><strong>Map unavailable</strong><small>Search for a place to see it here.</small></div>`;
  }

  function renderMapFrame(point = mapPoint) {
    const frame = $("#safety-map-frame");
    if (frame) frame.innerHTML = mapFrameMarkup(point);
    const label = $("#safety-map-place");
    if (label) label.textContent = point.label || "Selected location";
  }

  function renderMapView() {
    const target = mapContent();
    if (!target) return;
    const isLive = Boolean(session?.active);
    const locationLabel = mapPoint.label || fallbackPoint.label;
    let panel = "";
    if (mapPanel === "search") {
      panel = `<section class="map-overlay-panel map-search-panel" aria-label="Search places">
        <div class="map-overlay-head"><strong>Find a place</strong><button type="button" data-action="safety-close-panel" aria-label="Close search">${mapIcon("close")}</button></div>
        <form id="safety-destination-form"><label class="visually-hidden" for="safety-destination">Search places</label><div class="map-search-field">${mapIcon("search")}<input id="safety-destination" name="destination" value="${esc(searchQuery)}" placeholder="Search places or addresses" autocomplete="off" maxlength="120" required /><button type="submit">Search</button></div>
          <label class="map-origin-field" for="safety-origin">Starting place for directions <span>Optional</span></label><input id="safety-origin" name="origin" value="${esc(originQuery)}" placeholder="Use my current location" maxlength="120" autocomplete="off" />
        </form><div id="safety-destination-results" class="map-search-results">${searchResultsMarkup()}</div></section>`;
    } else if (mapPanel === "contacts") {
      panel = `<section class="map-overlay-panel map-contacts-panel" aria-label="Trusted contacts">
        <div class="map-overlay-head"><strong>Trusted contacts</strong><button type="button" data-action="safety-close-panel" aria-label="Close contacts">${mapIcon("close")}</button></div>
        ${contactsMarkup({ compact: true })}${session?.active && shareToken ? `<button class="button button-secondary map-contact-share" type="button" data-action="safety-send-in-app">${mapIcon("share")} Send live link in Qipi</button><div id="safety-share-recipients"></div>` : ""}
        <button type="button" class="map-overlay-link" data-action="safety-open-settings">Manage contacts in Settings ${mapIcon("arrow-right")}</button></section>`;
    } else if (mapPanel === "emergency") {
      const chatOptions = emergencyRecipients.map(item => `<option value="${esc(item.id)}">Qipi chat · ${esc(item.profile?.displayName || item.profile?.username || "Traveler")}</option>`).join("");
      const contactOptions = contacts.map(item => `<option value="contact:${esc(item.id)}">SMS · ${esc(item.name)}</option>`).join("");
      panel = `<section class="map-overlay-panel map-emergency-panel" aria-label="Emergency help">
        <div class="map-overlay-head"><strong>Ask for help</strong><button type="button" data-action="safety-close-panel" aria-label="Close emergency panel">${mapIcon("close")}</button></div>
        <p class="safety-small">Choose what is happening, then send your location to someone you choose.</p>
        <label for="safety-emergency-type">I need help with</label><select id="safety-emergency-type"><option value="Need urgent help">Urgent help</option><option value="Medical emergency">Medical help</option><option value="Vehicle breakdown">Vehicle breakdown</option><option value="Lost and need directions">I am lost</option><option value="I feel unsafe">I feel unsafe</option><option value="Other emergency">Other</option></select>
        <label for="safety-emergency-note">Add a note <span>Optional</span></label><textarea id="safety-emergency-note" maxlength="500" rows="3" placeholder="What should they know?"></textarea>
        <label for="safety-emergency-recipient">Send to</label><select id="safety-emergency-recipient"><option value="device">Someone nearby (share from this device)</option>${contactOptions}${chatOptions}</select>
        ${!auth.user ? `<p class="safety-small">Sign in to send an alert in Qipi. You can still share from your device.</p>` : ""}
        <button class="button button-danger map-emergency-send" type="button" data-action="safety-emergency-share">${mapIcon("share")} Share emergency location</button>
        <details class="safety-emergency-calls"><summary>Call emergency services in Cambodia</summary><div class="safety-emergency-list"><a href="tel:117"><strong>Police</strong><span>117 · Call</span></a><a href="tel:118"><strong>Fire</strong><span>118 · Call</span></a><a href="tel:119"><strong>Ambulance</strong><span>119 · Call</span></a></div><small>Qipi does not dispatch rescue services. These numbers may go unanswered or lack English speakers. <a href="https://www.gov.uk/foreign-travel-advice/cambodia/getting-help" target="_blank" rel="noopener noreferrer">Source: UK FCDO</a>.</small></details>
      </section>`;
    } else if (mapPanel === "checkin") {
      panel = `<section class="map-overlay-panel map-checkin-panel" aria-label="Safety check-in">
        <div class="map-overlay-head"><strong>Check in</strong><button type="button" data-action="safety-close-panel" aria-label="Close check-in">${mapIcon("close")}</button></div>
        <p class="safety-small">Record that you are safe or have arrived. This does not notify contacts.</p>
        ${auth.user ? `<div class="safety-inline"><button class="button button-secondary" type="button" data-action="safety-checkin" data-status="safe">I’m safe</button><button class="button button-secondary" type="button" data-action="safety-checkin" data-status="arrived">I’ve arrived</button></div><div id="safety-checkins">${checkins.slice(0, 3).map(item => `<p class="safety-checkin">${item.status === "arrived" ? "Arrived" : "Safe"} · ${esc(new Date(item.createdAt).toLocaleString())}</p>`).join("")}</div>` : `<button class="button button-secondary" type="button" data-action="safety-sign-in">Sign in to check in</button>`}
      </section>`;
    }
    target.innerHTML = `<div class="explore-map-shell">
      <div class="explore-map-frame" id="safety-map-frame" aria-label="Map centered on ${esc(locationLabel)}">${mapFrameMarkup()}</div>
      <div class="explore-map-overlay">
        <div class="map-control-row">
          <button class="map-control-button" type="button" data-action="safety-open-panel" data-panel="search">${mapIcon("search")}<span>Search</span></button>
          <button class="map-control-button" type="button" data-action="safety-open-panel" data-panel="contacts">${mapIcon("users")}<span>Contacts</span></button>
          <button class="map-live-toggle${isLive ? " is-on" : ""}" type="button" role="switch" aria-checked="${String(isLive)}" data-action="safety-toggle-live"><span class="map-toggle-track"><i></i></span><span class="map-live-copy"><strong>Live location</strong><small>${isLive ? "On" : "Off"}</small></span></button>
          <button class="map-emergency-button" type="button" data-action="safety-open-panel" data-panel="emergency">${mapIcon("shield-check")}<span>Emergency</span></button>
        </div>
        <div class="map-place-pill" id="safety-map-place"><span>${mapIcon("map-pin")}</span>${esc(locationLabel)}${mapPoint?.accuracy ? `<small>±${Math.round(mapPoint.accuracy)} m</small>` : ""}</div>
        <div class="map-bottom-controls"><button class="map-control-button map-checkin-button" type="button" data-action="safety-check-in-panel">${mapIcon("check")}<span>Check in</span></button><button class="map-locate-button" type="button" data-action="safety-locate" aria-label="Locate me" title="Locate me">${mapIcon("map-pin")}</button></div>
        ${panel}<p id="explore-map-notice" class="map-status-notice" role="status"></p>
      </div>
    </div>`;
    mapContent().setAttribute("aria-busy", "false");
  }

  function searchResultsMarkup() {
    if (!destinations.length) return searchQuery ? `<p class="safety-small">Search for a place in Cambodia.</p>` : `<p class="safety-small">Search to choose a place on the map.</p>`;
    return `<div class="safety-destinations">${destinations.map((item, index) => `<button type="button" class="${selectedPlace?.name === item.name ? "is-selected" : ""}" data-action="safety-select-destination" data-index="${index}"><span>${mapIcon("map-pin")}</span><strong>${esc(item.name)}</strong></button>`).join("")}</div>${selectedPlace ? `<button type="button" class="map-directions-button" data-action="safety-choose-destination" data-index="${destinations.indexOf(selectedPlace)}">${mapIcon("arrow-up-right")} Get directions to ${esc(selectedPlace.name)}</button><div id="safety-destination-results"></div>` : ""}`;
  }

  function renderSettingsContacts() {
    const target = $("#settings-trusted-contacts");
    if (!target) return;
    target.innerHTML = `${contactsMarkup()}${contactFormMarkup()}`;
  }

  function renderCurrentSurface() {
    if (visibleSettings()) renderSettingsContacts();
    else renderMapView();
  }

  function stopWatch() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  function stopViewerPoll() { if (viewerTimer) clearInterval(viewerTimer); viewerTimer = null; }
  function leave() { stopViewerPoll(); }

  async function loadPrivate() {
    if (!auth.user) { contacts = []; checkins = []; session = null; shareToken = ""; renderCurrentSurface(); return; }
    try {
      const [contactResult, checkinResult, sessionResult] = await Promise.all([
        api("/api/safety/contacts"), api("/api/safety/checkins"), api("/api/safety/sessions")
      ]);
      contacts = contactResult.contacts;
      checkins = checkinResult.checkins;
      const active = sessionResult.sessions.find(item => item.active);
      session = active || null;
      shareToken = active ? sessionStorage.getItem(`qipi:safety-token:${active.id}`) || "" : "";
      renderCurrentSurface();
      if (session && shareToken) beginWatch();
    } catch (error) { setNotice(error.message || "Safety data could not load. Apply the safety database migration."); }
  }

  async function openExploreMap() {
    stopViewerPoll();
    mapPanel = "";
    setPageView("explore");
    mapPoint = selectedPlace || currentPoint || fallbackPoint;
    renderMapView();
    try { mapConfig = await api("/api/config"); } catch { mapConfig = null; }
    await loadPrivate();
    void currentLocation();
  }

  async function updateViewer() {
    const token = location.hash.slice(1);
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) { content().innerHTML = `<section class="safety-panel"><h1>Share link not found</h1></section>`; return; }
    try {
      const { session: live } = await api("/api/safety/live", { headers: { "x-qipi-share-token": token } });
      const time = live.positionAt ? new Date(live.positionAt).toLocaleString() : "Waiting for the traveler to share a position";
      const stale = !live.positionAt || Date.now() - Date.parse(live.positionAt) > 30_000;
      content().innerHTML = `<section class="safety-panel"><h2>Shared location</h2><p>Last update: ${esc(time)}</p>${stale ? `<p class="safety-stale" role="alert">Location is not updating right now. Do not rely on this map alone in an emergency.</p>` : ""}${safetyMap(live.latitude, live.longitude) || `<p>Location has not been received yet.</p>`}<p class="safety-small">Accuracy: ${live.accuracy == null ? "unknown" : `${Math.round(live.accuracy)} m`}. Sharing expires at ${esc(new Date(live.expiresAt).toLocaleString())}. Qipi cannot guarantee continuous updates.</p><button class="button button-ghost" type="button" data-action="safety-refresh-live">Refresh location</button></section>`;
    } catch { content().innerHTML = `<section class="safety-panel"><h2>Location sharing ended</h2><p>This link expired, was stopped, or is unavailable.</p></section>`; stopViewerPoll(); }
  }
  async function openLive() {
    leave();
    setPageView("safety-live", { preserveUrl: true });
    content().innerHTML = `<section class="safety-panel"><p>Loading shared location…</p></section>`;
    await updateViewer();
    viewerTimer = setInterval(() => { if (!document.hidden) updateViewer(); }, 15000);
  }

  async function submitContact(form) {
    const data = Object.fromEntries(new FormData(form));
    const { contact } = await api("/api/safety/contacts", { method: "POST", data });
    contacts.unshift(contact);
    renderCurrentSurface();
    toast("Trusted contact saved");
  }
  async function deleteContact(id) {
    await api(`/api/safety/contacts/${encodeURIComponent(id)}`, { method: "DELETE" });
    contacts = contacts.filter(item => item.id !== id);
    renderCurrentSurface();
    toast("Contact removed");
  }
  async function loadContactsForSettings() {
    if (!auth.user) { contacts = []; renderSettingsContacts(); return; }
    const target = $("#settings-trusted-contacts");
    if (target) target.innerHTML = `<p class="safety-small" role="status">Loading contacts…</p>`;
    try {
      const result = await api("/api/safety/contacts");
      contacts = result.contacts;
      renderSettingsContacts();
    } catch (error) {
      if (target) target.innerHTML = `<p class="safety-small" role="alert">${esc(error.message || "Contacts could not load")}</p>`;
    }
  }
  async function toggleLiveLocation() {
    if (!auth.user) { openAuth("signin"); return; }
    if (session?.active) await stopShare();
    else await startShare();
  }
  async function checkIn(status) {
    const { checkin } = await api("/api/safety/checkins", { method: "POST", data: { status } });
    checkins.unshift(checkin);
    renderCurrentSurface();
    toast("Check-in recorded");
  }
  async function startShare() {
    const firstPosition = await position(); // Ask for permission before creating a link.
    currentPoint = { latitude: firstPosition.coords.latitude, longitude: firstPosition.coords.longitude, accuracy: firstPosition.coords.accuracy, label: "Your current location" };
    mapPoint = currentPoint;
    const minutes = Number($("#safety-duration")?.value || 30);
    const result = await api("/api/safety/sessions", { method: "POST", data: { minutes } });
    session = result.session;
    shareToken = result.token;
    sessionStorage.setItem(`qipi:safety-token:${session.id}`, shareToken);
    renderCurrentSurface();
    try {
      const { latitude, longitude, accuracy } = firstPosition.coords;
      const response = await api(`/api/safety/sessions/${session.id}`, { method: "PATCH", data: { latitude, longitude, accuracy } });
      session = response.session;
      lastPositionAt = Date.now();
      renderCurrentSurface();
    } catch { setNotice("The link is active, but your first location update failed. Check your connection."); }
    beginWatch();
    toast("Live location is on. Open Contacts to share your private link.");
  }
  function beginWatch() {
    stopWatch();
    if (!session?.active || !shareToken || document.hidden || !navigator.geolocation) return;
    watchId = navigator.geolocation.watchPosition(async result => {
      if (Date.now() - lastPositionAt < 10000) return;
      lastPositionAt = Date.now();
      try {
        const response = await api(`/api/safety/sessions/${session.id}`, { method: "PATCH", data: { latitude: result.coords.latitude, longitude: result.coords.longitude, accuracy: result.coords.accuracy } });
        session = response.session;
        currentPoint = mapPoint = { latitude: result.coords.latitude, longitude: result.coords.longitude, accuracy: result.coords.accuracy, label: "Your current location" };
        renderMapFrame(mapPoint);
        if (!session.active) stopWatch();
        const status = $(".safety-status + .safety-inline + .safety-small");
        if (status) status.textContent = `Last update: ${new Date(session.positionAt).toLocaleTimeString()}`;
      } catch (error) { stopWatch(); setNotice(error.message || "Location updates stopped. Check your connection."); }
    }, error => { stopWatch(); setNotice(locationError(error)); }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
  }
  async function stopShare() {
    stopWatch();
    if (session) await api(`/api/safety/sessions/${session.id}`, { method: "PATCH", data: { stop: true } });
    if (session) sessionStorage.removeItem(`qipi:safety-token:${session.id}`);
    session = null; shareToken = ""; renderCurrentSurface(); toast("Live location turned off");
  }
  async function copyLink() {
    if (!shareToken) return;
    if (navigator.share) { try { await navigator.share({ title: "My Qipi location", url: shareLink() }); return; } catch {} }
    try { await navigator.clipboard.writeText(shareLink()); toast("Share link copied"); }
    catch { window.prompt("Copy this link", shareLink()); }
  }
  async function listShareRecipients() {
    const target = $("#safety-share-recipients");
    if (!target || !shareToken) return;
    target.innerHTML = `<p class="safety-small" role="status">Loading conversations…</p>`;
    try {
      const { conversations } = await api("/api/conversations");
      target.innerHTML = conversations.length ? `<p class="safety-small">Choose who receives this private location link:</p><div class="safety-destinations">${conversations.map(item => `<button type="button" data-action="safety-send-recipient" data-id="${esc(item.id)}">${esc(item.profile?.displayName || item.profile?.username || "Traveler")}</button>`).join("")}</div>` : `<p class="safety-small">No Qipi conversations yet. Copy the link to send it another way.</p>`;
    } catch (error) { target.innerHTML = `<p class="safety-small">${esc(error.message || "Conversations could not load")}</p>`; }
  }
  async function sendShareToConversation(conversationId) {
    if (!shareToken || !/^[0-9a-f-]{36}$/i.test(conversationId)) return;
    await api(`/api/messages/${conversationId}`, { method: "POST", data: { body: `I'm sharing my live Qipi location with you: ${shareLink()}\nThis link expires at ${new Date(session.expiresAt).toLocaleString()}.` } });
    const target = $("#safety-share-recipients");
    if (target) target.innerHTML = `<p class="safety-small" role="status">Location link sent in Qipi Messages.</p>`;
    toast("Location link sent");
  }
  async function currentLocation() {
    try {
      const result = await position();
      const { latitude, longitude, accuracy } = result.coords;
      currentPoint = { latitude, longitude, accuracy, label: "Your current location" };
      mapPoint = currentPoint;
      selectedPlace = null;
      renderMapFrame(mapPoint);
      const label = $("#safety-map-place");
      if (label) label.innerHTML = `<span>${mapIcon("map-pin")}</span>Your current location<small>±${Math.round(accuracy)} m</small>`;
      return { latitude, longitude };
    } catch (error) {
      setNotice(error?.code === 1 ? "Location access is off. Tap the pin to retry." : "Location unavailable. Showing Cambodia.");
      return null;
    }
  }
  async function shareCurrent() {
    const point = await currentLocation();
    if (!point) return;
    const url = `https://www.openstreetmap.org/?mlat=${point.latitude.toFixed(5)}&mlon=${point.longitude.toFixed(5)}#map=15/${point.latitude.toFixed(5)}/${point.longitude.toFixed(5)}`;
    if (navigator.share) { try { await navigator.share({ title: "My current location", url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); toast("Location link copied"); }
    catch { window.prompt("Copy this location link", url); }
  }
  async function destination(form) {
    const query = String(new FormData(form).get("destination") || "").trim();
    if (!query) return;
    originQuery = String(new FormData(form).get("origin") || "").trim();
    searchQuery = query;
    destinations = [];
    selectedPlace = null;
    renderMapView();
    const target = $("#safety-destination-results");
    if (!mapConfig?.maptilerPublicKey) {
      target.innerHTML = `<p class="safety-small">Destination search will be available here once a map key is configured. <a href="https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer">Search on OpenStreetMap</a>.</p>`;
      return;
    }
    target.innerHTML = `<p class="safety-small" role="status">Finding destinations…</p>`;
    try {
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?limit=5&country=kh&key=${encodeURIComponent(mapConfig.maptilerPublicKey)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Destination search is unavailable. Try again.");
      const payload = await response.json();
      destinations = (payload.features || []).filter(item => Array.isArray(item.center) && item.center.length === 2).slice(0, 5).map(item => ({
        name: String(item.place_name || item.text || query), longitude: Number(item.center[0]), latitude: Number(item.center[1])
      }));
      if (!destinations.length) { if (target) target.innerHTML = `<p class="safety-small">No matching place found.</p>`; return; }
      if (target) target.innerHTML = searchResultsMarkup();
    } catch (error) { target.innerHTML = `<p class="safety-small" role="alert">${esc(error.message)}</p>`; }
  }
  function selectDestination(index) {
    const selected = destinations[index];
    if (!selected) return;
    selectedPlace = selected;
    mapPoint = { ...selected, label: selected.name };
    renderMapView();
  }
  async function chooseDestination(index) {
    const chosen = destinations[index];
    if (!chosen) return;
    selectedPlace = chosen;
    mapPoint = { ...chosen, label: chosen.name };
    renderMapFrame(mapPoint);
    const target = $("#safety-destination-results");
    if (!target) return;
    target.innerHTML = `<p class="safety-small" role="status">Finding directions to ${esc(chosen.name)}…</p>`;
    let point = currentPoint;
    if (!point) {
      const startingPlace = $("#safety-origin")?.value.trim() || originQuery;
      if (startingPlace && mapConfig?.maptilerPublicKey) {
        try {
          const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(startingPlace)}.json?limit=1&country=kh&key=${encodeURIComponent(mapConfig.maptilerPublicKey)}`);
          if (!response.ok) throw new Error("Starting place search is unavailable");
          const feature = (await response.json()).features?.[0];
          if (!Array.isArray(feature?.center) || feature.center.length !== 2) throw new Error("Starting place not found. Try a nearby town or landmark.");
          point = { longitude: Number(feature.center[0]), latitude: Number(feature.center[1]) };
        } catch (error) {
          target.innerHTML = `<p class="safety-small" role="alert">${esc(error.message || "Starting place not found")}. Destination shown on the map.</p>`;
          return;
        }
      } else {
        try {
          const result = await position();
          point = currentPoint = { latitude: result.coords.latitude, longitude: result.coords.longitude };
        } catch {
          target.innerHTML = `<p class="safety-small">${esc(locationError({ code: 2 }))} Enter a starting place above to get directions.</p>`;
          return;
        }
      }
    }
    const mapsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${point.latitude.toFixed(5)}%2C${point.longitude.toFixed(5)}%3B${chosen.latitude.toFixed(5)}%2C${chosen.longitude.toFixed(5)}`;
    try {
      const route = await api("/api/map/directions", { method: "POST", data: { start: [point.longitude, point.latitude], end: [chosen.longitude, chosen.latitude] } });
      const kilometers = (route.distance / 1000).toFixed(1);
      const minutes = Math.max(1, Math.round(route.duration / 60));
      target.innerHTML = `<div class="safety-route"><h3>${esc(chosen.name)}</h3><p>${kilometers} km · about ${minutes} min driving</p><ol>${route.steps.map(step => `<li>${esc(step.instruction)}</li>`).join("")}</ol><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Open route in OpenStreetMap</a></div>`;
    } catch (error) {
      target.innerHTML = `<p class="safety-small">${esc(error.message || "Directions could not load")}. <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Open route on OpenStreetMap</a>.</p>`;
    }
  }
  async function openMapPanel(panel) {
    mapPanel = panel;
    emergencyRecipients = [];
    renderMapView();
    if (panel === "emergency" && auth.user) {
      try {
        const result = await api("/api/conversations");
        emergencyRecipients = result.conversations || [];
        if (mapPanel === "emergency") renderMapView();
      } catch { /* The emergency share sheet and saved phone contacts remain available. */ }
    }
    if (panel === "search") $("#safety-destination")?.focus({ preventScroll: true });
  }
  function closeMapPanel() { mapPanel = ""; renderMapView(); }

  async function shareEmergency() {
    const kind = $("#safety-emergency-type")?.value || "Need urgent help";
    const note = String($("#safety-emergency-note")?.value || "").trim();
    const recipient = $("#safety-emergency-recipient")?.value || "device";
    let point;
    try {
      const result = await position();
      point = { latitude: result.coords.latitude, longitude: result.coords.longitude, accuracy: result.coords.accuracy };
      currentPoint = mapPoint = { ...point, label: "Your current location" };
      renderMapFrame(mapPoint);
    } catch (error) {
      setNotice(locationError(error));
      return;
    }
    const mapUrl = `https://www.openstreetmap.org/?mlat=${point.latitude.toFixed(6)}&mlon=${point.longitude.toFixed(6)}#map=16/${point.latitude.toFixed(6)}/${point.longitude.toFixed(6)}`;
    const message = [`Qipi emergency: ${kind}`, note, `My location: ${mapUrl}`, `Location accuracy: about ${Math.round(point.accuracy)} m`].filter(Boolean).join("\n");
    if (recipient.startsWith("contact:")) {
      const contact = contacts.find(item => item.id === recipient.slice("contact:".length));
      if (!contact) throw new Error("Choose a saved trusted contact");
      location.href = `sms:${contact.phone.replace(/[^+0-9]/g, "")}?body=${encodeURIComponent(message)}`;
      toast("Emergency message opened in your SMS app");
    } else if (recipient !== "device") {
      if (!auth.user) { openAuth("signin"); return; }
      if (!/^[0-9a-f-]{36}$/i.test(recipient)) throw new Error("Choose a valid Qipi conversation");
      await api(`/api/messages/${recipient}`, { method: "POST", data: { body: message } });
      toast("Emergency message sent in Qipi Messages");
    } else if (navigator.share) {
      await navigator.share({ title: "Qipi emergency", text: message });
    } else {
      try { await navigator.clipboard.writeText(message); toast("Emergency message and location copied. Send it to someone nearby."); }
      catch { window.prompt("Copy this emergency message", message); }
    }
    mapPanel = "";
    renderMapView();
  }
  function emergency() { void openMapPanel("emergency"); }
  function onVisibility() { if (document.hidden) stopWatch(); else if (session?.active && shareToken) beginWatch(); if (!document.hidden && location.pathname === "/safety/live") updateViewer(); }
  document.addEventListener("visibilitychange", onVisibility);
  return { openExploreMap, openLive, leave, submitContact, deleteContact, loadContactsForSettings, renderSettingsContacts, checkIn, startShare, stopShare, toggleLiveLocation, copyLink, listShareRecipients, sendShareToConversation, currentLocation, shareCurrent, destination, selectDestination, chooseDestination, emergency, openMapPanel, closeMapPanel, shareEmergency, updateViewer, openAuth };
}
