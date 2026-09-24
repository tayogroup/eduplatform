
  /* ==== Grade 1 Mathematics, Lesson "What Comes Next" ==========================
     tools/lib/film-scenes/math-g1/what-comes-next.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     mathematics/grade-1-app/g1v2/lecture-video/what-comes-next.json.

     Mathematics has no lesson kit, so the number pictures come from ART
     (ehel-film-art-math.js): the number line with its counting jumps, the
     growing-pattern strip, the ten frame and the pan balance. The BEADS are
     drawn here, because the library has none: the lesson's own bead row is
     HTML and CSS (.bead.orange.circle and its siblings), so this file draws
     the same four colours and three shapes as SVG.

     This file: the palette, the bead, the title motif, and the two bead
     chapters ("Patterns that repeat" and "The part that repeats"). Every
     top-level name starts with wcn, so nothing here can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, repeat: P.accent, unit: P.plum, jump: P.blue,
    grow: P.good, equals: P.gold, recap: P.teal
  };

  /* the lesson's four bead colours, in the film's dark-stage palette */
  var WCN_COL = { orange: P.accent, teal: P.teal, purple: P.plum, gold: P.gold };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function wcnOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function wcnFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the bead -------------------------------------------------------------
     One of the lesson's beads: a colour and a shape, centred on (x, y), its
     width 2r. An empty slot is the lesson's .bead.gap: a dashed outline. */
  function wcnBead(x, y, r, col, shape, o) {
    if (!(o > 0)) return "";
    var c = WCN_COL[col] || col, body;
    if (shape === "square") body = R(x - r * 0.86, y - r * 0.86, r * 1.72, r * 1.72, r * 0.3, c);
    else if (shape === "triangle") body = Pth("M" + n2(x) + "," + n2(y - r * 0.98) + " L" + n2(x + r * 0.94) + "," + n2(y + r * 0.74) +
      " L" + n2(x - r * 0.94) + "," + n2(y + r * 0.74) + " Z", c);
    else body = C(x, y, r, c);
    return G(body, { opacity: clamp(o, 0, 1) });
  }
  function wcnHole(x, y, r, o) {
    if (!(o > 0)) return "";
    return C(x, y, r, "rgba(244,201,93,0.07)", P.gold, 3, { opacity: clamp(o, 0, 1), "stroke-dasharray": "9 7" });
  }
  /* a soft ring round the bead being looked at */
  function wcnRing(x, y, r, col, o) {
    if (!(o > 0)) return "";
    return C(x, y, r + 11, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }
  /* the box the lesson draws round one repeat of the unit */
  function wcnUnitBox(x0, x1, y, r, col, o, lab, dashed) {
    if (!(o > 0)) return "";
    var pad = r + 13;
    return G(R(x0 - pad, y - pad, (x1 - x0) + 2 * pad, 2 * pad, pad * 0.5, "none", col, 3.5,
        dashed ? { "stroke-dasharray": "11 8" } : null) +
      (lab ? Tx((x0 + x1) / 2, y - pad - 14, lab, "lab mid", "middle", { fill: col }) : ""),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the title motif ------------------------------------------------------
     A repeating bead row with one slot still empty, and, under it, the other
     two ideas of the lesson: a counting jump and the equals sign. Drawn whole
     on the title and end cards, where there is no chapter to take cues from. */
  var WCN_MOTIF = [["orange", "circle"], ["teal", "circle"], ["orange", "circle"], ["teal", "circle"]];
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene || null, out = "";
    var atAgain = s ? sc(s, 0, "again") : null, atOrder = s ? sc(s, 0, "order") : null;
    var atPattern = s ? sc(s, 1, "pattern") : null, atNext = s ? sc(s, 1, "next") : null;
    var shown = s ? tally(t, atAgain, 4, 0.95) : 4;
    var arrowU = s ? on(t, atOrder, 0.5) : 1;
    var boxO = s ? popIn(t, atPattern, 0.4) : 1;
    var nextP = s ? popIn(t, atNext, 0.4) : 1;
    var x0 = 66, step = 60, y = 140, r = 24, k;

    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 150, 150, P.teal, 0.55 + 0.25 * breathe(t));
    for (k = 0; k < 4; k++) out += wcnBead(x0 + k * step, y, r, WCN_MOTIF[k][0], "circle", k < shown ? 1 : 0);
    out += wcnHole(x0 + 4 * step, y, r, 1);
    out += wcnBead(x0 + 4 * step, y, r, "orange", "circle", Math.min(1, nextP));
    out += MK.arrow(x0 - 14, y + 52, x0 + 4 * step + 14, y + 52, arrowU, P.muted, 5);
    out += wcnUnitBox(x0, x0 + step, y, r, P.gold, boxO, null);
    /* the other two ideas, small: a counting jump, and the equals sign */
    out += G(Pth("M84,246 C104,206 136,206 156,246", null, P.blue, 5) +
      Tx(120, 214, "+2", "lab mid", "middle", { fill: P.blue }) +
      C(84, 248, 7, P.blue) + C(156, 248, 7, P.blue) +
      Tx(120, 278, "2, 4, 6", "lab mid muted", "middle"), { opacity: arrowU });
    out += G(MK.pill(258, 250, "=", 1, { size: 26, col: P.gold, ink: P.gold }) +
      Tx(258, 290, "same", "lab mid muted", "middle"), { opacity: Math.min(1, nextP) });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A repeating bead pattern with the next bead still to come">' + out + "</svg>";
  }

  /* ==== chapter: patterns that repeat ========================================
     The lesson's first step: orange, teal, orange, teal, orange, and an empty
     slot for the bead that comes next. The child says the row out loud and
     lets their voice run on, which is the lesson's own instruction. */
  var WCN_R = { x0: 284, step: 120, y: 214, r: 40 };
  var WCN_ROW = ["orange", "teal", "orange", "teal", "orange"];
  function wcnRX(k) { return WCN_R.x0 + k * WCN_R.step; }

  function wcnRepeatChapter(scene, beat, t, i) {
    var out = "", k;
    var atBeads = sc(scene, 0, "beads"), atCount = sc(scene, 0, "count");
    var atLoud = sc(scene, 1, "loud"), atRun = sc(scene, 1, "run");
    var atWants = sc(scene, 2, "wants"), atRight = sc(scene, 2, "right");
    var atTurns = sc(scene, 3, "turns"), atRepeats = sc(scene, 3, "repeats");
    var atStart = sc(scene, 4, "start"), atCarry = sc(scene, 4, "carry");

    /* the tray the beads lie on, in as the beads are named */
    var trayO = on(t, atBeads, 0.5);
    out += R(WCN_R.x0 - 82, WCN_R.y - 76, 5 * WCN_R.step + 164, 152, 28, P.card, P.line, 2, { opacity: trayO * 0.9 });

    /* five beads, one as each colour is said */
    var shown = tally(t, atCount, 5, 1.15);
    for (k = 0; k < 5; k++) out += wcnBead(wcnRX(k), WCN_R.y, WCN_R.r, WCN_ROW[k], "circle", k < shown ? 1 : 0);

    /* the empty slot, and the bead the child's voice finds */
    var fillP = popIn(t, atWants, 0.42);
    out += wcnHole(wcnRX(5), WCN_R.y, WCN_R.r, trayO * (1 - Math.min(1, fillP)));
    out += wcnBead(wcnRX(5), WCN_R.y, WCN_R.r, "teal", "circle", Math.min(1, fillP));
    out += MK.tick(wcnRX(5) + 58, WCN_R.y - 62, 24, popIn(t, atRight, 0.38));

    /* saying it out loud: sound from the row, and a ring that walks along it */
    var loudO = wcnOnly(t, scene, 1);
    if (loudO > 0.02 && atLoud != null) {
      var walk = clamp((t - atLoud) / 0.34, 0, 5.4);
      var at = Math.min(5, Math.floor(walk));
      if (atRun != null && t >= atRun) at = 5;
      /* the sound comes from the bead the voice is on, so it walks with it */
      out += G(MK.waves(wcnRX(at), WCN_R.y + 152, t, atLoud, { dir: -Math.PI / 2, spread: 1.8, n: 3, period: 1.0, reach: 74, col: P.gold, until: spokenEnd(scene.first + 1) }), { opacity: loudO });
      out += G(wcnRing(wcnRX(at), WCN_R.y, WCN_R.r, at === 5 ? P.gold : P.ink, 1), { opacity: loudO });
    }

    /* two colours taking turns, confirmed with a tick; then the repeats */
    var turnO = wcnOnly(t, scene, 3);
    if (turnO > 0.02) {
      var cx = 584, cy = 64, u = on(t, atTurns, 0.45);
      out += G(wcnBead(cx - 132, cy, 21, "orange", "circle", 1) + wcnBead(cx + 132, cy, 21, "teal", "circle", 1) +
        Pth("M" + n2(cx - 104) + "," + n2(cy - 10) + " C" + n2(cx - 54) + "," + n2(cy - 52) + " " + n2(cx + 54) + "," + n2(cy - 52) + " " + n2(cx + 100) + "," + n2(cy - 14), null, P.muted, 5) +
        Pth("M" + n2(cx + 104) + "," + n2(cy + 10) + " C" + n2(cx + 54) + "," + n2(cy + 52) + " " + n2(cx - 54) + "," + n2(cy + 52) + " " + n2(cx - 100) + "," + n2(cy + 14), null, P.muted, 5) +
        Tx(cx - 174, cy + 8, "take turns", "lab mid muted", "end"), { opacity: u });
      out += MK.tick(cx, cy, 30, popIn(t, atTurns == null ? null : atTurns + 0.5, 0.38));
      /* the same part, over and over: a box round each pair */
      var pairs = tally(t, atRepeats, 3, 0.9);
      for (k = 0; k < 3; k++) if (k < pairs) out += wcnUnitBox(wcnRX(2 * k), wcnRX(2 * k + 1), WCN_R.y, WCN_R.r, P.gold, turnO, null);
    }

    /* start at the beginning, and let the words carry you on */
    var carryO = wcnOnly(t, scene, 4);
    if (carryO > 0.02) {
      out += G(MK.leader(WCN_R.x0 - 150, WCN_R.y + 118, wcnRX(0), WCN_R.y + 64, on(t, atStart, 0.5), P.gold) +
        Tx(WCN_R.x0 - 156, WCN_R.y + 126, "start here", "lab mid", "end", { fill: P.gold }), { opacity: carryO });
      out += G(MK.arrow(wcnRX(0), WCN_R.y + 92, wcnRX(5), WCN_R.y + 92,
        on(t, atStart == null ? null : atStart + 0.4, 1.3), P.teal, 7), { opacity: carryO });
      out += G(wcnRing(wcnRX(5), WCN_R.y, WCN_R.r, P.teal, popIn(t, atCarry, 0.4)), { opacity: carryO });
    }
    return svg(out);
  }

  /* ==== chapter: the part that repeats ========================================
     The lesson's second and third steps in one picture: nine beads of
     purple, gold, gold; the box and the bars that show the unit; and then a
     hole in the middle, filled by reading the unit rather than the last bead. */
  var WCN_U = { x0: 192, step: 98, y: 206, r: 34 };
  var WCN_UNIT = ["purple", "gold", "gold"];
  var WCN_SHAPE = ["circle", "square", "square"];
  function wcnUX(k) { return WCN_U.x0 + k * WCN_U.step; }
  var WCN_HOLE = 4;   /* the fifth bead: a gold square, and the one the film hides */

  function wcnUnitChapter(scene, beat, t, i) {
    var out = "", k;
    var atEvery = sc(scene, 0, "every"), atRepeats = sc(scene, 0, "repeats");
    var atFirst = sc(scene, 1, "first"), atAgain = sc(scene, 1, "again");
    var atThree = sc(scene, 2, "three"), atLine = sc(scene, 2, "line");
    var atMissing = sc(scene, 3, "missing"), atBefore = sc(scene, 3, "before");
    var atTells = sc(scene, 4, "tells");

    var trayO = on(t, atEvery, 0.5);
    out += R(WCN_U.x0 - 62, WCN_U.y - 70, 8 * WCN_U.step + 124, 140, 26, P.card, P.line, 2, { opacity: trayO * 0.9 });

    /* the hole opens as it is named, and is filled again by the unit */
    var holeO = on(t, atMissing, 0.45);
    var fillP = popIn(t, atTells == null ? null : atTells + 0.55, 0.42);
    var beadsIn = tally(t, atEvery, 9, 0.95);
    for (k = 0; k < 9; k++) {
      var col = WCN_UNIT[k % 3], shp = WCN_SHAPE[k % 3];
      var o = k < beadsIn ? 1 : 0;
      if (k === WCN_HOLE) o = o * (1 - holeO) + Math.min(1, fillP);
      if (k === WCN_HOLE && holeO > 0.02) out += wcnHole(wcnUX(k), WCN_U.y, WCN_U.r, holeO * (1 - Math.min(1, fillP)));
      out += wcnBead(wcnUX(k), WCN_U.y, WCN_U.r, col, shp, o);
    }

    /* the three repeats, boxed: the first as it is said, the others on "again" */
    var solid = popIn(t, atFirst, 0.4);
    var hinted = popIn(t, atRepeats, 0.4) * (1 - Math.min(1, solid));
    var more = tally(t, atAgain, 2, 0.6);
    var boxes = [solid, more >= 1 ? popIn(t, atAgain, 0.4) : 0, more >= 2 ? popIn(t, atAgain == null ? null : atAgain + 0.3, 0.4) : 0];
    out += wcnUnitBox(wcnUX(0), wcnUX(2), WCN_U.y, WCN_U.r, P.muted, Math.min(1, hinted), null, true);
    for (k = 0; k < 3; k++) {
      var lit = k === 0 && atTells != null && t >= atTells ? P.good : P.gold;
      out += wcnUnitBox(wcnUX(3 * k), wcnUX(3 * k + 2), WCN_U.y, WCN_U.r, lit, Math.min(1, boxes[k]), null);
    }

    /* three beads repeat, and a line after every three */
    out += MK.pill(wcnUX(1), WCN_U.y - 84, "3 beads", popIn(t, atThree, 0.4), { size: 22, col: P.gold, ink: P.gold });
    var bars = tally(t, atLine, 2, 0.55);
    for (k = 0; k < 2; k++) if (k < bars) {
      var bx = (wcnUX(3 * k + 2) + wcnUX(3 * k + 3)) / 2;
      out += L(bx, WCN_U.y - 74, bx, WCN_U.y + 74, P.gold, 5, { opacity: 0.95 });
    }

    /* the bead before the hole, and what the unit says belongs in it */
    var beforeO = on(t, atBefore, 0.45) * (1 - on(t, atTells, 0.45));
    if (beforeO > 0.02) {
      out += G(wcnRing(wcnUX(WCN_HOLE - 1), WCN_U.y, WCN_U.r, P.gold, 1) +
        MK.leader(wcnUX(WCN_HOLE - 1), WCN_U.y + 126, wcnUX(WCN_HOLE - 1), WCN_U.y + 56, 1, P.gold) +
        Tx(wcnUX(WCN_HOLE - 1), WCN_U.y + 152, "before the hole", "lab mid", "middle", { fill: P.gold }), { opacity: beforeO });
    }
    var tellsU = on(t, atTells, 0.5);
    if (tellsU > 0.02) {
      out += G(MK.arrow(wcnUX(1), WCN_U.y - 58, wcnUX(WCN_HOLE), WCN_U.y - 58, tellsU, P.good, 7), { opacity: tellsU });
      out += MK.tick(wcnUX(WCN_HOLE) + 54, WCN_U.y + 52, 22, popIn(t, atTells == null ? null : atTells + 0.95, 0.38));
    }
    return svg(out);
  }
