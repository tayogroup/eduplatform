(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/tashdeed/';
    return String(base) + 'tashdeed_rules.mp3';
  }

  function playRulesAudio(button) {
    if (!rulesAudio) {
      rulesAudio = new Audio();
      rulesAudio.preload = 'auto';
    }

    try {
      rulesAudio.pause();
      rulesAudio.currentTime = 0;
    } catch (_e) {}

    rulesAudio.src = rulesAudioUrl();
    try {
      window.__pqRulesAudio = rulesAudio;
      window.__pqRulesAudioPlaying = true;
    } catch (_e) {}
    try { if (typeof updateControlsForCurrentStep === 'function') updateControlsForCurrentStep(); } catch (_e) {}
    try { if (typeof __pqSyncDynamicStepAction === 'function') __pqSyncDynamicStepAction(); } catch (_e) {}
    if (button) {
      button.disabled = true;
      button.textContent = 'Playing Rules Audio';
    }

    var restore = function () {
      try { window.__pqRulesAudioPlaying = false; } catch (_e) {}
      try { if (typeof updateControlsForCurrentStep === 'function') updateControlsForCurrentStep(); } catch (_e) {}
      try { if (typeof __pqSyncDynamicStepAction === 'function') __pqSyncDynamicStepAction(); } catch (_e) {}
      if (!button) return;
      button.disabled = false;
      button.textContent = 'Play Rules Audio';
    };

    rulesAudio.addEventListener('ended', restore, { once: true });
    rulesAudio.addEventListener('error', restore, { once: true });
    var maybe = rulesAudio.play();
    if (maybe && typeof maybe.catch === 'function') {
      maybe.catch(restore);
    }
  }

  function handleRulesAudioAutoPlay(panel, isRules, selector) {
    if (!isRules) {
      rulesAutoPlayed = false;
      return;
    }
    if (rulesAutoPlayed) return;
    rulesAutoPlayed = true;
    var audioBtn = panel && panel.querySelector(selector);
    window.setTimeout(function () {
      playRulesAudio(audioBtn);
    }, 0);
  }
  function ensureRulesPanel() {
    var existing = document.getElementById('pqTashdeedRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqTashdeedRulesPanel';
    panel.className = 'pq-tash-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Tashdeed rules lesson');
    panel.innerHTML =
      '<div class="pq-tash-rules__hero">' +
        '<div class="pq-tash-rules__badge">Tashdeed Rules</div>' +
        '<h2><span dir="rtl">قَوَاعِدُ التَّشْدِيدِ</span></h2>' +
        '<p>Tashdeed, also called Shaddah, means the letter is read twice. The first is hidden with Sukoon and the second carries the movement.</p>' +
        '<button type="button" class="pq-tash-rules__audio-btn" id="pqTashdeedRulesAudioBtn">Play Rules Audio</button>' +
        '<div class="pq-tash-rules__examples"><span dir="rtl">بَّ</span><span dir="rtl">تِّ</span><span dir="rtl">مُّ</span><span dir="rtl">نَّ</span></div>' +
      '</div>' +
      '<div class="pq-tash-rules__deck">' +
        card('1', 'Tashdeed Means a Double Letter', 'A letter with Tashdeed is really two letters joined together.', ex(['بَّ = بْ + بَ', 'مِّ = مْ + مِ'])) +
        card('2', 'Give Extra Strength', 'A Tashdeed letter is stronger than a normal letter.', ex(['بَ = Ba', 'بَّ = Bba'])) +
        card('3', 'Hold the Letter Briefly', 'Hold the doubled letter for a very short moment before releasing.', ex(['رَبَّ = Rabba'])) +
        card('4', 'Read the Harakah After Tashdeed', 'The movement after Tashdeed decides the sound.', ex(['بَّ = Bba', 'بِّ = Bbi', 'بُّ = Bbu'])) +
        card('5', 'Do Not Skip Tashdeed', 'Every Tashdeed must be pronounced. The doubled letter must be heard.', '<div class="pq-tash-stop"><span>Correct: Rabba</span><span>Not: Raba</span></div>') +
        card('6', 'Nun with Tashdeed Has Ghunnah', 'When نّ appears, let the sound come gently through the nose.', ex(['إِنَّ = Inna'])) +
        card('7', 'Mim with Tashdeed Has Ghunnah', 'When مّ appears, read it with a clear nasal sound.', ex(['ثُمَّ = Thumma'])) +
        card('8', 'Other Letters Do Not Have Ghunnah', 'Only نّ and مّ use Ghunnah. Other letters are strong but not nasal.', ex(['بَّ', 'لَّ', 'رَّ'])) +
        card('9', 'Heavy Letters Stay Heavy', 'If the Tashdeed letter is heavy, keep it heavy.', ex(['صَّ', 'طَّ', 'قَّ'])) +
        card('10', 'Light Letters Stay Light', 'If the Tashdeed letter is light, keep it light.', ex(['بَّ', 'لَّ', 'مَّ'])) +
        card('11', 'Read Smoothly and Clearly', 'Give every Tashdeed its strength. Observe Ghunnah where needed. Do not rush.', '<ul><li>Doubled sound</li><li>Clear movement</li><li>Beautiful reading</li></ul>') +
      '</div>' +
      '<div class="pq-tash-rules__practice"><h3>Practice Tashdeed Movements</h3>' +
        group('Fathah', ['بَّ','تَّ','ثَّ','نَّ','مَّ']) +
        group('Kasrah', ['بِّ','تِّ','ثِّ','نِّ','مِّ']) +
        group('Dammah', ['بُّ','تُّ','ثُّ','نُّ','مُّ']) +
      '</div>' +
      '<div class="pq-tash-rules__practice"><h3>Practice Words</h3>' +
        group('Fathah', ['رَبَّ','ثُمَّ','حَقَّ','مَرَّ']) +
        group('Kasrah', ['رَبِّ','إِنِّي','النَّبِيِّ']) +
        group('Dammah', ['يَمُدُّ','يَفِرُّ','يَصُدُّ']) +
        group('Ghunnah', ['إِنَّ','أَنَّ','ثُمَّ','عَمَّ','مِنَّا']) +
      '</div>' +
      '<div class="pq-tash-rules__remember"><h3>Remember</h3>' +
        '<span>Tashdeed means the letter is read twice.</span><span>The first letter is hidden with Sukoon.</span><span>The second letter carries the movement.</span><span>Give the letter extra strength.</span><span>Do not skip the doubled sound.</span><span>نّ and مّ are read with Ghunnah.</span><span>Heavy letters stay heavy.</span><span>Light letters stay light.</span><span>Read clearly and beautifully.</span>' +
      '</div>' +
      '<div class="pq-tash-rules__footer"><button type="button" id="pqTashdeedRulesCompleteBtn">Complete Rules</button></div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) gridWrap.parentNode.insertBefore(panel, gridWrap);
    else document.body.appendChild(panel);

    var completeBtn = panel.querySelector('#pqTashdeedRulesCompleteBtn');
    if (completeBtn) completeBtn.addEventListener('click', function () {
      var action = document.getElementById('pqStepActionBtn');
      if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') action.click();
    });

    var audioBtn = panel.querySelector('#pqTashdeedRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }

    return panel;
  }

  function card(n, title, body, extra) {
    return '<article class="pq-tash-rule-card"><div class="pq-tash-rule-card__num">' + n + '</div><div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-tash-rule-card__extra">' + extra + '</div></div></article>';
  }
  function ex(items) {
    return '<div class="pq-tash-example-row">' + items.map(function (item) { return '<span dir="auto">' + item + '</span>'; }).join('') + '</div>';
  }
  function group(title, words) {
    return '<section><h4>' + title + '</h4><div>' + words.map(function (word) { return '<span dir="rtl">' + word + '</span>'; }).join('') + '</div></section>';
  }
  function bindLectureUrl() {
    var video = document.getElementById('lectureVideo');
    var lectureUrl = window.UNIT_CFG && window.UNIT_CFG.media && window.UNIT_CFG.media.lectureUrl;
    if (video && lectureUrl && !video.getAttribute('src')) video.setAttribute('src', lectureUrl);
  }
  function syncRulesPanel() {
    var panel = ensureRulesPanel();
    var action = document.getElementById('pqStepActionBtn');
    var isRules = !!(action && String(action.dataset.stepId || '').toLowerCase() === 'rules');
    panel.hidden = !isRules;
    document.body.classList.toggle('pq-tashdeed-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqTashdeedRulesAudioBtn');
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  window.setTimeout(bindLectureUrl, 0);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
