  /* ==== Grade 4 Computing, Lesson 5: Programs with Loops ======================
     tools/lib/film-scenes/computing-g4/programs-with-loops.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/programs-with-loops.json.

     THE LESSON RUNS THE PROGRAMS, NOT THE FILM. Every sprite end state here
     comes from ART.run on the lesson's own stage - the cat's square after
     "home, repeat 3 times, move right, grow", and its size after three grows,
     which the kit caps at 2.2. The film never does that arithmetic itself, so
     a change to the kit changes the picture instead of disagreeing with it.
     PL_CHECK, at the foot of -3.js, compares the number of passes this film
     DRAWS against the number of moves the kit actually made.

     There is no ART.sim in Computing (see the adapter's header), so the block
     column and the sprite stage are drawn here, in the engine's idiom, with
     the lesson's own block labels, icons and category colours taken from
     ART.block. Draw the picture; borrow the rule.

     This file: the palette, the timing helpers, the blocks, the notes, the
     stage, the title motif and the chapter "The repeat block".
     Every top-level name here starts with pl, so nothing can replace a name of
     the engine, ART or MK. */

  var HUE = {
    title: P.teal, repeat: P.gold, build: P.blue, fold: P.accent,
    comment: P.plum, why: P.good, scratch: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does:
     for a thing that belongs to that beat alone (rule 7) */
  function plOnly(t, scene, k) { return plSpan(t, scene, k, k + 1); }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function plFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 from beat a until beat b comes in (b null: to the end of the chapter) */
  function plSpan(t, scene, a, b) {
    var inn = plFrom(t, scene, a);
    var out = b != null && b < scene.beats.length ? into(t, scene.first + b) : 0;
    return inn * (1 - out);
  }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function plPast(t, at) { return at != null && t >= at; }
  /* The scale that goes with an opacity: a thing pops in as it arrives, and
     FADES OUT AT FULL SIZE. Scaling straight from the opacity shrank every
     crossfading block to a chip halfway through - the build chapter's three
     move blocks became specks as the repeat replaced them. */
  function plPop(o) { return Math.min(1.06, Math.max(o, 0.88)); }

  /* ---- words ------------------------------------------------------------------ */

  /* A comment is a sentence, and a note is a small box: break it over lines. */
  function plWrap(text, per) {
    var words = String(text).split(" "), lines = [], cur = "";
    for (var k = 0; k < words.length; k++) {
      if (cur && (cur + " " + words[k]).length > per) { lines.push(cur); cur = words[k]; }
      else cur = cur ? cur + " " + words[k] : words[k];
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /* ---- the lesson's blocks ---------------------------------------------------
     The lesson's own label, icon and category for every block; computing.css
     paints move teal, look plum and control accent, on dark ink, so the film
     does too. opt: {o, col (a ring), label (overrides the lesson's), dim} */
  var PL_CAT = { move: P.teal, look: P.plum, control: P.accent };
  var PL_INK = "#06231F";

  function plBlock(x, y, w, h, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var b = ART.block(id);
    var fs = Math.min(25, h * 0.40);
    var body = R(x, y, w, h, h * 0.24, opt.fill || PL_CAT[b.cat] || P.cell,
        opt.col || "rgba(0,0,0,0.30)", opt.col ? 4 : 2) +
      Em(x + h * 0.50, y + h / 2, fs * 1.02, b.icon) +
      Tx(x + h * 0.92, y + h / 2 + fs * 0.35, opt.label == null ? b.label : opt.label, "lab", "start",
        { "font-size": fs, fill: PL_INK });
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.35 : 1),
      transform: around(x + w / 2, y + h / 2, plPop(o)) });
  }

  /* An empty slot, for a program that is about to be built. */
  function plSlot(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, h * 0.24, P.card, P.line, 2, { "stroke-dasharray": "10 8", opacity: clamp(o, 0, 1) });
  }

  /* a column of blocks: rows is [{id, o, col, label, dim}] */
  function plColumn(x, y, w, h, gap, rows) {
    var out = "";
    for (var k = 0; k < rows.length; k++) if (rows[k]) out += plBlock(x, y + k * (h + gap), w, h, rows[k].id, rows[k]);
    return out;
  }

  /* ---- a comment: a note for a person, in the lesson's own words -------------- */
  function plNote(x, y, w, h, text, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var lines = plWrap(text, opt.per || 26), fs = opt.size || 19;
    var body = R(x, y, w, h, 10, P.paper, opt.col || "#C9BFA4", opt.col ? 4 : 2) +
      R(x, y, 9, h, 4, opt.col || P.gold);
    var y0 = y + h / 2 - (lines.length - 1) * fs * 0.68 + fs * 0.34;
    for (var k = 0; k < lines.length; k++)
      body += Tx(x + 24, y0 + k * fs * 1.36, lines[k], "lab", "start", { "font-size": fs, fill: "#2B2415" });
    return G(body, { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, plPop(o)) });
  }

  /* ---- the sprite stage, drawn here (there is no ART.sim) --------------------- */
  function plStagePanel(b, o) {
    if (!(o > 0)) return "";
    return G(R(b.x, b.y, b.w, b.h, 22, P.card, P.line, 3) +
      R(b.x + 26, b.groundY - 6, b.w - 52, 12, 6, P.cell), { opacity: clamp(o, 0, 1) });
  }
  /* The lesson's cat, standing on the ground at (cx), at the kit's own scale.
     base is how big a scale of 1 is drawn on THIS chapter's stage; the scale
     itself always comes from ART.run. */
  function plCat(cx, groundY, scale, lift, o, base) {
    if (!(o > 0)) return "";
    var size = (base || 62) * (scale || 1);
    return Em(cx, groundY - size * 0.5 - (lift || 0), size, "\u{1F431}", { opacity: clamp(o, 0, 1) });
  }

  /* a loop bracket that hugs one block: it draws itself as u goes 0 -> 1 */
  function plLoop(x, yTop, yBot, u, col) {
    if (!(u > 0)) return "";
    col = col || P.gold;
    var d = "M" + n2(x) + "," + n2(yTop) + " C" + n2(x + 46) + "," + n2(yTop) +
      " " + n2(x + 46) + "," + n2(yBot) + " " + n2(x) + "," + n2(yBot);
    var out = Pth(d, null, col, 6, { pathLength: 1, "stroke-dasharray": n3(clamp(u, 0, 1)) + " 1" });
    if (u > 0.94) out += Pth("M" + n2(x + 16) + "," + n2(yBot - 11) + " L" + n2(x) + "," + n2(yBot) +
      " L" + n2(x + 16) + "," + n2(yBot + 11) + " Z", col, col, 2);
    return out;
  }

  /* ==== the title ===============================================================
     Grow written out three times, and the same job in one repeat block with a
     comment beside it: the whole lesson in one picture. In the spoken title
     chapter each piece arrives as it is named; on the two cards it stands
     still. */
  function plMini(x, y, w, h, icon, label, fill, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 10, fill, col || "rgba(0,0,0,0.30)", col ? 3 : 2) +
      Em(x + 22, y + h / 2, 21, icon) +
      Tx(x + 40, y + h / 2 + 7, label, "lab", "start", { "font-size": 19, fill: PL_INK }),
      { opacity: Math.min(1, o), transform: around(x + w / 2, y + h / 2, plPop(o)) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cGrows = sn ? sc(sn, 0, "grows") : null, cSame = sn ? sc(sn, 0, "same") : null,
      cThree = sn ? sc(sn, 0, "three") : null, cRepeat = sn ? sc(sn, 1, "repeat") : null,
      cJob = sn ? sc(sn, 1, "job") : null, cComment = sn ? sc(sn, 1, "comment") : null;
    var grown = sn ? tally(t, cGrows, 3, 0.9) : 3;
    var brace = sn ? on(t, cSame, 0.5) : 1, three = sn ? popIn(t, cThree, 0.4) : 1;
    var rep = sn ? popIn(t, cRepeat, 0.45) : 1, job = sn ? popIn(t, cJob, 0.4) : 1;
    var note = sn ? popIn(t, cComment, 0.45) : 1;

    out += R(10, 16, 340, 328, 26, P.card, P.line, 3);
    /* the same block, written out three times */
    for (var k = 0; k < 3; k++)
      out += plMini(30, 42 + k * 44, 170, 38, "\u{1F53C}", "grow", P.plum, k < grown ? 1 : 0);
    out += Pth("M218,46 C238,46 238,160 218,160", null, P.gold, 5,
      { pathLength: 1, "stroke-dasharray": n3(brace) + " 1" });
    out += MK.pop(Tx(268, 114, "×3", "lab", "middle", { "font-size": 40, fill: P.gold }), 268, 103, three);
    /* the same job in one repeat block, with a note beside it */
    out += MK.arrow(115, 178, 115, 202, sn ? on(t, cRepeat, 0.4) : 1, P.teal, 7);
    out += plMini(30, 214, 200, 38, "\u{1F501}", "repeat 3 times", P.accent, rep, P.gold);
    out += plMini(58, 262, 172, 38, "\u{1F53C}", "grow", P.plum, rep);
    out += plLoop(236, 224, 292, rep, P.gold);
    out += MK.tick(300, 238, 26, job);
    out += MK.pop(R(238, 300, 102, 36, 8, P.paper, P.gold, 3) +
      Tx(252, 324, "why", "lab", "start", { "font-size": 20, fill: "#2B2415" }), 289, 318, note);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Grow written out three times, and the same job as one repeat block with a comment beside it">' +
      out + "</svg>";
  }

  /* ==== chapter: the repeat block ==============================================
     The lesson's own demo. Repeat 3 times, jump, say hello stands in a column
     on the left; the cat jumps three times on the stage and the three
     iterations fill as it does. The loop bracket hugs the ONE block after the
     repeat, and the dashed box around the whole program is crossed out. */
  var PL_RP = { x: 60, w: 300, h: 62, gap: 18, y0: 126 };
  var PL_RP_IDS = ["repeat3", "jump", "say"];
  function plRpY(k) { return PL_RP.y0 + k * (PL_RP.h + PL_RP.gap); }
  var PL_RP_STAGE = { x: 500, y: 90, w: 620, h: 306, groundY: 330 };
  var PL_RP_CAT = 660;
  var PL_PIP = { x: 890, dx: 80, y: 182, r: 26 };
  var PL_JUMPS = 3, PL_JUMP_SPAN = 2.0;

  function plRepeatChapter(scene, beat, t, i) {
    var cRepeat = sc(scene, 0, "repeat"), cAfter = sc(scene, 0, "after");
    var cThree = sc(scene, 1, "three"), cJumps = sc(scene, 1, "jumps");
    var cIter = sc(scene, 2, "iteration"), cIter3 = sc(scene, 2, "three");
    var cOne = sc(scene, 3, "one"), cWhole = sc(scene, 3, "whole");
    var cDone = sc(scene, 4, "done"), cHello = sc(scene, 4, "hello");
    var out = "";

    /* the three jumps, and how many of them are over */
    var ju = cJumps == null || t < cJumps ? 0 : clamp((t - cJumps) / PL_JUMP_SPAN, 0, 1);
    var flying = cJumps != null && t >= cJumps && ju < 1;
    var jk = Math.min(PL_JUMPS - 1, Math.floor(ju * PL_JUMPS));
    var lift = flying ? Math.sin(Math.PI * (ju * PL_JUMPS - jk)) * 88 : 0;
    var jumpsDone = Math.min(PL_JUMPS, Math.floor(ju * PL_JUMPS + 1e-9));

    /* the stage: the cat, the three iterations, and hello at the end */
    out += plStagePanel(PL_RP_STAGE, 1);
    out += plCat(PL_RP_CAT, PL_RP_STAGE.groundY, 1, lift, 1, 92);
    var pips = on(t, cThree, 0.5);
    for (var k = 0; k < PL_JUMPS; k++) {
      var px = PL_PIP.x + k * PL_PIP.dx, done = k < jumpsDone;
      out += G(C(px, PL_PIP.y, PL_PIP.r, done ? "rgba(244,201,93,0.30)" : P.cell, done ? P.gold : P.line, 3) +
        Tx(px, PL_PIP.y + 9, String(k + 1), "lab", "middle", { "font-size": 26, fill: done ? P.gold : P.muted }),
        { opacity: pips });
      if (flying && k === jk) out += C(px, PL_PIP.y, PL_PIP.r + 9, "none", P.gold, 4, { opacity: pips * 0.9 });
      var ring3 = on(t, cIter3, 0.45), ring1 = on(t, cIter, 0.45) * (1 - ring3);
      var ring = k === 0 ? Math.max(ring1, ring3) : ring3;
      if (ring > 0) out += C(px, PL_PIP.y, PL_PIP.r + 9, "none", P.good, 4, { opacity: ring });
    }
    var lbl3 = on(t, cIter3, 0.5);
    out += MK.pill(970, 252, "iteration", on(t, cIter, 0.45) * (1 - lbl3), { size: 22, col: P.good, ink: P.good });
    out += MK.pill(970, 252, "3 iterations", lbl3, { size: 22, col: P.good, ink: P.good });
    var hello = popIn(t, cHello, 0.45);
    if (hello > 0) out += MK.bubble(566, 168, 190, 66, "Hello!", Math.min(1, hello), PL_RP_CAT, 252);
    out += MK.tick(792, 148, 28, popIn(t, cHello == null ? null : cHello + 0.5, 0.4));

    /* the program: the repeat block, the one block after it, then say hello */
    out += MK.pill(60, 88, "Program", on(t, cRepeat, 0.4), { size: 22, anchor: "start", col: P.gold, ink: P.gold });
    var showSay = plFrom(t, scene, 3);
    var alone = on(t, cOne, 0.5) * plSpan(t, scene, 3, 4) * (1 - on(t, cWhole, 0.5));
    var rows = [
      { id: "repeat3", o: popIn(t, cRepeat, 0.45) * (1 - 0.55 * alone), col: plPast(t, cThree) && !plPast(t, cDone) ? P.gold : null },
      { id: "jump", o: popIn(t, cAfter, 0.45), col: plPast(t, cOne) && !plPast(t, cDone) ? P.gold : null },
      { id: "say", o: showSay * (1 - 0.55 * alone), col: plPast(t, cDone) ? P.gold : null }
    ];
    out += plColumn(PL_RP.x, PL_RP.y0, PL_RP.w, PL_RP.h, PL_RP.gap, rows);
    out += MK.ripple(PL_RP.x + 30, plRpY(2) + PL_RP.h / 2, t, cDone, P.gold);

    /* the bracket around the ONE block after the repeat */
    var loop = Math.max(on(t, cAfter, 0.6), on(t, cOne, 0.5));
    out += MK.glow(408, plRpY(1) + PL_RP.h / 2, 96, P.gold, bump(t, cOne, 1.6));
    var spent = on(t, cDone, 0.5);
    out += G(plLoop(388, plRpY(1) + 8, plRpY(1) + PL_RP.h - 8, loop, P.gold) +
      MK.pop(Tx(440, 258, "×3", "lab", "start", { "font-size": 30, fill: P.gold }), 456, 248,
        popIn(t, cThree, 0.4)), { opacity: 1 - 0.75 * spent });

    /* not the whole program: the dashed box, crossed, for that beat alone */
    var whole = on(t, cWhole, 0.5) * plSpan(t, scene, 3, 4);
    if (whole > 0)
      out += G(R(44, plRpY(0) - 14, 332, 3 * PL_RP.h + 2 * PL_RP.gap + 28, 16, "none", P.bad, 4,
        { "stroke-dasharray": "14 10" }) + MK.cross(376, plRpY(0) - 14, 26, 1), { opacity: whole });
    return svg(out);
  }
