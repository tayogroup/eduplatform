  /* ==== Parts of a Whole, part 3 =============================================
     tools/lib/film-scenes/math-g4/parts-of-a-whole-3.js. The three comparing
     chapters - "Same value, different name", "Out of a hundred" and "Which is
     bigger?" - the recap, and KINDS.

     pwEqBar is this film's own bar, and the one drawing here the library does
     not cover: ART.fraction's bar card is a fixed 440 x 148, so three of them
     stacked cannot fit in the 440 px a chapter has, and the equivalence
     chapter needs three bars of exactly equal length at once. It cuts the
     same way ART.fraction does - cell width w / parts, the first `shaded`
     filled - so 1/2, 2/4 and 4/8 of one width shade the same pixels, which is
     the whole claim of that chapter. */

  /* one bar of width w, cut into `parts` equal cells, the first `shaded` filled */
  function pwEqBar(x, y, w, h, parts, shaded, o, col) {
    if (!(o > 0)) return "";
    var cw = w / parts, s = "", k;
    for (k = 0; k < parts; k++) s += R(x + k * cw, y, cw, h, 0, k < shaded ? (col || ART.C.teal) : ART.C.cell);
    for (k = 1; k < parts; k++) s += L(x + k * cw, y, x + k * cw, y + h, ART.C.ink, 2.5);
    s += R(x, y, w, h, 0, "none", ART.C.ink, 3.5);
    return G(s, { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: same value, different name ==================================
     One half, two quarters and four eighths of the SAME width, one under
     another, so the three shaded lengths end on one line: 330 px each, every
     time, because they are 660 / 2, 2 x 660 / 4 and 4 x 660 / 8. */
  var PW_E = { x: 300, w: 660, h: 72, rows: [60, 190, 320], gx: 215 };

  function pwEquivChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLook = c(0, "look"), cSame = c(0, "same");
    var cHalf = c(1, "half"), cTwo = c(1, "two");
    var cEnds = c(2, "ends"), cEq = c(2, "eq");
    var cFour = c(3, "four"), cAll = c(3, "all");
    var rows = [{ parts: 2, shaded: 1, at: cHalf }, { parts: 4, shaded: 2, at: cTwo }, { parts: 8, shaded: 4, at: cFour }];
    var out = "", k;

    /* the three fractions, written: they look different */
    for (k = 0; k < 3; k++) {
      var go = popIn(t, cLook == null ? null : cLook + k * 0.16, 0.4);
      out += pwGlyph(PW_E.gx, PW_E.rows[k] + 36, rows[k].shaded, rows[k].parts, 34,
        on(t, rows[k].at, 0.4) > 0.5 ? P.gold : P.ink, Math.min(1, go));
    }
    /* "exactly the same": the equals signs between them */
    var eqo = on(t, cSame, 0.5);
    if (eqo > 0) {
      out += Tx(PW_E.gx, 168, "=", "lab huge", "middle", { opacity: eqo, fill: P.muted });
      out += Tx(PW_E.gx, 298, "=", "lab huge", "middle", { opacity: on(t, cSame == null ? null : cSame + 0.35, 0.5), fill: P.muted });
    }

    /* the bars, each drawn as it is named */
    for (k = 0; k < 3; k++) {
      out += pwEqBar(PW_E.x, PW_E.rows[k], PW_E.w, PW_E.h, rows[k].parts, rows[k].shaded, on(t, rows[k].at, 0.5));
    }

    /* "ends in the same place": one line down the ends of the shaded parts */
    var endsU = on(t, cEnds, 0.6), allU = on(t, cAll, 0.6);
    var deep = allU > 0 ? 406 : 276;
    if (endsU > 0) {
      var ex = PW_E.x + PW_E.w / 2;
      out += L(ex, 46, ex, lerp(46, deep, Math.max(endsU, allU)), P.gold, 4, { "stroke-dasharray": "12 9" });
    }
    /* "one half equals two quarters", and then all three, glowing together */
    var lit = [on(t, cEq, 0.5), on(t, cEq == null ? null : cEq + 0.3, 0.5), allU];
    for (k = 0; k < 3; k++) {
      if (!(lit[k] > 0)) continue;
      out += R(PW_E.x - 4, PW_E.rows[k] - 4, PW_E.w / 2 + 8, PW_E.h + 8, 6, "none", P.gold, 5,
        { opacity: lit[k] * (0.65 + 0.35 * breathe(t + k * 0.5)) });
    }
    return svg(out);
  }

  /* ==== chapter: out of a hundred ============================================
     ART.grid at 10 by 10, which is a hundred squares and cannot be anything
     else. The 25 that shade are the top-left 5 by 5 block, so when the grid is
     split down its middle and across its middle - at 5 and at 5 - the shaded
     squares are exactly one of the four quarters. */
  var PW_H = { x: 60, y: 6, w: 384, cell: 34 };
  PW_H.gx = PW_H.x + 22;
  PW_H.gy = PW_H.y + 22;
  function pwShaded(n) {
    var out = [], k;
    for (k = 0; k < n; k++) out.push([k % 5, Math.floor(k / 5)]);
    return out;
  }

  function pwPercentChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPercent = c(0, "percent"), cHundred = c(0, "hundred"), cSquares = c(0, "squares");
    var cShade = c(1, "shade"), cPct = c(1, "pct");
    var cSign = c(2, "sign"), cWrote = c(2, "wrote");
    var cFill = c(3, "fill");
    var cSame = c(4, "same");
    var out = "", n = tally(t, cShade, 25, 1.7);
    var grid = ART.grid({ cols: 10, rows: 10, cell: PW_H.cell, fill: pwShaded(n), colour: "teal", label: false });
    var go = popIn(t, cSquares, 0.45);
    if (go > 0) out += G(ART.place(grid, PW_H.x, PW_H.y, PW_H.w, PW_H.w),
      { transform: around(PW_H.x + PW_H.w / 2, PW_H.y + PW_H.w / 2, Math.min(1, go)) });

    /* how many are shaded, counted under the grid as they fill */
    if (n > 0) out += Tx(PW_H.gx + 170, 414, String(n) + " of 100", "lab big", "middle", { fill: P.gold });

    /* per cent means out of a hundred */
    out += Tx(700, 118, "per cent", "lab huge", "middle", { opacity: on(t, cPercent, 0.5), fill: P.gold });
    out += Tx(930, 118, "= out of 100", "lab big", "middle", { opacity: on(t, cHundred, 0.5), fill: P.ink });
    /* 25 out of 100 */
    out += Tx(800, 228, "25 out of 100", "lab huge", "middle", { opacity: on(t, cPct, 0.5), fill: P.ink });
    /* and how it is written */
    var sg = popIn(t, cSign, 0.4), wr = on(t, cWrote, 0.5);
    if (sg > 0) out += MK.pop(Tx(800, 314, "%", "lab huge", "middle", { fill: P.gold }), 800, 302, Math.min(1, sg) * (1 - wr));
    if (wr > 0) out += Tx(800, 314, "25%", "lab huge", "middle", { opacity: wr, fill: P.gold });

    /* one quarter of the grid: the split, drawn at 5 and at 5 */
    var fl = on(t, cFill, 0.6);
    if (fl > 0) {
      var mx = PW_H.gx + 5 * PW_H.cell, my = PW_H.gy + 5 * PW_H.cell;
      out += L(mx, PW_H.gy, mx, PW_H.gy + 10 * PW_H.cell, P.gold, 5, { opacity: fl });
      out += L(PW_H.gx, my, PW_H.gx + 10 * PW_H.cell, my, P.gold, 5, { opacity: fl });
      out += R(PW_H.gx, PW_H.gy, 5 * PW_H.cell, 5 * PW_H.cell, 0, "none", P.gold, 5,
        { opacity: fl * (0.6 + 0.4 * breathe(t)) });
      out += pwGlyph(800, 386, 1, 4, 38, P.gold, popIn(t, cFill == null ? null : cFill + 0.4, 0.4));
    }
    /* "the very same amount": the quarter sits under the 25% as its equal */
    var sm = on(t, cSame, 0.5);
    if (sm > 0) {
      out += Tx(714, 398, "=", "lab huge", "middle", { opacity: sm, fill: P.muted });
      out += R(686, 274, 190, 162, 14, "none", P.gold, 4,
        { opacity: sm * (0.55 + 0.45 * breathe(t)) });
    }
    return svg(out);
  }

  /* ==== chapter: which is bigger? ============================================
     Three quarters and five eighths, drawn at the same width, so the answer is
     a length and not a rule: 3/4 of 660 is 495 px and 5/8 of 660 is 412.5, and
     the 82.5 px between them is exactly one eighth. */
  var PW_C = { x: 320, w: 660, h: 76, ay: 96, by: 236, gx: 230 };

  function pwCompareChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTq = c(0, "tq"), cFe = c(0, "fe");
    var cSame = c(1, "same"), cCut = c(1, "cut");
    var cSix = c(2, "six");
    var cTops = c(3, "tops"), cBeats = c(3, "beats");
    var cBigger = c(4, "bigger");
    var out = "", cutU = on(t, cCut, 0.55);

    /* the top bar: three quarters, re-cut into six eighths - the same shading */
    out += pwEqBar(PW_C.x, PW_C.ay, PW_C.w, PW_C.h, 4, 3, on(t, cTq, 0.5) * (1 - cutU));
    out += pwEqBar(PW_C.x, PW_C.ay, PW_C.w, PW_C.h, 8, 6, on(t, cTq, 0.5) * cutU);
    out += pwEqBar(PW_C.x, PW_C.by, PW_C.w, PW_C.h, 8, 5, on(t, cFe, 0.5));

    /* their names, the top one renamed when it is re-cut */
    var six = on(t, cSix, 0.5);
    out += pwGlyph(PW_C.gx, PW_C.ay + 38, 3, 4, 36, P.ink, popIn(t, cTq, 0.4) * (1 - six));
    out += pwGlyph(PW_C.gx, PW_C.ay + 38, 6, 8, 36, P.gold, six);
    out += pwGlyph(PW_C.gx, PW_C.by + 38, 5, 8, 36, P.ink, popIn(t, cFe, 0.4));

    /* "the same bottom number": each bottom number in turn */
    var s1 = on(t, cSame, 0.45), s2 = on(t, cSame == null ? null : cSame + 0.45, 0.45);
    if (s1 > 0) out += C(PW_C.gx, PW_C.ay + 72, 22, "none", P.gold, 4, { opacity: s1 * pwOnly(t, scene, 1) });
    if (s2 > 0) out += C(PW_C.gx, PW_C.by + 72, 22, "none", P.gold, 4, { opacity: s2 * pwOnly(t, scene, 1) });

    /* "only the top numbers matter" */
    var tp = on(t, cTops, 0.45);
    if (tp > 0) {
      out += C(PW_C.gx, PW_C.ay + 16, 22, "none", P.gold, 4, { opacity: tp });
      out += C(PW_C.gx, PW_C.by + 16, 22, "none", P.gold, 4, { opacity: on(t, cTops == null ? null : cTops + 0.35, 0.45) });
    }
    out += Tx(1074, 186, "6 > 5", "lab huge", "middle", { opacity: on(t, cBeats, 0.5), fill: P.gold });

    /* "bigger": the eighth the top bar has and the bottom one has not */
    var bg = on(t, cBigger, 0.6);
    if (bg > 0) {
      var ex = PW_C.x + PW_C.w * 5 / 8, tx = PW_C.x + PW_C.w * 3 / 4;
      out += L(ex, PW_C.ay - 12, ex, PW_C.by + PW_C.h + 12, P.gold, 4, { opacity: bg, "stroke-dasharray": "11 8" });
      out += R(ex, PW_C.ay, (tx - ex) * bg, PW_C.h, 0, P.gold, null, null, { opacity: 0.45 * bg });
      out += pwGlyph(520, 378, 3, 4, 32, P.gold, bg);
      out += Tx(584, 392, ">", "lab huge", "middle", { opacity: bg, fill: P.ink });
      out += pwGlyph(648, 378, 5, 8, 32, P.ink, bg);
    }
    return svg(out);
  }

  /* ==== what you now know ==================================================== */
  function pwCardBar(parts, shaded) {
    return function (cx, cy, size) {
      var w = size * 2.1, h = size * 0.52;
      return pwEqBar(cx - w / 2, cy - h / 2, w, h, parts, shaded, 1);
    };
  }
  function pwCardText(text, col) {
    return function (cx, cy, size) {
      return Tx(cx, cy + size * 0.24, text, "lab huge", "middle", { fill: col || P.gold, "font-size": size * 0.72 });
    };
  }
  function pwCardGroups(cx, cy, size) {
    var out = "", k, w = size * 0.52;
    for (k = 0; k < 2; k++) {
      var bx = cx - size * 0.62 + k * (w + size * 0.2);
      out += R(bx, cy - w / 2, w, w, 8, ART.C.card, ART.C.line, 3);
      out += C(bx + w * 0.32, cy - w * 0.18, w * 0.13, ART.C.accent) + C(bx + w * 0.68, cy - w * 0.18, w * 0.13, ART.C.accent) +
        C(bx + w * 0.32, cy + w * 0.18, w * 0.13, ART.C.accent) + C(bx + w * 0.68, cy + w * 0.18, w * 0.13, ART.C.accent);
    }
    out += Tx(cx + size * 0.72, cy + size * 0.16, "…", "lab huge", "middle", { fill: P.muted });
    return out;
  }
  function pwCardEquiv(cx, cy, size) {
    var w = size * 1.9, h = size * 0.3;
    return pwEqBar(cx - w / 2, cy - h * 1.5, w, h, 2, 1, 1) +
      pwEqBar(cx - w / 2, cy + h * 0.5, w, h, 8, 4, 1);
  }

  var PW_RECAP = MK.recapKind([
    { beat: 0, at: "more", title: "More parts", sub: "each part gets smaller", pic: pwCardBar(8, 1) },
    { beat: 0, at: "div", title: "A division", sub: "3 cakes shared by 4 children", pic: pwCardText("3 ÷ 4") },
    { beat: 1, at: "share", title: "Of an amount", sub: "share it into equal groups", pic: pwCardGroups },
    { beat: 2, at: "equiv", title: "Equivalent", sub: "one half is four eighths", pic: pwCardEquiv },
    { beat: 2, at: "pct", title: "Per cent", sub: "parts in every hundred", pic: pwCardText("25%") },
    { beat: 3, at: "cmp", title: "Compare", sub: "same bottom number first", pic: pwCardText(">", P.teal) }
  ], { goBeat: 3, goAt: "cmp" });

  var KINDS = {
    title: MK.titleKind({ sub: ["One whole, cut into equal parts", "Fractions of amounts, and percentages", "Which fraction is bigger"] }),
    more: pwMoreChapter,
    divide: pwDivideChapter,
    amount: pwAmountChapter,
    equiv: pwEquivChapter,
    percent: pwPercentChapter,
    compare: pwCompareChapter,
    recap: PW_RECAP
  };
