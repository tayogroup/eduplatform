  /* ==== Half Past, Quarter To: the two reading chapters ========================
     tools/lib/film-scenes/math-g2/half-past-quarter-to-2.js - "Quarter past,
     quarter to" and "Counting round in fives". Both drive one face with one
     number, v (minutes since twelve), so the short hand is always where the
     words say it is: at quarter to four (v = 225) it stands three quarters of
     the way from the 3 to the 4, and the chapter says so out loud. */

  /* ==== chapter: quarter past, quarter to =======================================
     The face is cut into quarters, and the long hand walks round it a quarter
     at a time: 3 o'clock, quarter past three, half past three, quarter to
     four. Every stop leaves its name behind, so the three readings end up on
     screen together. Then the short hand is looked at on its own, because that
     is the hand that says whether it is quarter to FOUR or quarter to three. */
  var HP_Q = hpBox(64, 40, 360);

  function hpQuartersChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSplits = c(0, "splits"), cCake = c(0, "cake");
    var cQuarter = c(1, "quarter"), cThree = c(1, "three"), cPast = c(1, "past");
    var cHalf = c(2, "half"), cSix = c(2, "six"), cHalfPast = c(2, "halfpast");
    var cThirds = c(3, "three"), cNine = c(3, "nine"), cTo = c(3, "to");
    var cLook = c(4, "look"), cNearly = c(4, "nearly");
    var cFour = c(5, "four"), cNot = c(5, "not");
    var B = HP_Q, out = "";

    /* three o'clock, then a quarter at a time round to quarter to four */
    var v = 180 + 15 * hpRun(t, cQuarter, 1.1) + 15 * hpRun(t, cHalf, 1.1) + 15 * hpRun(t, cThirds, 1.1);

    out += ART.place(hpClock(v, { quarters: true }), B.x, B.y, B.w, B.h);

    /* the four cuts, drawn as the face is split */
    var split = on(t, cSplits, 0.7);
    for (var q = 0; q < 4; q++) {
      var end = hpPt(B, 1, q * 15), u = clamp(split * 4 - q, 0, 1);
      out += L(B.cx, B.cy, lerp(B.cx, end[0], u), lerp(B.cy, end[1], u), P.gold, 4,
        { opacity: 0.5 * split, "stroke-dasharray": "10 8" });
    }
    out += MK.pop(MK.pic(912, 150, 104, "\u{1F370}"), 912, 150, popIn(t, cCake, 0.45) * hpOnly(t, scene, 0));

    /* the long hand's journey so far, traced behind it */
    out += hpArc(B, HP_TRACE, 0, v - 180, P.gold, HP_TRACE_W, on(t, cQuarter, 0.5));

    /* each quarter's landmark rings as it is named */
    out += hpRingNum(B, 3, P.gold, Math.max(bump(t, cThree, 1.6), 0.6 * hpOnly(t, scene, 1)));
    out += hpRingNum(B, 6, P.gold, Math.max(bump(t, cSix, 1.6), 0.6 * hpOnly(t, scene, 2)));
    out += hpRingNum(B, 9, P.gold, Math.max(bump(t, cNine, 1.6), 0.6 * hpOnly(t, scene, 3)));

    /* the three readings, each named as the hand arrives, each staying after */
    out += hpTag(t, 880, 118, "quarter past 3", cPast, hpHandPt(B, v, "min"), P.gold, 28, hpOnly(t, scene, 1));
    out += hpTag(t, 880, 212, "half past 3", cHalfPast, hpHandPt(B, v, "min"), P.gold, 28, hpOnly(t, scene, 2));
    out += hpTag(t, 880, 306, "quarter to 4", cTo, hpHandPt(B, v, "min"), P.gold, 28, hpOnly(t, scene, 3));

    /* the short hand on its own: lit, with the ground it has covered from the
       3 drawn solid and the ground still to cover to the 4 left dashed */
    var look = on(t, cLook, 0.5) * hpFrom(t, scene, 4);
    if (look > 0) {
      out += hpLitHand(B, v, "hour", P.accent, look);
      out += hpArc(B, HP_HOUR / HP_R + 0.16, 15, 20, P.muted, 5, look, "8 7");
      out += hpArc(B, HP_HOUR / HP_R + 0.16, 15, hpHour(v), P.accent, 7, on(t, cNearly, 0.6) * look);
      out += hpRingNum(B, 4, P.accent, on(t, cNearly, 0.5) * look);
    }

    /* which hour is it quarter to: the short hand decides, and it is nearly 4 */
    var four = popIn(t, cFour, 0.4) * hpFrom(t, scene, 5);
    if (four > 0) out += MK.tick(1092, 306, 24, four);
    var not = popIn(t, cNot, 0.4) * hpFrom(t, scene, 5);
    if (not > 0) {
      out += MK.pill(880, 400, "quarter to 3", Math.min(1, not), { size: 28, col: P.muted });
      out += MK.cross(1092, 400, 24, not);
    }
    return svg(out);
  }

  /* ==== chapter: counting round in fives ========================================
     The same face, showing twenty past three, with the lesson's own minute
     numbers switched on. The count walks 5, 10, 15, 20 round the rim and rings
     the minute number it reaches, so the child sees that the 4 is twenty
     minutes and not four. Then the two halves are named: past on the right, to
     on the left. */
  var HP_F = hpBox(180, 40, 360), HP_FV = 200;   /* twenty past three */
  var HP_COUNT = [5, 10, 15, 20];

  function hpHalfDisc(B, m0, m1, col, o) {
    if (!(o > 0)) return "";
    var a0 = ((m0 * 6 - 90) * Math.PI) / 180, a1 = ((m1 * 6 - 90) * Math.PI) / 180, r = B.r;
    return Pth("M" + n2(B.cx) + "," + n2(B.cy) + " L" + n2(B.cx + r * Math.cos(a0)) + "," + n2(B.cy + r * Math.sin(a0)) +
      " A" + n2(r) + "," + n2(r) + " 0 " + (m1 - m0 > 30 ? 1 : 0) + ",1 " +
      n2(B.cx + r * Math.cos(a1)) + "," + n2(B.cy + r * Math.sin(a1)) + " Z", col, null, null,
      { opacity: 0.2 * clamp(o, 0, 1) });
  }

  function hpFivesChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPoints = c(0, "points"), cCount = c(0, "count"), cFives = c(0, "fives");
    var cues = [c(1, "five"), c(1, "ten"), c(1, "fifteen"), c(1, "twenty")], cPast = c(1, "past");
    var cNotFour = c(2, "notfour"), cEvery = c(2, "every");
    var cRight = c(3, "right"), cIsPast = c(3, "past"), cLeft = c(3, "left"), cIsTo = c(3, "to");
    var B = HP_F, v = HP_FV, out = "";

    out += ART.place(hpClock(v, { minuteNumbers: true }), B.x, B.y, B.w, B.h);

    /* the two halves of the face, named last */
    out += hpHalfDisc(B, 0, 30, P.gold, on(t, cRight, 0.5));
    out += hpHalfDisc(B, 30, 60, P.teal, on(t, cLeft, 0.5));

    /* the long hand points at the 4 */
    out += hpLitHand(B, v, "min", P.accent, Math.max(bump(t, cPoints, 1.6), 0.45 * hpFrom(t, scene, 0)));
    out += hpRingNum(B, 4, P.accent, Math.max(bump(t, cPoints, 1.6), 0.7 * hpOnly(t, scene, 0)));
    /* start at the 12 */
    var start = on(t, cCount, 0.5) * hpFrom(t, scene, 0), top = hpPt(B, HP_TRACE, 0);
    out += C(top[0], top[1], 10, P.gold, null, null, { opacity: start });
    out += hpRingNum(B, 12, P.gold, bump(t, cCount, 1.4));

    /* five at a time: the rim fills, the minute number rings, the count shows */
    var reached = 0, k;
    for (k = 0; k < 4; k++) if (cues[k] != null && t >= cues[k]) reached = k + 1;
    var grown = 0;
    for (k = 0; k < 4; k++) grown += 5 * hpRun(t, cues[k], 0.5);
    out += hpArc(B, HP_TRACE, 0, grown, P.accent, 9, Math.max(on(t, cFives, 0.4) * hpFrom(t, scene, 0), reached ? 1 : 0));
    for (k = 0; k < 4; k++) {
      var p = hpPt(B, (HP_R - 55) / HP_R, (k + 1) * 5);
      out += C(p[0], p[1], 12.5 * B.s, "none", P.accent, 3, { opacity: Math.min(1, popIn(t, cues[k], 0.35)) });
      out += MK.pill(720 + k * 104, 100, String(HP_COUNT[k]), popIn(t, cues[k], 0.4), { size: 30, col: P.accent });
    }
    out += MK.pill(880, 204, "20 minutes past 3", popIn(t, cPast, 0.45) * hpFrom(t, scene, 1), { size: 30, col: P.gold });

    /* not four minutes: the slip the lesson names, crossed out */
    var nf = popIn(t, cNotFour, 0.4) * hpFrom(t, scene, 2) * (1 - hpFrom(t, scene, 3));
    if (nf > 0) {
      out += MK.pill(860, 300, "4 minutes past", Math.min(1, nf), { size: 28, col: P.muted });
      out += MK.cross(1034, 300, 23, nf);
    }
    /* every number is worth five: the first gap, from the 12 to the 1 */
    var ev = on(t, cEvery, 0.5) * hpFrom(t, scene, 2) * (1 - hpFrom(t, scene, 3));
    if (ev > 0) {
      out += hpArc(B, 1.14, 0, 5, P.gold, 8, ev);
      out += MK.pill(860, 390, "5 minutes", Math.min(1, ev), { size: 28, col: P.gold });
      out += MK.tick(1010, 390, 23, popIn(t, cEvery == null ? null : cEvery + 0.35, 0.35) * hpFrom(t, scene, 2));
    }

    /* past on the right, to on the left */
    out += MK.pill(628, 220, "past", popIn(t, cIsPast, 0.4) * hpFrom(t, scene, 3), { size: 34, col: P.gold });
    out += MK.pill(104, 220, "to", popIn(t, cIsTo, 0.4) * hpFrom(t, scene, 3), { size: 34, col: P.teal });
    return svg(out);
  }
