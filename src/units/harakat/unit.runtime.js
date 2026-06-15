(function () {
  'use strict';

  function ar(value) {
    return '<span class="pq-har-rules__arabic" dir="rtl">' + value + '</span>';
  }

  function examples(items) {
    return '<div class="pq-har-rules__examples">' + items.map(function (item) {
      return '<span dir="auto">' + item + '</span>';
    }).join('') + '</div>';
  }

  function chips(items) {
    return '<div class="pq-har-rules__chips">' + items.map(function (item) {
      return '<span class="pq-har-rules__chip" dir="auto">' + item + '</span>';
    }).join('') + '</div>';
  }

  function card(number, title, body, extra) {
    return '<article class="pq-har-rule-card">' +
      '<div class="pq-har-rule-card__num">Rule ' + number + '</div>' +
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
    var base = messages.base || '/pre_quraan/messages/unit_steps/harakat/';
    return String(base) + 'harakat_rules.mp3';
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
    var existing = document.getElementById('pqHarakatRulesPanel');
    if (existing) return existing;

    var gridWrap = document.querySelector('.grid-wrap');
    if (!gridWrap || !gridWrap.parentNode) return null;

    var panel = document.createElement('section');
    panel.id = 'pqHarakatRulesPanel';
    panel.className = 'pq-har-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Diacritics and Harakat rules lesson');
    panel.innerHTML =
      '<section class="pq-har-rules__hero">' +
        '<div>' +
          '<p class="pq-har-rules__eyebrow">Harakat Rules</p>' +
          '<h1 dir="rtl">قَوَاعِدُ الْعَلَامَاتِ وَالْحَرَكَاتِ</h1>' +
          '<p>Diacritics are small signs above or below Arabic letters. They tell us how to pronounce, stop, stretch, double, and read each letter beautifully.</p>' +
          '<button type="button" class="pq-har-rules__audio-btn" id="pqHarakatRulesAudioBtn">Play Rules Audio</button>' +
        '</div>' +
        '<div class="pq-har-rules__vowel-wheel" aria-label="Common diacritics">' +
          '<span dir="rtl">َ</span><span dir="rtl">ِ</span><span dir="rtl">ُ</span><span dir="rtl">ْ</span>' +
          '<span dir="rtl">ّ</span><span dir="rtl">ً</span><span dir="rtl">ٍ</span><span dir="rtl">ٌ</span>' +
        '</div>' +
      '</section>' +
      '<section class="pq-har-rules__summary pq-har-rules__summary--wide">' +
        '<article><span dir="rtl">َ ِ ُ</span><b>Harakat</b><em>a i u</em><small>Short vowel sounds</small></article>' +
        '<article><span dir="rtl">ْ ّ</span><b>Sukun and Shaddah</b><em>stop</em><small>No vowel and double letter</small></article>' +
        '<article><span dir="rtl">ً ٍ ٌ</span><b>Tanween</b><em>n</em><small>an, in, un</small></article>' +
        '<article><span dir="rtl">ا و ي</span><b>Madd</b><em>stretch</em><small>aa, oo, ee</small></article>' +
      '</section>' +
      '<section class="pq-har-rules__cards">' +
        card(1, 'There Are Three Basic Harakat', 'Fathah, Kasrah, and Dammah are short vowel sounds.', examples([ar('بَ') + ' Ba', ar('بِ') + ' Bi', ar('بُ') + ' Bu'])) +
        card(2, 'Every Letter Can Take a Harakah', 'Most Arabic letters can be read with all three Harakat. Practice each letter with a, i, and u.', examples([ar('بَ') + ' Ba', ar('بِ') + ' Bi', ar('بُ') + ' Bu'])) +
        card(3, 'Sukun Means No Vowel Sound', 'Sukun is written above a letter. The voice stops on that letter.', examples([ar('بْ') + ' B', ar('تْ') + ' T'])) +
        card(4, 'Shaddah Means a Double Letter', 'Shaddah shows that a letter is read twice and sounds stronger than normal.', examples([ar('بَّ') + ' Bba', ar('مُّ') + ' Mmu'])) +
        card(5, 'Tanween Adds an N Sound', 'Tanween uses two vowel marks and adds a light n sound.', examples([ar('بً') + ' Ban', ar('بٍ') + ' Bin', ar('بٌ') + ' Bun'])) +
        card(6, 'Madd Letters Stretch the Sound', 'Alif, Waw, and Ya can stretch the sound for two counts.', examples([ar('بَا') + ' Baa', ar('بُو') + ' Boo', ar('بِي') + ' Bee'])) +
        card(7, 'Standing Vowels Are Also Madd', 'Standing Fathah, Standing Kasrah, and Standing Dammah are read like Madd and are stretched.', chips(['ٰ', 'ؖ', 'ٗ'])) +
        card(8, 'Madd Layn Creates a Soft Sound', 'Madd Layn happens when Fathah comes before Ya Sakinah or Waw Sakinah. Read it softly.', examples([ar('بَيْ') + ' Bay', ar('خَوْ') + ' Khaw'])) +
        card(9, 'Nun and Mim with Shaddah Have Ghunnah', 'When Nun or Mim has Shaddah, read with a gentle nasal sound.', examples([ar('إِنَّ') + ' Inna', ar('ثُمَّ') + ' Thumma'])) +
        card(10, 'Heavy Letters Stay Heavy', 'The heavy letters are read with a full sound.', chips(['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ'])) +
        card(11, 'Light Letters Stay Light', 'The remaining letters are light. Read them gently and clearly.', examples([ar('بَ'), ar('تِ'), ar('مُ')])) +
        card(12, 'Learn the Position of Every Diacritic', 'Some signs are above the letter and some are below. Position helps you recognize the sign quickly.', '<div class="pq-har-rules__position"><span><b>Above:</b> Fathah, Dammah, Sukun, Shaddah, Fathatayn, Dammatayn</span><span><b>Below:</b> Kasrah, Kasratayn</span></div>') +
        card(13, 'Read One Sign at a Time', 'Focus on the diacritic attached to the letter. Each sign changes the pronunciation.', examples([ar('بَ') + ' Ba', ar('بْ') + ' B', ar('بَّ') + ' Bba'])) +
        card(14, 'Listen and Repeat Carefully', 'Listen to the teacher and repeat exactly what you hear. Correct listening helps correct pronunciation.') +
        card(15, 'Read Calmly and Clearly', 'Every diacritic has a purpose. Do not rush. Give every sign its correct sound.') +
      '</section>' +
      '<section class="pq-har-rules__table">' +
        '<h2>Common Diacritics</h2>' +
        '<div><b>Sign</b><b>Name</b><b>Sound</b></div>' +
        '<div><span dir="rtl">َ</span><span>Fathah</span><span>a</span></div>' +
        '<div><span dir="rtl">ِ</span><span>Kasrah</span><span>i</span></div>' +
        '<div><span dir="rtl">ُ</span><span>Dammah</span><span>u</span></div>' +
        '<div><span dir="rtl">ْ</span><span>Sukun</span><span>No vowel</span></div>' +
        '<div><span dir="rtl">ّ</span><span>Shaddah</span><span>Double letter</span></div>' +
        '<div><span dir="rtl">ً</span><span>Fathatayn</span><span>an</span></div>' +
        '<div><span dir="rtl">ٍ</span><span>Kasratayn</span><span>in</span></div>' +
        '<div><span dir="rtl">ٌ</span><span>Dammatayn</span><span>un</span></div>' +
        '<div><span dir="rtl">ا</span><span>Alif Maddah</span><span>aa</span></div>' +
        '<div><span dir="rtl">و</span><span>Waw Maddah</span><span>oo</span></div>' +
        '<div><span dir="rtl">ي</span><span>Ya Maddah</span><span>ee</span></div>' +
      '</section>' +
      '<section class="pq-har-rules__practice">' +
        '<h2>Practice Examples</h2>' +
        practiceGroup('Harakat', ['بَ', 'بِ', 'بُ']) +
        practiceGroup('Sukun', ['أَبْ', 'إِبْ', 'أُبْ']) +
        practiceGroup('Shaddah', ['بَّ', 'بِّ', 'بُّ']) +
        practiceGroup('Tanween', ['بً', 'بٍ', 'بٌ']) +
        practiceGroup('Madd', ['بَا', 'بُو', 'بِي']) +
        practiceGroup('Madd Layn', ['بَيْ', 'بَوْ']) +
      '</section>' +
      '<section class="pq-har-rules__remember">' +
        '<h2>Remember</h2>' +
        chips(['Harakat are vowel signs', 'Diacritics guide reading', 'Fathah, Kasrah, Dammah', 'Sukun, Shaddah, Tanween, Madd', 'Heavy stays heavy', 'Light stays light', 'Listen and repeat', 'Read beautifully']) +
      '</section>' +
      '<div class="pq-har-rules__footer"><button type="button" id="pqHarakatRulesCompleteBtn">Complete Rules</button></div>';

    gridWrap.parentNode.insertBefore(panel, gridWrap);
    var completeBtn = panel.querySelector('#pqHarakatRulesCompleteBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', function () {
        var action = document.getElementById('pqStepActionBtn');
        if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') {
          action.click();
        }
      });
    }
    var audioBtn = panel.querySelector('#pqHarakatRulesAudioBtn');
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
    document.body.classList.toggle('pq-harakat-rules-active', isRules);
    handleRulesAudioAutoPlay(panel, isRules, '#pqHarakatRulesAudioBtn');
  }

  var started = window.PQUnitRuntime.start(window.UNIT_CFG);
  Promise.resolve(started).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
