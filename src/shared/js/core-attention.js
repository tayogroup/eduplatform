/* pq_core_attention_v1.0.2_LOCKED.js (FocusGuard)
   Syntax-safe release based on pq_focus_guard_v007_attention_patch_v9_streamlined_meta.
   Matches externallib set_focus_event_parameters().
*/

/* pq_focus_guard_v007_attention_patch_v6.js
 * FocusGuard (managed-only) — tuned for lower DB write volume, NO SYNTAX RISK.
 *
 * Goals (per request):
 * - Reduce DB load: default active_flush timer every 60s (configurable 30–60+)
 * - Flush on: step completion (manual hook), pagehide/beforeunload, leave/idle events
 * - Avoid noisy unload fetch errors (best-effort only)
 *
 * Notes:
 * - This file only handles focus/idle/tab events and DB logging.
 * - Camera "away from screen" prompt is handled by PQAttentionGuard + lesson overlay (separate).
 */

window.FocusGuard = window.FocusGuard || (() => {
  let cfg = null;
  let ctx = {};
  let active = false;

  let idleTimer = null;
  let leaveCount = 0;
  let idleCount  = 0;

  let activeMs = 0;
  let activeTick = null;
  let lastActiveTs = 0;

  // Flush controls
  let flushTimer = null;
  let lastFlushAt = 0;
  let lastSentActiveMs = 0;

  // Throttles
  const MIN_FLUSH_INTERVAL_MS = 15000; // hard throttle between any active_flush writes
  const MIN_ACTIVE_DELTA_MS   = 10000; // only timer-flush if >=10s new active time since last send

  const PQ_MEDIA_GRACE_MS = 2500;

  function pqMarkMediaActive(durationMs){
    try{
      const ms = Math.max(PQ_MEDIA_GRACE_MS, Number(durationMs || 0) || 0);
      window.__PQ_MEDIA_ACTIVE_UNTIL__ = Math.max(
        Number(window.__PQ_MEDIA_ACTIVE_UNTIL__ || 0) || 0,
        Date.now() + ms
      );
      window.__PQ_MEDIA_ACTIVE__ = true;
    }catch(_e){}
  }

  function pqClearMediaActiveSoon(){
    try{
      window.__PQ_MEDIA_ACTIVE_UNTIL__ = Math.max(
        Number(window.__PQ_MEDIA_ACTIVE_UNTIL__ || 0) || 0,
        Date.now() + PQ_MEDIA_GRACE_MS
      );
      setTimeout(function(){
        try{
          if (Date.now() >= (Number(window.__PQ_MEDIA_ACTIVE_UNTIL__ || 0) || 0)) {
            window.__PQ_MEDIA_ACTIVE__ = false;
          }
        }catch(_e){}
      }, PQ_MEDIA_GRACE_MS + 120);
    }catch(_e){}
  }

  function pqBindMediaPresenceHooks(){
    try{
      if (window.__PQ_MEDIA_PRESENCE_HOOKS_BOUND__) return;
      window.__PQ_MEDIA_PRESENCE_HOOKS_BOUND__ = true;
      window.__PQ_MARK_MEDIA_ACTIVE__ = pqMarkMediaActive;
      window.__PQ_CLEAR_MEDIA_ACTIVE_SOON__ = pqClearMediaActiveSoon;

      const proto = window.HTMLMediaElement && window.HTMLMediaElement.prototype;
      if (proto && typeof proto.play === 'function' && !proto.play.__pqPresenceWrapped) {
        const originalPlay = proto.play;
        const wrappedPlay = function(){
          try{ pqMarkMediaActive(10000); }catch(_e){}
          try{
            if (!this.__pqPresenceMediaEventsBound) {
              this.__pqPresenceMediaEventsBound = true;
              this.addEventListener('play', function(){ pqMarkMediaActive(10000); });
              this.addEventListener('playing', function(){ pqMarkMediaActive(10000); });
              this.addEventListener('timeupdate', function(){ pqMarkMediaActive(4000); });
              this.addEventListener('pause', pqClearMediaActiveSoon);
              this.addEventListener('ended', pqClearMediaActiveSoon);
              this.addEventListener('error', pqClearMediaActiveSoon);
            }
          }catch(_e){}
          const result = originalPlay.apply(this, arguments);
          try{
            if (result && typeof result.then === 'function') {
              result.then(function(){ pqMarkMediaActive(10000); }).catch(pqClearMediaActiveSoon);
            }
          }catch(_e){}
          return result;
        };
        wrappedPlay.__pqPresenceWrapped = true;
        proto.play = wrappedPlay;
      }

      ['play','playing','timeupdate'].forEach(function(evt){
        document.addEventListener(evt, function(){ pqMarkMediaActive(evt === 'timeupdate' ? 4000 : 10000); }, true);
      });
      ['pause','ended','error'].forEach(function(evt){
        document.addEventListener(evt, pqClearMediaActiveSoon, true);
      });
    }catch(_e){}
  }

  
  // ------------------------------
  // Option B: Gentle Presence Prompt (no camera)
  // Shows a friendly overlay when user leaves tab / goes idle, and hides on interaction.
  // ------------------------------
  const PQ_PRESENCE_PROMPT_ID = 'pqPresencePrompt';
  function pqEnsurePresencePrompt(){
    try{
      let el = document.getElementById(PQ_PRESENCE_PROMPT_ID);
      if (el) return el;

      el = document.createElement('div');
      el.id = PQ_PRESENCE_PROMPT_ID;
      el.style.cssText = [
        'position:fixed','inset:0','display:none','align-items:center','justify-content:center',
        'z-index:10080','background:rgba(0,0,0,.18)','padding:14px'
      ].join(';');

      el.innerHTML = `
        <div style="
          width:min(520px,92vw);
          background:#fff;
          border-radius:18px;
          box-shadow:0 18px 55px rgba(0,0,0,.28);
          border:1px solid rgba(0,0,0,.08);
          overflow:hidden;
        ">
          <div style="padding:14px 16px;font:900 18px/1.15 system-ui,'Baloo 2',sans-serif;color:#0c1d26;">
            Let’s come back to the screen 😊
          </div>
          <div style="padding:0 16px 14px;font:700 14px/1.45 system-ui,'Baloo 2',sans-serif;color:#24374a;">
            We paused to protect your progress. Tap Continue when you’re ready, inshaAllah.
          </div>
          <div style="display:flex;gap:10px;padding:12px 16px 16px;">
            <button id="pqPresenceContinueBtn" type="button"
              style="flex:1;border:0;border-radius:14px;padding:12px 14px;font:900 15px/1 system-ui,'Baloo 2',sans-serif;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.12);background:#e9fff3;">
              Continue
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(el);

      const btn = el.querySelector('#pqPresenceContinueBtn');
      if (btn && !btn.__pqBound){
        btn.__pqBound = true;
        btn.addEventListener('click', () => {
          pqHidePresencePrompt();
          try{ externalResume('prompt_continue'); }catch(_){}
        });
      }
      return el;
    }catch(_e){
      return null;
    }
  }

  function pqShowPresencePrompt(){
    try{
      if (pqIsMediaActive()) return;
      const el = pqEnsurePresencePrompt();
      if (el) el.style.display = 'flex';
    }catch(_){}
  }
  function pqHidePresencePrompt(){
    try{
      const el = document.getElementById(PQ_PRESENCE_PROMPT_ID);
      if (el) el.style.display = 'none';
    }catch(_){}
  }

  // Hide prompt on user interaction
  function pqBindPresenceHideOnActivity(){
    try{
      const hide = () => pqHidePresencePrompt();
      ['pointerdown','keydown','touchstart','mousemove'].forEach(evt => {
        window.addEventListener(evt, hide, { passive:true });
      });
      window.addEventListener('focus', hide);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) hide(); });
    }catch(_){}
  }

// ------------------------------
  // Cross-frame resolvers (same origin)
  // ------------------------------
  function pqResolveVar(varName){
    let w = window;
    for (let depth = 0; depth < 6; depth++){
      try{
        if (w && Object.prototype.hasOwnProperty.call(w, varName) && w[varName]) return w[varName];
        if (!w || !w.parent || w.parent === w) break;
        w = w.parent;
      }catch(_e){ break; }
    }
    return null;
  }

  function pqResolveCore(){
    try{ if (window.PQIframe && typeof window.PQIframe.resolveCore === 'function') { const c = window.PQIframe.resolveCore(); if (c) return c; } }catch(_e){}

    let w = window;
    for (let depth = 0; depth < 6; depth++){
      try{
        const c = w.PQManagedCore || (w.PQ && w.PQ.ManagedCore) || null;
        if (c) return c;
        if (!w.parent || w.parent === w) break;
        w = w.parent;
      }catch(_e){ break; }
    }
    return null;
  }

  function pqGetUid(){
    try{ if (window.PQIframe && typeof window.PQIframe.getUid === 'function') { const u = window.PQIframe.getUid(); if (u != null) return u; } }catch(_e){}
    return pqResolveVar('__prequran_uid') || pqResolveVar('prequran_uid') || null;
  }
  function pqGetToken(){
    try{ if (window.PQIframe && typeof window.PQIframe.getToken === 'function') { const t = window.PQIframe.getToken(); if (t) return t; } }catch(_e){}
    return pqResolveVar('__prequran_ws_token') || pqResolveVar('prequran_ws_token') || null;
  }
  function nowSec(){ return Math.floor(Date.now() / 1000); }

  // ------------------------------
  // Media-aware idle suppression
  // If audio/video is playing, or Play All is active, do NOT trigger idle_timeout.
  // Lesson scripts may optionally provide a precise hook:
  //   window.__PQ_FOCUS_MEDIA_ACTIVE_FN__ = () => boolean;
  // ------------------------------
  function pqIsMediaActive(){
    try{
      // Optional exact hook from lesson
      if (typeof window.__PQ_FOCUS_MEDIA_ACTIVE_FN__ === 'function') {
        return !!window.__PQ_FOCUS_MEDIA_ACTIVE_FN__();
      }

      // Treat Play All mode as active (even between letters) if any of these flags exist
      if (window.playingAll === true || window.__pq_playingAll === true || window.__PQ_PLAYING_ALL === true) return true;
      if (window.__PQ_LECTURE_MEDIA_ACTIVE__ === true) return true;
      if (window.__PQ_MEDIA_ACTIVE__ === true) return true;
      if ((Number(window.__PQ_MEDIA_ACTIVE_UNTIL__ || 0) || 0) > Date.now()) return true;
      if (window.__pqWebAudioActive === true || window.__PQ_WEB_AUDIO_ACTIVE__ === true) return true;
      if (window.__pqRulesAudioPlaying === true) return true;
      if (window.speechSynthesis && window.speechSynthesis.speaking) return true;

      // Heuristic: Play All button state/text can indicate running mode
      const btn = document.getElementById('btnPlayAll');
      if (btn) {
        const txt = (btn.textContent || '').toLowerCase();
        if (txt.includes('stop') || txt.includes('■')) return true;
        if (btn.disabled && txt.includes('play all')) return true;
      }

      // Any audio element currently playing
      const audios = document.querySelectorAll('audio');
      for (const a of audios) {
        if (a && !a.paused && !a.ended) return true;
      }
      const a0 = window.audio;
      if (a0 && typeof a0.paused === 'boolean' && !a0.paused && !a0.ended) return true;
      const rulesAudio = window.__pqRulesAudio;
      if (rulesAudio && typeof rulesAudio.paused === 'boolean' && !rulesAudio.paused && !rulesAudio.ended) return true;

      // Any video element currently playing (lecture or otherwise)
      const vids = document.querySelectorAll('video');
      for (const v of vids) {
        if (v && !v.paused && !v.ended) return true;
      }
      const v0 = window.lectureVideoEl || document.getElementById('lectureVideo');
      if (v0 && typeof v0.paused === 'boolean' && !v0.paused && !v0.ended) return true;
    }catch(_e){}
    return false;
  }

  // ------------------------------
  // WS send (uses PQManagedCore.wsSet; your core is patched to not inject progress_json for focus)
  // ------------------------------
  async function wsSend(event_type, reason, meta){
    try{
      const core = pqResolveCore();
      const uid  = pqGetUid();
      const tok  = pqGetToken();

      if (cfg?.debug) console.info('[FocusGuard] wsSend precheck', {hasCore:!!core, hasWsSet:!!core?.wsSet, uid, hasTok:!!tok, ctx});

      if (!core || typeof core.wsSet !== 'function') return { ok:false, why:'no_core' };
      if (!uid || !tok) return { ok:false, why:'no_auth' };

      const payload = {
        wsfunction: 'local_prequran_set_focus_event',
        userid: String(uid),
        wstoken: String(tok),

        lessonid: String(ctx.lessonid || ''),
        unitid: String(ctx.unitid || ''),
        session_id: String(ctx.session_id || ''),
        live_sessionid: String(ctx.live_sessionid || ''),

        event_type: String(event_type || 'resume'),

        // snapshots
        leave_count: Number(leaveCount || 0),
        idle_count:  Number(idleCount  || 0),
        active_ms:   Number(Math.floor(activeMs || 0)),
        timecreated: nowSec()
      };

      // Optional fields
      if (ctx.step_id != null && String(ctx.step_id).trim() !== '') payload.step_id = String(ctx.step_id);
      if (ctx.step_index != null && String(ctx.step_index).trim() !== '') {
        const n = Number(ctx.step_index);
        if (Number.isFinite(n)) payload.step_index = Math.floor(n);
      }
      if (reason != null && String(reason).trim() !== '') payload.reason = String(reason);
      // Optional analytics
      if (meta && typeof meta === 'object') {
        try { payload.meta_json = JSON.stringify(meta); } catch(_e) {}
      }

      const res = await core.wsSet(payload);

      if (cfg?.debug) console.info('[FocusGuard] wsSend OK', {event_type: payload.event_type, reason: payload.reason || '', res});
      return { ok:true, res };
    }catch(e){
      // Best-effort logging; do not crash app
      try{ console.warn('[FocusGuard] wsSend FAILED', e && e.message ? e.message : e); }catch(_){}
      return { ok:false, why:'exception', error:String(e && e.message ? e.message : e) };
    }
  }

  // ------------------------------
  // Public API
  // ------------------------------
  function init(options){
    cfg = {
      managed: !!(options && options.managed),
      idleSeconds:  (options && options.idleSeconds  != null) ? Number(options.idleSeconds)  : 25,
      flushSeconds: (options && options.flushSeconds != null) ? Number(options.flushSeconds) : 60, // default 60s
      onPause:  (options && typeof options.onPause  === 'function') ? options.onPause  : (()=>{}),
      onResume: (options && typeof options.onResume === 'function') ? options.onResume : (()=>{}),
      debug: !!(options && options.debug)
    };

    if (!cfg.managed) return;

    pqBindMediaPresenceHooks();
    bindVisibilityListeners();
    bindActivityListeners();

    // Flush on navigation away (best effort)
    window.addEventListener('pagehide', () => { try { flush('pagehide'); } catch(_e){} });
    window.addEventListener('beforeunload', () => { try { flush('beforeunload'); } catch(_e){} });

    startFlushTimer();

    try{ pqBindPresenceHideOnActivity(); }catch(_e){}
    if (cfg.debug) console.info('[FocusGuard] init ok', cfg);
  }

  function setContext(newCtx){
    ctx = { ...ctx, ...(newCtx || {}) };
    if (cfg?.debug) console.info('[FocusGuard] setContext', ctx);
  }

  function start(){
    if (!cfg?.managed || active) return;
    active = true;
    lastActiveTs = Date.now();
    startActiveClock();
    resetIdleTimer();
    wsSend('resume', 'start').catch(()=>{});
    if (cfg?.debug) console.info('[FocusGuard] started');
  }

  function stop(){
    if (!active) return;
    active = false;
    try{ clearTimeout(idleTimer); }catch(_){}
    idleTimer = null;
    stopActiveClock();
    stopFlushTimer();
    flush('stop');
    if (cfg?.debug) console.info('[FocusGuard] stopped');
  }

  // Manual hook: call when a step completes to persist active_ms without waiting for timer
  function markStepComplete(stepId){
    try{
      if (stepId != null && String(stepId).trim() !== '') ctx.step_id = String(stepId);
    }catch(_){}
    flush('step_complete');
  }

  // Manual hook for attention module (or UI) to pause/resume
  function externalPause(reason){
    if (!active || !cfg?.managed) return;
    if (pqIsMediaActive()) { try{ resetIdleTimer(); }catch(_e){} return; }
    pause(String(reason || 'attention'));
  }
  function externalResume(reason){
    if (!active || !cfg?.managed) return;
    resume(String(reason || 'attention_ok'));
  }

  function getStats(){
    return { leaveCount, idleCount, activeMs: Math.floor(activeMs), ctx: { ...ctx } };
  }

  // ------------------------------
  // Listeners + timers
  // ------------------------------
  function bindVisibilityListeners(){
    document.addEventListener('visibilitychange', () => {
      if (!active || !cfg?.managed) return;
      if (document.hidden) {
        leaveCount++;
        if (pqIsMediaActive()) { try{ resetIdleTimer(); }catch(_e){} return; }
        pause('tab_hidden');
      }
      else { resume('tab_visible'); }
    });

    window.addEventListener('blur', () => {
      if (!active || !cfg?.managed) return;
      leaveCount++;
      if (pqIsMediaActive()) { try{ resetIdleTimer(); }catch(_e){} return; }
      pause('blur');
    });

    window.addEventListener('focus', () => {
      if (!active || !cfg?.managed) return;
      resume('focus');
    });
  }

  function bindActivityListeners(){
    const mark = () => {
      if (!active || !cfg?.managed) return;
      resetIdleTimer();
    };
    ['pointerdown','keydown','touchstart','mousemove','scroll'].forEach(evt => {
      window.addEventListener(evt, mark, { passive: true });
    });
  }

  function resetIdleTimer(){
    try{ clearTimeout(idleTimer); }catch(_){}
    idleTimer = setTimeout(() => {
      if (!active || !cfg?.managed) return;
      // If media is playing or Play All is active, suppress idle timeout.
      if (pqIsMediaActive()) { try{ resetIdleTimer(); }catch(_e){} return; }
      idleCount++;
      pause('idle_timeout');
    }, Math.max(5, cfg.idleSeconds) * 1000);
  }

  // ------------------------------
  // Pause / Resume
  // ------------------------------
  function pause(reason){
    if (pqIsMediaActive()) { try{ resetIdleTimer(); }catch(_e){} return; }
    stopActiveClock();
    try{ cfg.onPause({ reason, ctx: { ...ctx }, leaveCount, idleCount }); }catch(_){}
    // Show friendly prompt (Option B, no camera)
    try{ if ((reason === 'idle_timeout' || reason === 'tab_hidden') && !pqIsMediaActive()) pqShowPresencePrompt(); }catch(_e){} // Record event immediately
    const __promptShown = (reason === 'idle_timeout' || reason === 'tab_hidden') ? 1 : 0;
    wsSend(reason === 'idle_timeout' ? 'idle' : 'leave', reason, {prompt_shown: __promptShown}).catch(()=>{});
    // Also push a throttled flush to persist active_ms soon
    scheduleSoonFlush();
    if (cfg?.debug) console.info('[FocusGuard] paused', reason);
  }

  function resume(reason){
    try{ pqHidePresencePrompt(); }catch(_e){}
    try{ cfg.onResume({ reason, ctx: { ...ctx } }); }catch(_){}
    startActiveClock();
    resetIdleTimer();
    wsSend('resume', reason).catch(()=>{});
    if (cfg?.debug) console.info('[FocusGuard] resumed', reason);
  }

  // ------------------------------
  // Active time clock
  // ------------------------------
  function startActiveClock(){
    stopActiveClock();
    lastActiveTs = Date.now();
    activeTick = setInterval(() => {
      const now = Date.now();
      activeMs += (now - lastActiveTs);
      lastActiveTs = now;
    }, 1000);
  }

  function stopActiveClock(){
    if (activeTick) clearInterval(activeTick);
    activeTick = null;
  }

  // ------------------------------
  // Flush control
  // ------------------------------
  function startFlushTimer(){
    stopFlushTimer();
    const sec = Math.max(30, Math.min(120, Number(cfg.flushSeconds || 60))); // clamp 30–120
    flushTimer = setInterval(() => { try { flush('timer'); } catch(_e){} }, sec * 1000);
  }

  function stopFlushTimer(){
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = null;
  }

  function scheduleSoonFlush(){
    const now = Date.now();
    if (now - lastFlushAt < MIN_FLUSH_INTERVAL_MS) return;
    setTimeout(() => { try { flush('soon'); } catch(_e){} }, 1500);
  }

  async function flush(reason){
    if (!cfg?.managed) return;

    const now = Date.now();
    if (now - lastFlushAt < MIN_FLUSH_INTERVAL_MS) return;

    // Update activeMs up to now if active
    if (active && activeTick){
      const t = Date.now();
      activeMs += (t - lastActiveTs);
      lastActiveTs = t;
    }

    const delta = Math.floor(activeMs - lastSentActiveMs);

    // For timer flushes, only flush if meaningful new active time
    if (reason === 'timer' && delta < MIN_ACTIVE_DELTA_MS) return;

    lastFlushAt = now;
    lastSentActiveMs = Math.floor(activeMs);

    await wsSend('active_flush', reason || '').catch(()=>{});
    if (cfg?.debug) console.info('[FocusGuard] flushed', reason);
  }

  return {
    init, setContext, start, stop,
    flush, getStats,
    externalPause, externalResume,
    markStepComplete
  };
})();
