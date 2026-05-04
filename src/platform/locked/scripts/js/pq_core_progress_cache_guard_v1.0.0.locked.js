/* FROZEN: reviewed and frozen for Tajweed clone phase. */
/* pq_core_progress_cache_guard_v1.0.js
   Shared progress cache guard.
   Exposes: window.PQProgressCacheGuard.clearOnManagedHint({unitid, uidHint, managedHint, keys})
*/
(function(){
  'use strict';
  var NS='PQProgressCacheGuard';
  var V='1.0-frozen';
  if (window[NS] && window[NS].__version) return;

  function clearOnManagedHint(opts){
    try{
      if (!opts || !opts.managedHint) return;
      var keys = opts.keys || [];
      for (var i=0;i<keys.length;i++){
        try{ localStorage.removeItem(keys[i]); }catch(_e){}
      }
      if (opts.uidHint) {
        try{ localStorage.setItem('pq_boot_uid_hint', String(opts.uidHint)); }catch(_e){}
      }
    }catch(_e){}
  }

  window[NS] = { __version: V, clearOnManagedHint: clearOnManagedHint };
})();