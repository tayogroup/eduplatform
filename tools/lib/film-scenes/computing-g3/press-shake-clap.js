  /* ==== Grade 3 Computing, Lesson 7: Press, Shake, Clap =======================
     tools/lib/film-scenes/computing-g3/press-shake-clap.js, with -2.js, -3.js
     and -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/press-shake-clap.json.

     BITSY'S BOARD IS DRAWN HERE, and the semantics are the kit's. The lesson
     keeps its board inside deviceProgram's closure, so there is nothing to
     lift (the adapter says so: there is no ART.sim in Computing). What IS
     lifted is everything a picture could get wrong:

         ART.leds(name)          the 5 x 5 pattern for heart, smile, light, dark
         ART.device.block(id)    a block's label and icon, in the lesson's words
         ART.device.plan(script) the order the outputs actually run in

     so an input named in the narration always shows the light pattern the
     lesson's own program would produce.

     This file: the palette, the timing helpers, the board and its parts, the
     labelled rows and blocks every chapter shares, and the title motif. Every
     top-level name here starts with ps. */

  var HUE = {
    title: P.teal, board: P.gold, when: P.accent, outputs: P.blue,
    test: P.plum, machines: P.good, system: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does */
  function psOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function psFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function psPast(t, at) { return at != null && t >= at; }
  /* 1 for span seconds after at, then 0: a thing that happens and is over */
  function psHold(t, at, span) { return at != null && t >= at && t < at + span ? 1 : 0; }

  /* ---- Bitsy's four light patterns, straight from the kit --------------------- */
  var PS_LED = {
    heart: ART.leds("heart"), smile: ART.leds("smile"),
    light: ART.leds("light"), dark: ART.leds("dark")
  };

  /* ---- the board -------------------------------------------------------------
     A box with the 25 lights in it, the three inputs along the bottom and the
     three other outputs down the right-hand side. psGeom gives every part a
     centre and a radius, so a chapter can ring one, point at it or hang a
     label off it without knowing how the board is drawn. */
  function psGeom(x, y, w) {
    var h = w * 0.80, cell = w * 0.075, gap = w * 0.022, gw = 5 * cell + 4 * gap;
    var gcx = x + w * 0.40, gcy = y + h * 0.34, r = w * 0.062;
    return {
      box: { x: x, y: y, w: w, h: h },
      grid: { x: gcx - gw / 2, y: gcy - gw / 2, w: gw, cell: cell, gap: gap, cx: gcx, cy: gcy, r: gw * 0.6 },
      A: { cx: x + w * 0.15, cy: y + h * 0.83, r: r },
      shake: { cx: x + w * 0.40, cy: y + h * 0.83, r: r },
      mic: { cx: x + w * 0.64, cy: y + h * 0.83, r: r },
      speaker: { cx: x + w * 0.83, cy: y + h * 0.20, r: r },
      motor: { cx: x + w * 0.83, cy: y + h * 0.46, r: r },
      bell: { cx: x + w * 0.83, cy: y + h * 0.72, r: r }
    };
  }

  /* the shake sensor: a little chip with four pins, and motion lines while it
     is being shaken */
  function psChip(p, live) {
    var s = p.r * 1.05, out = "";
    for (var k = 0; k < 3; k++) {
      var py = p.cy - s * 0.5 + k * s * 0.5;
      out += L(p.cx - s - s * 0.34, py, p.cx - s, py, P.edge, 3) + L(p.cx + s, py, p.cx + s + s * 0.34, py, P.edge, 3);
    }
    out += R(p.cx - s, p.cy - s * 0.82, s * 2, s * 1.64, s * 0.24, P.dark, P.edge, 3) +
      C(p.cx, p.cy, s * 0.36, "none", P.plastic, 3);
    if (live > 0) {
      out += Pth("M" + n2(p.cx - s * 2.0) + "," + n2(p.cy - s * 0.4) + " q" + n2(-s * 0.5) + "," + n2(s * 0.4) + " 0," + n2(s * 0.8), null, P.gold, 4, { opacity: live }) +
        Pth("M" + n2(p.cx + s * 2.0) + "," + n2(p.cy - s * 0.4) + " q" + n2(s * 0.5) + "," + n2(s * 0.4) + " 0," + n2(s * 0.8), null, P.gold, 4, { opacity: live });
    }
    return out;
  }

  /* o: {leds, pressA, shakeLive, motorSpin (degrees), bellTilt (degrees)} */
  function psBoard(g, o) {
    o = o || {};
    var b = g.box, leds = o.leds || PS_LED.dark, gr = g.grid, out = "";
    out += R(b.x, b.y, b.w, b.h, b.w * 0.06, P.body, P.edge, 3);
    var pad = gr.cell * 0.36;
    out += R(gr.x - pad, gr.y - pad, gr.w + pad * 2, gr.w + pad * 2, pad, "#081821", P.line, 2);
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        var lit = leds[r].charAt(c) === "1";
        out += R(gr.x + c * (gr.cell + gr.gap), gr.y + r * (gr.cell + gr.gap), gr.cell, gr.cell, gr.cell * 0.22,
          lit ? P.gold : "#123040", lit ? P.goldDeep : "#1C3E51", 1.5);
      }
    }
    out += C(g.A.cx, g.A.cy, g.A.r, o.pressA ? P.gold : P.cell, P.edge, 3) +
      Tx(g.A.cx, g.A.cy + g.A.r * 0.38, "A", "lab", "middle",
        { fill: o.pressA ? P.dark : P.ink, "font-size": g.A.r * 1.2 });
    out += psChip(g.shake, o.shakeLive || 0);
    out += Em(g.mic.cx, g.mic.cy, g.mic.r * 1.7, "\u{1F3A4}");
    out += Em(g.speaker.cx, g.speaker.cy, g.speaker.r * 1.7, "\u{1F50A}");
    out += G(Em(0, 0, g.motor.r * 1.8, "⚙️"),
      { transform: tr(g.motor.cx, g.motor.cy) + " rotate(" + n2(o.motorSpin || 0) + ")" });
    out += G(Em(0, 0, g.bell.r * 1.7, "\u{1F514}"),
      { transform: tr(g.bell.cx, g.bell.cy) + " rotate(" + n2(o.bellTilt || 0) + ")" });
    return out;
  }

  /* a ring round one part, the way the lesson rings a part the child taps */
  function psRing(p, u, col) {
    if (!(u > 0)) return "";
    var k = Math.min(1, u);
    return C(p.cx, p.cy, p.r * (1.55 - 0.25 * k), "none", col || P.gold, 4, { opacity: k });
  }
  function psGridRing(g, u, col) {
    if (!(u > 0)) return "";
    var k = Math.min(1, u), pad = g.grid.cell * (1.1 - 0.4 * k);
    return R(g.grid.x - pad, g.grid.y - pad, g.grid.w + pad * 2, g.grid.w + pad * 2, pad, "none", col || P.gold, 4, { opacity: k });
  }

  /* ---- a labelled row: an icon and a few words, for the input and output lists */
  var PS_ROW_H = 62;
  function psRow(x, y, w, h, icon, label, o, opt) {
    opt = opt || {};
    var op = o == null ? 1 : Math.min(1, o);
    if (!(op > 0)) return "";
    var col = opt.col || P.line, fs = Math.min(25, h * 0.40);
    return G(R(x, y, w, h, h * 0.30, opt.fill || P.cell, col, opt.col ? 3.5 : 2) +
      (typeof icon === "function" ? icon(x + h * 0.56, y + h / 2, h * 0.52)
        : Em(x + h * 0.56, y + h / 2, h * 0.56, icon)) +
      Tx(x + h * 1.02, y + h / 2 + fs * 0.35, label, "lab", "start", { "font-size": fs, fill: opt.ink || P.ink }),
      { opacity: op, transform: "translate(" + n2((1 - op) * (opt.from || 14)) + ",0)" });
  }

  /* ---- a Bitsy block, in the lesson's own words --------------------------------
     The label and the icon come from ART.device.block, so a block in this film
     says exactly what the same block says on the lesson page. A hat block (the
     when block) is gold with a notch on top; an output block is plain. */
  function psBlock(x, y, w, h, id, o, opt) {
    opt = opt || {};
    var op = o == null ? 1 : Math.min(1, o);
    if (!(op > 0)) return "";
    var b = ART.device.block(id), hat = b.cat === "hat";
    var col = opt.col || (hat ? P.gold : P.blue);
    /* the label is the lesson's own, so the type fits the label rather than
       the other way round; it never goes under lab mid (19px) */
    var fs = Math.max(19, Math.min(24, h * 0.42, (w - h * 1.02 - 12) / Math.max(1, b.label.length * 0.52)));
    var body = hat
      ? Pth("M" + n2(x) + "," + n2(y + h) + " L" + n2(x) + "," + n2(y + h * 0.30) +
          " q0," + n2(-h * 0.30) + " " + n2(h * 0.30) + "," + n2(-h * 0.30) +
          " L" + n2(x + w - h * 0.30) + "," + n2(y) + " q" + n2(h * 0.30) + ",0 " + n2(h * 0.30) + "," + n2(h * 0.30) +
          " L" + n2(x + w) + "," + n2(y + h) + " Z", opt.fill || "#3A3216", col, 3)
      : R(x, y, w, h, h * 0.24, opt.fill || P.cell, col, 3);
    return G(body +
      Em(x + h * 0.54, y + h * 0.56, h * 0.48, b.icon) +
      Tx(x + h * 1.02, y + h * 0.56 + fs * 0.34, b.label, "lab", "start", { "font-size": fs, fill: opt.ink || P.ink }),
      { opacity: op, transform: opt.dx || opt.dy ? "translate(" + n2(opt.dx || 0) + "," + n2(opt.dy || 0) + ")" : null });
  }

  /* a small heading over a column */
  function psHead(cx, y, text, o, col) {
    return MK.pill(cx, y, text, o, { size: 23, col: col || P.line, ink: col || P.muted, fill: P.card });
  }

  /* ==== the title ===============================================================
     Bitsy, with its three inputs answering in turn - a press on button A, a
     shake, a clap into the microphone - and then the heart on the lights.
     On the two silent cards it stands still with the heart lit. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cPress = sn ? sc(sn, 0, "press") : null, cShake = sn ? sc(sn, 0, "shake") : null,
      cClap = sn ? sc(sn, 0, "clap") : null, cBitsy = sn ? sc(sn, 1, "bitsy") : null,
      cFeels = sn ? sc(sn, 1, "feels") : null;
    var g = psGeom(44, 92, 272);

    var press = sn ? psHold(t, cPress, 1.1) : 1;
    var shake = sn ? psHold(t, cShake, 1.1) : 0;
    var clap = sn ? on(t, cClap, 0.4) : 0;
    var lit = sn ? (psPast(t, cFeels) ? PS_LED.heart : PS_LED.dark) : PS_LED.heart;
    var wob = shake ? Math.sin((t - cShake) * 19) * 2.2 : 0;

    out += G(psBoard(g, { leds: lit, pressA: press > 0, shakeLive: shake, bellTilt: 0 }),
      { transform: "rotate(" + n2(wob) + " " + n2(g.box.x + g.box.w / 2) + " " + n2(g.box.y + g.box.h / 2) + ")" });
    out += psRing(g.A, press, P.gold);
    out += MK.ripple(g.A.cx, g.A.cy, t, cPress, P.gold);
    out += psRing(g.shake, shake, P.gold);
    out += psRing(g.mic, clap, P.gold);
    if (clap > 0) {
      out += Em(g.mic.cx + 44, g.mic.cy + 34, 40, "\u{1F44F}", { opacity: clap });
      /* the rings stay in the 55 units between the hands and the microphone;
         at the first reach the widest one ran straight through the microphone
         and read as a line scored across it */
      out += MK.waves(g.mic.cx + 44, g.mic.cy + 30, t, cClap, { dir: -2.49, spread: 1.0, n: 2, period: 0.8, reach: 22, col: P.gold });
    }
    out += psGridRing(g, sn ? popIn(t, cBitsy, 0.5) : 0, P.teal);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Bitsy: a small board with a grid of lights, a button A, a shake sensor and a microphone">' +
      out + "</svg>";
  }
