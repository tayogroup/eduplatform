  /* ==== Input Machines, part 2: the machine, and the output ====================
     tools/lib/film-scenes/computing-g3/input-machines-2.js. Joined to part 1 in
     one scope; see part 1's header. */

  /* ==== chapter: the machine ======================================================
     The lesson's own doubling machine, drawn as the lesson describes it: input
     in one side, the three steps in the middle, output out the other. The three
     steps are the lesson's own words; the two answers are ART.rule("double", 3)
     and ART.rule("double", 5), so this machine is the lesson's machine. */

  var IM_MC = { x: 386, y: 60, w: 430, h: 320 };
  var IM_MC_MY = IM_MC.y + IM_MC.h * 0.58;                 /* the mouth and the chute */
  var IM_MC_STEPS = ["Take the number in", "Add the number to itself", "Send the answer out"];
  function imMcStepY(k) { return 152 + k * 72; }

  function imMachineChapter(scene, beat, t, i) {
    var cMach = sc(scene, 0, "machine"), cIn = sc(scene, 0, "in"), cOut = sc(scene, 0, "out");
    var cSteps = sc(scene, 1, "steps"), cName = sc(scene, 1, "name");
    var cS = [sc(scene, 2, "s1"), sc(scene, 2, "s2"), sc(scene, 2, "s3")];
    var cIn3 = sc(scene, 3, "in3"), cAdd = sc(scene, 3, "add"), cOut6 = sc(scene, 3, "out6");
    var cIn5 = sc(scene, 4, "in5"), cOut10 = sc(scene, 4, "out10");
    var out = "";

    out += imMachineShell({ x: IM_MC.x, y: IM_MC.y, w: IM_MC.w, h: IM_MC.h, col: P.accent,
      name: "The doubling machine", nameOn: on(t, cName, 0.5), o: popIn(t, cMach, 0.5) });

    /* the two sides, named before anything goes through */
    out += MK.arrow(262, IM_MC_MY, 350, IM_MC_MY, on(t, cIn, 0.5), IM_IN, 8);
    out += MK.arrow(854, IM_MC_MY, 962, IM_MC_MY, on(t, cOut, 0.5), IM_OUT_COL, 8);
    out += Tx(200, 150, "input", "lab big", "middle", { fill: IM_IN, opacity: on(t, cIn, 0.5) });
    out += Tx(1030, 150, "output", "lab big", "middle", { fill: IM_OUT_COL, opacity: on(t, cOut, 0.5) });

    /* the steps: three empty slots, then the lesson's own words, one at a time */
    var slots = on(t, cSteps, 0.5);
    for (var k = 0; k < 3; k++) {
      var said = on(t, cS[k], 0.4);
      var lit = k === 1 && ((imPast(t, cAdd) && !imPast(t, cOut6)) ||
        (imPast(t, cIn5) && !imPast(t, cOut10)));
      out += imStepRow(412, imMcStepY(k), 378, 58, k + 1, null, slots * (1 - said), false);
      out += imStepRow(412, imMcStepY(k), 378, 58, k + 1, IM_MC_STEPS[k], said, lit);
    }

    /* what goes in, and what the lesson's own rule sends out */
    var second = on(t, cIn5, 0.45);
    out += imTile(200, 246, 96, "3", popIn(t, cIn3, 0.45) * (1 - second), IM_IN);
    out += imTile(200, 246, 96, "5", popIn(t, cIn5, 0.45), IM_IN);
    out += imTile(1030, 246, 96, IM_OUT.double3, popIn(t, cOut6, 0.45) * (1 - second), IM_OUT_COL);
    out += imTile(1030, 246, 96, IM_OUT.double5, popIn(t, cOut10, 0.45), IM_OUT_COL);

    /* the working, over the machine: what the middle step is doing right now */
    var workA = on(t, cAdd, 0.4) * (1 - second);
    var workB = on(t, cIn5 == null ? null : cIn5 + 0.3, 0.4);
    if (workA > 0) out += MK.pill(601, 32, imPast(t, cOut6) ? "3 + 3 = " + IM_OUT.double3 : "3 + 3", workA, { size: 24, col: P.accent, ink: P.ink });
    if (workB > 0) out += MK.pill(601, 32, imPast(t, cOut10) ? "5 + 5 = " + IM_OUT.double5 : "5 + 5", workB, { size: 24, col: P.accent, ink: P.ink });
    return svg(out);
  }

  /* ==== chapter: the output =======================================================
     Three beats and three pictures. First the lesson's three results - the
     answer, the cake (the kit's own cake scene, finished), the search results.
     Then the lesson's own make-a-cup-of-squash sorter, where the same things are
     told apart: input, step, output. Then the same machine twice, with a
     different input each time and a different answer each time. */

  function imGearBox(x, y, w, h, col, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 20, P.cell, col, 4) + R(x + 12, y + 12, w - 24, 20, 8, P.card, col, 2) +
      Em(x + w / 2, y + h * 0.62, h * 0.46, "⚙️"),
      { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, Math.min(o, 1.08)) });
  }

  /* the three results the lesson names */
  var IM_RESULTS = { y: 70, h: 306, w: 344, gap: 26 };
  function imResultX(k) { return 42 + k * (IM_RESULTS.w + IM_RESULTS.gap); }
  function imResultCard(k, label, inner, p, frame) {
    var x = imResultX(k), out = "";
    if (frame > 0 && p < 1)
      out += R(x, IM_RESULTS.y, IM_RESULTS.w, IM_RESULTS.h, 22, P.card, P.line, 2,
        { "stroke-dasharray": "11 9", opacity: Math.min(1, frame) * (1 - Math.min(1, p)) });
    if (!(p > 0)) return out;
    return out + G(R(x, IM_RESULTS.y, IM_RESULTS.w, IM_RESULTS.h, 22, P.card, IM_OUT_COL, 3) +
      Tx(x + IM_RESULTS.w / 2, IM_RESULTS.y + 40, label, "lab mid muted readable", "middle") + inner,
      { opacity: Math.min(1, p), transform: around(x + IM_RESULTS.w / 2, IM_RESULTS.y + IM_RESULTS.h / 2, Math.min(p, 1.06)) });
  }

  /* the lesson's own in-step-out bins */
  var IM_BIN = { y: 96, h: 270, w: 340, gap: 34 };
  function imBinX(k) { return 40 + k * (IM_BIN.w + IM_BIN.gap); }
  function imBin(k, pic, label, o, lit) {
    if (!(o > 0)) return "";
    var x = imBinX(k), col = lit ? IM_OUT_COL : P.line;
    return G(R(x, IM_BIN.y, IM_BIN.w, IM_BIN.h, 22, lit ? "#1B3A52" : P.card, col, lit ? 3.5 : 2) +
      Em(x + 50, IM_BIN.y + 48, 36, pic) +
      Tx(x + 84, IM_BIN.y + 58, label, "lab big", "start", { fill: lit ? IM_OUT_COL : P.ink }),
      { opacity: clamp(o, 0, 1) });
  }
  function imBinItem(k, slot, of, pic, p, t, at) {
    if (!(p > 0)) return "";
    var x = imBinX(k) + IM_BIN.w / 2 + (slot - (of - 1) / 2) * 120, y = IM_BIN.y + 178;
    return MK.pop(Em(x, y, 62, pic), x, y, p) + MK.ripple(x, y, t, at, IM_OUT_COL);
  }

  function imOutputChapter(scene, beat, t, i) {
    var cRes = sc(scene, 0, "result"), cAns = sc(scene, 0, "answer"),
      cCake = sc(scene, 0, "cake"), cResults = sc(scene, 0, "results");
    var cSq = sc(scene, 1, "squash"), cStuff = sc(scene, 1, "stuff"), cInput = sc(scene, 1, "input");
    var cSteps = sc(scene, 2, "steps"), cOutput = sc(scene, 2, "output");
    var cSame = sc(scene, 3, "same"), cDifIn = sc(scene, 3, "difin"), cDifOut = sc(scene, 3, "difout");
    var pA = imPhase(t, scene, 0, 0), pB = imPhase(t, scene, 1, 2), pC = imPhase(t, scene, 3, 3);
    var out = "";

    /* --- the three results --- */
    if (pA > 0) {
      var a = "";
      a += Tx(584, 44, "the output", "lab big", "middle", { fill: IM_OUT_COL, opacity: on(t, cRes, 0.5) });
      var fr = on(t, cRes, 0.5);
      a += imResultCard(0, "the answer",
        Tx(imResultX(0) + IM_RESULTS.w / 2, 176, "3 + 4", "lab big muted", "middle") +
        imTile(imResultX(0) + IM_RESULTS.w / 2, 272, 104, IM_OUT.sum34, popIn(t, cAns == null ? null : cAns + 0.2, 0.4), IM_OUT_COL),
        popIn(t, cAns, 0.4), fr);
      a += imResultCard(1, "the cake",
        ART.place(ART.scene("cake", ["bowl", "flour", "eggs", "mix", "tin", "oven", "cool"]), imResultX(1) + 12, 128, 320, 240),
        popIn(t, cCake, 0.4), fr);
      a += imResultCard(2, "the search results",
        [0, 1, 2].map(function (r) {
          var y = 148 + r * 66, x = imResultX(2) + 18, o = on(t, cResults == null ? null : cResults + r * 0.22, 0.35);
          if (!(o > 0)) return "";
          return G(R(x, y, IM_RESULTS.w - 36, 54, 14, P.cell, P.line, 2) + Em(x + 34, y + 27, 32, "\u{1F981}") +
            Tx(x + 62, y + 35, "lions", "lab", "start"), { opacity: o });
        }).join(""),
        popIn(t, cResults, 0.4), fr);
      out += G(a, { opacity: pA });
    }

    /* --- input, step or output: the lesson's cup of squash --- */
    if (pB > 0) {
      var b = "";
      b += Tx(584, 52, "make a cup of squash", "lab big", "middle", { opacity: on(t, cSq, 0.5) });
      b += imBin(0, "\u{1F4E5}", "Input", on(t, cSq, 0.5), imPast(t, cInput) && !imPast(t, cSteps));
      b += imBin(1, "\u{1F463}", "Step", on(t, cSq == null ? null : cSq + 0.2, 0.5), imPast(t, cSteps) && !imPast(t, cOutput));
      b += imBin(2, "\u{1F4E4}", "Output", on(t, cSq == null ? null : cSq + 0.4, 0.5), imPast(t, cOutput));
      b += imBinItem(0, 0, 2, "\u{1F9F4}", popIn(t, cStuff, 0.4), t, cStuff);
      b += imBinItem(0, 1, 2, "\u{1F4A7}", popIn(t, cStuff == null ? null : cStuff + 0.35, 0.4), t, cStuff == null ? null : cStuff + 0.35);
      b += imBinItem(1, 0, 2, "\u{1F964}", popIn(t, cSteps, 0.4), t, cSteps);
      b += imBinItem(1, 1, 2, "\u{1F944}", popIn(t, cSteps == null ? null : cSteps + 0.35, 0.4), t, cSteps == null ? null : cSteps + 0.35);
      b += imBinItem(2, 0, 1, "\u{1F379}", popIn(t, cOutput, 0.4), t, cOutput);
      b += MK.tick(imBinX(0) + IM_BIN.w - 46, IM_BIN.y + 48, 24, popIn(t, cInput, 0.4));
      b += MK.tick(imBinX(2) + IM_BIN.w - 46, IM_BIN.y + 48, 24, popIn(t, cOutput == null ? null : cOutput + 0.3, 0.4));
      out += G(b, { opacity: pB });
    }

    /* --- the same machine, a different input, a different output --- */
    if (pC > 0) {
      var c = "", rows = [{ y: 110, inn: "3", ans: IM_OUT.double3 }, { y: 250, inn: "5", ans: IM_OUT.double5 }];
      c += Tx(230, 62, "input", "lab big", "middle", { fill: IM_IN, opacity: on(t, cDifIn, 0.45) });
      c += Tx(520, 62, "the doubling machine", "lab big", "middle", { fill: P.accent, opacity: on(t, cSame, 0.45) });
      c += Tx(800, 62, "output", "lab big", "middle", { fill: IM_OUT_COL, opacity: on(t, cDifOut, 0.45) });
      rows.forEach(function (r, n) {
        var mid = r.y + 50, pm = popIn(t, cSame == null ? null : cSame + n * 0.22, 0.4);
        c += imGearBox(390, r.y, 260, 100, P.accent, pm);
        c += MK.arrow(290, mid, 370, mid, on(t, cDifIn == null ? null : cDifIn + n * 0.22, 0.4), IM_IN, 7);
        c += MK.arrow(670, mid, 750, mid, on(t, cDifOut == null ? null : cDifOut + n * 0.22, 0.4), IM_OUT_COL, 7);
        c += imTile(230, mid, 88, r.inn, popIn(t, cDifIn == null ? null : cDifIn + n * 0.22, 0.4), IM_IN);
        c += imTile(800, mid, 88, r.ans, popIn(t, cDifOut == null ? null : cDifOut + n * 0.22, 0.4), IM_OUT_COL);
      });
      out += G(c, { opacity: pC });
    }
    return svg(out);
  }
