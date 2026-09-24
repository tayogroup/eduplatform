  /* ==== Rows and Rules, part 4 ================================================
     "Find the rule" and "What you now know". The sequence is the lesson's own
     3, 6, 9, 12: the rule is found the way the lesson finds it, by taking one
     term away from the next, and only then is the next term written. The
     squares that follow are the same rule as a spatial pattern (3Nc.06):
     three, six, nine, then twelve, in rows of three - and then twelve, nine,
     six, three, the same pattern taken away instead of added. 3Nc.06 names
     both directions, and the lesson's own round10 shrinks half of its
     patterns, so this chapter now shows one of each rather than only
     growing ones. */

  var RR_SEQ = { top: 150, box: 78, gap: 56, first: 3, step: 3, n: 5 };
  function rrSeqX(k) {
    var w = RR_SEQ.n * RR_SEQ.box + (RR_SEQ.n - 1) * RR_SEQ.gap;
    return 584 - w / 2 + k * (RR_SEQ.box + RR_SEQ.gap) + RR_SEQ.box / 2;
  }
  function rrTerm(k, text, o, opt) {
    if (!(o > 0.001)) return "";
    opt = opt || {};
    var x = rrSeqX(k) - RR_SEQ.box / 2, b = RR_SEQ.box;
    var known = !opt.open;
    return G(R(x, RR_SEQ.top, b, b, 14, known ? ART.C.tealSoft : ART.C.card,
        known ? ART.C.teal : ART.C.accent, known ? 3 : 3.5, known ? null : { "stroke-dasharray": "10 7" }) +
      Tx(x + b / 2, RR_SEQ.top + b / 2 + 14, text, "lab", "middle",
        { "font-size": 40, fill: known ? ART.C.ink : ART.C.accent }),
      { opacity: n3(clamp(o, 0, 1)), transform: around(rrSeqX(k), RR_SEQ.top + b / 2, 0.92 + 0.08 * Math.min(1, o)) });
  }
  /* the arc from term k to term k + 1, with its step written above it */
  function rrGap(k, o, label, col) {
    if (!(o > 0.001)) return "";
    var a = rrSeqX(k) + RR_SEQ.box / 2 - 4, b = rrSeqX(k + 1) - RR_SEQ.box / 2 + 4;
    var y = RR_SEQ.top - 4, top = RR_SEQ.top - 52;
    var out = Pth("M" + n2(a) + "," + n2(y) + " C" + n2(a + (b - a) * 0.3) + "," + n2(top) + " " +
      n2(b - (b - a) * 0.3) + "," + n2(top) + " " + n2(b) + "," + n2(y), null, col || P.muted, 3.5);
    if (label) out += Tx((a + b) / 2, top + 4, label, "lab big", "middle", { fill: col || P.muted });
    return G(out, { opacity: n3(clamp(o, 0, 1)) });
  }

  /* one figure of the growing pattern: n squares, in rows of three */
  function rrFigure(cx, baseY, n, o, col) {
    if (!(o > 0.001)) return "";
    var s = 46, g = 5, cols = 3, rows = Math.ceil(n / cols), out = "", k;
    var w = cols * s + (cols - 1) * g, x0 = cx - w / 2, y0 = baseY - (rows * s + (rows - 1) * g);
    for (k = 0; k < n; k++) {
      out += R(x0 + (k % cols) * (s + g), y0 + Math.floor(k / cols) * (s + g), s, s, 5,
        col || ART.C.teal, ART.C.card, 2.5);
    }
    return G(out, { opacity: n3(clamp(o, 0, 1)) });
  }

  /* ==== chapter: find the rule ================================================== */
  function rrRulesChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTerms = c(0, "terms"), cSame = c(0, "same");
    var cFind = c(1, "find"), cTake = c(1, "take");
    var cNine = c(2, "nine"), cRule = c(2, "rule");
    var cNext = c(3, "next"), cDraw = c(3, "draw");
    var cSq = c(4, "sq"), cCounts = c(4, "counts");
    var cShrink = c(5, "shrink"), cSeq = c(5, "seq"), cAway = c(5, "away");

    var afterSq = rrFrom(t, scene, 4), nums = 1 - afterSq, out = "", k;
    var shrinkOn = rrFrom(t, scene, 5), shapes = afterSq * (1 - shrinkOn);

    if (nums > 0.001) {
      var s = "", shown = cTerms == null ? 0 : tally(t, cTerms, 4, 1.25);
      for (k = 0; k < 4; k++) s += rrTerm(k, String(RR_SEQ.first + k * RR_SEQ.step), clamp(shown - k, 0, 1));
      /* the missing term: an empty box from the start of "find the rule" */
      var openO = on(t, cFind, 0.5), filled = popIn(t, cNext, 0.45);
      s += rrTerm(4, "?", openO * (1 - Math.min(1, filled)), { open: true });
      s += rrTerm(4, "15", filled);

      /* the gaps: plain arcs as the sequence is described, the middle one
         picked out while it is worked on, all of them labelled +3 at the end */
      var arcs = on(t, cSame, 0.5), ruleO = on(t, cRule, 0.45), pick = on(t, cTake, 0.5) * rrBetween(t, scene, 1, 3);
      for (k = 0; k < 3; k++) {
        s += rrGap(k, arcs * (1 - ruleO), "", P.muted);
        s += rrGap(k, ruleO, "+3", P.gold);
      }
      s += rrGap(1, pick, cNine != null && t >= cNine ? "" : "?", P.accent);
      s += rrGap(3, ruleO * Math.min(1, filled), "+3", P.gold);

      if (on(t, cFind, 0.5) > 0.001 && rrOnly(t, scene, 1) > 0.01) {
        s += G(Tx(584, 306, "take one term away from the next", "lab big", "middle", { fill: P.muted }),
          { opacity: n3(on(t, cFind, 0.5) * rrOnly(t, scene, 1)) });
      }
      s += G(Tx(584, 306, "9 − 6 = 3", "lab", "middle", { "font-size": 48, fill: P.accent }),
        { opacity: n3(on(t, cNine, 0.45) * rrBetween(t, scene, 2, 4)) });
      s += MK.pill(584, 378, "the rule is add 3", ruleO, { size: 32, col: P.gold });
      s += MK.tick(900, 306, 26, popIn(t, cDraw, 0.4) * rrOnly(t, scene, 3));
      out += G(s, { opacity: n3(nums) });
    }

    if (shapes > 0.001) {
      var f = "", xs = [250, 480, 710, 940], base = 344;
      var many = cCounts == null ? 0 : tally(t, cCounts, 4, 1.35);
      for (k = 0; k < 4; k++) {
        var fo = k < 3 ? on(t, cSq, 0.5) * clamp(tally(t, cSq, 3, 0.7) - k, 0, 1) : clamp(many - 3, 0, 1);
        f += rrFigure(xs[k], base, (k + 1) * 3, fo, k === 3 ? ART.C.accent : ART.C.teal);
        var no = clamp(many - k, 0, 1);
        if (no > 0.001) {
          f += G(Tx(xs[k], 390, String((k + 1) * 3), "lab", "middle",
            { "font-size": 38, fill: k === 3 ? P.accent : P.gold }), { opacity: n3(no) });
        }
        if (k < 3) {
          var ao = clamp(many - k - 1, 0, 1);
          if (ao > 0.001) {
            f += G(Tx((xs[k] + xs[k + 1]) / 2, 390, "+3", "lab big", "middle", { fill: P.muted }), { opacity: n3(ao) });
          }
        }
      }
      f += G(Tx(584, 428, "the same rule, drawn instead of written", "lab big", "middle", { fill: P.muted }),
        { opacity: n3(clamp(many - 3, 0, 1)) });
      out += G(f, { opacity: n3(shapes) });
    }

    /* "Patterns can shrink too. Twelve, nine, six, then three: take away
       three each time." - 3Nc.06 names adding AND subtracting a constant,
       so the shapes shrink here the way the lesson's own round10 shrinks
       half its patterns: the same four-figure layout, run backwards. */
    if (shrinkOn > 0.001) {
      var f2 = "", xs2 = [250, 480, 710, 940], base2 = 344;
      var counts2 = [12, 9, 6, 3];
      var manyS = cSeq == null ? 0 : tally(t, cSeq, 4, 1.35);
      for (k = 0; k < 4; k++) {
        var foS = clamp(manyS - k, 0, 1);
        f2 += rrFigure(xs2[k], base2, counts2[k], foS, k === 3 ? ART.C.accent : ART.C.teal);
        if (foS > 0.001) {
          f2 += G(Tx(xs2[k], 390, String(counts2[k]), "lab", "middle",
            { "font-size": 38, fill: k === 3 ? P.accent : P.gold }), { opacity: n3(foS) });
        }
        if (k < 3) {
          var aoS = clamp(manyS - k - 1, 0, 1) * on(t, cAway, 0.5);
          if (aoS > 0.001) {
            f2 += G(Tx((xs2[k] + xs2[k + 1]) / 2, 390, "−3", "lab big", "middle", { fill: P.muted }), { opacity: n3(aoS) });
          }
        }
      }
      f2 += G(Tx(584, 60, "patterns can shrink too", "lab big", "middle", { fill: P.gold }),
        { opacity: n3(on(t, cShrink, 0.5)) });
      f2 += G(Tx(584, 428, "the same rule, taken away instead of added", "lab big", "middle", { fill: P.muted }),
        { opacity: n3(clamp(manyS - 3, 0, 1)) });
      out += G(f2, { opacity: n3(shrinkOn) });
    }
    return svg(out);
  }

  /* ==== what you now know ======================================================= */
  var RR_RECAP = MK.recapKind([
    { beat: 0, at: "array", title: "Array", sub: "rows × columns",
      pic: function (cx, cy, size) { return rrDots(cx, cy, 3, 4, { cell: size * 0.3 }); } },
    { beat: 0, at: "turn", title: "Turn it round", sub: "4 × 6 = 6 × 4", pic: "\u{1F504}" },
    { beat: 1, at: "facts", title: "Four facts", sub: "two times, two sharing", pic: "➗" },
    { beat: 1, at: "split", title: "Split it", sub: "20 × 3 and 4 × 3", pic: "✂️" },
    { beat: 2, at: "rem", title: "Remainder", sub: "what is left over", pic: "\u{1F36A}" },
    { beat: 2, at: "steps", title: "Multiples and rules", sub: "count in equal steps", pic: "\u{1F4CF}" }
  ], { goBeat: 2, goAt: "steps" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Arrays: rows times columns", "One array, four facts", "Sharing, multiples and rules"] }),
    rows: rrRowsChapter, family: rrFamilyChapter, split: rrSplitChapter,
    share: rrShareChapter, multiples: rrMultiplesChapter, rules: rrRulesChapter,
    recap: RR_RECAP
  };
