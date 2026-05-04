// pq_core_media_lecture_v1.0_CLEAN.js
// Shared Play/Hide Lecture controller + POPUP completion support.
// PATCH: supports disabling embedded playback when popup mode is enabled.
//
// Global flags:
//   window.__PQ_LECTURE_POPUP_MODE__ = true  -> disable embedded play/show
//
// Exposes:
//   window.PQLectureCore = { create, completeStep, setPopupMode }

(function (window) {
  'use strict';

  const REG = Object.create(null);
  let LISTENER_BOUND = false;

  function bindGlobalListenerOnce() {
    if (LISTENER_BOUND) return;
    LISTENER_BOUND = true;

    window.addEventListener('pq:lecture:ended', function (e) {
      try {
        const stepId = (e && e.detail && e.detail.stepId) ? e.detail.stepId : 'lecture';
        completeStep(stepId);
      } catch (_e) {}
    });
  }

  function publishLectureUrl(stepId, lectureUrl) {
    try {
      window.__PQ_LECTURE_URL__ = lectureUrl || '';
      if (!window.__PQ_LECTURE_URLS__) window.__PQ_LECTURE_URLS__ = Object.create(null);
      window.__PQ_LECTURE_URLS__[stepId || 'lecture'] = lectureUrl || '';
    } catch (_e) {}
  }

  function completeStep(stepId) {
    const sid = stepId || 'lecture';
    const entry = REG[sid];
    if (!entry || typeof entry.onStepComplete !== 'function') return;

    try {
      Promise.resolve(entry.onStepComplete(sid)).catch(function () {});
    } catch (_e) {}
  }

  function isPopupMode() {
    return !!window.__PQ_LECTURE_POPUP_MODE__;
  }

  function stopEmbeddedPlayback(videoEl) {
    try {
      if (!videoEl) return;
      videoEl.pause();
      videoEl.removeAttribute('src');
      const srcs = videoEl.querySelectorAll ? videoEl.querySelectorAll('source') : [];
      for (const s of srcs) {
        try { s.removeAttribute('src'); } catch (_e) {}
      }
      try { videoEl.load(); } catch (_e) {}
      videoEl.currentTime = 0;
    } catch (_e) {}
  }

  function create(opts) {
    opts = opts || {};
    const lectureUrl = opts.lectureUrl || '';
    const sid = opts.stepId || 'lecture';
    const onStepComplete = opts.onStepComplete;

    const lectureCardEl = document.getElementById('lectureCard');
    const lectureVideoEl = document.getElementById('lectureVideo');
    const lecturePlayBtnEl = document.getElementById('lecturePlayBtn');

    if (!lectureCardEl || !lectureVideoEl || !lecturePlayBtnEl) return null;

    publishLectureUrl(sid, lectureUrl);
    REG[sid] = { onStepComplete: onStepComplete };

    bindGlobalListenerOnce();

    let maxAllowedTime = 0;

    function forceNormalSpeed() {
      try {
        if (lectureVideoEl.playbackRate !== 1) lectureVideoEl.playbackRate = 1;
      } catch (_e) {}
    }

    lectureVideoEl.addEventListener('timeupdate', function () {
      if (lectureVideoEl.currentTime > maxAllowedTime) maxAllowedTime = lectureVideoEl.currentTime;
      forceNormalSpeed();
    });

    lectureVideoEl.addEventListener('seeking', function () {
      const tolerance = 0.25;
      if (lectureVideoEl.currentTime > maxAllowedTime + tolerance) {
        lectureVideoEl.currentTime = maxAllowedTime;
      }
    });

    lectureVideoEl.addEventListener('ratechange', function () {
      forceNormalSpeed();
    });

    function toggleLecture() {
      if (isPopupMode()) {
        stopEmbeddedPlayback(lectureVideoEl);
        lectureCardEl.hidden = true;
        lecturePlayBtnEl.textContent = '▶ Play Lecture';
        maxAllowedTime = 0;
        return;
      }

      if (!lectureVideoEl.src) {
        lectureVideoEl.src = lectureUrl;
        try { lectureVideoEl.load(); } catch (_) {}
        maxAllowedTime = 0;
        forceNormalSpeed();
      }

      const isPlaying = !lectureVideoEl.paused && !lectureVideoEl.ended;
      const isVisible = lectureVideoEl.style.display !== 'none';

      if (!isVisible || !isPlaying) {
        lectureCardEl.hidden = false;
        lectureVideoEl.style.display = 'block';
        forceNormalSpeed();
        lectureVideoEl.play().then(function () {
          lecturePlayBtnEl.textContent = 'Hide Lecture';
        }).catch(function () {});
      } else {
        lectureVideoEl.pause();
        lectureVideoEl.currentTime = 0;
        lectureVideoEl.style.display = 'none';
        lecturePlayBtnEl.textContent = '▶ Play Lecture';
        maxAllowedTime = 0;
      }
    }

    function handleEnded() {
      if (isPopupMode()) return;

      lectureVideoEl.pause();
      lectureVideoEl.currentTime = 0;
      lectureVideoEl.style.display = 'none';
      lecturePlayBtnEl.textContent = '▶ Play Lecture';
      maxAllowedTime = 0;

      completeStep(sid);
    }

    lecturePlayBtnEl.addEventListener('click', toggleLecture);
    lectureVideoEl.addEventListener('ended', handleEnded);

    return {
      show: function () { lectureCardEl.hidden = false; },
      hide: function () { lectureCardEl.hidden = true; },
      complete: function () { completeStep(sid); }
    };
  }

  function setPopupMode(isOn) {
    window.__PQ_LECTURE_POPUP_MODE__ = !!isOn;
  }

  window.PQLectureCore = { create, completeStep, setPopupMode };
})(window);