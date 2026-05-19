(function PQChildTokenReceiver(){
  const CHILD_ORIGIN = window.location.origin;
  const ALLOWED_PARENT_ORIGINS = new Set([CHILD_ORIGIN, 'https://quraan.academy']);
  const TARGET_PARENT_ORIGIN = (function(){
    try{ return (document.referrer && new URL(document.referrer).origin) || 'https://quraan.academy'; }catch(e){ return 'https://quraan.academy'; }
  })();
  function applyTokens(p){
    if(!p || !p.uid || !p.wstoken) return false;
    window.__prequran_uid = p.uid;
    window.__prequran_ws_token = p.wstoken;
    if (p.wsendpoint) window.__prequran_ws_endpoint = p.wsendpoint;
    if (p.cohortid) {
      window.__prequran_cohortid = p.cohortid;
      try { sessionStorage.setItem('pq_cohortid', String(p.cohortid)); } catch(e) {}
    }
    if (p.studentid) window.__prequran_studentid = p.studentid;
    if (typeof p.managed !== 'undefined') window.__prequran_managed_student = p.managed;
    window.__PQ_TOKENS_READY__ = true;
    return true;
  }
  window.addEventListener("message", function(event){
    if(!ALLOWED_PARENT_ORIGINS.has(event.origin)) return;
    const msg = event.data || {};
    if(msg.type === "PQ_TOKENS") applyTokens(msg);
  });
  function request(){
    try{
      if(window.parent && window.parent !== window){
        window.parent.postMessage({type:"PQ_REQUEST_TOKENS", ts: Date.now()}, TARGET_PARENT_ORIGIN);
      }
    }catch(e){}
  }
  request();
  let tries=0, maxTries=50;
  const t=setInterval(function(){
    tries++;
    if(window.__PQ_TOKENS_READY__){ clearInterval(t); return; }
    request();
    if(tries>=maxTries) clearInterval(t);
  }, 100);
})();
window.pqWaitForIframeTokens = function(maxMs=5000){
  return new Promise(function(resolve){
    const start = Date.now();
    const t=setInterval(function(){
      if(window.__prequran_uid && window.__prequran_ws_token){
        clearInterval(t); resolve(true); return;
      }
      if(Date.now()-start>maxMs){
        clearInterval(t); resolve(false);
      }
    }, 50);
  });
};
