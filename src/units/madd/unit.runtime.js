(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/madd/';
    return String(base) + 'madd_rules.mp3';
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
    var existing = document.getElementById('pqMaddRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqMaddRulesPanel';
    panel.className = 'pq-madd-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Madd rules lesson');
    panel.innerHTML =
      '<div class="pq-madd-rules__hero">' +
        '<div class="pq-madd-rules__badge">Madd Rules</div>' +
        '<h2><span dir="rtl">الْمَدُّ</span></h2>' +
        '<p>Madd means to stretch or lengthen a sound. The three Madd letters are <b>Alif</b>, <b>Waw</b>, and <b>Ya</b>.</p>' +
        '<button type="button" class="pq-madd-rules__audio-btn" id="pqMaddRulesAudioBtn">Play Rules Audio</button>' +
        '<div class="pq-madd-rules__examples" aria-label="Madd letters">' +
          '<span dir="rtl">ا</span><span>Alif Maddah</span>' +
          '<span dir="rtl">و</span><span>Waw Maddah</span>' +
          '<span dir="rtl">ي</span><span>Ya Maddah</span>' +
        '</div>' +
      '</div>' +
      '<div class="pq-madd-rules__deck">' +
        ruleCard('1', 'Madd Means Stretching the Sound', 'A Madd letter makes the sound longer.', examples(['بَ = Ba', 'بَا = Baa'])) +
        ruleCard('2', 'There Are Three Madd Letters', 'Alif follows Fathah, Waw follows Dammah, and Ya follows Kasrah.', chips(['ا = Baa', 'و = Boo', 'ي = Bee'])) +
        ruleCard('3', 'Alif Maddah Follows Fathah', 'When a letter has Fathah and is followed by Alif, stretch the sound.', examples(['بَا = Baa', 'تَا = Taa', 'مَا = Maa'])) +
        ruleCard('4', 'Waw Maddah Follows Dammah', 'When a letter has Dammah and is followed by Waw Sakinah, stretch the sound.', examples(['بُو = Boo', 'نُو = Noo', 'قُو = Qoo'])) +
        ruleCard('5', 'Ya Maddah Follows Kasrah', 'When a letter has Kasrah and is followed by Ya Sakinah, stretch the sound.', examples(['بِي = Bee', 'فِي = Fee', 'لِي = Lee'])) +
        ruleCard('6', 'Stretch Madd for Two Counts', 'The basic Madd is stretched for two counts.', countRow(2) + examples(['بَا = Baa', 'بُو = Boo', 'بِي = Bee'])) +
        ruleCard('7', 'Keep the Sound Smooth', 'Stretch gently and smoothly. Do not break the sound.', '<div class="pq-madd-stop"><span>Correct: Baa</span><span>Not: Ba-a-a-a-a</span></div>') +
        ruleCard('8', 'Do Not Add Extra Sounds', 'Read only the sound of the letter and the Madd. Keep it pure and clear.', '<div class="pq-madd-stop"><span>Read: Baa</span><span>Do not read: Baya</span><span>Do not read: Bawa</span><span>Do not read: Baaaah</span></div>') +
        ruleCard('9', 'Pronounce Each Movement Correctly', 'Fathah opens the mouth, Dammah rounds the lips, and Kasrah stretches the smile position.', '<div class="pq-madd-stop"><span>بَا = Baa</span><span>بُو = Boo</span><span>بِي = Bee</span></div>') +
        ruleCard('10', 'Read Calmly and Clearly', 'Do not rush. Give every Madd letter its full length and read beautifully.', '<ul><li>Stretch clearly</li><li>Keep it smooth</li><li>Use two counts</li></ul>') +
      '</div>' +
      '<div class="pq-madd-rules__practice">' +
        '<h3>Practice the Three Madd Letters</h3>' +
        practiceGroup('Alif Maddah', ['بَا', 'تَا', 'ثَا', 'نَا']) +
        practiceGroup('Waw Maddah', ['بُو', 'تُو', 'ثُو', 'نُو']) +
        practiceGroup('Ya Maddah', ['بِي', 'تِي', 'ثِي', 'نِي']) +
      '</div>' +
      '<div class="pq-madd-rules__practice">' +
        '<h3>Practice Words</h3>' +
        practiceGroup('Alif Maddah', ['قَالَ', 'مَالَ', 'كَانَ']) +
        practiceGroup('Waw Maddah', ['يَقُولُ', 'نُورٌ', 'رَسُولٌ']) +
        practiceGroup('Ya Maddah', ['فِي', 'قِيلَ', 'كَبِيرٌ']) +
      '</div>' +
      '<div class="pq-madd-rules__remember">' +
        '<h3>Remember</h3>' +
        '<span>Madd means to stretch the sound.</span>' +
        '<span>There are three Madd letters: ا, و, ي.</span>' +
        '<span>Stretch the sound for two counts.</span>' +
        '<span>Keep the sound smooth and clear.</span>' +
        '<span>Do not add extra sounds.</span>' +
        '<span>Read slowly, correctly, and beautifully.</span>' +
      '</div>' +
      '<div class="pq-madd-rules__footer">' +
        '<button type="button" id="pqMaddRulesCompleteBtn">Complete Rules</button>' +
      '</div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) {
      gridWrap.parentNode.insertBefore(panel, gridWrap);
    } else {
      document.body.appendChild(panel);
    }

    var completeBtn = panel.querySelector('#pqMaddRulesCompleteBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', function () {
        var action = document.getElementById('pqStepActionBtn');
        if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') {
          action.click();
        }
      });
    }

    var audioBtn = panel.querySelector('#pqMaddRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }

    return panel;
  }

  function ruleCard(number, title, body, extra) {
    return '<article class="pq-madd-rule-card">' +
      '<div class="pq-madd-rule-card__num">' + number + '</div>' +
      '<div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-madd-rule-card__extra">' + extra + '</div></div>' +
    '</article>';
  }

  function chips(items) {
    return '<div class="pq-madd-chip-row">' + items.map(function (item) {
      return '<span class="pq-madd-chip" dir="auto">' + item + '</span>';
    }).join('') + '</div>';
  }

  function examples(items) {
    return '<div class="pq-madd-example-row">' + items.map(function (item) {
      return '<span dir="auto">' + item + '</span>';
    }).join('') + '</div>';
  }

  function countRow(count) {
    var out = '<div class="pq-madd-counts">';
    for (var i = 1; i <= count; i += 1) out += '<span>' + i + '</span>';
    return out + '</div>';
  }

  function practiceGroup(title, words) {
    return '<section><h4>' + title + '</h4><div>' + words.map(function (word) {
      return '<span dir="rtl">' + word + '</span>';
    }).join('') + '</div></section>';
  }

  function syncRulesPanel() {
    var panel = ensureRulesPanel();
    var action = document.getElementById('pqStepActionBtn');
    var isRules = !!(action && String(action.dataset.stepId || '').toLowerCase() === 'rules');
    panel.hidden = !isRules;
    document.body.classList.toggle('pq-madd-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqMaddRulesAudioBtn');
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
