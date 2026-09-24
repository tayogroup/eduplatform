
  /* ==== Where Things Are, part 3 ================================================
     The chapters "Along first, then up", "The corners of a shape" and
     "Reflecting in a mirror line", and what you now know. */

  /* ==== chapter: along first, then up ===========================================
     ART.grid with coords: the numbers run along the bottom and up the side, and
     wtaXY(a, b) puts a ALONG and b UP. The lesson's own point is (3, 2) - three
     along, two up - and its own counter-example is the swap, which lands
     somewhere else. Both guides are drawn in the order the words say them. */
  function wtaCoordsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cAlong1 = c(0, "along"), cUp1 = c(0, "up");
    var cPair = c(1, "pair"), cPairN = c(1, "three");
    var cAlong = c(2, "along"), cUp = c(2, "up");
    var cLands = c(3, "lands"), cEvery = c(3, "every");
    var cSwap = c(4, "swap"), cTwo = c(4, "two"), cThree = c(4, "three"), cDiff = c(4, "diff");

    var landed = cUp == null ? null : cUp + 0.75, landed2 = cThree == null ? null : cThree + 0.75;
    var pts = [];
    if (landed != null && t >= landed) pts.push({ x: 3, y: 2, label: "(3, 2)" });
    if (landed2 != null && t >= landed2) pts.push({ x: 2, y: 3, colour: "plum", label: "(2, 3)" });
    var out = wtaCoordGrid({ cols: 8, rows: 8, cell: 40, coords: true, points: pts });

    var far = wtaXY(8, 0), high = wtaXY(0, 8), p32 = wtaXY(3, 2), p20 = wtaXY(3, 0);
    var p23 = wtaXY(2, 3), p200 = wtaXY(2, 0);

    /* beat one: the two edges the numbers are written along */
    var only1 = wtaOnly(t, scene, 0);
    var a1 = on(t, cAlong1, 0.7) * only1, u1 = on(t, cUp1, 0.7) * only1;
    out += L(WTA_O[0], WTA_O[1], lerp(WTA_O[0], far[0], a1), WTA_O[1], P.gold, 6, { opacity: a1 });
    out += L(WTA_O[0], WTA_O[1], WTA_O[0], lerp(WTA_O[1], high[1], u1), P.teal, 6, { opacity: u1 });

    /* the pair of numbers, and what each one is for */
    var p3o = popIn(t, cPairN, 0.4), p2o = popIn(t, cPairN == null ? null : cPairN + 0.45, 0.4);
    out += MK.pill(970, 70, "a pair", on(t, cPair, 0.4), { size: 28, col: P.line });
    out += G(Tx(905, 200, "3", "lab", "middle", { fill: P.gold, "font-size": 92, opacity: Math.min(1, p3o) }) +
      Tx(905, 248, "along", "lab mid muted readable", "middle", { opacity: Math.min(1, p3o) }),
      { transform: around(905, 180, (p3o > 0 ? 1 : 0) + 0.14 * bump(t, cAlong, 0.6)) });
    out += G(Tx(1058, 200, "2", "lab", "middle", { fill: P.teal, "font-size": 92, opacity: Math.min(1, p2o) }) +
      Tx(1058, 248, "up", "lab mid muted readable", "middle", { opacity: Math.min(1, p2o) }),
      { transform: around(1058, 180, (p2o > 0 ? 1 : 0) + 0.14 * bump(t, cUp, 0.6)) });

    /* along three FIRST, then up two */
    var ga = on(t, cAlong, 0.7), gu = on(t, cUp, 0.7);
    out += L(WTA_O[0], WTA_O[1], lerp(WTA_O[0], p20[0], ga), WTA_O[1], P.gold, 7, { opacity: ga });
    out += L(p20[0], p20[1], p20[0], lerp(p20[1], p32[1], gu), P.teal, 7, { opacity: gu });
    out += MK.ripple(p32[0], p32[1], t, landed, P.gold);
    out += wtaRing(p32[0], p32[1], 26, popIn(t, cLands, 0.4), P.gold);
    out += MK.pill(970, 330, "along, then up", on(t, cEvery, 0.4), { size: 28, col: P.gold });

    /* the swap: two along and three up is somewhere else */
    var sa = on(t, cTwo, 0.7), su = on(t, cThree, 0.7);
    out += L(WTA_O[0], WTA_O[1], lerp(WTA_O[0], p200[0], sa), WTA_O[1], P.plum, 7, { opacity: sa });
    out += L(p200[0], p200[1], p200[0], lerp(p200[1], p23[1], su), P.plum, 7, { opacity: su });
    out += MK.ripple(p23[0], p23[1], t, landed2, P.plum);
    var swapO = on(t, cSwap, 0.5);
    if (swapO > 0) out += MK.pill(970, 400, "swap them", swapO * (1 - on(t, cDiff, 0.5)), { size: 26, col: P.plum });
    var dO = on(t, cDiff, 0.5);
    if (dO > 0) {
      out += L(p32[0], p32[1], p23[0], p23[1], P.bad, 3, { opacity: dO, "stroke-dasharray": "8 6" });
      out += MK.pill(970, 400, "two different places", dO, { size: 26, col: P.bad });
    }
    return svg(out);
  }

  /* ==== chapter: the corners of a shape =========================================
     The lesson's own rectangle: corners at (1, 1) and (4, 3), so the other two
     are (4, 1) and (1, 3) - each takes an along from one and an up from the
     other. Drawn on the same coordinate grid, so along and up mean here what
     they meant one chapter ago. */
  var WTA_CORNERS = [[1, 1], [4, 3], [4, 1], [1, 3]];

  function wtaCornersChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cShape = c(0, "shape"), cCorner = c(0, "corner");
    var cAlong = c(1, "along"), cUp = c(1, "up");
    var cFour = c(2, "four"), cThree = c(2, "three");
    var cOther = c(3, "other"), cEach = c(3, "each");
    var cEvery = c(4, "every"), cAlong2 = c(4, "along"), cUp2 = c(4, "up");

    var shown = [on(t, cUp, 0.5), on(t, cThree, 0.5), on(t, cOther, 0.5), on(t, cOther == null ? null : cOther + 0.45, 0.5)];
    var pts = [], k;
    for (k = 0; k < 4; k++) if (shown[k] > 0.5) pts.push({
      x: WTA_CORNERS[k][0], y: WTA_CORNERS[k][1], colour: k < 2 ? "accent" : "plum",
      label: "(" + WTA_CORNERS[k][0] + ", " + WTA_CORNERS[k][1] + ")"
    });
    var out = wtaCoordGrid({ cols: 8, rows: 8, cell: 40, coords: true, points: pts });

    var lo = wtaXY(1, 1), hi = wtaXY(4, 3);
    var so = on(t, cShape, 0.6);
    out += G(R(lo[0], hi[1], hi[0] - lo[0], lo[1] - hi[1], 0, "none", P.teal, 4), { opacity: so, transform: around((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, 0.86 + 0.14 * so) });
    for (k = 0; k < 4; k++) {
      var cp = wtaXY(WTA_CORNERS[k][0], WTA_CORNERS[k][1]);
      out += C(cp[0], cp[1], 7, P.teal, null, null, { opacity: on(t, cCorner, 0.5) });
    }

    /* the guides for the first two corners, along then up each time */
    function guides(a, b, atA, atB, col) {
      var ua = on(t, atA, 0.6), ub = on(t, atB, 0.6);
      var foot = wtaXY(a, 0), p = wtaXY(a, b), s = "";
      s += L(WTA_O[0], WTA_O[1], lerp(WTA_O[0], foot[0], ua), WTA_O[1], col, 6, { opacity: ua });
      s += L(foot[0], foot[1], foot[0], lerp(foot[1], p[1], ub), col, 6, { opacity: ub });
      return s;
    }
    out += guides(1, 1, cAlong, cUp, P.gold);
    out += guides(4, 3, cFour, cThree, P.accent);

    /* the other two take one number from each */
    var oo = on(t, cOther, 0.5);
    if (oo > 0) {
      var c41 = wtaXY(4, 1), c13 = wtaXY(1, 3);
      out += L(hi[0], hi[1], c41[0], lerp(hi[1], c41[1], oo), P.plum, 3, { opacity: 0.8 * oo, "stroke-dasharray": "7 6" });
      out += L(lo[0], lo[1], lerp(lo[0], c41[0], oo), lo[1], P.plum, 3, { opacity: 0.8 * oo, "stroke-dasharray": "7 6" });
      out += MK.pill(170, 300, "one from each", on(t, cEach, 0.4), { size: 26, col: P.plum });
    }

    /* every corner, read the same way */
    var rows = [];
    for (k = 0; k < 4; k++) rows.push({
      text: "(" + WTA_CORNERS[k][0] + ", " + WTA_CORNERS[k][1] + ")",
      at: [cUp, cThree, cOther, cOther == null ? null : cOther + 0.45][k],
      mark: cEvery == null ? null : "tick", markAt: cEvery == null ? null : cEvery + k * 0.3
    });
    out += MK.list(860, 176, rows, t, { lh: 58, cls: "lab big" });
    out += MK.pill(960, 56, "along the bottom", on(t, cAlong2, 0.4), { size: 26, col: P.gold });
    out += MK.pill(960, 112, "then up the side", on(t, cUp2, 0.4), { size: 26, col: P.teal });
    for (k = 0; k < 4; k++) {
      var rp = wtaXY(WTA_CORNERS[k][0], WTA_CORNERS[k][1]);
      out += MK.ripple(rp[0], rp[1], t, rows[k].at, k < 2 ? P.gold : P.plum);
    }
    return svg(out);
  }

  /* ==== chapter: reflecting in a mirror line ====================================
     A 3 wide, 2 tall shape on columns 1 to 3, with the mirror line on grid line
     4 - its own right edge. A square spanning [x, x + 1] reflects to
     [2m - x - 1, 2m - x], so with m = 4 column x becomes column 7 - x:
     3 -> 4 (they touch, because the edge has no distance to cross), 2 -> 5 and
     1 -> 6. The whole picture is then columns 1 to 6, twice as wide as the
     shape, which is what the lesson's own working says. */
  var WTA_M = 4, WTA_SHAPE = [[1, 3], [2, 3], [3, 3], [1, 4], [2, 4], [3, 4]];
  function wtaPartner(i) { return 2 * WTA_M - 1 - i; }   /* 3 -> 4, 2 -> 5, 1 -> 6 */

  function wtaMirrorChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMirror = c(0, "mirror"), cEdge = c(0, "edge");
    var cEvery = c(1, "every"), cSame = c(1, "same");
    var cAgainst = c(2, "against"), cTouches = c(2, "touches");
    var cBack = c(3, "back"), cOut = c(3, "out");
    var cSix = c(4, "six"), cTwice = c(4, "twice");
    var out = wtaGrid({ cols: 8, rows: 8, cell: 40, fill: WTA_SHAPE, colour: "teal" }), k;

    var mx = wtaLineX(WTA_M);
    /* the order the partners arrive: the touching pair, then the far pair, then the rest */
    var order = [[3, 3], [3, 4], [1, 3], [2, 3], [1, 4], [2, 4]];
    var arrive = [cTouches, cTouches == null ? null : cTouches + 0.35, cOut,
      cSix, cSix == null ? null : cSix + 0.3, cSix == null ? null : cSix + 0.6];
    for (k = 0; k < order.length; k++) {
      var src = order[k], p = popIn(t, arrive[k], 0.4);
      if (!(p > 0)) continue;
      var cell = wtaCellXY(wtaPartner(src[0]), src[1]);
      out += G(R(cell[0] + 2, cell[1] + 2, WTA_CELL - 4, WTA_CELL - 4, 3, P.good, null, null, { opacity: 0.85 }),
        { transform: around(cell[0] + WTA_CELL / 2, cell[1] + WTA_CELL / 2, Math.min(p, 1.1)), opacity: Math.min(1, p) });
    }

    /* the mirror line draws itself down the grid, on the shape's right edge */
    var mo = on(t, cMirror, 0.8);
    out += L(mx, WTA_GTOP, mx, lerp(WTA_GTOP, WTA_GBOT, mo), P.accent, 5, { opacity: mo, "stroke-dasharray": "12 8" });
    var eo = on(t, cEdge, 0.6);
    if (eo > 0) out += L(mx, wtaCellXY(0, 3)[1], mx, lerp(wtaCellXY(0, 3)[1], wtaCellXY(0, 5)[1], eo), P.gold, 8, { opacity: eo });

    /* every square has a partner, the same distance the other side */
    var one = wtaCell(1, 3), onePartner = wtaCell(wtaPartner(1), 3);
    var so = on(t, cSame, 0.6) * wtaOnly(t, scene, 1);
    if (so > 0) out += wtaSpan(one[0], 140, mx, 140, so, P.gold, 4) + wtaSpan(mx, 140, onePartner[0], 140, so, P.gold, 4);
    out += MK.pill(950, 96, "the same distance", so, { size: 26, col: P.gold });

    /* the square against the line, and the one two squares back */
    var ao = popIn(t, cAgainst, 0.4);
    if (ao > 0) {
      var near = wtaCellXY(3, 3);
      out += G(R(near[0] + 2, near[1] + 2, WTA_CELL - 4, WTA_CELL - 4, 3, "none", P.gold, 4), { opacity: Math.min(1, ao) * wtaOnly(t, scene, 2) });
    }
    var bo = popIn(t, cBack, 0.4);
    if (bo > 0) {
      var farC = wtaCellXY(1, 3);
      out += G(R(farC[0] + 2, farC[1] + 2, WTA_CELL - 4, WTA_CELL - 4, 3, "none", P.gold, 4), { opacity: Math.min(1, bo) });
      out += MK.pill(950, 180, "two back", bo, { size: 28, col: P.gold });
      out += MK.pill(950, 250, "two out", popIn(t, cOut, 0.4), { size: 28, col: P.good });
    }

    /* all six across, and the picture twice as wide */
    out += MK.pill(950, 320, "6 squares", on(t, cSix, 0.4), { size: 30, col: P.good });
    var tw = on(t, cTwice, 0.7);
    if (tw > 0) {
      var left = wtaCellXY(1, 0)[0], rightEnd = wtaCellXY(7, 0)[0];
      out += MK.arrow(left, 150, lerp(left, mx, tw), 150, tw, P.teal, 5);
      out += MK.arrow(left, 104, lerp(left, rightEnd, tw), 104, tw, P.gold, 5);
      out += MK.pill(950, 390, "twice as wide", tw, { size: 28, col: P.gold });
    }
    return svg(out);
  }

  /* ==== what you now know ======================================================= */
  /* a small coordinate grid of 4 by 4 with one point marked: ax ALONG, ay UP */
  function wtaMiniGrid(cx, cy, size, ax, ay, extra) {
    var n = 4, s = size / n, x0 = cx - size / 2, y0 = cy + size / 2, out = "", k;
    for (k = 0; k <= n; k++) {
      out += L(x0 + k * s, y0 - size, x0 + k * s, y0, P.line, 1.5);
      out += L(x0, y0 - k * s, x0 + size, y0 - k * s, P.line, 1.5);
    }
    out += L(x0, y0, x0 + size, y0, P.ink, 2.5) + L(x0, y0, x0, y0 - size, P.ink, 2.5);
    out += extra ? extra(x0, y0, s) : "";
    if (ax != null) {
      out += L(x0, y0 - ay * s, x0 + ax * s, y0 - ay * s, P.teal, 2, { "stroke-dasharray": "5 4" });
      out += L(x0 + ax * s, y0, x0 + ax * s, y0 - ay * s, P.teal, 2, { "stroke-dasharray": "5 4" });
      out += C(x0 + ax * s, y0 - ay * s, size * 0.09, P.gold);
    }
    return out;
  }

  var WTA_RECAP = MK.recapKind([
    { beat: 0, at: "eight", title: "Eight compass points", sub: "four main, four in between",
      pic: function (cx, cy, size) {
        var out = "", k;
        for (k = 0; k < 8; k++) {
          var a = wtaRoseAng(k) * Math.PI / 180, r = k % 2 ? size * 0.32 : size * 0.46;
          out += L(cx, cy, cx + r * Math.cos(a), cy + r * Math.sin(a), k % 2 ? P.blue : P.gold, k % 2 ? 5 : 7);
        }
        return out + C(cx, cy, size * 0.08, P.gold);
      } },
    { beat: 0, at: "quarter", title: "A quarter turn", sub: "is a right angle",
      pic: function (cx, cy, size) {
        return wtaRightAngle(cx - size * 0.34, cy + size * 0.34, size * 0.68, 1, P.gold) +
          wtaArc(cx - size * 0.34, cy + size * 0.34, size * 0.4, -90, 0, 1, P.teal, 4);
      } },
    { beat: 1, at: "route", title: "Follow a route", sub: "one move, then the next",
      pic: function (cx, cy, size) {
        var x0 = cx - size * 0.42, y0 = cy + size * 0.3;
        return MK.arrow(x0, y0, x0 + size * 0.5, y0, 1, P.accent, 6) +
          MK.arrow(x0 + size * 0.5, y0, x0 + size * 0.5, y0 - size * 0.5, 1, P.accent, 6) +
          C(x0, y0, size * 0.09, P.gold);
      } },
    { beat: 1, at: "coordinate", title: "Along, then up", sub: "three along, two up",
      pic: function (cx, cy, size) { return wtaMiniGrid(cx, cy, size * 0.86, 3, 2); } },
    { beat: 2, at: "corner", title: "Every corner", sub: "has its own pair",
      pic: function (cx, cy, size) {
        return wtaMiniGrid(cx, cy, size * 0.86, null, null, function (x0, y0, s) {
          var out = R(x0 + s, y0 - 3 * s, 2 * s, 2 * s, 0, "none", P.teal, 3), k;
          var pts = [[1, 1], [3, 1], [3, 3], [1, 3]];
          for (k = 0; k < 4; k++) out += C(x0 + pts[k][0] * s, y0 - pts[k][1] * s, s * 0.22, P.gold);
          return out;
        });
      } },
    { beat: 3, at: "mirror", title: "A mirror line", sub: "partners, the same distance",
      pic: function (cx, cy, size) {
        var s = size * 0.24, out = "", k;
        for (k = 0; k < 2; k++) {
          out += R(cx - 2 * s, cy - s + k * s, s, s, 2, P.teal) + R(cx - s, cy - s + k * s, s, s, 2, P.teal);
          out += R(cx, cy - s + k * s, s, s, 2, P.good) + R(cx + s, cy - s + k * s, s, s, 2, P.good);
        }
        return out + L(cx, cy - s * 1.9, cx, cy + s * 1.9, P.accent, 4, { "stroke-dasharray": "7 5" });
      } }
  ], { goBeat: 3, goAt: "mirror" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The eight points of the compass", "Coordinates: along first, then up", "Reflecting a shape in a mirror line"] }),
    cardinal: wtaCardinalChapter, ordinal: wtaOrdinalChapter, route: wtaRouteChapter,
    coords: wtaCoordsChapter, corners: wtaCornersChapter, mirror: wtaMirrorChapter,
    recap: WTA_RECAP
  };
