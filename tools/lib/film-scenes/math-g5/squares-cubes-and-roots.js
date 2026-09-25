
  /* ==== Grade 5 Mathematics, Lesson 1: Squares, Cubes and Roots ================
     tools/lib/film-scenes/math-g5/squares-cubes-and-roots.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-5-app/lecture-video/squares-cubes-and-roots.json.

     Mathematics has no lesson kit, so almost everything here is hand-drawn: the
     library (tools/lib/ehel-film-art-math.js) has no picture for a growing dot
     square built ring by ring (a "gnomon"), no triangular-number dot triangle,
     and no stack of unit cubes subdivided into layers - only ART.solid, a plain
     wireframe polyhedron with no interior structure. scrDots / scrRing below are
     the one small library this film needed and did not find; see the report for
     what to add to ART.

     THE ONE THING EVERY CHAPTER HERE SHARES is a square built from its own
     corner: dot (i, j), i = column from the left, j = row from the top, both
     0-indexed, sits in "ring" max(i, j) + 1. Ring 1 is the single dot (0, 0);
     ring 2 adds the 3 cells with max(i, j) = 1; ring k adds 2k - 1 cells - the
     odd-number gnomon the lesson's own Step 2 describes (3, 5, 7, ...). scrRing
     is checked against that arithmetic in its own comment.

     This file: the palette, the small shared helpers, the title motif and the
     chapter "Square numbers". Every top-level name starts with scr. */

  var HUE = {
    title: P.teal, squares: P.gold, sqroots: P.blue, cubes: P.accent,
    cuberoots: P.plum, triangular: P.good, recap: P.teal
  };

  /* ---- timing ------------------------------------------------------------ */

  /* 0 -> 1 while beat k of the chapter is the active one, else 0 */
  function scrOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from beat k of the chapter onward, staying at 1 */
  function scrFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* the absolute time beat k of scene starts, or null if the chapter has no such beat */
  function scrBeatStart(scene, k) { return k >= scene.beats.length ? null : BEATS[scene.first + k].start; }

  /* ---- the gnomon square: a grid built ring by ring from its top-left corner
     dot (i, j), i = column 0-indexed from the left, j = row 0-indexed from the
     top. ring(i, j) = max(i, j) + 1: ring 1 is (0, 0) alone (1 dot); ring 2 is
     the 3 cells with max(i, j) = 1; ring k has 2k - 1 cells, the L-shape the
     lesson's Step 2 adds to grow a (k - 1) square into a k square. Checked:
     ring counts 1, 3, 5, 7, 9 for k = 1..5, summing to 1, 4, 9, 16, 25 - the
     lesson's own first five square numbers. */
  function scrRing(i, j) { return Math.max(i, j) + 1; }
  /* every (i, j) cell with ring(i, j) === k, in a fixed, deterministic order:
     down the right column first (i = k - 1, j = 0..k - 1), then left along the
     bottom row (j = k - 1, i = k - 2..0) - the order a hand draws an L in. */
  function scrRingCells(k) {
    var out = [], j;
    for (j = 0; j < k; j++) out.push([k - 1, j]);
    for (var i = k - 2; i >= 0; i--) out.push([i, k - 1]);
    return out;
  }
  /* the centre of dot (i, j) in a grid whose cells are `cell` px, top-left corner at (x0, y0) */
  function scrDotXY(x0, y0, cell, i, j) { return [x0 + i * cell + cell / 2, y0 + j * cell + cell / 2]; }

  /* a triangular-number dot triangle: row r (1-indexed, 1..rows) has r dots,
     centred on cx, each row `rowGap` below the last, dots `colGap` apart. Row 1
     is the single dot at the top - the lesson's own "1, then 1+2, then 1+2+3". */
  function scrTriXY(cx, y0, rowGap, colGap, r, k) {
    /* the k-th dot (0-indexed) of row r (1-indexed) */
    return [cx + (k - (r - 1) / 2) * colGap, y0 + (r - 1) * rowGap];
  }

  /* ==== the title motif ==========================================================
     A dot square (bottom-left), a stack of three block layers standing for a
     cube (top-right), and a small dot triangle (bottom-right): the film's three
     ideas, on one dark disc. Static on the two cards; in the spoken title
     chapter the square rings in first (cue "square"), then the cube's three
     layers stack (cue "cube"), then the triangle's three rows grow (cue
     "triangle") - the same order the film teaches them in. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene || null;
    var multO = s ? on(t, sc(s, 0, "mult"), 0.6) : 1;
    var sqO = s ? on(t, sc(s, 0, "square"), 0.7) : 1;
    var cbO = s ? on(t, sc(s, 1, "cube"), 0.6) : 1;
    var triO = s ? on(t, sc(s, 1, "triangle"), 0.6) : 1;
    var out = "", k;
    out += C(180, 180, 172, "#123247");
    out += el("clipPath", { id: "scrMotifClip" }, C(180, 180, 172));

    /* "multiply a number by itself": a soft multiply sign at the centre,
       there before anything is built, fading out once the square starts
       ringing in - the idea that starts every chapter of this film */
    out += Tx(180, 196, "×", "lab", "middle", { opacity: Math.min(1, multO) * (1 - Math.min(1, sqO)), fill: P.muted, "font-size": 96 });

    /* the dot square, bottom-left, ring by ring */
    var sqX = 46, sqY = 176, sqCell = 30;
    for (k = 1; k <= 4; k++) {
      var reached = tally(t, s ? sc(s, 0, "square") : 0, 4, 0.9);
      if (!s) reached = 4;
      if (k > reached) continue;
      var cells = scrRingCells(k);
      for (var c = 0; c < cells.length; c++) {
        var xy = scrDotXY(sqX, sqY, sqCell, cells[c][0], cells[c][1]);
        out += C(xy[0], xy[1], sqCell * 0.32, k === reached ? P.gold : P.teal, null, null, { opacity: sqO });
      }
    }

    /* the cube: three offset flat layers, stacking top-right */
    var cbX = 210, cbY = 66, cbCell = 15, cbDX = 15, cbDY = 11;
    for (var layer = 2; layer >= 0; layer--) {
      var lo = cbO * (layer === 0 ? 1 : Math.min(1, Math.max(0, (cbO - layer * 0.28) / 0.36)));
      if (lo <= 0) continue;
      var lx = cbX + layer * cbDX, ly = cbY + (2 - layer) * cbDY;
      out += G(R(lx, ly, cbCell * 3, cbCell * 3, 3, layer === 2 ? P.accent : P.goldDeep, "#123247", 1.5), { opacity: lo });
    }

    /* the dot triangle, bottom-right, three rows */
    var triCx = 262, triY0 = 176, triGap = 24;
    var triReached = s ? tally(t, sc(s, 1, "triangle"), 3, 0.7) : 3;
    for (var r = 1; r <= triReached; r++)
      for (k = 0; k < r; k++) {
        var pt = scrTriXY(triCx, triY0, 24, 24, r, k);
        out += C(pt[0], pt[1], 7, P.good, null, null, { opacity: triO });
      }

    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A dot square, a stack of cube layers, and a dot triangle">' + out + "</svg>";
  }

  /* ==== chapter: square numbers ==================================================
     ONE persistent dot square, built once at (SQ.x, SQ.y) with cell SQ.cell, and
     reused across every beat of the chapter rather than re-drawn from nothing
     each time - so a viewer who glances back always sees the same square. */
  var SQ = { x: 66, y: 92, cell: 56 };
  function scrSqXY(i, j) { return scrDotXY(SQ.x, SQ.y, SQ.cell, i, j); }

  function scrSquaresChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRows = c(0, "rows"), cSquared = c(0, "squared");
    var cSquared2 = c(1, "squared2"), cTimes = c(1, "times"), cSixteen = c(1, "sixteen");
    var cFirst = c(2, "first"), cList = c(2, "list");
    var cThree3 = c(3, "three3"), cFour4 = c(3, "four4");
    var cL = c(4, "l"), cSeven = c(4, "seven");
    var cOdd = c(5, "odd"), cOne1 = c(5, "one1"), cThree1 = c(5, "three1"), cFive1 = c(5, "five1"), cSeven1 = c(5, "seven1");
    var out = "", k, r, cIx, cell;

    var b3start = scrBeatStart(scene, 3), b5start = scrBeatStart(scene, 5);
    var phase = t >= b5start ? 2 : t >= b3start ? 1 : 0;

    if (phase === 0) {
      /* beats 0-2: the square builds row by row (literally "four ROWS of
         four"), then stays complete and static while the equation and the
         mini strip of squares are shown beside it */
      for (r = 0; r < 4; r++) {
        var rowAt = cRows == null ? null : cRows + r * 0.32;
        var rp = popIn(t, rowAt, 0.4);
        if (!(rp > 0)) continue;
        for (cIx = 0; cIx < 4; cIx++) {
          var xy = scrSqXY(cIx, r);
          out += G(C(xy[0], xy[1], SQ.cell * 0.3, P.teal), { transform: around(xy[0], xy[1], Math.min(rp, 1.1)), opacity: Math.min(1, rp) });
        }
      }
    } else if (phase === 1) {
      /* beat 3: the inner 3 x 3 sits already built (it is what the square
         WAS); the L-shape of the 4th ring pops in gold, cell by cell */
      for (r = 0; r < 3; r++) for (cIx = 0; cIx < 3; cIx++) {
        var ixy = scrSqXY(cIx, r);
        out += C(ixy[0], ixy[1], SQ.cell * 0.3, P.teal);
      }
      var ring4 = scrRingCells(4);
      for (k = 0; k < ring4.length; k++) {
        var gp = popIn(t, cFour4 == null ? null : cFour4 + k * 0.09, 0.4);
        if (!(gp > 0)) continue;
        var gxy = scrSqXY(ring4[k][0], ring4[k][1]);
        out += G(C(gxy[0], gxy[1], SQ.cell * 0.3, P.gold), { transform: around(gxy[0], gxy[1], Math.min(gp, 1.12)), opacity: Math.min(1, gp) });
      }
    } else {
      /* beat 4-5: the same square, regrown from ring 1 through ring 4, one
         ring per cue in "odd numbers build squares": one, +3, +5, +7 */
      var cueOfRing = [cOne1, cThree1, cFive1, cSeven1];
      var colOfRing = [P.gold, P.blue, P.accent, P.good];
      var ringsReached = 0;
      for (k = 0; k < 4; k++) if (cueOfRing[k] != null && t >= cueOfRing[k]) ringsReached = k + 1;
      for (r = 1; r <= 4; r++) {
        if (r > ringsReached + 1) continue;
        var cells = scrRingCells(r);
        var ringAt = cueOfRing[r - 1];
        var basePop = r <= ringsReached ? 1 : popIn(t, ringAt, 0.45);
        if (!(basePop > 0)) continue;
        for (var m = 0; m < cells.length; m++) {
          var mp = r <= ringsReached ? 1 : popIn(t, ringAt == null ? null : ringAt + m * 0.06, 0.4);
          if (!(mp > 0)) continue;
          var mxy = scrSqXY(cells[m][0], cells[m][1]);
          out += G(C(mxy[0], mxy[1], SQ.cell * 0.3, colOfRing[r - 1]), { transform: around(mxy[0], mxy[1], Math.min(mp, 1.1)), opacity: Math.min(1, mp) });
        }
      }
      /* the running total, one ring behind the growth so it lands on the
         cumulative sum once that ring is fully in */
      var totals = [1, 4, 9, 16];
      if (ringsReached > 0) {
        var totO = on(t, cueOfRing[ringsReached - 1], 0.4);
        out += MK.pill(SQ.x + SQ.cell * 2, SQ.y + SQ.cell * 4 + 36, String(totals[ringsReached - 1]), totO, { size: 32, col: P.gold });
      }
    }

    /* the frame around the square, and "four squared" */
    out += R(SQ.x - 3, SQ.y - 3, SQ.cell * 4 + 6, SQ.cell * 4 + 6, 8, "none", P.line, 2);
    out += MK.pill(SQ.x + SQ.cell * 2, SQ.y - 30, "4 x 4", on(t, cSquared, 0.4) * (1 - on(t, cSquared2, 0.4)), { size: 26, col: P.line });

    /* the equation, once "sixteen" is said, and staying up for the rest of
       the chapter (phase 1 and 2 both come after it) */
    var eqO = on(t, cSixteen, 0.5);
    if (eqO > 0) out += MK.pill(SQ.x + SQ.cell * 2, SQ.y - 30, "4 x 4 = 16", Math.min(1, eqO) * (1 - 0.4 * scrOnly(t, scene, 2)), { size: 28, col: P.gold });

    /* the mini strip: five small squares, 1, 4, 9, 16, 25, beside the main one */
    var stripO = scrOnly(t, scene, 2);
    if (stripO > 0) {
      var ns = [1, 2, 3, 4, 5], labels = [1, 4, 9, 16, 25];
      for (k = 0; k < ns.length; k++) {
        var n = ns[k], mp2 = popIn(t, cList == null ? null : cList + k * 0.28, 0.45);
        if (!(mp2 > 0)) continue;
        var boxX = 420 + k * 140, boxY = 70, boxCell = 15;
        var s2 = "";
        for (r = 0; r < n; r++) for (cIx = 0; cIx < n; cIx++) {
          var dxy = scrDotXY(boxX, boxY, boxCell, cIx, r);
          s2 += C(dxy[0], dxy[1], boxCell * 0.32, P.gold);
        }
        s2 += Tx(boxX + n * boxCell / 2, boxY + n * boxCell + 30, String(labels[k]), "lab big", "middle", { fill: P.ink });
        out += G(s2, { opacity: Math.min(1, mp2) * stripO, transform: around(boxX + n * boxCell / 2, boxY + n * boxCell / 2, Math.min(mp2, 1.08)) });
      }
      out += Tx(420, 46, "the first square numbers", "lab mid muted readable", "start", { opacity: on(t, cFirst, 0.4) });
    }

    /* beat 3: "turn a three by three square into a four by four one" */
    var lblO = scrOnly(t, scene, 3);
    if (lblO > 0) {
      out += MK.pill(700, 130, "3 x 3", on(t, cThree3, 0.4) * lblO, { size: 30, col: P.teal });
      out += MK.pill(700, 200, "4 x 4", on(t, cFour4, 0.4) * lblO, { size: 30, col: P.gold });
    }

    /* beat 4: the L-shape counted, 3, 3, and 1 */
    var cntO = scrOnly(t, scene, 4);
    if (cntO > 0) {
      var tally7 = tally(t, cSeven, 7, 1.3);
      out += Tx(760, 100, "3 + 3 + 1", "lab big", "start", { opacity: on(t, cL, 0.5) * cntO, fill: P.gold });
      out += Tx(760, 150, "= 7 new dots", "lab big", "start", { opacity: on(t, cSeven, 0.5) * cntO, fill: P.ink });
      out += G(Tx(760, 230, String(tally7), "lab", "start", { fill: P.gold, "font-size": 70 }), { opacity: cntO * (tally7 > 0 ? 1 : 0) });
    }

    /* beat 5: "odd numbers build squares" spelled out beside the growth */
    var oddO = scrOnly(t, scene, 5);
    if (oddO > 0) {
      out += Tx(700, 60, "1 + 3 + 5 + 7", "lab big", "start", { opacity: on(t, cOdd, 0.5) * oddO, fill: P.ink });
      out += MK.list(700, 100, [
        { text: "+ 1", at: cOne1 }, { text: "+ 3", at: cThree1 }, { text: "+ 5", at: cFive1 }, { text: "+ 7", at: cSeven1 }
      ], t, { lh: 46, cls: "lab big" });
    }

    return svg(out);
  }
