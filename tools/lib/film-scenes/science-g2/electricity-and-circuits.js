  /* ==== Grade 2 Science, Lesson 8: Electricity and Circuits ====================
     tools/lib/film-scenes/science-g2/electricity-and-circuits.js, with -2.js,
     -3.js, -4.js and -5.js: the film's pictures, after the shared marks (MK)
     and before the engine's tail, all in one scope. The storyboard is
     science/grade-2-app/lecture-video/electricity-and-circuits.json.

     The circuit is the lesson's own: ART.kit.circuitSvg, the drawing the build
     step builds part by part and the drawing the label step asks the child to
     tap. Everything here draws it again for each frame with the state that
     frame needs - the cell, then a wire, then the lamp, then the second wire;
     then a gap in the loop; then mended - so what the child watches in the
     film is what they build two steps later.

     This file: the palette, the timing helpers, the circuit's placement and
     the loop that runs round it, the labels and the title motif. Every
     top-level name starts with ec, so nothing here can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, uses: P.gold, safe: P.accent, parts: P.blue,
    gap: P.plum, diagram: P.good, "switch": P.gold, recap: P.teal
  };

  /* ---- timing --------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ecOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ecFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has the cue been reached? */
  function ecAt(t, c) { return c != null && t >= c; }

  /* ---- the lesson's circuit, and the loop round it ---------------------------
     ART.kit.circuitSvg draws in a 320 x 220 space. ecMap(x, y, s) is that space
     put down in the film's 1168 x 440 one, and m.x/m.y carry a point across, so
     a mark of the film's own lands exactly on the lesson's own drawing. */
  function ecMap(x, y, s) {
    return { x: function (v) { return x + v * s; }, y: function (v) { return y + v * s; }, s: s, ox: x, oy: y };
  }
  function ecPlaceCircuit(state, m) {
    return ART.place(ART.kit.circuitSvg(state), m.ox, m.oy, 320 * m.s, 220 * m.s);
  }

  /* The loop, in the drawing's own coordinates: out of the cell at (60, 110),
     up, along the top wire, down the right side through the lamp at (260, 110),
     back along the bottom wire and up to the cell. 600 units round. */
  var EC_LOOP = [[60, 110], [60, 60], [260, 60], [260, 160], [60, 160], [60, 110]];
  var EC_CELL = [60, 110], EC_LAMP = [260, 110];
  function ecLoopPts(m) {
    return EC_LOOP.map(function (p) { return [m.x(p[0]), m.y(p[1])]; });
  }
  function ecLoopD(m) {
    var pts = ecLoopPts(m), d = "M" + n2(pts[0][0]) + "," + n2(pts[0][1]);
    for (var k = 1; k < pts.length; k++) d += " L" + n2(pts[k][0]) + "," + n2(pts[k][1]);
    return d;
  }
  /* The loop drawn in, u of the way round. The default is WHITE, not gold: the
     lesson draws its wires gold, so a gold line round them is invisible - which
     is what the first cut of "round a loop" and "close the loop" did. */
  var EC_TRACE = P.ink;
  function ecLoopTrace(m, u, col, w) {
    if (!(u > 0)) return "";
    var len = polyLen(ecLoopPts(m));
    return Pth(ecLoopD(m), null, col || EC_TRACE, w || 4,
      { "stroke-dasharray": n2(len * clamp(u, 0, 1)) + " " + n2(len + 4), opacity: 0.95, "stroke-linecap": "butt" });
  }
  /* a bright bead of electricity u of the way round, with a short tail behind it */
  function ecBead(m, u, col, r, o) {
    if (!(o > 0) || !(u >= 0)) return "";
    var pts = ecLoopPts(m), len = polyLen(pts), out = "";
    for (var k = 4; k >= 0; k--) {
      var uu = u - k * 0.02;
      if (uu < 0) continue;
      var p = polyAt(pts, clamp(uu, 0, 1) * len);
      out += C(p[0], p[1], (r || 9) * (1 - k * 0.14), col || P.gold, null, null,
        { opacity: (1 - k * 0.17) * clamp(o, 0, 1) });
    }
    return out;
  }
  /* n beads going round for ever, one lap every `period` seconds */
  function ecFlowRing(m, t, at, n, period, col, r, o) {
    if (at == null || t < at || !(o > 0)) return "";
    var out = "", start = clamp((t - at) / 0.4, 0, 1);
    for (var k = 0; k < n; k++) out += ecBead(m, ((t - at) / period + k / n) % 1, col, r, o * start);
    return out;
  }
  /* a bead that leaves the cell, runs as far as stopU and waits there: the gap */
  function ecFlowBlocked(m, t, at, stopU, col, r, o) {
    if (at == null || t < at || !(o > 0)) return "";
    var ph = ((t - at) / 1.8) % 1;
    return ecBead(m, Math.min(stopU, ph * stopU / 0.68), col, r, o);
  }

  /* ---- labels ---------------------------------------------------------------
     A word of the lesson's in a pill, with a leader line from the pill's near
     edge to the thing it names. The word being said now is gold; a word said
     before keeps its line, quieter. */
  function ecPillHalf(text, size) { return (String(text).length * size * 0.56 + size * 1.3) / 2; }
  function ecLabel(t, cx, cy, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    size = size || 26;
    var hw = ecPillHalf(text, size), ex = to[0] > cx ? cx + hw + 4 : cx - hw - 4;
    return MK.leader(ex, cy, to[0], to[1], on(t, at, 0.6), now ? P.gold : P.muted) +
      MK.pill(cx, cy, text, o, { size: size, col: now ? P.gold : P.line });
  }

  /* ---- a card: one of the lesson's light drawings needs room round it -------- */
  function ecCard(x, y, w, h, o, col, lit) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, P.card, col || P.line, lit ? 3 : 2, { opacity: clamp(o, 0, 1) });
  }
  /* a card's caption, centred under whatever stands in it */
  function ecCap(cx, y, text, o, cls) {
    if (!(o > 0)) return "";
    return Tx(cx, y, text, cls || "lab big", "middle", { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif ========================================================
     The lesson's own lit circuit in a round window, with the electricity
     running round the loop. In the spoken title chapter the lamp lights on
     "lights a lamp", the beads start on "flow all the way", the loop draws
     itself on "round a loop", the three parts ripple on "build one" and the
     lamp flares on "make a lamp light". On the two cards it simply runs. */
  var EC_MOTIF = ecMap(20, 70, 1);
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene || null;
    var cLamp = sn ? sc(sn, 0, "lamp") : null, cFlow = sn ? sc(sn, 0, "flow") : null,
      cLoop = sn ? sc(sn, 0, "loop") : null, cCirc = sn ? sc(sn, 1, "circuit") : null,
      cBuild = sn ? sc(sn, 1, "build") : null, cLight = sn ? sc(sn, 1, "light") : null;
    var m = EC_MOTIF, lit = sn ? ecAt(t, cLamp) : true;
    var inner = ecPlaceCircuit({ cell: true, lamp: true, wireTop: true, wireBottom: true, on: lit }, m);
    inner += MK.glow(m.x(EC_LAMP[0]), m.y(EC_LAMP[1]), 80, P.gold,
      (lit ? 0.5 + 0.4 * breathe(t) : 0) + 0.6 * bump(t, cLight, 1.2));
    var traceU = sn ? Math.max(on(t, cLoop, 0.9), ecAt(t, cCirc) ? 1 : 0) : 0;
    inner += ecLoopTrace(m, traceU, null, 4 + 3 * on(t, cCirc, 0.45) * breathe(t));
    inner += ecFlowRing(m, t, sn ? cFlow : 0, 4, 2.8, P.gold, 8, 1);
    if (cBuild != null) {
      inner += MK.ripple(m.x(EC_CELL[0]), m.y(EC_CELL[1]), t, cBuild, P.gold);
      inner += MK.ripple(m.x(160), m.y(60), t, cBuild + 0.26, P.gold);
      inner += MK.ripple(m.x(EC_LAMP[0]), m.y(EC_LAMP[1]), t, cBuild + 0.52, P.gold);
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A circuit: a cell, two wires and a lit lamp">' +
      el("clipPath", { id: "ecMotifClip" }, C(180, 180, 172)) +
      C(180, 180, 172, P.night) +
      G(inner, { "clip-path": "url(#ecMotifClip)" }) +
      C(180, 180, 172, "none", P.line, 3) + "</svg>";
  }
