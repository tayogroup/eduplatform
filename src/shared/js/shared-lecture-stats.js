/* pq_ui_lecture_stats_v1.0.1_LOCKED.js
   Shared "Source: DB" + "Letters played" UI helper (idempotent + safe).
   Exposes: window.PQLectureStats = { ensure(anchorEl, playBtnEl), setSource(text), setLetters(text) }
*/
(function(){
  'use strict';

  var NS = 'PQLectureStats';
  var V  = '1.0.1-locked';

  try {
    if (window[NS] && window[NS].__version && window[NS].__version >= V) return;
  } catch (_) {}

  var _sourceEl = null;
  var _lettersEl = null;

  function ensure(anchorEl, playBtnEl) {
    var anchor = anchorEl || document.body;

    _sourceEl = document.getElementById('pqDataSource') || _sourceEl;
    if (!_sourceEl) {
      _sourceEl = document.createElement('div');
      _sourceEl.id = 'pqDataSource';
      _sourceEl.className = 'lecture-letter-stats';
      _sourceEl.style.marginTop = '6px';
      _sourceEl.style.opacity = '0.85';
    }

    _lettersEl = document.getElementById('listenLetterStats') || _lettersEl;
    if (!_lettersEl) {
      _lettersEl = document.createElement('div');
      _lettersEl.id = 'listenLetterStats';
      _lettersEl.className = 'lecture-letter-stats';
    }

    try {
      if (playBtnEl && playBtnEl.parentNode) {
        if (!_sourceEl.parentNode) playBtnEl.parentNode.insertBefore(_sourceEl, playBtnEl.nextSibling);
        if (!_lettersEl.parentNode) _sourceEl.insertAdjacentElement('afterend', _lettersEl);
      } else {
        if (!_sourceEl.parentNode) anchor.insertAdjacentElement('afterbegin', _sourceEl);
        if (!_lettersEl.parentNode) _sourceEl.insertAdjacentElement('afterend', _lettersEl);
      }
    } catch (_) {}

    return { sourceEl: _sourceEl, lettersEl: _lettersEl };
  }

  function setSource(text) {
    try {
      if (!_sourceEl) _sourceEl = document.getElementById('pqDataSource');
      if (_sourceEl) _sourceEl.textContent = text || '';
    } catch (_) {}
  }

  function setLetters(text) {
    try {
      if (!_lettersEl) _lettersEl = document.getElementById('listenLetterStats');
      if (_lettersEl) _lettersEl.textContent = text || '';
    } catch (_) {}
  }

  var api = window[NS] || {};
  if (typeof api.ensure !== 'function') api.ensure = ensure;
  if (typeof api.setSource !== 'function') api.setSource = setSource;
  if (typeof api.setLetters !== 'function') api.setLetters = setLetters;

  api.__version = V;

  try { Object.defineProperty(api, '__locked__', { value: true, enumerable: false, configurable: false, writable: false }); } catch (_) {}
  try { if (Object.freeze) Object.freeze(api); } catch (_) {}

  window[NS] = api;
})();
