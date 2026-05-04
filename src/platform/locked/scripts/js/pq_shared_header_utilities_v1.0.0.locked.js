/* pq_ui_header_utilities_v1.0.13_CLEAN.js
   Production: Inbox badge + toast.
   - Badge shows exact unread count
   - Toast fires only when unread count increases
   - Clicking "User Inbox" calls mark_seen and opens inbox
*/

(function () {
  const __PQ_HEADER_UTILS_VERSION = 'v1.0.14_SAFE';
  let __pqHU_inited = false;
  let __pqHU_visBound = false;

  'use strict';

  const CFG = {
    id: 'pqHeaderUtilitiesBar',
    styleId: 'pqHeaderUtilitiesStyle',
    toastId: 'pqInboxToast',

    inboxHref: 'https://quraan.academy/local/quraan_contact/inbox.php',
    label: 'User Inbox',
    icon: '📩',

    wsEndpointDefault: 'https://quraan.academy/webservice/rest/server.php',
    wsGetUnread: 'local_quraan_contact_get_inbox_unread_count',
    wsMarkSeen: 'local_quraan_contact_mark_inbox_seen',

    pollMsVisible: 30000,
    pollMsHidden: 120000,
    toastMs: 6500
  };

  function pqKillLegacyAboutTopStrip() {
    try {
      const selectors = [
        '.pq-about-bar',
        '.pq-lesson-about',
        '.pq-top-about',
        '[data-pq-about]',
        '.about-unit-bar'
      ];
      selectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          try { el.remove(); } catch (_e) {}
        });
      });

      const nodes = Array.from(document.querySelectorAll('div,header,section'));
      for (const el of nodes) {
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.startsWith('About PQ Unit') || t.includes('About PQ Unit')) {
          if (el !== document.body && el !== document.documentElement) {
            el.remove();
          }
          break;
        }
      }
    } catch (_e) {}
  }

  function pqInstallInboxPill() {
    function ensurePillRow() {
      let row = document.querySelector('.pq-legacy-about-row') || document.querySelector('.pq-pill-row');
      if (row) return row;

      const topBar = document.getElementById('topBar') || document.querySelector('.bar');
      if (!topBar) return null;

      row = document.createElement('div');
      row.className = 'pq-legacy-about-row';
      topBar.insertBefore(row, topBar.firstChild);
      return row;
    }

    const row = ensurePillRow();
    if (!row) return;

    function findWorkingInbox() {
      const els = Array.from(document.querySelectorAll('a,button'));
      for (const el of els) {
        if (!el) continue;
        if (el.id === 'pqUserInboxBtn') continue;
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (t === 'user inbox') return el;
      }
      return null;
    }

    let pill = document.getElementById('pqUserInboxBtn');
    if (!pill) {
      pill = document.createElement('a');
      pill.href = CFG.inboxHref;
      pill.className = 'pq-pill pq-pill--about';
      pill.id = 'pqUserInboxBtn';
      pill.style.textDecoration = 'none';
      pill.style.cursor = 'pointer';

      const badge = document.createElement('span');
      badge.className = 'pq-helpbar__badge';
      badge.style.position = 'relative';
      badge.style.top = '-10px';
      badge.style.right = '-6px';
      badge.style.display = 'none';

      pill.innerHTML = `<span class="pq-pill__text">${CFG.label}</span><span class="pq-pill__icon">${CFG.icon}</span>`;
      pill.appendChild(badge);
      pill.__badge = badge;

      pill.addEventListener('click', function (e) {
        e.preventDefault();

        try {
          const uid = getUid();
          const tok = getTok();
          if (uid && tok) markSeenSafe();
        } catch (_e) {}

        const w = findWorkingInbox();
        if (w) {
          if (w.tagName === 'A' && w.href) {
            try { window.top.location.href = w.href; } catch (_) { window.open(w.href, '_blank', 'noopener'); }
            return;
          }
          try { w.click(); return; } catch (_) {}
        }

        try { window.top.location.href = CFG.inboxHref; } catch (_) { window.open(CFG.inboxHref, '_blank', 'noopener'); }
      });
    }

    if (!row.contains(pill)) row.insertBefore(pill, row.firstChild);

    try {
      const aboutBtn = row.querySelector('#pqAboutBtn');
      if (aboutBtn) aboutBtn.style.display = 'none';
    } catch (_e) {}

    try {
      const oldBar = document.getElementById(CFG.id);
      if (oldBar) oldBar.remove();
    } catch (_e) {}
  }

  function qp(name) {
    try { return new URL(location.href).searchParams.get(name) || ''; } catch (e) { return ''; }
  }

  function getUid() {
    if (window.__prequran_uid) return String(window.__prequran_uid);
    const uid = qp('uid');
    if (uid) window.__prequran_uid = uid;
    return uid || '';
  }

  function getTok() {
    const g = window.__prequran_ws_token ? String(window.__prequran_ws_token) : '';
    if (g.length >= 16) return g;
    const tok = qp('wstoken') || qp('ws');
    if (tok && tok.length >= 16) window.__prequran_ws_token = tok;
    return tok || '';
  }

  function getWs() {
    if (window.__prequran_ws_endpoint) return String(window.__prequran_ws_endpoint);
    const ep = qp('wsendpoint');
    window.__prequran_ws_endpoint = ep || CFG.wsEndpointDefault;
    return window.__prequran_ws_endpoint;
  }

  function wsCall(fn, params) {
    const uid = getUid();
    const tok = getTok();
    if (!uid || !tok) {
      return Promise.resolve(null);
    }

    const url = new URL(getWs());
    url.searchParams.set('wstoken', tok);
    url.searchParams.set('wsfunction', fn);
    url.searchParams.set('moodlewsrestformat', 'json');
    if (params) Object.keys(params).forEach(function (k) {
      url.searchParams.set(k, String(params[k]));
    });

    return fetch(url.toString(), { method: 'GET', credentials: 'omit', cache: 'no-store', mode: 'cors' })
      .then(function (r) { return r.json(); })
      .catch(function () { return null; });
  }

  function fetchUnread() {
    const uid = getUid();
    const tok = getTok();

    if (!uid || !tok) return Promise.resolve(null);

    const now = Date.now();

    // Do not stack unread-count requests.
    if (__pqHU_unreadInFlight) {
      return Promise.resolve(null);
    }

    // After a network failure, back off briefly.
    if (__pqHU_lastFailureAt && (now - __pqHU_lastFailureAt < __pqHU_failureBackoffMs)) {
      return Promise.resolve(null);
    }

    __pqHU_unreadInFlight = true;

    return wsCall(CFG.wsGetUnread, { userid: uid }).then(function (j) {
      if (!j) return null;
      if (j.exception) return null;
      if (j.ok !== true) return null;
      return (typeof j.count === 'number') ? j.count : null;
    }).catch(function () {
      __pqHU_lastFailureAt = Date.now();
      return null;
    }).finally(function () {
      __pqHU_unreadInFlight = false;
    });
  }

  function markSeenSafe() {
    try {
      const uid = getUid();
      const tok = getTok();

      if (!uid || !tok) return Promise.resolve(null);

      if (__pqHU_markSeenInFlight) {
        return Promise.resolve(null);
      }

      __pqHU_markSeenInFlight = true;

      return wsCall(CFG.wsMarkSeen, { userid: uid }).catch(function () {
        __pqHU_lastFailureAt = Date.now();
        return null;
      }).finally(function () {
        __pqHU_markSeenInFlight = false;
      });
    } catch (_e) {
      __pqHU_markSeenInFlight = false;
      return Promise.resolve(null);
    }
  }


  function ensureStyles() {
    if (document.getElementById(CFG.styleId)) return;
    const css = `
      .pq-helpbar{
        position:fixed;
        top:12px;
        right:12px;
        z-index:9999;
        display:flex;
        align-items:center;
        gap:10px;
        padding:10px 12px;
        background:rgba(255,255,255,0.94);
        backdrop-filter:blur(10px);
        border:1px solid rgba(0,0,0,0.08);
        border-radius:14px;
        box-shadow:0 12px 28px rgba(0,0,0,0.12);
      }
      .pq-helpbar__btn{
        position:relative;
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:10px 12px;
        border-radius:12px;
        text-decoration:none;
        font-weight:900;
        line-height:1;
        border:1px solid rgba(0,0,0,0.08);
        background:#2bb673;
        color:#fff;
      }
      .pq-helpbar__badge{
        position:absolute;
        top:-8px;
        right:-8px;
        min-width:20px;
        height:20px;
        padding:0 7px;
        border-radius:999px;
        background:#e53935;
        color:#fff;
        font-size:12px;
        font-weight:900;
        display:none;
        align-items:center;
        justify-content:center;
        border:2px solid rgba(255,255,255,0.95);
      }
      .pq-helpbar__toast{
        position:fixed;
        top:70px;
        right:12px;
        max-width:360px;
        z-index:10000;
        display:none;
        padding:14px 16px;
        border-radius:16px;
        background:rgba(20,20,20,0.92);
        color:#fff;
        font-weight:900;
        box-shadow:0 14px 34px rgba(0,0,0,0.28);
      }
      .pq-helpbar__toast a{
        color:#9ef0c2;
        text-decoration:underline;
        font-weight:900;
      }
      @supports (padding:max(0px)){
        .pq-helpbar{ top:max(12px, env(safe-area-inset-top)); right:max(12px, env(safe-area-inset-right)); }
        .pq-helpbar__toast{ top:max(70px, env(safe-area-inset-top)); right:max(12px, env(safe-area-inset-right)); }
      }
    `;
    const s = document.createElement('style');
    s.id = CFG.styleId;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function ensureToast() {
    let t = document.getElementById(CFG.toastId);
    if (t) return t;
    t = document.createElement('div');
    t.className = 'pq-helpbar__toast';
    t.id = CFG.toastId;
    t.innerHTML = `📩 New message arrived. <a href="${CFG.inboxHref}" target="_blank" rel="noopener noreferrer">Open User Inbox</a>`;
    document.body.appendChild(t);
    return t;
  }

  function ensureBar() {
    if (document.getElementById('pqUserInboxBtn')) return null;
    let bar = document.getElementById(CFG.id);
    if (bar) return bar;

    bar = document.createElement('div');
    bar.className = 'pq-helpbar';
    bar.id = CFG.id;

    const a = document.createElement('a');
    a.className = 'pq-helpbar__btn';
    a.href = CFG.inboxHref;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = `<span>${CFG.label}</span><span style="font-size:16px">${CFG.icon}</span>`;

    const badge = document.createElement('span');
    badge.className = 'pq-helpbar__badge';
    a.appendChild(badge);

    a.addEventListener('click', function () {
      const uid = getUid();
      const tok = getTok();
      if (!uid || !tok) return;
      markSeenSafe();
    });

    bar.appendChild(a);
    bar.__badge = badge;
    bar.__toast = ensureToast();

    document.body.appendChild(bar);
    return bar;
  }

  let lastCount = null;
  let lastToastAt = 0;
  let timer = null;

  // SAFE WS guards: prevent overlapping Moodle webservice calls.
  let __pqHU_unreadInFlight = false;
  let __pqHU_markSeenInFlight = false;
  let __pqHU_lastFailureAt = 0;
  const __pqHU_failureBackoffMs = 5000;

  function setBadge(count) {
    const pill = document.getElementById('pqUserInboxBtn');
    const pillBadge = pill && pill.__badge ? pill.__badge : null;
    const bar = ensureBar();
    const b = (bar && bar.__badge) ? bar.__badge : null;
    if (!count || count <= 0) {
      if (pillBadge) { pillBadge.style.display = 'none'; pillBadge.textContent = ''; }
      if (b) { b.style.display = 'none'; b.textContent = ''; }
      return;
    }
    if (pillBadge) { pillBadge.textContent = String(count); pillBadge.style.display = 'inline-flex'; }
    if (b) { b.textContent = String(count); b.style.display = 'flex'; }
  }

  function showToast() {
    const bar = ensureBar();
    if (!bar) return;
    const t = bar.__toast;
    const now = Date.now();
    if (now - lastToastAt < 2000) return;
    lastToastAt = now;

    t.style.display = 'block';
    clearTimeout(t.__hideT);
    t.__hideT = setTimeout(function () { t.style.display = 'none'; }, CFG.toastMs);
  }

  function scheduleNext() {
    clearTimeout(timer);

    if (document.hidden) {
      timer = setTimeout(tick, CFG.pollMsHidden);
    } else {
      timer = setTimeout(tick, CFG.pollMsVisible);
    }
  }

  function tick() {
    const uid = getUid();
    const tok = getTok();

    if (!uid || !tok) {
      scheduleNext();
      return;
    }

    fetchUnread().then(function (count) {
      if (count === null) {
        scheduleNext();
        return;
      }

      setBadge(count);

      if (lastCount !== null && count > lastCount) showToast();

      lastCount = count;
      scheduleNext();
    }).catch(function () {
      __pqHU_lastFailureAt = Date.now();
      scheduleNext();
    });
  }

  function init(force) {
    if (__pqHU_inited && !force) return;
    __pqHU_inited = true;

    try { pqKillLegacyAboutTopStrip(); } catch (_e) {}
    try { pqInstallInboxPill(); } catch (_e) {}

    try { ensureStyles(); } catch (_e) {}
    try { if (!document.getElementById('pqUserInboxBtn')) ensureBar(); } catch (_e) {}
    try { tick(true); } catch (_e) {}

    if (!__pqHU_visBound) {
      __pqHU_visBound = true;
      document.addEventListener('visibilitychange', scheduleNext, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(false); }, { once: true });
  } else {
    init(false);
  }

  function pqApplyHeaderUtilitiesNow() {
    init(true);
  }

  document.addEventListener('DOMContentLoaded', pqApplyHeaderUtilitiesNow);
  window.addEventListener('pageshow', pqApplyHeaderUtilitiesNow);

  try {
    window.addEventListener('pagehide', function () {
      try {
        clearTimeout(timer);
        timer = null;
        __pqHU_unreadInFlight = false;
        __pqHU_markSeenInFlight = false;
      } catch (_e) {}
    });
  } catch (_e) {}

  window.__PQHeaderUtilitiesDebug = function () {
    return {
      version: __PQ_HEADER_UTILS_VERSION,
      unreadInFlight: __pqHU_unreadInFlight,
      markSeenInFlight: __pqHU_markSeenInFlight,
      lastFailureAt: __pqHU_lastFailureAt,
      timerActive: !!timer,
      visible: !document.hidden
    };
  };

})();