  /* ==== Grade 5 Mathematics, Lesson 3: How Whole Numbers Are Built ==============
     tools/lib/film-scenes/math-g5/how-whole-numbers-are-built.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-5-app/lecture-video/how-whole-numbers-are-built.json.

     Six teaching chapters carry the lesson's six ideas (Steps 14-20): odd and
     even numbers (a square and a rectangle), the order of operations, factors
     and multiples in pairs, highest common factor and lowest common multiple,
     divisibility rules, and prime numbers found with the sieve of Eratosthenes.
     Mathematics has no lesson kit, so every drawing is one of the shared maths
     pictures (tools/lib/ehel-film-art-math.js): ART.numberLine for the odd and
     even hops, ART.array for the square and the rectangle they add up to,
     ART.grid with numbers:true for the sieve on a 1-100 grid. Everything drawn
     on top - callouts, rings, arcs joining a factor pair - is placed by mapping
     the drawing's own viewBox into the film's 1168 x 440 space.

     This file: the palette, the timing helpers, the shared number-line and
     array wrappers, the title motif and the chapter "Odd numbers and even
     numbers". Every top-level name starts with hwn. */

  var HUE = {
    title: P.teal, oddeven: P.gold, order: P.accent, factors: P.teal,
    common: P.blue, divisibility: P.plum, primes: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does */
  function hwnOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, and staying there */
  function hwnFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 over span from a cue, staying at 1: a move that finishes and stays */
  function hwnStep(t, at, span) { return at == null ? 0 : ease(clamp((t - at) / (span || 0.5), 0, 1)); }

  /* ---- the odd and even number lines ------------------------------------------
     ART.numberLine from 0 to 9, so both share one card size and crossfade
     cleanly. Odd hops from 1 to 7, even hops from 2 to 8 - both the lesson's
     own strip (1, 3, 5, 7 and 2, 4, 6, 8). */
  function hwnLine(marks, jumps) {
    return ART.numberLine({ from: 0, to: 9, step: 1, width: 620, marks: marks, jumps: jumps });
  }
  var HWN_LINE_W = 620, HWN_LINE_H = 208;   /* jumps present: top 96, ay 116, h 116+62+30 */
  function hwnLinePlace(svgMarkup) { return ART.place(svgMarkup, 60, 96, HWN_LINE_W, HWN_LINE_H); }

  /* ---- the two arrays: 4 by 4 (16, a square) and 5 by 4 (20, one row taller) - -
     ART.array(rows, cols, o); rows = 5 for the rectangle is one row taller than
     the rows = 4 square, exactly as the lesson's own note says. ART.array's own
     card size (cell 36, pad 12, edge 20, gutters 44/38, no caption by default)
     is computed here so the placed box is scaled correctly and never runs past
     the film's 440 px height - a fixed guess at the card size put a corner 95 px
     outside the box (found by --sweep, 2026-09-25). */
  function hwnArray(rows, cols) { return ART.array(rows, cols, {}); }
  function hwnArrayDims(rows, cols) {
    var cell = 36, pad = 12, edge = 20, gutterL = 44, gutterT = 38;
    var pw = cols * cell + 2 * pad, ph = rows * cell + 2 * pad;
    return [edge + gutterL + pw + edge, edge + gutterT + ph + edge];
  }
  function hwnArrayPlace(svgMarkup, rows, cols, x, y, targetW) {
    var dims = hwnArrayDims(rows, cols), scale = targetW / dims[0];
    return ART.place(svgMarkup, x, y, targetW, dims[1] * scale);
  }

  /* ==== the title motif =========================================================
     Ten number tiles, 1 to 10, gold for odd and teal for even, arriving in
     order as "odd or even" is said; a ring lands on 7 alone for "prime", then
     rings pass over the four primes among them - 2, 3, 5, 7 - for "spot
     primes". A pair of brackets for "order operations" and an arc joining 2
     and 5 (2 times 5 is 10) for "find factors" sit above and below. */
  var HWN_PRIME10 = [2, 3, 5, 7];
  function hwnTilePos(n) {
    var TILE = 46, GAP = 10, X0 = 180 - (5 * TILE + 4 * GAP) / 2, Y0 = 129;
    var col = (n - 1) % 5, row = Math.floor((n - 1) / 5);
    var x = X0 + col * (TILE + GAP), y = Y0 + row * (TILE + GAP);
    return [x + TILE / 2, y + TILE / 2, TILE];
  }
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene || null;
    var cOdd = s ? sc(s, 0, "oddeven") : null, cPrime = s ? sc(s, 0, "prime") : null;
    var cOrder = s ? sc(s, 1, "order") : null, cFactors = s ? sc(s, 1, "factors") : null, cPrimes = s ? sc(s, 1, "primes") : null;
    var out = "", n, k;
    out += C(180, 180, 172, "#123247");
    out += el("clipPath", { id: "hwnMotifClip" }, C(180, 180, 172));
    var tiles = "";
    for (n = 1; n <= 10; n++) {
      var pos = hwnTilePos(n), at = cOdd == null ? (s ? null : 0) : cOdd + (n - 1) * 0.12;
      var p = s ? popIn(t, at, 0.3) : 1;
      if (!(p > 0)) continue;
      var col = n % 2 ? P.gold : P.teal;
      tiles += G(R(pos[0] - pos[2] / 2, pos[1] - pos[2] / 2, pos[2], pos[2], 8, col, "#123247", 2) +
        Tx(pos[0], pos[1] + 7, String(n), "lab big", "middle", { fill: "#123247" }),
        { transform: around(pos[0], pos[1], Math.min(p, 1.1)), opacity: Math.min(1, p) });
    }
    out += G(tiles, { "clip-path": "url(#hwnMotifClip)" });
    /* "prime": 7 rings alone */
    var pOnly = s ? popIn(t, cPrime, 0.35) * (1 - (cOrder != null && t >= cOrder ? 1 : 0)) : 0;
    if (pOnly > 0) { var p7 = hwnTilePos(7); out += G(C(p7[0], p7[1], 30, "none", P.gold, 4), { transform: around(p7[0], p7[1], Math.min(pOnly, 1.12)), opacity: Math.min(1, pOnly) }); }
    /* "order operations": a pair of brackets above */
    var oo = s ? on(t, cOrder, 0.5) : 1;
    if (oo > 0) {
      out += Pth("M170,54 Q158,66 158,80 Q158,94 170,106", null, P.accent, 6, { opacity: oo });
      out += Pth("M190,54 Q202,66 202,80 Q202,94 190,106", null, P.accent, 6, { opacity: oo });
    }
    /* "find factors": an arc joining 2 and 5 (2 x 5 = 10) below the tiles */
    var fo = s ? on(t, cFactors, 0.5) : 0;
    if (fo > 0) {
      var t2 = hwnTilePos(2), t5 = hwnTilePos(5);
      out += Pth("M" + n2(t2[0]) + "," + n2(t2[1] + 30) + " Q180,282 " + n2(t5[0]) + "," + n2(t5[1] + 30), null, P.plum, 5, { opacity: fo });
    }
    /* "spot primes": rings pass over 2, 3, 5, 7 in turn */
    var reached = s ? tally(t, cPrimes, 4, 1.0) : 4;
    for (k = 0; k < reached; k++) {
      var pp = hwnTilePos(HWN_PRIME10[k]);
      out += G(C(pp[0], pp[1], 30, "none", P.good, 4), { transform: around(pp[0], pp[1], Math.min(popIn(t, cPrimes == null ? null : cPrimes + k * 0.22, 0.3), 1.1)), opacity: Math.min(1, popIn(t, cPrimes == null ? null : cPrimes + k * 0.22, 0.3)) });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Ten number tiles, gold for odd and teal for even, with the primes ringed">' + out + "</svg>";
  }

  /* ==== chapter: odd numbers and even numbers ===================================
     Steps 14-15's own numbers: the first four odds, 1, 3, 5, 7, add to 16 (4
     squared, a 4 by 4 square); the first four evens, 2, 4, 6, 8, add to 20 (a
     5 by 4 array - one row taller than the square, exactly as the lesson's own
     note has it). */
  function hwnOddEvenChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOdd = c(0, "odd"), cAdd2 = c(0, "add2");
    var cFour = c(1, "four"), cSixteen = c(1, "sixteen");
    var cSquared = c(2, "squared"), cSquare = c(2, "square");
    var cEven = c(3, "even"), cAdd2e = c(3, "add2e");
    var cTwenty = c(4, "twenty"), cRect = c(4, "rect");
    var w0 = hwnOnly(t, scene, 0), w1 = hwnOnly(t, scene, 1), w2 = hwnOnly(t, scene, 2),
      w3 = hwnOnly(t, scene, 3), w4 = hwnOnly(t, scene, 4);
    var out = "";

    /* beats 0-1: the odd hops, 1 -> 3 -> 5 -> 7 */
    var oddW = Math.min(1, w0 + w1);
    if (oddW > 0.002) {
      var oddPop = popIn(t, cAdd2, 0.4);
      var line = hwnLine([1, 3, 5, 7], [
        { from: 1, to: 3, label: "+2" }, { from: 3, to: 5, label: "+2" }, { from: 5, to: 7, label: "+2" }
      ]);
      out += G(hwnLinePlace(line), { opacity: oddW * Math.min(1, Math.max(oddPop, w1)), transform: around(60 + HWN_LINE_W / 2, 96 + HWN_LINE_H / 2, 0.94 + 0.06 * Math.min(1, Math.max(oddPop, w1))) });
      out += MK.pill(870, 90, "odd numbers", on(t, cOdd, 0.4) * w0, { size: 30, col: P.gold });
      var sumO = popIn(t, cFour, 0.4) * w1;
      if (sumO > 0) out += MK.pill(870, 160, "1 + 3 + 5 + 7", sumO, { size: 26, col: P.line });
      var eqO = popIn(t, cSixteen, 0.4) * w1;
      if (eqO > 0) {
        out += G(Tx(940, 300, "16", "lab", "middle", { fill: P.gold, "font-size": 96 }),
          { transform: around(940, 270, Math.min(eqO, 1.1) + 0.14 * bump(t, cSixteen, 0.5)) });
      }
    }

    /* beat 2: crossfade to the 4 by 4 array - 16, a square */
    if (w2 > 0.002) {
      var sq = hwnArray(4, 4);
      out += G(hwnArrayPlace(sq, 4, 4, 80, 90, 260), { opacity: w2 });
      out += MK.pill(940, 120, "4 squared", popIn(t, cSquared, 0.4) * w2, { size: 30, col: P.gold });
      var sqRing = popIn(t, cSquare, 0.4) * w2;
      if (sqRing > 0) out += G(R(66, 74, 288, 282, 18, "none", P.gold, 5), { opacity: Math.min(1, sqRing), transform: around(210, 215, Math.min(sqRing, 1.08)) });
    }

    /* beats 3-4: the even hops, then crossfade to the 5 by 4 array - 20 */
    var evenW = Math.min(1, w3);
    if (evenW > 0.002) {
      var evenPop = popIn(t, cAdd2e, 0.4);
      var eline = hwnLine([2, 4, 6, 8], [
        { from: 2, to: 4, label: "+2" }, { from: 4, to: 6, label: "+2" }, { from: 6, to: 8, label: "+2" }
      ]);
      out += G(hwnLinePlace(eline), { opacity: evenW * Math.min(1, Math.max(evenPop, 1)), transform: around(60 + HWN_LINE_W / 2, 96 + HWN_LINE_H / 2, 0.94 + 0.06 * Math.min(1, evenPop)) });
      out += MK.pill(870, 90, "even numbers", on(t, cEven, 0.4) * evenW, { size: 30, col: P.teal });
    }
    if (w4 > 0.002) {
      var rect = hwnArray(5, 4);
      out += G(hwnArrayPlace(rect, 5, 4, 80, 90, 260), { opacity: w4 });
      var twentyO = popIn(t, cTwenty, 0.4) * w4;
      if (twentyO > 0) {
        out += G(Tx(940, 200, "20", "lab", "middle", { fill: P.teal, "font-size": 96 }),
          { transform: around(940, 170, Math.min(twentyO, 1.1) + 0.14 * bump(t, cTwenty, 0.5)) });
      }
      var rectO = popIn(t, cRect, 0.4) * w4;
      if (rectO > 0) out += MK.pill(940, 300, "one row taller", rectO, { size: 26, col: P.teal });
    }
    return svg(out);
  }
