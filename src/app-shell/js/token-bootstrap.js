// js/token-bootstrap.js
(function () {
  const params = new URLSearchParams(location.search);

  if (params.has('mtoken'))  window.__mtoken = params.get('mtoken');  // Moodle one-time token
  if (params.has('token'))   window.__btoken = params.get('token');   // Bunny token (not used client-side)
  if (params.has('expires')) window.__bexp   = params.get('expires');

  if (params.has('token') || params.has('mtoken') || params.has('expires')) {
    history.replaceState({}, '', location.origin + location.pathname + location.hash);
  }
})();
