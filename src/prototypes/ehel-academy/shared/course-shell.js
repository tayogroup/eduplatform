export function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

export function icon(name, label = "") {
  const accessible = label ? ` role="img" aria-label="${escapeHtml(label)}"` : ' aria-hidden="true"';
  return `<i data-lucide="${escapeHtml(name)}"${accessible}></i>`;
}

export function pageHeader({ kicker, title, description, status = "Approved content" }) {
  return `<header class="page-header"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${description}</p></div><div class="page-actions"><span class="status-chip">${icon("shield-check")} ${status}</span></div></header>`;
}

// `path` draws the young learner's nav (Grades/Stages 1-4) -- a trail of
// circular nodes rather than a flat list. It is decided by ONE constant, in
// course-app.js, which is the only caller and already holds the resolved stage;
// nothing here re-derives it, because the shell's grade chain is documented as
// the thing that must not be copied.
//
// The MARKUP is identical either way, deliberately. Everything the path needs
// -- the node, the trail, the badge on the node -- is CSS on the elements that
// are already here, so english.js's paintSectionLocks() keeps working untouched:
// it writes 🔒 into .nav-state and dims the button, and both still land.
export function sectionNavigation(items, { path = false } = {}) {
  return items.map(({ id, label, iconName, active = false, done = false }) => {
    const safeLabel = escapeHtml(label);
    return `<button class="nav-button ${path ? "nav-button--path " : ""}${active ? "active" : ""}" data-route="${escapeHtml(id)}" type="button" title="${safeLabel}" aria-label="${safeLabel}${done ? ", completed" : ""}" ${active ? 'aria-current="page"' : ""}>${icon(iconName)}<span>${safeLabel}</span><span class="nav-state ${done ? "done" : ""}" aria-hidden="true">${done ? "✓" : ""}</span></button>`;
  }).join("");
}
