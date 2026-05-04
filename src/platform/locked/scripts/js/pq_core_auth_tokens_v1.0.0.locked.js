// pq_core_auth_tokens_v1.0_LOCKED.js
// Capture mtoken + wstoken + uid, then clean only sensitive params from URL
// while preserving lesson/unit/goto and other non-sensitive query params.
//
// Exposes:
//   window.__mtoken
//   window.__prequran_ws_token
//   window.__prequran_uid

(function () {
  'use strict';

  var q = new URLSearchParams(window.location.search);

  var m = q.get('mtoken');
  if (m) {
    window.__mtoken = m;
    try { sessionStorage.setItem('pq_mtoken', m); } catch (_) {}
  }

  var ws = q.get('wstoken');
  if (ws) {
    window.__prequran_ws_token = ws;
    try { sessionStorage.setItem('pq_ws_token', ws); } catch (_) {}
  }

  var uid = q.get('uid');
  if (uid) {
    window.__prequran_uid = parseInt(uid, 10) || null;
  }

  try {
    var url = new URL(window.location.href);
    var qs = url.searchParams;
    var dirty = (
      qs.has('token') ||
      qs.has('mtoken') ||
      qs.has('expires') ||
      qs.has('uid') ||
      qs.has('wstoken')
    );

    if (dirty) {
      ['token', 'mtoken', 'expires', 'uid', 'wstoken'].forEach(function (k) {
        try { qs.delete(k); } catch (_) {}
      });
      var newUrl = url.pathname + (qs.toString() ? ('?' + qs.toString()) : '') + (url.hash || '');
      history.replaceState({}, document.title, newUrl);
    }
  } catch (_) {}
})();
