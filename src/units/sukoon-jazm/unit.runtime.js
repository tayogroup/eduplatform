(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/sukoon-jazm/';
    return String(base) + 'sakuun_jazm.mp3';
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
    var existing = document.getElementById('pqSukoonJazmRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqSukoonJazmRulesPanel';
    panel.className = 'pq-sj-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Sukoon Jazm rules lesson');
    panel.innerHTML =
      '<div class="pq-sj-rules__hero">' +
        '<div class="pq-sj-rules__badge">Sukoon Jazm Rules</div>' +
        '<h2><span dir="rtl">حَرَكَاتُ السُّكُونِ / الْجَزْمِ</span></h2>' +
        '<p>Sukoon is a sign above a letter. It means the letter has <b>no vowel sound</b>. Read the letter clearly, then stop the sound.</p>' +
        '<button type="button" class="pq-sj-rules__audio-btn" id="pqSukoonJazmRulesAudioBtn">Play Rules Audio</button>' +
        '<div class="pq-sj-rules__examples"><span dir="rtl">بْ</span><span dir="rtl">تْ</span><span dir="rtl">مْ</span><span dir="rtl">نْ</span></div>' +
      '</div>' +
      '<div class="pq-sj-rules__deck">' +
        card('1', 'Sukoon Means No Movement', 'A letter with Sukoon has no Fathah, Kasrah, or Dammah. The sound stops on the letter.', ex(['بْ = B','تْ = T','مْ = M'])) +
        card('2', 'Read the Letter Before Sukoon', 'The letter before the Sukoon gives the movement. Read that movement first, then stop.', ex(['أَبْ = Ab','إِبْ = Ib','أُبْ = Ub'])) +
        card('3', 'Fathah + Sukoon', 'When Fathah comes before Sukoon, read the a sound, then stop.', ex(['أَبْ = Ab','أَتْ = At','أَمْ = Am'])) +
        card('4', 'Kasrah + Sukoon', 'When Kasrah comes before Sukoon, read the i sound, then stop.', ex(['إِبْ = Ib','إِتْ = It','إِمْ = Im'])) +
        card('5', 'Dammah + Sukoon', 'When Dammah comes before Sukoon, read the u sound, then stop.', ex(['أُبْ = Ub','أُتْ = Ut','أُمْ = Um'])) +
        card('6', 'Stop the Sound Clearly', 'Do not add an extra vowel sound after Sukoon.', '<div class="pq-sj-stop"><span>Read: Ab</span><span>Not: Aba</span><span>Read: At</span><span>Not: Ata</span></div>') +
        card('7', 'Pronounce Sukoon Clearly', 'Every Sukoon letter should be heard. Do not swallow the final sound.', ex(['أَبْ = Ab','أَدْ = Ad','أَفْ = Af'])) +
        card('8', 'Heavy Letters Stay Heavy', 'If the Sukoon letter is heavy, keep it heavy.', ex(['أَصْ = As','أَطْ = At','أَقْ = Aq'])) +
        card('9', 'Light Letters Stay Light', 'If the Sukoon letter is light, keep it light.', ex(['أَبْ = Ab','أَلْ = Al','أَمْ = Am'])) +
        card('10', 'Read Smoothly and Clearly', 'Read the movement first. Stop cleanly on the Sukoon letter. Do not rush or add extra sounds.', '<ul><li>Movement first</li><li>Clean stop</li><li>Beautiful reading</li></ul>') +
      '</div>' +
      '<div class="pq-sj-rules__practice"><h3>Practice Sukoon Movements</h3>' +
        group('Fathah + Sukoon', ['أَبْ','أَتْ','أَثْ','أَنْ','أَمْ']) +
        group('Kasrah + Sukoon', ['إِبْ','إِتْ','إِثْ','إِنْ','إِمْ']) +
        group('Dammah + Sukoon', ['أُبْ','أُتْ','أُثْ','أُنْ','أُمْ']) +
      '</div>' +
      '<div class="pq-sj-rules__practice"><h3>Practice Words</h3>' +
        group('Fathah + Sukoon', ['لَمْ','قَدْ','هَلْ','مَنْ']) +
        group('Kasrah + Sukoon', ['بِسْمِ','إِذْ']) +
        group('Dammah + Sukoon', ['كُنْ','هُمْ','أَنْتُمْ']) +
      '</div>' +
      '<div class="pq-sj-rules__remember"><h3>Remember</h3>' +
        '<span>Sukoon means no vowel sound.</span><span>Read the letter before Sukoon first.</span><span>Fathah + Sukoon = Ab, At, Am.</span><span>Kasrah + Sukoon = Ib, It, Im.</span><span>Dammah + Sukoon = Ub, Ut, Um.</span><span>Stop clearly on the Sukoon letter.</span><span>Do not add an extra vowel.</span><span>Heavy letters stay heavy.</span><span>Light letters stay light.</span><span>Read clearly and beautifully.</span>' +
      '</div>' +
      '<div class="pq-sj-rules__footer"><button type="button" id="pqSukoonJazmRulesCompleteBtn">Complete Rules</button></div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) gridWrap.parentNode.insertBefore(panel, gridWrap);
    else document.body.appendChild(panel);

    var completeBtn = panel.querySelector('#pqSukoonJazmRulesCompleteBtn');
    if (completeBtn) completeBtn.addEventListener('click', function () {
      var action = document.getElementById('pqStepActionBtn');
      if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') action.click();
    });

    var audioBtn = panel.querySelector('#pqSukoonJazmRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }

    return panel;
  }

  function card(n, title, body, extra) {
    return '<article class="pq-sj-rule-card"><div class="pq-sj-rule-card__num">' + n + '</div><div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-sj-rule-card__extra">' + extra + '</div></div></article>';
  }
  function ex(items) {
    return '<div class="pq-sj-example-row">' + items.map(function (item) { return '<span dir="auto">' + item + '</span>'; }).join('') + '</div>';
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
    document.body.classList.toggle('pq-sukoon-jazm-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqSukoonJazmRulesAudioBtn');
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  window.setTimeout(bindLectureUrl, 0);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
