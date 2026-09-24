  /* ==== Bitsy Loops, part 2: the two programming chapters =====================
     tools/lib/film-scenes/computing-g4/bitsy-loops-2.js. Joined after
     bitsy-loops.js, in the same scope, so blBoard, blBlock, blRun and the four
     runs worked out there are all in hand.

     Every board state drawn here is blBoardState(run, n) - the kit's own plan,
     with the kit's own LED rule applied to it - so the lights on each pass of
     the forever loop are the lights the lesson's board would show: all on,
     still on through the wait, all off, still off through the wait, then round
     again from where ART.device.plan says the loop goes back to. */

  /* ---- a small fan, for the program that starts one ----------------------- */
  function blFan(cx, cy, r, t, o) {
    if (!(o > 0)) return "";
    var a = (t * 150) % 360, out = C(cx, cy, r, P.cell, P.line, 2);
    for (var k = 0; k < 3; k++)
      out += E(cx, cy - r * 0.42, r * 0.22, r * 0.40, P.teal, null, null,
        { transform: "rotate(" + n2(a + k * 120) + " " + n2(cx) + " " + n2(cy) + ")" });
    out += C(cx, cy, r * 0.17, P.gold);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: when it gets hot =============================================
     Two sensor programs, one after the other, in the lesson's own words: the
     fan that starts itself, and the night light. Then the mistake the lesson
     names - pressing A to test a program that is waiting for the dark. */
  var BL_PG = { x: 50, w: 440, h: 64, gap: 16, top: 108 };
  function blPgY(k) { return BL_PG.top + k * (BL_PG.h + BL_PG.gap); }
  var BL_BOARD = { x: 700, y: 52, w: 300 };

  /* the script, with the block that is running ringed */
  function blScript(script, shown, live, o) {
    var out = "";
    for (var k = 0; k < script.length; k++) {
      var p = typeof shown === "function" ? shown(k) : (k < shown ? 1 : 0);
      out += blBlock(BL_PG.x, blPgY(k), BL_PG.w, BL_PG.h, script[k], { o: p * (o == null ? 1 : o), live: live === k });
    }
    return out;
  }

  function blProgramsPanel(scene, t, k) {
    var out = "";
    if (k <= 1) {
      var cHot = sc(scene, 0, "hot"), cMotor = sc(scene, 0, "motor"), cSmile = sc(scene, 0, "smile");
      var cFan = sc(scene, 1, "fan"), cNo = sc(scene, 1, "nobody");
      var at = [cHot, cMotor, cSmile];
      /* the program runs when the heat arrives, not before */
      var n = k === 1 ? tally(t, cFan, BL_FAN.steps.length, 0.9) - 1 : -1;
      var st = blBoardState(BL_FAN, n);
      out += Tx(BL_PG.x, 74, "A fan that starts itself", "lab big gold", "start",
        { opacity: k === 1 ? on(t, cFan, 0.5) : 0 });
      out += blScript(BL_FAN.script, function (j) { return popIn(t, at[j], 0.42); },
        n >= 0 && n < BL_FAN.steps.length ? BL_FAN.steps[n].at : (k === 1 ? 0 : -1));
      out += blBoard(BL_BOARD.x, BL_BOARD.y, BL_BOARD.w,
        { leds: st.leds, motor: st.motor, bell: st.bell, beep: st.beep });
      /* the heat that starts it, and the fan the motor turns */
      if (k === 1) out += MK.waves(1075, 108, t, cFan, { dir: -Math.PI / 2, spread: 1.3, reach: 48, col: P.bad });
      out += MK.pop(Em(1075, 120, 62, "\u{1F321}️"), 1075, 120, popIn(t, k === 1 ? cFan : cHot, 0.45));
      out += Tx(1075, 178, "it gets hot", "lab mid bad", "middle", { opacity: on(t, k === 1 ? cFan : cHot, 0.6) });
      out += blFan(1075, 268, 46, t, k === 1 ? on(t, cFan, 0.6) : 0);
      /* nobody pressed anything */
      if (k === 1) {
        var np = popIn(t, cNo, 0.45);
        out += MK.pop(C(1062, 374, 32, P.cell, P.line, 3) + Tx(1062, 384, "A", "lab big muted", "middle"), 1062, 374, np);
        out += MK.cross(1102, 342, 21, np);
      }
      return out;
    }
    if (k === 2) {
      var cDark = sc(scene, 2, "dark"), cLights = sc(scene, 2, "lights"), cBeep = sc(scene, 2, "beep"), cNight = sc(scene, 2, "night");
      var at2 = [cDark, cLights, cBeep];
      var n2s = tally(t, cLights, BL_NIGHT.steps.length, 0.8) - 1;
      var s2 = blBoardState(BL_NIGHT, n2s);
      out += Tx(BL_PG.x, 74, "A night light", "lab big gold", "start", { opacity: on(t, cNight, 0.5) });
      out += blScript(BL_NIGHT.script, function (j) { return popIn(t, at2[j], 0.42); },
        n2s >= 0 && n2s < BL_NIGHT.steps.length ? BL_NIGHT.steps[n2s].at : 0);
      out += blBoard(BL_BOARD.x, BL_BOARD.y, BL_BOARD.w, { leds: s2.leds, motor: s2.motor, bell: s2.bell, beep: s2.beep });
      out += MK.pop(Em(1075, 120, 60, "\u{1F319}"), 1075, 120, popIn(t, cDark, 0.45));
      out += Tx(1075, 178, "it gets dark", "lab mid gold", "middle", { opacity: on(t, cDark, 0.6) });
      if (s2.beep) out += MK.waves(BL_BOARD.x + BL_BOARD.w * 0.72, BL_BOARD.y + BL_BOARD.w * 0.865, t, cBeep, { dir: 0, spread: 1.1, reach: 120 });
      out += MK.tick(1075, 300, 30, popIn(t, cNight, 0.42));
      return out;
    }
    /* the mistake: pressing A at a program that is waiting for the dark */
    var cBlock = sc(scene, 3, "block"), cInput = sc(scene, 3, "input"), cPress = sc(scene, 3, "pressa"), cNothing = sc(scene, 3, "nothing");
    out += blScript(BL_NIGHT.script, function () { return 1; }, blPast(t, cBlock) ? 0 : -1);
    out += MK.leader(BL_PG.x + BL_PG.w + 16, blPgY(0) + BL_PG.h / 2, 1030, 120, on(t, cInput, 0.7), P.gold);
    out += MK.pop(Em(1075, 120, 60, "\u{1F319}"), 1075, 120, popIn(t, cInput, 0.45));
    out += blBoard(BL_BOARD.x, BL_BOARD.y, BL_BOARD.w, { leds: ART.kit.LED.dark });
    /* the press, and nothing happening */
    var pp = popIn(t, cPress, 0.42);
    out += MK.pop(C(1075, 280, 34, P.cell, P.plum, 3) + Tx(1075, 292, "A", "lab big", "middle", { fill: P.plum }), 1075, 280, pp);
    out += MK.ripple(1075, 280, t, cPress, P.plum);
    out += MK.finger(1075, 286, on(t, cPress, 0.4) * (1 - on(t, cNothing, 0.4)));
    out += MK.cross(BL_BOARD.x + BL_BOARD.w / 2, BL_BOARD.y + BL_BOARD.w * 0.49, 46, popIn(t, cNothing, 0.45));
    out += Tx(1075, 372, "nothing", "lab big bad", "middle", { opacity: on(t, cNothing, 0.5) });
    return out;
  }

  function blProgramsChapter(scene, beat, t, i) {
    return svg(crossfade(t, i, scene, function (k) { return blProgramsPanel(scene, t, k - scene.first); }));
  }

  /* ==== chapter: loops on the device ==========================================
     A counted loop and a forever loop, both run by the kit. The counted one
     beeps three times because ART.device.plan unrolls repeat 3 times into
     three beeps - and the lights stay OFF all through, because beep is not one
     of the kit's four LED patterns. The forever one walks the kit's plan for
     ever, going back to ART.device.plan's own foreverAt. */
  var BL_LP = { x: 50, w: 470 };
  var BL_LBOARD = { x: 700, y: 40, w: 290 };

  function blLoopBlocks(script, y0, h, gap, shown, live) {
    var out = "";
    for (var k = 0; k < script.length; k++) {
      var p = typeof shown === "function" ? shown(k) : 1;
      out += blBlock(BL_LP.x, y0 + k * (h + gap), BL_LP.w, h, script[k], { o: p, live: live === k, size: Math.min(23, h * 0.44) });
    }
    return out;
  }

  function blLoopsPanel(scene, t, k) {
    var out = "";
    if (k <= 2) {
      var cRepeat = sc(scene, 0, "repeat"), cOutput = sc(scene, 0, "output"), cCounted = sc(scene, 0, "counted");
      var cWhenA = sc(scene, 1, "whena"), cThree = sc(scene, 1, "three"), cCount = sc(scene, 1, "count");
      var cStops = sc(scene, 2, "stops"), cCc = sc(scene, 2, "cc");
      var at = [BEATS[scene.first].start + 0.1, cRepeat, cOutput];
      /* three beeps, one at a time, from the kit's own unrolled plan */
      var done = k >= 1 ? tally(t, cThree, BL_BEEP3.steps.length, 1.5) : 0;
      var n = done - 1, st = blBoardState(BL_BEEP3, k >= 1 ? n : -1);
      var live = k >= 1
        ? (n >= 0 && n < BL_BEEP3.steps.length ? BL_BEEP3.steps[n].at : 0)
        : (blPast(t, cRepeat) ? 1 : -1);
      out += blLoopBlocks(BL_BEEP3.script, 108, 64, 16, function (j) { return popIn(t, at[j], 0.42); }, live);
      /* the repeat block points at the one output it repeats */
      out += MK.arrow(BL_LP.x + BL_LP.w + 20, 188 + 40, BL_LP.x + BL_LP.w + 20, 268 + 24, on(t, cOutput, 0.5), P.accent, 7);
      out += MK.ripple(BL_LP.x + 32, 108 + 32, t, cWhenA, P.plum);
      out += MK.finger(BL_LP.x + 32, 108 + 38, k === 1 ? on(t, cWhenA, 0.4) * (1 - on(t, cThree, 0.5)) : 0);
      /* the count the repeat block carries */
      out += MK.pill(BL_LP.x + BL_LP.w + 74, 108 + 64 + 16 + 32, "3 times", on(t, cCounted, 0.5), { size: 24, col: P.accent, ink: P.accent });
      out += blBoard(BL_LBOARD.x, BL_LBOARD.y, BL_LBOARD.w, { leds: st.leds, beep: st.beep && k >= 1 });
      if (k >= 1 && st.beep) out += MK.waves(BL_LBOARD.x + BL_LBOARD.w * 0.72, BL_LBOARD.y + BL_LBOARD.w * 0.865, t, cThree, { dir: 0, spread: 1.1, reach: 110 });
      /* one dot for each beep, counted out loud */
      for (var b = 0; b < BL_BEEP3.steps.length; b++) {
        var bx = BL_LBOARD.x + 28 + b * 78, bp = k >= 1 && b < done ? 1 : 0;
        var flash = bump(t, cCount == null ? null : cCount + b * 0.28, 0.5);
        out += MK.pop(C(bx, 372, 30 + 4 * flash, "rgba(244,201,93,0.18)", P.gold, 3) +
          Tx(bx, 382, String(b + 1), "lab big gold", "middle"), bx, 372, bp);
      }
      /* it stops on its own, and that is what count-controlled means */
      if (k >= 2) {
        out += MK.pop(R(BL_LBOARD.x + 232, 352, 40, 40, 8, P.cell, P.muted, 3) +
          R(BL_LBOARD.x + 242, 362, 20, 20, 3, P.muted) +
          Tx(BL_LBOARD.x + 252, 424, "it stops", "lab mid muted", "middle"), BL_LBOARD.x + 252, 372, popIn(t, cStops, 0.42));
        out += MK.pill(BL_LP.x + BL_LP.w / 2, 58, "count-controlled loop", popIn(t, cCc, 0.45), { size: 26, col: P.gold, ink: P.gold });
      }
      return out;
    }
    /* the forever loop */
    var cForever = sc(scene, 3, "forever"), cOn = sc(scene, 3, "on"), cOff = sc(scene, 3, "off");
    var cRound = sc(scene, 4, "round"), cFlash = sc(scene, 4, "flash"), cStop = sc(scene, 4, "stop");
    var h = 52, gap = 9, y0 = 41;
    var step = -1;
    if (k >= 4 && cRound != null && t >= cRound) step = blStepAt(BL_FLASH, Math.floor((t - cRound) / 0.62));
    else if (blPast(t, cOff)) step = 2;
    else if (blPast(t, cOn)) step = 0;
    var s = blBoardState(BL_FLASH, step);
    var live = step >= 0 ? BL_FLASH.steps[step].at : -1;
    out += blLoopBlocks(BL_FLASH.script, y0, h, gap, function (j) {
      return j <= 1 ? on(t, cForever, 0.45) : popIn(t, cForever == null ? null : cForever + 0.35 + (j - 2) * 0.22, 0.4);
    }, live);
    out += blBoard(BL_LBOARD.x, BL_LBOARD.y, BL_LBOARD.w, { leds: s.leds });
    /* the loop going round, and the Stop that is the only way out */
    var sweep = k >= 4 ? ((t - (cRound == null ? t : cRound)) / 2.48) % 1 : 0;
    var a0 = -1.4 + sweep * 6.283;
    out += blArc(BL_LP.x + BL_LP.w + 64, y0 + (h + gap) * 3 - gap / 2, 54, a0, a0 + 4.4,
      k >= 4 ? on(t, cRound, 0.5) : 0, P.gold, 7);
    out += Tx(BL_LBOARD.x + BL_LBOARD.w / 2, 372, s.leds.join("").indexOf("1") >= 0 ? "lights on" : "lights off",
      "lab big gold", "middle", { opacity: k >= 4 ? on(t, cFlash, 0.5) : 0 });
    var sp = popIn(t, cStop, 0.45);
    out += MK.pop(R(BL_LBOARD.x + 60, 396, 170, 40, 20, P.cell, P.bad, 3) +
      R(BL_LBOARD.x + 78, 406, 20, 20, 3, P.bad) +
      Tx(BL_LBOARD.x + 158, 424, "Stop", "lab big bad", "middle"), BL_LBOARD.x + 145, 416, sp);
    return out;
  }

  function blLoopsChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(blLoopsPanel(scene, t, Math.min(i - scene.first, 2)), { opacity: 1 - u });
    if (u > 0) out += G(blLoopsPanel(scene, t, Math.max(i - scene.first, 3)), { opacity: u });
    return svg(out);
  }
