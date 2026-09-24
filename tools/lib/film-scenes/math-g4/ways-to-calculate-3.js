  /* ==== Ways to Calculate, part 3: the shortcuts, and the bigger numbers ======
     Two chapters, each showing two things in turn, so each crossfades from its
     first picture to its second at the beat where the voice moves on. */

  /* ---- a method that fits: 225 + 98, and 4 x 7 x 5 -------------------------- */
  function wtcEasierChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSum = c(0, "sum"), cQuick = c(0, "quick");
    var cNear = c(1, "near"), cHund = c(1, "hund"), cGet = c(1, "get");
    var cToo = c(2, "too"), cTake = c(2, "take"), cAns = c(2, "ans");
    var cChain = c(3, "chain"), cRe = c(3, "re");
    var cTwenty = c(4, "twenty"), cAns2 = c(4, "ans"), cEasy = c(4, "easy");
    var gB = into(t, scene.first + 3), gA = 1 - gB, out = "";

    /* ---- 225 + 98, by adding 100 and giving 2 back ---- */
    if (gA > 0) {
      var a = "";
      a += MK.pill(400, 205, "225 + 98", popIn(t, cSum, 0.45), { size: 36, col: P.teal });
      /* "quicker without columns": the long way, drawn big enough to read and
         then set aside - a calculation too small to read teaches nothing. It
         is DIMMED and named, never crossed: the column method is right here,
         only slower, and a cross on it would say it was wrong. */
      var qo = on(t, cQuick, 0.5);
      if (qo > 0) {
        a += G(ART.place(ART.columnSum({ a: 225, b: 98, op: "+", answer: false }), 24, 95, 221, 208),
          { opacity: qo * 0.55 });
        a += MK.pill(134, 331, "the long way", qo, { size: 22, col: P.line, ink: P.muted });
      }
      /* "98 is nearly 100" */
      a += MK.pill(400, 125, "98 → 100", on(t, cNear, 0.45), { size: 24, col: P.gold });
      /* add 100 */
      a += MK.arrow(520, 205, 630, 205, on(t, cHund, 0.5), P.gold, 7);
      a += MK.pill(575, 147, "+ 100", on(t, cHund, 0.5), { size: 22, col: P.gold });
      a += MK.pill(720, 205, "325", popIn(t, cGet, 0.45), { size: 36, col: P.gold });
      /* "added 2 too many", so give them back */
      a += MK.pill(720, 125, "2 too many", on(t, cToo, 0.45), { size: 22, col: P.bad });
      a += MK.arrow(790, 205, 900, 205, on(t, cTake, 0.5), P.accent, 7);
      a += MK.pill(845, 147, "− 2", on(t, cTake, 0.5), { size: 22, col: P.accent });
      a += MK.pill(1000, 205, "323", popIn(t, cAns, 0.45), { size: 36, col: P.good });
      a += MK.tick(1110, 205, 26, popIn(t, cAns == null ? null : cAns + 0.4, 0.35));
      out += G(a, { opacity: clamp(gA, 0, 1) });
    }

    /* ---- 4 x 7 x 5, regrouped ---- */
    if (gB > 0) {
      var b = "", xs = [330, 490, 650], vals = ["4", "7", "5"], k;
      for (k = 0; k < 3; k++) {
        b += wtcTile(xs[k], 140, 96, 96, vals[k], 52, popIn(t, cChain == null ? null : cChain + k * 0.22, 0.4));
      }
      var so = on(t, cChain == null ? null : cChain + 0.3, 0.5);
      b += Tx(410, 156, "×", "lab huge muted", "middle", { opacity: so });
      b += Tx(570, 156, "×", "lab huge muted", "middle", { opacity: so });
      /* "can be regrouped": the chain may be taken in any order */
      var ro = on(t, cRe, 0.5) * (1 - on(t, cTwenty, 0.4));
      if (ro > 0) b += R(264, 78, 452, 124, 22, "none", P.gold, 3,
        { "stroke-dasharray": "12 8", opacity: ro });
      /* "4 times 5 is 20": the easy pair, and the arc that joins them */
      var po = on(t, cTwenty, 0.5);
      b += wtcRing(330, 140, 62, po) + wtcRing(650, 140, 62, po);
      if (po > 0) b += Pth("M330,208 C400,286 580,286 650,208", null, P.gold, 4, { opacity: po });
      b += MK.pill(900, 140, "4 × 5 = 20", popIn(t, cTwenty, 0.45), { size: 32, col: P.gold });
      /* "20 times 7 is 140" */
      b += MK.glow(584, 332, 105, P.good, 0.85 * on(t, cEasy, 0.5) * (0.6 + 0.4 * breathe(t)));
      b += MK.pill(584, 332, "20 × 7 = 140", popIn(t, cAns2, 0.45), { size: 40, col: P.good });
      out += G(b, { opacity: clamp(gB, 0, 1) });
    }
    return svg(out);
  }

  /* ---- multiplying and sharing: 342 x 6, and 87 divided by 5 ---------------- */
  var WTC_PARTX = [300, 584, 868];
  /* where 87 divided by 5 is drawn: the line high, the sentence under it.
     s is the scale from ART.numberLine's own 1000-wide card to the film. */
  var WTC_DIV = { x: 34, y: 150, w: 1000, s: 1.1 };
  var WTC_PARTS = ["300", "40", "2"];
  var WTC_PRODS = ["1,800", "240", "12"];

  function wtcBiggerChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSum = c(0, "sum"), cBreak = c(0, "breakup");
    var cParts = c(1, "parts"), cEach = c(1, "each");
    var cProd = [c(2, "hun"), c(2, "ten"), c(2, "one")];
    var cAdd = c(3, "add"), cAns = c(3, "ans");
    var cDiv = c(4, "sum"), cGroups = c(4, "groups");
    var cFives = c(5, "fives"), cLeft = c(5, "left"), cRem = c(5, "ans");
    var gB = into(t, scene.first + 4), gA = 1 - gB, out = "", k;

    /* ---- 342 x 6, one part at a time ---- */
    if (gA > 0) {
      var a = "", so = popIn(t, cSum, 0.45);
      if (so > 0) a += G(Tx(584, 56, "342 × 6", "lab huge", "middle"),
        { transform: around(584, 42, Math.min(so, 1.1)), opacity: Math.min(1, so) });
      for (k = 0; k < 3; k++) {
        var bo = on(t, cBreak == null ? null : cBreak + k * 0.16, 0.4);
        if (bo > 0) a += R(WTC_PARTX[k] - 100, 112, 200, 76, 16, "none", P.line, 3,
          { "stroke-dasharray": "11 7", opacity: bo });
        a += wtcTile(WTC_PARTX[k], 150, 200, 76, WTC_PARTS[k], 40,
          popIn(t, cParts == null ? null : cParts + k * 0.22, 0.4), P.gold);
        a += Tx(WTC_PARTX[k], 230, "× 6", "lab big muted", "middle",
          { opacity: on(t, cEach == null ? null : cEach + k * 0.12, 0.4) });
        a += MK.pill(WTC_PARTX[k], 286, WTC_PRODS[k], popIn(t, cProd[k], 0.4), { size: 34, col: P.teal });
      }
      var ad = on(t, cAdd, 0.6);
      if (ad > 0) a += L(184, 332, lerp(184, 984, ad), 332, P.ink, 4, { opacity: 0.9 });
      a += MK.glow(584, 372, 66, P.good, 0.8 * on(t, cAns, 0.5) * (0.6 + 0.4 * breathe(t)));
      var to = popIn(t, cAns, 0.45);
      if (to > 0) a += G(Tx(584, 386, "2,052", "lab huge good", "middle"),
        { transform: around(584, 372, Math.min(to, 1.1)), opacity: Math.min(1, to) });
      out += G(a, { opacity: clamp(gA, 0, 1) });
    }

    /* ---- 87 divided by 5: whole fives taken away, and what will not make one ---- */
    if (gB > 0) {
      var b = "", base = { from: 0, to: 90, step: 5, labelEvery: 15, width: 1000 };
      var D = WTC_DIV, AX = D.y + 46 * D.s, TOP = AX - 16;
      var DX = function (v) { return D.x + wtcNLX(0, 90, 1000, v) * D.s; };
      var dv = popIn(t, cDiv, 0.45);
      if (dv > 0) b += G(Tx(300, 392, "87 ÷ 5", "lab huge", "middle"),
        { transform: around(300, 378, Math.min(dv, 1.1)), opacity: Math.min(1, dv) });
      /* one card, one geometry: the bare line, the marks fading in over it,
         and the counting jumps drawn over the top by wtcArc */
      b += G(ART.place(ART.numberLine(base), D.x, D.y, 1000 * D.s, 108 * D.s),
        { opacity: on(t, cGroups, 0.5) });
      var f1 = on(t, cFives, 0.55);
      if (f1 > 0) {
        b += G(ART.place(ART.numberLine({
          from: 0, to: 90, step: 5, labelEvery: 15, width: 1000, marks: [{ at: 85, label: "85" }]
        }), D.x, D.y, 1000 * D.s, 108 * D.s), { opacity: f1 });
        b += wtcArc(DX(0), TOP, DX(85), TOP, 180, f1, P.teal, "17 fives");
      }
      /* 87 is only two units past 85, and two marks that close draw as one
         blob at this width - so the remainder is the arc that lands on it,
         with no second mark */
      b += wtcArc(DX(85), TOP, DX(87), TOP, 52, on(t, cLeft, 0.55), P.bad, "2 left");
      var ro = popIn(t, cRem, 0.45);
      if (ro > 0) {
        b += Tx(500, 392, "=", "lab huge muted", "middle", { opacity: Math.min(1, ro) });
        b += MK.pill(820, 378, "17 remainder 2", Math.min(1, ro), { size: 40, col: P.good });
      }
      out += G(b, { opacity: clamp(gB, 0, 1) });
    }
    return svg(out);
  }
