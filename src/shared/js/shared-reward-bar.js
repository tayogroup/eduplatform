/* FROZEN: reviewed and frozen for Tajweed clone phase. */
(function(){
  function create(config){
    const cfg = Object.assign({
      hostId: 'pqLectureCta',
      getCompletedSteps: () => 0,
      getTotalStars: () => 0,
      getCompletedUnits: () => 0,
      getFocusState: () => ({ cls: 'focus-keep', text: 'Try to Focus' })
    }, config || {});

    let ready = false;

    function ensureUI(){
      try{
        if (ready && document.getElementById('pqStepRewardStars')) return;
        const host = document.getElementById(cfg.hostId);
        if (!host) return;

        if (!document.getElementById('pqRewardStarsStyle')){
          const st = document.createElement('style');
          st.id = 'pqRewardStarsStyle';
          st.textContent = `
#pqLectureCta{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
#pqStepRewardStars{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;
  padding:10px 14px;border-radius:22px;
  background:linear-gradient(180deg,#fff8cf 0%,#ffe89e 100%);
  border:1px solid rgba(229,190,69,.42);
  box-shadow:0 8px 22px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.7);
  width:min(100%, 960px);
  max-width:100%;
}
#pqStepRewardStars .pq-sound-letter-progress-badge{
  margin-inline-start:auto;
  margin-inline-end:22px;
}
#pqStepRewardStars .pq-stars-group,
#pqStepRewardStars .pq-total-group{
  display:flex;align-items:center;gap:8px;
}
#pqStepRewardStars .pq-stars-divider{
  width:1px;height:26px;background:rgba(128,96,0,.18);
}
#pqStepRewardStars .pq-group-label{
  display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
  font-size:.78rem;font-weight:900;letter-spacing:.02em;line-height:1.05;
  color:#7a6400;background:rgba(255,255,255,.5);
  padding:4px 8px;border-radius:999px;
}
#pqStepRewardStars .pq-group-label__ar,
#pqStepRewardStars .pq-focus-label__ar{
  direction:rtl;
  font-family:"Noto Sans Arabic","Tahoma","Arial",sans-serif;
  font-size:.82em;
  color:#15803d;
  letter-spacing:0;
}
#pqStepRewardStars .pq-stars-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
#pqStepRewardStars .pq-star{
  font-size:1.35rem; line-height:1; display:inline-block;
  transform-origin:center;
  animation:pqRewardFloat 2.2s ease-in-out infinite;
  filter:drop-shadow(0 2px 3px rgba(0,0,0,.15));
}
#pqStepRewardStars .pq-star:nth-child(2n){ animation-duration:2.6s }
#pqStepRewardStars .pq-star:nth-child(3n){ animation-duration:2.1s }
#pqStepRewardStars .pq-star.is-new{
  animation:pqRewardPop .7s cubic-bezier(.2,.8,.2,1);
}
#pqStepRewardStars .pq-total-count{
  display:inline-flex;align-items:center;gap:6px;
  min-height:32px;padding:6px 12px;border-radius:999px;
  background:linear-gradient(180deg,#fffef4 0%,#ffeec2 100%);
  border:1px solid rgba(208,164,38,.22);
  color:#7a5a00;font-weight:900;font-size:.95rem;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.65);
}
#pqStepRewardStars .pq-total-count .pq-total-star{
  font-size:1rem;line-height:1;
}
#pqStepRewardStars .pq-focus-label{
  display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
  min-height:34px;padding:7px 14px;border-radius:999px;
  font-weight:900;font-size:.94rem;line-height:1.05;
  border:1px solid rgba(0,0,0,.06);
  box-shadow:0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.55);
  white-space:nowrap;
  transition:background-color .35s ease,color .35s ease,border-color .35s ease,transform .35s ease,box-shadow .35s ease,opacity .35s ease;
}
#pqStepRewardStars .pq-focus-label.focus-great{
  background:linear-gradient(180deg,#eaffee 0%,#c7f2d3 100%);
  color:#186332;border-color:rgba(24,99,50,.14);
}
#pqStepRewardStars .pq-focus-label.focus-good{
  background:linear-gradient(180deg,#fff8de 0%,#ffe8a8 100%);
  color:#7b5a00;border-color:rgba(123,90,0,.14);
}
#pqStepRewardStars .pq-focus-label.focus-keep{
  background:linear-gradient(180deg,#ffeef0 0%,#ffd3d9 100%);
  color:#9d3150;border-color:rgba(157,49,80,.14);
}
#pqStepRewardStars .pq-focus-label::before{
  content:'✨';
  margin-inline-end:6px;
  font-size:.95rem;
  animation:pqFocusSparkle 2.3s ease-in-out infinite;
}
#pqStepRewardStars .pq-focus-label.is-changing{
  animation:pqFocusLabelPulse .55s cubic-bezier(.2,.8,.2,1);
}
@keyframes pqFocusSparkle{
  0%,100%{transform:translateY(0) rotate(0deg);opacity:.95}
  50%{transform:translateY(-2px) rotate(-8deg);opacity:1}
}
@keyframes pqFocusLabelPulse{
  0%{transform:scale(.92);opacity:.55}
  60%{transform:scale(1.08);opacity:1}
  100%{transform:scale(1);opacity:1}
}
@keyframes pqRewardFloat{
  0%,100%{transform:translateY(0) rotate(0deg) scale(1)}
  50%{transform:translateY(-4px) rotate(-6deg) scale(1.06)}
}
@keyframes pqRewardPop{
  0%{transform:scale(.2) rotate(-20deg);opacity:0}
  60%{transform:scale(1.25) rotate(8deg);opacity:1}
  100%{transform:scale(1) rotate(0deg);opacity:1}
}
@media (max-width:768px){
  #pqStepRewardStars{width:100%;justify-content:center}
  #pqStepRewardStars .pq-stars-divider{display:none}
  #pqStepRewardStars .pq-stars-group,
  #pqStepRewardStars .pq-total-group{width:100%;justify-content:center}
}
`;
          document.head.appendChild(st);
        }

        let wrap = document.getElementById('pqStepRewardStars');
        if (!wrap){
          wrap = document.createElement('div');
          wrap.id = 'pqStepRewardStars';
          wrap.setAttribute('aria-label', 'Completed step reward stars');
          wrap.innerHTML = '';
          host.appendChild(wrap);
        }
        ready = true;
      }catch(_e){}
    }

    function render(forceCelebrate){
      try{
        ensureUI();
        const wrap = document.getElementById('pqStepRewardStars');
        if (!wrap) return;

        const completed = Number(cfg.getCompletedSteps() || 0);
        const prev = Number(wrap.getAttribute('data-count') || '0');
        wrap.setAttribute('data-count', String(completed));

        const starsHtml = Array.from({length: completed}, (_, i) => {
          const cls = (forceCelebrate || i >= prev) ? 'pq-star is-new' : 'pq-star';
          return '<span class="' + cls + '" aria-hidden="true">⭐</span>';
        }).join('');

        const totalStars = Number(cfg.getTotalStars() || 0);
        const completedUnits = Number(cfg.getCompletedUnits() || 0);
        const focus = cfg.getFocusState() || { cls: 'focus-keep', text: 'Try to Focus' };

        const existingLabel = wrap.querySelector('.pq-focus-label');
        const previousClass = existingLabel
          ? (existingLabel.classList.contains('focus-great') ? 'focus-great'
            : existingLabel.classList.contains('focus-good') ? 'focus-good'
            : existingLabel.classList.contains('focus-keep') ? 'focus-keep'
            : '')
          : '';
        const previousText = existingLabel ? existingLabel.textContent : '';

        const focusArabicMap = {
          'Try to Focus': 'ركّز',
          'Good Focus': 'تركيز جيد',
          'Great Focus': 'تركيز رائع'
        };
        const focusAr = focusArabicMap[String(focus.text || '')] || 'ركّز';

        wrap.innerHTML =
          '<span class="pq-stars-group">' +
            '<span class="pq-group-label"><span class="pq-group-label__en">This Unit</span><span class="pq-group-label__ar" dir="rtl">الوحدة</span></span>' +
            '<span class="pq-stars-row">' + starsHtml + '</span>' +
          '</span>' +
          '<span class="pq-stars-divider" aria-hidden="true"></span>' +
          '<span class="pq-total-group">' +
            '<span class="pq-group-label"><span class="pq-group-label__en">Total Stars</span><span class="pq-group-label__ar" dir="rtl">النجوم</span></span>' +
            '<span class="pq-total-count">' + totalStars + ' <span class="pq-total-star" aria-hidden="true">⭐</span></span>' +
          '</span>' +
          '<span class="pq-stars-divider" aria-hidden="true"></span>' +
          '<span class="pq-total-group pq-units-group">' +
            '<span class="pq-group-label"><span class="pq-group-label__en">Units Done</span><span class="pq-group-label__ar" dir="rtl">المكتملة</span></span>' +
            '<span class="pq-total-count">' + completedUnits + ' <span class="pq-total-star" aria-hidden="true">📘</span></span>' +
          '</span>' +
          '<span class="pq-focus-label ' + focus.cls + '"><span class="pq-focus-label__en">' + focus.text + '</span><span class="pq-focus-label__ar" dir="rtl">' + focusAr + '</span></span>';

        const newLabel = wrap.querySelector('.pq-focus-label');
        if (newLabel && (previousClass !== focus.cls || previousText !== focus.text)) {
          newLabel.classList.add('is-changing');
        }
      }catch(_e){}
    }

    return { ensureUI, render };
  }

  window.PQSharedRewardBar = { create };
})();
