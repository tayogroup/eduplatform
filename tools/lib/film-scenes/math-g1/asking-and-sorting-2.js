  /* ==== Asking and Sorting, part 2 ==========================================
     tools/lib/film-scenes/math-g1/asking-and-sorting-2.js: the chapters
     "A list, then a table" and "A block graph". See asking-and-sorting.js. */

  /* ---- the list ---------------------------------------------------------
     Twelve lines, one child each, in the lesson's own order. The line is the
     child's name and the fruit they said, which is exactly what the lesson's
     listHtml draws. */
  var ASO_LIST = { x: 28, y: 44, w: 448, h: 372, top: 108, pitch: 26 };
  function asoListY(k) { return ASO_LIST.top + k * ASO_LIST.pitch; }
  /* which lines said pineapple: 5 of the 12 */
  var ASO_PINE = ASO_CLASS.map(function (k, i) { return k.f === 0 ? i : -1; })
    .filter(function (i) { return i >= 0; });

  function asoList(t, o) {
    var out = "", k;
    out += asoCard(ASO_LIST.x, ASO_LIST.y, ASO_LIST.w, ASO_LIST.h, 1);
    out += Tx(ASO_LIST.x + ASO_LIST.w / 2, ASO_LIST.y + 32, "the list", "lab mid muted caps", "middle");
    for (k = 0; k < 12; k++) {
      var y = asoListY(k), lo = o.line == null ? 1 : on(t, o.line + k * 0.085, 0.3);
      if (lo <= 0) continue;
      var hot = o.hot != null && o.hot > 0 && ASO_PINE.indexOf(k) >= 0 && ASO_PINE.indexOf(k) < o.hot;
      if (hot) out += R(ASO_LIST.x + 12, y - 19, ASO_LIST.w - 24, 25, 8, "rgba(244,201,93,0.2)", P.gold, 2);
      out += Tx(ASO_LIST.x + 66, y, ASO_CLASS[k].n, "lab mid", "start", { opacity: lo, fill: hot ? P.gold : P.ink });
      out += Em(ASO_LIST.x + 218, y - 6, 24, ASO_FRUIT[ASO_CLASS[k].f].em, { opacity: lo });
      out += Tx(ASO_LIST.x + 240, y, ASO_FRUIT[ASO_CLASS[k].f].name, "lab mid muted", "start", { opacity: lo });
      /* the line numbers, for "twelve lines long" */
      if (o.number != null) out += Tx(ASO_LIST.x + 44, y, String(k + 1), "lab small muted", "end",
        { opacity: on(t, o.number + k * 0.055, 0.25) });
    }
    return out;
  }

  /* ---- the table --------------------------------------------------------
       Fruit | How many, one row per answer and an altogether row. ART has no
       two-column frequency table, so this is drawn here. */
  var ASO_TBL = { x: 556, y: 62, w: 588, hd: 50, rh: 50 };
  function asoTableRowY(r) { return ASO_TBL.y + 46 + ASO_TBL.hd + r * ASO_TBL.rh; }
  function asoTable(t, o) {
    var out = "", r, T = ASO_TBL, hy = T.y + 46;
    var h = 46 + T.hd + 5 * T.rh + 18;
    out += asoCard(T.x, T.y, T.w, h, 1);
    out += Tx(T.x + T.w / 2, T.y + 32, "the table", "lab mid muted caps", "middle");
    out += R(T.x + 16, hy, T.w - 32, T.hd, 10, P.cell, P.line, 2);
    out += Tx(T.x + 52, hy + T.hd / 2 + 8, "Fruit", "lab mid", "start");
    out += Tx(T.x + T.w - 52, hy + T.hd / 2 + 8, "How many", "lab mid", "end");
    for (r = 0; r < 5; r++) {
      var y = asoTableRowY(r), last = r === 4;
      out += L(T.x + 16, y, T.x + T.w - 16, y, P.line, 1.5);
      if (last) out += L(T.x + 16, y, T.x + T.w - 16, y, P.muted, 3);
      var lab = last ? "altogether" : ASO_FRUIT[r].name;
      var val = last ? 12 : ASO_N[r];
      var po = o.at == null ? 0 : popIn(t, o.at[r], 0.34);
      out += Tx(T.x + 52, y + 34, lab, last ? "lab big" : "lab", "start", { fill: last ? P.ink : P.muted });
      if (!last) out += Em(T.x + T.w - 190, y + 26, 30, ASO_FRUIT[r].em);
      out += MK.pop(Tx(T.x + T.w - 70, y + 36, String(val), "lab big", "end", { fill: last ? P.gold : P.teal }),
        T.x + T.w - 88, y + 26, po);
      if (po <= 0) out += MK.qmark(T.x + T.w - 88, y + 26, 15, 0.7);
    }
    return out;
  }

  /* ---- chapter: a list, then a table ------------------------------------ */
  function asoTableChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cList = c(0, "list"), cUnder = c(0, "under");
    var cLines = c(1, "lines");
    var cCount = c(2, "count"), cEvery = c(2, "every");
    var cTable = c(3, "table"), cOnce = c(3, "once");
    var cP = c(4, "p"), cB = c(4, "b"), cO = c(4, "o"), cA = c(4, "a"), cAll = c(4, "all");
    var out = "", k;

    var counted = cCount == null ? 0 : tally(t, cCount, 5, 1.6);
    out += asoList(t, {
      line: cUnder == null ? cList : cUnder,
      number: cLines,
      hot: counted * asoOnly(t, scene, 2) > 0 ? counted : 0
    });

    /* "twelve lines long" */
    var lo = on(t, cLines, 0.5) * asoOnly(t, scene, 1);
    if (lo > 0) {
      out += MK.leader(512, 250, 486, 250, on(t, cLines, 0.6), P.gold);
      out += MK.pill(520, 250, "12 lines", lo, { size: 28, anchor: "start", col: P.gold });
    }

    /* "count the pineapples": a finger down the five pineapple lines */
    var co = asoOnly(t, scene, 2);
    if (co > 0 && counted > 0) {
      var fy = asoListY(ASO_PINE[Math.min(counted, 5) - 1]);
      out += MK.finger(ASO_LIST.x + ASO_LIST.w - 26, fy - 8, co);
      out += MK.pill(660, 180, "pineapple: " + counted, co, { size: 30, col: P.gold });
    }
    /* "every single line": the whole list flashes */
    var ev = bump(t, cEvery, 1.2);
    if (ev > 0) out += R(ASO_LIST.x + 8, ASO_LIST.y + 44, ASO_LIST.w - 16, ASO_LIST.h - 56, 14, "none", P.gold, 4, { opacity: ev });

    /* the table */
    var to = on(t, cTable, 0.5);
    if (to > 0) {
      out += G(asoTable(t, { at: [cP, cB, cO, cA, cAll] }), { opacity: to, transform: tr(-(1 - to) * 56, 0) });
      /* "only once": the five pineapple lines join into one table row */
      var on1 = on(t, cOnce, 0.8);
      if (on1 > 0 && to >= 1) {
        for (k = 0; k < 5; k++)
          out += MK.leader(ASO_LIST.x + ASO_LIST.w - 16, asoListY(ASO_PINE[k]) - 8,
            ASO_TBL.x + 30, asoTableRowY(0) + 26, clamp(on1 * 1.2 - k * 0.04, 0, 1), P.gold);
      }
    }
    return svg(out);
  }

  /* ---- chapter: a block graph -------------------------------------------
     The lesson's own towers: one block for one child. The scale is fixed at
     six, so a tower never changes height for any reason but a block. */
  var ASO_GR = { x: 352, base: 352, bw: 74, bh: 46, pitch: 112, max: 6 };
  function asoFruitGraph(vals, lit) {
    return asoGraph({ x: ASO_GR.x, base: ASO_GR.base, bw: ASO_GR.bw, bh: ASO_GR.bh,
      pitch: ASO_GR.pitch, max: ASO_GR.max, cats: ASO_FRUIT, vals: vals, lit: lit });
  }
  function asoGraphChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cGraph = c(0, "graph"), cTowers = c(0, "towers");
    var cBlock = c(1, "block"), cChild = c(1, "child");
    var cFive = c(2, "five"), cBlocks = c(2, "blocks");
    var cB = c(3, "b"), cO = c(3, "o"), cA = c(3, "a");
    var cTall = c(4, "tall"), cMost = c(4, "most");
    var cShort = c(5, "short"), cOne = c(5, "one");
    var out = "", k;

    /* each tower fills as its own number is said */
    var startAt = [cFive, cB, cO, cA];
    var vals = ASO_N.map(function (n, k2) { return asoFill(t, startAt[k2], 0.24 * n + 0.3, n); });
    var lit = cShort != null && t >= cShort ? 3 : cTall != null && t >= cTall ? 0 : -1;

    /* "A block graph": the axis, its scale and the four fruit only arrive
       once the words name them, rather than sitting there already drawn
       while the chapter's own title is still being said */
    var axisO = on(t, cGraph, 0.5);

    /* where the towers will go, before any block is in them */
    var ghost = axisO * on(t, cTowers, 0.6) * (1 - on(t, cFive, 0.5));
    for (k = 0; k < 4 && ghost > 0; k++) {
      var gx = ASO_GR.x + ASO_GR.pitch * (k + 0.5);
      out += R(gx - ASO_GR.bw / 2, ASO_GR.base - 3 * ASO_GR.bh, ASO_GR.bw, 3 * ASO_GR.bh, 8, "none", P.line, 3,
        { opacity: ghost * 0.9, "stroke-dasharray": "10 8" });
    }
    out += G(asoFruitGraph(vals, lit), { opacity: axisO });

    /* "one block means one child" */
    var ko = on(t, cBlock, 0.45) * (1 - on(t, cTall, 0.5));
    if (ko > 0) {
      out += asoCard(30, 130, 280, 168, ko);
      out += G(asoBlock(62, 170, 74, 46, ASO_FRUIT[0].col), { opacity: ko });
      out += Tx(163, 204, "=", "lab huge", "middle", { opacity: ko, fill: P.muted });
      out += MK.pop(Em(242, 192, 56, ASO_CLASS[0].face), 242, 192, popIn(t, cChild, 0.4));
      out += Tx(170, 270, "one block, one child", "lab mid muted", "middle", { opacity: ko });
    }

    /* "five blocks": the count beside the tower as it grows */
    var fo = on(t, cBlocks, 0.4) * asoOnly(t, scene, 2);
    if (fo > 0) out += MK.pill(880, 150, Math.floor(vals[0] + 1e-9) + " blocks", fo, { size: 30, anchor: "start", col: P.gold });

    /* the tallest, and the shortest */
    var tal = on(t, cTall, 0.5) * (1 - on(t, cShort, 0.5));
    if (tal > 0) {
      out += MK.leader(872, 130, asoTowerX(ASO_GR, 0) + 46, asoTowerTop({ base: ASO_GR.base, bh: ASO_GR.bh, vals: ASO_N }, 0) + 8, on(t, cTall, 0.7), P.gold);
      out += MK.pill(880, 130, "tallest", tal, { size: 30, anchor: "start", col: P.gold });
      out += MK.pill(880, 190, "most children", on(t, cMost, 0.45) * tal, { size: 28, anchor: "start", col: P.gold });
      out += L(ASO_GR.x, ASO_GR.base - 5 * ASO_GR.bh, ASO_GR.x + 4 * ASO_GR.pitch, ASO_GR.base - 5 * ASO_GR.bh, P.gold, 3,
        { opacity: tal * 0.9, "stroke-dasharray": "12 9" });
    }
    var sho = on(t, cShort, 0.5);
    if (sho > 0) {
      out += MK.leader(872, 300, asoTowerX(ASO_GR, 3) + 46, ASO_GR.base - ASO_GR.bh + 12, on(t, cShort, 0.7), P.gold);
      out += MK.pill(880, 300, "shortest", sho, { size: 30, anchor: "start", col: P.gold });
      out += MK.pill(880, 358, "only one child", on(t, cOne, 0.45) * sho, { size: 28, anchor: "start", col: P.gold });
    }
    return svg(out);
  }
