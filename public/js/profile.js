import { profileTabs, PROFILE_TABS } from "./profile-tabs.js";
import { profileCardMarkup } from "./profile-card.js";
import { $, esc, icon, profileUsernameForId } from "./core.js";

export function createProfileController({ state, auth, t, label, displayName, usernameFromPath, setLink, setPageView, api, renderFilter, renderRoutes, refreshMe, renderLoadingError, toast, dateParts, dateLabel, routeFor, avatarContents, appMediaUrl, skeletonPostsMarkup, tripCardMarkup, loadSavedTrips }) {
  async function openProfile(id, deepLink = true, tab = "posts") {
    const requestId = ++state.profileRequestId;
    if (state.view !== "profile") state.profileReturnView = state.view === "entry" ? "feed" : state.view;
    const knownProfile = state.profile?.id === id ? state.profile : null;
    const knownTrip = [...state.trips, ...state.savedTripRecords].find((trip) => trip.profileId === id);
    state.profileUsername = id === usernameFromPath()
      ? id
      : (auth.user?.id === id ? state.me?.profile?.username : "") || knownProfile?.username || profileUsernameForId(id, auth.user?.id === id ? displayName() : knownProfile?.displayName || knownTrip?.hostName);
    state.profileTab = ["posts", "saved", "joining"].includes(tab) ? tab : "posts";
    state.profile = null;
    state.profileEditing = false;
    state.profileId = id;
    if (deepLink) setLink("profile", state.profileUsername);
    renderProfileLoading();
    setPageView("profile", { preserveUrl: !deepLink });
    try {
      const [profileResult, routeResult] = await Promise.all([
        api(`/api/profiles/${encodeURIComponent(id)}`),
        state.routes.length ? Promise.resolve(null) : api("/api/routes").catch(() => null),
        auth.user?.id === id ? refreshMe() : Promise.resolve(null)
      ]);
      if (requestId !== state.profileRequestId || state.view !== "profile") return;
      if (routeResult) { state.routes = routeResult.routes; renderFilter(); renderRoutes(); }
      state.profileId = profileResult.profile.id;
      state.profileUsername = profileResult.profile.username || state.profileUsername;
      state.profile = { ...profileResult.profile, trips: profileResult.trips };
      if (location.pathname !== "/" + encodeURIComponent(state.profileUsername)) setLink("profile", state.profileUsername);
      if (auth.user?.id === state.profileId) {
        // A username URL only reveals the owner after the profile response arrives.
        if (id !== auth.user.id) await refreshMe();
        if (requestId !== state.profileRequestId || state.view !== "profile") return;
        if (state.profileTab === "saved") await loadSavedTrips();
      } else state.profileTab = "posts";
      if (requestId !== state.profileRequestId || state.view !== "profile") return;
      setLink("profile", state.profileUsername);
      renderProfile();
    } catch (error) {
      if (requestId === state.profileRequestId) {
        renderLoadingError("#profile-content", "retry-profile", id);
        toast(error.message || t("failed"));
      }
    }
  }

  function renderProfileLoading() {
    const content = $("#profile-content");
    if (!content) return;
    content.setAttribute("aria-busy", "true");
    content.innerHTML = `<div class="skeleton-profile" aria-hidden="true"><div class="skeleton-profile-cover"></div><div class="skeleton-profile-card"><i class="skeleton-profile-avatar"></i><div class="skeleton-profile-title"><b></b><span></span></div><div class="skeleton-profile-actions"><i></i><i></i></div><div class="skeleton-profile-stats"><i></i><i></i><i></i><i></i></div><span class="skeleton-copy"></span><span class="skeleton-copy short"></span></div><div class="skeleton-profile-tabs"><i></i><i></i><i></i></div><div class="skeleton-profile-posts">${skeletonPostsMarkup(2)}</div></div>`;
  }

  function renderProfile() {
    const content = $("#profile-content");
    if (!content) return;
    if (!state.profile) return;
    const { profile, trips } = { profile: state.profile, trips: state.profile.trips || [] };
    const isFollowing = Boolean(profile.followedByViewer);
    const isOwnProfile = auth.user?.id === profile.id;
    const activeTab = isOwnProfile ? state.profileTab : "posts";
    const joinedTrips = isOwnProfile ? (state.me?.requests || []) : [];
    content.setAttribute("aria-busy", "false");
    content.innerHTML = `${profileCardMarkup({ profile, trips, isOwnProfile, isFollowing, isEditing: state.profileEditing, t, avatarContents })}
    ${profileTabs({ active: activeTab, t, tabs: isOwnProfile ? PROFILE_TABS : PROFILE_TABS.slice(0, 1) })}
    <div id="profile-tab-panel" role="region" aria-label="${esc(t(activeTab === 'saved' ? 'saved' : activeTab === 'joining' ? 'joining' : 'profilePosts'))}">
    ${activeTab === "posts" ? `<section class="profile-posts"><div class="feed-section-head"><h2>${esc(t("profilePosts"))}</h2></div><div class="trip-list">${trips.length ? trips.map(tripCardMarkup).join("") : `<div class="empty-trips"><h3>${esc(t("noPosts"))}</h3></div>`}</div></section>` : activeTab === "joining" ? `<section class="profile-posts profile-joined-trips"><div class="feed-section-head"><h2>${esc(t("joining"))}</h2></div><div class="my-list">${joinedTrips.length ? joinedTrips.map(({ trip, status }) => `<div class="my-card"><div><strong>${esc(trip.title)}</strong><p>${esc(dateLabel(trip.date))} · ${esc(status === "approved" ? t("requestApproved") : status === "declined" ? t("requestDeclined") : t("requestPending"))}</p></div><button type="button" data-action="open-trip" data-id="${esc(trip.id)}">${esc(t("open"))} ${icon("arrow-up-right")}</button></div>`).join("") : `<div class="empty-trips"><h3>${esc(t("noJoined"))}</h3></div>`}</div></section>` : savedCollectionMarkup()}
    </div>`;
  }

  function savedCollectionMarkup() {
    if (state.savedLoading) return `<div class="trip-list" aria-busy="true">${skeletonPostsMarkup(2)}</div>`;
    if (state.savedError) return `<div class="feed-load-error" role="alert"><p>${esc(t("feedLoadError"))}</p><button class="button button-ghost" type="button" data-action="retry-saved">${esc(t("retry"))}</button></div>`;
    const trips = state.savedTripRecords.filter(trip => state.savedTrips.includes(trip.id));
    return `<div class="trip-list">${trips.length ? trips.map(tripCardMarkup).join("") : `<div class="empty-trips"><h3>${esc(t("savedEmptyTitle"))}</h3><p>${esc(t("savedEmptyBody"))}</p><button class="button button-primary" type="button" data-action="back-to-feed">${esc(t("home"))}</button></div>`}</div>`;
  }
  async function selectProfileTab(tab) {
    if (!state.profile || !["posts", "joining", "saved"].includes(tab)) return;
    if (auth.user?.id !== state.profile.id && tab !== "posts") return;
    state.profileTab = tab;
    state.profileEditing = false;
    setLink("profile", state.profileUsername);
    if (tab === "saved") await loadSavedTrips();
    renderProfile();
  }
  return { openProfile, renderProfileLoading, renderProfile, selectProfileTab };
}
