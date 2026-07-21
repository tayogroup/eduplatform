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

export function sectionNavigation(items) {
  return items.map(({ id, label, iconName, active = false, done = false }) => {
    const safeLabel = escapeHtml(label);
    return `<button class="nav-button ${active ? "active" : ""}" data-route="${escapeHtml(id)}" type="button" title="${safeLabel}" aria-label="${safeLabel}${done ? ", completed" : ""}" ${active ? 'aria-current="page"' : ""}>${icon(iconName)}<span>${safeLabel}</span><span class="nav-state ${done ? "done" : ""}" aria-hidden="true">${done ? "✓" : ""}</span></button>`;
  }).join("");
}
