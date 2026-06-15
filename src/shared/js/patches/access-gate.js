// Comprehensive Security Check
(function() {
  var allowedDomains = ["quraan.academy", "quraantest.academy"];
  var localPreviewHosts = ["localhost", "127.0.0.1"];
  var isLocalPreview = localPreviewHosts.indexOf(window.location.hostname) !== -1;
  var isInsideIframe = (window.top !== window.self);

  function isAllowedAcademyHost(hostname) {
    var normalized = String(hostname || "").toLowerCase();
    return allowedDomains.some(function(allowedDomain) {
      return normalized === allowedDomain || normalized.endsWith("." + allowedDomain);
    });
  }

  function referrerMatchesAcademy() {
    if (!document.referrer) return false;

    try {
      return isAllowedAcademyHost(new URL(document.referrer).hostname);
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

  var referrerMatch = referrerMatchesAcademy();
  var signedLaunch = hasValidSignedLaunch();

  // If it's NOT in an iframe OR the referrer doesn't match your academy
  if (!isLocalPreview && !isInsideIframe && !referrerMatch && !signedLaunch) {
    // Stop the page from loading
    window.stop();
    // Show a clean message instead of redirecting to a 404
    document.documentElement.innerHTML = `
      <div style="font-family:sans-serif; text-align:center; margin-top:50px;">
        <h1>403 Access Denied</h1>
        <p>This resource can only be accessed through the official Quraan Academy portal.</p>
        <a href="https://quraan.academy">Return to Academy</a>
      </div>`;
  }
})();
