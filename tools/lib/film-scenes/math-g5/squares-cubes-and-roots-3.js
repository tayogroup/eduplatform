
  /* ==== Squares, Cubes and Roots, part 3 =========================================
     The chapters "Cube roots" and "Triangular numbers", and what you now know. */

  /* ==== chapter: cube roots =======================================================
     Two pictures side by side answer the lesson's own contrast (Step 6): a
     stack of 4 layers of 4 x 4 blocks (64, built as the cube root question asks
     - how many blocks on an edge) on the left, and an 8 x 8 dot square (64, the
     SQUARE root) on the right - the same 64, two different roots, exactly the
     lesson's own "same number, different roots". Beats 3-4 list the six cube
     numbers; beat 5 sets 14 squares against 6 cubes. */
  var CR = { x: 90, y: 60, cell: 22, dx: 20, dy: 15, n: 4 };
  var CRS = { x: 640, y: 60, cell: 24 };

  function scrCuberootsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCuberoot = c(0, "cuberoot"), cEdge = c(0, "edge");
    var cSixtyfour = c(1, "sixtyfour"), cCuberootfour = c(1, "cuberootfour");
    var cSqrt64 = c(2, "sqrt64"), cEighttimes = c(2, "eighttimes");
    var cSixcubes = c(3, "sixcubes"), cListA = c(3, "listA");
    var cListB = c(4, "listB"), cListC = c(4, "listC");
    var cUpto216 = c(5, "upto216"), cFourteen6 = c(5, "fourteen6");
    var out = "", layer, r, cIx, k;

    /* the cube-root question: an empty dashed frame with a question mark on
       one edge, from beat 0, filling with blocks as beat 1 answers it */
    var frameO = scrFrom(t, scene, 0);
    if (frameO > 0) {
      for (layer = 0; layer < 4; layer++) {
        var lx = CR.x + layer * CR.dx, ly = CR.y + (3 - layer) * CR.dy;
        var built = popIn(t, cSixtyfour == null ? null : cSixtyfour + layer * 0.16, 0.4);
        if (built > 0) out += scrCubeLayer(lx, ly, CR.cell, 4, layer % 2 ? P.plum : "#8A5FA6", Math.min(1, built));
        else out += R(lx, ly, CR.cell * 4, CR.cell * 4, 4, "none", P.line, 2, { opacity: frameO * 0.6, "stroke-dasharray": "6 5" });
      }
      var qO = on(t, cEdge, 0.5) * (1 - on(t, cSixtyfour, 0.4));
      out += MK.qmark(CR.x + CR.dx * 3 + CR.cell * 4 + 30, CR.y - CR.dy * 3 + CR.cell * 2, 24, qO);
      var ansO = popIn(t, cCuberootfour, 0.5);
      if (ansO > 0) out += G(Tx(CR.x + CR.dx * 3 + CR.cell * 4 + 30, CR.y - CR.dy * 3 + CR.cell * 2 + 10, "4", "lab", "middle", { fill: P.plum, "font-size": 56 }),
        { opacity: Math.min(1, ansO), transform: around(CR.x + CR.dx * 3 + CR.cell * 4 + 30, CR.y - CR.dy * 3 + CR.cell * 2, Math.min(ansO, 1.1)) });
      out += MK.pill(CR.x + CR.dx * 2 + CR.cell * 2, CR.y + CR.cell * 4 + 70, "cube root of 64 is 4", Math.min(1, ansO), { size: 24, col: P.plum });
    }

    /* the square root's own 8 x 8, from beat 2 */
    var sqO = scrFrom(t, scene, 2);
    if (sqO > 0) {
      var dotsO = popIn(t, cSqrt64, 0.55);
      if (dotsO > 0) for (r = 0; r < 8; r++) for (cIx = 0; cIx < 8; cIx++) {
        var xy = scrDotXY(CRS.x, CRS.y, CRS.cell, cIx, r);
        out += C(xy[0], xy[1], CRS.cell * 0.3, P.blue, null, null, { opacity: Math.min(1, dotsO) });
      }
      out += R(CRS.x - 3, CRS.y - 3, CRS.cell * 8 + 6, CRS.cell * 8 + 6, 8, "none", P.blue, 2, { opacity: Math.min(1, dotsO) });
      var eightO = popIn(t, cEighttimes, 0.5);
      if (eightO > 0) out += Tx(CRS.x + CRS.cell * 4, CRS.y - 26, "8", "lab big", "middle", { fill: P.blue, opacity: Math.min(1, eightO) });
      out += MK.pill(CRS.x + CRS.cell * 4, CRS.y + CRS.cell * 8 + 34, "square root of 64 is 8", on(t, cSqrt64, 0.4), { size: 24, col: P.blue });
    }

    /* beats 3-4: the six cube numbers, popping in one after another */
    var listO = scrOnly(t, scene, 3) + scrOnly(t, scene, 4);
    if (listO > 0) {
      var cubeNums = [1, 8, 27, 64, 125, 216];
      var arriveAt = [cListA, cListA == null ? null : cListA + 0.35, cListA == null ? null : cListA + 0.7,
        cListA == null ? null : cListA + 1.05, cListB, cListC];
      out += Tx(360, 300, "the six cube numbers", "lab mid muted readable", "middle", { opacity: on(t, cSixcubes, 0.4) * Math.min(1, listO) });
      for (k = 0; k < cubeNums.length; k++) {
        var kp = popIn(t, arriveAt[k], 0.4);
        if (!(kp > 0)) continue;
        var kx = 130 + k * 130, ky = 350;
        out += G(MK.pill(kx, ky, String(cubeNums[k]), 1, { size: 26, col: P.plum }),
          { opacity: Math.min(1, kp) * Math.min(1, listO), transform: around(kx, ky, Math.min(kp, 1.08)) });
      }
    }

    /* beat 5: fourteen squares, six cubes */
    var cmpO = scrOnly(t, scene, 5);
    if (cmpO > 0) {
      out += Tx(360, 120, "up to 216", "lab big", "middle", { opacity: on(t, cUpto216, 0.4) * cmpO });
      /* clear of the two root panels above (which stay built through this
         beat): the comparison sits low, y 300-410, well under both */
      var reach14 = tally(t, cFourteen6, 14, 1.1);
      out += Tx(60, 292, "14 squares", "lab big", "start", { opacity: on(t, cFourteen6, 0.5) * cmpO, fill: P.teal });
      for (k = 0; k < reach14; k++) out += C(220 + (k % 7) * 30, 300 + Math.floor(k / 7) * 30, 11, P.teal, null, null, { opacity: cmpO });
      var reach6 = tally(t, cFourteen6 == null ? null : cFourteen6 + 0.5, 6, 0.7);
      out += Tx(60, 372, "6 cubes", "lab big", "start", { opacity: on(t, cFourteen6 == null ? null : cFourteen6 + 0.5, 0.5) * cmpO, fill: P.plum });
      for (k = 0; k < reach6; k++) out += C(220 + k * 30, 380, 11, P.plum, null, null, { opacity: cmpO });
    }
    return svg(out);
  }

  /* ==== chapter: triangular numbers ================================================
     One dot triangle, rows 1-4, built row by row (Step 7); a mirrored partner
     colours the rest of each row's 5 slots to make the 4 x 5 rectangle (Step
     7's own trick); beat 5 pairs two neighbouring triangular numbers into a
     square, from the lesson's own closing note. */
  var TR = { cx: 210, y0: 90, rowGap: 56, colGap: 40 };

  function scrTriangularChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTri = c(0, "tri"), cGrow = c(0, "grow");
    var cRows123 = c(1, "rows123"), cTotals = c(1, "totals");
    var cFourrows = c(2, "fourrows"), cTen = c(2, "ten");
    var cUpside = c(3, "upside"), cRect = c(3, "rect");
    var cFoursbyfive = c(4, "foursbyfive"), cTwenty = c(4, "twenty"), cTenagain = c(4, "tenagain");
    var cSixten = c(5, "sixten"), cSquarefact = c(5, "squarefact");
    var out = "", r, k;

    /* From beat 3 on ("a second triangle, upside down") the SAME rows switch
       from the centred triangle layout to a left-aligned 5-wide grid, because
       only a left-aligned grid actually tessellates into a rectangle: column
       k, row r sits at (RX0 + k * colGap, RY0 + (r - 1) * rowGap) whatever r
       is, so every row's k-th dot lines up under every other row's. The
       centred layout (scrTriXY) draws a true triangle on its own, which is
       right for beats 0-2, but its per-row centring shifts left as r grows,
       so reusing it for the mirrored dots produced a slanted parallelogram,
       not a rectangle - caught by eye on the first preview sheet, not by the
       sweep (nothing there throws or leaves the box). */
    var useRect = t >= scrBeatStart(scene, 3);
    var RX0 = 110, RY0 = TR.y0;
    function scrCellXY(r, k) {
      return useRect ? [RX0 + k * TR.colGap, RY0 + (r - 1) * TR.rowGap]
        : scrTriXY(TR.cx, TR.y0, TR.rowGap, TR.colGap, r, k);
    }

    /* rows 1-4 of the original triangle, and the running total beside it */
    var rowAt = [cTri, cRows123, cRows123 == null ? null : cRows123 + 0.5, cFourrows];
    var totals = [1, 3, 6, 10];
    var rowsShown = 0;
    for (r = 1; r <= 4; r++) {
      var rp = popIn(t, rowAt[r - 1], 0.4);
      if (!(rp > 0)) continue;
      rowsShown = r;
      for (k = 0; k < r; k++) {
        var pt = scrCellXY(r, k);
        out += G(C(pt[0], pt[1], 14, P.good), { transform: around(pt[0], pt[1], Math.min(rp, 1.1)), opacity: Math.min(1, rp) });
      }
    }
    if (rowsShown > 0 && !useRect) {
      var totO = on(t, rowAt[rowsShown - 1], 0.5);
      out += MK.pill(TR.cx, TR.y0 - 46, String(totals[rowsShown - 1]), totO, { size: 30, col: P.good });
    }

    /* the mirrored partner: row r gets (5 - r) more dots, in the same
       left-aligned grid, so the two colours together fill every row to 5 and
       the combined picture is the 4-row, 5-column rectangle the words name */
    var mirrorO = scrFrom(t, scene, 3);
    if (mirrorO > 0) {
      var mO = on(t, cUpside, 0.6);
      for (r = 1; r <= 4; r++) {
        for (k = r; k < 5; k++) {
          var mpt = scrCellXY(r, k);
          out += G(C(mpt[0], mpt[1], 14, P.gold), { opacity: Math.min(1, mO) });
        }
      }
      var rectO = on(t, cRect, 0.6);
      if (rectO > 0) {
        var rx0 = RX0 - 28, ry0 = RY0 - 28, rw = 4 * TR.colGap + 56, rh = 3 * TR.rowGap + 56;
        out += R(rx0, ry0, rw, rh, 10, "none", P.line, 3, { opacity: rectO, "stroke-dasharray": "9 6" });
      }
      var totO2 = on(t, cUpside, 0.6);
      if (totO2 > 0) out += MK.pill(RX0 + 2 * TR.colGap, RY0 - 46, "10", totO2, { size: 30, col: P.good });
    }

    /* beat 4: 4 rows by 5 columns is twenty, so one triangle is ten */
    var eqO = scrOnly(t, scene, 4);
    if (eqO > 0) {
      out += MK.pill(700, 130, "4 x 5 = 20", on(t, cFoursbyfive, 0.4) * eqO, { size: 32, col: P.gold });
      out += MK.pill(700, 200, "20 / 2 = 10", on(t, cTwenty, 0.5) * eqO, { size: 32, col: P.good });
      out += Tx(700, 260, "one triangle is ten", "lab big", "start", { opacity: on(t, cTenagain, 0.5) * eqO });
    }

    /* beat 5: 6 + 10 = 16, two triangular numbers, a small square */
    var pairO = scrOnly(t, scene, 5);
    if (pairO > 0) {
      var pcx = 720, pcy = 260;
      /* a small T(3) = 6 */
      var t3O = on(t, cSixten, 0.5);
      if (t3O > 0) for (r = 1; r <= 3; r++) for (k = 0; k < r; k++) {
        var p3 = scrTriXY(pcx - 170, pcy, 20, 20, r, k);
        out += C(p3[0], p3[1] - 30, 6, P.good, null, null, { opacity: t3O });
      }
      out += Tx(pcx - 170, pcy + 46, "6", "lab big", "middle", { opacity: t3O, fill: P.good });
      out += Tx(pcx - 110, pcy - 12, "+", "lab big", "middle", { opacity: t3O });
      /* a small T(4) = 10 */
      if (t3O > 0) for (r = 1; r <= 4; r++) for (k = 0; k < r; k++) {
        var p4 = scrTriXY(pcx - 50, pcy, 18, 18, r, k);
        out += C(p4[0], p4[1] - 40, 6, P.gold, null, null, { opacity: t3O });
      }
      out += Tx(pcx - 50, pcy + 46, "10", "lab big", "middle", { opacity: t3O, fill: P.gold });
      /* = a 4 x 4 square of sixteen */
      var sqO2 = popIn(t, cSquarefact, 0.5);
      if (sqO2 > 0) {
        out += Tx(pcx + 30, pcy - 12, "=", "lab big", "middle", { opacity: Math.min(1, sqO2) });
        for (r = 0; r < 4; r++) for (k = 0; k < 4; k++) {
          var sxy = scrDotXY(pcx + 70, pcy - 66, 20, k, r);
          out += C(sxy[0], sxy[1], 6, P.accent, null, null, { opacity: Math.min(1, sqO2) });
        }
        out += Tx(pcx + 110, pcy + 46, "16", "lab big", "middle", { opacity: Math.min(1, sqO2), fill: P.accent });
      }
    }
    return svg(out);
  }

  /* ==== what you now know ========================================================= */
  var SCR_RECAP = MK.recapKind([
    { beat: 0, at: "sq", title: "Square number", sub: "4 squared is 16",
      pic: function (cx, cy, size) {
        var out = "", n = 4, cell = size * 0.2, x0 = cx - n * cell / 2, y0 = cy - n * cell / 2 - 6, r, k;
        for (r = 0; r < n; r++) for (k = 0; k < n; k++) {
          var xy = scrDotXY(x0, y0, cell, k, r);
          out += C(xy[0], xy[1], cell * 0.3, P.gold);
        }
        return out;
      } },
    { beat: 1, at: "cb", title: "Cube number", sub: "3 cubed is 27",
      pic: function (cx, cy, size) {
        var out = "", layer, cell = size * 0.22;
        for (layer = 2; layer >= 0; layer--) {
          var lx = cx - size * 0.3 + layer * cell * 0.5, ly = cy - size * 0.3 + (2 - layer) * cell * 0.4;
          out += scrCubeLayer(lx, ly, cell, 3, layer === 2 ? P.accent : P.goldDeep, 1);
        }
        return out;
      } },
    { beat: 2, at: "roots", title: "Roots undo", sub: "the square root of 49 is 7",
      pic: function (cx, cy, size) { return scrLoop(cx, cy, size * 0.3, 1); } },
    { beat: 3, at: "tring", title: "Triangular numbers", sub: "1, 3, 6, 10",
      pic: function (cx, cy, size) {
        var out = "", r, k;
        for (r = 1; r <= 4; r++) for (k = 0; k < r; k++) {
          var pt = scrTriXY(cx, cy - size * 0.32, size * 0.18, size * 0.18, r, k);
          out += C(pt[0], pt[1], 6, P.good);
        }
        return out;
      } }
  ], { goBeat: 3, goAt: "tring" });

  /* each recap card's SECOND cue (the full sentence, once every number in it
     has been said) ticks a small "x of 4" counter in the corner - unread by
     recapKind itself, which only times the cards off their first cue ("sq",
     "cb", "roots", "tring"), so this is what gives the second cue in every
     recap beat something to do. */
  function scrRecapChapter(scene, beat, t, i) {
    var base = SCR_RECAP(scene, beat, t, i);
    var atCues = [sc(scene, 0, "four2"), sc(scene, 1, "threecubed2"), sc(scene, 2, "root2"), sc(scene, 3, "seq2")];
    var done = 0, k;
    for (k = 0; k < atCues.length; k++) if (atCues[k] != null && t >= atCues[k]) done++;
    var extra = done > 0 ? Tx(1148, 22, done + " / 4", "lab mid muted readable", "end", { opacity: 1 }) : "";
    return extra ? base.replace("</svg>", extra + "</svg>") : base;
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["Square numbers, and their roots", "Cube numbers, and their roots", "Triangular numbers grow row by row"] }),
    squares: scrSquaresChapter, sqroots: scrSqrootsChapter,
    cubes: scrCubesChapter, cuberoots: scrCuberootsChapter,
    triangular: scrTriangularChapter, recap: scrRecapChapter
  };
