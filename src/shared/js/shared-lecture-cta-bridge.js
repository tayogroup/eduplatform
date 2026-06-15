/* FROZEN: reviewed and frozen for Tajweed clone phase. */
// pq_ui_lecture_cta_bridge_v1.0.js
// Shared Lecture CTA Bridge (Option A + Reopen Prompt) + Popup Player injected into about:blank
// ✅ Play-only (no Hide)
// ✅ No fast-forward (no native controls)
// ✅ Completion ONLY on PQ_LECTURE_ENDED
// ✅ If popup closed early -> blocking overlay + Reopen button
// ✅ Disable mute (no mute UI + force volume on)
// ✅ FIX: lecture step progress update via universal fallback: dispatch 'ended' on #lectureVideo

(function(){
  'use strict';

  const Bridge = {};
  let __BOUND = false;
  const __DEBUG = false;
  function _log(){ try{ if(__DEBUG) console.log.apply(console, arguments); }catch(_e){} }

  function $(id){ return document.getElementById(id); }

  function setLecturePopupActive(isActive){
    try{ window.__PQ_LECTURE_POPUP_ACTIVE__ = !!isActive; }catch(_e){}
    try{ window.__PQ_LECTURE_REQUIRED_ACTIVE__ = !!isActive; }catch(_e){}
  }

  // ------------------------------
  // UI: blocking overlay prompt
  // ------------------------------
  function ensureOverlay(){
    if (document.getElementById('pqLectureReqOverlay')) return;

    const css = document.createElement('style');
    css.id = 'pqLectureReqOverlayCss';
    css.textContent = `
#pqLectureReqOverlay{
  position:fixed;inset:0;z-index:999999;
  display:none;align-items:center;justify-content:center;
  background:rgba(0,0,0,.72);
  padding:18px;
}
#pqLectureReqOverlay .box{
  width:min(560px, 92vw);
  background:#0b1020;
  border:1px solid rgba(255,255,255,.14);
  border-radius:16px;
  box-shadow:0 10px 30px rgba(0,0,0,.45);
  padding:16px 16px 14px;
  color:#fff;
  font-family:system-ui,Segoe UI,Arial;
}
#pqLectureReqOverlay .ttl{
  font-size:18px;font-weight:800;margin:0 0 6px;
}
#pqLectureReqOverlay .msg{
  font-size:14px;opacity:.92;line-height:1.35;margin:0 0 12px;
}
#pqLectureReqOverlay .row{
  display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:flex-end;
}
#pqLectureReqOverlay .btn{
  border:1px solid rgba(255,255,255,.18);
  background:rgba(255,255,255,.10);
  color:#fff;
  border-radius:12px;
  padding:10px 12px;
  font-size:14px;
  cursor:pointer;
}
#pqLectureReqOverlay .btn.primary{
  background:rgba(255,255,255,.18);
  border-color:rgba(255,255,255,.26);
  font-weight:700;
}
#pqLectureReqOverlay .hint{
  margin-top:10px;
  font-size:12px;opacity:.75;
}
    `;
    document.head.appendChild(css);

    const ov = document.createElement('div');
    ov.id = 'pqLectureReqOverlay';
    ov.innerHTML = `
      <div class="box" role="dialog" aria-modal="true" aria-label="Lecture required">
        <div class="ttl">📚 Lecture required</div>
        <p class="msg" id="pqLectureReqMsg">Please complete the lecture before continuing.</p>
        <div class="row">
          <button type="button" class="btn primary" id="pqLectureReopenBtn">▶ Reopen Lecture</button>
        </div>
        <div class="hint">Tip: Don’t close the lecture window until it finishes.</div>
      </div>
    `;
    document.body.appendChild(ov);
  }

  function showOverlay(msg){
    ensureOverlay();
    const ov = document.getElementById('pqLectureReqOverlay');
    const m  = document.getElementById('pqLectureReqMsg');
    if (m && msg) m.textContent = msg;
    if (ov) ov.style.display = 'flex';
  }

  function hideOverlay(){
    const ov = document.getElementById('pqLectureReqOverlay');
    if (ov) ov.style.display = 'none';
  }

  // ------------------------------
  // Helpers
  // ------------------------------
  function safeHideCard(cardEl){
    try{ if (cardEl) cardEl.hidden = true; }catch(_e){}
  }

  function stopEmbeddedPlayback(videoEl){
    try{
      if (!videoEl) return;
      try{ videoEl.pause(); }catch(_e){}
      try{ videoEl.currentTime = 0; }catch(_e){}
      try{ videoEl.removeAttribute('src'); }catch(_e){}
      try{
        const srcs = videoEl.querySelectorAll ? videoEl.querySelectorAll('source') : [];
        for (const s of srcs) { try{ s.removeAttribute('src'); }catch(_e){} }
      }catch(_e){}
      try{ videoEl.load(); }catch(_e){}
    }catch(_e){}
  }

  function setPopupModeOn(){
    try{ window.__PQ_LECTURE_POPUP_MODE__ = true; }catch(_e){}
    try{
      if (window.PQLectureCore && typeof window.PQLectureCore.setPopupMode === 'function') {
        window.PQLectureCore.setPopupMode(true);
      }
    }catch(_e){}
  }

  function getLectureUrl(videoEl, stepId){
    try{
      if (window.__PQ_LECTURE_URL__) return String(window.__PQ_LECTURE_URL__).trim();
      if (window.__PQ_LECTURE_URLS__ && window.__PQ_LECTURE_URLS__[stepId]) return String(window.__PQ_LECTURE_URLS__[stepId]).trim();
      const a = videoEl && videoEl.getAttribute && videoEl.getAttribute('src');
      if (a) return String(a).trim();
      const s = videoEl && videoEl.querySelector && videoEl.querySelector('source');
      const b = s && s.getAttribute && s.getAttribute('src');
      if (b) return String(b).trim();
      const c = videoEl && videoEl.currentSrc;
      if (c) return String(c).trim();
      return '';
    }catch(_e){ return ''; }
  }

  function popupFeatures(){
    const w = 980, h = 620;
    const left = Math.max(0, Math.round((window.screen.width - w) / 2));
    const top  = Math.max(0, Math.round((window.screen.height - h) / 2));
    return `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no`;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ------------------------------
  // COMPLETION (FIXED)
  // ------------------------------
  function runCompletionHooks(stepId){
    const sid = stepId || 'lecture';
    const v = document.getElementById('lectureVideo');

    // Always ensure embedded playback cannot happen
    if (v) stopEmbeddedPlayback(v);

    try{
      if (typeof window.markLectureCompleted === 'function') {
        _log('[PQ Lecture] complete via window.markLectureCompleted()', sid);
        const r = window.markLectureCompleted();
        if (r && typeof r.then === 'function') r.catch(()=>{});
      }
    }catch(_e){}

    // Feedback (stars/sound)
    try{
      if (window.PQCompletion && typeof window.PQCompletion.playForStep === 'function') {
        window.PQCompletion.playForStep(sid);
      }
    }catch(_e){}
  }

  // ------------------------------
  // Player HTML injected into about:blank
  // - No native controls (no seeking UI)
  // - Disable mute (force volume)
  // - Sends ABORTED/HIDDEN/BLUR + ENDED signals
  // ------------------------------
  function buildPlayerHtml(title, url, stepId){
    return `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>${escapeHtml(title || 'Lecture')}</title>
<style>
html,body{margin:0;height:100%;background:#0b1020;color:#fff;font-family:system-ui,Segoe UI,Arial}
.wrap{position:fixed;inset:0;display:flex;flex-direction:column}
.top{padding:10px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.pill{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:6px 10px;font-size:14px}
.spacer{flex:1}
video{width:100%;height:100%;max-height:calc(100vh - 110px);background:#000;outline:none}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 12px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.15)}
.btn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;border-radius:12px;padding:10px 12px;font-size:14px;cursor:pointer}
.btn:active{transform:translateY(1px)}
.prog{min-width:120px;opacity:.9;font-size:14px}
.track{flex:1;min-width:180px;height:10px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.fill{height:100%;width:0%;background:rgba(255,255,255,.55)}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="pill">${escapeHtml(title || 'Lecture')}</div>
    <div class="pill" id="status">Playing…</div>
    <div class="spacer"></div>
    <div class="pill" style="opacity:.85">No fast-forward</div>
  </div>

  <video id="v" autoplay playsinline preload="metadata"></video>

  <div class="bar">
    <button class="btn" id="btnPlay" type="button">⏸ Pause</button>
    <button class="btn" id="btnFs" type="button">⛶ Fullscreen</button>
    <div class="prog" id="prog">0:00 / 0:00</div>
    <div class="track" aria-hidden="true"><div class="fill" id="fill"></div></div>
  </div>
</div>

<script>
(function(){
  'use strict';
  const url = ${JSON.stringify(url || '')};
  const stepId = ${JSON.stringify(stepId || 'lecture')};

  const v = document.getElementById('v');
  const status = document.getElementById('status');
  const btnPlay = document.getElementById('btnPlay');
  const btnFs   = document.getElementById('btnFs');
  const prog    = document.getElementById('prog');
  const fill    = document.getElementById('fill');

  let completed = false;

  function notify(type, extra){
    try{
      if (window.opener && window.opener !== window) {
        window.opener.postMessage(Object.assign({
          type,
          stepId,
          ts: Date.now(),
          currentTime: Number(v && v.currentTime || 0),
          duration: Number(v && v.duration || 0),
          ended: !!(v && v.ended)
        }, (extra||{})), '*');
      }
    }catch(_e){}
  }

  function fmt(t){
    t = Math.max(0, Math.floor(t||0));
    const m = Math.floor(t/60), s = t%60;
    return m + ':' + String(s).padStart(2,'0');
  }

  function enforceAudio(){
    try{
      v.muted = false;
      if (v.volume !== 1) v.volume = 1;
    }catch(_e){}
  }

  let metaReady=false, lastSafe=0;
  const TOL=0.2;

  function clampRate(){
    try{
      if (v.playbackRate !== 1) v.playbackRate = 1;
      if (v.defaultPlaybackRate !== 1) v.defaultPlaybackRate = 1;
    }catch(_e){}
  }

  function markSafe(){
    if(!metaReady) return;
    const t = v.currentTime||0;
    if(!v.paused && !v.ended && t>lastSafe) lastSafe=t;
  }

  function enforceSeek(){
    if(!metaReady) return;
    const t = v.currentTime||0;
    if(t>lastSafe+TOL) v.currentTime = lastSafe;
  }

  v.addEventListener('loadedmetadata', ()=>{
    metaReady=true; lastSafe=0; clampRate(); enforceAudio();
    prog.textContent = fmt(0)+' / '+fmt(v.duration||0);
  });

  v.addEventListener('timeupdate', ()=>{
    clampRate(); enforceAudio(); markSafe();
    const cur=v.currentTime||0, dur=v.duration||0;
    prog.textContent = fmt(cur)+' / '+fmt(dur);
    if(dur>0) fill.style.width = Math.max(0, Math.min(100,(cur/dur)*100))+'%';
  });

  v.addEventListener('ratechange', clampRate);
  v.addEventListener('seeking', enforceSeek);
  v.addEventListener('seeked', enforceSeek);

  v.addEventListener('volumechange', enforceAudio);
  window.addEventListener('focus', enforceAudio);

  btnPlay.addEventListener('click', ()=>{
    if(v.paused){ v.play().catch(()=>{}); btnPlay.textContent='⏸ Pause'; }
    else { v.pause(); btnPlay.textContent='▶ Play'; }
  });

  btnFs.addEventListener('click', async ()=>{
    try{
      if(!document.fullscreenElement){
        await (document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : v.requestFullscreen());
      } else {
        await document.exitFullscreen();
      }
    }catch(_e){}
  });

  window.addEventListener('beforeunload', () => {
    if (!completed) notify('PQ_LECTURE_ABORTED');
  });
  window.addEventListener('blur', () => {
    if (!completed) notify('PQ_LECTURE_BLUR');
  });
  document.addEventListener('visibilitychange', () => {
    if (!completed && document.hidden) notify('PQ_LECTURE_HIDDEN');
  });

  v.addEventListener('ended', ()=>{
    completed = true;
    status.textContent='Completed ✓';
    notify('PQ_LECTURE_ENDED', { ended: true });
    setTimeout(()=>{ try{ window.close(); }catch(_e){} }, 600);
  });

  v.src = url;
  clampRate();
  enforceAudio();
  notify('PQ_LECTURE_OPENED');

  v.play().catch(()=>{ status.textContent='Tap Play to start'; btnPlay.textContent='▶ Play'; clampRate(); enforceAudio(); });
})();
<\/script>
</body>
</html>
`;
  }

  // ------------------------------
  // Reopen / monitor logic
  // ------------------------------
  let lectureRequired = false;
  let lectureCompleted = false;
  let popupWin = null;
  let monitorTimer = null;

  function stopMonitor(){
    if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
  }

  function startMonitor(){
    stopMonitor();
    monitorTimer = setInterval(function(){
      if (!lectureRequired || lectureCompleted) { stopMonitor(); return; }
      try{
        if (!popupWin || popupWin.closed) {
          showOverlay('Lecture is required. Please reopen and complete it.');
        }
      }catch(_e){
        showOverlay('Lecture is required. Please reopen and complete it.');
      }
    }, 600);
  }

  function openLecturePopup(title, url, stepId){
    const win = window.open('about:blank', 'pqLecturePopup', popupFeatures());
    if (!win) return null;

    try{
      win.document.open();
      win.document.write(buildPlayerHtml(title, url, stepId));
      win.document.close();
      try{ win.focus(); }catch(_e){}
      return win;
    }catch(_e){
      return win;
    }
  }

  // ------------------------------
  // Message receiver
  // ------------------------------
  function bindMessageReceiver(defaultStepId){
    if (window.__PQ_LECTURE_POPUP_LISTENER__) return;
    window.__PQ_LECTURE_POPUP_LISTENER__ = true;

    window.addEventListener('message', function(ev){
      const msg = ev && ev.data ? ev.data : null;
      if (!msg || typeof msg.type !== 'string') return;

      const sid = msg.stepId || defaultStepId || 'lecture';

      if (msg.type === 'PQ_LECTURE_ENDED') {
        const currentTime = Number(msg.currentTime || 0);
        const duration = Number(msg.duration || 0);
        const nearEnd = duration > 0 && currentTime >= Math.max(0, duration - 1.25);
        if (!msg.ended || !nearEnd) {
          showOverlay('Lecture is still playing. Please finish the full video.');
          return;
        }

        lectureCompleted = true;
        lectureRequired = false;
        setLecturePopupActive(false);
        hideOverlay();
        stopMonitor();

        runCompletionHooks(sid);
        return;
      }

      if (msg.type === 'PQ_LECTURE_ABORTED' || msg.type === 'PQ_LECTURE_HIDDEN' || msg.type === 'PQ_LECTURE_BLUR') {
        if (msg.type === 'PQ_LECTURE_ABORTED') {
          setLecturePopupActive(false);
        }
        if (lectureRequired && !lectureCompleted) {
          showOverlay('Lecture is required. Please reopen and complete it.');
        }
      }
    });
  }

  // ------------------------------
  // Public init
  // ------------------------------
  Bridge.init = function(cfg){
    if (__BOUND) return;
    __BOUND = true;

    cfg = cfg || {};
    const ctaBtnId  = cfg.ctaBtnId  || 'pqLectureCtaBtn';
    const videoId   = cfg.videoId   || 'lectureVideo';
    const cardId    = cfg.cardId    || 'lectureCard';
    const stepId    = cfg.stepId    || 'lecture';
    const title     = cfg.title     || 'Lecture';

    const ctaBtn  = $(ctaBtnId);
    const videoEl = $(videoId);
    const cardEl  = $(cardId);

    setPopupModeOn();
    stopEmbeddedPlayback(videoEl);
    safeHideCard(cardEl);

    bindMessageReceiver(stepId);

    if (!ctaBtn) return;

    ensureOverlay();
    const reopenBtn = document.getElementById('pqLectureReopenBtn');
    if (reopenBtn && !reopenBtn.__pq_bound) {
      reopenBtn.__pq_bound = true;
      reopenBtn.addEventListener('click', function(){
        const url = getLectureUrl(videoEl, stepId);
        if (!url) {
          showOverlay('Lecture URL is not ready yet. Please try again.');
          return;
        }
        setLecturePopupActive(true);
        popupWin = openLecturePopup(title, url, stepId);
        if (!popupWin) {
          setLecturePopupActive(false);
          showOverlay('Popup was blocked. Please allow popups, then click Reopen.');
          return;
        }
        hideOverlay();
        lectureRequired = true;
        lectureCompleted = false;
        startMonitor();
      }, { passive:false });
    }

    ctaBtn.textContent = '▶ Play Lecture';

    ctaBtn.addEventListener('click', function(){
      lectureRequired = true;
      lectureCompleted = false;

      const url = getLectureUrl(videoEl, stepId);
      if (!url) {
        showOverlay('Lecture URL is not ready yet. Please try again.');
        return;
      }

      setLecturePopupActive(true);
      popupWin = openLecturePopup(title, url, stepId);
      if (!popupWin) {
        setLecturePopupActive(false);
        showOverlay('Popup was blocked. Please allow popups, then click Reopen.');
        return;
      }

      hideOverlay();
      startMonitor();
    }, { passive:false });
  };

  window.PQLectureCTABridge = Bridge;
})();
