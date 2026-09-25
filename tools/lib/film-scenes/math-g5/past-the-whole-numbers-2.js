
  /* ==== Past the Whole Numbers, part 2 ===========================================
     The chapters "Negative numbers" and "Rounding". Both lean on ART.numberLine,
     whose own X(v) mapping is replicated here (PTW_N_* / PTW_R_*) so the extra
     spans, spans and rings drawn on top land on the exact tick the library drew -
     the same technique the Grade 4 example uses for ART.compass and ART.grid. */

  /* ---- the negative-numbers line -------------------------------------------
     ART.numberLine with no jumps: jumps are the one option that changes the
     card's height, and this chapter reveals marks beat by beat, so leaving
     jumps out keeps the card the same size on every frame. width 900, pad 36,
     so X(v) = 36 + ((v + 10) / 20) * 828, placed at (44, 150) scaled 1.15. */
  var PTW_N = { x: 44, y: 150, s: 1.15, pad: 36, w: 900, from: -10, to: 10 };
  function ptwNX(v) { return PTW_N.x + (PTW_N.pad + ((v - PTW_N.from) / (PTW_N.to - PTW_N.from)) * (PTW_N.w - 2 * PTW_N.pad)) * PTW_N.s; }
  var PTW_N_AY = PTW_N.y + 46 * PTW_N.s;

  function ptwNegativeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cZero2 = c(0, "zero2"), cNeg = c(0, "neg");
    var cMorning = c(1, "morning"), cNight = c(1, "night");
    var cEight = c(2, "eight"), cStepsDown = c(2, "stepsDown"), cMore = c(2, "more");
    var cSide = c(3, "side"), cBig = c(3, "big");
    var cLower = c(4, "lower"), cBigger = c(4, "bigger");
    var out = "", k;

    var lateChapter = ptwOnly(t, scene, 4);
    var marks = [];
    if (lateChapter > 0.02) {
      marks.push({ at: -7, label: "-7", colour: "plum" });
      marks.push({ at: -3, label: "-3", colour: "teal" });
    } else {
      if (cMorning != null && t >= cMorning) marks.push({ at: 5, label: "5°C", colour: "accent" });
      if (cNight != null && t >= cNight) marks.push({ at: -3, label: "-3°C", colour: "teal" });
    }
    out += ART.place(ART.numberLine({ from: PTW_N.from, to: PTW_N.to, step: 1, labelEvery: 5, width: PTW_N.w, marks: marks }),
      PTW_N.x, PTW_N.y, PTW_N.w * PTW_N.s, 108 * PTW_N.s);

    /* beat 0: a marker counts down from 5 to -3, past zero, and three ticks
       pop as it passes -1, -2, -3 */
    var runU = ptwStep(t, cNeg, 1.3);
    var atV = 5 - runU * 8;
    if (cNeg != null && t >= (cZero2 || 0) - 5) {
      out += C(ptwNX(atV), PTW_N_AY, 12, P.gold, P.ground, 3, { opacity: on(t, cZero2, 0.5) * ptwOnly(t, scene, 0) });
      var reached = tally(t, cNeg, 3, 1.3);
      for (k = 1; k <= reached; k++) out += C(ptwNX(-k), PTW_N_AY, 6, P.plum, null, null, { opacity: ptwOnly(t, scene, 0) });
    }

    /* beat 2: the 8-degree gap, split into the two halves the words say - held
       to its own beat, so it does not linger once beat 3 starts */
    var beat2On = ptwOnly(t, scene, 2);
    if (beat2On > 0.02) {
      var stepsO = on(t, cStepsDown, 0.6), moreO = on(t, cMore, 0.6), eightO = on(t, cEight, 0.5);
      var seg2 = "";
      if (stepsO > 0) seg2 += MK.arrow(ptwNX(5), PTW_N_AY - 34, ptwNX(0), PTW_N_AY - 34, stepsO, P.gold, 5);
      if (moreO > 0) seg2 += MK.arrow(ptwNX(0), PTW_N_AY - 34, ptwNX(-3), PTW_N_AY - 34, moreO, P.plum, 5);
      if (eightO > 0) seg2 += MK.pill(ptwNX(1), PTW_N_AY - 62, "8 degrees", eightO, { size: 26, col: P.good, anchor: "middle" });
      out += G(seg2, { opacity: Math.min(1, beat2On) });
    }

    /* beat 3: which side of zero - two short arrows out from the middle,
       held to its own beat the same way */
    var beat3On = ptwOnly(t, scene, 3);
    if (beat3On > 0.02) {
      var sideO = on(t, cSide, 0.7);
      if (sideO > 0) {
        var seg3 = MK.arrow(ptwNX(0), PTW_N_AY + 46, ptwNX(4), PTW_N_AY + 46, sideO, P.gold, 6) +
          MK.arrow(ptwNX(0), PTW_N_AY + 46, ptwNX(-4), PTW_N_AY + 46, sideO, P.plum, 6) +
          Tx(ptwNX(4), PTW_N_AY + 70, "bigger", "lab mid muted readable", "middle", { opacity: sideO }) +
          Tx(ptwNX(-4), PTW_N_AY + 70, "smaller", "lab mid muted readable", "middle", { opacity: sideO });
        out += G(seg3, { opacity: Math.min(1, beat3On) });
      }
    }

    /* beat 4: -7 lower than -3, even though 7 > 3 */
    var lowerO = on(t, cLower, 0.6);
    if (lowerO > 0) {
      out += MK.pill(ptwNX(-7), PTW_N_AY - 60, "lower", lowerO, { size: 26, col: P.plum, anchor: "middle" });
      out += MK.arrow(ptwNX(-3), PTW_N_AY - 34, ptwNX(-7), PTW_N_AY - 34, lowerO, P.plum, 5);
    }
    var biggerO = on(t, cBigger, 0.6);
    if (biggerO > 0) out += MK.pill(584, 330, "7 is bigger than 3 - but -7 is lower", biggerO, { size: 24, col: P.bad, anchor: "middle" });
    return svg(out);
  }

  /* ---- the two rounding lines ------------------------------------------- */
  var PTW_R1 = { x: 90, y: 70, s: 1.05, pad: 36, w: 520, from: 140, to: 160 };
  var PTW_R2 = { x: 90, y: 235, s: 1.05, pad: 36, w: 520, from: 100, to: 200 };
  function ptwR1X(v) { return PTW_R1.x + (PTW_R1.pad + ((v - PTW_R1.from) / (PTW_R1.to - PTW_R1.from)) * (PTW_R1.w - 2 * PTW_R1.pad)) * PTW_R1.s; }
  var PTW_R3 = { x: 620, y: 150, s: 1.05, pad: 36, w: 520, from: 3, to: 6 };
  function ptwR3X(v) { return PTW_R3.x + (PTW_R3.pad + ((v - PTW_R3.from) / (PTW_R3.to - PTW_R3.from)) * (PTW_R3.w - 2 * PTW_R3.pad)) * PTW_R3.s; }

  function ptwRoundingChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOne = c(0, "one"), cAfter = c(0, "after");
    var cOneFortyNine = c(1, "oneFortyNine"), cOneFifty = c(1, "oneFifty");
    var cStraight = c(2, "straight"), cNotTwice = c(2, "notTwice"), cOneHundred = c(2, "oneHundred"), cNotTwoHundred = c(2, "notTwoHundred");
    var cHalfway = c(3, "halfway");
    var cThreeSeven = c(4, "threeSeven"), cFourFive = c(4, "fourFive"), cNotFour = c(4, "notFour");
    var out = "";

    /* beat 0: look at just one digit - a generic highlighted digit and a glass */
    var introOn = ptwOnly(t, scene, 0);
    if (introOn > 0.02) {
      out += G(ptwTile(544, 150, "4", true, 90), { opacity: introOn });
      out += MK.pic(544 + 45, 150 - 40, 70, "\u{1F50D}", { opacity: on(t, cAfter, 0.6) * introOn });
      out += MK.pill(584, 300, "just one digit", on(t, cOne, 0.5) * introOn, { size: 28, col: P.accent, anchor: "middle" });
    }

    /* beats 1-2: 149 to the nearest ten, then straight to the nearest hundred */
    var lineOn = ptwOnly(t, scene, 1) + ptwOnly(t, scene, 2);
    if (lineOn > 0.02) {
      var m1 = (cOneFortyNine != null && t >= cOneFortyNine) ? [{ at: 149, label: "149", colour: "accent" }] : [];
      out += ART.place(ART.numberLine({ from: PTW_R1.from, to: PTW_R1.to, step: 10, width: PTW_R1.w, marks: m1 }),
        PTW_R1.x, PTW_R1.y, PTW_R1.w * PTW_R1.s, 108 * PTW_R1.s);
      var fiftyO = on(t, cOneFifty, 0.5);
      if (fiftyO > 0) out += MK.pill(870, 110, "nearest ten: 150", fiftyO, { size: 26, col: P.good });

      var showHund = ptwOnly(t, scene, 2);
      if (showHund > 0.02) {
        var m2 = (cOneHundred != null && t >= cOneHundred) ? [{ at: 149, label: "149", colour: "accent" }] : [];
        out += G(ART.place(ART.numberLine({ from: PTW_R2.from, to: PTW_R2.to, step: 50, width: PTW_R2.w, marks: m2 }),
          PTW_R2.x, PTW_R2.y, PTW_R2.w * PTW_R2.s, 108 * PTW_R2.s), { opacity: Math.min(1, showHund) });
        var straightO = on(t, cStraight, 0.6);
        if (straightO > 0) out += MK.pill(870, 260, "straight from 149", straightO, { size: 24, col: P.gold });
        var hO = on(t, cOneHundred, 0.5);
        if (hO > 0) out += MK.pill(870, 320, "nearest hundred: 100", hO, { size: 26, col: P.good });
        var notTwoO = on(t, cNotTwoHundred, 0.5);
        if (notTwoO > 0) {
          out += MK.pill(870, 380, "not 200", notTwoO, { size: 22, col: P.bad });
        }
      }
    }

    /* beat 3: exactly halfway rounds up - a generic balance, no new digits */
    var halfOn = ptwOnly(t, scene, 3);
    if (halfOn > 0.02) {
      var cxh = 584, cyh = 190, armO = on(t, cHalfway, 0.7);
      out += C(cxh, cyh, 10, P.ink, P.gold, 3, { opacity: halfOn });
      if (armO > 0) {
        out += MK.arrow(cxh, cyh, cxh - 190, cyh, armO, P.line, 6);
        out += MK.arrow(cxh, cyh, cxh + 190, cyh, armO, P.gold, 6);
        out += Tx(cxh - 190, cyh - 30, "down", "lab big muted readable", "middle", { opacity: armO });
        out += Tx(cxh + 190, cyh - 30, "UP", "lab big", "middle", { opacity: armO, fill: P.gold });
        out += MK.pill(cxh, cyh + 90, "exactly halfway rounds up", armO, { size: 28, col: P.gold, anchor: "middle" });
      }
    }

    /* beat 4: the same rule on decimals - 3.7 to 4, 4.5 to 5 */
    var decOn = ptwOnly(t, scene, 4);
    if (decOn > 0.02) {
      var m3 = [];
      if (cThreeSeven != null && t >= cThreeSeven) m3.push({ at: 3.7, label: "3.7", colour: "accent" });
      if (cFourFive != null && t >= cFourFive) m3.push({ at: 4.5, label: "4.5", colour: "teal" });
      out += G(ART.place(ART.numberLine({ from: PTW_R3.from, to: PTW_R3.to, step: 1, width: PTW_R3.w, marks: m3 }),
        PTW_R3.x, PTW_R3.y, PTW_R3.w * PTW_R3.s, 108 * PTW_R3.s), { opacity: decOn });
      out += G(ptwTile(90, 70, "4", false, 90), { opacity: on(t, cThreeSeven, 0.5) * decOn });
      out += G(ptwTile(90, 190, "5", false, 90), { opacity: on(t, cFourFive, 0.5) * decOn });
      var notFourO = on(t, cNotFour, 0.5);
      if (notFourO > 0) {
        out += G(ptwTile(90, 310, "4", false, 90), { opacity: notFourO * 0.7 });
        out += MK.cross(90 + 45, 310 + 48, 34, notFourO, P.bad);
      }
    }
    return svg(out);
  }
