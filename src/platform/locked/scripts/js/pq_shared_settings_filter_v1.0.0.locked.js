/* FROZEN: reviewed and frozen for Tajweed clone phase. */
(function(){
  function create(config){
    const cfg = Object.assign({
      defaults: {},
      settingsKey: '',
      voiceSel: null,
      speedSel: null,
      repeatSel: null,
      filterSel: null,
      practiceFreeUI: () => true,
      getManagedProgress: () => null,
      getCurrentStep: () => ({ step:null }),
      letterKeys: [],
      heavy: new Set(),
      vowels: new Set(),
      alifaa: new Set()
    }, config || {});

    function loadSettings(){
      try {
        return Object.assign({}, cfg.defaults, JSON.parse(localStorage.getItem(cfg.settingsKey) || '{}'));
      } catch (_) {
        return {...cfg.defaults};
      }
    }

    function saveSettings(){
      const obj = {
        voice:  (cfg.voiceSel && cfg.voiceSel.value)  || cfg.defaults.voice,
        speed:  (cfg.speedSel && cfg.speedSel.value)  || cfg.defaults.speed,
        repeat: (cfg.repeatSel && cfg.repeatSel.value) || cfg.defaults.repeat,
        filter: (cfg.filterSel && cfg.filterSel.value) || cfg.defaults.filter
      };
      try { localStorage.setItem(cfg.settingsKey, JSON.stringify(obj)); } catch(_){}
    }

    function applySettingsToUI(s){
      if (cfg.voiceSel)  cfg.voiceSel.value  = s.voice;
      if (cfg.speedSel)  cfg.speedSel.value  = s.speed;
      if (cfg.repeatSel) cfg.repeatSel.value = s.repeat;
      if (cfg.filterSel) cfg.filterSel.value = s.filter;
    }

    function getFilterKeys(f) {
      if (f==='heavy')  return cfg.letterKeys.filter(k => cfg.heavy.has(k));
      if (f==='light')  return cfg.letterKeys.filter(k => !cfg.heavy.has(k));
      if (f==='vowel')  return cfg.letterKeys.filter(k => cfg.vowels.has(k));
      if (f==='alifaa') return cfg.letterKeys.filter(k => cfg.alifaa.has(k));
      if (f==='all')    return cfg.letterKeys;
      return cfg.letterKeys;
    }

    function getActiveFilter() {
      if (cfg.practiceFreeUI()) {
        return (cfg.filterSel && cfg.filterSel.value) || cfg.defaults.filter;
      }
      const managedProgress = cfg.getManagedProgress();
      if (managedProgress && !managedProgress.__finished) {
        const cur = cfg.getCurrentStep();
        const step = cur ? cur.step : null;
        if (step) return step.filter || 'all';
      }
      return (cfg.filterSel && cfg.filterSel.value) || cfg.defaults.filter;
    }

    function passesFilter(key) {
      const f = getActiveFilter();
      if (f==='heavy')  return cfg.heavy.has(key);
      if (f==='light')  return !cfg.heavy.has(key);
      if (f==='vowel')  return cfg.vowels.has(key);
      if (f==='alifaa') return cfg.alifaa.has(key);
      return true;
    }

    return { loadSettings, saveSettings, applySettingsToUI, getFilterKeys, getActiveFilter, passesFilter };
  }

  window.PQSettingsFilter = { create };
})();