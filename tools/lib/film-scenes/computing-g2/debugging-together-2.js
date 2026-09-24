  /* ==== Debugging Together, part 2: two bugs, and two heads ==================
     tools/lib/film-scenes/computing-g2/debugging-together-2.js. See the header
     of debugging-together.js.

     "Two bugs" is the lesson's second round, block for block: the goal is move
     left twice, then say hello, the program is move left, move right, spin, and
     the bugs are in blocks two and three. Each fix is the wrong block shrinking
     away about its own slot and the right one growing into the slot it left;
     nothing travels over the block above. The run after each fix is the kit's
     own arithmetic (ART.run), so the dog ends where the lesson would put it. */

  var DT_R2 = ["left", "right", "spin"];        /* as the child finds it */
  var DT_R2B = ["left", "left", "spin"];        /* after the first fix */
  var DT_R2C = ["left", "left", "say"];         /* after the second: the goal */
  var DT_R2_ST = dtStates(DT_R2);
  var DT_R2B_ST = dtStates(DT_R2B);
  var DT_R2C_ST = dtStates(DT_R2C);

  function dtTwoChapter(scene, beat, t, i) {
    var cTwo = sc(scene, 0, "two"), cGoal = sc(scene, 0, "goal");
    var cRun = sc(scene, 1, "run"), cLeft = sc(scene, 1, "left"),
      cRight = sc(scene, 1, "right"), cSpin = sc(scene, 1, "spin");
    var cSecond = sc(scene, 2, "second"), cWanted = sc(scene, 2, "wanted");
    var cFix1 = sc(scene, 3, "fix"), cBetter = sc(scene, 3, "better"), cIsright = sc(scene, 3, "right");
    var cAgain = sc(scene, 4, "again"), cMoves = sc(scene, 4, "moves"), cSpin2 = sc(scene, 4, "spin");
    var cStill = sc(scene, 5, "still"), cLast = sc(scene, 5, "last"), cBug2 = sc(scene, 5, "secondbug");
    var cFix2 = sc(scene, 6, "fix"), cAgain2 = sc(scene, 6, "again"),
      cHello = sc(scene, 6, "hello"), cTest = sc(scene, 6, "test");
    var out = "", chapIn = inAt(t, BEATS[scene.first].start, 0.6);

    var f1 = dtPast(t, cFix1), f2 = dtPast(t, cFix2);
    var ids = f2 ? DT_R2C : f1 ? DT_R2B : DT_R2;
    var states = f2 ? DT_R2C_ST : f1 ? DT_R2B_ST : DT_R2_ST;
    var times, dur = 0.6;
    if (dtPast(t, cAgain2)) { times = [cAgain2 + 0.55, cAgain2 + 0.95, cAgain2 + 1.35]; dur = 0.4; }
    else if (f2) { times = [null, null, null]; }
    else if (dtPast(t, cMoves)) { times = [cMoves, cMoves + 0.6, cSpin2]; dur = 0.55; }
    else if (f1) { times = [null, null, null]; }
    else { times = [cLeft, cRight, cSpin]; dur = 0.6; }
    var r = dtRunState(ids, states, times, dur, t);

    /* the goal, flashing when the voice says what we wanted instead */
    out += dtGoalCard("move left twice, then say hello", chapIn, on(t, cGoal, 0.5),
      { flash: Math.max(bump(t, cWanted, 1.4), bump(t, cStill, 1.4)) });

    /* ---- the three blocks. Block 2 is replaced in beat 3, block 3 in beat 6;
       each replacement happens inside its own slot. */
    function rowIn(k) { return on(t, cTwo == null ? null : cTwo + k * 0.22, 0.4); }
    function liveCol(k) {
      return times[k] != null && t >= times[k] && t < times[k] + dur + 0.3 ? P.gold : null;
    }
    var okAt = [cBetter, cBetter == null ? null : cBetter + 0.3, cHello];
    function okMark(k) { return dtPast(t, okAt[k]) ? "tick" : null; }
    function okMarkP(k) { return popIn(t, okAt[k], 0.35); }

    function swap(k, wrongId, rightId, at, wrongCol) {
      /* the wrong block is wholly gone before the right one starts to grow:
         overlapping them put two blocks in one slot for half a second, which in
         this lesson reads as a bug rather than as a repair */
      var lift = on(t, at, 0.35) * 12,
        gone = on(t, at == null ? null : at + 0.1, 0.4),
        drop = on(t, at == null ? null : at + 0.5, 0.4);
      var cy = dtRowY(k) + DT_ROW.h / 2, cx = DT_PANEL.x + DT_PANEL.w / 2;
      var o = "";
      if (gone < 1) o += G(dtRow(DT_PANEL.x, dtRowY(k) - lift, DT_PANEL.w, DT_ROW.h, k + 1, wrongId,
        { o: rowIn(k), col: dtPast(t, at) ? P.bad : wrongCol || liveCol(k),
          mark: dtPast(t, at) ? "cross" : wrongCol ? "bug" : null,
          markP: popIn(t, dtPast(t, at) ? at : k === 1 ? cSecond : cLast, 0.4) }),
        { opacity: 1 - gone, transform: around(cx, cy - lift, 1 - 0.34 * gone) });
      if (gone > 0) o += dtSlot(DT_PANEL.x, dtRowY(k), DT_PANEL.w, DT_ROW.h, k + 1, gone * (1 - drop));
      if (drop > 0) o += G(dtRow(DT_PANEL.x, dtRowY(k), DT_PANEL.w, DT_ROW.h, k + 1, rightId,
        { o: drop, col: liveCol(k) || P.good, mark: okMark(k), markP: okMarkP(k) }),
        { transform: around(cx, cy, 0.72 + 0.28 * drop) });
      /* the right block arrives from the clear strip beside the list */
      o += MK.arrow(DT_GUTTER + 16, cy, DT_GUTTER - 20, cy,
        on(t, at == null ? null : at + 0.3, 0.35) * (1 - drop), P.good, 7);
      return o;
    }

    /* block 1 is right all along */
    out += dtRow(DT_PANEL.x, dtRowY(0), DT_PANEL.w, DT_ROW.h, 1, "left",
      { o: rowIn(0), col: liveCol(0), mark: okMark(0), markP: okMarkP(0) });

    if (f1 || dtPast(t, cFix1)) out += swap(1, "right", "left", cFix1, dtPast(t, cSecond) ? P.gold : null);
    else out += dtRow(DT_PANEL.x, dtRowY(1), DT_PANEL.w, DT_ROW.h, 2, "right",
      { o: rowIn(1), col: dtPast(t, cSecond) ? P.gold : liveCol(1),
        mark: dtPast(t, cSecond) ? "bug" : null, markP: popIn(t, cSecond, 0.4) });

    if (f2 || dtPast(t, cFix2)) out += swap(2, "spin", "say", cFix2, dtPast(t, cLast) ? P.gold : null);
    else out += dtRow(DT_PANEL.x, dtRowY(2), DT_PANEL.w, DT_ROW.h, 3, "spin",
      { o: rowIn(2), col: dtPast(t, cLast) ? P.gold : liveCol(2),
        mark: dtPast(t, cLast) ? "bug" : null, markP: popIn(t, cLast, 0.4) });

    out += MK.ripple(DT_PANEL.x + 52, dtRowY(1) + DT_ROW.h / 2, t, cSecond, P.gold);
    out += MK.ripple(DT_PANEL.x + 52, dtRowY(2) + DT_ROW.h / 2, t, cLast, P.gold);

    /* ---- the stage, the button, and what the program actually did */
    var hot = (dtPast(t, cLeft) && !dtPast(t, cSecond)) ||
      (dtPast(t, cMoves) && !dtPast(t, cStill)) || (dtPast(t, cAgain2) && !dtPast(t, cTest));
    out += dtStageDraw(r, chapIn, { lit: hot });
    out += dtBtn(chapIn, hot);
    out += MK.ripple(DT_BTN_C[0], DT_BTN_C[1], t, cRun, P.good);
    out += MK.ripple(DT_BTN_C[0], DT_BTN_C[1], t, cAgain, P.good);
    out += MK.ripple(DT_BTN_C[0], DT_BTN_C[1], t, cAgain2, P.good);

    /* one short note at a time, beside the button */
    var note = dtPast(t, cTest) ? ["test after every fix", cTest, P.good]
      : dtPast(t, cBug2) ? ["the second bug", cBug2, P.gold]
      : dtPast(t, cWanted) ? ["we wanted: move left", cWanted, P.gold]
      : dtPast(t, cTwo) ? ["two bugs in here", cTwo, P.gold] : null;
    if (note) out += MK.pill(DT_NOTE[0], DT_NOTE[1], note[0], on(t, note[1], 0.45),
      { size: 24, col: note[2], ink: note[2] });

    if (r.done > 0) {
      var capCol = dtPast(t, cHello) ? P.good
        : dtPast(t, cStill) || dtPast(t, cSecond) ? P.bad : P.gold;
      out += MK.pill(DT_CAP[0], DT_CAP[1], ART.program.runWords(ids.slice(0, r.done)),
        on(t, times[r.done - 1], 0.4), { size: 24, col: capCol, ink: capCol });
    }
    out += MK.cross(1098, DT_CAP[1], 24,
      Math.max(popIn(t, cSecond, 0.4) * (1 - on(t, cFix1, 0.4)), popIn(t, cStill, 0.4) * (1 - on(t, cFix2, 0.4))));
    out += MK.qmark(1098, DT_CAP[1], 24, on(t, cIsright, 0.45) * (1 - on(t, cMoves, 0.45)));
    out += MK.tick(1098, DT_CAP[1], 24, popIn(t, cHello, 0.4));
    return svg(out);
  }

  /* ==== chapter: two heads =======================================================
     Sami on the left with his program - the same one the lesson states for him
     (demo step, lesson-5.py: "Move right. Jump. Spin", DT_A_PROG, shared with the
     "Say it out loud" chapter) - and Amal on the right. She looks once; then the
     two jobs, one each; then the Ask button and the lesson's own hint. NOTHING IS
     EVER CROSSED OUT HERE - the one mark in this chapter is a tick beside the Ask
     button, and the only ring is the gold one Amal's hint puts on the third
     BLOCK, the one that spins where the goal wants a jump. */
  var DT_H_PROG = { x: 250, w: 380, h: 78, top: 86, gap: 10 };
  function dtHRowY(k) { return DT_H_PROG.top + k * (DT_H_PROG.h + DT_H_PROG.gap); }
  var DT_H_STAGE = { x: 760, y: 286, w: 360, h: 132 };
  var DT_SAMI = "\u{1F466}\u{1F3FE}", DT_AMAL = "\u{1F467}\u{1F3FE}";

  /* the lesson's stage, small, with the dog idling: pure in t */
  function dtMiniStage(b, o, t) {
    if (!(o > 0)) return "";
    var gy = b.y + b.h - 32, size = 62, hop = Math.max(0, Math.sin(t * 2.4)) * 15;
    return G(R(b.x, b.y, b.w, b.h, 18, P.card, P.line, 2) +
      R(b.x + 14, gy, b.w - 28, 10, 5, P.cell) +
      Em(b.x + b.w / 2, gy - size * 0.44 - hop, size, DT_DOG),
      { opacity: clamp(o, 0, 1) });
  }

  function dtHeadsChapter(scene, beat, t, i) {
    var cSami = sc(scene, 0, "sami"), cCannot = sc(scene, 0, "cannot");
    var cAmal = sc(scene, 1, "amal"), cFresh = sc(scene, 1, "fresh");
    var cRead = sc(scene, 2, "read"), cWatch = sc(scene, 2, "watch");
    var cAsk = sc(scene, 3, "ask"), cHint = sc(scene, 3, "hint");
    var cNotfail = sc(scene, 4, "notfail"), cAllday = sc(scene, 4, "allday");
    var out = "";

    /* Sami and his program */
    var ps = popIn(t, cSami, 0.45);
    out += MK.pop(Em(100, 190, 104, DT_SAMI), 100, 190, ps);
    out += Tx(100, 262, "Sami", "lab big", "middle", { opacity: Math.min(1, ps) });
    out += Tx(440, 62, "Sami's program", "lab mid muted", "middle", { opacity: on(t, cSami, 0.5) });
    DT_A_PROG.forEach(function (id, k) {
      out += dtRow(DT_H_PROG.x, dtHRowY(k), DT_H_PROG.w, DT_H_PROG.h, k + 1, id,
        { o: on(t, cSami == null ? null : cSami + k * 0.2, 0.4),
          col: k === 2 && dtPast(t, cHint) ? P.gold : null });
    });
    out += MK.ripple(DT_H_PROG.x + 44, dtHRowY(2) + DT_H_PROG.h / 2, t, cHint, P.gold);

    /* he has looked ten times and still cannot see it */
    out += MK.pill(100, 352, "10 looks", on(t, cSami, 0.5), { size: 22, col: P.line, ink: P.muted });
    out += MK.qmark(690, 200, 30, on(t, cCannot, 0.5) * (1 - on(t, cAsk, 0.5)));

    /* Amal, with fresh eyes */
    var pa = popIn(t, cAmal, 0.45);
    out += MK.pop(Em(1040, 150, 104, DT_AMAL), 1040, 150, pa);
    out += Tx(1040, 222, "Amal", "lab big", "middle", { opacity: Math.min(1, pa) });
    out += MK.ripple(1040, 150, t, cAmal, P.blue);
    out += MK.pop(Em(1040, 74, 40, "\u{1F440}"), 1040, 74,
      popIn(t, cFresh, 0.45) * (1 - on(t, cHint, 0.5)));
    out += MK.leader(984, 152, 648, 152, on(t, cFresh, 0.7) * (1 - on(t, cRead, 0.5)), P.blue);

    /* one reads the blocks, the other watches the dog */
    out += MK.leader(158, 210, 244, 184, on(t, cRead, 0.6), P.gold);
    out += Tx(100, 302, "reads the blocks", "lab mid muted", "middle", { opacity: on(t, cRead, 0.5) });
    out += dtMiniStage(DT_H_STAGE, on(t, cWatch, 0.5), t);
    out += MK.leader(982, 216, 902, 282, on(t, cWatch, 0.6), P.blue);
    out += Tx(1040, 256, "watches the dog", "lab mid muted", "middle", { opacity: on(t, cWatch, 0.5) });

    /* press Ask, and listen to the hint */
    var pk = popIn(t, cAsk, 0.45);
    out += MK.pop(R(46, 372, 190, 58, 18, P.cell, P.gold, 3) +
      Em(82, 401, 30, "\u{1F4AC}") + Tx(112, 411, "Ask", "lab big", "start"), 141, 401, pk);
    out += MK.ripple(141, 401, t, cAsk, P.gold);
    out += MK.bubble(700, 22, 390, 76, "Watch the third block", on(t, cHint, 0.5), 1030, 112);

    /* asking is not failing */
    out += MK.tick(272, 401, 24, popIn(t, cNotfail, 0.4));
    out += MK.pill(470, 414, "programmers ask all day", on(t, cAllday, 0.45),
      { size: 22, col: P.good, ink: P.good });
    return svg(out);
  }
