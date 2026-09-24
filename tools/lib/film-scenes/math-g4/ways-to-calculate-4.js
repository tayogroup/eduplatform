  /* ==== Ways to Calculate, part 4: factors and multiples, and the recap ======= */

  /* ---- factors and multiples: 24, and the rectangles it makes --------------- */
  /* where ART.array(4, 6) draws its two counts, in the drawing's coordinates:
     the 6 above the block and the 4 beside it */
  var WTC_ARR = { x: 70, y: 92, s: 1.2 };
  function wtcArrF(vx, vy) { return [WTC_ARR.x + vx * WTC_ARR.s, WTC_ARR.y + vy * WTC_ARR.s]; }
  var WTC_PAIRS = [
    { text: "1 × 24 = 24", y: 190, cue: "one" },
    { text: "2 × 12 = 24", y: 264, cue: "two" },
    { text: "3 × 8 = 24", y: 338, cue: "three" }
  ];

  function wtcFactorsChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cLay = c(0, "lay"), cRect = c(0, "rect");
    var cMult = c(1, "mult"), cPair = c(1, "pair");
    var cStop = c(3, "stop"), cKeep = c(3, "keep"), cRepeat = c(3, "repeat");
    var cNames = c(4, "names"), cFactor = c(4, "factor"), cMultiple = c(4, "multiple");
    var gB = into(t, scene.first + 4), gA = 1 - gB, out = "", k;

    /* ---- 24 counters, 4 rows of 6, and every pair that makes 24 ---- */
    if (gA > 0) {
      var a = "", lo = popIn(t, cLay, 0.5);
      if (lo > 0) {
        var acx = WTC_ARR.x + 324 * WTC_ARR.s / 2, acy = WTC_ARR.y + 278 * WTC_ARR.s / 2;
        a += G(ART.place(ART.array(4, 6, { label: true, colour: "teal" }),
          WTC_ARR.x, WTC_ARR.y, 324 * WTC_ARR.s, 278 * WTC_ARR.s),
          { transform: around(acx, acy, Math.min(lo, 1.1)), opacity: Math.min(1, lo) });
      }
      /* "4 rows of 6": the two counts the array already writes */
      var ro = on(t, cRect, 0.5);
      var six = wtcArrF(184, 28), four = wtcArrF(34, 142);
      a += wtcRing(six[0], six[1], 24, ro) + wtcRing(four[0], four[1], 24, ro);

      a += MK.pill(820, 44, "factor pair", on(t, cPair, 0.45), { size: 28, col: P.gold });
      a += MK.pill(820, 116, "4 × 6 = 24", popIn(t, cMult, 0.45), { size: 32, col: P.teal });
      for (k = 0; k < WTC_PAIRS.length; k++) {
        a += MK.pill(820, WTC_PAIRS[k].y, WTC_PAIRS[k].text, popIn(t, c(2, WTC_PAIRS[k].cue), 0.4),
          { size: 32, col: P.teal });
      }
      /* "do not stop at the first pair" */
      var st = on(t, cStop, 0.45) * (1 - on(t, cKeep, 0.45));
      if (st > 0) a += R(699, 83, 242, 66, 33, "none", P.gold, 3, { opacity: st });
      a += MK.arrow(632, 120, 632, 350, on(t, cKeep, 0.7), P.gold, 6);
      /* "until they repeat": 6 x 4 is the pair already found, the other way up */
      var rp = popIn(t, cRepeat, 0.45);
      a += MK.pill(820, 406, "6 × 4 = 24", Math.min(1, rp), { size: 32, col: P.line, ink: P.muted });
      if (rp > 0) a += L(952, 380, 952, 148, P.muted, 2.5,
        { "stroke-dasharray": "9 7", opacity: Math.min(1, rp) });
      out += G(a, { opacity: clamp(gA, 0, 1) });
    }

    /* ---- one fact, two names ---- */
    if (gB > 0) {
      var b = "", no = popIn(t, cNames, 0.45);
      b += wtcTile(330, 210, 120, 120, "4", 64, no, P.teal);
      b += wtcTile(800, 210, 170, 120, "24", 64, no, P.plum);
      b += MK.arrow(400, 210, 710, 210, on(t, cNames == null ? null : cNames + 0.3, 0.6), P.gold, 7);
      b += MK.pill(555, 158, "× 6", on(t, cNames == null ? null : cNames + 0.3, 0.5), { size: 28, col: P.gold });
      b += MK.pill(330, 330, "factor", popIn(t, cFactor, 0.45), { size: 30, col: P.teal });
      b += MK.pill(800, 330, "multiple", popIn(t, cMultiple, 0.45), { size: 30, col: P.plum });
      out += G(b, { opacity: clamp(gB, 0, 1) });
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------- */
  /* one big sign per card, in the film's own type */
  function wtcGlyph(txt, col, k) {
    var f = k || 0.9;
    return function (cx, cy, size) {
      return Tx(cx, cy + size * f * 0.35, txt, "lab", "middle", { "font-size": size * f, fill: col });
    };
  }
  /* a number split into three parts */
  function wtcPartsPic(cx, cy, size) {
    var w = size * 0.4, h = size * 0.5, g = size * 0.08, out = "", k;
    for (k = 0; k < 3; k++) {
      out += R(cx + (k - 1) * (w + g) - w / 2, cy - h / 2, w, h, 6, "#1B3A52", P.gold, 2.5);
    }
    return out;
  }

  var WTC_RECAP = MK.recapKind([
    { beat: 0, at: "est", title: "Estimate first", sub: "round to something easy",
      pic: wtcGlyph("≈", P.gold, 0.95) },
    { beat: 0, at: "cols", title: "In columns", sub: "carry, and exchange",
      pic: wtcGlyph("+ −", P.teal, 0.5) },
    { beat: 1, at: "back", title: "225 + 98 = 323", sub: "add 100, give 2 back",
      pic: wtcGlyph("+100", P.accent, 0.42) },
    { beat: 1, at: "regroup", title: "4 × 7 × 5 = 140", sub: "do 4 × 5 first",
      pic: wtcGlyph("×", P.plum, 0.95) },
    { beat: 2, at: "split", title: "342 × 6 = 2,052", sub: "300, 40 and 2",
      pic: wtcPartsPic },
    { beat: 2, at: "share", title: "87 ÷ 5 = 17 r 2", sub: "17 fives, 2 left over",
      pic: wtcGlyph("÷", P.blue, 0.95) },
    { beat: 2, at: "pair", title: "4 and 6 make 24", sub: "a factor pair",
      pic: wtcGlyph("4 × 6", P.good, 0.4) }
  ], { goBeat: 2, goAt: "pair" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Estimate before you calculate",
      "Adding and taking away in columns",
      "Shortcuts, big multiplies and factor pairs"
    ] }),
    estimate: wtcEstimateChapter,
    adding: wtcAddingChapter,
    taking: wtcTakingChapter,
    easier: wtcEasierChapter,
    bigger: wtcBiggerChapter,
    factors: wtcFactorsChapter,
    recap: WTC_RECAP
  };
