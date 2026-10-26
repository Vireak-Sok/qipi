import { TRAVEL_OPTIONS } from "./shared.js";
import { esc, icon, dateToday } from "./core.js";

function editProfileForm({ profile, styles, t, avatarContents }) {
  return `<form class="profile-edit-form" id="profile-edit-form">
    <div class="profile-photo-edit"><span class="profile-avatar">${avatarContents(profile.displayName, profile.avatarPath || "")}</span><div><label class="photo-upload-button" for="profile-avatar-file">${esc(t("changeProfilePhoto"))}</label><input id="profile-avatar-file" class="visually-hidden-file" type="file" accept="image/jpeg,image/png,image/webp" /></div></div>
    <div class="field"><label for="profile-edit-name">${esc(t("profileName"))}</label><input id="profile-edit-name" name="displayName" value="${esc(profile.displayName || "")}" minlength="2" maxlength="40" required /></div>
    <div class="field"><label for="profile-edit-home-base">${esc(t("signupHomeBase"))}</label><input id="profile-edit-home-base" name="homeBase" value="${esc(profile.homeBase || "")}" maxlength="80" /></div>
    <fieldset class="signup-interests"><legend>${esc(t("signupInterests"))}</legend><div class="signup-interest-grid">${TRAVEL_OPTIONS.map(([value, key]) => `<label><input type="checkbox" name="travelStyle" value="${value}" ${styles.includes(value) ? "checked" : ""} /><span>${esc(t(key))}</span></label>`).join("")}</div></fieldset>
    <div class="field"><label for="profile-edit-bio">${esc(t("signupBio"))}</label><textarea id="profile-edit-bio" name="bio" rows="3" maxlength="160">${esc(profile.bio || "")}</textarea></div>
    <div class="error-message" role="alert"></div><div class="profile-edit-actions"><button class="button button-ghost" type="button" data-action="cancel-profile-edit">${esc(t("cancelEdit"))}</button><button class="button button-primary" type="submit">${esc(t("saveProfile"))}</button></div>
  </form>`;
}

export function profileCardMarkup({ profile, trips, isOwnProfile, isFollowing, isEditing, t, avatarContents }) {
  const styles = profile.interests || [];
  const routeCount = Number(profile.routeCount) || new Set(trips.map((trip) => trip.routeId)).size;
  const upcomingCount = trips.filter((trip) => trip.date >= dateToday()).length;
  const action = isOwnProfile
    ? `<button class="button button-ghost profile-edit-trigger" type="button" data-action="edit-profile" aria-label="${esc(t("editProfile"))}">${icon("pencil")}<span>${esc(t("profileEditAction"))}</span></button>`
    : `<button class="button button-primary profile-follow ${isFollowing ? "is-following" : ""}" type="button" data-action="toggle-follow" data-id="${esc(profile.id)}" aria-label="${esc(t(isFollowing ? "following" : "follow"))}" aria-pressed="${isFollowing}">${icon(isFollowing ? "check" : "plus")}<span>${esc(t(isFollowing ? "following" : "follow"))}</span></button>`;
  const interestLabel = (interest) => {
    const key = `travel${interest.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join("")}`;
    const translated = t(key);
    return translated && translated !== key ? translated : interest.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return `<section class="profile-card settings-card">
    <div class="profile-cover ${profile.isDemo ? "is-demo" : "is-member"}" aria-hidden="true"></div>
    <div class="profile-card-main">
      <div class="profile-overview">
        <span class="profile-avatar profile-avatar-large">${avatarContents(profile.displayName, profile.avatarPath || "")}</span>
        <div class="profile-identity"><h2>${esc(profile.displayName || t("guestTraveler"))}</h2>${profile.username ? `<span class="profile-handle">@${esc(profile.username)}</span>` : ""}</div>
        <div class="profile-actions">${action}<button class="button button-ghost profile-share" type="button" data-action="share-profile" data-id="${esc(profile.id)}" aria-label="${esc(t("shareProfile"))}">${icon("share")}<span>${esc(t("profileShareAction"))}</span></button></div>
      </div>
      ${isEditing && isOwnProfile ? editProfileForm({ profile, styles, t, avatarContents }) : `<div class="profile-stats"><div><strong>${Number(profile.postCount) || 0}</strong><span>${esc(t("posts"))}</span></div><div><strong>${Number(profile.followerCount) || 0}</strong><span>${esc(t("followers"))}</span></div><div><strong>${routeCount}</strong><span>${esc(t("profileRoutes"))}</span></div><div><strong>${upcomingCount}</strong><span>${esc(t("profileUpcoming"))}</span></div></div>${profile.bio || styles.length ? `<div class="profile-about">${profile.bio ? `<p class="profile-bio">${esc(profile.bio)}</p>` : ""}${styles.length ? `<div class="profile-interests">${styles.map((interest) => `<span>${esc(interestLabel(interest))}</span>`).join("")}</div>` : ""}</div>` : ""}`}
    </div>
  </section>`;
}
