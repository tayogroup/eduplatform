(function(){
  'use strict';

  const STATE = {
    enabled: false,
    started: false,
    lastMessageAt: 0,
    lastTrigger: '',
    pending: false,
    audio: null
  };

  function now(){ return Date.now(); }

  function moodleOrigin(){
    try {
      if (window.__prequran_moodle_origin) return String(window.__prequran_moodle_origin).replace(/\/+$/, '');
      const q = new URLSearchParams(location.search || '');
      const fromQuery = q.get('moodle_origin') || q.get('origin') || '';
      if (fromQuery) return String(fromQuery).replace(/\/+$/, '');
      if (document.referrer) {
        const u = new URL(document.referrer);
        return u.origin;
      }
    } catch (_e) {}
    return location.origin;
  }

  function getToken(){
    try { if (window.PQIframe && typeof window.PQIframe.getToken === 'function') return window.PQIframe.getToken() || ''; } catch (_e) {}
    try { return window.__prequran_ws_token || window.prequran_ws_token || sessionStorage.getItem('pq_wstoken') || ''; } catch (_e) {}
    return '';
  }

  function getUserid(){
    try { if (window.PQIframe && typeof window.PQIframe.getUserId === 'function') return window.PQIframe.getUserId() || ''; } catch (_e) {}
    try { if (window.PQIframe && typeof window.PQIframe.getUid === 'function') return window.PQIframe.getUid() || ''; } catch (_e) {}
    try { return window.__prequran_userid || window.prequran_userid || sessionStorage.getItem('pq_userid') || ''; } catch (_e) {}
    return '';
  }

  function liveSessionId(ctx){
    try {
      if (ctx && ctx.live_sessionid) return String(ctx.live_sessionid);
      if (window.PQFocusCtx && typeof window.PQFocusCtx.liveSessionId === 'function') return String(window.PQFocusCtx.liveSessionId() || '');
      const q = new URLSearchParams(location.search || '');
      return String(q.get('live_sessionid') || q.get('livesessionid') || q.get('sessionid') || '');
    } catch (_e) {}
    return '';
  }

  function ensureStyles(){
    if (document.getElementById('pqPracticeCoachStyles')) return;
    const style = document.createElement('style');
    style.id = 'pqPracticeCoachStyles';
    style.textContent = [
      '.pq-practice-coach{position:fixed;right:18px;bottom:18px;z-index:2147482500;width:min(360px,calc(100vw - 28px));font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}',
      '.pq-practice-coach__card{border:1px solid rgba(23,48,68,.12);border-radius:22px;background:#fffef8;box-shadow:0 18px 36px rgba(23,48,68,.18);overflow:hidden}',
      '.pq-practice-coach__head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#e8fff1;border-bottom:1px solid rgba(23,48,68,.08);font-weight:950}',
      '.pq-practice-coach__badge{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:14px;background:#2f6f4e;color:#fff;font-weight:950}',
      '.pq-practice-coach__body{padding:14px 16px;font-size:15px;line-height:1.42;font-weight:800}',
      '.pq-practice-coach__recommendation{margin:0 16px 12px;padding:9px 10px;border-radius:12px;background:#f3fff7;border:1px solid rgba(47,111,78,.14);color:#2f6f4e;font-size:13px;font-weight:900;line-height:1.35}',
      '.pq-practice-coach__actions{display:flex;gap:8px;justify-content:flex-end;padding:0 14px 14px}',
      '.pq-practice-coach button{border:0;border-radius:12px;padding:9px 12px;font-weight:950;cursor:pointer}',
      '.pq-practice-coach__listen{background:#6f4e32;color:#fff}',
      '.pq-practice-coach__close{background:#eef4f6;color:#173044}',
      '@media(max-width:640px){.pq-practice-coach{right:10px;bottom:10px;width:calc(100vw - 20px)}}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureCard(){
    ensureStyles();
    let root = document.getElementById('pqPracticeCoach');
    if (root) return root;
    root = document.createElement('aside');
    root.id = 'pqPracticeCoach';
    root.className = 'pq-practice-coach';
    root.hidden = true;
    root.innerHTML = [
      '<div class="pq-practice-coach__card" role="status" aria-live="polite">',
      '<div class="pq-practice-coach__head"><span class="pq-practice-coach__badge">PC</span><span>Chatbot Practice Coach</span></div>',
      '<div class="pq-practice-coach__body" id="pqPracticeCoachText"></div>',
      '<div class="pq-practice-coach__recommendation" id="pqPracticeCoachRecommendation" hidden></div>',
      '<div class="pq-practice-coach__actions">',
      '<button type="button" class="pq-practice-coach__listen" id="pqPracticeCoachListen">Listen</button>',
      '<button type="button" class="pq-practice-coach__close" id="pqPracticeCoachClose">Close</button>',
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(root);
    root.querySelector('#pqPracticeCoachClose').addEventListener('click', function(){ root.hidden = true; });
    root.querySelector('#pqPracticeCoachListen').addEventListener('click', function(){
      const text = root.getAttribute('data-message') || '';
      if (text) speak(text);
    });
    return root;
  }

  function showMessage(text, autospeak, recommendation){
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    const root = ensureCard();
    const body = root.querySelector('#pqPracticeCoachText');
    if (body) body.textContent = clean;
    const rec = root.querySelector('#pqPracticeCoachRecommendation');
    const rectext = recommendation && recommendation.message ? String(recommendation.message).replace(/\s+/g, ' ').trim() : '';
    if (rec) {
      rec.textContent = rectext;
      rec.hidden = !rectext;
    }
    root.setAttribute('data-message', clean);
    root.hidden = false;
    if (autospeak) speak(clean);
  }

  async function speak(text){
    try {
      const token = getToken();
      if (!token) return false;
      if (STATE.audio) {
        try { STATE.audio.pause(); } catch (_e) {}
      }
      const res = await fetch(moodleOrigin() + '/local/hubredirect/quiz_tts.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'audio/mpeg, application/json' },
        body: JSON.stringify({ text: String(text || '').slice(0, 650), wstoken: token, purpose: 'practice_coach' })
      });
      if (!res.ok) return false;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      STATE.audio = audio;
      audio.addEventListener('ended', function(){ try { URL.revokeObjectURL(url); } catch (_e) {} }, { once: true });
      await audio.play();
      return true;
    } catch (_e) {
      return false;
    }
  }

  function allowedToSend(trigger){
    const t = now();
    if (STATE.pending) return false;
    if (trigger === STATE.lastTrigger && (t - STATE.lastMessageAt) < 90000) return false;
    if ((t - STATE.lastMessageAt) < 35000 && trigger !== 'practice_start') return false;
    return true;
  }

  async function send(trigger, sourceDetail){
    try {
      const ctx = (sourceDetail && (sourceDetail.ctx || (sourceDetail.payload || {}))) || {};
      const liveid = liveSessionId(ctx);
      const userid = getUserid() || (sourceDetail && sourceDetail.payload && sourceDetail.payload.userid) || '';
      const token = getToken() || (sourceDetail && sourceDetail.payload && sourceDetail.payload.wstoken) || '';
      if (!liveid || !userid || !token || !allowedToSend(trigger)) return;

      STATE.pending = true;
      const payload = Object.assign({}, sourceDetail && sourceDetail.payload ? sourceDetail.payload : {}, {
        trigger,
        userid: Number(userid) || 0,
        live_sessionid: Number(liveid) || 0,
        wstoken: token
      });
      const res = await fetch(moodleOrigin() + '/local/hubredirect/practice_coach_event.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(function(){ return null; });
      if (data && data.ok && data.message) {
        STATE.lastMessageAt = now();
        STATE.lastTrigger = trigger;
        showMessage(data.message, !!data.autospeak, data.recommendation || null);
      }
    } catch (_e) {
      // Coach must never interrupt the lesson if unavailable.
    } finally {
      STATE.pending = false;
    }
  }

  function onContextChanged(ev){
    const ctx = ev && ev.detail ? ev.detail.ctx : {};
    if (!liveSessionId(ctx) || STATE.started) return;
    STATE.started = true;
    window.setTimeout(function(){ send('practice_start', { ctx, payload: ctx }); }, 900);
  }

  function onFocusEvent(ev){
    const detail = ev && ev.detail ? ev.detail : {};
    const payload = detail.payload || {};
    const eventType = String(payload.event_type || '').toLowerCase();
    const reason = String(payload.reason || '').toLowerCase();
    if (eventType === 'idle') return send('idle_nudge', detail);
    if (eventType === 'leave') return send(reason === 'tab_hidden' ? 'screen_return' : 'focus_return', detail);
    if (eventType === 'active_flush' && Number(payload.active_ms || 0) > 180000) return send('progress_check', detail);
  }

  function init(){
    if (STATE.enabled) return;
    STATE.enabled = true;
    window.addEventListener('pq-focus-context-changed', onContextChanged);
    window.addEventListener('pq-focus-event-saved', onFocusEvent);
    window.setTimeout(function(){
      if (STATE.started) return;
      const ctx = {};
      if (!liveSessionId(ctx)) return;
      STATE.started = true;
      send('practice_start', { ctx, payload: ctx });
    }, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
