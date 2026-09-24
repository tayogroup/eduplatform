  /* ==== Grade 4 Computing, Lesson 7: Bitsy Loops =============================
     tools/lib/film-scenes/computing-g4/bitsy-loops.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/bitsy-loops.json.

     BITSY'S BOARD IS DRAWN HERE AND ITS BEHAVIOUR IS BORROWED. The lesson
     kit keeps the board inside deviceProgram(), a closure that needs the
     lesson page's own element ids, so there is no ART.sim to lift. What the
     film takes from the kit instead is every piece of MEANING:

       ART.device.inputs      the five inputs, in the lesson's own order
       ART.device.block(id)   a block's label and icon, so no label is retyped
       ART.device.plan(s)     what a script actually does, repeats unrolled,
                              and where a forever loop goes back to
       ART.kit.LED            the four 5 x 5 light patterns

     blRun() below walks the kit's own plan and applies the kit's own LED rule
     (doOne: a block with a pattern sets the lights, anything else leaves them
     as they were), so the pattern this film shows on each pass of a loop is
     the pattern the lesson's own board would show. Nothing about a program is
     decided by hand.

     This file: the palette, the board, the blocks, the program runner, the
     title motif and the chapter "Bitsy's sensors". Every top-level name here
     starts with bl. */

  var HUE = {
    title: P.teal, sensors: P.gold, programs: P.accent, loops: P.plum,
    control: P.good, notcontrol: P.blue, board: P.gold, recap: P.teal
  };

  /* ---- timing ------------------------------------------------------------ */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function blPast(t, at) { return at != null && t >= at; }

  /* ---- what the lesson says Bitsy is ------------------------------------- */

  /* the five ids, in the kit's own order: A, shake, clap, hot, dark */
  var BL_IN = ART.device.inputs.map(function (p) { return p[0]; });
  /* the names and pictures the lesson's own "Sensor finder" step gives them */
  var BL_IN_NAME = { A: "button A", shake: "shake sensor", clap: "microphone", hot: "temperature sensor", dark: "light sensor" };
  var BL_IN_PIC = { A: "\u{1F170}️", shake: "\u{1F4F3}", clap: "\u{1F3A4}", hot: "\u{1F321}️", dark: "\u{1F319}" };
  /* the two the lesson's step is about: they sense, and nobody presses them */
  var BL_SENSES = { hot: 1, dark: 1 };

  /* ---- Bitsy's board ------------------------------------------------------
     Drawn here, in the engine's idiom: a body, the 5 x 5 grid of LEDs, and the
     motor, bell and speaker under it. `leds` is five strings of "0" and "1",
     always one of the kit's own patterns. */
  function blLeds(x, y, g, rows, opt) {
    opt = opt || {};
    var s = g / 5, out = "", r, c;
    out += R(x - s * 0.22, y - s * 0.22, g + s * 0.44, g + s * 0.44, s * 0.4, P.night, P.line, 2);
    for (r = 0; r < 5; r++) for (c = 0; c < 5; c++) {
      var lit = rows[r].charAt(c) === "1", cx = x + c * s + s / 2, cy = y + r * s + s / 2;
      if (lit) out += C(cx, cy, s * 0.46, "rgba(244,201,93,0.22)");
      out += C(cx, cy, s * 0.26, lit ? P.gold : P.cell, lit ? P.goldDeep : P.line, s * 0.06);
    }
    if (opt.ring) out += C(x + opt.ring[1] * s + s / 2, y + opt.ring[0] * s + s / 2, s * 0.44, "none", opt.ringCol || P.teal, 3.5);
    return out;
  }

  /* A board w wide. opt: {o, leds, motor, bell, beep, name, ring, ringCol} */
  function blBoard(x, y, w, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var h = w * 0.98, g = w * 0.62, gx = x + (w - g) / 2, gy = y + h * 0.15;
    var out = R(x, y, w, h, w * 0.09, P.card, opt.edge || P.line, 3);
    if (opt.name !== "") out += Tx(x + w * 0.5, y + h * 0.105, opt.name || "Bitsy", "lab mid muted caps", "middle");
    out += blLeds(gx, gy, g, opt.leds || ART.kit.LED.dark, opt);
    /* the motor, the bell and the speaker: gold when the program turned them on */
    var py = y + h * 0.885, ps = w * 0.13;
    [["⚙️", opt.motor], ["\u{1F514}", opt.bell], ["\u{1F50A}", opt.beep]].forEach(function (p, k) {
      var px = x + w * (0.28 + k * 0.22), lit = p[1] ? 1 : 0;
      out += C(px, py, ps * 0.62, lit ? "rgba(244,201,93,0.20)" : P.cell, lit ? P.gold : P.line, 2);
      out += Em(px, py, ps * 0.66, p[0], { opacity: lit ? 1 : 0.45 });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the blocks ---------------------------------------------------------
     Every label and icon comes from the kit, so a block in the film says
     exactly what the same block says on the lesson page. */
  var BL_CAT_COL = { hat: P.plum, out: P.teal, loop: P.accent };
  /* opt: {o, live (ringed gold), dim, size} */
  function blBlock(x, y, w, h, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var b = ART.device.block(id), col = opt.col || BL_CAT_COL[b.cat] || P.line;
    var fs = opt.size || Math.min(24, h * 0.46);
    var out = R(x, y, w, h, h * 0.30, opt.live ? "#1B3A52" : P.cell, opt.live ? P.gold : col, opt.live ? 4 : 2.5) +
      Em(x + h * 0.52, y + h / 2, fs * 1.15, b.icon) +
      Tx(x + h * 0.95, y + h / 2 + fs * 0.35, b.label, "lab", "start", { "font-size": fs, fill: opt.live ? P.gold : P.ink });
    return G(out, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.4 : 1) });
  }

  /* an empty slot, for a program that is not written yet */
  function blSlot(x, y, w, h, text, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.30, P.card, P.line, 2.5, { "stroke-dasharray": "10 8" }) +
      Tx(x + w / 2, y + h / 2 + 8, text, "lab mid muted", "middle"), { opacity: clamp(o, 0, 1) });
  }

  /* ---- what a script does, from the kit ----------------------------------
     ART.device.plan unrolls the repeats and says where a forever loop goes
     back to; the LED rule is the kit's own doOne. Worked out once, here,
     never inside a draw function. */
  function blRun(script) {
    var p = ART.device.plan(script), rows = ART.kit.LED.dark, steps = [];
    p.plan.forEach(function (row) {
      var id = row[1];
      if (ART.kit.LED[id]) rows = ART.kit.LED[id];
      steps.push({ at: row[0], id: id, leds: rows, motor: id === "motor", bell: id === "bell", beep: id === "beep" });
    });
    return { script: script, steps: steps, foreverAt: p.foreverAt };
  }
  /* which step of a run is the n-th one done: after the last, a forever loop
     goes back to where the kit says it does */
  function blStepAt(run, n) {
    if (n < 0) return -1;
    if (n < run.steps.length) return n;
    if (run.foreverAt < 0) return -1;
    var body = run.steps.length - run.foreverAt;
    return body <= 0 ? -1 : run.foreverAt + ((n - run.steps.length) % body);
  }
  /* the board as it stands after the n-th step (-1: nothing has run yet).
     The kit resets the lights and the parts when the input fires, so a step
     that turns the motor on leaves it on for the rest of that pass. */
  function blBoardState(run, n) {
    var k = blStepAt(run, n);
    if (k < 0) return { leds: ART.kit.LED.dark };
    var st = { leds: run.steps[k].leds, motor: false, bell: false, beep: false };
    for (var j = 0; j <= k; j++) {
      if (run.steps[j].motor) st.motor = true;
      if (run.steps[j].bell) st.bell = true;
    }
    st.beep = run.steps[k].beep;
    return st;
  }

  /* the three programs the lesson builds in this lesson, run by the kit */
  var BL_FAN = blRun(["whenHot", "motor", "smile"]);
  var BL_NIGHT = blRun(["whenDark", "light", "beep"]);
  var BL_BEEP3 = blRun(["whenA", "repeat3", "beep"]);
  var BL_FLASH = blRun(["whenDark", "forever", "light", "wait", "dark", "wait"]);

  /* ---- a sweeping arc, for a loop going round ----------------------------- */
  function blArc(cx, cy, r, a0, a1, u, col, w) {
    if (!(u > 0)) return "";
    var a = a0 + (a1 - a0) * clamp(u, 0, 1);
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    var x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
    var big = Math.abs(a - a0) > Math.PI ? 1 : 0;
    var out = Pth("M" + n2(x0) + "," + n2(y0) + " A" + n2(r) + "," + n2(r) + " 0 " + big + " 1 " + n2(x1) + "," + n2(y1), null, col || P.gold, w || 7);
    var hd = (w || 7) * 2.2;
    out += Pth("M" + n2(x1) + "," + n2(y1) +
      " L" + n2(x1 + Math.sin(a) * hd - Math.cos(a) * hd * 0.6) + "," + n2(y1 - Math.cos(a) * hd - Math.sin(a) * hd * 0.6) +
      " L" + n2(x1 + Math.sin(a) * hd + Math.cos(a) * hd * 0.6) + "," + n2(y1 - Math.cos(a) * hd + Math.sin(a) * hd * 0.6) + " Z",
      col || P.gold, col || P.gold, 2);
    return out;
  }

  /* ==== the title ============================================================
     Bitsy's board with the kit's own heart pattern, its button on one side and
     its two sensors on the other, and a loop arrow sweeping round it. In the
     spoken title chapter each piece arrives as it is named; on the two cards
     it stands still. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cBtn = sn ? sc(sn, 0, "button") : null, cPress = sn ? sc(sn, 0, "press") : null,
      cSens = sn ? sc(sn, 0, "sensors") : null, cLoop = sn ? sc(sn, 1, "loop") : null,
      cRound = sn ? sc(sn, 1, "round") : null, cSelf = sn ? sc(sn, 1, "itself") : null;
    var pBoard = sn ? on(t, BEATS[sn.first].start, 0.7) : 1;
    var pBtn = sn ? popIn(t, cBtn, 0.4) : 1, pSens = sn ? popIn(t, cSens, 0.45) : 1;
    var pLoop = sn ? on(t, cLoop, 0.5) : 1, sweep = sn ? on(t, cRound, 1.5) : 1;
    var pSelf = sn ? popIn(t, cSelf, 0.4) : 1;

    out += R(6, 24, 348, 312, 30, P.card, P.line, 3);
    /* the board, with the kit's heart */
    out += G(R(112, 86, 136, 158, 18, P.night, P.line, 2.5) +
      blLeds(126, 104, 108, ART.leds("heart")), { opacity: Math.min(1, pBoard) });
    /* the button: pressed by a finger */
    out += MK.pop(C(66, 168, 30, P.cell, P.plum, 3) + Tx(66, 178, "A", "lab big", "middle", { fill: P.plum }), 66, 168, pBtn);
    if (sn) out += MK.ripple(66, 168, t, cPress, P.plum);
    /* the two sensors: nobody touches them */
    out += MK.pop(Em(300, 136, 46, "\u{1F321}️"), 300, 136, pSens);
    out += MK.pop(Em(300, 204, 44, "\u{1F319}"), 300, 204, pSens);
    /* the loop, round and round */
    out += blArc(180, 168, 132, -1.9, 3.6, pLoop * sweep, P.gold, 8);
    out += MK.tick(180, 296, 26, pSelf);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Bitsy\'s board of lights, its button and its two sensors, with a loop going round">' + out + "</svg>";
  }

  /* ==== chapter: Bitsy's sensors =============================================
     The five inputs stand in a list on the left, in the kit's own order, and
     Bitsy's board is on the right. Button A is pressed by a finger; the two
     sensors are not, and sense on their own - the temperature sensor warms,
     the light sensor goes dark. The last beat turns the list into the start of
     a program: a when block and two empty slots. */
  var BL_ROW = { x: 40, w: 508, h: 62, gap: 13 };
  function blRowY(k) { return 39 + k * (BL_ROW.h + BL_ROW.gap); }

  /* one input, named as the lesson names it. opt: {o, col, gauge (0-1),
     gaugeKind ("warm" | "dark"), finger, cross} */
  function blInputRow(k, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var id = BL_IN[k], x = BL_ROW.x, y = blRowY(k), w = BL_ROW.w, h = BL_ROW.h;
    var col = opt.col || P.line;
    var out = R(x, y, w, h, h * 0.30, P.cell, col, opt.col ? 3.5 : 2) +
      Em(x + h * 0.52, y + h / 2, h * 0.52, BL_IN_PIC[id]) +
      Tx(x + h * 0.95, y + h / 2 + 9, BL_IN_NAME[id], "lab", "start", { "font-size": 24, fill: opt.col ? P.gold : P.ink });
    /* what the sensor is sensing, on the beat that says so */
    if (opt.gauge > 0) {
      var bx = x + w - 168, by = y + h * 0.28, bw = 120, bh = h * 0.44;
      out += R(bx, by, bw, bh, bh / 2, P.card, P.line, 2);
      if (opt.gaugeKind === "warm") {
        out += R(bx + 3, by + 3, (bw - 6) * clamp(opt.gauge, 0, 1), bh - 6, (bh - 6) / 2, P.bad);
        out += Tx(x + w - 30, y + h / 2 + 7, "hot", "lab mid bad", "middle");
      } else {
        out += R(bx + 3, by + 3, (bw - 6) * (1 - clamp(opt.gauge, 0, 1)), bh - 6, (bh - 6) / 2, P.gold);
        out += Tx(x + w - 30, y + h / 2 + 7, "dark", "lab mid gold", "middle");
      }
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function blSensorsList(scene, t) {
    var cFive = sc(scene, 0, "five"), cA = sc(scene, 0, "a"), cShake = sc(scene, 0, "shake"), cMic = sc(scene, 0, "mic");
    var cTemp = sc(scene, 1, "temp"), cLight = sc(scene, 1, "light");
    var cSensor = sc(scene, 2, "sensor"), cItself = sc(scene, 2, "itself"), cNobody = sc(scene, 2, "nobody");
    var cWarm = sc(scene, 3, "warm"), cBright = sc(scene, 3, "bright");
    var arrive = { A: cA, shake: cShake, clap: cMic, hot: cTemp, dark: cLight };
    var out = "", i;

    /* The board's lights stay off all through this chapter: no program has
       been written yet, so nothing has switched an LED on. */
    var boardHot = on(t, cWarm, 0.9), boardDark = on(t, cBright, 0.9);
    out += blBoard(640, 64, 300, {
      o: on(t, cFive, 0.6), leds: ART.kit.LED.dark
    });
    /* what each sensor is sensing, beside the board */
    if (boardDark > 0) {
      out += MK.pop(Em(1010, 150, 64, "\u{1F319}"), 1010, 150, popIn(t, cBright, 0.4));
      out += Tx(1010, 236, "dark", "lab big gold", "middle", { opacity: boardDark });
    } else if (boardHot > 0) {
      out += MK.pop(Em(1010, 150, 64, "\u{1F321}️"), 1010, 150, popIn(t, cWarm, 0.4));
      out += Tx(1010, 236, "hot", "lab big bad", "middle", { opacity: boardHot });
    }

    for (i = 0; i < BL_IN.length; i++) {
      var id = BL_IN[i], at = arrive[id];
      var lit = BL_SENSES[id] && blPast(t, cTemp);
      var gauge = 0, kind = null;
      if (id === "hot") { gauge = on(t, cWarm, 1.1); kind = "warm"; }
      if (id === "dark") { gauge = on(t, cBright, 1.1); kind = "dark"; }
      out += blInputRow(i, { o: popIn(t, at, 0.45), col: lit ? P.gold : null, gauge: gauge, gaugeKind: kind });
    }
    /* button A is the one that wants a finger */
    var fp = on(t, cA, 0.4) * (1 - on(t, cTemp, 0.5));
    out += MK.finger(BL_ROW.x + 32, blRowY(0) + BL_ROW.h / 2 + 6, fp);
    out += MK.ripple(BL_ROW.x + 32, blRowY(0) + BL_ROW.h / 2, t, cA, P.plum);
    /* "A sensor": the word itself, on both of the rows that are sensors. It
       goes again as the next beat needs that end of the row for its gauge. */
    var pillGone = 1 - on(t, BEATS[scene.first + 3].start, 0.4);
    out += MK.pill(BL_ROW.x + BL_ROW.w - 64, blRowY(3) + BL_ROW.h / 2, "sensor", popIn(t, cSensor, 0.45) * pillGone, { size: 22, col: P.gold, ink: P.gold });
    out += MK.pill(BL_ROW.x + BL_ROW.w - 64, blRowY(4) + BL_ROW.h / 2, "sensor", popIn(t, cSensor == null ? null : cSensor + 0.22, 0.45) * pillGone, { size: 22, col: P.gold, ink: P.gold });
    /* "senses by itself": both sensors give out, into the space beside them
       rather than over their own words */
    var sp = on(t, cItself, 0.5) * (1 - on(t, cNobody, 0.4)) * (1 - on(t, BEATS[scene.first + 3].start, 0.5));
    if (sp > 0) {
      out += G(MK.waves(BL_ROW.x + BL_ROW.w + 8, blRowY(3) + BL_ROW.h / 2, t, cItself, { dir: 0, spread: 1.1, reach: 62, col: P.gold }) +
        MK.waves(BL_ROW.x + BL_ROW.w + 8, blRowY(4) + BL_ROW.h / 2, t, cItself, { dir: 0, spread: 1.1, reach: 62, col: P.gold }), { opacity: sp });
    }
    /* "Nobody presses a sensor": a finger beside one, crossed out */
    var np = on(t, cNobody, 0.45) * (1 - on(t, BEATS[scene.first + 3].start, 0.4));
    if (np > 0) {
      out += MK.finger(566, blRowY(3) + BL_ROW.h / 2 + 4, np);
      out += MK.cross(571, blRowY(3) + BL_ROW.h / 2 - 26, 22, popIn(t, cNobody, 0.4) * np);
    }
    return out;
  }

  /* the last beat: a program begins with a when block */
  function blSensorsProgram(scene, t) {
    var cStarts = sc(scene, 4, "starts"), cWhen = sc(scene, 4, "when");
    var out = "", x = 60, w = 440, h = 64;
    out += Tx(x, 78, "A program", "lab big gold", "start", { opacity: on(t, cStarts, 0.5) });
    out += blBlock(x, 110, w, h, "whenHot", { o: popIn(t, cWhen, 0.45), live: blPast(t, cWhen) });
    out += blSlot(x, 110 + h + 14, w, h, "then the outputs", on(t, cStarts, 0.6) * 0.9);
    out += blSlot(x, 110 + (h + 14) * 2, w, h, "then the outputs", on(t, cStarts, 0.6) * 0.9);
    out += MK.arrow(x + w + 22, 142, x + w + 92, 142, on(t, cWhen, 0.6), P.gold, 8);
    out += blBoard(640, 64, 300, { o: 1, leds: ART.kit.LED.dark });
    out += MK.waves(1010, 138, t, cWhen, { dir: -Math.PI / 2, spread: 1.3, reach: 46, col: P.bad });
    out += MK.pop(Em(1010, 150, 64, "\u{1F321}️"), 1010, 150, popIn(t, cWhen, 0.45));
    out += Tx(1010, 236, "it gets hot", "lab mid bad", "middle", { opacity: on(t, cWhen, 0.6) });
    return out;
  }

  function blSensorsChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(blSensorsList(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(blSensorsProgram(scene, t), { opacity: u });
    return svg(out);
  }
