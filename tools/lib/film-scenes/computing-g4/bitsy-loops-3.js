  /* ==== Bitsy Loops, part 3: control systems, and the board ==================
     tools/lib/film-scenes/computing-g4/bitsy-loops-3.js. Joined after
     bitsy-loops-2.js, in the same scope. The three control-system panels are
     Sense, Decide and Act, in the lesson's own order, filled in turn by the
     lesson's own four examples; then the four things the lesson says are NOT
     control systems; then the twenty-five LEDs and the real board beside them.
     The heart pattern is ART.leds("heart"), and every block label in the
     MakeCode table is ART.device.block(id).label, so nothing here is retyped
     from the lesson. */

  /* ---- three things a control system needs ------------------------------- */
  var BL_CS = [{ x: 40, title: "Sense" }, { x: 424, title: "Decide" }, { x: 808, title: "Act" }];
  var BL_CS_W = 320, BL_CS_Y = 96, BL_CS_H = 250;

  function blCsPanel(k, o, inner, caption, col) {
    if (!(o > 0)) return "";
    var c = BL_CS[k], x = c.x, cx = x + BL_CS_W / 2;
    var out = R(x, BL_CS_Y, BL_CS_W, BL_CS_H, 24, P.card, col || P.line, col ? 3.5 : 2.5) +
      Tx(cx, BL_CS_Y - 20, c.title, "lab big caps", "middle", { fill: col || P.muted }) +
      (inner || "") +
      (caption ? Tx(cx, BL_CS_Y + BL_CS_H - 26, caption, "lab mid", "middle") : "");
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a radiator, for the heating the thermostat switches on */
  function blRadiator(cx, cy, w, h, lit) {
    var out = R(cx - w / 2, cy - h / 2, w, h, 8, lit ? "#3A2A22" : P.cell, lit ? P.bad : P.line, 3);
    for (var k = 0; k < 5; k++)
      out += R(cx - w / 2 + 10 + k * (w - 20) / 5, cy - h / 2 + 9, (w - 20) / 5 - 7, h - 18, 4, lit ? P.bad : P.line);
    return out;
  }
  /* a street lamp, with its light on or off */
  function blLamp(cx, cy, h, lit, t) {
    var top = cy - h / 2;
    var out = R(cx - 5, top + 22, 10, h - 22, 4, P.plastic);
    out += Pth("M" + n2(cx) + "," + n2(top + 26) + " q0,-24 34,-24", null, P.plastic, 9);
    out += Pth("M" + n2(cx + 20) + "," + n2(top + 2) + " h30 l-7,20 h-16 Z", lit ? P.gold : P.cell, lit ? P.goldDeep : P.line, 2);
    if (lit) {
      out += MK.glow(cx + 35, top + 30, 74, P.gold, 1);
      out += Pth("M" + n2(cx + 21) + "," + n2(top + 24) + " L" + n2(cx - 8) + "," + n2(cy + h / 2) +
        " L" + n2(cx + 78) + "," + n2(cy + h / 2) + " Z", "rgba(244,201,93,0.16)");
    }
    return out;
  }
  /* a greenhouse whose roof pane swings open. The pane is hinged just under
     the ridge and lifts from flush with the roof to about 35 degrees, so it
     always stays inside the panel it is drawn in. */
  function blGreenhouse(cx, cy, w, u) {
    var h = w * 0.62, x = cx - w / 2, y = cy - h / 2, eaves = y + h * 0.32;
    var out = R(x, eaves, w, h * 0.68, 6, "rgba(110,157,232,0.12)", P.plastic, 3);
    out += Pth("M" + n2(x - 6) + "," + n2(eaves) + " L" + n2(cx) + "," + n2(y) +
      " L" + n2(x + w + 6) + "," + n2(eaves), null, P.plastic, 3);
    out += L(cx, eaves, cx, y + h, P.plastic, 1.5, { opacity: 0.45 });
    out += G(R(0, -5, w * 0.32, 10, 3, P.sky, P.plastic, 2),
      { transform: "translate(" + n2(cx + 8) + "," + n2(y + 12) + ") rotate(" + n2(20 - 55 * clamp(u, 0, 1)) + ")" });
    out += Em(cx, y + h * 0.80, w * 0.30, "\u{1F33F}");
    return out;
  }

  /* a small card of program blocks: the deciding in the middle */
  function blProgramCard(cx, cy, w, lines, col) {
    var h = 26, out = "";
    for (var k = 0; k < lines.length; k++)
      out += R(cx - w / 2, cy - (lines.length * (h + 8) - 8) / 2 + k * (h + 8), w, h, 8, P.cell, col || P.blue, 2) +
        Tx(cx, cy - (lines.length * (h + 8) - 8) / 2 + k * (h + 8) + 19, lines[k], "lab mid", "middle");
    return out;
  }

  /* what each example puts in the three panels */
  function blCsExample(which, t, u) {
    var mid = BL_CS_Y + 104;
    if (which === "thermo") return [
      { inner: Em(BL_CS[0].x + 160, mid, 76, "\u{1F321}️") + Tx(BL_CS[0].x + 160, mid + 62, "the room is cold", "lab mid bad", "middle"), cap: "a temperature sensor" },
      { inner: blProgramCard(BL_CS[1].x + 160, mid, 250, ["below 20: heating on", "above 20: heating off"]), cap: "a program decides" },
      { inner: G(blRadiator(BL_CS[2].x + 160, mid, 170, 92, u > 0.4), { opacity: 1 }), cap: "the heating comes on" }
    ];
    if (which === "lamp") return [
      { inner: Em(BL_CS[0].x + 160, mid, 72, "\u{1F319}") + Tx(BL_CS[0].x + 160, mid + 62, "it is dark", "lab mid gold", "middle"), cap: "a light sensor" },
      { inner: blProgramCard(BL_CS[1].x + 160, mid, 250, ["dark: lamp on", "morning: lamp off"]), cap: "a program decides" },
      { inner: blLamp(BL_CS[2].x + 130, mid, 128, u > 0.4, t), cap: "the lamp lights up" }
    ];
    if (which === "green") return [
      { inner: Em(BL_CS[0].x + 160, mid, 76, "\u{1F321}️") + Tx(BL_CS[0].x + 160, mid + 62, "too hot", "lab mid bad", "middle"), cap: "a temperature sensor" },
      { inner: blProgramCard(BL_CS[1].x + 160, mid, 250, ["too hot: open it", "cooler: close it"]), cap: "a program decides" },
      { inner: blGreenhouse(BL_CS[2].x + 160, mid + 10, 172, u), cap: "the window opens" }
    ];
    return [
      { inner: Em(BL_CS[0].x + 160, mid, 72, "\u{1F319}") + Tx(BL_CS[0].x + 160, mid + 62, "it gets dark", "lab mid gold", "middle"), cap: "Bitsy's light sensor" },
      { inner: blBlock(BL_CS[1].x + 22, mid - 30, 276, 60, "whenDark", { size: 20 }), cap: "a program decides" },
      { inner: blBoard(BL_CS[2].x + 88, BL_CS_Y + 26, 144, { leds: ART.leds("light") }), cap: "all lights on" }
    ];
  }

  /* ==== chapter: sense, decide, act ========================================== */
  var BL_CS_EX = [null, "thermo", "lamp", "green", "bitsy"];
  var BL_CS_NAME = { thermo: "a thermostat", lamp: "a street lamp", green: "a greenhouse", bitsy: "Bitsy's night light" };
  var BL_CS_CUE = {
    thermo: ["thermo", "cold", "heat"], lamp: ["lamp", "dark", "lights"],
    green: ["green", "heat", "window"], bitsy: ["bitsy", "three", "sda"]
  };

  function blControlPanel(scene, t, k) {
    var out = "";
    if (k === 0) {
      var cSense = sc(scene, 0, "sense"), cDecide = sc(scene, 0, "decide"), cAct = sc(scene, 0, "act");
      var at = [cSense, cDecide, cAct], words = ["a sensor", "a program", "an output"];
      var pics = ["\u{1F321}️", null, "⚙️"];
      for (var j = 0; j < 3; j++) {
        var p = popIn(t, at[j], 0.45), mid = BL_CS_Y + 100;
        var inner = j === 1 ? blProgramCard(BL_CS[1].x + 160, mid, 220, ["if this, do that"])
          : Em(BL_CS[j].x + 160, mid, 74, pics[j]);
        out += blCsPanel(j, p, inner, words[j], p > 0 ? P.good : null);
        if (j > 0) out += MK.arrow(BL_CS[j].x - 56, BL_CS_Y + BL_CS_H / 2, BL_CS[j].x - 10, BL_CS_Y + BL_CS_H / 2, on(t, at[j], 0.45), P.good, 8);
      }
      out += Tx(584, 404, "Sense, decide, act.", "lab big good", "middle", { opacity: on(t, cAct, 0.6) });
      return out;
    }
    var which = BL_CS_EX[k], cue3 = BL_CS_CUE[which];
    var c0 = sc(scene, k, cue3[0]), c1 = sc(scene, k, cue3[1]), c2 = sc(scene, k, cue3[2]);
    var u = on(t, c2, 0.7);
    var ex = blCsExample(which, t, u);
    var at2 = [c0, c1, c2];
    for (var m = 0; m < 3; m++) {
      var pm = m === 0 ? on(t, c0, 0.4) : m === 1 ? on(t, c1, 0.5) : on(t, c2, 0.5);
      out += blCsPanel(m, Math.max(pm, 0.28), G(ex[m].inner, { opacity: pm }), ex[m].cap, pm > 0.5 ? P.good : null);
      if (m > 0) out += MK.arrow(BL_CS[m].x - 56, BL_CS_Y + BL_CS_H / 2, BL_CS[m].x - 10, BL_CS_Y + BL_CS_H / 2, on(t, at2[m], 0.45), P.good, 8);
    }
    out += MK.pill(584, 404, BL_CS_NAME[which], popIn(t, c0, 0.45), { size: 26, col: P.good, ink: P.good });
    /* nobody flicks a switch: a hand, crossed out, beside the lamp */
    if (which === "lamp") {
      var nb = popIn(t, sc(scene, 2, "nobody"), 0.45);
      out += MK.finger(1090, 152, Math.min(1, nb));
      out += MK.cross(1095, 122, 21, nb);
    }
    if (which === "bitsy") out += MK.tick(1088, 42, 30, popIn(t, sc(scene, 4, "sda"), 0.45));
    return out;
  }

  function blControlChapter(scene, beat, t, i) {
    return svg(crossfade(t, i, scene, function (k) { return blControlPanel(scene, t, k - scene.first); }));
  }

  /* ==== chapter: not a control system =========================================
     The lesson's own four: a candle, a pencil, a bicycle and a radio somebody
     switches on. Then the strip again, with a person where the program was. */
  var BL_NOT = [
    { pic: "\u{1F56F}️", label: "a candle", at: "candle" },
    { pic: "✏️", label: "a pencil", at: "pencil" },
    { pic: "\u{1F6B2}", label: "a bicycle", at: "bike" },
    { pic: "\u{1F4FB}", label: "a radio", at: "radio" }
  ];
  var BL_NOT_W = 240, BL_NOT_H = 168;
  function blNotX(k) { return 40 + k * 272; }

  function blNotCard(k, o, crossP) {
    if (!(o > 0)) return "";
    var x = blNotX(k), y = 26, it = BL_NOT[k];
    var out = R(x, y, BL_NOT_W, BL_NOT_H, 22, P.card, P.line, 2.5) +
      Em(x + BL_NOT_W / 2, y + 66, 68, it.pic) +
      Tx(x + BL_NOT_W / 2, y + 136, it.label, "lab big", "middle");
    out += MK.cross(x + BL_NOT_W - 30, y + 30, 24, crossP);
    return G(out, { transform: around(x + BL_NOT_W / 2, y + BL_NOT_H / 2, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  /* the strip, with whatever is doing the deciding in the middle */
  var BL_STRIP = [180, 464, 748], BL_STRIP_W = 240, BL_STRIP_Y = 236, BL_STRIP_H = 150;
  function blStripBox(k, title, inner, o, col) {
    if (!(o > 0)) return "";
    var x = BL_STRIP[k];
    return G(R(x, BL_STRIP_Y, BL_STRIP_W, BL_STRIP_H, 20, P.card, col || P.line, col ? 3.5 : 2.5) +
      Tx(x + BL_STRIP_W / 2, BL_STRIP_Y + 30, title, "lab mid caps", "middle", { fill: col || P.muted }) +
      (inner || ""), { opacity: clamp(o, 0, 1) });
  }

  function blNotChapter(scene, beat, t, i) {
    var cCandle = sc(scene, 0, "candle"), cPencil = sc(scene, 0, "pencil"), cBike = sc(scene, 0, "bike"), cNothing = sc(scene, 0, "nothing");
    var cRadio = sc(scene, 1, "radio"), cHand = sc(scene, 1, "hand"), cNot = sc(scene, 1, "not");
    var cPerson = sc(scene, 2, "person"), cMiddle = sc(scene, 2, "middle");
    var cItself = sc(scene, 3, "itself"), cSensor = sc(scene, 3, "sensor");
    var at = [cCandle, cPencil, cBike, cRadio];
    var crossAt = [cNothing, cNothing == null ? null : cNothing + 0.3, cNothing == null ? null : cNothing + 0.6, cNot];
    var out = "", k;

    var fade = 1 - on(t, cPerson, 0.55) * 0.72;
    for (k = 0; k < 4; k++) out += G(blNotCard(k, popIn(t, at[k], 0.45), popIn(t, crossAt[k], 0.4)), { opacity: fade });
    /* the hand that switches the radio on */
    out += G(MK.finger(blNotX(3) + 60, 96, on(t, cHand, 0.4) * (1 - on(t, cNot, 0.45))), { opacity: fade });

    /* the strip: a person deciding, then a sensor and a program deciding */
    var sp = on(t, cPerson, 0.5), mid = BL_STRIP_Y + 92;
    if (sp > 0) {
      var swap = on(t, cItself, 0.55);
      out += blStripBox(0, "Sense", swap > 0.4
        ? Em(BL_STRIP[0] + BL_STRIP_W / 2, mid, 64, "\u{1F319}")
        : MK.cross(BL_STRIP[0] + BL_STRIP_W / 2, mid, 30, 1), sp, swap > 0.4 ? P.good : P.line);
      out += blStripBox(1, "Decide", swap > 0.4
        ? blProgramCard(BL_STRIP[1] + BL_STRIP_W / 2, mid, 200, ["dark: lamp on"])
        : Em(BL_STRIP[1] + BL_STRIP_W / 2, mid, 64, "\u{1F9D2}"), sp, swap > 0.4 ? P.good : P.bad);
      out += blStripBox(2, "Act", Em(BL_STRIP[2] + BL_STRIP_W / 2, mid, 62, "\u{1F4A1}"), sp, swap > 0.4 ? P.good : P.line);
      for (k = 1; k < 3; k++)
        out += MK.arrow(BL_STRIP[k] - 40, BL_STRIP_Y + BL_STRIP_H / 2, BL_STRIP[k] - 8, BL_STRIP_Y + BL_STRIP_H / 2,
          sp, swap > 0.4 ? P.good : P.muted, 7);
      out += Tx(584, 420, swap > 0.4 ? "a sensor and a program decide" : "a person decides every time",
        "lab big", "middle", { fill: swap > 0.4 ? P.good : P.bad, opacity: Math.max(on(t, cMiddle, 0.5), on(t, cItself, 0.5)) });
      out += MK.tick(1060, BL_STRIP_Y + 24, 28, popIn(t, cSensor, 0.45));
    }
    return svg(out);
  }

  /* ==== chapter: the lights have a name ======================================
     Twenty-five LEDs, counted five across and five down, then the kit's own
     heart pattern on them, then the same grid on a real micro:bit and the
     block names it uses. */
  var BL_BIG = { x: 150, y: 50, w: 330 };

  function blBoardPanel(scene, t, k) {
    var out = "";
    if (k <= 3) {
      var cScreen = sc(scene, 0, "screen"), cTf = sc(scene, 0, "twentyfive"), cGrid = sc(scene, 0, "grid");
      var cCount = sc(scene, 1, "count"), cAcross = sc(scene, 1, "across"), cDown = sc(scene, 1, "down");
      var cEach = sc(scene, 2, "each"), cLed = sc(scene, 2, "led"), cPower = sc(scene, 2, "power");
      var cHeart = sc(scene, 3, "heart"), cOn = sc(scene, 3, "on"), cOff = sc(scene, 3, "off");
      var show = blPast(t, cHeart);
      var g = BL_BIG.w * 0.62, gx = BL_BIG.x + (BL_BIG.w - g) / 2, gy = BL_BIG.y + BL_BIG.w * 0.98 * 0.15, s = g / 5;
      out += blBoard(BL_BIG.x, BL_BIG.y, BL_BIG.w, {
        o: on(t, cScreen, 0.6), leds: show ? ART.leds("heart") : ART.kit.LED.dark,
        ring: blPast(t, cEach) && !show ? [2, 2] : null, ringCol: P.gold
      });
      /* the grid, ringed as a grid - and gold from "Count them" on, so the
         words that start the counting change something at once */
      var counting = blPast(t, cCount);
      out += R(gx - s * 0.3, gy - s * 0.3, g + s * 0.6, g + s * 0.6, s * 0.4, "none",
        counting ? P.gold : P.teal, counting ? 5 : 4, { opacity: on(t, cGrid, 0.5) });
      out += MK.pill(860, 70, "twenty-five lights", popIn(t, cTf, 0.45), { size: 28, col: P.teal, ink: P.teal });
      /* five across, then five down, counted out */
      var nA = tally(t, cAcross, 5, 0.7), nD = tally(t, cDown, 5, 0.7);
      for (var c = 0; c < nA; c++) out += Tx(gx + c * s + s / 2, BL_BIG.y - 12, String(c + 1), "lab mid", "middle", { fill: P.teal });
      for (var r = 0; r < nD; r++) out += Tx(BL_BIG.x - 20, gy + r * s + s / 2 + 7, String(r + 1), "lab mid", "middle", { fill: P.teal });
      /* one of the twenty-five, named */
      var lp = on(t, cLed, 0.6);
      out += MK.leader(gx + 2 * s + s / 2 + 26, gy + 2 * s + s / 2, 760, 150, lp, P.gold);
      out += MK.pill(860, 150, "LED", popIn(t, cLed, 0.45), { size: 34, col: P.gold, ink: P.gold });
      out += Tx(860, 208, "uses very little power", "lab big muted", "middle", { opacity: on(t, cPower, 0.5) });
      /* show a heart: some on, the rest off */
      out += blBlock(690, 250, 340, 64, "heart", { o: popIn(t, cHeart, 0.45), live: show });
      out += MK.pop(C(706, 352, 26, P.gold, P.goldDeep, 2) + Tx(748, 362, "on", "lab big gold", "start"), 706, 352, popIn(t, cOn, 0.42));
      out += MK.pop(C(886, 352, 26, P.cell, P.line, 2) + Tx(928, 362, "off", "lab big muted", "start"), 886, 352, popIn(t, cOff, 0.42));
      return out;
    }
    /* the real board, and the blocks it uses */
    var cReal = sc(scene, 4, "real"), cMicro = sc(scene, 4, "micro"), cSame = sc(scene, 4, "same");
    var cMake = sc(scene, 5, "makecode"), cBlocks = sc(scene, 5, "blocks");
    out += blBoard(60, 46, 230, { leds: ART.leds("heart"), o: 1 });
    out += blMicrobit(360, 66, 330, ART.leds("heart"), on(t, cReal, 0.5), blPast(t, cSame));
    out += MK.pill(175, 334, "Bitsy", 1, { size: 24, col: P.teal, ink: P.teal });
    out += MK.pill(525, 344, "micro:bit", popIn(t, cMicro, 0.45), { size: 24, col: P.gold, ink: P.gold });
    out += MK.arrow(300, 170, 348, 170, on(t, cSame, 0.5), P.gold, 8);
    /* the same blocks, by their two names */
    var rows = [["whenA", "on button A pressed"], ["heart", "show icon"], ["beep", "play tone"]];
    out += Tx(960, 40, "MakeCode", "lab big gold", "middle", { opacity: on(t, cMake, 0.5) });
    rows.forEach(function (row, j) {
      var p = popIn(t, cBlocks == null ? cMake : cBlocks + j * 0.26, 0.4), y = 90 + j * 108;
      out += MK.pill(960, y, ART.device.block(row[0]).label, p, { size: 19, col: P.teal });
      out += MK.arrow(960, y + 18, 960, y + 40, Math.min(1, p), P.muted, 5);
      out += MK.pill(960, y + 62, row[1], p, { size: 19, col: P.gold, ink: P.gold });
    });
    return out;
  }

  /* a real micro:bit: the same five by five grid, two buttons, gold pins */
  function blMicrobit(x, y, w, leds, o, lit) {
    if (!(o > 0)) return "";
    var h = w * 0.72, g = w * 0.40, gx = x + (w - g) / 2, gy = y + h * 0.16;
    var out = R(x, y, w, h, 16, P.card, lit ? P.gold : P.line, 3);
    out += blLeds(gx, gy, g, lit ? leds : ART.kit.LED.dark);
    out += C(x + w * 0.12, y + h * 0.46, w * 0.065, P.cell, P.plastic, 3) +
      Tx(x + w * 0.12, y + h * 0.46 + 8, "A", "lab mid", "middle");
    out += C(x + w * 0.88, y + h * 0.46, w * 0.065, P.cell, P.plastic, 3) +
      Tx(x + w * 0.88, y + h * 0.46 + 8, "B", "lab mid", "middle");
    for (var k = 0; k < 5; k++) out += R(x + w * (0.10 + k * 0.195), y + h - 16, w * 0.085, 16, 3, P.gold);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function blBoardChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(blBoardPanel(scene, t, Math.min(i - scene.first, 3)), { opacity: 1 - u });
    if (u > 0) out += G(blBoardPanel(scene, t, Math.max(i - scene.first, 4)), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------
     The lesson's own five words, with its own pictures for them. */
  var BL_RECAP = MK.recapKind([
    { beat: 0, at: "sensor", title: "Sensor", sub: "it senses by itself", pic: "\u{1F321}️" },
    { beat: 1, at: "repeat", title: "Count-controlled loop", sub: "counts, then stops", pic: "\u{1F522}" },
    { beat: 1, at: "forever", title: "Forever loop", sub: "runs until Stop", pic: "♾️" },
    { beat: 2, at: "led", title: "LED", sub: "a tiny light", pic: "\u{1F4A1}" },
    { beat: 3, at: "control", title: "Control system", sub: "sense, decide, act", pic: "\u{1F39B}️" }
  ], { goBeat: 3, goAt: "control" });

  var KINDS = {
    title: MK.titleKind({ sub: ["How a sensor starts a program by itself", "A loop that counts, and a loop that never stops", "Where a control system is sensing and deciding near you"] }),
    sensors: blSensorsChapter, programs: blProgramsChapter, loops: blLoopsChapter,
    control: blControlChapter, notcontrol: blNotChapter, board: blBoardChapter, recap: BL_RECAP
  };
