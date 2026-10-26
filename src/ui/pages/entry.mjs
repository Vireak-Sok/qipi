// Static, trusted markup. Dynamic values belong in the page controller.
export const entry = {
  tag: "section",
  props: {"className": "entry-page", "id": "entry-view", "aria-labelledby": "entry-title", "hidden": true},
  html: `<div class="entry-page-card">
            <div class="entry-page-brand" aria-label="Qipi"><span class="brand-mark" aria-hidden="true"><span></span><span></span></span><span class="brand-word">qi<span>pi</span></span></div>
            <h1 id="entry-title" data-i18n="entryTitle">Welcome to Qipi</h1>
            <div class="entry-page-actions">
              <button class="button button-primary" type="button" data-action="entry-account" data-i18n="signUp">Create account</button>
              <button class="button button-ghost" type="button" data-action="entry-sign-in" data-i18n="signIn">Sign in</button>
              <button class="entry-guest-action" type="button" data-action="entry-guest" data-i18n="entryGuest">Continue as guest</button>
            </div>
          </div>`
};
