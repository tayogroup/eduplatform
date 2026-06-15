(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/maddoleen/';
    return String(base) + 'maddoleen.mp3';
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
    var existing = document.getElementById('pqMaddoleenRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqMaddoleenRulesPanel';
    panel.className = 'pq-mdl-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Maddleen rules lesson');
    panel.innerHTML =
      '<div class="pq-mdl-rules__hero">' +
        '<div class="pq-mdl-rules__badge">Maddoleen Rules</div>' +
        '<h2><span dir="rtl">حَرَكَاتُ مَدِّ اللِّين</span></h2>' +
        '<p>Maddleen means a soft and gentle sound. It happens when a <b>Fathah</b> is followed by <b>Ya Sakinah</b> or <b>Waw Sakinah</b>.</p>' +
        '<button type="button" class="pq-mdl-rules__audio-btn" id="pqMaddoleenRulesAudioBtn">Play Rules Audio</button>' +
        '<div class="pq-mdl-rules__examples" aria-label="Maddleen examples">' +
          '<span dir="rtl">بَيْ</span><span>Ay sound</span>' +
          '<span dir="rtl">خَوْ</span><span>Aw sound</span>' +
        '</div>' +
      '</div>' +
      '<div class="pq-mdl-rules__deck">' +
        ruleCard('1', 'Maddleen Creates a Soft Sound', 'Leen means softness. The sound should be gentle and easy, not harsh.', examples(['بَيْ = Bay', 'خَوْ = Khaw'])) +
        ruleCard('2', 'Maddleen Uses a Fathah', 'Every Maddleen begins with a Fathah. The Fathah opens the sound before the glide.', examples(['بَيْ', 'خَوْ'])) +
        ruleCard('3', 'Fathah + Ya Sakinah Makes Ay', 'When a Fathah is followed by Ya Sakinah, read the soft ay sound clearly.', examples(['بَيْ = Bay', 'لَيْ', 'شَيْ', 'غَيْ'])) +
        ruleCard('4', 'Fathah + Waw Sakinah Makes Aw', 'When a Fathah is followed by Waw Sakinah, read the soft aw sound clearly.', examples(['خَوْ = Khaw', 'قَوْ', 'نَوْ', 'يَوْ'])) +
        ruleCard('5', 'Read the Two Letters Together', 'The Fathah and the Ya or Waw work together as one sound. Keep the sound joined.', '<div class="pq-mdl-stop"><span>بَيْ: Bay, not Ba-ee</span><span>خَوْ: Khaw, not Kha-oo</span></div>') +
        ruleCard('6', 'Do Not Read It Like Long Madd', 'Maddleen is different from Haroof Maddah. The sounds are not the same.', '<div class="pq-mdl-stop"><span>بِي = Bee, long Madd</span><span>بَيْ = Bay, Maddleen</span></div>') +
        ruleCard('7', 'Pronounce Each Movement Correctly', 'For Ya, glide gently toward Ya. For Waw, round your lips gently toward Waw.', '<div class="pq-mdl-stop"><span>بَيْ = Bay</span><span>خَوْ = Khaw</span></div>') +
        ruleCard('8', 'Read Clearly While Continuing', 'When reading through a word, pronounce the Maddleen naturally and smoothly.', examples(['بَيْتٌ = Baytun', 'لَيْلٌ = Laylun', 'يَوْمٌ = Yawmun'])) +
        ruleCard('9', 'The Soft Sound Must Be Heard', 'Do not drop the Ya or Waw sound. The glide should be easy to hear.', examples(['بَيْ = Bay', 'خَوْ = Khaw'])) +
        ruleCard('10', 'Read Smoothly and Gently', 'Do not rush or force the sound. Read calmly and beautifully.', '<ul><li>Soft glide</li><li>Clear sound</li><li>Gentle reading</li></ul>') +
      '</div>' +
      '<div class="pq-mdl-rules__practice">' +
        '<h3>Practice Maddleen Movements</h3>' +
        practiceGroup('Maddleen with Ya', ['بَيْ', 'تَيْ', 'ثَيْ', 'نَيْ']) +
        practiceGroup('Maddleen with Waw', ['بَوْ', 'تَوْ', 'ثَوْ', 'نَوْ']) +
      '</div>' +
      '<div class="pq-mdl-rules__practice">' +
        '<h3>Practice Words</h3>' +
        practiceGroup('Ya Maddleen', ['بَيْتٌ', 'لَيْلٌ', 'غَيْرُ', 'شَيْءٌ']) +
        practiceGroup('Waw Maddleen', ['يَوْمٌ', 'خَوْفٌ', 'قَوْمٌ', 'نَوْمٌ']) +
      '</div>' +
      '<div class="pq-mdl-rules__remember">' +
        '<h3>Remember</h3>' +
        '<span>Maddleen means a soft sound.</span>' +
        '<span>It begins with a Fathah.</span>' +
        '<span>Fathah + Ya Sakinah = Ay.</span>' +
        '<span>Fathah + Waw Sakinah = Aw.</span>' +
        '<span>Read the letters together as one sound.</span>' +
        '<span>Do not confuse Maddleen with a long Madd.</span>' +
        '<span>Read softly, clearly, and beautifully.</span>' +
      '</div>' +
      '<div class="pq-mdl-rules__footer">' +
        '<button type="button" id="pqMaddoleenRulesCompleteBtn">Complete Rules</button>' +
      '</div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) {
      gridWrap.parentNode.insertBefore(panel, gridWrap);
    } else {
      document.body.appendChild(panel);
    }

    var completeBtn = panel.querySelector('#pqMaddoleenRulesCompleteBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', function () {
        var action = document.getElementById('pqStepActionBtn');
        if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') {
          action.click();
        }
      });
    }

    var audioBtn = panel.querySelector('#pqMaddoleenRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }

    return panel;
  }

  function ruleCard(number, title, body, extra) {
    return '<article class="pq-mdl-rule-card">' +
      '<div class="pq-mdl-rule-card__num">' + number + '</div>' +
      '<div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-mdl-rule-card__extra">' + extra + '</div></div>' +
    '</article>';
  }

  function examples(items) {
    return '<div class="pq-mdl-example-row">' + items.map(function (item) {
      return '<span dir="auto">' + item + '</span>';
    }).join('') + '</div>';
  }

  function practiceGroup(title, words) {
    return '<section><h4>' + title + '</h4><div>' + words.map(function (word) {
      return '<span dir="rtl">' + word + '</span>';
    }).join('') + '</div></section>';
  }

  function bindLectureUrl() {
    var video = document.getElementById('lectureVideo');
    var lectureUrl = window.UNIT_CFG && window.UNIT_CFG.media && window.UNIT_CFG.media.lectureUrl;
    if (video && lectureUrl && !video.getAttribute('src')) {
      video.setAttribute('src', lectureUrl);
    }
  }

  function syncRulesPanel() {
    var panel = ensureRulesPanel();
    var action = document.getElementById('pqStepActionBtn');
    var isRules = !!(action && String(action.dataset.stepId || '').toLowerCase() === 'rules');
    panel.hidden = !isRules;
    document.body.classList.toggle('pq-maddoleen-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqMaddoleenRulesAudioBtn');
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  window.setTimeout(bindLectureUrl, 0);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
