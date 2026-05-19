(function PQHashTokenReader(){
  try{
    if (window.__prequran_ws_token) return;
    const h = (window.location.hash || '').replace(/^#/, '');
    if (!h) return;
    const p = new URLSearchParams(h);
    const uid = p.get('pq_uid');
    const tok = p.get('pq_wstoken');
    const ep  = p.get('pq_wsendpoint');
    if (uid) window.__prequran_uid = uid;
    if (tok) window.__prequran_ws_token = tok;
    if (ep)  window.__prequran_ws_endpoint = decodeURIComponent(ep);
    if (window.__prequran_uid && window.__prequran_ws_token) window.__PQ_TOKENS_READY__ = true;
  }catch(e){}
})();
