// pq_core_grid_helper_v1.0_LOCKED.js
// -----------------------------------------------------------------------------
// PreQuraan Shared Grid Helper v1.0
// Purpose: Keep Tanween / Madd / Movement grids consistent so they never drift.
// - Standardizes: index mapping, visual column placement, and PlayAll ordering.
// - Separates: visual layout from play order (configurable).
// -----------------------------------------------------------------------------

(function () {
  'use strict';

  var PQGridHelper = {};

  function createConfig(opts) {
    var o = opts || {};
    var cols = Math.max(1, Number(o.cols || 1));

    return {
      cols: cols,
      visualDirection: (o.visualDirection === 'ltr') ? 'ltr' : 'rtl',
      indexToVisual: (o.indexToVisual === 'mirror') ? 'mirror' : 'none',
      playOrder: o.playOrder || 'index_asc',
      startColumn: (o.startColumn === 'right') ? 'right' : 'left',
      customPlay: (typeof o.customPlay === 'function') ? o.customPlay : null
    };
  }

  function mirrorCol(col, cols) {
    return (cols + 1) - col;
  }

  function placeByIndex(index, cfg) {
    var cols = cfg.cols;
    var idx0 = Math.max(0, Number(index || 1) - 1);
    var row = Math.floor(idx0 / cols) + 1;
    var col0 = (idx0 % cols) + 1;
    var col = (cfg.indexToVisual === 'mirror') ? mirrorCol(col0, cols) : col0;
    return { row: row, col: col };
  }

  function indexFromRowCol(row, col, cfg) {
    var cols = cfg.cols;
    var r = Math.max(1, Number(row || 1));
    var c = Math.min(cols, Math.max(1, Number(col || 1)));
    var baseCol = (cfg.indexToVisual === 'mirror') ? mirrorCol(c, cols) : c;
    var idx0 = (r - 1) * cols + (baseCol - 1);
    return idx0 + 1;
  }

  function playIndices(totalCount, cfg) {
    var n = Math.max(0, Number(totalCount || 0));
    if (n <= 0) return [];

    if (cfg.playOrder === 'index_desc') {
      var desc = [];
      for (var i = n; i >= 1; i--) desc.push(i);
      return desc;
    }

    if (cfg.playOrder === 'grid_columns') {
      var cols = cfg.cols;
      var maxRow = Math.floor((n - 1) / cols) + 1;
      var colOrder = [];
      var c;

      if (cfg.startColumn === 'right') {
        for (c = cols; c >= 1; c--) colOrder.push(c);
      } else {
        for (c = 1; c <= cols; c++) colOrder.push(c);
      }

      var out = [];
      for (var r = 1; r <= maxRow; r++) {
        for (var j = 0; j < colOrder.length; j++) {
          var idx = indexFromRowCol(r, colOrder[j], cfg);
          if (idx >= 1 && idx <= n) out.push(idx);
        }
      }
      return out;
    }

    if (cfg.playOrder === 'custom' && cfg.customPlay) {
      var res = cfg.customPlay(n, cfg);
      return Array.isArray(res) ? res.slice() : [];
    }

    var asc = [];
    for (var k = 1; k <= n; k++) asc.push(k);
    return asc;
  }

  function applyGridContainerStyles(gridEl, cfg) {
    if (!gridEl) return;
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = 'repeat(' + cfg.cols + ', minmax(0, 1fr))';
    if (!gridEl.style.gap) gridEl.style.gap = '18px';
    gridEl.style.direction = cfg.visualDirection;
  }

  PQGridHelper.createConfig = createConfig;
  PQGridHelper.placeByIndex = placeByIndex;
  PQGridHelper.indexFromRowCol = indexFromRowCol;
  PQGridHelper.playIndices = playIndices;
  PQGridHelper.applyGridContainerStyles = applyGridContainerStyles;

  try { Object.defineProperty(PQGridHelper, '__locked__', { value: true, enumerable: false, configurable: false, writable: false }); } catch (_) {}
  try { if (Object.freeze) Object.freeze(PQGridHelper); } catch (_) {}

  window.PQGridHelper = PQGridHelper;
})();
