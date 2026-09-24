  /* ==== Equal Parts, part 3 ==================================================
     The chapters "The line means divide", "Worth the same" and "Which is
     bigger?", the recap cards, and KINDS.

     Two bars stacked one above the other are how this film shows that two
     fractions are worth the same, and that one is bigger. They are drawn by
     ART.fraction at the SAME width, so their cell edges are the same
     arithmetic: half of 504 px is 252, and five tenths of 504 px is
     5 * 50.4 = 252, exactly. The dashed line the film drops through both bars
     is at that single x, which is why it can be drawn at all. */

  /* the geometry of an ART.fraction bar placed in the film's space, so a film
     can ring one cell of it or point at one edge */
  function epBarBox(x, y, w) {
    var s = w / 440;
    return { x: x, y: y, w: w, h: 148 * s, s: s, left: x + 22 * s, top: y + 22 * s, inner: 396 * s, tall: 104 * s };
  }
  function epBarDraw(B, parts, shaded, colour) {
    return ART.place(ART.fraction({ shape: "bar", parts: parts, shaded: shaded, colour: colour, label: false }),
      B.x, B.y, B.w, B.h);
  }
  function epBarEdge(B, k, parts) { return B.left + k * (B.inner / parts); }
  function epBarCell(B, k, parts) { return B.left + (k + 0.5) * (B.inner / parts); }

  /* the two stacked bars both chapters below use */
  var EP_TOP = epBarBox(300, 34, 560), EP_BOT = epBarBox(300, 224, 560);

  /* ==== chapter: The line means divide =====================================
     The lesson's own two steps: the fraction line IS a division (3/4 is three
     shared between four), and a fraction acts on a number - three quarters of
     Amina's twenty shillings, by 20 / 4 = 5 and then 5 x 3 = 15. */
  var EP_D = { card: [200, 24, 848, 350], pileX: [330, 520, 710, 900], coinY: [96, 144, 192, 240, 288] };
  function epCoinBlock(k) { return [615 + ((k % 5) - 2) * 62, 110 + Math.floor(k / 5) * 54]; }
  function epCoinPile(k) { return [EP_D.pileX[Math.floor(k / 5)], EP_D.coinY[k % 5]]; }
  function epCoin(x, y, r, lit, o) {
    if (!(o > 0)) return "";
    return G(C(x, y, r, lit ? MC.coinLit : MC.coin, MC.gold, 2.5) +
      C(x, y, r * 0.62, "none", MC.gold, 1.6, { opacity: 0.65 }), { opacity: clamp(o, 0, 1) });
  }

  function epDivideChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cLine = c(0, "line"), cDividing = c(0, "dividing");
    var cThreeQ = c(1, "threeq"), cShared = c(1, "shared");
    var cTwenty = c(2, "twenty"), cOf = c(2, "threeq");
    var cDivide = c(3, "divide"), cFive = c(3, "five");
    var cMultiply = c(4, "multiply"), cFifteen = c(4, "fifteen");
    var out = "", k;

    /* ---- beats 0 and 1: the fraction line is a dividing line ------------- */
    var firstO = epUntil(t, scene, 2);
    if (firstO > 0) {
      var a = "", slide = on(t, cShared, 0.6);
      /* the fraction sits in the middle, then slides left to make room for the
         division it means */
      var fx = lerp(584, 380, slide);
      a += MK.pop(epFrac(fx, 206, 3, 4, 110, P.ink), fx, 206, popIn(t, cLine, 0.5));
      /* the line itself, thickened and then shown to be a divide sign */
      var lo = on(t, cLine, 0.4), dv = on(t, cDividing, 0.45);
      if (lo > 0) a += L(fx - 56, 206, fx + 56, 206, P.gold, 9, { opacity: lo });
      if (dv > 0) a += C(fx, 206 - 22, 7, P.gold, null, null, { opacity: dv }) +
        C(fx, 206 + 22, 7, P.gold, null, null, { opacity: dv });
      /* "three shared between four": the fraction slides over and says so */
      if (slide > 0) {
        a += Tx(560, 222, "=", "lab huge", "middle", { fill: P.muted, opacity: slide });
        /* 3 divided by 4, written out */
        a += G(Tx(680, 236, "3", "lab", "middle", { "font-size": 82, fill: P.teal }) +
          C(790, 200, 7, P.gold) + L(760, 236, 820, 236, P.gold, 8) + C(790, 272, 7, P.gold) +
          Tx(900, 236, "4", "lab", "middle", { "font-size": 82, fill: P.teal }), { opacity: slide });
        a += MK.pill(790, 330, "three shared between four", on(t, cShared, 0.5), { size: 24, col: P.gold });
      }
      /* the words, on their own beat */
      var to = on(t, cThreeQ, 0.4) * epOnly(t, scene, 1);
      if (to > 0) out += MK.pill(fx, 86, "three quarters", to, { size: 26, col: P.teal });
      out += G(a, { opacity: firstO });
    }

    /* ---- beats 2 to 4: three quarters of twenty shillings ---------------- */
    var moneyO = epFrom(t, scene, 2);
    if (moneyO > 0) {
      var m = "", u = on(t, cDivide == null ? null : cDivide + 0.35, 0.95), lit = on(t, cFifteen, 0.5);
      m += MK.pop(epCard(EP_D.card[0], EP_D.card[1], EP_D.card[2], EP_D.card[3]), 624, 200, popIn(t, cTwenty, 0.5));
      /* the four piles' boxes */
      if (u > 0) {
        for (k = 0; k < 4; k++) {
          var on3 = lit > 0 && k < 3;
          m += R(EP_D.pileX[k] - 44, 70, 88, 248, 16, on3 ? MC.tealSoft : MC.cell, on3 ? MC.teal : MC.line,
            on3 ? 4 : 3, { opacity: u * (lit > 0 && k === 3 ? 0.45 : 1), "stroke-dasharray": on3 ? null : "8 6" });
        }
      }
      /* the twenty shillings */
      for (k = 0; k < 20; k++) {
        var p0 = epCoinBlock(k), p1 = epCoinPile(k);
        var cx = lerp(p0[0], p1[0], ease(u)), cy = lerp(p0[1], p1[1], ease(u));
        var mine = Math.floor(k / 5) < 3;
        m += epCoin(cx, cy, 21, lit > 0 && mine, popIn(t, cTwenty == null ? null : cTwenty + (k % 5) * 0.03, 0.4) *
          (lit > 0 && !mine ? 0.45 : 1));
      }
      /* the pill goes right away when the coins start moving: a half-faded
         one reads as a grey smudge over the card, not as a quieter label */
      m += MK.pill(624, 52, "20 shillings", on(t, cTwenty, 0.45) * (1 - on(t, cDivide, 0.4)), { size: 26, col: P.gold });
      /* the fraction, with the number being used ringed */
      var fo = popIn(t, cOf, 0.45);
      if (fo > 0) {
        m += MK.pop(epFrac(108, 200, 3, 4, 60, P.teal), 108, 200, Math.min(fo, 1.08));
        m += MK.pop(C(108, epFracTop(200, 60), 32, "none", P.gold, 4), 108, epFracTop(200, 60), popIn(t, cMultiply, 0.4));
        m += MK.pop(C(108, epFracBot(200, 60), 32, "none", P.gold, 4), 108, epFracBot(200, 60),
          popIn(t, cDivide, 0.4) * (1 - on(t, cMultiply, 0.4)));
      }
      /* "four is five": five in every pile */
      if (u > 0.5) {
        for (k = 0; k < 4; k++) {
          var no = popIn(t, cFive == null ? null : cFive + k * 0.2, 0.35);
          if (no > 0) m += MK.pop(Tx(EP_D.pileX[k], 356, "5", "lab huge", "middle",
            { fill: lit > 0 && k < 3 ? P.teal : P.muted }), EP_D.pileX[k], 346, no);
        }
        m += MK.pill(108, 316, "20 \u00f7 4 = 5", on(t, cFive, 0.45), { size: 25, col: P.gold });
      }
      /* "three fives are fifteen shillings" */
      if (lit > 0) {
        m += MK.pill(624, 412, "5 + 5 + 5 = 15 shillings", lit, { size: 29, col: P.teal, ink: P.teal });
        m += MK.tick(108, 86, 24, popIn(t, cFifteen == null ? null : cFifteen + 0.35, 0.4));
      }
      out += G(m, { opacity: moneyO });
    }
    return svg(out);
  }

  /* ==== chapter: Worth the same ============================================
     Two fifths and one more fifth is three fifths, and the bottom number does
     not move; then one half and five tenths, whose shaded edges land on the
     same x because 504 / 2 and 5 * 504 / 10 are the same number. */
  var EP_S = epBarBox(250, 96, 600);

  function epSameChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTwo = c(0, "two"), cOne = c(0, "one"), cThree = c(0, "three");
    var cNever = c(1, "never"), cTenths = c(1, "tenths");
    var cHalf = c(2, "half"), cFive = c(2, "tenths");
    var cBoth = c(3, "both"), cSame = c(3, "same");
    var cBigger = c(4, "bigger"), cFrac = c(4, "fraction");
    var out = "", k;

    /* ---- beats 0 and 1: two fifths and one more fifth -------------------- */
    var addO = epUntil(t, scene, 2);
    if (addO > 0) {
      var a = "", shaded = on(t, cOne, 0.4) > 0.5 ? 3 : on(t, cTwo, 0.4) > 0.5 ? 2 : 0;
      a += epBarDraw(EP_S, 5, shaded, on(t, cThree, 0.4) > 0.5 ? "teal" : "accent");
      /* the piece that is added, ringed as it arrives */
      var oo = on(t, cOne, 0.4) * (1 - on(t, cThree, 0.5));
      if (oo > 0) a += R(epBarEdge(EP_S, 2, 5), EP_S.top, EP_S.inner / 5, EP_S.tall, 6, "none", P.gold, 5, { opacity: oo });
      /* the answer, and the bottom number that never moves */
      var go = on(t, cThree, 0.45);
      if (go > 0) a += G(epFrac(984, 190, 3, 5, 58, P.teal), { opacity: go });
      var nv = on(t, cNever, 0.45);
      if (nv > 0) {
        a += MK.pop(C(984, epFracBot(190, 58), 32, "none", P.good, 4), 984, epFracBot(190, 58), popIn(t, cNever, 0.4));
        a += MK.tick(1078, epFracBot(190, 58), 20, popIn(t, cNever == null ? null : cNever + 0.3, 0.35));
      }
      /* the answer a child gives when the bottom numbers are added too: it
         stands right under the true one, so the two can be read together */
      var tn = on(t, cTenths, 0.45);
      if (tn > 0) {
        a += G(epFrac(984, 348, 3, 10, 42, P.bad), { opacity: tn });
        a += MK.cross(1078, 348, 20, popIn(t, cTenths == null ? null : cTenths + 0.25, 0.35));
      }
      a += MK.pill(EP_S.left + EP_S.inner / 2, 56, "count the pieces", on(t, cThree, 0.4) * epOnly(t, scene, 0), { size: 25, col: P.gold });
      out += G(a, { opacity: addO });
    }

    /* ---- beats 2 to 4: one half and five tenths -------------------------- */
    var eqO = epFrom(t, scene, 2);
    if (eqO > 0) {
      var e = "", hO = popIn(t, cHalf, 0.5), tO = popIn(t, cFive, 0.5);
      if (hO > 0) e += G(epBarDraw(EP_TOP, 2, 1), { opacity: Math.min(1, hO) });
      if (tO > 0) e += G(epBarDraw(EP_BOT, 10, 5), { opacity: Math.min(1, tO) });
      /* the shaded edges land on the same x: 504 / 2 = 5 * 504 / 10 */
      var so = on(t, cSame, 0.5), edge = epBarEdge(EP_TOP, 1, 2);
      if (on(t, cBoth, 0.45) > 0) {
        e += R(EP_TOP.left - 5, EP_TOP.top - 5, EP_TOP.inner + 10, EP_TOP.tall + 10, 10, "none", P.gold, 4, { opacity: on(t, cBoth, 0.45) });
        e += R(EP_BOT.left - 5, EP_BOT.top - 5, EP_BOT.inner + 10, EP_BOT.tall + 10, 10, "none", P.gold, 4, { opacity: on(t, cBoth, 0.45) });
      }
      if (so > 0) e += L(edge, EP_TOP.top - 22, edge, lerp(EP_TOP.top - 22, EP_BOT.top + EP_BOT.tall + 22, so), P.gold, 5,
        { "stroke-dasharray": "12 8" });
      if (hO > 0) e += G(epFrac(940, 118, 1, 2, 46, P.teal), { opacity: Math.min(1, hO) });
      if (tO > 0) e += G(epFrac(940, 308, 5, 10, 46, P.teal), { opacity: Math.min(1, tO) });
      if (so > 0) e += Tx(940, 224, "=", "lab huge", "middle", { fill: P.good, opacity: so });
      /* "Bigger numbers do not make a bigger fraction" */
      var bo = on(t, cBigger, 0.45);
      if (bo > 0) e += MK.pop(C(940, epFracBot(308, 46), 30, "none", P.gold, 4), 940, epFracBot(308, 46), popIn(t, cBigger, 0.4));
      /* the verdict is the tick beside the equals sign: a pill under the lower
         bar would hang 3 px off the bottom of the 1168 x 440 box */
      e += MK.tick(1074, 224, 24, popIn(t, cFrac, 0.4));
      out += G(e, { opacity: eqO });
    }
    return svg(out);
  }

  /* ==== chapter: Which is bigger? ==========================================
     Same bottom number, so more pieces wins; then both a single piece, where
     the bigger bottom number makes the smaller piece. */
  function epBiggerChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cMatch = c(0, "match"), cSame = c(0, "same");
    var cThree = c(1, "three"), cTwo = c(1, "two"), cMore = c(1, "more");
    var cQuarter = c(2, "quarter"), cTenth = c(2, "tenth");
    var cFewer = c(3, "fewer"), cPiece = c(3, "piece");
    var out = "", k;

    /* ---- beats 0 and 1: three fifths and two fifths ---------------------- */
    var fifthsO = epUntil(t, scene, 2);
    if (fifthsO > 0) {
      var a = "", s1 = on(t, cThree, 0.4) > 0.5 ? 3 : 0, s2 = on(t, cTwo, 0.4) > 0.5 ? 2 : 0;
      a += epBarDraw(EP_TOP, 5, s1) + epBarDraw(EP_BOT, 5, s2);
      /* Both fractions stand from the chapter's first beat, their top numbers
         still unknown - otherwise "the bottom numbers match" rings two fives
         that are not on the screen yet. */
      a += epFrac(940, 118, s1 || "?", 5, 46, s1 ? P.teal : P.muted);
      a += epFrac(940, 308, s2 || "?", 5, 46, s2 ? P.teal : P.muted);
      /* "the bottom numbers match": both fives ringed, for that beat only */
      var mo = on(t, cMatch, 0.45) * epOnly(t, scene, 0);
      if (mo > 0) {
        a += G(MK.pop(C(940, epFracBot(118, 46), 28, "none", P.gold, 4), 940, epFracBot(118, 46), popIn(t, cMatch, 0.4)) +
          MK.pop(C(940, epFracBot(308, 46), 28, "none", P.gold, 4), 940, epFracBot(308, 46),
            popIn(t, cMatch == null ? null : cMatch + 0.25, 0.4)), { opacity: mo });
      }
      /* "the pieces are the same size": one cell of each, boxed to the same width */
      var so = on(t, cSame, 0.5);
      if (so > 0) {
        a += R(epBarEdge(EP_TOP, 0, 5), EP_TOP.top - 6, (EP_TOP.inner / 5) * so, EP_TOP.tall + 12, 8, "none", P.gold, 4, { "stroke-dasharray": "10 7" });
        a += R(epBarEdge(EP_BOT, 0, 5), EP_BOT.top - 6, (EP_BOT.inner / 5) * so, EP_BOT.tall + 12, 8, "none", P.gold, 4, { "stroke-dasharray": "10 7" });
      }
      var moreO = on(t, cMore, 0.45);
      if (moreO > 0) a += MK.pill(940, 224, ">", moreO, { size: 44, col: P.good, ink: P.good });
      out += G(a, { opacity: fifthsO });
    }

    /* ---- beats 2 and 3: one quarter and one tenth ------------------------ */
    var unitO = epFrom(t, scene, 2);
    if (unitO > 0) {
      var b = "", qO = popIn(t, cQuarter, 0.5), tO = popIn(t, cTenth, 0.5);
      if (qO > 0) b += G(epBarDraw(EP_TOP, 4, 1) + epFrac(940, 118, 1, 4, 46, P.teal), { opacity: Math.min(1, qO) });
      if (tO > 0) b += G(epBarDraw(EP_BOT, 10, 1) + epFrac(940, 308, 1, 10, 46, P.teal), { opacity: Math.min(1, tO) });
      /* the two single pieces, each boxed, so their widths can be compared */
      var fo = on(t, cFewer, 0.5);
      if (fo > 0) {
        b += R(epBarEdge(EP_TOP, 0, 4), EP_TOP.top - 6, (EP_TOP.inner / 4) * fo, EP_TOP.tall + 12, 8, "none", P.gold, 4, { "stroke-dasharray": "10 7" });
        b += R(epBarEdge(EP_BOT, 0, 10), EP_BOT.top - 6, (EP_BOT.inner / 10) * fo, EP_BOT.tall + 12, 8, "none", P.gold, 4, { "stroke-dasharray": "10 7" });
        /* beside the bars, not above them: there is no room over the top card */
        b += MK.pill(152, 128, "shared between 4", fo, { size: 22, col: P.gold });
        b += MK.pill(152, 318, "shared between 10", fo, { size: 22, col: P.gold });
      }
      var po = on(t, cPiece, 0.45);
      if (po > 0) b += MK.pill(940, 224, ">", po, { size: 44, col: P.good, ink: P.good });
      out += G(b, { opacity: unitO });
    }
    return svg(out);
  }

  /* ==== what you now know ==================================================
     Six cards, one per idea, each drawn in the film's own dark palette because
     a recap card is dark. */
  function epRecapPie(cx, cy, size, fills) {
    return epPie(cx, cy, size * 0.5, 4, { fills: fills, strokes: [P.ink, P.ink, P.ink, P.ink], sw: 2.5 });
  }
  var EP_RECAP = MK.recapKind([
    { beat: 0, at: "equal", title: "Equal parts", sub: "or it is not a fraction",
      pic: function (cx, cy, size) { return epRecapPie(cx, cy, size, ["#35BFB2", "#17384F", "#17384F", "#17384F"]); } },
    { beat: 0, at: "whole", title: "One whole", sub: "every part, put together",
      pic: function (cx, cy, size) { return epRecapPie(cx, cy, size, ["#35BFB2", "#35BFB2", "#35BFB2", "#35BFB2"]); } },
    { beat: 1, at: "group", title: "Of a group", sub: "a quarter of 12 is 3",
      pic: function (cx, cy, size) {
        var s = "", k, g = size * 0.26;
        for (k = 0; k < 12; k++) s += C(cx - g * 1.5 + Math.floor(k / 3) * g, cy - g * 0.7 + (k % 3) * g * 0.7,
          size * 0.085, Math.floor(k / 3) === 0 ? P.teal : P.muted);
        return s;
      } },
    { beat: 1, at: "divide", title: "The line divides", sub: "3 quarters of 20 is 15",
      pic: function (cx, cy, size) {
        return epFrac(cx - size * 0.34, cy, 3, 4, size * 0.42, P.ink) +
          Tx(cx + size * 0.12, cy + size * 0.16, "=", "lab", "middle", { "font-size": size * 0.34, fill: P.muted }) +
          C(cx + size * 0.48, cy - size * 0.2, size * 0.055, P.gold) +
          L(cx + size * 0.3, cy, cx + size * 0.66, cy, P.gold, size * 0.06) +
          C(cx + size * 0.48, cy + size * 0.2, size * 0.055, P.gold);
      } },
    { beat: 2, at: "same", title: "Worth the same", sub: "one half is five tenths",
      pic: function (cx, cy, size) {
        var s = "", k, w = size * 1.5, x0 = cx - w / 2, h = size * 0.3;
        for (k = 0; k < 2; k++) s += R(x0 + k * w / 2, cy - h - 6, w / 2, h, 3, k === 0 ? P.teal : P.cell, P.ink, 2);
        for (k = 0; k < 10; k++) s += R(x0 + k * w / 10, cy + 6, w / 10, h, 2, k < 5 ? P.teal : P.cell, P.ink, 1.5);
        return s;
      } },
    { beat: 2, at: "compare", title: "Which is bigger", sub: "more pieces, or fewer shares",
      pic: function (cx, cy, size) {
        return epFrac(cx - size * 0.42, cy, 1, 4, size * 0.4, P.ink) +
          Tx(cx, cy + size * 0.16, ">", "lab", "middle", { "font-size": size * 0.46, fill: P.good }) +
          epFrac(cx + size * 0.46, cy, 1, 10, size * 0.4, P.ink);
      } }
  ], { goBeat: 3, goAt: "fold" });

  /* The last line sends the child off to fold paper strips and SEE the equal
     parts, so on those words the first card - the one that says equal parts -
     is ringed. Its box is recapKind's own: six cards, three across, a 4 px
     margin, each 377.33 by 209. Without this the cue would be declared and
     never read, and nothing would happen when the words were said. */
  function epRecapChapter(scene, beat, t, i) {
    var m = EP_RECAP(scene, beat, t, i), o = popIn(t, sc(scene, 3, "parts"), 0.45);
    if (!(o > 0)) return m;
    var ring = G(R(4, 4, 377.33, 209, 22, "none", P.gold, 4), { opacity: Math.min(1, o) * (0.65 + 0.35 * breathe(t)) });
    return m.replace("</svg>", ring + "</svg>");
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["Equal parts, or it is not a fraction", "A fraction of a group, and of a number", "Which fractions are worth the same"] }),
    equal: epEqualChapter, whole: epWholeChapter, group: epGroupChapter,
    divide: epDivideChapter, same: epSameChapter, bigger: epBiggerChapter, recap: epRecapChapter
  };
