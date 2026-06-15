(function () {
  'use strict';

  function ensureRulesPanel() {
    var existing = document.getElementById('pqTashdeedSukoonRulesPanel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'pqTashdeedSukoonRulesPanel';
    panel.className = 'pq-tsuk-rules';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Tashdeed with Sukoon rules lesson');
    panel.innerHTML =
      '<div class="pq-tsuk-rules__hero">' +
        '<div class="pq-tsuk-rules__badge">Tashdeed with Sukoon Rules</div>' +
        '<h2><span dir="rtl">التَّشْدِيدُ مَعَ السُّكُون</span></h2>' +
        '<p>Tashdeed means a letter is read twice. With Sukoon, read the doubled letter clearly, then stop the sound on the Sukoon letter.</p>' +
        '<div class="pq-tsuk-rules__examples"><span dir="rtl">اَلْحَقُّ</span><span dir="rtl">الضَّالِّينَ</span><span dir="rtl">اَلْفَجْرِ</span></div>' +
      '</div>' +
      '<div class="pq-tsuk-rules__deck">' +
        card('1', 'Read the Tashdeed First', 'Always give the Tashdeed letter its full doubled sound.', ex(['حَقّ = Haqq'])) +
        card('2', 'Then Move to the Sukoon Letter', 'After the doubled letter, move directly to the Sukoon letter.', ex(['الضَّالِّينَ = Ad-Dallin'])) +
        card('3', 'Press the Tashdeed Slightly', 'Hold the doubled letter briefly so its strength is heard.', ex(['رَبّ = Rabb'])) +
        card('4', 'Do Not Add a Vowel to Sukoon', 'A Sukoon letter has no vowel sound. The sound stops there.', '<div class="pq-tsuk-stop"><span>Read: Haqq</span><span>Not: Haqqa</span></div>') +
        card('5', 'Read Both Parts Clearly', 'The doubled letter and the Sukoon must both be heard correctly.', ex(['مَدّْ = Madd'])) +
        card('6', 'Nun with Shaddah Uses Ghunnah', 'When نّ appears, read the nasal sound clearly.', ex(['إِنَّ = Inna'])) +
        card('7', 'Mim with Shaddah Uses Ghunnah', 'When مّ appears, allow the nasal sound to be heard.', ex(['ثُمَّ = Thumma'])) +
        card('8', 'Heavy Letters Stay Heavy', 'If the Tashdeed letter is heavy, keep it heavy.', ex(['حَقّ', 'الصَّفّ'])) +
        card('9', 'Light Letters Stay Light', 'If the Tashdeed letter is light, keep it light.', ex(['رَبّ', 'النَّاس'])) +
        card('10', 'Read Smoothly and Clearly', 'Give Tashdeed its strength, observe Ghunnah, and stop properly on Sukoon.', '<ul><li>Strong doubled sound</li><li>No extra vowel</li><li>Calm reading</li></ul>') +
      '</div>' +
      '<div class="pq-tsuk-rules__practice"><h3>Practice Tashdeed with Sukoon</h3>' +
        group('Doubled Letters', ['بّْ','تّْ','ثّْ','نّْ','مّْ']) +
        group('Heavy Letters', ['قّْ','صّْ','طّْ','ضّْ']) +
        group('Light Letters', ['بّْ','لّْ','رّْ','فّْ']) +
      '</div>' +
      '<div class="pq-tsuk-rules__practice"><h3>Practice Words</h3>' +
        group('Light Letters', ['رَبّ','حَبّ','جَدّ','وَدّ']) +
        group('Heavy Letters', ['حَقّ','الصَّفّ','الضَّرّ']) +
        group('Ghunnah Practice', ['إِنَّ','أَنَّ','ثُمَّ','عَمَّ']) +
      '</div>' +
      '<div class="pq-tsuk-rules__remember"><h3>Remember</h3>' +
        '<span>Tashdeed means the letter is read twice.</span><span>Give the doubled letter full strength.</span><span>Move smoothly to the Sukoon letter.</span><span>Do not add a vowel to Sukoon.</span><span>نّ and مّ use Ghunnah.</span><span>Heavy letters stay heavy.</span><span>Light letters stay light.</span><span>Read clearly and beautifully.</span>' +
      '</div>' +
      '<div class="pq-tsuk-rules__footer"><button type="button" id="pqTashdeedSukoonRulesCompleteBtn">Complete Rules</button></div>';

    var gridWrap = document.querySelector('.grid-wrap');
    if (gridWrap && gridWrap.parentNode) gridWrap.parentNode.insertBefore(panel, gridWrap);
    else document.body.appendChild(panel);

    var completeBtn = panel.querySelector('#pqTashdeedSukoonRulesCompleteBtn');
    if (completeBtn) completeBtn.addEventListener('click', function () {
      var action = document.getElementById('pqStepActionBtn');
      if (action && String(action.dataset.stepId || '').toLowerCase() === 'rules') action.click();
    });
    return panel;
  }

  function card(n, title, body, extra) {
    return '<article class="pq-tsuk-rule-card"><div class="pq-tsuk-rule-card__num">' + n + '</div><div><h3>' + title + '</h3><p>' + body + '</p><div class="pq-tsuk-rule-card__extra">' + extra + '</div></div></article>';
  }
  function ex(items) {
    return '<div class="pq-tsuk-example-row">' + items.map(function (item) { return '<span dir="auto">' + item + '</span>'; }).join('') + '</div>';
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
    document.body.classList.toggle('pq-tashdeed-sukoon-rules-active', isRules);
  }

  var startResult = window.PQUnitRuntime.start(window.UNIT_CFG);
  window.setTimeout(bindLectureUrl, 0);
  Promise.resolve(startResult).catch(function () {}).then(function () {
    ensureRulesPanel();
    syncRulesPanel();
    setInterval(syncRulesPanel, 350);
  });
})();
