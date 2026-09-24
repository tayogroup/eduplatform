  /* ==== Grade 2 Mathematics, Lesson 4: Patterns That Grow ======================
     tools/lib/film-scenes/math-g2/patterns-that-grow.js, with -2.js: the film's
     pictures, after the shared marks (MK) and before the engine's tail, all in
     one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/patterns-that-grow.json.

     Mathematics has no lesson kit, so the number pictures come from ART
     (tools/lib/ehel-film-art-math.js): ART.numberLine for counting on and back,
     ART.sequence for a number pattern with its jumps, ART.grid with numbers for
     the hundred square. The one thing ART has no drawing for is the lesson's
     own SHAPE strip - the tiles a child taps in steps 4 to 7, an orange circle,
     a teal square, a purple triangle and a gold diamond - so it is drawn here,
     in the lesson page's own colours (KINDS in patterns-that-grow.html).

     This file: the palette, the tile, the title motif, and the two shape
     chapters. Every top-level name starts with pg, so nothing here can replace
     a name of the engine, ART or MK. */

  var PGC = ART.C;                       /* the lessons' light palette */

  var HUE = {
    title: P.teal, repeat: P.accent, next: P.plum, counton: P.teal,
    step: P.gold, back: P.blue, hundred: P.good, recap: P.teal
  };

  /* the lesson's four tiles, by its own names (patterns-that-grow.html :: KINDS) */
  var PG_KIND = {
    a: { shape: "circle", col: PGC.accent },
    b: { shape: "square", col: PGC.teal },
    c: { shape: "triangle", col: PGC.plum },
    d: { shape: "diamond", col: PGC.gold }
  };
  var PG_AB = ["a", "b"], PG_ABB = ["a", "b", "b"];

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function pgOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function pgFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the tile -------------------------------------------------------------
     One of the lesson's shapes, centred on (cx, cy), r the half-width. */
  function pgShape(cx, cy, r, kind, col) {
    var k = PG_KIND[kind], c = col || k.col;
    if (k.shape === "circle") return C(cx, cy, r, c);
    if (k.shape === "square") return R(cx - r, cy - r, 2 * r, 2 * r, r * 0.26, c);
    if (k.shape === "triangle")
      return Pth("M" + n2(cx) + "," + n2(cy - r * 1.06) + " L" + n2(cx + r * 1.02) + "," + n2(cy + r * 0.82) +
        " L" + n2(cx - r * 1.02) + "," + n2(cy + r * 0.82) + " Z", c);
    return Pth("M" + n2(cx) + "," + n2(cy - r * 1.12) + " L" + n2(cx + r * 1.12) + "," + n2(cy) +
      " L" + n2(cx) + "," + n2(cy + r * 1.12) + " L" + n2(cx - r * 1.12) + "," + n2(cy) + " Z", c);
  }
  /* a tile on its own little cell, popped in as p goes 0 -> 1 */
  function pgTile(cx, cy, r, kind, p, lift) {
    if (!(p > 0)) return "";
    return G(R(cx - r - 7, cy - r - 7, 2 * r + 14, 2 * r + 14, 12, lift > 0 ? PGC.goldSoft : PGC.cell) +
      pgShape(cx, cy, r, kind), { transform: around(cx, cy, Math.min(p, 1.12)), opacity: Math.min(1, p) });
  }
  /* The empty slot a missing tile leaves. Grey, never the orange of the box
     round the part that repeats: two dashed orange boxes on one strip would
     mean two different things. */
  function pgGap(cx, cy, r, o) {
    if (!(o > 0)) return "";
    return G(R(cx - r - 7, cy - r - 7, 2 * r + 14, 2 * r + 14, 12, PGC.cell, PGC.muted, 3.5, { "stroke-dasharray": "9 6" }) +
      Tx(cx, cy + r * 0.52, "?", "lab", "middle", { "font-size": r * 1.5, fill: PGC.muted }), { opacity: clamp(o, 0, 1) });
  }
  /* the light card every drawing of this film stands on */
  function pgCard(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 22, PGC.card, PGC.line, 2, { opacity: clamp(o, 0, 1) });
  }
  /* the orange box the lesson draws round the part that repeats */
  function pgCoreBox(x0, x1, cy, r, p) {
    if (!(p > 0)) return "";
    var x = x0 - r - 14, w = x1 - x0 + 2 * r + 28, y = cy - r - 14, h = 2 * r + 28;
    return G(R(x, y, w, h, 16, "none", PGC.accent, 4, { "stroke-dasharray": "12 7" }),
      { transform: around((x0 + x1) / 2, cy, Math.min(p, 1.08)), opacity: Math.min(1, p) });
  }

  /* ==== the title motif ==========================================================
     The two halves of the lesson in one picture: a repeating shape strip above,
     a growing number row below. On the spoken title chapter each half lights as
     it is named; on the two cards both simply stand. */
  var PG_MOTIF_N = [2, 4, 6, 8];
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene || null, out = "";
    var cRepeat = sc0 ? sc(sc0, 0, "repeat") : null, cGrow = sc0 ? sc(sc0, 0, "grow") : null;
    var cPart = sc0 ? sc(sc0, 1, "part") : null, cStep = sc0 ? sc(sc0, 1, "step") : null,
      cNext = sc0 ? sc(sc0, 1, "next") : null;
    var still = !sc0;
    var shown = function (at) { return still ? 1 : popIn(t, at, 0.4); };

    /* the repeating strip - the whole card arrives with its own line, so the
       motif is never an empty white box waiting for a cue */
    var top = "", strip = ["a", "b", "a", "b"], i, cx;
    top += R(16, 34, 328, 128, 24, PGC.card, PGC.line, 3);
    for (i = 0; i < 4; i++) {
      cx = 62 + i * 76;
      top += pgTile(cx, 98, 28, strip[i], still ? 1 : popIn(t, cRepeat == null ? null : cRepeat + i * 0.17, 0.35), 0);
    }
    top += pgCoreBox(62, 138, 98, 28, shown(cPart));
    out += G(top, { opacity: still ? 1 : on(t, cRepeat, 0.5) });

    /* the growing row: 2, 4, 6 and then the one that comes next */
    var low = R(16, 198, 328, 128, 24, PGC.card, PGC.line, 3);
    var nx = still ? 1 : popIn(t, cNext, 0.4);
    for (i = 0; i < 4; i++) {
      cx = 62 + i * 76;
      var p = still ? 1 : popIn(t, cGrow == null ? null : cGrow + i * 0.17, 0.35);
      if (p > 0 && i < 3) low += G(R(cx - 28, 234, 56, 56, 12, PGC.tealSoft, PGC.teal, 2.5) +
        Tx(cx, 272, String(PG_MOTIF_N[i]), "lab", "middle", { "font-size": 34, fill: PGC.ink }),
        { transform: around(cx, 262, Math.min(p, 1.1)), opacity: Math.min(1, p) });
      if (p > 0 && i === 3) {
        low += G(R(cx - 28, 234, 56, 56, 12, PGC.card, PGC.accent, 3, { "stroke-dasharray": "8 5" }) +
          Tx(cx, 274, "?", "lab", "middle", { "font-size": 34, fill: PGC.accent }),
          { transform: around(cx, 262, Math.min(p, 1.1)), opacity: Math.min(1, p) * (1 - Math.min(1, nx)) });
        if (nx > 0) low += G(R(cx - 28, 234, 56, 56, 12, PGC.goldSoft, PGC.gold, 3) +
          Tx(cx, 272, "8", "lab", "middle", { "font-size": 34, fill: PGC.ink }),
          { transform: around(cx, 262, Math.min(nx, 1.1)), opacity: Math.min(1, nx) });
      }
      if (i) {
        var sp = still ? 1 : popIn(t, cStep == null ? null : cStep + (i - 1) * 0.16, 0.35);
        if (sp > 0) low += G(Tx(cx - 38, 224, "+2", "lab", "middle", { "font-size": 24, fill: PGC.teal }), { opacity: Math.min(1, sp) });
      }
    }
    out += G(low, { opacity: still ? 1 : on(t, cGrow, 0.5) });

    return '<svg viewBox="0 0 360 360" role="img" aria-label="A repeating strip of circles and squares above, and the numbers 2, 4, 6 growing below with the next one to find">' + out + "</svg>";
  }

  /* ==== chapter: the part that repeats ===========================================
     The lesson's own strip of twelve tiles, and the orange box it draws round
     the part that repeats. The strip is circle, square while the part is two
     shapes long, and changes to circle, square, square for the last beat. */
  var PG_R = { x: 64, y: 96, w: 1040, h: 190, n: 12, r: 29, pitch: 74, cy: 191, x0: 177 };
  function pgRX(i) { return PG_R.x0 + PG_R.pitch * i; }
  /* bumpN tiles light in turn from bumpAt, so only the shapes actually being
     named flash - the rest of the line stands still */
  function pgStrip(unit, count, bumpAt, bumpN, t) {
    var out = "", i;
    for (i = 0; i < count; i++) {
      out += pgTile(pgRX(i), PG_R.cy, PG_R.r, unit[i % unit.length], 1,
        bumpAt == null || i >= bumpN ? 0 : bump(t, bumpAt + i * 0.24, 0.5));
    }
    return out;
  }

  function pgRepeatChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cLine = c(0, "line"), cSay = c(0, "say");
    var cSmall = c(1, "small"), cRound = c(1, "round"), cSee = c(1, "see");
    var cHere = c(2, "here"), cPart = c(2, "part");
    var cTwo = c(3, "two"), cSix = c(3, "six"), cWhole3 = c(3, "whole");
    var cLonger = c(4, "longer"), cAbb = c(4, "abb"), cThree = c(4, "three"), cWhole = c(4, "whole");
    var out = "", k;

    var toAbb = into(t, scene.first + 4);          /* the strip changes on the last beat */
    out += pgCard(PG_R.x, PG_R.y, PG_R.w, PG_R.h, 1);

    /* "One small part comes round again and again": each pair of the line is
       washed gold in turn, under the tiles */
    var litN = tally(t, cRound, 6, 1.6), litO = pgOnly(t, scene, 1) * (1 - toAbb);
    if (litO > 0) {
      for (k = 0; k < litN; k++) {
        var wa = pgRX(2 * k) - PG_R.r - 11, wb = pgRX(2 * k + 1) + PG_R.r + 11;
        out += R(wa, PG_R.cy - PG_R.r - 11, wb - wa, 2 * PG_R.r + 22, 15, PGC.goldSoft, PGC.gold, 3, { opacity: litO });
      }
    }

    /* the twelve tiles arrive one at a time as the line is named */
    var n = tally(t, cLine, PG_R.n, 1.3);
    if (toAbb < 1) {
      /* circle, square: the first four bump in turn as they are said */
      out += G(pgStrip(PG_AB, n, cSay, 4, t), { opacity: 1 - toAbb });
    }
    if (toAbb > 0) {
      out += G(pgStrip(PG_ABB, PG_R.n, cAbb, 3, t), { opacity: toAbb });
    }

    /* "Say it six times": six brackets over the line, counted, and four over
       the longer part on the last beat - each above the card, never on it */
    var six = tally(t, cSix, 6, 1.6) * (toAbb < 1 ? 1 : 0);
    for (k = 0; k < six; k++) {
      var ax = pgRX(2 * k) - PG_R.r - 8, bx = pgRX(2 * k + 1) + PG_R.r + 8;
      out += Pth("M" + n2(ax) + ",88 L" + n2(ax) + ",76 L" + n2(bx) + ",76 L" + n2(bx) + ",88", null, P.gold, 3, { opacity: 1 - toAbb });
      out += Tx((ax + bx) / 2, 56, String(k + 1), "lab big", "middle", { fill: P.gold, opacity: 1 - toAbb });
    }
    var blocks = toAbb > 0 ? tally(t, cWhole, 4, 0.6) : 0;
    for (k = 0; k < blocks; k++) {
      var bax = pgRX(3 * k) - PG_R.r - 8, bbx = pgRX(3 * k + 2) + PG_R.r + 8;
      out += Pth("M" + n2(bax) + ",88 L" + n2(bax) + ",76 L" + n2(bbx) + ",76 L" + n2(bbx) + ",88", null, P.accent, 3, { opacity: toAbb });
      out += MK.tick((bax + bbx) / 2, 52, 19, popIn(t, cWhole == null ? null : cWhole + k * 0.17, 0.3) * toAbb);
    }

    /* "Can you see it?": a question mark beyond the end of the line */
    out += MK.qmark(pgRX(11) + 74, PG_R.cy, 26, popIn(t, cSee, 0.4) * pgOnly(t, scene, 1));
    out += MK.pill(584, 348, "one small part", on(t, cSmall, 0.4) * pgOnly(t, scene, 1), { size: 27, col: P.gold });

    /* "Here it is. The part that repeats": the orange box round the first two */
    out += pgCoreBox(pgRX(0), pgRX(1), PG_R.cy, PG_R.r, popIn(t, cHere, 0.4) * (1 - toAbb));
    var partO = on(t, cPart, 0.4) * (1 - toAbb);
    if (partO > 0) out += MK.leader(330, 330, pgRX(0) + 34, PG_R.cy + PG_R.r + 20, on(t, cPart, 0.6), P.accent) +
      MK.pill(330, 352, "the part that repeats", partO, { size: 27, col: P.accent });

    /* "It is two shapes long", and "the whole line" ringed */
    out += MK.pill(880, 352, "2 shapes long", popIn(t, cTwo, 0.4) * (1 - toAbb), { size: 28, col: P.gold });
    var whole3 = on(t, cWhole3, 0.5) * (1 - toAbb) * pgOnly(t, scene, 3);
    if (whole3 > 0) out += R(PG_R.x + 6, PG_R.y + 6, PG_R.w - 12, PG_R.h - 12, 18, "none", P.gold, 4, { opacity: whole3 });

    /* the longer part: circle, square, square */
    out += pgCoreBox(pgRX(0), pgRX(2), PG_R.cy, PG_R.r, popIn(t, cLonger, 0.4) * toAbb);
    out += MK.pill(880, 352, "3 shapes long", popIn(t, cThree, 0.4) * toAbb, { size: 28, col: P.accent });
    return svg(out);
  }

  /* ==== chapter: what comes next ==================================================
     A strip with a question mark at the end, then the answer; then a strip with
     a shape missing out of the middle, mended. Both are circle, square, square,
     the part the chapter before ended on. */
  var PG_N = { r: 44, pitch: 116, cy: 200, cardY: 112, cardH: 176 };
  function pgNX(start, i) { return start + PG_N.pitch * i; }

  function pgNextChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cFound = c(0, "found"), cNext = c(0, "next");
    var cSay = c(1, "say"), cAfter = c(1, "after");
    var cSquare = c(2, "square"), cTells = c(2, "tells");
    var cFalls = c(3, "falls"), cMends = c(3, "mends");
    var out = "", k;

    var toGap = into(t, scene.first + 3);        /* the second strip, on the last beat */

    /* ---- beats 0 to 2: circle, square, square, circle, and what comes next */
    if (toGap < 1) {
      var s1 = "", x0 = 352;
      s1 += pgCard(x0 - PG_N.r - 40, PG_N.cardY, 4 * PG_N.pitch + 2 * PG_N.r + 80, PG_N.cardH, 1);
      for (k = 0; k < 4; k++)
        s1 += pgTile(pgNX(x0, k), PG_N.cy, PG_N.r, PG_ABB[k % 3], 1, bump(t, cSay == null ? null : cSay + k * 0.26, 0.55));
      /* the part that repeats, still boxed */
      s1 += pgCoreBox(pgNX(x0, 0), pgNX(x0, 2), PG_N.cy, PG_N.r, popIn(t, cFound, 0.4));
      /* the empty last slot, then the answer in it */
      var ans = popIn(t, cSquare, 0.45);
      if (ans > 0) {
        s1 += pgTile(pgNX(x0, 4), PG_N.cy, PG_N.r, "b", ans, 1);
        s1 += MK.tick(pgNX(x0, 4), 322, 22, popIn(t, cSquare == null ? null : cSquare + 0.45, 0.35));
      } else {
        var q = on(t, cNext, 0.45), qb = 1 + 0.06 * bump(t, cAfter, 0.9);
        s1 += G(pgGap(pgNX(x0, 4), PG_N.cy, PG_N.r, q), { transform: around(pgNX(x0, 4), PG_N.cy, qb) });
      }
      /* "the part tells you, not the shape just before it" */
      var tell = on(t, cTells, 0.5);
      if (tell > 0) {
        s1 += MK.leader(pgNX(x0, 1), 330, pgNX(x0, 1), PG_N.cy + PG_N.r + 26, on(t, cTells, 0.7), P.plum);
        s1 += MK.pill(pgNX(x0, 1), 348, "the part tells you", tell, { size: 27, col: P.plum });
      }
      out += G(s1, { opacity: 1 - toGap });
    }

    /* ---- beat 3: one shape falls out of the middle, and the part mends it */
    if (toGap > 0) {
      var s2 = "", g0 = 120, miss = 4;
      s2 += pgCard(g0 - PG_N.r - 40, PG_N.cardY, 8 * PG_N.pitch + 2 * PG_N.r + 80, PG_N.cardH, 1);
      for (k = 0; k < 9; k++) {
        if (k === miss) continue;
        s2 += pgTile(pgNX(g0, k), PG_N.cy, PG_N.r, PG_ABB[k % 3], 1, 0);
      }
      /* the strip starts whole; the shape drops out as the words say it does */
      var mend = popIn(t, cMends, 0.45);
      if (mend > 0) {
        s2 += pgTile(pgNX(g0, miss), PG_N.cy, PG_N.r, PG_ABB[miss % 3], mend, 1);
        s2 += MK.tick(pgNX(g0, miss), 340, 22, popIn(t, cMends == null ? null : cMends + 0.45, 0.35));
      } else {
        var fell = on(t, cFalls, 0.4);
        if (fell < 1) s2 += G(pgTile(pgNX(g0, miss), PG_N.cy, PG_N.r, PG_ABB[miss % 3], 1, 0), { opacity: 1 - fell });
        s2 += pgGap(pgNX(g0, miss), PG_N.cy, PG_N.r, fell);
        s2 += MK.ripple(pgNX(g0, miss), PG_N.cy, t, cFalls, P.accent);
      }
      /* the part that repeats, boxed at the start, so the gap can be read off it */
      s2 += pgCoreBox(pgNX(g0, 0), pgNX(g0, 2), PG_N.cy, PG_N.r, on(t, cFalls, 0.5));
      out += G(s2, { opacity: toGap });
    }
    return svg(out);
  }
