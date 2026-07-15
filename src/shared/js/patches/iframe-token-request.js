(function PQChildTokenReceiver(){
  function qp(name){
    try{ return new URLSearchParams(window.location.search || '').get(name) || ''; }catch(e){ return ''; }
  }
  (function applyAccountFromQuery(){
    const id = qp('pq_account_id');
    if (!id) return;
    window.__prequran_account_id = String(id);
    window.__prequran_account_type = qp('pq_account_type');
    window.__prequran_account_label = qp('pq_account_label') || 'Account ID';
    try {
      sessionStorage.setItem('pq_account_id', window.__prequran_account_id);
      sessionStorage.setItem('pq_account_type', window.__prequran_account_type);
      sessionStorage.setItem('pq_account_label', window.__prequran_account_label);
    } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('pq:account-identity-ready')); } catch(e) {}
  })();
  const CHILD_ORIGIN = window.location.origin;
  const REFERRER_ORIGIN = (function(){
    try{ return (document.referrer && new URL(document.referrer).origin) || ''; }catch(e){ return ''; }
  })();
  const ALLOWED_PARENT_ORIGINS = new Set([CHILD_ORIGIN]);
  try {
    if (window.__prequran_moodle_origin) {
      ALLOWED_PARENT_ORIGINS.add(new URL(window.__prequran_moodle_origin).origin);
    }
    if (REFERRER_ORIGIN) {
      ALLOWED_PARENT_ORIGINS.add(REFERRER_ORIGIN);
    }
  } catch(e) {}
  const TARGET_PARENT_ORIGIN = REFERRER_ORIGIN || (function(){
    try { return window.__prequran_moodle_origin ? new URL(window.__prequran_moodle_origin).origin : CHILD_ORIGIN; } catch(e) { return CHILD_ORIGIN; }
  })();
  function applyTokens(p){
    if(!p || !p.uid || !p.wstoken) return false;
    window.__prequran_uid = p.uid;
    window.__prequran_ws_token = p.wstoken;
    if (p.wsendpoint) window.__prequran_ws_endpoint = p.wsendpoint;
    if (p.pq_env) {
      window.__prequran_environment = p.pq_env;
      try { sessionStorage.setItem('pq_env', String(p.pq_env)); } catch(e) {}
    }
    if (p.cohortid) {
      window.__prequran_cohortid = p.cohortid;
      try { sessionStorage.setItem('pq_cohortid', String(p.cohortid)); } catch(e) {}
    }
    if (p.live_sessionid) {
      window.__prequran_live_sessionid = p.live_sessionid;
      try { sessionStorage.setItem('pq_live_sessionid', String(p.live_sessionid)); } catch(e) {}
    }
    if (p.studentid) window.__prequran_studentid = p.studentid;
    if (p.account_id) {
      window.__prequran_account_id = String(p.account_id);
      window.__prequran_account_type = p.account_type ? String(p.account_type) : '';
      window.__prequran_account_label = p.account_label ? String(p.account_label) : 'Account ID';
      try {
        sessionStorage.setItem('pq_account_id', window.__prequran_account_id);
        sessionStorage.setItem('pq_account_type', window.__prequran_account_type);
        sessionStorage.setItem('pq_account_label', window.__prequran_account_label);
      } catch(e) {}
      try { window.dispatchEvent(new CustomEvent('pq:account-identity-ready')); } catch(e) {}
    }
    if (typeof p.managed !== 'undefined') window.__prequran_managed_student = p.managed;
    if (typeof p.pq_can_skip_step !== 'undefined') {
      const canSkip = p.pq_can_skip_step === true || p.pq_can_skip_step === 1 || String(p.pq_can_skip_step).toLowerCase() === 'true' || String(p.pq_can_skip_step) === '1';
      window.__prequran_can_skip_step = canSkip;
      try { sessionStorage.setItem('pq_can_skip_step', canSkip ? '1' : '0'); } catch(e) {}
      try { window.dispatchEvent(new CustomEvent('pq:qa-skip-permission-ready', { detail: { canSkip } })); } catch(e) {}
    }
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
