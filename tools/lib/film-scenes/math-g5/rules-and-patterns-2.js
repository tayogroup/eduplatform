
  /* ==== Rules and Patterns, part 2 ================================================
     The chapters "Two shapes, two facts" and "Squares and cubes hiding". */

  /* ---- a triangle and a circle, the lesson's own two placeholders ------------- */
  function rapTri(cx, cy, r, fill, opacity) {
    if (!(opacity > 0)) return "";
    var pts = n2(cx) + "," + n2(cy - r) + " " + n2(cx + r * 0.87) + "," + n2(cy + r * 0.5) + " " + n2(cx - r * 0.87) + "," + n2(cy + r * 0.5);
    return el("polygon", { points: pts, fill: fill, stroke: "#123247", "stroke-width": 2, opacity: opacity });
  }
  function rapCirc(cx, cy, r, fill, opacity) {
    if (!(opacity > 0)) return "";
    return C(cx, cy, r, fill, "#123247", 2, { opacity: opacity });
  }

  /* ==== chapter: two shapes, two facts ============================================
     Two facts, written as the lesson writes them: triangle + circle = 10, then
     triangle - circle = 4. Adding the two facts is drawn as a written sum: the
     two circles slide together and cancel, leaving 2 triangles = 14, which
     halves to triangle = 7; put back into the first fact, the circle is 3. */
  var RAP_TU = { triX: 250, opX: 330, circX: 410, eqX: 480, numX: 545, r: 26 };
  var RAP_ROW1_Y = 104, RAP_ROW2_Y = 184, RAP_SUM_Y = 292, RAP_SUB_Y = 372;

  function rapEqRow(y, aFill, aVis, opSym, opCol, opVis, bFill, bVis, eqVis, num, numVis, numCol) {
    var g = RAP_TU;
    var out = rapTri(g.triX, y, g.r, aFill, aVis) +
      Tx(g.opX, y + 9, opSym, "lab big", "middle", { opacity: opVis, fill: opCol || P.ink }) +
      rapCirc(g.circX, y, g.r, bFill, bVis) +
      Tx(g.eqX, y + 9, "=", "lab big", "middle", { opacity: eqVis });
    if (num != null) out += Tx(g.numX, y + 9, String(num), "lab big", "start", { opacity: numVis, fill: numCol || P.ink });
    return out;
  }

  function rapTwoUnknownsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cShape = c(0, "shape"), cUnknown = c(0, "unknown");
    var cFact1 = c(1, "fact1");
    var cFact2 = c(2, "fact2");
    var cAdd = c(3, "addfacts"), cCancel = c(3, "cancel");
    var cTwotri = c(4, "twotri"), cSeven = c(4, "seven");
    var cPutback = c(5, "putback"), cThree = c(5, "three");
    var g = RAP_TU, out = "";

    /* beat 0: an unlabelled triangle and circle, each with a question mark */
    var introO = on(t, cShape, 0.5) * rapOnly(t, scene, 0);
    if (introO > 0) {
      out += rapTri(g.triX, RAP_ROW1_Y, g.r, P.tealSoft, introO) + rapCirc(g.circX, RAP_ROW1_Y, g.r, P.tealSoft, introO);
      out += MK.qmark(g.triX, RAP_ROW1_Y, g.r * 0.7, on(t, cUnknown, 0.5) * rapOnly(t, scene, 0));
      out += MK.qmark(g.circX, RAP_ROW1_Y, g.r * 0.7, on(t, cUnknown, 0.5) * rapOnly(t, scene, 0));
    }

    /* row 1: triangle + circle = 10, from beat 1 on */
    var r1 = rapFrom(t, scene, 1);
    if (r1 > 0) out += G(rapEqRow(RAP_ROW1_Y, P.gold, r1, "+", P.ink, r1, P.teal, r1, r1, 10, r1, P.ink), { opacity: r1 });

    /* row 2: triangle - circle = 4, from beat 2 on */
    var r2 = rapFrom(t, scene, 2);
    if (r2 > 0) out += G(rapEqRow(RAP_ROW2_Y, P.gold, r2, "−", P.ink, r2, P.teal, r2, r2, 4, r2, P.ink), { opacity: r2 });

    /* beat 3: add the two facts. A "+" sits at the left margin of both rows,
       then the two circles slide down to meet and cancel. */
    var addU = rapStep(t, cAdd, 0.8);
    if (addU > 0) {
      out += Tx(70, (RAP_ROW1_Y + RAP_ROW2_Y) / 2 + 9, "+", "lab big", "middle", { opacity: Math.min(1, addU * 2), fill: P.gold });
      out += L(140, RAP_ROW1_Y + 30, 620, RAP_ROW1_Y + 30, P.line, 2, { opacity: Math.min(1, addU * 2) });
      out += L(140, RAP_ROW2_Y + 30, 620, RAP_ROW2_Y + 30, P.line, 2, { opacity: Math.min(1, addU * 2) });
    }
    var cancelU = rapStep(t, cCancel, 1.0);
    if (cancelU > 0) {
      var midY = (RAP_ROW1_Y + RAP_ROW2_Y) / 2;
      var c1y = lerp(RAP_ROW1_Y, midY, cancelU), c2y = lerp(RAP_ROW2_Y, midY, cancelU);
      out += rapCirc(g.circX, c1y, g.r, P.teal, 1 - 0.3 * cancelU) + rapCirc(g.circX, c2y, g.r, P.teal, 1 - 0.3 * cancelU);
      if (cancelU > 0.6) out += MK.cross(g.circX, midY, g.r * 0.9, (cancelU - 0.6) / 0.4);
    }

    /* beat 4: 2 triangles = 14, then halved to triangle = 7 */
    var sumO = on(t, cTwotri, 0.5) * rapFrom(t, scene, 4);
    if (sumO > 0) {
      out += rapTri(g.triX - 20, RAP_SUM_Y, g.r, P.gold, sumO) + rapTri(g.triX + 24, RAP_SUM_Y, g.r, P.gold, sumO);
      out += Tx(g.eqX, RAP_SUM_Y + 9, "= 14", "lab big", "start", { opacity: sumO });
    }
    var sevenO = popIn(t, cSeven, 0.45) * rapFrom(t, scene, 4);
    if (sevenO > 0) {
      out += rapRing(g.triX, RAP_SUM_Y, g.r + 14, Math.min(1, sevenO), P.gold);
      out += MK.pill(900, 150, "triangle = 7", Math.min(1, sevenO), { size: 32, col: P.gold });
    }

    /* beat 5: put 7 back into fact 1, and the circle is 3 */
    var backO = on(t, cPutback, 0.5) * rapFrom(t, scene, 5);
    if (backO > 0) {
      out += rapTri(g.triX, RAP_SUB_Y, g.r, P.gold, backO);
      out += Tx(g.triX, RAP_SUB_Y + 9, "7", "lab", "middle", { opacity: backO, "font-size": 26 });
      out += Tx(g.opX, RAP_SUB_Y + 9, "+", "lab big", "middle", { opacity: backO });
      out += rapCirc(g.circX, RAP_SUB_Y, g.r, P.teal, backO);
      out += Tx(g.eqX, RAP_SUB_Y + 9, "= 10", "lab big", "start", { opacity: backO });
    }
    var threeO = popIn(t, cThree, 0.45) * rapFrom(t, scene, 5);
    if (threeO > 0) {
      out += rapRing(g.circX, RAP_SUB_Y, g.r + 14, Math.min(1, threeO), P.teal);
      out += MK.pill(900, 260, "circle = 3", Math.min(1, threeO), { size: 32, col: P.teal });
    }

    return svg(out);
  }

  /* ==== chapter: squares and cubes hiding =========================================
     Three term strips, each with its gaps written under it and the gaps of
     those gaps under that - a factor-tree layout, so "the gap of the gap" is
     literally what sits under the gap. The square and add-4 rows continue the
     lesson's own HIDDEN chip examples (1,4,9,16 and 3,7,11,15) one term further
     so the settled/zero second gap actually has three repeats to show; the cube
     row continues the app's own cube formula (1,8,27,64) the same way, to reach
     the exact 12, 18, 24 the lesson's note names. */
  var RAP_HS = { x: 242, y: 40, s: 1.5 };
  var RAP_HS_TERMS = { square: [1, 4, 9, 16, 25], cube: [1, 8, 27, 64, 125], flat: [3, 7, 11, 15, 19] };
  function rapHsX(idx) { return RAP_HS.x + (56 + 86 * idx) * RAP_HS.s; }
  var RAP_HS_Y = RAP_HS.y + 56 * RAP_HS.s;                /* term row (card centre) */
  var RAP_HS_CARDBOT = RAP_HS.y + 112 * RAP_HS.s;         /* the term card's own bottom edge, 208 */
  var RAP_HS_GY = RAP_HS_CARDBOT + 46;                    /* gap row, clear of the card */
  var RAP_HS_GGY = RAP_HS_GY + 76;                        /* gap-of-gap row */

  function rapGaps(terms) {
    var g = [], i; for (i = 1; i < terms.length; i++) g.push(terms[i] - terms[i - 1]); return g;
  }

  function rapHsStrip(terms, colour, opacity) {
    if (!(opacity > 0)) return "";
    var out = "", i;
    var gaps = rapGaps(terms), gaps2 = rapGaps(gaps);
    out += G(ART.place(ART.sequence({ terms: terms }), RAP_HS.x, RAP_HS.y, 456 * RAP_HS.s, 112 * RAP_HS.s), { opacity: opacity });
    for (i = 0; i < gaps.length; i++) {
      var mx = (rapHsX(i) + rapHsX(i + 1)) / 2;
      out += L(mx, RAP_HS_CARDBOT + 2, mx, RAP_HS_GY - 20, P.line, 2, { opacity: 0.5 * opacity });
      out += Tx(mx, RAP_HS_GY + 8, String(gaps[i]), "lab big", "middle", { opacity: opacity, fill: colour });
    }
    for (i = 0; i < gaps2.length; i++) {
      var mx1 = (rapHsX(i) + rapHsX(i + 1)) / 2, mx2 = (rapHsX(i + 1) + rapHsX(i + 2)) / 2;
      var gx = (mx1 + mx2) / 2;
      out += L(gx, RAP_HS_GY + 16, gx, RAP_HS_GGY - 20, P.line, 2, { opacity: 0.5 * opacity });
      out += Tx(gx, RAP_HS_GGY + 8, String(gaps2[i]), "lab big", "middle", { opacity: opacity, fill: P.gold });
    }
    return out;
  }

  function rapHiddenSquaresChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cNotsame = c(0, "notsame");
    var cGapsofgaps = c(1, "gapsofgaps");
    var cSquares = c(2, "squares"), cGaptwo = c(2, "gaptwo");
    var cCubes = c(3, "cubes"), cSeq3 = c(3, "seq3");
    var cAddfour = c(4, "addfour"), cZerogap = c(4, "zerogap");

    /* which strip is on show: squares through beats 0-2, cubes at beat 3,
       add-4 (the zero-gap-of-gaps case) at beat 4, each a plain crossfade */
    var showCube = cCubes == null ? 0 : into(t, scene.first + 3);
    var showFlat = cAddfour == null ? 0 : into(t, scene.first + 4);
    var squareO = Math.max(0, 1 - showCube - showFlat + Math.min(showCube, showFlat));
    var cubeO = Math.max(0, showCube - showFlat);
    var flatO = showFlat;

    var out = rapHsStrip(RAP_HS_TERMS.square, P.teal, squareO) +
      rapHsStrip(RAP_HS_TERMS.cube, P.plum, cubeO) +
      rapHsStrip(RAP_HS_TERMS.flat, P.good, flatO);

    /* row labels down the left, so "gaps" and "gaps of gaps" are named once */
    var rowLabO = on(t, cNotsame, 0.5);
    if (rowLabO > 0) out += Tx(70, RAP_HS_Y + 9, "terms", "lab mid muted readable", "start", { opacity: rowLabO });
    var gLabO = on(t, cGapsofgaps, 0.5);
    if (gLabO > 0) {
      out += Tx(70, RAP_HS_GY + 8, "gaps", "lab mid muted readable", "start", { opacity: gLabO });
      out += Tx(70, RAP_HS_GGY + 8, "gaps of gaps", "lab mid muted readable", "start", { opacity: gLabO });
    }

    /* beat 2: the square row's gaps-of-gaps (all 2) ring together */
    var gtO = on(t, cGaptwo, 0.5) * rapOnly(t, scene, 2);
    if (gtO > 0) {
      var gg = rapGaps(rapGaps(RAP_HS_TERMS.square)), k;
      for (k = 0; k < gg.length; k++) {
        var mx1 = (rapHsX(k) + rapHsX(k + 1)) / 2, mx2 = (rapHsX(k + 1) + rapHsX(k + 2)) / 2;
        out += rapRing((mx1 + mx2) / 2, RAP_HS_GGY + 3, 26, gtO, P.gold);
      }
      out += MK.pill(1000, RAP_HS_GGY, "settles on 2", gtO, { size: 26, col: P.gold });
    }
    /* beat 3: the cube row's still-growing gaps-of-gaps, 12, 18, 24 */
    var seq3O = on(t, cSeq3, 0.5) * rapOnly(t, scene, 3);
    if (seq3O > 0) out += MK.pill(1000, RAP_HS_GGY, "still growing", seq3O, { size: 26, col: P.plum });
    /* beat 4: the add-4 row's gaps of gaps, always 0 */
    var zeroO = on(t, cZerogap, 0.5) * rapOnly(t, scene, 4);
    if (zeroO > 0) out += MK.pill(1000, RAP_HS_GGY, "never change", zeroO, { size: 26, col: P.good });

    return svg(out);
  }
