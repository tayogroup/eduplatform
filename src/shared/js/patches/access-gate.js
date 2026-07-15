// Comprehensive Security Check
(function() {
  var localPreviewHosts = ["localhost", "127.0.0.1"];
  var isLocalPreview = localPreviewHosts.indexOf(window.location.hostname) !== -1;
  var isInsideIframe = (window.top !== window.self);

  function isCdnHost(hostname) {
    return /(^|\.)b-cdn\.net$/i.test(String(hostname || ""));
  }

  function referrerMatchesLaunchContext() {
    if (!document.referrer) return false;

    try {
      var referrer = new URL(document.referrer);
      var referrerHost = String(referrer.hostname || "").toLowerCase();
      var currentHost = String(window.location.hostname || "").toLowerCase();
      if (window.__prequran_moodle_origin && referrer.origin === new URL(window.__prequran_moodle_origin).origin) {
        return true;
      }
      if (referrerHost === currentHost) {
        return true;
      }
      return referrer.protocol === "https:" && !isCdnHost(referrerHost);
    } catch (_e) {
      return false;
    }
  }

  function hasValidSignedLaunch() {
    var params = new URLSearchParams(window.location.search || "");
    var token = params.get("token") || params.get("mtoken");
    var expires = parseInt(params.get("expires") || "0", 10);
    if (!token || !expires) return false;
    return Math.floor(Date.now() / 1000) <= expires;
  }

  function isIntegrationPreview() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return String(params.get("pq_env") || "").toLowerCase() === "integration";
    } catch (_e) {
      return false;
    }
  }

  var referrerMatch = referrerMatchesLaunchContext();
  var signedLaunch = hasValidSignedLaunch();
  var integrationPreview = isIntegrationPreview();

  if (!isLocalPreview && !integrationPreview && !isInsideIframe && !referrerMatch && !signedLaunch) {
    // Stop the page from loading
    window.stop();
    // Show a clean message instead of redirecting to a 404
    document.documentElement.innerHTML = `
      <div style="font-family:sans-serif; text-align:center; margin-top:50px;">
        <h1>403 Access Denied</h1>
        <p>This resource can only be accessed through its institution portal.</p>
        <a href="${window.__prequran_moodle_origin || (document.referrer ? new URL(document.referrer).origin : window.location.origin)}">Return to institution portal</a>
      </div>`;
  }
})();
