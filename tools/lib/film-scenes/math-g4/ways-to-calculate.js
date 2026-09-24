  /* ==== Grade 4 Mathematics, Lesson 3: Ways to Calculate ======================
     tools/lib/film-scenes/math-g4/ways-to-calculate.js, with -2.js, -3.js and
     -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-4-app/lecture-video/ways-to-calculate.json.

     Mathematics has no lesson kit, so every drawing comes from the shared
     maths picture library (ART, "art": ["math"]): number lines for the
     rounding and for the remainder, ART.columnSum for the two written
     methods, and ART.array for the 24 counters laid out as a rectangle.

     EVERY SUM IS ART.columnSum's OWN WORKING. The film never writes a carry,
     an exchange or a total itself: it asks the library for the finished,
     computed calculation and then HIDES the parts that have not been said
     yet, with a patch the colour of the card (wtcHide). So a carry cannot
     sit in the wrong place and a partial total cannot disagree with the
     digits above it - the only thing the film decides is WHEN each mark is
     uncovered. The one exception is wtcUnexchanged, which covers a column's
     exchange marks and redraws its plain digit in the library's own size,
     colour and baseline, so that 623 reads as 623 before the first exchange
     is spoken.

     This file: the palette, the timing helpers, the columnSum box helpers,
     the title motif and the chapter "Estimate first". Every top-level name
     here starts with wtc, so nothing can replace a name of the engine, ART
     or MK. */

  var HUE = {
    title: P.teal, estimate: P.gold, adding: P.teal, taking: P.accent,
    easier: P.plum, bigger: P.blue, factors: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function wtcOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function wtcFrom(t, scene, k) {
    return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k);
  }

  /* ---- the written method ------------------------------------------------------
     A box holds one ART.columnSum: where it sits on the 1168 x 440 stage, and
     the scale from the drawing's own coordinates to the film's. The library's
     geometry is fixed (a column is 58 wide, the edge 22, the headings at 26,
     the carries at 58, the top number at 104, the second at 162, the rule at
     194 and the answer at 226), so a patch can be placed over any one mark. */
  var WTC_COLW = 58, WTC_EDGE = 22, WTC_VH = 260;
  function wtcBox(x, y, s, cols) {
    return { x: x, y: y, s: s, cols: cols, vw: 2 * WTC_EDGE + (cols + 1) * WTC_COLW };
  }
  /* the centre of column i, i = 0 being the ones, in the drawing's coordinates */
  function wtcVX(box, i) { return box.vw - WTC_EDGE - WTC_COLW / 2 - i * WTC_COLW; }
  function wtcFX(box, vx) { return box.x + vx * box.s; }
  function wtcFY(box, vy) { return box.y + vy * box.s; }
  function wtcCard(box, drawing) {
    return ART.place(drawing, box.x, box.y, box.vw * box.s, WTC_VH * box.s);
  }
  /* a patch the colour of the card, over the drawing, while o > 0 */
  function wtcHide(box, vx, vy, vw, vh, o) {
    if (!(o > 0)) return "";
    return R(wtcFX(box, vx), wtcFY(box, vy), vw * box.s, vh * box.s, 4, ART.C.card,
      null, null, { opacity: clamp(o, 0, 1) });
  }
  /* hide the carry written beside column i, until its cue */
  function wtcHideCarry(box, i, o) { return wtcHide(box, wtcVX(box, i) - 39, 40, 38, 34, o); }
  /* hide the small exchanged ten written beside column i */
  function wtcHideBorrow(box, i, o) { return wtcHide(box, wtcVX(box, i) - 41, 72, 30, 30, o); }
  /* hide the digit a column became after lending, written above it */
  function wtcHideLent(box, i, o) { return wtcHide(box, wtcVX(box, i) - 17, 54, 34, 30, o); }
  /* hide one digit of the answer */
  function wtcHideAns(box, i, o) { return wtcHide(box, wtcVX(box, i) - 26, 200, 52, 52, o); }
  /* column i as it was BEFORE it lent: the strike AND the digit written above
     it both covered - the library writes that one at 70, so the patch has to
     start at 54, not at the digit row - and the original digit drawn again in
     the library's own size, colour and baseline */
  function wtcUnexchanged(box, i, digit, o) {
    if (!(o > 0)) return "";
    var vx = wtcVX(box, i);
    return G(R(wtcFX(box, vx - 27), wtcFY(box, 54), 54 * box.s, 74 * box.s, 4, ART.C.card) +
      Em(wtcFX(box, vx), wtcFY(box, 104), 38 * box.s, digit, { fill: ART.C.ink }),
      { opacity: clamp(o, 0, 1) });
  }
  /* the box round the column being worked on */
  function wtcColBox(box, i, o) {
    if (!(o > 0)) return "";
    return R(wtcFX(box, wtcVX(box, i) - 27), wtcFY(box, 8), 54 * box.s, 212 * box.s, 12,
      "none", ART.C.accent, 3, { opacity: clamp(o, 0, 1) });
  }
  /* A glow under the answer row, for the line that says it. Its radius is
     capped so the disc stays inside the 1168 x 440 box: a glow is soft at the
     rim, but --sweep reports it as drawn outside all the same. */
  function wtcAnsGlow(box, o) {
    if (!(o > 0)) return "";
    var cx = wtcFX(box, box.vw / 2), cy = wtcFY(box, 226);
    var r = Math.min(150 * box.s, cx, 1168 - cx, cy, 440 - cy);
    return MK.glow(cx, cy, r, P.good, o);
  }

  /* ---- small things the film draws for itself --------------------------------- */

  /* a number in a tile, the lessons' light card on the film's dark stage */
  function wtcTile(cx, cy, w, h, text, size, o, col) {
    if (!(o > 0)) return "";
    return G(R(cx - w / 2, cy - h / 2, w, h, 16, P.card, col || P.line, 3) +
      Tx(cx, cy + size * 0.35, text, "lab", "middle", { "font-size": size, fill: P.ink }),
      { transform: around(cx, cy, Math.min(o, 1.1)), opacity: Math.min(1, o) });
  }
  /* a ring drawn round something already on screen */
  function wtcRing(cx, cy, r, o, col) {
    if (!(o > 0)) return "";
    return C(cx, cy, r * (1 + 0.18 * (1 - Math.min(o, 1))), "none", col || P.gold, 4,
      { opacity: Math.min(1, o) });
  }

  /* ---- counting jumps, drawn by the film rather than by the library ---------
     ART.numberLine makes room above its axis only when it is GIVEN a jump, so
     the same line with and without one are two cards of different heights.
     Crossfading them laid a half-transparent white panel over the dark stage
     for a third of a second, which is what this replaces: the line is drawn
     once, at one size, and the jump is an arc this file draws over it, growing
     from its start to its end as g goes 0 -> 1.

     wtcNLX is ART.numberLine's own mapping from a value to a position: its pad
     is 36 either side of a card `w` wide. */
  function wtcNLX(from, to, w, v) { return 36 + ((v - from) / (to - from)) * (w - 72); }

  function wtcArc(x1, y1, x2, y2, rise, g, col, lab) {
    g = clamp(g, 0, 1);
    if (!(g > 0)) return "";
    col = col || P.gold;
    var cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 - rise, d = "", n = 28, k, u, X, Y;
    var tx = x1, ty = y1, dx = 0, dy = 0;
    for (k = 0; k <= n; k++) {
      u = (k / n) * g;
      X = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2;
      Y = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2;
      d += (k ? " L" : "M") + n2(X) + "," + n2(Y);
      if (k === n) { tx = X; ty = Y; dx = 2 * (1 - u) * (cx - x1) + 2 * u * (x2 - cx); dy = 2 * (1 - u) * (cy - y1) + 2 * u * (y2 - cy); }
    }
    var a = Math.atan2(dy, dx), h = 11, out = Pth(d, null, col, 4);
    out += Pth("M" + n2(tx) + "," + n2(ty) +
      " L" + n2(tx - Math.cos(a) * h - Math.sin(a) * h * 0.6) + "," + n2(ty - Math.sin(a) * h + Math.cos(a) * h * 0.6) +
      " L" + n2(tx - Math.cos(a) * h + Math.sin(a) * h * 0.6) + "," + n2(ty - Math.sin(a) * h - Math.cos(a) * h * 0.6) + " Z", col, col, 2);
    /* the label sits just above the APEX, which a quadratic reaches at half the
       rise - not at the control point, which is twice as far up */
    if (lab) out += Tx((x1 + x2) / 2, (y1 + y2) / 2 - rise / 2 - 16, lab, "lab mid", "middle",
      { fill: col, opacity: g });
    return out;
  }

  /* ==== the title ================================================================
     The four ways to calculate, on one dial. In the spoken title chapter they
     pop in one after another on "more than one way"; on "fits the numbers"
     one of them lights and the others step back. On the two cards all four
     simply stand. */
  var WTC_OPS = [["+", 110, 110], ["−", 250, 110], ["×", 110, 250], ["÷", 250, 250]];
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var ways = o.scene ? sc(o.scene, 0, "ways") : null;
    var fits = o.scene ? sc(o.scene, 1, "fits") : null;
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 150, P.gold, fits == null ? 0 : on(t, fits, 0.6) * (0.7 + 0.3 * breathe(t)));
    for (var k = 0; k < 4; k++) {
      var op = WTC_OPS[k];
      var p = ways == null ? 1 : popIn(t, ways + k * 0.34, 0.35);
      if (!(p > 0)) continue;
      var lit = fits != null && t >= fits && k === 2;
      var back = fits != null && t >= fits && k !== 2 ? 0.34 : 1;
      out += G(C(op[1], op[2], 50, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 5 : 3) +
        Tx(op[1], op[2] + 21, op[0], "lab", "middle", { "font-size": 58, fill: lit ? P.gold : P.ink }),
        { transform: around(op[1], op[2], Math.min(p, 1.1)), opacity: back * Math.min(1, p) });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" ' +
      'aria-label="Four ways to calculate: add, take away, multiply and divide">' + out + "</svg>";
  }

  /* ==== chapter: estimate first ==================================================
     387 + 214. Two number lines, one per number, each rounding to the nearest
     hundred as that number is named; then the easy sum, and last a third line
     showing the band an answer should land in, with a silly one crossed off.

     Each rounding line is ONE card: the bare line, then the same card with the
     number marked fading in over it (identical geometry, so nothing shows
     through), and the rounding jump drawn over the top by wtcArc. */
  var WTC_EL = { x: 36, y: 180, w: 520 }, WTC_ER = { x: 612, y: 180, w: 520 };
  var WTC_ELINE = { x: 344, y: 320, w: 480 };
  var WTC_EAXIS = 226;                      /* where both rounding lines sit */

  function wtcRoundLine(pos, from, to, at, label, jumpTo, jumpLab, o, jo) {
    var base = { from: from, to: to, step: 10, labelEvery: 50, width: pos.w };
    var out = G(ART.place(ART.numberLine(base), pos.x, pos.y, pos.w, 108), { opacity: clamp(o, 0, 1) });
    if (jo > 0) {
      out += G(ART.place(ART.numberLine({
        from: from, to: to, step: 10, labelEvery: 50, width: pos.w,
        marks: [{ at: at, label: label }]
      }), pos.x, pos.y, pos.w, 108), { opacity: clamp(jo, 0, 1) });
      out += wtcArc(pos.x + wtcNLX(from, to, pos.w, at), WTC_EAXIS - 16,
        pos.x + wtcNLX(from, to, pos.w, jumpTo), WTC_EAXIS - 16, 70, jo, P.gold, jumpLab);
    }
    return out;
  }

  function wtcEstimateChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSum = c(0, "sum");
    var cRound = c(1, "round"), cEasy = c(1, "easy");
    var cUp = c(2, "up"), cDown = c(2, "down");
    var cSums = c(3, "sums"), cAbout = c(3, "about");
    var cNot = c(4, "not"), cSilly = c(4, "silly");
    var out = "";

    /* the sum, and what it rounds to */
    var so = popIn(t, cSum, 0.45);
    if (so > 0) out += G(Tx(240, 70, "387 + 214", "lab huge", "middle"),
      { transform: around(240, 56, Math.min(so, 1.1)), opacity: Math.min(1, so) });
    out += MK.arrow(390, 56, 540, 56, on(t, cSums, 0.5), P.gold, 7);
    var eo = popIn(t, cSums, 0.45);
    if (eo > 0) out += G(Tx(700, 70, "400 + 200", "lab huge", "middle", { fill: P.gold }),
      { transform: around(700, 56, Math.min(eo, 1.1)), opacity: Math.min(1, eo) });
    var ao = popIn(t, cAbout, 0.45);
    if (ao > 0) out += G(Tx(930, 70, "= 600", "lab huge", "middle", { fill: P.gold }),
      { transform: around(930, 56, Math.min(ao, 1.1)), opacity: Math.min(1, ao) });

    /* the two lines: they arrive on "round each number", and each rounds as
       its own number is named */
    var lo = on(t, cRound, 0.5);
    out += wtcRoundLine(WTC_EL, 300, 400, 387, "387", 400, "to 400", lo, on(t, cUp, 0.55));
    out += wtcRoundLine(WTC_ER, 200, 300, 214, "214", 200, "to 200", lo, on(t, cDown, 0.55));
    /* "something easy": the two round hundreds glow under their labels */
    var ez = on(t, cEasy, 0.5) * (1 - on(t, cUp, 0.5));
    if (ez > 0) {
      out += MK.glow(WTC_EL.x + wtcNLX(300, 400, WTC_EL.w, 400), WTC_EAXIS + 20, 62, P.gold, ez);
      out += MK.glow(WTC_ER.x + wtcNLX(200, 300, WTC_ER.w, 200), WTC_EAXIS + 20, 62, P.gold, ez);
    }

    /* "An estimate is not the answer": where the answer should land */
    var no = on(t, cNot, 0.6);
    if (no > 0) {
      out += G(ART.place(ART.numberLine({
        from: 500, to: 700, step: 50, labelEvery: 100, width: WTC_ELINE.w,
        marks: [{ at: 600, label: "600", colour: "teal" }]
      }), WTC_ELINE.x, WTC_ELINE.y, WTC_ELINE.w, 108), { opacity: no });
    }
    /* "when one looks silly" */
    var si = popIn(t, cSilly, 0.4);
    out += MK.pill(960, 366, "5,001", Math.min(1, si), { size: 34, col: P.bad, ink: P.bad });
    out += MK.cross(1090, 366, 26, popIn(t, cSilly == null ? null : cSilly + 0.3, 0.35));

    return svg(out);
  }
