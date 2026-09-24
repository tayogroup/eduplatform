  /* ==== Press, Shake, Clap, part 3: the when block, and the outputs ==========
     tools/lib/film-scenes/computing-g3/press-shake-clap-3.js. See the header of
     press-shake-clap.js.

     Both chapters are the same shape: the program as a stack of the lesson's
     own blocks on the left, Bitsy on the right, and the board answering only
     when an input is given to it. The order the outputs run in is
     ART.device.plan's, never a list written out here. */

  /* the first n lit cells of a pattern, in the order the grid is read: how a
     pattern fills in while "every one of the twenty-five lights" is said */
  function psPrefixLeds(pat, n) {
    var out = [], seen = 0;
    for (var r = 0; r < 5; r++) {
      var row = "";
      for (var c = 0; c < 5; c++) {
        if (pat[r].charAt(c) === "1") { seen++; row += seen <= n ? "1" : "0"; }
        else row += "0";
      }
      out.push(row);
    }
    return out;
  }
  /* an outline round a block that is being named or is running */
  function psBlockRing(x, y, w, h, u, col) {
    if (!(u > 0)) return "";
    var k = Math.min(1, u), p = 10 - 4 * k;
    return R(x - p, y - p, w + p * 2, h + p * 2, (h + p * 2) * 0.28, "none", col || P.gold, 4, { opacity: k });
  }

  /* ==== chapter: the when block ==================================================
     The lesson's first round, built the way the lesson asks for it: the when
     block first, then the outputs. Then the right input, and then the wrong
     one - where the kit's own answer is "Nothing happened. The program is
     waiting for button A is pressed, not that." */

  var PS_WHEN_SCRIPT = ["whenA", "heart", "beep"];
  var PS_WHEN_PLAN = ART.device.plan(PS_WHEN_SCRIPT).plan;
  var PS_WG = psGeom(700, 66, 400);
  var PS_WBLOCK = { x: 40, w: 440, hat: 72, h: 64 };

  function psWhenRow(k) { return k === 0 ? 112 : 192 + (k - 1) * 72; }

  function psWhenChapter(scene, beat, t, i) {
    var cStart = sc(scene, 0, "start"), cNames = sc(scene, 0, "names");
    var cWhenA = sc(scene, 1, "whenA"), cWaits = sc(scene, 1, "waits");
    var cOut = sc(scene, 2, "outputs"), cHeart = sc(scene, 2, "heart"), cBeep = sc(scene, 2, "beep");
    var cPress = sc(scene, 3, "press"), cDraws = sc(scene, 3, "draws"), cBeeps = sc(scene, 3, "beeps");
    var cShake = sc(scene, 4, "shake"), cNothing = sc(scene, 4, "nothing"), cWaiting = sc(scene, 4, "waiting");
    var g = PS_WG, B = PS_WBLOCK, out = "";

    /* what the board is doing: it runs only when A is pressed, and the wrong
       input at the last beat leaves it dark */
    var ran = psPast(t, cDraws) ? (psPast(t, cBeeps) ? 2 : 1) : 0;
    var st = psRunState(PS_WHEN_PLAN, psPast(t, cShake) ? 0 : ran);
    var press = psHold(t, cPress, 1.0), shaken = psHold(t, cShake, 1.2);

    out += G(psTurn(psBoard(g, { leds: st.leds, pressA: press > 0, shakeLive: shaken }), g, psWobble(t, cShake, 1.2)));

    /* the program: the when block first, then the outputs */
    PS_WHEN_SCRIPT.forEach(function (id, k) {
      var h = k === 0 ? B.hat : B.h, y = psWhenRow(k);
      var o = k === 0 ? on(t, cStart, 0.45) : on(t, cOut == null ? null : cOut + (k - 1) * 0.3, 0.4);
      var running = k > 0 && ran === k && !psPast(t, cShake);
      out += psBlock(B.x, y, B.w, h, id, o, running ? { col: P.gold, fill: "#3A3216" } : null);
      if (k > 0) {
        out += psBlockRing(B.x, y, B.w, h, bump(t, k === 1 ? cHeart : cBeep, 0.7), P.blue);
        out += psBlockRing(B.x, y, B.w, h, running ? 1 : 0, P.gold);
      }
    });
    out += psBlockRing(B.x, psWhenRow(0), B.w, B.hat, bump(t, cWhenA, 0.8) + on(t, cWaiting, 0.5), P.gold);
    out += MK.pill(B.x + 62, psWhenRow(0) - 26, "first", on(t, cStart, 0.5), { size: 21, col: P.gold, ink: P.gold });

    /* the when block names the input, and the board's button A answers */
    out += MK.leader(B.x + B.w + 8, psWhenRow(0) + B.hat / 2, g.A.cx - g.A.r - 10, g.A.cy, on(t, cNames, 0.6), P.gold);
    out += psRing(g.A, on(t, cNames, 0.45) * (1 - on(t, cShake, 0.5)) * (psPast(t, cWaits) ? 0.55 + 0.45 * breathe(t) : 1), P.gold);
    out += MK.pill(g.box.x + g.box.w / 2, 410, "waiting for button A",
      Math.min(1, on(t, cWaits, 0.5) * (1 - on(t, cPress, 0.4)) + on(t, cWaiting, 0.5)),
      { size: 23, col: P.gold, ink: P.gold });

    /* pressing A: the finger, the ripple, and the outputs the plan gives */
    out += MK.ripple(g.A.cx, g.A.cy, t, cPress, P.gold);
    out += MK.finger(g.A.cx, g.A.cy + g.A.r * 0.5, press);
    out += psGridRing(g, bump(t, cDraws, 0.9), P.good);
    if (st.beep) out += MK.waves(g.speaker.cx + 16, g.speaker.cy, t, cBeeps, { dir: 0, spread: 1.0, n: 3, period: 0.8, reach: 46, col: P.good, until: cBeeps == null ? null : cBeeps + 1.4 });

    /* the wrong input: the kit's own answer is that nothing happens */
    out += psRing(g.shake, psHold(t, cShake, 1.4), P.bad);
    out += MK.cross(g.box.x + g.box.w - 26, g.box.y + 18, 30, popIn(t, cNothing, 0.4));
    return svg(out);
  }

  /* ==== chapter: outputs, one at a time ==========================================
     Bitsy's six output blocks down the left, each one doing its own real thing
     on the board as it is named. Then the lesson's second round - when it is
     shaken, all lights on, beep, all lights off - run in the order
     ART.device.plan gives. */

  var PS_OUT_BLOCKS = ["light", "smile", "dark", "beep", "motor", "bell"];
  var PS_OG = psGeom(700, 74, 400);
  var PS_OBLOCK = { x: 36, w: 420, h: 56, gap: 9, top: 28 };
  function psOutRow(k) { return PS_OBLOCK.top + k * (PS_OBLOCK.h + PS_OBLOCK.gap); }

  function psOutputsMain(scene, t) {
    var cBlock = sc(scene, 0, "block"), cOne = sc(scene, 0, "one");
    var cAll = sc(scene, 1, "all"), cEvery = sc(scene, 1, "every");
    var cSmile = sc(scene, 2, "smile"), cOff = sc(scene, 2, "off"), cDark = sc(scene, 2, "dark");
    var cBeep = sc(scene, 3, "beep"), cMotor = sc(scene, 3, "motor"), cBell = sc(scene, 3, "bell");
    var g = PS_OG, out = "";
    var at = { light: cAll, smile: cSmile, dark: cOff, beep: cBeep, motor: cMotor, bell: cBell };

    /* The lights follow whichever pattern block was named last. All lights on
       fills the grid one light at a time from the moment it is named, and the
       twenty-fifth lands exactly on "every one of the twenty-five lights".
       (Counting from THAT phrase instead emptied a full grid and refilled it,
       which is a flicker rather than a picture of the block working.) */
    var leds = PS_LED.dark;
    if (psPast(t, cAll)) {
      var fill = cEvery != null && cAll != null ? Math.max(0.6, cEvery - cAll) : 0.9;
      leds = psPrefixLeds(PS_LED.light, tally(t, cAll, 25, fill));
    }
    if (psPast(t, cSmile)) leds = PS_LED.smile;
    if (psPast(t, cDark)) leds = PS_LED.dark;

    out += psBoard(g, { leds: leds, motorSpin: psSpin(t, cMotor, 1.2), bellTilt: psRingTilt(t, cBell, 1.1) });
    out += psGridRing(g, on(t, cAll, 0.4) * (1 - on(t, cBeep, 0.4)), P.good);
    out += MK.waves(g.speaker.cx + 16, g.speaker.cy, t, cBeep, { dir: 0, spread: 1.0, n: 3, period: 0.8, reach: 46, col: P.good, until: cBeep == null ? null : cBeep + 1.2 });
    out += psRing(g.speaker, psHold(t, cBeep, 1.4), P.good);
    out += psRing(g.motor, psHold(t, cMotor, 1.4), P.good);
    out += psRing(g.bell, psHold(t, cBell, 1.4), P.good);
    out += MK.waves(g.bell.cx, g.bell.cy - 12, t, cBell, { dir: -1.57, spread: 1.4, n: 2, period: 0.7, reach: 34, col: P.good, until: cBell == null ? null : cBell + 1.1 });

    PS_OUT_BLOCKS.forEach(function (id, k) {
      var y = psOutRow(k), live = psHold(t, at[id], 1.4);
      out += psBlock(PS_OBLOCK.x, y, PS_OBLOCK.w, PS_OBLOCK.h, id,
        on(t, cBlock == null ? null : cBlock + k * 0.16, 0.4), live ? { col: P.gold, fill: "#3A3216" } : null);
      out += psBlockRing(PS_OBLOCK.x, y, PS_OBLOCK.w, PS_OBLOCK.h, live, P.gold);
    });
    out += MK.arrow(474, 214, 688, 214, on(t, cOne, 0.5), P.good, 9);
    /* the last light lands here, so the count is said and shown together */
    /* y 418 at size 22: the pill spans 398 to 438, so it clears the board's
       bottom border (395) and the bottom of the 440 box */
    out += MK.pill(g.box.x + g.box.w / 2, 418, "all 25 on",
      on(t, cEvery, 0.45) * (1 - on(t, cSmile, 0.4)), { size: 22, col: P.good, ink: P.good });
    return out;
  }

  /* the lesson's own second round: an input, then its outputs in order */
  var PS_RUN_SCRIPT = ["whenShake", "light", "beep", "dark"];
  var PS_RUN_PLAN = ART.device.plan(PS_RUN_SCRIPT).plan;
  var PS_RUN_STEP = 0.72;

  function psOutputsRun(scene, t) {
    var cArrives = sc(scene, 4, "arrives"), cOrder = sc(scene, 4, "order");
    var g = PS_OG, out = "", B = { x: 40, w: 440, hat: 68, h: 60 };
    var done = cArrives == null ? 0 : tally(t, cArrives + 0.75, PS_RUN_PLAN.length + 1, PS_RUN_STEP * PS_RUN_PLAN.length) - 1;
    if (!(done > 0)) done = 0;
    var st = psRunState(PS_RUN_PLAN, done);
    var shaken = psHold(t, cArrives, 1.0);

    out += G(psTurn(psBoard(g, { leds: st.leds, shakeLive: shaken }), g, psWobble(t, cArrives, 1.0)));
    out += psRing(g.shake, shaken, P.gold);
    if (st.beep) out += MK.waves(g.speaker.cx + 16, g.speaker.cy, t, cArrives == null ? null : cArrives + 0.75 + PS_RUN_STEP, { dir: 0, spread: 1.0, n: 3, period: 0.8, reach: 46, col: P.good, until: cArrives == null ? null : cArrives + 0.75 + PS_RUN_STEP * 2 });

    PS_RUN_SCRIPT.forEach(function (id, k) {
      var h = k === 0 ? B.hat : B.h, y = k === 0 ? 74 : 156 + (k - 1) * 70;
      var running = k > 0 && done === k;
      out += psBlock(B.x, y, B.w, h, id, 1, running ? { col: P.gold, fill: "#3A3216" } : k === 0 && shaken ? { col: P.gold } : null);
      out += psBlockRing(B.x, y, B.w, h, running ? 1 : 0, P.gold);
      if (k > 0) out += Tx(B.x - 16, y + h / 2 + 8, String(k), "lab big", "end",
        { fill: done >= k ? P.gold : P.muted, opacity: on(t, cOrder, 0.45) });
    });
    return out;
  }

  function psOutputsChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(psOutputsMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(psOutputsRun(scene, t), { opacity: u });
    return svg(out);
  }
