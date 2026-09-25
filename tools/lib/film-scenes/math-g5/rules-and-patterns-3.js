
  /* ==== Rules and Patterns, part 3 ================================================
     The chapters "Shape patterns" and "Steps past zero", and what you now know. */

  /* ==== chapter: shape patterns ====================================================
     ART has no growing-matchstick-pattern picture, so this is hand-drawn,
     copied from the lesson's OWN drawing rule (rules-and-patterns.html's
     drawPattern6): the first square draws all four of its sides; every square
     after it draws only top, right and bottom, because its left side is the
     previous square's right side, already on the page. That is the whole
     reason the count goes up in 3s, and drawing it the lesson's way is what
     makes the reason visible instead of asserted. count(n) = 3n + 1, the
     lesson's own PATS[0] formula, so 1 -> 4, 2 -> 7, 3 -> 10, 10 -> 31. */
  function rapCount(n) { return 3 * n + 1; }
  function rapRowGeom(n) {
    var cell = n <= 3 ? 90 : 40, totalW = n * cell;
    return { cell: cell, x0: 584 - totalW / 2, y0: 115 - cell / 2 };
  }
  function rapSquaresRow(n, x0, y0, cell, newIdx, col, newCol) {
    var out = "", i;
    for (i = 0; i < n; i++) {
      var x = x0 + i * cell, c = i === newIdx ? (newCol || P.gold) : (col || P.ink);
      if (i === 0) out += L(x, y0, x, y0 + cell, c, 5);
      out += L(x, y0, x + cell, y0, c, 5) + L(x, y0 + cell, x + cell, y0 + cell, c, 5) + L(x + cell, y0, x + cell, y0 + cell, c, 5);
    }
    return out;
  }
  function rapPatStage(n, newIdx, opacity) {
    if (!(opacity > 0)) return "";
    var g = rapRowGeom(n);
    return G(rapSquaresRow(n, g.x0, g.y0, g.cell, newIdx, P.ink, P.gold) +
      Tx(584, g.y0 + g.cell + 40, rapCount(n) + " sticks", "lab big", "middle", { opacity: opacity }),
      { opacity: opacity });
  }

  function rapShapePatternsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSquares2 = c(0, "squares2");
    var cP1 = c(1, "p1"), cP2 = c(1, "p2");
    var cP3 = c(2, "p3"), cGap3 = c(2, "gap3");
    var cShares = c(3, "shares"), cNewsticks = c(3, "newsticks");
    var cP10 = c(4, "p10"), cNobuild = c(4, "nobuild");

    var u1 = cP2 == null ? 0 : rapStep(t, cP2, 0.6);   /* 1 -> 2 */
    var u2 = cP3 == null ? 0 : rapStep(t, cP3, 0.6);   /* 2 -> 3 */
    var u3 = cP10 == null ? 0 : rapStep(t, cP10, 0.7); /* 3 -> 10 */

    var out = rapPatStage(1, 0, 1 - u1) + rapPatStage(2, 1, u1 * (1 - u2)) +
      rapPatStage(3, 2, u2 * (1 - u3)) + rapPatStage(10, -1, u3);

    /* beat 0: the very first square rings as "matchstick squares" is named */
    var sq2O = popIn(t, cSquares2, 0.4) * rapOnly(t, scene, 0);
    if (sq2O > 0) {
      var g1 = rapRowGeom(1);
      out += rapRing(g1.x0 + g1.cell / 2, g1.y0 + g1.cell / 2, g1.cell * 0.62, Math.min(1, sq2O), P.gold);
    }

    /* beat 2: the gap is always 3 - a pill beside the settled 3-square row */
    var gap3O = on(t, cGap3, 0.5) * rapOnly(t, scene, 2);
    if (gap3O > 0) out += MK.pill(950, 50, "+3 every time", gap3O, { size: 28, col: P.gold });

    /* beat 3: ring the shared edge between squares 2 and 3 - the side that is
       NOT drawn again - and separately mark the 3 sides that ARE new, the top,
       right and bottom of the new square, the whole reason the count goes up
       in 3s rather than 4s. */
    var sharesO = popIn(t, cShares, 0.4) * rapOnly(t, scene, 3);
    if (sharesO > 0) {
      var g3 = rapRowGeom(3), sx = g3.x0 + 2 * g3.cell, sy = g3.y0 + g3.cell / 2;
      out += rapRing(sx, sy, g3.cell * 0.55, Math.min(1, sharesO), P.teal);
      out += MK.pill(950, 130, "shares a side", sharesO, { size: 26, col: P.teal });
    }
    var newO = popIn(t, cNewsticks, 0.4) * rapOnly(t, scene, 3);
    if (newO > 0) {
      var g3b = rapRowGeom(3), nx = g3b.x0 + 2.5 * g3b.cell, ny = g3b.y0 - 8;
      out += MK.pill(nx, ny, "3 new sticks", Math.min(1, newO), { size: 24, col: P.gold });
    }

    /* beat 4: pattern 10 needed no building at all - a tick beside its count */
    var noBuildO = popIn(t, cNobuild, 0.4) * rapOnly(t, scene, 4);
    if (noBuildO > 0) {
      var g10 = rapRowGeom(10);
      out += MK.tick(g10.x0 + g10.cell * 10 + 30, g10.y0 + g10.cell / 2, 20, Math.min(1, noBuildO));
    }
    return svg(out);
  }

  /* ==== chapter: steps past zero ====================================================
     ART.numberLine, revealed one hop at a time, then a second, wider line for
     the single "1 subtract 3" hop that lands below the first line's own range.
     Both use only the lesson's own numbers. */
  var RAP_NL1 = { x: 44, y: 90, w: 1080 };
  var RAP_NL1_JUMPS = [
    { from: 2, to: 1.5, label: "−0.5" }, { from: 1.5, to: 1, label: "−0.5" },
    { from: 1, to: 0.5, label: "−0.5" }, { from: 0.5, to: 0, label: "−0.5" },
    { from: 0, to: -0.5, label: "−0.5" }
  ];
  var RAP_NL2 = { x: 234, y: 90, w: 700 };

  function rapNumberLineChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSmaller = c(0, "smaller"), cPastzero = c(0, "pastzero");
    var cStarttwo = c(1, "starttwo"), cHalfstep = c(1, "halfstep");
    var cHops = c(2, "hops");
    var cFromone = c(3, "fromone"), cMinustwo = c(3, "minustwo");

    var out = "";
    var fade1 = on(t, scene.start, 0.6);
    var reached = Math.round(tally(t, cHops, 5, 3.4));
    if (cStarttwo != null && t >= cStarttwo) reached = Math.max(reached, 0);
    var jumps1 = RAP_NL1_JUMPS.slice(0, Math.max(reached, 0));
    out += G(ART.place(ART.numberLine({ from: -1, to: 2, step: 0.5, jumps: jumps1 }),
      RAP_NL1.x, RAP_NL1.y, RAP_NL1.w, 178), { opacity: fade1 });

    /* beat 1: the starting point, 2, rings before the hops begin */
    var startO = on(t, cStarttwo, 0.5) * rapOnly(t, scene, 1);
    if (startO > 0) {
      var x2 = RAP_NL1.x + 36 + ((2 - -1) / 3) * (RAP_NL1.w - 72), y2 = RAP_NL1.y + 116;
      out += rapRing(x2, y2, 16, startO, P.accent);
      out += MK.pill(x2, RAP_NL1.y + 40, "start", startO, { size: 24, col: P.accent });
    }
    var halfO = on(t, cHalfstep, 0.5) * rapOnly(t, scene, 1);
    if (halfO > 0) out += MK.pill(140, RAP_NL1.y + 40, "each hop 0.5", halfO, { size: 26, anchor: "start", col: P.bad });

    /* beat 3: a second, wider line for the single "1 subtract 3" hop */
    var fade2 = cFromone == null ? 0 : on(t, cFromone, 0.7);
    if (fade2 > 0) {
      out += G(ART.place(ART.numberLine({ from: -3, to: 2, step: 1, jumps: [{ from: 1, to: -2, label: "−3" }] }),
        RAP_NL2.x, RAP_NL2.y, RAP_NL2.w, 178), { opacity: fade2 });
      var landO = popIn(t, cMinustwo, 0.4);
      if (landO > 0) {
        var xNeg2 = RAP_NL2.x + 36 + ((-2 - -3) / 5) * (RAP_NL2.w - 72), yLand = RAP_NL2.y + 116;
        out += rapRing(xNeg2, yLand, 18, Math.min(1, landO), P.bad);
      }
    }
    return svg(out);
  }

  /* ==== what you now know ========================================================= */
  function rapMiniSeq(cx, cy, size) {
    var xs = [cx - size * 0.38, cx - size * 0.05, cx + size * 0.3], out = "", k;
    for (k = 0; k < 3; k++) {
      out += R(xs[k] - size * 0.14, cy - size * 0.14, size * 0.28, size * 0.28, 4, "none", P.teal, 3);
      if (k) out += MK.arrow(xs[k - 1] + size * 0.14, cy, xs[k] - size * 0.14, cy, 1, P.gold, 3);
    }
    return out;
  }
  function rapMiniShapes(cx, cy, size) {
    var r = size * 0.24;
    return rapTri(cx - size * 0.22, cy, r, P.gold, 1) + rapCirc(cx + size * 0.22, cy, r, P.teal, 1) +
      Tx(cx, cy + size * 0.42, "= 10, = 4", "lab mid muted readable", "middle");
  }
  function rapMiniGapTree(cx, cy, size) {
    var xs = [cx - size * 0.3, cx, cx + size * 0.3], out = "", k;
    for (k = 0; k < 3; k++) out += C(xs[k], cy - size * 0.18, size * 0.08, P.teal);
    out += C(cx - size * 0.15, cy + size * 0.14, size * 0.07, P.gold) + C(cx + size * 0.15, cy + size * 0.14, size * 0.07, P.gold);
    return out;
  }
  function rapMiniLine(cx, cy, size) {
    var out = L(cx - size * 0.42, cy, cx + size * 0.42, cy, P.ink, 3), k;
    for (k = -2; k <= 2; k++) out += L(cx + k * size * 0.16, cy - 6, cx + k * size * 0.16, cy + 6, P.ink, 2);
    return out + rapRing(cx - size * 0.16, cy, size * 0.14, 1, P.bad);
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["A rule builds a sequence forwards", "Two shapes, two unknown facts", "The rule hides in a growing pattern"] }),
    seqrule: rapSeqRuleChapter, findrule: rapFindRuleChapter,
    twounknowns: rapTwoUnknownsChapter, hiddensquares: rapHiddenSquaresChapter,
    shapepatterns: rapShapePatternsChapter, numberline: rapNumberLineChapter,
    recap: rapRecapChapter
  };

  /* Each recap beat names TWO phrases (the card's own title cue, read by
     MK.recapKind below, and a short echo of its sub-line) - "check every
     gap", "always exactly enough", "the gaps of the gaps" - so this wraps the
     base recap and adds a small caption reading the second phrase of each
     beat, rather than leaving it a promise the film never keeps. */
  var RAP_RECAP_BASE = MK.recapKind([
    { beat: 0, at: "rulebuild", title: "A rule builds it", sub: "check every gap", pic: rapMiniSeq },
    { beat: 1, at: "twofacts", title: "Two facts, two shapes", sub: "always exactly enough", pic: rapMiniShapes },
    { beat: 2, at: "hide", title: "Squares and cubes hide", sub: "in the gaps of the gaps", pic: rapMiniGapTree },
    { beat: 3, at: "shapesnl", title: "Shapes and number lines", sub: "the very same rule", pic: rapMiniLine }
  ], { goBeat: 3, goAt: "samerule" });

  function rapRecapChapter(scene, beat, t, i) {
    var html = RAP_RECAP_BASE(scene, beat, t, i);
    var c = function (k, n) { return sc(scene, k, n); };
    var echoes = [
      [c(0, "gapcheck"), "every gap"],
      [c(1, "enough"), "always exactly enough"],
      [c(2, "gog"), "the gaps of the gaps"]
    ], extra = "";
    echoes.forEach(function (e) {
      var o = popIn(t, e[0], 0.4);
      if (o > 0) extra += Tx(584, 223, e[1], "lab small muted readable", "middle", { opacity: Math.min(1, o) });
    });
    return html.replace("</svg>", extra + "</svg>");
  }
