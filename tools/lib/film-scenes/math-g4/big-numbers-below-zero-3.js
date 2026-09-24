  /* ==== Big Numbers and Below Zero, part 3 ====================================
     The three chapters below zero and about rounding, and "What you now know".

     THE DIRECTION IS THE WHOLE POINT OF THIS FILM, so it is stated once here
     and every drawing below obeys it: on the thermometer, colder is DOWN
     (bnTY grows as the temperature falls, so minus 10 is at the bottom); on
     the number line, smaller is LEFT (ART.numberLine's own X grows with the
     value, so minus 9 sits left of minus 2 and every jump drawn to the left
     is a jump to a smaller number). */

  /* ---- chapter: below zero -------------------------------------------------
     The lesson's own thermometer task: 3 degrees, 5 degrees colder, counted
     down one step at a time through zero to minus 2. The mercury falls by one
     step for each counted number, so the picture can never be more or fewer
     steps than the voice counts. */
  function bnBelowZeroChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cBelow = c(0, "below"), cTherm = c(0, "therm");
    var cThree = c(1, "three"), cColder = c(1, "colder");
    var cCount = c(2, "count");
    var steps = [c(2, "s2"), c(2, "s1"), c(2, "s0"), c(2, "m1"), c(2, "m2")];
    var vals = [2, 1, 0, -1, -2];
    var cNow = c(3, "now"), cSteps = c(3, "steps");
    var cZero = c(4, "zero"), cThrough = c(4, "through"), cStop = c(4, "stop");
    var out = "", k;

    /* the reading falls one whole step for each number counted */
    var temp = 3;
    for (k = 0; k < 5; k++) temp -= on(t, steps[k], 0.32);
    var shown = Math.round(temp);

    var zeroLit = Math.max(on(t, cBelow, 0.5) * bnOnly(t, scene, 0), on(t, cZero, 0.4) * bnOnly(t, scene, 4));
    out += bnTherm(temp, inAt(t, scene.start, 0.6), zeroLit);
    out += R(96, 8, 300, 416, 20, "none", P.teal, 3,
      { opacity: on(t, cTherm, 0.45) * bnOnly(t, scene, 0) * (0.6 + 0.4 * breathe(t)) });

    /* the reading, and a glow on it for "It is 3 degrees" */
    out += MK.glow(790, 134, 112, P.accent, on(t, cThree, 0.5) * bnOnly(t, scene, 1) * (0.7 + 0.3 * breathe(t)));
    out += bnReading(790, 132, shown, inAt(t, scene.start, 0.7));

    /* "5 degrees colder": an arrow down the fall it is about to make */
    var cold = on(t, cColder, 0.6) * bnOnly(t, scene, 1);
    if (cold > 0) {
      out += MK.arrow(340, bnTY(3), 340, bnTY(-2), cold, P.teal, 7);
      out += MK.pill(500, 182, "5 colder", cold, { size: 24, col: P.teal });
    }

    /* the counted numbers, a card each, left to right as they are said */
    var rowO = bnFrom(t, scene, 2);
    if (rowO > 0) {
      out += MK.pill(790, 258, "count down", on(t, cCount, 0.4) * bnOnly(t, scene, 2), { size: 20, col: P.muted });
      for (k = 0; k < 5; k++) {
        var p = popIn(t, steps[k], 0.4) * rowO;
        if (p <= 0) continue;
        var x = 514 + k * 114, col = vals[k] < 0 ? P.teal : vals[k] === 0 ? P.muted : P.gold;
        out += G(R(x, 300, 96, 72, 14, P.cell, col, 3) +
          Tx(x + 48, 352, bnMinus(vals[k]), "lab", "middle", { "font-size": 40, fill: P.ink }),
          { opacity: Math.min(1, p), transform: around(x + 48, 336, Math.min(p, 1.08)) });
      }
    }

    /* "minus 2 degrees, two steps below zero" */
    out += MK.tick(960, 132, 26, popIn(t, cNow, 0.4) * bnOnly(t, scene, 3));
    var st = on(t, cSteps, 0.5) * bnOnly(t, scene, 3);
    if (st > 0) {
      out += R(850, 294, 222, 84, 16, "none", P.teal, 3, { opacity: st });
      out += MK.pill(960, 410, "2 steps below zero", st, { size: 22, col: P.teal });
    }

    /* "a number you pass through, not a place where counting stops" */
    var last = bnOnly(t, scene, 4);
    if (last > 0) {
      out += MK.arrow(340, bnTY(3), 340, bnTY(-2), on(t, cThrough, 0.7) * last, P.gold, 7);
      out += MK.pill(500, 254, "straight through", on(t, cThrough, 0.5) * last, { size: 22, col: P.gold });
      var stop = on(t, cStop, 0.4) * last;
      if (stop > 0) {
        out += MK.pill(830, 236, "counting stops", stop, { size: 24, col: P.bad, ink: P.bad });
        out += MK.cross(676, 236, 32, popIn(t, cStop == null ? null : cStop + 0.25, 0.4) * last);
      }
    }
    return svg(out);
  }

  /* ---- chapter: below zero, in order ---------------------------------------
     ART's number line from minus 10 to 10, the lesson's own range, drawn at
     1:1 so a value has a place in the film's own coordinates. Everything
     above and below the line is drawn against bnOX, so nothing can disagree
     with the line about which side of zero a number is on. */
  var BN_O_X = 34, BN_O_Y = 170, BN_O_W = 1100;
  function bnOX(v) { return BN_O_X + 36 + ((v + 10) / 20) * (BN_O_W - 72); }
  var BN_O_LINE_Y = BN_O_Y + 46;

  function bnOrderLine(marks) {
    return ART.place(ART.numberLine({ from: -10, to: 10, step: 1, labelEvery: 5, width: BN_O_W, marks: marks }),
      BN_O_X, BN_O_Y, BN_O_W, 108);
  }
  /* a bracket under the line, from zero out to v, saying how many steps that is */
  function bnSteps(v, y, text, u, col) {
    if (!(u > 0)) return "";
    var a = bnOX(0), b = bnOX(v);
    return L(a, y - 14, a, y + 14, col, 3, { opacity: u }) +
      MK.arrow(a, y, lerp(a, b, u), y, 1, col, 5) +
      MK.pill((a + b) / 2, y + 34, text, u, { size: 22, col: col });
  }

  /* beat 1 ("That keeps working below zero too. Minus 2 sits...") split in
     two for the lead's length note: "below" stays on the new short beat 1,
     "m2"/"m9" moved to the new beat 2, and "big"/"nine"/"two" shifted from
     beat 2 to beat 3. The "below" cue used to be declared and never read -
     tools/check-ehel-film-cues.js would have caught it - so it now glows
     the negative half of the line while "below zero" is said. */
  function bnOrderCompare(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cLine = c(0, "line"), cRight = c(0, "right"), cBigger = c(0, "bigger");
    var cBelow = c(1, "below");
    var cM2 = c(2, "m2"), cM9 = c(2, "m9");
    var cBig = c(3, "big"), cNine = c(3, "nine"), cTwo = c(3, "two");
    var marks = [], out = "";
    if (on(t, cM9, 0.3) > 0) marks.push({ at: -9, label: "−9", colour: "teal" });
    if (on(t, cM2, 0.3) > 0) marks.push({ at: -2, label: "−2", colour: "accent" });
    out += bnOrderLine(marks);
    /* "On a number line": the line itself is what is being named */
    out += R(BN_O_X + 1, BN_O_Y + 1, BN_O_W - 2, 106, 20, "none", P.gold, 3,
      { opacity: on(t, cLine, 0.4) * (1 - on(t, cRight, 0.4)) * (0.6 + 0.4 * breathe(t)) });
    /* further right always means bigger */
    out += MK.arrow(bnOX(-6), 104, bnOX(9), 104, on(t, cRight, 0.8), P.gold, 7);
    out += MK.pill(bnOX(8), 62, "bigger", on(t, cBigger, 0.4), { size: 26, col: P.gold });
    /* "That keeps working below zero": the line's negative half glows */
    var belowGlow = on(t, cBelow, 0.4) * bnOnly(t, scene, 1);
    if (belowGlow > 0) out += R(BN_O_X + 1, BN_O_Y + 1, bnOX(0) - BN_O_X - 1, 106, 20, "none", P.teal, 3,
      { opacity: belowGlow * (0.6 + 0.4 * breathe(t)) });
    /* minus 2 is the bigger of the two */
    out += MK.tick(bnOX(-2), 140, 22, popIn(t, cBig, 0.4));
    out += bnSteps(-2, 306, "2 steps below", on(t, cTwo, 0.7), P.accent);
    out += bnSteps(-9, 376, "9 steps below", on(t, cNine, 0.7), P.teal);
    return out;
  }

  var BN_ORDERED = [-8, -3, 0, 5];
  function bnOrderSort(scene, t) {
    var keys = ["a", "b", "c", "d"], marks = [], out = "", k;
    var cSmall = sc(scene, 4, "small");
    for (k = 0; k < 4; k++) {
      if (on(t, sc(scene, 4, keys[k]), 0.3) > 0)
        marks.push({ at: BN_ORDERED[k], label: bnMinus(BN_ORDERED[k]), colour: k === 3 ? "good" : "accent" });
    }
    out += bnOrderLine(marks);
    out += MK.pill(bnOX(-7), 100, "smallest first", on(t, cSmall, 0.4), { size: 26, col: P.gold });
    /* the four, written out in order under the line */
    var bw = 120, gap = 28, x0 = 584 - (4 * bw + 3 * gap) / 2;
    for (k = 0; k < 4; k++) {
      var p = popIn(t, sc(scene, 4, keys[k]), 0.4), x = x0 + k * (bw + gap);
      if (p <= 0) continue;
      out += G(R(x, 322, bw, 84, 16, P.cell, k === 3 ? P.good : P.accent, 3) +
        Tx(x + bw / 2, 380, bnMinus(BN_ORDERED[k]), "lab", "middle", { "font-size": 42, fill: P.ink }),
        { opacity: Math.min(1, p), transform: around(x + bw / 2, 364, Math.min(p, 1.08)) });
      if (k) out += Tx(x - gap / 2, 378, "<", "lab", "middle", { "font-size": 34, fill: P.muted, opacity: Math.min(1, p) });
    }
    return out;
  }
  /* a negative written the way the lesson writes it */
  function bnMinus(v) { return v < 0 ? "−" + (-v) : String(v); }

  function bnOrderChapter(scene, beat, t, i) {
    var swap = bnFrom(t, scene, 4), out = "";
    if (swap < 1) out += G(bnOrderCompare(scene, t), { opacity: 1 - swap });
    if (swap > 0) out += G(bnOrderSort(scene, t), { opacity: swap });
    return svg(out);
  }

  /* ---- chapter: which one is it nearer? ------------------------------------
     4,600 to 4,700 in tens, the lesson's own rounding example. The two jumps
     are drawn as straight arrows above the line, so their LENGTHS are the
     thing compared: 30 is visibly shorter than 70. */
  var BN_R2_X = 84, BN_R2_Y = 200, BN_R2_W = 1000;
  function bnRX(v) { return BN_R2_X + 36 + ((v - 4600) / 100) * (BN_R2_W - 72); }

  function bnRoundChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cAsk = c(0, "ask"), cNear0 = c(0, "near");
    var cNum = c(1, "num"), cHund = c(1, "hund"), cNb = c(1, "nb");
    var cPast = c(2, "past"), cShort = c(2, "short");
    var cDown = c(3, "down"), cNear = c(3, "near");
    var cHalf = c(4, "half"), cUp = c(4, "up");
    var out = "", marks = [];

    /* the marker: 4,630, and on the last beat 4,650 */
    var half = on(t, cHalf, 0.7);
    var at = lerp(4630, 4650, half), lab = half < 0.5 ? "4,630" : "4,650";
    if (on(t, cNum, 0.3) > 0) marks.push({ at: at, label: lab, colour: "accent" });
    out += ART.place(ART.numberLine({ from: 4600, to: 4700, step: 10, labelEvery: 50, width: BN_R2_W, marks: marks }),
      BN_R2_X, BN_R2_Y, BN_R2_W, 108);

    /* the question */
    var ask = on(t, cAsk, 0.4) * (1 - on(t, cNum, 0.4));
    if (ask > 0) {
      out += MK.qmark(584, 86, 30, ask);
      out += MK.pill(584, 148, "which neighbour is nearer?", on(t, cNear0, 0.4) * ask, { size: 24, col: P.gold });
    }
    /* "to the nearest hundred", and the two neighbours */
    out += MK.pill(880, 86, "nearest hundred", on(t, cHund, 0.4), { size: 24, col: P.gold });
    var nb = on(t, cNb, 0.5);
    out += MK.pill(bnRX(4600), 356, "4,600", nb, { size: 26, col: P.muted });
    out += MK.pill(bnRX(4700), 356, "4,700", nb, { size: 26, col: P.muted });

    /* 30 past, and 70 short: two arrows whose lengths are the comparison */
    var jumps = bnOnly(t, scene, 2) + bnOnly(t, scene, 3);
    var past = on(t, cPast, 0.7) * Math.min(1, jumps), shortJ = on(t, cShort, 0.7) * Math.min(1, jumps);
    if (past > 0) {
      out += MK.arrow(bnRX(4600), 186, bnRX(4630), 186, past, P.teal, 6);
      out += MK.pill((bnRX(4600) + bnRX(4630)) / 2, 152, "30", past, { size: 24, col: P.teal });
    }
    if (shortJ > 0) {
      out += MK.arrow(bnRX(4630), 120, bnRX(4700), 120, shortJ, P.accent, 6);
      out += MK.pill((bnRX(4630) + bnRX(4700)) / 2, 86, "70", shortJ, { size: 24, col: P.accent });
    }
    /* it rounds down to 4,600 */
    var down = on(t, cDown, 0.7) * bnOnly(t, scene, 3);
    if (down > 0) {
      var win = on(t, cNear, 0.4) * bnOnly(t, scene, 3);
      out += MK.arrow(bnRX(4630), 404, bnRX(4600) + 34, 404, down, P.good, 7);
      out += MK.pill(bnRX(4600), 356, "4,600", win, { size: 26, col: P.good, ink: P.good });
      out += MK.tick(bnRX(4600) + 116, 356, 24, popIn(t, cNear, 0.4) * bnOnly(t, scene, 3));
    }
    /* exactly halfway rounds up */
    var last = bnOnly(t, scene, 4);
    if (last > 0) {
      out += L(bnRX(4650), 150, bnRX(4650), 232, P.gold, 3, { "stroke-dasharray": "10 8", opacity: on(t, cHalf, 0.5) * last });
      out += MK.pill(bnRX(4650), 122, "halfway", on(t, cHalf, 0.4) * last, { size: 24, col: P.gold });
      var up = on(t, cUp, 0.7) * last;
      out += MK.arrow(bnRX(4650), 404, bnRX(4700) - 34, 404, up, P.good, 7);
      out += MK.pill(bnRX(4700), 356, "4,700", up, { size: 26, col: P.good, ink: P.good });
      out += MK.tick(bnRX(4700) - 116, 356, 24, popIn(t, cUp == null ? null : cUp + 0.35, 0.4) * last);
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------- */
  function bnZeroCard(cx, cy, size) {
    var w = size * 0.74;
    return R(cx - w / 2, cy - size / 2, w, size, 10, "#1B3A52", P.gold, 3) +
      Tx(cx, cy + size * 0.24, "0", "lab", "middle", { "font-size": size * 0.72, fill: P.gold });
  }
  var BN_RECAP = MK.recapKind([
    { beat: 0, at: "col", title: "Place value", sub: "the column decides its worth", pic: "\u{1F3F7}️" },
    { beat: 0, at: "zero", title: "A zero", sub: "holds its column open", pic: bnZeroCard },
    { beat: 1, at: "regroup", title: "Regrouping", sub: "same value, stored differently", pic: "\u{1F504}" },
    { beat: 2, at: "ten", title: "Times 10", sub: "every digit moves one place left", pic: "⬅️" },
    { beat: 3, at: "below", title: "Below zero", sub: "further right is bigger", pic: "❄️" },
    { beat: 3, at: "round", title: "Rounding", sub: "which neighbour is nearer", pic: "\u{1F3AF}" }
  ], { goBeat: 3, goAt: "round" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What each digit is worth", "Regrouping, and times 10 and 100", "Counting and ordering below zero"] }),
    worth: bnWorthChapter, regroup: bnRegroupChapter, tentimes: bnTenTimesChapter,
    belowzero: bnBelowZeroChapter, order: bnOrderChapter, round: bnRoundChapter,
    recap: BN_RECAP
  };
