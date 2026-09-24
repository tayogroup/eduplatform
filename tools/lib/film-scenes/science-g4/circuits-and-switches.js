  /* ==== Grade 4 Science, Lesson 10: Circuits and Switches =====================
     tools/lib/film-scenes/science-g4/circuits-and-switches.js, with -2.js,
     -3.js and -4.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/circuits-and-switches.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later:
       ART.kit.circuitSvg(state)   the circuit with its dashed ghosts and its
                                   own "a gap" - the loop chapter
       ART.kit.seriesSvg(s)        the seriesCircuit sim the lesson runs:
                                   cells, lamps and the switch - the switch
                                   and brightness chapters
       ART.sim("conductor","init") the circuit with a gap a material goes in -
                                   the conductors chapter
     and the lesson's own icons for the eight test materials.

     This file: the palette, the shared small drawings, the title motif and
     the chapter "One loop". Every top-level name here starts with cs, so
     nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, loop: P.gold, "switch": P.blue, bright: P.accent,
    materials: P.good, safe: P.bad, today: P.plum, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function csOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function csFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 as the chapter's beats k..end come in: everything before k is past */
  function csUpto(t, scene, k) { return 1 - csFrom(t, scene, k); }

  /* ---- a box that holds one of the lesson's drawings --------------------------
     X and Y map a point of the drawing's own viewBox into the film's
     1168 x 440 space, so a mark can land exactly on a wire or a lamp. */
  function csBox(x, y, w, vbw, vbh) {
    var k = w / vbw;
    return { x: x, y: y, w: w, h: vbh * k, k: k,
      X: function (u) { return x + u * k; },
      Y: function (v) { return y + v * k; },
      at: function (u, v) { return [x + u * k, y + v * k]; } };
  }
  function csCard(b, pad) {
    pad = pad == null ? 12 : pad;
    return R(b.x - pad, b.y - pad, b.w + 2 * pad, b.h + 2 * pad, 18, P.card, P.line, 2);
  }

  /* ---- a loop, traced and travelled ------------------------------------------
     pts is a polyline in film coordinates. csTrace draws the first u of it;
     csOn gives the point u of the way round. Both are pure. */
  function csTrace(pts, u, col, w, extra) {
    if (!(u > 0)) return "";
    var s = polyLen(pts) * clamp(u, 0, 1), acc = 0;
    var d = "M" + n2(pts[0][0]) + "," + n2(pts[0][1]);
    for (var k = 1; k < pts.length; k++) {
      var seg = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (acc + seg <= s) { d += " L" + n2(pts[k][0]) + "," + n2(pts[k][1]); acc += seg; }
      else { var q = polyAt(pts, s); d += " L" + n2(q[0]) + "," + n2(q[1]); break; }
    }
    return Pth(d, null, col || P.gold, w == null ? 6 : w, extra);
  }
  function csOnLoop(pts, u) {
    var L0 = polyLen(pts), s = ((u % 1) + 1) % 1 * L0;
    return polyAt(pts, s);
  }
  /* one bright piece of electricity, centred on (x, y) */
  function csSpark(x, y, r, o) {
    if (!(o > 0)) return "";
    o = clamp(o, 0, 1);
    return C(x, y, r * 2.2, P.gold, null, null, { opacity: 0.2 * o }) +
      C(x, y, r, "#FFF3B0", null, null, { opacity: o });
  }
  /* n sparks running round pts, spaced evenly, from `at`; speed in loops/second.
     stop cuts them off at that point of the loop (a break). */
  function csFlow(t, pts, at, o, opt) {
    if (at == null || !(o > 0)) return "";
    opt = opt || {};
    var n = opt.n || 6, speed = opt.speed || 0.26, r = opt.r || 7, out = "";
    for (var k = 0; k < n; k++) {
      var u = ((t - at) * speed + k / n) % 1;
      if (opt.stop != null && u > opt.stop) continue;
      var p = csOnLoop(pts, u);
      out += csSpark(p[0], p[1], r, o);
    }
    return out;
  }

  /* ---- the lesson's circuit, with parts appearing as they are named -----------
     circuitSvg draws a missing part as a dashed ghost, so the loop is whole on
     screen from the first frame and fills in. ring() is the lesson's own tap
     outline, so only the part being named wears one (rule 3). */
  function csCircuit(state, ringPart, ringOp) {
    var m = ART.kit.circuitSvg(state);
    if (ringPart && ringOp > 0)
      m = ART.ring(m, ringPart, "rgba(244,201,93," + n2(clamp(ringOp, 0, 1)) + ")", 6);
    return m;
  }

  /* ==== the title motif =========================================================
     A loop with a cell, a switch and a lit lamp, in a round window. In the
     spoken title chapter the loop traces itself on "round a loop", the switch
     opens on "Break the loop" and the lamp goes dark, the cell pushes sparks
     round on "pushes it round", and the switch is ringed on "A switch". On the
     two cards it simply stands, closed and lit. */
  var CS_MOTIF = [[92, 250], [92, 104], [268, 104], [268, 250], [92, 250]];
  /* two contacts and a lever, drawn as the lesson's seriesSvg draws its own.
     `open` is true/false, or a number 0 to 1 for a lever caught mid-swing. */
  function csMotifSwitch(cx, cy, open, op) {
    var u = open === true ? 1 : open === false || open == null ? 0 : clamp(open, 0, 1);
    return G(R(cx - 15, cy - 27, 30, 54, 6, "#123247") +
      L(cx, cy - 20, cx + 24 * u, cy + 20 - 14 * u, P.gold, 6) +
      C(cx, cy - 20, 5, P.gold, "#0E2434", 1.5) + C(cx, cy + 20, 5, P.gold, "#0E2434", 1.5),
      { opacity: op == null ? 1 : op });
  }
  function csMotifCell(cx, cy, op) {
    return G(R(cx - 4, cy - 22, 8, 44, 2, P.gold) + R(cx + 10, cy - 12, 8, 24, 2, P.gold),
      { opacity: op == null ? 1 : op });
  }
  function csMotifLamp(cx, cy, lit, t) {
    var out = lit ? C(cx, cy, 44, "#FFF3B0", null, null, { opacity: 0.22 + 0.08 * breathe(t || 0) }) : "";
    return out + C(cx, cy, 26, lit ? P.gold : "#1B3A52", P.gold, 5) +
      Pth("M" + (cx - 15) + "," + (cy - 15) + " L" + (cx + 15) + "," + (cy + 15) +
        " M" + (cx + 15) + "," + (cy - 15) + " L" + (cx - 15) + "," + (cy + 15), null, lit ? "#0E2434" : P.gold, 4);
  }
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cLoop = sn ? sc(sn, 0, "loop") : null, cBreak = sn ? sc(sn, 0, "break") : null,
      cStops = sn ? sc(sn, 0, "stops") : null, cCell = sn ? sc(sn, 1, "cell") : null,
      cPush = sn ? sc(sn, 1, "push") : null, cSw = sn ? sc(sn, 1, "switch") : null;
    var broken = cBreak != null && t >= cBreak && (cSw == null || t < cSw);
    var lit = !broken;

    out += C(180, 180, 172, "#123247");
    /* the loop: whole, and traced gold as it is named */
    out += Pth("M92,250 L92,104 L268,104 L268,250 Z", null, "#2B5673", 8);
    out += csTrace(CS_MOTIF, sn ? on(t, cLoop, 0.9) : 1, P.gold, 8);
    /* the cell on the top wire, the lamp on the bottom, the switch on the right */
    out += csMotifCell(174, 104, 1);
    out += csMotifLamp(180, 250, lit, t);
    out += csMotifSwitch(268, 177, broken, 1);
    /* the cell pushing: sparks run round while "pushes it round" is said */
    if (sn && cPush != null) out += csFlow(t, CS_MOTIF, cPush, on(t, cPush, 0.4) * (cSw == null ? 1 : 1 - on(t, cSw, 0.4) * 0.4), { n: 5, speed: 0.3, r: 6 });
    /* the break: a red flash at the switch, then a cross */
    if (sn && broken) {
      out += C(268, 177, 34, "none", P.bad, 5, { opacity: 0.55 + 0.45 * breathe(t) });
      out += MK.cross(268, 177, 26, popIn(t, cStops, 0.35));
    }
    if (sn && cSw != null) out += C(268, 177, 34, "none", P.gold, 5, { opacity: on(t, cSw, 0.4) * (0.6 + 0.4 * breathe(t)) });
    if (sn && cCell != null) out += C(174, 104, 32, "none", P.gold, 5, { opacity: on(t, cCell, 0.35) * (1 - on(t, cPush, 0.8)) });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A circuit loop: a cell, a switch and a lamp">' + out + "</svg>";
  }

  /* ==== chapter: One loop ==========================================================
     The lesson's own circuit (ART.kit.circuitSvg) fills in part by part, the
     electricity runs round it, and then a wire comes loose and the lesson's
     own gap opens in the bottom wire. */
  var CS_LOOP = csBox(324, 34, 520, 320, 220);
  /* the loop, starting at the cell: up the left side, along the top, down past
     the lamp, along the bottom and back to the cell */
  var CS_LOOP_PTS = [CS_LOOP.at(60, 110), CS_LOOP.at(60, 60), CS_LOOP.at(260, 60),
    CS_LOOP.at(260, 110), CS_LOOP.at(260, 160), CS_LOOP.at(60, 160), CS_LOOP.at(60, 110)];
  var CS_LAMP_U = 0.5;     /* the lamp, half way round */
  var CS_GAP_U = 0.75;     /* the gap in the bottom wire, three quarters round */

  function csLoopChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCell = c(0, "cell"), cWires = c(0, "wires"), cLamp = c(0, "lamp"), cLoop = c(0, "loop");
    var cFrom = c(1, "from"), cTo = c(1, "to"), cBack = c(1, "back");
    var cComplete = c(2, "complete"), cFlows = c(2, "flows"), cLights = c(2, "lights");
    var cLoose = c(3, "loose"), cGap = c(3, "gap"), cBreak = c(3, "break");
    var cNothing = c(4, "nothing"), cOut = c(4, "out"), cAll = c(4, "all");

    var hasCell = cCell != null && t >= cCell, hasWires = cWires != null && t >= cWires,
      hasLamp = cLamp != null && t >= cLamp, gap = cLoose != null && t >= cLoose;
    var state = { cell: hasCell, lamp: hasLamp, wireTop: hasWires, wireBottom: hasWires,
      gap: gap, on: cLights != null && t >= cLights };

    /* the one part being named wears the lesson's own gold outline */
    var ringPart = null, ringOp = 0;
    var rings = [["cell", cCell], ["wire", cWires], ["lamp", cLamp]];
    rings.forEach(function (r) {
      if (r[1] == null || t < r[1]) return;
      var o = clamp(1 - (t - r[1]) / 1.3, 0, 1) * csOnly(t, scene, 0);
      if (o > ringOp) { ringOp = o; ringPart = r[0]; }
    });
    /* the lamp is ringed again as it lights, and once more as it goes out */
    var lampAgain = Math.max(bump(t, cLights, 1.4), bump(t, cOut, 1.4));
    if (lampAgain > ringOp) { ringOp = lampAgain; ringPart = "lamp"; }

    var out = csCard(CS_LOOP);
    out += ART.place(csCircuit(state, ringPart, ringOp), CS_LOOP.x, CS_LOOP.y, CS_LOOP.w, CS_LOOP.h);

    /* "one loop": the gold line runs all the way round the lesson's own wires */
    /* the bright core runs INSIDE the lesson's gold wires: a gold trace over
       gold wires is invisible, which is what the first cut drew */
    var traced = on(t, cLoop, 1.0) * csOnly(t, scene, 0);
    if (traced > 0) out += csTrace(CS_LOOP_PTS, traced, "#FFF3B0", 5, { opacity: 0.95, "stroke-linecap": "round" });

    /* "from the cell ... to the lamp ... and back to the cell": one piece of
       electricity makes the whole journey, and arrives before the line ends */
    if (csOnly(t, scene, 1) > 0.02 && cFrom != null) {
      var endB = spokenEnd(scene.first + 1), u;
      if (cTo != null && t < cTo) u = lerp(0, CS_LAMP_U, ease((t - cFrom) / Math.max(cTo - cFrom, 0.3)));
      else if (cBack != null && t < cBack) u = CS_LAMP_U;
      else u = lerp(CS_LAMP_U, 1, ease((t - (cBack == null ? cFrom : cBack)) / Math.max(endB - (cBack == null ? cFrom : cBack), 0.3)));
      var p = csOnLoop(CS_LOOP_PTS, clamp(u, 0, 0.999));
      out += csTrace(CS_LOOP_PTS, clamp(u, 0, 1), "#FFF3B0", 5, { opacity: 0.8 * csOnly(t, scene, 1) });
      out += csSpark(p[0], p[1], 11, csOnly(t, scene, 1));
    }

    /* "Electricity flows": sparks run round, and stop at the gap when it opens */
    var flowO = on(t, cFlows, 0.5) * (gap ? clamp(1 - (t - cLoose) / 0.5, 0, 1) : 1);
    out += csFlow(t, CS_LOOP_PTS, cFlows, flowO, { n: 7, speed: 0.24, r: 8 });
    /* "the lamp lights": the lesson's lamp is lit, with light pooling round it */
    var litO = on(t, cLights, 0.5) * (gap ? clamp(1 - (t - cLoose) / 0.4, 0, 1) : 1);
    if (litO > 0) out += MK.glow(CS_LOOP.X(260), CS_LOOP.Y(110), 96, P.gold, litO * (0.8 + 0.2 * breathe(t)));

    /* "comes loose ... That gap ... a break": the gap the lesson draws itself,
       ringed, then crossed */
    var gp = CS_LOOP.at(160, 160);
    if (gap) {
      out += MK.ripple(gp[0], gp[1], t, cLoose, P.bad);
      var ringGap = on(t, cGap, 0.4) * clamp(1 - (t - cGap) / 2.2, 0, 1);
      if (ringGap > 0) out += E(gp[0], gp[1], 54, 34, "none", P.gold, 5, { opacity: ringGap });
      out += MK.cross(gp[0], gp[1] - 62, 24, popIn(t, cBreak, 0.4));
    }
    /* "Nothing can flow": the sparks push up to the break and go no further */
    var stuckO = on(t, cNothing, 0.4) * csFrom(t, scene, 4);
    if (stuckO > 0) {
      out += csFlow(t, CS_LOOP_PTS, cNothing, stuckO * 0.9, { n: 7, speed: 0.22, r: 8, stop: CS_GAP_U - 0.015 });
      out += L(gp[0] + 6, gp[1] - 26, gp[0] + 6, gp[1] + 26, P.bad, 5, { opacity: stuckO });
    }

    /* the components, ticked off on the left as each one is named */
    out += Tx(40, 78, "Components", "lab big muted caps", "start", { opacity: csOnly(t, scene, 0) });
    out += G(MK.list(40, 132, [
      { text: "cell", at: cCell, mark: "tick" },
      { text: "two wires", at: cWires, mark: "tick" },
      { text: "lamp", at: cLamp, mark: "tick" }
    ], t, { lh: 62, cls: "lab big" }), { opacity: csOnly(t, scene, 0) });
    out += MK.pill(40, 330, "one loop", on(t, cLoop, 0.4) * csOnly(t, scene, 0), { size: 30, anchor: "start", col: P.gold });

    /* the state of the circuit, on the right: complete, then broken */
    var okO = popIn(t, cComplete, 0.4) * csUpto(t, scene, 3);
    var badO = popIn(t, cBreak, 0.4) * csFrom(t, scene, 3);
    out += MK.tick(1010, 178, 56, okO);
    out += MK.pill(1010, 272, "complete loop", Math.min(1, okO), { size: 24, col: P.good });
    out += MK.cross(1010, 178, 56, badO);
    out += MK.pill(1010, 272, "a break", Math.min(1, badO), { size: 24, col: P.bad });
    out += MK.pill(1010, 330, "everything stops", on(t, cAll, 0.4), { size: 22, col: P.bad });
    return svg(out);
  }
