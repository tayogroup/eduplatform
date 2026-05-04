/* FROZEN: reviewed and frozen for Tajweed clone phase. */
(function(){
  const __DEBUG = false;
  function _warn(){ try{ if(__DEBUG) console.warn.apply(console, arguments); }catch(_e){} }
  function create(config){
    const cfg = Object.assign({
      lectureCardEl: null,
      lectureVideoEl: null,
      lecturePlayBtnEl: null,
      lessonDef: null,
      markLectureCompleted: async () => {},
      getAboutBtn: () => document.getElementById('pqAboutBtn')
    }, config || {});

    let lectureBound = false;

    function getLectureAnchorEl(){
      return document.getElementById('lectureCard') || cfg.lectureCardEl || document.body;
    }

    function ensureStatsNodes(){
      const anchor = getLectureAnchorEl();
      if (!anchor) return {anchor:null, source:null, stats:null};

      let source = document.getElementById('pqDataSource');
      if (!source) {
        source = document.createElement('div');
        source.id = 'pqDataSource';
        source.className = 'lecture-letter-stats';
        source.style.marginTop = '6px';
        source.style.opacity = '0.85';
      }

      let stats = document.getElementById('listenLetterStats');
      if (!stats) {
        stats = document.createElement('div');
        stats.id = 'listenLetterStats';
        stats.className = 'lecture-letter-stats';
      }

      const playBtn = document.getElementById('lecturePlayBtn') || cfg.lecturePlayBtnEl;
      if (playBtn && playBtn.parentNode) {
        if (!source.parentNode) playBtn.parentNode.insertBefore(source, playBtn.nextSibling);
        if (!stats.parentNode) source.insertAdjacentElement('afterend', stats);
      } else {
        if (!source.parentNode) anchor.insertAdjacentElement('afterbegin', source);
        if (!stats.parentNode) source.insertAdjacentElement('afterend', stats);
      }

      return {anchor, source, stats};
    }

    function bindLectureOnce(){
      if (lectureBound) return;
      lectureBound = true;

      try{
        const aboutBtn = cfg.getAboutBtn();
        if (aboutBtn) {
          aboutBtn.addEventListener('click', () => {
            const lecture = window.PQLectureCore || window.PQLecture;
            if (lecture && typeof lecture.openAbout === 'function') {
              lecture.openAbout({
                title: 'About Muqattiat Listen',
                videoUrl: cfg.lessonDef && cfg.lessonDef.lectureUrl,
                audioUrl: '',
                text: ''
              });
              return;
            }
            try{ (document.getElementById('lecturePlayBtn') || cfg.lecturePlayBtnEl)?.click(); }catch(_){}
          });
        }
      }catch(_e){}

      try{
        if (cfg.lectureCardEl) cfg.lectureCardEl.hidden = false;
        try{ if (cfg.lectureVideoEl) cfg.lectureVideoEl.controls = true; }catch(_){}

        if (window.PQLectureCore) {
          if (!window.__PQ_AL_LECTURE_CORE_CREATED__) {
            window.__PQ_AL_LECTURE_CORE_CREATED__ = true;
            window.PQLectureCore.create({
              lectureUrl: cfg.lessonDef && cfg.lessonDef.lectureUrl,
              stepId: 'lecture',
              onStepComplete: async () => { await cfg.markLectureCompleted(); }
            });
          }
        } else {
          try{
            if (cfg.lectureVideoEl && !cfg.lectureVideoEl.src) cfg.lectureVideoEl.src = cfg.lessonDef && cfg.lessonDef.lectureUrl;
            if (cfg.lectureVideoEl && !cfg.lectureVideoEl.__pq_ended_bound) {
              cfg.lectureVideoEl.__pq_ended_bound = true;
              cfg.lectureVideoEl.addEventListener('ended', async () => { try{ await cfg.markLectureCompleted(); }catch(_){ } });
            }
          }catch(_){}
        }
      }catch(e){
        _warn('[Muqattiat Listen] lecture bind failed', e);
      }
    }

    function bindLectureCtaBridge(){
      try{
        if (window.PQLectureCTABridge && typeof window.PQLectureCTABridge.init === 'function') {
          window.PQLectureCTABridge.init({
            ctaBtnId: 'pqLectureCtaBtn',
            coreBtnId: 'lecturePlayBtn',
            videoId: 'lectureVideo',
            cardId: 'lectureCard',
            playLabel: '▶ Play Lecture',
            hideLabel: '🙈 Hide Lecture'
          });
        }
      }catch(_e){}
    }

    return { getLectureAnchorEl, ensureStatsNodes, bindLectureOnce, bindLectureCtaBridge };
  }

  window.PQLectureHelpers = { create };
})();