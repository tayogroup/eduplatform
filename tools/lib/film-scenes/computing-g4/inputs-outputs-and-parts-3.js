  /* ==== Grade 4 Computing, Lesson 6, part 3 of the pictures ===================
     "Fix, then run again", "Debugging systematically", and what you now know.
     See the header of inputs-outputs-and-parts.js. */

  /* ==== chapter: fix, then run again ==============================================
     The same three parts as the chapter before, so the child is looking at the
     program they have just watched fail. The wrong block goes out, the right
     one goes in, the part is run again, and then the lesson's SECOND round
     arrives with a bug in two parts at once. */

  /* the lesson's second round: move right three times, grow, then move left
     three times - with a shrink where the grow should be and a jump where the
     move left should be */
  var IO_RUN2 = [
    { name: "Part 1: out", ids: ["repeat3", "right"], bug: false },
    { name: "Part 2: bigger", ids: ["shrink"], bug: true },
    { name: "Part 3: back", ids: ["repeat3", "jump"], bug: true }
  ];
  /* what that round was supposed to do, in the kit's own blocks */
  var IO_WANT2 = [["repeat3", "right"], ["grow"], ["repeat3", "left"]];

  function ioFixRound1(scene, t, k) {
    var out = "";
    var cFix = sc(scene, 0, "fix"), cOut = sc(scene, 0, "out"), cIn = sc(scene, 0, "in");
    var cAgain = sc(scene, 1, "again"), cTwo = sc(scene, 1, "two"), cPass = sc(scene, 1, "passes");
    var cEvery = sc(scene, 2, "every"), cWhole = sc(scene, 2, "whole");
    /* the jump's entrance starts the moment spin begins leaving (cOut), not at
       "in" - closing the dead gap the two used to leave between them - and its
       span runs to cIn, so the chip settles at full brightness exactly as "put
       in jump" finishes: the thing named still finishes on its own cue. */
    var fixed = ioPast(t, cOut);
    var nEvery = k === 2 ? tally(t, cEvery, 3, 0.9) : 0;

    IO_RUN1.forEach(function (part, n) {
      var opt = {};
      if (n === 1) {
        if (k === 0 && ioPast(t, cFix)) { opt.col = P.gold; opt.sw = 4; }
        if (k === 1 && ioPast(t, cAgain)) { opt.col = P.gold; opt.sw = 4; }
        if (k >= 1 && ioPast(t, cPass)) { opt.mark = "tick"; opt.markP = popIn(t, cPass, 0.35); }
      }
      if (k === 2 && n < nEvery) { opt.mark = "tick"; opt.markP = popIn(t, cEvery, 0.35); }
      if (n === 1) {
        /* the wrong block leaves and the right one takes its place */
        var b = IO_PB, y = ioPartY(1), x2 = b.x + 22 + ioChipW("repeat2") + 10;
        var gone = on(t, cOut, 0.5), came = popIn(t, cOut, Math.max(0.4, cIn - cOut));
        out += G(R(b.x, y, b.w, b.h, 18, P.cell, opt.col || P.line, opt.sw || 2) +
          Tx(b.x + 22, y + 34, part.name, "lab", "start") +
          ioChip(b.x + 22, y + 50, 44, "repeat2", 1, {}), { opacity: 1 });
        if (gone < 1) out += G(ioChip(x2, y + 50, 44, "spin", 1, { col: P.bad, ink: P.bad }),
          { opacity: 1 - gone, transform: tr(0, gone * 40) });
        out += MK.cross(x2 + ioChipW("spin") + 30, y + 72, 18, popIn(t, cOut, 0.35) * (1 - gone));
        if (fixed) out += ioChip(x2, y + 50, 44, "jump", came, { col: P.good });
        if (opt.mark === "tick") out += MK.tick(b.x + b.w - 40, y + 34, 20, opt.markP);
        return;
      }
      out += ioPartBox(n, part, 1, opt);
    });

    /* every part passing, and then the whole program */
    var wh = on(t, cWhole, 0.5);
    if (k === 2 && wh > 0) out += R(32, 22, 636, 396, 22, "none", P.good, 4, { opacity: wh });

    /* the stage: the part is run again and the cat really does jump twice */
    var cat = { dx: 0 }, extra = "";
    if (k === 1) {
      cat.hop = ioDo(t, cTwo, 1.2);
      cat.hops = IO_JUMPS;
      var done = tally(t, cTwo, IO_JUMPS, 1.1), q, ids = [];
      for (q = 0; q < done; q++) ids.push("jump");
      if (ids.length) {
        var bw = ioChipsW(ids) + 36;
        extra += ioChips(IO_CX - bw / 2 + 18, 88, 44, ids, 1, { col: P.good });
      }
    } else if (k === 2) {
      extra += MK.pop(MK.tick(IO_CX, 170, 54, 1), IO_CX, 170, popIn(t, cWhole, 0.45));
    }
    out += ioStage(1, "") + ioCat(cat) + extra;
    return out;
  }

  function ioFixRound2(scene, t, k) {
    var out = "";
    var cNext = sc(scene, 3, "next"), cBugs = sc(scene, 3, "twobugs"), cParts = sc(scene, 3, "parts");
    var cOneTime = sc(scene, 4, "onetime"), cEasier = sc(scene, 4, "easier");
    var nBugs = tally(t, cBugs, 2, 0.7);
    var scan = k === 4 ? tally(t, cOneTime, 4, 1.9) - 1 : -1;
    var allDone = k === 4 && ioPast(t, cEasier);
    var arrive = on(t, cNext, 0.5);

    IO_RUN2.forEach(function (part, n) {
      var opt = {}, bugN = n === 1 ? 1 : n === 2 ? 2 : 0;
      var cleared = allDone || (scan >= 0 && n < scan);
      if (part.bug && !cleared && bugN <= nBugs) { opt.mark = "bug"; opt.markP = popIn(t, cBugs, 0.4); }
      if (cleared || (!part.bug && scan >= n && scan >= 0)) { opt.mark = "tick"; opt.markP = 1; }
      if (part.bug && ioPast(t, cParts) && !cleared) { opt.col = P.bad; opt.sw = 4; }
      if (scan === n && !allDone) { opt.col = P.gold; opt.sw = 4; }
      if (cleared) { opt.col = P.good; opt.sw = 3; }
      out += ioPartBox(n, part, arrive, opt);
    });
    if (allDone) out += R(32, 22, 636, 396, 22, "none", P.good, 4, { opacity: on(t, cEasier, 0.5) });

    /* what that program was meant to do, so the mismatch is visible */
    var rows = "";
    rows += Tx(IO_ST.x + 28, 88, "what we wanted", "lab mid muted", "start");
    IO_WANT2.forEach(function (ids, n) {
      var y = 108 + n * 92;
      var cleared = allDone || (scan >= 0 && n < scan);
      rows += ioChips(IO_ST.x + 28, y, 44, ids, 1, { dim: cleared ? 1 : 0.75, col: cleared ? P.good : P.line });
      rows += MK.tick(IO_ST.x + IO_ST.w - 32, y + 22, 14, cleared ? 1 : 0);
    });
    out += ioPanel(arrive, rows);
    return out;
  }

  function ioFixChapter(scene, beat, t, i) {
    var k = i - scene.first, u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(ioFixRound1(scene, t, k), { opacity: 1 - u });
    if (u > 0) out += G(ioFixRound2(scene, t, k), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: debugging systematically ==========================================
     The two ways side by side: on the left the same three blocks shuffled about
     until something works, on the right the same three split into parts and run
     one at a time. */

  var IO_BAD = { x: 40, y: 56, w: 520, h: 330 };
  var IO_GOOD = { x: 608, y: 56, w: 520, h: 330 };
  var IO_PROG = ["home", "spin", "say"];
  /* six fixed orders, stepped through: a shuffle that is the same every time
     the film is played (no Math.random anywhere in a film) */
  var IO_SHUF = [[0, 1, 2], [2, 0, 1], [1, 2, 0], [0, 2, 1], [2, 1, 0], [1, 0, 2]];

  function ioBadWay(scene, t, k) {
    var cBad = sc(scene, 0, "badway"), cChange = sc(scene, 0, "changing");
    var cSome = sc(scene, 1, "sometimes"), cNothing = sc(scene, 1, "nothing");
    var cGood = sc(scene, 2, "good");
    var b = IO_BAD, out = "";
    /* the poking about stops when the good way arrives: a card that goes on
       shuffling behind the teaching half pulls the eye off it */
    var tt = cGood != null && t > cGood ? cGood : t;
    var step = ioPast(tt, cChange) ? Math.floor((tt - cChange) / 0.5) % IO_SHUF.length : 0;
    var order = IO_SHUF[step];
    var qm = k === 1 ? on(t, cNothing, 0.5) : 0;
    out += R(b.x, b.y, b.w, b.h, 22, P.card, P.line, 2);
    out += Tx(b.x + b.w / 2, b.y + 40, "the bad way", "lab mid muted", "middle", { opacity: k === 0 ? on(t, cBad, 0.45) : 1 });
    out += R(b.x + 40, b.y + 60, b.w - 80, 240, 16, P.cell, P.line, 2) +
      IO_PROG.map(function (id, n) {
        return ioChip(b.x + 70, b.y + 76 + order[n] * 76, 56, id, 1, {});
      }).join("");
    out += MK.pop(Em(b.x + b.w - 104, b.y + 104, 44, "\u{1F41B}"), b.x + b.w - 104, b.y + 104,
      k === 0 ? popIn(t, cBad, 0.45) : 1);
    out += MK.tick(b.x + b.w - 104, b.y + 186, 26, k === 1 ? popIn(t, cSome, 0.4) : 0);
    out += MK.qmark(b.x + b.w - 104, b.y + 262, 34, qm);
    return out;
  }

  /* One tall program that comes apart into three parts as "split the program
     into parts" is said, then one part run, checked and passed before the next.
     The gaps between the parts are what the split IS, so they open wide enough
     to see. */
  var IO_GY0 = 96, IO_GH0 = 288;                 /* the whole program, before */
  var IO_GY1 = 112, IO_GH1 = 64, IO_GP = 96;     /* and the three parts, after */
  function ioGoodBox(n, sp) {
    return { y: lerp(IO_GY0 + n * (IO_GH0 / 3), IO_GY1 + n * IO_GP, sp),
      h: lerp(IO_GH0 / 3, IO_GH1, sp) };
  }

  function ioGoodWay(scene, t, k) {
    var cGood = sc(scene, 2, "good"), cSys = sc(scene, 2, "systematically"), cSplit = sc(scene, 2, "split");
    var cRunOne = sc(scene, 3, "runone"), cCheck = sc(scene, 3, "check"), cExp = sc(scene, 3, "expected");
    var cMove = sc(scene, 4, "moveon"), cErr = sc(scene, 4, "error"), cHide = sc(scene, 4, "hide");
    var g = IO_GOOD, o = on(t, cGood, 0.5), out = "";
    if (!(o > 0)) return "";
    var sp = on(t, cSplit, 0.8), moved = k === 4 && ioPast(t, cMove);
    out += G(R(g.x, g.y, g.w, g.h, 22, P.card, P.line, 2), { opacity: o });
    out += Tx(g.x + g.w / 2, g.y + 34, "the good way", "lab mid muted", "middle", { opacity: on(t, cSys, 0.45) });
    /* the one program, still whole */
    if (sp < 1) out += R(g.x + 18, IO_GY0 - 6, g.w - 36, IO_GH0 + 12, 18, "none", P.line, 3,
      { opacity: o * (1 - sp), "stroke-dasharray": "12 9" });
    IO_PROG.forEach(function (id, n) {
      var box = ioGoodBox(n, sp);
      var live = (k === 3 && n === 0 && ioPast(t, cRunOne)) || (moved && n === 1);
      var done = (k === 3 && ioPast(t, cExp) && n === 0) || (moved && n === 0);
      var col = done ? P.good : live ? P.gold : P.line;
      out += G(R(g.x + 24, box.y, g.w - 48, box.h, 16, P.cell, col, live || done ? 4 : 2) +
        Tx(g.x + 44, box.y + box.h / 2 + 7, "Part " + (n + 1), "lab mid muted", "start") +
        ioChip(g.x + 128, box.y + box.h / 2 - 22, 44, id, 1, {}), { opacity: o });
      if (done && k === 4) out += MK.tick(g.x + g.w - 62, box.y + box.h / 2, 18, 1);
    });
    /* part one's result, beside what was expected of it */
    if (k === 3) {
      var box0 = ioGoodBox(0, sp), ry = box0.y + box0.h / 2 - 29, ok = on(t, cExp, 0.5);
      out += ioResultCard(g.x + 274, ry, "result", "\u{1F3E0}", on(t, cCheck, 0.45), ok);
      out += Tx(g.x + 386, ry + 37, "=", "lab big good", "middle", { opacity: ok });
      out += ioResultCard(g.x + 394, ry, "expected", "\u{1F3E0}", on(t, cExp, 0.45), ok);
    }
    /* the error, cornered in the part it lives in */
    if (k === 4) {
      var box1 = ioGoodBox(1, sp), by = box1.y + box1.h / 2, bx = g.x + g.w - 96;
      out += MK.pop(Em(bx, by, 44, "\u{1F41B}"), bx, by, popIn(t, cErr, 0.4));
      var hd = on(t, cHide, 0.6);
      if (hd > 0) out += C(bx, by, lerp(66, 30, hd), "none", P.bad, 4, { opacity: hd });
    }
    return out;
  }


  /* a small card: what happened, or what was meant to happen */
  function ioResultCard(x, y, tag, pic, o, ok) {
    if (!(o > 0)) return "";
    return G(R(x, y, 96, 58, 12, P.card, ok > 0.5 ? P.good : P.line, ok > 0.5 ? 3 : 2) +
      Tx(x + 48, y + 22, tag, "lab mid muted", "middle") + Em(x + 48, y + 42, 24, pic),
      { opacity: clamp(o, 0, 1) });
  }

  /* The bad way stands in the middle of the screen while it is the only thing
     being talked about, and slides left as the good way arrives beside it. */
  function ioSystemChapter(scene, beat, t, i) {
    var k = i - scene.first;
    var over = k >= 2 ? into(t, scene.first + 2) : 0;
    var dim = 1 - 0.65 * over, dx = lerp((1168 - IO_BAD.w) / 2 - IO_BAD.x, 0, over);
    return svg(G(ioBadWay(scene, t, k), { opacity: dim, transform: tr(dx, 0) }) + ioGoodWay(scene, t, k));
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own five words, with the lesson's own pictures for them. */
  var IO_RECAP = MK.recapKind([
    { beat: 0, at: "input", title: "Input", sub: "what the program waits for", pic: ioFlowPic(true) },
    { beat: 0, at: "output", title: "Output", sub: "what the program does", pic: ioFlowPic(false) },
    { beat: 1, at: "plan", title: "Plan", sub: "name both before you build", pic: "\u{1F4CB}" },
    { beat: 2, at: "test", title: "Systematic", sub: "test one part at a time", pic: "\u{1F9EA}" },
    { beat: 3, at: "fix", title: "Debugging", sub: "fix it, then run it again", pic: "\u{1F41B}" }
  ], { goBeat: 3, goAt: "nowhere" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Each input runs its own script", "Plan an object's input and its output", "Test a program one part at a time"] }),
    inputs: ioInputsChapter, plan: ioPlanChapter, parts: ioPartsChapter,
    fix: ioFixChapter, system: ioSystemChapter, recap: IO_RECAP
  };
