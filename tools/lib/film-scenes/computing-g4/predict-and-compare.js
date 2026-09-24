  /* ==== Grade 4 Computing, Lesson 2: Predict and Compare ======================
     tools/lib/film-scenes/computing-g4/predict-and-compare.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/predict-and-compare.json.

     Computing has no ART.sim, so this film DRAWS Robo's grid, the algorithm
     lists and the route cards itself and BORROWS the rules:
       ART.algo.expandLoop  unrolls "repeat n times" into the moves made
       ART.robo             DIRS, TURN_L, TURN_R, ANGLE: where a walk ends
       ART.algo.best        which route wins on fewest steps and on time
     so where Robo lands and which card lights cannot disagree with the lesson.
     Every route, every fact and every pancake step is the lesson's own
     (content/lesson-2.py); the grid's colours are the kit's robotGrid colours.

     This file: the palette, the drawings every chapter shares (the grid, a
     command row, a loop box, a tile), the title motif and the chapter "Unroll
     the loop". Every top-level name here starts with pc, so nothing can
     replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, unroll: P.gold, stairs: P.blue, fold: P.accent,
    compare: P.plum, purpose: P.good, shorter: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function pcOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function pcFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function pcPast(t, at) { return at != null && t >= at; }

  /* ---- Robo on the grid, with the kit's own rules ------------------------------
     The kit's robotGrid draws inside a closure that needs the lesson page, so
     the grid is drawn here - in the kit's own colours - and only the RULES are
     borrowed. A walk is worked out once, at load, never inside a draw. */

  var PC_CELL = 70, PC_GX = 700, PC_GY = 45;
  function pcCX(c) { return PC_GX + c * PC_CELL + PC_CELL / 2; }
  function pcCY(r) { return PC_GY + r * PC_CELL + PC_CELL / 2; }

  /* every square Robo stands on, and which way it faces, one entry per command */
  function pcWalk(start, facing, cmds) {
    var c = start[0], r = start[1], f = facing, out = [{ c: c, r: r, f: f }];
    cmds.forEach(function (cmd) {
      if (cmd === "F" || cmd === "B") {
        var d = ART.robo.DIRS[f], k = cmd === "F" ? 1 : -1;
        c += d[0] * k; r += d[1] * k;
      } else if (cmd === "L") f = ART.robo.TURN_L[f];
      else if (cmd === "R") f = ART.robo.TURN_R[f];
      out.push({ c: c, r: r, f: f });
    });
    return out;
  }
  /* the same walk as ONE turning angle that never jumps the long way round */
  function pcAngles(path) {
    var out = [ART.robo.ANGLE[path[0].f]];
    for (var k = 1; k < path.length; k++) {
      var want = ART.robo.ANGLE[path[k].f], have = out[k - 1];
      out.push(have + (((want - have) % 360) + 540) % 360 - 180);
    }
    return out;
  }
  /* where Robo is when u (0..1) of the walk has been done */
  function pcAt(path, ang, u) {
    var n = path.length - 1, s = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(s)), v = ease(s - i);
    if (n <= 0) return { x: pcCX(path[0].c), y: pcCY(path[0].r), a: ang[0] };
    return { x: lerp(pcCX(path[i].c), pcCX(path[i + 1].c), v),
      y: lerp(pcCY(path[i].r), pcCY(path[i + 1].r), v),
      a: lerp(ang[i], ang[i + 1], v) };
  }

  /* the kit's robotGrid colours, at this film's size */
  function pcGrid(o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var out = "";
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
      var lit = opt.lit && opt.lit[0] === c && opt.lit[1] === r && opt.litO > 0;
      out += R(PC_GX + c * PC_CELL, PC_GY + r * PC_CELL, PC_CELL, PC_CELL, 10,
        (r + c) % 2 ? "#17384F" : "#1B3A52", "#2B5673", 2);
      if (lit) out += R(PC_GX + c * PC_CELL, PC_GY + r * PC_CELL, PC_CELL, PC_CELL, 10,
        "#F4C95D", null, null, { opacity: 0.5 * clamp(opt.litO, 0, 1) });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* the kit's own Robo: a teal pool, a gold nose the way it faces, and the robot */
  function pcRobo(x, y, a, o) {
    if (!(o > 0)) return "";
    return G(C(0, 0, 30, P.teal, null, null, { opacity: 0.35 }) +
      G('<polygon points="0,-37.5 11.2,-20 -11.2,-20" fill="' + P.gold + '"/>', { transform: "rotate(" + n2(a) + ")" }) +
      Em(0, 14, 38, "\u{1F916}"),
      { transform: tr(x, y), opacity: clamp(o, 0, 1) });
  }
  /* What Robo is walking towards, in the top corner of its own square rather
     than the middle of it: Robo ends the walk standing there, and a centred
     target is completely hidden under it just as the voice names it. */
  function pcTarget(c, r, picture, o) {
    if (!(o > 0)) return "";
    return G(Em(pcCX(c) + 17, pcCY(r) - 17, 34, picture), { opacity: clamp(o, 0, 1) });
  }

  /* ---- the algorithm lists -----------------------------------------------------
     One row is an instruction: its icon and its words, in a rounded box. The
     icons are the kit's own (ART.robo.CMD for Robo, the lesson's step emoji
     for the pancakes). */

  function pcRow(x, y, w, h, icon, label, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.line, sw = opt.col ? 3.5 : 2, fs = Math.max(19, Math.min(23, h * 0.46));
    return G(R(x, y, w, h, h * 0.30, opt.fill || P.cell, col, sw) +
      Em(x + h * 0.62, y + h / 2, h * 0.56, icon) +
      Tx(x + h * 1.15, y + h / 2 + fs * 0.35, label, "lab", "start",
        { "font-size": fs, fill: opt.ink || P.ink }),
      { opacity: clamp(o, 0, 1) * (opt.dimmed ? 0.4 : 1) });
  }

  /* A repeat box: the gold header that says how many times, a gold spine down
     its left side, and the body rows inside it. rows are [icon, label]. */
  function pcLoopBox(x, y, w, rows, times, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var hh = opt.headH || 44, rh = opt.rowH || 46, gap = 8, pad = 12;
    var bodyH = rows.length * rh + (rows.length - 1) * gap;
    var boxH = hh + pad + bodyH + pad;
    var fo = opt.frameO == null ? 1 : clamp(opt.frameO, 0, 1);
    var out = G(R(x, y, w, boxH, 18, "rgba(244,201,93,0.07)", P.gold, 3) +
      R(x, y, w, hh, 18, P.gold, null, null, { opacity: 0.18 }) +
      Em(x + 26, y + hh / 2, 26, "\u{1F501}") +
      Tx(x + 46, y + hh / 2 + 8, "repeat " + times + " times", "lab", "start", { "font-size": 24, fill: P.gold }) +
      R(x + 14, y + hh + pad, 5, bodyH, 3, P.gold, null, null, { opacity: 0.55 }), { opacity: fo });
    rows.forEach(function (row, k) {
      var ro = opt.rowO ? opt.rowO(k) : 1;
      var lit = typeof opt.lit === "function" ? opt.lit(k) : opt.lit === k;
      out += pcRow(x + 30, y + hh + pad + k * (rh + gap), w - 46, rh, row[0], row[1],
        { o: ro, col: lit ? P.gold : null, fill: lit ? "#2A3E4A" : null });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  function pcLoopBoxH(rows, opt) {
    opt = opt || {};
    return (opt.headH || 44) + 12 + rows.length * (opt.rowH || 46) + (rows.length - 1) * 8 + 12;
  }

  /* a square tile with one instruction icon in it, for an unrolled program */
  function pcTile(x, y, s, icon, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, s, s, s * 0.22, P.cell, col || P.line, 3) + Em(x + s / 2, y + s / 2, s * 0.52, icon),
      { transform: around(x + s / 2, y + s / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }
  /* a dashed empty tile: a slot waiting to be filled */
  function pcSlot(x, y, s, o) {
    if (!(o > 0)) return "";
    return R(x, y, s, s, s * 0.22, P.card, P.line, 2, { "stroke-dasharray": "9 7", opacity: clamp(o, 0, 1) });
  }

  /* ---- the two looped programs, walked once, at load -------------------------
     The bodies and the counts are the lesson's own levels; the unrolling is
     ART.algo.expandLoop and the walking is ART.robo, so nothing here is a
     second copy of a rule. */
  var PC_F = ART.robo.CMD.F.icon, PC_L = ART.robo.CMD.L.icon, PC_R = ART.robo.CMD.R.icon;

  var PC_ONE_CMDS = ART.algo.expandLoop([], ["F", "F"], 2, []);       /* Loop 1 */
  var PC_ONE = pcWalk([0, 4], "up", PC_ONE_CMDS);
  var PC_ONE_A = pcAngles(PC_ONE);
  var PC_TWO_CMDS = ART.algo.expandLoop([], ["F", "R", "F", "L"], 3, []);   /* Loop 2 */
  var PC_TWO = pcWalk([0, 4], "up", PC_TWO_CMDS);
  var PC_TWO_A = pcAngles(PC_TWO);

  /* ==== the title =================================================================
     The whole lesson in one picture: a repeat box with two forwards, an arrow
     to the square Robo will stop on, and under it the three ways to school
     with a tick on one. In the spoken title chapter each piece arrives as it
     is named; on the two cards it simply stands. */
  var PC_WAYS = [{ pic: "\u{1F333}", col: P.line }, { pic: "\u{1F68C}", col: P.good }, { pic: "\u{1F6E3}️", col: P.line }];

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cRep = sn ? sc(sn, 0, "repeat") : null, cFwd = sn ? sc(sn, 0, "fwd") : null,
      cWhere = sn ? sc(sn, 0, "where") : null, cWork = sn ? sc(sn, 1, "work") : null,
      cGo = sn ? sc(sn, 1, "go") : null, cCmp = sn ? sc(sn, 1, "compare") : null;
    var box = sn ? popIn(t, cRep, 0.42) : 1, tiles = sn ? popIn(t, cFwd, 0.42) : 1;
    var q = sn ? popIn(t, cWhere, 0.42) : 1, line = sn ? on(t, cWork, 0.55) : 1;
    var done = sn ? popIn(t, cGo, 0.42) : 1, ways = sn ? popIn(t, cCmp, 0.5) : 1;

    out += R(8, 14, 344, 332, 30, P.card, P.line, 3);
    /* the loop, and the two forwards in it */
    out += G(R(28, 34, 180, 116, 18, "rgba(244,201,93,0.10)", P.gold, 3) +
      Tx(118, 62, "repeat 2", "lab", "middle", { "font-size": 23, fill: P.gold }),
      { transform: around(118, 92, Math.min(1.06, box)), opacity: Math.min(1, box) });
    out += pcTile(44, 78, 58, PC_F, tiles, P.gold);
    out += pcTile(122, 78, 58, PC_F, tiles, P.gold);
    /* the square it lands on: a question, then a tick */
    out += MK.arrow(214, 92, 258, 92, line, P.gold, 7);
    out += G(R(268, 56, 68, 68, 12, "#1B3A52", "#2B5673", 3), { opacity: Math.min(1, q) });
    out += G(Tx(302, 102, "?", "lab", "middle", { "font-size": 44, fill: P.muted }),
      { opacity: Math.min(1, q) * (1 - Math.min(1, done)) });
    out += MK.tick(302, 90, 26, done);
    /* and the three ways to school, with the best one for this purpose ticked */
    out += G(L(28, 176, 332, 176, P.line, 2), { opacity: Math.min(1, ways) });
    PC_WAYS.forEach(function (w, k) {
      var x = 32 + k * 100;
      out += G(R(x, 196, 90, 132, 18, P.cell, w.col, 3) + Em(x + 45, 250, 50, w.pic),
        { transform: around(x + 45, 262, Math.min(1.06, ways)), opacity: Math.min(1, ways) });
    });
    out += MK.tick(216, 208, 21, sn ? popIn(t, cCmp == null ? null : cCmp + 0.5, 0.4) : 1);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A repeat loop of two forwards, the square Robo lands on, and three ways to school">' + out + "</svg>";
  }

  /* ==== chapter: unroll the loop ==================================================
     Loop 1 from the lesson: Robo at the bottom of the 5 x 5 grid facing up, the
     flower four squares above it, and "repeat 2 times: forward, forward". The
     loop box fills on the left, unrolls into four forward tiles, the child's
     square is tapped, and only then does Robo run - so the prediction is made
     before Go, as the lesson asks. */
  var PC_U_BOX = { x: 56, y: 66, w: 420 };
  var PC_U_ROWS = [[PC_F, "Forward"], [PC_F, "Forward"]];
  var PC_U_STRIP = { y: 306, s: 74, gap: 14, x: 66 };

  function pcUnrollChapter(scene, beat, t, i) {
    var cRobo = sc(scene, 0, "robo"), cFacing = sc(scene, 0, "facing"),
      cFlower = sc(scene, 0, "flower"), cFour = sc(scene, 0, "four");
    var cProgram = sc(scene, 1, "program"), cRepeat = sc(scene, 1, "repeat"), cBody = sc(scene, 1, "body");
    var cPredict = sc(scene, 2, "predict"), cUnroll = sc(scene, 2, "unroll");
    var cTwice = sc(scene, 3, "twice"), cUnrolls = sc(scene, 3, "unrolls");
    var cTap = sc(scene, 4, "tap"), cGo = sc(scene, 4, "go"), cLands = sc(scene, 4, "lands");
    var out = "";

    /* the grid, with the square the child taps lit from the tap cue on */
    out += pcGrid(on(t, cRobo, 0.5), { lit: [0, 0], litO: on(t, cTap, 0.4) });
    out += pcTarget(0, 0, "\u{1F338}", on(t, cFlower, 0.45));

    /* four squares away: a dashed measure up the first column */
    var meas = on(t, cFour, 0.5) * (1 - on(t, cGo, 0.4));
    if (meas > 0) {
      out += L(pcCX(0), pcCY(4) - 34, pcCX(0), pcCY(0) + 30, P.gold, 4,
        { "stroke-dasharray": "10 9", opacity: 0.85 * meas });
      out += MK.pill(694, pcCY(2) - 4, "4 squares", meas, { size: 21, anchor: "end", col: P.gold, ink: P.gold });
    }

    /* Robo: still until Go is pressed, then the whole unrolled walk */
    var walk = on(t, cGo, 1.25);
    var at = pcAt(PC_ONE, PC_ONE_A, walk);
    out += pcRobo(at.x, at.y, at.a, on(t, cRobo, 0.5));
    /* which way it faces */
    var face = bump(t, cFacing, 1.6);
    if (face > 0) out += C(pcCX(0), pcCY(4), 44 + 4 * breathe(t), "none", P.gold, 5, { opacity: 0.85 * face });

    /* the program, as the lesson writes it: a repeat box with two forwards */
    out += MK.pill(PC_U_BOX.x + 4, 40, "Loop 1", on(t, cProgram, 0.45), { size: 22, anchor: "start", col: P.line, ink: P.muted });
    out += pcLoopBox(PC_U_BOX.x, PC_U_BOX.y, PC_U_BOX.w, PC_U_ROWS, 2, {
      o: on(t, cRepeat, 0.45),
      rowO: function (k) { return k < tally(t, cBody, 2, 0.7) ? 1 : 0; }
    });
    /* the loop flashes as the body is done twice in your head */
    var tw = bump(t, cTwice, 1.5);
    if (tw > 0) out += R(PC_U_BOX.x - 5, PC_U_BOX.y - 5, PC_U_BOX.w + 10, pcLoopBoxH(PC_U_ROWS) + 10, 22, "none", P.gold, 4, { opacity: tw });

    /* unrolled: four slots, then four forwards in them */
    var slots = on(t, cUnroll, 0.5), filled = tally(t, cUnrolls, 4, 0.9);
    out += MK.arrow(96, 244, 96, 288, slots, P.gold, 7);
    out += MK.pill(126, 264, "unrolled", slots, { size: 20, anchor: "start", col: P.line, ink: P.muted });
    for (var k = 0; k < 4; k++) {
      var tx = PC_U_STRIP.x + k * (PC_U_STRIP.s + PC_U_STRIP.gap);
      out += pcSlot(tx, PC_U_STRIP.y, PC_U_STRIP.s, slots);
      out += pcTile(tx, PC_U_STRIP.y, PC_U_STRIP.s, PC_F, k < filled ? popIn(t, cUnrolls, 0.4) : 0, P.gold);
    }
    /* "To predict where it stops": the question the child answers, and the
       tick that answers it, in the same corner */
    out += MK.qmark(1108, 80, 28, on(t, cPredict, 0.45) * (1 - on(t, cLands, 0.45)));

    /* the tap, and then Go */
    out += MK.ripple(pcCX(0), pcCY(0), t, cTap, P.gold);
    /* Go sits in the right margin rather than under the grid: its tap ripple
       spreads 44 px, which under the grid reaches past the bottom of the box. */
    out += MK.pill(1108, 180, "Go", on(t, cTap, 0.5), { size: 24, col: pcPast(t, cGo) ? P.good : P.line, ink: pcPast(t, cGo) ? P.good : P.muted });
    out += MK.ripple(1108, 180, t, cGo, P.good);
    out += MK.tick(1108, 80, 26, popIn(t, cLands, 0.4));
    return svg(out);
  }
