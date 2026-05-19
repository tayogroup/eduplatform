(function PQSettingsFilterRuntimeFix(){
  'use strict';

  var LABELS = {
    all: 'All letters',
    vowels: 'Vowels',
    vowel: 'Vowels',
    heavy: 'Heavy letters',
    light: 'Light letters',
    alifaa: 'Alifaa letters'
  };

  function labelFor(key){
    if (!key) return '';
    if (LABELS[key]) return LABELS[key];
    return String(key)
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, function(ch){ return ch.toUpperCase(); });
  }

  function getCfg(){
    return window.UNIT_CFG ||
           window.PQ_UNIT_CFG ||
           window.__UNIT_CFG ||
           window.unitCfg ||
           window.cfg ||
           null;
  }

  function getFilterSets(cfg){
    if (!cfg) return null;
    return cfg.filterSets ||
           (cfg.ui && cfg.ui.filterSets) ||
           (cfg.filters && cfg.filters.sets) ||
           null;
  }

  function rebuildFilter(selectEl, filterSets){
    if (!selectEl || !filterSets) return false;

    var previous = selectEl.value || 'all';
    var keys = Object.keys(filterSets).filter(function(key){
      return key && key !== 'all' && Array.isArray(filterSets[key]) && filterSets[key].length;
    });

    var wantedValues = ['all'].concat(keys);
    var currentValues = Array.from(selectEl.options || []).map(function(opt){ return opt.value; });

    if (
      selectEl.dataset.pqFilterRuntimeFixed === '1' &&
      wantedValues.join('|') === currentValues.join('|')
    ){
      return true;
    }

    selectEl.innerHTML = '';

    var allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = LABELS.all;
    selectEl.appendChild(allOpt);

    keys.forEach(function(key){
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = labelFor(key);
      selectEl.appendChild(opt);
    });

    if (wantedValues.indexOf(previous) >= 0) {
      selectEl.value = previous;
    } else {
      selectEl.value = 'all';
    }

    selectEl.dataset.pqFilterRuntimeFixed = '1';
    return true;
  }

  function apply(){
    try{
      var selectEl = document.getElementById('uiFilter');
      if (!selectEl) return false;

      var cfg = getCfg();
      var filterSets = getFilterSets(cfg);

      if (!filterSets || !Object.keys(filterSets).length) return false;

      return rebuildFilter(selectEl, filterSets);
    }catch(_e){
      return false;
    }
  }

  function boot(){
    apply();

    var tries = 0;
    var timer = setInterval(function(){
      tries += 1;
      if (apply() || tries >= 80) {
        clearInterval(timer);
      }
    }, 100);

    try{
      window.addEventListener('load', function(){
        setTimeout(apply, 250);
        setTimeout(apply, 1000);
      });
    }catch(_e){}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
