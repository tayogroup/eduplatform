  /* ==== Press, Shake, Clap, part 2: the board ================================
     tools/lib/film-scenes/computing-g3/press-shake-clap-2.js. See the header of
     press-shake-clap.js.

     The board sits in the same place in both chapters and in all three of the
     first chapter's layouts, so it never jumps as one crossfades into the
     next. What Bitsy DOES is never decided here: psRunState is the kit's own
     doOne, walked over the plan ART.device.plan gives for the script. */

  /* what Bitsy is showing after the first n steps of a device plan. The kit's
     doOne: a block whose id names a light pattern sets the lights, and beep,
     motor and bell turn their own part on. */
  function psRunState(plan, n) {
    var st = { leds: PS_LED.dark, motor: false, bell: false, beep: false };
    for (var k = 0; k < n && k < plan.length; k++) {
      var id = plan[k][1];
      if (PS_LED[id]) st.leds = PS_LED[id];
      if (id === "beep") st.beep = true;
      if (id === "motor") st.motor = true;
      if (id === "bell") st.bell = true;
    }
    return st;
  }
  /* a motor that turns twice and stops where it started */
  function psSpin(t, at, span) { return at == null || t < at ? 0 : ease(clamp((t - at) / (span || 1.2), 0, 1)) * 720; }
  /* a bell that rings and settles */
  function psRingTilt(t, at, span) {
    if (at == null || t < at) return 0;
    var u = clamp((t - at) / (span || 1.1), 0, 1);
    return Math.sin((t - at) * 17) * 15 * (1 - u);
  }
  /* a board being shaken, and stopping */
  function psWobble(t, at, span) {
    if (at == null || t < at) return 0;
    var u = clamp((t - at) / (span || 1.2), 0, 1);
    return Math.sin((t - at) * 19) * 2.6 * (1 - u);
  }
  function psTurn(markup, g, deg) {
    if (!deg) return markup;
    return G(markup, { transform: "rotate(" + n2(deg) + " " + n2(g.box.x + g.box.w / 2) + " " + n2(g.box.y + g.box.h / 2) + ")" });
  }

  /* ==== chapter: a computer you can hold ======================================
     Bitsy in the middle, its three inputs listed on the left and its four
     outputs on the right, each row arriving as its part is named and the part
     itself ringing at the same moment. Then two short layouts: no screen but
     it runs programs, and the real board it is modelled on. */

  var PS_G = psGeom(392, 56, 384);          /* the board, in every layout of this chapter */
  var PS_INCOL = { x: 28, w: 280 }, PS_OUTCOL = { x: 856, w: 286 };

  function psAicon(cx, cy, s) {
    return C(cx, cy, s * 0.52, P.cell, P.edge, 2.5) + Tx(cx, cy + s * 0.2, "A", "lab", "middle", { fill: P.ink, "font-size": s * 0.62 });
  }
  function psShakeIcon(cx, cy, s) {
    return psChip({ cx: cx, cy: cy, r: s * 0.36 }, 0);
  }

  var PS_IN_ROWS = [
    { icon: psAicon, label: "button A", at: "button" },
    { icon: psShakeIcon, label: "shake sensor", at: "shake" },
    { icon: "\u{1F3A4}", label: "microphone", at: "mic" }
  ];
  var PS_OUT_ROWS = [
    { icon: "\u{1F4A1}", label: "the 25 lights", at: "lights" },
    { icon: "\u{1F50A}", label: "the speaker", at: "speaker" },
    { icon: "⚙️", label: "the motor", at: "motor" },
    { icon: "\u{1F514}", label: "the bell", at: "bell" }
  ];

  function psBoardMain(scene, t) {
    var cBitsy = sc(scene, 0, "bitsy"), cDevice = sc(scene, 0, "device"), cParts = sc(scene, 0, "parts");
    var cButton = sc(scene, 1, "button"), cInput = sc(scene, 1, "input"), cPress = sc(scene, 1, "press");
    var cShake = sc(scene, 2, "shake"), cMic = sc(scene, 2, "mic"), cClap = sc(scene, 2, "clap");
    var cLights = sc(scene, 3, "lights"), cSpeaker = sc(scene, 3, "speaker"), cMotor = sc(scene, 3, "motor"),
      cBell = sc(scene, 3, "bell"), cOutputs = sc(scene, 3, "outputs");
    var g = PS_G, at = { button: cButton, shake: cShake, mic: cMic, lights: cLights, speaker: cSpeaker, motor: cMotor, bell: cBell };
    var out = "";

    var press = psHold(t, cPress, 1.0), shaken = psHold(t, cShake, 1.2);
    var lit = psPast(t, cLights) ? PS_LED.light : PS_LED.dark;
    var board = psBoard(g, {
      leds: lit, pressA: press > 0, shakeLive: shaken,
      motorSpin: psSpin(t, cMotor, 1.2), bellTilt: psRingTilt(t, cBell, 1.1)
    });
    out += G(psTurn(board, g, psWobble(t, cShake, 1.2)),
      { transform: around(g.box.x + g.box.w / 2, g.box.y + g.box.h / 2, popIn(t, cBitsy, 0.5)), opacity: on(t, cBitsy, 0.4) });

    /* "real parts on it": each part answers in turn */
    var parts = [g.A, g.shake, g.mic, g.speaker, g.motor, g.bell];
    parts.forEach(function (p, k) { out += psRing(p, bump(t, cParts == null ? null : cParts + k * 0.17, 0.5), P.teal); });
    out += psGridRing(g, bump(t, cParts == null ? null : cParts + 6 * 0.17, 0.5), P.teal);

    /* the two columns */
    out += psHead(PS_INCOL.x + PS_INCOL.w / 2, 74, "INPUTS go in", on(t, cButton, 0.45), P.gold);
    PS_IN_ROWS.forEach(function (r, k) {
      var nx = PS_IN_ROWS[k + 1];
      var live = psPast(t, at[r.at]) && !(nx && psPast(t, at[nx.at]));
      out += psRow(PS_INCOL.x, 124 + k * 76, PS_INCOL.w, PS_ROW_H, r.icon, r.label, on(t, at[r.at], 0.45),
        { col: live && !psPast(t, cLights) ? P.gold : null });
    });
    out += MK.arrow(320, 214, 384, 214, on(t, cInput, 0.5), P.gold, 9);

    out += psHead(PS_OUTCOL.x + PS_OUTCOL.w / 2, 74, "OUTPUTS come out", on(t, cLights, 0.45), P.good);
    PS_OUT_ROWS.forEach(function (r, k) {
      out += psRow(PS_OUTCOL.x, 124 + k * 70, PS_OUTCOL.w, 58, r.icon, r.label, on(t, at[r.at], 0.45), { from: -14 });
    });
    out += MK.arrow(786, 214, 850, 214, on(t, cOutputs, 0.5), P.good, 9);

    /* the part being named, rung on the board */
    out += psRing(g.A, on(t, cButton, 0.4) * (1 - on(t, cShake, 0.4)), P.gold);
    out += MK.ripple(g.A.cx, g.A.cy, t, cPress, P.gold);
    out += MK.finger(g.A.cx, g.A.cy + g.A.r * 0.5, press);
    out += psRing(g.shake, on(t, cShake, 0.4) * (1 - on(t, cMic, 0.4)), P.gold);
    out += psRing(g.mic, on(t, cMic, 0.4) * (1 - on(t, cLights, 0.4)), P.gold);
    /* the clap, in the space the OUTPUTS column has not taken yet: a pair of
       hands to the right of the board and the sound travelling back into the
       microphone. Both are gone by the time that column arrives. */
    var cl = on(t, cClap, 0.35) * (1 - on(t, cLights, 0.4));
    if (cl > 0) {
      out += Em(892, 306, 64, "\u{1F44F}", { opacity: cl });
      /* the sound travels in the GAP between the hands and the board: at reach
         58 the widest ring reaches x = 782, and the board's right edge is 776.
         At the first reach the rings were drawn across the board itself and
         read as scratches over it. */
      out += MK.waves(858, 306, t, cClap, { dir: Math.PI, spread: 1.0, n: 3, period: 0.9, reach: 58, col: P.gold, until: cLights });
    }
    out += psGridRing(g, on(t, cLights, 0.4) * (1 - on(t, cSpeaker, 0.4)), P.good);
    out += psRing(g.speaker, on(t, cSpeaker, 0.4) * (1 - on(t, cMotor, 0.4)), P.good);
    out += MK.waves(g.speaker.cx + 16, g.speaker.cy, t, cSpeaker, { dir: 0, spread: 1.0, n: 3, period: 0.8, reach: 46, col: P.good, until: cSpeaker == null ? null : cSpeaker + 1.1 });
    out += psRing(g.motor, on(t, cMotor, 0.4) * (1 - on(t, cBell, 0.4)), P.good);
    out += psRing(g.bell, on(t, cBell, 0.4), P.good);

    out += MK.pill(g.box.x + g.box.w / 2, 402, "a physical computing device", on(t, cDevice, 0.5),
      { size: 24, col: P.teal, ink: P.teal });
    return out;
  }

  /* "no screen, but it runs programs": the screen it has not got on the left,
     the program it does run on the right, and the lights answering. */
  var PS_PROG = ["whenA", "heart", "beep"];
  var PS_PROG_PLAN = ART.device.plan(PS_PROG).plan;

  function psScreen(x, y, w, o) {
    if (!(o > 0)) return "";
    var h = w * 0.66;
    return G(R(x, y, w, h, 14, P.dark, P.edge, 4) + R(x + 12, y + 12, w - 24, h - 24, 8, "#0A1B27", P.line, 2) +
      R(x + w / 2 - 10, y + h, 20, 26, 4, P.edge) + R(x + w / 2 - 52, y + h + 26, 104, 12, 6, P.edge),
      { opacity: Math.min(1, o) });
  }

  function psBoardNoScreen(scene, t) {
    var cScreen = sc(scene, 4, "screen"), cRuns = sc(scene, 4, "runs"), cComputer = sc(scene, 4, "computer");
    var g = PS_G, out = "";
    var steps = tally(t, cRuns, 3, 0.9);
    var st = psRunState(PS_PROG_PLAN, psPast(t, cRuns) ? steps : 0);

    out += psBoard(g, { leds: st.leds });
    out += psScreen(70, 120, 210, on(t, cScreen, 0.45));
    out += MK.cross(175, 190, 46, popIn(t, cScreen == null ? null : cScreen + 0.3, 0.4));
    out += MK.pill(175, 316, "no screen", on(t, cScreen, 0.5), { size: 24, col: P.bad, ink: P.bad });

    PS_PROG.forEach(function (id, k) {
      out += psBlock(812, 90 + k * 78, 330, 64, id, on(t, cRuns == null ? null : cRuns + k * 0.22, 0.4));
    });
    out += MK.arrow(802, 214, 788, 214, on(t, cRuns == null ? null : cRuns + 0.6, 0.5), P.gold, 9);
    if (st.beep) out += MK.waves(g.speaker.cx + 16, g.speaker.cy, t, cRuns == null ? null : cRuns + 0.6, { dir: 0, spread: 1.0, n: 3, period: 0.8, reach: 44, col: P.good });
    out += MK.tick(g.box.x + g.box.w - 26, g.box.y + 18, 30, popIn(t, cComputer, 0.4));
    out += MK.pill(g.box.x + g.box.w / 2, 402, "it is a computer", on(t, cComputer, 0.5), { size: 25, col: P.good, ink: P.good });
    return out;
  }

  /* the real board the lesson says Bitsy is modelled on */
  function psMicrobit(x, y, w, o) {
    var h = w * 0.74, cell = w * 0.058, gap = w * 0.030, gw = 5 * cell + 4 * gap;
    var gx = x + w / 2 - gw / 2, gy = y + h * 0.40 - gw / 2;
    var g = { box: { x: x, y: y, w: w, h: h }, grid: { x: gx, y: gy, w: gw },
      A: { cx: x + w * 0.16, cy: y + h * 0.40, r: w * 0.062 }, B: { cx: x + w * 0.84, cy: y + h * 0.40, r: w * 0.062 } };
    var lit = o && o.lit, out = R(x, y, w, h, w * 0.05, "#1C4B3E", P.edge, 3);
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        out += R(gx + c * (cell + gap), gy + r * (cell + gap), cell, cell, cell * 0.24,
          lit ? P.gold : "#123040", lit ? P.goldDeep : "#1C3E51", 1.5);
      }
    }
    [["A", g.A], ["B", g.B]].forEach(function (p) {
      out += C(p[1].cx, p[1].cy, p[1].r, P.cell, P.edge, 3) +
        Tx(p[1].cx, p[1].cy + p[1].r * 0.38, p[0], "lab", "middle", { fill: P.ink, "font-size": p[1].r * 1.2 });
    });
    for (var k = 0; k < 5; k++) out += R(x + w * (0.12 + k * 0.19), y + h - w * 0.05, w * 0.09, w * 0.05, 3, P.gold);
    g.markup = out;
    return g;
  }

  function psBoardMicrobit(scene, t) {
    var cMicro = sc(scene, 5, "microbit"), cTwo = sc(scene, 5, "two"), cGrid = sc(scene, 5, "grid");
    var out = "", left = psGeom(96, 96, 300);
    out += psBoard(left, { leds: PS_LED.heart });
    out += MK.pill(left.box.x + left.box.w / 2, 404, "Bitsy", 1, { size: 25, col: P.teal, ink: P.teal });

    var mb = psMicrobit(620, 58, 420, { lit: psPast(t, cGrid) });
    var p = popIn(t, cMicro, 0.5);
    out += G(mb.markup, { transform: around(mb.box.x + mb.box.w / 2, mb.box.y + mb.box.h / 2, p), opacity: Math.min(1, p) });
    out += psRing(mb.A, popIn(t, cTwo, 0.4), P.gold) + psRing(mb.B, popIn(t, cTwo == null ? null : cTwo + 0.22, 0.4), P.gold);
    if (psPast(t, cGrid)) {
      var pad = 14 * (1 - Math.min(1, on(t, cGrid, 0.4))) + 8;
      out += R(mb.grid.x - pad, mb.grid.y - pad, mb.grid.w + pad * 2, mb.grid.w + pad * 2, pad, "none", P.good, 4, { opacity: on(t, cGrid, 0.4) });
    }
    out += MK.pill(mb.box.x + mb.box.w / 2, 404, "micro:bit: a real board", on(t, cMicro, 0.5), { size: 25, col: P.gold, ink: P.gold });
    return out;
  }

  function psBoardChapter(scene, beat, t, i) {
    var u4 = into(t, scene.first + 4), u5 = into(t, scene.first + 5), out = "";
    if (u4 < 1) out += G(psBoardMain(scene, t), { opacity: 1 - u4 });
    if (u4 > 0 && u5 < 1) out += G(psBoardNoScreen(scene, t), { opacity: u4 * (1 - u5) });
    if (u5 > 0) out += G(psBoardMicrobit(scene, t), { opacity: u5 });
    return svg(out);
  }
