/* FROZEN: reviewed and frozen for Tajweed clone phase. */
/* pq_core_audio_resolver_v1.0.js
   Shared audio resolver for letter-based lessons (Listen/Watch audio).
   Exposes: window.PQAudioResolver.playLetterOnce(opts), playLetter(opts)
   opts: { key, ar, voice, voiceBases, audioBases, cacheBust, rate, times, audioEl }
*/
(function(){
  'use strict';
  var NS='PQAudioResolver';
  var V='1.0-frozen';
  if (window[NS] && window[NS].__version) return;

  function _tryPlayUrl(audioEl, url, rate){
    return new Promise((resolve,reject)=>{
      try{
        audioEl.pause(); audioEl.currentTime=0;
        audioEl.src=url; audioEl.playbackRate=rate;
        audioEl.onended=()=>resolve();
        audioEl.onerror=()=>reject(new Error('audio failed '+url));
        audioEl.play().catch(reject);
      }catch(e){ reject(e); }
    });
  }

  async function playLetterOnce(opts){
    var key = opts.key;
    var rate = Number(opts.rate||1);
    var audioEl = opts.audioEl || new Audio();
    var ar = opts.ar;
    var voice = String(opts.voice||'').toLowerCase();
    var voiceBases = opts.voiceBases || {};
    var audioBases = opts.audioBases || [];
    var cacheBust = opts.cacheBust || '';

    if (ar){
      var base = voiceBases[voice] || voiceBases[opts.voice] || '';
      if (base){
        var variants = (function (g) {
          switch (g) {
            case 'ه': return ['ه','هـ','ـه'];
            case 'ج': return ['ج','جـ'];
            case 'ح': return ['ح','حـ'];
            case 'خ': return ['خ','خـ'];
            default:  return [g];
          }
        })(ar);

        for (var i=0;i<variants.length;i++){
          try{ await _tryPlayUrl(audioEl, base + encodeURIComponent(variants[i]) + '.mp3' + cacheBust, rate); return; }catch(_e){}
        }
      }
    }

    for (var j=0;j<audioBases.length;j++){
      try{ await _tryPlayUrl(audioEl, audioBases[j] + key + '.mp3' + cacheBust, rate); return; }catch(_e){}
    }

    throw new Error('audio failed for '+key);
  }

  async function playLetter(opts){
    var times = Math.max(1, Math.floor(opts.times || 1));
    for (var i=0;i<times;i++){
      await playLetterOnce(opts);
      if (i<times-1) await new Promise(r=>setTimeout(r, 350));
    }
  }

  window[NS] = { __version: V, playLetterOnce: playLetterOnce, playLetter: playLetter };
})();