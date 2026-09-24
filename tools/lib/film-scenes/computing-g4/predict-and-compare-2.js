  /* ==== Grade 4 Computing, Lesson 2: Predict and Compare, part 2 ==============
     tools/lib/film-scenes/computing-g4/predict-and-compare-2.js. The chapters
     "The stairs loop" and "Folding a repeat". See predict-and-compare.js for
     the shared drawings and for what this film borrows from the kit. */

  /* ==== chapter: the stairs loop ==================================================
     Loop 2 from the lesson: "repeat 3 times: forward, turn right, forward,
     turn left", walked square by square as the four instructions are named,
     then round twice more. The walk is ART.robo's, unrolled by
     ART.algo.expandLoop, so the staircase is the lesson's own. */
  var PC_S_BOX = { x: 56, y: 80, w: 420 };
  var PC_S_ROWS = [[PC_F, "Forward"], [PC_R, "Turn right"], [PC_F, "Forward"], [PC_L, "Turn left"]];

  /* the squares the walk stands on, in order, with no square twice over */
  var PC_TWO_PTS = (function () {
    var out = [];
    PC_TWO.forEach(function (s) {
      var last = out[out.length - 1];
      if (!last || last[0] !== s.c || last[1] !== s.r) out.push([s.c, s.r]);
    });
    return out;
  })();

  /* the staircase itself, drawn to u (0 -> 1) of its length */
  function pcStairPath(u) {
    if (!(u > 0)) return "";
    var pts = PC_TWO_PTS.map(function (p) { return [pcCX(p[0]), pcCY(p[1])]; });
    var total = polyLen(pts), want = total * clamp(u, 0, 1), d = "M" + n2(pts[0][0]) + "," + n2(pts[0][1]), run = 0;
    for (var k = 1; k < pts.length; k++) {
      var seg = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (run + seg <= want) { d += " L" + n2(pts[k][0]) + "," + n2(pts[k][1]); run += seg; continue; }
      var v = clamp((want - run) / seg, 0, 1);
      d += " L" + n2(lerp(pts[k - 1][0], pts[k][0], v)) + "," + n2(lerp(pts[k - 1][1], pts[k][1], v));
      break;
    }
    return Pth(d, null, P.gold, 9, { opacity: 0.45 });
  }

  function pcStairsChapter(scene, beat, t, i) {
    var cLoop2 = sc(scene, 0, "loop2"), cRepeat = sc(scene, 0, "repeat"),
      cF1 = sc(scene, 0, "f1"), cF2 = sc(scene, 0, "f2");
    var cTrack = sc(scene, 1, "track"), cTurn = sc(scene, 1, "turn");
    var cOnce = sc(scene, 2, "once"), cUp = sc(scene, 2, "up"), cRight = sc(scene, 2, "right"),
      cAlong = sc(scene, 2, "along"), cBack = sc(scene, 2, "back");
    var cStep = sc(scene, 3, "step"), cStairs = sc(scene, 3, "stairs");
    var cThree = sc(scene, 4, "three"), cSum = sc(scene, 4, "sum"), cSchool = sc(scene, 4, "school");
    var out = "";

    /* how far round the walk we are: four instructions, then twice more */
    var one = (on(t, cUp, 0.5) + on(t, cRight, 0.45) + on(t, cAlong, 0.5) + on(t, cBack, 0.45)) / 12;
    var u = Math.min(1, one + on(t, cThree, 1.1) * 8 / 12);
    var here = pcAt(PC_TWO, PC_TWO_A, u);

    out += pcGrid(on(t, cLoop2, 0.5));
    out += pcStairPath(on(t, cStairs, 0.9));
    out += pcTarget(3, 1, "\u{1F3EB}", on(t, cLoop2, 0.55));

    /* one up and one along: the first two moves of a time round */
    var stp = on(t, cStep, 0.5) * (1 - on(t, cStairs, 0.5));
    if (stp > 0) {
      out += MK.arrow(pcCX(0), pcCY(4) - 24, pcCX(0), pcCY(3) + 18, stp, P.good, 7);
      out += MK.arrow(pcCX(0) + 16, pcCY(3), pcCX(1) - 16, pcCY(3), stp, P.good, 7);
      out += MK.pill(690, pcCY(3) + 34, "1 up", stp, { size: 20, anchor: "end", col: P.good, ink: P.good });
      out += MK.pill(pcCX(1) - 6, pcCY(3) - 48, "1 along", stp, { size: 20, col: P.good, ink: P.good });
    }
    /* three up and three along, once the whole walk is done */
    var sum = on(t, cSum, 0.5);
    if (sum > 0) {
      out += L(692, pcCY(4), 692, pcCY(1), P.gold, 4, { "stroke-dasharray": "10 9", opacity: 0.85 * sum });
      out += L(pcCX(0), 32, pcCX(3), 32, P.gold, 4, { "stroke-dasharray": "10 9", opacity: 0.85 * sum });
      out += MK.pill(684, 250, "3 up", sum, { size: 20, anchor: "end", col: P.gold, ink: P.gold });
      out += MK.pill(958, 32, "3 along", sum, { size: 20, anchor: "start", col: P.gold, ink: P.gold });
    }

    out += pcRobo(here.x, here.y, here.a, on(t, cLoop2, 0.5));
    /* which way Robo faces */
    var face = bump(t, cTrack, 1.7);
    if (face > 0) out += C(here.x, here.y, 44 + 4 * breathe(t), "none", P.gold, 5, { opacity: 0.85 * face });

    /* the program: a repeat box of four instructions */
    out += MK.pill(PC_S_BOX.x + 4, 50, "Loop 2: stairs", on(t, cLoop2, 0.45), { size: 22, anchor: "start", col: P.line, ink: P.muted });
    out += pcLoopBox(PC_S_BOX.x, PC_S_BOX.y, PC_S_BOX.w, PC_S_ROWS, 3, {
      o: on(t, cRepeat, 0.45),
      rowO: function (k) { return k < 2 ? on(t, cF1, 0.45) : on(t, cF2, 0.45); },
      lit: function (k) {
        if (bump(t, cTurn, 1.6) > 0) return k === 1 || k === 2;          /* a turn, and the forward it changes */
        if (!pcPast(t, cOnce) || pcPast(t, cStep)) return false;
        return k === (pcPast(t, cBack) ? 3 : pcPast(t, cAlong) ? 2 : pcPast(t, cRight) ? 1 : 0);
      }
    });
    /* a turn changes the next forward: the turning arrows, beside Robo */
    var tn = bump(t, cTurn, 1.6);
    if (tn > 0) out += G(Pth("M" + n2(here.x + 52) + "," + n2(here.y - 30) +
      " a 52 52 0 0 1 0 60", null, P.gold, 7) +
      Pth("M" + n2(here.x + 44) + "," + n2(here.y + 18) + " L" + n2(here.x + 52) + "," + n2(here.y + 34) +
        " L" + n2(here.x + 62) + "," + n2(here.y + 18) + " Z", P.gold, P.gold, 2), { opacity: tn });
    /* one time round, ticked off as each instruction lands */
    out += MK.ripple(here.x, here.y, t, cOnce, P.gold);
    out += MK.tick(1108, 80, 26, popIn(t, cSchool, 0.4));
    return svg(out);
  }

  /* ==== chapter: folding a repeat =================================================
     The lesson's four pancakes. On the left the algorithm written out long:
     one mix, four identical rows of five, one serve - twenty-two slots that
     fill as they are said. On the right the same job written once inside
     "repeat 4 times": seven steps. Every label is the lesson's own. */
  var PC_PAN = [["\u{1F373}", "Pour batter in the pan"], ["\u{1F525}", "Cook one side"],
    ["\u{1F95E}", "Flip it"], ["\u{1F525}", "Cook the other side"], ["\u{1F37D}️", "Put it on the plate"]];
  var PC_MIX = ["\u{1F963}", "Mix the batter"], PC_SERVE = ["\u{1F60B}", "Serve them"];
  var PC_TILE = 52, PC_TPITCH = 62, PC_TX0 = 90, PC_ROWY = [92, 158, 224, 290];
  var PC_FOLD = { x: 620, w: 500, mixY: 48, boxY: 92, rowH: 36, headH: 38 };
  var PC_FOLD_H = pcLoopBoxH(PC_PAN, { headH: PC_FOLD.headH, rowH: PC_FOLD.rowH });

  function pcFoldChapter(scene, beat, t, i) {
    var cFour = sc(scene, 0, "four"), cLong = sc(scene, 0, "long"), cCount = sc(scene, 0, "count");
    var cMix = sc(scene, 1, "mix"), cFive = sc(scene, 1, "five");
    var cSame = sc(scene, 2, "same"), cEvery = sc(scene, 2, "every"), cTimes = sc(scene, 2, "times");
    var cOnce = sc(scene, 3, "once"), cLoop = sc(scene, 3, "loop"), cServe = sc(scene, 3, "serve");
    var cSeven = sc(scene, 4, "seven"), cConcise = sc(scene, 4, "concise");
    var cChange = sc(scene, 5, "change"), cAll = sc(scene, 5, "all");
    var out = "";

    /* ---- the long way, on the left ---- */
    var slots = on(t, cFour, 0.5), rows = tally(t, cEvery, 3, 0.9);
    out += pcSlot(PC_TX0 - 34, 26, PC_TILE, slots);
    out += pcTile(PC_TX0 - 34, 26, PC_TILE, PC_MIX[0], popIn(t, cMix, 0.4), P.line);
    out += pcSlot(PC_TX0 - 34, 358, PC_TILE, slots);
    out += pcTile(PC_TX0 - 34, 358, PC_TILE, PC_SERVE[0], popIn(t, cServe, 0.4), P.line);
    /* The change inside the loop reaches every pancake: the flip of each one.
       Both halves STAY lit once said, so the one row in the loop and the four
       tiles it changed are on the screen together. */
    var allP = on(t, cAll, 0.45);
    PC_ROWY.forEach(function (ry, r) {
      var filled = r === 0 ? popIn(t, cFive, 0.4) : r <= rows ? popIn(t, cEvery, 0.4) : 0;
      out += C(PC_TX0 - 56, ry + PC_TILE / 2, 15, P.card, pcPast(t, cTimes) ? P.gold : P.line, 2,
        { opacity: clamp(slots, 0, 1) });
      out += Tx(PC_TX0 - 56, ry + PC_TILE / 2 + 7, String(r + 1), "lab", "middle",
        { "font-size": 19, fill: pcPast(t, cTimes) ? P.gold : P.muted, opacity: clamp(slots, 0, 1) });
      PC_PAN.forEach(function (st, k) {
        var x = PC_TX0 + k * PC_TPITCH;
        out += pcSlot(x, ry, PC_TILE, slots);
        out += pcTile(x, ry, PC_TILE, st[0], k < 5 ? filled : 0, k === 2 && allP > 0.3 ? P.gold : P.line);
      });
    });
    /* the five steps that are the same every time */
    var same = on(t, cSame, 0.5) * (1 - on(t, cOnce, 0.5));
    if (same > 0) out += R(PC_TX0 - 8, PC_ROWY[0] - 8, 5 * PC_TPITCH - 2, PC_TILE + 16, 14, "none", P.gold, 4, { opacity: same });
    /* four times over: the bracket down the four rows */
    var four = on(t, cTimes, 0.5);
    if (four > 0) {
      out += Pth("M" + n2(PC_TX0 + 5 * PC_TPITCH - 4) + "," + n2(PC_ROWY[0] - 6) +
        " h 16 V " + n2(PC_ROWY[3] + PC_TILE + 6) + " h -16", null, P.gold, 4, { opacity: four });
      out += MK.pill(PC_TX0 + 5 * PC_TPITCH + 34, (PC_ROWY[0] + PC_ROWY[3] + PC_TILE) / 2, "× 4", four,
        { size: 22, anchor: "start", col: P.gold, ink: P.gold });
    }
    out += MK.pill(150, 52, "22 steps", popIn(t, cCount, 0.4) * (1 - 0.55 * on(t, cSeven, 0.5)),
      { size: 20, anchor: "start", col: P.line, ink: P.muted });
    /* written out long: the whole tall block flashes once */
    var lng = bump(t, cLong, 1.5);
    if (lng > 0) out += R(PC_TX0 - 40, 20, 5 * PC_TPITCH + 46, 396, 18, "none", P.accent, 4, { opacity: lng });

    /* ---- the same job, folded, on the right ---- */
    var fold = on(t, cOnce, 0.5);
    if (fold > 0) {
      out += MK.arrow(516, 216, 600, 216, on(t, cLoop, 0.6), P.gold, 8);
      out += pcRow(PC_FOLD.x, PC_FOLD.mixY, PC_FOLD.w, PC_FOLD.rowH, PC_MIX[0], PC_MIX[1], { o: fold });
      out += pcLoopBox(PC_FOLD.x, PC_FOLD.boxY, PC_FOLD.w, PC_PAN, 4, {
        o: fold, frameO: on(t, cLoop, 0.5), headH: PC_FOLD.headH, rowH: PC_FOLD.rowH,
        lit: function (k) { return k === 2 && pcPast(t, cChange); }
      });
      out += pcRow(PC_FOLD.x, PC_FOLD.boxY + PC_FOLD_H + 8, PC_FOLD.w, PC_FOLD.rowH,
        PC_SERVE[0], PC_SERVE[1], { o: on(t, cServe, 0.45) });
      out += MK.pill(PC_FOLD.x, 22, "7 steps", popIn(t, cSeven, 0.4), { size: 20, anchor: "start", col: P.good, ink: P.good });
      out += MK.pill(PC_FOLD.x + 150, 22, "concise", popIn(t, cConcise, 0.4), { size: 20, anchor: "start", col: P.good, ink: P.good });
    }
    return svg(out);
  }
