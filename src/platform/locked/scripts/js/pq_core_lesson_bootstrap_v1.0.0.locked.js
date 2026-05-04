/* pq_lesson_bootstrap_v1.0.js
   Drop-in bootstrap to standardize:
   - DOM contract containers (header/status/stepper/lecture/board)
   - Managed vs Unmanaged gating (UI + DB behavior stays inside your core engine)
   - Status Row (Ready / About / Managed Practice Steps label)
   - Safe hooks for lecture + counters

   Zero-breaking: if modules aren't present, it no-ops gracefully.
*/
(function () {
  "use strict";

  const BOOT_VER = "1.0.1_LOCKED";

  function isDebug(){
    try {
      const q = new URLSearchParams(String(window.location.search||"" ).replace(/&amp;/g,"&"));
      return q.get("pqdebug") === "1" || localStorage.getItem("pq_debug") === "1";
    } catch (_) { return false; }
  }

  // -------------------------
  // Helpers
  // -------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  };
  
 
  function log(...args) {
    // Keep logs minimal; comment out if you want silence
    if (isDebug()) console.log("[PQLessonBootstrap]", ...args);
  }

  function safeCall(fn, ...args) {
    try { return fn && fn(...args); } catch (e) { if (isDebug()) console.warn("[PQLessonBootstrap] call failed:", e); }
  }

  // -------------------------
  // Config discovery
  // -------------------------
  function readConfig() {
    // Highest priority: window.PQLessonConfig set by lesson page
    const cfg = (window.PQLessonConfig && typeof window.PQLessonConfig === "object")
      ? window.PQLessonConfig
      : {};

    // Next: data attributes on body
    const b = document.body;
    const unit = cfg.unitid || cfg.unitId || b.getAttribute("data-unit") || b.getAttribute("data-unitid") || "";
    const lesson = cfg.lessonid || cfg.lessonId || b.getAttribute("data-lesson") || b.getAttribute("data-lessonid") || unit || "";
    const title = cfg.title || cfg.lessonTitle || document.title || lesson;

    // Feature flags (defaults safe)
    const flags = Object.assign({
      showStatusRow: true,
      managedOnlyStatusRow: false, // usually false; status row is OK for all, but "Managed Practice Steps" label will adapt
      managedOnlyStartDialog: true,
      unmanagedHideStepper: true,
      unmanagedHideProgressBadges: true,
      headerMode: "auto", // "auto" | "minimal" | "full"
      aboutLabel: cfg.aboutLabel || "", // e.g. "About Tanween"
    }, (cfg.flags || {}));

    // About media (optional)
    const about = Object.assign({
      text: cfg.aboutText || "",       // if you have an about modal
      audioUrl: cfg.aboutAudioUrl || "", // if you have about audio
      videoUrl: cfg.aboutVideoUrl || "", // if you have about video
    }, (cfg.about || {}));

    return { lessonid: lesson, unitid: unit || lesson, title, flags, about, raw: cfg };
  }

  // -------------------------
  // DOM contract (creates missing containers)
  // -------------------------
  function ensureContractContainers(cfg) {
    // Prefer an existing wrapper; otherwise create one
    let root = $(".pq-lesson");
    if (!root) {
      // If your lessons already have a main container, reuse it
      root = $(".pq_wrap") || $(".wrapper") || document.body;
      // But we still add a marker class for styling/scoping
      root.classList.add("pq-lesson");
    }

    // Tag body for per-unit CSS targeting
    if (cfg.unitid) document.body.setAttribute("data-unit", cfg.unitid);
    if (cfg.lessonid) document.body.setAttribute("data-lesson", cfg.lessonid);

    // Find best insertion point: after your existing header area if it exists
    // If a lesson already has these regions, we do not duplicate them.
    const header = $(".pq-header") || $("#pqHeader") || $(".lesson-header") || null;

    // Contract nodes
    let statusRow = $(".pq-status-row");
    let stepper = $(".pq-stepper");
    let lectureCta = $(".pq-lecture-cta");
    let board = $(".pq-board") || $(".tiles") || $(".grid") || $(".letters-grid") || null;

    if (!statusRow) {
      statusRow = el("div", "pq-status-row");
      // Insert status row under header if possible, else at top of root
      if (header && header.parentNode) {
        header.insertAdjacentElement("afterend", statusRow);
      } else {
        root.insertAdjacentElement("afterbegin", statusRow);
      }
    }

    if (!stepper) {
      // try to detect existing stepper wrapper in your pages
      const existing = $(".pq_steps_wrap") || $(".steps-wrap") || $(".stepper-wrap");
      stepper = existing || el("section", "pq-stepper");
      if (!existing) statusRow.insertAdjacentElement("afterend", stepper);
      stepper.classList.add("pq-stepper");
    }

    if (!lectureCta) {
      const existing = $(".pq_lecture_wrap") || $(".lecture-wrap") || $(".pq-lecture");
      lectureCta = existing || el("section", "pq-lecture-cta");
      if (!existing) stepper.insertAdjacentElement("afterend", lectureCta);
      lectureCta.classList.add("pq-lecture-cta");
    }

    if (!board) {
      // last resort: create a board container, but do not move existing tiles if they already exist elsewhere.
      board = el("main", "pq-board");
      lectureCta.insertAdjacentElement("afterend", board);
    } else {
      board.classList.add("pq-board");
    }

    return { root, statusRow, stepper, lectureCta, board };
  }

  // -------------------------
  // Status Row renderer (Ready | About | Steps label)
  // -------------------------
  function renderStatusRow(dom, cfg, ctx) {
	  
if (document.body.dataset.layout === "legacy" && !cfg.flags.forceStatusRow) {
  if (isDebug()) console.info("[PQ] Legacy layout detected — skipping status row injection");
  return;
}


    if (!cfg.flags.showStatusRow) return;   

 
    // If managedOnlyStatusRow and user is unmanaged, skip
    if (cfg.flags.managedOnlyStatusRow && !ctx.managed) return;

    const lessonLabel = cfg.raw.stepsLabel || cfg.raw.stepsTitle || cfg.title || cfg.lessonid;
    const aboutText = cfg.flags.aboutLabel || cfg.about.text || cfg.aboutLabel || `About ${lessonLabel}`;

    dom.statusRow.innerHTML = "";

    // Left: Ready pill
    const ready = el("div", "pq-pill pq-pill--ready");
    ready.textContent = "Ready";

    // Middle: About pill
    const about = el("button", "pq-pill pq-pill--about");
    about.type = "button";

    const aboutSpan = el("span", "pq-pill__text");
    aboutSpan.textContent = aboutText;

    const eye = el("span", "pq-pill__icon pq-pill__icon--eye");
    eye.textContent = "👁";

    const spk = el("span", "pq-pill__icon pq-pill__icon--audio");
    spk.textContent = "🔊";

    about.appendChild(aboutSpan);
    about.appendChild(eye);
    about.appendChild(spk);

    // Right: Managed Practice Steps label (adapts if unmanaged)
    const right = el("div", "pq-status-right");
    right.innerHTML = ctx.managed
      ? `Managed Practice Steps — <span class="pq-status-unit">${escapeHtml(lessonLabel)}</span>`
      : `Practice Mode — <span class="pq-status-unit">${escapeHtml(lessonLabel)}</span>`;

    dom.statusRow.appendChild(ready);
    dom.statusRow.appendChild(about);
    dom.statusRow.appendChild(right);

    // Hook about click:
    about.addEventListener("click", () => {
      // Prefer lecture module to handle About if it exposes a method
      const lecture = window.PQLecture || window.PQCoreLecture || window.pqLecture;
      if (lecture && typeof lecture.openAbout === "function") {
        lecture.openAbout({ lessonid: cfg.lessonid, unitid: cfg.unitid, title: lessonLabel, ...cfg.about });
        return;
      }
      // Fallback: play about audio if provided
      if (cfg.about.audioUrl) {
        try {
          const a = new Audio(cfg.about.audioUrl);
          a.play().catch(() => {});
        } catch (e) {}
      }
    });
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // -------------------------
  // Managed context + gating (UI-level only, DB gating stays in engine)
  // -------------------------
  async function getAuthContext() {
    // Preferred: PQAuth module
    const PQAuth = window.PQAuth || window.pq_core_auth_tokens || window.pqAuth;
    if (PQAuth && typeof PQAuth.getContext === "function") {
      const ctx = await PQAuth.getContext();
      return normalizeCtx(ctx);
    }
    // Fallback: attempt to infer from globals
    return normalizeCtx({
      uid: window.PQ_UID || "",
      token: window.PQ_TOKEN || "",
      managed: !!window.PQ_MANAGED
    });
  }

  function normalizeCtx(ctx) {
    const managed = !!(ctx && (ctx.managed === true || ctx.managed === "1" || ctx.managed === 1));
    return {
      uid: (ctx && (ctx.uid || ctx.userid || "")) + "",
      token: (ctx && (ctx.token || ctx.wstoken || "")) + "",
      managed,
      raw: ctx || {}
    };
  }

  function applyUnmanagedUI(dom, cfg) {
    if (!cfg.flags.unmanagedHideStepper) return;
    dom.root.classList.add("pq-unmanaged");

    // Hide stepper area visually; do not delete it (zero-break)
    if (dom.stepper) dom.stepper.classList.add("pq-hide-when-unmanaged");

    // Optionally hide “Source: DB” / progress badges if your markup uses these classes
    if (cfg.flags.unmanagedHideProgressBadges) {
      dom.root.classList.add("pq-unmanaged-hide-progress");
    }
  }

  // -------------------------
  // Engine wiring (minimal, safe)
  // -------------------------
  async function initManagedEngine(cfg, ctx, dom) {
    const core = window.PQManagedCore || window.PQManagedEngine || window.pq_core_managed_engine;
    if (!core) return null;

    // If the engine has a standard init, call it.
    // We do not assume exact signature; we pass a config object.
    if (typeof core.init === "function") {
      safeCall(core.init.bind(core), {
        lessonid: cfg.lessonid,
        unitid: cfg.unitid,
        uid: ctx.uid,
        token: ctx.token,
        managed: ctx.managed,
        mount: {
          stepper: dom.stepper,
          lecture: dom.lectureCta
        },
        version: BOOT_VER
      });
    }

    return core;
  }

  function initStartDialogIfNeeded(cfg, ctx) {
    if (!ctx.managed) return;
    if (!cfg.flags.managedOnlyStartDialog) return;

    const dlg = window.PQLessonStartDialog || window.PQStartDialog;
    if (dlg && typeof dlg.showIfNeeded === "function") {
      // If you already have this module, we’ll use it
      safeCall(dlg.showIfNeeded.bind(dlg), { lessonid: cfg.lessonid, unitid: cfg.unitid, title: cfg.title });
      return;
    }

    // Fallback: lightweight built-in dialog (won’t break anything)
    // It only blocks "managed auto-start" if you wire lesson player to listen to this event.
    // If you don't wire it, it just shows a nice confirmation and closes.
    const key = `pq_start_ok_${cfg.unitid || cfg.lessonid}`;
    if (sessionStorage.getItem(key) === "1") return;

    const overlay = el("div", "pq-startdlg");
    overlay.innerHTML = `
      <div class="pq-startdlg__card" role="dialog" aria-modal="true">
        <div class="pq-startdlg__title">Welcome to ${escapeHtml(cfg.title)}</div>
        <div class="pq-startdlg__text">Press <b>Begin</b> to start the lesson or close to exit.</div>
        <div class="pq-startdlg__actions">
          <button class="pq-btn pq-btn--primary" data-act="begin">Begin</button>
          <button class="pq-btn" data-act="close">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest && e.target.closest("button[data-act]");
      if (!btn) return;
      const act = btn.getAttribute("data-act");
      if (act === "begin") {
        sessionStorage.setItem(key, "1");
        window.dispatchEvent(new CustomEvent("pq:lesson-begin", { detail: { lessonid: cfg.lessonid, unitid: cfg.unitid } }));
        overlay.remove();
      } else {
        window.dispatchEvent(new CustomEvent("pq:lesson-exit", { detail: { lessonid: cfg.lessonid, unitid: cfg.unitid } }));
        overlay.remove();
        // Optional: go back
        if (typeof history.back === "function") history.back();
      }
    });
  }

  // -------------------------
  // Bootstrap main
  // -------------------------
  async function main() {
    const cfg = readConfig();
    const dom = ensureContractContainers(cfg);

    log(`v${BOOT_VER}`, { lessonid: cfg.lessonid, unitid: cfg.unitid });

    const ctx = await getAuthContext();

    // Render status row early so all lessons match visually
    renderStatusRow(dom, cfg, ctx);

    // Gate unmanaged UI (visual + prevents stepper usage at UI level)
    if (!ctx.managed) {
      applyUnmanagedUI(dom, cfg);
    }

    // Init engine (managed/unmanaged engine should already ignore DB writes for unmanaged if you implement that rule inside engine)
    const engine = await initManagedEngine(cfg, ctx, dom);

    // Start dialog (managed only)
    initStartDialogIfNeeded(cfg, ctx);

    // Expose a tiny standardized hook for lesson scripts (optional)
    window.PQLessonBootstrap = {
      version: BOOT_VER,
      cfg,
      ctx,
      dom,
      engine
    };

    window.dispatchEvent(new CustomEvent("pq:bootstrap-ready", { detail: { cfg, ctx, dom, engine } }));
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }

})();
