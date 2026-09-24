  /* ==== Grade 4 Computing, Lesson 4: Inputs Decide Outputs, part 2 =============
     The two chapters about the input: "Inputs decide outputs" (the same
     algorithm run twice, and then the lesson's quiz program) and "Writing a
     branch" (the lesson's library round, built a step at a time).

     Every arm drawn here comes from idoArm / idoRun, which are the kit's own
     ART.algo.branchRun. The film never names a step list of its own. */

  /* ---- the input, in the words the narration uses -------------------------------
     The round's own input labels are sentences ("Yes, it is raining"); the
     picture beside "Raining in" says Raining, so the card and the line agree.
     The pictures are the lesson's own. */
  var IDO_IN_LABEL = {
    yes: "Raining", no: "Sunny", right: "A right answer", wrong: "A wrong answer"
  };
  function idoInputCard(x, y, w, h, input, o, col) {
    if (!(o > 0)) return "";
    var label = IDO_IN_LABEL[input.id] || input.label;
    var lines = idoWrap(label, 16, 2);
    var out = R(x, y, w, h, 22, P.cell, col || P.line, 3.5) +
      Em(x + 62, y + h / 2, 52, input.pic);
    lines.forEach(function (ln, k) {
      out += Tx(x + 118, y + h / 2 + 8 - (lines.length - 1) * 14 + k * 28, ln, "lab", "start",
        { "font-size": 22 });
    });
    return G(out, { transform: around(x + w / 2, y + h / 2, Math.min(1.05, o)), opacity: Math.min(1, o) });
  }

  /* ==== chapter: inputs decide outputs ===========================================
     Two rows: an input on the left, the arm the kit returns for it on the
     right. Beats 0-2 are the leaving-for-school round, beats 3-4 the lesson's
     quiz program, and the two crossfade. */

  var IDO_TBL = {
    inX: 24, inW: 316, arrow: [352, 512], outX: 520, outW: 608,
    rowY: [96, 248], rowH: 112
  };

  function idoTableRow(t, round, which, rowK, o, armAt, arrowAt, col, frameO) {
    var y = IDO_TBL.rowY[rowK], h = IDO_TBL.rowH, cy = y + h / 2;
    if (!(o > 0)) {
      if (!(frameO > 0)) return "";
      return R(IDO_TBL.inX, y, IDO_TBL.inW, h, 22, P.card, P.line, 2,
          { "stroke-dasharray": "12 9", opacity: frameO * 0.8 }) +
        R(IDO_TBL.outX, y, IDO_TBL.outW, h, 22, P.card, P.line, 2,
          { "stroke-dasharray": "12 9", opacity: frameO * 0.8 });
    }
    var input = round.inputs[which === "yes" ? 0 : 1];
    var steps = idoArm(round, input.id);          /* the kit decides, not the film */
    var out = "";
    out += idoInputCard(IDO_TBL.inX, y, IDO_TBL.inW, h, input, o, col);
    var au = on(t, arrowAt, 0.5);
    out += MK.arrow(IDO_TBL.arrow[0], cy, IDO_TBL.arrow[1], cy, au, col, 8);
    if (au > 0) out += Tx((IDO_TBL.arrow[0] + IDO_TBL.arrow[1]) / 2, cy - 22,
      which === "yes" ? "the yes steps" : "the no steps", "lab", "middle",
      { "font-size": 18, fill: col, opacity: au });
    /* the panel the arm lands in */
    var n = steps.length, cw = (IDO_TBL.outW - 16 - (n - 1) * 12) / n;
    out += R(IDO_TBL.outX, y, IDO_TBL.outW, h, 22, P.card, P.line, 2, { opacity: o });
    steps.forEach(function (st, k) {
      out += idoChip(IDO_TBL.outX + 8 + k * (cw + 12), y + 8, cw, h - 16, st,
        { o: popIn(t, armAt == null ? null : armAt + k * 0.25, 0.35), col: col, size: 19 });
    });
    return out;
  }

  function idoInputsHalf(t, scene, round, frameO, cuesYes, cuesNo, headO) {
    var out = "";
    var cIn = sc(scene, 0, "input"), cSame = sc(scene, 0, "same"), cOut = sc(scene, 0, "output");
    /* the column headings, and the pill that says it is one algorithm */
    if (headO > 0) {
      out += G(Tx(IDO_TBL.inX + IDO_TBL.inW / 2, 46, "INPUT", "lab caps muted", "middle", { "font-size": 21 }),
        { opacity: on(t, cIn, 0.5) * headO });
      out += G(Tx(IDO_TBL.outX + IDO_TBL.outW / 2, 46, "OUTPUT", "lab caps muted", "middle", { "font-size": 21 }),
        { opacity: on(t, cOut, 0.5) * headO });
      out += G(MK.pill((IDO_TBL.arrow[0] + IDO_TBL.arrow[1]) / 2, 40, "one algorithm",
        on(t, cSame, 0.5), { size: 18, col: P.gold, ink: P.gold, fill: P.cell }), { opacity: headO });
    }
    out += idoTableRow(t, round, "yes", 0, on(t, cuesYes[0], 0.5), cuesYes[2], cuesYes[1], P.good, frameO);
    out += idoTableRow(t, round, "no", 1, on(t, cuesNo[0], 0.5), cuesNo[2], cuesNo[1], P.blue, frameO);
    return out;
  }

  function idoInputsChapter(scene, beat, t, i) {
    var cRain = sc(scene, 1, "rain"), cYes = sc(scene, 1, "yes"), cOutY = sc(scene, 1, "out");
    var cSun = sc(scene, 2, "sun"), cNo = sc(scene, 2, "no"), cOutN = sc(scene, 2, "out");
    var cQuiz = sc(scene, 3, "quiz"), cRight = sc(scene, 3, "right"), cOutR = sc(scene, 3, "out");
    var cWrong = sc(scene, 4, "wrong"), cOutW = sc(scene, 4, "out"), cDec = sc(scene, 4, "decided");

    var u = into(t, scene.first + 3), out = "";
    if (u < 1) {
      out += G(idoInputsHalf(t, scene, IDO_SCHOOL, on(t, sc(scene, 0, "input"), 0.5),
        [cRain, cYes, cOutY], [cSun, cNo, cOutN], 1), { opacity: 1 - u });
    }
    if (u > 0) {
      out += G(idoInputsHalf(t, scene, IDO_QUIZ, on(t, cQuiz, 0.5),
        [cRight, cRight, cOutR], [cWrong, cWrong, cOutW], 0) +
        Tx(IDO_TBL.inX + IDO_TBL.inW / 2, 46, "INPUT", "lab caps muted", "middle", { "font-size": 21 }) +
        Tx(IDO_TBL.outX + IDO_TBL.outW / 2, 46, "OUTPUT", "lab caps muted", "middle", { "font-size": 21 }) +
        MK.pill((IDO_TBL.arrow[0] + IDO_TBL.arrow[1]) / 2, 40, "one quiz program",
          on(t, cQuiz, 0.5), { size: 18, col: P.gold, ink: P.gold, fill: P.cell }),
        { opacity: u });
    }
    /* the line the whole chapter is for */
    out += MK.pill(584, 408, "the input decided the output", on(t, cDec, 0.6),
      { size: 22, col: P.gold, ink: P.gold, fill: P.cell });
    return svg(out);
  }

  /* ==== chapter: writing a branch =================================================
     The lesson's library round, written into the empty chart a piece at a time:
     the question first, then the step that happens every time, then each arm,
     then the step that happens either way. The last beat tests both ways and
     shows the lesson's own misconception - a step everybody needs, sitting
     inside one arm - crossed out, with its right place ringed. */

  function idoWriteChapter(scene, beat, t, i) {
    var cWrite = sc(scene, 0, "write"), cChoose = sc(scene, 0, "choose");
    var cBook = sc(scene, 1, "book"), cAsk = sc(scene, 1, "ask");
    var cLook = sc(scene, 2, "look"), cFirst = sc(scene, 2, "first");
    var cYes = sc(scene, 3, "yes"), cYSteps = sc(scene, 3, "steps");
    var cNo = sc(scene, 4, "no"), cNSteps = sc(scene, 4, "steps"), cAfter = sc(scene, 4, "after");
    var cTest = sc(scene, 5, "test"), cWrong = sc(scene, 5, "wrong");

    var R0 = IDO_BOOK;
    var armY = idoArm(R0, R0.inputs[0].id), armN = idoArm(R0, R0.inputs[1].id);
    var frame0 = on(t, cWrite, 0.6);
    var firstP = bump(t, cFirst, 1.6);
    var out = "";

    out += idoFlow(t, {
      round: R0,
      before: on(t, cLook, 0.5),
      beforeCol: firstP > 0.3 ? P.gold : null,
      question: frame0,
      qText: on(t, cAsk, 0.5),
      qCol: idoPast(t, cChoose) ? P.gold : null,
      /* NO input badge here. In the fork chapter that badge is the INPUT that
         answered the question, and an arm lights because of it; nothing is
         given an input in this chapter, so a badge in the same place would say
         an answer had been chosen when none has. The task is named in a pill
         above instead, which is what the line actually says. */
      arrows: frame0,
      litYes: 0, litNo: 0,
      yes: frame0, no: frame0,
      yesHead: on(t, cYes, 0.4), noHead: on(t, cNo, 0.4),
      yesSteps: armY, noSteps: armN,
      noSlots: idoPast(t, cWrong) ? armN.length + 1 : armN.length,
      yesStep: function (k) { return on(t, cYSteps == null ? null : cYSteps + k * 0.5, 0.4); },
      noStep: function (k) { return on(t, cNSteps == null ? null : cNSteps + k * 0.5, 0.4); },
      bar: on(t, cAfter, 0.5),
      barStep: on(t, cAfter, 0.5)
    });

    /* the task this branch is for, on "Borrowing a book" */
    out += MK.pill(FLOW.left.x + FLOW.left.w / 2, 28, "\u{1F4DA} Borrowing a book",
      on(t, cBook, 0.5), { size: 19, col: P.plum, ink: P.ink, fill: P.cell });

    /* "so that step goes first", beside the step it is about */
    if (firstP > 0) out += MK.pill(FLOW.left.x + FLOW.left.w / 2, 128, "every time, first",
      firstP, { size: 19, col: P.gold, ink: P.gold, fill: P.cell });

    /* "Now test it both ways": one token down the yes path, then one down the no */
    if (cTest != null) {
      var qx = FLOW.left.x + FLOW.left.w + 6, lx = FLOW.lane.x - 8;
      [["yes", 0, P.good], ["no", 1.15, P.blue]].forEach(function (leg) {
        var at = cTest + leg[1], u = clamp((t - at) / 0.85, 0, 1);
        if (u <= 0) return;
        var y0 = leg[0] === "yes" ? 226 : 268;
        var y1 = idoLaneY(leg[0]) + FLOW.lane.h / 2;
        var px = lerp(qx, lx + 30, ease(u)), py = lerp(y0, y1, ease(u));
        var fade = u >= 1 ? clamp(1 - (t - at - 0.85) / 0.5, 0, 1) : 1;
        out += G(MK.glow(px, py, 46, leg[2], 1) + C(px, py, 17, leg[2], P.ground, 3) +
          Tx(px, py + 7, leg[0] === "yes" ? "Y" : "N", "lab", "middle",
            { "font-size": 20, fill: P.ground }), { opacity: fade });
        if (u >= 1) out += R(FLOW.lane.x - 3, idoLaneY(leg[0]) - 3, FLOW.lane.w + 6, FLOW.lane.h + 6,
          25, "none", leg[2], 4, { opacity: fade * 0.9 });
      });
    }

    /* the misconception, in the lesson's own terms: the thank-you step tucked
       inside one arm, so it only happens for one of the two answers */
    var wp = popIn(t, cWrong, 0.45);
    if (wp > 0) {
      var gy = idoLaneRowY("no", armN.length + 1, armN.length);
      out += G(idoRow(FLOW.lane.x + 22, gy, FLOW.lane.w - 44, FLOW.lane.rowH, R0.after[0],
        { o: Math.min(1, wp), size: 21, col: P.bad, fill: P.cell }) +
        MK.cross(FLOW.lane.x + FLOW.lane.w - 46, gy + FLOW.lane.rowH / 2, 17, wp), {});
      out += R(FLOW.bar.x + 211, FLOW.bar.y + 3, 336, 46, 18, "none", P.gold, 4,
        { opacity: Math.min(1, wp) * (0.65 + 0.35 * breathe(t)) });
    }
    return svg(out);
  }
