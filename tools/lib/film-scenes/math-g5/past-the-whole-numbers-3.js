
  /* ==== Past the Whole Numbers, part 3 ===========================================
     The chapters "Fractions and percentages" and "Ratio and proportion", and
     what you now know. Fractions and the hundred-square percentage picture are
     ART's own (ART.fraction, ART.grid); the ratio counters are hand drawn -
     ART.counters draws loose counters in ONE colour, and this lesson's mix is
     two colours at once (3 orange, 2 teal), so there is no library call for it. */

  /* ==== chapter: fractions and percentages ======================================= */
  function ptwFracPctChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCuts = c(0, "cuts"), cBottom = c(0, "bottom");
    var cQuarter = c(1, "quarter"), cSmaller = c(1, "smaller");
    var cSixtyFive = c(2, "sixtyFive"), cOutOf100 = c(2, "outOf100"), cOutOf20 = c(2, "outOf20");
    var cPercent = c(3, "percent"), cPctOutOf = c(3, "pctOutOf");
    var cCostumes = c(4, "costumes");
    var out = "";

    var barsOn = ptwOnly(t, scene, 0) + ptwOnly(t, scene, 1);
    if (barsOn > 0.02) {
      var thirdO = 1, quarterO = on(t, cQuarter, 0.5) > 0 || t >= (cBottom || 0) ? 1 : 0;
      out += G(ART.place(ART.fraction({ shape: "bar", parts: 3, shaded: 1, colour: "teal" }), 40, 100, 374, 200), { opacity: Math.min(1, thirdO) });
      out += Tx(227, 88, "1/3", "lab big", "middle", { fill: P.teal });
      var q = on(t, cQuarter, 0.5);
      if (q > 0) {
        out += G(ART.place(ART.fraction({ shape: "bar", parts: 4, shaded: 1, colour: "gold" }), 460, 100, 374, 200), { opacity: Math.min(1, q) });
        out += Tx(647, 88, "1/4", "lab big", "middle", { fill: P.gold, opacity: q });
      }
      var smO = on(t, cSmaller, 0.5);
      if (smO > 0) {
        out += MK.pill(647, 330, "smaller amount", smO, { size: 26, col: P.gold, anchor: "middle" });
        out += MK.pill(970, 190, "bigger bottom", smO, { size: 24, col: P.gold });
      }
      return svg(out);
    }

    /* beats 2-4: the hundred square, relabelled from a fraction into a percentage */
    var gridO = ptwOnly(t, scene, 2) + ptwOnly(t, scene, 3) + ptwOnly(t, scene, 4);
    var gx = 400, gy = 45, gw = 330, gh = 330;
    out += G(ART.place(ART.grid({ cols: 10, rows: 10, cell: 26, fill: 65, colour: "accent" }), gx, gy, gw, gh), { opacity: Math.min(1, gridO) });
    var f65O = on(t, cSixtyFive, 0.5);
    if (f65O > 0) out += MK.pill(gx + gw + 80, gy + 40, "0.65", f65O, { size: 30, col: P.accent, anchor: "middle" });
    var outOfO = on(t, cOutOf100, 0.5);
    if (outOfO > 0) out += MK.pill(50, 110, "65 out of 100", outOfO, { size: 28, col: P.accent, anchor: "start" });
    var outOf20O = on(t, cOutOf20, 0.5);
    if (outOf20O > 0) out += MK.pill(50, 170, "= 13 out of 20", outOf20O, { size: 26, col: P.accent, anchor: "start" });
    var pctO = on(t, cPercent, 0.5);
    if (pctO > 0) {
      out += MK.pill(gx + gw / 2, gy + gh + 30, "per cent = for each hundred", pctO, { size: 24, col: P.teal, anchor: "middle" });
    }
    var pctOutOfO = on(t, cPctOutOf, 0.6);
    if (pctOutOfO > 0) out += MK.pill(gx + gw + 80, gy + 40, "65%", pctOutOfO, { size: 34, col: P.teal, anchor: "middle" });
    var costO = on(t, cCostumes, 0.5);
    if (costO > 0) {
      out += MK.pill(90, 260, "65%", costO, { size: 26, col: P.teal });
      out += MK.pill(90, 316, "65/100", popIn(t, cCostumes == null ? null : cCostumes + 0.3, 0.4), { size: 26, col: P.accent });
      out += MK.pill(90, 372, "0.65", popIn(t, cCostumes == null ? null : cCostumes + 0.6, 0.4), { size: 26, col: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: ratio and proportion ============================================
     3 orange counters, 2 teal ones - the lesson's own mix and its own 60%.
     Hand drawn (ptwCounter/ptwRatio helpers below): ART.counters draws one
     colour only, and this mix needs two colours in the same row. */
  function ptwCounter(x, y, r, fill) { return C(x, y, r, fill, P.ground, 3); }
  var PTW_RATIO_X = [280, 380, 480, 620, 720], PTW_RATIO_Y = 150, PTW_RATIO_R = 42;
  var PTW_RATIO_COL = [P.accent, P.accent, P.accent, P.teal, P.teal];

  function ptwRatioChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOrange = c(0, "orange"), cTeal = c(0, "teal");
    var cRatio = c(1, "ratio"), cThreeTwo = c(1, "threeTwo");
    var cNotFraction = c(2, "notFraction"), cParts = c(2, "parts");
    var cAddParts = c(3, "addParts"), cFive = c(3, "five");
    var cProportion = c(4, "proportion"), cSixty = c(4, "sixty");
    var out = "", k;

    var orangeO = on(t, cOrange, 0.5), tealO = on(t, cTeal, 0.5);
    for (k = 0; k < 5; k++) {
      var p = k < 3 ? popIn(t, cOrange, 0.4 + k * 0.08) : popIn(t, cTeal, 0.4 + (k - 3) * 0.08);
      if (p > 0) out += G(ptwCounter(PTW_RATIO_X[k], PTW_RATIO_Y, PTW_RATIO_R, PTW_RATIO_COL[k]),
        { opacity: Math.min(1, p), transform: around(PTW_RATIO_X[k], PTW_RATIO_Y, Math.min(p, 1.12)) });
    }

    /* "3 to 2, written 3:2" under the counters */
    var ratioO = on(t, cRatio, 0.5);
    if (ratioO > 0) out += MK.pill(500, 240, "3 orange to 2 teal", ratioO, { size: 26, col: P.line, anchor: "middle" });
    var threeTwoO = on(t, cThreeTwo, 0.5);
    if (threeTwoO > 0) out += Tx(500, 300, "3 : 2", "lab big", "middle", { "font-size": 60, opacity: threeTwoO, fill: P.gold });

    /* "does not mean the fraction 3/2" - a crossed fraction glyph */
    var notFracO = on(t, cNotFraction, 0.6);
    if (notFracO > 0) {
      out += Tx(890, 130, "3", "lab big", "middle", { "font-size": 44, opacity: notFracO });
      out += L(858, 155, 922, 155, P.ink, 3, { opacity: notFracO });
      out += Tx(890, 190, "2", "lab big", "middle", { "font-size": 44, opacity: notFracO });
      out += MK.cross(890, 160, 56, notFracO, P.bad);
    }
    var partsO = on(t, cParts, 0.5);
    if (partsO > 0) out += MK.pill(890, 240, "both are parts", partsO, { size: 22, col: P.bad, anchor: "middle" });

    /* "3 plus 2 is 5 counters" - a ring round the whole row */
    var addO = on(t, cAddParts, 0.6);
    if (addO > 0) out += G(R(255, 100, 490, 100, 24, "none", P.good, 4), { opacity: addO });
    var fiveO = on(t, cFive, 0.5);
    if (fiveO > 0) out += MK.pill(500, 60, "5 counters in all", fiveO, { size: 26, col: P.good, anchor: "middle" });

    /* "3 out of 5 is a proportion: 60%" - the orange three bracketed */
    var propO = on(t, cProportion, 0.6);
    if (propO > 0) out += G(R(255, 190, 290, 20, 6, P.accent), { opacity: 0.55 * propO });
    var sixtyO = on(t, cSixty, 0.6);
    if (sixtyO > 0) out += MK.pill(500, 380, "60%", sixtyO, { size: 34, col: P.accent, anchor: "middle" });
    return svg(out);
  }

  /* ==== what you now know ========================================================= */
  var PTW_RECAP = MK.recapKind([
    { beat: 0, at: "point", title: "Past the point", sub: "tenths, then hundredths",
      pic: function (cx, cy, size) {
        return ptwTile(cx - size * 0.42, cy - size * 0.3, "6", true, size * 0.4) +
          ptwTile(cx + size * 0.02, cy - size * 0.3, "5", true, size * 0.4);
      } },
    { beat: 0, at: "negatives", title: "Past zero", sub: "into negative numbers",
      pic: function (cx, cy, size) {
        return L(cx - size * 0.4, cy, cx + size * 0.4, cy, P.line, 4) +
          C(cx, cy, size * 0.07, P.ink, P.gold, 3) +
          C(cx - size * 0.28, cy, size * 0.06, P.plum) + C(cx + size * 0.28, cy, size * 0.06, P.gold);
      } },
    { beat: 1, at: "moves", title: "x10 moves the digits", sub: "the point never moves",
      pic: function (cx, cy, size) {
        return L(cx, cy - size * 0.32, cx, cy + size * 0.32, P.gold, 4) +
          MK.arrow(cx + size * 0.3, cy, cx - size * 0.1, cy, 1, P.teal, 6);
      } },
    { beat: 2, at: "oneDigit", title: "Round on one digit", sub: "straight from the start",
      pic: function (cx, cy, size) {
        return ptwTile(cx - size * 0.22, cy - size * 0.3, "?", false, size * 0.44) +
          MK.pic(cx + size * 0.16, cy - size * 0.06, size * 0.4, "\u{1F50D}");
      } },
    { beat: 3, at: "oneNumber", title: "Fraction, decimal, %", sub: "one number, three ways",
      pic: function (cx, cy, size) {
        return Tx(cx, cy - size * 0.06, "0.65", "lab big", "middle", { "font-size": size * 0.3, fill: P.gold });
      } },
    { beat: 3, at: "partToPart", title: "Ratio: part to part", sub: "proportion: part to whole",
      pic: function (cx, cy, size) {
        return ptwCounter(cx - size * 0.22, cy - size * 0.04, size * 0.14, P.accent) +
          ptwCounter(cx + size * 0.1, cy - size * 0.04, size * 0.14, P.teal);
      } }
  ], { goBeat: 3, goAt: "partToPart" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Place value with decimals", "Negative numbers and rounding", "Fractions, percentages and ratio"] }),
    decimals: ptwDecimalsChapter, moving: ptwMovingChapter, negative: ptwNegativeChapter,
    rounding: ptwRoundingChapter, fracpct: ptwFracPctChapter, ratio: ptwRatioChapter,
    recap: PTW_RECAP
  };
