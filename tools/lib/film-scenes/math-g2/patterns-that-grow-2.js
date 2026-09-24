  /* ==== Grade 2 Mathematics, Lesson 4: Patterns That Grow, part 2 ==============
     tools/lib/film-scenes/math-g2/patterns-that-grow-2.js. The number chapters,
     the recap and KINDS. Continues patterns-that-grow.js and shares its scope.

     Every picture here is one of ART's drawings, nested with ART.place and then
     marked up in FILM coordinates: ART.numberLine for counting on and counting
     back, ART.sequence for a number pattern and its jumps, ART.grid with
     numbers for the hundred square. A drawing is one static <svg>, so a thing
     that arrives as it is said is either uncovered by a card-coloured cover
     that shrinks away, or drawn a second time and faded in over the first -
     never by redrawing the card at a different size, which would move the axis
     under the child. Every cover stops clear of an arrowhead: a jump's head
     lies entirely behind its own tip, so a cover may start 3 units past it. */

  /* ---- where the drawings sit in the 1168 x 440 stage -------------------- */
  var PG_L = { X: 66.5, Y: 96.6, S: 1.15, W: 900, H: 178 };     /* a number line */
  function pgLx(x) { return PG_L.X + x * PG_L.S; }
  function pgLy(y) { return PG_L.Y + y * PG_L.S; }
  function pgLine(o) { return ART.place(ART.numberLine(o), PG_L.X, PG_L.Y, PG_L.W * PG_L.S, PG_L.H * PG_L.S); }
  /* the jump band of a number line, painted out between two card positions */
  function pgLineCover(a, b) {
    if (b <= a) return "";
    return R(pgLx(a), pgLy(16), pgLx(b) - pgLx(a), pgLy(104) - pgLy(16), 0, PGC.card);
  }
  /* the lesson's own marker: a fat dot sitting on the line */
  function pgMark(x, p, col) {
    if (!(p > 0)) return "";
    return G(C(x, pgLy(116), 16, col || PGC.accent, PGC.card, 4),
      { transform: around(x, pgLy(116), Math.min(p, 1.12)), opacity: Math.min(1, p) });
  }
  var PG_JY = 96.6 + 41.8 * 1.15 - 6;   /* the film y of a jump's +n label */

  var PG_S = { X: 118, Y: 80, S: 2, W: 466, H: 132 };            /* a 4-term sequence */
  function pgSeqCard(o) { return ART.place(ART.sequence(o), PG_S.X, PG_S.Y, PG_S.W * PG_S.S, PG_S.H * PG_S.S); }
  function pgSTerm(i) { return PG_S.X + (56 + 118 * i) * PG_S.S; }      /* a term's centre x */
  function pgSJump(i) { return PG_S.X + (118 * i - 3) * PG_S.S; }       /* a jump label's centre x */
  var PG_SCY = 80 + 76 * 2, PG_SHALF = 34 * 2, PG_SJY = 80 + 24 * 2;

  /* ==== chapter: counting on in steps ==============================================
     The lesson's own two counts on ART's number line: start at 3 and count on
     in twos to 11, then start at 20 and count on in fives to 35. */
  var PG_ON_A = { from: 1, to: 13, step: 1, labelEvery: 2, width: 900,
    jumps: [{ from: 3, to: 5, label: "+2" }, { from: 5, to: 7, label: "+2" },
      { from: 7, to: 9, label: "+2" }, { from: 9, to: 11, label: "+2" }] };
  var PG_ON_B = { from: 15, to: 40, step: 5, labelEvery: 5, width: 900,
    jumps: [{ from: 20, to: 25, label: "+5" }, { from: 25, to: 30, label: "+5" }, { from: 30, to: 35, label: "+5" }] };
  /* where a value sits on each line, in that card's own coordinates */
  function pgOnAX(v) { return 36 + 69 * (v - 1); }
  function pgOnBX(v) { return 36 + 33.12 * (v - 15); }

  function pgContonChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cNum = c(0, "numbers"), cSteps = c(0, "steps");
    var cStart = c(1, "start"), cTwos = c(1, "twos"), cSeqA = c(1, "seq");
    var cSame = c(2, "same"), cAdd = c(2, "add");
    var cAny = c(3, "anywhere"), cSeqB = c(3, "seq"), cFives = c(3, "fives");
    var out = "", k;

    var toB = into(t, scene.first + 3);

    /* ---- 3, 5, 7, 9, 11 */
    if (toB < 1) {
      var a = "", nA = tally(t, cSeqA, 4, 1.2);
      a += pgLine(PG_ON_A);
      a += pgLineCover(nA === 0 ? pgOnAX(3) - 14 : pgOnAX(3 + 2 * nA) + 3, 896);
      a += pgMark(pgLx(pgOnAX(3)), popIn(t, cStart, 0.4));
      /* "Every jump is the same size": a ring round each +2, in turn */
      var ringA = pgOnly(t, scene, 2) > 0.4 ? tally(t, cSame, 4, 1.3) : 0;
      for (k = 0; k < ringA; k++)
        a += C(pgLx((pgOnAX(3 + 2 * k) + pgOnAX(5 + 2 * k)) / 2), PG_JY, 27, "none", PGC.gold, 4);
      out += G(a, { opacity: 1 - toB });
    }

    /* ---- 20, 25, 30, 35 */
    if (toB > 0) {
      var b = "", nB = tally(t, cSeqB, 3, 1.4);
      b += pgLine(PG_ON_B);
      b += pgLineCover(nB === 0 ? pgOnBX(20) - 14 : pgOnBX(20 + 5 * nB) + 3, 896);
      b += pgMark(pgLx(pgOnBX(20)), popIn(t, cAny, 0.4));
      out += G(b, { opacity: toB });
    }

    /* the words, one beat at a time */
    out += MK.pill(584, 356, "count on in steps", on(t, cSteps, 0.4) * pgOnly(t, scene, 0), { size: 30, col: P.teal });
    out += MK.pill(584, 356, "count on in twos", on(t, cTwos, 0.4) * pgOnly(t, scene, 1), { size: 30, col: P.gold });
    out += MK.pill(584, 356, "add 2 each time", on(t, cAdd, 0.4) * pgOnly(t, scene, 2), { size: 30, col: P.gold });
    out += MK.pill(584, 356, "up in fives", on(t, cFives, 0.4) * pgOnly(t, scene, 3), { size: 30, col: P.teal });
    out += MK.pill(584, 44, "numbers make patterns", on(t, cNum, 0.5) * pgOnly(t, scene, 0), { size: 27, col: P.line, ink: P.muted });
    return svg(out);
  }

  /* ==== chapter: how much does it go up? ===========================================
     ART.sequence draws the pattern and the jump between each pair: 15, 20, 25,
     30 first, then the lesson's missing number, 10, 20, gap, 40. */
  var PG_UP_A = { terms: [15, 20, 25, 30], arrows: true, step: 5 };
  var PG_UP_B = { terms: [10, 20, null, 40], arrows: true, step: 10 };
  var PG_UP_C = { terms: [10, 20, 30, 40], arrows: true, step: 10 };

  function pgStepChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSeq = c(0, "seq"), cUp = c(0, "up");
    var cJumps = c(1, "jumps");
    var cOne = c(2, "one"), cTwo = c(2, "two");
    var cCheck = c(3, "check"), cTrick = c(3, "trick");
    var cEvery = c(4, "every"), cFives = c(4, "fives");
    var cHiding = c(5, "hiding"), cSeqB = c(5, "seq");
    var cTens = c(6, "tens"), cAns = c(6, "ans");
    var out = "", k;

    var toB = into(t, scene.first + 5);

    if (toB < 1) {
      var a = "", shown = tally(t, cSeq, 4, 1.5);
      a += pgSeqCard(PG_UP_A);
      /* the four terms and their jumps arrive as they are said */
      var cut = Math.max(124, PG_S.X + (22 + 118 * shown - 46) * PG_S.S);
      /* the cover never reaches the card's rounded corner: with every term shown
         there is nothing left to hide, and a square rect there would notch it */
      if (shown < 4) a += R(cut, 86, 1044 - cut, 252, 0, PGC.card);
      a += MK.qmark(1092, PG_SCY, 30, popIn(t, cUp, 0.45) * pgOnly(t, scene, 0));
      /* "Look at the jumps between them": each +5 ringed in turn */
      var look = pgOnly(t, scene, 1) > 0.4 ? tally(t, cJumps, 3, 1.2) : 0;
      for (k = 1; k <= look; k++) a += C(pgSJump(k), PG_SJY, 30, "none", PGC.gold, 4);
      /* "15 to 20 is 5. And 20 to 25 is 5 again." */
      a += C(pgSJump(1), PG_SJY, 30, "none", PGC.accent, 5, { opacity: on(t, cOne, 0.4) * pgOnly(t, scene, 2) });
      a += C(pgSJump(2), PG_SJY, 30, "none", PGC.accent, 5, { opacity: on(t, cTwo, 0.4) * pgOnly(t, scene, 2) });
      /* "Always check two jumps": both held, and one on its own gets a question */
      var chk = on(t, cCheck, 0.4) * pgOnly(t, scene, 3);
      a += C(pgSJump(1), PG_SJY, 30, "none", PGC.teal, 5, { opacity: chk });
      a += C(pgSJump(2), PG_SJY, 30, "none", PGC.teal, 5, { opacity: chk });
      a += C(pgSJump(3), PG_SJY, 30, "none", PGC.muted, 5, { opacity: on(t, cTrick, 0.4) * pgOnly(t, scene, 3) });
      a += MK.qmark(pgSJump(3), 376, 24, popIn(t, cTrick, 0.4) * pgOnly(t, scene, 3));
      /* "Every jump here is 5": each jump ticked, left to right */
      var ev = pgOnly(t, scene, 4) > 0.4 ? tally(t, cEvery, 3, 1.2) : 0;
      for (k = 1; k <= ev; k++)
        a += MK.tick(pgSJump(k), PG_SJY - 2, 24, popIn(t, cEvery == null ? null : cEvery + (k - 1) * 0.42, 0.35));
      out += G(a, { opacity: 1 - toB });
    }

    if (toB > 0) {
      /* 10, 20, gap, 40 - and the same card with 30 in it, faded in on the word */
      var b = pgSeqCard(PG_UP_B);
      b += MK.ripple(pgSTerm(2), PG_SCY, t, cSeqB, P.accent);
      var ans = on(t, cAns, 0.45);
      if (ans > 0) {
        var d = pgSeqCard(PG_UP_C);
        d += R(pgSTerm(2) - PG_SHALF - 8, PG_SCY - PG_SHALF - 8, 2 * PG_SHALF + 16, 2 * PG_SHALF + 16, 18, "none", PGC.good, 5);
        b += G(d, { opacity: ans });
        b += MK.tick(pgSTerm(2), 112, 24, popIn(t, cAns == null ? null : cAns + 0.4, 0.35));
      }
      out += G(b, { opacity: toB });
    }

    /* the words, under the card, one beat at a time */
    out += MK.pill(584, 392, "up in fives", on(t, cFives, 0.4) * pgOnly(t, scene, 4), { size: 30, col: P.gold });
    out += MK.pill(584, 392, "one number is hiding", on(t, cHiding, 0.4) * pgOnly(t, scene, 5), { size: 30, col: P.accent });
    out += MK.pill(584, 392, "up in tens", on(t, cTens, 0.4) * pgOnly(t, scene, 6), { size: 30, col: P.good });
    out += MK.pill(584, 44, "check two jumps, not one", on(t, cCheck, 0.4) * pgOnly(t, scene, 3), { size: 27, col: P.teal });
    return svg(out);
  }

  /* ==== chapter: counting back in steps ============================================
     The lesson's own count: start at 50 and count back in tens. The jumps are
     uncovered from the right, because that is the way the child counts. */
  var PG_BACK = { from: 0, to: 60, step: 10, labelEvery: 10, width: 900,
    jumps: [{ from: 50, to: 40, label: "−10" }, { from: 40, to: 30, label: "−10" },
      { from: 30, to: 20, label: "−10" }] };
  function pgBackX(v) { return 36 + 13.8 * v; }

  function pgBackChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cBack = c(0, "back"), cAway = c(0, "away");
    var cStart = c(1, "start"), cTens = c(1, "tens"), cSeq = c(1, "seq");
    var cSmall = c(2, "smaller"), cWrong = c(2, "wrong");
    var out = "";

    var n = tally(t, cSeq, 3, 1.5);
    out += pgLine(PG_BACK);
    out += pgLineCover(4, n === 0 ? pgBackX(50) + 14 : pgBackX(50 - 10 * n) - 13);
    out += pgMark(pgLx(pgBackX(50)), popIn(t, cStart, 0.4));

    /* "the numbers get smaller": an arrow back along the line, below it */
    var sm = on(t, cSmall, 0.8);
    out += MK.arrow(pgLx(pgBackX(50)), 332, pgLx(pgBackX(20)), 332, sm, P.gold, 7);
    /* "you went the wrong way": the other way, crossed out */
    var wr = on(t, cWrong, 0.5);
    if (wr > 0) {
      out += MK.arrow(pgLx(pgBackX(20)), 396, pgLx(pgBackX(35)), 396, wr, P.muted, 7);
      out += MK.cross((pgLx(pgBackX(20)) + pgLx(pgBackX(35))) / 2, 396, 26, popIn(t, cWrong == null ? null : cWrong + 0.3, 0.35));
    }
    out += MK.pill(300, 332, "smaller", on(t, cSmall, 0.4) * pgOnly(t, scene, 2), { size: 27, col: P.gold });
    out += MK.pill(584, 44, "counting back", on(t, cBack, 0.4) * pgOnly(t, scene, 0) * (1 - on(t, cAway, 0.4)), { size: 28, col: P.blue });
    out += MK.pill(584, 44, "take the same step away", on(t, cAway, 0.4) * pgOnly(t, scene, 0), { size: 28, col: P.blue });
    out += MK.pill(584, 44, "count back in tens", on(t, cTens, 0.4) * pgOnly(t, scene, 1), { size: 28, col: P.gold });
    return svg(out);
  }

  /* ==== chapter: the hundred square ================================================
     ART.grid with numbers is the lesson's own hundred square; ART.sequence
     beside it is the same pattern written out. 5, 15, 25 and 35 sit straight
     down one column, so the next is 45. Column 5 of the square holds every
     number ending in 5, one row apart, which is ten apart. */
  /* A hundred square is ten rows in 440 px however it is drawn, so its own
     numbers land at about 17 px whatever cell is chosen - under lab mid. The
     big cell keeps them as large as the height allows, and the sequence card
     beside it is the readable copy of the same five numbers. */
  var PG_G = { X: 700, Y: 3, W: 604, cell: 56, edge: 22, box: 434 };
  PG_G.S = PG_G.box / PG_G.W;
  function pgGx(col) { return PG_G.X + (PG_G.edge + PG_G.cell * (col + 0.5)) * PG_G.S; }
  function pgGy(row) { return PG_G.Y + (PG_G.edge + PG_G.cell * (row + 0.5)) * PG_G.S; }
  var PG_GHALF = PG_G.cell * PG_G.S / 2;
  function pgGrid(cells) {
    return ART.place(ART.grid({ cols: 10, rows: 10, cell: PG_G.cell, numbers: true, fill: cells }),
      PG_G.X, PG_G.Y, PG_G.box, PG_G.box);
  }
  var PG_Q = { X: 24, Y: 232, S: 1.1, W: 584, H: 132 };
  function pgQCard(o) { return ART.place(ART.sequence(o), PG_Q.X, PG_Q.Y, PG_Q.W * PG_Q.S, PG_Q.H * PG_Q.S); }
  function pgQTerm(i) { return PG_Q.X + (56 + 118 * i) * PG_Q.S; }
  function pgQJump(i) { return PG_Q.X + (118 * i - 3) * PG_Q.S; }
  var PG_QCY = 232 + 76 * 1.1, PG_QHALF = 34 * 1.1, PG_QJY = 232 + 24 * 1.1;
  var PG_COL = [[4, 0], [4, 1], [4, 2], [4, 3]];
  var PG_Q_ASK = { terms: [5, 15, 25, 35, null], arrows: true, step: 10 };
  var PG_Q_ANS = { terms: [5, 15, 25, 35, 45], arrows: true, step: 10 };

  function pgHundredChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cHide = c(0, "hide");
    var cCol = c(1, "coloured"), cSeq = c(1, "seq");
    var cDown = c(2, "down"), cTen = c(2, "ten");
    var cNext = c(3, "next"), cRow = c(3, "row");
    var out = "", k;

    /* the hundred square, its column lighting one cell at a time */
    var lit = tally(t, cSeq, 4, 1.5), grid = on(t, cHide, 0.5), nx = on(t, cNext, 0.45);
    out += G(pgGrid(PG_COL.slice(0, lit)), { opacity: grid });
    if (nx > 0) out += G(pgGrid(PG_COL.concat([[4, 4]])), { opacity: nx * grid });

    /* the same pattern written out, beside it */
    var qo = on(t, cCol, 0.45);
    if (qo > 0) {
      var q = pgQCard(PG_Q_ASK), terms = cTen != null && t >= cTen ? 5 : lit;
      if (nx > 0) q += G(pgQCard(PG_Q_ANS), { opacity: nx });
      var cut = Math.max(28, PG_Q.X + (22 + 118 * terms - 46) * PG_Q.S);
      if (terms < 5) q += R(cut, 235, 663 - cut, 138, 0, PGC.card);
      /* "Each one is ten more": every +10 ringed in turn */
      var rings = pgOnly(t, scene, 2) > 0.4 ? tally(t, cTen, 4, 1.4) : 0;
      for (k = 1; k <= rings; k++) q += C(pgQJump(k), PG_QJY, 24, "none", PGC.gold, 4);
      if (nx > 0) q += R(pgQTerm(4) - PG_QHALF - 6, PG_QCY - PG_QHALF - 6, 2 * PG_QHALF + 12, 2 * PG_QHALF + 12, 14,
        "none", PGC.good, 5, { opacity: nx });
      out += G(q, { opacity: qo });
    }

    /* "They go straight down one column": the column boxed, top to bottom, and
       on the last beat the box grows down one more row, onto 45 */
    var dn = on(t, cDown, 0.9), rows = 3 + on(t, cRow, 0.6);
    if (dn > 0) {
      var y0 = pgGy(0) - PG_GHALF - 4, y1 = pgGy(0) + PG_GHALF + 4 + (pgGy(1) - pgGy(0)) * rows;
      out += R(pgGx(4) - PG_GHALF - 4, y0, 2 * PG_GHALF + 8, (y1 - y0) * dn, 8, "none",
        rows > 3.5 ? P.good : P.gold, 4, { opacity: dn });
    }
    out += MK.pill(300, 74, "hidden patterns", on(t, cHide, 0.4) * pgOnly(t, scene, 0), { size: 28, col: P.good });
    out += MK.pill(300, 74, "straight down one column", on(t, cDown, 0.4) * pgOnly(t, scene, 2), { size: 26, col: P.gold });
    out += MK.pill(300, 74, "the next one is 45", on(t, cNext, 0.4) * pgOnly(t, scene, 3), { size: 28, col: P.good });
    out += MK.pill(300, 150, "ten more each time", on(t, cTen, 0.4) * pgOnly(t, scene, 2), { size: 26, col: P.gold });
    out += MK.pill(300, 150, "down one row adds ten", on(t, cRow, 0.4) * pgOnly(t, scene, 3), { size: 26, col: P.good });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------- */
  function pgRecapTiles(cx, cy, size) {
    var r = size * 0.15, gap = size * 0.4, kinds = ["a", "b", "a"], out = "", k;
    for (k = 0; k < 3; k++) out += pgShape(cx + (k - 1) * gap, cy, r, kinds[k]);
    return out;
  }
  function pgRecapUp(cx, cy, size) {
    return MK.arrow(cx - size * 0.34, cy + size * 0.3, cx + size * 0.34, cy - size * 0.3, 1, P.gold, 9) +
      Tx(cx - size * 0.14, cy - size * 0.34, "+5", "lab big", "middle", { fill: P.gold });
  }
  function pgRecapBack(cx, cy, size) {
    return MK.arrow(cx + size * 0.34, cy - size * 0.3, cx - size * 0.34, cy + size * 0.3, 1, P.blue, 9) +
      Tx(cx + size * 0.18, cy - size * 0.34, "−10", "lab big", "middle", { fill: P.blue });
  }
  function pgRecapGrid(cx, cy, size) {
    var n = 4, cell = size * 0.22, x0 = cx - n * cell / 2, y0 = cy - n * cell / 2, out = "", a, b;
    for (a = 0; a < n; a++) for (b = 0; b < n; b++)
      out += R(x0 + a * cell, y0 + b * cell, cell, cell, 2, a === 2 ? PGC.gold : PGC.card, PGC.line, 1.5);
    return out + R(x0, y0, n * cell, n * cell, 2, "none", PGC.ink, 2.5);
  }
  var PG_RECAP = MK.recapKind([
    { beat: 0, at: "part", title: "The part", sub: "it comes round again", pic: pgRecapTiles },
    { beat: 1, at: "up", title: "Going up", sub: "15, 20, 25, 30", pic: pgRecapUp },
    { beat: 1, at: "back", title: "Going back", sub: "50, 40, 30, 20", pic: pgRecapBack },
    { beat: 2, at: "on", title: "In steps", sub: "twos, fives and tens", pic: "\u{1F463}" },
    { beat: 2, at: "any", title: "From any number", sub: "up to 100", pic: pgRecapGrid }
  ], { goBeat: 3, goAt: "find" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The part that repeats", "What comes next", "Counting on and back in steps"] }),
    repeat: pgRepeatChapter, next: pgNextChapter, counton: pgContonChapter,
    step: pgStepChapter, back: pgBackChapter, hundred: pgHundredChapter, recap: PG_RECAP
  };
