/* FROZEN: reviewed and frozen for Tajweed clone phase. */
/* pq_ui_stepper_render_v1.0.2_stepcolors_FROZEN.js
   Shared DOM renderer for managed stepper (idempotent + safe).
   Exposes: window.PQStepperUI.render({ containerEl, steps, progress, currentStepId, finished, core })
*/
(function(){
  'use strict';

  var NS = 'PQStepperUI';
  var V  = '1.0.3-arabic-labels';

  try{
    if (window[NS] && window[NS].__version && window[NS].__version >= V) return;
  }catch(_){}

  function render(opts){
    var containerEl = opts && opts.containerEl;
    var steps = (opts && opts.steps) || [];
    var progress = (opts && opts.progress) || null;
    var currentStepId = (opts && opts.currentStepId) || null;
    var finished = !!(opts && opts.finished);
    var core = (opts && opts.core) || null;

    if (!containerEl) return;
    if (!progress) { containerEl.innerHTML=''; return; }

    var curId = currentStepId;
    var isValid = function(id){
      if (!id) return false;
      for (var i=0;i<steps.length;i++){ if (steps[i].id === id) return true; }
      return false;
    };

    if (!isValid(curId) || (progress[curId] && progress[curId].completed)){
      for (var j=0;j<steps.length;j++){
        var s = steps[j];
        var p = progress[s.id];
        if (p && !p.completed){ curId = s.id; break; }
      }
    }
    if (!isValid(curId) && steps.length) curId = steps[0].id;

    var curIdx = -1;
    for (var k=0;k<steps.length;k++){ if (steps[k].id === curId){ curIdx=k; break; } }
    if (curIdx < 0) curIdx = 0;

    containerEl.innerHTML = '';

    for (var idx=0; idx<steps.length; idx++){
      var step = steps[idx];
      var pr = progress[step.id];
      if (!pr) continue;

      var item = document.createElement('div');
      item.className = 'managed-step';
      item.setAttribute('data-stepid', String(step.id || ''));

      if (pr.completed) item.classList.add('completed');
      if (!pr.completed && !finished && idx === curIdx) item.classList.add('active');
      if (!pr.completed && !finished && idx > curIdx) item.classList.add('locked');


// Apply inline colors with !important so shared CSS cannot override state colors.
// Matches the palette used across lessons (orange active, green completed, light orange incomplete, dim locked).
function _st(prop, val){ try{ item.style.setProperty(prop, val, 'important'); }catch(_e){} }
if (pr.completed){
  _st('background', '#f3fff4');
  _st('border', '1px solid #7ad47a');
  _st('opacity', '1');
  _st('filter', 'none');
} else if (!finished && idx === curIdx){
  _st('background', '#ffe6c7');
  _st('border', '3px solid #ffb86b');
  _st('box-shadow', '0 10px 26px rgba(241,154,42,.25)');
  _st('opacity', '1');
  _st('filter', 'none');
} else if (!finished && idx > curIdx){
  _st('background', '#fff7ec');
  _st('border', '1px solid #ffe2c2');
  _st('opacity', '.45');
  _st('filter', 'grayscale(.15)');
} else {
  _st('background', '#fff7ec');
  _st('border', '1px solid #ffe2c2');
  _st('opacity', '1');
  _st('filter', 'none');
}

      var badge = document.createElement('div');
      badge.className = 'managed-step-badge';
      badge.textContent = pr.completed ? '✓' : (idx === curIdx ? '▶' : (idx > curIdx ? '🔒' : '•'));

      var idxEl = document.createElement('div');
      idxEl.className = 'managed-step-index';
      idxEl.textContent = 'Step ' + (idx + 1);

      var lbl = document.createElement('div');
      lbl.className = 'managed-step-label';
      if (step.type === 'playlist') {
        var passReq  = pr.passesRequired  || 1;
        var repReq = pr.repeatPerLetter || 1;
        lbl.textContent = (step.label || step.title || step.id) + ' – ' + passReq + 'x' + repReq;
      } else {
        lbl.textContent = (step.label || step.title || step.id);
      }

      var labelText = lbl.textContent;
      lbl.textContent = '';
      var labelEn = document.createElement('span');
      labelEn.className = 'managed-step-label-en';
      labelEn.textContent = labelText;
      lbl.appendChild(labelEn);

      if (step.arabicLabel) {
        var labelAr = document.createElement('span');
        labelAr.className = 'managed-step-label-ar';
        labelAr.setAttribute('dir', 'rtl');
        labelAr.textContent = step.arabicLabel;
        lbl.appendChild(labelAr);
      }

      var meta = document.createElement('div');
      meta.className = 'managed-step-meta';
      if (core && typeof core.applyProgressText === 'function') {
        core.applyProgressText(meta, pr.passesDone, pr.passesRequired, 'Progress');
      } else {
        meta.setAttribute('dir', 'ltr');
        meta.style.unicodeBidi = 'isolate';
        meta.textContent = 'Progress ' + pr.passesDone + '/' + pr.passesRequired;
      }

      item.appendChild(badge);
      item.appendChild(idxEl);
      item.appendChild(lbl);
      item.appendChild(meta);
      containerEl.appendChild(item);
    }
  }

  var api = window[NS] || {};
  if (typeof api.render !== 'function') api.render = render;

  api.__version = V;

  try{ Object.defineProperty(api, '__locked__', { value: true, enumerable: false, configurable: false, writable: false }); }catch(_){}
  try{ if (Object.freeze) Object.freeze(api); }catch(_){}

  window[NS] = api;
})();
