
  /* ==== Counting to Twenty, part 2 ===========================================
     The chapters "Look, do not count" (the lesson's See how many and Guess then
     count) and "Ten and some more" (Then to 20, Read the number, Write the
     number). Continues tools/lib/film-scenes/math-g1/counting-to-twenty.js. */

  /* ==== chapter: look, do not count ============================================
     The lesson's own patterns: the dice five it flashes up, and the domino four
     and two that make six without counting. Then its estimating step - guess
     first, count after, and being close is the whole job. */

  /* Where ART.dice puts its pips, so a ring can land on one. Its die is 80
     across, inset 20, with pips at 20, 40 and 60; face f is 102 to its right of
     the one before it. */
  var CTW_PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]] };
  function ctwPips(faces) {
    var c = [20, 40, 60], out = [];
    faces.forEach(function (f, n) {
      CTW_PIPS[f].forEach(function (p) { out.push([20 + n * 102 + c[p[0]], 20 + c[p[1]]]); });
    });
    return out;
  }

  /* the fourteen apples of the estimating step, in one fixed scatter */
  var CTW_APPLES = [
    [160, 150], [268, 208], [150, 300], [300, 330], [400, 160], [512, 250], [430, 362],
    [620, 150], [700, 300], [820, 180], [930, 262], [860, 362], [1030, 150], [1040, 330]
  ];
  function ctwApples(t, at, upto) {
    var out = "";
    CTW_APPLES.forEach(function (a, k) {
      var p = at == null ? 1 : popIn(t, at + k * 0.045, 0.32);
      if (p > 0) out += MK.pop(Em(a[0], a[1], 58, "\u{1F34E}"), a[0], a[1], p);
      if (upto != null && k < upto) out += ctwNum(a[0], a[1] - 44, String(k + 1), 30, 1, P.gold);
    });
    return out;
  }

  function ctwLookBeat(scene, k, t) {
    var c = function (kk, name) { return sc(scene, kk, name); };
    var out = "";

    if (k === 0) {
      /* the slow way on the left, the pattern on the right */
      var cN = c(0, "notcount"), cP = c(0, "patterns"), cS = c(0, "see");
      var row = ctwAt(ART.counters(5, { cols: 5, label: " " }), 320, 196, 400, 220);
      out += row.draw();
      var got = tally(t, cN, 5, 2.0);
      for (var j = 0; j < got; j++) out += ctwNum(row.X(41 + j * 42), row.y + row.h + 24, String(j + 1), 34, 1, P.muted);
      var po = popIn(t, cP, 0.45);
      if (po > 0) {
        var die = ctwAt(ART.dice(5, { label: " " }), 860, 190, 280, 300);
        out += MK.glow(860, 180, 170, P.gold, on(t, cS, 0.5) * (0.6 + 0.4 * breathe(t)));
        out += MK.pop(die.draw(), 860, 190, po);
      }
      out += ctwNum(860, 356, "5", 56, popIn(t, cS, 0.4), P.gold);
      return out;
    }

    if (k === 1) {
      /* five dots, like a dice */
      var cF = c(1, "five"), cD = c(1, "dice"), cIs = c(1, "isfive"), cG = c(1, "glance");
      var b1 = ctwAt(ART.dice(5, { label: " " }), 420, 206, 320, 330);
      out += MK.glow(420, 196, 190, P.gold, on(t, cD, 0.6) * 0.8);
      out += b1.draw();
      var pips = ctwPips([5]), lit = tally(t, cF, 5, 1.1);
      for (var q = 0; q < lit; q++) {
        out += C(b1.X(pips[q][0]), b1.Y(pips[q][1]), 11 * b1.s, "none", P.gold, 2 * b1.s);
      }
      out += ctwNum(872, 190, "5", 120, popIn(t, cIs, 0.45), P.gold);
      out += MK.leader(770, 196, 574, 196, on(t, cG, 0.6), P.gold);
      return out;
    }

    if (k === 2) {
      /* four and two make six */
      var cFour = c(2, "four"), cSix = c(2, "six"), cOne = c(2, "onebyone");
      var b2 = ctwAt(ART.dice([4, 2], { label: false }), 400, 200, 620, 300);
      out += b2.draw();
      out += MK.pill(b2.X(60), b2.Y(-8), "4", popIn(t, cFour, 0.4), { size: 34, col: P.gold });
      out += MK.pill(b2.X(162), b2.Y(-8), "2", popIn(t, cFour == null ? null : cFour + 0.3, 0.4), { size: 34, col: P.gold });
      out += ctwNum(940, 176, "6", 120, popIn(t, cSix, 0.45), P.good);
      out += MK.tick(940, 322, 34, popIn(t, cSix == null ? null : cSix + 0.5, 0.4));
      var six = ctwPips([4, 2]), slowN = tally(t, cOne, 6, 1.6);
      for (var z = 0; z < slowN; z++) {
        out += ctwNum(b2.X(six[z][0]), b2.Y(six[z][1]) - 2, String(z + 1), 30, 1, P.muted);
      }
      return out;
    }

    if (k === 3) {
      /* an estimate is a guess made before counting */
      var cE = c(3, "estimate"), cG3 = c(3, "guess"), cA = c(3, "apples");
      out += ctwApples(t, cA == null ? null : cA - 0.3, null);
      out += MK.qmark(150, 50, 32, on(t, cE, 0.45));
      out += MK.pill(340, 50, "guess first", popIn(t, cG3, 0.4), { size: 30, col: P.gold });
      return out;
    }

    /* k === 4: guess fifteen, count fourteen */
    var cFif = c(4, "fifteen"), cC = c(4, "count"), cFor = c(4, "fourteen"), cCl = c(4, "close");
    out += ctwApples(t, null, tally(t, cC, 14, 2.1));
    out += MK.pill(196, 44, "about 15", popIn(t, cFif, 0.4), { size: 30, col: P.gold });
    out += MK.pill(1000, 44, "14", popIn(t, cFor, 0.4), { size: 30, col: P.good });
    out += MK.tick(880, 44, 26, popIn(t, cCl, 0.4));
    return out;
  }

  function ctwLookChapter(scene, beat, t, i) { return ctwChapter(scene, t, i, ctwLookBeat); }

  /* ==== chapter: ten and some more =============================================
     Two ten frames, as the lesson's Then to 20 step draws them: the first frame
     is filled and kept, and the loose ones go on top of it. Then the number is
     read off the counters, and written - the tens digit first. */
  var CTW_TEEN = { cx: 560, cy: 170, w: 860, h: 280 };
  function ctwTeenBox(n, show) {
    return ctwAt(ctwTF(n, 2, show), CTW_TEEN.cx, CTW_TEEN.cy, CTW_TEEN.w, CTW_TEEN.h);
  }
  /* a rectangle over cells a to b of one row, in the drawing's own coordinates */
  function ctwCellsRect(a, b) {
    var ca = ctwCell(a), cb = ctwCell(b);
    return [ca[0] - CTW_TF.cell / 2, ca[1] - CTW_TF.cell / 2, cb[0] - ca[0] + CTW_TF.cell, CTW_TF.cell];
  }
  /* the two boxes a number is written into: tens on the left, ones on the right */
  var CTW_DIGIT = { x1: 508, x2: 628, y: 378, s: 96 };
  function ctwDigitBox(x, text, shown, pop) {
    var s = CTW_DIGIT.s, y = CTW_DIGIT.y;
    if (!(pop > 0)) return "";
    return MK.pop(R(x - s / 2, y - s / 2, s, s, 16, P.cell, P.gold, 3.5, { "stroke-dasharray": shown ? null : "10 7" }) +
      (shown ? Tx(x, y + 22, text, "lab", "middle", { "font-size": 64, fill: P.ink }) : ""), x, y, pop);
  }

  function ctwTeenBeat(scene, k, t) {
    var c = function (kk, name) { return sc(scene, kk, name); };
    var out = "";

    if (k === 0) {
      var cF = c(0, "fill"), cT = c(0, "ten");
      var n = tally(t, cF, 10, 1.8);
      var b = ctwTeenBox(n, cT != null && t >= cT);
      out += b.draw();
      out += ctwRing(b, ctwFrameRect(0), on(t, cT, 0.5), P.good, 9);
      out += MK.tick(CTW_TEEN.cx, 392, 32, popIn(t, cT, 0.4));
      return out;
    }

    if (k === 1) {
      var cA = c(1, "after"), cS = c(1, "start"), cK = c(1, "keep");
      var b1 = ctwTeenBox(10, false);
      out += b1.draw();
      out += ctwRing(b1, ctwFrameRect(0), on(t, cA, 0.5), P.gold, 9);
      var cell10 = ctwCell(10);
      out += ctwNum(b1.X(cell10[0]), b1.Y(cell10[1]) - 4, "1", 48, popIn(t, cS, 0.4), P.bad);
      out += MK.cross(b1.X(cell10[0]) + 76, b1.Y(cell10[1]), 30, popIn(t, cS == null ? null : cS + 0.35, 0.4));
      out += MK.glow(b1.X(ctwFrameRect(0)[0] + CTW_TF.fw / 2), b1.Y(CTW_TF.edge + CTW_TF.fh / 2), 118, P.good,
        on(t, cK, 0.5) * (0.55 + 0.45 * breathe(t)));
      out += MK.pill(CTW_TEEN.cx, 392, "keep the 10", popIn(t, cK, 0.4), { size: 34, col: P.good });
      return out;
    }

    if (k === 2) {
      var cEl = c(2, "eleven"), cTw = c(2, "twelve");
      var n2 = 10 + ctwStep(t, [cEl, cTw]);
      var b2 = ctwTeenBox(n2, cEl != null && t >= cEl);
      out += b2.draw();
      var swapped = cTw != null && t >= cTw;
      out += MK.pill(CTW_TEEN.cx, 392, "10 and 1 make 11", swapped ? 0 : popIn(t, cEl, 0.4), { size: 34, col: P.gold });
      out += MK.pill(CTW_TEEN.cx, 392, "10 and 2 make 12", popIn(t, cTw, 0.4), { size: 34, col: P.gold });
      return out;
    }

    if (k === 3) {
      var cFr = c(3, "frame"), cTh = c(3, "three"), cFi = c(3, "find"), cN = c(3, "thirteen");
      var b3 = ctwTeenBox(13, cFi != null && t >= cFi);
      out += b3.draw();
      out += ctwRing(b3, ctwFrameRect(0), bump(t, cFr, 1.4), P.gold, 9);
      out += ctwRing(b3, ctwCellsRect(10, 12), on(t, cTh, 0.5), P.teal, 7);
      out += MK.qmark(CTW_TEEN.cx, 392, 30, on(t, cFi, 0.4) * (1 - on(t, cN, 0.4)));
      out += MK.pill(CTW_TEEN.cx, 392, "13", popIn(t, cN, 0.4), { size: 44, col: P.good });
      return out;
    }

    if (k === 4) {
      var cW = c(4, "write"), cO = c(4, "one"), cFo = c(4, "four");
      var b4 = ctwTeenBox(14, false);
      out += b4.draw();
      var box = popIn(t, cW, 0.4);
      out += ctwDigitBox(CTW_DIGIT.x1, "1", cO != null && t >= cO, Math.max(box, popIn(t, cO, 0.4)));
      out += ctwDigitBox(CTW_DIGIT.x2, "4", cFo != null && t >= cFo, Math.max(box, popIn(t, cFo, 0.4)));
      out += MK.ripple(CTW_DIGIT.x1, CTW_DIGIT.y, t, cO, P.gold);
      out += MK.ripple(CTW_DIGIT.x2, CTW_DIGIT.y, t, cFo, P.gold);
      return out;
    }

    /* k === 5: the 1 is one whole ten, the 4 is the loose ones */
    var cWh = c(5, "whole"), cL = c(5, "loose");
    var b5 = ctwTeenBox(14, false);
    out += b5.draw();
    out += ctwDigitBox(CTW_DIGIT.x1, "1", true, 1);
    out += ctwDigitBox(CTW_DIGIT.x2, "4", true, 1);
    var f0 = ctwFrameRect(0);
    out += ctwRing(b5, f0, on(t, cWh, 0.5), P.gold, 9);
    out += MK.leader(CTW_DIGIT.x1, CTW_DIGIT.y - 56, b5.X(f0[0] + CTW_TF.fw / 2), b5.Y(CTW_TF.edge + CTW_TF.fh) + 14,
      on(t, cWh, 0.6), P.gold);
    out += ctwRing(b5, ctwCellsRect(10, 13), on(t, cL, 0.5), P.teal, 7);
    out += MK.leader(CTW_DIGIT.x2, CTW_DIGIT.y - 56, b5.X(ctwCell(11)[0] + 22), b5.Y(CTW_TF.edge + CTW_TF.fh) + 14,
      on(t, cL, 0.6), P.teal);
    return out;
  }

  function ctwTeenChapter(scene, beat, t, i) { return ctwChapter(scene, t, i, ctwTeenBeat); }
