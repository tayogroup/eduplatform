
  /* ==== chapters: the conclusion, and the recap =================================
     tools/lib/film-scenes/science-g4/the-paper-spinner-4.js. */

  /* ---- what the results say -------------------------------------------------------
     Both spinners' drops on one line, in two colours, which is exactly the
     lesson's own third home project ("Two clusters, and the answer to the
     question, on one sheet"). The right of the frame builds the argument in
     the lesson's order: every single drop, then the pattern, then a conclusion
     tied back to the question that was asked. */
  function pspCX(v) { return 60 + (v - 1.9) * 475; }
  var PSP_CAXIS = 334, PSP_CDOT = 296;
  var PSP_SMALL = [2.1, 2.3, 2.0], PSP_BIG = [2.8, 3.0, 2.7];

  function pspConcludeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSmall = c(0, "small"), cBig = c(0, "big");
    var cClusters = c(1, "clusters"), cLonger = c(1, "longer"), cEvery = c(1, "every");
    var cPattern = c(2, "pattern"), cMatch = c(2, "matches");
    var cConcl = c(3, "conclusion"), cQuestion = c(3, "question"), cRel = c(3, "reliable");
    var out = "", spin = t * 2.2;

    /* the plot, which stays for the whole chapter: the evidence is on screen
       while the conclusion is drawn from it */
    var g = R(24, 46, 636, 374, 18, P.card, P.line, 2) +
      L(56, PSP_CAXIS, 640, PSP_CAXIS, P.muted, 4);
    var marks = [["2.0", 2.0], ["2.5", 2.5], ["3.0", 3.0]];
    for (var q = 0; q < 3; q++) {
      g += L(pspCX(marks[q][1]), PSP_CAXIS - 8, pspCX(marks[q][1]), PSP_CAXIS + 8, P.muted, 3);
      g += Tx(pspCX(marks[q][1]), PSP_CAXIS + 36, marks[q][0], "lab mid muted", "middle");
    }
    g += Tx(345, PSP_CAXIS + 66, "seconds", "lab mid muted", "middle");
    /* the two keys, each drawn as its own spinner */
    g += pspSpinner(120, 89, 1.1, PSP_WING_SMALL, spin, on(t, cSmall, 0.4));
    g += MK.pill(238, 96, "small wings", Math.min(1, popIn(t, cSmall, 0.4)), { size: 20, col: P.teal, ink: P.teal });
    g += pspSpinner(408, 89, 1.1, PSP_WING_BIG, spin + 0.7, on(t, cBig, 0.4));
    g += MK.pill(528, 96, "bigger wings", Math.min(1, popIn(t, cBig, 0.4)), { size: 20, col: P.gold, ink: P.gold });
    for (var d = 0; d < 3; d++) {
      var ps = popIn(t, cSmall == null ? null : cSmall + 0.3 + d * 0.22, 0.4);
      var pb = popIn(t, cBig == null ? null : cBig + 0.3 + d * 0.22, 0.4);
      if (ps > 0) g += C(pspCX(PSP_SMALL[d]), PSP_CDOT, 17, P.teal, P.ground, 3, { opacity: Math.min(1, ps) });
      if (pb > 0) g += C(pspCX(PSP_BIG[d]), PSP_CDOT, 17, P.gold, P.ground, 3, { opacity: Math.min(1, pb) });
    }
    /* the figure the voice gives for each set, over its own dots */
    g += MK.pill(155, 224, "about 2.1 s", Math.min(1, popIn(t, cSmall == null ? null : cSmall + 1.0, 0.4)), { size: 22, col: P.teal, ink: P.teal });
    g += MK.pill(492, 224, "about 2.8 s", Math.min(1, popIn(t, cBig == null ? null : cBig + 1.0, 0.4)), { size: 22, col: P.gold, ink: P.gold });
    var cl = on(t, cClusters, 0.5);
    if (cl > 0) {
      g += E(171, PSP_CDOT, 105, 42, "none", P.teal, 4, { opacity: cl, "stroke-dasharray": "13 9" });
      g += E(511, PSP_CDOT, 105, 42, "none", P.gold, 4, { opacity: on(t, cClusters == null ? null : cClusters + 0.25, 0.5), "stroke-dasharray": "13 9" });
    }
    out += g;

    /* every single drop: three pairs, each the same way round */
    var pa = pspFrom(t, scene, 1) * pspUntil(t, scene, 2);
    if (pa > 0) {
      /* the three pairs arrive from "took longer"; "every single drop" ticks
         them, so both halves of the line have something to move */
      var rowsIn = tally(t, cLonger, 3, 0.8), pr = "";
      for (var k = 0; k < 3; k++) {
        if (k >= rowsIn) continue;
        var ry = 130 + k * 92, pk = popIn(t, cLonger == null ? null : cLonger + k * 0.27, 0.4);
        pr += MK.pill(790, ry, PSP_SMALL[k].toFixed(1) + " s", Math.min(1, pk), { size: 26, col: P.teal, ink: P.teal });
        pr += MK.arrow(858, ry, 926, ry, Math.min(1, pk), P.gold, 7);
        pr += MK.pill(990, ry, PSP_BIG[k].toFixed(1) + " s", Math.min(1, pk), { size: 26, col: P.gold, ink: P.gold });
        pr += MK.tick(1106, ry, 22, popIn(t, cEvery == null ? null : cEvery + k * 0.22, 0.35));
      }
      out += G(pr, { opacity: clamp(pa, 0, 1) });
    }

    /* the pattern: how long each one took, as a bar you can compare */
    var pbn = pspFrom(t, scene, 2) * pspUntil(t, scene, 3);
    if (pbn > 0) {
      var u = on(t, cPattern, 0.9), pp = "";
      pp += pspSpinner(740, 138, 1.1, PSP_WING_SMALL, spin, Math.min(1, u * 3));
      pp += R(800, 132, 109 * u, 26, 8, P.teal);
      pp += Tx(925, 154, "2.1 s", "lab big", "start", { opacity: u, fill: P.teal });
      pp += pspSpinner(740, 258, 1.1, PSP_WING_BIG, spin + 0.7, Math.min(1, u * 3));
      pp += R(800, 252, 146 * u, 26, 8, P.gold);
      pp += Tx(962, 274, "2.8 s", "lab big", "start", { opacity: u, fill: P.gold });
      pp += MK.pill(880, 356, "as predicted", Math.min(1, popIn(t, cMatch, 0.4)), { size: 24, col: P.good, ink: P.good });
      pp += MK.tick(1050, 356, 26, popIn(t, cMatch, 0.4));
      out += G(pp, { opacity: clamp(pbn, 0, 1) });
    }

    /* the conclusion, tied back to the question that was asked */
    var pc = pspFrom(t, scene, 3);
    if (pc > 0) {
      var co = on(t, cConcl, 0.5), qo = on(t, cQuestion, 0.5), ro = popIn(t, cRel, 0.4), pz = "";
      pz += R(690, 52, 460, 362, 20, P.cell, P.teal, 3, { opacity: co });
      pz += Tx(920, 206, "Yes - bigger wings", "lab big gold", "middle", { opacity: co });
      pz += Tx(920, 246, "fall more slowly.", "lab big gold", "middle", { opacity: co });
      pz += Tx(920, 108, "Does a bigger spinner", "lab mid muted", "middle", { opacity: qo });
      pz += Tx(920, 138, "fall more slowly?", "lab mid muted", "middle", { opacity: qo });
      pz += MK.arrow(920, 152, 920, 176, qo, P.gold, 6);
      pz += MK.pill(896, 340, "reliable", Math.min(1, ro), { size: 26, col: P.good, ink: P.good });
      pz += MK.tick(1062, 340, 26, ro);
      out += G(pz, { opacity: clamp(pc, 0, 1) });
    }
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------------- */
  /* a dot plot, small: the chart the lesson asks for, not the bar chart its own
     explain warns the child away from */
  function pspDotCard(cx, cy, size) {
    var w = size * 1.25, y = cy + size * 0.3;
    return L(cx - w / 2, y, cx + w / 2, y, P.muted, 4) +
      C(cx - w * 0.22, y - 26, 13, P.teal) + C(cx, y - 26, 13, P.teal) + C(cx + w * 0.26, y - 26, 13, P.teal);
  }
  function pspSpinCard(cx, cy, size, t) {
    return pspSpinner(cx, cy - size * 0.16, size / 44, PSP_WING_BIG, t * 2.2, 1);
  }

  var PSP_RECAP = MK.recapKind([
    { beat: 0, at: "fair", title: "Fair test", sub: "change one, keep the rest the same", pic: "⚖️" },
    { beat: 1, at: "kit", title: "The right kit", sub: "a stopwatch and a tape measure", pic: "⏱️" },
    { beat: 1, at: "units", title: "Standard units", sub: "seconds and centimetres", pic: "\u{1F4CF}" },
    { beat: 1, at: "repeat", title: "Repeat it", sub: "three close drops are reliable", pic: pspSpinCard },
    { beat: 2, at: "plot", title: "Dot plot", sub: "one dot for each measurement", pic: pspDotCard },
    { beat: 2, at: "answer", title: "Conclusion", sub: "bigger wings, slower fall", pic: "\u{1F4DD}" }
  ], { goBeat: 2, goAt: "answer" });

  var KINDS = {
    title: MK.titleKind({ sub: ["One question, one fair test", "Three drops of each spinner", "A dot plot, and the answer"] }),
    enquiry: pspEnquiryChapter, fairtest: pspFairChapter, kit: pspKitChapter,
    repeat: pspRepeatChapter, record: pspRecordChapter, conclude: pspConcludeChapter,
    recap: PSP_RECAP
  };
