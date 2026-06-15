(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/muqattiat/';
    return String(base) + 'muqattiat_rules.mp3';
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
    var existing = document.getElementById('pqMuqattiatRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqMuqattiatRulesPanel';
    panel.className = 'pq-muq-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Muqattiat rules lesson');
    panel.innerHTML =
      '<div class="pq-muq-rules__hero">' +
        '<div class="pq-muq-rules__badge">Muqattiat Rules</div>' +
        '<h2><span dir="rtl">&#1575;&#1604;&#1605;&#1615;&#1602;&#1614;&#1591;&#1617;&#1614;&#1593;&#1614;&#1575;&#1578;</span></h2>' +
        '<p>Special letters at the beginning of some surahs. We read each letter by its name, not as one joined word.</p>' +
        '<button type="button" class="pq-muq-rules__audio-btn" id="pqMuqRulesAudioBtn">Play Rules Audio</button>' +
        '<div class="pq-muq-rules__examples" aria-label="Examples">' +
          '<span dir="rtl">&#1575;&#1614;&#1604;&#1619;&#1605;&#1619;</span><span>Alif &bull; Lam &bull; Mim</span>' +
          '<span dir="rtl">&#1591;&#1648;&#1607;&#1648;</span><span>Ta &bull; Ha</span>' +
          '<span dir="rtl">&#1610;&#1648;&#1587;&#1619;</span><span>Ya &bull; Sin</span>' +
        '</div>' +
      '</div>' +
      '<div class="pq-muq-rules__deck">' +
        ruleCard('1', 'Read Each Letter by Its Name', 'Do not join the letters together as a word. Read each letter separately.', '<b>Correct</b><span dir="rtl">&#1575;&#1614;&#1604;&#1619;&#1605;&#1619;</span><small>Alif &bull; Lam &bull; Mim</small><b class="bad">Not Correct</b><small>Alam</small>') +
        ruleCard('2', 'Stretch Madd Letters Properly', 'Many Muqattiat letters contain Madd. Stretch the long vowel clearly.', chips(['&#1581;&#1648; Ha', '&#1591;&#1648; Ta', '&#1610;&#1648; Ya', '&#1603;&#1619; Kaf'])) +
        ruleCard('3', 'Some Letters Are 2 Counts', 'Letters with normal Madd are stretched for 2 counts.', countRow(2) + '<span class="pq-muq-example" dir="rtl">&#1591;&#1648;&#1607;&#1648;</span><small>Ta &bull; Ha</small>') +
        ruleCard('4', 'Some Letters Are 6 Counts', 'Letters with a permanent sukun after Madd are stretched for 6 counts.', countRow(6) + chips(['&#1604;&#1619; Lam', '&#1605;&#1619; Mim', '&#1587;&#1619; Sin', '&#1589;&#1619; Sad', '&#1602;&#1619; Qaf', '&#1606;&#1619; Nun'])) +
        ruleCard('5', 'Ghunnah in Nun and Mim', 'Mim and Nun are read with a gentle nasal sound.', '<span class="pq-muq-example" dir="rtl">&#1605;&#1619;</span><span class="pq-muq-example" dir="rtl">&#1606;&#1619;</span><small>Let the sound pass gently through the nose.</small>') +
        ruleCard('6', 'Heavy Letters Stay Heavy', 'Heavy letters keep a full, strong sound.', chips(['&#1589;&#1619; Sad', '&#1591;&#1648; Ta', '&#1602;&#1619; Qaf'])) +
        ruleCard('7', 'Light Letters Stay Light', 'Light letters are read gently. Do not make them heavy.', chips(['&#1610;&#1648; Ya', '&#1607;&#1648; Ha', '&#1605;&#1619; Mim', '&#1606;&#1619; Nun'])) +
        ruleCard('8', 'Read Calmly and Clearly', 'Take your time. Give every Madd its length and every letter its clear sound.', '<ul><li>Do not rush</li><li>Stretch properly</li><li>Use Ghunnah when needed</li></ul>') +
      '</div>' +
      '<div class="pq-muq-rules__combo-wrap">' +
        '<h3>The 14 Muqattiat Combinations</h3>' +
        '<div class="pq-muq-rules__combo-grid">' +
          combos(['&#1575;&#1614;&#1604;&#1619;&#1605;&#1619;','&#1575;&#1614;&#1604;&#1619;&#1605;&#1619;&#1589;&#1619;','&#1575;&#1614;&#1604;&#1585;&#1648;','&#1575;&#1614;&#1604;&#1619;&#1605;&#1619;&#1585;&#1648;','&#1603;&#1619;&#1607;&#1610;&#1593;&#1619;&#1589;&#1619;','&#1591;&#1648;&#1607;&#1648;','&#1591;&#1648;&#1587;&#1619;','&#1591;&#1648;&#1587;&#1619;&#1605;&#1619;','&#1610;&#1648;&#1587;&#1619;','&#1589;&#1619;','&#1581;&#1648;&#1605;&#1619;','&#1581;&#1648;&#1605;&#1619; &#1593;&#1619;&#1587;&#1619;&#1602;&#1619;','&#1602;&#1619;','&#1606;&#1619;']) +
        '</div>' +
      '</div>' +
      '<div class="pq-muq-rules__footer">' +
        '<button type="button" id="pqMuqRulesCompleteBtn">Complete Rules</button>' +
      '</div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) {
      gridWrap.parentNode.insertBefore(panel, gridWrap);
    } else {
      document.body.appendChild(panel);
    }

    var completeBtn = panel.querySelector('#pqMuqRulesCompleteBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', function () {
        var action = document.getElementById('pqStepActionBtn');
        if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') {
          action.click();
        }
      });
    }

    var audioBtn = panel.querySelector('#pqMuqRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }

    return panel;
  }

  function ruleCard(number, title, body, extra) {
    return '<article class="pq-muq-rule-card">' +
      '<div class="pq-muq-rule-card__num">' + number + '</div>' +
      '<div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-muq-rule-card__extra">' + extra + '</div></div>' +
    '</article>';
  }

  function chips(items) {
    return '<div class="pq-muq-chip-row">' + items.map(function (item) {
      return '<span class="pq-muq-chip" dir="auto">' + item + '</span>';
    }).join('') + '</div>';
  }

  function countRow(count) {
    var out = '<div class="pq-muq-counts">';
    for (var i = 1; i <= count; i += 1) out += '<span>' + i + '</span>';
    return out + '</div>';
  }

  function combos(items) {
    return items.map(function (item, index) {
      return '<span class="pq-muq-combo" dir="rtl"><small>' + (index + 1) + '</small>' + item + '</span>';
    }).join('');
  }

  function syncRulesPanel() {
    var panel = ensureRulesPanel();
    var action = document.getElementById('pqStepActionBtn');
    var isRules = !!(action && String(action.dataset.stepId || '').toLowerCase() === 'rules');
    panel.hidden = !isRules;
    document.body.classList.toggle('pq-muq-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqMuqRulesAudioBtn');
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
