  /* ==== Grade 3 Computing, Lesson 3: Think It Through ==========================
     tools/lib/film-scenes/computing-g3/think-it-through.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/think-it-through.json.

     THE CHANGED ALGORITHM IS DRAWN BY THE LESSON, NOT BY THIS FILM. Every
     outcome the voice predicts is painted by handing the kit's own scene the
     changed list - ART.scene("smoothie", ["banana", "berries", "milk",
     "blend"]) and ART.scene("kite", ["sticks", "tie", "paper", "tail",
     "fly"]) - so the kit sprays the kitchen and loses the kite and writes its
     own caption ("no lid on: smoothie everywhere!", "no string yet: the wind
     took the kite!"). The film draws no picture of a wrong outcome of its own,
     and a list is built up across a beat with ids.slice(0, n), the same
     growing prefix the lesson's own paintScene uses.

     This file: the palette, the four pictures the film draws itself, the step
     table and the algorithm row every list is made of, the box the lesson's
     scenes sit in, the title motif, and the chapter "Every step has a reason".
     Every top-level name here starts with ti, so nothing can replace a name of
     the engine, ART or MK. */

  var HUE = {
    title: P.teal, logic: P.gold, predict: P.accent, kite: P.blue,
    divide: P.plum, edit: P.good, decide: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function tiPast(t, at) { return at != null && t >= at; }
  /* 0 -> 1 as the chapter's beat k comes in, for a thing that then stays */
  function tiFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the four pictures the film draws itself --------------------------------
     Rule 8, a picture must match what is said about it. The lesson's own emoji
     for four of these twelve steps says a different thing from the lesson's own
     words: a padlock for "put the lid on tight", a plus sign for "cross two
     sticks", a reel of thread for "tie them together in the middle", and a
     wind-blowing face for "run into the wind with it". Each is drawn here as
     the kit's own scene draws it - the blender's grey lid and knob, two brown
     sticks, the gold knot at their crossing, and the wind. */
  function tiPic(cx, cy, size, pic) {
    var s = size * 0.46;
    if (pic === "lid")
      return G(R(cx - s, cy - s * 0.16, s * 2, s * 0.58, s * 0.2, "#4A5A6A", "#93AABE", 2) +
        R(cx - s * 0.3, cy - s * 0.62, s * 0.6, s * 0.48, s * 0.14, "#4A5A6A", "#93AABE", 2));
    if (pic === "sticks")
      return G(L(cx, cy - s, cx, cy + s, "#8B5A2B", Math.max(3, s * 0.26)) +
        L(cx - s, cy - s * 0.2, cx + s, cy - s * 0.2, "#8B5A2B", Math.max(3, s * 0.26)));
    if (pic === "knot")
      return G(L(cx, cy - s, cx, cy + s, "#8B5A2B", Math.max(2.5, s * 0.22), { opacity: 0.55 }) +
        L(cx - s, cy - s * 0.2, cx + s, cy - s * 0.2, "#8B5A2B", Math.max(2.5, s * 0.22), { opacity: 0.55 }) +
        C(cx, cy - s * 0.2, s * 0.36, P.gold, "#8B5A2B", 2));
    if (pic === "wind") {
      var w = Math.max(2.5, s * 0.2), out = "";
      [-0.58, -0.04, 0.5].forEach(function (dy, k) {
        var half = s * (k === 1 ? 1 : 0.8);
        out += Pth("M" + n2(cx - half) + "," + n2(cy + s * dy) + " Q" + n2(cx) + "," + n2(cy + s * dy - s * 0.42) +
          " " + n2(cx + half) + "," + n2(cy + s * dy), null, "#BFE3F5", w);
      });
      return G(out);
    }
    return Em(cx, cy, size, pic);
  }

  /* ---- the steps, in the lesson's own words ----------------------------------- */

  var TI_STEP = {
    /* the smoothie algorithm from lesson 1, which this lesson changes */
    banana:  { pic: "\u{1F34C}", label: "Put a banana in" },
    berries: { pic: "\u{1F353}", label: "Add some strawberries" },
    milk:    { pic: "\u{1F95B}", label: "Pour in milk" },
    lid:     { pic: "lid",       label: "Put the lid on tight" },
    blend:   { pic: "\u{1F300}", label: "Blend it" },
    pour:    { pic: "\u{1F964}", label: "Pour it into a glass" },
    /* and the kite algorithm */
    sticks:  { pic: "sticks",    label: "Cross two sticks" },
    tie:     { pic: "knot",      label: "Tie them together" },
    paper:   { pic: "\u{1F4C4}", label: "Glue paper on the sticks" },
    tail:    { pic: "\u{1F380}", label: "Tie on a tail" },
    string:  { pic: "\u{1F9F6}", label: "Tie on a long string" },
    fly:     { pic: "wind",      label: "Run into the wind" }
  };

  /* One row of an algorithm: its number, the step's picture and its words.
     opt: {o, col (a border and number colour), fill, mark ("tick"|"cross"|
     "swap"), markP, dim} */
  function tiRow(x, y, w, h, n, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var st = TI_STEP[id] || { pic: "", label: String(id) };
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2;
    var fs = clamp(h * 0.42, 18, 24);
    var body = R(x, y, w, h, h * 0.30, opt.fill || P.cell, col, sw) +
      C(x + h * 0.52, y + h / 2, h * 0.28, P.card, col, 2) +
      Tx(x + h * 0.52, y + h / 2 + h * 0.13, String(n), "lab", "middle",
        { fill: opt.col || P.muted, "font-size": h * 0.38 }) +
      tiPic(x + h * 1.26, y + h / 2, h * 0.58, st.pic) +
      Tx(x + h * 1.66, y + h / 2 + fs * 0.35, st.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.44, my = y + h / 2, mr = h * 0.28, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    else if (opt.mark === "swap") body += MK.pop(Tx(mx, my + mr * 0.5, "⇅", "lab", "middle",
      { fill: P.gold, "font-size": mr * 2.1 }), mx, my, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.4 : 1) });
  }

  /* an empty slot, for "six steps" before any of them is read out */
  function tiSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.30, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      C(x + h * 0.52, y + h / 2, h * 0.28, P.card, P.line, 2) +
      Tx(x + h * 0.52, y + h / 2 + h * 0.13, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.38 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the list, and the box the lesson's own scene sits in -------------------- */

  var TI_LIST = { x: 34, w: 504, h: 58, gap: 9 };
  function tiListY(k, n) { return (440 - n * TI_LIST.h - (n - 1) * TI_LIST.gap) / 2 + k * (TI_LIST.h + TI_LIST.gap); }

  /* the kit's smoothie and kite scenes are both 320 x 240 */
  var TI_SC = { x: 580, y: 16, w: 544, h: 408 };
  function tiSX(v) { return TI_SC.x + v * TI_SC.w / 320; }
  function tiSY(v) { return TI_SC.y + v * TI_SC.h / 240; }
  function tiScene(name, ids, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.scene(name, ids), TI_SC.x, TI_SC.y, TI_SC.w, TI_SC.h) +
      R(TI_SC.x, TI_SC.y, TI_SC.w, TI_SC.h, 6, "none", P.line, 3), { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif =========================================================
     Three numbered steps with two of them about to swap, a question mark over
     the swap, and four little sections under it: logic, prediction and
     decomposition in one picture. In the spoken title chapter each part
     arrives as it is named; on the two cards it stands still. */
  function tiTile(x, y, s, n, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, s, s * 0.78, s * 0.2, P.cell, col || P.line, 3) +
      C(x + s / 2, y + s * 0.39, s * 0.24, P.card, col || P.line, 2) +
      Tx(x + s / 2, y + s * 0.39 + s * 0.1, String(n), "lab", "middle", { fill: col || P.muted, "font-size": s * 0.34 }),
      { transform: around(x + s / 2, y + s * 0.39, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cSwap = sn ? sc(sn, 0, "swap") : null, cWhat = sn ? sc(sn, 0, "what") : null,
      cWork = sn ? sc(sn, 0, "work") : null, cReason = sn ? sc(sn, 1, "reason") : null,
      cDivide = sn ? sc(sn, 1, "divide") : null;
    var tiles = sn ? tally(t, cSwap, 3, 0.55) : 3;
    var arc = sn ? on(t, cWhat, 0.5) : 1, q = sn ? popIn(t, cWhat, 0.45) : 1;
    var ok = sn ? popIn(t, cWork, 0.45) : 1;
    var why = sn ? popIn(t, cReason, 0.45) : 1;
    var secs = sn ? tally(t, cDivide, 4, 0.5) : 4;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    /* the three steps, the last two about to change places */
    [52, 150, 248].forEach(function (x, k) {
      out += tiTile(x, 76, 62, k + 1, k < tiles ? 1 : 0, k >= 1 ? P.gold : P.good);
    });
    /* the swap, and the question it raises */
    if (arc > 0) {
      var d = "M181,72 Q216,36 279,60";
      out += Pth(d, null, P.gold, 4, { opacity: arc, "stroke-dasharray": "120", "stroke-dashoffset": n2(120 * (1 - arc)) });
    }
    out += MK.pop(Tx(216, 42, "?", "lab", "middle", { fill: P.gold, "font-size": 40 }), 216, 34, q);
    out += MK.tick(308, 46, 20, ok);
    /* every step is where it is for a reason */
    out += MK.pill(180, 178, "because", why, { size: 26, col: P.gold, ink: P.gold });
    /* and a big task divides into four short sections */
    [32, 116, 200, 284].forEach(function (x, k) {
      if (k >= secs) return;
      var p = sn ? popIn(t, cDivide == null ? null : cDivide + k * 0.12, 0.35) : 1;
      out += MK.pop(R(x, 228, 68, 74, 14, P.cell, P.teal, 3) +
        L(x + 14, 252, x + 54, 252, P.muted, 4) + L(x + 14, 268, x + 54, 268, P.muted, 4) +
        L(x + 14, 284, x + 40, 284, P.muted, 4), x + 34, 265, p);
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Three steps with two of them swapping, a question mark over the swap, and four short sections">' + out + "</svg>";
  }

  /* ==== chapter: every step has a reason ========================================
     The lesson's own three reasons, one row each: the step before, an arrow,
     the step after, and the because that puts them in that order. The rows
     arrive one at a time and only the row being said carries a gold border;
     on the last beat they fade back and the words for it - logical thinking -
     come forward over them, with three steps made from it. */
  var TI_LOG = [
    { pic: "☕", a: "boil the water", b: "pour it", why: "you pour boiling water" },
    { pic: "\u{1F35E}", a: "toast the bread", b: "butter it", why: "butter would melt and burn" },
    { pic: "\u{1F511}", a: "unlock the door", b: "open it", why: "a locked door does not open" }
  ];
  var TI_LOGROW = { y0: 74, pitch: 122, h: 92, ax: 140, bx: 476, tw: 212, wx: 716 };

  function tiLogTile(x, y, w, h, text, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 20, P.cell, col || P.line, col ? 3.5 : 2) +
      Tx(x + w / 2, y + h / 2 + 8, text, "lab", "middle", { "font-size": 23 }),
      { transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  function tiLogSlot(y, o) {
    if (!(o > 0)) return "";
    var R1 = TI_LOGROW;
    return G(R(R1.ax, y, R1.tw, R1.h, 20, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      R(R1.bx, y, R1.tw, R1.h, 20, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      L(R1.ax + R1.tw + 14, y + R1.h / 2, R1.bx - 14, y + R1.h / 2, P.line, 4, { "stroke-dasharray": "8 8" }),
      { opacity: clamp(o, 0, 1) });
  }

  function tiLogicRows(scene, t) {
    var R1 = TI_LOGROW, out = "";
    var cAlgo = sc(scene, 0, "algorithm"), cReason = sc(scene, 0, "reason");
    var starts = [sc(scene, 1, "boil"), sc(scene, 2, "toast"), sc(scene, 3, "unlock")];
    var seconds = [sc(scene, 1, "pour"), sc(scene, 2, "butter"), sc(scene, 3, "open")];
    var whys = [sc(scene, 1, "because"), sc(scene, 2, "burn"), sc(scene, 3, "locked")];
    var slots = tally(t, cAlgo, 3, 0.9);

    TI_LOG.forEach(function (row, k) {
      var y = R1.y0 + k * R1.pitch, cy = y + R1.h / 2;
      var a = popIn(t, starts[k], 0.4), b = popIn(t, seconds[k], 0.4), w = on(t, whys[k], 0.5);
      if (a <= 0) { if (k < slots) out += tiLogSlot(y, 1); return; }
      /* only the row being said is gold; the rows already said stay plain */
      var live = tiPast(t, starts[k]) && !tiPast(t, starts[k + 1]);
      out += G(Em(92, cy + 2, 56, row.pic), { opacity: Math.min(1, a) });
      out += tiLogTile(R1.ax, y, R1.tw, R1.h, row.a, a, live ? P.gold : null);
      out += MK.arrow(R1.ax + R1.tw + 12, cy, R1.bx - 12, cy, on(t, seconds[k], 0.45), live ? P.gold : P.muted, 7);
      out += tiLogTile(R1.bx, y, R1.tw, R1.h, row.b, b, live ? P.gold : null);
      if (w > 0) {
        out += Tx(R1.wx, cy - 8, "because", "lab gold", "start", { opacity: w });
        out += Tx(R1.wx, cy + 22, row.why, "lab mid", "start", { opacity: w });
      }
    });
    /* the word itself, before any reason has been given */
    out += MK.pill(880, 220, "because", popIn(t, cReason, 0.45) * (1 - on(t, starts[0], 0.4)),
      { size: 34, col: P.gold, ink: P.gold });
    return out;
  }

  /* the last beat: the rows fade back and what they all are comes forward */
  function tiLogicName(scene, t) {
    var cReasoning = sc(scene, 4, "reasoning"), cLogic = sc(scene, 4, "logic"), cMade = sc(scene, 4, "created");
    var out = R(184, 140, 800, 160, 26, P.card, P.gold, 3);
    out += Em(252, 220, 84, "\u{1F9E0}");
    out += Tx(320, 208, "logical thinking", "lab huge gold", "start", { opacity: on(t, cLogic, 0.5) });
    out += Tx(320, 250, "every step has a reason", "lab mid muted", "start", { opacity: on(t, cReasoning, 0.5) });
    var made = tally(t, cMade, 3, 0.7);
    [760, 826, 892].forEach(function (x, k) {
      if (k >= made) return;
      out += tiTile(x, 186, 58, k + 1, popIn(t, cMade == null ? null : cMade + k * 0.23, 0.35), P.good);
    });
    return out;
  }

  function tiLogicChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = tiLogicRows(scene, t);
    if (u > 0) out = G(out, { opacity: 1 - u * 0.72 }) + G(tiLogicName(scene, t), { opacity: u });
    return svg(out);
  }
