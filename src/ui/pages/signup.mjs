// Static, trusted markup. Dynamic values belong in the page controller.
export const signup = {
  tag: "section",
  props: { className: "signup-page", id: "signup-view", "aria-labelledby": "signup-title", hidden: true },
  html: `<header class="signup-heading"><button class="signup-back" type="button" data-action="signup-exit" aria-label="Back" data-i18n-aria-label="signupBack"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#arrow-left"></use></svg></button><div><h1 id="signup-title" data-i18n="signupTitle">Create account</h1></div></header>
    <div class="signup-layout"><form id="signup-form" class="signup-form" novalidate>
      <p class="signup-phone-intro" data-i18n="signupPhoneIntro">Create an account with your phone. We’ll text you a one-time code.</p>
      <fieldset class="signup-account-fields" id="signup-account-fields"><legend class="visually-hidden" data-i18n="signupAccountDetails">Account details</legend>
        <div class="field"><label for="signup-name" data-i18n="displayName">Name or nickname</label><input id="signup-name" name="displayName" autocomplete="name" minlength="2" maxlength="40" required /></div>
        <div class="field"><label for="signup-phone" data-i18n="phoneNumber">Phone number</label><input id="signup-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" placeholder="+855 12 345 678" data-i18n-placeholder="phoneNumberPlaceholder" required /><small data-i18n="phoneNumberHint">Use your country code. Cambodian local numbers beginning with 0 are converted automatically.</small></div>
        <div class="field"><label for="signup-password" data-i18n="password">Password</label><div class="password-control"><input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="8" required /><button type="button" class="password-toggle" data-action="toggle-password" data-target="signup-password" aria-controls="signup-password" aria-pressed="false" data-i18n-aria-label="showPassword" aria-label="Show password"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#eye"></use></svg></button></div></div>
      </fieldset>
      <section class="signup-otp-step" id="signup-otp-step" hidden aria-labelledby="signup-otp-title">
        <h2 id="signup-otp-title" data-i18n="signupOtpTitle">Verify your phone</h2><p id="signup-otp-destination"></p>
        <div class="field"><label for="signup-otp" data-i18n="signupOtpLabel">6-digit code</label><input id="signup-otp" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" data-i18n-placeholder="signupOtpPlaceholder" placeholder="000000" disabled required /></div>
        <div class="signup-otp-actions"><button type="button" class="plain-button" data-action="signup-change-phone" data-i18n="changePhone">Change phone number</button><button type="button" class="plain-button" data-action="signup-resend-otp" data-i18n="resendOtp">Resend code</button></div>
      </section>
      <div class="error-message" role="alert"></div>
      <div class="signup-account-divider" aria-hidden="true"></div>
      <div class="signup-action-row"><p class="signup-switch"><span data-i18n="haveAccount">Already have an account?</span> <button type="button" data-action="signup-sign-in" data-i18n="signIn">Sign in</button></p><button class="button button-primary signup-primary" id="signup-submit" type="submit" data-i18n="sendOtp">Send code</button></div>
    </form></div>`
};
