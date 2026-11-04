import { TRAVEL_OPTIONS } from "./shared.js";
import { esc, icon } from "./core.js";

function editProfileForm({ profile, styles, t, avatarContents }) {
  return `<form class="profile-edit-form" id="profile-edit-form">
    <h3 class="profile-edit-heading">${esc(t("editProfile"))}</h3>
    <div class="profile-edit-top"><span class="profile-avatar profile-edit-avatar">${avatarContents(profile.displayName, profile.avatarPath || "")}</span><div class="profile-edit-account"><strong>${esc(profile.displayName || t("guestTraveler"))}</strong></div><label class="profile-photo-button" for="profile-avatar-file">${esc(t("changeProfilePhoto"))}</label><input id="profile-avatar-file" class="visually-hidden-file" type="file" accept="image/jpeg,image/png,image/webp" /></div>
    <div class="profile-edit-fields"><div class="field"><label for="profile-edit-name">${esc(t("profileName"))}</label><input id="profile-edit-name" name="displayName" value="${esc(profile.displayName || "")}" minlength="2" maxlength="40" required /></div>
    <div class="field"><label for="profile-edit-username">${esc(t("username"))}</label><span class="profile-username-control"><input id="profile-edit-username" name="username" type="text" value="${esc(profile.username || "")}" minlength="3" maxlength="64" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="profile-edit-username-hint" required /><span class="profile-username-status" id="profile-edit-username-status" role="status" aria-live="polite"></span></span><small class="profile-username-hint" id="profile-edit-username-hint">${esc(t("usernameHint"))}</small></div>
    <div class="field"><label for="profile-edit-home-base">${esc(t("signupHomeBase"))}</label><input id="profile-edit-home-base" name="homeBase" value="${esc(profile.homeBase || "")}" maxlength="80" /></div></div>
    <fieldset class="signup-interests profile-edit-interests"><legend>${esc(t("signupInterests"))}</legend><div class="signup-interest-grid">${TRAVEL_OPTIONS.map(([value, key]) => `<label><input type="checkbox" name="travelStyle" value="${value}" ${styles.includes(value) ? "checked" : ""} /><span>${esc(t(key))}</span></label>`).join("")}</div></fieldset>
    <div class="field"><label for="profile-edit-bio">${esc(t("signupBio"))}</label><textarea id="profile-edit-bio" name="bio" rows="3" maxlength="160">${esc(profile.bio || "")}</textarea></div>
    <div class="error-message" role="alert"></div><div class="profile-edit-actions"><button class="button button-ghost" type="button" data-action="cancel-profile-edit">${esc(t("cancelEdit"))}</button><button class="button button-primary" type="submit">${esc(t("saveProfile"))}</button></div>
  </form>`;
}

export function profileCardMarkup({ profile, trips, isOwnProfile, isFollowing, isEditing, t, avatarContents }) {
  const styles = profile.interests || [];
  const action = isOwnProfile
    ? `<button class="button button-ghost profile-edit-trigger" type="button" data-action="edit-profile" aria-label="${esc(t("editProfile"))}">${icon("pencil")}<span>${esc(t("profileEditAction"))}</span></button>`
    : `<button class="button button-primary profile-follow ${isFollowing ? "is-following" : ""}" type="button" data-action="toggle-follow" data-id="${esc(profile.id)}" aria-label="${esc(t(isFollowing ? "following" : "follow"))}" aria-pressed="${isFollowing}">${icon(isFollowing ? "check" : "plus")}<span>${esc(t(isFollowing ? "following" : "follow"))}</span></button>${!profile.isDemo ? `<button class="button button-ghost profile-message" type="button" data-action="open-message" data-id="${esc(profile.id)}" aria-label="${esc(t("sendMessage"))}" title="${esc(t("sendMessage"))}">${icon("chat")}<span>${esc(t("sendMessage"))}</span></button>` : ""}`;
  const interestLabel = (interest) => {
    const key = `travel${interest.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join("")}`;
    const translated = t(key);
    return translated && translated !== key ? translated : interest.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return `<section class="profile-card profile-identity-card ${isOwnProfile ? "is-own-profile" : "is-public-profile"}" aria-label="${esc(profile.displayName || t("profilePageTitle"))}">
    <div class="profile-card-main">
      ${isEditing && isOwnProfile ? editProfileForm({ profile, styles, t, avatarContents }) : `<div class="profile-overview">
        <span class="profile-avatar profile-avatar-large">${avatarContents(profile.displayName, profile.avatarPath || "")}</span>
        <div class="profile-account-summary">
          <div class="profile-identity"><h2>${esc(profile.displayName || t("guestTraveler"))}</h2></div>
          <div class="profile-stats" aria-label="${esc(t("profilePageTitle"))} statistics"><div><strong>${Number(profile.postCount) || 0}</strong><span>${esc(t("posts"))}</span></div><div><strong>${Number(profile.followerCount) || 0}</strong><span>${esc(t("followers"))}</span></div><div><strong>${Number(profile.followingCount) || 0}</strong><span>${esc(t("following"))}</span></div></div>
        </div>
      </div>${profile.bio || styles.length ? `<div class="profile-about">${profile.bio ? `<p class="profile-bio">${esc(profile.bio)}</p>` : ""}${styles.length ? `<div class="profile-interests">${styles.map((interest) => `<span>${esc(interestLabel(interest))}</span>`).join("")}</div>` : ""}</div>` : ""}<div class="profile-actions">${action}<button class="button button-ghost profile-share" type="button" data-action="share-profile" data-id="${esc(profile.id)}" aria-label="${esc(t("shareProfile"))}">${icon("share")}<span>${esc(t("profileShareAction"))}</span></button></div>`}
    </div>
  </section>`;
}
