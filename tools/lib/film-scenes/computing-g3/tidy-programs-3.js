  /* ==== Tidy Programs, part 3: change the number, and test and debug ==========
     tools/lib/film-scenes/computing-g3/tidy-programs-3.js. See the header of
     tidy-programs.js. */

  /* The cat walking a numbered program, one block every 0.55 s. Where it ENDS
     is the kit's (ART.walkEnd, asked once as TP_END_A and TP_END_B); this only
     carries it between the squares on the way. */
  function tpWalkProg(t, at, prog, end) {
    if (at == null || t < at) return { x: 0, hop: 0, done: false };
    var u = (t - at) / 0.55, x = 0, hop = 0;
    if (u >= prog.length) return { x: end, hop: 0, done: true };
    for (var k = 0; k < prog.length; k++) {
      var b = prog[k], f = clamp(u - k, 0, 1);
      if (b.id === "right") x += b.n * f;
      else if (b.id === "left") x -= b.n * f;
      else if (b.id === "jump" && f > 0 && f < 1) hop = Math.max(hop, Math.sin(Math.PI * f));
    }
    return { x: x, hop: hop, done: false };
  }

  /* ==== chapter: change the number ================================================
     The lesson's number-changer round: the flower is on square 3, the program
     stops on square 2, and ONE number inside ONE block is changed. Both
     stopping places are the kit's own walk. */
  function tpNumberCard(scene, t, j) {
    var cStops = sc(scene, 1, "stops");
    var cThree = sc(scene, 3, "three"), cOnIt = sc(scene, 3, "onit");
    if (j === 0)
      return tpCardBox("The program", "the blocks are right", 1, { sub: "only a number is wrong" });
    if (j === 1)
      return tpCardBox("Run it", tpPast(t, cStops) ? "the cat stops on square " + TP_END_A : null, 1,
        { sub: "the flower is on square " + TP_TARGET, col: tpPast(t, cStops) ? P.bad : null,
          ink: tpPast(t, cStops) ? P.bad : null, mark: "cross", markP: popIn(t, cStops, 0.4) });
    if (j === 2)
      return tpCardBox("Change one number", "move right " + TP_PROG_A[0].n + " becomes move right " + TP_PROG_B[0].n,
        1, { sub: "and nothing else changes", col: P.gold });
    if (j === 3)
      return tpCardBox("Run it again", tpPast(t, cThree) ? "the cat stops on square " + TP_END_B : null, 1,
        { sub: tpPast(t, cOnIt) ? "right on the flower" : null, col: tpPast(t, cOnIt) ? P.good : null,
          ink: tpPast(t, cOnIt) ? P.good : null, mark: "tick", markP: popIn(t, cOnIt, 0.4) });
    return tpCardBox("What changed", "one number, inside one block", 1,
      { sub: "no block moved, and no block came out", col: P.good });
  }

  function tpNumberChapter(scene, beat, t, i) {
    var cBlocks = sc(scene, 0, "blocks"), cNumber = sc(scene, 0, "number");
    var cFlower = sc(scene, 1, "flower"), cProg = sc(scene, 1, "prog"), cStops = sc(scene, 1, "stops");
    var cChange = sc(scene, 2, "change"), cOne = sc(scene, 2, "one");
    var cRun = sc(scene, 3, "run"), cThree = sc(scene, 3, "three"), cOnIt = sc(scene, 3, "onit");
    var cNomove = sc(scene, 4, "nomove"), cInside = sc(scene, 4, "inside");
    var out = "";

    var prog = tpPast(t, cChange) ? TP_PROG_B : TP_PROG_A;
    var right = (tpPast(t, cNomove) || bump(t, cBlocks, 1.5) > 0.05) ? P.good : null;
    var chipX = TP_COL.x + TP_COL.w - TP_COL.h * 0.46;
    /* ONE block is rung at a time: the one the cat is carrying out */
    var runAt = !tpPast(t, cRun) ? (cProg == null ? null : cProg + 0.3) : cRun + 0.5;
    var active = runAt == null || t < runAt ? -1 : Math.floor((t - runAt) / 0.55);
    if (active > 2) active = -1;
    prog.forEach(function (b, k) {
      var y = tpColY(k, 3), first = k === 0;
      var dim = tpPast(t, cOne) && !first && !tpPast(t, cRun);
      out += tpBlock(TP_COL.x, y, TP_COL.w, TP_COL.h, b.id,
        { num: b.n, numCol: first && tpPast(t, cChange) ? P.gold : null, dimmed: dim,
          ring: right || (active === k ? P.gold : null) ||
            (first && tpPast(t, cChange) && !tpPast(t, cRun) ? P.gold : null) });
    });
    /* the one number that changes: a flash where it changed, and a light on it
       again when the last beat says it is the only thing that moved */
    var flash = bump(t, cChange, 0.9), lookAt = on(t, cInside, 0.5);
    var chipY = tpColY(0, 3) + TP_COL.h / 2;
    if (flash > 0) out += C(chipX, chipY, TP_COL.h * 0.30 + 12 * flash, "none", P.gold, 4, { opacity: flash });
    if (lookAt > 0) {
      out += MK.glow(chipX, chipY, 78, P.gold, lookAt);
      out += C(chipX, chipY, 26 + 4 * breathe(t), "none", P.gold, 4, { opacity: lookAt });
    }
    /* the numbers the child may change, pointed at once */
    var chips = on(t, cNumber, 0.5) * (1 - on(t, cFlower, 0.5));
    if (chips > 0) {
      prog.forEach(function (b, k) {
        out += C(chipX, tpColY(k, 3) + TP_COL.h / 2, TP_COL.h * 0.30 + 5, "none", P.gold, 3, { opacity: chips });
      });
    }
    out += MK.pill(220, 392, "one number", on(t, cOne, 0.45) * (1 - on(t, cRun, 0.5)),
      { size: 25, col: P.gold, ink: P.gold });

    /* The stage: the flower on square 3, and the two runs. The first walk
       starts as the program is read out, so it has stopped by the time the
       voice says where it stopped; the second starts on "Run it again". */
    var w1 = tpWalkProg(t, cProg == null ? null : cProg + 0.3, TP_PROG_A, TP_END_A);
    var back = on(t, cRun, 0.4);
    var w2 = tpWalkProg(t, cRun == null ? null : cRun + 0.5, TP_PROG_B, TP_END_B);
    var x = !tpPast(t, cRun) ? w1.x : t < cRun + 0.5 ? lerp(w1.x, 0, back) : w2.x;
    var hop = !tpPast(t, cRun) ? w1.hop : t < cRun + 0.5 ? 0 : w2.hop;
    /* one hop on "right on the flower", so the flower under the cat is seen */
    hop = Math.max(hop, bump(t, cOnIt == null ? null : cOnIt + 0.15, 0.7) * 0.6);
    out += tpStage({ x: x }, { hop: hop, flower: { x: TP_TARGET, p: popIn(t, cFlower, 0.45) } });
    /* the square the voice names, lit under the cat */
    var lit3 = on(t, cThree, 0.5);
    if (lit3 > 0) out += R(tpSqX(TP_TARGET) - 38, TP_ST.ground + 5, 76, 30, 8, P.good, null, null, { opacity: 0.5 * lit3 });
    var short2 = on(t, cStops, 0.5) * (1 - on(t, cRun, 0.5));
    if (short2 > 0) out += R(tpSqX(TP_END_A) - 38, TP_ST.ground + 5, 76, 30, 8, P.bad, null, null, { opacity: 0.5 * short2 });
    out += MK.cross(tpSqX(TP_END_A), TP_ST.ground - 108, 24, popIn(t, cStops, 0.4) * (1 - on(t, cRun, 0.5)));
    out += MK.tick(tpSqX(TP_END_B), TP_ST.ground - 108, 24, popIn(t, cOnIt, 0.4));
    out += MK.glow(tpSqX(TP_TARGET) + 24, TP_ST.ground - 20, 70, P.good, on(t, cOnIt, 0.5));
    /* the blocks were right all along, and the last beat says so */
    out += MK.pill(220, 392, "no block moved", on(t, cNomove, 0.45), { size: 25, col: P.good, ink: P.good });

    out += crossfade(t, i, scene, function (j) { return tpNumberCard(scene, t, j - scene.first); });
    return svg(out);
  }

  /* ==== chapter: test and debug ===================================================
     Two definitions first, in the lesson's own words, then its debugger round:
     the repeat repeats a SPIN and three jumps were wanted. What the program
     does and what it should do are both the kit's words (ART.program.runWords
     over the expanded script), and the kit decides whether they agree. */
  function tpTestDefs(scene, t) {
    var cTesting = sc(scene, 0, "testing"), cReally = sc(scene, 0, "really");
    var cDebug = sc(scene, 1, "debug"), cFinding = sc(scene, 1, "finding"), cFixing = sc(scene, 1, "fixing");
    var out = "";
    var one = popIn(t, cTesting, 0.45), two = popIn(t, cDebug, 0.45);
    if (one > 0)
      out += G(R(90, 96, 460, 250, 24, P.card, P.teal, 3) +
        Em(320, 170, 84, "▶️") + Tx(320, 258, "Testing", "lab huge", "middle"),
        { transform: around(320, 221, Math.min(1.06, one)), opacity: Math.min(1, one) });
    out += Tx(320, 306, "run it and see what it really does", "lab mid muted", "middle",
      { opacity: on(t, cReally, 0.45) });
    out += MK.ripple(320, 170, t, cTesting, P.teal);
    if (two > 0)
      out += G(R(618, 96, 460, 250, 24, P.card, P.plum, 3) +
        Em(848, 170, 84, "\u{1F41B}") + Tx(848, 258, "Debugging", "lab huge", "middle"),
        { transform: around(848, 221, Math.min(1.06, two)), opacity: Math.min(1, two) });
    out += MK.pop(Em(700, 132, 54, "\u{1F50D}"), 700, 132, popIn(t, cFinding, 0.4));
    out += MK.pop(Em(996, 132, 54, "\u{1F527}"), 996, 132, popIn(t, cFixing, 0.4));
    out += Tx(848, 306, "find what went wrong, and fix it", "lab mid muted", "middle",
      { opacity: on(t, cFixing, 0.45) });
    return out;
  }

  function tpTestRun(scene, t) {
    var cProg = sc(scene, 2, "prog"), cWanted = sc(scene, 2, "wanted");
    var cRepeats = sc(scene, 3, "repeats"), cBug = sc(scene, 3, "bug"), cChange = sc(scene, 3, "change");
    var cRun = sc(scene, 4, "run"), cTested = sc(scene, 4, "tested"), cWorks = sc(scene, 4, "works");
    var out = "", b = TP_CARD;

    var swap = on(t, cChange, 0.6), fixed = tpPast(t, cChange);
    var cx = TP_COL.x + TP_COL.w / 2;
    var y3 = function (k) { return tpColY(k, 3); };
    var appear = function (k) { return popIn(t, cProg == null ? null : cProg + k * 0.28, 0.34); };

    out += tpBlock(TP_COL.x, y3(0), TP_COL.w, TP_COL.h, "repeat3",
      { o: appear(0), ring: tpPast(t, cRepeats) && !fixed ? P.gold : null });
    /* the wrong block leaves its place, and the right one grows into it */
    if (swap < 1)
      out += G(tpBlock(TP_COL.x, y3(1), TP_COL.w, TP_COL.h, "spin",
        { o: appear(1) * (1 - swap), ring: tpPast(t, cRepeats) ? P.bad : null,
          mark: tpPast(t, cBug) ? "bug" : null, markP: popIn(t, cBug, 0.4) }),
        { transform: around(cx, y3(1) + TP_COL.h / 2, 1 - 0.3 * swap) });
    out += tpSlot(TP_COL.x, y3(1), TP_COL.w, TP_COL.h, swap * (1 - on(t, cChange == null ? null : cChange + 0.35, 0.4)));
    var drop = on(t, cChange == null ? null : cChange + 0.35, 0.45);
    if (drop > 0)
      out += G(tpBlock(TP_COL.x, y3(1), TP_COL.w, TP_COL.h, "jump",
        { o: drop, ring: P.good, mark: tpPast(t, cTested) ? "tick" : null, markP: popIn(t, cTested, 0.35) }),
        { transform: around(cx, y3(1) + TP_COL.h / 2, 0.74 + 0.26 * drop) });
    out += tpBlock(TP_COL.x, y3(2), TP_COL.w, TP_COL.h, "say", { o: appear(2) });
    /* the repeat repeats the one block after it */
    out += MK.arrow(TP_COL.x - 18, y3(0) + TP_COL.h * 0.7, TP_COL.x - 18, y3(1) + TP_COL.h * 0.45,
      on(t, cRepeats, 0.5) * (1 - swap), P.gold, 7);
    out += MK.pill(cx, 400, "run it again", on(t, cWorks, 0.45), { size: 25, col: P.good, ink: P.good });

    /* what it should do, and what it really does */
    var want = on(t, cWanted, 0.5), does = on(t, cProg, 0.5);
    out += R(b.x, b.y, b.w, b.h, 22, P.card, tpPast(t, cTested) ? P.good : P.line,
      tpPast(t, cTested) ? 3.5 : 2);
    out += G(Tx(b.x + 28, b.y + 62, "Should", "lab mid caps muted", "start") +
      Tx(b.x + 160, b.y + 64, TP_FIX_DOES, "lab big", "start", { fill: P.good }), { opacity: want });
    /* the DOES line changes when the three jumps have been made, not when the
       run starts */
    var ran = tpPast(t, cRun == null ? null : cRun + 1.9);
    var nowDoes = ran ? TP_FIX_DOES : TP_BUG_DOES;
    out += G(Tx(b.x + 28, b.y + 140, "Does", "lab mid caps muted", "start") +
      Tx(b.x + 160, b.y + 142, nowDoes, "lab big", "start",
        { fill: ran ? P.good : P.bad }), { opacity: does });
    if (!ran) out += MK.cross(b.x + b.w - 46, b.y + 134, 24,
      popIn(t, cWanted, 0.4) * (TP_BUG_SAME ? 0 : 1));
    else out += MK.tick(b.x + b.w - 46, b.y + 134, 24, popIn(t, cTested, 0.4));

    /* the cat: it spins three times with the bug in, and jumps three times
       once the bug is out */
    var spin = tpPast(t, cChange) ? 0 : on(t, cProg == null ? null : cProg + 0.75, 1.5) * 1080;
    var jr = cRun == null ? -1 : (t - (cRun + 0.4)) / 1.6;
    var hop = jr > 0 && jr < 1 ? Math.abs(Math.sin(jr * 3 * Math.PI)) : 0;
    out += tpStage({ x: 0, spin: spin }, { hop: hop });
    var said = Math.max(on(t, cProg == null ? null : cProg + 2.3, 0.4) * (1 - swap),
      on(t, cRun == null ? null : cRun + 2.1, 0.4));
    out += MK.bubble(tpSqX(0) + 36, 250, 158, 60, "Hello!", said, tpSqX(0) + 26, 312);
    return out;
  }

  function tpTestChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 2), out = "";
    if (u < 1) out += G(tpTestDefs(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(tpTestRun(scene, t), { opacity: u });
    return svg(out);
  }
