import { esc, icon } from "./core.js";

// Shared by feed, search, profile, and saved collections. No fetching or DOM writes.
export function createTripCard({ state, t, label, dateParts, dateLabel, routeFor, avatarContents, appMediaUrl }) {
  function tripCardMarkup(trip) {
    const date = dateParts(trip.date);
    const route = routeFor(trip.routeId);
    const saved = state.savedTrips.includes(trip.id);
    const liked = Boolean(trip.likedByViewer);
    const likePending = state.pendingLikes.has(trip.id);
    const isHost = Boolean(state.hostKeys[trip.id] || state.me?.trips.some((owned) => owned.id === trip.id));
    const request = state.me?.requests.find((item) => item.trip.id === trip.id);
    const isRequested = Boolean(request || state.requestKeys[trip.id]);
    const ctaAction = isHost || isRequested || trip.availableSpots === 0 ? "open-trip" : "join-trip";
    const ctaLabel = isHost ? t("manageRequests") : isRequested
      ? t(request?.status === "approved" ? "requestApproved" : request?.status === "declined" ? "requestDeclined" : "requestPending")
      : trip.availableSpots === 0 ? t("fullTrip") : t("requestJoin");
    const transport = trip.transport === "motorbike" ? t("motorbike") : trip.transport === "car" ? t("car") : t("mixed");
    const author = `<span class="post-avatar">${avatarContents(trip.hostName, trip.hostAvatarPath || "")}</span><span class="post-byline"><strong>${esc(trip.hostName)} ${trip.hostVerified ? `<span class="verified-dot" title="${esc(t("member"))}">${icon("check")}</span>` : ""}</strong><small>${esc(t("guestHost"))} · ${esc(dateLabel(trip.date))}</small></span>`;
    return `<article class="trip-card">
      <div class="post-head">${trip.profileId ? `<button class="post-profile-link" type="button" data-action="open-profile" data-id="${esc(trip.profileId)}">${author}</button>` : `<span class="post-profile-static">${author}</span>`}<button class="post-save ${saved ? "saved" : ""}" type="button" data-action="toggle-save" data-id="${esc(trip.id)}" aria-label="${esc(t(saved ? "unsave" : "save"))}">${icon("bookmark")}</button></div>
      <div class="post-media ${esc(route?.accent || "weekend")} ${trip.mediaPath ? "has-upload" : ""}" aria-hidden="true">${trip.mediaPath ? `<img class="post-media-image" src="${esc(appMediaUrl(trip.mediaPath))}" alt="" loading="lazy" decoding="async" />` : `<span class="post-media-hill"></span><span class="post-media-road"></span><span class="post-media-title">${esc(label(route?.title))}</span>`}</div>
      <h3 class="post-title">${esc(trip.title)}</h3><p class="post-note">${esc((trip.notes || `${label(routeFor(trip.routeId)?.title)} · ${trip.meetingArea}`).slice(0, 170))}</p>
      <div class="post-journey"><span class="post-date"><strong>${date.day}</strong><small>${date.month}</small></span><span class="post-route"><strong>${esc(label(routeFor(trip.routeId)?.title))}</strong><small>${esc(trip.meetingArea)} · ${esc(trip.departureTime)} · ${esc(transport)}</small></span><span class="post-spots">${trip.availableSpots} ${esc(t("spots"))}</span></div>
      <div class="post-actions"><button class="post-like post-utility-action ${liked ? "liked" : ""}" type="button" data-action="toggle-like" data-id="${esc(trip.id)}" aria-pressed="${liked}" aria-busy="${likePending}" ${likePending ? "disabled" : ""} aria-label="${esc(t(liked ? "unlike" : "like"))}">${icon("heart")}<span class="like-count">${Number(trip.likesCount) || 0}</span></button><button class="post-utility-action" type="button" data-action="share-trip" data-id="${esc(trip.id)}" aria-label="${esc(t("shareTrip"))}" title="${esc(t("shareTrip"))}">${icon("share")}</button><button class="post-utility-action" type="button" data-action="open-trip" data-id="${esc(trip.id)}" aria-label="${esc(t("discussTrip"))}" title="${esc(t("discussTrip"))}">${icon("chat")}</button><button type="button" data-action="${ctaAction}" data-id="${esc(trip.id)}">${esc(ctaLabel)} ${icon("arrow-right")}</button></div>
    </article>`;
  }

  return tripCardMarkup;
}
