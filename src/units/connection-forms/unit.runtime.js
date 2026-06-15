(function () {
  'use strict';

  function ar(value) {
    return '<span class="pq-joint-rules__arabic" dir="rtl">' + value + '</span>';
  }

  function examples(items) {
    return '<div class="pq-joint-rules__examples">' + items.map(function (item) {
      return '<span dir="auto">' + item + '</span>';
    }).join('') + '</div>';
  }

  function chips(items) {
    return '<div class="pq-joint-rules__chips">' + items.map(function (item) {
      return '<span class="pq-joint-rules__chip" dir="rtl">' + item + '</span>';
    }).join('') + '</div>';
  }

  function card(number, title, body, extra) {
    return '<article class="pq-joint-rule-card">' +
      '<div class="pq-joint-rule-card__num">Rule ' + number + '</div>' +
      '<h3>' + title + '</h3>' +
      '<p>' + body + '</p>' +
      (extra || '') +
    '</article>';
  }

  var rulesAudio = null;
  var rulesAutoPlayed = false;

  function rulesAudioUrl() {
    var cfg = window.UNIT_CFG || {};
    var messages = cfg.messages || {};
    var base = messages.base || '/pre_quraan/messages/unit_steps/connection-forms/';
    return String(base) + 'joint_rules.mp3';
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

  function practiceGroup(title, words) {
    return '<section><h4>' + title + '</h4><div>' + words.map(function (word) {
      return '<span dir="rtl">' + word + '</span>';
    }).join('') + '</div></section>';
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
    var existing = document.getElementById('pqJointRulesPanel');
    if (existing) return existing;

    var gridWrap = document.querySelector('.grid-wrap');
    if (!gridWrap || !gridWrap.parentNode) return null;

    var panel = document.createElement('section');
    panel.id = 'pqJointRulesPanel';
    panel.className = 'pq-joint-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Joined Letters rules lesson');
    panel.innerHTML =
      '<section class="pq-joint-rules__hero">' +
        '<div>' +
          '<p class="pq-joint-rules__eyebrow">Joint Rules</p>' +
          '<h1 dir="rtl">قَوَاعِدُ الْحُرُوفِ الْمُتَّصِلَةِ</h1>' +
          '<p>Arabic letters usually join together to form words. Their shapes may change, but their sounds stay the same.</p>' +
          '<button type="button" class="pq-joint-rules__audio-btn" id="pqJointRulesAudioBtn">Play Rules Audio</button>' +
        '</div>' +
        '<div class="pq-joint-rules__join-demo" aria-label="Joined letter example">' +
          '<span dir="rtl">ب + ت</span><strong dir="rtl">بت</strong><small>Ba + Ta</small>' +
        '</div>' +
      '</section>' +
      '<section class="pq-joint-rules__summary">' +
        '<article><span dir="rtl">ب</span><b>Isolated</b><small>By itself</small></article>' +
        '<article><span dir="rtl">بـ</span><b>Beginning</b><small>Starts a join</small></article>' +
        '<article><span dir="rtl">ـبـ</span><b>Middle</b><small>Connects both sides</small></article>' +
        '<article><span dir="rtl">ـب</span><b>Final</b><small>Ends a join</small></article>' +
      '</section>' +
      '<section class="pq-joint-rules__cards">' +
        card(1, 'Arabic Letters Usually Join Together', 'Most Arabic letters connect to the letters before and after them.', examples([ar('بـ'), ar('ـبـ'), ar('ـب'), ar('بم') + ' Ba + Ma'])) +
        card(2, 'Letters Have Different Shapes', 'A letter may appear isolated, beginning, middle, or final. The shape changes, but it is still the same letter.', examples([ar('ب'), ar('بـ'), ar('ـبـ'), ar('ـب')])) +
        card(3, 'Learn the Sound of Each Letter', 'When letters join together, pronounce each letter clearly. Every letter keeps its own sound.', examples([ar('بت') + ' Ba-Ta', ar('من') + ' Ma-Na'])) +
        card(4, 'Read Joined Letters Right to Left', 'Arabic is read from right to left. Start with the rightmost letter and move left.', examples([ar('بت') + ' starts with ' + ar('ب') + ' then ' + ar('ت')])) +
        card(5, 'Use the Harakat Correctly', 'Joined letters are usually read with Harakat. Give every letter its vowel sound.', examples([ar('بَتَ') + ' Ba-Ta', ar('بِتِ') + ' Bi-Ti', ar('بُتُ') + ' Bu-Tu'])) +
        card(6, 'Some Letters Do Not Join Next', 'Six letters connect to the letter before them but do not connect to the letter after them.', chips(['ا', 'د', 'ذ', 'ر', 'ز', 'و'])) +
        card(7, 'Learn Two-Letter Joins', 'Start with simple joined letters and read them smoothly.', examples([ar('بت'), ar('بن'), ar('تم'), ar('لم'), ar('من')])) +
        card(8, 'Learn Three-Letter Joins', 'After two-letter joins, practice three-letter joins. Read each letter clearly.', examples([ar('بتم'), ar('لمن'), ar('كتب'), ar('دخل')])) +
        card(9, 'Learn Longer Joins', 'Practice four-letter and longer joined groups. Do not rush; read one letter at a time.', examples([ar('مسلم'), ar('كتبنا'), ar('مدرسة'), ar('قرأنا')])) +
        card(10, 'Watch the Dots Carefully', 'Many joined letters have similar shapes. Dots tell us which letter it is.', examples([ar('ب'), ar('ت'), ar('ث')])) +
        card(11, 'Heavy Letters Stay Heavy', 'When joined, heavy letters remain heavy. Read them with a full sound.', examples([ar('صَف'), ar('طَب'), ar('قَل')])) +
        card(12, 'Light Letters Stay Light', 'Light letters remain light when joined. Read them gently and clearly.', examples([ar('بت'), ar('لم'), ar('من')])) +
        card(13, 'Read Smoothly Without Breaking', 'Joined letters should flow smoothly. Do not pause between every letter unless practicing.', examples([ar('بتم') + ' Ba-Ta-Ma'])) +
        card(14, 'Practice Listening and Repeating', 'Listen carefully and repeat exactly what you hear.', examples(['Teacher: ' + ar('بتم'), 'Student: ' + ar('بتم')])) +
        card(15, 'Read Calmly and Clearly', 'Take your time, recognize the letters, read the Harakat correctly, and pronounce every sound clearly.') +
      '</section>' +
      '<section class="pq-joint-rules__non-connect">' +
        '<h2>The Six Non-Connecting Letters</h2>' +
        '<p>These letters connect to the letter before them, but do not connect to the letter after them.</p>' +
        chips(['ا', 'د', 'ذ', 'ر', 'ز', 'و']) +
      '</section>' +
      '<section class="pq-joint-rules__practice">' +
        '<h2>Practice Joined Letters</h2>' +
        practiceGroup('Two Letters', ['بت', 'بن', 'تم', 'لم', 'من']) +
        practiceGroup('Three Letters', ['بتم', 'كتب', 'دخل', 'لمن', 'سمع']) +
        practiceGroup('Four Letters', ['مسلم', 'كاتب', 'مدرس', 'مكتب']) +
        practiceGroup('Five Letters', ['مؤمن', 'مدرسة', 'مكتبة', 'مساجد']) +
      '</section>' +
      '<section class="pq-joint-rules__remember">' +
        '<h2>Remember</h2>' +
        chips(['Letters usually join', 'Shapes can change', 'Read right to left', 'Use Harakat', 'Watch the dots', 'Heavy stays heavy', 'Light stays light', 'ا د ذ ر ز و do not join next', 'Read beautifully']) +
      '</section>' +
      '<div class="pq-joint-rules__footer"><button type="button" id="pqJointRulesCompleteBtn">Complete Rules</button></div>';

    gridWrap.parentNode.insertBefore(panel, gridWrap);
    var completeBtn = panel.querySelector('#pqJointRulesCompleteBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', function () {
        var action = document.getElementById('pqStepActionBtn');
        if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') {
          action.click();
        }
      });
    }
    var audioBtn = panel.querySelector('#pqJointRulesAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        playRulesAudio(audioBtn);
      });
    }
    return panel;
  }

  function syncRulesPanel() {
    var panel = ensureRulesPanel();
    if (!panel) return;
    var action = document.getElementById('pqStepActionBtn');
    var isRules = !!(action && String(action.dataset.stepId || '').toLowerCase() === 'rules');
    panel.hidden = !isRules;
    document.body.classList.toggle('pq-joint-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqJointRulesAudioBtn');
  }

  var started = window.PQUnitRuntime.start(window.UNIT_CFG);
  Promise.resolve(started).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
