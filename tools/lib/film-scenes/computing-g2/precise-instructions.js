  /* ==== Grade 2 Computing, Lesson 1: Precise Instructions =====================
     tools/lib/film-scenes/computing-g2/precise-instructions.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/precise-instructions.json.

     WHAT ROBO DRAWS IS ALWAYS THE LESSON'S OWN DRAWING. Every canvas in this
     film is ART.drawing("house", ids), ART.scene("tea", ids) or
     ART.scene("tower", ids), given the list of instruction ids Robo was told -
     so the squiggle, the roof in the corner and the puddle on the table are
     the kit's own answer to a vague instruction, captioned by the kit, and the
     film draws no picture of a mistake of its own. A list is built up across a
     beat with a growing prefix, the way the lesson's own paintScene does.

     This file: the palette, the timing helpers, the instruction row and card
     every chapter shares, the two canvas boxes, the title motif and the
     chapter "Exactly what you say". Every top-level name here starts with pi,
     so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, exact: P.gold, where: P.accent, linear: P.blue,
    need: P.plum, build: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function piOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function piFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function piPast(t, at) { return at != null && t >= at; }

  /* ---- the two boxes the lesson's own drawings are drawn in -------------------
     The house and the tea are 320 x 240; the brick tower is 320 x 260. */
  var PI_BOX = { x: 640, y: 24, w: 474, h: 355.5 };
  var PI_TOWER = { x: 680, y: 30, w: 440, h: 357.5 };
  var PI_PANEL = { x: 34, w: 556 };

  function piBX(v) { return PI_BOX.x + v * PI_BOX.w / 320; }
  function piBY(v) { return PI_BOX.y + v * PI_BOX.h / 240; }

  /* one of the kit's drawings, in a box with a border */
  function piCanvas(markup, box, o, col) {
    if (!(o > 0)) return "";
    return G(ART.place(markup, box.x, box.y, box.w, box.h) +
      R(box.x, box.y, box.w, box.h, 8, "none", col || P.line, 3), { opacity: clamp(o, 0, 1) });
  }
  /* the same, in a box given here: for a row of three outcomes */
  function piCanvasAt(markup, x, y, w, h, o, col) {
    if (!(o > 0)) return "";
    return G(ART.place(markup, x, y, w, h) +
      R(x, y, w, h, 8, "none", col || P.line, 3), { opacity: clamp(o, 0, 1) });
  }

  /* ---- the instruction row, in the lesson's own words -------------------------
     opt: {o, col (a border and number colour), fill, fs, pic, mark
     ("tick"|"cross"), markP, dimmed} */
  function piRow(x, y, w, h, n, text, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2;
    var fs = opt.fs || Math.min(21, h * 0.34);
    var body = R(x, y, w, h, h * 0.28, opt.fill || P.cell, col, sw) +
      C(x + h * 0.50, y + h / 2, h * 0.28, P.card, col, 2) +
      Tx(x + h * 0.50, y + h / 2 + h * 0.12, String(n), "lab", "middle",
        { fill: opt.col || P.muted, "font-size": h * 0.34 });
    if (opt.pic) body += (typeof opt.pic === "function" ? opt.pic(x + h * 1.14, y + h / 2, h * 0.56)
      : Em(x + h * 1.14, y + h / 2, h * 0.54, opt.pic));
    body += Tx(x + h * (opt.pic ? 1.52 : 1.02), y + h / 2 + fs * 0.35, text, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.40, my = y + h / 2, mr = h * 0.27, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.3 : 1) });
  }

  /* an empty slot, for "it has five steps" before any of them is read out */
  function piSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.28, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      C(x + h * 0.50, y + h / 2, h * 0.28, P.card, P.line, 2) +
      Tx(x + h * 0.50, y + h / 2 + h * 0.12, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.34 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* five rows down the left panel, the shape both list chapters use */
  var PI_R5 = { h: 58, gap: 12 };
  function piR5Y(k) { return 51 + k * (PI_R5.h + PI_R5.gap); }

  /* ---- the instruction card: what Robo has been told --------------------------- */
  function piCard(x, y, w, h, text, o, col, fs) {
    if (!(o > 0)) return "";
    var body = R(x, y, w, h, 26, P.cell, col || P.line, col ? 3.5 : 2,
      text ? null : { "stroke-dasharray": "13 9" });
    if (text) body += Tx(x + w / 2, y + h / 2 + (fs || 27) * 0.36, text, "lab", "middle", { "font-size": fs || 27 });
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  /* ---- a brick, in the kit's own tower colours --------------------------------- */
  var PI_BRICK = { red: "#E9744F", blue: "#6E9DE8", yellow: "#F4C95D", green: "#4FD1A0", purple: "#B78BD1" };
  function piBrick(x, y, w, h, id, o, lit) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 7, PI_BRICK[id] || P.muted, lit ? P.ink : "#0B1D2C", lit ? 4 : 2),
      { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)) });
  }

  /* ---- a tablet, for the row that says "switch the tablet on" -------------------
     The lesson's own step carries a MOBILE PHONE emoji there; the picture
     beside it in this chapter is the kit's tablet, so the row draws a tablet. */
  function piTabletGlyph(cx, cy, s) {
    var w = s * 0.62, h = s * 0.92;
    return R(cx - w / 2, cy - h / 2, w, h, w * 0.18, P.body, P.plastic, 2) +
      R(cx - w / 2 + w * 0.12, cy - h / 2 + h * 0.13, w * 0.76, h * 0.68, 2, "#0B1D2C") +
      C(cx, cy + h * 0.36, w * 0.09, "none", P.plastic, 1.6);
  }

  /* ==== the title motif ==========================================================
     The three things a precise instruction says - what, how big, where - over
     the lesson's own house. In the spoken title chapter the canvas goes from a
     squiggle ("draw a shape") to the house ("a big square in the middle"), the
     kit drawing every state; on the two cards it stands finished. */
  function piMotifIds(t, sn) {
    if (!sn) return ["walls", "roof", "door", "window", "sun"];
    if (piPast(t, sc(sn, 1, "exact"))) return ["walls", "roof", "door", "window", "sun"];
    if (piPast(t, sc(sn, 1, "square"))) return ["walls"];
    if (piPast(t, sc(sn, 0, "shape"))) return ["blob"];
    return [];
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cShape = sn ? sc(sn, 0, "shape") : null, cAny = sn ? sc(sn, 0, "any") : null,
      cSquare = sn ? sc(sn, 1, "square") : null, cExact = sn ? sc(sn, 1, "exact") : null;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    /* the three words a precise instruction answers */
    var wp = [["what", 82], ["how big", 180], ["where", 282]];
    wp.forEach(function (w, k) {
      var p = sn ? on(t, cSquare == null ? null : cSquare + k * 0.22, 0.4) : 1;
      out += MK.pill(w[1], 64, w[0], p, { size: 19, col: P.gold, ink: P.gold });
    });
    /* the lesson's own drawing, from whatever it has been told so far */
    out += ART.place(ART.drawing("house", piMotifIds(t, sn)), 50, 92, 260, 195) +
      R(50, 92, 260, 195, 6, "none", P.line, 3);
    /* the vague instruction crossed, then the precise one ticked */
    var x1 = sn ? popIn(t, cAny, 0.4) * (1 - on(t, cSquare, 0.4)) : 0;
    out += MK.cross(310, 296, 26, x1);
    out += MK.tick(310, 296, 26, sn ? popIn(t, cExact, 0.4) : 1);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="What, how big and where: the house Robo draws from precise instructions">' + out + "</svg>";
  }

  /* ==== chapter: exactly what you say =============================================
     The lesson's own opening demo. On the left, the card holding whatever Robo
     has been told; on the right, ART.drawing("house", ids) - the kit's answer.
     "Draw a shape" gets a squiggle; "draw a big square in the middle" gets the
     walls. The middle beat opens out to three canvases, all three of them the
     kit's own answer to the SAME vague instruction. */
  var PI_EX_CARD = { x: 34, y: 100, w: 556, h: 96 };
  var PI_EX_WORDS = [["what", 120], ["how big", 300], ["where", 470]];

  function piExactCardText(t, scene) {
    if (piPast(t, sc(scene, 3, "square"))) return "Draw a big square in the middle";
    if (piPast(t, sc(scene, 3, "again"))) return "";
    if (piPast(t, sc(scene, 1, "say"))) return "Draw a shape";
    return "";
  }

  function piExactMain(scene, t) {
    var cDraw = sc(scene, 0, "draw"), cTold = sc(scene, 0, "told"), cNothing = sc(scene, 0, "nothing");
    var cSay = sc(scene, 1, "say"), cSquiggle = sc(scene, 1, "squiggle");
    var cAgain = sc(scene, 3, "again"), cSquare = sc(scene, 3, "square");
    var cPrecise = sc(scene, 4, "precise"), cWhat = sc(scene, 4, "what");
    var cAlgo = sc(scene, 5, "algorithm"), cSet = sc(scene, 5, "set"), cGuess = sc(scene, 5, "guess");
    var out = "";

    /* what Robo has drawn so far, always the kit's own answer */
    var ids = piPast(t, cSquare) ? ["walls"] : piPast(t, cSquiggle) ? ["blob"] : [];
    var good = on(t, cSet, 0.6);
    /* 190, not 250: a wider pool reached 49 px above the box (--sweep) */
    if (good > 0) out += MK.glow(PI_BOX.x + PI_BOX.w / 2, PI_BOX.y + PI_BOX.h / 2, 190, P.good, good);
    out += piCanvas(ART.drawing("house", ids), PI_BOX, on(t, cDraw, 0.5),
      good > 0.5 ? P.good : piPast(t, cSquare) ? P.gold : P.line);
    /* the drawing has nothing in it yet, and says so until the squiggle lands */
    out += MK.pill(piBX(160), piBY(198), "nothing yet",
      on(t, cNothing, 0.45) * (1 - on(t, cSquiggle, 0.4)), { size: 24, col: P.muted, ink: P.muted });

    /* Robo, and the card holding what it was told */
    out += MK.pop(Em(76, 62, 70, "\u{1F916}"), 76, 62, popIn(t, cDraw, 0.45));
    out += Tx(124, 74, "Robo is told:", "lab big muted", "start", { opacity: on(t, cTold, 0.45) });
    var text = piExactCardText(t, scene);
    var cardCol = piPast(t, cPrecise) ? P.good : piPast(t, cSquare) ? P.gold : piPast(t, cSay) ? P.accent : null;
    out += piCard(PI_EX_CARD.x, PI_EX_CARD.y, PI_EX_CARD.w, PI_EX_CARD.h, text, on(t, cTold, 0.5), cardCol);
    /* the instruction travelling from the card to the drawing */
    out += MK.arrow(600, 148, 632, 148, on(t, cTold, 0.5), P.gold, 7);
    out += MK.ripple(PI_EX_CARD.x + PI_EX_CARD.w / 2, PI_EX_CARD.y + PI_EX_CARD.h / 2, t, cAgain, P.muted);

    /* the verdict on this instruction */
    out += MK.pill(150, 250, "precise", popIn(t, cPrecise, 0.4), { size: 26, col: P.good, ink: P.good });
    out += MK.tick(330, 250, 26, popIn(t, cPrecise == null ? null : cPrecise + 0.2, 0.4));
    /* what it says: the three words, one at a time */
    PI_EX_WORDS.forEach(function (w, k) {
      out += MK.pill(w[1], 332, w[0], on(t, cWhat == null ? null : cWhat + k * 0.28, 0.4),
        { size: 26, col: P.gold, ink: P.gold });
    });
    /* and so: an algorithm */
    out += MK.pill(584, 410, "algorithm = a precise set of instructions", on(t, cAlgo, 0.5),
      { size: 22, col: P.teal, ink: P.ink });
    out += MK.tick(1082, 60, 28, popIn(t, cGuess, 0.4));
    return out;
  }

  /* All three of these ARE a shape, and the kit drew every one of them from
     the same three words. Nothing here is a picture of a mistake: each canvas
     is ART.drawing("house", ids) given one vague answer. */
  var PI_SHAPES = [
    { ids: ["blob"], label: "a squiggle", x: 40 },
    { ids: ["tiny-square"], label: "a tiny square", x: 419 },
    { ids: ["huge-square"], label: "a huge square", x: 798 }
  ];

  function piExactThree(scene, t) {
    var cAny = sc(scene, 2, "any"), cDid = sc(scene, 2, "did");
    var out = "", shown = tally(t, cAny, 3, 1.0);
    out += MK.pill(584, 44, "Draw a shape", 1, { size: 27, col: P.accent, ink: P.accent });
    PI_SHAPES.forEach(function (s, k) {
      var o = k < shown ? 1 : 0;
      if (!o) return;
      var cx = s.x + 165;
      out += MK.arrow(584, 70, cx, 112, on(t, cDid == null ? null : cDid + k * 0.22, 0.45), P.gold, 6);
      out += piCanvasAt(ART.drawing("house", s.ids), s.x, 120, 330, 247.5, 1, P.accent);
      out += Tx(cx, 400, s.label, "lab big", "middle");
    });
    return out;
  }

  function piExactChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 2) * (1 - into(t, scene.first + 3)), out = "";
    if (u < 1) out += G(piExactMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(piExactThree(scene, t), { opacity: u });
    return svg(out);
  }
