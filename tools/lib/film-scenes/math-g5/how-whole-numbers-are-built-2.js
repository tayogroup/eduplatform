  /* ==== How Whole Numbers Are Built, part 2 =====================================
     The chapters "The order of operations" and "Factors and multiples". */

  /* ---- small helpers shared by this file --------------------------------- */
  function hwnTok(x, y, text, color, size, opacity) {
    if (!(opacity > 0)) return "";
    return G(Tx(x, y, text, "lab", "middle", { fill: color, "font-size": size }), { opacity: Math.min(1, opacity) });
  }
  /* a rounded rectangle ringing the tokens from x1 to x2 on row y */
  function hwnGroupRing(x1, x2, y, p, col) {
    if (!(p > 0)) return "";
    var cx = (x1 + x2) / 2;
    return G(R(x1 - 34, y - 46, (x2 - x1) + 68, 86, 20, "none", col, 5),
      { opacity: Math.min(1, p), transform: around(cx, y, Math.min(p, 1.08)) });
  }

  /* ==== chapter: the order of operations =========================================
     Step 16's own expression, 3 + 4 x 5: 35 reading left to right, 23 doing the
     times first - only the second is the rule. Same-rank operations then run
     left to right (10 - 2 - 3 is 5), and that same left-to-right rule for equal
     rank applies to times and divide too (12 divide by 4 times 3 is 9, never 1).
     Step 16 explicitly does NOT teach brackets - its own note says brackets are
     "the next thing after this one in the Cambridge sequence", and the lesson's
     own objectives list this skill as order of operations "where there are no
     brackets" - so this chapter stops at equal rank, not at brackets. */
  function hwnOrderChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cExpr = c(0, "expr"), cTwo = c(0, "two");
    var cLeft35 = c(1, "left35"), cTimes23 = c(1, "times23");
    var cTimesDiv = c(2, "timesdiv"), cBefore = c(2, "before");
    var cRank = c(3, "rank"), cEx = c(3, "ex");
    var cEqual = c(4, "equalrank"), cLeftRight = c(4, "left2right");
    var cExpr2 = c(5, "expr2"), cWrongly = c(5, "wrongly");
    var w0 = hwnOnly(t, scene, 0), w1 = hwnOnly(t, scene, 1), w2 = hwnOnly(t, scene, 2),
      w3 = hwnOnly(t, scene, 3), w4 = hwnOnly(t, scene, 4), w5 = hwnOnly(t, scene, 5);
    var out = "", k;
    var EX = [[190, "3", P.ink], [260, "+", P.muted], [330, "4", P.ink], [400, "×", P.muted], [470, "5", P.ink]];
    var uw01 = Math.min(1, w0 + w1);
    if (uw01 > 0.002) {
      for (k = 0; k < EX.length; k++) {
        var tok = EX[k], at = cExpr == null ? null : cExpr + k * 0.13;
        out += hwnTok(tok[0], 150, tok[1], tok[2], 62, Math.max(popIn(t, at, 0.3), w1) * uw01);
      }
      out += MK.pill(900, 110, "two answers", popIn(t, cTwo, 0.4) * w0, { size: 28, col: P.line });
      var leftOnly = on(t, cLeft35, 0.4) * (1 - on(t, cTimes23, 0.4)) * w1;
      if (leftOnly > 0.002) {
        out += hwnGroupRing(190, 330, 150, leftOnly, P.bad);
        out += MK.pill(900, 190, "35", leftOnly, { size: 40, col: P.bad });
        out += MK.cross(1010, 190, 22, leftOnly * 0.9);
      }
      var rightOnly = on(t, cTimes23, 0.4) * w1;
      if (rightOnly > 0.002) {
        out += hwnGroupRing(330, 470, 150, rightOnly, P.good);
        out += MK.pill(900, 270, "23", rightOnly, { size: 40, col: P.good });
        out += MK.tick(1010, 270, 22, rightOnly * 0.9);
      }
    }
    if (w2 > 0.002) {
      out += G(MK.pill(340, 200, "× and ÷", on(t, cTimesDiv, 0.4), { size: 34, col: P.gold }) +
        MK.arrow(500, 200, 620, 200, on(t, cTimesDiv, 0.5), P.gold, 6) +
        MK.pill(780, 200, "before + and −", on(t, cBefore, 0.4), { size: 32, col: P.line }), { opacity: w2 });
    }
    if (w3 > 0.002) {
      var EX2 = [[300, "10", P.ink], [380, "−", P.muted], [450, "2", P.ink], [520, "−", P.muted], [590, "3", P.ink]];
      for (k = 0; k < EX2.length; k++) {
        var tk = EX2[k], at2 = cRank == null ? null : cRank + k * 0.1;
        out += hwnTok(tk[0], 200, tk[1], tk[2], 56, Math.max(popIn(t, at2, 0.3), 1) * w3);
      }
      out += MK.arrow(300, 250, 450, 250, on(t, cRank, 0.5) * w3, P.gold, 5);
      out += MK.arrow(450, 250, 590, 250, on(t, cRank, 0.5) * w3, P.gold, 5);
      out += MK.pill(860, 200, "5", popIn(t, cEx, 0.4) * w3, { size: 40, col: P.good });
    }
    /* beat 4: the same equal-rank, left-to-right rule also covers times and
       divide, not only plus and take away - "× ÷" and "+ −" shown as the same
       kind of pair, then an arrow spelling out "left to right" under both. */
    if (w4 > 0.002) {
      var eq = on(t, cEqual, 0.5) * w4;
      out += hwnTok(300, 170, "× ÷", P.gold, 44, eq);
      out += hwnTok(460, 178, "=", P.line, 40, eq);
      out += hwnTok(620, 170, "+ −", P.ink, 44, eq);
      out += MK.pill(460, 260, "equal rank too", eq, { size: 28, col: P.gold });
      var lr = on(t, cLeftRight, 0.5) * w4;
      out += MK.arrow(260, 330, 660, 330, lr, P.gold, 6);
      out += MK.pill(460, 390, "left to right", lr, { size: 26, col: P.line });
    }
    /* beat 5: the lesson's own second example, 12 divide by 4 times 3 - worked
       left to right to 9, with the wrong right-to-left answer, 1, crossed out
       beside it, echoing the tick/cross pair beats 0-1 used for 35 and 23. */
    if (w5 > 0.002) {
      var EX3 = [[220, "12", P.ink], [310, "÷", P.muted], [380, "4", P.ink], [450, "×", P.muted], [520, "3", P.ink]];
      for (k = 0; k < EX3.length; k++) {
        var tok3 = EX3[k], at3 = cExpr2 == null ? null : cExpr2 + k * 0.1;
        out += hwnTok(tok3[0], 170, tok3[1], tok3[2], 52, Math.max(popIn(t, at3, 0.3), 1) * w5);
      }
      out += MK.arrow(220, 220, 380, 220, on(t, cExpr2, 0.5) * w5, P.gold, 5);
      out += MK.arrow(380, 220, 520, 220, on(t, cExpr2, 0.5) * w5, P.gold, 5);
      var nineO = popIn(t, cExpr2, 0.5) * w5;
      out += MK.pill(800, 170, "9", nineO, { size: 44, col: P.good });
      out += MK.tick(900, 170, 22, nineO * 0.9);
      var wr = on(t, cWrongly, 0.4) * w5;
      out += MK.pill(800, 270, "1", wr, { size: 40, col: P.bad });
      out += MK.cross(900, 270, 22, wr * 0.9);
      out += MK.pill(580, 350, "right to left is wrong", wr, { size: 26, col: P.bad });
    }
    return svg(out);
  }

  /* ==== chapter: factors and multiples ==========================================
     Step 17's own numbers: 24 in four factor pairs (1x24, 2x12, 3x8, 4x6, eight
     factors), and 36, whose middle pair is 6x6, giving nine factors, not ten. */
  function hwnFactorRow(cx, cy, nums, pairs, selfIdx, p) {
    if (!(p > 0)) return "";
    var n = nums.length, gap = 74, x0 = cx - (n - 1) * gap / 2, out = "", k, positions = [];
    for (k = 0; k < n; k++) positions.push(x0 + k * gap);
    for (k = 0; k < pairs.length; k++) {
      var pr = pairs[k], xA = positions[pr[0]], xB = positions[pr[1]], mx = (xA + xB) / 2;
      var topY = cy - 56 - (pr[1] - pr[0]) * 4;
      out += Pth("M" + n2(xA) + "," + n2(cy - 24) + " Q" + n2(mx) + "," + n2(topY) + " " + n2(xB) + "," + n2(cy - 24), null, P.gold, 3.5);
    }
    if (selfIdx != null) {
      var xs = positions[selfIdx];
      out += Pth("M" + n2(xs - 16) + "," + n2(cy - 24) + " Q" + n2(xs) + "," + n2(cy - 56) + " " + n2(xs + 16) + "," + n2(cy - 24), null, P.plum, 3.5);
    }
    for (k = 0; k < n; k++) out += C(positions[k], cy, 26, k === selfIdx ? P.plum : P.teal, "#0B1D2C", 3) +
      Tx(positions[k], cy + 7, String(nums[k]), "lab mid", "middle", { fill: "#0B1D2C" });
    return G(out, { opacity: Math.min(1, p), transform: around(cx, cy, 0.94 + 0.06 * Math.min(1, p)) });
  }

  function hwnFactorsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFactor = c(0, "factor"), cMultiple = c(0, "multiple");
    var cStop = c(1, "stop"), cForever = c(1, "forever");
    var cPairs = c(2, "pairs"), cList = c(2, "list");
    var cEight = c(3, "eight");
    var cSquare36 = c(4, "square36"), cNine = c(4, "nine");
    var w0 = hwnOnly(t, scene, 0), w1 = hwnOnly(t, scene, 1);
    var w23 = Math.min(1, hwnOnly(t, scene, 2) + hwnOnly(t, scene, 3)), w3 = hwnOnly(t, scene, 3), w4 = hwnOnly(t, scene, 4);
    var out = "";
    if (w0 > 0.002) {
      out += MK.pill(300, 110, "factor", popIn(t, cFactor, 0.4) * w0, { size: 32, col: P.teal });
      out += MK.arrow(300, 150, 300, 220, on(t, cFactor, 0.5) * w0, P.teal, 7);
      out += G(Em(300, 270, 60, "\u{1F522}"), { opacity: w0 });
      out += MK.pill(860, 110, "multiple", popIn(t, cMultiple, 0.4) * w0, { size: 32, col: P.gold });
      out += MK.arrow(860, 220, 860, 150, on(t, cMultiple, 0.5) * w0, P.gold, 7);
    }
    if (w1 > 0.002) {
      out += G(Tx(300, 190, "1, 2, 3, 4, 6, 8, 12, 24", "lab big", "middle", { fill: P.teal }), { opacity: on(t, cStop, 0.5) * w1 });
      out += MK.pill(300, 250, "stops", on(t, cStop, 0.5) * w1, { size: 26, col: P.teal });
      out += G(Tx(860, 190, "3, 6, 9, 12 …", "lab big", "middle", { fill: P.gold }), { opacity: on(t, cForever, 0.5) * w1 });
      out += MK.pill(860, 250, "never stops", on(t, cForever, 0.5) * w1, { size: 26, col: P.gold });
    }
    if (w23 > 0.002) {
      var p24 = popIn(t, cPairs, 0.5) * w23;
      out += hwnFactorRow(580, 200, [1, 2, 3, 4, 6, 8, 12, 24], [[0, 7], [1, 6], [2, 5], [3, 4]], null, p24);
      out += MK.pill(580, 330, "four factor pairs", on(t, cList, 0.4) * w23, { size: 30, col: P.gold });
      out += MK.pill(1000, 200, "8", popIn(t, cEight, 0.5) * w3, { size: 56, col: P.line });
    }
    if (w4 > 0.002) {
      var p36 = popIn(t, cSquare36, 0.5) * w4;
      out += hwnFactorRow(580, 200, [1, 2, 3, 4, 6, 9, 12, 18, 36], [[0, 8], [1, 7], [2, 6], [3, 5]], 4, p36);
      out += MK.pill(580, 330, "nine factors, not ten", on(t, cNine, 0.4) * w4, { size: 28, col: P.plum });
    }
    return svg(out);
  }
