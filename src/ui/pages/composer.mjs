// Static, trusted markup. Dynamic values belong in the page controller.
export const composer = {
  tag: "section",
  props: {"className": "composer-card", "aria-label": "Create a post"},
  html: `<span class="composer-avatar" id="composer-avatar">Q</span><button class="composer-prompt" type="button" data-action="create-trip" data-i18n="composerPrompt">Share a travel moment or plan…</button><button class="composer-create" aria-label="Create a post" data-i18n-aria-label="createPostAction" type="button" data-action="create-trip"><svg class="heroicon" aria-hidden="true"><use href="/icons.svg#plus"></use></svg><span data-i18n="create">Create</span></button>`
};
