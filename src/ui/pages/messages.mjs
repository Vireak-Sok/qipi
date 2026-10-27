import { pageHeading } from "../components/page-heading.mjs";

export const messages = {
  tag: "section",
  props: { className: "messages-page settings-page", id: "messages-view", "aria-labelledby": "messages-page-title", hidden: true },
  html: `${pageHeading({ id: "messages-page-title", label: "messages", title: "Messages", backAction: "messages-back" })}
    <div id="messages-content" aria-live="polite" aria-busy="true"></div>`
};
