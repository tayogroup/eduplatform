  /* ==== Programs with Loops, part 2 ==========================================
     The two chapters where a program is actually run: building one from an
     algorithm that says how many times, and folding a long one into a short
     one. Both end states come from ART.run on the lesson's own stage, so the
     cat's square and its size are the kit's arithmetic and not this film's.
     Worked out once, here, rather than inside a draw function a render calls
     for thousands of frames (the adapter's header says why). */

  var PL_BUILD_PROG = ["home", "repeat3", "right", "grow"];
  var PL_BUILD_END = ART.run("\u{1F431}", PL_BUILD_PROG, { start: { x: 2 } })[0];
  var PL_FOLD_END = ART.run("\u{1F431}", ["repeat3", "grow"])[0];
  var PL_LONG_END = ART.run("\u{1F431}", ["grow", "grow", "grow", "wait", "say"])[0];

  /* ==== chapter: build it from the algorithm ==================================
     The lesson's own round: "Go home, move right 3 times, grow". The algorithm
     is read on the left, the three-move mistake is shown and put right in the
     middle, the four blocks are built, and the cat runs them on the stage. */
  var PL_BA = { x: 40, w: 312, h: 64, y0: 124, gap: 14 };
  var PL_BP = { x: 400, w: 300, h: 54, y0: 104, gap: 12 };
  var PL_BS = { x: 724, y: 88, w: 420, h: 282, groundY: 330 };
  var PL_SQ = { x: 790, dx: 84, y: 306, w: 62, h: 30 };
  var PL_ALGO = ["go home", "move right 3 times", "grow"];

  function plBaY(k) { return PL_BA.y0 + k * (PL_BA.h + PL_BA.gap); }
  function plBpY(k) { return PL_BP.y0 + k * (PL_BP.h + PL_BP.gap); }
  function plSqX(k) { return PL_SQ.x + k * PL_SQ.dx; }

  function plAlgoRow(k, text, o, col) {
    if (!(o > 0)) return "";
    var y = plBaY(k);
    return G(R(PL_BA.x, y, PL_BA.w, PL_BA.h, 14, P.cell, col || P.line, col ? 4 : 2) +
      C(PL_BA.x + 30, y + PL_BA.h / 2, 18, P.card, col || P.line, 2) +
      Tx(PL_BA.x + 30, y + PL_BA.h / 2 + 8, String(k + 1), "lab", "middle", { "font-size": 22, fill: col || P.muted }) +
      Tx(PL_BA.x + 60, y + PL_BA.h / 2 + 9, text, "lab", "start", { "font-size": 24 }),
      { opacity: clamp(o, 0, 1), transform: around(PL_BA.x + PL_BA.w / 2, y + PL_BA.h / 2, plPop(o)) });
  }

  function plBuildChapter(scene, beat, t, i) {
    var cHome = sc(scene, 0, "home"), cRight = sc(scene, 0, "right"), cGrow = sc(scene, 0, "grow");
    var cNot = sc(scene, 1, "notthree"), cOne = sc(scene, 1, "oneeach");
    var cFour = sc(scene, 2, "four"), cProg = sc(scene, 2, "prog");
    var cRun = sc(scene, 3, "run"), cHomeBlk = sc(scene, 3, "homeblk"), cEach = sc(scene, 3, "each");
    var cThree = sc(scene, 4, "three"), cGrows = sc(scene, 4, "grows"), cOut = sc(scene, 4, "output");
    var out = "";

    /* ---- the algorithm, read one line at a time */
    out += R(24, 70, 344, 296, 18, P.card, P.line, 2);
    out += MK.pill(40, 92, "Algorithm", on(t, cHome, 0.4), { size: 22, anchor: "start", col: P.gold, ink: P.gold });
    var algoAt = [cHome, cRight, cGrow];
    for (var a = 0; a < 3; a++)
      out += plAlgoRow(a, PL_ALGO[a], popIn(t, algoAt[a], 0.45),
        a === 1 && plPast(t, cRight) && !plPast(t, cFour) ? P.gold : null);

    /* ---- the stage: the cat starts away from home, and the run brings it back */
    var homeU = on(t, cHomeBlk, 0.55);
    var stepU = cEach == null || t < cEach ? 0 : clamp((t - cEach) / 1.8, 0, 1);
    var sq = stepU * 3, idx = Math.min(3, Math.floor(sq));
    var walked = Math.min(3, idx + ease(clamp((sq - idx) / 0.7, 0, 1)));
    var pos = plPast(t, cEach) ? walked : lerp(2, 0, homeU);
    var scale = lerp(1, PL_BUILD_END.scale, on(t, cGrows, 0.6));

    out += plStagePanel(PL_BS, 1);
    for (var s = 0; s < 4; s++) {
      var lit = plPast(t, cEach) && s >= 1 && pos >= s - 0.03;
      out += R(plSqX(s) - PL_SQ.w / 2, PL_SQ.y, PL_SQ.w, PL_SQ.h, 8, lit ? P.gold : P.cell,
        s === 0 && homeU > 0.5 ? P.good : P.line, 2);
      out += Tx(plSqX(s), 362, s === 0 ? "home" : String(s), "lab mid muted", "middle");
      if (lit) out += R(plSqX(s) - PL_SQ.w / 2 - 7, PL_SQ.y - 7, PL_SQ.w + 14, PL_SQ.h + 14, 12,
        "none", P.gold, 3, { opacity: on(t, cThree, 0.5) });
    }
    out += MK.ripple(plSqX(0), PL_SQ.y + PL_SQ.h / 2, t, cHomeBlk, P.good);
    out += plCat(lerp(plSqX(0), plSqX(1), pos), PL_BS.groundY - 8, scale, 0, 1, 74);
    out += MK.pill(934, 118, "Run", bump(t, cRun, 1.4), { size: 22, col: P.good, ink: P.good });
    out += MK.pill(1060, 118, "output", on(t, cOut, 0.5), { size: 20, col: P.gold, ink: P.gold });
    out += MK.tick(952, 118, 26, popIn(t, cOut, 0.45));

    /* ---- the middle column: the mistake, then the program */
    var made = 1 - into(t, scene.first + 2);
    if (made > 0) {
      /* A hard cut, not a crossfade: "move right" (wrong) and "repeat 3 times"
         (fixed) are two different labels in the same slot, and fading one
         into the other alpha-blends both texts into a smudge for half a
         second (the note this chapter was revised for). */
      var wrong = "", right3 = plPast(t, cOne) ? 0 : popIn(t, cNot, 0.5), fixed = popIn(t, cOne, 0.5);
      for (var w = 0; w < 3; w++)
        wrong += plBlock(PL_BP.x, plBpY(w), PL_BP.w, PL_BP.h, "right", { o: right3 });
      wrong += MK.cross(690, 92, 26, right3);
      wrong += plBlock(PL_BP.x, plBpY(0), PL_BP.w, PL_BP.h, "repeat3", { o: fixed, col: P.good });
      wrong += plBlock(PL_BP.x, plBpY(1), PL_BP.w, PL_BP.h, "right", { o: fixed, col: P.good });
      wrong += MK.tick(690, 92, 26, fixed);
      out += G(wrong, { opacity: made });
    }
    var shown = 1 - made;
    if (shown > 0) {
      var prog = "";
      prog += MK.pill(400, 80, "Program", on(t, cFour, 0.4), { size: 22, anchor: "start", col: P.gold, ink: P.gold });
      prog += MK.pill(700, 80, "4 blocks", popIn(t, cFour, 0.45), { size: 20, anchor: "end", col: P.good, ink: P.good });
      var built = tally(t, cProg, 4, 1.4);
      var runAt = [cHomeBlk, cEach, cEach, cGrows];
      for (var b = 0; b < 4; b++) {
        if (b >= built) { prog += plSlot(PL_BP.x, plBpY(b), PL_BP.w, PL_BP.h, on(t, cFour, 0.4)); continue; }
        var live = plPast(t, runAt[b]) && (b === 3 || !plPast(t, runAt[b + 1]));
        prog += plBlock(PL_BP.x, plBpY(b), PL_BP.w, PL_BP.h, PL_BUILD_PROG[b], { o: 1, col: live ? P.gold : null });
      }
      prog += plLoop(710, plBpY(2) + 6, plBpY(2) + PL_BP.h - 6, on(t, cEach, 0.5) * 0.9, P.gold);
      out += G(prog, { opacity: shown });
    }
    return svg(out);
  }

  /* ==== chapter: folding a program ============================================
     The lesson's own round: grow, grow, grow, wait, say hello becomes
     repeat 3 times, grow, say hello. The cat on the right shows that the
     output did not change - its size is the kit's, capped at 2.2 - and the
     last beat is the pair the lesson warns about: only the same block folds. */
  var PL_FL = { x: 40, w: 280, h: 52, y0: 104, gap: 10 };
  var PL_FR = { x: 470, w: 280, h: 52, y0: 166, gap: 10 };
  var PL_FS = { x: 816, y: 100, w: 324, h: 270, groundY: 330 };
  var PL_LONG = ["grow", "grow", "grow", "wait", "say"];
  var PL_SHORT = ["repeat3", "grow", "say"];
  function plFlY(k) { return PL_FL.y0 + k * (PL_FL.h + PL_FL.gap); }
  function plFrY(k) { return PL_FR.y0 + k * (PL_FR.h + PL_FR.gap); }

  function plFoldMain(scene, t) {
    var cLonger = sc(scene, 0, "longer"), cGrows = sc(scene, 0, "grows"),
      cWait = sc(scene, 0, "wait"), cSay = sc(scene, 0, "say");
    var cSame = sc(scene, 1, "same"), cFold = sc(scene, 1, "fold");
    var cFolded = sc(scene, 2, "folded"), cOut = sc(scene, 2, "output");
    var cWaitGo = sc(scene, 3, "waitgo"), cCount = sc(scene, 3, "count");
    var out = "", count = on(t, cCount, 0.5);

    /* the long program */
    out += R(26, 92, 308, 322, 16, P.card, P.line, 2);
    out += MK.pill(180, 70, "Program", on(t, cLonger, 0.4) * (1 - count), { size: 22, col: P.gold, ink: P.gold });
    out += MK.pill(180, 70, "5 blocks", count, { size: 22, col: P.gold, ink: P.gold });
    var grown = tally(t, cGrows, 3, 0.9), gone = on(t, cWaitGo, 0.5);
    var brace = on(t, cSame, 0.55);
    for (var k = 0; k < 5; k++) {
      var o = k < 3 ? (k < grown ? 1 : 0) : k === 3 ? on(t, cWait, 0.4) * (1 - gone * 0.75) : on(t, cSay, 0.4);
      out += plBlock(PL_FL.x, plFlY(k), PL_FL.w, PL_FL.h, PL_LONG[k], {
        o: o, col: k < 3 && brace > 0.4 ? P.gold : null, dim: k === 3 && gone > 0.4
      });
    }
    out += MK.cross(PL_FL.x + PL_FL.w - 26, plFlY(3) + PL_FL.h / 2, 22, popIn(t, cWaitGo, 0.4));
    out += plLoop(330, plFlY(0) + 6, plFlY(2) + PL_FL.h - 6, brace, P.gold);
    out += MK.arrow(392, 240, 452, 240, on(t, cFold, 0.5), P.gold, 9);

    /* the folded program */
    var fold = on(t, cFold, 0.5);
    if (fold > 0) {
      var right = R(456, 154, 308, 200, 16, P.card, P.line, 2);
      right += MK.pill(610, 134, "Folded", (1 - count), { size: 22, col: P.good, ink: P.good });
      right += MK.pill(610, 134, "3 blocks", count, { size: 22, col: P.good, ink: P.good });
      var made = tally(t, cFold, 3, 0.9);
      for (var r = 0; r < 3; r++)
        right += plBlock(PL_FR.x, plFrY(r), PL_FR.w, PL_FR.h, PL_SHORT[r],
          { o: r < made ? 1 : 0, col: r < 2 && plPast(t, cFolded) ? P.gold : null });
      right += plLoop(758, plFrY(1) + 6, plFrY(1) + PL_FR.h - 6, on(t, cFolded, 0.5), P.gold);
      out += G(right, { opacity: fold });
    }

    /* the output: the kit's own end state for repeat 3 times, grow */
    var show = on(t, cOut, 0.6);
    out += plStagePanel(PL_FS, on(t, cLonger, 0.5));
    out += plCat(920, PL_FS.groundY, lerp(1, PL_FOLD_END.scale, show), 0, on(t, cLonger, 0.5));
    if (show > 0.01) out += MK.bubble(988, 118, 150, 56, "Hello!", show, 972, 196);
    out += MK.tick(864, 142, 26, popIn(t, cOut == null ? null : cOut + 0.4, 0.4));
    out += MK.pill(978, 352, "same output", show, { size: 20, col: P.good, ink: P.good });
    return out;
  }

  /* the last beat: only the same block, back to back, folds */
  var PL_TRIO = { h: 58, y0: 118, gap: 14 };
  function plTrioY(k) { return PL_TRIO.y0 + k * (PL_TRIO.h + PL_TRIO.gap); }
  function plFoldPair(scene, t) {
    var cOnly = sc(scene, 4, "only"), cCannot = sc(scene, 4, "cannot");
    var ok = popIn(t, cOnly, 0.45), no = Math.max(on(t, cOnly, 0.5) * 0.5, popIn(t, cCannot, 0.45));
    var out = "";
    ["jump", "jump", "jump"].forEach(function (id, k) {
      out += plBlock(140, plTrioY(k), 260, PL_TRIO.h, id, { o: ok, col: P.good });
    });
    ["jump", "spin", "jump"].forEach(function (id, k) {
      out += plBlock(700, plTrioY(k), 260, PL_TRIO.h, id, { o: no, col: k === 1 && no > 0.7 ? P.bad : null });
    });
    out += plLoop(410, plTrioY(0) + 6, plTrioY(2) + PL_TRIO.h - 6, ok, P.good);
    out += MK.pill(270, 76, "the same block", ok, { size: 21, col: P.good, ink: P.good });
    out += MK.pill(830, 76, "not the same", popIn(t, cCannot, 0.4), { size: 21, col: P.bad, ink: P.bad });
    out += MK.tick(490, 218, 30, ok);
    out += MK.cross(1020, 218, 30, popIn(t, cCannot, 0.45));
    out += MK.pill(270, 372, "repeat 3 times, jump", ok, { size: 21, col: P.good, ink: P.ink });
    out += MK.pill(830, 372, "cannot fold", popIn(t, cCannot, 0.4), { size: 21, col: P.bad, ink: P.ink });
    return out;
  }

  function plFoldChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(plFoldMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(plFoldPair(scene, t), { opacity: u });
    return svg(out);
  }
