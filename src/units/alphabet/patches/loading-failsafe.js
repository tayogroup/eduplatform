(function PQLoadingLessonFailsafe(){
  function textOf(el){
    try{ return String(el && el.textContent || '').replace(/\s+/g,' ').trim(); }catch(_e){ return ''; }
  }

  function clearStaleLoading(){
    try{
      var grid = document.getElementById('grid');
      if(!grid || !grid.children || !grid.children.length) return;

      Array.from(document.querySelectorAll('body *')).forEach(function(el){
        try{
          if (!el || el === document.body) return;
          var txt = textOf(el);
          if (!txt || txt !== 'Loading lesson...') return;

          var style = window.getComputedStyle(el);
          var parent = el.parentElement;
          var parentTxt = textOf(parent);

          if (
            style.position === 'fixed' ||
            style.position === 'absolute' ||
            /Loading lesson/.test(parentTxt)
          ){
            el.style.display = 'none';
            if (parent && parent !== document.body && /Loading lesson/.test(parentTxt)) {
              parent.style.display = 'none';
            }
          }
        }catch(_e){}
      });
    }catch(_e){}
  }

  function boot(){
    setTimeout(clearStaleLoading, 3000);
    setTimeout(clearStaleLoading, 6000);
    try{ window.addEventListener('load', function(){ setTimeout(clearStaleLoading, 1200); }); }catch(_e){}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
})();
