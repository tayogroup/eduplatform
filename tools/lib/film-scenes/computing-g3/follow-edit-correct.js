  /* ==== Grade 3 Computing, Lesson 1: Follow, Edit, Correct ====================
     tools/lib/film-scenes/computing-g3/follow-edit-correct.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/follow-edit-correct.json.

     THE ORDER IS THE TEACHING, so every algorithm that goes wrong in this film
     goes wrong by handing the LESSON'S OWN scene a wrong list, never by drawing
     a picture of a mistake:

        ART.scene("smoothie", ["banana","berries","milk","blend"])
            the lid step taken out - the kit sprays the kitchen and captions it
        ART.scene("smoothie", ["banana","berries","milk","lid","pour","blend"])
            pour and blend swapped - the kit puts lumps of fruit in the glass
        ART.scene("kite", ["sticks","tie"])
            "cut the paper into tiny pieces" adds nothing, so the kite has no
            paper on it, which is exactly what the lesson says is wrong

     This file: the palette, the step table and the algorithm list every chapter
     shares, the boxes the kit's scenes are drawn in, the title motif, and the
     chapter "A line of steps". Every top-level name here starts with fec.  */

  var HUE = {
    title: P.teal, linear: P.gold, follow: P.blue, understand: P.plum,
    correct: P.accent, edit: P.good, four: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* has this cue been reached? (a cue its beat never names is never reached) */
  function fecPast(t, at) { return at != null && t >= at; }

  /* ---- the steps, in the lesson's own words ----------------------------------- */

  /* The lesson's brick steps carry swatch("brick", colour), a block of colour
     rather than an emoji, so a colour is drawn as a brick here too - and with
     the kit's own colours, which are the ones its tower scene stacks. */
  var FEC_BRICK = { big: "#E9744F", middle: "#35BFB2", small: "#F4C95D", red: "#E9744F" };

  var FEC_STEP = {
    /* the smoothie, from the lesson's "Follow it exactly" step */
    banana:  { pic: "\u{1F34C}", label: "Put a banana in the blender" },
    berries: { pic: "\u{1F353}", label: "Add some strawberries" },
    milk:    { pic: "\u{1F95B}", label: "Pour in milk" },
    lid:     { pic: "\u{1F512}", label: "Put the lid on tight" },
    blend:   { pic: "\u{1F300}", label: "Blend it" },
    pour:    { pic: "\u{1F964}", label: "Pour it into a glass" },
    /* the kite, from its "Correct the algorithm" step */
    sticks:  { pic: "➕",    label: "Cross two sticks" },
    tie:     { pic: "\u{1F9F5}", label: "Tie them in the middle" },
    tiny:    { pic: "✂️", label: "Cut the paper into tiny pieces" },
    paper:   { pic: "\u{1F4C4}", label: "Glue paper over the sticks" },
    tail:    { pic: "\u{1F380}", label: "Tie on a tail" },
    string:  { pic: "\u{1F9F6}", label: "Tie on a long string" },
    fly:     { pic: "\u{1F32C}️", label: "Run into the wind with it" },
    /* the tower, from its "Edit the algorithm" step */
    big:     { brick: "big",    label: "Put down the big brick" },
    middle:  { brick: "middle", label: "Add the middle brick" },
    small:   { brick: "small",  label: "Add the small brick" },
    red:     { brick: "red",    label: "Add the red brick" },
    flag:    { pic: "\u{1F6A9}", label: "Put the flag on top" }
  };

  function fecPic(cx, cy, size, step) {
    if (step.brick)
      return R(cx - size * 0.42, cy - size * 0.30, size * 0.84, size * 0.60, size * 0.12,
        FEC_BRICK[step.brick], P.ground, 2);
    return Em(cx, cy, size, step.pic);
  }

  /* One row of an algorithm: a number, the step's picture and its words.
     opt: {o, col (border and number colour), fill, mark ("tick"|"cross"|"bug"|
     "qmark"), markP, dimmed, fs} */
  function fecRow(x, y, w, h, n, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var st = FEC_STEP[id] || { pic: "", label: String(id) };
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2, fs = opt.fs || 21;
    var body = R(x, y, w, h, h * 0.26, opt.fill || P.cell, col, sw) +
      C(x + h * 0.50, y + h / 2, h * 0.27, P.card, col, 2) +
      Tx(x + h * 0.50, y + h / 2 + h * 0.12, String(n), "lab", "middle",
        { fill: opt.col || P.muted, "font-size": h * 0.34 }) +
      fecPic(x + h * 1.22, y + h / 2, h * 0.52, st) +
      Tx(x + h * 1.62, y + h / 2 + fs * 0.35, st.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.44, my = y + h / 2, mr = h * 0.27, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    else if (opt.mark === "qmark") body += MK.qmark(mx, my, mr * 1.15, Math.min(1, p));
    else if (opt.mark === "bug") body += MK.pop(Em(mx, my, mr * 1.9, "\u{1F41B}"), mx, my, p);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.42 : 1) });
  }

  /* An empty slot: a step named but not read out yet, or one taken out. */
  function fecSlot(x, y, w, h, n, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.26, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      C(x + h * 0.50, y + h / 2, h * 0.27, P.card, P.line, 2) +
      Tx(x + h * 0.50, y + h / 2 + h * 0.12, String(n), "lab", "middle", { fill: P.muted, "font-size": h * 0.34 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the panel and the boxes ------------------------------------------------ */

  var FEC_PANEL = { x: 36, w: 540 };
  var FEC_GUT = 598;                                  /* the gutter between them */
  var FEC_R6 = { h: 56, gap: 10, top: 27 };           /* six steps: the smoothie, the kite */
  var FEC_R4 = { h: 72, gap: 16, top: 52 };           /* four steps: the tower */
  function fec6Y(k) { return FEC_R6.top + k * (FEC_R6.h + FEC_R6.gap); }
  function fec4Y(k) { return FEC_R4.top + k * (FEC_R4.h + FEC_R4.gap); }

  /* the kit's smoothie and kite are 320 x 240; its tower is 320 x 260 */
  var FEC_SM = { x: 624, y: 24, w: 475, h: 356 };
  var FEC_TW = { x: 640, y: 22, w: 452, h: 367 };
  function fecSX(v) { return FEC_SM.x + v * FEC_SM.w / 320; }
  function fecSY(v) { return FEC_SM.y + v * FEC_SM.h / 240; }
  function fecTX(v) { return FEC_TW.x + v * FEC_TW.w / 320; }
  function fecTY(v) { return FEC_TW.y + v * FEC_TW.h / 260; }

  /* one of the kit's scenes, in a box of the film's space */
  function fecBoxed(name, ids, box, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.scene(name, ids), box.x, box.y, box.w, box.h) +
      R(box.x, box.y, box.w, box.h, 8, "none", P.line, 3), { opacity: clamp(o, 0, 1) });
  }
  function fecScene(ids, o) { return fecBoxed("smoothie", ids, FEC_SM, o); }
  function fecKite(ids, o) { return fecBoxed("kite", ids, FEC_SM, o); }
  function fecTower(ids, o) { return fecBoxed("tower", ids, FEC_TW, o); }

  /* ==== the title ===============================================================
     A line of six numbered steps going down, with an arrow beside it: what a
     linear algorithm looks like. The four things you can do with it stand in a
     column on the right, each arriving as it is named. On the two cards it
     stands still. */
  var FEC_VERBS = [
    { pic: "\u{1F463}", at: "follow" },
    { pic: "\u{1F4A1}", at: "understand" },
    { pic: "✏️", at: "edit" },
    { pic: "\u{1F41B}", at: "correct" }
  ];
  var FEC_MOTIF = ["banana", "berries", "milk", "lid", "blend", "pour"];

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cSix = sn ? sc(sn, 0, "six") : null, cLine = sn ? sc(sn, 0, "line") : null,
      cBan = sn ? sc(sn, 0, "banana") : null, cPour = sn ? sc(sn, 0, "pour") : null;
    out += R(10, 22, 340, 316, 28, P.card, P.line, 3);
    /* the line the steps stand in */
    out += MK.arrow(44, 60, 44, 300, sn ? on(t, cLine, 0.8) : 1, P.gold, 6);
    var shown = sn ? tally(t, cSix, 6, 0.9) : 6;
    FEC_MOTIF.forEach(function (id, k) {
      if (k >= shown) return;
      var y = 58 + k * 42, p = sn ? popIn(t, cSix == null ? null : cSix + k * 0.18, 0.34) : 1;
      out += G(R(70, y, 186, 30, 10, P.cell, P.line, 2) +
        C(85, y + 15, 9, P.card, P.line, 1.5) +
        Tx(85, y + 19, String(k + 1), "lab", "middle", { fill: P.muted, "font-size": 12 }) +
        Em(110, y + 16, 19, FEC_STEP[id].pic),
        { transform: around(163, y + 15, Math.min(1.06, p)), opacity: Math.min(1, p) });
      /* the first step and the last one, as the line is read out */
      var hl = k === 0 ? bump(t, cBan, 1.1) : k === 5 ? bump(t, cPour, 1.1) : 0;
      if (hl > 0) out += R(66, y - 4, 194, 38, 13, "none", P.gold, 3, { opacity: hl });
    });
    /* follow, understand, edit, correct */
    FEC_VERBS.forEach(function (v, k) {
      var p = sn ? popIn(t, sc(sn, 1, v.at), 0.38) : 1;
      if (!(p > 0)) return;
      out += MK.pop(C(302, 92 + k * 58, 24, P.cell, P.teal, 2) + Em(302, 92 + k * 58, 26, v.pic),
        302, 92 + k * 58, p);
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Six steps in a line, and the four things you can do with them">' +
      out + "</svg>";
  }

  /* ==== chapter: a line of steps ==================================================
     The six smoothie steps, read out one at a time, with the kit's own smoothie
     drawn from exactly the list on the left. Then the line is followed from top
     to bottom, and a jump back up it is crossed out. The last beat says that
     linear is not the same as short: a short line and a long one, both ticked. */
  var FEC_SMOOTH = ["banana", "berries", "milk", "lid", "blend", "pour"];

  function fecLinearMain(scene, t) {
    var cLinear = sc(scene, 0, "linear"), cLine = sc(scene, 0, "line"),
      cFirst = sc(scene, 0, "first"), cEnd = sc(scene, 0, "end");
    var cSmooth = sc(scene, 1, "smoothie"), cBanana = sc(scene, 1, "banana"),
      cBerries = sc(scene, 1, "berries"), cMilk = sc(scene, 1, "milk");
    var cLid = sc(scene, 2, "lid"), cBlend = sc(scene, 2, "blend"),
      cPour = sc(scene, 2, "pour"), cSix = sc(scene, 2, "six");
    var cTop = sc(scene, 3, "top"), cJump = sc(scene, 3, "jump");
    var at = { banana: cBanana, berries: cBerries, milk: cMilk, lid: cLid, blend: cBlend, pour: cPour };
    var out = "", done = 0;
    FEC_SMOOTH.forEach(function (id) { if (fecPast(t, at[id])) done++; });

    /* the kit's smoothie, from exactly the list on the left. It steps aside for
       the last beat, which is about the length of a line rather than a smoothie. */
    out += fecScene(FEC_SMOOTH.slice(0, done), on(t, cSmooth, 0.5) * (1 - into(t, scene.first + 4)));

    /* the slots that are still waiting, then the steps themselves */
    var slots = tally(t, cLinear, 6, 0.9);
    for (var k = done; k < 6; k++) if (k < slots) out += fecSlot(FEC_PANEL.x, fec6Y(k), FEC_PANEL.w, FEC_R6.h, k + 1, 1);
    FEC_SMOOTH.forEach(function (id, k) {
      var o = on(t, at[id], 0.4);
      if (o <= 0) return;
      var live = done - 1 === k;
      out += fecRow(FEC_PANEL.x, fec6Y(k), FEC_PANEL.w, FEC_R6.h, k + 1, id, { o: o, col: live ? P.gold : null });
      out += MK.ripple(FEC_PANEL.x + 38, fec6Y(k) + FEC_R6.h / 2, t, at[id], P.gold);
      /* "Six steps, one after another": each row lights in turn */
      var fl = bump(t, cSix == null ? null : cSix + k * 0.17, 0.5);
      if (fl > 0) out += R(FEC_PANEL.x, fec6Y(k), FEC_PANEL.w, FEC_R6.h, FEC_R6.h * 0.26, "none", P.gold, 5, { opacity: fl });
    });

    /* the line the six steps stand in, drawn down the side of them */
    var ln = on(t, cLine, 0.9), y0 = fec6Y(0) + FEC_R6.h / 2, y5 = fec6Y(5) + FEC_R6.h / 2;
    if (ln > 0) {
      out += L(22, y0, 22, lerp(y0, y5, ln), P.gold, 5);
      for (var j = 0; j < 6; j++)
        if (lerp(y0, y5, ln) >= fec6Y(j) + FEC_R6.h / 2 - 1) out += C(22, fec6Y(j) + FEC_R6.h / 2, 8, P.gold);
    }

    /* "a first" and "an end": the two ends of the line */
    var f1 = bump(t, cFirst, 1.1), e1 = bump(t, cEnd, 1.4);
    if (f1 > 0) out += R(FEC_PANEL.x - 5, fec6Y(0) - 5, FEC_PANEL.w + 10, FEC_R6.h + 10, 20, "none", P.gold, 5, { opacity: f1 });
    if (e1 > 0) out += R(FEC_PANEL.x - 5, fec6Y(5) - 5, FEC_PANEL.w + 10, FEC_R6.h + 10, 20, "none", P.gold, 5, { opacity: e1 });

    /* top to bottom, and the crossed jump back: both belong to their own beat,
       so both go when the chapter's last beat arrives */
    var here = 1 - into(t, scene.first + 4);
    var td = on(t, cTop, 1.1) * here;
    out += MK.arrow(FEC_GUT, fec6Y(0) + 10, FEC_GUT, fec6Y(5) + FEC_R6.h - 8, td, P.gold, 7);
    if (td > 0 && td < 1) out += C(FEC_GUT, lerp(fec6Y(0) + 10, fec6Y(5) + FEC_R6.h - 8, td), 11, P.gold, P.ground, 2);

    /* never jump back up the list: an arc from step five to step two, crossed */
    var ju = on(t, cJump, 0.6) * here;
    if (ju > 0) {
      var y1 = fec6Y(4) + FEC_R6.h / 2, y2 = fec6Y(1) + FEC_R6.h / 2, my = (y1 + y2) / 2;
      out += Pth("M64," + n2(y1) + " C10," + n2(y1) + " 10," + n2(y2) + " 64," + n2(y2), null, P.bad, 6,
        { opacity: ju, "stroke-dasharray": "14 10" });
      out += MK.cross(30, my, 22, popIn(t, cJump == null ? null : cJump + 0.35, 0.4) * here);
    }
    return out;
  }

  /* the last beat: a short line of two steps, and a line that keeps going -
     both of them linear, so both are ticked. The lesson never gives the long
     line a step count (its own correction only says "can be long"), so this
     picture does not count one out either: the long line fades in as one
     piece and ends in an ellipsis rather than a tallied, numbered list. */
  function fecLinearLong(scene, t) {
    var cShort = sc(scene, 4, "short"), cOrder = sc(scene, 4, "order"), cLong = sc(scene, 4, "long");
    var out = "", k;
    var sp = popIn(t, cShort, 0.4);
    if (sp > 0) {
      out += L(756, 150, 756, 250, P.gold, 5, { opacity: Math.min(1, sp) });
      for (k = 0; k < 2; k++) out += MK.pop(C(756, 150 + k * 100, 26, P.cell, P.gold, 4) +
        Tx(756, 158 + k * 100, String(k + 1), "lab", "middle", { fill: P.gold, "font-size": 24 }), 756, 150 + k * 100, sp);
      out += MK.tick(756, 322, 30, popIn(t, cShort == null ? null : cShort + 0.45, 0.4));
    }
    /* a longer line: no count is spoken, so none is drawn - a handful of dots
       fade in together as one line, then an ellipsis says it keeps going */
    var n = 6, lo = on(t, cOrder, 0.9);
    if (lo > 0) {
      out += L(980, 44, 980, 44 + (n - 1) * 30, P.gold, 5, { opacity: lo });
      for (k = 0; k < n; k++) out += C(980, 44 + k * 30, 12, P.cell, P.gold, 3, { opacity: lo });
    }
    var el = on(t, cLong, 0.5);
    if (el > 0) {
      for (k = 0; k < 3; k++) out += C(980, 44 + n * 30 + 8 + k * 16, 4, P.gold, null, 0, { opacity: el });
      out += MK.tick(1062, 209, 30, popIn(t, cLong, 0.4));
    }
    return out;
  }

  /* The list of six stays on the left throughout; only the right half turns
     over, from the kit's smoothie to the two lines. */
  function fecLinearChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = fecLinearMain(scene, t);
    if (u > 0) out += G(fecLinearLong(scene, t), { opacity: u });
    return svg(out);
  }
