  /* ==== Loops in Algorithms, part 3: the bug inside, concise, the third kind ==
     tools/lib/film-scenes/computing-g4/loops-in-algorithms-3.js. See the
     header of loops-in-algorithms.js.

     The wrong step is the lesson's own - "Tip the can upside down", inside a
     repeat 3 - and its consequence is the lesson's own too: every plant gets
     watered and then the water goes on the floor, three turns, three times.
     The nine and the twelve steps of the last chapter are written out by
     ART.algo.expandLoop, so the film's arithmetic is the kit's. */

  /* ==== chapter: a wrong step inside ========================================
     The lesson's "Correct the loop" round: get the can, repeat 3 times [fill,
     pour, tip the can upside down], put the can away. Tap the step, change it
     to "Walk to the next plant", and all three turns are fixed at once. */
  var LP_BUG_BLOCKS = [
    { id: "can" },
    { kind: "repeat", times: 3, body: [{ id: "fill" }, { id: "pour" }, { id: "tip" }] },
    { id: "away" }
  ];
  var LP_BUG_FLAT = ART.algo.flatten(LP_BUG_BLOCKS);
  var LP_BUG_TURNS = LP_BUG_BLOCKS[1].times;
  var LP_BUG_BODY = LP_BUG_FLAT.filter(function (s) { return s.j >= 0; });

  function lpInsideChapter(scene, beat, t, i) {
    var cOutside = sc(scene, 0, "outside"), cOnce = sc(scene, 0, "once"), cEvery0 = sc(scene, 0, "every");
    var cRepeat = sc(scene, 1, "repeat"), cFill = sc(scene, 1, "fill"),
      cPour = sc(scene, 1, "pour"), cTip = sc(scene, 1, "tip");
    var cFloor = sc(scene, 2, "floor"), cEvery = sc(scene, 2, "every");
    var cChange = sc(scene, 3, "change"), cWalk = sc(scene, 3, "walk");
    var cFix = sc(scene, 4, "fix"), cAll = sc(scene, 4, "all");
    var out = "", bodyAt = [cFill, cPour, cTip];

    var mended = lpPast(t, cWalk);
    var body = ["fill", "pour", mended ? "walk" : "tip"];
    /* two runs of the same loop, both unrolled by the lesson: the wrong one,
       which waters every plant AND empties the can on the floor every turn, and
       then the mended one, which clears one spill per turn and ticks it. */
    var fixing = lpPast(t, cFix);
    var runAt = fixing ? cFix : lpPast(t, cFloor) ? cFloor : null;
    var done = runAt == null ? 0 : tally(t, runAt, LP_BUG_BODY.length, fixing ? 2.2 : 2.6);
    var step = done > 0 ? LP_BUG_BODY[done - 1] : null;
    var turn = step ? step.t : 0;
    var reached = Math.min(LP_BUG_TURNS, Math.floor((done + 1) / 3));
    /* before the loop is run, beat 1 reads the three steps out one at a time.
       The tap alone is over in under a second, so the row the voice is on
       stays lit until the next one is named. */
    var named = step ? -1 : lpPast(t, cTip) ? 2 : lpPast(t, cPour) ? 1 : lpPast(t, cFill) ? 0 : -1;
    var watered = fixing || mended ? LP_BUG_TURNS : reached;
    var ticked = fixing ? reached : 0;                    /* a wrong turn never ticks */
    var spilt = fixing ? LP_BUG_TURNS - reached : mended ? LP_BUG_TURNS : Math.floor(done / 3);

    /* the algorithm */
    out += lpRow(LP_LOOP.x, LP_LOOP_Y.can, LP_LOOP.w, LP_LOOP.rowH, 1, "can", { o: 1 });
    out += lpBox(LP_LOOP.x, LP_LOOP_Y.box, LP_LOOP.w, 3, LP_LOOP.bodyH, LP_LOOP.bodyGap,
      { kind: "repeat", times: LP_BUG_TURNS, turn: turn || null, col: mended ? P.good : P.plum });
    body.forEach(function (id, k) {
      var by = lpBoxTop(LP_LOOP_Y.box, k, LP_LOOP.bodyH, LP_LOOP.bodyGap);
      var wrong = id === "tip" && lpPast(t, cTip);
      var live = step ? step.j === k : named === k;
      if (id === "walk") {
        var grew = on(t, cWalk, 0.5);
        out += G(lpRow(LP_BODY_X, by, LP_BODY_W, LP_LOOP.bodyH, k + 2, "walk",
          { o: grew, col: P.good, fill: live ? "#1B3A52" : null }),
          { transform: around(LP_BODY_X + LP_BODY_W / 2, by + LP_LOOP.bodyH / 2, 0.74 + 0.26 * grew) });
      } else {
        out += lpRow(LP_BODY_X, by, LP_BODY_W, LP_LOOP.bodyH, k + 2, id,
          { o: 1, col: wrong ? P.bad : live ? P.gold : null,
            fill: live ? "#1B3A52" : wrong ? "#3A2530" : null,
            mark: wrong ? "bug" : null, markP: popIn(t, cTip, 0.4) });
      }
      out += MK.ripple(LP_BODY_X + 40, by + LP_LOOP.bodyH / 2, t, bodyAt[k], P.plum);
    });
    /* the step that is on its way out */
    var gone = on(t, cChange, 0.6);
    if (!mended && gone > 0) {
      var ty = lpBoxTop(LP_LOOP_Y.box, 2, LP_LOOP.bodyH, LP_LOOP.bodyGap);
      out += G(lpSlot(LP_BODY_X, ty, LP_BODY_W, LP_LOOP.bodyH, 4, gone), { opacity: gone });
    }
    out += lpRow(LP_LOOP.x, LP_LOOP_Y.away, LP_LOOP.w, LP_LOOP.rowH, 5, "away", { o: 1 });

    /* outside the loop: once. inside it: every turn. Both badges sit on the
       rows they are about, inside the panel: the plants own everything to the
       right of it, and a badge in the gutter landed on the ground. */
    out += MK.pill(LP_LOOP.x + LP_LOOP.w - 76, LP_LOOP_Y.away + LP_LOOP.rowH / 2, "just once",
      on(t, cOutside, 0.5), { size: 20, col: P.muted, ink: P.muted });
    out += MK.pill(LP_LOOP.x + LP_LOOP.w - 80, LP_LOOP_Y.box + LP_HEAD / 2, "every turn",
      on(t, cEvery0, 0.5), { size: 20, col: mended ? P.good : P.bad, ink: mended ? P.good : P.bad });
    if (bump(t, cOnce, 1.4) > 0.02)
      out += R(LP_LOOP.x - 5, LP_LOOP_Y.away - 5, LP_LOOP.w + 10, LP_LOOP.rowH + 10, 22, "none",
        P.ink, 3, { opacity: bump(t, cOnce, 1.4) });
    if (bump(t, cRepeat, 1.6) > 0.02)
      out += R(LP_LOOP.x - 6, LP_LOOP_Y.box - 6, LP_LOOP.w + 12,
        lpBoxH(3, LP_LOOP.bodyH, LP_LOOP.bodyGap) + 12, 24, "none", P.ink, 3,
        { opacity: bump(t, cRepeat, 1.6) });

    /* the plants: watered on every turn, and then the floor is watered too */
    var canAt = done > 0 ? clamp((done - 1) / 3, 0, 2) : null;
    out += lpPlants(watered, ticked, spilt, t,
      { canAt: canAt, tipped: !mended && step && step.id === "tip",
        pour: step && step.id === "pour" ? 1 : 0 });
    out += MK.pill(888, 46, "water on the floor, every turn",
      on(t, cEvery, 0.5) * (1 - on(t, cChange, 0.5)), { size: 22, col: P.bad, ink: P.bad });
    out += MK.pill(888, 46, "all three turns fixed", on(t, cAll, 0.5),
      { size: 22, col: P.good, ink: P.good });
    return svg(out);
  }

  /* ==== chapter: written once ===============================================
     The lesson's own comparison: fill, pour, walk, three times over is nine
     steps written out; repeat 3 times with those three inside is three steps
     and a count. Both lists come from ART.algo.expandLoop, so changing the
     count to four adds exactly the three steps the lesson says it does. */
  var LP_SHORT = { fill: "Fill", pour: "Pour", walk: "Walk" };
  var LP_LONG3 = ART.algo.expandLoop([], ["fill", "pour", "walk"], 3, []);
  var LP_LONG4 = ART.algo.expandLoop([], ["fill", "pour", "walk"], 4, []);
  var LP_GRID = { x: 40, y: 58, cw: 150, ch: 84, gap: 12, rowGap: 8, cols: 3 };
  var LP_CB = { x: 580, y: 48, w: 520, rowH: 56, gap: 9 };

  function lpChip(k, id, o, col) {
    if (!(o > 0)) return "";
    var x = LP_GRID.x + (k % LP_GRID.cols) * (LP_GRID.cw + LP_GRID.gap);
    var y = LP_GRID.y + Math.floor(k / LP_GRID.cols) * (LP_GRID.ch + LP_GRID.rowGap);
    var st = LP_STEP[id];
    return G(R(x, y, LP_GRID.cw, LP_GRID.ch, 18, P.cell, col || P.line, col ? 3 : 2) +
      Tx(x + 16, y + 26, String(k + 1), "lab small muted", "start") +
      lpPic(x + LP_GRID.cw / 2, y + 40, 36, st) +
      Tx(x + LP_GRID.cw / 2, y + 72, LP_SHORT[id] || st.label, "lab mid", "middle"),
      { transform: around(x + LP_GRID.cw / 2, y + LP_GRID.ch / 2, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }
  function lpGridSlot(k, o) {
    if (!(o > 0)) return "";
    var x = LP_GRID.x + (k % LP_GRID.cols) * (LP_GRID.cw + LP_GRID.gap);
    var y = LP_GRID.y + Math.floor(k / LP_GRID.cols) * (LP_GRID.ch + LP_GRID.rowGap);
    return R(x, y, LP_GRID.cw, LP_GRID.ch, 18, P.card, P.line, 2,
      { "stroke-dasharray": "10 8", opacity: clamp(o, 0, 1) });
  }

  function lpConciseChapter(scene, beat, t, i) {
    var cThree = sc(scene, 0, "three"), cNine = sc(scene, 0, "nine");
    var cRepeat = sc(scene, 1, "repeat"), cSteps = sc(scene, 1, "steps");
    var cRead = sc(scene, 2, "read"), cWrite = sc(scene, 2, "write"), cOnce = sc(scene, 2, "once");
    var cFour = sc(scene, 3, "four"), cChange = sc(scene, 3, "change");
    var cAdd = sc(scene, 4, "add"), cConcise = sc(scene, 4, "concise");
    var out = "";

    var times = lpPast(t, cChange) ? 4 : 3;
    var longList = times === 4 ? LP_LONG4 : LP_LONG3;
    var grown = LP_LONG3.length + tally(t, cAdd, LP_LONG4.length - LP_LONG3.length, 0.9);
    var shown = lpPast(t, cAdd) ? Math.max(LP_LONG3.length, grown) : tally(t, cThree, LP_LONG3.length, 2.2);

    /* written out long */
    out += MK.pill(277, 26, times === 4 && lpPast(t, cAdd) ? "twelve steps written out" : "nine steps written out",
      on(t, cThree, 0.5), { size: 24, col: P.bad, ink: P.bad });
    longList.forEach(function (id, k) {
      if (k >= shown) return;
      out += lpChip(k, id, 1, k >= LP_LONG3.length ? P.bad : null);
    });
    /* the three that a bigger count would add */
    if (!lpPast(t, cAdd)) for (var s = LP_LONG3.length; s < LP_LONG4.length; s++)
      out += lpGridSlot(s, on(t, cChange, 0.5));

    /* with a loop */
    var boxH = lpBoxH(3, LP_CB.rowH, LP_CB.gap);
    out += MK.pill(840, 26, "three steps and a count", on(t, cSteps, 0.5),
      { size: 24, col: P.good, ink: P.good });
    out += lpBox(LP_CB.x, LP_CB.y, LP_CB.w, 3, LP_CB.rowH, LP_CB.gap,
      { o: on(t, cRepeat, 0.5), kind: "repeat", times: times,
        col: bump(t, cChange, 1.6) > 0.05 ? P.ink : P.good });
    ["fill", "pour", "walk"].forEach(function (id, k) {
      out += lpRow(LP_CB.x + 24, lpBoxTop(LP_CB.y, k, LP_CB.rowH, LP_CB.gap), LP_CB.w - 48,
        LP_CB.rowH, k + 1, id, { o: on(t, cRepeat, 0.5) });
    });
    if (lpPast(t, cConcise))
      out += R(LP_CB.x - 7, LP_CB.y - 7, LP_CB.w + 14, boxH + 14, 26, "none", P.good, 3,
        { opacity: on(t, cConcise, 0.5) });

    /* why it is better, in the lesson's own two reasons */
    out += MK.list(LP_CB.x + 6, LP_CB.y + boxH + 32, [
      { text: "shorter to read", at: cRead, mark: "tick" },
      { text: "shorter to write", at: cWrite, mark: "tick" }
    ], t, { lh: 40, cls: "lab", markR: 15 });
    out += MK.pill(840, LP_CB.y + boxH + 118, "a loop is concise", on(t, cConcise, 0.5),
      { size: 24, col: P.good, ink: P.good });
    if (bump(t, cOnce, 1.6) > 0.02)
      out += MK.glow(840, LP_CB.y + boxH / 2, 155, P.good, bump(t, cOnce, 1.6) * 0.7);
    if (bump(t, cFour, 1.6) > 0.02)
      out += MK.glow(277, 236, 186, P.bad, bump(t, cFour, 1.6) * 0.5);
    if (bump(t, cNine, 1.4) > 0.02)
      out += R(LP_GRID.x - 6, LP_GRID.y - 6, LP_GRID.cols * LP_GRID.cw + (LP_GRID.cols - 1) * LP_GRID.gap + 12,
        3 * LP_GRID.ch + 2 * LP_GRID.rowGap + 12, 22, "none", P.ink, 3, { opacity: bump(t, cNine, 1.4) });
    return svg(out);
  }

  /* ==== chapter: a third kind of loop =======================================
     The lesson's closing lecture part: the one the child has not met, between
     the two the film has just taught. Count-controlled stops after a number,
     condition-controlled when something happens, forever not at all. */
  var LP_KINDS = [
    { pic: "4️⃣", title: "count-controlled", sub: "it counts its turns", stop: "stops after a number", col: P.blue },
    { pic: "⏳", title: "condition-controlled", sub: "no count, but it has an end", stop: "stops when something happens", col: P.gold },
    { pic: "♾️", title: "forever", sub: "no count at all", stop: "never stops", col: P.accent }
  ];
  var LP_KC = { w: 340, h: 330, gap: 36, y: 40 };
  function lpKindX(k) { return (1168 - 3 * LP_KC.w - 2 * LP_KC.gap) / 2 + k * (LP_KC.w + LP_KC.gap); }

  function lpThirdChapter(scene, beat, t, i) {
    var cThird = sc(scene, 0, "third"), cScratch = sc(scene, 0, "scratch");
    var cCond = sc(scene, 1, "cond"), cNoCount = sc(scene, 1, "nocount"), cEnd = sc(scene, 1, "end");
    var cTrue = sc(scene, 2, "true"), cArrow = sc(scene, 2, "arrow");
    var cNumber = sc(scene, 3, "number"), cHappens = sc(scene, 3, "happens"), cNever = sc(scene, 3, "never");
    var out = "", known = on(t, cThird, 0.5), filled = on(t, cCond, 0.5);
    var stopAt = [cNumber, cHappens, cNever];

    LP_KINDS.forEach(function (c, k) {
      var x = lpKindX(k), mid = k === 1;
      var live = mid ? filled : known;
      var lit = lpPast(t, stopAt[k]);
      out += G(R(x, LP_KC.y, LP_KC.w, LP_KC.h, 26, lit ? "#1B3A52" : P.cell, lit ? c.col : P.line, lit ? 3.5 : 2.5),
        { opacity: 0.35 + 0.65 * (mid ? Math.max(popIn(t, cThird, 0.4) * 0.6, live) : live) });
      if (mid && filled < 1) out += MK.qmark(x + LP_KC.w / 2, LP_KC.y + 130, 56, popIn(t, cThird, 0.45) * (1 - filled));
      var body = Em(x + LP_KC.w / 2, LP_KC.y + 108, 84, c.pic) +
        Tx(x + LP_KC.w / 2, LP_KC.y + 196, c.title, "lab big", "middle", { fill: c.col }) +
        Tx(x + LP_KC.w / 2, LP_KC.y + 238, c.sub, "lab mid muted readable", "middle");
      out += G(body, { opacity: mid ? filled : known });
      out += Tx(x + LP_KC.w / 2, 410, c.stop, "lab", "middle",
        { fill: lit ? c.col : P.muted, opacity: (0.35 + 0.65 * on(t, stopAt[k], 0.4)).toFixed(3) });
    });

    /* the middle card: what it waits for, all of it inside the card */
    var mx = lpKindX(1) + LP_KC.w / 2, my = LP_KC.y + 286;
    out += MK.pill(mx, my, "waiting for you in Scratch", on(t, cScratch, 0.5) * (1 - filled),
      { size: 21, col: P.gold, ink: P.gold });
    /* the count it has not got, crossed out */
    out += lpCounter(lpKindX(1) + 70, my, 32, null, 0, on(t, cNoCount, 0.45), { label: "" });
    out += MK.cross(lpKindX(1) + 70, my, 21, popIn(t, cNoCount, 0.4));
    /* but it does have an end */
    out += MK.tick(lpKindX(1) + LP_KC.w - 70, my, 24, popIn(t, cEnd, 0.4));
    /* repeat until the down arrow is pressed */
    var key = on(t, cTrue, 0.5);
    if (key > 0) {
      out += G(R(mx - 44, my - 28, 88, 56, 14, P.card, lpPast(t, cArrow) ? P.gold : P.line, 3) +
        Em(mx, my, 34, "⬇️"), { opacity: key });
      out += MK.ripple(mx, my, t, cArrow, P.gold);
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------
     The lesson's own words, and its own pictures for them. */
  var LP_RECAP = MK.recapKind([
    { beat: 0, at: "loop", title: "Loop", sub: "steps that happen again and again", pic: "\u{1F501}" },
    { beat: 1, at: "cc", title: "Count-controlled", sub: "it goes round a set number of times", pic: "4️⃣" },
    { beat: 1, at: "counter", title: "Counter", sub: "it keeps count of the turns", pic: "\u{1F522}" },
    { beat: 2, at: "forever", title: "Forever", sub: "no count, so something must stop it", pic: "♾️" },
    { beat: 3, at: "concise", title: "Concise", sub: "written once, done many times", pic: "✂️" }
  ], { goBeat: 3, goAt: "once" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "What a repeat loop counts, and when it stops",
      "Why a forever loop needs a stop from outside",
      "Why writing the steps once makes an algorithm concise"
    ] }),
    loop: lpLoopChapter, count: lpCountChapter, forever: lpForeverChapter,
    inside: lpInsideChapter, concise: lpConciseChapter, third: lpThirdChapter,
    recap: LP_RECAP
  };
