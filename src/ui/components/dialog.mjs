import { esc, icon } from "../../../public/js/core.js";
export const dialogNames = ["route", "trip", "create", "join", "update", "report", "auth"];
export function dialog(name) {
  return { tag: "dialog", props: { className: "panel-dialog" + (name === "auth" ? " auth-dialog" : ""), id: `${name}-dialog`, "aria-labelledby": `${name}-dialog-title` }, html: `<div class="dialog-frame"><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close">${icon("close")}</button><div id="${esc(name)}-dialog-content"></div></div>` };
}
