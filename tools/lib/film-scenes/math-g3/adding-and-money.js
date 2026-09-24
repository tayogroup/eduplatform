  /* ==== Grade 3 Mathematics, Lesson 2: Adding, Taking Away and Money =========
     tools/lib/film-scenes/math-g3/adding-and-money.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-3-app/lecture-video/adding-and-money.json.

     Mathematics has no lesson kit, so the manipulatives come from ART
     (tools/lib/ehel-film-art-math.js): the bar model and the number line for
     complements, and the written column method for the two regrouping
     chapters. The lesson's own numbers are used throughout - 62 and 38,
     17 add 9 add 3, 247 add 185, 400 take away 178, sh 4.65 and sh 3.05,
     and sh 2.60 paid with sh 5.00.

     MONEY IN THIS LESSON IS WRITTEN "sh 2.60" - shillings and cents with a
     decimal point, because that is what 3Nm.01 is about and what every step
     of adding-and-money.html prints (money(v) = "sh " + v.toFixed(2)). It is
     NOT the bare "10 sh" of the other Maths lessons, and ART.coins writes
     that form, so the money pictures here are drawn in the film.

     This file: the palette, the helpers every chapter shares, the title
     motif and the chapter "Make 100". Every top-level name starts with am,
     so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, hundred: P.gold, anyorder: P.blue, carry: P.accent,
    take: P.plum, moneydot: P.gold, change: P.good, recap: P.teal
  };

  /* the lessons' light palette, for anything drawn on a light card */
  var AMC = {
    ink: "#1B2A2F", muted: "#6B7F82", line: "#D6E3DE", card: "#FFFFFF",
    cell: "#E4EEE9", accent: "#F26B2A", accentSoft: "#FDE4D6",
    teal: "#1E8C86", tealSoft: "#D5EFEC", plum: "#8E5AA8", gold: "#C99700",
    good: "#2E8B57", goodSoft: "#DCF3E4", bad: "#C4453A",
    coin: "#E8C766", coinLit: "#FFF4C2", coinInk: "#5A4300"
  };

  /* ---- timing ---------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1
     comes in: for a thing that belongs to that beat alone (rule 7) */
  function amOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }

  /* ---- numbers in the cards' own style ----------------------------------
     .sf text in the film's stylesheet sets Inter for everything inside the
     stage svg, which is the family ART's own N() draws in, so a digit written
     here sits beside one of ART's without a seam. The fill has to be given,
     because .lab's is the dark stage's white. */
  function amNum(x, y, s, size, fill, extra) {
    var o = { "font-size": size, fill: fill || AMC.ink, "dominant-baseline": "central" };
    for (var k in (extra || {})) o[k] = extra[k];
    return Tx(x, y, s, "lab", "middle", o);
  }
  /* a light card of the film's own, the shape ART's cards are */
  function amCard(x, y, w, h, o, fill) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, fill || AMC.card, AMC.line, 2, { opacity: clamp(o, 0, 1) });
  }
  /* a patch of card colour that hides part of an ART drawing until its cue:
     the digits of a column method arrive one at a time this way, so every
     numeral on screen is ART's own and none of them is redrawn by hand */
  function amHide(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 0, AMC.card, null, null, { opacity: clamp(o, 0, 1) });
  }
  /* a shilling coin, its face the one ART.coins draws */
  function amCoin(cx, cy, r, text) {
    return C(cx, cy, r, AMC.coin, AMC.gold, Math.max(2, r * 0.13)) +
      E(cx - r * 0.24, cy - r * 0.28, r * 0.4, r * 0.3, AMC.coinLit, null, null, { opacity: 0.6 }) +
      amNum(cx, cy, text == null ? "sh" : text, r * 0.8, AMC.coinInk);
  }

  /* ==== the title motif ====================================================
     What the lesson is: a plus, a take-away sign and shilling coins, with the
     hundred the complements chapter makes. In the spoken title chapter each
     one arrives as it is named; on the two silent cards they all stand. */
  function titleMotif(o) {
    var t = o.t || 0, S = o.scene, out = "";
    var pAdd = S ? popIn(t, sc(S, 0, "add"), 0.4) : 1;
    var pTake = S ? popIn(t, sc(S, 0, "take"), 0.4) : 1;
    var pPay = S ? popIn(t, sc(S, 0, "pay"), 0.45) : 1;
    var pHun = S ? popIn(t, sc(S, 1, "hundred"), 0.4) : 1;
    var gCar = S ? on(t, sc(S, 1, "carry"), 0.5) : 0.55;
    var pChg = S ? popIn(t, sc(S, 1, "change"), 0.4) : 1;

    out += C(180, 180, 172, "#123247");
    out += MK.glow(108, 96, 66, P.gold, gCar * (S ? 0.65 + 0.35 * breathe(t) : 1));
    out += MK.pop(Tx(108, 96, "+", "lab", "middle", { "font-size": 80, fill: P.teal, "dominant-baseline": "central" }), 108, 96, pAdd);
    out += MK.pop(Tx(252, 96, "−", "lab", "middle", { "font-size": 80, fill: P.accent, "dominant-baseline": "central" }), 252, 96, pTake);
    out += MK.pill(180, 176, "100", Math.min(1, pHun), { size: 30, col: P.gold, ink: P.gold });
    out += MK.pop(amCoin(276, 268, 30, "sh"), 276, 268, pChg);
    out += MK.pop(amCoin(180, 276, 62, "sh"), 180, 276, pPay);
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A plus sign, a take away sign and two shilling coins">' + out + "</svg>";
  }

  /* ==== chapter: Make 100 ==================================================
     The lesson's own complement, 62 and 38, on the bar its Make 100 step
     draws (have / make / the rest is "?") and on a number line that counts
     on to the next ten and then to the hundred, exactly as the step's own
     explain says: "Sixty two to seventy is eight. Seventy to a hundred is
     thirty. Eight and thirty is thirty eight."

     ART.barModel is 520 x 188 in its own coordinates, placed here at 1.25
     times; the middle of its unknown part is worked out from that, because a
     mark has to land on it. */
  var AM_BAR = { x: 16, y: 54, w: 520, h: 188, s: 1.25 };
  var AM_BAR_Q = { x: 525.8, y: 220.3 };        /* the middle of the unknown part */
  /* the number line: 420 wide, 60 to 100 in twos, its axis held at y = 300 so
     that the card grows upward when the first counting jump needs the room */
  var AM_LN = { x: 700, w: 420, axis: 300, s: 1.1 };
  function amLineX(v) { return AM_LN.x + (36 + ((v - 60) / 40) * (AM_LN.w - 72)) * AM_LN.s; }

  function amHundredChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cComp = c(0, "comp"), cRound = c(0, "round");
    var cHave = c(1, "have"), cMore = c(1, "more");
    var cNext = c(2, "next"), cEight = c(2, "eight");
    var cThirty = c(3, "thirty"), cSum = c(3, "sum");
    var cPair = c(4, "pair"), cTotal = c(4, "total");
    var out = "";

    /* the number line, with the jumps that have been counted so far */
    var jumps = [];
    if (cEight != null && t >= cEight) jumps.push({ from: 62, to: 70, label: "+8", colour: "teal" });
    if (cThirty != null && t >= cThirty) jumps.push({ from: 70, to: 100, label: "+30", colour: "plum" });
    var marks = [];
    if (cHave != null && t >= cHave) marks.push({ at: 62, label: "62", colour: "accent" });
    var line = ART.numberLine({ from: 60, to: 100, step: 2, labelEvery: 10, width: AM_LN.w, jumps: jumps, marks: marks });
    var ay = jumps.length ? 116 : 46, lh = ay + 62, S = AM_LN.s;
    var lp = popIn(t, cComp, 0.5);
    /* the scale is capped at 1: popIn overshoots to 1.1, and a card this wide
       overshoots off the 1168 box with it (--sweep, 9 px out at 15.2 s) */
    out += MK.pop(ART.place(line, AM_LN.x, AM_LN.axis - ay * S, AM_LN.w * S, lh * S), AM_LN.x + AM_LN.w * S / 2, AM_LN.axis, Math.min(1, lp));

    /* "a round number": the hundred at the end of the line */
    var ro = on(t, cRound, 0.5);
    if (ro > 0) {
      out += MK.glow(amLineX(100), AM_LN.axis, 44, P.gold, ro * (0.7 + 0.3 * breathe(t)));
      out += MK.pill(1050, 392, "a round number", ro, { size: 22, col: P.gold });
    }
    /* "the next ten": the seventy it is counted on to first */
    var no = on(t, cNext, 0.5) * amOnly(t, scene, 2);
    if (no > 0) out += MK.glow(amLineX(70), AM_LN.axis, 44, P.teal, no * (0.7 + 0.3 * breathe(t)));

    /* the bar: 100 whole, 62 known, and the rest unknown until it is named */
    var bp = popIn(t, cHave, 0.45);
    if (bp > 0) {
      var told = cPair != null && t >= cPair;
      var bar = ART.barModel({ whole: 100, parts: [{ value: 62 }, { value: 38 }], unknown: told ? null : 1 });
      out += MK.pop(ART.place(bar, AM_BAR.x, AM_BAR.y, AM_BAR.w * AM_BAR.s, AM_BAR.h * AM_BAR.s),
        AM_BAR.x + AM_BAR.w * AM_BAR.s / 2, AM_BAR.y + AM_BAR.h * AM_BAR.s / 2, Math.min(1, bp));
      if (told) out += MK.glow(AM_BAR_Q.x, AM_BAR_Q.y, 80, P.gold, on(t, cPair, 0.5) * (0.7 + 0.3 * breathe(t)));
    }
    /* "How many more": the gap between 62 and 100, asked on the line */
    var mo = popIn(t, cMore, 0.4) * amOnly(t, scene, 1);
    if (mo > 0) out += MK.qmark((amLineX(62) + amLineX(100)) / 2, AM_LN.axis - 66, 28, Math.min(1, mo));

    /* the two steps written out, and then the whole fact */
    out += MK.pill(330, 330, "8 + 30 = 38", on(t, cSum, 0.4), { size: 30, col: P.teal });
    var to = on(t, cTotal, 0.4);
    out += MK.pill(330, 396, "62 + 38 = 100", to, { size: 30, col: P.gold });
    out += MK.tick(520, 396, 26, popIn(t, cTotal == null ? null : cTotal + 0.35, 0.4));
    return svg(out);
  }
