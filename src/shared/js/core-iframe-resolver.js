/* pq_core_iframe_resolver_v1.0.1_LOCKED.js
   Shared same-origin iframe resolver utilities (idempotent + safe).
   Exposes: window.PQIframe = { resolveVar, resolveCore, getUid, getToken }
*/
(function(){
  'use strict';

  var NS = 'PQIframe';
  var V  = '1.0.1-locked';

  try {
    if (window[NS] && window[NS].__version && window[NS].__version >= V) return;
  } catch (_) {}

  function resolveVar(varName) {
    var w = window;
    for (var depth = 0; depth < 6; depth++) {
      try {
        if (w && Object.prototype.hasOwnProperty.call(w, varName) && w[varName]) return w[varName];
        if (!w || !w.parent || w.parent === w) break;
        w = w.parent;
      } catch (_) {
        break;
      }
    }
    return null;
  }

  function resolveCore() {
    var w = window;
    for (var depth = 0; depth < 6; depth++) {
      try {
        var c = w.PQManagedCore || (w.PQ && w.PQ.ManagedCore) || null;
        if (c) return c;
        if (!w.parent || w.parent === w) break;
        w = w.parent;
      } catch (_) {
        break;
      }
    }
    return null;
  }

  function getUid() {
    return resolveVar('__prequran_uid') || resolveVar('prequran_uid') || null;
  }

  function getToken() {
    return resolveVar('__prequran_ws_token') || resolveVar('prequran_ws_token') || null;
  }

  var api = window[NS] || {};
  if (typeof api.resolveVar !== 'function') api.resolveVar = resolveVar;
  if (typeof api.resolveCore !== 'function') api.resolveCore = resolveCore;
  if (typeof api.getUid !== 'function') api.getUid = getUid;
  if (typeof api.getToken !== 'function') api.getToken = getToken;

  api.__version = V;

  try { Object.defineProperty(api, '__locked__', { value: true, enumerable: false, configurable: false, writable: false }); } catch (_) {}
  try { if (Object.freeze) Object.freeze(api); } catch (_) {}

  window[NS] = api;
})();
