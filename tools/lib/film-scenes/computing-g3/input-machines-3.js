  /* ==== Input Machines, part 3: working it out, the rule, straight through =====
     tools/lib/film-scenes/computing-g3/input-machines-3.js. Joined to parts 1
     and 2 in one scope; see part 1's header. */

  /* ==== chapter: working it out ===================================================
     The lesson's add-3 machine, with an input it has never been given. The
     answer is ART.rule("add:3", 10) - the child works it out in their head and
     the machine agrees, because it is the lesson's own machine. */

  var IM_PR = { x: 386, y: 64, w: 430, h: 300 };
  var IM_PR_MY = IM_PR.y + IM_PR.h * 0.58;
  var IM_PR_STEPS = ["Take the number in", "Add 3 to it", "Send the answer out"];

  function imPredictChapter(scene, beat, t, i) {
    var cKnow = sc(scene, 0, "know"), cOut = sc(scene, 0, "out");
    var cName = sc(scene, 1, "name"), cS = [sc(scene, 1, "s1"), sc(scene, 1, "s2"), sc(scene, 1, "s3")];
    var cIn10 = sc(scene, 2, "in10"), cAsk = sc(scene, 2, "ask"), cHead = sc(scene, 2, "head");
    var cAns = sc(scene, 3, "ans"), cLogic = sc(scene, 3, "logic");
    var out = "", answered = on(t, cAns, 0.4);

    out += imMachineShell({ x: IM_PR.x, y: IM_PR.y, w: IM_PR.w, h: IM_PR.h, col: P.plum,
      name: "The add-3 machine", nameOn: on(t, cName, 0.5), o: popIn(t, cKnow, 0.5) });
    out += MK.arrow(262, IM_PR_MY, 350, IM_PR_MY, on(t, cIn10, 0.5), IM_IN, 8);
    out += MK.arrow(854, IM_PR_MY, 962, IM_PR_MY, on(t, cOut, 0.5), IM_OUT_COL, 8);
    out += Tx(200, IM_PR_MY + 88, "input", "lab big", "middle", { fill: IM_IN, opacity: on(t, cIn10, 0.5) });
    out += Tx(1030, IM_PR_MY + 88, "output", "lab big", "middle", { fill: IM_OUT_COL, opacity: on(t, cOut, 0.5) });

    for (var k = 0; k < 3; k++) {
      var said = on(t, cS[k], 0.4), y = 150 + k * 66;
      out += imStepRow(412, y, 378, 54, k + 1, null, on(t, cKnow, 0.5) * (1 - said), false);
      out += imStepRow(412, y, 378, 54, k + 1, IM_PR_STEPS[k], said, k === 1 && imPast(t, cHead) && !imPast(t, cAns));
    }

    /* the input the machine has never been given, and the answer nobody has seen */
    out += imTile(200, IM_PR_MY, 96, "10", popIn(t, cIn10, 0.45), IM_IN);
    var wonder = popIn(t, cOut, 0.45) * (1 - answered) * (imPast(t, cAsk) ? 0.7 + 0.3 * breathe(t) : 1);
    out += MK.qmark(1030, IM_PR_MY, 48, wonder);
    out += imTile(1030, IM_PR_MY, 96, IM_OUT.add3of10, popIn(t, cAns, 0.45), IM_OUT_COL);
    out += MK.tick(1118, IM_PR_MY - 66, 26, popIn(t, cAns == null ? null : cAns + 0.3, 0.4));

    /* following the steps in your head */
    out += MK.bubble(52, 26, 300, 92, "10 + 3", on(t, cHead, 0.5), 200, 184);
    out += MK.pill(601, 406, "logical thinking", on(t, cLogic, 0.5), { size: 22, col: P.plum, ink: P.plum });
    return svg(out);
  }

  /* ==== chapter: finding the rule =================================================
     Nobody says what this machine does. Two rules fit the first pair and only
     one survives the second - which is why the lesson's own word card says to
     test a rule twice. Every number in the two cards is ART.rule: add:8 and
     times:3, on 4 and on 5. */

  var IM_RU = { x: 384, y: 20, w: 400, h: 170 };
  var IM_RU_MY = IM_RU.y + IM_RU.h * 0.58;
  var IM_GUESS = { y: 254, h: 158, w: 440 };
  function imGuessX(k) { return 124 + k * (IM_GUESS.w + 40); }

  /* one candidate rule, and what it does to the inputs it has been tried on */
  function imGuessCard(k, name, rows, o, mark, markP, lit) {
    if (!(o > 0)) return "";
    var x = imGuessX(k), col = lit ? IM_OUT_COL : mark === "cross" ? P.bad : P.line;
    var body = R(x, IM_GUESS.y, IM_GUESS.w, IM_GUESS.h, 22, lit ? "#1B3A52" : P.card, col, lit ? 3.5 : 2) +
      Tx(x + 26, IM_GUESS.y + 60, name, "lab big", "start", { fill: col === P.line ? P.ink : col });
    rows.forEach(function (r, n) {
      var y = IM_GUESS.y + 106 + n * 38;
      if (r.o > 0) body += Tx(x + 26, y, r.text, "lab", "start", { fill: r.bad ? P.bad : P.muted, opacity: Math.min(1, r.o) });
      else if (r.slot > 0) body += R(x + 26, y - 22, 168, 30, 10, P.card, P.line, 2, { "stroke-dasharray": "8 7", opacity: Math.min(1, r.slot) });
    });
    if (mark === "tick") body += MK.tick(x + IM_GUESS.w - 62, IM_GUESS.y + IM_GUESS.h / 2, 30, markP);
    else if (mark === "cross") body += MK.cross(x + IM_GUESS.w - 62, IM_GUESS.y + IM_GUESS.h / 2, 30, markP);
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  function imRuleChapter(scene, beat, t, i) {
    var cNo = sc(scene, 0, "norule"), cWork = sc(scene, 0, "work");
    var cIn4 = sc(scene, 1, "in4"), cOut12 = sc(scene, 1, "out12"), cAsk = sc(scene, 1, "ask");
    var cAdd8 = sc(scene, 2, "add8"), cTimes3 = sc(scene, 2, "times3"), cAnother = sc(scene, 2, "another");
    var cIn5 = sc(scene, 3, "in5"), cOut15 = sc(scene, 3, "out15"), cBeat = sc(scene, 3, "beaten");
    var cSurv = sc(scene, 4, "survives"), cEnough = sc(scene, 4, "enough");
    var out = "", second = on(t, cIn5, 0.45);

    out += imMachineShell({ x: IM_RU.x, y: IM_RU.y, w: IM_RU.w, h: IM_RU.h, col: P.good,
      name: "", o: popIn(t, cNo, 0.5) });
    var puzzled = on(t, cNo, 0.5) * (imPast(t, cAsk) ? 0.6 + 0.4 * breathe(t) : 1);
    out += Tx(584, 166, "?", "lab", "middle", { fill: P.good, "font-size": 84, opacity: puzzled });
    out += MK.arrow(290, IM_RU_MY, 348, IM_RU_MY, on(t, cIn4, 0.5), IM_IN, 7);
    out += MK.arrow(822, IM_RU_MY, 880, IM_RU_MY, on(t, cOut12, 0.5), IM_OUT_COL, 7);

    out += imTile(230, IM_RU_MY, 88, "4", popIn(t, cIn4, 0.45) * (1 - second), IM_IN);
    out += imTile(230, IM_RU_MY, 88, "5", popIn(t, cIn5, 0.45), IM_IN);
    out += imTile(950, IM_RU_MY, 88, IM_OUT.times3of4, popIn(t, cOut12, 0.45) * (1 - second), IM_OUT_COL);
    out += imTile(950, IM_RU_MY, 88, IM_OUT.times3of5, popIn(t, cOut15, 0.45), IM_OUT_COL);

    /* before either is named, the shape of a guess; then the guess itself */
    var slot = on(t, cAnother, 0.5);
    var named = [on(t, cAdd8, 0.4), on(t, cTimes3, 0.4)];
    for (var g = 0; g < 2; g++) {
      var empty = on(t, cWork == null ? null : cWork + g * 0.2, 0.5) * (1 - named[g]);
      if (empty > 0)
        out += G(R(imGuessX(g), IM_GUESS.y, IM_GUESS.w, IM_GUESS.h, 22, P.card, P.line, 2, { "stroke-dasharray": "11 9" }) +
          Tx(imGuessX(g) + IM_GUESS.w / 2, IM_GUESS.y + IM_GUESS.h / 2 + 12, "a rule that might fit", "lab mid muted readable", "middle"),
          { opacity: empty });
    }
    out += imGuessCard(0, "add 8", [
      { o: named[0], text: "4 → " + IM_OUT.add8of4 },
      { o: on(t, cBeat, 0.4), slot: slot, text: "5 → " + IM_OUT.add8of5 + ", not " + IM_OUT.times3of5, bad: true }
    ], named[0], imPast(t, cBeat) ? "cross" : "tick",
      imPast(t, cBeat) ? popIn(t, cBeat, 0.4) : popIn(t, cAdd8 == null ? null : cAdd8 + 0.3, 0.4), false);
    out += imGuessCard(1, "times 3", [
      { o: named[1], text: "4 → " + IM_OUT.times3of4 },
      { o: on(t, cSurv, 0.4), slot: slot, text: "5 → " + IM_OUT.times3of5 }
    ], named[1], "tick",
      popIn(t, cTimes3 == null ? null : cTimes3 + 0.3, 0.4), imPast(t, cSurv));

    /* the lesson's own word card: test a rule twice before you trust it */
    out += MK.pill(584, 222, "test a rule twice", on(t, cEnough, 0.5), { size: 20, col: P.good, ink: P.ink, fill: P.cell });
    return svg(out);
  }

  /* ==== chapter: straight through =================================================
     Input in, one step after another, output out. On the last beat the
     question the lesson says comes LATER is drawn as a ghost above the track,
     crossed out while it is not here, and lit when the lesson points forward. */

  var IM_TRACK = { y: 200, boxes: [250, 460, 670], bw: 150, bh: 100, by: 150 };

  function imLinearChapter(scene, beat, t, i) {
    var cLin = sc(scene, 0, "linear"), cChoice = sc(scene, 0, "choices");
    var cIn = sc(scene, 1, "in"), cSteps = sc(scene, 1, "steps"), cOut = sc(scene, 1, "out");
    var cQ = sc(scene, 2, "question"), cAnother = sc(scene, 2, "another");
    var cLater = sc(scene, 3, "later"), cAsk = sc(scene, 3, "ask"), cRoutes = sc(scene, 3, "routes");
    var out = "", later = on(t, cLater, 0.5);

    /* the one straight line the whole chapter is about */
    var line = on(t, cLin, 0.8);
    out += L(138, IM_TRACK.y, lerp(138, 994, line), IM_TRACK.y, P.line, 6, { opacity: Math.min(1, line) });

    var done = imPast(t, cSteps) ? tally(t, cSteps, 3, 1.2) : 0;
    IM_TRACK.boxes.forEach(function (bx, k) {
      var p = popIn(t, cChoice == null ? null : cChoice + k * 0.16, 0.4), lit = done > k;
      if (!(p > 0)) return;
      out += G(R(bx, IM_TRACK.by, IM_TRACK.bw, IM_TRACK.bh, 18, lit ? "#1B3A52" : P.cell, lit ? IM_IN : P.line, lit ? 3.5 : 2.5) +
        Tx(bx + IM_TRACK.bw / 2, IM_TRACK.y + 12, "step " + (k + 1), "lab", "middle", { fill: lit ? IM_IN : P.muted }),
        { opacity: Math.min(1, p), transform: around(bx + IM_TRACK.bw / 2, IM_TRACK.y, Math.min(p, 1.08)) });
    });

    out += MK.pop(Em(92, IM_TRACK.y, 76, "\u{1F4E5}") +
      Tx(92, IM_TRACK.y + 62, "input", "lab mid", "middle", { fill: IM_IN }), 92, IM_TRACK.y, popIn(t, cIn, 0.45));
    out += MK.pop(Em(1040, IM_TRACK.y, 76, "\u{1F4E4}") +
      Tx(1040, IM_TRACK.y + 62, "output", "lab mid", "middle", { fill: IM_OUT_COL }), 1040, IM_TRACK.y, popIn(t, cOut, 0.45));

    /* a finger following it, which is the lesson's own reason linear is easy */
    var walk = on(t, cSteps, 1.5);
    if (walk > 0 && walk < 1) out += MK.finger(lerp(150, 980, walk), IM_TRACK.y + 62, 1);

    /* the question this kind of machine never asks - a ghost, until "later" */
    var ghost = on(t, cQ, 0.5), gOp = ghost * (0.62 + 0.38 * later);
    if (gOp > 0) {
      var col = later > 0.5 ? P.plum : P.muted;
      out += Pth("M535,38 L597,78 L535,118 L473,78 Z", P.card, col, 3,
        { "stroke-dasharray": later > 0.5 ? "none" : "10 8", opacity: gOp });
      out += Tx(535, 90, "?", "lab", "middle",
        { fill: col, "font-size": 42, opacity: gOp * (imPast(t, cAsk) ? 0.6 + 0.4 * breathe(t) : 1) });
      var br = Math.max(on(t, cAnother, 0.6) * 0.8, on(t, cRoutes, 0.6));
      out += MK.arrow(597, 74, 702, 42, br, col, 5);
      out += MK.arrow(597, 82, 702, 114, br, col, 5);
      out += G(R(710, 24, 40, 38, 10, P.card, col, 2.5, { "stroke-dasharray": later > 0.5 ? "none" : "8 7" }) +
        R(710, 96, 40, 38, 10, P.card, col, 2.5, { "stroke-dasharray": later > 0.5 ? "none" : "8 7" }),
        { opacity: br * gOp });
      out += MK.cross(432, 78, 26, popIn(t, cQ == null ? null : cQ + 0.35, 0.4) * (1 - later));
      out += MK.pill(866, 78, "later", later, { size: 20, col: P.plum, ink: P.plum });
    }
    return svg(out);
  }

  /* ==== what you now know =========================================================
     The lesson's own five words for this lesson: input, machine, output, rule,
     predict - each with the lesson's own meaning under it. */
  var IM_RECAP = MK.recapKind([
    { beat: 0, at: "input", title: "Input", sub: "what goes in", pic: "\u{1F4E5}" },
    { beat: 0, at: "machine", title: "Machine", sub: "in one side, out the other", pic: "⚙️" },
    { beat: 0, at: "output", title: "Output", sub: "what comes out", pic: "\u{1F4E4}" },
    { beat: 1, at: "rule", title: "Rule", sub: "what it does to the input", pic: "\u{1F4CF}" },
    { beat: 2, at: "predict", title: "Predict", sub: "say it before you try", pic: "\u{1F52E}" }
  ], { goBeat: 3, goAt: "go" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "What an algorithm is given to work on",
      "How a machine turns an input into an output",
      "How to work out an answer before you try it"
    ] }),
    input: imInputChapter, machine: imMachineChapter, output: imOutputChapter,
    predict: imPredictChapter, rule: imRuleChapter, linear: imLinearChapter, recap: IM_RECAP
  };
