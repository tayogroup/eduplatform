  /* ==== Grade 1 Computing, Lesson 5: Bugs and Debugging, part 2 ===============
     The dog's program: running it, finding the bug in it, and fixing it. The
     panel of blocks and the stage of squares are drawn here, because the
     Computing kit keeps its stage in HTML and its grids inside closures - but
     every RULE comes from the kit: the block labels, icons and colours from
     ART.block, and where the dog ends up from ART.run, which is the lesson's
     own stage doing the arithmetic. So the buggy program's dog comes home
     because the lesson says a left cancels a right, not because this file
     does. */

  /* the lesson's own sprite for this step, and the two programs of its first
     debugging round: the goal is "move right twice, then jump" (bug: 1) */
  var BD_DOG = "\u{1F436}";
  var BD_BUGGY_PROG = ["right", "left", "jump"];
  var BD_FIXED_PROG = ["right", "right", "jump"];
  /* where the dog stands after 0, 1, 2 and 3 blocks, worked out ONCE by the
     lesson's own stage (never inside a draw function: a render calls those
     several thousand times) */
  function bdEndsOf(prog) {
    var out = [];
    for (var n = 0; n <= prog.length; n++) out.push(ART.run(BD_DOG, prog.slice(0, n).filter(function (id) { return id !== "jump"; }))[0].x);
    return out;
  }
  var BD_BUGGY_X = bdEndsOf(BD_BUGGY_PROG);      /* 0, 1, 0, 0 - the left undoes the right */
  var BD_FIXED_X = bdEndsOf(BD_FIXED_PROG);      /* 0, 1, 2, 2 - it reaches square two */

  /* ---- the two panels --------------------------------------------------------- */
  var BD_PANEL = { x: 40, y: 100, w: 480, h: 330, bx: 60, bw: 368, bh: 76, mark: 466 };
  var BD_ROWY = [156, 246, 336];
  var BD_RUN = { x: 566, y: 262, r: 32 };
  var BD_STAGE = { x: 612, y: 120, w: 530, h: 290, ground: 356, cx: 877, step: 92, feet: 314 };
  var BD_WANT = { y: 10, h: 58, w: 198, x: [210, 420, 630] };

  function bdSquareX(n) { return BD_STAGE.cx + n * BD_STAGE.step; }

  /* the strip along the top: what we wanted the dog to do.
     shown: how many of the three minis are there; ticks: 0 to 3 */
  function bdWantedStrip(t, o, shown, ticks, litRow) {
    if (!(o > 0)) return "";
    var out = Tx(44, 50, "We wanted", "lab big muted", "start");
    BD_FIXED_PROG.forEach(function (id, k) {
      if (k >= shown) return;
      out += bdBlock(BD_WANT.x[k], BD_WANT.y, BD_WANT.w, BD_WANT.h, id,
        { outline: litRow === k ? P.gold : null, outlineW: 4 });
    });
    for (var k2 = 0; k2 < ticks; k2++) out += MK.tick(BD_WANT.x[k2] + BD_WANT.w - 10, BD_WANT.y + 6, 14, 1);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the program, as a card of blocks. rows: one entry per row, or null for an
     empty slot. Each is {id, outline, outlineW, opacity, pop, dx, dy}. */
  function bdProgramPanel(t, o, rows, title) {
    if (!(o > 0)) return "";
    var out = R(BD_PANEL.x, BD_PANEL.y, BD_PANEL.w, BD_PANEL.h, 22, P.card, P.line, 2) +
      Tx(BD_PANEL.bx, 136, title || "The program", "lab muted", "start", { "font-size": 22 });
    rows.forEach(function (r, k) {
      var y = BD_ROWY[k];
      if (!r) { out += bdSlot(BD_PANEL.bx, y, BD_PANEL.bw, BD_PANEL.bh, 1); return; }
      out += bdBlock(BD_PANEL.bx, y + (r.dy || 0), BD_PANEL.bw, BD_PANEL.bh, r.id, r);
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the stage: five squares of ground, and the dog standing on one of them.
     x is in squares (the lesson's own unit), jump is 0 to 1 and back. */
  function bdStagePanel(t, o, x, jump, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var out = el("clipPath", { id: "bdStageClip" }, R(BD_STAGE.x, BD_STAGE.y, BD_STAGE.w, BD_STAGE.h, 22));
    var inner = R(BD_STAGE.x, BD_STAGE.y, BD_STAGE.w, BD_STAGE.h, 0, "#123247") +
      R(BD_STAGE.x, BD_STAGE.ground, BD_STAGE.w, BD_STAGE.y + BD_STAGE.h - BD_STAGE.ground, 0, "#3E8E4A");
    for (var k = -2; k <= 2; k++) inner += L(bdSquareX(k) + 46, BD_STAGE.ground, bdSquareX(k) + 46, BD_STAGE.y + BD_STAGE.h, "#2F7038", 3);
    out += G(inner, { "clip-path": "url(#bdStageClip)" });
    out += R(BD_STAGE.x, BD_STAGE.y, BD_STAGE.w, BD_STAGE.h, 22, "none", opt.edge || P.line, opt.edge ? 5 : 2);
    /* the square the program was meant to reach */
    if (opt.ghost > 0) out += R(bdSquareX(2) - 46, 248, 92, 108, 14, "none", P.gold, 3, { opacity: 0.85 * opt.ghost, "stroke-dasharray": "10 9" }) +
      Em(bdSquareX(2), BD_STAGE.feet, 84, BD_DOG, { opacity: 0.34 * opt.ghost });
    out += Em(bdSquareX(x), BD_STAGE.feet - 100 * (jump || 0), 84, BD_DOG);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* which of the three blocks is running: lit from its own cue until the next */
  function bdNowRow(t, cues) {
    var now = -1;
    for (var k = 0; k < cues.length; k++) if (cues[k] != null && t >= cues[k]) now = k;
    return now;
  }
  /* the dog's square at t, stepped through the lesson's own end positions */
  function bdWalk(t, ends, cues, span) {
    var x = ends[0];
    for (var k = 0; k < cues.length; k++) x += (ends[k + 1] - ends[k]) * on(t, cues[k], span || 0.45);
    return x;
  }

  /* ==== chapter: run it to test it ================================================= */
  function bdRunChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWant = c(0, "want"), cTwice = c(0, "twice"), cJump0 = c(0, "jump");
    var cProgram = c(1, "program"), cWork = c(1, "work"), cLook = c(1, "look");
    var cWatch = c(2, "watch"), cRunIt = c(2, "run");
    var cRight = c(3, "right"), cLeft = c(3, "left"), cJump3 = c(3, "jump");
    var cNot = c(4, "not"), cBug = c(4, "bug");
    var out = "";

    /* what we wanted: the two move-rights, then the jump */
    var shown = tally(t, cTwice, 2, 0.5) + (cJump0 != null && t >= cJump0 ? 1 : 0);
    out += bdWantedStrip(t, on(t, cWant, 0.4), shown, 0, -1);

    /* the stage, and the square the dog was meant to reach */
    var run = bdNowRow(t, [cRight, cLeft, cJump3]);
    var x = bdWalk(t, BD_BUGGY_X, [cRight, cLeft, cJump3]);
    var jump = bump(t, cJump3, 0.9);
    var wrong = on(t, cNot, 0.5);
    out += bdStagePanel(t, popIn(t, cWant, 0.5), x, jump,
      { ghost: on(t, cJump0, 0.6), edge: wrong > 0.5 ? P.accent : null });

    /* the program, with the block that is running rung in gold */
    var running = bdOnly(t, scene, 3) > 0.35 ? run : -1;
    var rows = BD_BUGGY_PROG.map(function (id, k) {
      return { id: id, outline: running === k ? P.gold : null, outlineW: 5, pop: 1 + 0.03 * bump(t, [cRight, cLeft, cJump3][k], 0.5) };
    });
    out += bdProgramPanel(t, popIn(t, cProgram, 0.5), rows);

    /* "Does it work?" - you cannot tell by looking, so a question stays */
    var q = on(t, cWork, 0.45) * (1 - on(t, cRight, 0.4));
    out += MK.qmark(BD_PANEL.mark, 133, 24, q);
    /* the magnifier looks over the blocks and finds nothing */
    var look = on(t, cLook, 0.5) * bdOnly(t, scene, 1);
    if (look > 0) out += G(Em(0, 0, 66, "\u{1F50D}"), { transform: tr(BD_PANEL.mark, lerp(180, 350, on(t, cLook, 1.6))), opacity: look });

    /* "watch closely": eyes over the stage, watching for the result - there is
       no prediction bubble here on purpose (review note, 2026-09-24): the
       lesson's own misconception line for this step is "children guess the
       bug before running the program: run it first", so the film does not
       show the child guessing before the dog moves */
    var watching = on(t, cWatch, 0.4) * (1 - on(t, cRight, 0.4));
    if (watching > 0) out += G(Em(0, 0, 56, "\u{1F440}"), { transform: tr(BD_STAGE.x + BD_STAGE.w / 2, BD_STAGE.y - 34), opacity: watching });

    /* the Run button, pressed */
    var rb = on(t, cRunIt, 0.4);
    out += bdRunButton(BD_RUN.x, BD_RUN.y, BD_RUN.r, Math.max(rb, on(t, cProgram, 0.5) * 0.45), bump(t, cRunIt, 0.5));
    out += MK.ripple(BD_RUN.x, BD_RUN.y, t, cRunIt, P.good);

    /* "not what we wanted": the result is marked, never the dog */
    out += MK.cross(1104, 154, 26, popIn(t, cNot, 0.4));
    /* and the bug is somewhere in this program */
    var bugOn = popIn(t, cBug, 0.45);
    if (bugOn > 0) {
      out += MK.glow(BD_PANEL.x + BD_PANEL.w / 2, BD_PANEL.y + BD_PANEL.h / 2, 170, P.accent, 0.5 + 0.5 * breathe(t));
      out += MK.pop(Em(BD_PANEL.mark, 128, 54, "\u{1F41B}"), BD_PANEL.mark, 128, bugOn);
    }
    return svg(out);
  }

  /* ==== chapter: find the bug ======================================================
     The program beside what we wanted, block by block. Only the pair being
     talked about is bright; the others fade to 0.35, and nothing overlaps, so
     opacity is enough. */
  var BD_F = { c1: 110, c2: 658, w: 400, h: 88, mid: 584, rows: [94, 206, 318] };

  function bdFindChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWhy = c(0, "why"), cCompare = c(0, "compare"), cBlockByBlock = c(0, "block");
    var cOne = c(1, "one"), cFine1 = c(1, "fine");
    var cTwo = c(2, "two"), cLeft = c(2, "left"), cWanted = c(2, "wanted");
    var cThree = c(3, "three"), cFine3 = c(3, "fine");
    var cSecond = c(4, "second"), cBug = c(4, "bug"), cInstead = c(4, "instead");
    var out = "";

    var show = popIn(t, cCompare, 0.5);
    var lit = [
      on(t, cOne, 0.4) * (1 - on(t, cTwo, 0.4)),
      on(t, cTwo, 0.4) * (1 - on(t, cThree, 0.4)) + on(t, cSecond, 0.4),
      on(t, cThree, 0.4) * (1 - on(t, cSecond, 0.4))
    ];
    var all = 1 - on(t, cOne, 0.4);
    var rowOp = function (k) { return 0.35 + 0.65 * clamp(all + lit[k], 0, 1); };

    out += G(Tx(BD_F.c1 + BD_F.w / 2, 62, "The program", "lab muted", "middle", { "font-size": 24 }) +
      Tx(BD_F.c2 + BD_F.w / 2, 62, "We wanted", "lab muted", "middle", { "font-size": 24 }), { opacity: show });

    /* the dashed run between the columns: block by block */
    var bb = on(t, cBlockByBlock, 0.6);
    BD_F.rows.forEach(function (y, k) {
      var cy = y + BD_F.h / 2, op = rowOp(k);
      out += G(Tx(74, cy + 12, String(k + 1), "lab big muted", "middle"), { opacity: op * show });
      if (bb > 0) out += L(BD_F.c1 + BD_F.w + 10, cy, lerp(BD_F.c1 + BD_F.w + 10, BD_F.c2 - 10, bb), cy, P.line, 3,
        { opacity: 0.8 * op * show, "stroke-dasharray": "9 8" });
      out += bdBlock(BD_F.c1, y, BD_F.w, BD_F.h, BD_BUGGY_PROG[k], {
        opacity: op * show, pop: 1 + 0.03 * bump(t, k === 1 ? cInstead : null, 0.6),
        outline: k === 1 && on(t, cLeft, 0.4) * lit[1] > 0.4 ? P.accent : null, outlineW: 5
      });
      out += bdBlock(BD_F.c2, y, BD_F.w, BD_F.h, BD_FIXED_PROG[k], {
        opacity: op * show, pop: 1 + 0.03 * bump(t, k === 1 ? cInstead : null, 0.6),
        outline: k === 1 && on(t, cWanted, 0.4) * lit[1] > 0.4 ? P.good : null, outlineW: 5
      });
    });

    /* what the comparison found, one mark per row */
    out += MK.tick(BD_F.mid, BD_F.rows[0] + BD_F.h / 2, 26, popIn(t, cFine1, 0.4));
    out += MK.cross(BD_F.mid, BD_F.rows[1] + BD_F.h / 2, 26, popIn(t, cWanted, 0.4));
    out += MK.tick(BD_F.mid, BD_F.rows[2] + BD_F.h / 2, 26, popIn(t, cFine3, 0.4));

    /* "Why did it go wrong?" */
    out += MK.qmark(BD_F.mid, 46, 26, on(t, cWhy, 0.45) * (1 - on(t, cOne, 0.4)));

    /* the two words that differ, lit as they are said */
    if (on(t, cInstead, 0.4) > 0) {
      var g = on(t, cInstead, 0.5) * (0.55 + 0.45 * breathe(t));
      out += MK.glow(BD_F.c1 + 49, BD_F.rows[1] + BD_F.h / 2, 96, P.accent, g);
      out += MK.glow(BD_F.c2 + 49, BD_F.rows[1] + BD_F.h / 2, 96, P.good, g);
    }
    /* the bug, on the block that is the bug */
    out += MK.pop(Em(BD_F.c1 + BD_F.w - 42, BD_F.rows[1] + 26, 54, "\u{1F41B}"), BD_F.c1 + BD_F.w - 42, BD_F.rows[1] + 26, popIn(t, cBug, 0.45));
    return svg(out);
  }

  /* ==== chapter: fix it and run again ============================================== */
  function bdFixChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFix = c(0, "fix"), cOut = c(0, "out"), cIn = c(0, "in");
    var cWords = c(1, "words"), cWanted = c(1, "wanted");
    var cAgain = c(2, "again"), cTest = c(2, "test");
    var cMoves = c(3, "moves"), cGone = c(3, "gone");
    var cFound = c(4, "found"), cFixed = c(4, "fixed"), cDebug = c(4, "debug");
    var out = "";

    var gone = on(t, cOut, 0.55), put = popIn(t, cIn, 0.5);
    /* the three moves of the fixed program, from one cue */
    var mv = cMoves == null ? [null, null, null] : [cMoves + 0.15, cMoves + 0.65, cMoves + 1.15];
    var run = bdNowRow(t, mv);
    var said = tally(t, cWords, 3, 1.0);
    var ticks = cWanted != null && t >= cWanted ? tally(t, cWanted, 3, 0.6) : 0;

    out += bdWantedStrip(t, 1, 3, ticks, bdOnly(t, scene, 3) > 0.35 ? run : -1);

    var x = bdWalk(t, BD_FIXED_X, mv, 0.42);
    var jump = bump(t, mv[2], 0.9);
    out += bdStagePanel(t, 1, x, jump, { ghost: 0.5 * (1 - on(t, mv[2], 0.6)) });

    /* the wrong block leaves, the right one fades in behind it */
    var rows = [
      { id: "right", outline: said >= 1 && run < 0 ? P.good : run === 0 ? P.gold : null, outlineW: 5 },
      null,
      { id: "jump", outline: said >= 3 && run < 0 ? P.good : run === 2 ? P.gold : null, outlineW: 5 }
    ];
    if (gone < 1) rows[1] = { id: "left", outline: P.accent, outlineW: 5, opacity: 1 - gone, pop: 1 - 0.32 * gone };
    /* the right block fades and settles into row two, in place: it does not
       slide down from row one, which would pass behind/over the "move right"
       block already sitting there mid-transition (review note, 2026-09-24) */
    else if (put > 0) rows[1] = { id: "right", opacity: Math.min(1, put * 2), pop: Math.min(1.06, 0.85 + 0.21 * put), outline: said >= 2 && run < 0 ? P.good : run === 1 ? P.gold : P.good, outlineW: 5 };
    out += bdProgramPanel(t, 1, rows);
    /* the bug sits on the block that IS the bug, and goes out with it */
    var bugO = on(t, cFix, 0.4) * (1 - gone);
    if (bugO > 0) out += Em(BD_PANEL.mark - 40, BD_ROWY[1] + 6, 54, "\u{1F41B}", { opacity: bugO });

    /* every row read back, and ticked */
    for (var k = 0; k < 3; k++) out += MK.tick(BD_PANEL.mark, BD_ROWY[k] + BD_PANEL.bh / 2, 20, popIn(t, ticks > k ? cWanted + k * 0.3 : null, 0.35));

    /* run it again */
    out += bdRunButton(BD_RUN.x, BD_RUN.y, BD_RUN.r, 0.5 + 0.5 * on(t, cAgain, 0.4), bump(t, cAgain, 0.5));
    out += MK.ripple(BD_RUN.x, BD_RUN.y, t, cAgain, P.good);
    out += bdLoopArrow(BD_RUN.x, BD_RUN.y, BD_RUN.r + 16, on(t, cTest, 0.7), P.gold);

    /* the bug has gone, and the dog is where we wanted it */
    out += MK.tick(1104, 154, 26, popIn(t, cGone, 0.4));

    /* found it, fixed it: that is debugging */
    out += MK.pop(Em(680, 172, 64, "\u{1F50D}"), 680, 172, popIn(t, cFound, 0.4));
    out += MK.pop(Em(790, 172, 64, "\u{1F527}"), 790, 172, popIn(t, cFixed, 0.4));
    var dbg = on(t, cDebug, 0.5);
    if (dbg > 0) {
      out += MK.glow(960, 172, 130, P.gold, dbg * (0.6 + 0.4 * breathe(t)));
      out += MK.pill(960, 172, "debugging", dbg, { size: 32, col: P.gold });
    }
    return svg(out);
  }
