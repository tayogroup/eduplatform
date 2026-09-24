  /* ==== Patterns and Square Numbers, part 3 ==================================
     The two square-number chapters and the recap.

     Everything here is ART.array: rows and columns of dots with the count of
     each written beside them, which is the lesson's own picture of a square
     number. The L between one square and the next is the same drawing with
     markRow and markCol set to the last row and the last column - that marks
     7 + 7 - 1 = 13 dots and leaves exactly the 36 of the 6 by 6 square, so the
     picture IS the arithmetic the voice is saying. */

  /* ---- chapter: numbers that make squares --------------------------------- */
  var PSQ_Q = psqBox(407.6, 28, 1.4);          /* the single 4 by 4 card */
  function psqQX(v) { return psqX(PSQ_Q, v); }
  function psqQY(v) { return psqY(PSQ_Q, v); }

  /* the four square numbers, bottom-aligned on one line */
  var PSQ_GROW = (function () {
    var out = [], x = 147.8, k, s = 0.95;
    for (k = 1; k <= 4; k++) {
      var w = psqArrW(k) * s, h = psqArrH(k, true) * s;
      out.push({ n: k, x: x, y: 400 - h, w: w, h: h, s: s, cx: x + w / 2 });
      x += w + 40;
    }
    return out;
  })();

  function psqSquaresChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSquare = c(0, "square"), cPerfect = c(0, "perfect");
    var cRows = c(1, "rows"), cCount = c(1, "count"), cSixteen = c(1, "sixteen");
    var cIs = c(2, "is"), cWrite = c(2, "write");
    var cItself = c(3, "itself"), cFour = c(3, "four"), cEight = c(3, "eight");
    var cFirst = c(4, "first"), cList = c(4, "list"), cGrow = c(4, "grow");
    var out = "", k, d;
    var two = on(t, cItself, 0.55);                   /* one card -> two cards */
    var four = on(t, cFirst, 0.55);                   /* two cards -> the four squares */

    /* ---- beats 0 to 2: one 4 by 4 card ---- */
    if (two < 1) {
      var g = "", lab = on(t, cRows, 0.3) > 0.5 ? "4 rows of 4 = 16" : "a square of dots";
      g += G(psqPlace(ART.array(4, 4, { colour: "gold", label: lab }), psqArrW(4), psqArrH(4, true), PSQ_Q.x, PSQ_Q.y, PSQ_Q.s),
        { opacity: clamp(popIn(t, cSquare, 0.5), 0, 1) });
      /* "a perfect square of dots": the square drawn round the block */
      var pf = on(t, cPerfect, 0.7);
      g += R(psqQX(64), psqQY(58), 168 * PSQ_Q.s, 168 * PSQ_Q.s, 10, "none", P.gold, 6,
        { opacity: pf, "stroke-dasharray": "940", "stroke-dashoffset": n2(940 * (1 - pf)) });
      /* "4 rows of 4 dots": the two counts the drawing already carries */
      var rw = on(t, cRows, 0.45);
      g += psqRing(psqQX(34), psqQY(154), 26, rw, P.accent, 4);
      g += psqRing(psqQX(160), psqQY(28), 26, on(t, cRows == null ? null : cRows + 0.3, 0.45), P.accent, 4);
      /* "Count them": a ring over each dot in turn, sixteen of them */
      var seen = tally(t, cCount, 16, 1.5);
      for (k = 0; k < seen; k++) {
        d = psqArrDot(Math.floor(k / 4), k % 4);
        g += psqRing(psqQX(d[0]), psqQY(d[1]), 24, clamp(seen - k, 0, 1), P.teal, 4);
      }
      if (seen > 0) g += Tx(880, 150, String(Math.min(16, Math.ceil(seen))), "lab huge", "middle",
        { fill: P.teal, opacity: n2(1 - on(t, cSixteen, 0.3)) });
      /* "16 altogether", "16 is a square number", "4 squared" */
      g += psqBig(t, 880, 150, "16", cSixteen, P.gold);
      g += MK.tick(880, 236, 26, popIn(t, cIs, 0.4));
      g += psqBig(t, 236, 224, "4² = 16", cWrite, P.gold);
      out += G(g, { opacity: 1 - two });
    }

    /* ---- beat 3: a number times itself, and a number times two ---- */
    if (two > 0 && four < 1) {
      var h = "", ax = 300.6, bx = 660.4, sc2 = 1.15;
      h += psqPlace(ART.array(4, 4, { colour: "gold", label: "4 × 4 = 16" }), psqArrW(4), psqArrH(4, true), ax, 60, sc2);
      h += psqPlace(ART.array(4, 2, { colour: "muted", label: "4 × 2 = 8" }), psqArrW(2), psqArrH(4, true), bx, 60, sc2);
      h += MK.tick(ax + psqArrW(4) * sc2 / 2, 410, 26, popIn(t, cFour, 0.4));
      h += MK.cross(bx + psqArrW(2) * sc2 / 2, 410, 26, popIn(t, cEight, 0.4));
      h += MK.pill(140, 200, "a number", on(t, cItself, 0.4), { size: 26, col: P.gold });
      h += MK.pill(140, 258, "times itself", on(t, cItself == null ? null : cItself + 0.3, 0.4), { size: 26, col: P.gold });
      out += G(h, { opacity: two * (1 - four) });
    }

    /* ---- beat 4: the first four square numbers, growing ---- */
    if (four > 0) {
      var m = "", arrive = tally(t, cFirst, 4, 0.8), lit = tally(t, cList, 4, 1.3), gr = on(t, cGrow, 0.6);
      for (k = 0; k < PSQ_GROW.length; k++) {
        var B = PSQ_GROW[k];
        if (k >= arrive) continue;
        m += G(psqPlace(ART.array(B.n, B.n, { colour: "gold" }), psqArrW(B.n), psqArrH(B.n, true), B.x, B.y, B.s),
          { opacity: clamp(arrive - k, 0, 1) });
        if (k < lit) m += MK.pill(B.cx, B.y - 30, String(B.n * B.n), clamp(lit - k, 0, 1), { size: 26, col: P.gold });
      }
      for (k = 0; k < 3; k++) {
        var A1 = PSQ_GROW[k], A2 = PSQ_GROW[k + 1];
        m += MK.arrow(A1.cx + 40, A1.y - 30, A2.cx - 40, A2.y - 30, on(t, cGrow == null ? null : cGrow + k * 0.3, 0.45) * gr, P.teal, 5);
      }
      out += G(m, { opacity: four });
    }

    return svg(out);
  }

  /* ---- chapter: between one square and the next ---------------------------
     ART.array(7, 7, {markRow: 6, markCol: 6}) marks the last row and the last
     column: 7 + 7 - 1 = 13 dots, leaving the 36 of the 6 by 6 square. The
     6 by 6 card sits at the same origin and the same scale, so the square
     visibly grows to the right and downwards. */
  var PSQ_L = psqBox(300, 17, 1.05);
  function psqLX(v) { return psqX(PSQ_L, v); }
  function psqLY(v) { return psqY(PSQ_L, v); }
  function psqLDot(i, j) { var d = psqArrDot(i, j); return [psqLX(d[0]), psqLY(d[1])]; }

  /* the four Ls: 2 by 2 back to 5 by 5, each marking its own last row and column */
  var PSQ_LS = (function () {
    var out = [], x = 105.8, k, s = 0.9;
    for (k = 2; k <= 5; k++) {
      var w = psqArrW(k) * s, h = psqArrH(k, true) * s;
      out.push({ n: k, add: 2 * k - 1, x: x, y: 420 - h, w: w, h: h, s: s, cx: x + w / 2 });
      x += w + 38;
    }
    return out;
  })();

  function psqLChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGrow = c(0, "grow"), cEll = c(0, "ell");
    var cSix = c(1, "six"), cSide = c(1, "side"), cBottom = c(1, "bottom");
    var cCorner = c(2, "corner"), cThirteen = c(2, "thirteen");
    var cSmall = c(3, "small"), cBig = c(3, "big"), cGap = c(3, "gap");
    var cEvery = c(4, "every"), cOdd = c(4, "odd");
    var out = "", k, d;
    var grown = on(t, cEll, 0.6);                     /* 6 by 6 -> 7 by 7 with its L */
    var many = on(t, cEvery, 0.55);                   /* the one square -> the four Ls */

    if (many < 1) {
      var g = "";
      if (grown < 1)
        g += G(psqPlace(ART.array(6, 6, { colour: "teal", label: "a square" }), psqArrW(6), psqArrH(6, true), PSQ_L.x, PSQ_L.y, PSQ_L.s),
          { opacity: clamp(popIn(t, cGrow, 0.5), 0, 1) * (1 - grown) });
      if (grown > 0)
        g += G(psqPlace(ART.array(7, 7, { colour: "teal", markRow: 6, markCol: 6, markColour: "accent", label: "an L along two edges" }),
          psqArrW(7), psqArrH(7, true), PSQ_L.x, PSQ_L.y, PSQ_L.s), { opacity: grown });

      /* "A 6 by 6 square": the 36 dots the L is being added to */
      var sx = on(t, cSix, 0.5);
      g += R(psqLX(76), psqLY(70), 216 * PSQ_L.s, 216 * PSQ_L.s, 10, "none", P.gold, 5, { opacity: sx });
      g += psqTag(t, 150, 96, "6 by 6", cSix, [psqLX(76) + 40, psqLY(70) + 40], { size: 26 });

      /* "6 new dots down the side" and "6 along the bottom", one dot at a time */
      var side = tally(t, cSide, 6, 0.9), bot = tally(t, cBottom, 6, 0.9);
      for (k = 0; k < 6; k++) {
        if (k < side) { d = psqLDot(k, 6); g += psqRing(d[0], d[1], 21, clamp(side - k, 0, 1), P.accent, 4); }
        if (k < bot) { d = psqLDot(6, k); g += psqRing(d[0], d[1], 21, clamp(bot - k, 0, 1), P.accent, 4); }
      }
      g += psqTag(t, 828, 150, "6", cSide, [psqLDot(2, 6)[0] + 26, psqLDot(2, 6)[1]], { size: 30, col: P.accent });
      g += psqTag(t, 180, 402, "6", cBottom, [psqLDot(6, 2)[0], psqLDot(6, 2)[1] + 26], { size: 30, col: P.accent, below: true });

      /* "one more in the corner", "That makes 13" */
      d = psqLDot(6, 6);
      var co = on(t, cCorner, 0.5);
      g += MK.glow(d[0], d[1], 62, P.gold, co * (0.7 + 0.3 * breathe(t)));
      g += psqRing(d[0], d[1], 24, co, P.gold, 5);
      g += psqTag(t, 838, 344, "1", cCorner, [d[0] + 26, d[1]], { size: 30 });
      g += MK.pill(880, 60, "6 + 6 + 1 = 13", on(t, cThirteen, 0.4), { size: 28, col: P.gold });

      /* "6 times 6 is 36", "7 times 7 is 49", "The gap is 13" */
      g += MK.pill(146, 200, "6 × 6 = 36", on(t, cSmall, 0.4), { size: 27, col: P.teal });
      g += MK.pill(146, 262, "7 × 7 = 49", on(t, cBig, 0.4), { size: 27, col: P.accent });
      g += MK.pill(146, 330, "49 − 36 = 13", on(t, cGap, 0.4), { size: 27, col: P.gold });
      g += MK.tick(278, 330, 22, popIn(t, cGap == null ? null : cGap + 0.4, 0.35));
      out += G(g, { opacity: 1 - many });
    }

    if (many > 0) {
      var h = "", arrive = tally(t, cEvery, 4, 0.8), lit = tally(t, cOdd, 4, 1.6);
      for (k = 0; k < PSQ_LS.length; k++) {
        var B = PSQ_LS[k];
        if (k >= arrive) continue;
        h += G(psqPlace(ART.array(B.n, B.n, { colour: "teal", markRow: B.n - 1, markCol: B.n - 1, markColour: "accent", label: String(B.add) }),
          psqArrW(B.n), psqArrH(B.n, true), B.x, B.y, B.s), { opacity: clamp(arrive - k, 0, 1) });
        if (k < lit) h += R(B.x - 6, B.y - 6, B.w + 12, B.h + 12, 20, "none", P.gold, 4,
          { opacity: clamp(lit - k, 0, 1) });
      }
      out += G(h, { opacity: many });
    }

    return svg(out);
  }

  /* ---- what you now know --------------------------------------------------- */
  function psqDot(cx, cy, r, col) { return C(cx, cy, r, col || P.teal); }
  function psqCapsule(cx, cy, size, col) {
    return R(cx - size * 0.15, cy - size * 0.30, size * 0.30, size * 0.60, size * 0.15, "none", col || P.gold, 3);
  }
  function psqPairPic(pairs, lone) {
    return function (cx, cy, size) {
      var out = "", n = pairs + (lone ? 1 : 0), k;
      var step = size * 0.40, x0 = cx - (n - 1) * step / 2;
      for (k = 0; k < pairs; k++) {
        out += psqCapsule(x0 + k * step, cy, size) +
          psqDot(x0 + k * step, cy - size * 0.16, size * 0.10) +
          psqDot(x0 + k * step, cy + size * 0.16, size * 0.10);
      }
      if (lone) out += psqDot(x0 + pairs * step, cy, size * 0.10, P.bad) +
        C(x0 + pairs * step, cy, size * 0.20, "none", P.bad, 3, { "stroke-dasharray": "5 4" });
      return out;
    };
  }
  function psqJoinPic(cx, cy, size) {
    return psqCapsule(cx, cy, size * 1.1) +
      psqDot(cx, cy - size * 0.18, size * 0.11, P.bad) +
      psqDot(cx, cy + size * 0.18, size * 0.11, P.bad);
  }
  function psqShapePic(cx, cy, size) {
    var r = size * 0.32;
    return Pth("M" + n2(cx) + "," + n2(cy - r) + " L" + n2(cx + r * 0.92) + "," + n2(cy + r * 0.72) +
      " L" + n2(cx - r * 0.92) + "," + n2(cy + r * 0.72) + " Z", "rgba(244,201,93,0.18)", P.gold, 5) +
      Tx(cx, cy + r * 0.52, "?", "lab big", "middle", { fill: P.ink });
  }
  function psqRulePic(cx, cy, size) {
    var out = "", w = size * 0.26, gap = size * 0.16, k;
    var x0 = cx - (3 * w + 2 * gap) / 2;
    for (k = 0; k < 3; k++) {
      var x = x0 + k * (w + gap);
      out += R(x, cy - w / 2, w, w, w * 0.2, P.cell, P.teal, 3);
      if (k) out += MK.arrow(x - gap + 2, cy, x - 2, cy, 1, P.gold, 4);
    }
    return out;
  }
  function psqBlockPic(cx, cy, size) {
    var out = "", k, j, step = size * 0.22, x0 = cx - 1.5 * step, y0 = cy - 1.5 * step;
    for (k = 0; k < 4; k++) for (j = 0; j < 4; j++) out += psqDot(x0 + j * step, y0 + k * step, size * 0.075, P.gold);
    return out + R(x0 - step * 0.62, y0 - step * 0.62, step * 4.24, step * 4.24, 6, "none", P.gold, 3);
  }

  var PSQ_RECAP = MK.recapKind([
    { beat: 0, at: "even", title: "Even", sub: "pairs off exactly", pic: psqPairPic(3, false) },
    { beat: 0, at: "odd", title: "Odd", sub: "one counter left over", pic: psqPairPic(2, true) },
    { beat: 1, at: "added", title: "Odd and odd", sub: "the leftovers pair up", pic: psqJoinPic },
    { beat: 2, at: "shape", title: "A hidden number", sub: "the sum decides it", pic: psqShapePic },
    { beat: 2, at: "rule", title: "The rule", sub: "term to the next term", pic: psqRulePic },
    { beat: 3, at: "square", title: "Square numbers", sub: "1, 4, 9, 16", pic: psqBlockPic }
  ], { goBeat: 3, goAt: "build" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Odd, even, and what they do", "A shape that hides a number", "Sequences, rules and square numbers"] }),
    pairs: psqPairsChapter, adding: psqAddChapter, hidden: psqHiddenChapter,
    steps: psqStepsChapter, squares: psqSquaresChapter, lshape: psqLChapter,
    recap: PSQ_RECAP
  };
