  /* ==== Adding and Taking Away, part 2 ========================================
     The chapters "How many more?", "Pairs that make ten" and "Doubles".
     Continues tools/lib/film-scenes/math-g1/adding-and-taking-away.js, in the
     same scope: ataDots, ataFit, ataAt, ataLine, ataOnly, ataFrom, ataStep and
     ataBig are defined there.

     Counted against their own sentences: 8 red and 5 blue pair off into FIVE
     pairs with THREE red left over; ten counters split after six into 6 and 4;
     a ten frame of 7 has exactly THREE empty cells ringed; the ladybird has
     THREE spots on each side and SIX altogether; double seven fills one frame
     of ten with FOUR over, which is fourteen. */

  var ATA_BLUE = "#3E7BD8";

  /* ==== chapter: How many more? ======================================================
     The lesson's own difference question, its first pair: 8 red and 5 blue.
     Lining the rows up so that each red has a blue underneath is what makes
     the answer something to SEE - the three at the end with nobody below. */
  var ATA_M = { x: 300, pitch: 60, r: 24, ay: 140, by: 300, n: 8, m: 5 };

  function ataMoreChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMore = c(0, "more"), cAway = c(0, "away"), cNot = c(0, "not");
    var cEight = c(1, "eight"), cFive = c(1, "five");
    var cMatch = c(2, "match"), cPairs = c(2, "pairs");
    var cThree = c(3, "three"), cPartner = c(3, "partner"), cDiff = c(3, "diff");
    var out = "", k, x;

    var rowsIn = on(t, cMore, 0.6);
    var matched = tally(t, cMatch, 5, 1.4) * (cMatch == null ? 0 : 1);
    var extra = tally(t, cThree, 3, 0.9) * (cThree == null ? 0 : 1);

    out += G(ataDots(ATA_M.n, ATA_M.x, ATA_M.ay, ATA_M.pitch, ATA_M.r, function (q) {
      return { fill: ART.C.bad, ring: q >= ATA_M.m && q - ATA_M.m < extra ? 1 : 0 };
    }), { opacity: rowsIn });
    out += G(ataDots(ATA_M.m, ATA_M.x, ATA_M.by, ATA_M.pitch, ATA_M.r, function () {
      return { fill: ATA_BLUE };
    }), { opacity: rowsIn });

    /* beat 0: this is a subtraction question wearing the word "more" */
    var b0 = ataOnly(t, scene, 0);
    if (b0 > 0) {
      out += MK.qmark(940, 220, 34, on(t, cAway, 0.5) * b0);
      /* "not an adding one": the word adding, struck through. A cross drawn
         on top of a plus sign reads as neither of them. */
      var nop = on(t, cNot, 0.45);
      out += G(MK.pill(940, 336, "adding", popIn(t, cNot, 0.4), { size: 30, col: P.bad, ink: P.bad }) +
        (nop > 0 ? L(864, 360, lerp(864, 1016, nop), lerp(360, 312, nop), P.bad, 6) : ""), { opacity: b0 });
    }

    /* how many are in each row, said and shown */
    out += MK.pill(196, ATA_M.ay, "8", popIn(t, cEight, 0.4), { size: 38, col: P.bad });
    out += MK.pill(196, ATA_M.by, "5", popIn(t, cFive, 0.4), { size: 38, col: ATA_BLUE });

    /* "Match them up in pairs": one line per pair, drawn as each pair is made */
    for (k = 0; k < ATA_M.m; k++) {
      if (k >= matched) continue;
      x = ataDotX(ATA_M.x, ATA_M.pitch, k);
      var u = clamp((matched - k) * 1.3, 0, 1);
      out += L(x, ATA_M.ay + ATA_M.r + 8, x, lerp(ATA_M.ay + ATA_M.r + 8, ATA_M.by - ATA_M.r - 8, u), P.teal, 5, { "stroke-dasharray": "10 8" });
    }
    out += MK.pill(940, 220, "5 pairs", on(t, cPairs, 0.4) * (1 - on(t, cDiff, 0.5)), { size: 32, col: P.teal });

    /* "no partner": the three at the end of the red row, with an empty place below */
    if (extra > 0) {
      for (k = ATA_M.m; k < ATA_M.m + Math.min(3, extra); k++) {
        x = ataDotX(ATA_M.x, ATA_M.pitch, k);
        out += C(x, ATA_M.by, ATA_M.r, "none", P.muted, 3, { "stroke-dasharray": "7 6", opacity: on(t, cPartner, 0.5) * 0.9 });
        out += MK.cross(x, ATA_M.by, 20, popIn(t, ataStep(cPartner, k - ATA_M.m, 3, 0.6), 0.35));
      }
      out += MK.pill(660, 62, "3 with no partner", on(t, cPartner, 0.4), { size: 26, col: P.gold });
    }
    out += MK.pill(940, 220, "8 − 5 = 3", on(t, cDiff, 0.45), { size: 36, col: P.gold });
    return svg(out);
  }

  /* ==== chapter: Pairs that make ten =================================================
     The lesson's "Making 10" step: ten in a row, split anywhere, and both
     sides counted. Then its "Pairs that make 10" step, where the EMPTY cells
     of a ten frame are the number you still need. */
  var ATA_B = { x: 300, y: 150, pitch: 60, r: 24 };

  function ataBondsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTwo = c(0, "two"), cTen = c(0, "ten"), cBond = c(0, "bond");
    var cRow = c(1, "ten"), cSplit = c(1, "split");
    var cSix = c(2, "six"), cFour = c(2, "four"), cMake = c(2, "make");
    var cSeven = c(3, "seven"), cSpaces = c(3, "spaces"), cMake2 = c(3, "make");
    var out = "";

    var frameIn = ataFrom(t, scene, 3);
    var rowO = Math.max(on(t, cTwo, 0.5), on(t, cRow, 0.4)) * (1 - frameIn);

    if (rowO > 0) {
      var split = on(t, cSplit, 0.6), gone = on(t, cSplit, 0.5);
      var sideL = on(t, cSix, 0.45), sideR = on(t, cFour, 0.45);
      out += G(ataDots(10, ATA_B.x, ATA_B.y, ATA_B.pitch, ATA_B.r, function (k) {
        /* grey while they are only ten; then each side takes the colour the
           bar model below gives its own part, so the two pictures agree */
        var col = ART.C.muted;
        if (k < 6 && sideL > 0.5) col = ART.C.teal;
        if (k >= 6 && sideR > 0.5) col = ART.C.accent;
        return { fill: col, dx: split * (k < 6 ? -16 : 16) };
      }), { opacity: rowO });
      if (split > 0) out += L(630, ATA_B.y - 62, 630, lerp(ATA_B.y - 62, ATA_B.y + 62, split), P.gold, 5, { opacity: rowO });
      /* beat 0: all ten together, and the name for a pair that makes them */
      out += G(MK.pill(584, 62, "ten altogether", on(t, cTen, 0.4) * (1 - gone), { size: 26, col: P.gold }) +
        MK.pill(584, 268, "number bond", on(t, cBond, 0.4) * (1 - gone), { size: 28, col: P.teal }), { opacity: rowO });
      /* the two sides, counted */
      out += MK.pill(444, 62, "6", popIn(t, cSix, 0.4) * rowO, { size: 38, col: P.teal });
      out += MK.pill(768, 62, "4", popIn(t, cFour, 0.4) * rowO, { size: 38, col: P.accent });
      /* "Six and four make ten": the lesson's part-part-whole, drawn to scale */
      out += ataAt(ART.barModel({ whole: 10, parts: [6, 4], label: false }), 584, 320, 1.0, on(t, cMake, 0.5) * rowO);
    }

    /* beat 3: a ten frame of seven, and the three spaces that are still empty */
    if (frameIn > 0) {
      var f = ataFit(ART.tenFrame(7, { colour: "accent", label: false }), 584, 160, 1.6);
      var inner = f.svg, k, ringed = tally(t, cSpaces, 3, 0.8) * (cSpaces == null ? 0 : 1);
      /* the empty cells of a frame of seven are k = 7, 8, 9: row 1, columns 2, 3 and 4 */
      for (k = 0; k < 3; k++) {
        if (k >= ringed) continue;
        inner += C(f.X(46 + 44 * (k + 2)), f.Y(90), 19 * f.s, "none", P.gold, 5,
          { opacity: popIn(t, ataStep(cSpaces, k, 3, 0.8), 0.3) });
      }
      inner += MK.pill(944, 118, "7 counters", on(t, cSeven, 0.4) * (1 - on(t, cMake2, 0.5)), { size: 28, col: P.accent });
      inner += MK.pill(944, 196, "3 spaces", on(t, cSpaces, 0.4) * (1 - on(t, cMake2, 0.5)), { size: 28, col: P.gold });
      inner += MK.pill(584, 350, "7 + 3 = 10", on(t, cMake2, 0.45), { size: 40, col: P.gold });
      out += G(inner, { opacity: clamp(frameIn, 0, 1) });
    }
    return svg(out);
  }

  /* ==== chapter: Doubles =============================================================
     The lesson's ladybird, which has the same number of spots on each side.
     The library has no ladybird, so it is drawn here (and reported). Three
     spots a side, six altogether - all six are counted on screen. Then the
     lesson's own bigger double, seven and seven, in its two ten frames. */
  function ataLadybird(t, cx, cy, o, mirror) {
    if (!(o > 0)) return "";
    var body = E(cx, cy + 24, 140, 105, "#C4453A", "#7E2A22", 5);
    var head = C(cx, cy - 100, 44, "#3A4A54", "#93AABE", 4);
    var eyes = C(cx - 18, cy - 112, 7, "#FFFFFF") + C(cx + 18, cy - 112, 7, "#FFFFFF");
    var feel = L(cx - 22, cy - 138, cx - 40, cy - 162, "#93AABE", 5) + L(cx + 22, cy - 138, cx + 40, cy - 162, "#93AABE", 5);
    var line = mirror > 0 ? L(cx, cy - 76, cx, lerp(cy - 76, cy + 126, mirror), "#FFFFFF", 5, { opacity: 0.9 * mirror, "stroke-dasharray": "12 9" }) : "";
    return G(feel + body + line + head + eyes, { opacity: clamp(o, 0, 1) });
  }
  /* the six spots, three a side, in the order the film counts them */
  var ATA_SPOTS = [[-62, -38], [-80, 22], [-50, 78], [62, -38], [80, 22], [50, 78]];

  function ataDoublesChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDouble = c(0, "double"), cSame = c(0, "same"), cBoth = c(0, "both");
    var cThree = c(1, "three"), cEach = c(1, "each");
    var cAnd = c(2, "and"), cCount = c(2, "count"), cSix = c(2, "six");
    var cDbl = c(3, "dbl"), cNot = c(3, "not");
    var cSeven = c(4, "seven"), cFill = c(4, "fill"), cOver = c(4, "over"), cFourteen = c(4, "fourteen");
    var cx = 470, cy = 210, out = "", k;

    var bugIn = popIn(t, cDouble, 0.5) * (1 - ataFrom(t, scene, 4));
    if (bugIn > 0) {
      out += ataLadybird(t, cx, cy, Math.min(1, bugIn), on(t, cSame, 0.6));
      /* "on both sides": each half glows */
      var bo = on(t, cBoth, 0.5) * ataOnly(t, scene, 0);
      if (bo > 0) out += MK.glow(cx - 76, cy + 20, 80, P.gold, bo * 0.7) + MK.glow(cx + 76, cy + 20, 80, P.gold, bo * 0.7);
      /* the spots: three on the left as "three spots" is said, three on the
         right on "each side", so what appears is exactly what is being said */
      var left = tally(t, cThree, 3, 0.8) * (cThree == null ? 0 : 1);
      var right = tally(t, cEach, 3, 0.8) * (cEach == null ? 0 : 1);
      var counted = tally(t, cCount, 6, 1.9) * (cCount == null ? 0 : 1);
      for (k = 0; k < 6; k++) {
        if (!(k < 3 ? k < left : k - 3 < right)) continue;
        var sx = cx + ATA_SPOTS[k][0], sy = cy + ATA_SPOTS[k][1];
        var at = k < 3 ? ataStep(cThree, k, 3, 0.8) : ataStep(cEach, k - 3, 3, 0.8);
        out += MK.pop(C(sx, sy, 22, "#26333A"), sx, sy, popIn(t, at, 0.35) * Math.min(1, bugIn));
        if (counted > k) out += C(sx, sy, 31, "none", P.gold, 5,
          { opacity: popIn(t, ataStep(cCount, k, 6, 1.9), 0.3) * (1 - on(t, cSix, 0.6)) });
      }
      /* "and three more spots": from one side to the other, UNDER the
         ladybird - across the top it ran straight through its antennae */
      out += MK.arrow(cx - 74, cy + 158, cx + 74, cy + 158, on(t, cAnd, 0.6) * ataOnly(t, scene, 2), P.gold, 6);
      /* the running count, then the answer, then the lesson's own misconception */
      if (counted > 0 && (cSix == null || t < cSix)) out += ataCount(880, 186, counted, ataStep(cCount, counted - 1, 6, 1.9), t, P.gold);
      out += ataBig(880, 186, 6, popIn(t, cSix, 0.4) * (1 - on(t, cDbl, 0.5)), P.good);
      out += MK.pill(880, 262, "double 3 = 6", on(t, cDbl, 0.45), { size: 34, col: P.good });
      var no = popIn(t, cNot, 0.4);
      if (no > 0) out += MK.pill(844, 350, "4", no, { size: 34, col: P.bad, ink: P.bad }) + MK.cross(924, 350, 24, no);
      out += MK.pill(880, 96, "the same again", on(t, cSame, 0.4) * ataOnly(t, scene, 0), { size: 26, col: P.teal });
    }

    /* beat 4: the lesson's bigger double, seven and seven, in two ten frames */
    var b4 = ataFrom(t, scene, 4);
    if (b4 > 0) {
      var f = ataFit(ART.tenFrame(14, { frames: 2, split: 7, colour: "accent", second: "teal", label: false }), 584, 200, 1.3);
      var inner = f.svg;
      /* "fills one ten frame": the first frame of ten is ringed */
      var fill = on(t, cFill, 0.6) * (1 - on(t, cFourteen, 0.6));
      if (fill > 0) inner += R(f.X(20) - 5, f.Y(20) - 5, 228 * f.s + 10, 96 * f.s + 10, 14, "none", P.gold, 5, { opacity: fill });
      /* "with four left over": the four counters in the second frame */
      var over = tally(t, cOver, 4, 0.9) * (cOver == null ? 0 : 1);
      for (var q = 0; q < 4; q++) {
        if (q >= over) continue;
        inner += C(f.X(292 + 44 * q), f.Y(46), 19 * f.s, "none", P.gold, 5,
          { opacity: popIn(t, ataStep(cOver, q, 4, 0.9), 0.3) * (1 - on(t, cFourteen, 0.6)) });
      }
      inner += MK.pill(584, 70, "7 and 7", on(t, cSeven, 0.4), { size: 30, col: P.accent });
      inner += MK.pill(584, 352, "10 and 4 is 14", on(t, cFourteen, 0.45), { size: 40, col: P.gold });
      out += G(inner, { opacity: clamp(b4, 0, 1) });
    }
    return svg(out);
  }
