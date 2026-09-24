  /* ==== Big Numbers and Below Zero, part 2 ====================================
     The two chapters that move a digit between columns: regrouping 4,208 as
     3 thousands and 12 hundreds, and multiplying 34 by 10 and by 100. Both
     use the chart from part 1, with the digits on a layer of their own, so
     what the child watches is a digit CHANGING COLUMN rather than a zero
     being stuck on the end - which is the misconception the lesson names. */

  /* ---- chapter: the same number, regrouped -------------------------------- */
  var BN_R_NAMES = ["THOUSANDS", "HUNDREDS", "TENS", "ONES"];
  var BN_R_CX = 700, BN_R_Y = 170, BN_R_H = 200, BN_R_BASE = 170 + 200 - 52;

  function bnRegroupChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cHere = c(0, "here"), cTh = c(0, "th"), cHu = c(0, "hu"), cTe = c(0, "te"), cOn = c(0, "on");
    var cSwap = c(1, "swap"), cTen = c(1, "ten"), cName = c(1, "name");
    var cTh3 = c(2, "th3"), cH12 = c(2, "h12"), cO8 = c(2, "o8");
    var cStill = c(3, "still"), cStored = c(3, "stored"), cWorth = c(3, "worth");
    var out = "", k;

    var mid = [];
    for (k = 0; k < 4; k++) mid.push(bnColMid(4, k, BN_R_CX));

    /* the columns arrive as the number is read out, then light as each is named */
    var show = [], lit = [], firstCue = [cTh, cHu, cTe, cOn], againCue = [cTh3, cH12, null, cO8];
    for (k = 0; k < 4; k++) {
      show.push(on(t, cHere == null ? null : cHere + k * 0.12, 0.4));
      var nextFirst = k < 3 ? firstCue[k + 1] : null;
      var nextAgain = k < 3 ? againCue[k + 1] : null;
      var a = on(t, firstCue[k], 0.3) * (nextFirst == null ? 1 : 1 - on(t, nextFirst, 0.3));
      var b = on(t, againCue[k], 0.3) * (nextAgain == null ? 1 : 1 - on(t, nextAgain, 0.3));
      lit.push(Math.max(a * bnOnly(t, scene, 0), b * bnOnly(t, scene, 2)));
    }
    out += bnChart(BN_R_NAMES, BN_R_Y, BN_R_H, { lit: lit, show: show, cx: BN_R_CX });

    /* the digits: 4 2 0 8, and then 3 and 12 */
    var uTh = on(t, cSwap == null ? null : cSwap + 0.95, 0.45);
    var uHu = on(t, cTen == null ? null : cTen + 0.9, 0.4);   /* 12 only once all ten blocks are there */
    out += bnDigit(mid[0], BN_R_BASE, "4", popIn(t, cTh, 0.4) * (1 - uTh));
    out += bnDigit(mid[0], BN_R_BASE, "3", uTh, 92, BN_C.accent);
    out += bnDigit(mid[1], BN_R_BASE, "2", popIn(t, cHu, 0.4) * (1 - uHu));
    out += bnDigit(mid[1], BN_R_BASE, "12", uHu, 92, BN_C.accent);
    out += bnDigit(mid[2], BN_R_BASE, "0", popIn(t, cTe, 0.4));
    out += bnDigit(mid[3], BN_R_BASE, "8", popIn(t, cOn, 0.4));

    /* one thousand lifts out of its column and crosses to the hundreds */
    var tokO = on(t, cSwap, 0.4) * (1 - on(t, cTen, 0.35));
    if (tokO > 0) {
      var travel = on(t, cSwap == null ? null : cSwap + 0.35, 0.7);
      var tx = lerp(mid[0], mid[1], travel), ty = 126 - 16 * Math.sin(Math.PI * travel);
      out += G(R(tx - 58, ty - 24, 116, 48, 12, P.gold) +
        Tx(tx, ty + 9, "1,000", "lab", "middle", { "font-size": 27, fill: "#2B2000" }), { opacity: tokO });
    }
    /* and becomes ten hundreds, one at a time */
    var chips = tally(t, cTen, 10, 0.9);
    for (k = 0; k < chips; k++) {
      var cxk = mid[1] - 92 + (k % 5) * 38, cyk = 98 + Math.floor(k / 5) * 38;
      out += R(cxk, cyk, 32, 32, 7, P.gold, "#8A6E10", 2);
    }
    if (chips > 0) out += Tx(mid[1], 82, "ten hundreds", "lab mid muted", "middle");
    /* "That swap is called regrouping" */
    out += MK.pill(950, 126, "regrouping", on(t, cName, 0.4), { size: 24, col: P.plum });

    /* the number, unchanged, on the left */
    out += G(Tx(190, 160, "4,208", "lab", "middle", { "font-size": 62, fill: P.ink }), { opacity: on(t, cHere, 0.5) });
    out += MK.tick(190, 228, 28, popIn(t, cStill, 0.4));
    out += MK.pill(190, 300, "stored differently", on(t, cStored, 0.4), { size: 22, col: P.plum });
    out += MK.pill(190, 356, "same value", on(t, cWorth, 0.4), { size: 22, col: P.gold });

    /* what the regrouped columns add up to */
    out += G(Tx(BN_R_CX, 416, "3,000 + 1,200 + 8 = 4,208", "lab", "middle", { "font-size": 34, fill: P.gold }),
      { opacity: on(t, cStill, 0.5) });
    return svg(out);
  }

  /* ---- chapter: ten times, a hundred times --------------------------------
     34 in the tens and ones columns, sliding one column left for times 10 and
     two columns left for times 100. The two are drawn separately and
     crossfaded on the last beat, so the digits start from 34 both times. */
  var BN_X_NAMES = ["THOUSANDS", "HUNDREDS", "TENS", "ONES"];
  var BN_X_Y = 170, BN_X_H = 200, BN_X_BASE = 170 + 200 - 52;

  function bnXmid(k) { return bnColMid(4, k); }

  /* the arrows that say "one place to the left", one per digit that moves */
  function bnLeftArrows(from, to, u, col) {
    if (!(u > 0)) return "";
    var out = "", k;
    for (k = 0; k < from.length; k++) {
      out += MK.arrow(bnXmid(from[k]) - 12, 148, bnXmid(to[k]) + 12, 148, u, col || P.gold, 6);
    }
    return out;
  }

  /* beat 1 ("Take 34 times 10...") split in two for the lead's length note,
     so "four" now reads the new beat 2 and "ans"/"fill" moved to beat 3. */
  function bnTenX10(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cMult = c(0, "mult"), cNoZero = c(0, "nozero"), cLeft = c(0, "left");
    var cTake = c(1, "take"), cThree = c(1, "three"), cFour = c(2, "four");
    var cAns = c(3, "ans"), cFill = c(3, "fill");
    var out = "", lit = [0, 0, 0, 0];

    lit[1] = on(t, cThree, 0.35) * (1 - on(t, cFour, 0.35));
    lit[2] = on(t, cFour, 0.35) * (1 - on(t, cFill, 0.35));
    lit[3] = on(t, cFill, 0.35);
    out += bnChart(BN_X_NAMES, BN_X_Y, BN_X_H, { lit: lit });

    /* "does not add a zero", crossed out */
    var wrongO = on(t, cMult, 0.4) * (1 - on(t, cLeft, 0.45));
    if (wrongO > 0) {
      out += MK.pill(584, 76, "34 then add a zero", wrongO, { size: 26, col: P.bad, ink: P.bad });
      out += MK.cross(790, 76, 32, popIn(t, cNoZero, 0.4) * wrongO);
    }
    /* "Every digit moves one place to the left" */
    out += bnLeftArrows([2, 3], [1, 2], on(t, cLeft, 0.6) * (1 - on(t, cAns, 0.5)));

    /* the digits: 3 slides tens -> hundreds, 4 slides ones -> tens */
    var u3 = on(t, cThree, 0.75), u4 = on(t, cFour, 0.75);
    var appear = popIn(t, cMult == null ? null : cMult + 0.35, 0.4);
    out += bnDigit(lerp(bnXmid(2), bnXmid(1), u3), BN_X_BASE, "3", appear);
    out += bnDigit(lerp(bnXmid(3), bnXmid(2), u4), BN_X_BASE, "4", popIn(t, cMult == null ? null : cMult + 0.5, 0.4));
    /* the zero only fills the empty ones column */
    var zo = popIn(t, cFill, 0.45);
    if (zo > 0) out += bnDigit(bnXmid(3), BN_X_BASE - 24 * (1 - Math.min(zo, 1)), "0", zo, 92, BN_C.muted);

    var ansO = on(t, cAns, 0.5);
    out += G(Tx(584, 416, "34 × 10", "lab", "middle", { "font-size": 40, fill: P.ink }),
      { opacity: on(t, cTake, 0.5) * (1 - ansO) });
    out += G(Tx(584, 416, "34 × 10 = 340", "lab", "middle", { "font-size": 40, fill: P.gold }), { opacity: ansO });
    return out;
  }

  function bnTenX100(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTwo = c(4, "two"), cBig = c(4, "big");
    var out = "", lit = [0, 0, 0, 0];
    var u = on(t, cTwo == null ? null : cTwo + 0.2, 0.9);
    lit[0] = u; lit[1] = u;
    out += bnChart(BN_X_NAMES, BN_X_Y, BN_X_H, { lit: lit });
    out += bnLeftArrows([2, 3], [0, 1], on(t, cTwo, 0.6));
    out += bnDigit(lerp(bnXmid(2), bnXmid(0), u), BN_X_BASE, "3", 1);
    out += bnDigit(lerp(bnXmid(3), bnXmid(1), u), BN_X_BASE, "4", 1);
    var zo = popIn(t, cBig, 0.4);
    if (zo > 0) {
      out += bnDigit(bnXmid(2), BN_X_BASE, "0", zo, 92, BN_C.muted);
      out += bnDigit(bnXmid(3), BN_X_BASE, "0", popIn(t, cBig == null ? null : cBig + 0.14, 0.4), 92, BN_C.muted);
    }
    out += G(Tx(584, 416, "34 × 100 = 3,400", "lab", "middle", { "font-size": 40, fill: P.gold }),
      { opacity: on(t, cBig, 0.5) });
    return out;
  }

  function bnTenTimesChapter(scene, beat, t, i) {
    var swap = bnFrom(t, scene, 4), out = "";
    if (swap < 1) out += G(bnTenX10(scene, t), { opacity: 1 - swap });
    if (swap > 0) out += G(bnTenX100(scene, t), { opacity: swap });
    return svg(out);
  }
