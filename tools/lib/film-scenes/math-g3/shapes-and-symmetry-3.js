  /* ==== Shapes and Symmetry, part 3 ===========================================
     The chapters "Solid shapes" and "Round the edge, and inside", the recap,
     and KINDS. See shapes-and-symmetry.js for the helpers, and part 2 for why
     every count lands ON the word that names the total rather than starting
     there. */

  /* ==== chapter: solid shapes =================================================
     ART.solid draws the cube see-through, the three edges at the back dashed,
     and marks whichever faces, edges and vertices it is given - so six
     numbered faces are six, twelve lit edges are twelve, and eight dotted
     corners are eight. Only one kind is marked at a time, so nothing from the
     beat before is left on the drawing. The hidden edges are 5, 6 and 10 and
     the corner they meet at is (162.4, 180.9) in the drawing's own
     coordinates: measured under the library's fixed projection, not guessed. */
  var SS_CUBE = ssBox(300, 332, 430, 220, 390);
  var SS_HIDDEN_E = [5, 6, 10];
  function ssCount(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function ssUpto(n) { var out = [], k; for (k = 0; k < n; k++) out.push(k); return out; }

  function ssSolidsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSolid = c(0, "solid"), cCube = c(0, "cube");
    var cFace = c(1, "face"), cSix = c(1, "six");
    var cEdge = c(2, "edge"), cTwelve = c(2, "twelve");
    var cCorner = c(3, "corner"), cEight = c(3, "eight");
    var cFlat = c(4, "flat"), cThree = c(4, "three"), cCountToo = c(4, "counttoo");
    var out = "", o = {};

    var nF = ssOnly(t, scene, 1) > 0.5 ? tally(t, cFace, 6, ssSpan(cFace, cSix, 1.8)) : 0;
    var nE = ssOnly(t, scene, 2) > 0.5 ? tally(t, cEdge, 12, ssSpan(cEdge, cTwelve, 2.2)) : 0;
    var nV = ssOnly(t, scene, 3) > 0.5 ? tally(t, cCorner, 8, ssSpan(cCorner, cEight, 2.0)) : 0;
    var back = ssFrom(t, scene, 4) > 0.5;

    if (back) { o.edges = SS_HIDDEN_E; o.label = "3 edges at the back"; }
    else if (nV > 0) { o.vertices = ssUpto(nV); o.label = ssCount(nV, "corner", "corners"); }
    else if (nE > 0) { o.edges = ssUpto(nE); o.label = ssCount(nE, "edge", "edges"); }
    else if (nF > 0) { o.faces = ssUpto(nF); o.label = ssCount(nF, "face", "faces"); }
    else o.label = "a cube";
    var bornC = ssFrom(t, scene, 1) > 0 ? 1 : clamp(popIn(t, cSolid, 0.5), 0, 1);
    out += G(ssPut(ART.solid("cube", o), SS_CUBE), { opacity: bornC });

    /* the three words, kept on screen as each is met */
    out += MK.list(716, 150, [
      { text: "6 faces", at: cFace, mark: "tick", markAt: cSix },
      { text: "12 edges", at: cEdge, mark: "tick", markAt: cTwelve },
      { text: "8 corners", at: cCorner, mark: "tick", markAt: cEight }
    ], t, { lh: 78 });

    out += MK.pill(880, 56, "a cube", on(t, cCube, 0.45) * (1 - ssFrom(t, scene, 1)), { size: 30, col: P.gold });
    /* "The drawing is flat": the three edges hidden round the back, and the
       one corner they meet at, which is the corner a flat drawing loses */
    if (back) {
      out += MK.pill(880, 56, "count what must be there", on(t, cFlat, 0.45), { size: 24, col: P.muted });
      out += MK.leader(560, 388, SS_CUBE.fx(162.4), SS_CUBE.fy(180.9), on(t, cThree, 0.6), P.gold);
      out += MK.tick(1020, 386, 26, popIn(t, cCountToo, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: round the edge, and inside ===================================
     One rectangle, 6 cm by 2 cm, and then the same rectangle on squares. Both
     numbers are the lesson's own: 6 + 2 + 6 + 2 = 16 cm round the edge (its
     How do you know bank) and 12 squares inside (its check). The grid drawn
     for the area is 6 columns by 2 rows, so the twelve squares counted are
     twelve squares on screen, and they are the same rectangle as the one
     beside them. */
  var SS_R = { cx: 584, cy: 200, hw: 150, hh: 50 };
  var SS_RPTS = [[SS_R.cx - SS_R.hw, SS_R.cy - SS_R.hh], [SS_R.cx + SS_R.hw, SS_R.cy - SS_R.hh],
    [SS_R.cx + SS_R.hw, SS_R.cy + SS_R.hh], [SS_R.cx - SS_R.hw, SS_R.cy + SS_R.hh]];
  var SS_SIDE_TXT = ["6 cm", "2 cm", "6 cm", "2 cm"];
  var SS_SIDE_AT = [[584, 134], [782, 210], [584, 282], [386, 210]];
  var SS_SUM = ["6", "6 + 2", "6 + 2 + 6", "6 + 2 + 6 + 2"];
  var SS_AREA = ssBox(356, 178, 870, 215, 210);

  function ssRoundChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPer = c(0, "per"), cRound = c(0, "round");
    var cSix = c(1, "six"), cTwo = c(1, "two");
    var cOnly = c(2, "only"), cOthers = c(2, "others");
    var cSum = c(3, "sum"), cSixteen = c(3, "sixteen");
    var cArea = c(4, "area"), cInside = c(4, "inside"), cSquares = c(4, "squares");
    var cTwelve = c(5, "twelve"), cEdge16 = c(5, "edge16");
    var u2 = into(t, scene.first + 2), u3 = into(t, scene.first + 3);
    var u4 = into(t, scene.first + 4), out = "", k;

    /* ---- the rectangle, with its sides in centimetres ---- */
    var rect = ssCard(324, 65, 520, 300);
    rect += Pth("M" + SS_RPTS.map(function (p) { return n2(p[0]) + "," + n2(p[1]); }).join(" L") + " Z",
      ART.C.tealSoft, ART.C.teal, 3.5);
    /* "round the outside edge": a stroke that walks right round it, and is
       gone before the four sides are added one at a time in the same colour */
    if (cRound != null) rect += G(ssTrace(SS_RPTS, ease((t - cRound) / 1.3), ART.C.accent, 8), { opacity: 1 - u2 });

    /* which side is being added, as the sum builds */
    var n = cSum == null || t < cSum ? 0 : tally(t, cSum, 4, ssSpan(cSum, cSixteen, 1.8));
    for (k = 0; k < n; k++) {
      var a = SS_RPTS[k], b = SS_RPTS[(k + 1) % 4];
      rect += L(a[0], a[1], b[0], b[1], ART.C.accent, 8);
    }
    /* the two numbers written on it, and then the two that match them */
    var shown = [on(t, cSix, 0.45), on(t, cTwo, 0.45), on(t, cOthers, 0.45), on(t, cOthers, 0.45)];
    for (k = 0; k < 4; k++) {
      if (!(shown[k] > 0)) continue;
      rect += G(ssInk(SS_SIDE_AT[k][0], SS_SIDE_AT[k][1], SS_SIDE_TXT[k], "lab big", "middle",
        k < 2 ? ART.C.ink : ART.C.accent), { opacity: shown[k] });
    }
    /* the sum, inside the card so it is dark ink on white */
    if (n > 0) {
      var txt = SS_SUM[n - 1] + (cSixteen != null && t >= cSixteen ? " = 16 cm" : "");
      rect += Tx(584, 338, txt, "lab", "middle", { fill: ART.C.ink, "font-size": 34 });
    }
    var move = "translate(" + n2(lerp(0, -284, u4)) + ",0) " + around(584, 215, lerp(1, 0.66, u4));
    out += G(rect, { transform: move });
    out += MK.pill(584, 40, "perimeter", on(t, cPer, 0.45) * (1 - u4), { size: 30, col: P.gold });
    out += MK.pill(990, 132, "only two written", on(t, cOnly, 0.45) * (1 - u3), { size: 24, col: P.muted });
    out += MK.pill(990, 196, "all four get added", on(t, cOthers, 0.45) * (1 - u3), { size: 24, col: P.gold });

    /* ---- the same rectangle on squares: the area ---- */
    if (u4 > 0) {
      /* the twelfth square lands on "counted in squares", so the count is
         finished inside its own beat */
      var sq = cArea == null || t < cArea ? 0 : tally(t, cArea, 12, ssSpan(cArea, cSquares, 3.0));
      out += G(ssPut(ART.grid({ cols: 6, rows: 2, cell: 52, fill: sq, colour: "gold",
        label: sq ? sq + (sq === 1 ? " square" : " squares") : "count the squares inside" }), SS_AREA),
        { opacity: u4 });
      out += MK.pill(870, 78, "area", on(t, cArea, 0.45), { size: 30, col: P.gold });
      out += MK.pill(870, 372, "the space inside", on(t, cInside, 0.45) * (1 - ssFrom(t, scene, 5)),
        { size: 24, col: P.muted });
      out += MK.pill(870, 372, "12 squares inside", on(t, cTwelve, 0.45), { size: 28, col: P.gold });
      out += MK.pill(300, 372, "16 cm round the edge", on(t, cEdge16, 0.45), { size: 26, col: P.accent });
    }
    return svg(out);
  }

  /* ==== what you now know =====================================================
     Six cards, one per chapter, each lit as its idea is said. The pictures are
     drawn in the FILM's dark palette rather than ART's light one, because a
     recap card is dark. */
  function ssPicPoly(cx, cy, size, pts, col, opt) {
    opt = opt || {};
    var s = size / 2, d = "", i;
    for (i = 0; i < pts.length; i++) d += (i ? " L" : "M") + n2(cx + pts[i][0] * s) + "," + n2(cy + pts[i][1] * s);
    return Pth(d + " Z", opt.fill || "rgba(53,191,178,0.22)", col || P.teal, opt.sw || 4);
  }
  /* the three dots sit on the SIDES, not the corners: the card says "count
     the sides" */
  function ssPicSides(cx, cy, size) {
    var s = size / 2;
    return ssPicPoly(cx, cy, size, ssRegular(3, 1), P.teal) +
      C(cx + 0.433 * s, cy - 0.25 * s, 7, P.gold) + C(cx, cy + 0.5 * s, 7, P.gold) +
      C(cx - 0.433 * s, cy - 0.25 * s, 7, P.gold);
  }
  function ssPicRegular(cx, cy, size) {
    var pts = ssRegular(6, 1), out = ssPicPoly(cx, cy, size, pts, P.plum, { fill: "rgba(183,139,209,0.22)" }), i;
    for (i = 0; i < 6; i++) {
      var j = (i + 1) % 6, s = size / 2;
      var mx = cx + (pts[i][0] + pts[j][0]) / 2 * s, my = cy + (pts[i][1] + pts[j][1]) / 2 * s;
      var ux = (pts[j][0] - pts[i][0]) * s, uy = (pts[j][1] - pts[i][1]) * s, ul = Math.hypot(ux, uy) || 1;
      out += L(mx - (uy / ul) * 7, my + (ux / ul) * 7, mx + (uy / ul) * 7, my - (ux / ul) * 7, P.gold, 3.5);
    }
    return out;
  }
  function ssPicSymmetry(cx, cy, size) {
    var a = size / 2, out = ssPicPoly(cx, cy, size, [[-1, -1], [1, -1], [1, 1], [-1, 1]], P.teal), i;
    var e = a * 1.32;
    for (i = 0; i < 4; i++) {
      var u = SS_LINES[i];
      out += L(cx - u[0] * e, cy - u[1] * e, cx + u[0] * e, cy + u[1] * e, P.gold, 3, { "stroke-dasharray": "8 6" });
    }
    return out;
  }
  function ssPicReflect(cx, cy, size) {
    var u = size / 3.2, out = "", k;
    var left = [[-3, -1], [-2, -1], [-1, -1], [-1, 0]], right = [[0, -1], [1, -1], [2, -1], [0, 0]];
    for (k = 0; k < 4; k++) out += R(cx + left[k][0] * u, cy + left[k][1] * u, u - 2, u - 2, 2, P.teal);
    for (k = 0; k < 4; k++) out += R(cx + right[k][0] * u, cy + right[k][1] * u, u - 2, u - 2, 2, P.accent);
    return out + L(cx, cy - u * 1.9, cx, cy + u * 1.6, P.plum, 3.5, { "stroke-dasharray": "7 5" });
  }
  function ssPicCube(cx, cy, size) {
    var a = size * 0.36, d = size * 0.26, x = cx - a, y = cy - a + d / 2;
    return Pth("M" + n2(x) + "," + n2(y) + " L" + n2(x + d) + "," + n2(y - d) + " L" + n2(x + 2 * a + d) + "," + n2(y - d) +
        " L" + n2(x + 2 * a) + "," + n2(y) + " Z", "rgba(79,209,160,0.22)", P.good, 3.5) +
      Pth("M" + n2(x + 2 * a) + "," + n2(y) + " L" + n2(x + 2 * a + d) + "," + n2(y - d) +
        " L" + n2(x + 2 * a + d) + "," + n2(y + 2 * a - d) + " L" + n2(x + 2 * a) + "," + n2(y + 2 * a) + " Z",
        "rgba(79,209,160,0.14)", P.good, 3.5) +
      R(x, y, 2 * a, 2 * a, 0, "rgba(79,209,160,0.28)", P.good, 3.5);
  }
  /* the 6 cm by 2 cm rectangle again: six squares of space inside, and a thick
     stroke all the way round the outside */
  function ssPicMeasure(cx, cy, size) {
    var u = size / 3.4, out = "", r, k;
    for (r = 0; r < 2; r++) for (k = 0; k < 3; k++)
      out += R(cx + (k - 1.5) * u, cy + (r - 1) * u, u, u, 0, "rgba(53,191,178,0.26)", "rgba(147,170,190,0.6)", 1.5);
    return out + R(cx - 1.5 * u, cy - u, 3 * u, 2 * u, 0, "none", P.accent, 6);
  }

  var SS_RECAP = MK.recapKind([
    { beat: 0, at: "count", title: "Count the sides", sub: "3 triangle, 4 quadrilateral", pic: ssPicSides },
    { beat: 0, at: "regular", title: "Regular", sub: "every side the same length", pic: ssPicRegular },
    { beat: 1, at: "sym", title: "Lines of symmetry", sub: "a square has four", pic: ssPicSymmetry },
    { beat: 1, at: "refl", title: "Reflection", sub: "the same distance, other side", pic: ssPicReflect },
    { beat: 2, at: "cube", title: "Solid shapes", sub: "6 faces, 12 edges, 8 corners", pic: ssPicCube },
    { beat: 3, at: "per", title: "Perimeter and area", sub: "round the edge, and inside", pic: ssPicMeasure }
  ], { goBeat: 3, goAt: "area" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Naming flat shapes, and solid ones",
      "Lines of symmetry, and reflection",
      "Perimeter round the edge, area inside"
    ] }),
    naming: ssNamingChapter, regular: ssRegularChapter, symmetry: ssSymmetryChapter,
    mirror: ssMirrorChapter, solids: ssSolidsChapter, roundabout: ssRoundChapter, recap: SS_RECAP
  };
