  /* ==== Forward, Back, Left, Right, part 2 =====================================
     The three chapters that live on the lesson's own five-by-four grid: Robo
     and its arrow, a turn is not a move, and a program for Robo. Every route
     here is run through fbRun, which is the lesson's own stepping loop over
     the lesson's own tables, so the squares Robo lands on are the squares the
     lesson's Robo lands on.

     THE GRID. Level 2 of the lesson's Robo driver: five columns, four rows,
     Robo on column 1, row 4 facing right, the flower on column 3, row 2. In
     the lesson's own numbers those are [0, 3] and [2, 1], row 0 at the top. */

  var FB_G = fbGrid(60, 50, 5, 4, 76);        /* x 60..440, y 50..354 */
  var FB_START = [0, 3], FB_FACE = "right", FB_TARGET = [2, 1];
  var FB_CHIPX = 566, FB_CHIPW = 262, FB_CHIPH = 48, FB_CHIPG = 9;

  /* the grid with its flower, and nothing else */
  function fbBoard(g, o, opt) {
    opt = opt || {};
    var out = fbCells(g, o, opt.lit);
    (opt.walls || []).forEach(function (w) { out += fbPic(g, w[0], w[1], FB_WALL, o); });
    if (opt.target) out += fbPic(g, opt.target[0], opt.target[1], FB_FLOWER, o);
    return out;
  }
  /* the squares a run has already left, as faint dots: a breadcrumb trail */
  function fbTrail(g, run, pose, o) {
    if (!(o > 0) || !pose || pose.k < 0) return "";
    var out = "";
    for (var k = 0; k <= pose.k && k < run.length; k++) {
      if (k > 0 && run[k].pos[0] === run[k - 1].pos[0] && run[k].pos[1] === run[k - 1].pos[1]) continue;
      out += C(fbX(g, run[k].pos[0]), fbY(g, run[k].pos[1]), g.cell * 0.09, P.teal, null, null, { opacity: 0.5 * clamp(o, 0, 1) });
    }
    return out;
  }
  /* the way Robo is facing, as a dashed arrow two squares long */
  function fbFacing(g, pose, o, col) {
    if (!(o > 0)) return "";
    var a = (pose.angle - 90) * Math.PI / 180;
    var x0 = fbX(g, pose.c) + Math.cos(a) * g.cell * 0.46, y0 = fbY(g, pose.r) + Math.sin(a) * g.cell * 0.46;
    var x1 = fbX(g, pose.c) + Math.cos(a) * g.cell * 1.5, y1 = fbY(g, pose.r) + Math.sin(a) * g.cell * 1.5;
    return MK.arrow(x0, y0, x1, y1, clamp(o, 0, 1), col || P.gold, 6);
  }
  /* "Bump!" on a bumped step */
  function fbBump(g, pose, o) {
    if (!(o > 0) || !pose.bump) return "";
    return MK.cross(fbX(g, pose.c), fbY(g, pose.r) - g.cell * 0.66, 20, 1) +
      MK.pill(fbX(g, pose.c), fbY(g, pose.r) - g.cell * 1.06, "Bump!", clamp(o, 0, 1), { size: 22, col: P.bad, ink: P.bad });
  }

  /* ==== chapter: Robo and its arrow ==============================================
     The grid appears, then the arrow is named, then one forward, one left turn
     and one forward that goes the NEW way. Three instructions, three chips. */
  function fbRoboChapter(scene, beat, t, i) {
    var g = FB_G, c = function (k, n) { return sc(scene, k, n); };
    var cRobo = c(0, "robo"), cGrid = c(0, "grid"), cFlower = c(0, "flower"), cReach = c(0, "reach");
    var cArrow = c(1, "arrow"), cFacing = c(1, "facing"), cLook = c(1, "look");
    var cFwd = c(2, "forward"), cOne = c(2, "one"), cPoints = c(2, "points");
    var cTurn = c(3, "turn"), cSpins = c(3, "spins"), cStays = c(3, "stays");
    var cNow = c(4, "now"), cUp = c(4, "up"), cNew = c(4, "new");
    var out = "";

    /* one instruction per beat, each run through the lesson's own tables */
    var step1 = fbRun(FB_START, FB_FACE, ["F"]);
    var step2 = fbRun([1, 3], "right", ["L"]);
    var step3 = fbRun([1, 3], "up", ["F"]);
    var pose = { c: FB_START[0], r: FB_START[1], angle: FB_R.ANGLE[FB_FACE], k: -1, bump: null };
    if (fbFrom(t, scene, 4) > 0.01) pose = fbPose(step3, t, cNow, 0.75);
    else if (fbFrom(t, scene, 3) > 0.01) pose = fbPose(step2, t, cTurn, 0.8);
    else if (fbFrom(t, scene, 2) > 0.01) pose = fbPose(step1, t, cFwd, 0.75);

    out += fbBoard(g, on(t, cGrid, 0.5), { target: FB_TARGET });
    out += MK.ripple(fbX(g, FB_TARGET[0]), fbY(g, FB_TARGET[1]), t, cReach, P.gold);
    /* the square Robo is leaving, while it moves */
    var fromSq = fbFrom(t, scene, 4) > 0.01 ? [1, 3] : fbFrom(t, scene, 2) > 0.01 ? FB_START : null;
    if (fromSq && !pose.done) out += fbMark(g, fromSq[0], fromSq[1], P.muted, 0.7, 0);
    /* "stays on its square": the turn moves Robo nowhere */
    out += fbMark(g, 1, 3, P.good, on(t, cStays, 0.4) * fbOnly(t, scene, 3), t);
    /* the way it is facing, on the beats that talk about it */
    var faceO = Math.max(on(t, cFacing, 0.5) * fbOnly(t, scene, 1),
      Math.max(on(t, cPoints, 0.4) * fbOnly(t, scene, 2), on(t, cNew, 0.4) * fbOnly(t, scene, 4)));
    out += fbFacing(g, pose, faceO);
    out += fbRobo(g, pose.c, pose.r, pose.angle, popIn(t, cRobo, 0.45));

    /* the yellow arrow, ringed and named, for its own beat */
    var arrowO = on(t, cArrow, 0.4) * fbOnly(t, scene, 1);
    if (arrowO > 0) {
      var ax = fbX(g, pose.c), ay = fbY(g, pose.r);
      var bob = 0.85 + 0.15 * breathe(t) * on(t, cLook, 0.5);
      out += C(ax + g.cell * 0.32, ay, 25, "none", P.gold, 4, { opacity: arrowO * bob });
      out += MK.leader(276, 394, ax + g.cell * 0.5, ay + g.cell * 0.2, on(t, cArrow, 0.7), P.gold);
      out += MK.pill(290, 394, "the yellow arrow", arrowO, { size: 24, anchor: "start", col: P.gold });
    }

    /* the chips: one instruction is added on each of the last three beats */
    var chips = [], now = null;
    if (fbFrom(t, scene, 2) > 0.01) chips.push("F");
    if (fbFrom(t, scene, 3) > 0.01) chips.push("L");
    if (fbFrom(t, scene, 4) > 0.01) chips.push("F");
    if (chips.length) {
      now = chips.length - 1;
      out += Tx(FB_CHIPX, 72, "What you told Robo", "lab mid muted", "start");
      out += fbChips(FB_CHIPX, 92, chips, 1, { w: FB_CHIPW, h: FB_CHIPH, gap: FB_CHIPG, now: now });
    }
    /* "one square": how far one forward carried it */
    var oneO = Math.max(on(t, cOne, 0.4) * fbOnly(t, scene, 2), on(t, cUp, 0.4) * fbOnly(t, scene, 4));
    if (oneO > 0) {
      var up = fbFrom(t, scene, 4) > 0.5;
      if (up) {
        out += MK.arrow(fbX(g, 1) - g.cell * 0.46, fbY(g, 3), fbX(g, 1) - g.cell * 0.46, fbY(g, 2), oneO, P.blue, 6);
        out += MK.pill(462, fbY(g, 2.5), "1 square", oneO, { size: 21, anchor: "start", col: P.blue });
      } else {
        var mby = g.y + fbH(g) + 22;
        out += MK.arrow(fbX(g, 0), mby, fbX(g, 1), mby, oneO, P.blue, 6);
        out += MK.pill(fbX(g, 0.5), mby + 32, "1 square", oneO, { size: 21, col: P.blue });
      }
    }
    /* "the arrow spins round" */
    var spinO = on(t, cSpins, 0.35) * fbOnly(t, scene, 3);
    if (spinO > 0) {
      var mx = fbX(g, 1), my = fbY(g, 3), rr = g.cell * 0.66;
      out += Pth("M" + n2(mx + rr) + "," + n2(my) + " A" + n2(rr) + "," + n2(rr) + " 0 0 0 " + n2(mx) + "," + n2(my - rr),
        null, P.plum, 6, { opacity: spinO });
      out += MK.arrow(mx + rr * 0.3, my - rr * 0.95, mx, my - rr, spinO, P.plum, 6);
    }
    return svg(out);
  }

  /* ==== chapter: a turn is not a move ============================================
     The lesson's own misconception ("Children often count a turn as a square.
     Then Robo stops one square short every time."). Two beats measure a turn
     and a forward; then a four-instruction program that counts the turn as a
     square, and stops one square below the flower. */
  var FB_SHORT = ["F", "F", "L", "F"];         /* one square short of the flower */
  function fbTurnChapter(scene, beat, t, i) {
    var g = FB_G, c = function (k, n) { return sc(scene, k, n); };
    var cSpins = c(0, "spins"), cNowhere = c(0, "nowhere");
    var cFwd = c(1, "forward"), cOne = c(1, "one"), cJobs = c(1, "jobs");
    var cCount = c(2, "count"), cShort = c(2, "short");
    var cArrow = c(3, "arrow"), cTurn = c(3, "turn"), cMove = c(3, "move");
    var out = "", second = fbFrom(t, scene, 2);

    /* ---- the first half: one turn, then one forward, on the middle square */
    var first = "";
    var spin = fbRun([2, 2], "right", ["L"]);
    var move = fbRun([2, 2], "up", ["F"]);
    var poseA = fbFrom(t, scene, 1) > 0.01 ? fbPose(move, t, cFwd, 0.8) : fbPose(spin, t, cSpins, 0.9);
    first += fbBoard(g, 1, {});
    first += fbMark(g, 2, 2, P.good, on(t, cNowhere, 0.4) * fbOnly(t, scene, 0), t);
    if (fbFrom(t, scene, 1) > 0.01 && !poseA.done) first += fbMark(g, 2, 2, P.muted, 0.7, 0);
    first += fbRobo(g, poseA.c, poseA.r, poseA.angle, 1);
    if (on(t, cOne, 0.4) * fbOnly(t, scene, 1) > 0) {
      var o1 = on(t, cOne, 0.4);
      first += MK.arrow(fbX(g, 2) - g.cell * 0.46, fbY(g, 2), fbX(g, 2) - g.cell * 0.46, fbY(g, 1), o1, P.gold, 6);
    }
    /* the two cards: a turn moves nothing, a forward moves one square */
    var cards = [
      { at: cSpins, cmd: "L", n: "0 squares", col: P.plum },
      { at: cFwd, cmd: "F", n: "1 square", col: P.gold }
    ];
    for (var k = 0; k < 2; k++) {
      var o = popIn(t, cards[k].at, 0.4), x = 566, y = 70 + k * 152;
      if (o <= 0) continue;
      first += G(R(x, y, 540, 132, 22, P.card, cards[k].col, 3) +
        Em(x + 70, y + 66, 62, FB_R.CMD[cards[k].cmd].icon) +
        Tx(x + 128, y + 56, FB_R.CMD[cards[k].cmd].label, "lab big", "start") +
        Tx(x + 128, y + 98, cards[k].n, "lab big", "start", { fill: cards[k].col }),
        { opacity: Math.min(1, o), transform: around(x + 270, y + 66, Math.min(1.06, o)) });
    }
    /* "two different jobs" */
    var jobsO = on(t, cJobs, 0.45) * fbOnly(t, scene, 1);
    if (jobsO > 0) first += MK.pill(836, 396, "a turn and a move are not the same", jobsO, { size: 22, col: P.gold });

    /* ---- the second half: the turn counted as a square */
    var short = "";
    if (second > 0.01) {
      var runS = fbRun(FB_START, FB_FACE, FB_SHORT);
      var at = cCount == null ? null : cCount + 0.35;
      var poseB = fbPose(runS, t, at, 0.5);
      short += fbBoard(g, 1, { target: FB_TARGET });
      short += fbTrail(g, runS, poseB, 1);
      short += fbRobo(g, poseB.c, poseB.r, poseB.angle, 1);
      /* four instructions, and only three of them move */
      var chipsO = 1 - 0.55 * on(t, cArrow, 0.5);
      short += G(Tx(FB_CHIPX, 60, "Four instructions, three moves", "lab mid muted", "start") +
        fbChips(FB_CHIPX, 78, FB_SHORT, 1, { w: FB_CHIPW, h: FB_CHIPH, gap: FB_CHIPG, now: poseB.k }), { opacity: chipsO });
      /* the gap the child is left with */
      var gap = on(t, cShort, 0.45);
      if (gap > 0 && poseB.done) {
        short += MK.arrow(fbX(g, 2) + g.cell * 0.42, fbY(g, 2), fbX(g, 2) + g.cell * 0.42, fbY(g, 1), gap, P.bad, 6);
        short += MK.cross(fbX(g, 2) - g.cell * 0.52, fbY(g, 2) - g.cell * 0.2, 19, popIn(t, cShort, 0.35));
        short += MK.pill(fbX(g, 2.5), fbY(g, 3) + g.cell * 0.66, "one square short", gap, { size: 24, col: P.bad, ink: P.bad });
      }
      /* the rule: look at the arrow, turn first, then move */
      var ruleO = on(t, cArrow, 0.45);
      if (ruleO > 0) {
        var rx = FB_CHIPX + FB_CHIPW + 40;
        short += fbFacing(g, poseB, ruleO, P.gold);
        short += Tx(rx, 122, "Turn first, then move", "lab mid gold", "start", { opacity: ruleO });
        short += fbChip(rx, 140, FB_CHIPW, FB_CHIPH, "L", "now", popIn(t, cTurn, 0.35));
        short += MK.arrow(rx + FB_CHIPW / 2, 194, rx + FB_CHIPW / 2, 214, on(t, cMove, 0.3), P.gold, 6);
        short += fbChip(rx, 220, FB_CHIPW, FB_CHIPH, "F", "now", popIn(t, cMove, 0.35));
      }
    }
    out += G(first, { opacity: 1 - clamp(second, 0, 1) }) + G(short, { opacity: clamp(second, 0, 1) });
    return svg(out);
  }

  /* ==== chapter: a program for Robo ==============================================
     Count the route, build the list, press Go. Then the same five instructions
     in another order, which ends somewhere else entirely (1CT.06), and a wall
     that stops the program early. */
  var FB_PROG = ["F", "F", "L", "F", "F"];     /* Level 2's own solution */
  var FB_MIXED = ["F", "L", "F", "F", "F"];    /* the same five, reordered */
  var FB_ROUTE = [[1, 3], [2, 3], [2, 2], [2, 1]];
  function fbProgramChapter(scene, beat, t, i) {
    var g = FB_G, c = function (k, n) { return sc(scene, k, n); };
    var cCount = c(0, "count"), cAcross = c(0, "across"), cUp = c(0, "up");
    var cTap = c(1, "tap"), cList = c(1, "list"), cProgram = c(1, "program");
    var cGo = c(2, "go"), cOne = c(2, "one"), cReaches = c(2, "reaches");
    var cOrder = c(3, "order"), cFirst = c(3, "first"), cElse = c(3, "else");
    var cEarly = c(4, "early"), cWall = c(4, "wall"), cBump = c(4, "bump");
    var wallU = clamp(fbFrom(t, scene, 4), 0, 1), out = "";

    /* ---- beats 0 to 3: the route, the list, Go, and the wrong order */
    var main = "";
    var mixed = fbFrom(t, scene, 3) > 0.01;
    var prog = mixed ? FB_MIXED : FB_PROG;
    var run = fbRun(FB_START, FB_FACE, prog);
    var goAt = mixed ? (cFirst == null ? null : cFirst + 0.2) : (cGo == null ? null : cGo + 0.45);
    var pose = fbPose(run, t, goAt, mixed ? 0.34 : 0.5);

    main += fbBoard(g, 1, { target: FB_TARGET });
    /* "Two across, then two up": the squares, counted */
    var routeO = on(t, cCount, 0.4) * fbOnly(t, scene, 0);
    if (routeO > 0) {
      for (var k = 0; k < 4; k++) {
        var at = k < 2 ? cAcross : cUp, base = k < 2 ? 0 : 2;
        var ro = popIn(t, at == null ? null : at + (k - base) * 0.3, 0.35) * routeO;
        if (ro <= 0) continue;
        var sq = FB_ROUTE[k];
        var col = k < 2 ? P.gold : P.blue, nx = fbX(g, sq[0]) + g.cell * 0.27, ny = fbY(g, sq[1]) - g.cell * 0.24;
        main += fbMark(g, sq[0], sq[1], col, Math.min(1, ro), 0);
        main += C(nx, ny, 19, P.ground, col, 3, { opacity: Math.min(1, ro) });
        main += Tx(nx, ny + 10, String(k - base + 1), "lab big", "middle", { fill: col, opacity: Math.min(1, ro) });
      }
      main += MK.pill(fbX(g, 1), fbY(g, 3) + g.cell * 0.82, "2 across", on(t, cAcross, 0.4) * routeO, { size: 21, col: P.gold });
      main += MK.pill(fbX(g, 3.5), fbY(g, 1.5), "2 up", on(t, cUp, 0.4) * routeO, { size: 21, col: P.blue });
    }
    main += fbTrail(g, run, pose, 1);
    main += fbRobo(g, pose.c, pose.r, pose.angle, 1);

    /* the list of instructions, built one chip at a time */
    var built = on(t, cTap, 0.3);
    if (built > 0) {
      /* when the order changes the pill above says so, and the heading would sit under it */
      if (!mixed) main += Tx(FB_CHIPX, 48, "The program", "lab mid muted", "start");
      main += fbChips(FB_CHIPX, 64, prog, mixed ? 1 : built, { w: FB_CHIPW, h: FB_CHIPH, gap: FB_CHIPG, each: !mixed, now: pose.k });
      /* the word for the list */
      var po = on(t, cProgram, 0.4) * fbOnly(t, scene, 1);
      if (po > 0) {
        main += L(FB_CHIPX - 14, 64, FB_CHIPX - 14, 64 + 5 * (FB_CHIPH + FB_CHIPG) - FB_CHIPG, P.gold, 4, { opacity: po });
        main += MK.pill(FB_CHIPX + FB_CHIPW / 2, 378, "program", po, { size: 27, col: P.gold });
      }
      /* the turn chip, moved to the front */
      var mo = on(t, cOrder, 0.4) * fbOnly(t, scene, 3);
      if (mo > 0) main += MK.pill(FB_CHIPX + FB_CHIPW / 2, 30, "the turn moved to the front", mo, { size: 20, col: P.accent });
    }
    /* the Go button, and the tap on it */
    var goO = on(t, cTap, 0.6);
    var press = goAt == null ? 0 : bump(t, goAt - 0.3, 0.5);
    main += fbGoBtn(880, 176, 196, 70, goO, press);
    main += MK.ripple(978, 211, t, goAt == null ? null : goAt - 0.3, P.teal);
    /* where it ended */
    if (pose.done) {
      if (!mixed) {
        main += fbMark(g, FB_TARGET[0], FB_TARGET[1], P.good, on(t, cReaches, 0.4), t);
        main += MK.tick(fbX(g, FB_TARGET[0]) + g.cell * 0.56, fbY(g, FB_TARGET[1]) - g.cell * 0.4, 21, popIn(t, cReaches, 0.4));
        main += MK.pill(fbX(g, 2.5), fbY(g, 3) + g.cell * 0.66, "Robo reached the flower", on(t, cReaches, 0.4), { size: 22, col: P.good, ink: P.good });
      } else {
        main += MK.cross(fbX(g, 1) + g.cell * 0.56, fbY(g, 0) - g.cell * 0.18, 20, popIn(t, cElse, 0.4));
        main += MK.pill(fbX(g, 2.5), fbY(g, 3) + g.cell * 0.66, "not on the flower", on(t, cElse, 0.4), { size: 22, col: P.bad, ink: P.bad });
      }
    }

    /* ---- beat 4: a wall stops the program early */
    var wall = "";
    if (wallU > 0.01) {
      var runW = fbRun(FB_START, FB_FACE, ["F", "F"], { walls: [[2, 3]] });
      var poseW = fbPose(runW, t, cWall == null ? null : cWall - 0.2, 0.65);
      wall += fbBoard(g, 1, { target: FB_TARGET, walls: [[2, 3]] });
      wall += fbTrail(g, runW, poseW, 1);
      wall += fbRobo(g, poseW.c, poseW.r, poseW.angle, 1);
      wall += fbBump(g, poseW, Math.max(on(t, cBump, 0.3), on(t, cWall == null ? null : cWall + 1.15, 0.3)));
      wall += Tx(FB_CHIPX, 60, "The program stops there", "lab mid muted", "start");
      wall += fbChips(FB_CHIPX, 78, ["F", "F", "L", "F", "F"], 1,
        { w: FB_CHIPW, h: FB_CHIPH, gap: FB_CHIPG, now: poseW.done ? 1 : poseW.k });
      var stopO = on(t, cEarly, 0.4);
      var cut = 78 + 2 * (FB_CHIPH + FB_CHIPG) - FB_CHIPG / 2;
      if (stopO > 0) wall += L(FB_CHIPX - 16, cut, FB_CHIPX + FB_CHIPW + 16, cut, P.bad, 4, { opacity: stopO, "stroke-dasharray": "10 8" }) +
        MK.pill(FB_CHIPX + FB_CHIPW + 150, 270, "these never run", stopO, { size: 21, col: P.bad, ink: P.bad });
    }
    out += G(main, { opacity: 1 - wallU }) + G(wall, { opacity: wallU });
    return svg(out);
  }
