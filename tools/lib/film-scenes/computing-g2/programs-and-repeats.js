  /* ==== Grade 2 Computing, Lesson 3: Programs and Repeats =====================
     tools/lib/film-scenes/computing-g2/programs-and-repeats.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/programs-and-repeats.json.

     EVERY NUMBER THE VOICE SAYS COMES FROM THE KIT. "three jumps from two
     blocks", "put it after and nothing is repeated", "two moves against three"
     are ART.program.expand and ART.run, worked out once at the top of this
     file and checked there: if the lesson's repeat block ever stops making
     three jumps, the film refuses to load rather than draw a number the voice
     does not say. Nothing here counts a repeat for itself.

     The sprite stage is DRAWN here rather than lifted: the lesson's is HTML and
     computing.css is not in the film (ART.foreign would render it as a bare
     emoji). Only where the cat ENDS UP is the kit's.

     This file: the palette, the block chips, the ground and the cat, the title
     motif, and the chapter "The plan and the program". Every top-level name
     starts with pr, so nothing here can replace a name of the engine, ART or
     MK. */

  var HUE = {
    title: P.teal, plan: P.gold, build: P.blue, repeat: P.plum,
    same: P.accent, test: P.good, scratchjr: P.gold, recap: P.teal
  };

  /* ---- what the lesson's own blocks do ---------------------------------- */

  var PR_CAT = "\u{1F431}";
  function prRunTo(ids, n) { return ART.run(PR_CAT, ids.slice(0, n))[0]; }

  var PR_REPEAT_JUMP = ART.program.expand(["repeat3", "jump"]);      /* jump, jump, jump */
  var PR_AFTER_JUMP = ART.program.expand(["jump", "repeat3"]);       /* jump */
  var PR_BUILD = ART.program.expand(["jump", "jump", "left"]);       /* the lesson's round 1 */
  var PR_BUILD_AT = PR_BUILD.map(function (_, k) { return prRunTo(PR_BUILD, k + 1); });
  var PR_R2_END = ART.run(PR_CAT, ["repeat2", "right"])[0];          /* two moves */
  var PR_R3_END = ART.run(PR_CAT, ["right", "right", "right"])[0];   /* three moves */

  (function () {
    var bad = [], last = PR_BUILD_AT[PR_BUILD.length - 1];
    if (PR_REPEAT_JUMP.length !== 3) bad.push("repeat 3 times, jump makes " + PR_REPEAT_JUMP.length + " jumps and the film says three");
    if (PR_AFTER_JUMP.length !== 1) bad.push("jump then repeat 3 times makes " + PR_AFTER_JUMP.length + " moves and the film says one");
    if (!ART.program.same(["repeat3", "jump"], ["jump", "jump", "jump"])) bad.push("the kit no longer calls those two programs the same");
    if (ART.program.same(["repeat2", "right"], ["right", "right", "right"])) bad.push("the kit now calls two moves and three moves the same");
    if (PR_R2_END.x !== 2 || PR_R3_END.x !== 3) bad.push("two moves right ends at " + PR_R2_END.x + " and three at " + PR_R3_END.x);
    if (!last || last.x !== -1) bad.push("jump, jump, move left ends at " + (last && last.x) + " and the film draws -1");
    if (bad.length) throw new Error("Programs and Repeats: " + bad.join("; "));
  })();

  /* ---- timing ------------------------------------------------------------ */

  /* has this cue been reached? (a cue the beat never names is never reached) */
  function prPast(t, at) { return at != null && t >= at; }

  /* ---- the lesson's blocks, drawn ---------------------------------------- */

  var PR_COL = { move: P.blue, look: P.plum, control: P.gold };
  function prIcon(id) { return ART.block(id).icon; }

  /* One block: the kit's own label, the kit's own icon, its category's colour.
     opt: {o, col, fill, lit, size} */
  function prBlock(x, y, w, h, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var b = ART.block(id), col = opt.col || PR_COL[b.cat] || P.line;
    var ic = h * 0.50, pad = h * 0.22;
    var room = Math.max(40, w - pad * 2 - ic - 14);
    var fs = Math.min(opt.size || 26, room / Math.max(1, b.label.length * 0.53));
    return G(R(x, y, w, h, h * 0.30, opt.fill || P.cell, col, opt.lit ? 4.5 : 2.5) +
      Em(x + pad + ic / 2, y + h / 2, ic, b.icon) +
      Tx(x + pad + ic + 12, y + h / 2 + fs * 0.35, b.label, "lab", "start", { "font-size": fs }),
      { opacity: Math.min(1, o), transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)) });
  }

  /* a block with no words on it: one instruction, when the picture is about how
     MANY there are rather than which ones (the testing chapter) */
  function prChipSmall(x, y, w, h, o, col, fill) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.28, fill || P.cell, col || P.line, 2.5) +
      L(x + w * 0.24, y + h * 0.40, x + w * 0.76, y + h * 0.40, col || P.line, 4) +
      L(x + w * 0.24, y + h * 0.64, x + w * 0.58, y + h * 0.64, col || P.line, 4),
      { opacity: Math.min(1, o), transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)) });
  }

  /* an empty place in a program, before its block is put there */
  function prSlot(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, h * 0.30, P.card, P.line, 2, { "stroke-dasharray": "10 8", opacity: Math.min(1, o) });
  }

  function prNum(cx, cy, r, n, col, o) {
    if (!(o > 0)) return "";
    return G(C(cx, cy, r, P.card, col || P.line, 2) +
      Tx(cx, cy + r * 0.36, String(n), "lab", "middle", { fill: col || P.muted, "font-size": r * 1.05 }),
      { opacity: Math.min(1, o) });
  }

  /* the Run button the lesson's child presses */
  function prRunBtn(cx, cy, w, o, pressed) {
    if (!(o > 0)) return "";
    var h = w * 0.42;
    return G(R(cx - w / 2, cy - h / 2, w, h, h / 2, pressed ? P.good : P.cell, P.good, 3) +
      Pth("M" + n2(cx - w * 0.20) + "," + n2(cy - h * 0.24) + " L" + n2(cx - w * 0.20) + "," + n2(cy + h * 0.24) +
        " L" + n2(cx - w * 0.02) + "," + n2(cy) + " Z", pressed ? P.ground : P.good) +
      Tx(cx + w * 0.16, cy + h * 0.18, "Run", "lab", "middle", { fill: pressed ? P.ground : P.good, "font-size": h * 0.52 }),
      { opacity: Math.min(1, o), transform: around(cx, cy, pressed ? 0.94 : 1) });
  }

  /* ---- the stage the cat stands on --------------------------------------- */

  /* Seven squares, -3 to 3, the lesson's own range: move right stops at three. */
  function prGround(cx, y, pitch, o, n) {
    if (!(o > 0)) return "";
    n = n || 7;
    var half = (n - 1) / 2, out = "";
    for (var k = -half; k <= half; k++)
      out += R(cx + k * pitch - pitch / 2 + 3, y, pitch - 6, pitch * 0.30, 6,
        k === 0 ? P.cell : P.card, P.line, 2);
    return G(out, { opacity: Math.min(1, o) });
  }
  /* the cat, at the square the KIT says it is on, lifted if it is mid-jump */
  function prCat(cx, y, pitch, st, up, size, o) {
    if (!(o > 0)) return "";
    var x = cx + (st ? st.x : 0) * pitch, s = st && st.scale ? st.scale : 1;
    return G(Em(x, y - size * 0.52 - (up || 0) * size * 0.85, size * s, PR_CAT), { opacity: Math.min(1, o) });
  }

  /* ==== the title ==============================================================
     Three jump blocks, an equals sign, and the repeat block with one jump under
     it: the whole lesson in one picture. In the spoken title chapter the three
     arrive as they are said, then the repeat block and its jump, then the
     equals. On the two cards it stands still. */

  function prTileChip(x, y, s, icon, o, col, badge) {
    if (!(o > 0)) return "";
    return G(R(x, y, s, s, s * 0.24, P.cell, col || P.line, 3) +
      Em(x + s / 2, y + s * 0.52, s * 0.50, icon) +
      (badge ? Tx(x + s - 12, y + s - 12, badge, "lab", "end", { fill: col || P.ink, "font-size": s * 0.30 }) : ""),
      { transform: around(x + s / 2, y + s / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cJumps = sn ? sc(sn, 0, "jumps") : null, cBlocks = sn ? sc(sn, 0, "blocks") : null;
    var cRepeat = sn ? sc(sn, 1, "repeat") : null, cSay = sn ? sc(sn, 1, "say") : null,
      cTwo = sn ? sc(sn, 1, "two") : null;
    var shown = sn ? tally(t, cJumps, 3, 0.85) : 3;
    var lab1 = sn ? on(t, cBlocks, 0.5) : 1, lab2 = sn ? on(t, cTwo, 0.5) : 1;
    var pR = sn ? popIn(t, cRepeat, 0.4) : 1, pJ = sn ? popIn(t, cSay, 0.4) : 1;
    var eq = sn ? popIn(t, cTwo == null ? null : cTwo + 0.2, 0.45) : 1;

    out += R(8, 18, 344, 312, 30, P.card, P.line, 3);
    out += Tx(180, 58, "3 blocks", "lab mid muted", "middle", { opacity: lab1 });
    for (var k = 0; k < 3; k++)
      out += prTileChip(60 + k * 84, 72, 72, prIcon("jump"), k < shown ? 1 : 0, P.blue);
    out += Tx(180, 202, "=", "lab huge gold", "middle", { opacity: Math.min(1, eq) });
    out += Tx(180, 236, "2 blocks", "lab mid muted", "middle", { opacity: lab2 });
    out += prTileChip(102, 248, 72, prIcon("repeat3"), pR, P.gold, "3");
    out += prTileChip(186, 248, 72, prIcon("jump"), pJ, P.blue);
    return '<svg viewBox="0 0 360 360" role="img" ' +
      'aria-label="Three jump blocks, and the same thing as a repeat block with one jump">' + out + "</svg>";
  }

  /* ==== chapter: the plan and the program ======================================
     The algorithm on the left in the lesson's own words, the program on the
     right in the lesson's own blocks, and a computer at the end that can run
     it. The words and the blocks are the SAME three steps, arriving in the
     same order on both sides. */

  var PR_ALG = ["right", "jump", "say"];
  var PR_A = { x: 24, y: 48, w: 420, h: 312 };
  var PR_B = { x: 506, y: 48, w: 376, h: 312 };
  var PR_ROW = [126, 202, 278], PR_RH = 62;
  var PR_LAP = { x: 906, y: 132, w: 238, h: 177 };

  function prCardBox(b, icon, title, o) {
    if (!(o > 0)) return "";
    return G(R(b.x, b.y, b.w, b.h, 24, P.card, P.line, 3) +
      Em(b.x + 42, b.y + 42, 34, icon) +
      Tx(b.x + 72, b.y + 52, title, "lab big", "start"),
      { opacity: Math.min(1, o), transform: around(b.x + b.w / 2, b.y + b.h / 2, Math.min(1.03, o)) });
  }

  function prPlanChapter(scene, beat, t, i) {
    var cAlgo = sc(scene, 0, "algorithm"), cSteps = sc(scene, 0, "steps");
    var wordAt = [sc(scene, 1, "right"), sc(scene, 1, "jump"), sc(scene, 1, "hello")];
    var cWords = sc(scene, 1, "words");
    var cProg = sc(scene, 2, "program"), cBlocks = sc(scene, 2, "blocks");
    var chipAt = [sc(scene, 3, "one"), sc(scene, 3, "two"), sc(scene, 3, "three")];
    var cRun = sc(scene, 4, "run"), cHow = sc(scene, 4, "how");
    var out = "";

    /* the algorithm: three empty lines, then the words, one at a time */
    out += prCardBox(PR_A, "\u{1F4CB}", "Algorithm", popIn(t, cAlgo, 0.45));
    var slots = tally(t, cSteps, 3, 0.7);
    PR_ALG.forEach(function (id, k) {
      var y = PR_ROW[k], o = on(t, wordAt[k], 0.42);
      if (o < 1 && k < slots)
        out += prSlot(PR_A.x + 22, y, PR_A.w - 44, PR_RH, on(t, cSteps, 0.4) * (1 - o));
      if (o <= 0) return;
      out += G(prNum(PR_A.x + 54, y + PR_RH / 2, 22, k + 1, P.gold, 1) +
        Tx(PR_A.x + 96, y + PR_RH / 2 + 11, ART.block(id).label, "lab big", "start"),
        { opacity: o, transform: "translate(" + n2((1 - o) * 14) + ",0)" });
      out += MK.ripple(PR_A.x + 54, y + PR_RH / 2, t, wordAt[k], P.gold);
    });
    out += MK.pill(PR_A.x + PR_A.w / 2, 398, "in words", on(t, cWords, 0.45),
      { size: 24, col: P.gold, ink: P.gold });

    /* the program: the same three steps, as the lesson's blocks */
    out += MK.arrow(452, 204, 496, 204, on(t, cBlocks, 0.55), P.gold, 8);
    out += prCardBox(PR_B, "\u{1F9E9}", "Program", popIn(t, cProg, 0.45));
    var lit = tally(t, cHow, 3, 1.05);
    PR_ALG.forEach(function (id, k) {
      var p = popIn(t, chipAt[k], 0.42);
      if (!(p > 0)) return;
      out += prBlock(PR_B.x + 22, PR_ROW[k], PR_B.w - 44, PR_RH, id,
        { o: p, lit: lit === k + 1, col: lit === k + 1 ? P.gold : null });
      if (lit === k + 1) out += MK.ripple(PR_B.x + 40, PR_ROW[k] + PR_RH / 2, t, cHow, P.gold);
    });
    out += MK.pill(PR_B.x + PR_B.w / 2, 398, "in blocks", on(t, cBlocks, 0.45),
      { size: 24, col: P.blue, ink: P.blue });

    /* and the computer that can run it */
    var lap = popIn(t, cRun, 0.5);
    if (lap > 0) {
      var fig = ART.figure("laptop");
      if (prPast(t, cHow)) fig = ART.ring(fig, "screen", P.teal, 6);
      out += MK.glow(PR_LAP.x + PR_LAP.w / 2, PR_LAP.y + PR_LAP.h / 2, 136, P.teal, Math.min(1, lap) * 0.9);
      out += G(ART.place(fig, PR_LAP.x, PR_LAP.y, PR_LAP.w, PR_LAP.h),
        { opacity: Math.min(1, lap), transform: around(PR_LAP.x + PR_LAP.w / 2, PR_LAP.y + PR_LAP.h / 2, Math.min(1.06, lap)) });
      out += MK.tick(PR_LAP.x + PR_LAP.w / 2, 350, 26, popIn(t, cHow == null ? null : cHow + 1.15, 0.4));
    }
    return svg(out);
  }
