  /* ==== Grade 3 Mathematics, Lesson 7: Time and Direction, part 3 ==============
     The chapters "Reading a timetable", "North, south, east, west" and
     "Finding your way", the recap, and KINDS. See time-and-direction.js. */

  /* ---- the timetable ----------------------------------------------------------
     ART has no table, so this one is drawn here and reported to the lead. The
     times are the lesson's own Which bus do you catch? arithmetic: the first
     bus leaves the Market at 8:45, the next two follow 25 minutes apart, and
     the legs are 10, 10 and 15 minutes, which puts Bus 2 at the Library at
     9:45 and Bus 3 at 10:10 exactly as the lesson's own worked example says. */
  var TT = { x: 120, y: 62, head: 62, rowH: 64, stopW: 196, busW: 150 };
  var TT_STOPS = ["Market", "School", "Clinic", "Library"];
  var TT_TIMES = [
    ["8:45", "9:10", "9:35"],
    ["8:55", "9:20", "9:45"],
    ["9:05", "9:30", "9:55"],
    ["9:20", "9:45", "10:10"]
  ];
  TT.w = TT.stopW + 3 * TT.busW;
  TT.h = TT.head + TT_STOPS.length * TT.rowH;
  function ttColX(b) { return TT.x + TT.stopW + b * TT.busW; }          /* left edge of bus b */
  function ttColMid(b) { return ttColX(b) + TT.busW / 2; }
  function ttRowY(s) { return TT.y + TT.head + s * TT.rowH; }           /* top edge of stop s */
  function ttRowMid(s) { return ttRowY(s) + TT.rowH / 2; }

  function tdTable(t, o) {
    if (!(o > 0)) return "";
    var out = R(TT.x, TT.y, TT.w, TT.h, 16, P.card, P.line, 2), b, s;
    out += R(TT.x, TT.y, TT.w, TT.head, 16, P.cell);
    out += R(TT.x, TT.y + TT.head - 16, TT.w, 16, 0, P.cell);
    out += Tx(TT.x + TT.stopW / 2, TT.y + TT.head / 2 + 9, "Stop", "lab big", "middle", { fill: P.muted });
    for (b = 0; b < 3; b++) out += Tx(ttColMid(b), TT.y + TT.head / 2 + 9, "Bus " + (b + 1), "lab big", "middle");
    for (s = 0; s < TT_STOPS.length; s++) {
      out += Tx(TT.x + TT.stopW / 2, ttRowMid(s) + 9, TT_STOPS[s], "lab big", "middle", { fill: P.muted });
      for (b = 0; b < 3; b++) out += Tx(ttColMid(b), ttRowMid(s) + 9, TT_TIMES[s][b], "lab big", "middle");
    }
    for (b = 0; b <= 3; b++) out += L(ttColX(b), TT.y, ttColX(b), TT.y + TT.h, P.line, 2, { "stroke-linecap": "butt" });
    for (s = 0; s <= TT_STOPS.length; s++) out += L(TT.x, ttRowY(s), TT.x + TT.w, ttRowY(s), P.line, 2, { "stroke-linecap": "butt" });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a translucent band over one whole column or one whole row */
  function tdBand(x, y, w, h, col, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 10, col, col, 3, { opacity: 0.22 * o, "stroke-opacity": 0.9 * o });
  }

  /* an outline round one cell of the table */
  function tdCellRing(b, s, col, p) {
    if (!(p > 0)) return "";
    var x = ttColX(b) + 6, y = ttRowY(s) + 5;
    return R(x, y, TT.busW - 12, TT.rowH - 10, 12, "none", col, 4,
      { opacity: Math.min(1, p), transform: around(ttColMid(b), ttRowMid(s), 0.86 + 0.14 * Math.min(p, 1)) });
  }

  function tdTimetableChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTable = c(0, "table"), cRows = c(0, "rows");
    var cCol = c(1, "col"), cRow = c(1, "row");
    var cLibrary = c(2, "library"), cBy = c(2, "by"), cWhich = c(2, "which");
    var cFind = c(3, "find"), cFinger = c(3, "finger"), cBus3 = c(3, "bus3"), cLate = c(3, "late");
    var cBus2 = c(4, "bus2"), cCatch = c(4, "catch");
    var lib = TT_STOPS.length - 1;               /* the Library is the last row */
    var out = "";

    out += tdTable(t, popIn(t, cTable, 0.5));
    /* "rows and columns": the header row and the stop column, together */
    var rowsO = bump(t, cRows, 1.3) * tdOnly(t, scene, 0);
    if (rowsO > 0) {
      out += tdBand(TT.x, TT.y, TT.w, TT.head, P.accent, rowsO);
      out += tdBand(TT.x, TT.y, TT.stopW, TT.h, P.accent, rowsO);
    }
    /* "Each column is one bus. Each row is one stop." */
    var one = tdOnly(t, scene, 1);
    if (one > 0) {
      out += tdBand(ttColX(0), TT.y, TT.busW, TT.h, P.teal, on(t, cCol, 0.45) * one);
      out += tdBand(TT.x, ttRowY(1), TT.w, TT.rowH, P.plum, on(t, cRow, 0.45) * one);
    }
    /* "Hodan must be at the Library by 10 o'clock." */
    var libO = on(t, cLibrary, 0.45) * tdBetween(t, scene, 2, 3);
    if (libO > 0) out += R(TT.x + 6, ttRowY(lib) + 5, TT.stopW - 12, TT.rowH - 10, 12, "none", P.gold, 4, { opacity: libO });
    var byO = on(t, cBy, 0.45);
    if (byO > 0) {
      out += G(R(830, 74, 300, 108, 20, P.card, P.gold, 3) +
        Em(888, 128, 54, "⏰") + Tx(1060, 140, "10:00", "lab huge", "middle", { fill: P.gold }) +
        Tx(980, 208, "be there by", "lab mid muted", "middle"), { opacity: byO });
    }
    out += MK.qmark(980, 268, 30, on(t, cWhich, 0.45) * tdBetween(t, scene, 2, 4));

    /* "Find the Library row, and keep a finger on it." */
    var findO = on(t, cFind, 0.45) * tdFrom(t, scene, 3);
    out += tdBand(TT.x, ttRowY(lib), TT.w, TT.rowH, P.gold, findO);
    out += MK.finger(150, 372, on(t, cFinger, 0.4) * tdFrom(t, scene, 3));

    /* Bus 3 at 10:10 is too late; Bus 2 at 9:45 is the one. The ring follows the
       cell, so it cannot spill past the table's edge, and the mark sits under
       its own column rather than over the time it is about. */
    out += tdCellRing(2, lib, P.bad, popIn(t, cBus3, 0.4) * tdFrom(t, scene, 3));
    out += MK.cross(ttColMid(2), TT.y + TT.h + 32, 26, popIn(t, cLate, 0.4) * tdFrom(t, scene, 3));
    out += tdCellRing(1, lib, P.good, popIn(t, cBus2, 0.4));
    out += MK.tick(ttColMid(1), TT.y + TT.h + 32, 26, popIn(t, cCatch, 0.4));
    var got = on(t, cCatch, 0.45);
    if (got > 0) out += G(Em(908, 342, 62, "\u{1F68C}") + MK.pill(1032, 342, "Bus 2", 1, { size: 32, col: P.good }), { opacity: got });
    return svg(out);
  }

  /* ==== chapter: north, south, east, west ======================================
     ART.compass draws the rose; the four words that a map turns them into are
     arrows off the four letters. Then one child turns while north does not. */
  var TDP = { x: 300, y: 62, w: 292, h: 294 };
  TDP.cx = TDP.x + 146; TDP.cy = TDP.y + 150; TDP.lr = 123;   /* the letters sit at r + 19 */
  function tdPointAt(deg) {
    var a = deg * Math.PI / 180;
    return [TDP.cx + TDP.lr * Math.cos(a), TDP.cy + TDP.lr * Math.sin(a)];
  }

  /* a circle of turning, with an arrowhead where it ends */
  function tdTurnCircle(cx, cy, r, cwise, o) {
    if (!(o > 0)) return "";
    var a0 = -90, a1 = a0 + (cwise ? 290 : -290);
    var pt = function (d) { var a = d * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    /* the head is built from a chord 30 degrees back, because a shorter tail
       makes MK.arrow shrink its head to nothing and the two circles then look
       the same as each other, which is exactly the fault this picture is for */
    var p0 = pt(a0), p1 = pt(a1), pb = pt(a1 + (cwise ? -30 : 30));
    return G(Pth("M" + n2(p0[0]) + "," + n2(p0[1]) + " A" + n2(r) + "," + n2(r) + " 0 1," +
      (cwise ? 1 : 0) + " " + n2(p1[0]) + "," + n2(p1[1]), null, P.teal, 6) +
      C(p0[0], p0[1], 7, P.teal) +        /* where the turn starts, so the head says which way */
      MK.arrow(pb[0], pb[1], p1[0], p1[1], 1, P.teal, 7), { opacity: clamp(o, 0, 1) });
  }

  function tdPointsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cNorth = c(0, "north"), cFour = c(0, "four");
    var cUp = c(1, "up"), cDown = c(1, "down");
    var cEast = c(2, "east"), cWest = c(2, "west");
    var cChange = c(3, "change"), cNever = c(3, "never");
    var cCw = c(4, "cw"), cAcw = c(4, "acw");
    var out = "", k;

    out += ART.place(ART.compass({ points: 4, facing: "N" }), TDP.x, TDP.y, TDP.w, TDP.h);
    /* the four letters ring, one at a time, in the order they are said */
    var shown = tally(t, cNorth, 4, 1.2);
    var order = [-90, 0, 90, 180];               /* N, E, S, W */
    for (k = 0; k < shown; k++) {
      var p = tdPointAt(order[k]);
      out += tdRing(p[0], p[1], 21, P.teal, popIn(t, cNorth == null ? null : cNorth + k * 0.4, 0.35));
    }
    out += MK.pill(152, 100, "4 cardinal points", on(t, cFour, 0.4), { size: 24, col: P.teal });

    /* what a map turns each of them into */
    var upO = on(t, cUp, 0.45), downO = on(t, cDown, 0.45);
    out += MK.arrow(TDP.cx, TDP.y + 12, TDP.cx, TDP.y - 32, upO, P.gold, 6);
    out += MK.pill(TDP.cx + 64, TDP.y - 22, "up", upO, { size: 24, anchor: "start", col: P.gold });
    out += MK.arrow(TDP.cx, TDP.y + TDP.h - 12, TDP.cx, TDP.y + TDP.h + 32, downO, P.gold, 6);
    out += MK.pill(TDP.cx + 64, TDP.y + TDP.h + 22, "down", downO, { size: 24, anchor: "start", col: P.gold });
    var eO = on(t, cEast, 0.45), wO = on(t, cWest, 0.45);
    out += MK.arrow(TDP.cx + TDP.lr + 22, TDP.cy, TDP.cx + TDP.lr + 72, TDP.cy, eO, P.gold, 6);
    out += MK.pill(TDP.cx + TDP.lr + 84, TDP.cy, "right", eO, { size: 24, anchor: "start", col: P.gold });
    out += MK.arrow(TDP.cx - TDP.lr - 22, TDP.cy, TDP.cx - TDP.lr - 72, TDP.cy, wO, P.gold, 6);
    out += MK.pill(TDP.cx - TDP.lr - 84, TDP.cy, "left", wO, { size: 24, anchor: "end", col: P.gold });

    /* the child turns, and north does not */
    var three = tdOnly(t, scene, 3);
    if (three > 0) {
      var turn = ease(on(t, cChange, 1.3)), deg = lerp(0, 180, turn), ang = deg * Math.PI / 180;
      var s = Em(930, 262, 104, "\u{1F9CD}");
      /* where their right hand pointed before the turn, kept faint, and the
         path between: without it a single still cannot show a thing has moved */
      s += G(MK.arrow(930, 250, 1008, 250, 1, P.teal, 6), { opacity: 0.26 * on(t, cChange, 0.4) });
      if (deg > 6) s += Pth("M" + n2(930 + 92) + ",250 A92,92 0 " + (deg > 180 ? 1 : 0) + ",1 " +
        n2(930 + 92 * Math.cos(ang)) + "," + n2(250 + 92 * Math.sin(ang)), null, P.teal, 2.5,
        { "stroke-dasharray": "7 7", opacity: 0.7 });
      s += MK.arrow(930, 250, 930 + 78 * Math.cos(ang), 250 + 78 * Math.sin(ang), 1, P.teal, 6);
      s += MK.pill(930, 392, "your right moves", on(t, cChange, 0.4), { size: 24, col: P.teal });
      var nv = on(t, cNever, 0.5);
      s += MK.glow(930, 118, 96, P.gold, nv * (0.6 + 0.4 * breathe(t)));
      s += MK.arrow(930, 162, 930, 100, 1, P.gold, 7);
      s += Tx(930, 78, "north", "lab big", "middle", { fill: P.gold });
      s += MK.tick(1042, 120, 20, popIn(t, cNever, 0.4));
      out += G(s, { opacity: three });
    }

    /* clockwise, and the other way */
    var four = tdOnly(t, scene, 4);
    if (four > 0) {
      var f = tdTurnCircle(858, 244, 54, true, on(t, cCw, 0.5));
      f += Em(858, 244, 46, "\u{1F553}");
      f += MK.pill(858, 348, "clockwise", on(t, cCw, 0.4), { size: 22, col: P.teal });
      f += tdTurnCircle(1058, 244, 54, false, on(t, cAcw, 0.5));
      f += MK.pill(1058, 348, "anticlockwise", on(t, cAcw, 0.4), { size: 22, col: P.teal });
      out += G(f, { opacity: four });
    }
    return svg(out);
  }

  /* ==== chapter: finding your way ==============================================
     The lesson's own map, on ART.grid: Home at column 1 row 3 and School at
     column 3 row 1, so the route is 2 squares EAST (+x, to the right) and then
     2 squares NORTH (-y, up the map). The pin moves in exactly those two
     directions, and the two squares it crosses are outlined as it goes, so the
     count on screen is the count in the words. */
  var TDR = { x: 80, y: 22, size: 396 };
  TDR.s = TDR.size / 224;                       /* ART.grid(5 x 5, cell 36) is 224 x 224 */
  TDR.gx = TDR.x + 22 * TDR.s;
  TDR.gy = TDR.y + 22 * TDR.s;
  TDR.cell = 36 * TDR.s;
  function tdCellX(c) { return TDR.gx + c * TDR.cell + TDR.cell / 2; }
  function tdCellY(r) { return TDR.gy + r * TDR.cell + TDR.cell / 2; }
  var TD_PLACES = [
    { n: "Home", e: "\u{1F3E0}", c: 1, r: 3 }, { n: "School", e: "\u{1F3EB}", c: 3, r: 1 },
    { n: "Market", e: "\u{1F6D2}", c: 4, r: 3 }, { n: "Park", e: "\u{1F333}", c: 0, r: 2 }
  ];

  function tdCellBox(c, r, col, p) {
    if (!(p > 0)) return "";
    var x = TDR.gx + c * TDR.cell, y = TDR.gy + r * TDR.cell;
    return R(x + 3, y + 3, TDR.cell - 6, TDR.cell - 6, 9, "none", col, 4,
      { opacity: Math.min(1, p), transform: around(x + TDR.cell / 2, y + TDR.cell / 2, 0.82 + 0.18 * Math.min(p, 1)) });
  }

  function tdRouteChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMap = c(0, "map"), cHome = c(0, "home");
    var cEast = c(1, "east"), cRight = c(1, "right");
    var cNorth = c(2, "north"), cUp = c(2, "up");
    var cSchool = c(3, "school"), cFollow = c(3, "follow");
    var cWest = c(4, "west"), cTurn = c(4, "turn"), cFacing = c(4, "facing");
    var out = "", k;

    out += G(ART.place(ART.grid({ cols: 5, rows: 5, cell: 36 }), TDR.x, TDR.y, TDR.size, TDR.size),
      { opacity: popIn(t, cMap, 0.5) > 1 ? 1 : Math.min(1, popIn(t, cMap, 0.5)) });
    for (k = 0; k < TD_PLACES.length; k++) {
      var pl = TD_PLACES[k];
      out += Em(tdCellX(pl.c), tdCellY(pl.r) - 9, 34, pl.e);
      out += Tx(tdCellX(pl.c), tdCellY(pl.r) + 25, pl.n, "lab tiny dark", "middle");
    }
    /* the lesson's own N arrow, beside the map */
    out += Tx(505, 62, "N", "lab big", "middle", { fill: P.gold });
    out += MK.arrow(505, 118, 505, 76, 1, P.gold, 5);

    /* east is +x, north is -y: the pin, and the squares it crosses */
    var uE = on(t, cEast, 0.95), uN = on(t, cNorth, 0.95);
    var col = 1 + 2 * uE, row = 3 - 2 * uN;
    var px = tdCellX(col), py = tdCellY(row);
    if (uE > 0) out += L(tdCellX(1), tdCellY(3), px, tdCellY(3), P.gold, 7, { opacity: 0.85 });
    if (uN > 0) out += L(tdCellX(3), tdCellY(3), tdCellX(3), py, P.gold, 7, { opacity: 0.85 });
    var nE = tally(t, cRight, 2, 0.7), nN = tally(t, cUp, 2, 0.7);
    for (k = 0; k < nE; k++) out += tdCellBox(2 + k, 3, P.gold, popIn(t, cRight == null ? null : cRight + k * 0.7, 0.35));
    for (k = 0; k < nN; k++) out += tdCellBox(3, 2 - k, P.gold, popIn(t, cUp == null ? null : cUp + k * 0.7, 0.35));
    out += tdRing(tdCellX(1), tdCellY(3), 34, P.teal, popIn(t, cHome, 0.4) * tdBetween(t, scene, 0, 3));
    out += tdRing(tdCellX(3), tdCellY(1), 34, P.good, popIn(t, cSchool, 0.4));
    /* the counter sits in the corner of its square, so the place it is standing
       on can still be seen and named */
    out += MK.pic(px - 19, py - 17, 36, "\u{1F4CD}");
    /* "anyone can follow them": somebody else walks the same route, 2 east then
       2 north, from the words alone. Popping a second figure ON the Home square
       was the first try and could not be seen at all - the house is already
       there - so this one moves. */
    var fu = ease(on(t, cFollow, 1.35));
    if (fu > 0) {
      var fc = 1 + 2 * Math.min(1, fu * 2), fr = 3 - 2 * Math.max(0, fu * 2 - 1);
      var fx = tdCellX(fc), fy = tdCellY(fr);
      out += MK.glow(fx, fy, 46, P.good, 1);
      out += Em(fx + 19, fy - 15, 32, "\u{1F6B6}");
    }

    /* the route in words, until the turn takes the right-hand side */
    var listO = tdBetween(t, scene, 1, 4);
    if (listO > 0) {
      out += G(MK.list(560, 134, [
        { text: "Go 2 squares east", at: cEast },
        { text: "then 2 squares north", at: cNorth },
        { text: "you reach the School", at: cSchool, mark: "tick" }
      ], t, { lh: 64 }), { opacity: listO });
    }

    /* face west, a quarter turn clockwise, and you face north */
    var four = tdFrom(t, scene, 4);
    if (four > 0) {
      var plain = on(t, cWest, 0.5) * (1 - on(t, cTurn, 0.5));
      var turned = on(t, cTurn, 0.5);
      var g = "";
      /* BOTH are 292 x 294 - ART.compass only grows for a caption, and it is
         given none - so the rose does not jump when the turn arrives on top */
      if (plain > 0) g += G(ART.place(ART.compass({ points: 4, facing: "W" }), 700, 46, 292, 294), { opacity: plain });
      if (turned > 0) g += G(ART.place(ART.compass({ points: 4, facing: "W", turn: { quarters: 1, way: "clockwise" } }), 700, 46, 292, 294), { opacity: turned });
      g += tdRing(846, 73, 22, P.good, popIn(t, cFacing, 0.4));
      g += MK.tick(960, 73, 20, popIn(t, cFacing == null ? null : cFacing + 0.3, 0.35));
      out += G(g, { opacity: four });
    }
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------- */
  function tdMiniClock(cx, cy, size) { return ART.place(ART.clock(3, 30), cx - size / 2, cy - size / 2, size, size); }
  function tdMiniCompass(cx, cy, size) {
    var h = size * 294 / 292;
    return ART.place(ART.compass({ points: 4, facing: "N" }), cx - size / 2, cy - h / 2, size, h);
  }

  var TD_RECAP = MK.recapKind([
    { beat: 0, at: "hour", title: "Short hand", sub: "gives the hour", pic: tdMiniClock },
    { beat: 0, at: "minutes", title: "Long hand", sub: "gives the minutes", pic: "⏱️" },
    { beat: 1, at: "counton", title: "Time intervals", sub: "count on to the end time", pic: "⌛" },
    { beat: 1, at: "unit", title: "The right unit", sub: "seconds, minutes, hours, years", pic: "\u{1F4C5}" },
    { beat: 2, at: "rowcol", title: "Timetables", sub: "find the row, then the column", pic: "\u{1F68C}" },
    { beat: 2, at: "nevermove", title: "Cardinal points", sub: "north, south, east and west", pic: tdMiniCompass }
  ], { goBeat: 2, goAt: "nevermove" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Reading a clock, to the quarter hour",
      "Working out how long something took",
      "Timetables, and north, south, east and west"
    ] }),
    clock: tdClockChapter,
    interval: tdIntervalChapter,
    units: tdUnitsChapter,
    timetable: tdTimetableChapter,
    points: tdPointsChapter,
    route: tdRouteChapter,
    recap: TD_RECAP
  };
