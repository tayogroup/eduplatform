(function PQStepperArabicLabels(){
  function steps(){
    try {
      return (window.UNIT_CFG && Array.isArray(window.UNIT_CFG.steps))
        ? window.UNIT_CFG.steps
        : [];
    } catch (_e) {
      return [];
    }
  }

  function findStep(card, index){
    var list = steps();
    var id = card ? String(card.getAttribute('data-stepid') || '') : '';

    if (id) {
      for (var i = 0; i < list.length; i += 1) {
        if (String((list[i] && list[i].id) || '') === id) return list[i];
      }
    }

    return list[index] || null;
  }

  function labelText(label){
    try {
      var en = label.querySelector('.managed-step-label-en');
      if (en) return String(en.textContent || '').trim();
    } catch (_e) {}

    return String((label && label.textContent) || '').replace(/\s+/g, ' ').trim();
  }

  function applyArabicLabels(){
    try {
      var cards = document.querySelectorAll('#managedStepsList .managed-step');
      Array.prototype.forEach.call(cards, function(card, index){
        var step = findStep(card, index);
        var arabic = step ? String(step.arabicLabel || step.labelAr || step.ar || '').trim() : '';
        if (!arabic) return;

        var label = card.querySelector('.managed-step-label');
        if (!label) return;

        var currentArabic = label.querySelector('.managed-step-label-ar');
        if (currentArabic && String(currentArabic.textContent || '').trim() === arabic) return;

        var english = labelText(label);
        label.textContent = '';

        var en = document.createElement('span');
        en.className = 'managed-step-label-en';
        en.textContent = english || String(step.label || step.title || step.id || '');
        label.appendChild(en);

        var ar = document.createElement('span');
        ar.className = 'managed-step-label-ar';
        ar.setAttribute('dir', 'rtl');
        ar.textContent = arabic;
        label.appendChild(ar);
      });
    } catch (_e) {}
  }

  function boot(){
    var pending = false;

    function schedule(){
      if (pending) return;
      pending = true;
      window.setTimeout(function(){
        pending = false;
        applyArabicLabels();
      }, 0);
    }

    applyArabicLabels();

    try {
      var host = document.getElementById('managedStepsList');
      if (host) {
        new MutationObserver(schedule).observe(host, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    } catch (_e) {}

    window.setTimeout(applyArabicLabels, 200);
    window.setTimeout(applyArabicLabels, 800);
    window.setInterval(applyArabicLabels, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
