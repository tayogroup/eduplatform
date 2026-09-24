  /* ==== Grade 4 Computing, Lesson 4: Inputs Decide Outputs, part 3 =============
     "Building a loop": the lesson's watering round, with the three every-plant
     steps inside a repeat box and the two once-only steps outside it. The
     garden on the right is watered by the loop the box describes - the turns
     come from ART.algo.expandLoop, so the picture cannot show a different
     number of waterings from the count on the chip. */

  /* the lesson's own steps, from the "loopbuild" round (water 3 plants) */
  var IDO_WATER = {
    before: { id: "can", label: "Get the can out of the shed", pic: "\u{1F6BF}" },
    body: [{ id: "fill", label: "Fill the can", pic: "\u{1F4A7}" },
           { id: "pour", label: "Pour on a plant", pic: "\u{1F331}" },
           { id: "walk", label: "Walk to the next plant", pic: "\u{1F6B6}" }],
    after: { id: "away", label: "Put the can away", pic: "\u{1F6AA}" },
    times: 3
  };
  /* the kit's own unrolled list, which is what the garden and the strip count */
  function idoUnrolled(times) {
    return ART.algo.expandLoop([IDO_WATER.before], IDO_WATER.body, times, [IDO_WATER.after]);
  }

  var LOOPV = {
    prog: { x: 16, w: 644 },
    before: { y: 16, h: 66 },
    box: { y: 100, h: 232, head: 52, rowH: 50, gap: 8, rowTop: 162 },
    after: { y: 352, h: 66 },
    garden: { x: 688, y: 16, w: 464, h: 404, ground: 356 }
  };

  /* the garden: n plants on a row, each greener once the loop has poured on it */
  function idoGarden(n, watered, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var g = LOOPV.garden, out = R(g.x, g.y, g.w, g.h, 26, P.card, P.line, 2);
    out += R(g.x + 18, g.ground, g.w - 36, 44, 12, "#2E4A34");
    var pitch = (g.w - 96) / n, x0 = g.x + 48 + pitch / 2, size = n > 3 ? 58 : 68;
    for (var k = 0; k < n; k++) {
      var cx = x0 + k * pitch, done = k < watered;
      var pop = opt.popLast && k === n - 1 ? opt.popLast : 1;
      if (!(pop > 0)) continue;
      out += G(Em(cx, g.ground - size * 0.42, size, "\u{1F331}"),
        { opacity: done ? 1 : 0.5, transform: around(cx, g.ground, Math.min(1.08, pop)) });
      if (done) out += MK.tick(cx + size * 0.42, g.ground - size * 0.92, 15, 1);
    }
    /* the can, over the plant it is pouring on */
    if (opt.canAt != null && opt.canAt >= 0 && opt.canAt < n) {
      var ccx = x0 + opt.canAt * pitch;
      out += idoCan(ccx - 6, g.ground - size - 58, 96, 1);
      out += G(Em(ccx - 44, g.ground - size - 16, 26, "\u{1F4A7}"), { opacity: 0.9 });
    } else if (opt.canPark) {
      /* down on the soil, clear of the first plant */
      out += idoCan(g.x + 52, g.ground + 16, 70, 1);
    }
    if (opt.turn) out += MK.pill(g.x + g.w / 2, g.y + 42, opt.turn, 1,
      { size: 20, col: P.good, ink: P.good, fill: P.cell });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the repeat box: a header carrying the count, and the body steps in it */
  function idoRepeatBox(t, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var b = LOOPV.box, x = LOOPV.prog.x, w = LOOPV.prog.w;
    var col = opt.col || P.line;
    var out = R(x, b.y, w, b.h, 24, P.card, col, opt.col ? 4 : 2, opt.dash ? { "stroke-dasharray": "12 9" } : null);
    out += L(x + 16, b.y + b.head, x + w - 16, b.y + b.head, col, 2, { opacity: 0.6 });
    out += Em(x + 40, b.y + b.head / 2, 30, "\u{1F501}");
    out += Tx(x + 68, b.y + b.head / 2 + 8, "repeat", "lab", "start", { "font-size": 23, fill: P.ink });
    /* the count, in a chip of its own: the one thing that changes */
    var cp = opt.countP == null ? 1 : opt.countP;
    if (cp > 0) {
      out += G(R(x + 158, b.y + 10, 56, b.head - 20, 12, P.cell, P.gold, 3) +
        Tx(x + 186, b.y + b.head / 2 + 11, String(opt.times == null ? IDO_WATER.times : opt.times),
          "lab", "middle", { "font-size": 28, fill: P.gold }),
        { transform: around(x + 186, b.y + b.head / 2, Math.min(1.12, cp)), opacity: Math.min(1, cp) });
      out += G(Tx(x + 228, b.y + b.head / 2 + 8, "times", "lab", "start", { "font-size": 23, fill: P.ink }),
        { opacity: Math.min(1, cp) });
    }
    IDO_WATER.body.forEach(function (st, k) {
      var so = typeof opt.step === "function" ? opt.step(k, st) : (opt.step == null ? 1 : opt.step);
      out += idoRow(x + 22, b.rowTop + k * (b.rowH + b.gap), w - 44, b.rowH, st,
        { o: so, size: 21, col: opt.liveRow === k ? P.good : null, fill: P.cell });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function idoLoopChapter(scene, beat, t, i) {
    var cWater = sc(scene, 0, "water"), cSame = sc(scene, 0, "same"), cEvery = sc(scene, 0, "every");
    var cFill = sc(scene, 1, "fill"), cPour = sc(scene, 1, "pour"), cWalk = sc(scene, 1, "walk"),
      cLoop = sc(scene, 1, "loop");
    var cCount = sc(scene, 2, "count"), cTimes = sc(scene, 2, "times");
    var cCan = sc(scene, 3, "can"), cOutside = sc(scene, 3, "outside");
    var cAway = sc(scene, 4, "away"), cAfter = sc(scene, 4, "after");

    var n = IDO_WATER.times;
    /* how far through the loop the run has got: one turn a second, so the
       number of waterings is the count on the chip and never a number of this
       film's own (the unrolled list itself is checked in -4.js) */
    var watered = 0, canAt = -1, liveRow = -1, turnPill = "";
    if (idoPast(t, cTimes)) {
      var u = (t - cTimes) / 1.0;                  /* one turn a second */
      if (u >= n) {
        watered = n;                               /* the run has finished: every
                                                      plant watered, the can down */
      } else {
        watered = Math.min(n, Math.floor(u) + (u % 1 > 0.45 ? 1 : 0));
        canAt = Math.min(n - 1, Math.floor(u));
        liveRow = Math.min(2, Math.floor((u % 1) * 3));
        turnPill = "turn " + Math.min(n, Math.floor(u) + 1) + " of " + n;
      }
    }
    var everyP = on(t, cEvery, 0.6);
    var canP = bump(t, cOutside, 1.8), awayP = bump(t, cAfter, 1.8);
    var out = "";

    /* the once-only steps, outside the box */
    out += idoRow(LOOPV.prog.x, LOOPV.before.y, LOOPV.prog.w, LOOPV.before.h, IDO_WATER.before,
      { o: on(t, cCan, 0.5), size: 21, col: canP > 0.3 ? P.gold : null });
    if (canP > 0) out += MK.pill(LOOPV.prog.x + LOOPV.prog.w - 76, LOOPV.before.y + 33, "once",
      canP, { size: 18, col: P.gold, ink: P.gold, fill: P.cell });
    out += idoRow(LOOPV.prog.x, LOOPV.after.y, LOOPV.prog.w, LOOPV.after.h, IDO_WATER.after,
      { o: on(t, cAway, 0.5), size: 21, col: awayP > 0.3 ? P.gold : null });
    if (awayP > 0) out += MK.pill(LOOPV.prog.x + LOOPV.prog.w - 76, LOOPV.after.y + 33, "once",
      awayP, { size: 18, col: P.gold, ink: P.gold, fill: P.cell });

    /* the box, dashed until the steps are put in it */
    out += idoRepeatBox(t, on(t, cSame, 0.6), {
      dash: !idoPast(t, cFill),
      col: idoPast(t, cLoop) ? P.good : null,
      countP: popIn(t, cCount, 0.45),
      liveRow: liveRow,
      step: function (k) { return on(t, k === 0 ? cFill : k === 1 ? cPour : cWalk, 0.45); }
    });

    /* the garden the loop is for */
    out += idoGarden(n, watered, on(t, cWater, 0.6),
      { canAt: canAt, canPark: canAt < 0, turn: turnPill });
    /* "the same three steps happen for every plant": each plant in turn */
    if (everyP > 0 && !idoPast(t, cTimes)) {
      var g = LOOPV.garden, pitch = (g.w - 96) / n, x0 = g.x + 48 + pitch / 2;
      for (var k = 0; k < n; k++) {
        out += MK.ripple(x0 + k * pitch, g.ground - 30, t, cEvery == null ? null : cEvery + k * 0.4, P.good);
      }
    }
    return svg(out);
  }
