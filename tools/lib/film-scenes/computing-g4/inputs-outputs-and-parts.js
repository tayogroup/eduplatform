  /* ==== Grade 4 Computing, Lesson 6: Inputs, Outputs and Parts ================
     tools/lib/film-scenes/computing-g4/inputs-outputs-and-parts.js, with -2.js
     and -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/inputs-outputs-and-parts.json.

     WHAT IS BORROWED RATHER THAN RETYPED. The hardware in the first chapter is
     the lesson kit's own laptop and tablet (ART.figure), rung and dimmed part
     by part exactly as the lesson rings them. Every block in every program box
     is ART.block(id), so its label and its icon are the lesson's. And every
     COUNT the voice says is taken from the kit's own rules rather than from a
     number typed here: ART.program.expand(["repeat2", "jump"]) is what makes
     "two jumps" two hops, and ART.run tells the film that go home puts the cat
     back at nought and that move right three times ends three squares along.

     This file: the palette, the timing helpers, the pieces every chapter shares
     (a keycap, a mouse pointer, a block chip, the sprite stage and the cat),
     the title motif and the chapter "Inputs to a program".
     Every top-level name here starts with io, so nothing can replace a name of
     the engine, ART or MK. */

  var HUE = {
    title: P.teal, inputs: P.gold, plan: P.accent, parts: P.plum,
    fix: P.good, system: P.blue, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function ioPast(t, at) { return at != null && t >= at; }
  /* 0 -> 1 over span from at, and back to 0 span later: an action that finishes */
  function ioDo(t, at, span) {
    if (at == null || t < at) return 0;
    return clamp((t - at) / span, 0, 1);
  }

  /* ---- the pieces every chapter shares ---------------------------------------- */

  /* A key on a keyboard. Drawn rather than lettered with an emoji: this
     machine's emoji for the A button is a solid tile, and the lesson's words
     are "press A" and "press the space bar", which a keycap says plainly. */
  function ioKey(cx, cy, w, h, label, o, col) {
    if (!(o > 0)) return "";
    var fs = Math.min(h * 0.50, w * 0.52);
    return G(R(cx - w / 2, cy - h / 2, w, h, 10, col || P.line, null, null) +
      R(cx - w / 2 + 4, cy - h / 2 + 3, w - 8, h - 11, 8, P.cell, col || P.line, 2) +
      Tx(cx, cy - h * 0.06 + fs * 0.36, label, "lab", "middle", { "font-size": fs, fill: col || P.ink }),
      { transform: around(cx, cy, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  /* A mouse pointer, its tip at (x, y): the lesson's "click the sprite". */
  function ioCursor(x, y, o) {
    if (!(o > 0)) return "";
    return G(Pth("M0,0 L0,32 L9,24 L14,36 L21,33 L16,21 L26,21 Z", P.ink, P.ground, 2.5),
      { transform: tr(x, y), opacity: Math.min(1, o) });
  }

  /* ---- the lesson's blocks ----------------------------------------------------
     Label and icon from ART.block, so a block chip here is the block the child
     drags on the lesson page. */
  function ioChipW(id) { return 48 + ART.block(id).label.length * 10; }
  function ioChip(x, y, h, id, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var b = ART.block(id), w = ioChipW(id), col = opt.col || P.line;
    return G(R(x, y, w, h, h * 0.30, opt.fill || P.card, col, opt.sw || 2) +
      Em(x + 25, y + h / 2, h * 0.46, b.icon) +
      Tx(x + 46, y + h / 2 + 7, b.label, "lab mid", "start", { fill: opt.ink || P.ink }),
      { opacity: clamp(o, 0, 1) * (opt.dim == null ? 1 : opt.dim),
        transform: opt.scale != null ? around(x + w / 2, y + h / 2, opt.scale) : null });
  }
  /* a row of chips, left to right, and how wide the row is */
  function ioChips(x, y, h, ids, o, opt) {
    var out = "", cx = x;
    ids.forEach(function (id) { out += ioChip(cx, y, h, id, o, opt); cx += ioChipW(id) + 10; });
    return out;
  }
  function ioChipsW(ids) {
    var w = 0;
    ids.forEach(function (id) { w += ioChipW(id) + 10; });
    return w - 10;
  }

  /* An input and an output, drawn: a program box with an arrow going into it,
     and the same box with an arrow coming out. The lesson's own word-card emoji
     for the two (the inbox and outbox trays) draw as the same tray here, one
     arrow apart, and the recap stands them side by side. */
  function ioFlowPic(into) {
    return function (cx, cy, size) {
      var w = size * 0.50, h = size * 0.74, x = cx - w / 2, y = cy - h / 2;
      var col = into ? P.gold : P.good;
      return R(x, y, w, h, 10, P.cell, P.line, 3) +
        L(x + w * 0.22, y + h * 0.3, x + w * 0.78, y + h * 0.3, P.line, 3) +
        L(x + w * 0.22, y + h * 0.5, x + w * 0.78, y + h * 0.5, P.line, 3) +
        L(x + w * 0.22, y + h * 0.7, x + w * 0.60, y + h * 0.7, P.line, 3) +
        (into ? MK.arrow(cx - size * 0.74, cy, x - 8, cy, 1, col, size * 0.12)
              : MK.arrow(x + w + 8, cy, cx + size * 0.74, cy, 1, col, size * 0.12));
    };
  }

  /* ---- the sprite stage --------------------------------------------------------
     Drawn here, not lifted: the kit's own stage is HTML and the film carries no
     computing.css, so ART.foreign would render it bare. The CAT is the lesson's
     own sprite, and what it does comes from the kit's rules. */
  var IO_ST = { x: 702, y: 56, w: 426, h: 330 };
  var IO_GY = IO_ST.y + IO_ST.h - 66;      /* the ground line */
  var IO_CX = IO_ST.x + IO_ST.w / 2;
  var IO_SQ = 86;                          /* one square of the stage */

  /* the panel alone, for a chapter that uses the right-hand box as a list */
  function ioPanel(o, extra) {
    if (!(o > 0)) return "";
    return G(R(IO_ST.x, IO_ST.y, IO_ST.w, IO_ST.h, 22, P.card, P.line, 2) + (extra || ""),
      { opacity: clamp(o, 0, 1) });
  }
  /* the panel with the ground the cat stands on */
  function ioStage(o, extra) {
    return ioPanel(o, L(IO_ST.x + 28, IO_GY, IO_ST.x + IO_ST.w - 28, IO_GY, P.line, 4) + (extra || ""));
  }

  /* o: {dx (squares), hop (0-1), hops, spin (turns done), scale, op} */
  function ioCat(o) {
    o = o || {};
    var op = o.op == null ? 1 : o.op;
    if (!(op > 0)) return "";
    var size = 112 * (o.scale == null ? 1 : o.scale);
    var lift = 0, u = o.hop;
    if (u != null && u > 0 && u < 1) lift = Math.abs(Math.sin(Math.PI * u * (o.hops || 1))) * 102;
    var x = IO_CX + (o.dx || 0) * IO_SQ, y = IO_GY - size * 0.46 - lift;
    return G(Em(0, 0, size, "\u{1F431}"),
      { transform: tr(x, y) + " rotate(" + n2((o.spin || 0) * 360) + ")", opacity: Math.min(1, op) });
  }
  /* where the cat has gone, if it has hidden */
  function ioGhost(o) {
    if (!(o > 0)) return "";
    return C(IO_CX, IO_GY - 52, 52, "none", P.muted, 3, { "stroke-dasharray": "9 9", opacity: 0.6 * o });
  }

  /* ==== the title ===============================================================
     One cat, two keys, two scripts, two outputs: the whole of the first idea in
     one picture, and the shape the rest of the film hangs on. In the spoken
     title chapter each piece arrives as it is named; on the two cards it stands
     still. */
  var IO_ROWS = [
    { cy: 142, key: "A", out: "⬆️", col: P.good },
    { cy: 250, key: "B", out: "\u{1F504}", col: P.blue }
  ];

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cA = sn ? sc(sn, 0, "pressA") : null, cJ = sn ? sc(sn, 0, "jumps") : null,
      cB = sn ? sc(sn, 0, "pressB") : null, cS = sn ? sc(sn, 0, "spins") : null,
      cTwo = sn ? sc(sn, 1, "two") : null, cScr = sn ? sc(sn, 1, "scripts") : null,
      cOut = sn ? sc(sn, 1, "outputs") : null;
    var keyP = [sn ? popIn(t, cA, 0.4) : 1, sn ? popIn(t, cB, 0.4) : 1];
    var outP = [sn ? popIn(t, cJ, 0.4) : 1, sn ? popIn(t, cS, 0.4) : 1];
    var armU = [sn ? on(t, cJ, 0.45) : 1, sn ? on(t, cS, 0.45) : 1];
    var ring = sn ? on(t, cTwo, 0.5) : 1;
    var scrP = sn ? popIn(t, cScr, 0.45) : 1, tickP = sn ? popIn(t, cOut, 0.45) : 1;

    out += R(8, 20, 344, 320, 30, P.card, P.line, 3);
    out += Em(180, 62, 56, "\u{1F431}");
    IO_ROWS.forEach(function (r, k) {
      var lit = ring > 0.5 ? P.gold : r.col;
      out += ioKey(62, r.cy, 78, 64, r.key, keyP[k], keyP[k] > 0 ? lit : null);
      out += MK.arrow(108, r.cy, 176, r.cy, armU[k], r.col, 7);
      out += MK.pop(C(206, r.cy, 27, P.cell, r.col, 3) + Em(206, r.cy, 30, "\u{1F4DC}"), 206, r.cy,
        Math.min(scrP, armU[k] > 0 ? 9 : 0));
      out += MK.arrow(236, r.cy, 268, r.cy, armU[k], r.col, 7);
      out += MK.pop(Em(306, r.cy, 54, r.out), 306, r.cy, outP[k]);
      out += MK.tick(330, r.cy - 36, 18, Math.min(tickP, outP[k] > 0 ? 9 : 0));
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="One cat, two keys, two scripts, two different outputs">' + out + "</svg>";
  }

  /* ==== chapter: inputs to a program ============================================
     First the lesson's own hardware, rung where the input comes in: the
     laptop's keyboard for a key, the tablet's home button for a button, and a
     pointer on a cat drawn on the laptop's screen for a click on a sprite.
     Then the lesson's four inputs, each with its own script and its own output,
     and the cat doing each one as it is said. */

  var IO_FIG = {
    laptop: { x: 170, y: 56, w: 420, h: 312, vb: 360, vh: 268 },
    tablet: { x: 760, y: 18, w: 270, h: 392, vb: 260, vh: 378 }
  };
  function ioFX(f, v) { return f.x + v * f.w / f.vb; }
  function ioFY(f, v) { return f.y + v * f.h / f.vh; }

  /* the kit's figure with one part rung gold, the parts already named rung
     green, and everything else dimmed (rule 3) */
  function ioFigure(name, gold, done, o) {
    if (!(o > 0)) return "";
    var f = IO_FIG[name], m = ART.figure(name);
    ART.parts(m).forEach(function (p) {
      if (p !== gold && done.indexOf(p) < 0) m = ART.dim(m, p, 0.3);
    });
    done.forEach(function (p) { if (p !== gold) m = ART.ring(m, p, P.good, 5); });
    if (gold) m = ART.ring(m, gold, P.gold, 6);
    return G(ART.place(m, f.x, f.y, f.w, f.h), { opacity: clamp(o, 0, 1) });
  }

  function ioHardware(scene, t) {
    var cKey = sc(scene, 0, "key"), cBtn = sc(scene, 0, "button"), cClick = sc(scene, 0, "click");
    var lap = IO_FIG.laptop, out = "", o = on(t, BEATS[scene.first].start, 0.5);
    /* which part the voice is on now, and which it has already named */
    var onScreen = ioPast(t, cClick), onHome = !onScreen && ioPast(t, cBtn), onKeys = !onScreen && !onHome && ioPast(t, cKey);
    out += ioFigure("laptop", onScreen ? "screen" : onKeys ? "keyboard" : null,
      onScreen ? ["keyboard"] : onHome ? ["keyboard"] : [], o);
    out += ioFigure("tablet", onHome ? "home" : null, onScreen ? ["home"] : [], o);

    /* the sprite on the laptop's screen, and the pointer that clicks it */
    var catX = ioFX(lap, 124), catY = ioFY(lap, 94);
    var cl = on(t, cClick, 0.45);
    out += MK.pop(Em(catX, catY, 54, "\u{1F431}"), catX, catY, popIn(t, cClick, 0.45));
    out += MK.ripple(catX, catY, t, cClick == null ? null : cClick + 0.35, P.gold);
    out += ioCursor(catX + 8, catY + 4, cl);

    /* the lesson's own words for the two hardware inputs */
    out += MK.pill(ioFX(lap, 150), 412, "a key", on(t, cKey, 0.45), { size: 24, col: P.gold, ink: P.gold });
    out += MK.pill(ioFX(IO_FIG.tablet, 130), 412, "a button", on(t, cBtn, 0.45), { size: 24, col: P.gold, ink: P.gold });
    return out;
  }

  /* the four inputs, their scripts and their outputs */
  var IO_IN = [
    { key: "A", wide: false, label: "press A", out: "jump", cue: "pressA", outCue: "jumps", beat: 1 },
    { key: "B", wide: false, label: "press B", out: "spin", cue: "pressB", outCue: "spins", beat: 2 },
    { key: null, wide: false, label: "click the sprite", out: "say", cue: "click", outCue: "hello", beat: 3 },
    { key: "space", wide: true, label: "press the space bar", out: "hide", cue: "space", outCue: "hides", beat: 3 }
  ];
  var IO_ROW = { x: 32, w: 646, h: 78, gap: 16 };
  function ioRowY(k) { return 40 + k * (IO_ROW.h + IO_ROW.gap); }

  function ioInputRows(scene, t) {
    var out = "", r = IO_ROW;
    var cFour = sc(scene, 4, "four"), cScr = sc(scene, 4, "scripts"), cOut = sc(scene, 4, "outputs");
    var nFour = tally(t, cFour, 4, 0.9), nScr = tally(t, cScr, 4, 0.9), nOut = tally(t, cOut, 4, 0.9);
    IO_IN.forEach(function (item, k) {
      var at = sc(scene, item.beat, item.cue), atOut = sc(scene, item.beat, item.outCue);
      /* the two beats that name the script hand the badge its own moment; the
         beat with two inputs in it does not, so there the badge comes with the row */
      var atScript = sc(scene, item.beat, "script");
      var o = on(t, at, 0.45), y = ioRowY(k);
      if (!(o > 0)) return;
      var lit = k < nFour;
      out += G(R(r.x, y, r.w, r.h, 18, P.cell, lit ? P.gold : P.line, lit ? 3.5 : 2), { opacity: o });
      /* the input */
      if (item.key) out += ioKey(r.x + (item.wide ? 62 : 46), y + r.h / 2, item.wide ? 92 : 54, 48, item.key, o, lit ? P.gold : null);
      else {
        out += G(Em(r.x + 46, y + r.h / 2, 40, "\u{1F431}"), { opacity: o });
        out += ioCursor(r.x + 52, y + r.h / 2 + 2, o);
      }
      out += Tx(r.x + 118, y + r.h / 2 + 7, item.label, "lab mid", "start", { opacity: o });
      /* its script */
      out += MK.arrow(r.x + 326, y + r.h / 2, r.x + 358, y + r.h / 2, on(t, atOut, 0.4), P.gold, 6);
      out += MK.pop(C(r.x + 388, y + r.h / 2, 23, P.card, k < nScr ? P.gold : P.line, k < nScr ? 3.5 : 2) +
        Em(r.x + 388, y + r.h / 2, 26, "\u{1F4DC}"), r.x + 388, y + r.h / 2,
        atScript == null ? o : popIn(t, atScript, 0.4));
      out += MK.arrow(r.x + 420, y + r.h / 2, r.x + 452, y + r.h / 2, on(t, atOut, 0.4), P.gold, 6);
      /* its output */
      out += ioChip(r.x + 464, y + 18, 42, item.out, popIn(t, atOut, 0.4), { col: P.good });
      out += MK.tick(r.x + r.w - 22, y + r.h / 2, 15, popIn(t, k < nOut ? atOut : null, 0.35) * (k < nOut ? 1 : 0));
    });
    return out;
  }

  /* what the cat does, for the beat that is being said */
  function ioInputStage(scene, t, i) {
    var k = i - scene.first;
    var cJump = sc(scene, 1, "jumps"), cSpin = sc(scene, 2, "spins"),
      cHello = sc(scene, 3, "hello"), cHide = sc(scene, 3, "hides"), cOne = sc(scene, 4, "one");
    var o = {}, extra = "";
    if (k === 1) o.hop = ioDo(t, cJump, 0.9);
    else if (k === 2) o.spin = ioDo(t, cSpin, 1.1) * 2;
    else if (k === 3) {
      var hi = on(t, cHello, 0.4), gone = on(t, cHide, 0.5);
      o.op = 1 - 0.86 * gone;
      if (hi > 0) extra += MK.bubble(IO_CX - 86, IO_GY - 232, 172, 66, "hello", hi * (1 - gone), IO_CX, IO_GY - 150);
      extra += ioGhost(gone);
    } else if (k === 4) {
      var g = on(t, cOne, 0.5);
      if (g > 0) extra += MK.glow(IO_CX, IO_GY - 52, 112, P.gold, g);
      o.hop = ioDo(t, cOne == null ? null : cOne + 0.2, 0.8);
    }
    return ioStage(1, extra) + ioCat(o);
  }

  function ioInputsChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), out = "";
    if (u < 1) out += G(ioHardware(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(ioInputRows(scene, t) + ioInputStage(scene, t, i), { opacity: u });
    return svg(out);
  }
