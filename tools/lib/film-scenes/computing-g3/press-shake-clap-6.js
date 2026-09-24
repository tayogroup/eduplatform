  /* ==== Press, Shake, Clap, part 6: sense, decide, act - and the recap =======
     tools/lib/film-scenes/computing-g3/press-shake-clap-6.js. See the header of
     press-shake-clap.js. This file also holds KINDS, which the engine's tail
     needs, so it must stay last in renderer.scenes.

     The lesson's last lecture part names three parts of every control system,
     and then says: try it on a shop door that opens as you walk up. So the
     chapter draws the three boxes, fills them with the same inputs and
     outputs Bitsy has, and then tries it on the door. */

  var PS_SYS = { y: 62, w: 310, h: 236, xs: [28, 398, 768] };

  function psSysBox(k, title, o, inner, col) {
    if (!(o > 0)) return "";
    var x = PS_SYS.xs[k], y = PS_SYS.y;
    return G(R(x, y, PS_SYS.w, PS_SYS.h, 22, P.card, col || P.line, 3) +
      Tx(x + PS_SYS.w / 2, y + 44, title, "lab big", "middle", { fill: col || P.muted }) + inner,
      { opacity: Math.min(1, o), transform: around(x + PS_SYS.w / 2, y + PS_SYS.h / 2, 0.94 + 0.06 * Math.min(1, o)) });
  }

  /* the program, as a little card of blocks: the box that decides */
  function psProgramCard(cx, cy, w, o) {
    if (!(o > 0)) return "";
    var h = w * 0.62, x = cx - w / 2, y = cy - h / 2, out = R(x, y, w, h, 14, P.cell, P.blue, 3);
    for (var k = 0; k < 3; k++) {
      out += R(x + 16, y + 16 + k * ((h - 32) / 3), w - 32, (h - 32) / 3 - 8, 6, k === 0 ? P.gold : P.blue);
    }
    return G(out, { opacity: Math.min(1, o) });
  }

  function psSystemBoxes(scene, t) {
    var cSystem = sc(scene, 0, "system"), cThree = sc(scene, 0, "three");
    var cSenses = sc(scene, 1, "senses"), cButton = sc(scene, 1, "button"), cSensor = sc(scene, 1, "sensor"), cMic = sc(scene, 1, "mic");
    var cDecides = sc(scene, 2, "decides"), cProgram = sc(scene, 2, "program");
    var cActs = sc(scene, 3, "acts"), cLight = sc(scene, 3, "light"), cMotor = sc(scene, 3, "motor"), cSpeaker = sc(scene, 3, "speaker");
    var out = "", mid = PS_SYS.y + 148;

    var senseIn = "";
    [[cButton, null], [cSensor, null], [cMic, "\u{1F3A4}"]].forEach(function (p, k) {
      var cx = PS_SYS.xs[0] + 78 + k * 78, u = popIn(t, p[0], 0.4);
      if (!(u > 0)) return;
      var art = k === 0 ? psAicon(cx, mid, 56) : k === 1 ? psChip({ cx: cx, cy: mid, r: 22 }, 0) : Em(cx, mid, 52, p[1]);
      senseIn += MK.pop(art, cx, mid, u);
    });
    var actIn = "";
    [[cLight, "\u{1F4A1}"], [cMotor, "⚙️"], [cSpeaker, "\u{1F50A}"]].forEach(function (p, k) {
      var cx = PS_SYS.xs[2] + 78 + k * 78, u = popIn(t, p[0], 0.4);
      if (u > 0) actIn += MK.pop(Em(cx, mid, 52, p[1]), cx, mid, u);
    });

    var box = function (k) { return on(t, cSystem == null ? null : cSystem + k * 0.28, 0.5); };
    out += psSysBox(0, "senses", box(0), senseIn, psPast(t, cSenses) ? P.gold : null);
    out += psSysBox(1, "decides", box(1),
      psProgramCard(PS_SYS.xs[1] + PS_SYS.w / 2, mid, 190, popIn(t, cProgram, 0.45)), psPast(t, cDecides) ? P.blue : null);
    out += psSysBox(2, "acts", box(2), actIn, psPast(t, cActs) ? P.good : null);
    /* "the same three parts": one, two, three */
    for (var k = 0; k < 3; k++) {
      var np = popIn(t, cThree == null ? null : cThree + k * 0.16, 0.4);
      out += MK.pop(C(PS_SYS.xs[k] + 32, PS_SYS.y + 32, 19, P.cell, P.teal, 3) +
        Tx(PS_SYS.xs[k] + 32, PS_SYS.y + 39, String(k + 1), "lab", "middle", { fill: P.teal, "font-size": 22 }),
        PS_SYS.xs[k] + 32, PS_SYS.y + 32, np);
    }

    out += MK.arrow(346, 180, 390, 180, on(t, cSenses, 0.5), P.gold, 9);
    out += MK.arrow(716, 180, 760, 180, on(t, cActs, 0.5), P.good, 9);
    out += MK.pill(584, 372, "sense, decide, act", on(t, cSystem, 0.5), { size: 25, col: P.teal, ink: P.teal });
    return out;
  }

  /* the shop door: the same three parts, in a thing the child walks through */
  function psSystemDoor(scene, t) {
    var cShop = sc(scene, 4, "shop"), cWalk = sc(scene, 4, "walk");
    var out = "", o = on(t, cShop, 0.5), open = on(t, cWalk, 0.7);
    var fx = 470, fy = 96, fw = 250, fh = 212;
    /* the shop front: a fascia with the sensor on it, and two glass doors that
       open a gap down the middle as they slide into the doorway */
    var pw = (fw / 2) * (1 - 0.5 * ease(open));
    out += G(R(fx - 22, fy - 46, fw + 44, 44, 8, P.dark, P.edge, 3) +
      R(fx - 14, fy - 4, fw + 28, fh + 12, 6, P.body, P.edge, 4) + R(fx, fy, fw, fh, 2, "#0A1B27") +
      R(fx, fy, pw, fh, 2, "#2E5B78", P.plastic, 3) + R(fx + fw - pw, fy, pw, fh, 2, "#2E5B78", P.plastic, 3) +
      L(fx + pw - 14, fy + 60, fx + pw - 14, fy + 140, P.plastic, 5) +
      L(fx + fw - pw + 14, fy + 60, fx + fw - pw + 14, fy + 140, P.plastic, 5) +
      L(fx - 40, fy + fh + 10, fx + fw + 40, fy + fh + 10, P.line, 4),
      { opacity: o });
    out += C(fx + fw / 2, fy - 24, 12, open > 0 ? P.good : P.muted, P.edge, 2.5, { opacity: o });
    out += MK.waves(fx + fw / 2, fy - 12, t, cShop, { dir: 1.57, spread: 1.2, n: 2, period: 1.1, reach: 40, col: P.good });

    var walk = on(t, cShop == null ? null : cShop + 0.15, 1.5);
    out += Em(lerp(310, 424, walk), 246, 96, "\u{1F6B6}", { opacity: o });

    /* the same three words as the boxes above, each beside the part of the door
       it names: the sensor on the fascia, the program inside it, the motor that
       moves the panels */
    var mark = [
      function (cx, cy) { return C(cx, cy, 11, P.good, P.edge, 2.5); },
      function (cx, cy) { return psProgramCard(cx, cy, 34, 1); },
      function (cx, cy) { return Em(cx, cy, 34, "⚙️"); }
    ];
    /* p[3] is that pill's own half-width, so its mark sits beside it rather
       than under it */
    [["senses", 246, P.gold, 56], ["decides", 584, P.blue, 62], ["acts", 922, P.good, 42]].forEach(function (p, k) {
      var u = on(t, cShop == null ? null : cShop + 0.3 + k * 0.3, 0.45);
      if (!(u > 0)) return;
      out += G(mark[k](p[1] - p[3] - 26, 386), { opacity: u });
      out += MK.pill(p[1] + 8, 386, p[0], u, { size: 24, col: p[2], ink: p[2] });
    });
    out += MK.tick(922, 322, 26, popIn(t, cWalk, 0.4));
    return out;
  }

  function psSystemChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(psSystemBoxes(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(psSystemDoor(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== what you now know ====================================================== */

  function psCardInputs(cx, cy, size) {
    var s = size * 0.34;
    return psAicon(cx - s * 1.5, cy, s * 1.5) + psChip({ cx: cx, cy: cy, r: s * 0.6 }, 0) +
      Em(cx + s * 1.5, cy, s * 1.4, "\u{1F3A4}");
  }
  function psCardWhen(cx, cy, size) {
    var w = size * 1.9, h = size * 0.62, x = cx - w / 2, y = cy - h / 2;
    return Pth("M" + n2(x) + "," + n2(y + h) + " L" + n2(x) + "," + n2(y + h * 0.34) +
      " q0," + n2(-h * 0.34) + " " + n2(h * 0.34) + "," + n2(-h * 0.34) +
      " L" + n2(x + w - h * 0.34) + "," + n2(y) + " q" + n2(h * 0.34) + ",0 " + n2(h * 0.34) + "," + n2(h * 0.34) +
      " L" + n2(x + w) + "," + n2(y + h) + " Z", "#3A3216", P.gold, 3) +
      Tx(cx, cy + h * 0.2, "when", "lab", "middle", { fill: P.gold, "font-size": h * 0.58 });
  }
  function psCardOutputs(cx, cy, size) {
    var cell = size * 0.15, gap = size * 0.05, gw = 5 * cell + 4 * gap;
    var gx = cx - gw * 0.9, gy = cy - gw / 2, out = "";
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        var lit = PS_LED.heart[r].charAt(c) === "1";
        out += R(gx + c * (cell + gap), gy + r * (cell + gap), cell, cell, cell * 0.24, lit ? P.gold : "#123040", lit ? P.goldDeep : "#1C3E51", 1.2);
      }
    }
    return out + Em(cx + gw * 0.62, cy, size * 0.5, "\u{1F50A}");
  }
  function psCardDebug(cx, cy, size) {
    return Em(cx - size * 0.24, cy, size * 0.72, "\u{1F41B}") + MK.tick(cx + size * 0.34, cy, size * 0.24, 1);
  }
  function psCardMachine(cx, cy, size) {
    var lamp = size * 0.19, gap = size * 0.07, top = cy - (lamp * 3 + gap * 4) / 2;
    var cols = ["#E5484D", "#F4C95D", "#4FD1A0"], out = R(cx - lamp * 1.5, top, lamp * 3, lamp * 3 + gap * 4, lamp * 0.5, P.dark, P.edge, 2.5);
    for (var k = 0; k < 3; k++) out += C(cx, top + gap + lamp / 2 + k * (lamp + gap), lamp / 2, cols[k]);
    return out;
  }

  var PS_RECAP = [
    { beat: 0, at: "inputs", title: "Inputs", sub: "a press, a shake, a clap", pic: psCardInputs },
    { beat: 1, at: "when", title: "The when block", sub: "first, and it names the input", pic: psCardWhen },
    { beat: 1, at: "outputs", title: "Outputs", sub: "lights, a beep, a motor, a bell", pic: psCardOutputs },
    { beat: 2, at: "fix", title: "Debugging", sub: "test it, fix it, test again", pic: psCardDebug },
    { beat: 2, at: "control", title: "Machines", sub: "a program moves real things", pic: psCardMachine }
  ];

  /* ==== the chapters ============================================================ */
  var KINDS = {
    title: MK.titleKind({ sub: ["A press, a shake, a clap go in.", "Lights, a beep, a motor, a bell come out."] }),
    board: psBoardChapter,
    when: psWhenChapter,
    outputs: psOutputsChapter,
    test: psTestChapter,
    machines: psMachinesChapter,
    system: psSystemChapter,
    recap: MK.recapKind(PS_RECAP, { goBeat: 2, goAt: "control" })
  };
