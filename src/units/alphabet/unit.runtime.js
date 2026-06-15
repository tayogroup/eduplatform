(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : globalThis;
  var rulesAudio = null;
  var rulesAudioManualStart = false;
  var rulesPassAudioPlaying = false;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightArabic(value) {
    return escapeHtml(value)
      .replace(/([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g, '<span class="pq-alpha-rules__arabic" dir="rtl">$1</span>');
  }

  function line(text) {
    return '<p class="pq-alpha-rules__line" dir="auto">' + highlightArabic(text) + '</p>';
  }

  function lineList(items) {
    return '<div class="pq-alpha-rules__lines">' + items.map(line).join('') + '</div>';
  }

  function chips(items) {
    return '<div class="pq-alpha-rules__chips">' + items.map(function (item) {
      return '<span class="pq-alpha-rules__chip" dir="auto">' + highlightArabic(item) + '</span>';
    }).join('') + '</div>';
  }

  function card(key, number, title, lines, extra) {
    return [
      '<article class="pq-alpha-rule-card" data-rules-section="' + escapeHtml(key) + '">',
      '<div class="pq-alpha-rule-card__head">',
      '<div class="pq-alpha-rule-card__num">' + escapeHtml(number) + '</div>',
      '<h3>' + escapeHtml(title) + '</h3>',
      '</div>',
      lineList(lines),
      extra || '',
      '</article>'
    ].join('');
  }

  function rememberList(items) {
    return '<div class="pq-alpha-rules__remember-list">' + items.map(function (item) {
      return '<p class="pq-alpha-rules__remember-item">' + highlightArabic(item) + '</p>';
    }).join('') + '</div>';
  }

  function rulesAudioUrl() {
    var cfg = root.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/alphabet/';
    return String(base) + 'alphabet_rules_audio.mp3';
  }

  function setRulesTiming() {
    try {
      window.__pqRulesBlockOnlyHighlight = true;
      window.__pqRulesBlockHighlightLeadSeconds = 0;
      window.__pqRulesManualSectionCues = [
        { section: 'hero', start: 0.131 },
        { section: 'rule-1', start: 21.180 },
        { section: 'rule-2', start: 38.641 },
        { section: 'rule-3', start: 64.198 },
        { section: 'rule-4', start: 90.378 },
        { section: 'rule-5', start: 131.440 },
        { section: 'rule-6', start: 155.893 },
        { section: 'rule-7', start: 186.841 },
        { section: 'rule-8', start: 209.766 },
        { section: 'rule-9', start: 234.965 },
        { section: 'rule-10', start: 265.851 },
        { section: 'rule-11', start: 278.099 },
        { section: 'rule-12', start: 304.063 },
        { section: 'rule-13', start: 321.397 },
        { section: 'rule-14', start: 343.789 },
        { section: 'remember', start: 362.890 }
      ];
    } catch (_e) {}
  }

  function rulesPassProgress() {
    try {
      return (typeof managedProgress !== 'undefined' && managedProgress && managedProgress.rules)
        ? managedProgress.rules
        : null;
    } catch (_e) {
      return null;
    }
  }

  function ensureRulesPassesRequired() {
    var progress = rulesPassProgress();
    if (!progress) return null;

    var required = Math.max(
      2,
      Number(progress.passesRequired || progress.passes_required || 0) || 0
    );
    progress.passesRequired = required;
    progress.passes_required = required;

    var done = Math.max(
      0,
      Number(progress.passesDone || progress.passes_done || 0) || 0
    );
    progress.passesDone = Math.min(done, required);
    progress.passes_done = progress.passesDone;
    progress.completed = progress.passesDone >= required;

    return progress;
  }

  function rulesButtonLabel() {
    var progress = ensureRulesPassesRequired();
    if (!progress) return 'Rules';

    var done = Math.max(0, Number(progress.passesDone || 0) || 0);
    var required = Math.max(2, Number(progress.passesRequired || 2) || 2);
    if (done > 0 && done < required) {
      return 'Rules';
    }
    return 'Rules';
  }

  function setButtonPlainLabel(button, text) {
    if (!button) return;
    try {
      button.textContent = text;
    } catch (_e) {}
  }

  function scrollRulesToFirstBlock() {
    try {
      var panel = document.getElementById('pqAlphabetRulesPanel');
      var target = panel && (
        panel.querySelector('[data-rules-section="hero"]') ||
        panel.querySelector('.pq-alpha-rules__hero') ||
        panel
      );
      if (!target) return;

      var getHeaderOffset = function () {
        var selectors = [
          '#topBar',
          '.bar',
          '#pqHeaderActionRow',
          '#pqUnifiedBottomBar'
        ];
        var bottom = 0;
        selectors.forEach(function (selector) {
          try {
            var el = document.querySelector(selector);
            if (!el) return;
            var rect = el.getBoundingClientRect();
            if (!rect || rect.height <= 0) return;
            if (rect.top <= 4 && rect.bottom > bottom) {
              bottom = rect.bottom;
            }
          } catch (_e) {}
        });
        return Math.max(0, bottom) + 14;
      };

      var scrollNow = function (behavior) {
        try {
          var rect = target.getBoundingClientRect();
          var scrollEl = document.scrollingElement || document.documentElement || document.body;
          var currentTop = Number(window.pageYOffset || scrollEl.scrollTop || 0) || 0;
          var top = Math.max(0, currentTop + rect.top - getHeaderOffset());
          window.scrollTo({ top: top, behavior: behavior || 'smooth' });
        } catch (_e) {
          try { target.scrollIntoView({ behavior: behavior || 'smooth', block: 'start', inline: 'nearest' }); } catch (_ignored) {}
        }
      };

      scrollNow('smooth');
      window.setTimeout(function () { scrollNow('auto'); }, 180);
      window.setTimeout(function () { scrollNow('auto'); }, 420);
    } catch (_e) {}
  }

  async function completeRulesAudioPass() {
    try {
      ensureRulesPassesRequired();
      if (typeof markPlaylistStepCompleted === 'function') {
        await markPlaylistStepCompleted('rules');
      } else if (typeof __LessonRuntime !== 'undefined' && __LessonRuntime && typeof __LessonRuntime.completeStep === 'function') {
        var runtimeResult = await __LessonRuntime.completeStep('rules');
        if (typeof __pqApplyRuntimeCompletion === 'function') {
          __pqApplyRuntimeCompletion('rules', runtimeResult);
        }
        if (typeof __pqNormalizeCurrentStepId === 'function') __pqNormalizeCurrentStepId();
      }
      ensureRulesPassesRequired();
      try { if (typeof updateControlsForCurrentStep === 'function') updateControlsForCurrentStep(); } catch (_e) {}
      try { if (typeof __pqSyncDynamicStepAction === 'function') __pqSyncDynamicStepAction(); } catch (_e) {}
      try { if (typeof renderStepper === 'function') renderStepper(); } catch (_e) {}
    } catch (_e) {}
  }

  function playRulesAudio(button, options) {
    options = options || {};
    var countPass = options.countPass === true;
    if (rulesPassAudioPlaying) return;

    rulesAudioManualStart = true;
    if (countPass) {
      ensureRulesPassesRequired();
      rulesPassAudioPlaying = true;
      scrollRulesToFirstBlock();
    }

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
      setRulesTiming();
      if (typeof window.__pqStartRulesAudioHighlight === 'function') {
        window.__pqStartRulesAudioHighlight(rulesAudio);
      }
    } catch (_e) {}
    try { if (typeof updateControlsForCurrentStep === 'function') updateControlsForCurrentStep(); } catch (_e) {}
    try { if (typeof __pqSyncDynamicStepAction === 'function') __pqSyncDynamicStepAction(); } catch (_e) {}
    if (button) {
      button.disabled = true;
      setButtonPlainLabel(button, countPass ? 'Playing Rules' : 'Playing Rules Audio');
    }

    var restore = function (completedAudio) {
      try { window.__pqRulesAudioPlaying = false; } catch (_e) {}
      if (countPass) {
        rulesPassAudioPlaying = false;
        if (completedAudio) {
          completeRulesAudioPass();
        }
      }
      try { if (typeof updateControlsForCurrentStep === 'function') updateControlsForCurrentStep(); } catch (_e) {}
      try { if (typeof __pqSyncDynamicStepAction === 'function') __pqSyncDynamicStepAction(); } catch (_e) {}
      if (!button) return;
      button.disabled = false;
      setButtonPlainLabel(button, countPass ? rulesButtonLabel() : 'Rules');
    };

    rulesAudio.addEventListener('ended', function () { restore(true); }, { once: true });
    rulesAudio.addEventListener('error', function () { restore(false); }, { once: true });
    var maybe = rulesAudio.play();
    if (maybe && typeof maybe.catch === 'function') {
      maybe.catch(function () { restore(false); });
    }
  }

  function renderRulesHtml() {
    return [
      '<section class="pq-alpha-rules__hero" data-rules-section="hero">',
      '<div class="pq-alpha-rules__hero-copy">',
      '<p class="pq-alpha-rules__eyebrow">Alphabet Rules</p>',
      '<h1>Arabic Alphabet Rules</h1>',
      '<h2 dir="rtl">قَوَاعِدُ حُرُوفِ الْهِجَاءِ</h2>',
      lineList([
        'Today we are learning the Arabic alphabet rules.',
        'The Arabic alphabet has 29 letters.',
        'These letters are used to read the Quran and write Arabic words.',
        'Learning the alphabet is the first step to reading the Quran.'
      ]),
      '</div>',
      '<div class="pq-alpha-rules__hero-count"><strong>29</strong><span>Letters</span></div>',
      '</section>',

      '<section class="pq-alpha-rules__alphabet-strip" aria-label="Arabic alphabet letters">',
      chips(['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'لا', 'ي']),
      '</section>',

      '<section class="pq-alpha-rules__cards">',
      card('rule-1', '1', 'The Alphabet Has 29 Letters', [
        'The Arabic alphabet has 29 letters.',
        'Learn all the letters in order.',
        'Knowing the order helps you read, write, and recognize letters.'
      ], chips(['ا', 'ب', 'ت', 'ث', 'ج', '...', 'لا', 'ي'])),
      card('rule-2', '2', 'Learn Each Letter Name', [
        'Learn every letter by its name.',
        'For example, ا is Alif.',
        'ب is Ba.',
        'ت is Ta.',
        'ث is Tha.',
        'Every letter has a special name.'
      ]),
      card('rule-3', '3', 'Learn Each Letter Sound', [
        'Learn every letter by its sound.',
        'ب makes the sound B.',
        'ت makes the sound T.',
        'م makes the sound M.',
        'ن makes the sound N.',
        'Every letter has its own sound.'
      ]),
      card('rule-4', '4', 'Learn the Three Short Vowels', [
        'Learn the three short vowels.',
        'They are called Harakat.',
        'Fatha makes the sound a.',
        'Example: بَ, Ba.',
        'Kasra makes the sound i.',
        'Example: بِ, Bi.',
        'Dhamma makes the sound u.',
        'Example: بُ, Bu.',
        'Remember: Fatha, Kasra, and Dhamma.'
      ]),
      card('rule-5', '5', 'Read Each Letter with Vowels', [
        'Every letter can be read with all three vowels.',
        'Let us try.',
        'بَ, بَ.',
        'بِ, بِ.',
        'بُ, بُ.',
        'Practice every letter with all three vowels.'
      ]),
      card('rule-6', '6', 'Look Carefully at the Dots', [
        'Look carefully at the dots.',
        'Many letters have similar shapes.',
        'The dots help us tell them apart.',
        'ب has one dot below.',
        'ت has two dots above.',
        'ث has three dots above.',
        'Always check the dots carefully.'
      ]),
      card('rule-7', '7', 'Use the Correct Pronunciation Place', [
        'Every letter has a place of articulation.',
        'Some letters come from the lips.',
        'Some come from the throat.',
        'Some come from the tongue.',
        'Pronounce every letter from its correct place.'
      ]),
      card('rule-8', '8', 'Heavy Letters Stay Heavy', [
        'There are seven heavy letters.',
        'خ, ص, ض, غ, ط, ق, ظ.',
        'Read these letters with a strong and full sound.',
        'For example: صَ, Ṣa.'
      ], chips(['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ'])),
      card('rule-9', '9', 'Light Letters Stay Light', [
        'The other 22 letters are light letters.',
        'Read them gently and naturally.',
        'For example: بَ, Ba.'
      ]),
      card('rule-10', '10', 'Tell Similar Letters Apart', [
        'Some letters sound similar.',
        'Learn the difference between them.',
        'Listen carefully and practice often.'
      ], chips(['س / ص', 'ت / ط', 'ح / ه'])),
      card('rule-11', '11', 'Learn Each Letter Shape', [
        'Learn the shape of every letter.',
        'Each letter has its own shape.',
        'When you see a letter, try to recognize it quickly.'
      ], chips(['ا', 'ب', 'ج', 'د', 'ر'])),
      card('rule-12', '12', 'Listen and Repeat', [
        'Listen and repeat.',
        'Teacher says: بَ.',
        'You say: بَ.',
        'Careful listening helps correct pronunciation.'
      ]),
      card('rule-13', '13', 'Practice Reading with Vowels', [
        'Practice reading with vowels.',
        'Read بَ بِ بُ.',
        'Then read تَ تِ تُ.',
        'This helps build reading fluency.'
      ]),
      card('rule-14', '14', 'Read Calmly and Clearly', [
        'Read calmly and clearly.',
        'Take your time.',
        'Pronounce every letter correctly.',
        'Give every vowel its proper sound.',
        'Do not rush.'
      ]),
      '</section>',

      '<section class="pq-alpha-rules__remember" data-rules-section="remember">',
      '<h2>Let\'s remember.</h2>',
      rememberList([
        'The Arabic alphabet has 29 letters.',
        'Learn every letter\'s name.',
        'Learn every letter\'s sound.',
        'Learn the three vowels: Fatha, Kasra, and Dhamma.',
        'Watch the dots carefully.',
        'Heavy letters stay heavy.',
        'Light letters stay light.',
        'Pronounce every letter from its correct place.',
        'Listen carefully.',
        'Practice every day.',
        'Read clearly, confidently, and beautifully.',
        'Excellent work! See you in the next lesson!'
      ]),
      '</section>',

      '<div class="pq-alpha-rules__footer">',
      '<button type="button" id="pqAlphabetRulesCompleteBtn">Rules</button>',
      '</div>'
    ].join('');
  }

  function ensureRulesPanel() {
    var existing = document.getElementById('pqAlphabetRulesPanel');
    if (existing) return existing;

    var gridWrap = document.querySelector('.grid-wrap');
    if (!gridWrap || !gridWrap.parentNode) return null;

    var panel = document.createElement('section');
    panel.id = 'pqAlphabetRulesPanel';
    panel.className = 'pq-alpha-rules';
    panel.setAttribute('aria-label', 'Arabic Alphabet Rules');
    panel.hidden = true;
    panel.innerHTML = renderRulesHtml();

    gridWrap.parentNode.insertBefore(panel, gridWrap);
    var completeBtn = panel.querySelector('#pqAlphabetRulesCompleteBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', function () {
        playRulesAudio(completeBtn, { countPass: true });
      });
    }
    return panel;
  }

  function bindRulesStepAction() {
    var action = document.getElementById('pqStepActionBtn');
    if (!action || action.__pqAlphabetRulesAudioBound__) return;

    action.addEventListener('click', function (event) {
      if (String(action.dataset.stepId || '').toLowerCase() !== 'rules') return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }

      playRulesAudio(action, { countPass: true });
    }, true);

    action.__pqAlphabetRulesAudioBound__ = true;
  }

  function visibleText(node) {
    try {
      return String((node && (node.innerText || node.textContent)) || '').toLowerCase();
    } catch (_e) {
      return '';
    }
  }

  function stepIdFromDom() {
    try {
      var activeCard = document.querySelector(
        '#managedStepsList .managed-step.active,' +
        '#managedStepsList .managed-step.is-current,' +
        '.managed-step.active,' +
        '.managed-step.is-current'
      );
      var activeStep = activeCard && activeCard.getAttribute
        ? String(activeCard.getAttribute('data-stepid') || activeCard.getAttribute('data-step-id') || '').toLowerCase()
        : '';
      if (activeStep) return activeStep;
    } catch (_e) {}

    try {
      var action = document.getElementById('pqStepActionBtn');
      var actionStep = action && action.getAttribute
        ? String(action.getAttribute('data-stepid') || action.getAttribute('data-step-id') || action.dataset.stepId || '').toLowerCase()
        : '';
      if (actionStep) return actionStep;
      var actionText = visibleText(action);
      if (actionText.indexOf('rules') !== -1 || actionText.indexOf('القواعد') !== -1) return 'rules';
    } catch (_e) {}

    try {
      var mainAction = document.getElementById('btnPlayAll');
      var mainText = visibleText(mainAction);
      if (mainText.indexOf('rules') !== -1 || mainText.indexOf('القواعد') !== -1) return 'rules';
      if (mainText.indexOf('listen') !== -1 || mainText.indexOf('استمع') !== -1) return 'listen';
    } catch (_e) {}

    return '';
  }

  function currentStepId() {
    try {
      if (root.PQUnitRuntime && typeof root.PQUnitRuntime.getCurrentStepId === 'function') {
        var publicId = String(root.PQUnitRuntime.getCurrentStepId() || '').toLowerCase();
        if (publicId) return publicId;
      }
    } catch (_e) {}

    try {
      var exposedId = String(root.__PQ_CURRENT_STEP_ID__ || '').toLowerCase();
      if (exposedId) return exposedId;
    } catch (_e) {}

    try {
      if (typeof managedProgress !== 'undefined' && managedProgress && managedProgress.currentStepId) {
        return String(managedProgress.currentStepId || '').toLowerCase();
      }
    } catch (_e) {}

    try {
      if (typeof getCurrentStep === 'function') {
        var current = getCurrentStep();
        var step = current && current.step ? current.step : null;
        if (step && step.id) return String(step.id || '').toLowerCase();
      }
    } catch (_e) {}

    return stepIdFromDom();
  }

  function syncRulesPanel() {
    var panel = ensureRulesPanel();
    if (!panel) return;

    bindRulesStepAction();
    var action = document.getElementById('pqStepActionBtn');
    var actionStep = action ? String(action.dataset.stepId || '').toLowerCase() : '';
    var domStep = stepIdFromDom();
    var currentStep = currentStepId();
    var isRules = actionStep === 'rules' || currentStep === 'rules' || domStep === 'rules';
    panel.hidden = !isRules;
    document.body.classList.toggle('pq-alphabet-rules-active', isRules);
    if (isRules) {
      setRulesTiming();
      ensureRulesPassesRequired();
      var completeBtn = panel.querySelector('#pqAlphabetRulesCompleteBtn');
      if (rulesPassAudioPlaying) {
        if (action) {
          action.disabled = true;
          setButtonPlainLabel(action, 'Playing Rules');
        }
        if (completeBtn) {
          completeBtn.disabled = true;
          setButtonPlainLabel(completeBtn, 'Playing Rules');
        }
      } else if (completeBtn) {
        completeBtn.disabled = false;
        setButtonPlainLabel(completeBtn, rulesButtonLabel());
      }
    }
    if (isRules && !rulesAudioManualStart && window.__pqRulesAudio) {
      try { window.__pqRulesAudio.pause(); } catch (_e) {}
      try { window.__pqRulesAudio.currentTime = 0; } catch (_e) {}
      try { window.__pqRulesAudioPlaying = false; } catch (_e) {}
    }
    if (!isRules) {
      rulesAudioManualStart = false;
      rulesPassAudioPlaying = false;
    }
  }

  var started = root.PQUnitRuntime.start(root.UNIT_CFG);
  Promise.resolve(started).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 300);
  });
})();
