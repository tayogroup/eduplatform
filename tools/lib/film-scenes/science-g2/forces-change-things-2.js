  /* ==== Forces Change Things, part 2 of 3 =====================================
     "Bigger push, further roll" and "Graph it". Same scope as part 1.

     The track is the lesson's own: ART.sim("pushBall", "draw", x, label,
     "\u{1F697}") is exactly what the experiment step draws, down to the child
     standing at the start line and the eleven marks, 0 to 10. The film places
     it whole and changes one thing in its markup: the car loses the CSS
     transition the lesson gives it, since a film moves nothing by itself.
     The three pushes roll it 3, 6 and 9 steps, the lesson's own numbers.

     The table and the block graph are drawn in the lesson's own shapes
     (science.css: a two-column results table, and teal blocks 24 px tall
     stacked on an ink baseline under a picture and a word). */

  var FC_CAR = "\u{1F697}";
  var FC_TRACK_THING = 'font-size="44" style="transition: x 900ms ease-out"';
  function fcTrackSvg(pos, label) {
    var m = ART.sim("pushBall", "draw", pos, label, FC_CAR);
    var k = m.indexOf(FC_TRACK_THING);
    if (k < 0) throw new Error("forces-change-things: the lesson's pushBall no longer draws its car the way the film expects (" + FC_TRACK_THING + ")");
    return m.slice(0, k) + 'font-size="44"' + m.slice(k + FC_TRACK_THING.length);
  }
  /* where a track sits in the chapter, and a point of the lesson's 320 x 240 in it */
  function fcBox(x, y, w) { return { x: x, y: y, w: w, h: w * 0.75, s: w / 320 }; }
  function fcMix(a, b, u) { return fcBox(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.w, b.w, u)); }
  function fcTX(b, lx) { return b.x + lx * b.s; }
  function fcTY(b, ly) { return b.y + ly * b.s; }
  function fcMarkX(n) { return 30 + n * 26; }

  /* the lesson's track, and the film's counting on it. o: {pos, label,
     lit (how many marks are counted), bar (steps under the gold bar),
     badge ({n, p, pulse}), glowCar, glowFloor, flashLine, far, sweep, lift}.
     `lift` pops a copy of the car clear of the start line: the kit draws the
     car at x 30 and the child at x 14 AFTER it, so at step 0 the child covers
     the car and there is nothing at the start line to name or to ring.
     The push itself is drawn UNDER the track, where there is room for the
     three sizes to be compared. */
  function fcCountedTrack(b, o) {
    var out = ART.place(fcTrackSvg(o.pos, o.label), b.x, b.y, b.w, b.h), s = b.s;
    if (o.flashLine > 0) out += R(fcTX(b, 20), fcTY(b, 194), 280 * s, 8 * s, 2, FC_FORCE, null, null, { opacity: o.flashLine });
    if (o.bar > 0) out += R(fcTX(b, 30), fcTY(b, 193.5), o.bar * 26 * s, 9 * s, 3 * s, FC_FORCE);
    for (var n = 0; n <= 10; n++) {
      var lit = n === 0 ? 0 : clamp(o.lit - n + 1, 0, 1), sw = o.sweep ? o.sweep(n) : 0, v = Math.max(lit, sw);
      if (v <= 0) continue;
      out += G(C(fcTX(b, fcMarkX(n)), fcTY(b, 224), 10 * s, FC_FORCE) +
        Tx(fcTX(b, fcMarkX(n)), fcTY(b, 228), String(n), "lab", "middle", { fill: "#142B3E", "font-size": 11 * s }), { opacity: v });
    }
    if (o.far > 0) {
      /* both heads grow OUT from the middle, so the half-drawn state reads as
         "how far", not as two arrows flying apart */
      out += MK.arrow(fcTX(b, fcMarkX(5)), fcTY(b, 126), fcTX(b, fcMarkX(0)), fcTY(b, 126), o.far, FC_FORCE, 4 * s);
      out += MK.arrow(fcTX(b, fcMarkX(5)), fcTY(b, 126), fcTX(b, fcMarkX(10)), fcTY(b, 126), o.far, FC_FORCE, 4 * s);
    }
    if (o.glowFloor > 0) out += R(b.x + 3, fcTY(b, 180), b.w - 6, 60 * s, 6, "none", FC_FORCE, 4, { opacity: o.glowFloor });
    var carY = o.lift > 0 ? 86 : 160;
    if (o.lift > 0) {
      var lx = fcTX(b, fcMarkX(0)), ly = fcTY(b, carY);
      out += MK.pop(MK.pic(lx, ly, 50 * s, FC_CAR), lx, ly, Math.min(1, o.lift));
    }
    if (o.glowCar > 0) out += C(fcTX(b, fcMarkX(o.pos)), fcTY(b, carY), 30 * s, "none", FC_FORCE, 3 * s, { opacity: o.glowCar });
    if (o.badge && o.badge.p > 0) {
      var cx = fcTX(b, fcMarkX(o.badge.n)), cy = fcTY(b, 116), k = 1 + 0.22 * (o.badge.pulse || 0);
      out += MK.pop(C(cx, cy, 30 * s * k, FC_FORCE) +
        Tx(cx, cy + 12 * s * k, String(o.badge.n), "lab", "middle", { fill: "#142B3E", "font-size": 34 * s * k }), cx, cy, o.badge.p);
    }
    return out;
  }

  var FC_FULL = fcBox(304, 6, 560);
  var FC_SLOT = [fcBox(10, 16, 372), fcBox(398, 16, 372), fcBox(786, 16, 372)];

  function fcBiggerChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cCar = c(0, "car"), cTrack = c(0, "track"), cDist = c(0, "distance"), cFar = c(0, "far"), cSteps = c(0, "steps");
    var cGently = c(1, "gently"), cLittle = c(1, "little"), cThree = c(1, "three");
    var cMedium = c(2, "medium"), cFurther = c(2, "further"), cSix = c(2, "six");
    var cHard = c(3, "hard"), cFurthest = c(3, "furthest"), cNine = c(3, "nine");
    var cSameCar = c(4, "car"), cFloor = c(4, "floor"), cOnly = c(4, "push");
    var cPattern = c(5, "pattern"), cBigger = c(5, "bigger"), cMove = c(5, "move");

    var shrink = ease(into(t, scene.first + 1));
    var boxes = [fcMix(FC_FULL, FC_SLOT[0], shrink), FC_SLOT[1], FC_SLOT[2]];
    var show = [1, into(t, scene.first + 2), into(t, scene.first + 3)];
    var goes = [
      { at: cGently, steps: 3, num: cThree, word: "gentle push", len: 96, w: 8 },
      { at: cMedium, steps: 6, num: cSix, word: "medium push", len: 158, w: 12 },
      { at: cHard, steps: 9, num: cNine, word: "hard push", len: 220, w: 17 }
    ];
    var together = bump(t, cMove, 1.3);
    var out = "";

    var pushPulse = bump(t, cOnly, 1.4) + bump(t, cBigger, 1.3);
    goes.forEach(function (g, k) {
      if (!(show[k] > 0)) return;
      /* the car leaves just after its push is named and is at rest on its
         number, so the roll is finished when the line says how far it went */
      var go = g.at == null ? null : g.at + 0.25;
      var pos = g.steps * fcSpan(t, go, g.num, fcGlide);
      var label = go == null || t < go ? "steps along the track"
        : g.num != null && t >= g.num ? "It rolled " + g.steps + " steps" : "";
      out += G(fcCountedTrack(boxes[k], {
        pos: pos, label: label, lit: pos, bar: pos,
        sweep: k === 0 && cSteps != null ? function (n) { return bump(t, cSteps + n * 0.07, 0.5); } : null,
        flashLine: k === 0 ? bump(t, cTrack, 1.1) : 0,
        far: k === 0 ? on(t, cDist, 0.8) * (1 - on(t, cGently, 0.4)) * Math.max(0.35, on(t, cFar, 0.5)) : 0,
        lift: k === 0 ? popIn(t, cCar, 0.4) * (1 - on(t, cGently, 0.35)) : 0,
        glowCar: Math.max(k === 0 ? Math.max(bump(t, cCar, 1.2), 0.85 * on(t, cCar == null ? null : cCar + 0.2, 0.4) * (1 - on(t, cTrack, 0.4))) : 0, bump(t, cSameCar, 1.4)),
        glowFloor: bump(t, cFloor, 1.4),
        badge: { n: g.steps, p: popIn(t, g.num, 0.4), pulse: together }
      }), { opacity: show[k] });
      /* the push itself, under its own track: three arrows to compare */
      var cx = FC_SLOT[k].x + FC_SLOT[k].w / 2, u = on(t, g.at, 0.4);
      var pw = g.w * (1 + 0.32 * clamp(pushPulse, 0, 1));
      out += G(MK.glow(cx, 330, Math.min(g.len / 2 + 20, 104), FC_FORCE, clamp(pushPulse, 0, 1) * 2.2) +
        MK.arrow(cx - g.len / 2, 330, cx + g.len / 2, 330, u, FC_FORCE, pw) +
        Tx(cx, 392, g.word, "lab", "middle", { fill: FC_FORCE, "font-size": 30, opacity: u }),
        { opacity: show[k] });
    });

    /* the last line: the three side by side, bigger push and bigger move */
    var pat = on(t, cPattern, 0.8);
    if (pat > 0) out += MK.arrow(120, 426, 1050, 426, pat, FC_FORCE, 7);
    return svg(out);
  }

  /* ==== chapter: graph it =======================================================
     The lesson's results table on the left and its block graph on the right,
     drawn in the lesson's own shapes: the rows fill as the three distances are
     said, then a block goes down for each step, and a dashed line rises across
     the tops of the columns as the pattern is named. The dashed column at the
     end is the harder push the lesson's own reading question asks about. */
  var FC_BASE = 368, FC_BH = 24, FC_BGAP = 2, FC_BW = 64;
  var FC_COL = [660, 800, 940], FC_GHOST = 1080;
  function fcBlock(cx, k, o, flash) {
    if (!(o > 0)) return "";
    var y = FC_BASE - (k + 1) * (FC_BH + FC_BGAP) + FC_BGAP;
    return G(R(cx - FC_BW / 2, y, FC_BW, FC_BH, 4, P.teal) +
      (flash > 0 ? R(cx - FC_BW / 2, y, FC_BW, FC_BH, 4, "#FFFFFF", null, null, { opacity: 0.5 * flash }) : ""),
      { opacity: clamp(o, 0, 1) });
  }
  function fcColTop(n) { return FC_BASE - n * (FC_BH + FC_BGAP); }

  var FC_ROWS = [
    { pic: "\u{1F449}", label: "gentle push", value: 3, col: "gentle" },
    { pic: "\u{1F44A}", label: "medium push", value: 6, col: "medium" },
    { pic: "\u{1F4A5}", label: "hard push", value: 9, col: "hard" }
  ];

  function fcGraphChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTable = c(0, "table"), cG = c(0, "gentle"), cM = c(0, "medium"), cH = c(0, "hard");
    var cGraph = c(1, "graph"), cBlock = c(1, "block");
    var cThree = c(2, "three"), cSix = c(2, "six"), cNine = c(2, "nine");
    var cLook = c(3, "look"), cTall = c(3, "taller");
    var cInc = c(4, "increasing"), cPush = c(4, "push"), cRoll = c(4, "roll");
    var cHarder = c(5, "harder"), cTall2 = c(5, "taller");
    var rowAt = [cG, cM, cH], colAt = [cThree, cSix, cNine];
    var out = "";

    /* ---- the results table ---------------------------------------------------
       The table comes in with the chapter rather than on its own cue: keyed to
       the cue, the stage was bare for the second and a half before "a table"
       was said. The cue fills the rows instead. */
    var to = inAt(t, BEATS[scene.first].start - GAP, 0.5);
    if (to > 0) {
      var T = Tx(48, 96, "Push", "lab mid muted", "start") + Tx(400, 96, "Steps rolled", "lab mid muted", "middle");
      FC_ROWS.forEach(function (r, k) {
        var y = 116 + k * 86, ro = on(t, rowAt[k], 0.4);
        T += R(40, y, 292, 76, 16, P.cell, P.line, 2);
        T += MK.pic(78, y + 38, 40, r.pic);
        T += Tx(112, y + 47, r.label, "lab big");
        T += R(340, y, 120, 76, 16, ro > 0.5 ? "#1B3A52" : P.card, ro > 0.5 ? FC_FORCE : P.line, ro > 0.5 ? 3 : 2);
        T += MK.pop(Tx(400, y + 52, String(r.value), "lab", "middle", { fill: P.ink, "font-size": 40 }), 400, y + 38, popIn(t, rowAt[k], 0.38));
      });
      out += G(T, { opacity: to });
    }

    /* ---- the block graph ----------------------------------------------------- */
    var go = on(t, cGraph, 0.5);
    if (go > 0) {
      var Gm = L(596, FC_BASE + 2, 1128, FC_BASE + 2, P.ink, 3);
      FC_ROWS.forEach(function (r, k) {
        Gm += MK.pic(FC_COL[k], 396, 32, r.pic);
        Gm += Tx(FC_COL[k], 428, r.col, "lab mid muted", "middle");
      });
      /* "one block for each step": the first block alone, ringed */
      var one = popIn(t, cBlock, 0.4) * (1 - on(t, cThree, 0.4));
      if (one > 0) {
        Gm += fcBlock(FC_COL[0], 0, Math.min(1, one), 0);
        Gm += R(FC_COL[0] - FC_BW / 2 - 5, fcColTop(1) - 3, FC_BW + 10, FC_BH + 8, 7, "none", FC_FORCE, 3, { opacity: Math.min(1, one) });
      }
      /* the three columns, a block at a time */
      FC_ROWS.forEach(function (r, k) {
        for (var q = 0; q < r.value; q++) {
          var at = colAt[k] == null ? null : colAt[k] + q * 0.13;
          var p = popIn(t, at, 0.3);
          if (!(p > 0)) continue;
          Gm += fcBlock(FC_COL[k], q, Math.min(1, p), bump(t, cLook == null ? null : cLook + k * 0.25, 0.7));
        }
      });
      /* "each one is taller than the last": a dashed line across the tops */
      var tallU = on(t, cTall, 0.9), pts = [[FC_COL[0], fcColTop(3)], [FC_COL[1], fcColTop(6)], [FC_COL[2], fcColTop(9)]];
      if (tallU > 0) {
        for (var s = 0; s < 2; s++) {
          var u = clamp(tallU * 2 - s, 0, 1);
          if (u <= 0) continue;
          Gm += L(pts[s][0], pts[s][1], lerp(pts[s][0], pts[s + 1][0], u), lerp(pts[s][1], pts[s + 1][1], u),
            FC_FORCE, 4, { "stroke-dasharray": "11 8" });
        }
        Gm += C(pts[0][0], pts[0][1], 6, FC_FORCE, null, null, { opacity: tallU });
        Gm += C(pts[1][0], pts[1][1], 6, FC_FORCE, null, null, { opacity: clamp(tallU * 2 - 1, 0, 1) });
        Gm += C(pts[2][0], pts[2][1], 6, FC_FORCE, null, null, { opacity: clamp(tallU * 2 - 1.8, 0, 1) });
      }
      /* the pattern, named */
      var inc = on(t, cInc, 0.5);
      if (inc > 0) {
        Gm += MK.arrow(FC_COL[2], fcColTop(9), lerp(FC_COL[2], FC_GHOST, inc), lerp(fcColTop(9), fcColTop(12), inc),
          1, FC_FORCE, 5 * (1 + 0.3 * (bump(t, cPush, 1.1) + bump(t, cRoll, 1.1))));
        Gm += MK.pill(742, 132, "increasing", inc, { size: 28, col: FC_FORCE });
      }
      /* "an even harder push": one more column, taller still */
      var gh = on(t, cHarder, 0.6);
      if (gh > 0) {
        var top = lerp(FC_BASE, fcColTop(12), ease(clamp((t - cHarder - 0.15) / 0.9, 0, 1)));
        Gm += R(FC_GHOST - FC_BW / 2, top, FC_BW, FC_BASE - top, 5, "none", FC_FORCE, 3, { "stroke-dasharray": "9 7", opacity: gh });
        Gm += MK.pic(FC_GHOST, 396, 32, "\u{1F4A5}");
        Gm += Tx(FC_GHOST, 428, "harder", "lab mid gold", "middle", { opacity: gh });
        Gm += C(FC_GHOST, fcColTop(12), 7, FC_FORCE, null, null, { opacity: on(t, cTall2, 0.5) });
      }
      out += G(Gm, { opacity: go });
    }
    return svg(out);
  }
