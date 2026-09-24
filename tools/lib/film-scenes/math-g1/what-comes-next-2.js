
  /* ==== chapters: jump patterns, and patterns that grow ======================
     tools/lib/film-scenes/math-g1/what-comes-next-2.js.

     The jump chapter is ART.numberLine, the library's counting line, with the
     lesson's own two jump patterns on it: 2, 4, 6, 8, 10 counting on in twos,
     and 10, 9, 8, 7, 6 counting back in ones (the lesson's SEQS5, and the only
     two jumps Stage 1 allows - its own comment says counting back in twos is
     not Stage 1). The growing chapter is the lesson's "Growing shapes" step
     drawn here, because the library has no growing-shape picture: pattern n is
     n rows of two squares, so the counts are 2, 4, 6, 8, and ART.sequence
     carries those counts underneath. */

  /* ---- the counting line ----------------------------------------------------
     One line, always 0 to 20 and always 1000 wide, so a value sits at the same
     place on the screen in every frame of the chapter. The drawing grows
     UPWARDS when jumps are added to it (ART.numberLine leaves room for the
     arcs), so it is placed by where its axis has to land, never by its top. */
  var WCN_J = { x: 84, w: 1000, y: 300 };
  function wcnJX(v) { return WCN_J.x + 36 + (v / 20) * (WCN_J.w - 72); }
  function wcnJLine(o) {
    var jumps = o.jumps || [];
    var ay = (jumps.length ? 96 : 26) + 20;
    var drawing = ART.numberLine({
      from: 0, to: 20, step: 1, labelEvery: 2, width: WCN_J.w,
      marks: o.marks || [], jumps: jumps
    });
    return ART.place(drawing, WCN_J.x, WCN_J.y - ay, WCN_J.w, ay + 62);
  }

  var WCN_UP = [2, 4, 6, 8, 10];
  var WCN_DOWN = [10, 9, 8, 7, 6];

  function wcnJumpChapter(scene, beat, t, i) {
    var out = "", k;
    var atNumbers = sc(scene, 0, "numbers"), atCount = sc(scene, 0, "count");
    var atTwo = sc(scene, 1, "two"), atBefore = sc(scene, 1, "before");
    var atJump = sc(scene, 2, "jump"), atSame = sc(scene, 2, "same");
    var atBack = sc(scene, 3, "back"), atDown = sc(scene, 3, "down");
    var atFind = sc(scene, 4, "find"), atFill = sc(scene, 4, "fill");

    var backU = wcnFrom(t, scene, 3);           /* 0 -> 1 as the film turns round */
    var upO = 1 - backU, downO = backU;

    /* ---- counting on in twos ---- */
    if (upO > 0.02) {
      var shown = tally(t, atCount, 5, 1.2), arcs = tally(t, atTwo, 4, 1.25);
      var marks = [], jumps = [];
      for (k = 0; k < 5 && k < shown; k++) marks.push({ at: WCN_UP[k] });
      for (k = 0; k < 4 && k < arcs; k++) jumps.push({ from: WCN_UP[k], to: WCN_UP[k + 1], label: "+2", colour: "teal" });
      var pulse = atSame == null || t < atSame ? 0 : 0.5 + 0.5 * breathe(t);
      out += G(wcnJLine({ marks: marks, jumps: jumps }), { opacity: upO * on(t, atNumbers, 0.5) });
      /* the number, and the one before it */
      var beforeO = on(t, atBefore, 0.45) * upO * (1 - on(t, atJump, 0.45));
      if (beforeO > 0.02) {
        out += G(wcnRing(wcnJX(10), WCN_J.y, 14, P.gold, 1) + wcnRing(wcnJX(8), WCN_J.y, 14, P.muted, 1) +
          Tx(wcnJX(8), WCN_J.y + 96, "the one before", "lab mid muted", "middle"), { opacity: beforeO });
      }
      /* the jump has a name, and it never changes */
      out += G(MK.pill(584, 52, "a jump pattern", popIn(t, atJump, 0.4), { size: 24, col: P.blue, ink: P.blue }), { opacity: upO });
      if (pulse > 0) {
        for (k = 0; k < 4; k++) out += G(MK.glow((wcnJX(WCN_UP[k]) + wcnJX(WCN_UP[k + 1])) / 2, WCN_J.y - 58, 40, P.gold, pulse), { opacity: upO });
        out += G(MK.pill(584, 112, "+2 every time", on(t, atSame, 0.45), { size: 22, col: P.gold, ink: P.gold }), { opacity: upO });
      }
    }

    /* ---- counting back in ones ---- */
    if (downO > 0.02) {
      var dJumps = [];
      for (k = 0; k < 4; k++) dJumps.push({ from: WCN_DOWN[k], to: WCN_DOWN[k + 1], label: "−1", colour: "plum" });
      var dMarks = [];
      for (k = 0; k < 5; k++) dMarks.push({ at: WCN_DOWN[k] });
      out += G(wcnJLine({ marks: dMarks, jumps: dJumps }), { opacity: downO });
      out += G(MK.pill(584, 52, "backwards", popIn(t, atBack, 0.4), { size: 24, col: P.plum, ink: P.plum }), { opacity: downO });
      /* a ring walks back along the five numbers as they are said */
      var walked = tally(t, atDown, 5, 1.2);
      if (walked > 0) out += G(wcnRing(wcnJX(WCN_DOWN[walked - 1]), WCN_J.y, 14, P.gold, 1), { opacity: downO });

      /* the hole in the line, and the jump that fills it */
      var holeO = wcnOnly(t, scene, 4);
      if (holeO > 0.02) {
        var fillP = popIn(t, atFill, 0.42), hx = wcnJX(8), hy = WCN_J.y + 32;
        out += G(R(hx - 21, hy - 16, 42, 32, 9, "#FFFFFF"), { opacity: holeO });
        out += G(Tx(hx, hy + 7, "?", "lab big", "middle", { fill: "#C4453A" }), { opacity: holeO * (1 - Math.min(1, fillP)) });
        out += G(Tx(hx, hy + 7, "8", "lab big", "middle", { fill: "#2E8B57" }), { opacity: holeO * Math.min(1, fillP) });
        out += G(MK.pill(584, 112, "the jump is −1", on(t, atFind, 0.45), { size: 22, col: P.gold, ink: P.gold }), { opacity: holeO });
        out += MK.tick(hx + 52, hy + 4, 20, popIn(t, atFill == null ? null : atFill + 0.5, 0.38) * holeO);
      }
    }
    return svg(out);
  }

  /* ==== chapter: patterns that grow ==========================================
     The lesson's "Growing shapes" step: pattern n is n rows of two squares, so
     the counts are 2, 4, 6, 8 and each pattern adds one row. The new row of
     each pattern is the thing that is said, so it is the thing that lights. */
  var WCN_G = { x: [174, 404, 634, 864], w: 100, top: 34, sq: 26, gap: 6, rowH: 32 };
  /* the card is as tall as its own pattern, so the four of them make a staircase */
  function wcnGrowH(n) { return 24 + n * WCN_G.rowH; }
  function wcnGCentre(n) { return WCN_G.x[n] + WCN_G.w / 2; }
  /* pattern n (1 to 4): its card, its n rows of two squares, `lit` rows gold */
  function wcnGrowBox(n, o, newRow) {
    if (!(o > 0)) return "";
    var bx = WCN_G.x[n - 1], sx = bx + (WCN_G.w - (2 * WCN_G.sq + WCN_G.gap)) / 2, s = "", r, c;
    s += R(bx, WCN_G.top, WCN_G.w, wcnGrowH(n), 16, P.card, P.line, 2);
    for (r = 0; r < n; r++) {
      for (c = 0; c < 2; c++) {
        var isNew = r === n - 1;
        s += R(sx + c * (WCN_G.sq + WCN_G.gap), WCN_G.top + 12 + r * WCN_G.rowH, WCN_G.sq, WCN_G.sq, 6,
          isNew && newRow > 0 ? P.gold : P.teal);
      }
    }
    if (newRow > 0) {
      s += G(R(sx - 7, WCN_G.top + 5 + (n - 1) * WCN_G.rowH, 2 * WCN_G.sq + WCN_G.gap + 14, WCN_G.sq + 14, 9, "none", P.gold, 3),
        { opacity: clamp(newRow, 0, 1) });
    }
    s += Tx(wcnGCentre(n - 1), WCN_G.top + 202, "pattern " + n, "lab mid muted", "middle");
    return G(s, { opacity: clamp(o, 0, 1) });
  }

  /* the sequence strip under the patterns: the counts, with +2 between them */
  var WCN_S = { x: 351, y: 258, box: 68, gap: 50, edge: 22 };
  function wcnSX(i) { return WCN_S.x + WCN_S.edge + i * (WCN_S.box + WCN_S.gap); }
  function wcnStrip(last) {
    return ART.place(ART.sequence({ terms: [2, 4, 6, last], step: 2, arrows: true }), WCN_S.x, WCN_S.y, 466, 132);
  }

  function wcnGrowChapter(scene, beat, t, i) {
    var out = "", k;
    var atGrow = sc(scene, 0, "grow"), atRow = sc(scene, 0, "row");
    var atCounts = sc(scene, 1, "counts"), atCount = sc(scene, 1, "count");
    var atJump = sc(scene, 2, "jump"), atLike = sc(scene, 2, "like");
    var atEight = sc(scene, 3, "eight"), atMore = sc(scene, 3, "more");
    var atBigger = sc(scene, 4, "bigger"), atSame = sc(scene, 4, "same");

    var boxes = tally(t, atGrow, 3, 0.95);
    var newRow = on(t, atRow, 0.5) * (1 - wcnFrom(t, scene, 1));
    var fourth = popIn(t, atEight, 0.45);
    var lastRow = on(t, atMore, 0.45);

    for (k = 1; k <= 3; k++) out += wcnGrowBox(k, k <= boxes ? 1 : 0, k > 1 ? newRow : 0);
    out += wcnGrowBox(4, Math.min(1, fourth), lastRow);

    /* the counts, one as each is said, and the fourth when it is worked out */
    var counted = tally(t, atCounts, 3, 1.0);
    for (k = 1; k <= 3; k++) {
      if (k > counted) continue;
      out += Tx(wcnGCentre(k - 1), WCN_G.top + 172, String(k * 2), "lab big", "middle", { fill: P.gold });
    }
    if (fourth > 0) out += G(Tx(wcnGCentre(3), WCN_G.top + 172, "8", "lab big", "middle", { fill: P.good }), { opacity: Math.min(1, fourth) });
    /* counting them: a tap on each pattern in turn, as the lesson's child does */
    if (atCount != null) for (k = 0; k < 3; k++)
      out += MK.ripple(wcnGCentre(k), WCN_G.top + wcnGrowH(k + 1) / 2, t, atCount + k * 0.34, P.gold);

    /* the counts as a pattern of their own, and the +2 between them */
    var stripO = on(t, atJump, 0.5);
    if (stripO > 0.02) {
      out += G(wcnStrip(fourth > 0 ? 8 : null), { opacity: stripO });
      var likeU = on(t, atLike, 0.5) * (1 - wcnFrom(t, scene, 3));
      for (k = 0; k < 3 && likeU > 0.02; k++)
        out += R(wcnSX(k) - 6, WCN_S.y + 36, WCN_S.box + 12, WCN_S.box + 12, 18, "none", P.gold, 3, { opacity: likeU });
      var sameU = atSame == null || t < atSame ? 0 : 0.5 + 0.5 * breathe(t);
      for (k = 1; k < 4 && sameU > 0; k++)
        out += MK.glow(wcnSX(k) - WCN_S.gap / 2, WCN_S.y + 26, 34, P.gold, sameU);
    }

    /* it gets bigger by the same amount: the staircase the four patterns make */
    var stairU = on(t, atBigger, 0.75);
    if (stairU > 0.02 && fourth > 0) {
      var pts = [], d = "";
      for (k = 1; k <= 4; k++) pts.push([wcnGCentre(k - 1), WCN_G.top + 12 + k * WCN_G.rowH]);
      var end = polyAt(pts, polyLen(pts) * clamp(stairU, 0, 1));
      for (k = 0; k <= end[2]; k++) d += (k === 0 ? "M" : "L") + n2(pts[k][0]) + "," + n2(pts[k][1]);
      d += "L" + n2(end[0]) + "," + n2(end[1]);
      out += Pth(d, null, P.gold, 4, { "stroke-dasharray": "10 8", opacity: 0.95 });
      out += C(end[0], end[1], 7, P.gold);
    }
    return svg(out);
  }
