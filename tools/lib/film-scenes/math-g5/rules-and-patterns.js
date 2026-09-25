
  /* ==== Grade 5 Mathematics, Lesson 2: Rules and Patterns =====================
     tools/lib/film-scenes/math-g5/rules-and-patterns.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-5-app/lecture-video/rules-and-patterns.json.

     Grade 5 is not a deck (see BRIEF.md): this film sits ABOVE the lesson's
     three static lecture parts and does not replace them, and it teaches the
     lesson's own six worked steps (8-13), not just the three named parts,
     because the lesson page itself is where the worked numbers live.

     Mathematics has no lesson kit, so every drawing is either one of the
     shared maths pictures (tools/lib/ehel-film-art-math.js) - ART.sequence for
     every term strip, ART.numberLine for the decimal hops past zero - or drawn
     by hand where the library has nothing: the triangle-and-circle two-unknowns
     puzzle (no algebra-tile picture in ART) and the growing matchstick-square
     pattern (no growing-pattern picture in ART). Both are noted in the report.

     Every number said is the lesson's own. The two square/cube "gaps of gaps"
     examples continue the app's own HIDDEN chip formulas one term further than
     the chip itself shows (1,4,9,16 -> 1,4,9,16,25 and 1,8,27,64 -> +125) so
     that the second-gap row the lesson's note describes (a settled 2, and a
     still-growing 12,18,24) actually has enough terms to draw - the app's own
     f(i) formula generates the extra term, nothing is invented.

     This file: the palette, the small reveal helpers, the title motif, and the
     chapters "Start, then keep going" and "Find the rule from the gaps". Every
     top-level name starts with rap (from the slug). */

  var HUE = {
    title: P.teal, seqrule: P.gold, findrule: P.accent, twounknowns: P.blue,
    hiddensquares: P.plum, shapepatterns: P.good, numberline: P.bad, recap: P.teal
  };

  /* ---- small reveal helpers, the same shape as the other Maths films -------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does */
  function rapOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, and staying there */
  function rapFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 over span from a cue, staying at 1: a move that finishes and stays */
  function rapStep(t, at, span) { return at == null ? 0 : ease(clamp((t - at) / (span || 0.5), 0, 1)); }
  /* a ring round something being named, the same shape every Maths film uses */
  function rapRing(x, y, r, p, col) {
    if (!(p > 0)) return "";
    return G(C(x, y, r, "none", col || P.gold, 4), { transform: around(x, y, Math.min(p, 1.12)), opacity: Math.min(1, p) });
  }

  /* ==== the title motif =========================================================
     A term strip (3, 7, 11, 15) with its rule arrows, above three growing
     squares standing for the shape patterns the lesson ends on: the two halves
     of "Rules and Patterns". On the two cards it simply stands; in the spoken
     title chapter the strip rules itself in term by term, then the squares
     grow. */
  var RAP_TITLE_TERMS = [3, 7, 11, 15];
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene || null;
    var seqO = s ? on(t, sc(s, 0, "seq"), 0.7) : 1;
    var ruleO = s ? on(t, sc(s, 0, "rule"), 0.6) : 1;
    var ttrO = s ? on(t, sc(s, 1, "ttr"), 0.6) : 1;
    var nextO = s ? popIn(t, sc(s, 1, "next"), 0.45) : 1;
    var out = "", i;
    out += C(180, 180, 172, "#123247");
    /* the term strip: four chips, revealed left to right, with an arrow and a
       small "+4" between consecutive chips once the strip is named */
    var chipY = 128, chipR = 26, xs = [64, 148, 232, 316];
    var reached = tally(t, s ? sc(s, 0, "seq") : 0, 4, 1.1) * (s ? Math.min(1, seqO * 3) : 1);
    for (i = 0; i < 4; i++) {
      var p = popIn(t, s ? sc(s, 0, "seq") : null, 0.4 + i * 0.001);
      var show = s ? (i < reached ? 1 : 0) : 1;
      if (!(show > 0)) continue;
      if (i > 0) out += G(MK.arrow(xs[i - 1] + chipR, chipY, xs[i] - chipR, chipY, ruleO, P.gold, 4));
      out += C(xs[i], chipY, chipR, P.tealSoft, P.teal, 3, { opacity: show });
      out += Tx(xs[i], chipY + 8, String(RAP_TITLE_TERMS[i]), "lab big", "middle", { opacity: show });
    }
    if (ruleO > 0) out += Tx(180, 74, "+4 each time", "lab mid muted readable", "middle", { opacity: ruleO });
    /* three growing squares: the shape-pattern half of the lesson */
    var sqY = 258, sizes = [20, 30, 40], gx = 96;
    for (i = 0; i < 3; i++) {
      var pg = popIn(t, s ? sc(s, 1, "next") : null, 0.4 + i * 0.15) * (s ? 1 : 1);
      var vis = s ? Math.min(1, nextO * 1.4 - i * 0.18) : 1;
      if (!(vis > 0)) continue;
      var sx = gx + i * 108, sy = sqY + (40 - sizes[i]);
      out += R(sx - sizes[i] / 2, sy - sizes[i], sizes[i], sizes[i], 3, "none", P.gold, 5, { opacity: Math.max(0, Math.min(1, vis)) });
    }
    if (ttrO > 0) out += Tx(180, 330, "a rule, and a pattern", "lab mid muted readable", "middle", { opacity: ttrO });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A strip of four numbers with a rule arrow, above three growing squares">' + out + "</svg>";
  }

  /* ==== chapter: start, then keep going ==========================================
     ART.sequence, 6 boxes: the lesson's own start-at-5 (5, 9, 13, 17, and two
     more the words never name, so they stay "?") then the same rule from
     start-at-3. The layout (box, gap, edge, top) is ART.sequence's own, copied
     here once so every ring lands on the box the words are naming. */
  var RAP_SEQ = { x: 128, y: 60, s: 1.3, w: 702, h: 162 };
  function rapSeqCentre(idx) { return [RAP_SEQ.x + (56 + 118 * idx) * RAP_SEQ.s, RAP_SEQ.y + 76 * RAP_SEQ.s]; }
  function rapSeqPlace(terms) {
    return ART.place(ART.sequence({ terms: terms, step: 4, arrows: true, label: "add 4" }),
      RAP_SEQ.x, RAP_SEQ.y, RAP_SEQ.w * RAP_SEQ.s, RAP_SEQ.h * RAP_SEQ.s);
  }
  var RAP_START5 = [5, 9, 13, 17, null, null], RAP_START3 = [3, 7, 11, 15, null, null];
  var RAP_START3_DONE = [3, 7, 11, 15, null, 23];   /* the 6th term resolved: 3 + 5x4 */

  function rapSeqRuleChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSeq = c(0, "seq"), cTerm = c(0, "term");
    var cFive = c(1, "five"), cRule = c(1, "rule");
    var cTerms = c(2, "terms"), cAgain = c(2, "again");
    var cThree = c(3, "three"), cTerms2 = c(3, "terms2");
    var cFiveTimes = c(4, "fivetimes"), cSixth = c(4, "sixth"), cAnswer = c(4, "answer");

    var swapU = cThree == null ? 0 : into(t, scene.first + 3);
    var answered = cAnswer != null && t >= cAnswer;
    var termsShow3 = answered ? RAP_START3_DONE : RAP_START3;
    var out = "";
    if (swapU < 1) out += G(rapSeqPlace(RAP_START5), { opacity: 1 - swapU });
    if (swapU > 0) out += G(rapSeqPlace(termsShow3), { opacity: swapU });

    /* beat 0-1: the first term rings as "a term", then again as "start at 5" */
    var ring0 = Math.max(popIn(t, cTerm, 0.35) * rapOnly(t, scene, 0), popIn(t, cFive, 0.35) * rapOnly(t, scene, 1));
    if (ring0 > 0) { var p0 = rapSeqCentre(0); out += rapRing(p0[0], p0[1], 46, ring0, P.gold); }

    /* beat 2: all four known terms of the start-5 row ring in turn */
    var reached2 = tally(t, cTerms, 4, 1.0);
    if (reached2 > 0 && rapOnly(t, scene, 2) > 0.02) {
      for (var k = 0; k < reached2; k++) {
        var pk = rapSeqCentre(k), pp = popIn(t, cTerms == null ? null : cTerms + k * 0.24, 0.3);
        out += rapRing(pk[0], pk[1], 40, pp * rapOnly(t, scene, 2), P.teal);
      }
      out += MK.pill(1000, 158, "again and again", on(t, cAgain, 0.4) * rapOnly(t, scene, 2), { size: 26, col: P.teal });
    }

    /* beat 3: the start-3 row rings term by term as it lands */
    var reached3 = tally(t, cTerms2, 4, 0.95);
    if (reached3 > 0 && swapU > 0.4) {
      for (var m = 0; m < reached3; m++) {
        var pm = rapSeqCentre(m), pq = popIn(t, cTerms2 == null ? null : cTerms2 + m * 0.2, 0.3);
        out += rapRing(pm[0], pm[1], 40, pq, P.plum);
      }
    }
    var p0b = rapSeqCentre(0);
    out += rapRing(p0b[0], p0b[1], 46, popIn(t, cThree, 0.4) * rapOnly(t, scene, 3), P.plum);

    /* beat 4: the rule fires 5 times to reach the 6th (still-unknown) term,
       then resolves it the lesson's own way - start + (terms - 1) x step */
    var reached4 = tally(t, cFiveTimes, 5, 1.3);
    if (rapFrom(t, scene, 4) > 0) {
      for (var q = 1; q <= reached4; q++) {
        var pq2 = rapSeqCentre(q);
        out += rapRing(pq2[0], pq2[1], 40, popIn(t, cFiveTimes == null ? null : cFiveTimes + (q - 1) * 0.24, 0.3), P.gold);
      }
      if (reached4 > 0) out += MK.pill(1000, 300, reached4 + " times", 1, { size: 30, col: P.gold });
      var p6 = rapSeqCentre(5);
      out += rapRing(p6[0], p6[1], 46, popIn(t, cSixth, 0.4) * (1 - (answered ? 1 : 0)), P.teal);
      out += MK.pill(1000, 360, "6th term", on(t, cSixth, 0.4) * (1 - (answered ? 1 : 0)), { size: 26, col: P.teal });
      var answerO = popIn(t, cAnswer, 0.4);
      if (answerO > 0) {
        out += rapRing(p6[0], p6[1], 46, Math.min(1, answerO), P.gold);
        out += MK.pill(1000, 360, "3 + 5×4 = 23", Math.min(1, answerO), { size: 24, col: P.gold });
      }
    }
    return svg(out);
  }

  /* ==== chapter: find the rule from the gaps =====================================
     ART.sequence for 2, 4, 6 (a genuinely constant gap, so its own "+2" arrow
     labels are correct); for 2, 4, 8 the library would label BOTH arrows "+2"
     (it prints one step value on every arrow), which is exactly the wrong
     answer this chapter is about, so its arrows are drawn with label: false
     and patched: the correct "+4" is written over the second one only once
     the trap is named. */
  var RAP_SEQA = { x: 110, y: 30, s: 1.2, w: 348, h: 162 };
  var RAP_SEQB = { x: 110, y: 250, s: 1.2, w: 348, h: 132 };
  function rapArrowMid(geo, idx) {
    /* the label position ART.sequence itself computes for the arrow before
       term idx (idx = 1 or 2): x = edge + idx*(box+gap), ax = x-gap+6, bx = x-6 */
    var x = 22 + idx * 118, ax = x - 50 + 6, bx = x - 6, mid = (ax + bx) / 2, laby = 42 - 18;
    return [geo.x + mid * geo.s, geo.y + laby * geo.s];
  }

  function rapFindRuleChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cHidden = c(0, "hidden"), cGap = c(0, "gap");
    var cSeqA = c(1, "seqA"), cAddtwo = c(1, "addtwo");
    var cSeqB = c(2, "seqB"), cGap4 = c(2, "gap4");
    var cNotadd = c(3, "notadd"), cDoubles = c(3, "doubles");
    var cEvery = c(4, "every"), cFirstone = c(4, "firstone");

    var fadeA = on(t, scene.start, 0.6);
    var out = G(ART.place(ART.sequence({ terms: [2, 4, 6], step: 2, arrows: true, label: "add 2" }),
      RAP_SEQA.x, RAP_SEQA.y, RAP_SEQA.w * RAP_SEQA.s, RAP_SEQA.h * RAP_SEQA.s), { opacity: fadeA });

    /* "look at the gap": a ring on the first arrow's label */
    var gapO = on(t, cGap, 0.5) * rapOnly(t, scene, 0);
    if (gapO > 0) { var g1 = rapArrowMid(RAP_SEQA, 1); out += rapRing(g1[0], g1[1], 30, gapO, P.gold); }

    /* beat 1: both terms of 2, 4, 6's gap ring together, "add 2" confirmed */
    var bothO = on(t, cAddtwo, 0.5) * rapOnly(t, scene, 1);
    if (bothO > 0) {
      var ga1 = rapArrowMid(RAP_SEQA, 1), ga2 = rapArrowMid(RAP_SEQA, 2);
      out += rapRing(ga1[0], ga1[1], 30, bothO, P.teal) + rapRing(ga2[0], ga2[1], 30, bothO, P.teal);
    }

    /* beat 2 on: the trap sequence 2, 4, 8 fades in below */
    var fadeB = cSeqB == null ? 0 : into(t, scene.first + 2);
    if (fadeB > 0) {
      out += G(ART.place(ART.sequence({ terms: [2, 4, 8], step: 2, arrows: true, label: false }),
        RAP_SEQB.x, RAP_SEQB.y, RAP_SEQB.w * RAP_SEQB.s, RAP_SEQB.h * RAP_SEQB.s), { opacity: fadeB });
      /* patch the library's own (wrong for this row) second "+2" with "+4" */
      var patchO = on(t, cGap4, 0.4);
      if (patchO > 0) {
        var gb2 = rapArrowMid(RAP_SEQB, 2);
        out += G(R(gb2[0] - 26, gb2[1] - 16, 52, 30, 6, ART.C.card), { opacity: patchO }) +
          Tx(gb2[0], gb2[1] + 8, "+4", "lab big", "middle", { opacity: patchO, fill: P.bad });
        out += rapRing(gb2[0], gb2[1], 32, patchO, P.bad);
      }
    }

    /* beat 3: the caption "add 2?" is crossed out, "doubles" pops in */
    var notO = on(t, cNotadd, 0.5) * rapFrom(t, scene, 3);
    if (notO > 0) {
      out += Tx(824, 336, "add 2?", "lab big muted", "start", { opacity: notO });
      out += MK.cross(892, 330, 22, popIn(t, cNotadd, 0.35));
    }
    out += MK.pill(824, 388, "it doubles", on(t, cDoubles, 0.45) * rapFrom(t, scene, 3), { size: 30, anchor: "start", col: P.bad });

    /* beat 4: check both gaps, not just the first */
    var everyO = on(t, cEvery, 0.5) * rapFrom(t, scene, 4);
    if (everyO > 0) {
      var e1 = rapArrowMid(RAP_SEQA, 1), e2 = rapArrowMid(RAP_SEQB, 2);
      out += rapRing(e1[0], e1[1], 30, everyO, P.gold) + rapRing(e2[0], e2[1], 32, everyO, P.gold);
    }
    var firstO = on(t, cFirstone, 0.5) * rapFrom(t, scene, 4);
    if (firstO > 0) out += MK.pill(824, 30, "not just the first", firstO, { size: 26, anchor: "start", col: P.gold });

    return svg(out);
  }
