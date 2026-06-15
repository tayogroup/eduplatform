(function () {
  'use strict';

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/tanween-movement/';
    return String(base) + 'tanween_rules2.mp3';
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
      window.__pqRulesBlockOnlyHighlight = true;
      window.__pqRulesBlockHighlightLeadSeconds = 0;
      window.__pqRulesManualSectionCues = [
        { section: 'hero', start: 0.091 },
        { section: 'rule-1', start: 26.116 },
        { section: 'rule-2', start: 44.884 },
        { section: 'rule-3', start: 90.894 },
        { section: 'rule-4', start: 116.880 },
        { section: 'rule-5', start: 146.518 },
        { section: 'rule-6', start: 168.751 },
        { section: 'rule-7', start: 190.754 },
        { section: 'rule-8', start: 214.537 },
        { section: 'rule-9', start: 258.722 },
        { section: 'practice', start: 273.878 },
        { section: 'remember', start: 295.528 }
      ];
      if (typeof window.__pqStartRulesAudioHighlight === 'function') {
        window.__pqStartRulesAudioHighlight(rulesAudio);
      }
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
    panel.innerHTML = renderRulesPanel();

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
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function phrase(text) {
    var html = escapeHtml(text)
      .replace(/([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g, '<span class="pq-tan-arabic-word" dir="rtl">$1</span>')
      .replace(/\n/g, '<br>');
    return '<p class="pq-tan-phrase" dir="auto">' + html + '</p>';
  }

  function phraseList(items) {
    return items.map(function (item) {
      var value = String(item == null ? '' : item);
      if (value.indexOf('<section class="pq-tan-harakat-section"') === 0) return value;
      return phrase(value);
    }).join('');
  }

  function ruleSection(key, number, title, phrases) {
    return '<article class="pq-tan-rule-card" data-rules-section="' + key + '">' +
      '<div class="pq-tan-rule-card__head">' +
        '<div class="pq-tan-rule-card__num">' + number + '</div>' +
        '<h3>' + escapeHtml(title) + '</h3>' +
      '</div>' +
      '<div class="pq-tan-rule-card__extra">' + phraseList(phrases) + '</div>' +
    '</article>';
  }

  function harakatSection(key, title, phrases) {
    return '<section class="pq-tan-harakat-section" data-rules-section="' + key + '" data-rules-subsection="true">' +
      '<h4>' + escapeHtml(title) + '</h4>' +
      '<div class="pq-tan-script">' + phraseList(phrases) + '</div>' +
    '</section>';
  }

  function renderRulesPanel() {
    var hero = [
      'Today, we are learning Tanween. Tanween is the sound of an extra "n" added to the end of a word. Tanween is written using two Harakah marks. There are three types of Tanween: Tanween Fatḥ, Tanween Kasr, and Tanween Ḍamm. Let\'s learn them together.'
    ];
    var rules = [
      ['rule-1', '1', 'Rule Number One!', [
        'Tanween makes the "n" sound. Listen carefully:',
        'كِتَابٌ — Kitābun.',
        'كِتَابٍ — Kitābin.',
        'كِتَابًا — Kitāban.',
        'Notice the light "n" sound at the end of each word.'
      ]],
      ['rule-2', '2', 'Rule Number Two!', [
        'There are three types of Tanween.',
        'Tanween Fatḥ makes the sound "an," as in:',
        'كِتَابًا — Kitāban.',
        'Tanween Kasr makes the sound "in," as in:',
        'كِتَابٍ — Kitābin.',
        'Tanween Ḍamm makes the sound "un," as in:',
        'كِتَابٌ — Kitābun.'
      ]],
      ['rule-3', '3', 'Rule Number Three!', [
        'Read the two Harakah marks together because they make one sound. Listen:',
        'بٌ — Bun.',
        'بٍ — Bin.',
        'بً — Ban.',
        'Do not read the two marks separately.'
      ]],
      ['rule-4', '4', 'Rule Number Four!', [
        'Tanween is always read at the end of a word. For example:',
        'مُسْلِمٌ — Muslimun.',
        'رَحِيمٍ — Raḥīmin.',
        'عَلِيمًا — ʿAlīman.',
        'Read the Tanween after the last letter.'
      ]],
      ['rule-5', '5', 'Rule Number Five!', [
        'Tanween Fatḥ often has an extra Alif. For example:',
        'كِتَابًا — Kitāban.',
        'The Alif helps show the Tanween, but do not read the Alif separately.'
      ]],
      ['rule-6', '6', 'Rule Number Six!', [
        'Some words do not have the extra Alif. For example:',
        'رَحْمَةً — Raḥmatan.',
        'شَيْئًا — Shay\'an.',
        'Read the Tanween normally.'
      ]],
      ['rule-7', '7', 'Rule Number Seven!', [
        'Read Tanween clearly.',
        'Listen.',
        'بٌ — Bun.',
        'بٍ — Bin.',
        'بً — Ban.',
        'Make the "n" sound easy to hear.'
      ]],
      ['rule-8', '8', 'Rule Number Eight!', [
        'When stopping,',
        'the Tanween sound usually disappears. For example,',
        harakatSection('rule-8-damm', 'Tanween Ḍamm', [
          'كِتَابٌ is read as Kitābun',
          'when continuing,',
          'but Kitāb',
          'when stopping.'
        ]),
        harakatSection('rule-8-kasr', 'Tanween Kasr', [
          'كِتَابٍ is read as Kitābin',
          'when continuing,',
          'but Kitāb',
          'when stopping.'
        ]),
        harakatSection('rule-8-fath', 'Tanween Fatḥ', [
          'كِتَابًا is read as Kitāban',
          'when continuing,',
          'but Kitābā',
          'when stopping.'
        ])
      ]],
      ['rule-9', '9', 'Rule Number Nine!', [
        'Read Tanween smoothly and gently. Do not rush. Give every Tanween its proper sound and pronounce the "n" clearly.',
        harakatSection('rule-9-damm', 'Tanween Ḍamm', [
          'Ḍamm makes the sound "un."',
          'كِتَابٌ — Kitābun.',
          'عَلِيمٌ — ʿAlīmun.'
        ]),
        harakatSection('rule-9-kasr', 'Tanween Kasr', [
          'Kasr makes the sound "in."',
          'كِتَابٍ — Kitābin.',
          'عَلِيمٍ — ʿAlīmin.'
        ]),
        harakatSection('rule-9-fath', 'Tanween Fatḥ', [
          'Fatḥ makes the sound "an."',
          'كِتَابًا — Kitāban.',
          'عَلِيمًا — ʿAlīman.'
        ])
      ]]
    ];
    var practice = [
      'Tanween Fatḥ.',
      'كِتَابًا',
      'عَلِيمًا',
      'حَكِيمًا',
      'سَمِيعًا',
      'Tanween Kasr.',
      'كِتَابٍ',
      'عَلِيمٍ',
      'حَكِيمٍ',
      'سَمِيعٍ',
      'Tanween Ḍamm.',
      'كِتَابٌ',
      'عَلِيمٌ',
      'حَكِيمٌ',
      'سَمِيعٌ'
    ];
    var remember = [
      'Tanween adds a light "n" sound.',
      'There are three types.',
      'Read Tanween at the end of the word.',
      'Tanween Fatḥ often has an extra Alif.',
      'When stopping, the Tanween sound usually disappears.',
      'Read clearly, smoothly, and beautifully.',
      'Excellent work!',
      'See you in the next lesson.'
    ];

    return '<div class="pq-tan-rules__hero" data-rules-section="hero">' +
      '<div class="pq-tan-rules__badge">Tanween Rules</div>' +
      '<h2><span dir="rtl">التَّنْوِين</span></h2>' +
      '<p class="pq-tan-rules__lead">A clear lesson about the light <strong>n</strong> sound at the end of words.</p>' +
      '<div class="pq-tan-script">' + phraseList(hero) + '</div>' +
      '<button type="button" class="pq-tan-rules__audio-btn" id="pqTanRulesAudioBtn">Play Rules Audio</button>' +
      '</div>' +
      '<div class="pq-tan-rules__deck">' + rules.map(function (item) {
        return ruleSection(item[0], item[1], item[2], item[3]);
      }).join('') + '</div>' +
      '<div class="pq-tan-rules__practice" data-rules-section="practice">' +
      '<h3>Let\'s Practice!</h3>' +
      harakatSection('practice-damm', 'Tanween Ḍamm', [
        'كِتَابٌ',
        'عَلِيمٌ',
        'حَكِيمٌ',
        'سَمِيعٌ'
      ]) +
      harakatSection('practice-kasr', 'Tanween Kasr', [
        'كِتَابٍ',
        'عَلِيمٍ',
        'حَكِيمٍ',
        'سَمِيعٍ'
      ]) +
      harakatSection('practice-fath', 'Tanween Fatḥ', [
        'كِتَابًا',
        'عَلِيمًا',
        'حَكِيمًا',
        'سَمِيعًا'
      ]) +
      '</div>' +
      '<div class="pq-tan-rules__remember" data-rules-section="remember">' +
      '<h3>Let\'s remember.</h3>' +
      '<div class="pq-tan-script">' + phraseList(remember) + '</div>' +
      '</div>' +
      '<div class="pq-tan-rules__footer">' +
      '<button type="button" id="pqTanRulesCompleteBtn">Complete Rules</button>' +
      '</div>';
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
