  /* ==== Grade 1 Mathematics, Shapes and Sizes ================================
     tools/lib/film-scenes/math-g1/shapes-and-sizes.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-1-app/g1v2/lecture-video/shapes-and-sizes.json.

     Mathematics has no lesson kit, so the drawings come from ART
     (tools/lib/ehel-film-art-math.js): ART.shape2d for the flat shapes,
     ART.solid for the cube, sphere, cylinder and cone, ART.balance for the
     melon and the strawberry. The ribbons and the jugs are drawn here,
     because ART has no ribbon and ART.jug always draws a numbered scale,
     which Stage 1 capacity (full, empty, more, less) must not show.

     This file: the palette, the geometry that lets a cue point INTO an
     ART.shape2d card, the small drawings the film shares, the title motif and
     the chapter "Flat shapes". Every top-level name here starts with ss, so
     nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, flat: P.teal, solid: P.blue, sort: P.plum,
    length: P.gold, mass: P.accent, capacity: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ssOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ssFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- reaching inside an ART.shape2d card ------------------------------------
     ART.shape2d draws a 276-wide card with the shape centred on (138, 132) and
     the corner list below, which is the library's own (ehel-film-art-math.page.js
     :: SHAPES). A cue that has to point at ONE side or ONE corner needs those
     points in the film's own space, so the card is placed with a known box and
     every point is mapped through it. The counts here are therefore the same
     counts the library draws: four points for a square, three for a triangle. */
  var SS_CARD = 276, SS_CX = 138, SS_CY = 132, SS_CH = 254;   /* the card with no caption */
  var SS_PTS = {
    square: [[-84, -84], [84, -84], [84, 84], [-84, 84]],
    rectangle: [[-104, -64], [104, -64], [104, 64], [-104, 64]],
    triangle: [[0, -92], [92, 76], [-92, 76]]
  };
  var SS_RADIUS = 94;                    /* the circle ART.shape2d draws */

  function ssBox(x, y, w) { return { x: x, y: y, w: w, s: w / SS_CARD, h: w * SS_CH / SS_CARD }; }
  function ssPlace(markup, box) { return ART.place(markup, box.x, box.y, box.w, box.h); }
  function ssFX(box, dx) { return box.x + (SS_CX + dx) * box.s; }
  function ssFY(box, dy) { return box.y + (SS_CY + dy) * box.s; }
  /* the shape's corners, in the film's space and in the library's own order */
  function ssCorners(kind, box) {
    var pts = SS_PTS[kind], out = [], i;
    for (i = 0; i < pts.length; i++) out.push([ssFX(box, pts[i][0]), ssFY(box, pts[i][1])]);
    return out;
  }
  /* the middle of each side, pushed a little outside the shape, as the library
     pushes its own numbered discs */
  function ssSideMids(kind, box, push) {
    var pts = SS_PTS[kind], out = [], i, j, mx, my, ln;
    push = push == null ? 22 : push;
    for (i = 0; i < pts.length; i++) {
      j = (i + 1) % pts.length;
      mx = (pts[i][0] + pts[j][0]) / 2; my = (pts[i][1] + pts[j][1]) / 2;
      ln = Math.hypot(mx, my) || 1;
      out.push([ssFX(box, mx + (mx / ln) * push), ssFY(box, my + (my / ln) * push)]);
    }
    return out;
  }

  /* ---- small drawings the film shares ------------------------------------------ */

  /* a numbered disc, the library's own counting mark, popped in */
  function ssCount(x, y, n, p, col) {
    if (!(p > 0)) return "";
    col = col || P.gold;
    return MK.pop(C(x, y, 22, P.card, col, 3) + Tx(x, y + 10, String(n), "lab big", "middle", { fill: col }), x, y, p);
  }
  /* a corner dot, the library's plum */
  function ssDot(x, y, p) {
    if (!(p > 0)) return "";
    return MK.pop(C(x, y, 13, P.plum, P.ground, 3), x, y, p);
  }

  /* the first `u` of a closed run of points, drawn as one line, with the pencil
     at its head: the square being drawn on the page */
  function ssTrace(pts, u, col, w, pencil) {
    if (!(u > 0)) return "";
    var loop = pts.concat([pts[0]]), total = 0, k;
    for (k = 1; k < loop.length; k++) total += Math.hypot(loop[k][0] - loop[k - 1][0], loop[k][1] - loop[k - 1][1]);
    var want = total * clamp(u, 0, 1), d = "M" + n2(loop[0][0]) + "," + n2(loop[0][1]), hx = loop[0][0], hy = loop[0][1];
    for (k = 1; k < loop.length; k++) {
      var seg = Math.hypot(loop[k][0] - loop[k - 1][0], loop[k][1] - loop[k - 1][1]);
      if (want >= seg) { d += " L" + n2(loop[k][0]) + "," + n2(loop[k][1]); hx = loop[k][0]; hy = loop[k][1]; want -= seg; }
      else {
        var f = seg ? want / seg : 0;
        hx = lerp(loop[k - 1][0], loop[k][0], f); hy = lerp(loop[k - 1][1], loop[k][1], f);
        d += " L" + n2(hx) + "," + n2(hy);
        want = 0; break;
      }
    }
    return Pth(d, null, col, w || 7) + (pencil && u < 1 ? Em(hx + 14, hy - 14, 46, "✏️") : "");
  }

  /* a ribbon: the lesson's own rounded bar (its ribbon(len, col), step 9) */
  function ssRibbon(x, y, len, h, col, o) {
    if (!(o > 0)) return "";
    return R(x, y - h / 2, len, h, h / 2, col, null, null, { opacity: clamp(o, 0, 1) });
  }

  /* a plain jug, the lesson's own (its jug(fill), step 11), `fill` of it full.
     No numbered scale: Stage 1 capacity is full, empty, more and less. */
  function ssJug(cx, cy, w, fillFrac, o) {
    if (!(o > 0)) return "";
    var s = w / 90, h = 140 * s, x0 = cx - w / 2, y0 = cy - h / 2;
    function X(v) { return x0 + v * s; }
    function Y(v) { return y0 + v * s; }
    var top = 28 + (1 - clamp(fillFrac, 0, 1)) * 100, out = "";
    out += Pth("M" + n2(X(16)) + "," + n2(Y(24)) + " L" + n2(X(16)) + "," + n2(Y(128)) +
      " A" + n2(8 * s) + "," + n2(8 * s) + " 0 0 0 " + n2(X(24)) + "," + n2(Y(136)) +
      " L" + n2(X(66)) + "," + n2(Y(136)) +
      " A" + n2(8 * s) + "," + n2(8 * s) + " 0 0 0 " + n2(X(74)) + "," + n2(Y(128)) +
      " L" + n2(X(74)) + "," + n2(Y(24)) + " Z", P.cell);
    if (fillFrac > 0) {
      out += Pth("M" + n2(X(16)) + "," + n2(Y(top)) + " L" + n2(X(16)) + "," + n2(Y(128)) +
        " A" + n2(8 * s) + "," + n2(8 * s) + " 0 0 0 " + n2(X(24)) + "," + n2(Y(136)) +
        " L" + n2(X(66)) + "," + n2(Y(136)) +
        " A" + n2(8 * s) + "," + n2(8 * s) + " 0 0 0 " + n2(X(74)) + "," + n2(Y(128)) +
        " L" + n2(X(74)) + "," + n2(Y(top)) + " Z", "#3FA9A2");
    }
    out += Pth("M" + n2(X(16)) + "," + n2(Y(24)) + " L" + n2(X(16)) + "," + n2(Y(128)) +
      " A" + n2(8 * s) + "," + n2(8 * s) + " 0 0 0 " + n2(X(24)) + "," + n2(Y(136)) +
      " L" + n2(X(66)) + "," + n2(Y(136)) +
      " A" + n2(8 * s) + "," + n2(8 * s) + " 0 0 0 " + n2(X(74)) + "," + n2(Y(128)) +
      " L" + n2(X(74)) + "," + n2(Y(24)), null, P.edge, 5 * s);
    out += L(X(11), Y(24), X(79), Y(24), P.edge, 5 * s);
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* where the water sits in that jug, in the film's space */
  function ssJugLevel(cy, w, fillFrac) {
    var s = w / 90, h = 140 * s;
    return cy - h / 2 + (28 + (1 - clamp(fillFrac, 0, 1)) * 100) * s;
  }

  /* two flat faces meeting along one edge, which is what an edge IS: the
     shared line is drawn in the accent the solids mark their edges with */
  function ssFacesMeet(cx, cy, w, o) {
    if (!(o > 0)) return "";
    var a = w / 2, b = w * 0.24, out = "";
    out += Pth("M" + n2(cx - a) + "," + n2(cy - b * 0.5) + " L" + n2(cx) + "," + n2(cy - b) +
      " L" + n2(cx) + "," + n2(cy + b) + " L" + n2(cx - a) + "," + n2(cy + b * 1.5) + " Z", P.tealSoft, P.teal, 3);
    out += Pth("M" + n2(cx) + "," + n2(cy - b) + " L" + n2(cx + a) + "," + n2(cy - b * 0.5) +
      " L" + n2(cx + a) + "," + n2(cy + b * 1.5) + " L" + n2(cx) + "," + n2(cy + b) + " Z", P.tealSoft, P.teal, 3);
    out += L(cx, cy - b, cx, cy + b, P.accent, 6);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a leader line to the thing it names. The line starts
     at the pill's own edge, on the side the thing is, so it never runs under
     the word. */
  function ssLabel(t, x, y, text, at, to, col, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    col = col || P.gold;
    size = size || 26;
    var half = (String(text).length * size * 0.56 + size * 1.3) / 2 + 6;
    var sx = to[0] < x ? x - half : x + half;
    return MK.leader(sx, y, to[0], to[1], on(t, at, 0.7), col) +
      MK.pill(x, y, text, o, { size: size, col: col });
  }

  /* ==== the title motif ==========================================================
     The whole lesson in one round window: a flat square and a solid cube above,
     and the three things it compares below - a ribbon, a balance and a jug. In
     the spoken title chapter each lights as it is named; on the two cards they
     all simply stand. */
  function ssMotifJug(o) { return ssJug(278, 252, 48, 0.62, o); }
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene, out = "";
    var cFlat = sc0 ? sc(sc0, 0, "flat") : null, cSolid = sc0 ? sc(sc0, 0, "solid") : null;
    var cLong = sc0 ? sc(sc0, 1, "longer") : null, cHeavy = sc0 ? sc(sc0, 1, "heavier") : null,
      cMore = sc0 ? sc(sc0, 1, "more") : null, cAround = sc0 ? sc(sc0, 0, "around") : null,
      cCompare = sc0 ? sc(sc0, 1, "compare") : null;
    /* with no chapter - the title and end cards - everything is simply there */
    var a = sc0 ? popIn(t, cFlat, 0.4) : 1, b = sc0 ? popIn(t, cSolid, 0.4) : 1;
    var c1 = sc0 ? popIn(t, cLong, 0.35) : 1, c2 = sc0 ? popIn(t, cHeavy, 0.35) : 1,
      c3 = sc0 ? popIn(t, cMore, 0.35) : 1;
    out += el("clipPath", { id: "ssMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 170, P.teal, sc0 ? on(t, cAround, 0.8) * (0.6 + 0.4 * breathe(t)) : 0.55);
    out += G(
      MK.pop(ART.place(ART.shape2d("square", { colour: "teal" }), 66, 62, 108, 99.4), 120, 112, a) +
      MK.pop(ART.place(ART.solid("cube"), 190, 58, 108, 108), 244, 112, b) +
      L(58, 208, lerp(58, 302, sc0 ? on(t, cCompare, 0.7) : 1), 208, P.muted, 4, { "stroke-dasharray": "14 10" }) +
      ssRibbon(46, 246, 110, 20, P.gold, Math.min(1, c1)) +
      MK.pop(Em(196, 252, 60, "⚖️"), 196, 252, c2) +
      ssMotifJug(Math.min(1, c3)),
      { "clip-path": "url(#ssMotifClip)" });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A flat square, a solid cube, a ribbon, a balance and a jug">' + out + "</svg>";
  }

  /* ==== chapter: flat shapes =====================================================
     One ART.shape2d card in the middle of the stage, and the cues point INTO
     it: the square is traced as it is drawn, then its four sides are counted
     one at a time at their own middles, then its four corners at their own
     points, then the triangle's three of each, then the circle, whose edge a
     dot runs right round and which has no corner to mark. */
  var SS_FLAT_BOX = ssBox(374, 34, 400);
  /* which shape each beat of the chapter shows */
  var SS_FLAT_SHAPE = ["square", "square", "square", "square", "triangle", "circle"];

  function ssFlatCard(kind) {
    return ssPlace(ART.shape2d(kind, { colour: "teal" }), SS_FLAT_BOX);
  }

  function ssFlatChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var box = SS_FLAT_BOX, out = "";
    var cDraw = c(0, "draw"), cFlatW = c(0, "flat");
    var sq = ssCorners("square", box), sqMid = ssSideMids("square", box);
    var tr3 = ssCorners("triangle", box), trMid = ssSideMids("triangle", box);

    /* the card itself: square for the first four beats, then triangle, then circle */
    out += crossfade(t, i, scene, function (n) {
      return ssFlatCard(SS_FLAT_SHAPE[clamp(n - scene.first, 0, SS_FLAT_SHAPE.length - 1)]);
    });

    /* beat 0: "A flat shape lies on the page. You could draw it yourself." */
    var b0 = ssOnly(t, scene, 0);
    if (b0 > 0) {
      out += G(ssTrace(sq, on(t, cDraw, 1.5), P.gold, 7, true), { opacity: b0 });
      out += G(MK.pill(180, 210, "flat", on(t, cFlatW, 0.4), { size: 34, col: P.teal }), { opacity: b0 });
    }

    /* beat 1: the four sides, counted at their middles */
    var b1 = ssFrom(t, scene, 1) * (1 - ssFrom(t, scene, 4));
    if (b1 > 0) {
      var sideCue = [c(1, "one"), c(1, "two"), c(1, "three"), c(1, "four")];
      var g = "";
      for (var s1 = 0; s1 < 4; s1++) {
        var p1 = popIn(t, sideCue[s1], 0.35);
        g += ssCount(sqMid[s1][0], sqMid[s1][1], s1 + 1, p1);
        if (p1 > 0) g += L(sq[s1][0], sq[s1][1], sq[(s1 + 1) % 4][0], sq[(s1 + 1) % 4][1], P.gold, 6,
          { opacity: 0.85 * Math.min(1, p1) });
      }
      g += MK.pill(184, 150, "side", on(t, c(1, "square"), 0.4), { size: 32, col: P.gold });
      g += MK.pill(962, 140, "4 sides", on(t, c(2, "sides"), 0.4), { size: 36, col: P.gold });
      out += G(g, { opacity: b1 });
    }

    /* beats 2 and 3: the corners, one at a time */
    var b2 = ssFrom(t, scene, 2) * (1 - ssFrom(t, scene, 4));
    if (b2 > 0) {
      var g2 = "", cMeet = c(2, "meet"), cCorn = c(2, "corners");
      /* "where two sides meet": the two sides at the top-right corner light up */
      var m = bump(t, cMeet, 1.4);
      if (m > 0) {
        g2 += L(sq[0][0], sq[0][1], sq[1][0], sq[1][1], P.plum, 9, { opacity: m });
        g2 += L(sq[1][0], sq[1][1], sq[2][0], sq[2][1], P.plum, 9, { opacity: m });
      }
      g2 += ssLabel(t, 962, 268, "corner", cCorn, [sq[1][0], sq[1][1]], P.plum, 30);
      var cornCue = [c(3, "one"), c(3, "two"), c(3, "three"), c(3, "four")];
      for (var s2 = 0; s2 < 4; s2++) g2 += ssDot(sq[s2][0], sq[s2][1], popIn(t, cornCue[s2], 0.35));
      g2 += MK.pill(962, 348, "4 corners", on(t, c(3, "all"), 0.4), { size: 36, col: P.plum });
      out += G(g2, { opacity: b2 });
    }

    /* beat 4: the triangle, three sides and three corners */
    var b4 = ssOnly(t, scene, 4);
    if (b4 > 0) {
      var g4 = "", tSide = on(t, c(4, "sides"), 0.5), tCorn = on(t, c(4, "corners"), 0.5);
      for (var s4 = 0; s4 < 3; s4++) {
        g4 += ssCount(trMid[s4][0], trMid[s4][1], s4 + 1, popIn(t, c(4, "sides") == null ? null : c(4, "sides") + s4 * 0.22, 0.35));
        g4 += ssDot(tr3[s4][0], tr3[s4][1], popIn(t, c(4, "corners") == null ? null : c(4, "corners") + s4 * 0.22, 0.35));
      }
      g4 += MK.pill(962, 150, "3 sides", tSide, { size: 36, col: P.gold });
      g4 += MK.pill(962, 250, "3 corners", tCorn, { size: 36, col: P.plum });
      g4 += MK.pill(184, 200, "triangle", on(t, c(4, "triangle"), 0.4), { size: 32, col: P.teal });
      out += G(g4, { opacity: b4 });
    }

    /* beat 5: the circle - a dot runs right round its edge, and no corner to mark */
    var b5 = ssOnly(t, scene, 5);
    if (b5 > 0) {
      var g5 = "", cCurve = c(5, "curves"), cNone = c(5, "none");
      var cx5 = ssFX(box, 0), cy5 = ssFY(box, 0), r5 = SS_RADIUS * box.s;
      var u5 = on(t, cCurve, 1.6);
      if (u5 > 0) {
        var a5 = -Math.PI / 2 + u5 * 2 * Math.PI;
        var big = u5 > 0.5 ? 1 : 0;
        g5 += Pth("M" + n2(cx5) + "," + n2(cy5 - r5) + " A" + n2(r5) + "," + n2(r5) + " 0 " + big + " 1 " +
          n2(cx5 + r5 * Math.cos(a5)) + "," + n2(cy5 + r5 * Math.sin(a5)), null, P.gold, 8);
        g5 += C(cx5 + r5 * Math.cos(a5), cy5 + r5 * Math.sin(a5), 11, P.gold);
      }
      g5 += MK.pill(184, 200, "circle", on(t, c(5, "circle"), 0.4), { size: 32, col: P.teal });
      g5 += MK.pill(962, 160, "curved edge", u5 > 0 ? on(t, cCurve, 0.5) : 0, { size: 32, col: P.gold });
      var no5 = popIn(t, cNone, 0.4);
      g5 += MK.cross(962, 268, 30, no5);
      g5 += MK.pill(962, 344, "no corners", Math.min(1, no5), { size: 32, col: P.plum });
      out += G(g5, { opacity: b5 });
    }

    return svg(out);
  }
