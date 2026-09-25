
  /* ==== Grade 5 Mathematics, Lesson 4: Past the Whole Numbers ===================
     tools/lib/film-scenes/math-g5/past-the-whole-numbers.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-5-app/lecture-video/past-the-whole-numbers.json.

     Grade 5 is a page a learner scans, not a deck (CLAUDE.md's hard rule): this
     film sits ABOVE the lesson's five static steps and does not replace them.
     The chapters follow the lesson's own WORK parts in order - Place value with
     decimals; Negative numbers and rounding; Fractions, percentages and ratio -
     split one chapter per idea: decimals (step 23), moving the digits (step 24),
     negative numbers (step 22), rounding (step 21), fractions and percentages
     (steps 25-26), ratio and proportion (step 27).

     Mathematics has no lesson kit, so most drawings here are the shared maths
     pictures (tools/lib/ehel-film-art-math.js): ART.numberLine for the negative
     chapter and the two rounding number lines, ART.fraction for the quarter and
     third bars, ART.grid for the hundred-square percentage picture. Two pictures
     ART does not cover are hand drawn with the engine's own primitives (R, C, L,
     Tx), each noted where it is drawn: the decimal place-value columns (ART's
     placeValue only knows whole hundreds/tens/ones, 0-999, no tenths or
     hundredths) and the sliding ones/tenths digit tiles for x10 and div10 (no
     library picture moves a digit between columns). The ratio counters in
     part 3 are a third: ART.counters draws one colour only, and this lesson's
     mix is two colours at once.

     This file: the palette, the small drawings the chapters share, the title
     motif and the chapters "Place value with decimals" and "Moving the digits".
     Every top-level name starts with ptw. */

  var HUE = {
    title: P.teal, decimals: P.gold, moving: P.blue, negative: P.plum,
    rounding: P.accent, fracpct: P.teal, ratio: P.good, recap: P.teal
  };

  /* ---- timing, the same shape as every other film's ---------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does */
  function ptwOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 over span from a cue, staying at 1: a move that finishes and stays */
  function ptwStep(t, at, span) { return at == null ? 0 : ease(clamp((t - at) / (span || 0.5), 0, 1)); }

  /* ---- small drawings the chapters share ---------------------------------
     A digit or a point, drawn as a tile in the film's own dark palette (not
     nested through ART.place, which always carries a light card - these sit
     directly on the stage, the way the marks and pills do). */
  function ptwTile(x, y, ch, lit, w) {
    w = w || 78;
    var fill = lit ? P.tealSoft : P.cell, stroke = lit ? P.teal : P.line;
    return R(x, y, w, 96, 10, fill, stroke, 2.5) +
      Tx(x + w / 2, y + 66, ch, "lab big", "middle", { "font-size": 50 });
  }
  function ptwPoint(x, y, o) {
    return Tx(x, y + 66, ".", "lab big", "middle", { "font-size": 50, opacity: o == null ? 1 : o });
  }

  /* ==== the title motif ==========================================================
     A single number line running from negative to positive, with a decimal
     point magnified below zero into tenths and hundredths ticks: the two
     directions this lesson goes past the whole numbers. On the two cards it
     simply stands; in the spoken title chapter the line draws itself outward
     from zero both ways, then the magnifier drops in. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene || null;
    var lineO = s ? on(t, sc(s, 0, "ones"), 0.7) : 1;
    var bothO = s ? on(t, sc(s, 0, "both"), 0.6) : 1;
    var pointO = s ? popIn(t, sc(s, 1, "point"), 0.5) : 1;
    var zeroO = s ? popIn(t, sc(s, 1, "zero"), 0.5) : 1;
    var out = "";
    out += C(180, 180, 172, "#123247");
    out += el("clipPath", { id: "ptwMotifClip" }, C(180, 180, 172));
    var cy = 150, x0 = 40, x1 = 320, mid = (x0 + x1) / 2;
    var g = G(
      L(x0, cy, lerp(mid, x0, 1 - lineO * (1 - bothO)) , cy, P.line, 3) +
      L(mid, cy, lerp(mid, x1, lineO), cy, P.gold, 5) +
      L(mid, cy, lerp(mid, x0, lineO), cy, P.plum, 5) +
      C(mid, cy, 8, P.ink),
      { "clip-path": "url(#ptwMotifClip)" });
    out += g;
    /* ticks either side of the middle, thinning towards the ends */
    var k;
    for (k = 1; k <= 6; k++) {
      var u = clamp(lineO * 7 - k, 0, 1);
      out += L(mid + k * 42, cy - 10, mid + k * 42, cy + 10, P.gold, 2, { opacity: 0.7 * u, "clip-path": "url(#ptwMotifClip)" });
      out += L(mid - k * 42, cy - 10, mid - k * 42, cy + 10, P.plum, 2, { opacity: 0.7 * u, "clip-path": "url(#ptwMotifClip)" });
    }
    /* the decimal magnifier: a small ring on the first tick past the middle,
       opening into three tiny tenths ticks below it */
    if (pointO > 0) {
      out += G(C(mid + 42, cy, 14, "none", P.teal, 3) +
        L(mid + 42, cy + 14, mid + 42, cy + 46, P.teal, 2, { "stroke-dasharray": "3 4" }) +
        L(mid + 20, cy + 60, mid + 64, cy + 60, P.teal, 2) +
        L(mid + 20, cy + 54, mid + 20, cy + 66, P.teal, 2) +
        L(mid + 42, cy + 54, mid + 42, cy + 66, P.teal, 2) +
        L(mid + 64, cy + 54, mid + 64, cy + 66, P.teal, 2),
        { opacity: Math.min(1, pointO) });
    }
    if (zeroO > 0) out += G(C(mid, cy, 9, P.ink, P.gold, 3), { opacity: Math.min(1, zeroO), transform: around(mid, cy, Math.min(zeroO, 1.15)) });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A number line running past zero in both directions, with a magnifier over the first tenths">' + out + "</svg>";
  }

  /* ==== chapter: place value with decimals =======================================
     0.65 built up, column by column, then set beside 0.7: more digits written
     down, and still the smaller number, because the comparison never gets past
     the tenths column. Hand drawn (ptwTile): ART.placeValue only knows whole
     hundreds/tens/ones, 0 to 999, with no tenths or hundredths column at all. */
  var PTW_D_X = 430, PTW_D_Y = 70, PTW_D_W = 78, PTW_D_GAP = 10;
  function ptwDecimalsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPoint = c(0, "point");
    var cTenths = c(1, "tenths"), cHundredths = c(1, "hundredths");
    var cTen = c(2, "ten");
    var cSixtyFive = c(3, "sixtyFive"), cSeven = c(3, "seven"), cSmaller = c(3, "smaller");
    var cTenthsCol = c(4, "tenthsCol"), cSeven2 = c(4, "seven2");
    var out = "", k;

    var buildPhase = ptwOnly(t, scene, 0) + ptwOnly(t, scene, 1) + ptwOnly(t, scene, 2);
    if (buildPhase > 0.02) {
      /* "0 . 6 5" built one column at a time, headers rising under each */
      var digits = ["0", ".", "6", "5"], headers = [null, null, "tenths", "hundredths"];
      var litIdx = cHundredths != null && t >= cHundredths ? 3 : (cTenths != null && t >= cTenths ? 2 : -1);
      var x = PTW_D_X;
      var showOnes = on(t, cPoint, 0.6);
      var showTenths = on(t, cTenths, 0.5);
      var showHundredths = on(t, cHundredths, 0.5);
      var shows = [1, showOnes, showTenths, showHundredths];
      for (k = 0; k < digits.length; k++) {
        var sOp = shows[k];
        if (!(sOp > 0)) { x += (digits[k] === "." ? 34 : PTW_D_W) + PTW_D_GAP; continue; }
        if (digits[k] === ".") { out += G(ptwPoint(x + 12, PTW_D_Y, sOp), { opacity: sOp }); x += 34 + PTW_D_GAP; continue; }
        out += G(ptwTile(x, PTW_D_Y, digits[k], k === litIdx, PTW_D_W), { opacity: Math.min(1, sOp), transform: around(x + PTW_D_W / 2, PTW_D_Y + 48, 0.9 + 0.1 * Math.min(1, sOp)) });
        if (headers[k]) out += Tx(x + PTW_D_W / 2, PTW_D_Y + 128, headers[k], "lab mid muted readable", "middle", { opacity: Math.min(1, sOp) });
        x += PTW_D_W + PTW_D_GAP;
      }
      var tenO = on(t, cTen, 0.6);
      if (tenO > 0) {
        /* tenths centre (x0 + 171) to hundredths centre (x0 + 171 + 88) */
        var ax = PTW_D_X + 171, ax2 = ax + PTW_D_W + PTW_D_GAP;
        out += MK.arrow(ax, PTW_D_Y + 150, ax2, PTW_D_Y + 150, tenO, P.gold, 5);
        out += MK.pill(950, 90, "ten times less", tenO, { size: 26, col: P.gold });
      }
      return svg(out);
    }

    /* beats 3-4: 0.65 beside 0.7, the tenths digits ringed and compared */
    var Lx = 190, Rx = 760, Y = 130;
    function card(x, digits, lit) {
      var xx = x, s = "", j;
      for (j = 0; j < digits.length; j++) {
        if (digits[j] === ".") { s += ptwPoint(xx + 12, Y); xx += 34 + PTW_D_GAP; continue; }
        s += ptwTile(xx, Y, digits[j], j === lit, PTW_D_W);
        xx += PTW_D_W + PTW_D_GAP;
      }
      return s;
    }
    out += card(Lx, ["0", ".", "6", "5"], (on(t, cSeven2, 0.4) > 0 || t >= cSixtyFive) ? 2 : -1);
    out += card(Rx, ["0", ".", "7"], (on(t, cSeven2, 0.4) > 0 || t >= cSeven) ? 2 : -1);
    out += MK.pill(Lx + 130, Y - 40, "0.65", on(t, cSixtyFive, 0.4), { size: 26, col: P.gold, anchor: "middle" });
    out += MK.pill(Rx + 90, Y - 40, "0.7", on(t, cSeven, 0.4), { size: 26, col: P.teal, anchor: "middle" });
    var smallerO = on(t, cSmaller, 0.5);
    if (smallerO > 0) {
      out += G(Pth("M" + n2(Lx + 130) + "," + n2(Y + 130) + " L" + n2(Rx + 90) + "," + n2(Y + 130), null, P.bad, 4, { "stroke-dasharray": "9 7" }), { opacity: smallerO });
      out += MK.pill(Lx + 130, Y + 175, "smaller", smallerO, { size: 28, col: P.bad, anchor: "middle" });
      out += MK.pill(Rx + 90, Y + 175, "bigger", smallerO, { size: 28, col: P.good, anchor: "middle" });
    }
    /* the tenths digit sits at x0 + (ones col + gap) + (point col + gap) + half
       the digit width: x0 + 88 + 44 + 39 = x0 + 171, for both cards */
    var colO = on(t, cTenthsCol, 0.6);
    if (colO > 0) {
      out += G(C(Lx + 171, Y + 48, 46, "none", P.gold, 4), { opacity: colO });
      out += G(C(Rx + 171, Y + 48, 46, "none", P.gold, 4), { opacity: colO });
      out += MK.pill(584, 340, "the tenths column decides it", colO, { size: 26, col: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: moving the digits ===============================================
     3.5 x 10 = 35. The point (drawn as a fixed gold line) never moves; the two
     digits slide one column to the left through it, which is the whole of what
     "x10" does. Hand drawn: no library picture slides a digit between columns.
     Division (beats 4) is a short reveal of the three column counts instead,
     with MK.list, since the same slide reversed adds little in the time left. */
  var PTW_M_PX = 560, PTW_M_CW = 108;
  function ptwMovingChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cZero = c(0, "zero"), cWhole = c(0, "whole");
    var cThreeFive = c(1, "threeFive"), cNotThat = c(1, "notThat");
    var cMoves = c(2, "moves");
    var cStays = c(3, "stays");
    var cDividing = c(4, "dividing"), cOneCol = c(4, "oneCol"), cTwoCol = c(4, "twoCol"), cThreeCol = c(4, "threeCol");
    var PX = PTW_M_PX, CW = PTW_M_CW, Y = 120, out = "";

    var moveOn = ptwOnly(t, scene, 0) + ptwOnly(t, scene, 1) + ptwOnly(t, scene, 2) + ptwOnly(t, scene, 3);
    if (moveOn > 0.02) {
      var shift = ptwStep(t, cMoves, 1.1);
      /* the fixed point: a gold line through the whole column band */
      var stayO = 0.35 + 0.65 * on(t, cStays, 0.6);
      out += L(PX, Y - 20, PX, Y + 130, P.gold, 4, { opacity: stayO, "stroke-dasharray": shift > 0.02 && shift < 0.98 ? "" : null });
      out += Tx(PX, Y - 34, "the point", "lab mid muted readable", "middle", { opacity: on(t, cStays, 0.6) });

      var x3s = PX - 0.5 * CW, x3e = PX - 1.5 * CW, x3 = lerp(x3s, x3e, shift);
      var x5s = PX + 0.5 * CW, x5e = PX - 0.5 * CW, x5 = lerp(x5s, x5e, shift);
      out += G(ptwTile(x3 - 39, Y, "3", true), {});
      out += G(ptwTile(x5 - 39, Y, "5", true), { opacity: 1 - 0.0 });

      var addZeroO = on(t, cZero, 0.5) * (1 - on(t, cThreeFive, 0.5));
      if (addZeroO > 0) {
        out += G(ptwTile(x5s + CW - 39, Y, "0", false), { opacity: addZeroO * 0.55 });
        out += MK.cross(x5s + CW, Y + 48, 40, popIn(t, cWhole, 0.4) * addZeroO, P.bad);
      }
      var labelO = on(t, cThreeFive, 0.5);
      if (labelO > 0) out += MK.pill(950, 90, "3.5 x 10", labelO * (1 - on(t, cNotThat, 0.4)), { size: 28, col: P.teal });
      var ansO = on(t, cNotThat, 0.5);
      if (ansO > 0) {
        out += MK.pill(950, 90, "= 35", ansO, { size: 30, col: P.good });
        out += MK.pill(950, 150, "not 3.50", ansO, { size: 24, col: P.bad });
      }
      var movesO = on(t, cMoves, 0.6);
      if (movesO > 0) out += MK.pill(950, 220, "one column left", movesO, { size: 24, col: P.gold });
      return svg(out);
    }

    /* beat 4: dividing goes backwards - a short list of the column counts */
    var rows = [
      { text: "divide by 10: 1 column", at: cOneCol },
      { text: "divide by 100: 2 columns", at: cTwoCol },
      { text: "divide by 1000: 3 columns", at: cThreeCol }
    ];
    out += MK.pill(584, 90, "Dividing goes backwards", on(t, cDividing, 0.5), { size: 30, col: P.blue, anchor: "middle" });
    out += MK.list(430, 190, rows, t, { lh: 62, cls: "lab big" });
    return svg(out);
  }
