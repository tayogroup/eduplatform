  /* ==== Patterns and Square Numbers, part 2 ==================================
     The three middle chapters: what adding and taking away do to odd and even,
     the shape that hides a number, and same step or changing step.

     Adding works on one bench: the two numbers boxed in pairs on the top row
     with the sign between them, the answer boxed in pairs on the bottom row.
     Every card is ART.counters(n, {pairs: true}), so the leftovers are the
     library's own red counters and the film only rings and points.

     The hidden shape is ART.barModel: the whole on top, the parts under it,
     the unknown part carrying the lesson's own triangle until the number is
     worked out - once as a PART (15 + triangle = 22, addition) and once as
     the WHOLE (triangle take away 14 = 30, subtraction, the shape first),
     ART.barModel's unknown: "whole" drawing that second shape directly.

     The sequences are drawn HERE rather than with ART.sequence, because that
     drawing takes ONE step and labels every gap with it, and half this
     chapter is a sequence whose steps are 3, 4 and 5. See the report. */

  /* ---- chapter: adding and taking away ------------------------------------ */
  var PSQ_A = { s: 1.25, row1: 64, row2: 268, x0: 257.75, op: 70 };
  function psqAddCard(n, x, opt) {
    return psqPlace(ART.counters(n, more0(opt, { pairs: true })), psqPairW(n), PSQ_PAIR_H, x, opt.row, PSQ_A.s);
  }
  function more0(o, add) { var k, out = {}; for (k in add) out[k] = add[k]; for (k in o) if (k !== "row") out[k] = o[k]; return out; }
  /* where a card's k-th box, and its top counter, land in the film */
  function psqAX(x, v) { return x + v * PSQ_A.s; }
  function psqAY(row, v) { return row + v * PSQ_A.s; }
  function psqLoneOf(n, x, row) {
    var k = Math.ceil(n / 2) - 1, d = psqPairTop(k);
    return [psqAX(x, d[0]), psqAY(row, d[1])];
  }

  /* one sum on the bench: a and b on the top row, the answer below */
  function psqBench(t, a, b, sign, ans, o) {
    var xa = PSQ_A.x0, wa = psqPairW(a) * PSQ_A.s;
    var xb = xa + wa + PSQ_A.op, ansX = 584 - psqPairW(ans) * PSQ_A.s / 2;
    var out = "";
    out += psqAddCard(a, xa, { row: PSQ_A.row1, colour: "teal", markOdd: true });
    out += Tx(xa + wa + PSQ_A.op / 2, PSQ_A.row1 + 90, sign, "lab", "middle", { "font-size": 62, fill: P.ink });
    out += psqAddCard(b, xb, { row: PSQ_A.row1, colour: "teal", markOdd: true });
    if (o.answer > 0) out += G(psqAddCard(ans, ansX, { row: PSQ_A.row2, colour: "teal" }), { opacity: clamp(o.answer, 0, 1) });
    return { markup: out, xa: xa, xb: xb, ansX: ansX };
  }

  function psqAddChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cAdd = c(0, "add"), cOdd = c(0, "odd"), cLeft = c(0, "leftover");
    var cTog = c(1, "together"), cPair = c(1, "pair");
    var cTwelve = c(2, "twelve"), cEven = c(2, "even"), cRule = c(2, "rule");
    var cSame = c(3, "same"), cNine = c(3, "nine");
    var cCancel = c(4, "cancel"), cPairs = c(4, "pairs"), cEven2 = c(4, "even");
    var out = "", k;
    var sw = on(t, cSame, 0.55);                      /* 7 + 5 -> 9 - 3 */

    /* ---- the addition half ---- */
    if (sw < 1) {
      var A = psqBench(t, 7, 5, "+", 12, { answer: on(t, cTog, 0.6) });
      var g = A.markup;
      var l7 = psqLoneOf(7, A.xa, PSQ_A.row1), l5 = psqLoneOf(5, A.xb, PSQ_A.row1);
      /* "Both are odd": a word over each card */
      var od = on(t, cOdd, 0.4);
      g += MK.pill(A.xa + psqPairW(7) * PSQ_A.s / 2, 34, "odd", od, { size: 26, col: P.bad, ink: P.bad });
      g += MK.pill(A.xb + psqPairW(5) * PSQ_A.s / 2, 34, "odd", od, { size: 26, col: P.bad, ink: P.bad });
      /* "a leftover": a ring round each odd one out */
      var lo = on(t, cLeft, 0.45);
      g += psqRing(l7[0], l7[1], 34, lo, P.bad, 5) + psqRing(l5[0], l5[1], 34, lo, P.bad, 5);
      /* "Put them together": the answer card arrives from above */
      g += MK.arrow(584, 228, 584, 262, on(t, cTog, 0.5), P.gold, 7);
      /* "make a pair": the two leftovers become the last box of 12 */
      var bx = psqAX(A.ansX, 310), by = psqAY(PSQ_A.row2, 20);
      var pr = on(t, cPair, 0.6);
      if (pr > 0) {
        g += MK.leader(l7[0], l7[1] + 26, bx + 30, by + 32, pr, P.bad);
        g += MK.leader(l5[0], l5[1] + 26, bx + 30, by + 84, pr, P.bad);
        g += R(bx - 4, by - 4, 68, 123, 16, "none", P.gold, 4, { opacity: pr });
      }
      /* "7 add 5 is 12", "12 is even", and the generalisation */
      g += MK.pill(1002, 300, "7 + 5 = 12", on(t, cTwelve, 0.4), { size: 28, col: P.gold });
      var ev = on(t, cEven, 0.4);
      g += MK.pill(1002, 372, "even", ev, { size: 28, col: P.good, ink: P.good });
      g += MK.tick(900, 372, 22, popIn(t, cEven == null ? null : cEven + 0.25, 0.35));
      g += MK.pill(168, 372, "odd + odd = even", on(t, cRule, 0.4), { size: 24, col: P.gold });
      out += G(g, { opacity: 1 - sw });
    }

    /* ---- the subtraction half ---- */
    if (sw > 0) {
      var B = psqBench(t, 9, 3, "−", 6, { answer: on(t, cNine, 0.6) });
      var h = B.markup;
      var l9 = psqLoneOf(9, B.xa, PSQ_A.row1), l3 = psqLoneOf(3, B.xb, PSQ_A.row1);
      /* "Both leftovers cancel": a cross over each */
      var cx1 = popIn(t, cCancel, 0.4), cx2 = popIn(t, cCancel == null ? null : cCancel + 0.3, 0.4);
      h += MK.cross(l9[0], l9[1], 30, cx1) + MK.cross(l3[0], l3[1], 30, cx2);
      /* "6 pairs up exactly": the three boxes, ringed one at a time */
      var three = tally(t, cPairs, 3, 0.8);
      for (k = 0; k < 3; k++) if (k < three) {
        var r = psqPairBox(k);
        h += R(psqAX(B.ansX, r[0]) - 4, psqAY(PSQ_A.row2, r[1]) - 4, 68, 123, 16, "none", P.gold, 4,
          { opacity: clamp(three - k, 0, 1) });
      }
      h += MK.pill(1002, 300, "9 − 3 = 6", on(t, cNine, 0.4), { size: 28, col: P.gold });
      var ev2 = on(t, cEven2, 0.4);
      h += MK.pill(1002, 372, "even", ev2, { size: 28, col: P.good, ink: P.good });
      h += MK.tick(900, 372, 22, popIn(t, cEven2 == null ? null : cEven2 + 0.25, 0.35));
      h += MK.pill(168, 372, "odd − odd = even", on(t, cCancel, 0.4), { size: 24, col: P.gold });
      out += G(h, { opacity: sw });
    }

    return svg(out);
  }

  /* ---- chapter: the shape that hides a number -----------------------------
     A row of big symbols for the calculation, and ART.barModel under it: the
     whole on top, the parts below, the unknown part carrying the lesson's own
     triangle until it is worked out. Two calculations, one addition
     (15 + triangle = 22, slide 6) and one where the shape comes first in a
     take-away (triangle take away 14 = 30, slide 7) - both types the
     objective names, addition and subtraction. In the second the shape is
     the WHOLE (ART.barModel's unknown: "whole"), not a part, so the bar
     itself shows what "the shape comes first" means: the two known parts
     sit below an unknown top box until they are put back together. */
  var PSQ_B = psqBox(181, 96, 1.55);
  function psqBX(v) { return psqX(PSQ_B, v); }
  function psqBY(v) { return psqY(PSQ_B, v); }

  /* a calculation laid out as tokens, centred on cx; returns the x of each */
  function psqTokens(items, cx, y, size, gap) {
    var i, total = 0, xs = [], x, out = "";
    for (i = 0; i < items.length; i++) total += items[i].w;
    total += gap * (items.length - 1);
    x = cx - total / 2;
    for (i = 0; i < items.length; i++) {
      xs.push(x + items[i].w / 2);
      out += Tx(x + items[i].w / 2, y, items[i].text, "lab", "middle",
        { "font-size": size, fill: items[i].fill || P.ink, opacity: items[i].o == null ? 1 : items[i].o });
      x += items[i].w + gap;
    }
    return { markup: out, x: xs };
  }

  function psqHiddenChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cShape = c(0, "shape"), cNum = c(0, "number");
    var cEq = c(1, "eq"), cGap = c(1, "gap");
    var cWork = c(2, "work"), cSeven = c(2, "seven"), cGuess = c(2, "guess");
    var cFirst = c(3, "first"), cEq2 = c(3, "eq2");
    var cTogether = c(4, "together"), cSum2 = c(4, "sum2"), cAnswer = c(4, "answer");
    var out = "", k;
    var sw = on(t, cFirst, 0.55);                     /* 15 + triangle -> triangle take away 14 */
    var solved = on(t, cSeven, 0.5);
    var big = 1 - on(t, cEq, 0.5);                    /* beat 0: the calculation alone, large */

    if (sw < 1) {
      var g = "", sz = lerp(50, 84, big), yy = lerp(62, 208, big);
      var tri = solved > 0.5 ? "7" : "▲";
      var row = psqTokens([{ text: "15", w: sz * 1.2 }, { text: "+", w: sz * 0.8 },
        { text: tri, w: sz * 1.2, fill: solved > 0.5 ? P.good : P.gold },
        { text: "=", w: sz * 0.8 }, { text: "22", w: sz * 1.2 }], 584, yy + sz * 0.34, sz, 22);
      g += row.markup;
      /* "A shape in a sum": the triangle pops; "nobody has told you yet": a ? over it */
      g += psqRing(row.x[2], yy, sz * 0.82, on(t, cShape, 0.45) * (1 - solved), P.gold, 4);
      /* floored at its own radius: in the large-calculation beat sz is big
         enough that yy - sz * 1.05 puts the mark's TOP 5 px above the frame
         (measured at 59.9 s: cy 21.37, r 26). Caught 2026-09-25. */
      g += MK.qmark(row.x[2], Math.max(26, yy - sz * 1.05), 26, on(t, cNum, 0.45) * big * (1 - solved));

      /* the bar model: 15 and the triangle make 22 */
      var barO = on(t, cEq, 0.6);
      if (barO > 0) {
        var vals = [15, 7], parts = psqBarParts(vals);
        g += G(psqPlace(ART.barModel({ whole: 22, parts: [15, { value: 7, label: solved > 0.5 ? "7" : "▲" }] }),
          PSQ_BAR_W, PSQ_BAR_H, PSQ_B.x, PSQ_B.y, PSQ_B.s), { opacity: clamp(barO, 0, 1) });
        /* "fill the gap": an arrow across the unknown part */
        var ga = on(t, cGap, 0.6);
        g += MK.arrow(psqBX(parts[1].x) + 10, psqBY(133), psqBX(parts[1].x + parts[1].w) - 10, psqBY(133), ga, P.gold, 7);
        /* "22 take away 15 is 7" */
        g += MK.pill(584, 414, "22 − 15 = 7", on(t, cWork, 0.4), { size: 28, col: P.gold });
        g += MK.tick(1090, psqBY(133), 26, popIn(t, cGuess, 0.4));
      }
      out += G(g, { opacity: 1 - sw });
    }

    if (sw > 0) {
      /* "the shape comes first": triangle − 14 = 30, the shape now the WHOLE
         rather than a part - ART.barModel's own unknown: "whole" draws that
         directly, a dashed "?" box over two known parts. "Put the two parts
         back together": two arrows carry 30 and 14 up into the whole; the
         triangle becomes 44 only once "The triangle is 44" is said. */
      var h = "", solved2 = on(t, cAnswer, 0.5);
      var tri2 = solved2 > 0.5 ? "44" : "▲";
      var col2 = solved2 > 0.5 ? P.good : P.gold;
      var row2 = psqTokens([{ text: tri2, w: 60, fill: col2 }, { text: "−", w: 40 },
        { text: "14", w: 60 }, { text: "=", w: 40 }, { text: "30", w: 60 }], 584, 80, 50, 20);
      h += row2.markup;
      h += psqRing(row2.x[0], 62, 36, on(t, cEq2, 0.45) * (1 - solved2), P.gold, 4);

      var barO2 = on(t, cEq2, 0.6);
      if (barO2 > 0) {
        h += G(psqPlace(solved2 > 0.5
            ? ART.barModel({ whole: 44, parts: [{ value: 30, label: "30" }, { value: 14, label: "14" }] })
            : ART.barModel({ parts: [{ value: 30, label: "30" }, { value: 14, label: "14" }], unknown: "whole" }),
          PSQ_BAR_W, PSQ_BAR_H, PSQ_B.x, PSQ_B.y, PSQ_B.s), { opacity: clamp(barO2, 0, 1) });
        var parts2 = psqBarParts([30, 14]);
        var tg = on(t, cTogether, 0.5);
        if (tg > 0) {
          h += MK.arrow(psqBX(parts2[0].mid), psqBY(133), psqBX(150), psqBY(55), tg, P.gold, 6);
          h += MK.arrow(psqBX(parts2[1].mid), psqBY(133), psqBX(350), psqBY(55), tg, P.gold, 6);
        }
      }
      h += MK.pill(584, 414, "30 + 14 = 44", on(t, cSum2, 0.4), { size: 28, col: P.gold });
      h += MK.tick(row2.x[0], 26, 24, popIn(t, cAnswer, 0.4));
      out += G(h, { opacity: sw });
    }

    return svg(out);
  }

  /* ---- chapter: same step, or changing step? ------------------------------
     Five slots in fixed places, so the terms can change without the row
     moving. A slot holds a term or nothing; a gap holds its step when the
     step has been said. */
  var PSQ_S = { x0: 283, box: 92, gap: 78, top: 196 };
  function psqSlotX(k) { return PSQ_S.x0 + k * (PSQ_S.box + PSQ_S.gap); }
  function psqStepX(k) { return psqSlotX(k) + PSQ_S.box + PSQ_S.gap / 2; }
  function psqSlot(k, text, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var x = psqSlotX(k), y = PSQ_S.top;
    return G(R(x, y, PSQ_S.box, PSQ_S.box, 14, opt.open ? P.ground : P.cell, opt.col || P.teal, 3,
      opt.open ? { "stroke-dasharray": "10 7" } : null) +
      Tx(x + PSQ_S.box / 2, y + 62, text, "lab huge", "middle", { fill: opt.ink || P.ink }),
      { opacity: clamp(o, 0, 1), transform: around(x + PSQ_S.box / 2, y + PSQ_S.box / 2, Math.min(1.08, o)) });
  }
  function psqStep(k, text, o, col) {
    if (!(o > 0)) return "";
    var a = psqSlotX(k) + PSQ_S.box + 8, b = psqSlotX(k + 1) - 8;
    return MK.arrow(a, PSQ_S.top + PSQ_S.box / 2, b, PSQ_S.top + PSQ_S.box / 2, 1, P.muted, 5) +
      MK.pill(psqStepX(k), PSQ_S.top - 42, text, o, { size: 28, col: col || P.gold });
  }

  function psqStepsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSeq = c(0, "sequence"), cNext = c(0, "next");
    var cTerms = c(1, "terms"), cTake = c(1, "take");
    var cSeven = c(2, "seven"), cSameS = c(2, "same"), cLinear = c(2, "linear"), cNext2 = c(2, "next");
    var cTwo = c(3, "two"), c3 = c(3, "three"), c4 = c(3, "four"), c5 = c(3, "five");
    var cChange = c(4, "change"), cNonlinear = c(4, "nonlinear"), cRule = c(4, "rule");
    var out = "", k;
    var sw = on(t, cTwo, 0.55);                       /* 5, 12, 19, 26 -> 2, 5, 9, 14 */

    /* the bench holds four slots, centred; it grows by one when 33 arrives */
    var extra = sw < 1 ? Math.max(on(t, cSeven == null ? null : cSeven + 0.8, 0.6), on(t, cNext2, 0.5)) : 0;
    out += R(PSQ_S.x0 - 34, 120, 670 + 170 * extra, 200, 22, P.card, P.line, 2);

    if (sw < 1) {
      var g = "", terms = [5, 12, 19, 26], four = tally(t, cSeq, 4, 0.9);
      for (k = 0; k < 4; k++) if (k < four)
        g += psqSlot(k, String(terms[k]), clamp(four - k, 0, 1) * (1 + 0.2 * bump(t, cTerms == null ? null : cTerms + k * 0.22, 0.5)));
      /* "from one term to the next one": the first gap alone; then all three */
      var one = on(t, cNext, 0.5), all = tally(t, cTake, 3, 0.7);
      if (one > 0 && all < 1) g += MK.arrow(psqSlotX(0) + PSQ_S.box + 8, PSQ_S.top + 46, psqSlotX(1) - 8, PSQ_S.top + 46, one, P.gold, 6);
      var sevens = tally(t, cSeven, 3, 0.85);
      for (k = 0; k < 3; k++) {
        if (k < all && k >= sevens) g += MK.arrow(psqSlotX(k) + PSQ_S.box + 8, PSQ_S.top + 46, psqSlotX(k + 1) - 8, PSQ_S.top + 46, clamp(all - k, 0, 1), P.muted, 5);
        if (k < sevens) g += psqStep(k, "+7", clamp(sevens - k, 0, 1) * (1 + 0.25 * bump(t, cSameS, 0.9)));
      }
      /* "the next term is 33": a fifth slot, and a fourth step of 7 */
      var nx = on(t, cNext2, 0.5);
      if (nx > 0) { g += psqStep(3, "+7", nx); g += psqSlot(4, "33", popIn(t, cNext2, 0.5), { col: P.gold }); }
      else if (sevens >= 3) g += psqSlot(4, "?", on(t, cSeven == null ? null : cSeven + 1.0, 0.5), { open: true, col: P.accent, ink: P.accent });
      /* "That makes it linear": the word the lesson itself uses for a constant step */
      g += MK.pill(584, 40, "linear", on(t, cLinear, 0.4), { size: 30, col: P.teal, ink: P.teal });
      out += G(g, { opacity: 1 - sw });
    }

    if (sw > 0) {
      var h = "", t2 = [2, 5, 9, 14], cues = [c3, c4, c5], labs = ["+3", "+4", "+5"];
      var arrive = tally(t, cTwo, 4, 0.85);
      for (k = 0; k < 4; k++) if (k < arrive) h += psqSlot(k, String(t2[k]), clamp(arrive - k, 0, 1));
      var ch = on(t, cChange, 0.5);
      for (k = 0; k < 3; k++) {
        h += MK.arrow(psqSlotX(k) + PSQ_S.box + 8, PSQ_S.top + 46, psqSlotX(k + 1) - 8, PSQ_S.top + 46, on(t, cues[k], 0.4), P.muted, 5);
        h += psqStep(k, labs[k], on(t, cues[k], 0.4) * (1 + 0.25 * bump(t, cChange, 0.9)), ch > 0.5 ? P.accent : P.gold);
      }
      /* "so it is non-linear": the word the lesson itself uses for a changing step */
      h += MK.pill(584, 40, "non-linear", on(t, cNonlinear, 0.4), { size: 30, col: P.accent, ink: P.accent });
      /* "add one more than you added before": a +1 between each pair of steps */
      var ru = on(t, cRule, 0.6);
      for (k = 0; k < 2; k++) {
        var o1 = on(t, cRule == null ? null : cRule + k * 0.45, 0.45);
        h += MK.arrow(psqStepX(k) + 34, PSQ_S.top - 84, psqStepX(k + 1) - 34, PSQ_S.top - 84, o1, P.teal, 5);
        h += MK.pill((psqStepX(k) + psqStepX(k + 1)) / 2, PSQ_S.top - 112, "+1", o1, { size: 24, col: P.teal, ink: P.teal });
      }
      h += MK.pill(584, 386, "add one more each time", ru, { size: 28, col: P.teal });
      out += G(h, { opacity: sw });
    }

    return svg(out);
  }
