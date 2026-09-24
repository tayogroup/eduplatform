  /* ==== Grade 2 Mathematics, How Much, How Long ===============================
     tools/lib/film-scenes/math-g2/how-much-how-long.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/how-much-how-long.json.

     Mathematics has no lesson kit, so the measuring hardware comes from ART
     (tools/lib/ehel-film-art-math.page.js): its ruler, its pan balance, its
     measuring jug and its number line, in the lessons' own light colours, so
     the child watches the same picture they tap two steps later.

     EVERY QUANTITY THE VOICE SAYS IS MEASURED OFF THE PICTURE, not judged by
     eye. The pencil is seven cubes long because seven cubes of HML.CUBE fill
     exactly the pencil's width; it is 8 cm long because ART.ruler is given
     item {from: 0, to: 8}; the ribbon is 35 cm because its right edge is
     hmlNX(35), the same map that puts the number line's own tick there.

     This file: the palette, the shared helpers, the title motif, and the
     chapters "Longer and shorter" and "Measure with cubes". Every top-level
     name starts with hml or HML, so nothing here can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, compare: P.blue, cubes: P.gold, ruler: P.accent,
    unit: P.plum, mass: P.good, marks: P.teal, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function hmlOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function hmlFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* two pictures in one chapter: the second takes over at beat k */
  function hmlSwap(t, scene, k, before, after) {
    var u = hmlFrom(t, scene, k);
    if (u >= 1) return after();
    if (u <= 0) return before();
    return G(before(), { opacity: 1 - u }) + G(after(), { opacity: u });
  }

  /* ---- small drawings this film shares ---------------------------------------- */

  /* A pencil-shaped bar: a rounded body from x, running w to the right, with a
     sharpened tip. The LENGTH of the whole thing is w, tip included, which is
     what every claim in this film measures. */
  function hmlStick(x, y, w, h, col, tipCol, o) {
    if (!(o > 0) || w <= 0) return "";
    var tw = Math.min(h * 0.95, w * 0.34);
    return G(R(x, y - h / 2, w - tw, h, h * 0.28, col) +
      Pth("M" + n2(x + w - tw) + "," + n2(y - h / 2) + " L" + n2(x + w) + "," + n2(y) +
        " L" + n2(x + w - tw) + "," + n2(y + h / 2) + " Z", tipCol || P.muted),
      { opacity: clamp(o, 0, 1) });
  }

  /* one unit cube of the lesson's snap cubes, its top-left at (x, y) */
  function hmlCube(x, y, s, col, o, flash) {
    if (!(o > 0)) return "";
    col = col || "#43B864";
    return G(R(x, y, s, s, s * 0.14, col, "#1B2A2F", 2.5) +
      R(x + s * 0.13, y + s * 0.11, s * 0.74, s * 0.17, s * 0.08, "#FFFFFF", null, null, { opacity: 0.4 }) +
      (flash > 0 ? R(x, y, s, s, s * 0.14, "#FFFFFF", null, null, { opacity: 0.5 * flash }) : ""),
      { opacity: clamp(o, 0, 1) });
  }

  /* a dashed dropper from (x, y1) down to (x, y2), drawing itself as u grows */
  function hmlDrop(x, y1, y2, u, col) {
    if (!(u > 0)) return "";
    return L(x, y1, x, lerp(y1, y2, clamp(u, 0, 1)), col || P.gold, 3, { "stroke-dasharray": "9 7", opacity: 0.95 });
  }

  /* a word in a pill with a leader line to the thing it names */
  function hmlTag(t, x, y, text, at, to, opt) {
    opt = opt || {};
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = opt.col || P.gold;
    return (to ? MK.leader(x, y + (opt.up ? -22 : 22), to[0], to[1], on(t, at, 0.6), col) : "") +
      MK.pill(x, y, text, o, { size: opt.size || 27, col: col, anchor: opt.anchor });
  }

  /* ==== the title motif ==========================================================
     What the lesson measures, in one window: the ruler with a pencil on it for
     length, a balance for mass and a jug for capacity.

     On the two silent cards it simply stands. In the SPOKEN title chapter it
     reads that chapter's cues, which is why they are declared: the three are
     dim until they are named, so the ruler lights on "are long", the balance
     on "are heavy" and the jug on "hold a lot"; the whole window warms on
     "Measuring" and all three are tapped in turn on "how much". */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene || null, out = "";
    function at(k, n) { return sn ? sc(sn, k, n) : null; }
    var cLong = at(0, "long"), cHeavy = at(0, "heavy"), cHold = at(0, "hold");
    var cMeas = at(1, "measure"), cMuch = at(1, "much");
    function lit(c) { return sn ? 0.28 + 0.72 * on(t, c, 0.45) : 1; }
    function grew(c) { return sn ? 0.92 + 0.08 * on(t, c, 0.45) : 1; }

    out += el("clipPath", { id: "hmlMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    if (sn) out += MK.glow(180, 180, 174, P.gold, on(t, cMeas, 0.6) * (0.5 + 0.5 * breathe(t)));
    out += G(MK.glow(180, 250, 150, P.teal, 0.8) +
      G(ART.place(ART.ruler({ length: 10, unit: "cm", item: { from: 0, to: 6, label: "6 cm" } }), 6, 172, 348, 133),
        { opacity: lit(cLong), transform: around(180, 238, grew(cLong)) }),
      { "clip-path": "url(#hmlMotifClip)" });
    out += G(Em(104, 96, 96, "⚖️"), { opacity: lit(cHeavy), transform: around(104, 96, grew(cHeavy)) });
    out += G(Em(256, 96, 92, "\u{1F964}"), { opacity: lit(cHold), transform: around(256, 96, grew(cHold)) });
    if (sn) out += MK.ripple(104, 96, t, cMuch, P.gold) +
      MK.ripple(256, 96, t, cMuch == null ? null : cMuch + 0.2, P.gold) +
      MK.ripple(180, 238, t, cMuch == null ? null : cMuch + 0.4, P.gold);
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A ruler with a pencil on it, a balance and a measuring jug">' +
      out + "</svg>";
  }

  /* ==== chapter: longer and shorter ==============================================
     The lesson's own first step: two things that start in the same place, and
     the only question is where each one ends. The pencil bar is 650 wide and
     the crayon 450, both from x = 250, so "the pencil is longer" is measured
     rather than asserted. Beat 5 swaps to the misconception the lesson names:
     a fat short thing beside a thin long one. */
  var HML_C = { x0: 250, pen: 650, cray: 450, penY: 158, crayY: 270 };

  function hmlComparePair(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPen = c(0, "pencil"), cCray = c(0, "crayon"), cWhich = c(0, "which");
    var cStart = c(1, "start"), cLine = c(1, "line");
    var cEnds = c(2, "ends"), cFurther = c(2, "further");
    var cLonger = c(3, "longer"), cShorter = c(3, "shorter");
    var x0 = HML_C.x0, penX = x0 + HML_C.pen, crayX = x0 + HML_C.cray, out = "";

    /* the line they both start on */
    var so = Math.max(on(t, cPen, 0.4), on(t, cStart, 0.4));
    var lit = on(t, cLine, 0.5);
    out += L(x0, 104, x0, 330, lit > 0 ? P.gold : P.line, 3 + 3 * lit, { "stroke-dasharray": "10 8", opacity: 0.4 + 0.6 * so });
    if (lit > 0) {
      out += MK.ripple(x0, HML_C.penY, t, cStart, P.gold);
      out += MK.ripple(x0, HML_C.crayY, t, cStart == null ? null : cStart + 0.25, P.gold);
      out += MK.pill(x0, 356, "same place", lit, { size: 24, col: P.gold });
    }

    /* the two things */
    out += hmlStick(x0, HML_C.penY, HML_C.pen, 44, P.gold, "#8B6A3A", popIn(t, cPen, 0.45));
    out += hmlStick(x0, HML_C.crayY, HML_C.cray, 44, P.plum, "#5E3B76", popIn(t, cCray, 0.45));
    out += MK.pill(x0 - 96, HML_C.penY, "pencil", on(t, cPen, 0.4), { size: 25, col: P.gold });
    out += MK.pill(x0 - 96, HML_C.crayY, "crayon", on(t, cCray, 0.4), { size: 25, col: P.plum });
    out += MK.qmark(penX + 96, 214, 30, on(t, cWhich, 0.4) * (1 - on(t, cEnds, 0.5)));

    /* where each one ends */
    var eo = on(t, cEnds, 0.6);
    out += hmlDrop(penX, HML_C.penY + 26, 352, eo, P.gold);
    out += hmlDrop(crayX, HML_C.crayY + 26, 352, on(t, cEnds == null ? null : cEnds + 0.3, 0.6), P.plum);
    /* the extra length the pencil has, on "further along": it belongs to that
       beat, so it goes as the answer beat arrives (rule 7) */
    var fo = on(t, cFurther, 0.6) * hmlOnly(t, scene, 2);
    if (fo > 0) out += MK.arrow(crayX, 214, lerp(crayX, penX, on(t, cFurther, 0.6)), 214, fo, P.good, 7);

    /* the answer */
    out += MK.pill(penX + 104, HML_C.penY, "longer", on(t, cLonger, 0.4), { size: 29, col: P.good });
    out += MK.pill(crayX + 112, HML_C.crayY, "shorter", on(t, cShorter, 0.4), { size: 29, col: P.bad });
    out += MK.tick(penX + 44, HML_C.penY - 66, 22, popIn(t, cLonger, 0.4));
    return out;
  }

  function hmlCompareFat(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFat = c(4, "fat"), cNot = c(4, "not"), cLen = c(4, "length");
    var x0 = 300, out = "";
    out += L(x0, 100, x0, 356, P.line, 3, { "stroke-dasharray": "10 8" });
    /* the fat one: 290 long. The thin one: 550. Same start, so the picture
       says the thin one is the longer, which is the beat's point. */
    out += G(R(x0, 122, 290, 92, 20, P.accent, "#7A3512", 3) +
      MK.pill(x0 + 145, 250, "fat, but short", 1, { size: 25, col: P.accent }), { opacity: popIn(t, cFat, 0.45) });
    out += G(hmlStick(x0, 320, 550, 30, P.gold, "#8B6A3A", 1) +
      MK.pill(x0 + 275, 390, "thin, but long", 1, { size: 25, col: P.gold }), { opacity: popIn(t, cFat == null ? null : cFat + 0.3, 0.45) });
    out += MK.cross(x0 + 340, 168, 30, popIn(t, cNot, 0.4));
    var lo = on(t, cLen, 0.7);
    if (lo > 0) {
      out += MK.arrow(x0, 290, lerp(x0, x0 + 550, lo), 290, lo, P.good, 7);
      out += MK.tick(x0 + 600, 320, 26, popIn(t, cLen == null ? null : cLen + 0.5, 0.4));
    }
    return out;
  }

  function hmlCompareChapter(scene, beat, t, i) {
    return svg(hmlSwap(t, scene, 4,
      function () { return hmlComparePair(t, scene); },
      function () { return hmlCompareFat(t, scene); }));
  }

  /* ==== chapter: measure with cubes ==============================================
     The lesson's step 2, with its own number: the pencil is 7 cubes long. The
     pencil's bar is exactly 7 * HML.CUBE wide and the cubes are laid flush
     from the same x, so the count on screen is the count in the voice. */
  var HML_K = { x0: 268, cube: 86, n: 7, penY: 158, cubeY: 244 };

  function hmlCubesRow(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCubes = c(0, "cubes"), cLay = c(0, "lay"), cGaps = c(0, "gaps");
    var cOne = c(1, "one"), cSeven = c(1, "seven");
    var cLong = c(2, "seven"), cUnit = c(2, "unit"), cSame = c(3, "same");
    var x0 = HML_K.x0, s = HML_K.cube, n = HML_K.n, span = n * s, out = "";

    /* the pencil, exactly seven cubes long */
    out += hmlStick(x0, HML_K.penY, span, 46, P.gold, "#8B6A3A", 1);
    out += MK.pill(x0 - 92, HML_K.penY, "pencil", 1, { size: 25, col: P.gold });

    /* one cube shown on its own as it is named, then the row laid down */
    var solo = popIn(t, cCubes, 0.4) * (1 - on(t, cLay, 0.5));
    out += MK.pop(hmlCube(x0 + span + 86, HML_K.penY - s / 2, s, null, 1, 0),
      x0 + span + 86 + s / 2, HML_K.penY, solo);

    /* the count's clock: number k is said at cOne + k * step, so the cube it
       lands on flashes exactly then, and the seventh lands on "seven." */
    var step = cOne == null || cSeven == null ? null : (cSeven - cOne) / (n - 1);
    function hmlSaidAt(k) { return step == null ? null : cOne + k * step; }

    var laid = tally(t, cLay, n, 1.5);
    for (var k = 0; k < n; k++) {
      if (k >= laid) break;
      var landed = cLay == null ? 0 : cLay + k * (1.5 / (n - 1));
      var u = clamp((t - landed) / 0.3, 0, 1);
      out += hmlCube(x0 + k * s, lerp(HML_K.cubeY - 48, HML_K.cubeY, u * u), s,
        null, Math.min(1, u * 3), bump(t, hmlSaidAt(k), 0.45));
      /* counted: the number pops on its own cube */
      var no = popIn(t, hmlSaidAt(k), 0.34);
      if (no > 0) out += MK.pop(Tx(x0 + k * s + s / 2, HML_K.cubeY + s / 2 + 12, String(k + 1), "lab big", "middle",
        { fill: "#12323F" }), x0 + k * s + s / 2, HML_K.cubeY + s / 2, no);
    }

    /* no gaps: a tick over the join the cubes make */
    var go = on(t, cGaps, 0.4) * (1 - hmlFrom(t, scene, 2));
    if (go > 0 && laid >= 2) {
      out += MK.tick(x0 + 2 * s, HML_K.cubeY - 30, 20, popIn(t, cGaps, 0.4) * go);
      out += MK.pill(x0 + 2 * s + 118, HML_K.cubeY - 30, "no gaps", go, { size: 23, col: P.good });
    }

    /* the answer: a bracket under the whole row */
    var lo = on(t, cLong, 0.5);
    if (lo > 0) {
      var by = HML_K.cubeY + s + 30;
      out += L(x0, by, lerp(x0, x0 + span, lo), by, P.good, 5);
      out += L(x0, by - 12, x0, by + 12, P.good, 5) + L(x0 + span, by - 12, x0 + span, by + 12, P.good, 5, { opacity: lo });
      out += MK.pill(x0 + span / 2, by + 40, "7 cubes long", lo, { size: 30, col: P.good });
    }
    /* the leader ends just ABOVE the last cube: on its middle, its end dot sat
       on top of the 7 and read as a smudged number */
    out += hmlTag(t, x0 + span + 150, HML_K.cubeY + s / 2, "the unit", cUnit,
      [x0 + span - s / 2, HML_K.cubeY - 8], { col: P.teal, size: 25 });
    /* "every cube must be the same size": the tidy row is what that looks like */
    out += MK.pill(x0 + span / 2, 96, "same size every time", on(t, cSame, 0.4), { size: 27, col: P.gold });
    out += MK.tick(x0 + span + 60, 96, 22, popIn(t, cSame, 0.4));
    return out;
  }

  function hmlCubesOdd(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cNothing = c(3, "nothing");
    var x0 = 268, span = HML_K.n * HML_K.cube, out = "";
    out += hmlStick(x0, 150, span, 46, P.gold, "#8B6A3A", 1);
    /* five pieces of five different widths, filling the same pencil: the row
       is the same length and the count is not, which is the beat's point.
       They share one height, so the tallest cannot leave the box. */
    var sizes = [110, 62, 134, 86, 210], x = x0, hh = 88;
    for (var k = 0; k < sizes.length; k++) {
      var o = popIn(t, cNothing == null ? null : cNothing - 0.5 + k * 0.11, 0.3);
      if (o > 0) out += G(R(x, 236, sizes[k], hh, 12, "#C4453A", "#1B2A2F", 2.5) +
        R(x + 10, 246, sizes[k] - 20, 15, 7, "#FFFFFF", null, null, { opacity: 0.32 }),
        { opacity: clamp(o, 0, 1) });
      x += sizes[k];
    }
    out += MK.cross(x0 + span + 72, 280, 38, popIn(t, cNothing, 0.45));
    out += MK.pill(x0 + span / 2, 392, "different sizes: the count means nothing",
      on(t, cNothing, 0.4), { size: 25, col: P.bad });
        return out;
  }

  function hmlCubesChapter(scene, beat, t, i) {
    var u = clamp(on(t, sc(scene, 3, "nothing") == null ? null : sc(scene, 3, "nothing") - 0.55, 0.5), 0, 1);
    if (u <= 0) return svg(hmlCubesRow(t, scene));
    if (u >= 1) return svg(hmlCubesOdd(t, scene));
    return svg(G(hmlCubesRow(t, scene), { opacity: 1 - u }) + G(hmlCubesOdd(t, scene), { opacity: u }));
  }
