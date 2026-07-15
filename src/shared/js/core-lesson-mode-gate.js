/* pq_core_lesson_mode_gate_v1.0_LOCKED.js
 * Universal Mode Gate (Managed vs Free Practice)
 * - Free Practice when: no tokens OR managedProgress.__finished === true
 * - Managed when: has tokens AND NOT finished
 */

(function(){
  'use strict';

  if (window.PQLessonModeGate) return;

  function safeBool(v) { return !!v; }

  function hasAuthTokens() {
    var uid =
      (window.PQIframe && typeof window.PQIframe.getUid === 'function' && window.PQIframe.getUid()) ||
      window.__prequran_uid || window.prequran_uid || null;

    var tok =
      (window.PQIframe && typeof window.PQIframe.getToken === 'function' && window.PQIframe.getToken()) ||
      window.__prequran_ws_token || window.prequran_ws_token || null;

    return safeBool(uid && tok);
  }

  function compute(opts) {
    var hasTokens = (opts && typeof opts.hasTokens === 'boolean') ? opts.hasTokens : hasAuthTokens();
    var progress = (opts && opts.progress) ? opts.progress : null;

    var finished = safeBool(progress && progress.__finished);
    var practiceFree = (!hasTokens) || finished;

    return {
      hasTokens: hasTokens,
      finished: finished,
      practiceFree: practiceFree,
      mode: practiceFree ? 'practice_free' : 'managed',
      reason: !hasTokens ? 'no_tokens' : (finished ? 'finished' : 'in_progress')
    };
  }

  function apply(policy) {
    var p = policy || {};
    var practiceFree = safeBool(p.practiceFree);

    var els = p.els || {};
    var stepperRoot = els.stepperRoot || document.getElementById('managedStepper');
    var playAllBtn  = els.btnPlayAll  || document.getElementById('btnPlayAll');
    var pauseBtn    = els.btnPause    || document.getElementById('btnPause');

    if (stepperRoot) {
      // Keep the step map visible in free/unmanaged practice too. The runtime
      // still avoids managed writes when there are no tokens.
      stepperRoot.hidden = false;
    }

    if (practiceFree) {
      if (playAllBtn) playAllBtn.disabled = false;
      if (pauseBtn) pauseBtn.disabled = false;
    }

    window.__PQ_PRACTICE_FREE__ = practiceFree;
  }

  window.PQLessonModeGate = { compute: compute, apply: apply, hasAuthTokens: hasAuthTokens };
  try { Object.defineProperty(window.PQLessonModeGate, '__locked__', { value: true, enumerable: false, configurable: false, writable: false }); } catch (_) {}
  try { if (Object.freeze) Object.freeze(window.PQLessonModeGate); } catch (_) {}
})();
