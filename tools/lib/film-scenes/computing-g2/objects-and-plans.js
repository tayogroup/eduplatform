  /* ==== Grade 2 Computing, Lesson 4: Objects and Plans ========================
     tools/lib/film-scenes/computing-g2/objects-and-plans.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/objects-and-plans.json.

     WHAT MOVES ON SCREEN IS THE LESSON'S OWN ARITHMETIC. Computing has no
     ART.sim, so the stage, the trays and the traffic light are drawn here in
     the engine's idiom - but every sprite's position, size and fade comes from
     ART.run, which runs the script on the lesson's own sprite stage and hands
     back its end state: move right is one square and stops at three, grow is
     times 1.4 capped at 2.2, hide fades to 0.15, and a repeat block is unrolled
     by ART.program.expand. Every block's words and icon come from ART.block.
     So the film cannot disagree with the lesson about what a block does.

     Each run is worked out ONCE, beside the film's other constants, never
     inside a draw function: the adapter's own advice, because a run leaves the
     lesson's sequencing timers behind and a render draws thousands of frames.

     This file: the palette, the blocks, the stage, the sprite, the title motif
     and the chapter "Two objects, one stage". Every top-level name here starts
     with op, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, objects: P.gold, plans: P.accent, build: P.good,
    repeats: P.blue, which: P.plum, real: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------- */

  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function opFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function opPast(t, at) { return at != null && t >= at; }
  /* the same cue, dt seconds later - or null, for a cue the beat never named.
     Every later chapter staggers a set of things off ONE cue this way; it is
     not opRunAt (below), which looks a RUN STATE up and is used only inside
     this chapter's own opObjectsMain. */
  function opAfter(at, dt) { return at == null ? null : at + dt; }
  /* a chapter drawn in two halves, the second taking over at beat k */
  function opHalves(scene, t, k, a, b) {
    var u = into(t, scene.first + k), out = "";
    if (u < 1) out += G(a(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(b(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- the lesson's blocks --------------------------------------------- */

  /* the lesson's own three block families: move, look, control */
  var OP_COL = { move: P.teal, look: P.plum, control: P.gold };

  /* One block, with the lesson's own label and icon (ART.block).
     opt: {o, col, lit, dimmed, mark ("tick"|"cross"), markP, pop} */
  function opBlock(x, y, w, h, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var b = ART.block(id), col = opt.col || OP_COL[b.cat] || P.line;
    var fs = opt.fs || Math.min(23, h * 0.40);
    var body = R(x, y, w, h, h * 0.27, opt.fill || P.cell, col, opt.lit ? 4 : 2.5) +
      Em(x + h * 0.56, y + h / 2, h * 0.50, b.icon) +
      Tx(x + h * 1.02, y + h / 2 + fs * 0.35, b.label, "lab", "start", { "font-size": fs });
    var mx = x + w - h * 0.42, my = y + h / 2, mr = h * 0.25, p = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, mr, p);
    else if (opt.mark === "cross") body += MK.cross(mx, my, mr, p);
    return G(body, {
      opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.4 : 1),
      transform: opt.pop == null ? null : around(x + w / 2, y + h / 2, 0.78 + 0.22 * Math.min(1, opt.pop))
    });
  }

  /* an empty place where a block could go, or a whole plan with nothing in it */
  function opSlot(x, y, w, h, o, label) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.27, P.card, P.line, 2, { "stroke-dasharray": "10 8" }) +
      (label ? Tx(x + w / 2, y + h / 2 + 7, label, "lab mid muted", "middle") : ""),
      { opacity: clamp(o, 0, 1) });
  }

  /* A titled box that holds one object's blocks: its face, its name and a rule
     under it. opt: {col, o, dimmed} */
  function opTray(x, y, w, h, glyph, title, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.line;
    return G(R(x, y, w, h, 18, P.card, col, opt.col ? 3.5 : 2) +
      Em(x + 32, y + 32, 34, glyph) +
      Tx(x + 58, y + 41, title, "lab", "start", { fill: opt.col || P.muted }) +
      L(x + 14, y + 58, x + w - 14, y + 58, P.line, 2),
      { opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.4 : 1) });
  }

  /* ---- the stage and the objects on it --------------------------------- */

  var OP_SQ = 62;   /* one square of the lesson's stage, in the film's space */

  /* opt: {ground (how deep the floor band is), title} */
  function opStageBox(x, y, w, h, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var gy = y + h - (opt.ground || 44);
    return G(R(x, y, w, h, 20, P.card, P.line, 2.5) +
      R(x + 5, gy, w - 10, y + h - gy - 5, 14, P.cell) +
      L(x + 5, gy, x + w - 5, gy, P.line, 3) +
      (opt.title ? Tx(x + 20, y + 32, opt.title, "lab mid muted", "start") : ""),
      { opacity: clamp(o, 0, 1) });
  }

  var OP_REST = { x: 0, scale: 1, spin: 0, hidden: false };

  /* One object standing on the stage. st is the LESSON'S state - {x, scale,
     spin, hidden} straight out of ART.run - and hx is the square-zero place
     this object was put. The hop of a jump and the turning of a spin are drawn
     here, because the lesson's end state for a jump is standing still again and
     for a spin is a whole turn. opt: {hop, spin, scale, o} */
  /* the "objects" chapter's own sprite, fixed to its one 190 px box - the
     later chapters each have their own stage box, at their own height, so
     they use opSprite (below, after this file's own chapter), which takes
     the box's top and height and places a sprite on THAT floor. Same name,
     two shapes, would silently mean whichever was declared last everywhere -
     kept apart on purpose. */
  function opObjSprite(hx, gy, size, glyph, st, opt) {
    opt = opt || {};
    st = st || OP_REST;
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var x = hx + (st.x || 0) * OP_SQ, y = gy - size * 0.46 - (opt.hop || 0);
    var s = (st.scale == null ? 1 : st.scale) * (opt.scale == null ? 1 : opt.scale);
    return G(Em(0, 0, size, glyph), {
      transform: "translate(" + n2(x) + "," + n2(y) + ") rotate(" + n2(opt.spin || 0) + ") scale(" + n3(s) + ")",
      opacity: (st.hidden ? 0.15 : 1) * clamp(o, 0, 1)
    });
  }

  /* the lesson's "Hello!" bubble, which is what its say block does */
  function opHello(x, y, o) {
    if (!(o > 0)) return "";
    return MK.bubble(x - 68, y - 96, 136, 58, "Hello!", Math.min(1, o), x, y - 26);
  }

  /* ---- running a script the lesson's way -------------------------------
     expand() is the lesson's own unrolling of a repeat block, and each prefix
     is run on the lesson's own stage, so after[n] is where the object really
     is once n moves have been made. */
  function opRun(glyph, ids) {
    var moves = ART.program.expand(ids), after = [];
    for (var k = 1; k <= moves.length; k++) after.push(ART.run(glyph, moves.slice(0, k))[0]);
    return { ids: ids, moves: moves, after: after, words: ART.program.words(ids) };
  }
  function opRunAt(r, n) { return n <= 0 ? OP_REST : r.after[Math.min(Math.round(n), r.after.length) - 1]; }

  var OP_CAT = "\u{1F431}", OP_DOG = "\u{1F436}", OP_BALL = "⚽", OP_TREE = "\u{1F333}";
  var OP_CAT_IDS = ["right", "right", "say"];
  var OP_DOG_IDS = ["jump", "jump", "spin"];
  var OP_CAT_RUN = opRun(OP_CAT, OP_CAT_IDS);
  var OP_DOG_RUN = opRun(OP_DOG, OP_DOG_IDS);

  /* ==== the title motif ==========================================================
     A cat and a dog on one stage, and above each one a plan card with its own
     three blocks in it - the cat's two moves and a say, the dog's two jumps and
     a spin. The two cards are visibly different, which is the lesson's point.
     In the spoken title chapter each piece arrives as it is named; on the two
     cards it stands still. */
  var OP_MOTIF = [
    { hx: 94, ids: OP_CAT_IDS, glyph: OP_CAT, card: 34 },
    { hx: 266, ids: OP_DOG_IDS, glyph: OP_DOG, card: 206 }
  ];

  function opMotifCard(x, ids, shown, ring) {
    var out = R(x, 18, 120, 110, 18, P.card, ring > 0.5 ? P.gold : P.line, ring > 0.5 ? 3.5 : 2);
    ids.forEach(function (id, k) {
      if (k >= shown) return;
      var b = ART.block(id), y = 30 + k * 32;
      out += R(x + 10, y, 100, 26, 9, P.cell, OP_COL[b.cat] || P.line, 2) +
        Em(x + 24, y + 13, 17, b.icon) +
        R(x + 38, y + 10, 60, 7, 3.5, OP_COL[b.cat] || P.muted, null, null, { opacity: 0.8 });
    });
    return out;
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cCat = sn ? sc(sn, 0, "cat") : null, cDog = sn ? sc(sn, 0, "dog") : null,
      cStage = sn ? sc(sn, 0, "stage") : null, cTwo = sn ? sc(sn, 0, "two") : null,
      cPlans = sn ? sc(sn, 0, "plans") : null;
    var cBlocks = sn ? sc(sn, 1, "blocks") : null, cPlan = sn ? sc(sn, 1, "plan") : null,
      cBuild = sn ? sc(sn, 1, "build") : null;
    var pop = [sn ? popIn(t, cCat, 0.4) : 1, sn ? popIn(t, cDog, 0.4) : 1];
    var lit = sn ? on(t, cStage, 0.5) : 1, badge = sn ? popIn(t, cTwo, 0.4) : 1;
    var card = sn ? popIn(t, cPlans, 0.4) : 1;
    var shown = sn ? tally(t, cBlocks, 3, 0.7) : 3;
    var ring = sn ? on(t, cPlan, 0.45) : 0;
    var arrow = sn ? on(t, cBuild, 0.5) : 1;

    /* the stage */
    out += R(14, 176, 332, 168, 22, P.card, P.line, 3);
    out += G(R(20, 300, 320, 38, 14, P.cell) + L(20, 300, 340, 300, P.line, 3), { opacity: 0.35 + 0.65 * lit });
    OP_MOTIF.forEach(function (m, k) {
      out += G(opMotifCard(m.card, m.ids, shown, ring), { opacity: Math.min(1, card), transform: around(m.card + 60, 73, Math.min(1.06, card)) });
      out += MK.arrow(m.hx, 136, m.hx, 196, arrow, P.gold, 6);
      out += MK.pill(m.hx, 212, "object", badge, { size: 14, col: P.gold, ink: P.gold });
      out += G(Em(m.hx, 292, 62, m.glyph), { opacity: Math.min(1, pop[k]), transform: around(m.hx, 292, Math.min(1.08, pop[k])) });
    });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A cat and a dog on one stage, each with its own plan card of blocks">' + out + "</svg>";
  }

  /* ==== chapter: two objects, one stage ==========================================
     The lesson's own three objects - a cat, a dog and a ball - on one stage,
     each with an empty tray under it that CAN be given blocks. The cat's tray
     fills and the cat moves; the dog's tray fills and the dog jumps and spins;
     and neither one moves on the other's blocks, which is the whole idea.
     The last beat is the same three blocks in three forms: the algorithm in
     words, the program in blocks, and the computer running it. */
  var OP_OBJ = [
    { hx: 240, glyph: OP_CAT, name: "the cat", ids: OP_CAT_IDS, run: OP_CAT_RUN },
    { hx: 584, glyph: OP_DOG, name: "the dog", ids: OP_DOG_IDS, run: OP_DOG_RUN },
    { hx: 928, glyph: OP_BALL, name: "the ball", ids: [], run: null }
  ];
  var OP_STG = { x: 24, y: 8, w: 1120, h: 190, ground: 40 };
  var OP_GY = OP_STG.y + OP_STG.h - OP_STG.ground;     /* the floor the objects stand on */
  var OP_TRAY = { y: 214, w: 300, h: 216, rowH: 46, rowGap: 8 };

  function opObjectsMain(scene, t) {
    var cProgram = sc(scene, 0, "program"), cMore = sc(scene, 0, "more");
    var cCat = sc(scene, 1, "cat"), cDog = sc(scene, 1, "dog"), cBall = sc(scene, 1, "ball"),
      cObject = sc(scene, 1, "object");
    var cThing = sc(scene, 2, "thing"), cOwn = sc(scene, 2, "own");
    var cCatB = sc(scene, 3, "catb"), cDogB = sc(scene, 3, "dogb");
    var out = "", arrive = [cCat, cDog, cBall];

    out += opStageBox(OP_STG.x, OP_STG.y, OP_STG.w, OP_STG.h, on(t, cProgram, 0.55), { ground: OP_STG.ground, title: "one stage" });
    var slots = tally(t, cMore, 3, 0.7);
    var named = tally(t, cObject, 3, 0.7);
    var trays = tally(t, cOwn, 3, 0.7);

    /* how far the cat's and the dog's own blocks have run */
    var catN = opPast(t, cCatB) ? tally(t, cCatB, 3, 1.0) : 0;
    var dogN = opPast(t, cDogB) ? tally(t, cDogB, 3, 1.0) : 0;
    var dogSpin = dogN >= 3 ? 360 * ease((t - cDogB - 0.66) / 0.55) : 0;
    var dogHop = dogN >= 1 && dogN <= 2 ? 34 * Math.sin(Math.PI * clamp(((t - cDogB) / 0.33) % 1, 0, 1)) : 0;

    OP_OBJ.forEach(function (o, k) {
      /* the empty place on the floor, before the object is named */
      var here = popIn(t, arrive[k], 0.42);
      if (k < slots && here < 1) out += G(E(o.hx, OP_GY - 6, 34, 12, "none", P.line, 3, { "stroke-dasharray": "9 7" }), { opacity: 1 - Math.min(1, here) });
      var glow = k === 0 ? bump(t, cThing, 1.1) : k === 1 ? bump(t, cThing == null ? null : cThing + 0.22, 1.1) : bump(t, cThing == null ? null : cThing + 0.44, 1.1);
      if (glow > 0) out += MK.glow(o.hx, OP_GY - 42, 76, P.gold, glow);
      var st = k === 0 ? opRunAt(o.run, catN) : k === 1 ? opRunAt(o.run, dogN) : OP_REST;
      out += opObjSprite(o.hx, OP_GY, 84, o.glyph, st, {
        o: Math.min(1, here), scale: Math.min(1.08, here),
        hop: k === 1 ? dogHop : 0, spin: k === 1 ? dogSpin : 0
      });
      if (k === 0 && catN >= 3) out += opHello(o.hx + st.x * OP_SQ, OP_GY - 48, on(t, cCatB == null ? null : cCatB + 0.66, 0.4));
      out += MK.pill(o.hx, OP_STG.y + 34, "object", k < named ? popIn(t, cObject == null ? null : cObject + k * 0.24, 0.4) : 0,
        { size: 18, col: P.gold, ink: P.gold });

      /* the tray: empty at first, then this object's own blocks */
      var tx = o.hx - OP_TRAY.w / 2, running = k === 0 ? cCatB : k === 1 ? cDogB : null;
      var done = k === 0 ? catN : k === 1 ? dogN : 0;
      out += opTray(tx, OP_TRAY.y, OP_TRAY.w, OP_TRAY.h, o.glyph, o.name + "'s blocks",
        { o: k < trays ? on(t, cOwn == null ? null : cOwn + k * 0.2, 0.45) : 0, col: done > 0 ? P.gold : null });
      o.ids.forEach(function (id, j) {
        var ry = OP_TRAY.y + 70 + j * (OP_TRAY.rowH + OP_TRAY.rowGap);
        var p = popIn(t, running == null ? null : running + j * 0.33, 0.35);
        if (j < done) out += opBlock(tx + 14, ry, OP_TRAY.w - 28, OP_TRAY.rowH, id, { pop: p, lit: j === done - 1 });
        else if (k < trays) out += opSlot(tx + 14, ry, OP_TRAY.w - 28, OP_TRAY.rowH, on(t, cOwn == null ? null : cOwn + k * 0.2, 0.45));
      });
      if (k === 2 && k < trays) {
        for (var j2 = 0; j2 < 3; j2++)
          out += opSlot(tx + 14, OP_TRAY.y + 70 + j2 * (OP_TRAY.rowH + OP_TRAY.rowGap), OP_TRAY.w - 28, OP_TRAY.rowH,
            on(t, cOwn == null ? null : cOwn + 0.4, 0.45));
      }
    });
    return out;
  }

  /* the last beat: three blocks, three forms - the algorithm in the lesson's
     own words, the program in the lesson's own blocks, and the lesson's own
     laptop running it */
  var OP_ALGO = { x: 26, y: 62, w: 290, h: 300 };
  var OP_PROG = { x: 360, y: 62, w: 330, h: 300 };
  var OP_LAP = { x: 748, y: 74, w: 384, h: 286 };

  function opObjectsProgram(scene, t) {
    var cMake = sc(scene, 4, "make"), cTells = sc(scene, 4, "tells"), cAlgo = sc(scene, 4, "algo");
    var out = "", snap = tally(t, cMake, 3, 0.8), lap = on(t, cTells, 0.5), algo = on(t, cAlgo, 0.5);

    /* the algorithm: the lesson's own words for these three blocks */
    out += G(R(OP_ALGO.x, OP_ALGO.y, OP_ALGO.w, OP_ALGO.h, 18, P.card, algo > 0.4 ? P.gold : P.line, algo > 0.4 ? 3.5 : 2) +
      Tx(OP_ALGO.x + OP_ALGO.w / 2, OP_ALGO.y + 40, "algorithm", "lab big", "middle", { fill: algo > 0.4 ? P.gold : P.muted }) +
      L(OP_ALGO.x + 16, OP_ALGO.y + 58, OP_ALGO.x + OP_ALGO.w - 16, OP_ALGO.y + 58, P.line, 2),
      { opacity: 0.45 + 0.55 * algo });
    OP_CAT_RUN.words.split(", then ").forEach(function (w, k) {
      out += Tx(OP_ALGO.x + OP_ALGO.w / 2, OP_ALGO.y + 116 + k * 66, w, "lab big", "middle",
        { opacity: 0.45 + 0.55 * algo });
    });

    /* the program: the same three, as blocks */
    out += R(OP_PROG.x, OP_PROG.y, OP_PROG.w, OP_PROG.h, 18, P.card, snap > 0 ? P.teal : P.line, snap > 0 ? 3.5 : 2);
    out += Tx(OP_PROG.x + OP_PROG.w / 2, OP_PROG.y + 40, "program", "lab big", "middle", { fill: snap > 0 ? P.teal : P.muted });
    out += L(OP_PROG.x + 16, OP_PROG.y + 58, OP_PROG.x + OP_PROG.w - 16, OP_PROG.y + 58, P.line, 2);
    OP_CAT_IDS.forEach(function (id, k) {
      var ry = OP_PROG.y + 82 + k * 70;
      if (k < snap) out += opBlock(OP_PROG.x + 18, ry, OP_PROG.w - 36, 56, id, { pop: popIn(t, cMake == null ? null : cMake + k * 0.28, 0.35) });
      else out += opSlot(OP_PROG.x + 18, ry, OP_PROG.w - 36, 56, 1);
    });

    /* the algorithm and the program are the same three steps */
    out += MK.leader(OP_ALGO.x + OP_ALGO.w + 6, 212, OP_PROG.x - 6, 212, algo, P.gold);
    /* the computer, told what to run */
    out += MK.arrow(OP_PROG.x + OP_PROG.w + 10, 212, OP_LAP.x - 14, 212, lap, P.teal, 8);
    out += G(ART.place(ART.figure("laptop"), OP_LAP.x, OP_LAP.y, OP_LAP.w, OP_LAP.h), { opacity: 0.35 + 0.65 * lap });
    /* the cat, running on the screen */
    out += G(Em(OP_LAP.x + 152, OP_LAP.y + 96, 46, OP_CAT), { opacity: lap });
    out += MK.pill(OP_LAP.x + OP_LAP.w / 2, OP_LAP.y + OP_LAP.h + 34, "the computer runs it", lap, { size: 22, col: P.teal, ink: P.teal });
    return out;
  }

  function opObjectsChapter(scene, beat, t, i) {
    return opHalves(scene, t, 4, opObjectsMain, opObjectsProgram);
  }

  /* ==== shared ground for the later chapters =====================================
     "plans", "build", "repeats" and "which" each draw their OWN stage box, at
     their own height, rather than the fixed 190 px one above - so a square,
     a prop and a sprite here all take the box's (top, height) and work out
     their own floor and size from it, instead of the "objects" chapter's
     fixed OP_SQ and opObjSprite. Every run below is ART.run, worked out once
     at load beside OP_CAT_RUN and OP_DOG_RUN above, for the same reason: the
     film cannot disagree with the lesson about where a block ends up. */

  function opGround(top, h) { return top + h - Math.max(44, h * 0.22); }

  /* one square of a stage box THIS height. Fixed by the film's own two
     hand-placed props: the tree stands 2.5 squares from where the cat starts
     in both "plans" and "build" (see PL_TREE, BU_TREE), which is the ratio
     below - independent of a box's own width or the "objects" chapter's
     fixed 62 px square. */
  function opSQ(h) { return h * 0.3645; }

  /* the stage box a chapter walks or jumps an object on: the same card and
     floor band as opStageBox, plus opt.squares faint tiles on the floor,
     centred on opt.cx. The grid is background only - the counting arcs and
     path markers a chapter draws on top are its own. opt: {squares, cx} */
  function opStage(x, y, w, h, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var sq = opSQ(h), n = opt.squares || 0, cx = opt.cx == null ? x + w / 2 : opt.cx;
    var gy = opGround(y, h), fh = y + h - gy;
    var out = R(x, y, w, h, 20, P.card, P.line, 2.5) +
      R(x + 5, gy, w - 10, y + h - gy - 5, 14, P.cell) +
      L(x + 5, gy, x + w - 5, gy, P.line, 3);
    for (var k = 0; k < n; k++) {
      var tx = cx + (k - (n - 1) / 2) * sq;
      out += R(tx - sq * 0.42, gy + fh * 0.18, sq * 0.84, fh * 0.64, 10, "none", P.line, 2,
        { "stroke-dasharray": "7 6", opacity: 0.5 });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a still prop (the tree) standing on the same floor a stage box draws.
     opt: {scale, dy} */
  function opProp(cx, y, h, glyph, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var gy = opGround(y, h), size = h * 0.34 * (opt.scale == null ? 1 : opt.scale);
    return G(Em(cx, gy - size * 0.46 + (opt.dy || 0), size, glyph), { opacity: clamp(o, 0, 1) });
  }

  /* a state part-way between two of the lesson's own end states (an opRun's
     after[], OP_HOME, or another tween), for an object that is walking
     rather than standing still at one of them */
  function opTween(a, b, u) {
    u = clamp(u, 0, 1);
    a = a || OP_HOME; b = b || OP_HOME;
    return {
      x: lerp(a.x || 0, b.x || 0, u),
      scale: lerp(a.scale == null ? 1 : a.scale, b.scale == null ? 1 : b.scale, u),
      spin: lerp(a.spin || 0, b.spin || 0, u),
      hidden: u < 0.5 ? a.hidden : b.hidden
    };
  }

  /* a sprite on ANY stage box (cx, top, h): st is one of the lesson's own
     end states, hop lifts it for a jump, and spin turns it on top of
     whatever st.spin already carries (a tween never carries a full turn, so
     the two never fight). */
  function opSprite(cx, top, h, st, glyph, o, hop, spin) {
    if (!(o > 0)) return "";
    st = st || OP_HOME;
    var gy = opGround(top, h), size = h * 0.34, sq = opSQ(h);
    var x = cx + (st.x || 0) * sq, y = gy - size * 0.46 - (hop || 0);
    var s = st.scale == null ? 1 : st.scale, rot = (st.spin || 0) + (spin || 0);
    return G(Em(0, 0, size, glyph), {
      transform: "translate(" + n2(x) + "," + n2(y) + ") rotate(" + n2(rot) + ") scale(" + n3(s) + ")",
      opacity: (st.hidden ? 0.15 : 1) * clamp(o, 0, 1)
    });
  }

  /* how wide one block reads at font-size fs on a row of height h - used to
     size an empty slot before its block arrives, and by opBlockRow/Col below
     so a filled block lands exactly where its slot was */
  function opBlockW(id, fs, h) {
    var b = ART.block(id);
    return h * 1.15 + (b.label ? b.label.length : 6) * fs * 0.58 + 24;
  }

  /* a row of blocks, left to right, each popping in on its own cue: at is
     ONE cue, staggered per block, or an ARRAY naming each block's own cue -
     or, at === undefined, "always on" (a row already established earlier
     and simply carried into this half, the way opBlockCol's does).
     opt: {fs} */
  function opBlockRow(x, y, h, ids, t, at, opt) {
    opt = opt || {};
    var fs = opt.fs || 22, out = "", bx = x, always = at === undefined;
    ids.forEach(function (id, k) {
      var w = opBlockW(id, fs, h);
      var cueK = Array.isArray(at) ? at[k] : opAfter(at, k * 0.32);
      var p = always ? 1 : popIn(t, cueK, 0.35);
      if (p > 0) out += opBlock(bx, y, w, h, id, { pop: always ? 1 : p, fs: fs });
      bx += w + 12;
    });
    return out;
  }

  /* the same, top to bottom - one object's whole script in its panel. at ===
     undefined means "always on" (the "which" chapter's three panels, shown
     together from the start, not revealed). opt: {fs, gap, ring (the index
     of the one block to highlight, or -1 for none)} */
  function opBlockCol(x, y, h, ids, t, at, opt) {
    opt = opt || {};
    var fs = opt.fs || 22, gap = opt.gap == null ? 10 : opt.gap, out = "", by = y, always = at === undefined;
    ids.forEach(function (id, k) {
      var w = opBlockW(id, fs, h) + 40;
      var cueK = Array.isArray(at) ? at[k] : opAfter(at, k * 0.3);
      var p = always ? 1 : popIn(t, cueK, 0.35);
      if (p > 0) out += opBlock(x, by, w, h, id, { pop: always ? 1 : p, fs: fs, lit: opt.ring != null && k === opt.ring });
      by += h + gap;
    });
    return out;
  }

  /* a titled panel that holds one object's whole script - opTray's shape,
     bigger, and coloured by opt.ring (a colour, not an index: "build"'s and
     "which"'s own gold-while-working/green-when-checked/red-for-the-bug) */
  function opPanel(x, y, w, h, glyph, title, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var col = opt.ring || P.line;
    return G(R(x, y, w, h, 20, P.card, col, opt.ring ? 4 : 2) +
      Em(x + 34, y + 34, 36, glyph) +
      Tx(x + 62, y + 44, title, "lab", "start", { fill: opt.ring || P.muted }) +
      L(x + 16, y + 62, x + w - 16, y + 62, P.line, 2),
      { opacity: clamp(o, 0, 1) });
  }

  /* the Run button every "build one" panel presses - press (0..1, a bump())
     squashes it a little on the tap, which MK.ripple then marks beside it */
  function opRunBtn(x, y, w, h, o, press) {
    if (!(o > 0)) return "";
    press = press || 0;
    var s = 1 - 0.07 * press, fs = Math.min(22, h * 0.42);
    var body = R(x, y, w, h, h / 2, press > 0.3 ? P.good : P.teal) +
      Pth("M" + n2(x + h * 0.34) + "," + n2(y + h * 0.28) + " L" + n2(x + h * 0.34) + "," + n2(y + h * 0.72) +
        " L" + n2(x + h * 0.68) + "," + n2(y + h * 0.5) + " Z", "#fff") +
      Tx(x + h * 0.86, y + h / 2 + fs * 0.35, "Run", "lab", "start", { fill: "#fff", "font-size": fs });
    return G(body, { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, s) });
  }

  /* ---- the states "repeats" and "which" compare or reuse -----------------
     Each is the lesson's own ART.run, worked out once, exactly like
     OP_CAT_RUN and OP_DOG_RUN above - never a copy of its arithmetic. */
  var OP_FILL = OP_COL;
  var OP_HOME = OP_REST;
  var OP_R1 = opRun(OP_CAT, ["right"]).after[0];
  var OP_R2 = OP_CAT_RUN.after[1];
  var OP_LEFT_RUN = opRun(OP_DOG, ["left", "left", "left"]);
  var OP_LEFT = [OP_HOME].concat(OP_LEFT_RUN.after);     /* OP_LEFT[n]: after n lefts */
  var OP_REPEAT3_RUN = opRun(OP_DOG, ["repeat3", "left"]);
  var OP_REPEAT3 = OP_REPEAT3_RUN.after[OP_REPEAT3_RUN.after.length - 1];
