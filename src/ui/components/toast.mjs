// Static, trusted markup. Dynamic values belong in the page controller.
export const toast = {
  tag: "div",
  props: {"id": "toast", "className": "toast", "role": "status", "aria-live": "polite"},
  html: ``
};

export const incomingNotification = {
  tag: "aside",
  props: {"id": "incoming-notification", "className": "incoming-notification", "aria-label": "New activity", "aria-live": "polite", "hidden": true},
  html: ``
};
