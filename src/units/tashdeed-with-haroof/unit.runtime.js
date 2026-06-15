(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/tashdeed-with-haroof/';
    return String(base) + 'tashdeed_with_haroof_maddah_rules.mp3';
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
    var existing = document.getElementById('pqTashdeedHaroofRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqTashdeedHaroofRulesPanel';
    panel.className = 'pq-twh-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Tashdeed with Haroof Maddah rules lesson');
    panel.innerHTML =
      '<div class="pq-twh-rules__hero">' +
        '<div class="pq-twh-rules__badge">Tashdeed with Haroof Maddah Rules</div>' +
        '<h2><span dir="rtl">التَّشْدِيدُ مَعَ حُرُوفِ الْمَدِّ</span></h2>' +
        '<p>Read the Tashdeed clearly first. Then stretch the Madd sound. Give both the doubled letter and the Madd their proper rights.</p>' +
        '<button type="button" class="pq-twh-rules__audio-btn" id="pqTashdeedHaroofRulesAudioBtn">Play Rules Audio</button>' +
        '<div class="pq-twh-rules__examples"><span dir="rtl">بَّا</span><span dir="rtl">بُّو</span><span dir="rtl">بِّي</span></div>' +
      '</div>' +
      '<div class="pq-twh-rules__deck">' +
        card('1', 'Read the Tashdeed First', 'A letter with Tashdeed is read as two letters before the Madd.', ex(['بَّا = بْ + بَا', 'مُّو = مْ + مُو'])) +
        card('2', 'Then Stretch the Madd Sound', 'After Tashdeed, stretch the Madd smoothly and clearly.', ex(['بَّا = Bbaa', 'بُّو = Bboo', 'بِّي = Bbee'])) +
        card('3', 'Tashdeed with Alif Maddah', 'Read the doubled letter, then stretch the aa sound.', ex(['بَّا','تَّا','ثَّا','مَّا'])) +
        card('4', 'Tashdeed with Waw Maddah', 'Read the doubled letter, then stretch the oo sound.', ex(['بُّو','تُّو','ثُّو','مُّو'])) +
        card('5', 'Tashdeed with Ya Maddah', 'Read the doubled letter, then stretch the ee sound.', ex(['بِّي','تِّي','ثِّي','مِّي'])) +
        card('6', 'Stretch Madd for Two Counts', 'The Madd letter is stretched for two counts.', '<div class="pq-twh-counts"><span>1</span><span>2</span></div>' + ex(['بَّا','بُّو','بِّي'])) +
        card('7', 'Do Not Skip the Tashdeed', 'The doubled letter must be heard before the Madd.', '<div class="pq-twh-stop"><span>Correct: Bbaa</span><span>Not: Baa</span></div>') +
        card('8', 'Do Not Skip the Madd', 'The Madd sound must also be heard clearly.', '<div class="pq-twh-stop"><span>Correct: Bboo</span><span>Not: Bbu</span></div>') +
        card('9', 'Nun and Mim Use Ghunnah', 'When نّ or مّ has Tashdeed before Madd, read the nasal sound clearly before stretching.', ex(['نِّي = Nnee', 'مُّو = Mmoo'])) +
        card('10', 'Read Smoothly and Clearly', 'Give Tashdeed its strength and Madd its length. Do not rush.', '<ul><li>Tashdeed first</li><li>Madd length next</li><li>Beautiful reading</li></ul>') +
      '</div>' +
      '<div class="pq-twh-rules__practice"><h3>Practice Tashdeed with Maddah</h3>' +
        group('Alif Maddah', ['بَّا','تَّا','ثَّا','نَّا','مَّا']) +
        group('Waw Maddah', ['بُّو','تُّو','ثُّو','نُّو','مُّو']) +
        group('Ya Maddah', ['بِّي','تِّي','ثِّي','نِّي','مِّي']) +
      '</div>' +
      '<div class="pq-twh-rules__practice"><h3>Practice Words</h3>' +
        group('Alif Maddah', ['إِنَّا','عَمَّا','رَبَّانَا']) +
        group('Waw Maddah', ['الْحَاقُّونَ','الضَّالُّونَ']) +
        group('Ya Maddah', ['النَّبِيِّينَ','الأُمِّيِّينَ']) +
      '</div>' +
      '<div class="pq-twh-rules__remember"><h3>Remember</h3>' +
        '<span>Tashdeed means the letter is read twice.</span><span>Madd means the sound is stretched.</span><span>Read the Tashdeed first.</span><span>Then stretch the Madd sound.</span><span>Alif = aa, Waw = oo, Ya = ee.</span><span>نّ and مّ use Ghunnah.</span><span>Give each sound its right.</span><span>Read clearly and beautifully.</span>' +
      '</div>' +
      '<div class="pq-twh-rules__footer"><button type="button" id="pqTashdeedHaroofRulesCompleteBtn">Complete Rules</button></div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) gridWrap.parentNode.insertBefore(panel, gridWrap);
    else document.body.appendChild(panel);

    var completeBtn = panel.querySelector('#pqTashdeedHaroofRulesCompleteBtn');
    if (completeBtn) completeBtn.addEventListener('click', function () {
      var action = document.getElementById('pqStepActionBtn');
      if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') action.click();
    });

    var audioBtn = panel.querySelector('#pqTashdeedHaroofRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }

    return panel;
  }

  function card(n, title, body, extra) {
    return '<article class="pq-twh-rule-card"><div class="pq-twh-rule-card__num">' + n + '</div><div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-twh-rule-card__extra">' + extra + '</div></div></article>';
  }
  function ex(items) {
    return '<div class="pq-twh-example-row">' + items.map(function (item) { return '<span dir="auto">' + item + '</span>'; }).join('') + '</div>';
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
    document.body.classList.toggle('pq-tashdeed-haroof-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqTashdeedHaroofRulesAudioBtn');
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  window.setTimeout(bindLectureUrl, 0);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
