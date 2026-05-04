(function(){
  function create(config){
    const cfg = Object.assign({
      audioEl: null,
      playerEl: null,
      videoModalEl: null,
      btnPlayAllEl: null,
      btnPauseEl: null,
      speedSelEl: null,
      repeatSelEl: null,
      defaults: { speed:'1.0', repeat:'1' },
      getCurrentStep: () => ({ step:null, progress:null }),
      getManagedProgress: () => null,
      getPracticeFreeUI: () => true,
      getLetters: () => [],
      getVideoByKey: () => ({}),
      getPlaySequenceKeys: () => [],
      getGridEl: () => null,
      getAudioBases: () => [],
      getVoiceBases: () => ({}),
      getVoiceValue: () => 'child_boy',
      getCacheBust: () => '',
      getArForKey: () => '',
      resolveAdultMaleBase: () => '',
      getLettersFromSeparatedLine: () => [],
      onSelectKey: () => {},
      onLetterPlayed: async () => {},
      onPlaylistStepCompleted: async () => {},
      scrollToKey: () => {},
      delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
    }, config || {});

    let playingAll = false;
    let paused = false;
    let playAllToken = 0;

    function tryPlayUrl(url, rate){
      return new Promise((resolve,reject)=>{
        const audio = cfg.audioEl;
        if (!audio) { reject(new Error('audio element missing')); return; }
        audio.pause();
        audio.currentTime = 0;
        audio.src = url;
        audio.playbackRate = rate;
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('audio failed ' + url));
        audio.play().catch(reject);
      });
    }

    async function playLetterOnce(key, rate){
      try{
        if (window.PQAudioResolver && typeof window.PQAudioResolver.playLetterOnce === 'function') {
          await window.PQAudioResolver.playLetterOnce({
            key,
            rate,
            voice: cfg.getVoiceValue(),
            ar: cfg.getArForKey(key),
            voiceBases: cfg.getVoiceBases(),
            audioBases: cfg.getAudioBases(),
            cacheBust: cfg.getCacheBust(),
            audioEl: cfg.audioEl
          });
          return;
        }
      }catch(_e){}

      const letterAr = cfg.getArForKey(key);
      if (letterAr) {
        const base = cfg.getVoiceBases()[(cfg.getVoiceValue() || '').toLowerCase()] || "";
        if (base) {
          const variants = (function (ar) {
            switch (ar) {
              case 'ه': return ['ه','هـ','ـه'];
              case 'ج': return ['ج','جـ'];
              case 'ح': return ['ح','حـ'];
              case 'خ': return ['خ','خـ'];
              default:  return [ar];
            }
          })(letterAr);

          for (const fname of variants) {
            try {
              await tryPlayUrl(base + encodeURIComponent(fname) + '.mp3' + cfg.getCacheBust(), rate);
              return;
            } catch (_) {}
          }
        }
      }

      for (const base of cfg.getAudioBases()) {
        try {
          await tryPlayUrl(base + key + '.mp3' + cfg.getCacheBust(), rate);
          return;
        } catch(_) {}
      }

      throw new Error('audio failed for ' + key);
    }

    async function playLetter(key, times, rate){
      const url = cfg.getVideoByKey()[key];
      if (!url) return;

      if (cfg.videoModalEl) cfg.videoModalEl.style.display = 'flex';
      if (cfg.playerEl) {
        cfg.playerEl.src = url;
        try { await cfg.playerEl.play(); } catch(_e) {}
        await new Promise((resolve)=>{
          const done = ()=>{ cleanup(); resolve(); };
          const cleanup = ()=>{
            try{ cfg.playerEl.onended = null; }catch(_){}
            try{ cfg.playerEl.onpause = null; }catch(_){}
          };
          cfg.playerEl.onended = done;
        });
      }
    }

    function setPaused(p){
      paused = p;
      const label = paused ? '▶ Resume' : '⏸ Pause';
      if (cfg.btnPauseEl) cfg.btnPauseEl.textContent = label;
      try{
        if (cfg.playerEl){
          if (paused) cfg.playerEl.pause();
          else cfg.playerEl.play().catch(()=>{});
        }
      }catch(_e){}
      try{
        if (cfg.audioEl){
          cfg.audioEl.playbackRate = parseFloat((cfg.speedSelEl && cfg.speedSelEl.value) || cfg.defaults.speed);
          paused ? cfg.audioEl.pause() : cfg.audioEl.play().catch(()=>{});
        }
      }catch(_){}
    }

    async function pauseGate(){ while(paused){ await cfg.delay(100); } }
    async function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

    function getActiveTilesForPlayAll() {
      const grid = cfg.getGridEl();
      const tiles = Array.from(grid ? grid.querySelectorAll('.tile') : []);
      const byKey = new Map(tiles.map(t => [t.dataset.key, t]));
      const ordered = [];
      cfg.getPlaySequenceKeys().forEach(k => { if (byKey.has(k)) ordered.push(byKey.get(k)); });
      tiles.forEach(t => { if (!ordered.includes(t)) ordered.push(t); });
      return ordered;
    }

    async function playAll(){
      if (!cfg.btnPlayAllEl) return;

      if (playingAll) {
        if (!cfg.getPracticeFreeUI() && cfg.getManagedProgress() && !cfg.getManagedProgress().__finished) return;

        playAllToken++;
        playingAll = false;
        setPaused(false);
        try { if(cfg.playerEl) cfg.playerEl.pause(); } catch (_) {}
        if(cfg.videoModalEl) cfg.videoModalEl.style.display='none';
        try{ cfg.onSelectKey(null, -1, false); }catch(_e){}
        cfg.btnPlayAllEl.textContent = '▶ Play All';
        cfg.btnPlayAllEl.disabled = false;
        return;
      }

      const current = cfg.getCurrentStep();
      const step = current.step;
      const progress = current.progress;
      let rpt = parseInt((cfg.repeatSelEl && cfg.repeatSelEl.value) || cfg.defaults.repeat, 10);
      const managedProgress = cfg.getManagedProgress();
      if (managedProgress && !managedProgress.__finished && step && step.type === 'playlist') {
        if (progress && typeof progress.repeatPerLetter === 'number' && progress.repeatPerLetter >= 1) {
          rpt = progress.repeatPerLetter;
        }
      }

      const rate = parseFloat((cfg.speedSelEl && cfg.speedSelEl.value) || cfg.defaults.speed);
      let anyPlayed = false;

      try{
        const cur = cfg.getCurrentStep();
        const sid = (cur && cur.step && cur.step.id) ? String(cur.step.id) : '';
        if (sid === 'listen' || sid === 'repeat') {
          const token = ++playAllToken;
          playingAll = true;
          anyPlayed = false;

          if (!cfg.getPracticeFreeUI() && managedProgress && !managedProgress.__finished) {
            cfg.btnPlayAllEl.textContent = '▶ Play All';
            cfg.btnPlayAllEl.disabled = true;
          } else {
            cfg.btnPlayAllEl.textContent = '■ Stop';
            cfg.btnPlayAllEl.disabled = false;
          }

          const tiles = getActiveTilesForPlayAll();
          for (const t of tiles) {
            if (token !== playAllToken) break;
            await pauseGate();

            const key = t.dataset.key || '';
            const url = cfg.getVideoByKey()[key] || '';
            if (!url) continue;

            try{
              const idx = cfg.getLetters().findIndex(x => x.key === key);
              if (idx >= 0) {
                cfg.onSelectKey(key, idx, true);
                try{ requestAnimationFrame(()=>requestAnimationFrame(()=>cfg.scrollToKey(key))); }catch(_e){}
              }
            }catch(_e){}

            anyPlayed = true;
            for (let i = 0; i < Math.max(1, Math.min(5, rpt)); i++) {
              if (token !== playAllToken) break;
              await pauseGate();
              try{
                await tryPlayUrl(url, rate);
              }catch(_e){
                break;
              }
            }
            if (sid === 'repeat') {
              await pauseGate();
              if (token === playAllToken) {
                try{
                  const smallEl = t.querySelector('.small');
                  const letters = cfg.getLettersFromSeparatedLine(smallEl ? smallEl.textContent : '');
                  const pauseMs = Math.max(1, (letters && letters.length) ? letters.length : 1) * 1000;
                  await sleep(pauseMs);
                }catch(_e){
                  await sleep(3000);
                }
              }
            }
          }

          playingAll = false;
          cfg.btnPlayAllEl.textContent = '▶ Play All';
          cfg.btnPlayAllEl.disabled = false;
          cfg.onSelectKey(null, -1, false);

          if (token === playAllToken && anyPlayed) {
            if (managedProgress && !managedProgress.__finished) {
              await cfg.onPlaylistStepCompleted(sid);
            }
          }
          return;
        }
      }catch(_e){}

      const keys = (Array.isArray(cfg.getPlaySequenceKeys()) ? cfg.getPlaySequenceKeys().slice() : [])
        .filter(k => !!cfg.getVideoByKey()[k]);

      if (!keys.length) {
        console.warn('[PlayAll] No keys available — abort.');
        return;
      }

      const token = ++playAllToken;
      playingAll = true;

      if (!cfg.getPracticeFreeUI() && managedProgress && !managedProgress.__finished) {
        cfg.btnPlayAllEl.textContent = '▶ Play All';
        cfg.btnPlayAllEl.disabled = true;
      } else {
        cfg.btnPlayAllEl.textContent = '■ Stop';
        cfg.btnPlayAllEl.disabled = false;
      }

      if (cfg.videoModalEl) cfg.videoModalEl.style.display = 'flex';

      function modalOpen(){
        try { return !!cfg.videoModalEl && cfg.videoModalEl.style.display !== 'none'; } catch(_){ return true; }
      }

      function playOnceKey(key){
        return new Promise((resolve) => {
          if (!cfg.playerEl) { resolve(false); return; }
          const url = cfg.getVideoByKey()[key];
          if (!url) { resolve(false); return; }

          try { cfg.playerEl.pause(); cfg.playerEl.currentTime = 0; } catch(_) {}
          cfg.playerEl.src = url;
          cfg.playerEl.playbackRate = rate;

          cfg.playerEl.onended = () => resolve(true);
          cfg.playerEl.onerror = () => resolve(false);
          cfg.playerEl.onloadedmetadata = () => {
            cfg.playerEl.play().catch(() => resolve(false));
          };

          if (cfg.videoModalEl) cfg.videoModalEl.style.display = 'flex';
        });
      }

      async function playKey(key){
        for (let i=1; i<=Math.max(1, Math.min(5, rpt)); i++){
          if (token !== playAllToken) return false;
          await pauseGate();
          if (!modalOpen()) return false;
          const ok = await playOnceKey(key);
          if (!ok) return false;
        }
        return true;
      }

      for (let i=0; i<keys.length; i++){
        if (token !== playAllToken) break;
        await pauseGate();
        if (!modalOpen()) break;

        const key = keys[i];
        const idx = cfg.getLetters().findIndex(x => x.key === key);
        if (idx >= 0) {
          cfg.onSelectKey(key, idx, true);
          try { requestAnimationFrame(()=>requestAnimationFrame(()=>cfg.scrollToKey(key))); } catch (_e) {}
        }
        anyPlayed = true;

        const ok = await playKey(key);
        if (!ok) break;
      }

      playingAll = false;
      cfg.btnPlayAllEl.textContent = '▶ Play All';
      cfg.btnPlayAllEl.disabled = false;

      try { if(cfg.playerEl) { cfg.playerEl.pause(); } } catch(_) {}
      if (cfg.videoModalEl) cfg.videoModalEl.style.display = 'none';

      if (token === playAllToken && anyPlayed) {
        const cur = cfg.getCurrentStep();
        const sid = (cur && cur.step && cur.step.id) ? cur.step.id : '';
        const stype = (cur && cur.step && cur.step.type) ? cur.step.type : '';
        const stitle = (cur && cur.step && (cur.step.title || cur.step.name)) ? (cur.step.title || cur.step.name) : '';
        const isListen = (sid === 'listen') || (stype === 'playlist') || (/\bListen\b/i.test(String(stitle)));
        if (managedProgress && !managedProgress.__finished && isListen) {
          await cfg.onPlaylistStepCompleted(sid || 'listen');
        }
      }
    }

    return {
      tryPlayUrl,
      playLetterOnce,
      playLetter,
      setPaused,
      pauseGate,
      sleep,
      getActiveTilesForPlayAll,
      playAll,
      getState: () => ({ playingAll, paused, playAllToken })
    };
  }

  window.PQSharedPlaylistEngine = { create };
})();