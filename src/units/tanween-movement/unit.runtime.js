(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/tanween-movement/';
    return String(base) + 'tanween_movement_rules.mp3';
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
    var existing = document.getElementById('pqTanweenRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqTanweenRulesPanel';
    panel.className = 'pq-tan-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Tanween rules lesson');
    panel.innerHTML =
      '<div class="pq-tan-rules__hero">' +
        '<div class="pq-tan-rules__badge">Tanween Movement Rules</div>' +
        '<h2><span dir="rtl">حَرَكَاتُ التَّنْوِين</span></h2>' +
        '<p>Tanween Movements are the three Tanween signs used at the end of words. Each one adds a light <b>n</b> sound.</p>' +
        '<button type="button" class="pq-tan-rules__audio-btn" id="pqTanRulesAudioBtn">Play Rules Audio</button>' +
        '<div class="pq-tan-rules__examples" aria-label="Tanween examples">' +
          '<span dir="rtl">ً</span><span>Tanween Fath = an</span>' +
          '<span dir="rtl">ٍ</span><span>Tanween Kasr = in</span>' +
          '<span dir="rtl">ٌ</span><span>Tanween Damm = un</span>' +
        '</div>' +
      '</div>' +
      '<div class="pq-tan-rules__deck">' +
        ruleCard('1', 'Tanween Movements Add an N Sound', 'Every Tanween Movement adds a light n sound. Read the n sound clearly.', examples(['بً = Ban', 'بٍ = Bin', 'بٌ = Bun'])) +
        ruleCard('2', 'Tanween Fath Makes an', 'Tanween Fath is written as two Fathah marks. Read the sound: an.', examples(['بً = Ban', 'كِتَابًا = Kitaban', 'عَلِيمًا = Aliman'])) +
        ruleCard('3', 'Tanween Kasr Makes in', 'Tanween Kasr is written as two Kasrah marks. Read the sound: in.', examples(['بٍ = Bin', 'كِتَابٍ = Kitabin', 'عَلِيمٍ = Alimin'])) +
        ruleCard('4', 'Tanween Damm Makes un', 'Tanween Damm is written as two Dammah marks. Read the sound: un.', examples(['بٌ = Bun', 'كِتَابٌ = Kitabun', 'عَلِيمٌ = Alimun'])) +
        ruleCard('5', 'Read the Tanween Together', 'The two Harakah marks work together as one sound. Do not split them.', '<div class="pq-tan-stop"><span>بً: Ban, not Ba-a</span><span>بٍ: Bin, not Bi-i</span><span>بٌ: Bun, not Bu-u</span></div>') +
        ruleCard('6', 'Tanween Comes at the End', 'Tanween Movements are always found at the end of words. Read them after the final letter.', examples(['مُسْلِمٌ', 'مُؤْمِنٍ', 'صَالِحًا'])) +
        ruleCard('7', 'Pronounce Each Movement Correctly', 'Fath opens the sound, Kasr pulls it gently downward, and Damm rounds the lips slightly.', '<div class="pq-tan-stop"><span>بً = Ban</span><span>بٍ = Bin</span><span>بٌ = Bun</span></div>') +
        ruleCard('8', 'Fath Tanween Often Has Alif', 'Many words with Tanween Fath have an Alif after the last letter. The Alif is not read separately.', examples(['كِتَابًا = Kitaban'])) +
        ruleCard('9', 'When Stopping, Tanween Changes', 'When stopping, the Tanween sound usually disappears.', '<div class="pq-tan-stop"><span>Continuing: Kitabun</span><span>Stopping: Kitab</span><span>Continuing: Kitabin</span><span>Stopping: Kitab</span><span>Continuing: Kitaban</span><span>Stopping: Kitaba</span></div>') +
        ruleCard('10', 'Read Smoothly and Clearly', 'Do not rush. Make the final n sound easy to hear and give each movement its correct sound.', '<ul><li>Clear n sound</li><li>Correct movement</li><li>Beautiful reading</li></ul>') +
      '</div>' +
      '<div class="pq-tan-rules__practice">' +
        '<h3>Practice the Three Tanween Movements</h3>' +
        practiceGroup('Tanween Fath', ['بً', 'تً', 'ثً', 'نً']) +
        practiceGroup('Tanween Kasr', ['بٍ', 'تٍ', 'ثٍ', 'نٍ']) +
        practiceGroup('Tanween Damm', ['بٌ', 'تٌ', 'ثٌ', 'نٌ']) +
      '</div>' +
      '<div class="pq-tan-rules__practice">' +
        '<h3>Practice Words</h3>' +
        practiceGroup('Fathatayn', ['كِتَابًا', 'عَلِيمًا', 'رَحِيمًا']) +
        practiceGroup('Kasratayn', ['كِتَابٍ', 'عَلِيمٍ', 'رَحِيمٍ']) +
        practiceGroup('Dammatayn', ['كِتَابٌ', 'عَلِيمٌ', 'رَحِيمٌ']) +
      '</div>' +
      '<div class="pq-tan-rules__remember">' +
        '<h3>Remember</h3>' +
        '<span>Tanween Movements add a light n sound.</span>' +
        '<span>ً = an</span>' +
        '<span>ٍ = in</span>' +
        '<span>ٌ = un</span>' +
        '<span>Read the two marks together as one sound.</span>' +
        '<span>Tanween comes at the end of words.</span>' +
        '<span>Read clearly, smoothly, and beautifully.</span>' +
      '</div>' +
      '<div class="pq-tan-rules__footer">' +
        '<button type="button" id="pqTanRulesCompleteBtn">Complete Rules</button>' +
      '</div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) {
      gridWrap.parentNode.insertBefore(panel, gridWrap);
    } else {
      document.body.appendChild(panel);
    }

    var completeBtn = panel.querySelector('#pqTanRulesCompleteBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', function () {
        var action = document.getElementById('pqStepActionBtn');
        if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') {
          action.click();
        }
      });
    }

    var audioBtn = panel.querySelector('#pqTanRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }

    return panel;
  }

  function ruleCard(number, title, body, extra) {
    return '<article class="pq-tan-rule-card">' +
      '<div class="pq-tan-rule-card__num">' + number + '</div>' +
      '<div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-tan-rule-card__extra">' + extra + '</div></div>' +
    '</article>';
  }

  function chips(items) {
    return '<div class="pq-tan-chip-row">' + items.map(function (item) {
      return '<span class="pq-tan-chip" dir="auto">' + item + '</span>';
    }).join('') + '</div>';
  }

  function examples(items) {
    return '<div class="pq-tan-example-row">' + items.map(function (item) {
      return '<span dir="auto">' + item + '</span>';
    }).join('') + '</div>';
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
    document.body.classList.toggle('pq-tanween-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqTanRulesAudioBtn');
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
