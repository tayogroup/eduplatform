  /* ==== Shapes and Symmetry, part 2 ===========================================
     The chapters "Regular or irregular", "Lines of symmetry" and "Mirror it".
     See shapes-and-symmetry.js for the palette, the helpers and the rule that
     every top-level name here starts with ss.

     A COUNT IS TIMED TO LAND ON THE NUMBER, not to start there. "A square has
     four lines of symmetry" names the four near the END of its line, so a
     tally begun at that phrase would still be counting when the beat is over
     and the picture has gone. Each count therefore starts at the beat's first
     cue and runs for exactly the gap to the phrase that names the total, so
     the fourth line lands as the word "four" is said. */

  /* a regular polygon of n sides, radius r, a corner at the top */
  function ssRegular(n, r) {
    var pts = [], i, a;
    for (i = 0; i < n; i++) { a = ((i / n) * 360 - 90) * Math.PI / 180; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
    return pts;
  }
  /* the gap between two cues, as a span for tally(); a fallback if either is
     missing, and never so short that the count is a flicker */
  function ssSpan(from, to, dflt) {
    return from == null || to == null ? (dflt || 1.4) : Math.max(0.6, to - from);
  }
  /* The same pentagon squashed to 0.56 of its height, which is how the lesson
     itself makes an irregular one (l5-content.js :: poly, wob). Measured, the
     five sides come out 96.5, 68.0, 110.5, 68.0 and 96.5 - three different
     lengths, so it is irregular by the definition the film has just given. */
  var SS_PENT = ssRegular(5, 104);
  var SS_PENT_FLAT = SS_PENT.map(function (p) { return [p[0], p[1] * 0.56]; });

  /* ==== chapter: regular or irregular ======================================== */
  function ssRegularChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cReg = c(0, "regular"), cSame = c(0, "sides"), cCor = c(0, "corners");
    var cBoth = c(1, "both"), cFive = c(1, "five"), cPent = c(1, "pent");
    var cOne = c(2, "one"), cStretch = c(2, "stretch");
    var cNotWrong = c(3, "notwrong"), cMost = c(3, "most");
    /* the pair gives way to the three irregular shapes ON "not wrong", not at
       the beat boundary: the phrase is a quarter of the way into its line, and
       swapping at the boundary left the stage empty until it was said. */
    var two = into(t, scene.first + 1);
    var three = on(t, cNotWrong == null ? null : cNotWrong - 0.3, 0.5);
    var out = "", k;

    /* one pentagon, big, while the first line is said */
    if (two < 1) {
      var solo = ssCard(414, 45, 340, 340) +
        ssPoly(584, 200, SS_PENT, { equal: on(t, cSame, 0.5), corners: on(t, cCor, 0.5),
          opacity: popIn(t, cReg, 0.45) }) +
        ssInk(584, 352, "every side the same", "lab big", "middle", ART.C.muted);
      out += G(solo, { opacity: 1 - two });
    }

    /* the pair: the regular one and the stretched one */
    if (two > 0 && three < 1) {
      var pair = "", spot = [360, 808], pts = [SS_PENT, SS_PENT_FLAT];
      var named = [on(t, cOne, 0.45), on(t, cStretch, 0.45)];
      /* the older pill goes before the newer one is readable, so the two never
         sit on top of each other in the crossfade */
      var fade = [on(t, cOne, 0.2), on(t, cStretch, 0.2)];
      for (k = 0; k < 2; k++) {
        pair += ssCard(spot[k] - 150, 40, 300, 300);
        /* "Both of these": both cards ring gold as the words are said */
        pair += R(spot[k] - 150, 40, 300, 300, 20, "none", P.gold, 4, { opacity: bump(t, cBoth, 1.3) });
        pair += ssPoly(spot[k], 180, pts[k], { scale: 0.78, sides: on(t, cFive, 0.5),
          equal: k === 0 ? on(t, cOne, 0.5) : 0 });
        pair += ssInk(spot[k], 312, "5 sides", "lab big", "middle", ART.C.muted);
        /* "both of them are pentagons", until each is told apart */
        pair += MK.pill(spot[k], 372, "pentagon", on(t, cPent, 0.45) * (1 - fade[k]), { size: 26, col: P.teal });
      }
      pair += MK.pill(360, 372, "regular pentagon", named[0], { size: 26, col: P.gold });
      pair += MK.pill(808, 372, "irregular pentagon", named[1], { size: 26, col: P.plum });
      pair += MK.tick(166, 190, 28, popIn(t, cOne, 0.4));
      /* "stretched": the pull that made it */
      var st = on(t, cStretch, 0.5);
      pair += MK.arrow(808, 180, 660, 180, st, P.plum, 6) + MK.arrow(808, 180, 956, 180, st, P.plum, 6);
      out += G(pair, { opacity: two * (1 - three) });
    }

    /* "Irregular is not wrong. Most shapes around you are irregular." */
    if (three > 0) {
      var wild = MK.pill(584, 54, "irregular is not wrong", on(t, cNotWrong, 0.45), { size: 30, col: P.good });
      for (k = 0; k < 3; k++) {
        var p = popIn(t, cNotWrong == null ? null : cNotWrong + 0.15 + k * 0.22, 0.42);
        if (p <= 0) continue;
        wild += G(ssPoly(300 + k * 284, 232, SS_WILD[k], { scale: 1.9, fill: "#EADDF2", stroke: ART.C.plum }),
          { transform: around(300 + k * 284, 232, Math.min(p, 1.1)), opacity: Math.min(1, p) });
      }
      wild += MK.pill(584, 400, "most shapes are like these", on(t, cMost, 0.5), { size: 26, col: P.plum });
      out += G(wild, { opacity: three });
    }
    return svg(out);
  }

  /* ==== chapter: lines of symmetry ===========================================
     ART.symmetry draws the shape's REAL mirror lines (its SYM table: a square
     has four, a rectangle two) and, with reflect, clips the shape at the line
     and draws the other half as the mirror image of the first. The fold flap
     over the square is this film's own: the left half swung across the line by
     scaling it about the line from 1 to -1, so at the end it lies exactly on
     the right half - which is what "the two halves land on top" means. */
  var SS_SYM = ssBox(292, 318, 584, 220, 372);
  var SS_SQ = { cx: SS_SYM.fx(146), cy: SS_SYM.fy(146), half: 84 * SS_SYM.k };
  var SS_PAR = [[-55, -42], [85, -42], [55, 42], [-85, 42]];

  function ssSymmetryChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLine = c(0, "line"), cFold = c(0, "fold");
    var cFoldIt = c(1, "foldit"), cHalves = c(1, "halves"), cOnTop = c(1, "ontop");
    var cCount = c(2, "count"), cFour = c(2, "four");
    var cTwo = c(3, "two"), cDown = c(3, "down"), cAcross = c(3, "across");
    var cCut = c(4, "cut"), cNotEnough = c(4, "notenough"), cMatch = c(4, "match");
    var u1 = into(t, scene.first + 1), u2 = into(t, scene.first + 2);
    var u3 = into(t, scene.first + 3), u4 = into(t, scene.first + 4), out = "";

    /* the square: one line, then all four, counted onto the word "four" */
    var sqO = 1 - u3;
    if (sqO > 0) {
      var n = cCount != null && t >= cCount ? tally(t, cCount, 4, ssSpan(cCount, cFour, 2.4)) : 1;
      var word = n + (n === 1 ? " line of symmetry" : " lines of symmetry");
      var sq = ssPut(ART.symmetry({ kind: "square", lines: [], label: "a square" }), SS_SYM);
      sq += G(ssPut(ART.symmetry({ kind: "square", lines: [0, 1, 2, 3].slice(0, n), label: word }), SS_SYM),
        { opacity: on(t, cFold, 0.5) });
      /* the fold: the left half swings across the line and lands on the right */
      var f = cFoldIt == null ? 0 : clamp((t - cFoldIt) / 0.95, 0, 1);
      if (f > 0 && f < 1) sq += G(R(SS_SQ.cx - SS_SQ.half, SS_SQ.cy - SS_SQ.half, SS_SQ.half, 2 * SS_SQ.half, 0,
        "rgba(30,140,134,0.55)", ART.C.teal, 3),
        { transform: "translate(" + n2(SS_SQ.cx) + ",0) scale(" + n3(1 - 2 * f) + ",1) translate(" + n2(-SS_SQ.cx) + ",0)" });
      /* the two halves, landed */
      sq += G(ssPut(ART.symmetry({ kind: "square", lines: [0], reflect: true, label: "the halves match" }), SS_SYM),
        { opacity: on(t, cOnTop, 0.5) * (1 - u2) });
      out += G(sq, { opacity: sqO });
      out += MK.pill(950, 116, "a fold line", on(t, cLine, 0.45) * (1 - u1), { size: 26, col: P.gold });
      out += MK.pill(950, 116, "both halves match", on(t, cHalves, 0.45) * (1 - u2), { size: 24, col: P.good });
      out += MK.tick(950, 196, 28, popIn(t, cOnTop == null ? null : cOnTop + 0.35, 0.4) * (1 - u2));
      out += MK.pill(950, 116, n + " of 4", on(t, cCount, 0.4) * u2 * (1 - u3), { size: 34, col: P.gold });
    }

    /* the rectangle: down the middle, then across */
    var reO = u3 * (1 - u4);
    if (reO > 0) {
      var m = cDown != null && t >= cDown ? tally(t, cDown, 2, ssSpan(cDown, cAcross, 1.2)) : 0;
      var rw = m === 0 ? "a rectangle" : m + (m === 1 ? " line of symmetry" : " lines of symmetry");
      out += G(ssPut(ART.symmetry({ kind: "rectangle", lines: [0, 1].slice(0, m), label: rw }), SS_SYM), { opacity: reO });
      out += MK.pill(950, 112, "only two", on(t, cTwo, 0.45) * reO, { size: 30, col: P.gold });
      out += MK.pill(950, 186, "down the middle", on(t, cDown, 0.45) * reO, { size: 24, col: P.muted });
      out += MK.pill(950, 250, "across", on(t, cAcross, 0.45) * reO, { size: 24, col: P.muted });
    }

    /* the parallelogram: a fold that cuts it in two and does not match */
    if (u4 > 0) {
      var par = ssCard(414, 34, 340, 372);
      par += ssPoly(584, 205, SS_PAR, { scale: 1.6 });
      var cut = on(t, cCut, 0.5);
      if (cut > 0) par += L(584, 95, 584, 315, ART.C.accent, 3.5, { "stroke-dasharray": "10 7", opacity: cut });
      var ne = on(t, cNotEnough, 0.5);
      if (ne > 0) par += ssPoly(584, 205, SS_PAR.map(function (p) { return [-p[0], p[1]]; }),
        { scale: 1.6, fill: "none", stroke: ART.C.bad, sw: 3.5, opacity: ne });
      par += ssInk(584, 372, "no line of symmetry", "lab big", "middle", cut > 0 ? ART.C.bad : ART.C.muted);
      out += G(par, { opacity: u4 });
      out += MK.pill(950, 112, "two equal pieces", on(t, cCut, 0.45) * u4, { size: 22, col: P.muted });
      out += MK.pill(950, 176, "they do not match", on(t, cNotEnough, 0.45) * u4, { size: 22, col: P.bad, ink: P.bad });
      out += MK.cross(950, 252, 30, popIn(t, cMatch, 0.4) * u4);
    }
    return svg(out);
  }

  /* ==== chapter: mirror it ====================================================
     The lesson's own reflection grid. The mirror stands between column 3 and
     column 4, so a cell in column c reflects to column 7 - c: the interval
     [c, c + 1] mirrored about 4 is [7 - c, 8 - c]. The shape is an L of four
     cells at columns 1 to 3, and its image is the four at columns 4 to 6 -
     four squares each side, the number the voice says. The last beat draws
     where a SLIDE would have put the same four: three cells agree with the
     reflection and the foot does not, which is the whole difference. */
  var SS_GRID = ssBox(396, 294, 584, 220, 386);
  var SS_CELL = 44 * SS_GRID.k;
  var SS_SHAPE = [[1, 1], [2, 1], [3, 1], [3, 2]];
  var SS_IMAGE = SS_SHAPE.map(function (q) { return [7 - q[0], q[1]]; });
  var SS_SLIDE = SS_SHAPE.map(function (q) { return [q[0] + 3, q[1]]; });
  function ssCellX(c) { return SS_GRID.fx(22 + 44 * c); }
  function ssCellY(r) { return SS_GRID.fy(22 + 44 * r); }
  function ssCellMid(c, r) { return [ssCellX(c) + SS_CELL / 2, ssCellY(r) + SS_CELL / 2]; }
  /* a bracket under the grid, from grid line a to grid line b, with its count */
  function ssBracket(a, b, y, text, col, o) {
    if (!(o > 0)) return "";
    var x1 = ssCellX(a), x2 = ssCellX(b);
    return G(L(x1, y, x2, y, col, 3) + L(x1, y - 9, x1, y + 9, col, 3) + L(x2, y - 9, x2, y + 9, col, 3) +
      MK.pill((x1 + x2) / 2, y - 30, text, 1, { size: 28, col: col, ink: col }), { opacity: clamp(o, 0, 1) });
  }

  function ssMirrorChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFlip = c(0, "flip"), cMirror = c(0, "mirror");
    var cSame = c(1, "same"), cOther = c(1, "other");
    var cTwoAlong = c(2, "twoalong"), cRefl = c(2, "refl");
    var cHere = c(3, "here"), cThere = c(3, "there");
    var cNotSlide = c(4, "notslide"), cRound = c(4, "round");
    var mx = SS_GRID.fx(198), brY = SS_GRID.fy(256), out = "", k;

    out += ssPut(ART.grid({ cols: 8, rows: 5, cell: 44, fill: SS_SHAPE, colour: "teal",
      label: "a mirror line down the middle" }), SS_GRID);

    /* the mirror line itself */
    var mo = on(t, cMirror, 0.5);
    if (mo > 0) out += L(mx, SS_GRID.fy(12), mx, SS_GRID.fy(252), ART.C.plum, 5,
      { "stroke-dasharray": "12 8", opacity: mo });
    /* "flips a shape": an arc from the shape over to the other side */
    var fl = on(t, cFlip, 0.6);
    if (fl > 0) {
      var a0 = ssCellMid(2, 1), a1 = ssCellMid(5, 1), top = ssCellY(0) - 34;
      out += Pth("M" + n2(a0[0]) + "," + n2(a0[1]) + " Q" + n2(mx) + "," + n2(top) + " " +
        n2(lerp(a0[0], a1[0], fl)) + "," + n2(lerp(a0[1], a1[1], fl)), null, P.gold, 4,
        { "stroke-dasharray": "10 8", opacity: fl });
    }

    /* "the same distance ... on the other side": the cell touching the mirror */
    var one = ssOnly(t, scene, 1);
    if (one > 0) {
      var g1 = on(t, cSame, 0.5) * one, g2 = on(t, cOther, 0.5) * one;
      out += ssBracket(3, 4, brY, "1", ART.C.teal, g1);
      out += ssBracket(4, 5, brY, "1", ART.C.accent, g2);
      if (g2 > 0) out += R(ssCellX(4), ssCellY(1), SS_CELL, SS_CELL, 0, "none", ART.C.accent, 4,
        { "stroke-dasharray": "8 6", opacity: g2 });
    }

    /* "two along ... two along as well" */
    var twoB = ssFrom(t, scene, 2) * (1 - ssFrom(t, scene, 3));
    if (twoB > 0) {
      var ta = on(t, cTwoAlong, 0.5) * twoB, tr2 = on(t, cRefl, 0.5) * twoB;
      out += ssBracket(2, 4, brY, "2", ART.C.teal, ta);
      out += ssBracket(4, 6, brY, "2", ART.C.accent, tr2);
      if (ta > 0) out += R(ssCellX(2), ssCellY(1), SS_CELL, SS_CELL, 0, "none", P.gold, 4, { opacity: ta });
      if (tr2 > 0) out += R(ssCellX(5), ssCellY(1), SS_CELL, SS_CELL, 0, ART.C.accent, null, null,
        { opacity: tr2 }) + R(ssCellX(5), ssCellY(1), SS_CELL, SS_CELL, 0, "none", P.gold, 4, { opacity: tr2 });
    }

    /* "Four squares on this side, so four squares on that side" */
    var here = tally(t, cHere, 4, 1.0), there = tally(t, cThere, 4, 1.0);
    for (k = 0; k < here; k++) {
      var q = ssCellMid(SS_SHAPE[k][0], SS_SHAPE[k][1]);
      out += ssInk(q[0], q[1] + 10, String(k + 1), "lab big", "middle", "#FFFFFF");
    }
    for (k = 0; k < there; k++) {
      var w = SS_IMAGE[k], p = ssCellMid(w[0], w[1]);
      out += R(ssCellX(w[0]), ssCellY(w[1]), SS_CELL, SS_CELL, 0, ART.C.accent);
      out += ssInk(p[0], p[1] + 10, String(k + 1), "lab big", "middle", "#FFFFFF");
    }
    /* once they are all there, the image stays for the last beat too */
    if (there === 0 && ssFrom(t, scene, 4) > 0) for (k = 0; k < 4; k++)
      out += R(ssCellX(SS_IMAGE[k][0]), ssCellY(SS_IMAGE[k][1]), SS_CELL, SS_CELL, 0, ART.C.accent);

    /* "A reflection is not a slide": where a slide would have put the foot */
    var sl = on(t, cNotSlide, 0.5), rowY = ssCellY(4) + SS_CELL / 2;
    if (sl > 0) {
      for (k = 0; k < 4; k++) out += R(ssCellX(SS_SLIDE[k][0]), ssCellY(SS_SLIDE[k][1]), SS_CELL, SS_CELL, 0,
        "none", ART.C.bad, 4, { "stroke-dasharray": "9 6", opacity: sl });
      var bad1 = ssCellMid(SS_SLIDE[3][0], SS_SLIDE[3][1]);
      out += MK.cross(bad1[0], bad1[1], 22, popIn(t, cNotSlide == null ? null : cNotSlide + 0.4, 0.4));
      out += MK.leader(900, rowY, bad1[0], bad1[1] + SS_CELL / 2 + 6, on(t, cNotSlide, 0.6), P.bad);
      out += MK.pill(920, rowY, "a slide", sl, { size: 22, col: P.bad, ink: P.bad });
    }
    var rd = on(t, cRound, 0.5);
    if (rd > 0) {
      var good = ssCellMid(SS_IMAGE[3][0], SS_IMAGE[3][1]);
      out += MK.tick(good[0], good[1], 22, popIn(t, cRound, 0.4));
      out += MK.leader(650, rowY, good[0], good[1] + SS_CELL / 2 + 6, on(t, cRound, 0.6), P.good);
      out += MK.pill(560, rowY, "a reflection", rd, { size: 22, col: P.good, ink: P.good });
    }
    return svg(out);
  }
