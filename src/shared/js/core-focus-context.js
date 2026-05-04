/* pq_core_focus_context_v1.0.1_LOCKED.js
   Shared Focus/Attention context helpers (idempotent + safe).
   Exposes: window.PQFocusCtx = { lessonId(), unitId(), sessionId(uid, lessonid, unitid) }
*/
(function(){
  'use strict';

  var NS = 'PQFocusCtx';
  var V  = '1.0.1-locked';

  try {
    if (window[NS] && window[NS].__version && window[NS].__version >= V) return;
  } catch (_) {}

  function lessonId() {
    try {
      var q = new URLSearchParams(String(window.location.search || '').replace(/&amp;/g, '&'));
      return q.get('lessonid') || q.get('lesson') || q.get('goto') || null;
    } catch (_) {
      return null;
    }
  }

  function unitId() {
    try {
      var q = new URLSearchParams(String(window.location.search || '').replace(/&amp;/g, '&'));
      return q.get('unitid') || q.get('unit') || q.get('goto') || null;
    } catch (_) {
      return null;
    }
  }

  function sessionId(uid, lessonid, unitid) {
    var key = 'pq_focus_session_' + (uid || '0') + '_' + (lessonid || 'x') + '_' + (unitid || 'y');
    try {
      var sid = localStorage.getItem(key);
      if (!sid) {
        sid = Date.now() + '-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(key, sid);
      }
      return sid;
    } catch (_) {
      return Date.now() + '-nosave-' + Math.random().toString(36).slice(2, 10);
    }
  }

  var api = window[NS] || {};
  if (typeof api.lessonId !== 'function') api.lessonId = lessonId;
  if (typeof api.unitId !== 'function') api.unitId = unitId;
  if (typeof api.sessionId !== 'function') api.sessionId = sessionId;

  api.__version = V;

  try { Object.defineProperty(api, '__locked__', { value: true, enumerable: false, configurable: false, writable: false }); } catch (_) {}
  try { if (Object.freeze) Object.freeze(api); } catch (_) {}

  window[NS] = api;
})();
