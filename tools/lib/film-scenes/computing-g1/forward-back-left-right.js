  /* ==== Grade 1 Computing, Lesson 3: Forward, Back, Left, Right ================
     tools/lib/film-scenes/computing-g1/forward-back-left-right.js, with -2.js
     and -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-1-app/lecture-video/forward-back-left-right.json.

     THE GRID IS DRAWN HERE, THE RULES COME FROM THE LESSON. The Computing kit
     keeps Robo's grid inside robotGrid()'s own closure, so there is nothing to
     lift (see the adapter's header). What CAN be lifted is what Robo actually
     does, and that is what ART.robo hands over: DIRS (the four facings), TURN_L
     and TURN_R (the two turn tables), ANGLE (which way the yellow arrow points)
     and CMD (the four buttons, with the lesson's own labels and icons). fbRun
     below is the lesson's own stepping loop over those tables - a forward is
     DIRS[facing], a turn is TURN_L/TURN_R[facing], a wall or an edge sets a
     bump and the program stops there - so no route in this film can disagree
     with the route the child drives two steps later. The cells, the robot, the
     flower, the wall and the arrow are drawn to the same shapes and the same
     colours as gridSvg draws them.

     Every route in the film is one of the lesson's own or a deliberate near
     miss of it: the flower at column 3, row 2 is Level 2's, and the programs
     are Level 2's solution (F F L F F), the same five in the wrong order
     (F L F F F), Program 2 of the predictor (F F R F), the one-short version
     (F F L F) and the one-too-long version (F F F L F F).

     This file: the palette, the grid toolkit every chapter shares, the title
     motif and the chapter "Four instructions". Every top-level name here
     starts with fb, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, four: P.gold, robo: P.blue, turn: P.plum,
    program: P.accent, predict: P.good, fix: P.gold, recap: P.teal
  };

  /* the lesson's own rules, never a copy of them */
  var FB_R = ART.robo;
  var FB_FLOWER = "\u{1F338}", FB_WALL = "\u{1F9F1}", FB_BOT = "\u{1F916}";

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, back to 0 as beat k + 1 comes in:
     for a thing that belongs to that beat alone (rule 7) */
  function fbOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function fbFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the grid ---------------------------------------------------------------
     A grid is {x, y, cols, rows, cell}; a square is named by its column and its
     row, exactly as the lesson names them, with row 0 at the top. Columns and
     rows may be fractional, so a robot can be drawn part way between two. */
  function fbGrid(x, y, cols, rows, cell) { return { x: x, y: y, cols: cols, rows: rows, cell: cell }; }
  function fbX(g, c) { return g.x + (c + 0.5) * g.cell; }
  function fbY(g, r) { return g.y + (r + 0.5) * g.cell; }
  function fbW(g) { return g.cols * g.cell; }
  function fbH(g) { return g.rows * g.cell; }

  /* the lesson's own cells: a chequer of #1B3A52 and #17384F, ringed #2B5673,
     and the square being pointed at painted gold, as gridSvg paints a tap */
  function fbCells(g, o, lit) {
    if (!(o > 0)) return "";
    var out = "", r, c;
    for (r = 0; r < g.rows; r++) for (c = 0; c < g.cols; c++) {
      var here = lit && lit[0] === c && lit[1] === r;
      out += R(g.x + c * g.cell, g.y + r * g.cell, g.cell, g.cell, g.cell * 0.14,
        here ? P.gold : ((r + c) % 2 ? "#17384F" : "#1B3A52"), "#2B5673", 2);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* a soft ring round one square, for the square being talked about */
  function fbMark(g, c, r, col, o, t) {
    if (!(o > 0)) return "";
    var m = g.cell * 0.08, p = 0.75 + 0.25 * breathe(t || 0);
    return R(g.x + c * g.cell + m, g.y + r * g.cell + m, g.cell - 2 * m, g.cell - 2 * m, g.cell * 0.12,
      "none", col || P.gold, 5, { opacity: clamp(o, 0, 1) * p });
  }
  /* an emoji on a square: the flower and the wall, at the lesson's own size */
  function fbPic(g, c, r, ch, o, k) {
    if (!(o > 0)) return "";
    return Em(fbX(g, c), fbY(g, r), g.cell * (k || 0.61), ch, { opacity: clamp(o, 0, 1) });
  }
  /* Robo: the kit's teal disc, its yellow arrow turned by `angle`, and the
     robot itself, all at the shapes gridSvg draws them at CELL 56 */
  function fbRobo(g, c, r, angle, o) {
    if (!(o > 0)) return "";
    var s = g.cell / 56;
    return G(C(0, 0, 24, "#35BFB2", null, null, { opacity: 0.35 }) +
      G('<polygon points="0,-30 9,-16 -9,-16" fill="#F4C95D"/>', { transform: "rotate(" + n2(angle) + ")" }) +
      '<text x="0" y="11" text-anchor="middle" font-size="30">' + FB_BOT + "</text>",
      { transform: "translate(" + n2(fbX(g, c)) + "," + n2(fbY(g, r)) + ") scale(" + n3(s) + ")", opacity: clamp(o, 0, 1) });
    }

  /* ---- what Robo does: the lesson's stepping loop over the lesson's tables ----
     start: [column, row]; facing: "up" | "right" | "down" | "left"; prog: the
     letters of CMD. Returns the state after every instruction, and stops where
     the lesson stops - at a wall or at the edge, with the rest of the program
     never run. */
  function fbRun(start, facing, prog, opt) {
    opt = opt || {};
    var cols = opt.cols == null ? 5 : opt.cols, rows = opt.rows == null ? 4 : opt.rows, walls = opt.walls || [];
    var pos = start.slice(), f = facing;
    var out = [{ pos: pos.slice(), facing: f, cmd: null, bump: null }];
    for (var k = 0; k < prog.length; k++) {
      var cmd = prog[k], bump = null;
      if (!FB_R.CMD[cmd]) throw new Error("fbRun: Robo has no instruction " + JSON.stringify(cmd));
      if (cmd === "L") f = FB_R.TURN_L[f];
      else if (cmd === "R") f = FB_R.TURN_R[f];
      else {
        var d = FB_R.DIRS[f], sign = cmd === "F" ? 1 : -1;
        var nc = pos[0] + d[0] * sign, nr = pos[1] + d[1] * sign, hit = false;
        for (var w = 0; w < walls.length; w++) if (walls[w][0] === nc && walls[w][1] === nr) hit = true;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || hit) bump = hit ? "wall" : "edge";
        else pos = [nc, nr];
      }
      out.push({ pos: pos.slice(), facing: f, cmd: cmd, bump: bump });
      if (bump) break;
    }
    return out;
  }
  /* how far round the arrow turns for one instruction, from the kit's own
     ANGLE table: a left turn is anticlockwise, a right turn clockwise */
  function fbSpin(from, to) {
    var d = FB_R.ANGLE[to] - FB_R.ANGLE[from];
    while (d > 180) d -= 360;
    while (d <= -180) d += 360;
    return d;
  }
  /* where Robo is at time t, if the program started at `at` and each
     instruction takes `step` seconds: {c, r, angle, k, bump, done} */
  function fbPose(run, t, at, step) {
    var n = run.length - 1, a = run[0];
    var still = { c: a.pos[0], r: a.pos[1], angle: FB_R.ANGLE[a.facing], k: -1, bump: null, done: n < 1 };
    if (at == null || n < 1 || t <= at) return still;
    step = step || 0.6;
    var u = clamp((t - at) / step, 0, n), i = Math.min(Math.floor(u), n - 1), p = ease(clamp(u - i, 0, 1));
    var s0 = run[i], s1 = run[i + 1];
    var c = lerp(s0.pos[0], s1.pos[0], p), r = lerp(s0.pos[1], s1.pos[1], p);
    if (s1.bump && (s1.cmd === "F" || s1.cmd === "B")) {
      var d = FB_R.DIRS[s0.facing], sign = s1.cmd === "F" ? 1 : -1, nudge = Math.sin(Math.PI * p) * 0.24;
      c += d[0] * sign * nudge; r += d[1] * sign * nudge;
    }
    return { c: c, r: r, angle: FB_R.ANGLE[s0.facing] + fbSpin(s0.facing, s1.facing) * p,
      k: i, p: p, bump: s1.bump && p > 0.5 ? s1.bump : null, done: u >= n };
  }

  /* ---- the four buttons -------------------------------------------------------
     The lesson's own chip: its icon and its label, from CMD. state is
     "off" (not reached), "now" (being run), "done" (already run) or
     "gone" (crossed out, about to be taken away). */
  function fbChip(x, y, w, h, cmd, state, o) {
    if (!(o > 0)) return "";
    var C1 = FB_R.CMD[cmd], now = state === "now", done = state === "done", gone = state === "gone";
    var col = gone ? P.bad : now ? P.gold : done ? P.teal : P.line;
    var out = R(x, y, w, h, h * 0.34, now ? "#1B3A52" : P.card, col, now || gone ? 4 : 2) +
      Em(x + h * 0.56, y + h / 2, h * 0.56, C1.icon) +
      Tx(x + h * 1.02, y + h / 2 + 8, C1.label, "lab" + (now ? " gold" : done ? "" : " muted"), "start");
    if (gone) out += L(x + 10, y + h / 2, x + w - 10, y + h / 2, P.bad, 5);
    return G(out, { opacity: clamp(o, 0, 1), transform: now ? around(x + w / 2, y + h / 2, 1.04) : null });
  }
  /* a program, one chip under another. run/pose light the chip being run.
     opt.each stages the chips in one at a time across o's own 0..1 ramp: it
     must divide by the program's OWN length, not a fixed count, or a longer
     program's last chip needs o above 1 and never lands (Level 2's five-step
     program is why this was caught: four chips popped in, the fifth stayed at
     opacity 0 forever, because the divisor here was hardcoded 4). */
  function fbChips(x, y, prog, o, opt) {
    opt = opt || {};
    var w = opt.w || 268, h = opt.h || 48, gap = opt.gap == null ? 9 : opt.gap, out = "";
    var n = prog.length || 1;
    for (var k = 0; k < prog.length; k++) {
      var state = "off";
      if (opt.gone != null && opt.gone === k) state = "gone";
      else if (opt.now != null && opt.now === k) state = "now";
      else if (opt.now != null && k < opt.now) state = "done";
      else if (opt.done) state = "done";
      var ko = opt.each ? clamp(o * n - k, 0, 1) : o;
      out += fbChip(x, y + k * (h + gap), w, h, prog[k], state, ko);
    }
    return out;
  }
  /* the lesson's Go button, and a tap on it */
  function fbGoBtn(x, y, w, h, o, press) {
    if (!(o > 0)) return "";
    var p = press || 0;
    return G(R(x, y, w, h, h * 0.3, p > 0.05 ? "#2A8F85" : "#1F7F77", P.teal, 3) +
      Tx(x + w / 2, y + h / 2 + 10, "▶ Go", "lab big", "middle"),
      { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, 1 + 0.08 * p) });
  }

  /* ---- the title motif ---------------------------------------------------------
     A small three by three grid with Robo in the middle, the flower on one
     corner, and the four instructions round the outside. In the spoken title
     chapter each direction lights as it is named; on the two cards it stands
     still. */
  var FB_MOTIF = fbGrid(44, 44, 3, 3, 88);
  var FB_DIRCUE = [["forward", "F"], ["back", "B"], ["left", "L"], ["right", "R"]];
  function titleMotif(o) {
    var t = o.t || 0, scene = o.scene, g = FB_MOTIF, out = "";
    var four = scene ? sc(scene, 1, "four") : null;
    var told = scene ? sc(scene, 0, "told") : null;
    out += R(20, 20, 320, 320, 26, P.card, P.line, 3);
    out += fbCells(g, 1, null);
    out += fbPic(g, 2, 0, FB_FLOWER, 1);
    /* "what it is told": the light goes on round Robo, which is the one thing
       on this grid that does nothing until somebody says so */
    var toldO = on(t, told, 0.6) * (1 - 0.7 * on(t, four, 0.6));
    if (toldO > 0) out += MK.glow(fbX(g, 1), fbY(g, 1), 86, P.gold, toldO * (0.55 + 0.45 * breathe(t)));
    out += fbRobo(g, 1, 1, FB_R.ANGLE.right, 1);
    if (toldO > 0) out += C(fbX(g, 1), fbY(g, 1), 40, "none", P.gold, 4, { opacity: toldO * (0.5 + 0.5 * breathe(t)) });
    /* the four instructions, one on each side, lit as they are said */
    var pos = [[1, -0.62, 0], [1, 2.62, 0], [-0.62, 1, 0], [2.62, 1, 0]];
    for (var k = 0; k < 4; k++) {
      var cue = scene ? sc(scene, 1, FB_DIRCUE[k][0]) : null;
      var lit = cue == null ? (four == null ? 1 : 0) : popIn(t, cue, 0.34);
      var cx = fbX(g, pos[k][0]), cy = fbY(g, pos[k][1]);
      out += C(cx, cy, 30, lit > 0.2 ? "#1B3A52" : P.card, lit > 0.2 ? P.gold : P.line, lit > 0.2 ? 3 : 2,
        { opacity: 0.45 + 0.55 * clamp(lit, 0, 1) });
      out += Em(cx, cy, 34, FB_R.CMD[FB_DIRCUE[k][1]].icon, { opacity: 0.5 + 0.5 * clamp(lit, 0, 1) });
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Robo on a grid, with forward, backwards, left and right around it">' + out + "</svg>";
  }

  /* ==== chapter: Four instructions ================================================
     The lesson's four buttons beside a small grid. Each one lights as it is
     named and Robo does it: forward one square, backwards one square the other
     way, then a left turn and a right turn that move it nowhere. */
  var FB_FOUR = fbGrid(96, 60, 3, 3, 96);
  var FB_FOUR_CMDS = ["F", "B", "L", "R"];
  function fbFourChapter(scene, beat, t, i) {
    var g = FB_FOUR, c = function (k, n) { return sc(scene, k, n); };
    var cFour = c(0, "four"), cOnly = c(0, "only"), cHere = c(0, "here");
    var cFwd = c(1, "forward"), cOne = c(1, "one"), cFace = c(1, "facing");
    var cBack = c(2, "back"), cOther = c(2, "other"), cNoTurn = c(2, "turning");
    var cLeft = c(3, "left"), cSpin = c(3, "spins"), cStay = c(3, "stays");
    var cRight = c(4, "right"), cAgain = c(4, "again");
    var out = "";

    /* Robo starts in the middle square facing right, and every move is one of
       the lesson's own instructions run through its own tables */
    var fwd = fbRun([1, 1], "right", ["F"], { cols: 3, rows: 3 });
    var back = fbRun([2, 1], "right", ["B"], { cols: 3, rows: 3 });
    var left = fbRun([1, 1], "right", ["L"], { cols: 3, rows: 3 });
    var right = fbRun([1, 1], "up", ["R"], { cols: 3, rows: 3 });

    var pose = { c: 1, r: 1, angle: FB_R.ANGLE.right };
    var doneAt = null, trail = null;
    if (fbFrom(t, scene, 4) > 0.01) { pose = fbPose(right, t, cRight, 0.8); doneAt = cRight; }
    else if (fbFrom(t, scene, 3) > 0.01) { pose = fbPose(left, t, cLeft, 0.8); doneAt = cLeft; }
    else if (fbFrom(t, scene, 2) > 0.01) { pose = fbPose(back, t, cBack, 0.8); doneAt = cBack; trail = [2, 1]; }
    else if (fbFrom(t, scene, 1) > 0.01) { pose = fbPose(fwd, t, cFwd, 0.8); doneAt = cFwd; trail = [1, 1]; }

    out += fbCells(g, 1, null);
    /* the square Robo came from, while it is moving, so one square is one square */
    if (trail) out += fbMark(g, trail[0], trail[1], P.muted, on(t, doneAt, 0.3) * 0.7, 0);
    /* a turn keeps Robo on the same square, and the square says so */
    var stay = Math.max(on(t, cStay, 0.4) * fbOnly(t, scene, 3), on(t, cAgain, 0.4) * fbOnly(t, scene, 4));
    out += fbMark(g, 1, 1, P.good, stay, t);
    out += fbRobo(g, pose.c, pose.r, pose.angle, 1);
    /* how far one instruction carried Robo */
    var oneO = Math.max(on(t, cOne, 0.4) * fbOnly(t, scene, 1), on(t, cOther, 0.4) * fbOnly(t, scene, 2));
    if (oneO > 0) {
      var isBack = fbFrom(t, scene, 2) > 0.5;
      var ay = fbY(g, 1) + g.cell * 0.44;
      out += MK.arrow(fbX(g, isBack ? 2 : 1), ay, fbX(g, isBack ? 1 : 2), ay, oneO, P.gold, 6);
      out += MK.pill(fbX(g, 1.5), ay + 34, "1 square", oneO, { size: 20, col: P.gold });
    }
    /* "the way it is facing": the arrow, ringed */
    var faceO = Math.max(on(t, cFace, 0.4) * fbOnly(t, scene, 1), on(t, cNoTurn, 0.4) * fbOnly(t, scene, 2));
    if (faceO > 0) out += C(fbX(g, pose.c), fbY(g, pose.r) - g.cell * 0.28, 24, "none", P.gold, 4,
      { opacity: faceO * (0.6 + 0.4 * breathe(t)), transform: "rotate(" + n2(pose.angle) + " " + n2(fbX(g, pose.c)) + " " + n2(fbY(g, pose.r)) + ")" });
    /* "spins to its left" / "the other way": which way the arrow went round */
    var spinO = Math.max(on(t, cSpin, 0.35) * fbOnly(t, scene, 3), on(t, cRight, 0.35) * fbOnly(t, scene, 4));
    if (spinO > 0) {
      var anti = fbFrom(t, scene, 4) < 0.5, rr = g.cell * 0.62, mx = fbX(g, 1), my = fbY(g, 1);
      var a0 = anti ? 0.35 : -1.22, a1 = anti ? -1.22 : 0.35;
      out += Pth("M" + n2(mx + rr * Math.cos(a0)) + "," + n2(my + rr * Math.sin(a0)) +
        " A" + n2(rr) + "," + n2(rr) + " 0 0 " + (anti ? "0" : "1") + " " +
        n2(mx + rr * Math.cos(a1)) + "," + n2(my + rr * Math.sin(a1)), null, P.plum, 6, { opacity: spinO });
      out += MK.arrow(mx + rr * Math.cos(a1 + (anti ? 0.22 : -0.22)), my + rr * Math.sin(a1 + (anti ? 0.22 : -0.22)),
        mx + rr * Math.cos(a1), my + rr * Math.sin(a1), spinO, P.plum, 6);
    }

    /* the four buttons, exactly the lesson's, appearing on "four instructions",
       and "only four" draws the line round the whole set: these, and no others */
    var onlyO = on(t, cOnly, 0.5) * fbOnly(t, scene, 0);
    if (onlyO > 0) out += R(504, 58, 622, 298, 26, "none", P.gold, 4,
      { opacity: onlyO * (0.65 + 0.35 * breathe(t)), "stroke-dasharray": "16 11" });
    var lit = [cFwd, cBack, cLeft, cRight];
    for (var k = 0; k < 4; k++) {
      var x = 520 + (k % 2) * 322, y = 74 + Math.floor(k / 2) * 150;
      var o = popIn(t, cFour == null ? null : cFour + k * 0.2, 0.36);
      var isNow = lit[k] != null && t >= lit[k] - 0.1 && fbOnly(t, scene, k + 1) > 0.4;
      var done = lit[k] != null && t >= lit[k] && !isNow;
      var col = isNow ? P.gold : done ? P.teal : P.line;
      out += G(R(x, y, 290, 116, 22, isNow ? "#1B3A52" : P.card, col, isNow ? 4 : 2) +
        Em(x + 60, y + 58, 56, FB_R.CMD[FB_FOUR_CMDS[k]].icon) +
        Tx(x + 112, y + 68, FB_R.CMD[FB_FOUR_CMDS[k]].label, "lab big" + (isNow ? " gold" : done ? "" : " muted"), "start"),
        { opacity: 0.35 + 0.65 * clamp(o, 0, 1), transform: around(x + 145, y + 58, isNow ? 1.03 : 0.99) });
      if (isNow) out += MK.ripple(x + 60, y + 58, t, lit[k], P.gold);
    }
    /* "Here they are": the four together */
    var hereO = on(t, cHere, 0.5) * fbOnly(t, scene, 0);
    if (hereO > 0) out += MK.pill(826, 386, "four instructions, and no more", hereO, { size: 22, col: P.gold });
    return svg(out);
  }
