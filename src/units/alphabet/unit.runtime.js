/*
  Pre-Quraan unit runtime bootstrap.
  The full runtime is maintained in ./runtime/*.js and assembled into ./runtime/runtime.bundle.js.
*/
(function () {
  'use strict';

  var src = './runtime/runtime.bundle.js';

  if (document.currentScript && document.currentScript.src) {
    try {
      src = new URL('runtime/runtime.bundle.js', document.currentScript.src).toString();
    } catch (_e) {}
  }

  if (document.readyState === 'loading') {
    document.write('<script src="' + src.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"><\/script>');
    return;
  }

  var script = document.createElement('script');
  script.src = src;
  script.async = false;
  document.head.appendChild(script);
})();
