  /* ==== Bugs and Predictions, part 2 ==========================================
     The two debugging chapters: "A bug in the steps" and "Find it, then edit
     it". Both stand the algorithm on the left as numbered rows and give the
     right-hand box to the lesson's own tea scene, which paints its own
     consequence - a puddle and the words "water on the table, not in a cup!" -
     from the wrong list alone.

     The two kinds of bug are marked in two different places, on purpose:
       a WRONG STEP  -> the mark goes on the row (the sock does not belong)
       a RIGHT STEP IN THE WRONG PLACE -> the mark goes on the NUMBER, and an
       arrow points at the slot it belongs in, because the step itself is fine.
     Nothing in this film crosses a person. */

  var BP_ROW = { h: 72, gap: 14 };
  var BP_TEA_ROWS = 4;
  function bpTeaY(slot) { return bpRowY(slot, BP_TEA_ROWS, BP_ROW.h, BP_ROW.gap); }
  function bpBoxFrame(o) {
    if (!(o > 0)) return "";
    return R(BP_BOX.x, BP_BOX.y, BP_BOX.w, BP_BOX.h, 8, P.card, P.line, 3, { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: a bug in the steps ============================================ */

  /* the first beat: what the word means, in the lesson's own two halves */
  function bpBugIntro(scene, t) {
    var cBug = sc(scene, 0, "bug"), cWrong = sc(scene, 0, "wrongstep"), cPlace = sc(scene, 0, "place");
    var out = "";
    out += MK.pop(Em(584, 116, 110, "\u{1F41B}"), 584, 116, popIn(t, cBug, 0.45));
    var a = popIn(t, cWrong, 0.45), b = popIn(t, cPlace, 0.45);
    out += MK.pop(R(120, 206, 420, 186, 24, P.card, P.bad, 3) +
      Em(330, 272, 60, "\u{1F9E6}") +
      Tx(330, 330, "a step", "lab big", "middle") +
      Tx(330, 368, "that is wrong", "lab big", "middle"), 330, 300, a);
    out += MK.pop(R(628, 206, 420, 186, 24, P.card, P.gold, 3) +
      Em(838, 272, 60, "\u{1F4A7}") +
      Tx(838, 330, "a right step", "lab big", "middle") +
      Tx(838, 368, "in the wrong place", "lab big", "middle"), 838, 300, b);
    return out;
  }

  /* beats 2 and 3: a sock in the cup - a step that does not belong at all */
  function bpBugSock(scene, t) {
    var cTea = sc(scene, 1, "tea"), cCup = sc(scene, 1, "cup"), cSock = sc(scene, 1, "sock"),
      cWater = sc(scene, 1, "water"), cMilk = sc(scene, 1, "milk");
    var cBelong = sc(scene, 2, "belong"), cIsbug = sc(scene, 2, "isbug");
    var ids = ["cup", "sock", "water", "milk"], at = [cCup, cSock, cWater, cMilk], out = "";

    /* the cup is got; nothing else has been done, so the cup stays empty */
    out += bpScene("tea", bpPast(t, cCup) ? ["cup"] : [], on(t, cTea, 0.5));
    out += bpGoal("Make a cup of tea", on(t, cTea, 0.45));

    var bad = on(t, cBelong, 0.5);
    ids.forEach(function (id, k) {
      var y = bpTeaY(k), o = on(t, at[k], 0.45);
      out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, k + 1, id,
        { o: o, col: k === 1 && bad > 0.4 ? P.bad : null,
          mark: k === 1 && bad > 0.4 ? "bug" : null, markP: popIn(t, cBelong, 0.4),
          dimmed: bad > 0.4 && k !== 1 });
      out += MK.ripple(BP_PANEL.x + 42, y + BP_ROW.h / 2, t, at[k], P.gold);
    });
    /* that step is the bug: it points at a cup with nothing in it */
    out += MK.leader(BP_PANEL.x + BP_PANEL.w + 6, bpTeaY(1) + BP_ROW.h / 2, bpBX(160), bpBY(150),
      on(t, cIsbug, 0.7), P.bad);
    return out;
  }

  /* beats 4 and 5: the water poured before the cup - a right step, too early */
  function bpBugOrder(scene, t) {
    var cAnother = sc(scene, 3, "another"), cPoured = sc(scene, 3, "poured"), cBefore = sc(scene, 3, "before");
    var cRight = sc(scene, 4, "right"), cEarly = sc(scene, 4, "early"), cIsbug = sc(scene, 4, "isbug");
    var ids = ["water", "cup", "bag", "milk"], out = "";

    /* the wrong list, handed straight to the lesson's own scene */
    out += bpScene("tea", bpPast(t, cPoured) ? ["water"] : [], on(t, cAnother, 0.5));
    out += bpGoal("Make a cup of tea", on(t, cAnother, 0.45));

    var later = tally(t, cBefore, 3, 0.9);
    var early = on(t, cEarly, 0.45);
    ids.forEach(function (id, k) {
      var y = bpTeaY(k);
      var o = k === 0 ? on(t, cPoured, 0.45) : (k <= later ? on(t, cBefore, 0.45) : 0);
      out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, k + 1, id,
        { o: o, col: k === 0 && early > 0.4 ? P.gold : null,
          numCol: k === 0 && early > 0.4 ? P.bad : null,
          mark: k === 0 && bpPast(t, cRight) ? "tick" : null, markP: popIn(t, cRight, 0.4),
          numMark: k === 0 && early > 0.4 ? "cross" : null, numMarkP: popIn(t, cEarly, 0.4),
          dimmed: early > 0.4 && k !== 0 });
      out += MK.ripple(BP_PANEL.x + 42, y + BP_ROW.h / 2, t, k === 0 ? cPoured : null, P.gold);
    });
    /* pouring the water IS right (the row ticks); the slot it belongs in is
       the one below, which is what the cross on its number means */
    out += MK.arrow(26, bpTeaY(0) + BP_ROW.h / 2, 26, bpTeaY(1) + BP_ROW.h / 2, on(t, cEarly, 0.6), P.gold, 7);
    out += MK.pill(BP_PANEL.x + BP_PANEL.w, 34, "too early", popIn(t, cIsbug, 0.4),
      { size: 22, anchor: "end", col: P.bad, ink: P.bad });
    return out;
  }

  function bpBugChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), v = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(bpBugIntro(scene, t), { opacity: 1 - u });
    if (u > 0 && v < 1) out += G(bpBugSock(scene, t), { opacity: u * (1 - v) });
    if (v > 0) out += G(bpBugOrder(scene, t), { opacity: v });
    return svg(out);
  }

  /* ==== chapter: find it, then edit it ========================================= */

  /* the first beat: finding is half the job, correcting is the other half */
  function bpFixIntro(scene, t) {
    var cFind = sc(scene, 0, "find"), cHalf = sc(scene, 0, "half"),
      cCorrect = sc(scene, 0, "correct"), cOther = sc(scene, 0, "other");
    var out = "";
    out += MK.pop(R(96, 104, 440, 236, 26, P.card, P.gold, 3) +
      Em(316, 190, 86, "\u{1F50D}") + Tx(316, 274, "find it", "lab huge", "middle"), 316, 222, popIn(t, cFind, 0.45));
    out += Tx(316, 318, "half the job", "lab mid muted readable", "middle", { opacity: on(t, cHalf, 0.5) });
    out += MK.pop(R(632, 104, 440, 236, 26, P.card, P.good, 3) +
      Em(852, 190, 86, "\u{1F527}") + Tx(852, 274, "correct it", "lab huge", "middle"), 852, 222, popIn(t, cCorrect, 0.45));
    out += Tx(852, 318, "the other half", "lab mid muted readable", "middle", { opacity: on(t, cOther, 0.5) });
    return out;
  }

  /* beats 2 to 4: keep the algorithm and change the one step that is wrong */
  function bpFixEdit(scene, t) {
    var cAway = sc(scene, 1, "away"), cWorks = sc(scene, 1, "works"), cEdit = sc(scene, 1, "edit");
    var cChange = sc(scene, 2, "change"), cKeep = sc(scene, 2, "keep");
    var cSwap = sc(scene, 3, "swap"), cStays = sc(scene, 3, "stays");
    var out = "", swap = on(t, cSwap, 0.6), rest = Math.max(on(t, cWorks, 0.5), on(t, cKeep, 0.5), on(t, cStays, 0.5));

    /* the right-hand box, one picture per beat */
    var b1 = bpOnly(t, scene, 1), b2 = bpOnly(t, scene, 2), b3 = bpFrom(t, scene, 3);
    out += bpBoxFrame(Math.max(b1, b2) * (1 - b3));
    if (b1 > 0) {
      var thrown = on(t, cAway, 0.5);
      out += G(Em(884, 172, 120, "\u{1F5D1}️") +
        MK.cross(884, 172, 54, popIn(t, cEdit, 0.4)) +
        MK.pop(Em(884, 318, 86, "✏️"), 884, 318, popIn(t, cEdit, 0.45)),
        { opacity: b1 * (1 - b3) * thrown });
      out += MK.arrow(618, 172, 796, 172, thrown * b1 * (1 - b3), P.muted, 7);
    }
    if (b2 > 0) out += G(Em(884, 150, 96, "✏️") +
      MK.pill(884, 240, "edit", on(t, cChange, 0.5), { size: 28, col: P.good, ink: P.good }) +
      Tx(884, 300, "change what is", "lab big muted readable", "middle") +
      Tx(884, 340, "already there", "lab big muted readable", "middle"),
      { opacity: b2 * (1 - b3) * on(t, cChange, 0.5) });
    if (b3 > 0) out += bpScene("tea", swap > 0.5 ? ["cup", "bag"] : ["cup"], b3);

    out += bpGoal("Make a cup of tea", 1);

    /* the rows: only the second one changes, and the other three keep their ticks */
    ["cup", "sock", "water", "milk"].forEach(function (id, k) {
      var y = bpTeaY(k);
      if (k === 1) {
        out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, 2, "sock",
          { o: 1 - swap, col: P.bad, mark: "bug", markP: 1 });
        out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, 2, "bag",
          { o: swap, col: P.good, mark: "tick", markP: popIn(t, cSwap == null ? null : cSwap + 0.4, 0.4) });
        out += MK.ripple(BP_PANEL.x + 42, y + BP_ROW.h / 2, t, cSwap, P.good);
        return;
      }
      out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, k + 1, id,
        { o: 1, mark: rest > 0.3 ? "tick" : null,
          markP: popIn(t, cWorks == null ? null : cWorks + k * 0.12, 0.35) });
    });
    /* the one step being edited, ringed while its meaning is said */
    var ringed = on(t, cChange, 0.5) * (1 - swap);
    if (ringed > 0) out += R(BP_PANEL.x - 8, bpTeaY(1) - 8, BP_PANEL.w + 16, BP_ROW.h + 16, 26,
      "none", P.gold, 4 + 2 * breathe(t), { opacity: ringed });
    return out;
  }

  /* beats 5 and 6: the other edit - move a step to where it belongs, then run it */
  function bpFixMove(scene, t) {
    var cMove = sc(scene, 4, "move"), cBelongs = sc(scene, 4, "belongs"), cFirst = sc(scene, 4, "cupfirst");
    var cRun = sc(scene, 5, "run"), cCheck = sc(scene, 5, "check"), cTea = sc(scene, 5, "tea");
    var out = "", mv = Math.max(on(t, cMove, 0.85), on(t, cBelongs, 0.5));
    var done = popIn(t, cTea, 0.45);

    /* what the cup has had so far: the puddle until the cup is put first */
    var ran = bpPast(t, cRun) ? tally(t, cRun, 4, 1.35) : 0;
    var ids = ran > 0 ? ["cup", "water", "bag", "milk"].slice(0, ran) : (mv > 0.55 ? ["cup"] : ["water"]);
    out += bpScene("tea", ids, 1);
    out += MK.pop(Em(bpBX(250), bpBY(70), 54, "\u{1F50D}"), bpBX(250), bpBY(70), popIn(t, cCheck, 0.4));
    out += bpGoal("Make a cup of tea", 1, done > 0 ? P.good : P.gold);

    /* water starts in slot 1 and moves to slot 2; the cup comes up to meet it */
    var order = [{ id: "water", from: 0, to: 1 }, { id: "cup", from: 1, to: 0 },
      { id: "bag", from: 2, to: 2 }, { id: "milk", from: 3, to: 3 }];
    order.forEach(function (r) {
      var slot = lerp(r.from, r.to, mv), y = bpTeaY(slot), n = Math.round(slot) + 1;
      var lit = r.id === "cup" && on(t, cFirst, 0.5) > 0.4 && ran === 0;
      out += bpRow(BP_PANEL.x, y, BP_PANEL.w, BP_ROW.h, n, r.id,
        { col: lit ? P.gold : (ran >= n ? P.good : null),
          mark: ran >= n ? "tick" : null,
          markP: popIn(t, cRun == null ? null : cRun + (n - 1) * 0.45, 0.35) });
    });
    out += MK.tick(bpBX(288), bpBY(206), 30, done);
    return out;
  }

  function bpFixChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), v = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(bpFixIntro(scene, t), { opacity: 1 - u });
    if (u > 0 && v < 1) out += G(bpFixEdit(scene, t), { opacity: u * (1 - v) });
    if (v > 0) out += G(bpFixMove(scene, t), { opacity: v });
    return svg(out);
  }
