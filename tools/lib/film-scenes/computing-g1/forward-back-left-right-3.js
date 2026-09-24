  /* ==== Forward, Back, Left, Right, part 3 =====================================
     Predicting, testing and fixing, and what you now know. */

  /* ==== chapter: predict, then press Go ==========================================
     Program 2 of the lesson's own Robo predictor: Robo on column 1, row 4,
     facing UP, the flower on column 2, row 2, and the program forward,
     forward, turn right, forward. A ghost Robo walks the program ahead of the
     real one, with a finger under it, and the real Robo does not move at all -
     which is the whole point of predicting. */
  var FB_PRED_START = [0, 3], FB_PRED_FACE = "up", FB_PRED_TARGET = [1, 1];
  var FB_PRED = ["F", "F", "R", "F"];
  function fbPredictChapter(scene, beat, t, i) {
    var g = FB_G, c = function (k, n) { return sc(scene, k, n); };
    var cKnows = c(0, "knows"), cBefore = c(0, "before");
    var cPred = c(1, "predicting"), cFinger = c(1, "finger");
    var cFwd = c(2, "forward"), cUp = c(2, "up");
    var cRight = c(3, "right"), cPoints = c(3, "points"), cNoMove = c(3, "nomove");
    var cOne = c(4, "one"), cLands = c(4, "lands"), cGo = c(4, "go");
    var out = "";

    /* the ghost's walk, one leg per beat, all through the lesson's own tables */
    var legA = fbRun(FB_PRED_START, FB_PRED_FACE, ["F", "F"]);
    var legB = fbRun([0, 1], "up", ["R"]);
    var legC = fbRun([0, 1], "right", ["F"]);
    var ghost = { c: FB_PRED_START[0], r: FB_PRED_START[1], angle: FB_R.ANGLE[FB_PRED_FACE], k: -1, done: true };
    var walked = 0;
    if (fbFrom(t, scene, 4) > 0.01) { ghost = fbPose(legC, t, cOne, 0.7); walked = 3 + (ghost.done ? 1 : 0); }
    else if (fbFrom(t, scene, 3) > 0.01) { ghost = fbPose(legB, t, cRight, 0.8); walked = 2 + (ghost.done ? 1 : 0); }
    else if (fbFrom(t, scene, 2) > 0.01) { ghost = fbPose(legA, t, cFwd, 0.75); walked = ghost.k < 0 ? 0 : ghost.k + (ghost.done ? 1 : 0); }

    var landed = fbFrom(t, scene, 4) > 0.5 && ghost.done;
    out += fbBoard(g, 1, { target: FB_PRED_TARGET });
    if (landed) out += fbMark(g, FB_PRED_TARGET[0], FB_PRED_TARGET[1], P.good, on(t, cLands, 0.35), t);
    /* the real Robo stays exactly where it started */
    out += fbRobo(g, FB_PRED_START[0], FB_PRED_START[1], FB_R.ANGLE[FB_PRED_FACE], 1);
    /* the ghost: the same robot, half there, where your finger has reached */
    var ghostO = on(t, cFinger, 0.5);
    if (ghostO > 0 && (ghost.c !== FB_PRED_START[0] || ghost.r !== FB_PRED_START[1] || fbFrom(t, scene, 3) > 0.01)) {
      out += G(fbRobo(g, ghost.c, ghost.r, ghost.angle, 1), { opacity: 0.38 * ghostO });
    }
    out += MK.finger(fbX(g, ghost.c) - g.cell * 0.02, fbY(g, ghost.r) + g.cell * 0.34, ghostO);
    /* "your finger does not move" */
    out += fbMark(g, 0, 1, P.good, on(t, cNoMove, 0.4) * fbOnly(t, scene, 3), t);
    /* "the arrow points a new way" */
    if (on(t, cPoints, 0.4) * fbOnly(t, scene, 3) > 0) out += fbFacing(g, ghost, on(t, cPoints, 0.5), P.gold);
    /* "your finger goes up two squares" */
    var upO = on(t, cUp, 0.45) * fbOnly(t, scene, 2);
    if (upO > 0) {
      out += MK.arrow(fbX(g, 0) - g.cell * 0.44, fbY(g, 3) - g.cell * 0.2, fbX(g, 0) - g.cell * 0.44, fbY(g, 1), upO, P.blue, 6);
      out += MK.pill(fbX(g, 0.1), fbY(g, 0) + g.cell * 0.1, "2 squares", upO, { size: 21, col: P.blue });
    }
    /* "lands on the flower" */
    if (landed) out += MK.tick(fbX(g, FB_PRED_TARGET[0]) + g.cell * 0.56, fbY(g, FB_PRED_TARGET[1]) - g.cell * 0.4, 21, popIn(t, cLands, 0.4));

    /* the program, read one chip at a time */
    var listO = on(t, cKnows, 0.5);
    if (listO > 0) {
      out += Tx(FB_CHIPX, 58, "Read it before you run it", "lab mid muted", "start", { opacity: listO });
      out += fbChips(FB_CHIPX, 76, FB_PRED, listO, { w: FB_CHIPW, h: FB_CHIPH, gap: FB_CHIPG, each: true,
        now: walked > 0 && walked <= FB_PRED.length ? walked - 1 : null, done: walked > FB_PRED.length });
    }
    /* the word for it */
    var po = on(t, cPred, 0.4);
    if (po > 0) out += MK.pill(FB_CHIPX + FB_CHIPW / 2, 316, "predicting", po, { size: 28, col: P.good });
    /* Go waits, and is pressed only at the end */
    out += fbGoBtn(880, 176, 196, 70, on(t, cBefore, 0.5), cGo == null ? 0 : bump(t, cGo, 0.6));
    out += MK.ripple(978, 211, t, cGo, P.teal);
    return svg(out);
  }

  /* ==== chapter: test it, fix it =================================================
     The lesson's own fix ("Change it: add a turn, take away a forward."): a
     program with one forward too many stops beside the flower, the extra chip
     is taken away, and the same Go button gets it there. */
  var FB_LONG = ["F", "F", "F", "L", "F", "F"];   /* one forward too many */
  var FB_STATUS = [254, 414];                     /* where a line about the program goes */
  function fbFixChapter(scene, beat, t, i) {
    var g = FB_G, c = function (k, n) { return sc(scene, k, n); };
    var cTest = c(0, "test"), cBeside = c(0, "beside");
    var cNotRight = c(1, "notright"), cAgain1 = c(1, "again");
    var cTooMany = c(2, "toomany"), cAway = c(2, "away");
    var cAgain = c(3, "again"), cLands = c(3, "lands"), cAllDay = c(3, "allday");
    var out = "", fixed = fbFrom(t, scene, 3) > 0.01;

    var prog = fixed ? FB_PROG : FB_LONG;
    var run = fbRun(FB_START, FB_FACE, prog);
    var at = fixed ? (cAgain == null ? null : cAgain + 0.28) : (cTest == null ? null : cTest + 0.5);
    var pose = fbPose(run, t, at, fixed ? 0.32 : 0.4);

    out += fbBoard(g, 1, { target: FB_TARGET });
    out += fbTrail(g, run, pose, 1);
    out += fbRobo(g, pose.c, pose.r, pose.angle, 1);
    if (pose.done && !fixed) {
      /* beside the flower, not on it */
      var bo = on(t, cBeside, 0.4);
      out += MK.cross(fbX(g, 3) + g.cell * 0.5, fbY(g, 1) - g.cell * 0.42, 20, popIn(t, cBeside, 0.4));
      out += MK.arrow(fbX(g, 3) - g.cell * 0.3, fbY(g, 1) + g.cell * 0.36, fbX(g, 2) + g.cell * 0.22, fbY(g, 1) + g.cell * 0.36, bo, P.bad, 6);
      out += MK.pill(fbX(g, 2.5), fbY(g, 3) + g.cell * 0.66, "one square out", bo, { size: 23, col: P.bad, ink: P.bad });
    }
    if (pose.done && fixed) {
      out += fbMark(g, FB_TARGET[0], FB_TARGET[1], P.good, on(t, cLands, 0.4), t);
      out += MK.tick(fbX(g, FB_TARGET[0]) + g.cell * 0.56, fbY(g, FB_TARGET[1]) - g.cell * 0.4, 21, popIn(t, cLands, 0.4));
      out += MK.pill(fbX(g, 2.5), fbY(g, 3) + g.cell * 0.66, "on the flower", on(t, cLands, 0.4), { size: 23, col: P.good, ink: P.good });
    }

    /* the program: six chips, then five */
    out += Tx(FB_CHIPX, 46, fixed ? "Five instructions" : "Six instructions", "lab mid muted", "start");
    var gone = null;
    if (!fixed && cTooMany != null && t >= cTooMany) gone = 2;
    out += fbChips(FB_CHIPX, 62, prog, 1, { w: FB_CHIPW, h: FB_CHIPH, gap: FB_CHIPG, now: pose.k, gone: gone });
    /* "read it again": a question mark against the extra one */
    var qo = on(t, cNotRight, 0.4) * fbOnly(t, scene, 1);
    if (qo > 0) {
      out += MK.qmark(FB_CHIPX - 34, 62 + 2 * (FB_CHIPH + FB_CHIPG) + FB_CHIPH / 2, 22, qo);
      out += MK.pill(FB_STATUS[0], FB_STATUS[1], "read it again, slowly", on(t, cAgain1, 0.4), { size: 22, col: P.gold });
    }
    /* "take that one away" */
    var ao = on(t, cAway, 0.4) * fbOnly(t, scene, 2);
    if (ao > 0) out += MK.pill(FB_STATUS[0], FB_STATUS[1], "one forward too many", ao, { size: 22, col: P.bad, ink: P.bad });
    /* "programmers do this all day" */
    var do2 = on(t, cAllDay, 0.4);
    if (do2 > 0) out += MK.pill(FB_STATUS[0], FB_STATUS[1], "test it, change it, test it again", do2, { size: 22, col: P.good });
    /* Go, pressed once each time round */
    out += fbGoBtn(880, 190, 196, 70, 1, at == null ? 0 : bump(t, at - 0.3, 0.5));
    out += MK.ripple(978, 225, t, at == null ? null : at - 0.3, P.teal);
    return svg(out);
  }

  /* ==== what you now know ========================================================
     The four instructions, the program, the prediction and the fix, each lit as
     it is said. The icons are the lesson's own word-card pictures. */
  var FB_RECAP = MK.recapKind([
    { beat: 0, at: "forward", title: "Forward", sub: "one square the way you face", pic: "⬆️" },
    { beat: 0, at: "back", title: "Backwards", sub: "one square the other way", pic: "⬇️" },
    { beat: 0, at: "turns", title: "Turn left, turn right", sub: "spin; stay on the square", pic: "\u{1F504}" },
    { beat: 1, at: "program", title: "A program", sub: "a list Robo runs in order", pic: "\u{1F4DD}" },
    { beat: 2, at: "predict", title: "Predict", sub: "say where it will stop", pic: "\u{1F52E}" },
    { beat: 2, at: "fix", title: "Test and fix", sub: "press Go, change, Go again", pic: "\u{1F527}" }
  ], { goBeat: 2, goAt: "fix" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Forward, backwards, left and right", "Building a program for Robo", "Predicting where Robo will stop"] }),
    four: fbFourChapter, robo: fbRoboChapter, turn: fbTurnChapter,
    program: fbProgramChapter, predict: fbPredictChapter, fix: fbFixChapter,
    recap: FB_RECAP
  };
