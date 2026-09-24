  /* ==== Adding, Taking Away and Money, part 3 =================================
     The two money chapters and the recap.

     THE MONEY PICTURES ARE DRAWN HERE, not taken from ART, and the reason is
     the notation. This lesson is Cambridge 3Nm.01, money written with a
     decimal point, and every step of adding-and-money.html prints it as
     "sh 2.60" - shillings, a dot, and always two figures of cents. ART.coins
     writes the other Maths form ("2.6 sh", the value then the unit) and
     ART.numberLine prints a tick as Math.round(v * 1000) / 1000, so sh 2.60
     would be labelled "2.6" and sh 3.00 "3" - a number on screen that is not
     the number said. So the amount card and the counting-on line below are
     the film's own, in the lesson's own notation. */

  /* ---- the amount, big, with its two halves separated by the dot -------- */
  var AM_AMT = { x: 200, y: 48, w: 768, h: 260, mid: 178 };
  var AM_AMT_X = { unit: 425, whole: 525, dot: 592, cents: 700 };
  function amAmount(whole, cents, o, wholeCol, centsCol) {
    if (!(o > 0)) return "";
    return G(amNum(AM_AMT_X.unit, AM_AMT.mid, "sh", 58, AMC.muted) +
      amNum(AM_AMT_X.whole, AM_AMT.mid, whole, 124, wholeCol || AMC.ink) +
      amNum(AM_AMT_X.dot, AM_AMT.mid, ".", 124, AMC.accent) +
      amNum(AM_AMT_X.cents, AM_AMT.mid, cents, 124, centsCol || AMC.ink),
      { opacity: clamp(o, 0, 1) });
  }

  function amMoneyDotChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDot = c(0, "dot"), cAmount = c(0, "amount");
    var cShill = c(1, "shill"), cCents = c(1, "cents");
    var cHundred = c(2, "hundred"), cBoth = c(2, "both");
    var cThree = c(3, "three"), cFive = c(3, "five");
    var cNo = c(4, "no"), cZero = c(4, "zero"), cColumn = c(4, "column");
    var out = "";

    out += amCard(AM_AMT.x, AM_AMT.y, AM_AMT.w, AM_AMT.h, 1);
    /* sh 4.65 for the first three beats, sh 3.05 for the last two. The
       amount stands from the first frame of the chapter - it is what the
       chapter is about - and "Look at four point six five" frames it. */
    var swap = on(t, cThree, 0.5);
    var lit1 = on(t, cShill, 0.4) > 0.5 ? AMC.teal : null;
    var lit2 = on(t, cCents, 0.4) > 0.5 ? AMC.plum : null;
    var lit3 = on(t, cFive, 0.4) > 0.5 ? AMC.plum : null;
    out += amAmount("4", "65", 1 - swap, lit1, lit2);
    out += R(372, 100, 424, 156, 20, null, P.gold, 4, { opacity: on(t, cAmount, 0.5) * amOnly(t, scene, 0) });
    out += amAmount("3", "05", swap, null, lit3);
    /* "a dot" */
    out += MK.glow(AM_AMT_X.dot, AM_AMT.mid + 26, 56, P.gold, on(t, cDot, 0.5) * amOnly(t, scene, 0) * (0.7 + 0.3 * breathe(t)));
    /* "Read both figures": the two cents figures underlined together */
    var bo = on(t, cBoth, 0.5);
    if (bo > 0) out += L(631, 266, lerp(631, 769, bo), 266, P.gold, 5);
    /* "The zero is holding the ten cents column open" */
    var zo = on(t, cZero, 0.5);
    if (zo > 0) out += MK.glow(666, AM_AMT.mid, 54, P.gold, zo * (0.7 + 0.3 * breathe(t)));

    /* the names of the two halves, while they are being named */
    var early = 1 - into(t, scene.first + 3);
    if (early > 0) {
      var so = on(t, cShill, 0.4) * early, co = on(t, cCents, 0.4) * early;
      if (so > 0) out += MK.leader(440, 338, AM_AMT_X.whole, 256, on(t, cShill, 0.6), P.teal);
      out += MK.pill(440, 360, "whole shillings", so, { size: 24, col: P.teal });
      if (co > 0) out += MK.leader(810, 338, AM_AMT_X.cents, 256, on(t, cCents, 0.6), P.plum);
      out += MK.pill(810, 360, "cents", co, { size: 24, col: P.plum });
    }
    var hf = 1 - into(t, scene.first + 4);
    out += MK.pill(584, 416, "100 cents = 1 shilling", on(t, cHundred, 0.4) * hf, { size: 24, col: P.gold });
    out += MK.pill(584, 360, "ten cents column", on(t, cColumn, 0.4), { size: 24, col: P.gold });

    /* five cents, yes; fifty cents, no */
    var fo = on(t, cFive, 0.4);
    out += MK.pill(1050, 110, "5 cents", fo, { size: 24, col: P.good });
    out += MK.tick(1050, 186, 26, popIn(t, cFive == null ? null : cFive + 0.4, 0.4));
    var no = on(t, cNo, 0.4);
    out += MK.pill(1050, 300, "50 cents", no, { size: 24, col: P.bad });
    out += MK.cross(1050, 376, 26, popIn(t, cNo == null ? null : cNo + 0.4, 0.4));
    return svg(out);
  }

  /* ==== chapter: giving change ==============================================
     The lesson's own shopping tags (it costs / you pay) and its own counting
     on: "2.60 to 3.00 is 40 cents, and 3.00 to 5.00 is two shillings". The
     line is drawn to scale - 40 cents of 2.40 is a sixth of the way along. */
  var AM_TAGS = [
    { cx: 250, cap: "it costs" }, { cx: 584, cap: "you pay" }, { cx: 918, cap: "change" }
  ];
  var AM_ON = { y: 340, a: 170, b: 308, c: 1000 };
  function amTag(k, value, o, vo, col) {
    if (!(o > 0)) return "";
    var g = AM_TAGS[k], x = g.cx - 160;
    return G(R(x, 40, 320, 150, 22, AMC.card, col || AMC.line, col ? 4 : 2) +
      amNum(g.cx, 80, g.cap, 24, AMC.muted) +
      (vo > 0 ? amNum(g.cx, 142, value, 54, col || AMC.ink, { opacity: clamp(vo, 0, 1) }) : ""),
      { opacity: clamp(o, 0, 1) });
  }
  /* one counting-on hop, drawn the way ART.numberLine draws a jump */
  function amHop(x1, x2, label, o, col) {
    if (!(o > 0)) return "";
    var y = AM_ON.y - 15, ah = 70, c1 = x1 + (x2 - x1) * 0.25, c2 = x2 - (x2 - x1) * 0.25;
    var ang = Math.atan2(ah, (x2 - x1) * 0.25) * 180 / Math.PI, r = ang * Math.PI / 180;
    var head = "M" + n2(x2) + "," + n2(y) +
      " L" + n2(x2 - 12 * Math.cos(r) - 7.5 * Math.sin(r)) + "," + n2(y - 12 * Math.sin(r) + 7.5 * Math.cos(r)) +
      " L" + n2(x2 - 12 * Math.cos(r) + 7.5 * Math.sin(r)) + "," + n2(y - 12 * Math.sin(r) - 7.5 * Math.cos(r)) + " Z";
    return G(Pth("M" + n2(x1) + "," + n2(y) + " C" + n2(c1) + "," + n2(y - ah) + " " + n2(c2) + "," + n2(y - ah) + " " + n2(x2) + "," + n2(y), null, col, 4) +
      Pth(head, col, col, 2) +
      amNum((x1 + x2) / 2, AM_ON.y - 26 - ah * 0.86, label, 24, col), { opacity: clamp(o, 0, 1) });
  }
  function amStop(x, label, o, col) {
    if (!(o > 0)) return "";
    return G(C(x, AM_ON.y, 13, col, AMC.card, 4) + amNum(x, 384, label, 22, col), { opacity: clamp(o, 0, 1) });
  }

  function amChangeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGap = c(0, "gap"), cPrice = c(0, "price"), cPaid = c(0, "paid");
    var cCost = c(1, "cost"), cPay = c(1, "pay");
    var cCount = c(2, "count"), cForty = c(2, "forty");
    var cTwo = c(3, "two");
    var cChange = c(4, "change");
    var out = "";

    out += amTag(0, "sh 2.60", on(t, cPrice, 0.45), popIn(t, cCost, 0.4), on(t, cCost, 0.4) > 0.5 ? P.accent : null);
    out += amTag(1, "sh 5.00", on(t, cPaid, 0.45), popIn(t, cPay, 0.4), on(t, cPay, 0.4) > 0.5 ? P.teal : null);
    var told = on(t, cChange, 0.4);
    out += amTag(2, "sh 2.40", on(t, cGap, 0.45), popIn(t, cChange, 0.45), told > 0.5 ? P.good : null);
    if (told < 1) out += MK.qmark(AM_TAGS[2].cx, 138, 34, on(t, cGap, 0.5) * (1 - told));
    out += MK.tick(AM_TAGS[2].cx + 208, 115, 26, popIn(t, cChange == null ? null : cChange + 0.5, 0.4));

    /* the counting-on line: 2.60, on to 3.00, on to 5.00 */
    var lo = on(t, cCount, 0.5);
    if (lo > 0) out += L(150, AM_ON.y, lerp(150, 1020, lo), AM_ON.y, "#FFFFFF", 4);
    out += amStop(AM_ON.a, "sh 2.60", on(t, cCount, 0.5), P.accent);
    out += amHop(AM_ON.a, AM_ON.b, "+ 40 cents", popIn(t, cForty, 0.45), P.gold);
    out += amStop(AM_ON.b, "sh 3.00", on(t, cForty, 0.5), P.gold);
    out += amHop(AM_ON.b, AM_ON.c, "+ 2 shillings", popIn(t, cTwo, 0.45), P.teal);
    out += amStop(AM_ON.c, "sh 5.00", on(t, cTwo, 0.5), P.teal);
    return svg(out);
  }

  /* ==== what you now know ==================================================== */
  function amPicHundred(cx, cy, size) { return amNum(cx, cy, "100", size * 0.62, P.gold); }
  function amPicOrder(cx, cy, size) {
    return Pth("M" + n2(cx - size * 0.44) + "," + n2(cy - size * 0.12) +
      " C" + n2(cx - size * 0.22) + "," + n2(cy - size * 0.58) + " " + n2(cx + size * 0.22) + "," + n2(cy - size * 0.58) +
      " " + n2(cx + size * 0.44) + "," + n2(cy - size * 0.12), null, P.blue, 4, { "stroke-dasharray": "8 7" }) +
      amNum(cx, cy + size * 0.26, "+", size * 0.8, P.blue);
  }
  function amPicCarry(cx, cy, size) {
    return amNum(cx - size * 0.28, cy - size * 0.3, "1", size * 0.42, P.accent) +
      amNum(cx + size * 0.06, cy + size * 0.18, "+", size * 0.78, P.accent);
  }
  function amPicExchange(cx, cy, size) { return amNum(cx, cy, "−", size * 0.9, P.plum); }
  function amPicCoin(cx, cy, size) { return amCoin(cx, cy, size * 0.46, "sh"); }

  function amPicDot(cx, cy, size) {
    return amNum(cx - size * 0.46, cy, "3", size * 0.72, P.muted) +
      amNum(cx - size * 0.1, cy, ".", size * 0.72, P.accent) +
      amNum(cx + size * 0.34, cy, "05", size * 0.72, P.gold);
  }

  var AM_RECAP = MK.recapKind([
    { beat: 0, at: "comp", title: "Make 100", sub: "62 + 38 = 100", pic: amPicHundred },
    { beat: 0, at: "order", title: "Any order", sub: "17 and 3 first, then 9", pic: amPicOrder },
    { beat: 1, at: "carry", title: "Carry", sub: "247 + 185 = 432", pic: amPicCarry },
    { beat: 1, at: "exch", title: "Exchange", sub: "400 − 178 = 222", pic: amPicExchange },
    { beat: 2, at: "dot", title: "The dot", sub: "sh 3.05 is 5 cents", pic: amPicDot },
    { beat: 2, at: "change", title: "Change", sub: "count on: sh 2.40", pic: amPicCoin }
  ], { goBeat: 2, goAt: "done" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Complements of 100, and adding in any order",
      "Carrying and exchanging down the columns",
      "Reading money, and counting out change"
    ] }),
    hundred: amHundredChapter,
    anyorder: amAnyOrderChapter,
    carry: amCarryChapter,
    take: amTakeChapter,
    moneydot: amMoneyDotChapter,
    change: amChangeChapter,
    recap: AM_RECAP
  };
