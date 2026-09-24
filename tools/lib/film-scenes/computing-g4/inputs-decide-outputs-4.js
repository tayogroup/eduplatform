  /* ==== Grade 4 Computing, Lesson 4: Inputs Decide Outputs, part 4 =============
     "Checking it" - the loop unrolled into the steps it really does - and
     "What you now know". Then KINDS, and the load-time check that the branch
     pictures agree with the lesson's own rule. */

  var UNR = {
    tileW: 88, pitch: 96, x0: 60, y: 146, h: 120,
    numY: 288, sum1: 326, sum2: 364
  };
  function idoTileX(k) { return UNR.x0 + k * UNR.pitch; }

  /* one step of the unrolled list: its picture and one word */
  function idoTile(k, step, o, col) {
    if (!(o > 0)) return "";
    var x = idoTileX(k), cx = x + UNR.tileW / 2;
    var word = step.id === "can" ? "can" : step.id === "away" ? "away" : step.id;
    return G(R(x, UNR.y, UNR.tileW, UNR.h, 18, P.cell, col || P.line, col ? 3.5 : 2) +
      idoPic(cx, UNR.y + 44, 46, step) +
      Tx(cx, UNR.y + 98, word, "lab", "middle", { "font-size": 18 }),
      { transform: around(cx, UNR.y + UNR.h / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }
  /* an empty place in the strip. `warm` 0 -> 1 lights it as "every step" is
     said, so that phrase has a picture of its own rather than riding on the
     one before it. */
  function idoSlot(k, o, warm) {
    if (!(o > 0)) return "";
    var w = clamp(warm || 0, 0, 1);
    return R(idoTileX(k), UNR.y, UNR.tileW, UNR.h, 18, P.card, w > 0 ? P.gold : P.line, 2,
      { "stroke-dasharray": "10 8", opacity: clamp(o, 0, 1) * (w > 0 ? 0.55 + 0.45 * w : 1) }) +
      (w > 0 ? R(idoTileX(k) + 4, UNR.y + 4, UNR.tileW - 8, UNR.h - 8, 14, P.gold, null, null,
        { opacity: 0.12 * w * clamp(o, 0, 1) }) : "");
  }
  /* the bracket over one turn of the loop */
  function idoBracket(from, to, label, o) {
    if (!(o > 0)) return "";
    var x1 = idoTileX(from) + 6, x2 = idoTileX(to) + UNR.tileW - 6, mid = (x1 + x2) / 2;
    return G(Pth("M" + n2(x1) + "," + n2(UNR.y - 12) + " L" + n2(x1) + "," + n2(UNR.y - 26) +
      " L" + n2(x2) + "," + n2(UNR.y - 26) + " L" + n2(x2) + "," + n2(UNR.y - 12), null, P.good, 3) +
      Tx(mid, UNR.y - 36, label, "lab", "middle", { "font-size": 19, fill: P.good }),
      { opacity: clamp(o, 0, 1) });
  }

  function idoUnrollStrip(scene, t) {
    var cCheck = sc(scene, 0, "check"), cUnroll = sc(scene, 0, "unroll"), cEvery = sc(scene, 0, "every");
    var cThree = sc(scene, 1, "three"), cTimes = sc(scene, 1, "times"), cNine = sc(scene, 1, "nine");
    var cBefore = sc(scene, 2, "before"), cAfter = sc(scene, 2, "after"), cTotal = sc(scene, 2, "total");
    var cWhole = sc(scene, 3, "whole"), cExtra = sc(scene, 3, "extra"), cRight = sc(scene, 3, "right");

    var list = idoUnrolled(IDO_WATER.times);     /* the kit's own eleven */
    var nine = list.length - 2, total = list.length;
    var out = "";

    /* the rolled program, in one line, so the unrolling has something to be of */
    out += MK.pill(584, 44, "repeat " + IDO_WATER.times + " times: fill, pour, walk",
      on(t, cCheck, 0.5), { size: 21, col: P.gold, ink: P.gold, fill: P.cell });

    /* the slots, then the steps that go in them */
    var slotO = on(t, cUnroll, 0.5);
    /* "every step": the light runs along the strip, one place at a time */
    var lit = tally(t, cEvery, total, 1.3);
    for (var k = 0; k < total; k++) out += idoSlot(k, slotO, k < lit ? 1 : 0);

    /* the nine: the first turn on "Three steps", the other two on "three times
       round", each turn as a group under its own bracket */
    var turnAt = [cThree, cTimes, cTimes == null ? null : cTimes + 0.7];
    for (var turn = 0; turn < IDO_WATER.times; turn++) {
      var at = turnAt[Math.min(turn, turnAt.length - 1)];
      var from = 1 + turn * IDO_WATER.body.length;
      for (var j = 0; j < IDO_WATER.body.length; j++) {
        out += idoTile(from + j, list[from + j],
          popIn(t, at == null ? null : at + j * 0.28, 0.35), P.good);
      }
      out += idoBracket(from, from + IDO_WATER.body.length - 1,
        (turn + 1) + (turn === 0 ? "st" : turn === 1 ? "nd" : "rd") + " time",
        on(t, at == null ? null : at + 0.2, 0.5));
    }
    /* the two that are outside it */
    out += idoTile(0, list[0], popIn(t, cBefore, 0.4), P.gold);
    out += idoTile(total - 1, list[total - 1], popIn(t, cAfter, 0.4), P.gold);

    /* the numbers, once every step is standing in its place */
    var numO = on(t, cTotal, 0.6);
    if (numO > 0) {
      for (var m = 0; m < total; m++) {
        out += Tx(idoTileX(m) + UNR.tileW / 2, UNR.numY, String(m + 1), "lab muted", "middle",
          { "font-size": 19, opacity: numO * (m < tally(t, cTotal, total, 0.9) ? 1 : 0) });
      }
    }

    /* the arithmetic, in the lesson's own words */
    var ninePop = on(t, cNine, 0.5), totalPop = on(t, cTotal, 0.5);
    var flash = bump(t, cExtra, 1.4);
    out += G(Tx(584, UNR.sum1, IDO_WATER.body.length + " steps, " + IDO_WATER.times +
      " times round, makes " + nine, "lab", "middle",
      { "font-size": 24, fill: P.good }), { opacity: ninePop });
    out += G(Tx(584, UNR.sum2, nine + " in the loop, one before and one after, makes " + total,
      "lab", "middle", { "font-size": 24, fill: P.gold }), { opacity: totalPop });
    if (flash > 0) out += R(180, UNR.sum1 - 28, 808, 74, 16, "none", P.gold, 3, { opacity: flash });

    /* "Does it do the whole job?" - the strip ringed, then ticked */
    var wholeP = on(t, cWhole, 0.6), rightP = popIn(t, cRight, 0.45);
    if (wholeP > 0) out += R(idoTileX(0) - 8, UNR.y - 8, idoTileX(total - 1) + UNR.tileW + 8 - idoTileX(0) + 8,
      UNR.h + 16, 24, "none", rightP > 0 ? P.good : P.gold, 4,
      { opacity: wholeP * (rightP > 0 ? 1 : 0.55 + 0.45 * breathe(t)) });
    out += MK.tick(1118, 92, 26, rightP);
    return out;
  }

  /* the last beat: only the count moves */
  var IDO_CNT = { box: { x: 56, y: 96, w: 484, h: 248 }, garden: { x: 600, y: 96, w: 510, h: 248 } };
  function idoCountChange(scene, t) {
    var cFour = sc(scene, 4, "four"), cCount = sc(scene, 4, "count"), cNothing = sc(scene, 4, "nothing");
    var b = IDO_CNT.box, o = on(t, cFour, 0.5), out = "";
    var changed = idoPast(t, cCount), times = changed ? 4 : IDO_WATER.times;
    var flip = popIn(t, cCount, 0.45);

    out += G(R(b.x, b.y, b.w, b.h, 26, P.card, P.good, 3) +
      Em(b.x + 48, b.y + 60, 34, "\u{1F501}") +
      Tx(b.x + 80, b.y + 70, "repeat", "lab", "start", { "font-size": 30 }), { opacity: o });
    /* the count chip, the only thing that moves */
    out += G(R(b.x + 150, b.y + 108, 118, 100, 20, P.cell, P.gold, 4) +
      Tx(b.x + 209, b.y + 178, String(times), "lab", "middle", { "font-size": 62, fill: P.gold }),
      { opacity: o, transform: around(b.x + 209, b.y + 158, 1 + 0.12 * Math.min(1, flip)) });
    out += G(Tx(b.x + 288, b.y + 178, "times", "lab", "start", { "font-size": 30 }), { opacity: o });
    /* and the three steps, which do not */
    var np = on(t, cNothing, 0.6);
    out += G(Tx(b.x + b.w / 2, b.y + 234, "fill, pour, walk", "lab muted", "middle", { "font-size": 23 }),
      { opacity: o });
    if (np > 0) out += MK.pill(b.x + b.w / 2, b.y + b.h + 44, "nothing else moves", np,
      { size: 21, col: P.gold, ink: P.gold, fill: P.cell });

    /* the garden gains its fourth plant */
    var g = IDO_CNT.garden;
    out += G(R(g.x, g.y, g.w, g.h, 26, P.card, P.line, 2) +
      R(g.x + 18, g.y + g.h - 62, g.w - 36, 40, 12, "#2E4A34"), { opacity: o });
    var n = changed ? 4 : 3, pitch = (g.w - 90) / n, x0 = g.x + 45 + pitch / 2, size = changed ? 58 : 66;
    for (var k = 0; k < n; k++) {
      var pop = (changed && k === n - 1) ? flip : 1;
      if (!(pop > 0)) continue;
      out += G(Em(x0 + k * pitch, g.y + g.h - 62 - size * 0.42, size, "\u{1F331}"),
        { opacity: o, transform: around(x0 + k * pitch, g.y + g.h - 62, Math.min(1.08, pop)) });
    }
    out += G(Tx(g.x + g.w / 2, g.y + 42, n + " plants", "lab", "middle", { "font-size": 24, fill: P.good }),
      { opacity: o });
    return out;
  }

  function idoUnrollChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(idoUnrollStrip(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(idoCountChange(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------
     The lesson's own five words, and input and output from its title. */
  var IDO_RECAP = MK.recapKind([
    { beat: 0, at: "branch", title: "Branch", sub: "a fork in an algorithm", pic: "\u{1F500}" },
    { beat: 0, at: "question", title: "Question", sub: "what it asks about the input", pic: "❓" },
    { beat: 0, at: "rule", title: "Rule", sub: "this answer, these steps", pic: "\u{1F4CB}" },
    { beat: 1, at: "outputs", title: "Output", sub: "different for each input", pic: "\u{1F4E4}" },
    { beat: 2, at: "loop", title: "Repeat", sub: "do the loop steps again", pic: "\u{1F501}" },
    { beat: 2, at: "count", title: "Count", sub: "how many times round", pic: "\u{1F522}" }
  ], { goBeat: 2, goAt: "count" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "How one question splits an algorithm in two",
      "Why the same steps give a different output",
      "How to put the steps that repeat inside a loop"
    ] }),
    fork: idoForkChapter, inputs: idoInputsChapter, write: idoWriteChapter,
    loop: idoLoopChapter, unroll: idoUnrollChapter, recap: IDO_RECAP
  };

  /* ==== the film's own load-time check ==========================================
     A branch film's easiest fault is lighting the arm the rule does not take,
     and no sampled frame proves it did not. So the three rounds are run through
     the kit's branchRun here, as the page loads, and the answers checked
     against what the pictures assume. */
  (function () {
    function same(a, b) { return a.length === b.length && a.every(function (x, k) { return x === b[k]; }); }
    [IDO_SCHOOL, IDO_QUIZ, IDO_BOOK].forEach(function (rd) {
      var y = idoRun(rd, rd.inputs[0].id), n = idoRun(rd, rd.inputs[1].id);
      if (!same(y, rd.before.concat(rd.yes, rd.after)))
        throw new Error("ido: branchRun no longer takes the yes arm for " + rd.task);
      if (!same(n, rd.before.concat(rd.no, rd.after)))
        throw new Error("ido: branchRun no longer takes the no arm for " + rd.task);
      if (!same(idoArm(rd, rd.inputs[0].id), rd.yes) || !same(idoArm(rd, rd.inputs[1].id), rd.no))
        throw new Error("ido: the arm the film draws is not the arm the rule returns, for " + rd.task);
      if (idoArm(rd, rd.inputs[0].id).some(function (st) { return rd.no.indexOf(st) >= 0; }))
        throw new Error("ido: the two arms of " + rd.task + " share a step, so a lit arm proves nothing");
    });
    /* the fork chapter dims the arm branchRun did NOT return: check that the
       raining input really does return the yes arm and not the no one */
    var taken = idoRun(IDO_SCHOOL, IDO_SCHOOL.inputs[0].id);
    if (IDO_SCHOOL.no.some(function (st) { return taken.indexOf(st) >= 0; }))
      throw new Error("ido: the raining input reaches a sunny step");
    if (!IDO_SCHOOL.yes.every(function (st) { return taken.indexOf(st) >= 0; }))
      throw new Error("ido: the raining input misses one of its own steps");
    /* the unrolled strip and the garden must both be the kit's eleven */
    var list = idoUnrolled(IDO_WATER.times);
    if (list.length !== 1 + IDO_WATER.body.length * IDO_WATER.times + 1)
      throw new Error("ido: expandLoop no longer unrolls to " +
        (1 + IDO_WATER.body.length * IDO_WATER.times + 1) + " steps");
    if (list[0] !== IDO_WATER.before || list[list.length - 1] !== IDO_WATER.after)
      throw new Error("ido: the once-only steps are no longer the ends of the unrolled list");
    if (idoUnrolled(4).length !== 14)
      throw new Error("ido: changing the count to four no longer gives fourteen steps");
  })();
