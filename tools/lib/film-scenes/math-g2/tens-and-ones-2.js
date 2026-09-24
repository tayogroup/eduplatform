  /* ==== Tens and Ones, part 2 =================================================
     The chapters "Building other numbers" (the same place-value card, rebuilt
     as 56 and then as 70) and "Round to the nearest 10" (ART.numberLine from
     30 to 40, with the lesson's own decade line, its jumps and its marks).
     See tens-and-ones.js for the coordinate helpers these use. */

  /* ==== chapter: building other numbers =============================================
     One card again, changed twice as the words change it: six cubes, then no
     cubes, then five rods become seven. What each digit is worth is written
     under its own column, and the zero in the ones place is ringed as it is
     named. */
  function taoBuildChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFive = c(0, "five"), cSixCubes = c(0, "six");
    var cTensOnes = c(1, "tensones"), cNum = c(1, "num");
    var cFifty = c(2, "fifty"), cSix = c(2, "six");
    var cAway = c(3, "away"), cSeven = c(3, "seven");
    var cSeventy = c(4, "seventy"), cZero = c(4, "zero");
    var out = "";

    /* which column is lit, and only while its own words are being said */
    var b2 = taoUntil(t, scene, 3);
    var lit = on(t, cZero, 0.3) > 0.5 ? "ones"
      : on(t, cSix, 0.3) * b2 > 0.5 ? "ones"
      : on(t, cFifty, 0.3) * b2 > 0.5 ? "tens" : null;

    /* the card, in its three states: 5 and 6, then 5 and none, then 7 and none */
    var states = [[5, 6], [5, 0], [7, 0]], at = [null, cAway, cSeven], idx = 0;
    if (cAway != null && t >= cAway) idx = 1;
    if (cSeven != null && t >= cSeven) idx = 2;
    var u = idx === 0 ? 1 : on(t, at[idx], 0.4);
    if (idx > 0 && u < 1) out += G(taoPVCard(states[idx - 1][0], states[idx - 1][1], lit), { opacity: 1 - u });
    out += G(taoPVCard(states[idx][0], states[idx][1], lit), { opacity: idx === 0 ? 1 : u });

    /* "Five rods, and six cubes": each group ringed as it is named */
    var b0 = taoOnly(t, scene, 0);
    out += taoRing(taoRodAt, 5, 12, 26, on(t, cFive, 0.4) * b0);
    out += taoRing(taoCubeAt, 6, 12, 12, on(t, cSixCubes, 0.4) * b0);

    /* "5 tens and 6 ones. The number we built is 56." */
    var b1 = taoOnly(t, scene, 1);
    if (b1 > 0) {
      var fl = bump(t, cTensOnes, 0.9);
      if (fl > 0) out += R(taoPX(20), taoPY(20), 150 * TAO_PV.k, 234 * TAO_PV.k, 27, "none", P.gold, 4, { opacity: 0.85 * fl * b1 }) +
        R(taoPX(184), taoPY(20), 150 * TAO_PV.k, 234 * TAO_PV.k, 27, "none", P.gold, 4, { opacity: 0.85 * fl * b1 });
      out += Tx(905, 216, "56", "lab", "middle", { "font-size": 132, fill: P.gold, opacity: popIn(t, cNum, 0.45) * b1 });
      out += Tx(905, 310, "5 tens and 6 ones", "lab big muted", "middle", { opacity: on(t, cTensOnes, 0.5) * b1 });
    }

    /* "The 5 is worth fifty, not five. The 6 is worth only six." */
    var b2o = taoOnly(t, scene, 2);
    if (b2o > 0) {
      out += MK.pill(taoPX(95), taoPY(152), "50", on(t, cFifty, 0.4) * b2o, { size: 34, col: P.gold });
      out += MK.pill(taoPX(259), taoPY(152), "6", on(t, cSix, 0.4) * b2o, { size: 34, col: P.accent });
      out += Tx(812, 216, "50", "lab", "middle", { "font-size": 84, fill: P.gold, opacity: on(t, cFifty, 0.4) * b2o });
      out += Tx(905, 210, "+", "lab", "middle", { "font-size": 60, fill: P.muted, opacity: on(t, cSix, 0.4) * b2o });
      out += Tx(996, 216, "6", "lab", "middle", { "font-size": 84, fill: P.accent, opacity: on(t, cSix, 0.4) * b2o });
      out += Tx(905, 316, "= 56", "lab", "middle", { "font-size": 56, fill: P.ink, opacity: on(t, cSix == null ? null : cSix + 0.7, 0.5) * b2o });
    }

    /* "Take every cube away": the six cubes leave, and two more rods arrive */
    var b3 = taoOnly(t, scene, 3);
    if (b3 > 0) {
      out += taoRing(taoCubeAt, 6, 14, 14, bump(t, cAway, 1.0) * b3);
      out += taoRing(taoRodAt, 7, 12, 26, on(t, cSeven, 0.4) * b3);
    }

    /* "Seven tens and zero ones is 70. The zero holds the ones place." */
    var b4 = taoOnly(t, scene, 4);
    if (b4 > 0) {
      out += Tx(905, 216, "70", "lab", "middle", { "font-size": 132, fill: P.gold, opacity: popIn(t, cSeventy, 0.45) * b4 });
      var z = on(t, cZero, 0.4) * b4;
      if (z > 0) {
        out += C(taoPX(259), taoPY(82), 46, "none", P.accent, 5, { opacity: z });
        out += MK.pill(taoPX(259), taoPY(178), "keeps the place", z, { size: 22, col: P.accent });
      }
      out += Tx(905, 310, "7 tens and 0 ones", "lab big muted", "middle", { opacity: on(t, cSeventy, 0.5) * b4 });
    }
    return svg(out);
  }

  /* ==== chapter: round to the nearest 10 ============================================
     The lesson's own decade line, 30 to 40 with every one marked: 34 put on it,
     four steps back to 30 and six on to 40, and then 35 in the middle, which
     rounds up because five always does.

     The card is placed so that the LINE itself sits at the same height in
     every frame: the library gives the drawing more room above the axis when
     it carries jumps, so the top of the card moves and the axis does not. */
  var TAO_NL = { w: 680, k: 1.4, x: 108, lineY: 300 };
  function taoNLX(v) { return TAO_NL.x + (36 + (v - 30) * 60.8) * TAO_NL.k; }
  function taoNLCard(marks, jumps) {
    var ay = jumps.length ? 116 : 46;
    return ART.place(ART.numberLine({ from: 30, to: 40, step: 1, labelEvery: 10, width: TAO_NL.w, marks: marks, jumps: jumps }),
      TAO_NL.x, TAO_NL.lineY - ay * TAO_NL.k, TAO_NL.w * TAO_NL.k, (ay + 62) * TAO_NL.k);
  }
  /* a gold box round the number written under a tick */
  function taoTickBox(v, o) {
    if (!(o > 0)) return "";
    return R(taoNLX(v) - 46, 317, 92, 56, 14, "none", P.gold, 4, { opacity: clamp(o, 0, 1) });
  }

  function taoRoundChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cNearest = c(0, "nearest"), cLine = c(0, "line");
    var cPut = c(1, "put"), cBetween = c(1, "between");
    var cBack = c(2, "back"), cOn = c(2, "on");
    var cFewer = c(3, "fewer"), cDown = c(3, "down");
    var cMiddle = c(4, "middle"), cUp = c(4, "up");
    var k = i - scene.first, out = "";

    var marks = [], jumps = [];
    if (k === 4) {
      marks = [{ at: 35, colour: "plum", label: "35" }];
      if (cUp != null && t >= cUp) jumps = [{ from: 35, to: 40, label: "5 on", colour: "plum" }];
      else if (cMiddle != null && t >= cMiddle) jumps = [{ from: 35, to: 30, label: "5", colour: "muted" }, { from: 35, to: 40, label: "5", colour: "muted" }];
    } else if (k >= 1) {
      marks = [{ at: 34, colour: "accent", label: "34" }];
      if (k >= 2) {
        if (k > 2 || (cBack != null && t >= cBack)) jumps.push({ from: 34, to: 30, label: "4 back", colour: "teal" });
        if (k > 2 || (cOn != null && t >= cOn)) jumps.push({ from: 34, to: 40, label: "6 on", colour: "plum" });
      }
    }
    out += G(taoNLCard(marks, jumps), { opacity: on(t, BEATS[scene.first].start - GAP, 0.7) });

    /* "the nearest ten", said before the line is there */
    var b0 = taoOnly(t, scene, 0);
    if (b0 > 0) {
      out += MK.pill(584, 92, "the nearest ten", on(t, cNearest, 0.4) * b0, { size: 32, col: P.gold });
      out += MK.ripple(taoNLX(30), TAO_NL.lineY, t, cLine, P.gold);
      out += MK.ripple(taoNLX(40), TAO_NL.lineY, t, cLine == null ? null : cLine + 0.25, P.gold);
    }
    /* "Put 34 on it. It sits between 30 and 40." */
    var b1 = taoOnly(t, scene, 1);
    if (b1 > 0) {
      out += MK.ripple(taoNLX(34), TAO_NL.lineY, t, cPut, P.accent);
      out += taoTickBox(30, on(t, cBetween, 0.4) * b1);
      out += taoTickBox(40, on(t, cBetween == null ? null : cBetween + 0.45, 0.4) * b1);
    }
    /* "Count back four steps to reach 30. Count on six steps to reach 40."
       The two jumps above are what those cues draw; nothing is written twice. */
    /* "Four is fewer than six. So 34 rounds down to 30, not up." */
    var b3 = taoOnly(t, scene, 3);
    if (b3 > 0) {
      out += Tx(584, 104, "4 is fewer than 6", "lab", "middle", { "font-size": 40, fill: P.ink, opacity: on(t, cFewer, 0.4) * b3 });
      out += taoTickBox(30, on(t, cDown, 0.4) * b3);
      out += MK.tick(taoNLX(30), 412, 22, popIn(t, cDown, 0.45) * b3);
    }
    /* "35 sits right in the middle. Five always rounds up, to 40." */
    var b4 = taoOnly(t, scene, 4);
    if (b4 > 0) {
      out += MK.pill(584, 96, "exactly in the middle", on(t, cMiddle, 0.4) * b4, { size: 30, col: P.muted });
      out += taoTickBox(40, on(t, cUp, 0.4) * b4);
      out += MK.tick(taoNLX(40), 412, 22, popIn(t, cUp, 0.45) * b4);
    }
    return svg(out);
  }
