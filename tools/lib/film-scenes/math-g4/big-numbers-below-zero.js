  /* ==== Grade 4 Mathematics, Lesson 1: Big Numbers and Below Zero ============
     tools/lib/film-scenes/math-g4/big-numbers-below-zero.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-4-app/lecture-video/big-numbers-below-zero.json.

     Mathematics has no lesson kit, so the number line and the drawings that
     ART covers come from ART (the shared maths library), and the rest is
     written here: a place-value chart of four or five columns, and a
     thermometer. ART.placeValue stops at 999 and has no thousands column, and
     ART has no thermometer at all - both are noted in the report.

     This file: the palette, the chart and the small drawings every chapter
     shares, the title motif, and the chapter "What each digit is worth".
     Every top-level name here starts with bn, so nothing can replace a name
     of the engine, ART or MK. */

  var HUE = {
    title: P.teal, worth: P.gold, regroup: P.plum, tentimes: P.blue,
    belowzero: P.teal, order: P.accent, round: P.good, recap: P.teal
  };

  /* the lessons' light palette, for anything drawn on a white card */
  var BN_C = ART.C;

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function bnOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function bnFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the place-value chart -------------------------------------------------
     The lesson's own .pv table, drawn as a light card: one headed box per
     column, and a digit layer on top of it so a digit can move from one
     column to another while the columns stay where they are. */
  var BN_CW = 150, BN_CG = 14;

  /* the left edge of column i of n, centred on cx */
  function bnColX(n, i, cx) {
    var total = n * BN_CW + (n - 1) * BN_CG;
    return (cx == null ? 584 : cx) - total / 2 + i * (BN_CW + BN_CG);
  }
  /* the middle of column i of n */
  function bnColMid(n, i, cx) { return bnColX(n, i, cx) + BN_CW / 2; }

  /* the boxes and their headings. lit: an array of 0..1, one per column, that
     paints a column in the lesson's accent while it is being talked about. */
  function bnChart(names, y, h, o) {
    o = o || {};
    var n = names.length, out = "", i, x, li, go;
    for (i = 0; i < n; i++) {
      x = bnColX(n, i, o.cx);
      go = clamp(o.show == null ? 1 : (o.show[i] == null ? 1 : o.show[i]), 0, 1);
      if (go <= 0) continue;
      li = clamp((o.lit && o.lit[i]) || 0, 0, 1);
      out += G(R(x, y, BN_CW, h, 16, BN_C.cell, BN_C.line, 2) +
        (li > 0 ? R(x, y, BN_CW, h, 16, BN_C.accentSoft, BN_C.accent, 3.5, { opacity: li }) : "") +
        Tx(x + BN_CW / 2, y + 32, names[i], "lab small caps", "middle", { fill: li > 0.5 ? BN_C.accent : BN_C.muted }),
        { opacity: go, transform: around(x + BN_CW / 2, y + h / 2, 0.92 + 0.08 * go) });
    }
    return out;
  }

  /* one digit, centred on (cx), sitting on the chart's baseline */
  function bnDigit(cx, by, text, o, size, col) {
    if (!(o > 0)) return "";
    return G(Tx(cx, by, String(text), "lab", "middle", { "font-size": size || 92, fill: col || BN_C.ink }),
      { opacity: Math.min(1, o), transform: around(cx, by - (size || 92) * 0.34, Math.min(o, 1.1)) });
  }

  /* a small digit box, for the three cards of "the same 8" */
  function bnDigitBoxes(cx, y, digits, litIndex, o) {
    if (!(o > 0)) return "";
    var bw = 50, gap = 6, n = digits.length, out = "";
    var x0 = cx - (n * bw + (n - 1) * gap) / 2, i, x, lit;
    for (i = 0; i < n; i++) {
      x = x0 + i * (bw + gap);
      lit = i === litIndex;
      out += R(x, y, bw, 64, 10, lit ? BN_C.accentSoft : BN_C.cell, lit ? BN_C.accent : BN_C.line, lit ? 3 : 2) +
        Tx(x + bw / 2, y + 47, String(digits[i]), "lab", "middle", { "font-size": 38, fill: lit ? BN_C.accent : BN_C.ink });
    }
    return G(out, { opacity: Math.min(1, o) });
  }

  /* ---- the thermometer --------------------------------------------------------
     The lesson's own (step 9): a tube from minus 10 to 10 with the scale
     written every two degrees, zero drawn as the line you pass through, and
     the mercury teal below zero as the lesson colours it. */
  var BN_T_MIN = -10, BN_T_MAX = 10;
  var BN_TH = { x: 252, top: 30, h: 320, w: 58 };
  function bnTY(v) { return BN_TH.top + ((BN_T_MAX - v) / (BN_T_MAX - BN_T_MIN)) * BN_TH.h; }
  function bnTherm(temp, o, zeroLit) {
    if (!(o > 0)) return "";
    var x = BN_TH.x, w = BN_TH.w, out = "", v, y;
    var bulbY = BN_TH.top + BN_TH.h + 30, top = bnTY(temp);
    var zl = clamp(zeroLit || 0, 0, 1);
    out += R(96, 8, 300, 416, 20, BN_C.card, BN_C.line, 2);
    /* the scale, every two degrees */
    for (v = BN_T_MIN; v <= BN_T_MAX; v += 2) {
      y = bnTY(v);
      out += L(x - 30, y, x - 14, y, v === 0 ? BN_C.ink : BN_C.line, v === 0 ? 3 : 2);
      out += Tx(x - 38, y + 6, (v < 0 ? "−" + (-v) : String(v)), "lab small", "end",
        { fill: v === 0 ? BN_C.ink : v < 0 ? BN_C.teal : BN_C.muted });
    }
    /* the tube, the mercury, and the bulb */
    out += R(x, BN_TH.top, w, BN_TH.h, w / 2, BN_C.cell, BN_C.line, 2);
    out += R(x + 6, top, w - 12, BN_TH.top + BN_TH.h - top, (w - 12) / 2, temp < 0 ? BN_C.teal : BN_C.accent);
    out += C(x + w / 2, bulbY, 30, temp < 0 ? BN_C.teal : BN_C.accent);
    /* zero, the line you pass through */
    y = bnTY(0);
    out += L(x - 24, y, x + w + 50, y, BN_C.ink, zl > 0 ? 4 : 2, { "stroke-dasharray": "9 7", opacity: 0.35 + 0.65 * zl });
    out += Tx(x + w + 56, y + 9, "0", "lab", "start", { "font-size": 26, fill: BN_C.ink, opacity: 0.35 + 0.65 * zl });
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* the reading, big, the way the lesson prints it */
  function bnReading(cx, cy, temp, o) {
    if (!(o > 0)) return "";
    var txt = (temp < 0 ? "−" + (-temp) : String(temp)) + "°C";
    return G(Tx(cx, cy, txt, "lab", "middle", { "font-size": 76, fill: temp < 0 ? P.teal : P.accent }),
      { opacity: Math.min(1, o) });
  }

  /* ==== the title ==============================================================
     What the lesson is: a big number in its columns, and a number line that
     keeps going past zero. On the spoken title chapter the number arrives on
     "huge, like 47,318", the line's negative half and its marker on "below
     zero, like minus 6", one column lights on "Where a digit stands" and what
     that digit is worth is printed on "what it is worth". On the two cards it
     simply stands. */
  var BN_MOTIF_D = ["4", "7", "3", "1", "8"];
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene, out = "";
    var cHuge = sc0 ? sc(sc0, 0, "huge") : null, cBelow = sc0 ? sc(sc0, 0, "below") : null;
    var cStands = sc0 ? sc(sc0, 1, "stands") : null, cWorth = sc0 ? sc(sc0, 1, "worth") : null;
    /* off the spoken chapter (the two cards) everything is simply there */
    var still = sc0 ? 0 : 1;
    var aNum = Math.max(still, on(t, cHuge, 0.5)), aLine = Math.max(still, on(t, cBelow, 0.5));
    var aCol = Math.max(0, on(t, cStands, 0.45)), aVal = Math.max(0, on(t, cWorth, 0.45));

    out += C(180, 180, 172, "#123247");
    /* the number, written */
    out += G(Tx(180, 106, "47,318", "lab", "middle", { "font-size": 54, fill: P.ink }), { opacity: aNum });
    /* its five columns; the hundreds one lights */
    var bw = 46, gap = 5, x0 = 180 - (5 * bw + 4 * gap) / 2, i, x;
    for (i = 0; i < 5; i++) {
      x = x0 + i * (bw + gap);
      var lit = i === 2 ? aCol : 0;
      out += G(R(x, 132, bw, 56, 9, lit > 0.4 ? "rgba(244,201,93,0.22)" : P.cell, lit > 0.4 ? P.gold : P.line, lit > 0.4 ? 3 : 2) +
        Tx(x + bw / 2, 172, BN_MOTIF_D[i], "lab", "middle", { "font-size": 30, fill: lit > 0.4 ? P.gold : P.ink }),
        { opacity: aNum });
    }
    if (aVal > 0) out += MK.pill(180, 214, "300", aVal, { size: 22, col: P.gold, ink: P.gold });
    /* the line that keeps going past zero */
    var ly = 280, lx0 = 44, lx1 = 316, zx = 218;
    out += G(L(lx0, ly, lx1, ly, P.ink, 4) +
      L(lx0, ly, zx, ly, P.teal, 4) +
      Tx(zx, ly + 34, "0", "lab small", "middle", { fill: P.ink }) +
      L(zx, ly - 10, zx, ly + 10, P.ink, 3) +
      C(zx - 68, ly, 12, P.teal, "#123247", 3) +
      Tx(zx - 68, ly + 36, "−6", "lab small", "middle", { fill: P.teal }) +
      MK.arrow(zx + 6, ly - 34, lx1 - 8, ly - 34, aLine, P.gold, 5),
      { opacity: aLine });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A five digit number in its place value columns, and a number line running past zero">' + out + "</svg>";
  }

  /* ==== chapter: what each digit is worth =======================================
     3,406 in the lesson's four columns. The digits land as they are named,
     the zero is held up as the thing that keeps the tens column open, and
     then it is taken away and every digit slides one column to the RIGHT -
     3,406 becomes 346, which is the direction that makes it smaller. The last
     beat swaps the chart for the lesson's three cards: 8 in 58, in 85 and in
     80,000. */
  var BN_W_NAMES = ["THOUSANDS", "HUNDREDS", "TENS", "ONES"];
  var BN_W_Y = 152, BN_W_H = 226, BN_W_BASE = 152 + 226 - 56;

  function bnWorthChart(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cRead = c(0, "read"), cName = c(0, "name");
    var cT3 = c(1, "t3"), cH4 = c(1, "h4"), cT0 = c(1, "t0"), cO6 = c(1, "o6");
    var cZero = c(2, "zero"), cHolds = c(2, "holds");
    var cAway = c(3, "away"), cTurns = c(3, "turns"), cSmall = c(3, "small");
    var out = "", i;

    /* the columns arrive one after another as the number is read out */
    var show = [], lit = [];
    for (i = 0; i < 4; i++) show.push(on(t, cRead == null ? null : cRead + i * 0.13, 0.4));
    /* the column being spoken about lights, one at a time */
    var digitCue = [cT3, cH4, cT0, cO6];
    for (i = 0; i < 4; i++) {
      var next = i < 3 ? digitCue[i + 1] : null;
      lit.push(on(t, digitCue[i], 0.3) * (next == null ? 1 : 1 - on(t, next, 0.3)) * bnOnly(t, scene, 1));
    }
    /* the zero's own beat: the tens column stays lit while it is talked about */
    lit[2] = Math.max(lit[2], on(t, cZero, 0.35) * bnOnly(t, scene, 2));
    out += bnChart(BN_W_NAMES, BN_W_Y, BN_W_H, { lit: lit, show: show });

    /* the digits, on a layer of their own so they can move between columns */
    var slide = on(t, cTurns, 0.7);                       /* 0 -> 1: every digit one column right */
    var drop = on(t, cAway == null ? null : cAway + 0.65, 0.45);   /* the zero goes, after its cross */
    var pos = [0, 1, 2, 3];
    var gone = [0, 0, drop, 0];
    for (i = 0; i < 4; i++) {
      if (i === 2) continue;                              /* the zero does not move; it leaves */
      var from = pos[i], to = i === 3 ? 3 : i + 1;        /* 3 -> hundreds, 4 -> tens, 6 stays in ones */
      var cx = lerp(bnColMid(4, from), bnColMid(4, to), slide);
      out += bnDigit(cx, BN_W_BASE, ["3", "4", "0", "6"][i], popIn(t, digitCue[i], 0.4) * (1 - gone[i]));
    }
    /* the zero itself: gold while it is held up, then taken away */
    var zGlow = on(t, cZero, 0.4) * bnOnly(t, scene, 2);
    var zx = bnColMid(4, 2);
    out += bnDigit(zx, BN_W_BASE, "0", popIn(t, cT0, 0.4) * (1 - drop), 92, zGlow > 0.4 ? BN_C.accent : BN_C.ink);
    if (zGlow > 0) out += C(zx, BN_W_BASE - 30, 62 + 4 * breathe(t), "none", BN_C.accent, 4, { opacity: zGlow });
    /* "It holds the tens column open" */
    var hold = on(t, cHolds, 0.4) * bnOnly(t, scene, 2);
    if (hold > 0) out += MK.leader(915, 200, zx + 74, BN_W_Y + 44, on(t, cHolds, 0.7), P.gold) +
      MK.pill(1026, 200, "holds the place", hold, { size: 22, col: P.gold });
    /* "Take the zero away": the zero is crossed out, then it is gone */
    out += MK.cross(zx, BN_W_BASE - 30, 30, popIn(t, cAway, 0.35) * (1 - drop));

    /* the number itself, above the chart: 3,406, then 346 */
    var numO = on(t, cRead, 0.5);
    out += G(Tx(584, 82, "3,406", "lab", "middle", { "font-size": 62, fill: P.ink }), { opacity: numO * (1 - slide) });
    out += G(Tx(584, 82, "346", "lab", "middle", { "font-size": 62, fill: P.gold }), { opacity: slide });
    out += G(Tx(584, 124, "three thousand, four hundred and six", "lab big muted", "middle"),
      { opacity: on(t, cName, 0.5) * (1 - slide) });
    /* "a much smaller number" */
    var sm = on(t, cSmall, 0.4);
    if (sm > 0) out += MK.pill(936, 82, "much smaller", sm, { size: 24, col: P.gold });
    return out;
  }

  /* the three cards of the last beat: the same 8, in three columns */
  var BN_EIGHTS = [
    { d: ["5", "8"], at: 1, dx: 28, num: "58", worth: "worth 8" },
    { d: ["8", "5"], at: 0, dx: -28, num: "85", worth: "worth 80" },
    { d: ["8", "0", "0", "0", "0"], at: 0, dx: -112, num: "80,000", worth: "worth 80,000" }
  ];
  /* the third card ("eighty thousand") got its own beat when the lead's
     length note split this line in two - "same" and the first two cards
     still read beat 4, the third now reads beat 5. */
  function bnWorthEights(scene, t, arrive) {
    var cSame = sc(scene, 4, "same"), keys = ["a", "b", "c"], out = "", i;
    var same = on(t, cSame, 0.4);
    var cw = 330, gap = 49, x0 = (1168 - (3 * cw + 2 * gap)) / 2;
    for (i = 0; i < 3; i++) {
      var e = BN_EIGHTS[i], x = x0 + i * (cw + gap), cx = x + cw / 2;
      var up = clamp((arrive - i * 0.1) / 0.7, 0, 1);
      var mine = on(t, sc(scene, i === 2 ? 5 : 4, keys[i]), 0.35);
      if (up <= 0) continue;
      out += G(R(x, 132, cw, 170, 20, BN_C.card, mine > 0.4 ? BN_C.accent : BN_C.line, mine > 0.4 ? 4 : 2) +
        bnDigitBoxes(cx, 158, e.d, e.at, 1) +
        Tx(cx, 252, e.num, "lab mid muted", "middle"),
        { opacity: Math.min(1, up), transform: around(cx, 217, Math.min(up, 1.08)) });
      if (same > 0) out += C(cx + e.dx, 190, 36, "none", P.gold, 3,
        { opacity: same * (0.65 + 0.35 * breathe(t)) });
      if (mine > 0) out += MK.pill(cx, 350, e.worth, mine, { size: 24, col: P.gold });
    }
    return out;
  }

  function bnWorthChapter(scene, beat, t, i) {
    var swap = bnFrom(t, scene, 4);
    var out = "";
    if (swap < 1) out += G(bnWorthChart(scene, t), { opacity: 1 - swap });
    if (swap > 0) out += G(bnWorthEights(scene, t, swap), { opacity: swap });
    return svg(out);
  }
