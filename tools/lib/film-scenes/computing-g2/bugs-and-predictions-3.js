  /* ==== Bugs and Predictions, part 3 ==========================================
     "Precise, not vague", "A straight line of steps", the recap cards and
     KINDS. Robo is drawn here rather than lifted: the lesson keeps Robo's grid
     inside an activity closure, so a film draws the picture and borrows only
     the rules - and this chapter borrows no rule, it sorts the lesson's own
     eight instructions into the lesson's own two bins. */

  /* ==== chapter: precise, not vague =========================================== */

  var BP_BIN = [
    { x: 500, y: 100, w: 300, h: 220, title: "Precise", pic: "\u{1F3AF}", col: P.good },
    { x: 828, y: 100, w: 300, h: 220, title: "Vague", pic: null, col: P.bad }
  ];
  var BP_HAND = { x: 236, y: 348 };

  function bpBin(b, o) {
    if (!(o > 0)) return "";
    return G(R(b.x, b.y, b.w, b.h, 22, P.card, b.col, 3) +
      (b.pic ? Em(b.x + 44, b.y + 40, 32, b.pic)
        : C(b.x + 44, b.y + 38, 17, P.card, b.col, 3) +
          Tx(b.x + 44, b.y + 47, "?", "lab", "middle", { "font-size": 26, fill: b.col })) +
      Tx(b.x + 74, b.y + 50, b.title, "lab big", "start", { fill: b.col }),
      { opacity: clamp(o, 0, 1) });
  }
  function bpBinSlot(bin, k) { return { x: BP_BIN[bin].x + 8, y: BP_BIN[bin].y + 76 + k * 68 }; }

  /* one of the lesson's instructions, flying from Robo's hand into a bin */
  function bpInstr(bin, k, pic, text, u, ok) {
    if (!(u > 0)) return "";
    var s = bpBinSlot(bin, k), x = lerp(BP_HAND.x, s.x, u), y = lerp(BP_HAND.y, s.y, u), w = 284;
    var mark = u >= 1 ? 1 : 0;
    return G(R(x, y, w, 56, 14, P.cell, ok ? P.good : P.bad, 3) +
      Em(x + 30, y + 28, 28, pic) +
      Tx(x + 52, y + 35, text, "lab", "start", { "font-size": Math.min(17, 196 / (text.length * 0.55)) }) +
      (ok ? MK.tick(x + w - 26, y + 28, 15, mark) : MK.cross(x + w - 26, y + 28, 15, mark)),
      { opacity: Math.min(1, u * 1.6), transform: around(x + w / 2, y + 28, 0.82 + 0.18 * Math.min(1, u)) });
  }

  /* Robo: the film draws it, because the lesson keeps its grid in a closure */
  function bpRobo(cx, cy, o, guess) {
    if (!(o > 0)) return "";
    var eye = guess > 0.4 ? P.gold : P.teal;
    var g = L(cx, cy - 96, cx, cy - 118, P.plastic, 5) + C(cx, cy - 126, 9, P.gold) +
      R(cx - 62, cy - 96, 124, 92, 22, P.plastic, P.line, 3) +
      C(cx - 24, cy - 56, 13, P.ground) + C(cx + 24, cy - 56, 13, P.ground) +
      C(cx - 24, cy - 56, 6, eye) + C(cx + 24, cy - 56, 6, eye) +
      (guess > 0.4
        ? Pth("M" + n2(cx - 26) + "," + n2(cy - 22) + " q13,-10 26,0 q13,10 26,0", null, P.ground, 4)
        : L(cx - 26, cy - 22, cx + 26, cy - 22, P.ground, 4)) +
      R(cx - 54, cy + 12, 108, 84, 18, P.body, P.line, 3) +
      R(cx - 22, cy + 34, 44, 30, 8, P.cell) +
      L(cx - 54, cy + 34, cx - 86, cy + 62, P.plastic, 10) +
      L(cx + 54, cy + 34, cx + 86, cy + 62, P.plastic, 10);
    return G(g, { opacity: clamp(o, 0, 1) });
  }

  var BP_ROBO = { x: 236, y: 226 };

  function bpPreciseChapter(scene, beat, t, i) {
    var cPrecise = sc(scene, 0, "precise"), cGuess = sc(scene, 0, "guess");
    var cTurn = sc(scene, 1, "turn"), cWay = sc(scene, 1, "way");
    var cSome = sc(scene, 2, "some"), cVague = sc(scene, 2, "vague"), cWhere = sc(scene, 2, "where");
    var cThree = sc(scene, 3, "three"), cWalk = sc(scene, 3, "walk");
    var cMakes = sc(scene, 4, "makes"), cBadly = sc(scene, 4, "badly");
    var out = "", guess = Math.max(on(t, cWhere, 0.5) * (1 - bpFrom(t, scene, 3)), on(t, cMakes, 0.5));

    out += bpBin(BP_BIN[0], on(t, cPrecise, 0.5));
    out += bpBin(BP_BIN[1], on(t, cPrecise == null ? null : cPrecise + 0.3, 0.5));
    out += bpRobo(BP_ROBO.x, BP_ROBO.y, on(t, cPrecise, 0.5), guess);

    /* nothing to guess: the question mark that a precise instruction removes */
    var ng = popIn(t, cGuess, 0.45) * (1 - on(t, cSome, 0.5));
    if (ng > 0) out += MK.pop(MK.qmark(392, 122, 34, 1) + MK.cross(424, 152, 19, 1), 400, 130, ng);

    out += MK.pop(Em(BP_ROBO.x + 100, 112, 54, "❓"), BP_ROBO.x + 100, 112,
      popIn(t, cWhere, 0.45) * (1 - on(t, cThree, 0.5)));

    /* the lesson's own four instructions, into the lesson's own two bins */
    out += bpInstr(0, 0, "\u{1F3EA}", "turn left at the shop", on(t, cTurn, 0.55), true);
    out += bpInstr(1, 0, "\u{1F937}", "go somewhere", on(t, cSome, 0.55), false);
    out += bpInstr(0, 1, "\u{1F463}", "take three steps forward", on(t, cThree, 0.55), true);
    out += bpInstr(1, 1, "\u{1F6B6}", "walk a bit", on(t, cWalk, 0.55), false);
    /* you know which way and where: the precise bin lights up as it is said */
    var lit = bump(t, cWay, 1.4);
    if (lit > 0) out += R(BP_BIN[0].x - 5, BP_BIN[0].y - 5, BP_BIN[0].w + 10, BP_BIN[0].h + 10, 26,
      "none", P.good, 5, { opacity: lit });
    var litv = bump(t, cVague, 1.4);
    if (litv > 0) out += R(BP_BIN[1].x - 5, BP_BIN[1].y - 5, BP_BIN[1].w + 10, BP_BIN[1].h + 10, 26,
      "none", P.bad, 5, { opacity: litv });

    /* Robo guessing: a question it cannot answer, and two ways it might go */
    var ask = popIn(t, cMakes, 0.45);
    if (ask > 0) {
      out += MK.bubble(58, 8, 300, 80, "which way? how far?", Math.min(1, ask), BP_ROBO.x, 96);
      var g1 = on(t, cMakes == null ? null : cMakes + 0.25, 0.5), g2 = on(t, cMakes == null ? null : cMakes + 0.5, 0.5);
      out += MK.arrow(BP_ROBO.x - 24, 340, 74, 400, g1, P.muted, 6);
      out += MK.arrow(BP_ROBO.x + 24, 340, 424, 396, g2, P.muted, 6);
      out += MK.cross(74, 400, 22, popIn(t, cBadly, 0.4));
      out += MK.cross(424, 396, 22, popIn(t, cBadly == null ? null : cBadly + 0.25, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: a straight line of steps ====================================== */

  var BP_CAT = ["tin", "food", "floor", "call"];

  function bpLinearMain(scene, t) {
    var cLinear = sc(scene, 0, "linear"), cLine = sc(scene, 0, "line"), cAfter = sc(scene, 0, "after");
    var cTin = sc(scene, 1, "tin"), cFood = sc(scene, 1, "food"),
      cFloor = sc(scene, 1, "floor"), cCall = sc(scene, 1, "call");
    var cJob = sc(scene, 2, "job"), cPlace = sc(scene, 2, "place");
    var cFollow = sc(scene, 4, "follow"), cFed = sc(scene, 4, "fed");
    var at = [cTin, cFood, cFloor, cCall], out = "";

    var built = 0;
    for (var b = 0; b < 4; b++) if (bpPast(t, at[b])) built = b + 1;
    out += bpScene("catfeed", BP_CAT.slice(0, built), on(t, cLinear, 0.5));
    out += bpGoal("Feed the cat", on(t, cLinear, 0.45));

    /* the straight line the steps stand in */
    var lineU = on(t, cLine, 0.8);
    out += MK.arrow(26, bpTeaY(0) + 8, 26, bpTeaY(3) + BP_ROW.h - 8, lineU, P.blue, 6);

    var jobK = bpPast(t, cJob) ? tally(t, cJob, 4, 1.15) - 1 : -1;
    var placeK = bpPast(t, cPlace) ? tally(t, cPlace, 4, 1.15) - 1 : -1;
    var run = bpPast(t, cFollow) ? tally(t, cFollow, 4, 1.25) : 0;
    BP_CAT.forEach(function (id, k) {
      var y = bpTeaY(k), o = on(t, at[k], 0.45), so = on(t, cLine, 0.5) * (1 - o);
      out += bpSlot(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, k + 1, so);
      out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, k + 1, id,
        { o: o, col: jobK === k ? P.gold : (run > k ? P.good : null),
          numCol: placeK === k ? P.gold : null,
          mark: run > k ? "tick" : null,
          markP: popIn(t, cFollow == null ? null : cFollow + k * 0.3, 0.35) });
      out += MK.ripple(BP_PANEL.x + 42, y + BP_ROW.h / 2, t, at[k], P.gold);
      /* one after another: each number lights as the line is counted down */
      out += MK.ripple(BP_PANEL.x + 42, y + BP_ROW.h / 2, t,
        cAfter == null ? null : cAfter + k * 0.22, P.blue);
    });
    out += MK.tick(bpBX(282), bpBY(36), 28, popIn(t, cFed, 0.45));
    return out;
  }

  /* the fourth beat alone: the tin is not open yet, so the spoon cannot work */
  function bpLinearClosed(scene, t) {
    var cSpoon = sc(scene, 3, "spoon"), cClosed = sc(scene, 3, "closed");
    var out = "", sp = on(t, cSpoon, 0.6);

    out += bpBoxFrame(1);
    out += Em(bpBX(84), bpBY(112), 126, "\u{1F96B}");
    out += G(Em(lerp(bpBX(262), bpBX(196), sp), bpBY(108), 96, "\u{1F944}"), { opacity: sp });
    out += MK.cross(bpBX(142), bpBY(108), 42, popIn(t, cClosed, 0.45));
    out += Tx(BP_BOX.x + BP_BOX.w / 2, BP_BOX.y + BP_BOX.h - 34, "the tin is still closed",
      "lab big muted readable", "middle", { opacity: on(t, cClosed, 0.5) });
    out += bpGoal("Feed the cat", 1);

    BP_CAT.forEach(function (id, k) {
      var y = bpTeaY(k);
      if (k === 0) { out += bpSlot(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, 1, 1); return; }
      out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, k + 1, id,
        { col: k === 1 ? P.bad : null, dimmed: k > 1,
          mark: k === 1 ? "cross" : null, markP: popIn(t, cClosed, 0.4) });
    });
    return out;
  }

  function bpLinearChapter(scene, beat, t, i) {
    var a = bpOnly(t, scene, 3), out = "";
    if (a < 1) out += G(bpLinearMain(scene, t), { opacity: 1 - a });
    if (a > 0) out += G(bpLinearClosed(scene, t), { opacity: a });
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------
     The lesson's own five words, with the lesson's own pictures for them. */
  var BP_RECAP = MK.recapKind([
    { beat: 0, at: "output", title: "Output", sub: "what you have at the end", pic: "\u{1F381}" },
    { beat: 0, at: "predict", title: "Predict", sub: "say it before you run it", pic: "\u{1F52E}" },
    { beat: 1, at: "bug", title: "Bug", sub: "a step wrong, or too early", pic: "\u{1F41B}" },
    { beat: 1, at: "edit", title: "Edit", sub: "change the one wrong step", pic: "✏️" },
    { beat: 2, at: "precise", title: "Precise", sub: "nothing left to guess", pic: "\u{1F3AF}" }
  ], { goBeat: 2, goAt: "follow" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "What the output of an algorithm is",
      "How to say it before you follow the steps",
      "How to find the one wrong step and edit it"
    ] }),
    output: bpOutputChapter, bug: bpBugChapter, fix: bpFixChapter,
    precise: bpPreciseChapter, linear: bpLinearChapter, recap: BP_RECAP
  };
