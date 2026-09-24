  /* ==== Equal Parts, part 2 ==================================================
     The chapters "One whole, any shape" and "A fraction of a group".

     The bar is ART.fraction's own: five cells of (440 - 44) / 5, identical by
     construction. The three halves are measured, not eyeballed - the square is
     180 by 180, so the vertical cut gives two 90 by 180 halves (16,200 square
     units each) and the corner-to-corner cut gives two triangles of
     180 * 180 / 2 (16,200 each), and the circle is cut on its own diameter.
     The group is 12 beads in 4 piles of exactly 3. */

  /* ---- the fifths bar -------------------------------------------------- */
  /* ART.fraction("bar") with label: false draws a 440 x 148 card, so a 620 px
     box on the film's stage scales it by 620 / 440 = 1.409. The numbers below
     come from that scale and are used to point at a single cell. */
  var EP_BAR = { x: 250, y: 110, w: 620, h: 208.5, s: 620 / 440 };
  EP_BAR.left = EP_BAR.x + 22 * EP_BAR.s;               /* the bar's left edge   */
  EP_BAR.top = EP_BAR.y + 22 * EP_BAR.s;                /* its top               */
  EP_BAR.inner = 396 * EP_BAR.s;                        /* its width             */
  EP_BAR.tall = 104 * EP_BAR.s;                         /* its height            */
  function epCellX(k, parts) { return EP_BAR.left + (k + 0.5) * (EP_BAR.inner / parts); }

  /* the three halves, each measured: see the header */
  var EP_HALF = [
    { cx: 250, cy: 200, card: [140, 76, 220, 248] },
    { cx: 584, cy: 200, card: [474, 76, 220, 248] },
    { cx: 918, cy: 200, card: [808, 76, 220, 248] }
  ];
  var EP_SQ = 180, EP_CIRC = 90;

  /* a square cut down the middle: two halves of 90 by 180 */
  function epHalfSquare(cx, cy, lit) {
    var x = cx - EP_SQ / 2, y = cy - EP_SQ / 2, m = cx;
    return R(x, y, EP_SQ / 2, EP_SQ, 0, lit ? MC.teal : MC.cell, null, null) +
      R(m, y, EP_SQ / 2, EP_SQ, 0, MC.cell) +
      R(x, y, EP_SQ, EP_SQ, 0, "none", MC.ink, 3.5) +
      L(m, y, m, y + EP_SQ, MC.ink, 3);
  }
  /* a square cut corner to corner: two triangles of 180 * 180 / 2 */
  function epHalfDiagonal(cx, cy, lit) {
    var x = cx - EP_SQ / 2, y = cy - EP_SQ / 2, x2 = x + EP_SQ, y2 = y + EP_SQ;
    return Pth("M" + x + "," + y + " L" + x + "," + y2 + " L" + x2 + "," + y2 + " Z", lit ? MC.teal : MC.cell) +
      Pth("M" + x + "," + y + " L" + x2 + "," + y + " L" + x2 + "," + y2 + " Z", MC.cell) +
      R(x, y, EP_SQ, EP_SQ, 0, "none", MC.ink, 3.5) +
      L(x, y, x2, y2, MC.ink, 3);
  }
  /* a circle cut across its own diameter */
  function epHalfCircle(cx, cy, lit) {
    var r = EP_CIRC;
    return Pth("M" + (cx - r) + "," + cy + " A" + r + "," + r + " 0 0,1 " + (cx + r) + "," + cy + " Z", lit ? MC.teal : MC.cell) +
      Pth("M" + (cx - r) + "," + cy + " A" + r + "," + r + " 0 0,0 " + (cx + r) + "," + cy + " Z", MC.cell) +
      C(cx, cy, r, "none", MC.ink, 3.5) + L(cx - r, cy, cx + r, cy, MC.ink, 3);
  }
  var EP_HALF_DRAW = [epHalfSquare, epHalfDiagonal, epHalfCircle];

  function epWholeChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cFive = c(0, "five"), cFifth = c(0, "fifth");
    var cColour = c(1, "colour"), cClimb = c(1, "climb");
    var cAll = c(2, "five"), cOne = c(2, "one");
    var cMid = c(3, "middle"), cCorner = c(3, "corner"), cAcross = c(3, "across");
    var cHalf = c(4, "half"), cShape = c(4, "shape");
    var out = "", k, p;

    /* ---- the bar, up to and including beat 2 ---------------------------- */
    var barO = epUntil(t, scene, 3);
    if (barO > 0) {
      var shaded = cColour != null && t >= cColour ? tally(t, cColour, 5, 2.4)
        : (cFifth != null && t >= cFifth ? 1 : 0);
      var bar = "";
      bar += epPlace(ART.fraction({ shape: "bar", parts: 5, shaded: shaded, label: false }),
        EP_BAR.x, EP_BAR.y, EP_BAR.w, EP_BAR.h);
      /* "five equal pieces": each cell counted, one at a time */
      var counted = tally(t, cFive, 5, 1.3);
      for (k = 0; k < counted; k++) {
        bar += MK.pop(Tx(epCellX(k, 5), 340, String(k + 1), "lab big", "middle", { fill: P.muted }),
          epCellX(k, 5), 330, popIn(t, cFive == null ? null : cFive + k * 0.26, 0.3));
      }
      /* "a fifth": the first cell is ringed and named */
      var fo = on(t, cFifth, 0.45) * epOnly(t, scene, 0);
      if (fo > 0) {
        bar += R(EP_BAR.left, EP_BAR.top, EP_BAR.inner / 5, EP_BAR.tall, 6, "none", P.gold, 5, { opacity: fo });
        bar += MK.pill(epCellX(0, 5), 78, "one fifth", fo, { size: 25, col: P.gold });
      }
      /* the fraction, climbing as the pieces are coloured */
      var go = Math.max(on(t, cFifth, 0.4), on(t, cColour, 0.4));
      if (go > 0) {
        var whole = shaded >= 5;
        bar += G(epFrac(990, 196, Math.max(1, shaded), 5, 58, whole ? MC.good : MC.teal), { opacity: go });
        bar += MK.pop(C(990, epFracTop(196, 58), 30, "none", P.gold, 4), 990, epFracTop(196, 58),
          popIn(t, cClimb, 0.4) * (1 - on(t, cOne, 0.4)));
      }
      /* "It is one whole": the whole bar ringed, and said to be one */
      var wo = on(t, cOne, 0.45);
      if (wo > 0) {
        bar += R(EP_BAR.left - 5, EP_BAR.top - 5, EP_BAR.inner + 10, EP_BAR.tall + 10, 10, "none", P.good, 5, { opacity: wo });
        bar += MK.pill(990, 300, "= 1 whole", wo, { size: 27, col: P.good, ink: P.good });
        bar += MK.tick(990, 92, 24, popIn(t, cOne == null ? null : cOne + 0.3, 0.4));
      }
      out += G(bar, { opacity: barO });
    }

    /* ---- the three halves, from beat 3 ---------------------------------- */
    var shO = epFrom(t, scene, 3);
    if (shO > 0) {
      var at = [cMid, cCorner, cAcross], sh = "";
      for (k = 0; k < 3; k++) {
        var o = popIn(t, at[k], 0.45);
        if (!(o > 0)) continue;
        var H = EP_HALF[k];
        sh += MK.pop(epCard(H.card[0], H.card[1], H.card[2], H.card[3]) + EP_HALF_DRAW[k](H.cx, H.cy, true),
          H.cx, H.cy, Math.min(o, 1.08));
        /* "is a half": each one is named, and ticked on "the shape does not decide" */
        var ho = on(t, cHalf == null ? null : cHalf + k * 0.22, 0.4);
        if (ho > 0) sh += G(epFrac(H.cx, 370, 1, 2, 38, P.teal), { opacity: ho });
        sh += MK.tick(H.card[0] + H.card[2] - 26, H.card[1] + 26, 20, popIn(t, cShape == null ? null : cShape + k * 0.22, 0.35));
      }
      out += G(sh, { opacity: shO });
    }
    return svg(out);
  }

  /* ==== chapter: A fraction of a group =====================================
     Zara's twelve beads, from the lesson's own step 4. They are counted, then
     shared into four piles: 12 / 4 = 3, so every pile holds exactly three and
     one pile is three beads. */
  var EP_G = { card: [232, 34, 816, 372], pileY: [128, 196, 264], pileX: [340, 520, 700, 880] };
  function epBeadBlock(k) { return [465 + (k % 6) * 70, 155 + Math.floor(k / 6) * 70]; }
  function epBeadPile(k) { return [EP_G.pileX[Math.floor(k / 3)], EP_G.pileY[k % 3]]; }

  function epGroupChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cGroup = c(0, "group"), cShape = c(0, "shape");
    var cTwelve = c(1, "twelve"), cQuarter = c(1, "quarter");
    var cBottom = c(2, "bottom"), cPiles = c(2, "piles");
    var cThree = c(3, "three"), cTake = c(3, "take");
    var cHowMany = c(4, "piles"), cHowTake = c(4, "take");
    var out = "", k, p;

    var u = on(t, cPiles, 0.95);                 /* the beads move into piles */
    var takeO = on(t, cTake, 0.5);
    out += MK.pop(epCard(EP_G.card[0], EP_G.card[1], EP_G.card[2], EP_G.card[3]), 640, 220, popIn(t, cGroup, 0.5));

    /* the four piles' boxes, once the beads have moved */
    if (u > 0) {
      var ring = on(t, cHowMany, 0.5);
      for (k = 0; k < 4; k++) {
        var taken = k === 0 && takeO > 0;
        out += R(EP_G.pileX[k] - 46, 92, 92, 202, 16, taken ? MC.tealSoft : MC.cell,
          taken ? MC.teal : MC.line, taken ? 4 : 3,
          { opacity: u * (taken ? 1 : (takeO > 0 ? 0.55 : 1)), "stroke-dasharray": taken ? null : "8 6" });
        if (ring > 0) out += R(EP_G.pileX[k] - 50, 88, 100, 210, 18, "none", P.gold, 4,
          { opacity: ring * (0.6 + 0.4 * breathe(t + k * 0.3)) });
      }
    }

    /* the twelve beads: a block, then four piles of three */
    var count = cTwelve == null || t < cTwelve ? 0 : tally(t, cTwelve, 12, 1.5);
    var appear = popIn(t, cGroup, 0.5);
    for (k = 0; k < 12; k++) {
      var a = epBeadBlock(k), b = epBeadPile(k);
      var x = lerp(a[0], b[0], ease(u)), y = lerp(a[1], b[1], ease(u));
      var mine = Math.floor(k / 3) === 0;
      var dim = takeO > 0 && !mine ? 1 - 0.55 * takeO : 1;
      var flash = bump(t, cTwelve == null ? null : cTwelve + k * 0.12, 0.5);
      out += C(x, y, 24 + 3 * flash, mine && takeO > 0 ? MC.teal : MC.accent,
        MC.card, 3, { opacity: clamp(appear, 0, 1) * dim });
    }
    /* the running count, as they are counted */
    var co = on(t, cTwelve, 0.35) * epOnly(t, scene, 1);
    if (co > 0) out += MK.pill(640, 64, count + " beads", co, { size: 27, col: P.gold });

    /* "part of a shape": the same idea on one shape, beside the group */
    var so = popIn(t, cShape, 0.45) * epOnly(t, scene, 0);
    if (so > 0) out += MK.pop(epCard(38, 114, 164, 164) +
      epPie(120, 196, 62, 4, { fills: [MC.tealSoft, MC.cell, MC.cell, MC.cell], sw: 2.5 }) +
      Tx(120, 316, "a shape", "lab big", "middle", { fill: P.muted }), 120, 196, so);

    /* the fraction asked for, with its own two numbers ringed in turn */
    var fo = popIn(t, cQuarter, 0.45);
    if (fo > 0) {
      out += MK.pop(epFrac(120, 196, 1, 4, 62, P.teal), 120, 196, Math.min(fo, 1.08));
      /* the bottom number is ringed when it is named (twice: once as "says
         four", once as "how many piles"), the top when it says how many to
         take - never both at once, so the film points at one thing at a time */
      var lowRing = Math.max(popIn(t, cBottom, 0.4) * (1 - on(t, cHowTake, 0.4)), popIn(t, cHowMany, 0.4));
      out += MK.pop(C(120, epFracBot(196, 62), 32, "none", P.gold, 4), 120, epFracBot(196, 62), lowRing);
      out += MK.pop(C(120, epFracTop(196, 62), 32, "none", P.gold, 4), 120, epFracTop(196, 62),
        popIn(t, cHowTake, 0.4) * (1 - on(t, cHowMany, 0.4)));
    }
    /* what each number does: four piles, take one */
    var po = on(t, cHowMany, 0.45);
    if (po > 0) out += MK.pill(120, 330, "4 piles", po, { size: 25, col: P.gold });
    var to = on(t, cHowTake, 0.45);
    if (to > 0) out += MK.leader(162, epFracTop(196, 62), 290, 150, on(t, cHowTake, 0.6), P.gold) +
      MK.pill(120, 90, "take 1", to, { size: 25, col: P.gold });

    /* "Three beads in every pile", and the pile that is taken */
    if (u > 0.6) {
      for (k = 0; k < 4; k++) {
        var no = popIn(t, cThree == null ? null : cThree + k * 0.24, 0.35);
        if (no > 0) out += MK.pop(Tx(EP_G.pileX[k], 340, "3", "lab huge", "middle", { fill: k === 0 && takeO > 0 ? P.teal : P.muted }),
          EP_G.pileX[k], 330, no);
      }
    }
    if (takeO > 0) {
      out += MK.pill(340, 64, "3 beads", takeO, { size: 27, col: P.teal, ink: P.teal });
      out += MK.tick(462, 64, 20, popIn(t, cTake == null ? null : cTake + 0.5, 0.35));
    }
    return svg(out);
  }
