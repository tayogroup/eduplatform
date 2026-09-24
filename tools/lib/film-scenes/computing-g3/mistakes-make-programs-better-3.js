  /* ==== Mistakes Make Programs Better, part 3: the error, the partner, the recap
     tools/lib/film-scenes/computing-g3/mistakes-make-programs-better-3.js.
     See the header of mistakes-make-programs-better.js.

     The partner chapter is round 2 of the lesson's own two-bug debugger
     (repeat 3 times, spin, say hello, shrink), whose first bug is the block
     AFTER the repeat - which is what Sami's hint in the lesson tells the child
     to look at. The two children carry no mark but a tick: the bug mark sits on
     the block, never on the person who wrote it. */

  /* ==== chapter: a bug written down is an error ================================
     On the left, two programmers talking: out loud it is a bug. On the right,
     the same mistake written down, which is an error - reported as the lesson's
     own bug report, what you expected against what actually happened. */
  var MB_EP = { x: 40, y: 48, w: 506, h: 228 };
  var MB_ER = { x: 596, y: 48, w: 532, h: 228 };

  function mbErrorChapter(scene, beat, t, i) {
    var cSay = sc(scene, 0, "say"), cTalking = sc(scene, 0, "talking");
    var cWritten = sc(scene, 1, "written"), cError = sc(scene, 1, "error");
    var cReport = sc(scene, 2, "report"), cExpected = sc(scene, 2, "expected"), cHappened = sc(scene, 2, "happened");
    var cDebug = sc(scene, 3, "debug"), cTogether = sc(scene, 3, "together");
    var cEvery = sc(scene, 4, "every"), cLooking = sc(scene, 4, "looking");
    var out = "";

    /* ---- said out loud: a bug */
    var lo = on(t, cSay, 0.5);
    out += G(R(MB_EP.x, MB_EP.y, MB_EP.w, MB_EP.h, 24, P.card, P.line, 2), { opacity: lo });
    var bub = popIn(t, cSay, 0.45);
    if (bub > 0) out += G(Pth("M134,146 L150,182 L178,148 Z", P.paper) +
      R(150, 64, 264, 84, 22, P.paper) +
      Em(206, 106, 44, "\u{1F41B}") +
      Tx(248, 118, "bug", "lab dark", "start", { "font-size": 36 }),
      { opacity: Math.min(1, bub), transform: around(282, 148, Math.min(1.05, bub)) });
    /* the lesson's own two partners, Sami and Amal, with the tones the lesson
       gave them (the film's brown skin is applied only where none was chosen) */
    out += G(Em(140, 216, 96, "\u{1F466}\u{1F3FE}") + Em(452, 216, 96, "\u{1F467}\u{1F3FE}"), { opacity: lo });
    out += MK.waves(196, 202, t, cTalking, { dir: 0, spread: 0.9, reach: 150, col: P.gold,
      until: mbAfter(cTalking, 2.2) });

    /* ---- written down: an error */
    var ro = on(t, cWritten, 0.5);
    out += G(R(MB_ER.x, MB_ER.y, MB_ER.w, MB_ER.h, 20, P.paper) +
      Em(648, 96, 40, "⚠️") +
      L(624, 128, 1100, 128, "#C9C2B4", 2), { opacity: ro });
    var eo = popIn(t, cError, 0.45);
    if (eo > 0) out += G(Tx(684, 108, "error", "lab dark", "start", { "font-size": 36 }),
      { opacity: Math.min(1, eo) });
    /* the two lines of the report, each written as it is said */
    var lines = [
      { at: cExpected, text: "I expected: the cat hides", y: 172 },
      { at: cHappened, text: "What happened: it spun", y: 228 }
    ];
    lines.forEach(function (ln) {
      var u = on(t, ln.at, 0.5);
      if (!(u > 0)) return;
      out += R(620, ln.y - 30, 440 * u, 40, 8, P.gold, null, null, { opacity: 0.22 });
      out += Tx(628, ln.y, ln.text, "lab dark", "start", { "font-size": 25, opacity: u });
    });
    out += MK.ripple(648, 96, t, cReport, P.gold);

    /* ---- you report the error, and then you debug it */
    var du = on(t, cDebug, 0.5), tg = on(t, cTogether, 0.6);
    var d2 = on(t, mbAfter(cDebug, 0.3), 0.5);
    out += MK.pill(760, 306, "error", du, { size: 24, col: P.gold, ink: P.gold });
    out += MK.arrow(820, 306, 918, 306, d2, P.good, 6);
    out += MK.pill(978, 306, "debug", d2, { size: 24, col: P.good, ink: P.good });
    if (d2 > 0.4) out += G(Em(1072, 306, 38, "\u{1F527}"), { opacity: clamp((d2 - 0.4) / 0.5, 0, 1) });
    if (tg > 0) out += R(694, 280, 332, 52, 26, "none", P.teal, 3,
      { opacity: tg * (0.7 + 0.3 * breathe(t)) });

    /* ---- every program ever written */
    var n = tally(t, cEvery, 4, 0.9), fixed = tally(t, cLooking, 4, 0.9);
    for (var k = 0; k < n; k++) {
      var x = 120 + k * 238, y = 346, o = on(t, cEvery, 0.4);
      var ok = k < fixed && mbPast(t, cLooking);
      /* three blocks in the lesson's own category colours, so the card reads as
         a program rather than as a paragraph */
      out += G(R(x, y, 214, 78, 16, P.cell, ok ? P.good : P.line, ok ? 3 : 2) +
        L(x + 18, y + 26, x + 120, y + 26, MB_CAT.control, 7) +
        L(x + 18, y + 44, x + 96, y + 44, MB_CAT.move, 7) +
        L(x + 18, y + 62, x + 132, y + 62, MB_CAT.look, 7), { opacity: o });
      if (ok) out += MK.tick(x + 172, y + 39, 20, popIn(t, mbAfter(cLooking, k * 0.22), 0.35));
      else out += G(Em(x + 172, y + 39, 34, "⚠️"), { opacity: o });
    }
    if (n > 0) out += G(Em(66, 384, 46, "\u{1F440}"), { opacity: popIn(t, cLooking, 0.45) });
    return svg(out);
  }

  /* ==== chapter: two pairs of eyes =============================================
     The lesson's round 2 program between two children: the partner reads every
     block, you skip the ones you are sure about, and the bug is in the block
     after the repeat. Nothing is ever marked but a block. */
  var MB_PAIR = ["repeat3", "spin", "say", "shrink"];
  var MB_PX = 424, MB_PW = 320, MB_PH = 78;
  function mbPairY(k) { return 44 + k * (MB_PH + 14); }

  function mbPartnerChapter(scene, beat, t, i) {
    var cPartner = sc(scene, 0, "partner"), cEvery = sc(scene, 0, "every");
    var cSkip = sc(scene, 1, "skip"), cSure = sc(scene, 1, "sure"), cBug = sc(scene, 1, "bug");
    var cExplain = sc(scene, 2, "explain"), cBlock = sc(scene, 2, "block");
    var cStop = sc(scene, 3, "stop"), cNotSpin = sc(scene, 3, "notspin"), cFound = sc(scene, 3, "found");
    var cRun = sc(scene, 4, "run"), cWatches = sc(scene, 4, "watches"), cWrong = sc(scene, 4, "wrong");
    var out = "";

    var skipped = on(t, cSure, 0.5) * (1 - on(t, cExplain, 0.5));
    /* two blocks, not four: the next line says the explaining stops halfway */
    var said = mbPast(t, cBlock) ? tally(t, cBlock, 2, 0.8) : 0;
    var halted = mbPast(t, cStop);
    var flash = bump(t, cNotSpin, 0.9) + bump(t, cWrong, 0.9);

    /* the program */
    MB_PAIR.forEach(function (id, k) {
      var y = mbPairY(k);
      var lit = (said > 0 && said - 1 === k && !halted) || (halted && k === 1);
      var bad = k === 1 && (mbPast(t, cNotSpin) || mbPast(t, cWrong));
      out += mbBlock(MB_PX, y, MB_PW, MB_PH, id, {
        o: on(t, cPartner, 0.5), n: k + 1, fs: 23,
        col: bad ? P.bad : lit ? P.gold : null,
        /* ALL four go dim while they are skipped, and the one with the bug in it
           comes back on "one of those is the bug": the line says the bug is
           among the blocks you skipped, so leaving one bright would say the
           opposite. */
        dim: skipped > 0.5 && !(k === 1 && mbPast(t, cBug)),
        mark: k === 1 && mbPast(t, cBug) ? "bug" : null, markP: popIn(t, cBug, 0.4)
      });
      if (lit) out += R(MB_PX - 7, y - 7, MB_PW + 14, MB_PH + 14, 26, "none", bad ? P.bad : P.gold, 4,
        { opacity: k === 1 ? Math.max(0.5, flash) : 0.8 });
    });
    /* the partner reads every block: one eye mark beside each */
    var eyes = tally(t, cEvery, 4, 0.9), eyeO = on(t, cEvery, 0.4) * (1 - on(t, cWatches, 0.5));
    for (var k = 0; k < eyes; k++)
      out += G(Em(786, mbPairY(k) + MB_PH / 2, 30, "\u{1F440}"), { opacity: eyeO });

    /* you, on the left */
    var yo = on(t, cSkip, 0.5);
    out += G(Em(190, 180, 116, "\u{1F9D2}"), { opacity: yo });
    out += MK.pill(190, 262, "you", yo, { size: 22, col: P.line, ink: P.muted });
    /* the caption sits under the STACK, not under the child: it names the blocks
       that have gone dim, and under the child it read as a label for her */
    if (skipped > 0.05) out += G(Tx(MB_PX + MB_PW / 2, 426, "you are sure about these", "lab mid muted", "middle",
      { "font-size": 22 }), { opacity: skipped });
    /* explaining it out loud */
    out += MK.waves(252, 176, t, cExplain, { dir: 0, spread: 0.8, reach: 150, col: P.gold,
      until: mbAfter(cStop, 0.2) });
    /* clear of the head: the mark is that the bug was FOUND, and a mark drawn
       over a child's face is a mark on the child */
    out += MK.tick(302, 122, 25, popIn(t, cFound, 0.45));

    /* your partner, on the right */
    var po = on(t, cPartner, 0.5);
    out += G(Em(978, 180, 116, "\u{1F466}\u{1F3FE}"), { opacity: po });   /* Sami, this round's partner in the lesson */
    out += MK.pill(978, 262, "your partner", po, { size: 22, col: P.good, ink: P.good });
    /* one presses Run, the other watches the cat */
    var ru = popIn(t, cRun, 0.45);
    if (ru > 0) out += G(MK.pill(190, 336, "Run", 1, { size: 24, col: P.good, ink: P.good }), { opacity: Math.min(1, ru) });
    out += MK.ripple(190, 336, t, cRun, P.good);
    var wo = on(t, cWatches, 0.5);
    if (wo > 0) {
      out += G(R(878, 300, 200, 104, 18, P.cell, P.line, 2) +
        L(898, 376, 1058, 376, P.line, 3), { opacity: wo });
      out += mbCat(978, 376, 58, 1, mbSpin(t, cWrong), 0, wo);
      out += G(Em(1070, 212, 34, "\u{1F440}"), { opacity: popIn(t, cWatches, 0.4) });
    }
    /* from the cat that just went wrong to the block that did it, up the clear
       lane between the program and the partner */
    out += MK.leader(872, 366, 752, mbPairY(1) + MB_PH / 2, on(t, cWrong, 0.6), P.gold);
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------
     The lesson's own five words, with its own pictures for them. */
  var MB_RECAP = MK.recapKind([
    { beat: 0, at: "habit", title: "Habit", sub: "run, look, think, fix, run", pic: "\u{1F501}" },
    { beat: 1, at: "bug", title: "Bug", sub: "a mistake in a program", pic: "\u{1F41B}" },
    { beat: 1, at: "error", title: "Error", sub: "the bug, written down", pic: "⚠️" },
    { beat: 2, at: "rule", title: "Rule", sub: "learned from a mistake", pic: "\u{1F4CF}" },
    { beat: 3, at: "fresh", title: "Fresh eyes", sub: "a partner reads it new", pic: "\u{1F440}" }
  ], { goBeat: 3, goAt: "partner" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The five steps of the debugging habit", "Why a program can have two bugs", "How a mistake becomes a rule for next time"] }),
    habit: mbHabitChapter, twobugs: mbTwoBugsChapter, rules: mbRulesChapter,
    error: mbErrorChapter, partner: mbPartnerChapter, recap: MB_RECAP
  };
