// Static shell for the full notifications view; event data is rendered by app.js.
export const notifications = {
  tag: "section",
  props: { className: "notifications-page settings-page", id: "notifications-view", "aria-labelledby": "notifications-title", hidden: true },
  html: `<header class="settings-header notifications-header"><button type="button" class="settings-back" data-action="notifications-back" aria-label="Back to feed" data-i18n-aria-label="backToFeed"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#arrow-left"></use></svg></button><h1 id="notifications-title" data-i18n="notifications">Notifications</h1><button class="notification-mark-all" id="notifications-mark-all" type="button" data-action="mark-notifications-read" data-i18n="markAllRead" hidden>Mark all read</button></header>
    <button class="notification-enable" type="button" data-action="enable-browser-notifications" data-i18n="enableBrowserAlerts" hidden>Enable browser alerts</button>
    <div id="notification-page-list" class="notification-page-list" aria-live="polite" hidden></div>
    <div class="notification-empty" id="notification-page-empty"><span class="notification-empty-icon"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#bell"></use></svg></span><strong data-i18n="allCaughtUp">You're all caught up</strong><p data-i18n="noNotifications">New activity will show up here.</p></div>`
};
