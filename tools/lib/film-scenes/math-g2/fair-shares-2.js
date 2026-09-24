
  /* ==== Grade 2 Mathematics, Lesson 5: Fair Shares, part 2 ====================
     tools/lib/film-scenes/math-g2/fair-shares-2.js. The chapters "A fraction
     of a group", "A fraction of an amount", "Same size, different name" and
     "More than one whole", the recap cards, and KINDS. Read fair-shares.js
     first: it holds the palette, the shared drawings and the title motif.

     fshDeal below is the guarantee this film rests on. It deals counter i to
     group i % groups, so with 12 counters and 4 groups every group holds 3,
     with 8 and 2 every group holds 4, and the number written under a group is
     n / groups - computed, never typed. An unequal group cannot be drawn here
     while the voice is saying the share is fair. */

  /* ---- counters dealt into equal groups ---------------------------------------
     o: {n, groups, cols (how many counters across inside a box),
         bx, by, bw, bh, gap, slotW, slotH, padTop,
         rowX, rowStep, rowY   (where the counters wait before they are dealt),
         size, draw (i, g, x, y, size) -> markup, showAt, dealAt, step,
         placed (true: they are simply there, never dealt),
         boxAt, lit (which groups are ringed), litAt, countAt, o} */
  function fshDeal(t, o) {
    var out = "", i, g, s, per = o.n / o.groups, cols = o.cols || 1;
    var lit = o.lit || [], show = o.o == null ? 1 : o.o;
    if (!(show > 0)) return "";
    function boxX(k) { return o.bx + k * (o.bw + o.gap); }

    /* the groups the counters are shared into */
    var bo = o.boxAt == null ? 1 : on(t, o.boxAt, 0.5);
    for (g = 0; g < o.groups; g++) {
      var on_ = lit.indexOf(g) >= 0 ? on(t, o.litAt, 0.4) : 0;
      if (bo > 0) out += R(boxX(g), o.by, o.bw, o.bh, 18, on_ > 0.5 ? FSH_C.goldSoft : FSH_C.card,
        on_ > 0.5 ? P.gold : FSH_C.line, on_ > 0.5 ? 5 : 3, { opacity: bo });
    }

    /* every counter, on its way to the group it belongs to */
    for (i = 0; i < o.n; i++) {
      g = i % o.groups; s = Math.floor(i / o.groups);
      var appear = popIn(t, o.showAt == null ? null : o.showAt + i * 0.035, 0.35);
      if (!(appear > 0)) continue;
      var tx = boxX(g) + o.bw / 2 + ((s % cols) - (cols - 1) / 2) * (o.slotW || 0);
      var ty = o.by + o.padTop + Math.floor(s / cols) * (o.slotH || 0);
      var x = tx, y = ty;
      if (!o.placed) {
        var land = o.dealAt == null ? null : o.dealAt + i * (o.step || 0.1);
        var u = land == null ? 0 : ease(clamp((t - land) / 0.42, 0, 1));
        var sx = o.rowX + i * o.rowStep, sy = o.rowY;
        x = lerp(sx, tx, u); y = lerp(sy, ty, u) - 44 * Math.sin(Math.PI * u);
      }
      out += G(o.draw(i, g, x, y, o.size), { opacity: Math.min(1, appear) });
    }

    /* how many are in each group: n / groups, worked out, never typed */
    if (o.countAt != null) {
      var cnt = t < o.countAt ? 0 : tally(t, o.countAt, o.groups, 0.9);
      for (g = 0; g < o.groups; g++) {
        if (g >= cnt) continue;
        var nx = boxX(g) + o.bw / 2;
        out += MK.pop(Tx(nx, o.by + o.bh + 46, String(per), "lab", "middle", { "font-size": 40, fill: P.gold }),
          nx, o.by + o.bh + 34, popIn(t, o.countAt + g * 0.2, 0.32));
      }
    }
    return G(out, { opacity: clamp(show, 0, 1) });
  }

  /* an egg, white or brown, centred on (x, y) */
  function fshEgg(x, y, size, brown) {
    var r = size / 2;
    return E(x, y, r * 0.76, r, brown ? "#B07B4A" : "#F6EEDF", "#8A6B4F", 3) +
      E(x - r * 0.24, y - r * 0.34, r * 0.2, r * 0.28, "#FFFFFF", null, null, { opacity: brown ? 0.35 : 0.9 });
  }

  /* ==== chapter: a fraction of a group ==========================================
     Twelve apples wait in a row, then go one each into four groups until they
     are gone: three in every group, because fshDeal deals i to group i % 4.
     Then eight sweets into two groups, which is four each. */
  var FSH_AP = { rowX: 210, rowStep: 68, rowY: 84, bx: 94, by: 172, bw: 230, bh: 190, gap: 20 };
  var FSH_SW = { bx: 264, by: 140, bw: 300, bh: 220, gap: 40 };

  function fshShareChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cGroup = c(0, "group");
    var cTwelve = c(1, "twelve"), cFour = c(1, "four");
    var cDeal = c(2, "deal"), cGone = c(2, "gone");
    var cThree = c(3, "three"), cLeft = c(3, "left");
    var cOne = c(4, "one"), cQuarter = c(4, "quarter");
    var cHalf = c(5, "half"), cEight = c(5, "eight"), cFourEach = c(5, "four");
    var A = FSH_AP, out = "";
    /* The apples stay through "Half is the same idea" - it IS the same idea -
       and are swapped for the sweets on "Eight sweets", so the stage is never
       empty between the two. (Fading on the beat boundary left two seconds of
       nothing while the voice was still speaking.) */
    var toSweets = on(t, cEight, 0.5);

    /* the apples: the first beat has them loose, before any group exists */
    var appleShow = Math.max(popIn(t, cGroup, 0.5) > 0 ? 1 : 0, cTwelve == null ? 0 : 1);
    out += fshDeal(t, {
      n: 12, groups: 4, cols: 3,
      bx: A.bx, by: A.by, bw: A.bw, bh: A.bh, gap: A.gap,
      slotW: 62, slotH: 0, padTop: 88,
      rowX: A.rowX, rowStep: A.rowStep, rowY: A.rowY,
      size: 46, showAt: cGroup == null ? cTwelve : cGroup,
      draw: function (n, g, x, y, size) { return Em(x, y, size, "\u{1F34E}"); },
      dealAt: cDeal, step: 0.11, boxAt: cFour,
      lit: [0], litAt: cOne, countAt: cThree,
      o: appleShow * (1 - toSweets)
    });
    /* nothing left in the row */
    out += MK.tick(A.rowX + 374, A.rowY, 24, popIn(t, cLeft, 0.4) * (1 - toSweets));
    /* a quarter of twelve is three */
    out += MK.pill(584, 62, "a quarter of 12 is 3", on(t, cQuarter, 0.45) * (1 - toSweets),
      { size: 32, col: P.gold });
    /* the sweets: eight shared between two is four each */
    var S = FSH_SW;
    out += fshDeal(t, {
      n: 8, groups: 2, cols: 2, placed: true,
      bx: S.bx, by: S.by, bw: S.bw, bh: S.bh, gap: S.gap,
      slotW: 96, slotH: 96, padTop: 66,
      rowX: 0, rowStep: 0, rowY: 0,
      size: 54, showAt: cEight,
      draw: function (n, g, x, y, size) { return Em(x, y, size, "\u{1F36C}"); },
      boxAt: cEight, countAt: cFourEach, o: toSweets
    });
    out += MK.pill(584, 66, "half of 8 is 4", on(t, cFourEach, 0.45) * toSweets, { size: 32, col: P.good });
    /* "Half is the same idea": the four groups of apples glow, before the
       sweets take their place */
    out += MK.glow(584, 250, 172, P.good, 0.5 * bump(t, cHalf, 1.1) * (1 - toSweets));
    /* "all gone": the empty row ripples where the last apple was */
    out += MK.ripple(A.rowX + 11 * A.rowStep, A.rowY, t, cGone, P.gold);
    return svg(out);
  }

  /* ==== chapter: a fraction of an amount ========================================
     Amina's twenty shillings, then the bar model that shares them between
     four; then twelve eggs in four groups of three, three groups of them
     brown, which is nine. */
  var FSH_EG = { bx: 151, by: 100, bw: 200, bh: 200, gap: 22 };

  function fshAmountChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTwenty = c(0, "twenty"), cSpends = c(0, "spends");
    var cShared = c(1, "shared"), cFive = c(1, "five");
    var cEggs = c(2, "eggs"), cThree = c(2, "three");
    var cQtr = c(3, "qtr"), cNine = c(3, "nine");
    /* the money gives way to the eggs on "twelve eggs", not at the beat
       boundary: fading on the boundary left the stage empty for the first
       second and a half of the line */
    var out = "", money = 1 - on(t, cEggs, 0.5);

    /* --- the money ---------------------------------------------------------- */
    if (money > 0) {
      var m = "";
      m += G(ART.place(ART.coins([10, 5, 5], { total: true }), 434, 46, 300, 154),
        { opacity: Math.min(1, popIn(t, cTwenty, 0.45)) });
      m += MK.qmark(880, 122, 26, on(t, cSpends, 0.45));
      m += MK.pill(880, 186, "a quarter?", on(t, cSpends, 0.45), { size: 26, col: P.gold });
      var bm = popIn(t, cShared, 0.5);
      if (bm > 0) m += G(ART.place(ART.barModel({ whole: 20, parts: [5, 5, 5, 5], label: false }), 324, 226, 520, 188),
        { opacity: Math.min(1, bm) });
      var fo = on(t, cFive, 0.45);
      if (fo > 0) {
        m += R(346, 326, 116, 66, 10, "none", P.gold, 5, { opacity: fo * (0.7 + 0.3 * breathe(t)) });
        m += MK.pill(962, 359, "5 sh spent", fo, { size: 28, col: P.gold });
        m += MK.tick(962, 296, 24, popIn(t, cFive == null ? null : cFive + 0.35, 0.35));
      }
      out += G(m, { opacity: clamp(money, 0, 1) });
    }

    /* --- the eggs ----------------------------------------------------------- */
    var eggs = 1 - money;
    if (eggs > 0) {
      var E2 = FSH_EG;
      var brown = cThree == null || t < cThree ? 0 : tally(t, cThree, 3, 0.9);
      out += fshDeal(t, {
        n: 12, groups: 4, cols: 1, placed: true,
        bx: E2.bx, by: E2.by, bw: E2.bw, bh: E2.bh, gap: E2.gap,
        slotW: 0, slotH: 52, padTop: 44,
        rowX: 0, rowStep: 0, rowY: 0,
        size: 42, showAt: cEggs, boxAt: cEggs,
        draw: function (n, g, x, y, size) { return fshEgg(x, y, size, g < brown); },
        lit: [0], litAt: cQtr, countAt: cQtr,
        o: eggs
      });
      out += G(MK.pill(584, 400, "3 + 3 + 3 = 9", on(t, cNine, 0.45), { size: 30, col: P.gold }) +
        MK.pill(584, 60, "9 brown eggs", on(t, cNine == null ? null : cNine + 0.4, 0.45), { size: 30, col: P.good }),
        { opacity: clamp(eggs, 0, 1) });
    }
    return svg(out);
  }

  /* ==== chapter: same size, different name ======================================
     One half above two quarters, the same bar length both times, so the shaded
     parts end at the same place. Then the half against a single quarter. */
  var FSH_SM = { x: 180, w: 470, yA: 60, yB: 238 };

  function fshSameChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTwo = c(0, "two"), cSame = c(0, "same");
    var cHalf = c(1, "half"), cQuarters = c(1, "quarters");
    var cReach = c(2, "reach"), cEq = c(2, "eq");
    var cBigger = c(3, "bigger"), cNot = c(3, "not");
    var cHalfBig = c(4, "halfbig"), cMore = c(4, "more");
    var S = FSH_SM, out = "", k;
    var A = fshBarBox(S.x, S.yA, S.w), B = fshBarBox(S.x, S.yB, S.w);
    var edge = A.x0 + A.cw / 2;

    /* "exactly the same amount": the first bar's row glows for a moment, a
       promise of the match to come before the second bar is even drawn */
    out += MK.glow(edge, (A.y0 + A.y1) / 2, Math.min(A.cw * 0.62, (A.y0 + A.y1) / 2 - 4), P.gold, 0.55 * bump(t, cSame, 1.2));

    var aO = Math.max(on(t, cTwo, 0.5), on(t, cHalf, 0.4));
    out += G(fshFracBar(S.x, S.yA, S.w, 2, 1, "teal"), { opacity: Math.min(1, aO) });
    out += G(fshFracBar(S.x, S.yB, S.w, 4, 2, "plum"), { opacity: Math.min(1, on(t, cQuarters, 0.5)) });

    /* the written names, and the equals between them */
    out += fshGlyph(760, 138, 1, 2, 56, on(t, cHalf, 0.45), FSH_C.teal, P.ink);
    var bigger = bump(t, cBigger, 1.1);
    out += fshGlyph(760, 317, 2, 4, 56, on(t, cQuarters, 0.45),
      bigger > 0.4 ? P.gold : FSH_C.plum, bigger > 0.4 ? P.gold : P.ink);
    out += MK.pop(Tx(760, 244, "=", "lab", "middle", { "font-size": 60, fill: P.gold }), 760, 228, popIn(t, cEq, 0.4));

    /* "they reach the same place": a dashed line down both shaded edges */
    var ro = on(t, cReach, 0.6);
    if (ro > 0) out += L(edge, S.yA + 10, edge, lerp(S.yA + 10, 392, ro), P.gold, 4, { "stroke-dasharray": "12 9" });

    /* not a bigger amount: the same amount, ticked */
    var no = popIn(t, cNot, 0.4);
    out += MK.tick(900, 228, 22, no);
    out += MK.pill(936, 228, "same amount", Math.min(1, no), { size: 24, anchor: "start", col: P.good });

    /* one half is bigger than one quarter */
    var hb = on(t, cHalfBig, 0.5);
    if (hb > 0) {
      out += R(A.x0 - 4, A.y0 - 4, A.cw / 2 + 8, A.y1 - A.y0 + 8, 5, "none", P.gold, 5,
        { opacity: hb * (0.7 + 0.3 * breathe(t)) });
      out += R(B.x0 - 4, B.y0 - 4, B.cw / 4 + 8, B.y1 - B.y0 + 8, 5, "none", P.accent, 5, { opacity: hb });
      out += MK.pill(A.x0 + A.cw / 4, 32, "bigger", hb, { size: 26, col: P.gold });
    }
    /* more pieces, smaller pieces: the four quarters count themselves off */
    var mc = cMore == null || t < cMore ? 0 : tally(t, cMore, 4, 0.8);
    for (k = 0; k < 4; k++) {
      if (k >= mc) continue;
      var cx = B.x0 + (k + 0.5) * B.cw / 4;
      out += MK.pop(Tx(cx, 412, String(k + 1), "lab", "middle", { "font-size": 30, fill: P.accent }),
        cx, 404, popIn(t, cMore + k * 0.17, 0.3));
    }
    return svg(out);
  }

  /* ==== chapter: more than one whole ============================================
     Quarters added on a bar, and then the lesson's pizzas: four quarters fill
     one, a fifth starts the next. */
  var FSH_WH = { x: 60, y: 112, w: 520, h: 110 };

  function fshWholeChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPut = c(0, "put"), cCount = c(0, "count");
    var cOne = c(1, "one"), cTwo = c(1, "two"), cThree = c(1, "three");
    var cStays = c(2, "stays"), cStill = c(2, "still");
    var cFour = c(3, "four"), cWhole = c(3, "whole");
    var cAdd = c(4, "add"), cFive = c(4, "five");
    var W = FSH_WH, out = "", k;
    var pies = scene.beats.length > 3 ? into(t, scene.first + 3) : 0;
    var barO = 1 - 0.55 * pies;

    /* the bar of quarters: one, then two more */
    var oneOn = on(t, cOne, 0.4), twoOn = cTwo == null || t < cTwo ? 0 : tally(t, cTwo, 2, 0.6);
    var fills = [oneOn > 0.5 ? FSH_C.teal : null,
      twoOn >= 1 ? FSH_C.accent : null, twoOn >= 2 ? FSH_C.accent : null, null];
    out += G(fshCard(W.x - 26, W.y - 26, W.w + 52, W.h + 52, popIn(t, cPut, 0.5)) +
      fshBar(W.x, W.y, W.w, W.h, [0.25, 0.25, 0.25, 0.25], { fills: fills, o: popIn(t, cPut, 0.5) }),
      { opacity: clamp(barO, 0, 1) });

    /* counting the parts, and then each still a quarter */
    var still = cStill == null || t < cStill ? 0 : tally(t, cStill, 4, 0.9);
    for (k = 0; k < 4; k++) {
      var fl = Math.max(bump(t, cCount == null ? null : cCount + k * 0.18, 0.5),
        k < still ? bump(t, cStill + k * 0.22, 0.5) : 0);
      if (fl > 0) out += R(W.x + k * W.w / 4, W.y, W.w / 4, W.h, 0, "#FFFFFF", null, null,
        { opacity: 0.5 * fl * barO });
    }
    /* three quarters, written */
    out += G(fshGlyph(320, 318, 3, 4, 56, on(t, cThree, 0.45), P.ink,
      bump(t, cStays, 1.1) > 0.4 ? P.gold : P.ink), { opacity: clamp(barO, 0, 1) });

    /* the pizzas */
    if (pies > 0) {
      var filled = cFour == null || t < cFour ? 0 : tally(t, cFour, 4, 1.0);
      var p = "";
      p += fshFracCircle(640, 66, 230, 4, filled, "gold");
      p += MK.pill(755, 300, "one whole", on(t, cWhole, 0.45), { size: 26, col: P.gold });
      p += MK.tick(755, 352, 22, popIn(t, cWhole == null ? null : cWhole + 0.3, 0.35));
      var two = popIn(t, cAdd, 0.5);
      if (two > 0) {
        p += G(fshFracCircle(898, 66, 230, 4, 1, "gold"), { opacity: Math.min(1, two) });
        p += MK.pill(1013, 300, "and one quarter", on(t, cAdd == null ? null : cAdd + 0.3, 0.45),
          { size: 26, col: P.gold });
      }
      p += MK.pill(884, 400, "5 quarters", on(t, cFive, 0.45), { size: 30, col: P.good });
      out += G(p, { opacity: clamp(pies, 0, 1) });
    }
    return svg(out);
  }

  /* ==== what you now know ========================================================= */
  function fshCardBar(cx, cy, size, parts, shaded, colour) {
    var w = size * 1.9, h = w * 148 / 440;
    return fshFracBar(cx - w / 2, cy - h / 2, w, parts, shaded, colour);
  }
  var FSH_RECAP = MK.recapKind([
    { beat: 0, at: "fair", title: "Equal parts", sub: "a fair share is an equal share",
      pic: function (cx, cy, size) { var w = size * 1.06; return fshFracCircle(cx - w / 2, cy - w * 260 / 600, w, 4, 1, "teal"); } },
    { beat: 1, at: "bottom", title: "Bottom number", sub: "how many equal parts",
      pic: function (cx, cy, size) { return fshCardBar(cx, cy, size, 4, 0, "teal"); } },
    { beat: 1, at: "top", title: "Top number", sub: "how many you take",
      pic: function (cx, cy, size) { return fshCardBar(cx, cy, size, 4, 3, "teal"); } },
    { beat: 2, at: "group", title: "A quarter of 12", sub: "12 shared by 4 is 3",
      pic: function (cx, cy, size) {
        var out = "", k;
        for (k = 0; k < 3; k++) out += Em(cx + (k - 1) * size * 0.42, cy, size * 0.5, "\u{1F34E}");
        return out;
      } },
    { beat: 2, at: "eqv", title: "Same size", sub: "one half is two quarters",
      pic: function (cx, cy, size) {
        return fshCardBar(cx, cy - size * 0.34, size, 2, 1, "teal") +
          fshCardBar(cx, cy + size * 0.34, size, 4, 2, "plum");
      } },
    { beat: 3, at: "whole", title: "One whole", sub: "four quarters fill it",
      pic: function (cx, cy, size) { var w = size * 1.06; return fshFracCircle(cx - w / 2, cy - w * 260 / 600, w, 4, 4, "gold"); } }
  ], { goBeat: 3, goAt: "go" });

  /* "Always check the parts": a tick lands on the Equal parts card as it is
     said. MK.recapKind draws the cards and reads only their own cue, so the
     mark is added to the drawing it hands back - after the LAST </svg>, since
     the card pictures are nested <svg>s of their own. The grid is 3 x 2 with a
     4 px margin, so card one runs from (4, 4) to (381, 213). */
  function fshRecapChapter(scene, beat, t, i) {
    var body = FSH_RECAP(scene, beat, t, i);
    var p = popIn(t, sc(scene, 0, "check"), 0.4);
    if (!(p > 0)) return body;
    var cut = body.lastIndexOf("</svg></div>");
    if (cut < 0) return body;
    return body.slice(0, cut) + MK.tick(348, 36, 20, p) + body.slice(cut);
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["Equal parts, and parts that are not", "What the top and bottom numbers mean", "A quarter of a group, and of an amount"] }),
    equal: fshEqualChapter,
    naming: fshNamingChapter,
    share: fshShareChapter,
    amount: fshAmountChapter,
    same: fshSameChapter,
    whole: fshWholeChapter,
    recap: fshRecapChapter
  };
