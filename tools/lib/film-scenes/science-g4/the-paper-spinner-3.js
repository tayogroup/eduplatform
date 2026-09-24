
  /* ==== chapters: the three drops, and recording them ===========================
     tools/lib/film-scenes/science-g4/the-paper-spinner-3.js. */

  /* ---- drop each one three times --------------------------------------------------
     The lesson's OWN experiment, drawn by the lesson: ART.sim("spinner", "draw",
     n, y, big, m) is SIMS.spinner.draw, the picture the child drops and times
     two steps later. y is where the spinner hangs (20 held up, 160 landed), n
     and m are how many of each spinner's three times are written up, and big
     swaps the 16 px wings for 32 px ones. So the numbers that appear are the
     lesson's own - 2.1, 2.3, 2.0 and 2.8, 3.0, 2.7 - written as they are said. */
  var PSP_SIM = { x: 24, y: 26, k: 1.75 };                 /* 320 x 220 drawn at 560 x 385 */
  function pspMX(v) { return PSP_SIM.x + v * PSP_SIM.k; }
  function pspMY(v) { return PSP_SIM.y + v * PSP_SIM.k; }
  var PSP_HELD = 20, PSP_LANDED = 160;

  /* Where the spinner hangs at t, given the times at which each drop lands: it
     falls for 0.8 s into each landing, rests, and is picked up again before the
     next. After the last landing it stays on the floor. */
  function pspDropY(t, cues) {
    for (var k = 0; k < cues.length; k++) {
      var land = cues[k];
      if (land == null) continue;
      var next = null;
      for (var j = k + 1; j < cues.length; j++) if (cues[j] != null) { next = cues[j]; break; }
      if (t < land - 0.8) return PSP_HELD;
      if (t < land) return lerp(PSP_HELD, PSP_LANDED, ease((t - (land - 0.8)) / 0.8));
      if (t < land + 0.5) return PSP_LANDED;
      if (next == null) return PSP_LANDED;
      if (t < next - 0.8) return lerp(PSP_LANDED, PSP_HELD, ease(clamp((t - (land + 0.5)) / 0.45, 0, 1)));
    }
    return PSP_HELD;
  }
  function pspCount(t, cues) {
    var n = 0;
    for (var k = 0; k < cues.length; k++) if (cues[k] != null && t >= cues[k]) n++;
    return n;
  }
  /* a square bracket under a row of readings, drawing itself left to right */
  function pspBrace(x1, x2, y, u, col) {
    if (!(u > 0)) return "";
    return Pth("M" + n2(x1) + "," + n2(y - 10) + " L" + n2(x1) + "," + n2(y) +
      " L" + n2(lerp(x1, x2, clamp(u, 0, 1))) + "," + n2(y) +
      (u >= 1 ? " L" + n2(x2) + "," + n2(y - 10) : ""), null, col || P.gold, 4);
  }

  function pspRepeatChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPredict = c(0, "predict"), cLonger = c(0, "longer"), cPickS = c(0, "small"), cPickB = c(0, "big");
    var cOnce = c(1, "once"), cThumb = c(1, "thumb"), cDraught = c(1, "draught");
    var cWrong = c(2, "wrong"), cThree = c(2, "three"), cHeight = c(2, "height");
    var cSmall = c(3, "small"), cD1 = c(3, "d1"), cD2 = c(3, "d2"), cD3 = c(3, "d3");
    var cBig = c(4, "big"), cB1 = c(4, "b1"), cB2 = c(4, "b2"), cB3 = c(4, "b3");
    var cClose = c(5, "close"), cNormal = c(5, "normal"), cReliable = c(5, "reliable");

    var onBig = pspFrom(t, scene, 4) > 0.5;
    var n = pspCount(t, [cD1, cD2, cD3]), m = pspCount(t, [cB1, cB2, cB3]);
    var y = onBig ? pspDropY(t, [cB1, cB2, cB3]) : pspDropY(t, [cOnce, cD1, cD2, cD3]);
    var out = "";

    /* the lesson's own drawing, whole, with room round it */
    out += R(14, 16, 580, 405, 18, P.card, P.line, 2);
    out += ART.place(onBig ? ART.sim("spinner", "draw", 3, y, true, m) : ART.sim("spinner", "draw", n, y, false),
      PSP_SIM.x, PSP_SIM.y, 560, 385);

    /* beat 2: one drop, and the one number it gives - then doubted */
    var lone = on(t, cOnce == null ? null : cOnce + 0.9, 0.4) * pspUntil(t, scene, 3);
    if (lone > 0) {
      out += MK.pill(292, 250, "2.1 s", Math.min(1, lone), { size: 26, col: P.gold, ink: P.gold });
      out += MK.cross(292, 250, 30, popIn(t, cWrong, 0.4) * pspUntil(t, scene, 3));
    }
    /* a slow thumb and a draught: the wind crosses the card at the spinner */
    var gust = bump(t, cDraught, 1.6);
    if (gust > 0) for (var w = 0; w < 3; w++)
      out += L(lerp(560, 300, gust), 244 + w * 26, lerp(430, 180, gust), 244 + w * 26, P.blue, 5,
        { opacity: gust * 0.85, "stroke-dasharray": "22 14" });
    /* "from the same height": the release line the lesson's drop starts from */
    var ht = on(t, cHeight, 0.5) * pspUntil(t, scene, 3);
    if (ht > 0) {
      out += L(32, pspMY(PSP_HELD), lerp(32, 320, ht), pspMY(PSP_HELD), P.gold, 4, { "stroke-dasharray": "14 10" });
      out += MK.pill(150, 104, "same height", Math.min(1, on(t, cHeight == null ? null : cHeight + 0.3, 0.4)), { size: 20, col: P.gold, ink: P.gold });
    }

    /* ---- the panel on the right, three pictures in turn ---- */
    var toB = into(t, scene.first + 1), toC = into(t, scene.first + 3);

    /* predict */
    if (toB < 1) {
      var pa = "", pp = popIn(t, cPredict, 0.45), spin = cPredict == null || t < cPredict ? 0 : (t - cPredict) * 3.0;
      pa += pspSpinner(740, 143, 2.0, PSP_WING_SMALL, spin, pp);
      pa += pspSpinner(930, 143, 2.0, PSP_WING_BIG, spin + 0.7, pp);
      pa += pspWingRing(740, 143, 2.0, PSP_WING_SMALL, on(t, cPickS, 0.4));
      pa += pspWingRing(930, 143, 2.0, PSP_WING_BIG, on(t, cPickB, 0.4));
      pa += MK.pill(740, 262, "small", Math.min(1, pp), { size: 24, col: cPickS != null && t >= cPickS ? P.gold : P.line });
      pa += MK.pill(930, 262, "big", Math.min(1, pp), { size: 24, col: cPickB != null && t >= cPickB ? P.gold : P.line });
      pa += MK.qmark(1078, 150, 44, popIn(t, cPredict == null ? null : cPredict + 0.4, 0.4));
      /* "takes longer": the stopwatch that will answer it, between the two */
      var lg = popIn(t, cLonger, 0.45);
      pa += MK.pop(Em(835, 340, 116, "⏱️"), 835, 340, lg);
      pa += MK.leader(790, 296, 752, 216, on(t, cLonger == null ? null : cLonger + 0.2, 0.5), P.gold);
      pa += MK.leader(880, 296, 918, 216, on(t, cLonger == null ? null : cLonger + 0.35, 0.5), P.gold);
      out += G(pa, { opacity: 1 - toB });
    }
    /* what can go wrong with one drop */
    if (toB > 0 && toC < 1) {
      var pb = "";
      pb += MK.pop(Em(740, 160, 124, "\u{1F44D}"), 740, 160, popIn(t, cThumb, 0.45));
      pb += MK.pop(Em(1000, 160, 124, "\u{1F32C}️"), 1000, 160, popIn(t, cDraught, 0.45));
      var seen = tally(t, cThree, 3, 0.8);
      for (var k = 0; k < 3; k++) {
        if (k >= seen) continue;
        var px = 720 + k * 145, pk = popIn(t, cThree == null ? null : cThree + k * 0.4, 0.4);
        pb += MK.pop(MK.pic(px, 334, 84, ART.ICONS.spinner), px, 334, pk);
        pb += MK.pop(Tx(px, 412, String(k + 1), "lab big gold", "middle"), px, 402, pk);
      }
      out += G(pb, { opacity: toB * (1 - toC) });
    }
    /* the two sets of three, and what they add up to */
    if (toC > 0) {
      var pc = "", spin2 = (t - (cSmall == null ? t : cSmall)) * 2.4;
      var small = [["2.1 s", cD1], ["2.3 s", cD2], ["2.0 s", cD3]];
      var bigs = [["2.8 s", cB1], ["3.0 s", cB2], ["2.7 s", cB3]];
      var ringS = on(t, cClose, 0.5), ringB = on(t, cClose == null ? null : cClose + 0.25, 0.5);
      /* each set is headed by its own spinner, arriving as that spinner is named */
      pc += G(pspSpinner(668, 98, 1.8, PSP_WING_SMALL, spin2, 1), { transform: around(668, 98, Math.min(1.08, popIn(t, cSmall, 0.4))), opacity: clamp(on(t, cSmall, 0.4), 0, 1) });
      pc += G(pspSpinner(668, 254, 1.8, PSP_WING_BIG, spin2 + 0.7, 1), { transform: around(668, 254, Math.min(1.08, popIn(t, cBig, 0.4))), opacity: clamp(on(t, cBig, 0.4), 0, 1) });
      for (var q = 0; q < 3; q++) {
        var qx = 790 + q * 140;
        pc += MK.pill(qx, 96, small[q][0], Math.min(1, popIn(t, small[q][1], 0.4)), { size: 26, col: ringS > 0.4 ? P.gold : P.line });
        pc += MK.pill(qx, 252, bigs[q][0], Math.min(1, popIn(t, bigs[q][1], 0.4)), { size: 26, col: ringB > 0.4 ? P.gold : P.line });
      }
      pc += pspBrace(736, 1124, 140, ringS) + pspBrace(736, 1124, 296, ringB);
      pc += MK.pill(858, 180, "about 2.1 s", Math.min(1, popIn(t, cNormal, 0.4)), { size: 24, col: P.gold, ink: P.gold });
      pc += MK.pill(858, 336, "about 2.8 s", Math.min(1, popIn(t, cNormal == null ? null : cNormal + 0.3, 0.4)), { size: 24, col: P.gold, ink: P.gold });
      var rel = popIn(t, cReliable, 0.4);
      pc += MK.tick(1064, 180, 24, rel) + MK.tick(1064, 336, 24, popIn(t, cReliable == null ? null : cReliable + 0.2, 0.4));
      /* a ring, not a pool of light: a glow big enough to read round this pill
         reaches past the bottom of the box (--sweep found it at 130.3 s) */
      if (rel > 0) {
        pc += R(778, 372, 160, 60, 30, "none", P.good, 4, { opacity: clamp(Math.min(1, rel) * (0.55 + 0.45 * breathe(t)), 0, 1) });
        pc += MK.pill(858, 402, "reliable", Math.min(1, rel), { size: 26, col: P.good, ink: P.good });
      }
      out += G(pc, { opacity: toC });
    }
    return svg(out);
  }

  /* ---- a table, then a dot plot ---------------------------------------------------
     The lesson's own two steps, side by side: its drop table (the columns it
     names, "Drop" and "Time in seconds", and its three times) and its dot plot
     (one dot for each measurement above its own value, with 2.2 s empty - the
     lesson's own reading question). The last beat puts a pale dot far from the
     cluster, which is what the lesson says an odd one does: it stands alone. */
  var PSP_TICKS = [["2.0", 640], ["2.1", 745], ["2.2", 850], ["2.3", 955]];
  var PSP_AXIS = 352, PSP_DOTY = 316;

  function pspRecordChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWrite = c(0, "write"), cTable = c(0, "table"), cSec = c(0, "seconds");
    var cR1 = c(1, "one"), cR2 = c(1, "two"), cR3 = c(1, "three");
    var cPlot = c(2, "plot"), cDot = c(2, "dot"), cTime = c(2, "time");
    var cPile = c(3, "pile"), cOdd = c(3, "odd"), cAlone = c(3, "alone");
    var out = "", rows = [["1️⃣", "drop 1", "2.1 s", cR1], ["2️⃣", "drop 2", "2.3 s", cR2], ["3️⃣", "drop 3", "2.0 s", cR3]];

    /* the table */
    var tb = on(t, cWrite, 0.5);
    if (tb > 0) {
      var g = R(24, 40, 496, 370, 18, P.card, P.line, 2) +
        Tx(96, 104, "Drop", "lab mid muted", "start") +
        Tx(480, 104, "Time in seconds", "lab mid muted", "end") +
        L(48, 124, 496, 124, P.line, 2);
      var hd = on(t, cSec, 0.5);
      if (hd > 0) g += R(300, 78, 196, 40, 10, "none", P.gold, 3, { opacity: hd }) +
        MK.pic(282, 98, 34, "⏱️", { opacity: n2(hd) });
      var skel = on(t, cTable, 0.5);
      for (var k = 0; k < 3; k++) {
        var ry = 184 + k * 70;
        g += G(Em(100, ry, 40, rows[k][0]) + Tx(146, ry + 11, rows[k][1], "lab big", "start"), { opacity: clamp(skel, 0, 1) });
        g += L(48, ry + 35, 496, ry + 35, P.line, 1, { opacity: clamp(skel, 0, 1) * 0.6 });
        var v = popIn(t, rows[k][3], 0.4);
        if (v > 0) g += MK.pop(Tx(480, ry + 12, rows[k][2], "lab big gold", "end"), 440, ry, v);
      }
      out += G(g, { opacity: clamp(tb, 0, 1) });
    }

    /* the dot plot */
    var dp = on(t, cPlot, 0.5);
    if (dp > 0) {
      var p = R(556, 40, 596, 370, 18, P.card, P.line, 2) +
        L(600, PSP_AXIS, lerp(600, 1130, on(t, cPlot, 0.8)), PSP_AXIS, P.muted, 4);
      for (var q = 0; q < 4; q++) {
        var tx = PSP_TICKS[q][1], lit = q === 0 || q === 1 || q === 3 ? on(t, cTime, 0.5) : 0;
        p += L(tx, PSP_AXIS - 8, tx, PSP_AXIS + 8, P.muted, 3);
        p += Tx(tx, PSP_AXIS + 38, PSP_TICKS[q][0], "lab mid muted", "middle", { fill: lit > 0.5 ? P.gold : null });
      }
      p += Tx(865, PSP_AXIS + 72, "seconds", "lab mid muted", "middle");
      /* one dot for each measurement: the 2.1 first, then the other two */
      var dots = [[745, popIn(t, cDot, 0.45)], [640, popIn(t, cTime, 0.45)], [955, popIn(t, cTime == null ? null : cTime + 0.3, 0.45)]];
      for (var d = 0; d < 3; d++) {
        var pu = dots[d][1];
        if (!(pu > 0)) continue;
        p += C(dots[d][0], lerp(PSP_DOTY - 90, PSP_DOTY, ease(Math.min(1, pu))), 20, P.teal, P.ground, 3, { opacity: Math.min(1, pu) });
      }
      /* the cluster */
      var cl = on(t, cPile, 0.5);
      if (cl > 0) {
        p += E(797, PSP_DOTY, 190, 46, "none", P.gold, 4, { opacity: cl, "stroke-dasharray": "14 10" });
        p += MK.pill(745, 214, "about 2.1 s", Math.min(1, popIn(t, cPile, 0.4)), { size: 22, col: P.gold, ink: P.gold });
      }
      /* an odd one would stand alone */
      var od = popIn(t, cOdd, 0.45), al = on(t, cAlone, 0.6);
      if (od > 0) {
        p += C(1090, PSP_DOTY, 20, P.muted, P.ground, 3, { opacity: 0.55 * Math.min(1, od) });
        p += MK.pill(1058, 190, "odd one out", Math.min(1, od), { size: 22, col: P.muted, ink: P.muted });
      }
      /* "stand alone": the gap between it and the cluster is measured out */
      if (al > 0) {
        p += L(991, PSP_DOTY, lerp(991, 1064, al), PSP_DOTY, P.muted, 3, { "stroke-dasharray": "10 8" });
        p += MK.qmark(1090, PSP_DOTY - 62, 24, popIn(t, cAlone, 0.4));
      }
      out += G(p, { opacity: clamp(dp, 0, 1) });
    }
    return svg(out);
  }
