  /* ==== Grade 4 Computing, Lesson 2: Predict and Compare, part 4 ==============
     tools/lib/film-scenes/computing-g4/predict-and-compare-4.js. The chapter
     "Shorter is not always better", the recap cards, and KINDS.

     The shorter algorithm here is the lesson's own pancake algorithm with
     "Flip it" taken out - the distractor the lesson itself offers ("leaving
     out flipping"). The film says only what the lesson says about it: that a
     step is missing, so it is shorter and wrong. It does not claim what the
     pancake would be like, because the lesson never says. */

  var PC_SEVEN = [PC_MIX].concat(PC_PAN, [PC_SERVE]);   /* mix, the five, serve */
  var PC_GONE = 3;                                      /* "Flip it", the step left out */
  var PC_SIX = PC_SEVEN.filter(function (row, k) { return k !== PC_GONE; });
  var PC_SH = { y0: 30, pitch: 34, h: 30, lx: 56, lw: 480, rx: 620, rw: 490 };
  function pcShY(slot) { return PC_SH.y0 + slot * PC_SH.pitch; }

  function pcShorterChapter(scene, beat, t, i) {
    var cTempting = sc(scene, 0, "tempting"), cShorter = sc(scene, 0, "shorter");
    var cWins = sc(scene, 1, "wins"), cJob = sc(scene, 1, "job");
    var cLeaves = sc(scene, 2, "leaves"), cWrong = sc(scene, 2, "wrong");
    var cPurpose = sc(scene, 3, "purpose"), cCompare = sc(scene, 3, "compare");
    var out = "", show = on(t, cTempting, 0.5), gap = on(t, cLeaves, 0.6);

    /* the whole algorithm on the left: seven steps, and it does the job */
    PC_SEVEN.forEach(function (row, k) {
      out += pcRow(PC_SH.lx, pcShY(k), PC_SH.lw, PC_SH.h, row[0], row[1], { o: show });
    });
    out += MK.pill(PC_SH.lx, 290, "7 steps", show, { size: 22, anchor: "start", col: P.line, ink: P.muted });
    out += MK.tick(PC_SH.lx + PC_SH.lw - 30, 290, 22, popIn(t, cWrong, 0.4));

    /* the shorter one on the right: six steps, because one has been left out.
       On "leaves a step out" the rows under the gap slide down and the missing
       step shows in its place, crossed through. */
    PC_SIX.forEach(function (row, k) {
      out += pcRow(PC_SH.rx, pcShY(k < PC_GONE ? k : k + gap), PC_SH.rw, PC_SH.h, row[0], row[1], { o: show });
    });
    if (gap > 0.02) {
      var gy = pcShY(PC_GONE);
      out += R(PC_SH.rx, gy, PC_SH.rw, PC_SH.h, PC_SH.h * 0.3, "none", P.bad, 3,
        { "stroke-dasharray": "9 7", opacity: gap });
      out += G(Em(PC_SH.rx + PC_SH.h * 0.62, gy + PC_SH.h / 2, PC_SH.h * 0.56, PC_SEVEN[PC_GONE][0]) +
        Tx(PC_SH.rx + PC_SH.h * 1.15, gy + PC_SH.h / 2 + 7, PC_SEVEN[PC_GONE][1] + " - missing", "lab", "start",
          { "font-size": 19, fill: P.bad }), { opacity: 0.75 * gap });
    }
    out += MK.pill(PC_SH.rx, 290, "6 steps", show, { size: 22, anchor: "start",
      col: gap > 0.4 ? P.bad : P.line, ink: gap > 0.4 ? P.bad : P.muted });
    out += MK.cross(PC_SH.rx + PC_SH.rw - 30, 290, 22, popIn(t, cWrong, 0.4));
    /* the shorter one looks tempting */
    var glow = on(t, cShorter, 0.5) * (1 - on(t, cLeaves, 0.5));
    if (glow > 0) out += R(PC_SH.rx - 10, PC_SH.y0 - 10, PC_SH.rw + 20, 286, 20, "none", P.gold, 4, { opacity: glow });

    /* does it do the whole job? the question over both */
    var ask = on(t, cWins, 0.5) * (1 - on(t, cPurpose, 0.5));
    if (ask > 0) {
      out += MK.pill(584, 336, "Does it still do the whole job?", ask, { size: 23, col: P.gold, ink: P.gold });
      var q = on(t, cJob, 0.4) * (1 - on(t, cWrong, 0.4));
      out += MK.qmark(PC_SH.lx + PC_SH.lw - 30, 290, 22, q);
      out += MK.qmark(PC_SH.rx + PC_SH.rw - 30, 290, 22, q);
    }

    /* the order to compare in: the purpose first, then the three facts */
    var ord = on(t, cPurpose, 0.5);
    if (ord > 0) {
      out += G(R(60, 346, 250, 76, 20, "rgba(79,209,160,0.12)", P.good, 3) +
        Em(104, 384, 40, "\u{1F3AF}") + Tx(136, 394, "Purpose", "lab big", "start", { fill: P.good }) +
        Tx(136, 368, "first", "lab mid muted", "start"), { opacity: ord });
      out += MK.arrow(322, 384, 386, 384, ord, P.good, 7);
      ["\u{1F522} Steps", "⏱️ Time", "\u{1F4B7} Cost"].forEach(function (label, k) {
        var p = popIn(t, cCompare == null ? null : cCompare + k * 0.22, 0.4), x = 404 + k * 240;
        if (!(p > 0)) return;
        out += G(R(x, 346, 218, 76, 20, P.cell, P.plum, 3) +
          Tx(x + 109, 394, label, "lab big", "middle"), { transform: around(x + 109, 384, Math.min(1.06, p)), opacity: Math.min(1, p) });
      });
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own five words, with the lesson's own pictures for them. */
  var PC_RECAP = MK.recapKind([
    { beat: 0, at: "unroll", title: "Unroll", sub: "write the loop out in full", pic: "\u{1F4DC}" },
    { beat: 0, at: "predict", title: "Predict", sub: "say where it stops, before Go", pic: "\u{1F52E}" },
    { beat: 1, at: "concise", title: "Concise", sub: "the same steps, written once", pic: "\u{1F501}" },
    { beat: 2, at: "compare", title: "Compare", sub: "steps, time, cost, outcome", pic: "⚖️" },
    { beat: 2, at: "purpose", title: "Purpose", sub: "what it must do well", pic: "\u{1F3AF}" }
  ], { goBeat: 2, goAt: "purpose" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "How to predict where a loop leaves Robo",
      "How a repeat makes an algorithm concise",
      "How to compare algorithms and choose for a purpose"
    ] }),
    unroll: pcUnrollChapter, stairs: pcStairsChapter, fold: pcFoldChapter,
    compare: pcCompareChapter, purpose: pcPurposeChapter, shorter: pcShorterChapter,
    recap: PC_RECAP
  };
