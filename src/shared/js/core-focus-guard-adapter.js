(function(){
  function create(config){
    const cfg = Object.assign({
      lessonId: '',
      unitId: '',
      audioEl: null,
      lectureVideoEl: null,
      isPlayingAll: () => false,
      setPaused: () => {},
      getManagedProgress: () => null,
      getSteps: () => [],
      getUid: () => null,
      getToken: () => null
    }, config || {});

    let enabled = false;
    let lastStep = null;
    let sessionId = null;
    let lessonId = null;
    let unitId = null;
    let liveSessionId = '';

    function focusLessonId(){
      return (window.PQFocusCtx && typeof window.PQFocusCtx.lessonId === 'function')
        ? (window.PQFocusCtx.lessonId() || cfg.lessonId)
        : cfg.lessonId;
    }

    function focusUnitId(){
      return (window.PQFocusCtx && typeof window.PQFocusCtx.unitId === 'function')
        ? (window.PQFocusCtx.unitId() || cfg.unitId)
        : cfg.unitId;
    }

    function focusGetSessionId(uid, lessonid, unitid){
      return (window.PQFocusCtx && typeof window.PQFocusCtx.sessionId === 'function')
        ? window.PQFocusCtx.sessionId(uid, lessonid, unitid)
        : (Date.now() + '-nosave');
    }

    function focusLiveSessionId(){
      return (window.PQFocusCtx && typeof window.PQFocusCtx.liveSessionId === 'function')
        ? window.PQFocusCtx.liveSessionId()
        : '';
    }

    function pauseForFocus(reason){
      try{
        if (window.__PQ_LECTURE_POPUP_ACTIVE__ || window.__PQ_LECTURE_REQUIRED_ACTIVE__) {
          return;
        }
      }catch(_e){}
      try{
        if (mediaActive()) {
          return;
        }
      }catch(_e){}
      try{ cfg.setPaused(true); }catch(_e){}
    }

    function resumeForFocus(reason){
      try{ if (cfg.isPlayingAll()) cfg.setPaused(false); }catch(_e){}
    }

    function syncStepContext(force){
      try{
        if (!enabled || !window.FocusGuard || typeof window.FocusGuard.setContext !== 'function') return;
        const managedProgress = cfg.getManagedProgress();
        if (!managedProgress) return;

        if (managedProgress.__finished) {
          window.FocusGuard.setContext({
            lessonid: lessonId,
            unitid: unitId,
            session_id: sessionId,
            live_sessionid: liveSessionId,
            step_id: 'practice',
            step_index: null
          });
          return;
        }

        const curId = managedProgress.currentStepId || 'lecture';
        if (!force && curId === lastStep) return;
        lastStep = curId;

        const steps = cfg.getSteps() || [];
        const stepIndex = Math.max(0, steps.findIndex(function(s){ return s && s.id === curId; }));

        window.FocusGuard.setContext({
          lessonid: lessonId,
          unitid: unitId,
          session_id: sessionId,
          live_sessionid: liveSessionId,
          step_id: curId,
          step_index: stepIndex >= 0 ? (stepIndex + 1) : null
        });
      }catch(_e){}
    }

    function mediaActive(){
      try{
        const a = cfg.audioEl;
        const v = cfg.lectureVideoEl || document.getElementById('lectureVideo');
        const rulesAudio = window.__pqRulesAudio;
        const audioPlaying = !!(a && typeof a.paused === 'boolean' && !a.paused && !a.ended);
        const videoPlaying = !!(v && typeof v.paused === 'boolean' && !v.paused && !v.ended);
        const sharedMediaPlaying = !!(
          window.__PQ_MEDIA_ACTIVE__ === true ||
          (Number(window.__PQ_MEDIA_ACTIVE_UNTIL__ || 0) || 0) > Date.now() ||
          window.__pqWebAudioActive === true ||
          window.__PQ_WEB_AUDIO_ACTIVE__ === true ||
          (window.speechSynthesis && window.speechSynthesis.speaking)
        );
        const rulesAudioPlaying = !!(
          window.__pqRulesAudioPlaying === true ||
          (rulesAudio && typeof rulesAudio.paused === 'boolean' && !rulesAudio.paused && !rulesAudio.ended)
        );
        return !!(cfg.isPlayingAll() || audioPlaying || videoPlaying || rulesAudioPlaying || sharedMediaPlaying);
      }catch(_e){ return false; }
    }

    function attachLateAuth(){
      try{
        setTimeout(function(){
          try{
            var lateUid = cfg.getUid();
            var lateTok = cfg.getToken();
            if (lateUid && lateTok && window.FocusGuard && typeof window.FocusGuard.setContext === 'function') {
              syncStepContext(true);
            }
          }catch(_e){}
        }, 1500);
      }catch(_e){}
    }

    function bind(){
      try{
        var uid = null, tok = null;
        try { uid = cfg.getUid(); } catch(_e) {}
        try { tok = cfg.getToken(); } catch(_e) {}

        if (!window.FocusGuard || typeof window.FocusGuard.init !== 'function') {
          try{ window.__PQ_FOCUS_BIND_OK__ = false; }catch(_e){}
          return false;
        }

        lessonId = focusLessonId();
        unitId = focusUnitId();
        sessionId = focusGetSessionId(uid, lessonId, unitId);
        liveSessionId = focusLiveSessionId();

        window.FocusGuard.init({
          managed: !!(uid && tok),
          idleSeconds: 25,
          debug: false,
          onPause: function(reason){ pauseForFocus(reason); },
          onResume: function(reason){ resumeForFocus(reason); }
        });

        enabled = true;
        syncStepContext(true);
        try{ if (typeof window.FocusGuard.start === 'function') window.FocusGuard.start(); }catch(_e){}

        if (!uid || !tok) attachLateAuth();

        try{ window.__PQ_FOCUS_BIND_OK__ = true; }catch(_e){}
        return true;
      }catch(_e){
        try{ window.__PQ_FOCUS_BIND_OK__ = false; }catch(__e){}
        return false;
      }
    }

    return {
      focusLessonId: focusLessonId,
      focusUnitId: focusUnitId,
      focusGetSessionId: focusGetSessionId,
      focusLiveSessionId: focusLiveSessionId,
      pauseForFocus: pauseForFocus,
      resumeForFocus: resumeForFocus,
      syncStepContext: syncStepContext,
      mediaActive: mediaActive,
      bind: bind
    };
  }

  window.PQFocusGuardAdapter = { create: create };
})();
