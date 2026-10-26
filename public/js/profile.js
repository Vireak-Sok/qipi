import { profileTabs } from "./profile-tabs.js";
import { TRAVEL_OPTIONS } from "./shared.js";
import { $, esc, icon, dateToday, profileUsernameForId } from "./core.js";

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
    content.innerHTML = `<div class="skeleton-profile" aria-hidden="true"><div class="skeleton-profile-cover"></div><div class="skeleton-profile-card"><i class="skeleton-profile-avatar"></i><div class="skeleton-profile-title"><b></b><span></span></div><div class="skeleton-profile-stats"><i></i><i></i><i></i><i></i></div><span class="skeleton-copy"></span><span class="skeleton-copy short"></span></div><div class="skeleton-profile-tabs"><i></i><i></i><i></i></div><div class="skeleton-profile-posts">${skeletonPostsMarkup(2)}</div></div>`;
  }

  function renderProfile() {
    const content = $("#profile-content");
    if (!content) return;
    if (!state.profile) return;
    const { profile, trips } = { profile: state.profile, trips: state.profile.trips || [] };
    const routeCount = Number(profile.routeCount) || new Set(trips.map((trip) => trip.routeId)).size;
    const location = [profile.homeBase, ...(profile.languages || [])].filter(Boolean).join(" · ");
    const styles = profile.interests || [];
    const isFollowing = Boolean(profile.followedByViewer);
    const isOwnProfile = auth.user?.id === profile.id;
    const activeTab = isOwnProfile ? state.profileTab : "posts";
    const joinedTrips = isOwnProfile ? (state.me?.requests || []) : [];
    const canFollow = !isOwnProfile;
    const editForm = isOwnProfile && state.profileEditing ? `<form class="profile-edit-form" id="profile-edit-form">
      <div class="profile-photo-edit"><span class="profile-avatar">${avatarContents(profile.displayName, profile.avatarPath || "")}</span><div><label class="photo-upload-button" for="profile-avatar-file">${esc(t("changeProfilePhoto"))}</label><input id="profile-avatar-file" class="visually-hidden-file" type="file" accept="image/jpeg,image/png,image/webp" /></div></div>
      <div class="field"><label for="profile-edit-name">${esc(t("profileName"))}</label><input id="profile-edit-name" name="displayName" value="${esc(profile.displayName || "")}" minlength="2" maxlength="40" required /></div>
      <div class="field"><label for="profile-edit-home-base">${esc(t("signupHomeBase"))}</label><input id="profile-edit-home-base" name="homeBase" value="${esc(profile.homeBase || "")}" maxlength="80" /></div>
      <fieldset class="signup-interests"><legend>${esc(t("signupInterests"))}</legend><div class="signup-interest-grid">${TRAVEL_OPTIONS.map(([value, key]) => `<label><input type="checkbox" name="travelStyle" value="${value}" ${styles.includes(value) ? "checked" : ""} /><span>${esc(t(key))}</span></label>`).join("")}</div></fieldset>
      <div class="field"><label for="profile-edit-bio">${esc(t("signupBio"))}</label><textarea id="profile-edit-bio" name="bio" rows="3" maxlength="160">${esc(profile.bio || "")}</textarea></div>
      <div class="error-message" role="alert"></div><div class="profile-edit-actions"><button class="button button-ghost" type="button" data-action="cancel-profile-edit">${esc(t("cancelEdit"))}</button><button class="button button-primary" type="submit">${esc(t("saveProfile"))}</button></div>
    </form>` : `<div class="profile-stats"><div><strong>${Number(profile.postCount) || 0}</strong><span>${esc(t("posts"))}</span></div><div><strong>${Number(profile.followerCount) || 0}</strong><span>${esc(t("followers"))}</span></div><div><strong>${routeCount}</strong><span>${esc(t("profileRoutes"))}</span></div><div><strong>${trips.filter((trip) => trip.date >= dateToday()).length}</strong><span>${esc(t("profileUpcoming"))}</span></div></div>
      ${profile.bio ? `<p class="profile-bio">${esc(profile.bio)}</p>` : ""}${styles.length ? `<div class="profile-interests">${styles.map((interest) => `<span>${esc(t(`travel${interest.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join("")}`) || interest)}</span>`).join("")}</div>` : ""}`;
    content.setAttribute("aria-busy", "false");
    content.innerHTML = `<section class="profile-card settings-card">
      <div class="profile-cover ${profile.isDemo ? "is-demo" : "is-member"}"><span class="profile-cover-mark">Qipi</span></div>
      <div class="profile-overview"><span class="profile-avatar profile-avatar-large">${avatarContents(profile.displayName, profile.avatarPath || "")}</span><div class="profile-identity">${profile.isDemo ? `<span class="profile-demo-label">${esc(t("demoProfile"))}</span>` : ""}<h2>${esc(profile.displayName || t("guestTraveler"))}</h2>${location ? `<small>${esc(location)}</small>` : ""}</div><div class="profile-actions">${isOwnProfile ? `<button class="button button-ghost profile-edit-trigger" type="button" data-action="edit-profile" aria-label="${esc(t("editProfile"))}">${icon("pencil")}<span>${esc(t("profileEditAction"))}</span></button>` : canFollow ? `<button class="button button-primary profile-follow ${isFollowing ? "is-following" : ""}" type="button" data-action="toggle-follow" data-id="${esc(profile.id)}" aria-pressed="${isFollowing}">${icon(isFollowing ? "check" : "plus")}<span>${esc(t(isFollowing ? "following" : "follow"))}</span></button>` : ""}<button class="button button-ghost profile-share" type="button" data-action="share-profile" data-id="${esc(profile.id)}" aria-label="${esc(t("shareProfile"))}">${icon("share")}<span>${esc(t("profileShareAction"))}</span></button></div></div>
      ${editForm}
    </section>
    ${isOwnProfile ? profileTabs({ active: activeTab, t }) : ""}
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
    if (auth.user?.id !== state.profile?.id || !["posts", "joining", "saved"].includes(tab)) return;
    state.profileTab = tab;
    state.profileEditing = false;
    setLink("profile", state.profileUsername);
    if (tab === "saved") await loadSavedTrips();
    renderProfile();
  }
  return { openProfile, renderProfileLoading, renderProfile, selectProfileTab };
}
