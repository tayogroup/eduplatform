
  /* ==== Coins and Change, part 2: counting a purse, and making an amount ======
     tools/lib/film-scenes/math-g2/coins-and-change-2.js. See part 1 for the
     shared helpers.

     Both chapters are the lesson's own worked examples:
       count  coins-and-change.html step 5, its data-explain - "A 50, a 20 and
              a 5. Start at 50, count on 20 to 70, then 5 more to 75."
       make   step 6 - "To make 35 shillings, take a 20, then a 10, then a 5.
              Say 20, 30, 35 as you go." - and step 7 - "70 shillings. A 50
              fits, and leaves 20. A 20 fits, and leaves nothing. That is two
              pieces. Seven 10 shilling coins also make 70, but that is seven
              pieces."

     Every total is ccSum of the array of values drawn beside it. */

  /* ==== chapter: Count what is in the purse ========================================
     One purse, ART.coins([50, 20, 5]) inside it, and the working written down
     the right-hand side as each piece is counted on. */
  var CC_CNT_VALUES = [50, 20, 5];
  var CC_CNT_S = 1.75, CC_CNT_CX = 406, CC_CNT_CY = 201;

  function ccCountChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPurse = c(0, "purse"), cWorth = c(0, "worth");
    var cBiggest = c(1, "biggest"), cFifty = c(1, "fifty");
    var cOn = c(2, "on"), cTwenty = c(2, "twenty"), cSeventy = c(2, "seventy");
    var cFive = c(3, "five"), cSf = c(3, "sf"), cTotal = c(3, "total");
    var cThree = c(4, "three"), cAmount = c(4, "amount"), cValue = c(4, "value");
    var out = "", card = ccCoins(CC_CNT_VALUES, 3);
    var spot = function (k) { var s = ccSlot(k); return ccSpot(card, CC_CNT_CX, CC_CNT_CY, CC_CNT_S, s[0], s[1]); };

    out += ccPurse(96, 96, 620, 214, popIn(t, cPurse, 0.5));
    out += G(ccFit(card, CC_CNT_CX, CC_CNT_CY, CC_CNT_S), { opacity: Math.min(1, popIn(t, cPurse == null ? null : cPurse + 0.2, 0.5)) });

    /* "What is it all worth?" - the question, until the counting starts */
    out += MK.qmark(930, 196, 48, on(t, cWorth, 0.4) * ccOnly(t, scene, 0));

    /* each piece lights as it is counted on: the 50, then the 20, then the 5 */
    var lights = [
      { at: cFifty, k: 0 }, { at: cTwenty, k: 1 }, { at: cFive, k: 2 }
    ];
    lights.forEach(function (g, n) {
      var p = spot(g.k), o = on(t, g.at, 0.4);
      if (o <= 0) return;
      var here = ccOnly(t, scene, n === 0 ? 1 : n === 1 ? 2 : 3);
      out += MK.glow(p[0], p[1], 82, P.gold, o * (0.35 + 0.65 * here));
      out += C(p[0], p[1], 74, "none", P.gold, 4, { opacity: o * here * (0.45 + 0.55 * breathe(t)) });
    });
    /* "the biggest piece": the arrow that finds it */
    out += ccPoint(t, cBiggest, 250, 386, "the biggest", spot(0), 26, null, ccOnly(t, scene, 1));
    /* "count on": the counting runs left to right across the purse */
    var onU = on(t, cOn, 0.6) * ccOnly(t, scene, 2);
    if (onU > 0) out += MK.arrow(spot(0)[0] + 78, 330, spot(2)[0] + 40, 330, onU, P.teal, 6);

    /* the working, written down as it is said - start at 50, 50 + 20 = 70,
       70 + 5 = 75 - added up from the coins in the purse, never typed out */
    var when = [cFifty, cSeventy, cSf], rows = [], run = 0;
    CC_CNT_VALUES.forEach(function (v, k) {
      var before = run; run += v;
      rows.push({ text: k === 0 ? "start at " + ccSh(v) : before + " + " + v + " = " + run, at: when[k] });
    });
    out += MK.list(790, 120, rows, t, { lh: 60, cls: "lab big" });

    /* the total, from the values actually drawn */
    var total = ccSum(CC_CNT_VALUES);
    out += MK.pill(930, 330, ccSh(total), on(t, cTotal, 0.4) * (1 + 0.12 * bump(t, cAmount, 0.8)), { size: 36, col: P.gold });
    out += MK.tick(1092, 330, 22, popIn(t, cValue, 0.4));

    /* "Three pieces ... not the pieces" */
    var pieces = ccOnly(t, scene, 4);
    out += MK.pill(330, 386, CC_CNT_VALUES.length + " pieces", on(t, cThree, 0.4) * pieces, { size: 28, col: P.line });
    out += MK.cross(470, 386, 22, popIn(t, cValue == null ? null : cValue + 0.25, 0.4) * pieces);
    return svg(out);
  }

  /* ==== chapter: Making an amount ==================================================
     Beats 0 to 2: a tray of the lesson's coins, an empty purse, and 35 sh built
     out of a 20, a 10 and a 5, with the running total said as each one lands.
     Beats 3 to 5: 70 sh two ways - a 50 and a 20 above, seven 10s below.

     The coins that arrive one at a time are ccCoin, not ART.coins: a coins card
     lays its whole row out at once, so the 20 would already be on screen while
     the voice is still saying that the 50 leaves 20 to find. */
  var CC_MK_TRAY = [1, 5, 10, 20, 50];
  var CC_MK_TRAY_S = 0.8, CC_MK_TRAY_CX = 766, CC_MK_TRAY_CY = 76;
  var CC_MK_35 = [20, 10, 5];                      /* 20 + 10 + 5 = 35 */
  var CC_MK_35_X = [420, 584, 748], CC_MK_35_Y = 262;
  var CC_MK_FEW = [50, 20];                        /* 50 + 20 = 70 */
  var CC_MK_TENS = [10, 10, 10, 10, 10, 10, 10];   /* seven 10s = 70 */

  function ccMakeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cChoose = c(0, "choose"), cTarget = c(0, "target");
    var cAt = [c(1, "c20"), c(1, "c10"), c(1, "c5")], cIs35 = c(1, "is35");
    var cRun = [c(2, "t20"), c(2, "t30"), c(2, "t35")];
    var cT70 = c(3, "t70"), cFew = c(3, "few");
    var cFifty = c(4, "fifty"), cLeaves = c(4, "leaves"), cTwenty = c(4, "twenty"), cTwo = c(4, "two");
    var cSeven = c(5, "seven"), cPieces = c(5, "pieces");
    var out = "", k;

    /* ---- beats 0 to 2: make 35 sh exactly ---- */
    var first = ccUntil(t, scene, 3);
    if (first > 0) {
      var a = "", tray = ccCoins(CC_MK_TRAY);
      var trayAt = function (n) {
        var s = ccSlot(n);
        return ccSpot(tray, CC_MK_TRAY_CX, CC_MK_TRAY_CY, CC_MK_TRAY_S, s[0], s[1]);
      };
      a += G(ccFit(tray, CC_MK_TRAY_CX, CC_MK_TRAY_CY, CC_MK_TRAY_S), { opacity: Math.min(1, popIn(t, cChoose, 0.45)) });
      a += ccPurse(300, 170, 568, 192, popIn(t, cChoose == null ? null : cChoose + 0.25, 0.45));
      a += Em(122, 48, 40, "\u{1F3AF}", { opacity: on(t, cTarget, 0.4).toFixed(3) });
      a += MK.pill(270, 48, "Make " + ccSh(ccSum(CC_MK_35)), on(t, cTarget, 0.4), { size: 30, col: P.gold });

      /* each coin leaves the tray and lands in the purse as it is named */
      var trayIndex = [3, 2, 1];                   /* the 20, the 10 and the 5 in CC_MK_TRAY */
      var run = 0;
      for (k = 0; k < CC_MK_35.length; k++) {
        run += CC_MK_35[k];
        var land = [CC_MK_35_X[k], CC_MK_35_Y];
        var tr0 = trayAt(trayIndex[k]);
        var lo = cAt[k] == null ? 0 : (1 - on(t, cAt[k] + 1.0, 0.4)) * ccOnly(t, scene, 1);
        if (lo > 0) a += G(MK.leader(tr0[0], tr0[1] + 50, land[0], land[1] - 60, on(t, cAt[k], 0.5), P.gold), { opacity: lo });
        a += ccCoin(land[0], land[1], 52, CC_MK_35[k], popIn(t, cAt[k], 0.45));
        /* "twenty, thirty, thirty-five": the running total under each coin */
        a += MK.pop(Tx(land[0], 400, String(run), "lab huge", "middle", { fill: P.teal }), land[0], 390, popIn(t, cRun[k], 0.4));
      }
      a += MK.pill(1012, CC_MK_35_Y, ccSh(ccSum(CC_MK_35)), on(t, cIs35, 0.4), { size: 34, col: P.gold });
      a += MK.tick(1012, 346, 24, popIn(t, cIs35 == null ? null : cIs35 + 0.3, 0.4));
      out += G(a, { opacity: first });
    }

    /* ---- beats 3 to 5: 70 sh, in two pieces and in seven ---- */
    var second = ccFrom(t, scene, 3);
    if (second > 0) {
      var b = "";
      b += Em(184, 46, 40, "\u{1F3AF}", { opacity: on(t, cT70, 0.4).toFixed(3) });
      b += MK.pill(332, 46, "Make " + ccSh(ccSum(CC_MK_FEW)), on(t, cT70, 0.4), { size: 30, col: P.gold });
      b += MK.pill(660, 46, "as few pieces as you can", on(t, cFew, 0.4) * ccOnly(t, scene, 3), { size: 24, col: P.line });
      /* the question itself, while the stage is still empty */
      b += MK.qmark(584, 236, 50, on(t, cFew, 0.4) * ccOnly(t, scene, 3));

      /* the 50, then the 20 that finishes it */
      b += ccCoin(300, 172, 50, CC_MK_FEW[0], popIn(t, cFifty, 0.45));
      b += MK.pill(460, 172, "leaves " + ccSh(20), on(t, cLeaves, 0.4) * (1 - on(t, cTwenty, 0.35)), { size: 24, col: P.line });
      b += ccCoin(300 + 122, 172, 50, CC_MK_FEW[1], popIn(t, cTwenty, 0.45));
      b += MK.pill(680, 172, CC_MK_FEW.length + " pieces", on(t, cTwo, 0.4), { size: 30, col: P.good });
      b += MK.tick(806, 172, 24, popIn(t, cTwo == null ? null : cTwo + 0.25, 0.4));
      b += MK.pill(1000, 172, ccSh(ccSum(CC_MK_FEW)), on(t, cTwo, 0.4), { size: 34, col: P.gold });

      /* seven 10s: the same 70, in seven pieces */
      var n = tally(t, cSeven, CC_MK_TENS.length, 1.5);
      for (k = 0; k < n; k++) b += ccCoin(240 + k * 64, 330, 30, CC_MK_TENS[k], popIn(t, cSeven == null ? null : cSeven + k * 0.21, 0.35));
      b += MK.pill(770, 330, CC_MK_TENS.length + " pieces", on(t, cPieces, 0.4), { size: 30, col: P.line });
      b += MK.pill(1000, 330, ccSh(ccSum(CC_MK_TENS)), on(t, cPieces, 0.4), { size: 34, col: P.gold });
      out += G(b, { opacity: second });
    }
    return svg(out);
  }
