// Comprehensive Security Check
  (function() {
    var allowedDomain = "quraan.academy";
    var localPreviewHosts = ["localhost", "127.0.0.1"];
    var isLocalPreview = localPreviewHosts.indexOf(window.location.hostname) !== -1;
    var isInsideIframe = (window.top !== window.self);
    var referrerMatch = document.referrer.indexOf(allowedDomain) !== -1;

    // If it's NOT in an iframe OR the referrer doesn't match your academy
    if (!isLocalPreview && !isInsideIframe && !referrerMatch) {
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
