(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/tashdeed-tashdeed/';
    return String(base) + 'tashdeed_with_tashdeed_rules.mp3';
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
    var existing = document.getElementById('pqTashdeedTashdeedRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqTashdeedTashdeedRulesPanel';
    panel.className = 'pq-ttd-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Tashdeed with Tashdeed rules lesson');
    panel.innerHTML =
      '<div class="pq-ttd-rules__hero">' +
        '<div class="pq-ttd-rules__badge">Tashdeed with Tashdeed Rules</div>' +
        '<h2><span dir="rtl">التَّشْدِيدُ مَعَ التَّشْدِيدِ</span></h2>' +
        '<p>Sometimes two letters with Tashdeed come close together. Read the first Tashdeed clearly, then read the second Tashdeed clearly.</p>' +
        '<button type="button" class="pq-ttd-rules__audio-btn" id="pqTashdeedTashdeedRulesAudioBtn">Play Rules Audio</button>' +
        '<div class="pq-ttd-rules__examples"><span dir="rtl">بَّمَّ</span><span dir="rtl">تَّنَّ</span><span dir="rtl">لَّمَّ</span><span dir="rtl">نَّمَّ</span></div>' +
      '</div>' +
      '<div class="pq-ttd-rules__deck">' +
        card('1', 'Read the First Tashdeed Completely', 'Give the first Tashdeed its full strength. The first doubled letter must be heard clearly.', ex(['بَّمَّ = Bba-Mma'])) +
        card('2', 'Then Read the Second Tashdeed Completely', 'After completing the first Tashdeed, read the second Tashdeed clearly.', ex(['بَّمَّ = Bba-Mma'])) +
        card('3', 'Do Not Skip Either Tashdeed', 'Each Tashdeed represents a doubled letter. Do not remove either doubled sound.', '<div class="pq-ttd-stop"><span>Correct: Bba-Mma</span><span>Not: Bama</span></div>') +
        card('4', 'Press Each Tashdeed Slightly', 'A Tashdeed needs a brief hold before releasing the sound.', ex(['تَّنَّ = Tta-Nna'])) +
        card('5', 'Read Each Harakah Correctly', 'Every Tashdeed has its own movement. Read each movement clearly.', ex(['بِّمُّ = Bbi-Mmu'])) +
        card('6', 'Nun with Tashdeed Uses Ghunnah', 'If نّ appears, read it with Ghunnah and allow the nasal sound to be heard.', ex(['تَّنَّ = Tta-Nna'])) +
        card('7', 'Mim with Tashdeed Uses Ghunnah', 'If مّ appears, let the sound come gently through the nose.', ex(['بَّمَّ = Bba-Mma'])) +
        card('8', 'Heavy Letters Stay Heavy', 'If a letter with Tashdeed is heavy, keep it heavy.', ex(['صَّطَّ = Ssa-Tta'])) +
        card('9', 'Light Letters Stay Light', 'If a letter with Tashdeed is light, keep it light.', ex(['بَّلَّ = Bba-Lla'])) +
        card('10', 'Read Smoothly and Clearly', 'Give each Tashdeed its full strength. Do not rush between the two Tashdeeds.', '<ul><li>First Tashdeed</li><li>Second Tashdeed</li><li>Clear Ghunnah</li></ul>') +
      '</div>' +
      '<div class="pq-ttd-rules__practice"><h3>Practice Tashdeed with Tashdeed</h3>' +
        group('Fathah', ['بَّمَّ','تَّنَّ','ثَّمَّ','لَّمَّ']) +
        group('Kasrah', ['بِّمِّ','تِّنِّ','ثِّمِّ','لِّمِّ']) +
        group('Dammah', ['بُّمُّ','تُّنُّ','ثُّمُّ','لُّمُّ']) +
      '</div>' +
      '<div class="pq-ttd-rules__practice"><h3>Practice Mixed Movements and Ghunnah</h3>' +
        group('Mixed Movements', ['بَّمِّ','بِّمُّ','تَّنِّ','تِّنَّ']) +
        group('Ghunnah Practice', ['نَّمَّ','مَّنَّ','إِنَّمَّا','مِنَّمَّا']) +
      '</div>' +
      '<div class="pq-ttd-rules__remember"><h3>Remember</h3>' +
        '<span>Tashdeed means the letter is read twice.</span><span>Read the first Tashdeed completely.</span><span>Read the second Tashdeed completely.</span><span>Do not skip either doubled letter.</span><span>نّ and مّ are read with Ghunnah.</span><span>Heavy letters stay heavy.</span><span>Light letters stay light.</span><span>Read clearly, smoothly, and beautifully.</span>' +
      '</div>' +
      '<div class="pq-ttd-rules__footer"><button type="button" id="pqTashdeedTashdeedRulesCompleteBtn">Complete Rules</button></div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) gridWrap.parentNode.insertBefore(panel, gridWrap);
    else document.body.appendChild(panel);

    var completeBtn = panel.querySelector('#pqTashdeedTashdeedRulesCompleteBtn');
    if (completeBtn) completeBtn.addEventListener('click', function () {
      var action = document.getElementById('pqStepActionBtn');
      if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') action.click();
    });

    var audioBtn = panel.querySelector('#pqTashdeedTashdeedRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }

    return panel;
  }

  function card(n, title, body, extra) {
    return '<article class="pq-ttd-rule-card"><div class="pq-ttd-rule-card__num">' + n + '</div><div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-ttd-rule-card__extra">' + extra + '</div></div></article>';
  }
  function ex(items) {
    return '<div class="pq-ttd-example-row">' + items.map(function (item) { return '<span dir="auto">' + item + '</span>'; }).join('') + '</div>';
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
    document.body.classList.toggle('pq-tashdeed-tashdeed-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqTashdeedTashdeedRulesAudioBtn');
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  window.setTimeout(bindLectureUrl, 0);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
