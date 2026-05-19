(function PQMobileUiSync(){
  function textOf(el){ return el ? String(el.textContent || '').replace(/\s+/g,' ').trim() : ''; }
  function setBilingual(el, english, arabic, prefix){
    if(!el) return;
    el.textContent = '';
    if(prefix){
      var icon = document.createElement('span');
      icon.className = 'pq-mobile-bilingual-icon';
      icon.textContent = prefix;
      el.appendChild(icon);
    }
    var en = document.createElement('span');
    en.className = 'pq-mobile-bilingual-en';
    en.textContent = english;
    el.appendChild(en);
    var ar = document.createElement('span');
    ar.className = 'pq-mobile-bilingual-ar';
    ar.setAttribute('dir', 'rtl');
    ar.textContent = arabic;
    el.appendChild(ar);
  }

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
      var label = currentItem ? currentItem.querySelector('.managed-step-label') : null;
      var labelEn = textOf(label ? label.querySelector('.managed-step-label-en') : null) || textOf(label);
      var labelAr = textOf(label ? label.querySelector('.managed-step-label-ar') : null);
      var progressText = textOf(meta) || 'Progress 0/1';
      textEl.textContent = '';
      var top = document.createElement('span');
      top.className = 'pq-mobile-step-status__line';
      top.textContent = 'Step ' + (activeIdx + 1) + ' of ' + items.length + ' ' + progressText;
      textEl.appendChild(top);

      if(labelEn){
        var en = document.createElement('span');
        en.className = 'pq-mobile-step-status__label';
        en.textContent = labelEn;
        textEl.appendChild(en);
      }

      if(labelAr){
        var ar = document.createElement('span');
        ar.className = 'pq-mobile-step-status__label-ar';
        ar.setAttribute('dir', 'rtl');
        ar.textContent = labelAr;
        textEl.appendChild(ar);
      }
    }catch(_e){}
  }

  function syncMobileSummary(){
    try{
      var totalEl = document.getElementById('pqMobileTotalStarsValue');
      var unitsEl = document.getElementById('pqMobileUnitsDoneValue');
      if(!totalEl || !unitsEl) return;
      var thisUnitEl = document.getElementById('pqMobileThisUnitValue');
      setBilingual(document.getElementById('pqMobileThisUnitLabel'), 'This Unit', 'الوحدة');
      setBilingual(document.getElementById('pqMobileTotalStarsLabel'), 'Total Stars', 'النجوم');
      setBilingual(document.getElementById('pqMobileUnitsDoneLabel'), 'Units Done', 'المكتملة');

      var thisUnit = 0;
      var total = 0;
      var units = 0;
      try { total = Number(localStorage.getItem('pq_total_stars_earned_v1') || '0') || 0; } catch(_e) {}
      try { units = Number(localStorage.getItem('pq_completed_units_count_v1') || '0') || 0; } catch(_e) {}

      var host = document.getElementById('pqLectureCta');
      var txt = textOf(host);
      var mTotal = txt.match(/Total\s*Stars[^0-9]*([0-9]+)/i);
      var mUnits = txt.match(/Units\s*Done[^0-9]*([0-9]+)/i);
      var stepItems = getStepItems();
      if(stepItems.length){
        thisUnit = stepItems.filter(function(item){ return item.classList.contains('completed'); }).length;
      }
      if(mTotal) total = Number(mTotal[1]) || total;
      if(mUnits) units = Number(mUnits[1]) || units;

      if(thisUnitEl) thisUnitEl.textContent = String(thisUnit);
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
      var labelAr = 'ركّز';
      if(/Great\s*Focus/i.test(txt)){ label = 'Great Focus'; badge.classList.add('is-great'); }
      else if(/Good\s*Focus/i.test(txt)){ label = 'Good Focus'; badge.classList.add('is-good'); }
      if(label === 'Great Focus') labelAr = 'تركيز رائع';
      else if(label === 'Good Focus') labelAr = 'تركيز جيد';
      setTimeout(function(){ setBilingual(badge, label, labelAr, '✨'); }, 0);
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
