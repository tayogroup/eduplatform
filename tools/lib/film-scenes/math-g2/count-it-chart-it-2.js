  /* ==== Count It, Chart It, part 2 ============================================
     The two chapters that collect the data and draw it: "Ask, and keep a
     tally" and "A block graph". Both are the same seventeen children -
     mango 8, banana 5, orange 4 - so the tally the child watches being made
     is the tally the block graph is built from.

     The charts are ART.tally and ART.barChart, placed with ART.place. Every
     mark drawn over one of them is positioned through ccMap from a point
     MEASURED INSIDE the library's own layout, so the boxes cannot drift off
     the thing they name when a chart is moved or resized. */

  /* ---- the tally chapter -------------------------------------------------------
     The lesson's own investigation step (SURVEYS9: "What is the favourite
     fruit in our class?") and its tally step. Seventeen children answer, one
     at a time, and a mark goes down for each. */
  var CC_T_ROWS = [
    { key: "mango", label: "mango", y: 16 },
    { key: "banana", label: "banana", y: 156 },
    { key: "orange", label: "orange", y: 296 }
  ];
  var CC_T_X = 470, CC_T_W = 370, CC_T_H = 122;
  /* ART.tally's own layout: edge 22, mark pitch 11, gate 47 wide, gap 24,
     marks from y 22 to y 68. The first gate, and the three marks after it. */
  var CC_GATE_CARD = [14, 16, 69, 56];
  var CC_EXTRA_CARD = [87, 16, 34, 56];

  function ccTallyMap(rowY) { return ccMap({ x: CC_T_X, y: rowY, w: CC_T_W, h: CC_T_H }, 375, 124); }
  function ccTallyCard(n, y) {
    return ART.place(ART.tally(n, { label: String(n) }), CC_T_X, y, CC_T_W, CC_T_H);
  }
  function ccCardBox(rowY, card, o) {
    var m = ccTallyMap(rowY);
    return ccBox(m.x(card[0]), m.y(card[1]), m.w(card[2]), m.h(card[3]), o);
  }

  function ccTallyChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cQuest = c(0, "quest");
    var cWhich = c(1, "which"), cAsk = c(1, "ask");
    var cMark = c(2, "mark"), cAway = c(2, "away");
    var cFifth = c(3, "fifth"), cAcross = c(3, "across"), cFive = c(3, "five");
    var cGate = c(4, "gate"), cThree = c(4, "three"), cEight = c(4, "eight");
    var out = "", k;

    /* The question: large in the middle while it is all there is, and down
       into its corner as the class arrives to answer it. */
    var moved = ccFrom(t, scene, 1);
    out += MK.qmark(lerp(584, 44, moved), lerp(196, 405, moved), lerp(74, 22, moved), popIn(t, cQuest, 0.4));
    out += MK.pill(80, 405, "Which fruit do you like best?", popIn(t, cWhich, 0.4) * moved,
      { size: 20, anchor: "start", col: P.gold });

    /* how many answers have been heard, and therefore how many marks are down */
    var mkEnd = ccBeatStart(scene, 4);
    var span = cMark == null || mkEnd == null ? 1 : Math.max(0.8, mkEnd - cMark - 0.3);
    var heard = cMark == null || t < cMark ? 0 : tally(t, cMark, 17, span);
    var counts = { mango: Math.min(heard, 8), banana: clamp(heard - 8, 0, 5), orange: clamp(heard - 13, 0, 4) };

    /* the class, seventeen of them, answering one at a time */
    var classO = on(t, cAsk, 0.5);
    for (k = 0; k < 17; k++) {
      var cx = 62 + (k % 4) * 70, cy = 64 + Math.floor(k / 4) * 62;
      out += Em(cx, cy, 48, "\u{1F9D2}", { opacity: classO * (k < heard ? 1 : 0.3) });
    }
    /* the child being heard right now: a ring, on "straight away" */
    if (heard > 0 && heard <= 17 && cAway != null) {
      var j = heard - 1, rx = 62 + (j % 4) * 70, ry = 64 + Math.floor(j / 4) * 62;
      out += ccRing(rx, ry, 30, on(t, cAway, 0.4) * ccOnly(t, scene, 2) * 0.9);
    }

    /* the three tally rows */
    var rowO = clamp(on(t, cMark, 0.5), 0, 1);
    for (k = 0; k < 3; k++) {
      var row = CC_T_ROWS[k];
      out += G(ccTallyCard(counts[row.key], row.y), { opacity: rowO });
      out += Tx(455, row.y + 54, row.label, "lab big", "end", { opacity: rowO });
    }

    /* "Every fifth mark goes across the other four": the gate on the mango row */
    var top = CC_T_ROWS[0].y;
    var fifthO = Math.max(on(t, cFifth, 0.4), on(t, cAcross, 0.4)) * ccOnly(t, scene, 3);
    out += ccCardBox(top, CC_GATE_CARD, fifthO);
    /* "That bundle is five" */
    out += MK.pill(500, top + 96, "5", popIn(t, cFive, 0.4) * ccOnly(t, scene, 3), { size: 28, col: P.gold });

    /* "a gate of five", then "three more", then "That is eight" */
    var lateO = ccOnly(t, scene, 4);
    out += ccCardBox(top, CC_GATE_CARD, on(t, cGate, 0.4) * lateO);
    out += ccCardBox(top, CC_EXTRA_CARD, on(t, cThree, 0.4) * lateO);
    out += MK.pill(1000, top + 61, "8 children", popIn(t, cEight, 0.4), { size: 28, col: P.gold });
    return svg(out);
  }

  /* ---- the block graph chapter --------------------------------------------------
     The lesson's Build a block graph and Reading a block graph steps, on the
     tally's own numbers. ART.barChart draws the scale, so every figure the
     voice says is read off the axis rather than by eye: mango reaches 8,
     banana 5, orange 4, and 8 - 5 = 3.

     ART.barChart's own layout, for three bars on a scale of 0 to 8 in ones:
     edge 22, gutter 52, so the plot runs from x 74 to x 518 and the axis sits
     at y 266 with 210 px for the 8 blocks. */
  var CC_G = { x: 80, y: 44, w: 620, h: 377 };
  var CC_GM = ccMap(CC_G, 540, 328);
  var CC_BAR_CX = [CC_GM.x(148), CC_GM.x(296), CC_GM.x(444)];
  var CC_BAR_W = CC_GM.w(58);
  var CC_PLOT_X0 = CC_GM.x(74), CC_PLOT_X1 = CC_GM.x(518);
  function ccBarTop(v) { return CC_GM.y(266 - v * 26.25); }

  function ccGraphChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cGraph = c(0, "graph"), cBlock = c(0, "block");
    var cCount = c(1, "count"), cEight = c(1, "eight");
    var cBanana = c(2, "banana"), cOrange = c(2, "orange"), cLine = c(2, "line");
    var cTallest = c(3, "tallest"), cMost = c(3, "most");
    var cTake = c(4, "take"), cIs = c(4, "is"), cMore = c(4, "more");
    var out = "";

    var m = cBlock == null || t < cBlock ? 0 : tally(t, cBlock, 8, 1.8);
    var b = cBanana == null || t < cBanana ? 0 : tally(t, cBanana, 5, 1.1);
    var o = cOrange == null || t < cOrange ? 0 : tally(t, cOrange, 4, 0.9);
    var hot = cTallest != null && t >= cTallest;

    var chart = ART.barChart({
      title: "Favourite fruit",
      bars: [{ label: "mango", value: m }, { label: "banana", value: b }, { label: "orange", value: o }],
      step: 1, max: 8, highlight: hot ? 0 : null
    });
    out += G(ART.place(chart, CC_G.x, CC_G.y, CC_G.w, CC_G.h), { opacity: clamp(popIn(t, cGraph, 0.45), 0, 1) });

    /* the key: one block is one child */
    var legend = on(t, cBlock, 0.45);
    if (legend > 0) {
      out += R(744, 48, 36, 36, 7, ART.C.teal, null, null, { opacity: legend });
      out += Tx(794, 76, "= one child", "lab big", "start", { opacity: legend });
    }

    /* "Count the blocks": a level climbs the mango column, one block at a time */
    var cnt = cCount == null || t < cCount ? 0 : tally(t, cCount, 8, 1.7);
    var countLive = on(t, cCount, 0.3) * ccOnly(t, scene, 1);
    if (cnt > 0 && countLive > 0) {
      var cy = ccBarTop(cnt);
      out += L(CC_BAR_CX[0] - CC_BAR_W / 2 - 8, cy, CC_BAR_CX[0] + CC_BAR_W / 2 + 8, cy, P.gold, 4,
        { opacity: countLive, "stroke-dasharray": "10 7" });
      out += MK.pill(CC_BAR_CX[0] + CC_BAR_W / 2 + 14, cy + 20, String(cnt), countLive,
        { size: 26, anchor: "start", col: P.gold });
    }
    /* "reaches eight": the gridline at 8 */
    var eightO = bump(t, cEight, 1.6);
    if (eightO > 0) out += L(CC_PLOT_X0, ccBarTop(8), CC_PLOT_X1, ccBarTop(8), P.gold, 4, { opacity: eightO });

    /* "They start on one line": the axis */
    var lineO = bump(t, cLine, 1.5);
    if (lineO > 0) out += L(CC_PLOT_X0, ccBarTop(0), CC_PLOT_X1, ccBarTop(0), P.gold, 5, { opacity: lineO });

    /* what the graph tells you */
    out += MK.list(744, 210, [
      { text: "Most chose mango", at: cMost, mark: "tick" },
      { text: "3 more than banana", at: cMore, mark: "tick" }
    ], t, { lh: 62 });

    /* "Mango is tallest": a line from the top of the column to the words */
    var tallO = on(t, cTallest, 0.6);
    if (tallO > 0) out += MK.leader(CC_BAR_CX[0] + CC_BAR_W / 2, ccBarTop(8) + 14, 734, 206, tallO, P.gold);

    /* "Eight take away five is three": the gap between the two columns */
    var gapX = (CC_BAR_CX[0] + CC_BAR_CX[1]) / 2;
    var takeO = on(t, cTake, 0.6), mid = (ccBarTop(8) + ccBarTop(5)) / 2;
    if (takeO > 0) {
      out += MK.arrow(gapX, mid, gapX, lerp(mid, ccBarTop(8) + 3, takeO), takeO, P.gold, 6);
      out += MK.arrow(gapX, mid, gapX, lerp(mid, ccBarTop(5) - 3, takeO), takeO, P.gold, 6);
    }
    out += MK.pill(gapX, mid, "3", popIn(t, cIs, 0.4), { size: 30, col: P.gold });
    return svg(out);
  }
