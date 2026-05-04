/* pq_ui_settings_sheet_v1.0_CLEAN.js
   Shared Settings Sheet (dialog) injector for PreQuraan units.

   Goal:
   - Remove duplicated <dialog id="sheet"> markup from every unit HTML.
   - Preserve backwards compatibility with existing unit JS that expects:
       #sheet, #settingsForm, #uiVoice, #uiSpeed, #uiRepeat, #uiFilter, #closeSheet
       and a gear button #btnGear.
*/

(function (window, document) {
  'use strict';

  const DEFAULT_MARKUP = `
  <dialog class="sheet" id="sheet">
    <form method="dialog" class="panel" id="settingsForm">
      <h2>⚙️ Settings (Grown-ups)</h2>

      <div class="row-col">
        <div class="row-line">
          <div class="lab">🎵 Voice</div>
          <select id="uiVoice" class="sel">
            <option value="child_boy" selected>Child — Boy</option>
            <option value="child_girl">Child — Girl</option>
            <option value="adult_male">Adult — Male</option>
            <option value="adult_female">Adult — Female</option>
          </select>
        </div>
        <div class="hint">Choose who speaks the letter.</div>
      </div>

      <div class="row-col">
        <div class="row-line">
          <div class="lab">🐢 Speed</div>
          <select id="uiSpeed" class="sel">
            <option value="1.0" selected>Normal</option>
            <option value="0.85">Slow</option>
            <option value="0.70">Very Slow</option>
          </select>
        </div>
        <div class="hint">Slower can help early learners.</div>
      </div>

      <div class="row-col">
        <div class="row-line">
          <div class="lab">🔁 Repeat</div>
          <select id="uiRepeat" class="sel">
            <option>1</option>
            <option>2</option>
            <option>3</option>
          </select>
        </div>
        <div class="hint">How many times each letter is repeated.</div>
      </div>

      <div class="row-col">
        <div class="row-line">
          <div class="lab">🎯 Filter</div>
          <select id="uiFilter" class="sel">
            <option value="all" selected>All letters</option>
            <option value="vowel">Vowels</option>
            <option value="alifaa">Joins with Alif</option>
            <option value="heavy">Heavy letters</option>
            <option value="light">Light letters</option>
          </select>
        </div>
        <div class="hint">Choose which type of letters to practice.</div>
      </div>

      <button class="close" id="closeSheet">Done</button>
    </form>
  </dialog>`;

  function ensureSheet() {
    let sheet = document.getElementById('sheet');
    if (sheet) return sheet;

    const wrap = document.createElement('div');
    wrap.innerHTML = DEFAULT_MARKUP.trim();
    const el = wrap.firstElementChild;
    document.body.appendChild(el);
    return el;
  }

  function wire() {
    const sheet = ensureSheet();
    const btnGear = document.getElementById('btnGear');
    const closeSheet = document.getElementById('closeSheet');

    if (btnGear && !btnGear.__pqSettingsBound) {
      btnGear.__pqSettingsBound = true;
      btnGear.addEventListener('click', function () {
        try { sheet.showModal(); } catch (_) {}
      });
    }

    if (closeSheet && !closeSheet.__pqSettingsBound) {
      closeSheet.__pqSettingsBound = true;
      closeSheet.addEventListener('click', function () {
        try { sheet.close(); } catch (_) {}
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire, { once: true });
  } else {
    wire();
  }

  window.PQSettingsSheet = {
    ensure: ensureSheet
  };
})(window, document);