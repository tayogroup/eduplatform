  /* ==== chapters: measuring the shadow, and a table and a graph =================
     tools/lib/film-scenes/science-g2/the-sun-across-the-sky-3.js.

     The lesson's own hand span (its measure step's unit pic) is what lies
     along the shadow, three of them at nine, one at midday and three at
     three; its table is the table it asks the child to fill in ("Time",
     "Shadow in hand spans", 3 / 1 / 3) and its block graph is the graph it
     asks them to build, one block per hand span. The times are shown with
     the lesson's own three pictures. */

  var SAS_HAND = "\u{1F590}️";
  var SAS_TIMES = [
    { pic: "\u{1F305}", label: "9 o'clock", n: 3 },
    { pic: "☀️", label: "midday", n: 1 },
    { pic: "\u{1F307}", label: "3 o'clock", n: 3 }
  ];

  /* ---- measuring the shadow ---------------------------------------------------
     Beat 0 is the safety rule and has its own picture; beats 1 to 3 share the
     measuring one. */
  /* A child, drawn rather than taken from an emoji: this machine's child emoji
     is a head alone, and this one has to stand on the ground and own the
     shadow beside it. The kit's own skin colour (its body figure) and darker
     brown hair, as the brief asks where a film draws skin itself. */
  function sasChild(x, groundY, h) {
    var s = h / 150, skin = "#C68642", hy = groundY - 126 * s, hr = 21 * s, out = "";
    out += R(x - 15.5 * s, groundY - 58 * s, 13 * s, 58 * s, 5 * s, "#2B5673");
    out += R(x + 2.5 * s, groundY - 58 * s, 13 * s, 58 * s, 5 * s, "#2B5673");
    out += E(x - 15 * s, groundY - 3 * s, 12 * s, 5 * s, "#1B1B1B") + E(x + 15 * s, groundY - 3 * s, 12 * s, 5 * s, "#1B1B1B");
    out += L(x - 20 * s, groundY - 96 * s, x - 36 * s, groundY - 62 * s, skin, 11 * s);
    out += L(x + 20 * s, groundY - 96 * s, x + 36 * s, groundY - 62 * s, skin, 11 * s);
    out += R(x - 23 * s, groundY - 106 * s, 46 * s, 52 * s, 15 * s, P.teal);
    out += C(x, hy, hr, skin);
    out += Pth("M" + n2(x - hr * 0.98) + "," + n2(hy - 6 * s) + " a" + n2(hr) + "," + n2(hr) + " 0 0 1 " + n2(1.96 * hr) + ",0 z", "#2B1B10");
    out += C(x - 7 * s, hy + 1 * s, 2.8 * s, "#1B1B1B") + C(x + 7 * s, hy + 1 * s, 2.8 * s, "#1B1B1B");
    return out;
  }

  function sasSafetyPic(t, scene) {
    var cNever = sc(scene, 0, "never"), cShadow = sc(scene, 0, "shadow"), out = "";
    out += R(60, 362, 1048, 34, 0, SAS_GRASS);
    out += sasSunDisc(244, 112, 46, 1, t);
    /* the child, standing in the sun, and the shadow they are to look at */
    /* the shadow starts at the child's own feet, away from the Sun */
    out += E(690, 380, 134, 14, SAS_SHADE, null, null, { opacity: 0.72 });
    out += sasChild(560, 362, 178);
    var nv = on(t, cNever, 0.7);
    if (nv > 0) {
      out += L(536, 218, lerp(536, 292, nv), lerp(218, 142, nv), P.bad, 5, { "stroke-dasharray": "12 10" });
      out += MK.cross(416, 178, 40, popIn(t, cNever == null ? null : cNever + 0.3, 0.4), P.bad);
    }
    var sh = on(t, cShadow, 0.7);
    if (sh > 0) {
      out += L(586, 226, lerp(586, 690, sh), lerp(226, 366, sh), P.good, 5, { "stroke-dasharray": "12 10" });
      out += MK.tick(788, 380, 28, popIn(t, cShadow == null ? null : cShadow + 0.3, 0.4));
    }
    return out;
  }

  function sasMeasurePic(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cStick = c(1, "stick"), cNine = c(1, "nine"), cNoon = c(1, "midday"), cThree = c(1, "three");
    var cHands = c(2, "hands"), cEnd = c(2, "end"), cBottom = c(2, "bottom");
    var out = "";

    /* the three times, as the lesson pictures them */
    var chipAt = [cNine, cNoon, cThree];
    SAS_TIMES.forEach(function (row, k) {
      var p = popIn(t, chipAt[k], 0.4);
      if (!(p > 0)) return;
      var x = 250 + k * 334;
      out += G(R(x - 132, 34, 264, 106, 18, P.cell, P.line, 2) + MK.pic(x - 88, 86, 54, row.pic) +
        Tx(x - 48, 98, row.label, "lab big", "start"),
        { opacity: Math.min(1, p), transform: around(x, 86, 0.96 + 0.04 * Math.min(p, 1.08)) });
    });

    /* The stick, its shadow, and the hands laid end to end ALONGSIDE it -
       under the shadow, never over it. This is how the lesson's own measure
       step draws a measurement (science.css .mtrack: the object bar at
       top: 12px, the hand units in a row at top: 44px), and it is why: a
       74 px hand over a 18 px shadow covers the one thing being measured, so
       the length the hands are counting cannot be seen (review, 2026-09-23). */
    /* The whole arrangement sits 24 px higher than it first did, and the hand
       is 150 rather than 156. An emoji's drawn box is taller than its
       font-size - at 156 centred on y = 348 it ended 3 px below y = 440 - and
       MK.pop's overshoot to 1.1 multiplies that, so the sweep's 0.1 s grid saw
       3 to 7 px out and the frames between it about 12. Ground, shadow, stick
       and hands all moved together, so the gap between the bar and the hands
       under it is the same 24 px it was. */
    var st = on(t, cStick, 0.6);
    out += R(110, 226, 690, 22, 0, SAS_GRASS);
    if (st > 0) out += R(171, 228, 503 * Math.max(st, on(t, cHands, 0.6)), 18, 0, SAS_SHADE, null, null, { opacity: 0.85 });
    var hn = tally(t, cHands, 3, 1.5);
    for (var k = 0; k < hn; k++) {
      var at = cHands == null ? null : cHands + k * 0.5;
      out += MK.pop(Em(258 + k * 168, 324, 150, SAS_HAND), 258 + k * 168, 324, popIn(t, at, 0.4));
    }
    /* the stick last, so a hand laid from its foot never hides it */
    if (st > 0) out += R(164, lerp(226, 150, st), 14, 76 * st, 4, SAS_WOOD);
    /* "end to end": where one hand stops and the next starts */
    var ee = on(t, cEnd, 0.6);
    if (ee > 0) [342, 510].forEach(function (x) {
      out += L(x, 220, x, 406, SAS_GOLD, 3, { "stroke-dasharray": "9 8", opacity: ee });
    });
    /* "Start at the bottom of the stick" */
    var bo = on(t, cBottom, 0.6);
    if (bo > 0) {
      out += C(171, 237, 26 + 5 * breathe(t), "none", SAS_GOLD, 4, { opacity: bo });
      out += MK.leader(240, 176, 180, 218, bo, P.gold) + MK.pill(254, 176, "start here", bo, { size: 24, col: P.gold, anchor: "start" });
    }
    return out;
  }

  /* beat 3: nine, midday and three, each with its hands.
     Same arrangement as the beat before it: the shadow is a dark bar on the
     ground and the hands lie in a row UNDER it. The three rows exist to be
     compared - long, short, long - so the bar whose length differs is the one
     thing that must not be covered (review, 2026-09-23: 74 px hands sat on a
     12 px shadow, and the only bar a child could see was the green ground,
     the same length in all three rows). */
  var SAS_ROW = [100, 228, 356];
  function sasRowsPic(t, scene) {
    var at = [sc(scene, 3, "nine"), sc(scene, 3, "midday"), sc(scene, 3, "three")], out = "";
    SAS_TIMES.forEach(function (row, k) {
      var p = popIn(t, at[k], 0.45), y = SAS_ROW[k];
      if (!(p > 0)) return;
      var inner = R(52, y - 54, 1064, 108, 18, P.card, P.line, 2) +
        MK.pic(96, y - 4, 56, row.pic) + Tx(146, y + 12, row.label, "lab big", "start") +
        R(344, y - 34, 620, 20, 0, SAS_GRASS) + R(363, y - 52, 12, 28, 4, SAS_WOOD) +
        R(376, y - 31, 76 * row.n, 14, 0, SAS_SHADE, null, null, { opacity: 0.85 });
      for (var j = 0; j < row.n; j++) inner += Em(414 + j * 76, y + 16, 62, SAS_HAND);
      inner += MK.pill(1046, y, row.n + (row.n === 1 ? " hand" : " hands"), 1, { size: 24, col: P.gold });
      out += G(inner, { opacity: Math.min(1, p), transform: around(584, y, 0.97 + 0.03 * Math.min(p, 1.08)) });
    });
    return out;
  }

  function sasMeasureChapter(scene, beat, t, i) {
    var one = into(t, scene.first + 1), three = into(t, scene.first + 3), out = "";
    if (one < 1) out += G(sasSafetyPic(t, scene), { opacity: 1 - one });
    if (one > 0 && three < 1) out += G(sasMeasurePic(t, scene), { opacity: one * (1 - three) });
    if (three > 0) out += G(sasRowsPic(t, scene), { opacity: three });
    return svg(out);
  }

  /* ---- a table and a graph ------------------------------------------------------ */
  var SAS_TROW = [126, 200, 274];         /* the table's three rows, top edge */
  var SAS_COL = [700, 850, 1000];         /* the graph's three columns, centre */
  var SAS_BASE = 344;

  function sasTable(t, scene) {
    var cTime = sc(scene, 0, "time"), cLen = sc(scene, 0, "length"), cTab = sc(scene, 0, "table");
    var out = R(56, 74, 484, 274, 14, P.cell, P.line, 2);
    out += R(56, 74, 484, 52, 14, P.card) + R(56, 112, 484, 14, 0, P.card);
    out += Tx(72, 108, "Time", "lab mid", "start") + Tx(300, 108, "Shadow in hand spans", "lab mid", "start");
    out += L(288, 74, 288, 348, P.line, 2);
    SAS_TROW.forEach(function (y, k) {
      var row = SAS_TIMES[k];
      out += L(56, y, 540, y, P.line, 2);
      var a = on(t, cTime == null ? null : cTime + k * 0.32, 0.4);
      if (a > 0) out += G(MK.pic(92, y + 34, 40, row.pic) + Tx(120, y + 47, row.label, "lab big", "start"), { opacity: a });
      var b = on(t, cLen == null ? null : cLen + k * 0.32, 0.4);
      if (b > 0) out += Tx(414, y + 54, String(row.n), "lab huge", "middle", { opacity: b, fill: P.gold });
    });
    var lit = bump(t, cTab, 1.6);
    if (lit > 0) out += R(56, 74, 484, 274, 14, "none", SAS_GOLD, 4, { opacity: lit });
    return out;
  }

  function sasGraph(t, scene) {
    var cGraph = sc(scene, 1, "graph"), cBlock = sc(scene, 1, "block"), out = "";
    var ax = on(t, cGraph, 0.5);
    if (!(ax > 0)) return "";
    out += L(620, 164, 620, SAS_BASE, P.line, 3, { opacity: ax }) + L(620, SAS_BASE, 1120, SAS_BASE, P.line, 3, { opacity: ax });
    out += Tx(616, 158, "Hand spans", "lab mid muted", "start", { opacity: ax });
    var n = tally(t, cBlock, 7, 1.8), made = 0;
    SAS_TIMES.forEach(function (row, k) {
      var cx = SAS_COL[k];
      out += G(MK.pic(cx, 372, 40, row.pic) + Tx(cx, 410, row.label, "lab mid", "middle"), { opacity: ax });
      for (var j = 0; j < row.n; j++) {
        made++;
        if (made > n) continue;
        var at = cBlock == null ? null : cBlock + (made - 1) * 0.3;
        var p = popIn(t, at, 0.35), y = SAS_BASE - (j + 1) * 50 - j * 6;
        out += MK.pop(R(cx - 48, y, 96, 50, 7, P.good, "#2A8A4A", 3) +
          R(cx - 40, y + 6, 80, 12, 6, "#9CE8C4", null, null, { opacity: 0.7 }), cx, y + 25, p);
      }
    });
    return out;
  }
  function sasColTop(k) { return SAS_BASE - SAS_TIMES[k].n * 50 - (SAS_TIMES[k].n - 1) * 6; }

  function sasRecordChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cL1 = c(2, "l1"), cS = c(2, "s"), cL2 = c(2, "l2"), cShorter = c(2, "shorter"), cLonger = c(2, "longer");
    var cDown = c(3, "down"), cUp = c(3, "up"), cDec = c(3, "dec"), cInc = c(3, "inc");
    var cShortest = c(4, "shortest"), cHighest = c(4, "highest");
    var out = sasTable(t, scene) + sasGraph(t, scene);

    /* "Long, short, long": each column lit as it is said */
    var flash = [bump(t, cL1, 1.5), bump(t, cS, 1.5), bump(t, cL2, 1.5)];
    SAS_TIMES.forEach(function (row, k) {
      if (!(flash[k] > 0)) return;
      out += R(SAS_COL[k] - 52, sasColTop(k) - 4, 104, SAS_BASE - sasColTop(k) + 8, 10, "none", SAS_GOLD, 4, { opacity: flash[k] });
    });
    var two = sasOnly(t, scene, 2);
    out += MK.arrow(700, sasColTop(0) - 24, 850, sasColTop(1) - 24, on(t, cShorter, 0.7) * two, P.gold, 7);
    out += MK.arrow(850, sasColTop(1) - 24, 1000, sasColTop(2) - 24, on(t, cLonger, 0.7) * two, P.gold, 7);

    /* "down, then up again": the same two moves, named */
    var three = sasOnly(t, scene, 3);
    out += MK.arrow(700, sasColTop(0) - 24, 850, sasColTop(1) - 24, on(t, cDown, 0.7) * three, P.gold, 7);
    out += MK.arrow(850, sasColTop(1) - 24, 1000, sasColTop(2) - 24, on(t, cUp, 0.7) * three, P.gold, 7);
    out += MK.pill(742, 102, "decreasing", on(t, cDec, 0.5) * three, { size: 24, col: P.gold });
    out += MK.pill(986, 102, "increasing", on(t, cInc, 0.5) * three, { size: 24, col: P.gold });

    /* "the shortest shadow marks the highest Sun, at midday" */
    var four = sasOnly(t, scene, 4);
    if (four > 0) {
      var so = on(t, cShortest, 0.5) * four;
      out += R(SAS_COL[1] - 54, sasColTop(1) - 6, 108, SAS_BASE - sasColTop(1) + 12, 10, "none", SAS_GOLD, 4, { opacity: so });
      out += R(300, SAS_TROW[1], 240, 74, 0, "none", SAS_GOLD, 4, { opacity: so });
      out += sasSunDisc(850, 116, 28, on(t, cHighest, 0.6) * four, t);
    }
    return svg(out);
  }
