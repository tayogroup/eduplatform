  /* ==== Halves and Wholes, part 3 ==============================================
     "Half of a number" (1Nf.03), "Two halves make a whole" (1Nf.04), the recap
     and KINDS. See halves-and-wholes.js for the file's rules.

     The numbers are the lesson's own: NUM5 opens on 8 and the film halves 8 the
     way the lesson's explain does ("Press share... count the top row... Four and
     four make eight"), then 10, which the lesson's check and its story problems
     both halve. WHOLE8 counts 1 to 4 wholes in twos; the film takes three, which
     is also the lesson's own story problem about six halves of orange. */

  /* ---- half of a number -------------------------------------------------------
     Eight counters, dealt into two rows: counter k goes to row k % 2, so the
     rows take turns and each ends with four. The row positions are one spacing
     constant, so the two rows are the same length because of how they are
     placed, not because they were drawn to look it. */
  var HW_N8 = { y0: 148, y1: 252, gapRow: 110, first: 419 };
  var HW_N10 = { y0: 150, y1: 254, gapRow: 110, first: 364 };

  function hwRowX(cfg, col) { return cfg.first + col * cfg.gapRow; }
  function hwBand(x1, x2, y, u, col) {
    if (!(u > 0)) return "";
    return R(x1, y - 32, (x2 - x1) * clamp(u, 0, 1), 64, 32, col || P.gold, null, null, { opacity: 0.2 }) +
      R(x1, y - 32, (x2 - x1) * clamp(u, 0, 1), 64, 32, "none", col || P.gold, 3, { opacity: 0.8 });
  }

  /* the two small plates of the chapter before, as an echo of "sharing a pile" */
  function hwMiniShare(t, at, o) {
    if (!(o > 0)) return "";
    var p = popIn(t, at, 0.5);
    if (!(p > 0)) return "";
    var out = "", k, cxs = [420, 748], j;
    for (k = 0; k < 2; k++) {
      out += E(cxs[k], 252, 108, 24, "#1C4A5E", P.line, 3);
      for (j = 0; j < 3; j++) out += Em(cxs[k] + (j - 1) * 62, 226, 38, "\u{1F34E}");
    }
    return G(out, { opacity: Math.min(1, p) * clamp(o, 0, 1) });
  }

  function hwNumberChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cHalving = c(0, "halving"), cSharing = c(0, "sharing");
    var cEight = c(1, "eight"), cRows = c(1, "rows");
    var cCountRow = c(2, "countrow"), cFour = c(2, "four");
    var cFourFour = c(3, "fourfour"), cHalfEight = c(3, "halfeight");
    var cCountAll = c(4, "countall"), cStarted = c(4, "started");
    var cSmaller = c(5, "smaller"), cHalfTen = c(5, "halften");
    var A = hwUntil(t, scene, 5), B = hwFrom(t, scene, 5), out = "", k;

    if (A > 0.01) {
      var a = "";
      /* "the same job as sharing a pile" */
      var echo = hwUntil(t, scene, 1);
      a += hwMiniShare(t, cSharing, echo);
      a += MK.pill(584, 108, "halving", on(t, cHalving, 0.45) * echo, { size: 32, col: P.blue, ink: P.blue });

      /* eight counters, in one row and then in two rows of four */
      var split = on(t, cRows, 0.55);
      for (k = 0; k < 8; k++) {
        var pk = popIn(t, hwAfter(cEight, k * 0.07), 0.4);
        if (pk <= 0) continue;
        var su = clamp((t - (cRows == null ? 1e9 : cRows) - k * 0.07) / 0.5, 0, 1);
        var x = lerp(345 + k * 68, hwRowX(HW_N8, Math.floor(k / 2)), ease(su));
        var y = lerp(160, k % 2 === 0 ? HW_N8.y0 : HW_N8.y1, ease(su));
        a += hwDot(x, y, 27 * Math.min(pk, 1.08), k % 2 === 0 ? P.accent : P.teal, Math.min(1, pk));
      }

      /* "count one row only": the top row banded, then counted one, two, three, four */
      var band = on(t, cCountRow, 0.6) * split;
      a += hwBand(hwRowX(HW_N8, 0) - 50, hwRowX(HW_N8, 3) + 50, HW_N8.y0, band, P.gold);
      var counted = tally(t, hwAfter(cCountRow, 0.55), 4, 1.25);
      for (k = 0; k < 4; k++) if (counted > k)
        a += hwBadge(hwRowX(HW_N8, k), HW_N8.y0 - 64, String(k + 1),
          popIn(t, hwAfter(cCountRow, 0.55 + k * 0.42), 0.35), P.gold);
      a += MK.pill(890, HW_N8.y0, "4", on(t, cFour, 0.45), { size: 34, col: P.gold, ink: P.gold });

      /* "Four and four make eight, so half of eight is four" */
      a += MK.pill(890, HW_N8.y1, "4", on(t, cFourFour, 0.45), { size: 34, col: P.teal, ink: P.teal });
      a += MK.pill(584, 344, "4 and 4 make 8", on(t, cFourFour, 0.45) * hwUntil(t, scene, 4), { size: 28, col: P.line });
      a += MK.pill(584, 404, "half of 8 is 4", on(t, cHalfEight, 0.45), { size: 34, col: P.gold, ink: P.gold });

      /* "Do not count them all. Eight is what you started with." */
      var all = on(t, cCountAll, 0.5);
      if (all > 0) {
        a += R(hwRowX(HW_N8, 0) - 60, HW_N8.y0 - 36, hwRowX(HW_N8, 3) - hwRowX(HW_N8, 0) + 120, HW_N8.y1 - HW_N8.y0 + 72, 26,
          "none", P.bad, 3.5, { "stroke-dasharray": "13 10", opacity: all });
        a += hwBadge(232, 200, "8", popIn(t, cCountAll, 0.4), P.bad);
        a += MK.cross(312, 200, 25, popIn(t, hwAfter(cCountAll, 0.3), 0.4));
      }
      a += MK.pill(258, 278, "8 to start", on(t, cStarted, 0.45), { size: 28, col: P.line });
      out += G(a, { opacity: A });
    }

    /* "Halving makes a number smaller. Half of ten is five." */
    if (B > 0.01) {
      var b = "";
      for (k = 0; k < 10; k++) {
        var qk = popIn(t, hwAfter(BEATS[scene.first + 5].start, k * 0.05), 0.4);
        b += hwDot(hwRowX(HW_N10, Math.floor(k / 2)), k % 2 === 0 ? HW_N10.y0 : HW_N10.y1,
          27 * Math.min(qk, 1.08), k % 2 === 0 ? P.accent : P.teal, Math.min(1, qk));
      }
      var lit = on(t, cHalfTen, 0.6);
      b += hwBand(hwRowX(HW_N10, 0) - 50, hwRowX(HW_N10, 4) + 50, HW_N10.y0, lit, P.gold);
      b += MK.pill(200, 382, "10", on(t, cSmaller, 0.45), { size: 32, col: P.blue, ink: P.blue });
      b += MK.arrow(252, 382, 794, 382, on(t, hwAfter(cSmaller, 0.25), 0.7), P.gold, 7);
      b += MK.pill(852, 382, "5", on(t, cHalfTen, 0.45), { size: 32, col: P.gold, ink: P.gold });
      b += MK.leader(852, 352, hwRowX(HW_N10, 4) + 36, HW_N10.y0 + 30, on(t, hwAfter(cHalfTen, 0.3), 0.6), P.gold);
      out += G(b, { opacity: B });
    }
    return svg(out);
  }

  /* ---- two halves make a whole ------------------------------------------------
     The lesson's step 10: one half is already there and the learner finds the
     piece that finishes the shape. The matching piece is the target circle's own
     right half, drawn by the same hwSemiPath, so when it lands it IS the other
     half and the circle closes exactly. The two pieces it is offered beside are
     the lesson's own wrong ones: one too small, and one from a square. */
  var HW_TARGET = { cx: 450, cy: 208, r: 120 };
  var HW_PICK = { x: 860, r: 76, y: 104, y1: 228, r1: 46, y2: 352, sw: 76, sh: 140 };

  /* half an orange, side -1/+1 matching hwSemiPath's own cut: a thin peel rim,
     then pale flesh on the cut face with segments fanning from the centre to
     the rim, and a pale pith dot at the centre - so beat 5's "three whole
     oranges" reads as oranges, not the generic two-tone circle used earlier
     in this chapter for the abstract half-circle matching game. */
  function hwOrangeHalf(cx, cy, r, side) {
    var peel = P.accent, flesh = "#FBD7A0", seg = "#D98A3C";
    var out = Pth(hwSemiPath(cx, cy, r, side), peel, P.ink, 3.5);
    out += Pth(hwSemiPath(cx, cy, r - 12, side), flesh, null, null);
    for (var k = 1; k <= 4; k++) {
      var theta = k * Math.PI / 5;
      var px = cx + side * (r - 12) * Math.sin(theta), py = cy - (r - 12) * Math.cos(theta);
      out += L(cx, cy, px, py, seg, 2, { opacity: 0.6 });
    }
    out += C(cx, cy, 6, "#FFF3DE");
    return out;
  }

  function hwOrangeTwoTone(cx, cy, r, dx, o) {
    if (!(o > 0)) return "";
    return G(G(hwOrangeHalf(cx, cy, r, -1), { transform: tr(-dx, 0) }) +
      G(hwOrangeHalf(cx, cy, r, 1), { transform: tr(dx, 0) }), { opacity: clamp(o, 0, 1) });
  }

  function hwWholeChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cHalfCircle = c(0, "halfcircle"), cEdge = c(0, "edge");
    var cFills = c(1, "fills");
    var cSameSize = c(2, "samesize"), cSameShape = c(2, "sameshape");
    var cPush = c(3, "push"), cAgain = c(3, "again");
    var cEvery = c(4, "every"), cCount = c(4, "count");
    var cThreeW = c(5, "threewholes"), cSixH = c(5, "sixhalves");
    var A = hwUntil(t, scene, 4), B = hwFrom(t, scene, 4), out = "", k;
    var T = HW_TARGET;

    if (A > 0.01) {
      var a = "", p = popIn(t, cHalfCircle, 0.45), u = on(t, cPush, 0.9);
      /* the half that is already there, and the gap beside it */
      a += G(Pth(hwSemiPath(T.cx, T.cy, T.r, -1), P.teal, P.ink, 3.5),
        { transform: around(T.cx, T.cy, Math.min(p, 1.08)), opacity: Math.min(1, p) });
      a += Pth(hwSemiPath(T.cx, T.cy, T.r, 1), "none", P.muted, 4,
        { "stroke-dasharray": "14 11", opacity: Math.min(1, p) * (1 - u) });
      /* "It has a straight edge": the flat side of the half, drawn along the cut */
      var ed = on(t, cEdge, 0.5) * (1 - u);
      if (ed > 0) a += L(T.cx, T.cy - T.r, T.cx, T.cy - T.r + 2 * T.r * ed, P.gold, 7);
      /* "fills the empty space": the gap asks for a piece */
      var fl = on(t, cFills, 0.6) * (1 - u);
      if (fl > 0) a += Pth(hwSemiPath(T.cx, T.cy, T.r, 1), P.gold, null, null, { opacity: 0.16 * fl * (0.5 + 0.5 * breathe(t)) });

      /* the three pieces on offer */
      var pk = popIn(t, cFills, 0.45);
      /* the matching half: it flies into the gap on "Push the two halves together" */
      var fx = lerp(HW_PICK.x, T.cx, ease(u)), fy = lerp(HW_PICK.y, T.cy, ease(u)), fr = lerp(HW_PICK.r, T.r, ease(u));
      a += G(Pth(hwSemiPath(fx, fy, fr, 1), P.plum, P.ink, 3.5),
        { transform: around(fx, fy, Math.min(pk, 1.08)), opacity: Math.min(1, pk) });
      /* too small, and from a square: the lesson's own two wrong pieces */
      a += G(Pth(hwSemiPath(HW_PICK.x, HW_PICK.y1, HW_PICK.r1, 1), "#1C4A5E", P.ink, 3.5),
        { transform: around(HW_PICK.x, HW_PICK.y1, Math.min(pk, 1.08)), opacity: Math.min(1, pk) * (1 - u) });
      a += G(R(HW_PICK.x, HW_PICK.y2 - HW_PICK.sh / 2, HW_PICK.sw, HW_PICK.sh, 0, "#1C4A5E", P.ink, 3.5),
        { transform: around(HW_PICK.x, HW_PICK.y2, Math.min(pk, 1.08)), opacity: Math.min(1, pk) * (1 - u) });
      /* "the same size": the small one is not. "the same shape": the square one is not. */
      a += MK.cross(HW_PICK.x + 100, HW_PICK.y1, 24, popIn(t, cSameSize, 0.4) * (1 - u));
      a += MK.cross(HW_PICK.x + 100, HW_PICK.y2, 24, popIn(t, cSameShape, 0.4) * (1 - u));
      a += MK.tick(HW_PICK.x + 100, HW_PICK.y, 24, popIn(t, hwAfter(cSameShape, 0.45), 0.4) * (1 - u));
      /* "whole again" */
      var ag = on(t, cAgain, 0.6);
      if (ag > 0) a += MK.glow(T.cx, T.cy, T.r + 46, P.good, ag * (0.6 + 0.4 * breathe(t))) +
        C(T.cx, T.cy, T.r + 14, "none", P.good, 4, { opacity: ag });
      a += MK.tick(T.cx, T.cy + T.r + 76, 26, popIn(t, hwAfter(cAgain, 0.35), 0.4));
      out += G(a, { opacity: A });
    }

    /* three wholes, counted in twos: two, four, six */
    if (B > 0.01) {
      var b = "", cxs = [272, 584, 876], names = ["2", "4", "6"];
      var open = bump(t, cEvery, 1.3);
      for (k = 0; k < 3; k++) {
        var pb = popIn(t, hwAfter(BEATS[scene.first + 4].start, k * 0.12), 0.45);
        b += G(hwOrangeTwoTone(cxs[k], 200, 98, k === 0 ? 20 * open : 0, Math.min(1, pb)),
          { transform: around(cxs[k], 200, Math.min(pb, 1.08)) });
        b += hwBadge(cxs[k], 344, names[k], popIn(t, hwAfter(cCount, k * 0.45), 0.4), P.gold);
      }
      b += MK.pill(350, 408, "3 wholes", on(t, cThreeW, 0.45), { size: 30, col: P.teal, ink: P.teal });
      b += MK.pill(818, 408, "6 halves", on(t, cSixH, 0.45), { size: 30, col: P.gold, ink: P.gold });
      out += G(b, { opacity: B });
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------ */
  function hwPicEqual(cx, cy, size) {
    var r = size * 0.46;
    return hwHalvedCircle(cx, cy, r, 1, 0, 0, 1, P.teal);
  }
  function hwPicGroup(cx, cy, size) {
    var out = "", k, j, s = size * 0.30;
    for (k = 0; k < 2; k++) {
      out += E(cx + (k ? 1 : -1) * size * 0.56, cy + size * 0.36, size * 0.44, size * 0.12, "#1C4A5E", P.line, 2);
      for (j = 0; j < 3; j++) out += Em(cx + (k ? 1 : -1) * size * 0.56 + (j - 1) * s, cy + size * 0.16, s, "\u{1F34E}");
    }
    return out;
  }
  function hwPicRows(cx, cy, size) {
    var out = "", k, s = size * 0.26, r = size * 0.10;
    for (k = 0; k < 8; k++)
      out += C(cx + (Math.floor(k / 2) - 1.5) * s, cy + (k % 2 === 0 ? -1 : 1) * size * 0.2, r, k % 2 === 0 ? P.accent : P.teal);
    return out;
  }
  function hwPicJoin(cx, cy, size) {
    var r = size * 0.46, d = size * 0.13;
    return G(Pth(hwSemiPath(cx, cy, r, -1), P.teal, P.ink, 3), { transform: tr(-d, 0) }) +
      G(Pth(hwSemiPath(cx, cy, r, 1), P.plum, P.ink, 3), { transform: tr(d, 0) });
  }

  var HW_RECAP = MK.recapKind([
    { beat: 0, at: "rEqual", title: "Equal parts", sub: "exactly the same size", pic: hwPicEqual },
    { beat: 1, at: "rGroup", title: "Half of a group", sub: "half of 6 is 3", pic: hwPicGroup },
    { beat: 1, at: "rNumber", title: "Half of a number", sub: "half of 8 is 4", pic: hwPicRows },
    { beat: 2, at: "rTwo", title: "Two halves", sub: "make one whole", pic: hwPicJoin }
  ], { goBeat: 2, goAt: "rTurn" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Two parts the same size", "Half of a shape, a group and a number", "Two halves make one whole"] }),
    equal: hwEqualChapter,
    onehalf: hwOneHalfChapter,
    group: hwGroupChapter,
    number: hwNumberChapter,
    whole: hwWholeChapter,
    recap: HW_RECAP
  };
