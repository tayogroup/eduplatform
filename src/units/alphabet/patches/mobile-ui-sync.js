(function PQMobileUiSync(){
  function textOf(el){ return el ? String(el.textContent || '').replace(/\s+/g,' ').trim() : ''; }

  function getStepItems(){
    return Array.from(document.querySelectorAll('#managedStepsList .managed-step'));
  }

  function syncMobileStepStatus(){
    try{
      var status = document.getElementById('pqMobileStepStatus');
      if(!status) return;
      var dotsHost = status.querySelector('.pq-mobile-step-status__dots');
      var textEl = status.querySelector('.pq-mobile-step-status__text');
      var items = getStepItems();
      if(!items.length) return;

      dotsHost.innerHTML = '';

      var activeIdx = items.findIndex(function(item){ return item.classList.contains('active'); });
      if(activeIdx < 0){
        activeIdx = items.findIndex(function(item){ return !item.classList.contains('completed'); });
      }
      if(activeIdx < 0) activeIdx = items.length - 1;

      items.forEach(function(item, idx){
        var dot = document.createElement('span');
        dot.className = 'dot';
        if(item.classList.contains('completed')) dot.classList.add('is-complete');
        if(idx === activeIdx && !item.classList.contains('completed')) dot.classList.add('is-current');
        dotsHost.appendChild(dot);
      });

      var currentItem = items[activeIdx] || null;
      var meta = currentItem ? currentItem.querySelector('.managed-step-meta') : null;
      var progressText = textOf(meta) || 'Progress 0/1';
      textEl.textContent = 'Step ' + (activeIdx + 1) + ' of ' + items.length + ' ' + progressText;
    }catch(_e){}
  }

  function syncMobileSummary(){
    try{
      var totalEl = document.getElementById('pqMobileTotalStarsValue');
      var unitsEl = document.getElementById('pqMobileUnitsDoneValue');
      if(!totalEl || !unitsEl) return;

      var total = 0;
      var units = 0;
      try { total = Number(localStorage.getItem('pq_total_stars_earned_v1') || '0') || 0; } catch(_e) {}
      try { units = Number(localStorage.getItem('pq_completed_units_count_v1') || '0') || 0; } catch(_e) {}

      var host = document.getElementById('pqLectureCta');
      var txt = textOf(host);
      var mTotal = txt.match(/Total\s*Stars[^0-9]*([0-9]+)/i);
      var mUnits = txt.match(/Units\s*Done[^0-9]*([0-9]+)/i);
      if(mTotal) total = Number(mTotal[1]) || total;
      if(mUnits) units = Number(mUnits[1]) || units;

      totalEl.textContent = String(total);
      unitsEl.textContent = String(units);
    }catch(_e){}
  }

  function syncMobileFocus(){
    try{
      var badge = document.getElementById('pqMobileFocusBadge');
      if(!badge) return;
      badge.classList.remove('is-good','is-great');
      var txt = textOf(document.getElementById('pqLectureCta'));
      var label = 'Try to Focus';
      if(/Great\s*Focus/i.test(txt)){ label = 'Great Focus'; badge.classList.add('is-great'); }
      else if(/Good\s*Focus/i.test(txt)){ label = 'Good Focus'; badge.classList.add('is-good'); }
      badge.textContent = '✨ ' + label;
    }catch(_e){}
  }

  function syncAll(){
    syncMobileStepStatus();
    syncMobileSummary();
    syncMobileFocus();
  }

  function boot(){
    syncAll();
    try{
      var stepList = document.getElementById('managedStepsList');
      if(stepList){
        new MutationObserver(syncAll).observe(stepList, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
      }
    }catch(_e){}
    try{
      var cta = document.getElementById('pqLectureCta');
      if(cta){
        new MutationObserver(syncAll).observe(cta, {childList:true, subtree:true, characterData:true, attributes:true});
      }
    }catch(_e){}
    try{
      window.addEventListener('storage', syncAll);
    }catch(_e){}
    setTimeout(syncAll, 400);
    setTimeout(syncAll, 1200);
    setInterval(syncAll, 2500);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
