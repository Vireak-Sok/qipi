// Static, trusted markup. Dynamic values belong in the page controller.
export const topbar = {
  tag: "header",
  props: {"className": "social-topbar"},
  html: `<div class="topbar-inner shell">
        <a class="brand" href="/" aria-label="Qipi home"><span class="brand-mark" aria-hidden="true"><span></span><span></span></span><span class="brand-word">qi<span>pi</span></span></a>
        <div class="top-actions"><button class="icon-button notification-button" type="button" data-action="open-notifications" aria-label="Notifications"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#bell"></use></svg><b class="notification-badge" data-notification-badge aria-hidden="true" hidden></b></button><button class="account-button" id="account-button" type="button" data-action="account"><span class="account-avatar" id="account-avatar"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#user"></use></svg></span><span id="account-label" data-i18n="signIn">Sign in</span></button></div>
      </div>`
};
