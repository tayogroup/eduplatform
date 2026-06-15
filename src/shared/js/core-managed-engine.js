/* PQManagedCore — Managed Mode Helpers (v003)
   2025-12-14

   Defines window.PQManagedCore for unit scripts (Alphabet Listen/Watch, etc).

   Helpers:
   - wsGet({wsfunction, userid, wstoken, ...params})
   - wsSet({wsfunction, userid, wstoken, progressObj})
   - normalizeManagedPayload(payload, baseSteps)
   - clearCachesOnUserChange(uid, lsKey, keysToClear)

   Default Moodle REST endpoint:
   - /webservice/rest/server.php (same origin)
   Override by setting: window.__prequran_ws_endpoint
*/

(function (window) {
  'use strict';

  
  function __pqIsDebug(){
    try{
      const q = new URLSearchParams(String(window.location.search||'').replace(/&amp;/g,'&'));
      return q.get('pqdebug')==='1' || localStorage.getItem('pq_debug')==='1';
    }catch(_e){ return false; }
  }
  function __pqDiag(){
    try{ if(!__pqIsDebug()) return; console.log.apply(console, arguments); }catch(_e){}
  }
const PQ = window.PQ = window.PQ || {};
  PQ.VERSION = PQ.VERSION || {};
  PQ.VERSION.managed_core = "v007_10_focusfix";

  // Hydrate WS endpoint from URL if provided (?ws=... or ?wsbase=...) so CDN-hosted lessons can save to DB reliably.
  try{
    if (!window.__prequran_ws_endpoint) {
      const q = new URLSearchParams(String(window.location.search||'').replace(/&amp;/g,'&'));
      const ws = q.get('ws') || q.get('wsbase') || q.get('ws_endpoint') || q.get('wsEndpoint');
      if (ws) {
        try{ const u = new URL(ws); window.__prequran_ws_endpoint = u.origin + u.pathname; }
        catch(_e){ window.__prequran_ws_endpoint = String(ws).trim(); }
      }
    }
  }catch(_e){}

  const DEFAULT_WS_ENDPOINT = "/webservice/rest/server.php";

  // ---------------------------
  // Tiny DB save indicator (Saved ✓ / Not saved ✗)
  // ---------------------------
  const PQ_DB_INDICATOR_ID = "pq-db-indicator";
  
function pqShouldShowDbIndicator() {
  try {
    const cfg = window.UNIT_CFG || {};
    const ui = cfg.ui || {};
    return ui.showDbSavedToast !== false;
  } catch (_e) {
    return true;
  }
}

function pqEnsureDbIndicator(){
  try{
    if (!pqShouldShowDbIndicator()) {
      const existing = document.getElementById(PQ_DB_INDICATOR_ID);
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      return null;
    }

    let el = document.getElementById(PQ_DB_INDICATOR_ID);
    if(el) return el;

    el = document.createElement("div");
    el.id = PQ_DB_INDICATOR_ID;
    el.style.cssText =
      "position:fixed;bottom:12px;right:12px;z-index:9999;" +
      "font:12px/1.35 Arial,sans-serif;padding:6px 10px;" +
      "border-radius:12px;background:#eee;color:#222;" +
      "box-shadow:0 2px 8px rgba(0,0,0,.18);" +
      "user-select:none";

    el.textContent = "DB: idle";
    document.body.appendChild(el);
    return el;
  }catch(_){ return null; }
}

  function pqSetDbIndicator(text, bg){
    const el = pqEnsureDbIndicator();
    if(!el) return;
    el.textContent = text;
    if(bg) el.style.background = bg;
  }

  // Track whether UI is using DB or local cache
  window.__pq_last_data_source = window.__pq_last_data_source || 'unknown';


// Resolve an absolute WS endpoint even when the lesson HTML/JS is hosted on a CDN.
// Priority:
//  1) window.__prequran_ws_endpoint / PQ.ws_endpoint (explicit)
//  2) URL query: ws / wsbase (full moodle endpoint)
//  3) If running on a CDN domain (b-cdn.net), default to the Moodle origin used by your dashboards.
function resolveWsEndpointFromUrl(){
  try{
    const q = new URLSearchParams(window.location.search || '');
    const ws = q.get('ws') || q.get('wsbase') || q.get('ws_endpoint') || q.get('wsEndpoint');
    if (ws && typeof ws === 'string') return ws.trim();
  }catch(_){}
  return '';
}

function getWsEndpoint() {
  const explicit = (window.__prequran_ws_endpoint || PQ.ws_endpoint || '').trim();
  if (explicit) return explicit;

  const fromUrl = resolveWsEndpointFromUrl();
  if (fromUrl) return fromUrl;

  // If the page is served from Bunny CDN, a relative endpoint will hit the CDN origin and fail.
  // Use the same Moodle origin used by your teacher dashboards.
  try{
    const host = String(window.location.hostname || '');
    if (/b-cdn\.net$/i.test(host)) {
      return "https://quraan.academy/webservice/rest/server.php";
    }
  }catch(_){}

  return DEFAULT_WS_ENDPOINT;
}

  function toFormBody(obj) {
    const p = new URLSearchParams();
    Object.keys(obj || {}).forEach((k) => {
      const v = obj[k];
      if (v === undefined || v === null) return;
      p.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    return p.toString();
  }

  function normalizeEnvironment(value) {
    const v = String(value || '').trim().toLowerCase();
    if (v === 'integration' || v === 'staging' || v === 'production') return v;
    return '';
  }

  function rememberEnvironment(env) {
    const normalized = normalizeEnvironment(env) || 'production';
    try { window.__prequran_environment = normalized; } catch (_) {}
    try { sessionStorage.setItem('pq_env', normalized); } catch (_) {}
    return normalized;
  }

  function currentEnvironment() {
    try {
      const qs = new URLSearchParams(window.location.search || '');
      const fromUrl = normalizeEnvironment(
        qs.get('pq_env') ||
        qs.get('env') ||
        qs.get('pq_environment')
      );
      if (fromUrl) return rememberEnvironment(fromUrl);
    } catch (_) {}
    try {
      const fromWindow = normalizeEnvironment(window.__prequran_environment);
      if (fromWindow) return rememberEnvironment(fromWindow);
    } catch (_) {}
    try {
      const stored = normalizeEnvironment(sessionStorage.getItem('pq_env'));
      if (stored) return rememberEnvironment(stored);
    } catch (_) {}
    try {
      const path = String(window.location.pathname || '');
      if (path.indexOf('/pre_quraan_integration/') >= 0) return rememberEnvironment('integration');
      if (path.indexOf('/pre_quraan_staging/') >= 0) return rememberEnvironment('staging');
    } catch (_) {}
    return rememberEnvironment('production');
  }

  async function wsCall(params) {
    const endpoint = getWsEndpoint();
    try{
      if (!core._wsWarned) {
        core._wsWarned = true;
        // Helpful debug: show endpoint and origin once.
        __pqDiag('[PQManagedCore] WS endpoint:', endpoint, 'page origin:', window.location.origin);
      }
    }catch(_){}
    const body = toFormBody(Object.assign({ moodlewsrestformat: "json", pq_env: currentEnvironment() }, params || {}));
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body
    });

    const http_status = res.status;
    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch (_) {
      const err = new Error("WS non-JSON response (check endpoint/auth/CORS). HTTP " + http_status);
      err.ws_text = txt.slice(0, 500);
      throw err;
    }

    if (data && data.exception) {
      const err = new Error(data.message || "Moodle WS error");
      err.ws = data;
      err.http_status = http_status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error("WS HTTP error " + http_status);
      err.http_status = http_status;
      err.ws_text = txt.slice(0, 500);
      throw err;
    }
    pqSetDbIndicator("DB: Loaded ✓", "#c8f7d0");
        return data;
      }

// === PQ PATCH: AUTO-SCROLL TO CURRENT LETTER (v001) ===
function pqScrollToLetterTile(letterKey){
  try{
    const key = String(letterKey || '');
    if (!key) return false;

    const glyph = document.querySelector('.glyph[data-key="' + key + '"]');
    if (!glyph) return false;

    const tile = glyph.closest ? glyph.closest('.tile') : null;
    if (!tile) return false;

    tile.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    return true;
  }catch(_){
    return false;
  }
}
// === PQ PATCH END ===


  const core = {
    scrollToLetterTile: pqScrollToLetterTile,
    setDbIndicator: pqSetDbIndicator,
    async wsGet({ wsfunction, userid, wstoken, ...rest }) {
      window.__pq_last_data_source = 'db';

      if (!wsfunction) throw new Error("wsGet missing wsfunction");

      // Global fix: in unmanaged/no-token contexts (e.g., direct CDN open),
      // do NOT throw. Return null so lessons can fall back to unmanaged/local defaults.
      const uid = (userid != null && userid !== '') ? userid : window.__prequran_uid;
      const tok = wstoken || window.__prequran_ws_token;

      if (!uid || !tok) {
        try{
          if (!core._missingTokenWarned) {
            core._missingTokenWarned = true;
            __pqDiag('[PQManagedCore] wsGet suppressed (missing uid/wstoken).');
          }
        }catch(_e){}
        return null;
      }

      const __res = await wsCall(Object.assign({}, rest, { wsfunction, wstoken: tok, userid: uid }));
      try{ __pqDiag('[PQManagedCore] wsGet payload', wsfunction, __res); }catch(_e){}
      return __res;

    },

    async wsSet({ wsfunction, userid, wstoken, progressObj, ...rest }) {
      pqSetDbIndicator("DB: Saving…", "#ffe08a");
      try {
        // Ensure tokens exist (some pages load tokens async)
        if (!userid || !wstoken) {
          try { await this.waitForTokens(2000); } catch (_) {}
        }
        const uid = (userid != null && userid !== '') ? userid : window.__prequran_uid;
        const tok = wstoken || window.__prequran_ws_token;

        if (!wsfunction) throw new Error("wsSet missing wsfunction");

        // Global fix: in unmanaged/no-token contexts (e.g., direct CDN open),
        // do NOT throw. Skip wsSet and return a safe object.
        if (!tok || !uid) {
          try{
            if (!core._missingTokenWarned) {
              core._missingTokenWarned = true;
              __pqDiag('[PQManagedCore] wsSet suppressed (missing uid/wstoken).');
            }
          }catch(_e){}
          pqSetDbIndicator("DB: Not saved ✗", "#f6c1c1");
          return { ok:false, skipped:true, reason:'missing_uid_or_wstoken' };
        }

        try { __pqDiag('[PQManagedCore] wsSet →', { endpoint: getWsEndpoint(), wsfunction, userid: uid }); } catch (_) {}

        // Build payload
        const payload = Object.assign({}, rest, {
          wsfunction,
          wstoken: tok,
          userid: uid
        });

        // IMPORTANT:
        // Only attach progress_json for WS functions that actually accept it.
        // FocusGuard WS (local_prequran_set_focus_event) rejects unknown keys like progress_json.
        const PROGRESS_WS = new Set([
          'local_prequran_set_alphabet_listen_state',
          'local_prequran_set_alphabet_watch_state',
          'local_prequran_set_harakat_listen_state',
          'local_prequran_set_harakat_watch_state',
          'local_prequran_set_sakoon_jazm_listen_state',
          'local_prequran_set_sakoon_jazm_watch_state',
          'local_prequran_set_tashdeed_with_tashdeed_state',
          'local_prequran_set_tashdeed_with_sukoon_state',
          'local_prequran_set_maddoleen_listen_state',
          'local_prequran_set_maddoleen_watch_state'
        ]);

        // Heuristic fallback: many of your progress setters end with "_state".
        const expectsProgressJson =
          PROGRESS_WS.has(wsfunction) ||
          (typeof wsfunction === 'string' && /_state$/i.test(wsfunction));

        if (expectsProgressJson) {
          payload.progress_json = JSON.stringify(progressObj || {});
        }

        const __res = await wsCall(payload);
pqSetDbIndicator("DB: Saved ✓", "#c8f7d0");
        return __res;
      } catch (e) {
        pqSetDbIndicator("DB: Not saved ✗", "#f6c1c1");
        try {
          console.error('[PQManagedCore] wsSet FAILED', {
            wsfunction: wsfunction,
            userid: userid || window.__prequran_uid,
            endpoint: getWsEndpoint(),
            message: e && e.message,
            ws: e && e.ws,
            http_status: e && e.http_status,
            ws_text: e && e.ws_text
          });
        } catch (_) {}
        throw e;
      }
    },

    buildStepsFromPayload(payload) {
      const arr = (payload && Array.isArray(payload.steps)) ? payload.steps : [];
      const steps = arr.map((s) => {
        const id = String(s.step_id || s.id || '');
        const step_index = (typeof s.step_index === 'number') ? s.step_index : (parseInt(s.step_index, 10) || 0);
        const passesRequired = (s.passes_required != null) ? (parseInt(s.passes_required,10) || 0) : (parseInt(s.passes_required, 10) || (parseInt(s.default_passes_required,10) || 0));
        const repeatsPerLetter = (s.repeats_per_letter != null) ? (parseInt(s.repeats_per_letter,10) || 0) : (parseInt(s.repeats_per_letter, 10) || (parseInt(s.default_repeats_per_letter,10) || 0));
        return {
          id,
          title: (s.step_title || s.title || id),
          type: (s.step_type || (id === 'lecture' ? 'lecture' : 'playlist')),
          step_index,
          passesRequired: passesRequired || 1,
          repeatsPerLetter: repeatsPerLetter || 1
        };
      }).filter(x => x.id);
      steps.sort((a,b)=> (a.step_index||0) - (b.step_index||0));
      return steps;
    },

    normalizeManagedPayload(payload, baseSteps) {
      // Capture managed flag if present
      this.setManagedFlagFromPayload(payload);
      this.setLanguagePreferencesFromPayload(payload);
      const out = { raw: null, __serverHasProgress: false };
      let raw = null;

      try {
        if (payload && typeof payload.progress_json === "string" && payload.progress_json.trim()) {
          raw = JSON.parse(payload.progress_json);
          out.__serverHasProgress = true;
        } else if (payload && typeof payload.progress_json === "object" && payload.progress_json) {
          raw = payload.progress_json;
          out.__serverHasProgress = true;
        }
      } catch (_) {
        raw = null;
      }

      raw = raw && typeof raw === "object" ? raw : {};

      const stepsArr = (payload && Array.isArray(payload.steps)) ? payload.steps : null;

      (baseSteps || []).forEach((s) => {
        if (!raw[s.id] || typeof raw[s.id] !== "object") raw[s.id] = {};

        if (stepsArr) {
          const found = stepsArr.find(x => (x.step_id || x.id) === s.id);
          if (found) {
            if (found.passes_required != null) { const n = parseInt(found.passes_required,10); if (!isNaN(n)) raw[s.id].passesRequired = n; }
            if (found.repeats_per_letter != null) { const n = parseInt(found.repeats_per_letter,10); if (!isNaN(n)) raw[s.id].repeatPerLetter = n; }
            if (found.default_passes_required != null) { const n = parseInt(found.default_passes_required,10); if (!isNaN(n)) raw[s.id].passesRequired = n; }
            if (found.default_repeats_per_letter != null) { const n = parseInt(found.default_repeats_per_letter,10); if (!isNaN(n)) raw[s.id].repeatPerLetter = n; }
          }
        } else {
          if (typeof (payload && payload.passes_required) === "number" && raw[s.id].passesRequired == null) raw[s.id].passesRequired = payload.passes_required;
          if (typeof (payload && payload.number_of_repeats) === "number" && raw[s.id].repeatPerLetter == null) raw[s.id].repeatPerLetter = payload.number_of_repeats;
        }
      });

      out.raw = raw;
      out.raw.__serverHasProgress = out.__serverHasProgress;
      return out;
    },



    // Try to hydrate uid/wstoken into window globals from URL/sessionStorage.
    hydrateTokens() {
      try {
        const q = new URLSearchParams(window.location.search);
        const ws = q.get('wstoken') || q.get('ws') || (sessionStorage.getItem('pq_ws_token') || '');
        const uid = q.get('uid') || (sessionStorage.getItem('pq_uid') || '');
        const env = q.get('pq_env') || q.get('env') || q.get('pq_environment') || (sessionStorage.getItem('pq_env') || '');
        const lang = q.get('pq_lang') || q.get('preferred_language') || q.get('language') || (sessionStorage.getItem('pq_preferred_language') || '');
        const scope = q.get('pq_lang_scope') || q.get('language_scope') || q.get('translation_scope') || (sessionStorage.getItem('pq_language_scope') || '');
        if (!window.__prequran_ws_token && ws) window.__prequran_ws_token = ws;
        if (!window.__prequran_uid && uid) window.__prequran_uid = parseInt(uid, 10) || uid;
        if (env) rememberEnvironment(env);
        if (lang || scope) this.setLanguagePreferences(lang, scope);
      } catch (_) {}
    },


    // Wait briefly for pq_tokens.js (or other scripts) to populate window.__prequran_uid / __prequran_ws_token.
    async waitForTokens(maxMs = 1500) {
      const start = Date.now();
      while (!(window.__prequran_uid && window.__prequran_ws_token) && (Date.now() - start) < maxMs) {
        // Try to hydrate from URL/sessionStorage each tick
        try { this.hydrateTokens(); } catch (_) {}
        await new Promise(r => setTimeout(r, 50));
      }
      return !!(window.__prequran_uid && window.__prequran_ws_token);
    },


    // Fetch a unit state from Moodle WS to learn managed_student (and also validate tokens).
    // opts: { wsfunction, userid, wstoken, ... }
    async fetchManagedFlagFromMoodle(opts = {}) {
      try {
        this.hydrateTokens();
        const userid = opts.userid || window.__prequran_uid;
        const wstoken = opts.wstoken || window.__prequran_ws_token;
        const wsfunction = opts.wsfunction;
        if (!wsfunction || !userid || !wstoken) return null;
        if (typeof this.wsGet !== 'function') return null;

        const data = await this.wsGet({ wsfunction, userid, wstoken });
        this.setManagedFlagFromPayload(data);
        this.setLanguagePreferencesFromPayload(data);
        return (typeof this._managed_student === 'boolean') ? this._managed_student : null;
      } catch (_) {
        return null;
      }
    },

    
// === PQ PATCH: AUTO-SCROLL TO CURRENT LETTER (v001) ===
// (defined as a standalone function below)

// ---------- UI helpers (shared across Watch/Listen/etc.) ----------
    // IMPORTANT (RTL/Bidi):
    // In an RTL page, plain "0/1 completed" can render visually as "completed 1/0".
    // Use these helpers to force LTR digits and consistent wording.
    formatProgressText(done, required, label = "Progress") {
      const d = Number.isFinite(done) ? done : (parseInt(done, 10) || 0);
      const r = Number.isFinite(required) ? required : (parseInt(required, 10) || 0);
      return `${label} ${d}/${r}`;
    },

    applyProgressText(el, done, required, label = "Progress") {
      if (!el) return;
      // Force digits to render in logical order even in RTL pages
      try { el.setAttribute('dir', 'ltr'); } catch (_) {}
      try { el.style.unicodeBidi = 'isolate'; } catch (_) {}
      el.textContent = this.formatProgressText(done, required, label);
    },

    // Fix existing text nodes that say "completed x/y" or "Completed: x/y"
    // and normalize to "Progress done/required" with bidi isolation.
    fixProgressLabels(container, opts = {}) {
      const root = container || document;
      const label = opts.label || "Progress";
      const re = /\bcompleted\b\s*:?\s*(\d+)\s*\/\s*(\d+)/i;

      // Prefer managed stepper scope when present
      const scope = (root.getElementById && root.getElementById('managedStepper')) || null;
      const base = scope || root;

      const nodes = base.querySelectorAll ? base.querySelectorAll('*') : [];
      for (const el of nodes) {
        if (!el || !el.textContent) continue;
        const txt = el.textContent;
        const m = txt.match(re);
        if (!m) continue;

        // NOTE: the *visual* order in RTL can look swapped, but the underlying string is still "x/y".
        // We interpret it as done/required based on how your renderer currently formats it.
        // Your current renderer uses `${passesDone} / ${passesRequired} completed`
        const done = m[1];
        const required = m[2];

        try { el.setAttribute('dir', 'ltr'); } catch (_) {}
        try { el.style.unicodeBidi = 'isolate'; } catch (_) {}
        el.textContent = `${label} ${done}/${required}`;
      }
    },


    // ---------- UI helpers: Welcome dialog (shared) ----------
    // Returns Promise<boolean>: true if user pressed Begin, false if user exited.
    // ---------- Managed mode detection (shared) ----------
    // The most reliable source is WS payload field: managed_student (set internally).
    // Fallback: presence of ws token + uid (used by your managed lesson flow).
    isManagedStudent() {
      // 1) Most reliable: WS payload flag captured in normalizeManagedPayload()
      if (typeof this._managed_student === 'boolean') return this._managed_student;

      // 2) Common runtime globals (set by pq_tokens.js)
      if (window.__prequran_ws_token && window.__prequran_uid) return true;

      // 3) Session storage fallbacks (pq_tokens.js often caches here)
      try {
        const ws = sessionStorage.getItem('pq_ws_token');
        const uid = sessionStorage.getItem('pq_uid');
        if (ws && uid) return true;
      } catch (_) {}

      // 4) URL param fallbacks (in case tokens script runs later)
      try {
        const q = new URLSearchParams(window.location.search);
        const ws = q.get('wstoken') || q.get('ws');
        const uid = q.get('uid');
        if (ws && uid) return true;
      } catch (_) {}

      return false;
    },

    // Call this after WS payload is received if it contains managed_student
    setManagedFlagFromPayload(payload) {
      try {
        if (payload && typeof payload.managed_student === 'boolean') {
          this._managed_student = payload.managed_student;
        }
      } catch (_) {}
    },

    setLanguagePreferences(language, scope) {
      try {
        if (window.PQL10n && typeof window.PQL10n.setPreferences === 'function') {
          return window.PQL10n.setPreferences(language || '', scope || '');
        }
        const lang = String(language || '').trim().toLowerCase() || 'en';
        const sc = String(scope || '').trim().toLowerCase() || 'both';
        window.__prequran_preferred_language = lang;
        window.__prequran_language_scope = sc;
        try { sessionStorage.setItem('pq_preferred_language', lang); } catch (_) {}
        try { sessionStorage.setItem('pq_language_scope', sc); } catch (_) {}
        return { language: lang, scope: sc };
      } catch (_) {
        return null;
      }
    },

    setLanguagePreferencesFromPayload(payload) {
      try {
        if (!payload || typeof payload !== 'object') return null;
        const lang = payload.preferred_language || payload.language || payload.lang || '';
        const scope = payload.language_scope || payload.translation_scope || payload.localization_scope || '';
        if (!lang && !scope) return null;
        return this.setLanguagePreferences(lang, scope);
      } catch (_) {
        return null;
      }
    },


    // ---------- DB-only mode (managed students) ----------
    // When enabled, progress MUST come from DB; localStorage progress caches are ignored.
    // Auto-enables for managed students (tokens present or managed_student flag).
    forceDbOnly() {
      try {
        if (typeof this._force_db_only === 'boolean' && this._force_db_only) return true;
        // If WS payload explicitly says managed_student, respect it.
        if (typeof this._managed_student === 'boolean') return this._managed_student === true;
        // Fallback: tokens imply managed flow.
        return this.isManagedStudent();
      } catch (_) { return false; }
    },

    setForceDbOnly(flag = true) {
      this._force_db_only = !!flag;
      if (this._force_db_only) {
        try { __pqDiag('[PQManagedCore] DB-only mode ENABLED (local progress cache disabled)'); } catch (_) {}
        // Best-effort: clear *all* managed progress caches immediately (shared, not lesson-specific)
        try {
          const rm = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            // Common pattern used across units
            if (/managed_progress_cache_v\d+$/i.test(k) || /_managed_progress_cache_v\d+$/i.test(k)) rm.push(k);
          }
          rm.forEach((k) => { try { localStorage.removeItem(k); } catch (_) {} });
        } catch (_) {}
      }
      return this._force_db_only;
    },

    clearProgressCaches(keys = []) {
      try {
        (keys || []).forEach((k) => { try { localStorage.removeItem(String(k)); } catch (_) {} });
      } catch (_) {}
    },


    async showWelcomeDialog(opts = {}) {
      // Managed students only.
      // Ensure tokens are hydrated; tokens may be set by pq_tokens.js before/after this runs.
      try { this.hydrateTokens(); } catch (_) {}
      if (!this.isManagedStudent()) {
        try { await this.waitForTokens(2000); } catch (_) {}
      }
      // If still unknown and a wsfunction is provided, query Moodle once for managed_student.
      if (typeof this._managed_student !== 'boolean' && opts.wsfunction) {
        await this.fetchManagedFlagFromMoodle({ wsfunction: opts.wsfunction });
      }
      if (!this.isManagedStudent()) {
        try { __pqDiag('[PQManagedCore] Welcome dialog skipped (not managed)'); } catch(_) {}
        return true;
      }
      const title = opts.title || "Welcome";
      const message = opts.message || "Press Begin to start, or Close to exit.";
      const beginText = opts.beginText || "Begin";
      const closeText = opts.closeText || "Close";

      // Remove existing overlay if present
      try { document.getElementById('pqWelcomeOverlay')?.remove(); } catch (_) {}

      // Styles (once)
      if (!document.getElementById('pqWelcomeStyles')) {
        const style = document.createElement('style');
        style.id = 'pqWelcomeStyles';
        style.textContent = `
          .pq-welcome-overlay{position:fixed; inset:0; z-index:10050; display:grid; place-items:center; background:rgba(0,0,0,.45); padding:14px;}
          .pq-welcome-card{width:min(520px,92vw); border-radius:20px; background:linear-gradient(135deg,#f7fbff,#fff7fd); box-shadow:0 18px 55px rgba(0,0,0,.35); overflow:hidden; border:1px solid rgba(0,0,0,.06);}
          .pq-welcome-head{padding:14px 16px 10px; display:flex; gap:12px; align-items:center;}
          .pq-welcome-badge{width:40px; height:40px; border-radius:14px; display:grid; place-items:center; font:900 18px/1 system-ui, -apple-system, BlinkMacSystemFont, "Baloo 2", sans-serif; background:#fff; box-shadow:0 6px 0 rgba(0,0,0,.08);}
          .pq-welcome-title{font:900 18px/1.15 "Baloo 2", system-ui, sans-serif; color:#0c1d26;}
          .pq-welcome-body{padding:0 16px 14px; font:700 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Baloo 2", sans-serif; color:#24374a;}
          .pq-welcome-actions{display:flex; gap:10px; padding:12px 16px 16px;}
          .pq-welcome-btn{flex:1; border:0; border-radius:14px; padding:12px 14px; font:900 15px/1 "Baloo 2", system-ui, sans-serif; cursor:pointer; box-shadow:0 6px 0 rgba(0,0,0,.12);}
          .pq-welcome-begin{background:#e9fff3;}
          .pq-welcome-close{background:#fff;}
          .pq-welcome-btn:active{transform:translateY(1px); box-shadow:0 5px 0 rgba(0,0,0,.12);}
        `;
        document.head.appendChild(style);
      }

      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'pqWelcomeOverlay';
        overlay.className = 'pq-welcome-overlay';
        overlay.setAttribute('role','dialog');
        overlay.setAttribute('aria-modal','true');

        const card = document.createElement('div');
        card.className = 'pq-welcome-card';

        const head = document.createElement('div');
        head.className = 'pq-welcome-head';

        const badge = document.createElement('div');
        badge.className = 'pq-welcome-badge';
        badge.textContent = 'Q';

        const ttl = document.createElement('div');
        ttl.className = 'pq-welcome-title';
        ttl.textContent = title;

        head.appendChild(badge);
        head.appendChild(ttl);

        const body = document.createElement('div');
        body.className = 'pq-welcome-body';
        body.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'pq-welcome-actions';

        const btnBegin = document.createElement('button');
        btnBegin.type='button';
        btnBegin.className='pq-welcome-btn pq-welcome-begin';
        btnBegin.textContent = beginText;

        const btnClose = document.createElement('button');
        btnClose.type='button';
        btnClose.className='pq-welcome-btn pq-welcome-close';
        btnClose.textContent = closeText;

        actions.appendChild(btnBegin);
        actions.appendChild(btnClose);

        card.appendChild(head);
        card.appendChild(body);
        card.appendChild(actions);
        overlay.appendChild(card);

        function cleanup(){
          try { overlay.remove(); } catch(_) {}
          document.removeEventListener('keydown', onKey, true);
        }
        function doExit(){
          cleanup();
          try { if (typeof opts.onExit === 'function') opts.onExit(); } catch(_) {}
          resolve(false);
        }
        function doBegin(){
          cleanup();
          try { if (typeof opts.onBegin === 'function') opts.onBegin(); } catch(_) {}
          resolve(true);
        }
        function onKey(e){
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); doExit(); }
        }

        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) { e.preventDefault(); e.stopPropagation(); }
        });

        btnBegin.addEventListener('click', (e)=>{ e.preventDefault(); doBegin(); });
        btnClose.addEventListener('click', (e)=>{ e.preventDefault(); doExit(); });
        document.addEventListener('keydown', onKey, true);

        document.body.appendChild(overlay);
        try { btnBegin.focus(); } catch(_) {}
      });
    },

    // ---------- Managed progress data helpers (shared) ----------
    ensureProgressShape(raw, baseSteps, defaults = {}) {
      const shaped = { currentStepId: null, __finished: false };
      const defPass = (typeof defaults.passesRequired === 'number' && defaults.passesRequired >= 1) ? defaults.passesRequired : 1;
      const defRep  = (typeof defaults.repeatPerLetter === 'number' && defaults.repeatPerLetter >= 1) ? defaults.repeatPerLetter : 1;

      (baseSteps || []).forEach((s) => {
        const prev = raw && raw[s.id] ? raw[s.id] : {};
        const prevPassesDone = Number(
          prev.passesDone ??
          prev.passes_done ??
          0
        );
        const prevPassesRequired = Number(
          prev.passesRequired ??
          prev.passes_required ??
          defPass
        );
        const prevRepeatPerLetter = Number(
          prev.repeatPerLetter ??
          prev.repeats_per_letter ??
          prev.repeat_per_letter ??
          prev.default_repeats_per_letter ??
          defRep
        );

        const passesDone = Number.isFinite(prevPassesDone) && prevPassesDone >= 0
          ? prevPassesDone
          : 0;
        const passesReq = Number.isFinite(prevPassesRequired) && prevPassesRequired >= 1
          ? prevPassesRequired
          : defPass;
        const repeatPer = Number.isFinite(prevRepeatPerLetter) && prevRepeatPerLetter >= 1
          ? prevRepeatPerLetter
          : defRep;

        shaped[s.id] = {
          passesDone:      passesDone,
          passesRequired:  passesReq,
          repeatPerLetter: repeatPer,
          completed:       !!(prev.completed || prev.step_status === 'completed' || passesDone >= passesReq),
        };

        if (!shaped.currentStepId && !shaped[s.id].completed) shaped.currentStepId = s.id;
      });

      if (!shaped.currentStepId) shaped.currentStepId = defaults.currentStepId || ((baseSteps && baseSteps[0] && baseSteps[0].id) ? baseSteps[0].id : 'lecture');

      if (raw && typeof raw.currentStepId === 'string' && shaped[raw.currentStepId]) shaped.currentStepId = raw.currentStepId;

      if (raw && typeof raw.__finished === 'boolean') shaped.__finished = raw.__finished;
      else shaped.__finished = (baseSteps || []).every(s => shaped[s.id] && shaped[s.id].completed);

      if (raw && raw.__serverHasProgress) shaped.__serverHasProgress = true;

      return shaped;
    },

    mergeServerAndCache(serverProgress, cacheProgress, baseSteps) {
      if (this.forceDbOnly && this.forceDbOnly()) {
        // DB-only mode: never merge or fallback to cache
        return (serverProgress && typeof serverProgress === 'object') ? serverProgress : null;
      }
      const server = serverProgress && typeof serverProgress === 'object' ? serverProgress : null;
      const cache  = cacheProgress && typeof cacheProgress === 'object' ? cacheProgress : null;
      if (!cache) return server;

      const sumPasses = (obj) => {
        if (!obj) return 0;
        let n = 0;
        (baseSteps || []).forEach(st => {
          const p = obj[st.id];
          if (p && typeof p.passesDone === 'number') n += p.passesDone;
        });
        return n;
      };

      const serverHasProgress = !!(server && server.__serverHasProgress);
      const cacheAhead = !!(cache && (
        (sumPasses(cache) > sumPasses(server)) ||
        (cache.__finished && !(server && server.__finished))
      ));

      if (!server || !serverHasProgress || cacheAhead) {
        const merged = Object.assign({}, server || {});
        (baseSteps || []).forEach(st => {
          const s = (server && server[st.id]) ? server[st.id] : {};
          const c = (cache  && cache[st.id])  ? cache[st.id]  : {};
          merged[st.id] = Object.assign({}, s, {
            passesDone: (typeof c.passesDone === 'number') ? c.passesDone : (typeof s.passesDone === 'number' ? s.passesDone : 0),
            completed:  (typeof c.completed === 'boolean') ? c.completed : !!s.completed,
          });
        });
        if (typeof cache.currentStepId === 'string') merged.currentStepId = cache.currentStepId;
        if (typeof cache.__finished === 'boolean')  merged.__finished = cache.__finished;
        return merged;
      }

      return server;
    },

    normalizeManagedPayloadFlexible(payload) {
      const steps = this.buildStepsFromPayload(payload);
      const baseSteps = steps.map(s => ({ id: s.id, label: s.title }));
      const out = this.normalizeManagedPayload(payload, baseSteps);
      out.steps = steps;
      return out;
    },

    bindAutoCache(opts = {}) {
      if (this.forceDbOnly && this.forceDbOnly()) {
        // DB-only mode: do not persist progress to localStorage
        try {
          const pKey = opts && opts.progressKey;
          const lKey = opts && opts.letterPlaysKey;
          if (pKey) localStorage.removeItem(pKey);
          if (lKey) localStorage.removeItem(lKey);
        } catch (_) {}
        return;
      }
      const getProgress    = typeof opts.getProgress === 'function' ? opts.getProgress : () => null;
      const getLetterPlays = typeof opts.getLetterPlays === 'function' ? opts.getLetterPlays : () => null;
      const pKey = opts.progressKey;
      const lKey = opts.letterPlaysKey;

      function persist() {
        try { if (pKey) localStorage.setItem(pKey, JSON.stringify(getProgress() || {})); } catch (_) {}
        try { if (lKey) localStorage.setItem(lKey, JSON.stringify(getLetterPlays() || {})); } catch (_) {}
      }

      window.addEventListener('pagehide', persist);
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') persist();
      });
    },


    // Remember welcome display per session to avoid repeated dialog if desired.
    hasShownWelcome(key) {
      try { return sessionStorage.getItem(String(key)) === '1'; } catch (_) { return false; }
    },
    setShownWelcome(key) {
      try { sessionStorage.setItem(String(key), '1'); } catch (_) {}
    },

    clearCachesOnUserChange(uid, lsKey, keysToClear) {
      try {
        const prev = localStorage.getItem(lsKey);
        const now = String(uid || "");
        if (prev && prev !== now) {
          (keysToClear || []).forEach((k) => {
            try { localStorage.removeItem(k); } catch (_) {}
          });
        }
        localStorage.setItem(lsKey, now);
      } catch (_) {}
    }
  };
  try{ window.PQ = window.PQ || {}; window.PQ.scrollToLetterTile = pqScrollToLetterTile; }catch(_){ }

  // Auto-enable DB-only mode when tokens indicate managed flow.
  try { if (core.forceDbOnly && core.forceDbOnly()) core.setForceDbOnly(true); } catch (_) {}

  
  // ------------------------------------------------------------
  // PQManagedCore.createLessonRuntime(def)
  // Portable managed-lesson runtime (engine). Keeps lessons "UI-only".
  //
  // def = {
  //   lessonid, unitid,
  //   wsGetFunction, wsSetFunction,
  //   defaultSteps: [{id,label,type,filter}], // fallback if server sends no steps
  // }
  // ------------------------------------------------------------
  core.createLessonRuntime = function createLessonRuntime(def){
    const CORE = this;
    const D = Object.assign({
      lessonid: '',
      unitid: '',
      wsGetFunction: '',
      wsSetFunction: '',
      defaultSteps: []
    }, def || {});

    let steps = Array.isArray(D.defaultSteps) ? D.defaultSteps.slice() : [];
    let progress = null; // shaped progress
    let rawProgress = null; // raw object returned from server (progress_json parsed)
    let stepsSource = 'default';

    function _usesGenericUnitState(wsfunction) {
      const fn = String(wsfunction || '').trim();
      return fn === 'local_prequran_get_unit_state' || fn === 'local_prequran_set_unit_state';
    }

    function _unitStateParams(wsfunction) {
      if (!_usesGenericUnitState(wsfunction)) return {};
      return {
        lessonid: D.lessonid || '',
        unitid: D.unitid || ''
      };
    }

    function _deriveFilterFromStepId(stepId){
      const id = String(stepId||'').toLowerCase();
      if (id === 'heavy') return 'heavy';
      if (id === 'light') return 'light';
      if (id === 'vowels') return 'vowel';
      if (id === 'alifaa') return 'alifaa';
      return 'all';
    }

    function _stepsFallbackIfEmpty(serverSteps){
      if (Array.isArray(serverSteps) && serverSteps.length) return serverSteps;
      // Ensure sane defaults
      return (Array.isArray(D.defaultSteps) && D.defaultSteps.length) ? D.defaultSteps.slice() : [
        { id:'lecture',     type:'lecture',  label:'Lecture',           filter:'all' },
        { id:'all_letters', type:'playlist', label:'All letters',       filter:'all' },
        { id:'heavy',       type:'playlist', label:'Heavy letters',     filter:'heavy' },
        { id:'light',       type:'playlist', label:'Light letters',     filter:'light' },
        { id:'alifaa',      type:'playlist', label:'Letters with Alif', filter:'alifaa' },
        { id:'vowels',      type:'playlist', label:'Vowels',            filter:'vowel' }
      ];
    }

    function _coerceSteps(serverSteps){
      const s = _stepsFallbackIfEmpty(serverSteps);
      // normalize shape expected by lessons
      return s.map((x)=>{
        const id = String(x.id||x.step_id||'');
        const type = x.type || x.step_type || (id==='lecture' ? 'lecture' : 'playlist');
        const label = x.label || x.title || x.step_title || id;
        const filter = (type==='lecture') ? 'all' : (x.filter || _deriveFilterFromStepId(id));
        // Keep server-derived passes/repeats in progress (not in step definition)
        return { id, type, label, filter, step_index: x.step_index };
      }).filter(z=>z.id);
    }

    function _advance(){
      if (!progress) return;
      for (let i=0;i<steps.length;i++){
        const s = steps[i];
        if (progress[s.id] && !progress[s.id].completed){
          progress.currentStepId = s.id;
          progress.__finished = false;
          return;
        }
      }
      progress.__finished = true;
    }

    async function init(opts){
      opts = opts || {};
      // For managed flows, auto-enable DB-only if tokens are present
      try { if (CORE.forceDbOnly && CORE.forceDbOnly()) CORE.setForceDbOnly(true); } catch(_){}
      try {
        if (typeof CORE.hydrateTokens === 'function') CORE.hydrateTokens();
        if (D.wsGetFunction && typeof CORE.waitForTokens === 'function') {
          await CORE.waitForTokens(2000);
        }
      } catch (_) {}

      // One-time: clear caches if user changed (prevents ghost UI)
      try{
        const uid = (window.__prequran_uid != null) ? window.__prequran_uid : null;
        if (uid && typeof CORE.clearCachesOnUserChange === 'function'){
          const keysToClear = Array.isArray(opts.clearKeys) ? opts.clearKeys : [];
          CORE.clearCachesOnUserChange(uid, opts.userKey || 'pq_last_uid_v1', keysToClear);
        }
      }catch(_){}

      let payload = null;
      if (D.wsGetFunction && typeof CORE.wsGet === 'function') {
        payload = await CORE.wsGet(Object.assign({
          wsfunction: D.wsGetFunction,
          userid: (window.__prequran_uid != null) ? window.__prequran_uid : (opts.userid || ''),
          wstoken: window.__prequran_ws_token || (opts.wstoken || '')
        }, _unitStateParams(D.wsGetFunction)));
      }
      try {
        window.__PQ_LAST_MANAGED_PAYLOAD__ = payload || null;
      } catch (_) {}

      // Normalize steps + progress
      let normalized = null;
      if (payload) {
        if (typeof CORE.normalizeManagedPayloadFlexible === 'function') {
          normalized = CORE.normalizeManagedPayloadFlexible(payload);
        } else if (typeof CORE.normalizeManagedPayload === 'function') {
          normalized = CORE.normalizeManagedPayload(payload, (D.defaultSteps||[]).map(s=>({id:s.id,label:s.label||s.title||s.id})));
        }
      }

      if (normalized && Array.isArray(normalized.steps) && normalized.steps.length) {
        // Server steps win
        steps = _coerceSteps(normalized.steps);
        stepsSource = 'moodle';
      } else {
        // Fallback to local definition
        steps = _coerceSteps(D.defaultSteps);
        stepsSource = 'default';
      }
      try {
        window.__PQ_LAST_MANAGED_SOURCE__ = stepsSource;
        window.__PQ_LAST_MANAGED_STEPS__ = steps.slice();
      } catch (_) {}

      rawProgress = (normalized && normalized.raw && typeof normalized.raw === 'object') ? normalized.raw : {};
      try {
        const dbOnlyNoServerProgress = !!(
          CORE.forceDbOnly &&
          CORE.forceDbOnly() &&
          !(rawProgress && rawProgress.__serverHasProgress)
        );

        if (dbOnlyNoServerProgress) {
          // PQ_DB_ONLY_NO_CACHE_MERGE: Moodle-managed launches with no DB progress
          // must render a fresh unit, never resurrect old browser progress.
          (Array.isArray(opts.clearKeys) ? opts.clearKeys : []).forEach((key) => {
            try { localStorage.removeItem(String(key)); } catch (_) {}
          });
          try { window.__PQ_DB_ONLY_NO_CACHE_MERGE__ = true; } catch (_) {}
        }
      } catch (_) {}
      // Ensure shape with server passes/repeats already merged in normalizeManagedPayload
      if (typeof CORE.ensureProgressShape === 'function') {
        progress = CORE.ensureProgressShape(rawProgress, steps, { passesRequired:1, repeatPerLetter:1, currentStepId:(steps[0] ? steps[0].id : 'lecture') });
      } else {
        // Minimal fallback
        progress = { currentStepId: (steps[0] ? steps[0].id : 'lecture'), __finished:false };
        steps.forEach(s=>{
          const prev = rawProgress && rawProgress[s.id] ? rawProgress[s.id] : {};
          progress[s.id] = {
            passesDone: (typeof prev.passesDone === 'number') ? prev.passesDone : 0,
            passesRequired: (typeof prev.passesRequired === 'number' && prev.passesRequired >= 1) ? prev.passesRequired : 1,
            repeatPerLetter: (typeof prev.repeatPerLetter === 'number' && prev.repeatPerLetter >= 1) ? prev.repeatPerLetter : 1,
            completed: !!prev.completed
          };
        });
        _advance();
      }

      _advance();
      return getState();
    }

    function getState(){
      return { steps: steps.slice(), progress, rawProgress, stepsSource, managed: !!(CORE.isManagedStudent && CORE.isManagedStudent()), dbOnly: !!(CORE.forceDbOnly && CORE.forceDbOnly()) };
    }

    function getCurrentStep(){
      if (!progress) return { step: steps[0] || null, progress: null, index: 0 };
      const id = progress.currentStepId || (steps[0] ? steps[0].id : 'lecture');
      const idx = Math.max(0, steps.findIndex(s=>s.id===id));
      const step = steps[idx] || steps[0] || null;
      return { step, progress: progress[step ? step.id : id], index: idx };
    }

    async function persist(){
      if (!D.wsSetFunction || !progress) return;
      if (typeof CORE.wsSet !== 'function') return;
      await CORE.wsSet(Object.assign({
        wsfunction: D.wsSetFunction,
        userid: window.__prequran_uid,
        wstoken: window.__prequran_ws_token,
        progressObj: progress
      }, _unitStateParams(D.wsSetFunction)));
    }

    async function completeStep(stepId){
      if (!progress) return;
      const id = String(stepId || '');
      if (!id || !progress[id]) return;

      const p = progress[id];
      p.passesDone = (typeof p.passesDone === 'number' ? p.passesDone : 0) + 1;
      if (p.passesDone >= (p.passesRequired || 1)) {
        p.completed = true;
      }
      _advance();
      try{ if (window.FocusGuard && typeof window.FocusGuard.markStepComplete === 'function') window.FocusGuard.markStepComplete(id); }catch(_){}
      await persist();
      return getState();
    }

    function setFocusContext(ctx){
      try{
        if (window.FocusGuard && typeof window.FocusGuard.setContext === 'function') {
          window.FocusGuard.setContext(Object.assign({
            lessonid: D.lessonid || '',
            unitid: D.unitid || ''
          }, ctx || {}));
        }
      }catch(_){}
    }

    
    async function refresh(opts){
      // Re-hydrate from server truth (DB-only safe). Keeps local letterPlays intact.
      opts = opts || {};
      const payload = await CORE.wsGet(Object.assign({
        wsfunction: D.wsGetFunction,
        userid: (window.__prequran_uid != null) ? window.__prequran_uid : (opts.userid || ''),
        wstoken: window.__prequran_ws_token || (opts.wstoken || '')
      }, _unitStateParams(D.wsGetFunction)));
      try {
        window.__PQ_LAST_MANAGED_PAYLOAD__ = payload || null;
      } catch (_) {}
      let normalized = null;
      if (payload) {
        if (typeof CORE.normalizeManagedPayloadFlexible === 'function') normalized = CORE.normalizeManagedPayloadFlexible(payload);
        else if (typeof CORE.normalizeManagedPayload === 'function') normalized = CORE.normalizeManagedPayload(payload, (D.defaultSteps||[]).map(s=>({id:s.id,label:s.label||s.id})));
      }
      if (normalized && Array.isArray(normalized.steps) && normalized.steps.length) {
        steps = _coerceSteps(normalized.steps);
        stepsSource = 'moodle';
      } else {
        steps = _coerceSteps(D.defaultSteps);
        stepsSource = 'default';
      }
      try {
        window.__PQ_LAST_MANAGED_SOURCE__ = stepsSource;
        window.__PQ_LAST_MANAGED_STEPS__ = steps.slice();
      } catch (_) {}
      rawProgress = (normalized && normalized.raw && typeof normalized.raw === 'object') ? normalized.raw : {};
      progress = CORE.ensureProgressShape ? CORE.ensureProgressShape(rawProgress, steps, { passesRequired:1, repeatPerLetter:1, currentStepId:(steps[0]?steps[0].id:'lecture') }) : progress;
      _advance();
      return getState();
    }

    return { init, refresh, getState, getCurrentStep, completeStep, persist, setFocusContext };
  };

window.PQManagedCore = core;
  PQ.ManagedCore = core;
})(window);


/* =========================================================
 * Review Mode Patch v1.0.1
 * - recreates post-completion review/unmanaged-enabled mode
 * - prevents dead-end state after all steps complete
 * - exposes review flags for unit-level guards
 * =======================================================*/
(function (window) {
  'use strict';

  var core = window.PQManagedCore;
  if (!core || core.__reviewModePatchApplied) return;
  core.__reviewModePatchApplied = 'v1.0.1';

  function computeAllCompleted(progress, steps) {
    try {
      if (!progress || !Array.isArray(steps) || !steps.length) return false;
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i] || {};
        var id = String(s.id || s.step_id || '');
        if (!id) continue;
        if (!progress[id] || !progress[id].completed) return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function unlockCommonControls() {
    try {
      var selectors = [
        '[data-action="play-lecture"]',
        '[data-action="play-all"]',
        '[data-action="demo"]',
        '[data-action="trace"]',
        '[data-action="worksheet"]',
        '[data-action="restart"]',
        '.pq-btn-lecture',
        '.pq-btn-playall',
        '.pq-btn-demo',
        '.pq-btn-trace',
        '.pq-btn-worksheet',
        '.pq-btn-restart',
        'button[data-stepid]'
      ];
      for (var i = 0; i < selectors.length; i++) {
        var nodes = document.querySelectorAll(selectors[i]);
        for (var j = 0; j < nodes.length; j++) {
          try {
            nodes[j].disabled = false;
            nodes[j].removeAttribute('disabled');
            if (nodes[j].classList) nodes[j].classList.remove('is-disabled', 'disabled');
            nodes[j].style.pointerEvents = '';
            nodes[j].style.opacity = '';
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  core.isReviewMode = function () {
    return !!window.__PQ_REVIEW_MODE__;
  };

  core.openStepInReview = function (stepId) {
    try { window.__PQ_REVIEW_TARGET_STEP__ = String(stepId || ''); } catch (_) {}
    try {
      document.dispatchEvent(new CustomEvent('pq:open-step-review', {
        detail: { stepId: String(stepId || '') }
      }));
    } catch (_) {}
  };

  core.enterReviewMode = function (info) {
    try { window.__PQ_REVIEW_MODE__ = true; } catch (_) {}
    try { window.__PQ_UNMANAGED_AFTER_COMPLETE__ = true; } catch (_) {}
    try { window.__PQ_REVIEW_INFO__ = info || {}; } catch (_) {}
    try { document.body.classList.add('pq-review-mode', 'pq-lesson-complete'); } catch (_) {}
    unlockCommonControls();
    try {
      document.dispatchEvent(new CustomEvent('pq:review-mode-enabled', {
        detail: info || {}
      }));
    } catch (_) {}
  };

  var origEnsure = typeof core.ensureProgressShape === 'function' ? core.ensureProgressShape : null;
  if (origEnsure) {
    core.ensureProgressShape = function (raw, baseSteps, defaults) {
      var shaped = origEnsure.call(this, raw, baseSteps, defaults);
      try {
        var allCompleted = computeAllCompleted(shaped, baseSteps || []);
        shaped.__allCompleted = !!allCompleted;
        if (allCompleted) {
          shaped.__finished = false;
        }
      } catch (_) {}
      return shaped;
    };
  }

  var origCreateRuntime = typeof core.createLessonRuntime === 'function' ? core.createLessonRuntime : null;
  if (origCreateRuntime) {
    core.createLessonRuntime = function patchedCreateLessonRuntime(def) {
      var runtime = origCreateRuntime.call(this, def);
      if (!runtime) return runtime;
      var cfg = def || {};

      function applyPostCompletion(state) {
        try {
          if (!state || !state.progress || !Array.isArray(state.steps)) return state;
          var allCompleted = computeAllCompleted(state.progress, state.steps);
          state.progress.__allCompleted = !!allCompleted;
          if (allCompleted) {
            state.progress.__finished = false;
            core.enterReviewMode({
              lessonid: cfg.lessonid || '',
              unitid: cfg.unitid || '',
              steps: state.steps,
              currentStepId: state.progress.currentStepId || ''
            });
          }
        } catch (_) {}
        return state;
      }

      var wrapped = {
        persist: runtime.persist,
        setFocusContext: runtime.setFocusContext,
        openStepInReview: function (stepId) {
          return core.openStepInReview(stepId);
        },
        isReviewMode: function () {
          return core.isReviewMode();
        },
        getState: function () {
          return applyPostCompletion(runtime.getState ? runtime.getState() : null);
        },
        getCurrentStep: function () {
          return runtime.getCurrentStep ? runtime.getCurrentStep() : null;
        },
        init: async function (opts) {
          return applyPostCompletion(await runtime.init(opts));
        },
        refresh: async function (opts) {
          return applyPostCompletion(await runtime.refresh(opts));
        },
        completeStep: async function (stepId) {
          return applyPostCompletion(await runtime.completeStep(stepId));
        }
      };

      for (var k in runtime) {
        if (!(k in wrapped)) wrapped[k] = runtime[k];
      }
      return wrapped;
    };
  }
})(window);
