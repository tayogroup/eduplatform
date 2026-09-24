
  /* ==== Where Things Are, part 2 ================================================
     The chapters "The four in between" and "Following a route". */

  /* ==== chapter: the four in between ============================================
     ART.compass with all eight points. The gap between north and east is
     questioned, then filled with the name made of both; south and west are
     joined the same way; then all four in-between points ring in turn and the
     eight are counted. The letters are ART's own, at the angles it wrote them:
     index 1 is north-east, up and to the RIGHT of the middle, which the
     preview sheets were checked against. */
  var WTA_ORD = [1, 3, 5, 7];                   /* NE, SE, SW, NW, clockwise */
  var WTA_ORD_NAME = [["north", "-east"], ["south", "-east"], ["south", "-west"], ["north", "-west"]];

  function wtaOrdinalChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cBetween = c(0, "between"), cOnePt = c(0, "one");
    var cJoined = c(1, "joined"), cNE = c(1, "ne");
    var cJoin = c(2, "join"), cSW = c(2, "sw");
    var cFour = c(3, "four"), cGap = c(3, "gap");
    var cEight = c(4, "eight"), cFirst = c(4, "first");
    var out = wtaCP(ART.compass({ points: 8, facing: "N", label: false })), k;

    /* "Between north and east": the two ends ring, then the gap is questioned */
    var bet = on(t, cBetween, 0.5) * (1 - into(t, scene.first + 3));
    if (bet > 0) {
      var nPt = wtaRose(0), ePt = wtaRose(2);
      out += wtaRing(nPt[0], nPt[1], 26, bet, P.gold) + wtaRing(ePt[0], ePt[1], 26, bet, P.gold);
      out += wtaArc(WTA_HUB[0], WTA_HUB[1], WTA_R * 0.88, -90, 0, bet, P.line, 4);
    }
    var nePt = wtaRose(1);
    out += MK.qmark(nePt[0], nePt[1], 24, on(t, cOnePt, 0.4) * (1 - on(t, cNE, 0.4)));

    /* the two names joined, one pair per beat */
    var pair = [
      { a: "north", b: "east", both: "north-east", at: cJoined, out: cNE, only: wtaOnly(t, scene, 1) },
      { a: "south", b: "west", both: "south-west", at: cJoin, out: cSW, only: wtaOnly(t, scene, 2) }
    ];
    for (k = 0; k < 2; k++) {
      var pr = pair[k], vis = pr.only;
      if (!(vis > 0)) continue;
      var slide = wtaStep(t, pr.out, 0.5), fade = on(t, pr.at, 0.4) * (1 - 0.72 * slide);
      out += G(MK.pill(110, 140, pr.a, fade, { size: 28, col: P.line }) +
        Tx(110, 190, "+", "lab big muted", "middle", { opacity: fade }) +
        MK.pill(110, 232, pr.b, fade, { size: 28, col: P.line }) +
        MK.arrow(110, 258, 110, 276, slide, P.gold, 5) +
        MK.pill(180, 320, pr.both, popIn(t, pr.out, 0.45), { size: 34, col: P.gold }), { opacity: vis });
    }
    /* the point being named rings on the compass */
    out += wtaRing(nePt[0], nePt[1], 30, popIn(t, cNE, 0.4) * wtaOnly(t, scene, 1), P.gold);
    var swPt = wtaRose(5);
    out += wtaRing(swPt[0], swPt[1], 30, popIn(t, cSW, 0.4) * wtaOnly(t, scene, 2), P.gold);

    /* "four of these, one in each gap": each rings in turn, clockwise */
    var reached = tally(t, cFour, 4, 1.3);
    for (k = 0; k < reached; k++) {
      var op = wtaRose(WTA_ORD[k]);
      out += wtaRing(op[0], op[1], 28, popIn(t, cFour == null ? null : cFour + k * 0.43, 0.35), P.blue);
    }
    out += MK.pill(140, 90, "4 in between", on(t, cGap, 0.4), { size: 30, col: P.blue });

    /* "eight in all", and the north or south part first */
    out += MK.pill(990, 66, "8 points", popIn(t, cEight, 0.45), { size: 34, col: P.gold });
    var fo = on(t, cFirst, 0.5);
    if (fo > 0) {
      for (k = 0; k < 4; k++) {
        var o1 = on(t, cFirst == null ? null : cFirst + k * 0.22, 0.4), y = 140 + k * 62;
        out += Tx(860, y, WTA_ORD_NAME[k][0], "lab big gold", "start", { opacity: o1 });
        out += Tx(963, y, WTA_ORD_NAME[k][1], "lab big", "start", { opacity: o1 });
      }
    }
    return svg(out);
  }

  /* ==== chapter: following a route ==============================================
     The lesson's own 8 by 8 map and its own check question: Hodan walks 3
     squares east, then 2 north, and is still 3 squares east of her start.
     She starts on column 2, row 5 (row 0 is the top), so 3 east is column 5
     and 2 north is row 3: 5 - 2 = 3 columns east of where she began, and the
     row is the only thing the second move changed. */
  var WTA_START = [2, 5], WTA_MID = [5, 5], WTA_END = [5, 3];

  function wtaRouteChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRoute = c(0, "route"), cAfter = c(0, "after");
    var cStarts = c(1, "starts"), cNorth1 = c(1, "north");
    var cEast = c(2, "east"), c1 = c(2, "c1"), c2 = c(2, "c2"), c3 = c(2, "c3");
    var cNorth2 = c(3, "north"), cUp = c(3, "up");
    var cEast2 = c(4, "east"), cRow = c(4, "row"), cCol = c(4, "col");
    var out = wtaGrid({ cols: 8, rows: 8, cell: 40 }), k;

    /* where she is: three counted steps east, then one move of two north */
    var col = WTA_START[0] + wtaStep(t, c1, 0.34) + wtaStep(t, c2, 0.34) + wtaStep(t, c3, 0.34);
    var row = WTA_START[1] - 2 * wtaStep(t, cNorth2, 0.95);
    var start = wtaCell(WTA_START[0], WTA_START[1]), mid = wtaCell(WTA_MID[0], WTA_MID[1]);
    var end = wtaCell(WTA_END[0], WTA_END[1]), at = wtaCell(col, row);

    /* the trail she has walked, east then north */
    var eastU = (col - WTA_START[0]) / 3, northU = (WTA_START[1] - row) / 2;
    if (eastU > 0) out += L(start[0], start[1], lerp(start[0], mid[0], eastU), start[1], P.accent, 9, { opacity: 0.45 });
    if (northU > 0) out += L(mid[0], mid[1], mid[0], lerp(mid[1], end[1], northU), P.accent, 9, { opacity: 0.45 });

    /* "the route": the whole way, ghosted, before she walks it */
    var ghost = on(t, cAfter, 0.5) * (1 - on(t, c1, 0.5));
    if (ghost > 0) out += G(MK.arrow(start[0], start[1], mid[0], mid[1], 1, P.line, 5) +
      MK.arrow(mid[0], mid[1], end[0], end[1], 1, P.line, 5), { opacity: ghost * 0.85 });

    /* where she started, and where she is now */
    out += C(start[0], start[1], 11, "none", P.muted, 3, { opacity: on(t, cRoute, 0.5), "stroke-dasharray": "6 5" });
    out += MK.ripple(start[0], start[1], t, cStarts, P.accent);
    out += G(C(at[0], at[1], 15, P.accent, P.ground, 3), { opacity: on(t, cRoute, 0.5) });

    /* north is up the grid */
    var nO = on(t, cNorth1, 0.55);
    out += wtaRay(200, 318, 100, -90, P.teal, 8, nO);
    out += Tx(200, 368, "north is up", "lab big", "middle", { opacity: nO });

    /* the count: one, two, three, as each step lands */
    var counted = (c1 != null && t >= c1 ? 1 : 0) + (c2 != null && t >= c2 ? 1 : 0) + (c3 != null && t >= c3 ? 1 : 0);
    if (counted > 0 && wtaOnly(t, scene, 2) > 0.02) {
      var cueOf = [c1, c2, c3][counted - 1];
      out += G(Tx(200, 150, String(counted), "lab", "middle", { fill: P.gold, "font-size": 96 }),
        { opacity: wtaOnly(t, scene, 2), transform: around(200, 132, 1 + 0.14 * bump(t, cueOf, 0.5)) });
      out += Tx(200, 200, "east", "lab mid muted readable", "middle", { opacity: wtaOnly(t, scene, 2) });
    }
    out += MK.pill(950, 150, "3 squares east", on(t, cEast, 0.4) * wtaOnly(t, scene, 2), { size: 28, col: P.gold });
    out += MK.pill(950, 150, "2 squares north", on(t, cUp, 0.4) * wtaOnly(t, scene, 3), { size: 28, col: P.teal });

    /* the last beat: the three squares east, and the column that did not change */
    var showEast = on(t, cEast2, 0.5);
    if (showEast > 0) {
      for (k = 1; k <= 3; k++) {
        var cell = wtaCellXY(WTA_START[0] + k, WTA_START[1]);
        out += R(cell[0] + 2, cell[1] + 2, WTA_CELL - 4, WTA_CELL - 4, 4, P.gold, null, null,
          { opacity: 0.32 * showEast * on(t, cEast2 == null ? null : cEast2 + (k - 1) * 0.16, 0.3) });
      }
      out += wtaSpan(start[0], 399, mid[0], 399, showEast, P.gold, 5);
      out += MK.pill(950, 160, "3 squares east", showEast, { size: 30, col: P.gold });
    }
    var rowO = on(t, cRow, 0.5);
    if (rowO > 0) out += wtaSpan(738, mid[1], 738, end[1], rowO, P.teal, 5) +
      Tx(772, (mid[1] + end[1]) / 2 + 8, "rows", "lab big", "start", { fill: P.teal, opacity: rowO });
    var colO = on(t, cCol, 0.5);
    if (colO > 0) {
      out += L(end[0], WTA_GTOP + 4, end[0], WTA_GBOT - 4, P.gold, 4, { opacity: colO, "stroke-dasharray": "10 7" });
      out += MK.pill(950, 240, "same column", colO, { size: 30, col: P.gold });
    }
    return svg(out);
  }
