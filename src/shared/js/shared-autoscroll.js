/* FROZEN: reviewed and frozen for Tajweed clone phase. */
/* pq_ui_autoscroll_v1.0.js
   Shared auto-scroll helper (used in all lessons).
   Exposes: window.PQAutoScroll.scrollToLetter(letterKey)
*/
(function(){
  'use strict';
  var NS='PQAutoScroll';
  var V='1.0-frozen';
  if (window[NS] && window[NS].__version) return;

  function scrollToLetter(letterKey){
    try{
      var core = window.PQManagedCore || (window.PQ && window.PQ.ManagedCore) || null;
      if (core && typeof core.scrollToLetterTile === 'function') return core.scrollToLetterTile(letterKey);
    }catch(_e){}
    try{
      var glyph = document.querySelector('.glyph[data-key="'+letterKey+'"]');
      if (!glyph) return false;
      glyph.scrollIntoView({behavior:'smooth', block:'center', inline:'center'});
      return true;
    }catch(_e){}
    return false;
  }

  window[NS] = { __version: V, scrollToLetter: scrollToLetter };
})();