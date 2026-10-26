import { icon, esc } from "./core.js";

export function createSelectControls() {
  // Accessible custom select controls.
  let openSelectControl = null;
  let selectTypeahead = "";
  let selectTypeaheadTimer;

  function syncEnhancedSelect(select) {
    const shell = select?.closest(".select-control");
    const trigger = shell?.querySelector(".select-trigger");
    if (!trigger) return;
    const option = select.options[select.selectedIndex];
    trigger.querySelector(".select-current").textContent = option?.textContent?.trim() || "—";
    trigger.setAttribute("aria-valuetext", option?.textContent?.trim() || "");
    trigger.disabled = select.disabled;
  }

  function closeEnhancedSelect(returnFocus = false) {
    if (!openSelectControl) return;
    const { trigger, menu } = openSelectControl;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
    trigger.removeAttribute("aria-controls");
    menu.remove();
    openSelectControl = null;
    if (returnFocus) trigger.focus();
  }

  function focusSelectOption(index) {
    if (!openSelectControl) return;
    const options = [...openSelectControl.menu.querySelectorAll("[role='option']")];
    if (!options.length) return;
    const next = (index + options.length) % options.length;
    options[next].focus();
    openSelectControl.trigger.setAttribute("aria-activedescendant", options[next].id);
  }

  function chooseEnhancedOption(index) {
    if (!openSelectControl) return;
    const { select, trigger } = openSelectControl;
    const option = select.options[index];
    if (!option || option.disabled) return;
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    syncEnhancedSelect(select);
    closeEnhancedSelect(true);
  }

  function openEnhancedSelect(select) {
    if (openSelectControl?.select === select) { closeEnhancedSelect(); return; }
    closeEnhancedSelect();
    const shell = select.closest(".select-control");
    const trigger = shell?.querySelector(".select-trigger");
    if (!trigger || select.disabled) return;
    const menu = document.createElement("div");
    menu.className = "select-options";
    menu.id = `${trigger.id}-options`;
    menu.setAttribute("role", "listbox");
    if (trigger.getAttribute("aria-labelledby")) menu.setAttribute("aria-labelledby", trigger.getAttribute("aria-labelledby"));
    else menu.setAttribute("aria-label", trigger.getAttribute("aria-label") || "Options");
    menu.innerHTML = [...select.options].map((option, index) => `<button type="button" role="option" id="${menu.id}-option-${index}" class="select-option" data-option-index="${index}" aria-selected="${index === select.selectedIndex}" ${option.disabled ? "disabled" : ""}>${esc(option.textContent.trim())}${index === select.selectedIndex ? icon("check", "heroicon select-option-check") : ""}</button>`).join("");
    const host = select.closest("dialog") || document.body;
    host.append(menu);
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 190), window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    const desiredHeight = Math.min(280, menu.scrollHeight);
    const below = Math.max(0, window.innerHeight - rect.bottom - 12);
    const above = Math.max(0, rect.top - 12);
    const opensBelow = below >= desiredHeight || below >= above;
    const available = opensBelow ? below : above;
    const maxHeight = Math.min(280, Math.max(72, available));
    const visibleHeight = Math.min(desiredHeight, maxHeight);
    const rawTop = opensBelow ? rect.bottom + 6 : rect.top - visibleHeight - 6;
    const top = Math.max(8, Math.min(rawTop, window.innerHeight - visibleHeight - 8));
    Object.assign(menu.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, maxHeight: `${maxHeight}px` });
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-controls", menu.id);
    openSelectControl = { select, trigger, menu };
    menu.addEventListener("click", (eventTarget) => {
      const option = eventTarget.target.closest("[data-option-index]");
      if (option) chooseEnhancedOption(Number(option.dataset.optionIndex));
    });
    menu.addEventListener("keydown", (eventTarget) => {
      const current = Number(eventTarget.target.closest("[data-option-index]")?.dataset.optionIndex || 0);
      if (eventTarget.key === "ArrowDown") { eventTarget.preventDefault(); focusSelectOption(current + 1); }
      else if (eventTarget.key === "ArrowUp") { eventTarget.preventDefault(); focusSelectOption(current - 1); }
      else if (eventTarget.key === "Home") { eventTarget.preventDefault(); focusSelectOption(0); }
      else if (eventTarget.key === "End") { eventTarget.preventDefault(); focusSelectOption(select.options.length - 1); }
      else if (eventTarget.key === "Enter" || eventTarget.key === " ") { eventTarget.preventDefault(); chooseEnhancedOption(current); }
      else if (eventTarget.key === "Escape") { eventTarget.preventDefault(); closeEnhancedSelect(true); }
      else if (eventTarget.key === "Tab") closeEnhancedSelect();
      else if (eventTarget.key.length === 1 && !eventTarget.ctrlKey && !eventTarget.metaKey) {
        selectTypeahead += eventTarget.key.toLocaleLowerCase();
        clearTimeout(selectTypeaheadTimer);
        selectTypeaheadTimer = setTimeout(() => { selectTypeahead = ""; }, 650);
        const match = [...select.options].findIndex((option) => option.textContent.trim().toLocaleLowerCase().startsWith(selectTypeahead));
        if (match >= 0) { eventTarget.preventDefault(); focusSelectOption(match); }
      }
    });
    menu.querySelector(`[data-option-index="${Math.max(select.selectedIndex, 0)}"]`)?.focus();
  }

  function enhanceSelects(root = document) {
    const selects = [...(root.matches?.("select") ? [root] : []), ...root.querySelectorAll("select")];
    for (const select of selects) {
      if (select.classList.contains("select-native")) continue;
      const shell = document.createElement("div");
      shell.className = "select-control";
      select.before(shell);
      shell.append(select);
      select.classList.add("select-native");
      select.setAttribute("aria-hidden", "true");
      select.tabIndex = -1;
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "select-trigger";
      trigger.id = `${select.id || "qipi-select"}-trigger`;
      trigger.setAttribute("role", "combobox");
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      const labelledBy = select.getAttribute("aria-labelledby");
      const labels = [...(select.labels || [])];
      if (!labelledBy && labels.length) {
        const ids = labels.map((label) => { if (!label.id) label.id = `${select.id}-label`; label.htmlFor = trigger.id; return label.id; });
        trigger.setAttribute("aria-labelledby", ids.join(" "));
      } else if (labelledBy) trigger.setAttribute("aria-labelledby", labelledBy);
      else trigger.setAttribute("aria-label", select.getAttribute("aria-label") || "Choose an option");
      trigger.innerHTML = `<span class="select-current"></span>${icon("chevron-down", "heroicon select-chevron")}`;
      shell.append(trigger);
      trigger.addEventListener("click", () => openEnhancedSelect(select));
      trigger.addEventListener("keydown", (eventTarget) => {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(eventTarget.key)) { eventTarget.preventDefault(); openEnhancedSelect(select); }
      });
      select.addEventListener("change", () => syncEnhancedSelect(select));
      syncEnhancedSelect(select);
    }
  }

  function syncEnhancedSelects(root = document) {
    const selects = [...(root.matches?.("select") ? [root] : []), ...root.querySelectorAll("select")];
    selects.forEach(syncEnhancedSelect);
  }

  document.addEventListener("pointerdown", (eventTarget) => {
    if (openSelectControl && !openSelectControl.menu.contains(eventTarget.target) && !openSelectControl.trigger.contains(eventTarget.target)) closeEnhancedSelect();
  });
  window.addEventListener("resize", () => closeEnhancedSelect());
  window.addEventListener("scroll", () => closeEnhancedSelect(), true);

  return { enhanceSelects, syncEnhancedSelect, syncEnhancedSelects, closeEnhancedSelect };
}
