(function PQBrowserUiModeDetector(){
  try {
    var ua = navigator.userAgent || '';
    var isRealMobile =
      /Android|iPhone|iPad|iPod|Mobile|Mobi|IEMobile|Opera Mini/i.test(ua) ||
      (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));

    if (!isRealMobile) {
      document.documentElement.classList.add('pq-browser-ui');
    }
  } catch (_e) {}
})();
