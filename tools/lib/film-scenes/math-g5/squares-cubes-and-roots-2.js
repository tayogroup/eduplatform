
  /* ==== Squares, Cubes and Roots, part 2 =========================================
     The chapters "Square roots" and "Cube numbers". */

  /* ==== chapter: square roots =====================================================
     Beats 0-1: the lesson's own Step 3 arithmetic, at Step 3's own default
     (num3 = 50, from its NUMS3 chip list) - the biggest square under fifty is
     forty nine (a static 7 x 7), with the one dot that does not fit drawn
     loose beside it, exactly as "one dot is left over" says. An earlier draft
     of this beat invented 15/9/6, numbers Step 3 cannot even select. Beats 2:
     the twelve squares to know by heart (Step 3's note). Beats 3-4: a second,
     separate 7 x 7 dot square answers "what is the square root of forty
     nine" (Step 4) - the same 49 the first square in this chapter already
     named, which is the lesson's own arithmetic lining up rather than a
     repeated picture. */
  var SR = { x: 70, y: 86, cell: 34 };

  function scrSqrootsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cNot = c(0, "not"), cSq = c(0, "sq");
    var cBig = c(1, "big"), cFortyNine = c(1, "fortynine"), cOneLeft = c(1, "oneleft");
    var cKnow = c(2, "know"), cUpto = c(2, "uptolist");
    var cSevenSq = c(3, "sevensq"), cRoot = c(3, "root");
    var cRootAns = c(4, "rootans"), cUndo = c(4, "undo");
    var out = "", k, r, cIx;

    var leftO = scrFrom(t, scene, 0) * (1 - scrFrom(t, scene, 2));
    if (leftO > 0) {
      /* the 7 x 7 (49) that fits, static once "the biggest square" starts,
         so the complete square is on screen before the one left-over dot
         arrives */
      var fortyNineO = on(t, cBig, 0.5);
      if (fortyNineO > 0) for (r = 0; r < 7; r++) for (cIx = 0; cIx < 7; cIx++) {
        var xy = scrDotXY(SR.x, SR.y, SR.cell, cIx, r);
        out += C(xy[0], xy[1], SR.cell * 0.3, P.teal, null, null, { opacity: fortyNineO });
      }
      out += R(SR.x - 3, SR.y - 3, SR.cell * 7 + 6, SR.cell * 7 + 6, 8, "none", P.teal, 2, { opacity: fortyNineO });
      out += MK.pill(SR.x + SR.cell * 3.5, SR.y - 34, "49", on(t, cFortyNine, 0.4), { size: 30, col: P.teal });

      /* the one dot that does not fit, loose, to the right */
      var lx = SR.x + SR.cell * 7 + 50, ly = SR.y + SR.cell * 3.5;
      var lp = popIn(t, cOneLeft, 0.4);
      if (lp > 0) out += G(C(lx, ly, SR.cell * 0.3, P.bad), { transform: around(lx, ly, Math.min(lp, 1.1)), opacity: Math.min(1, lp) });
      out += MK.pill(lx, ly + 54, "1 left over", on(t, cOneLeft, 0.4), { size: 26, col: P.bad });
      out += Tx(SR.x, SR.y + SR.cell * 7 + 56, "50 is not a square number", "lab big", "start", { opacity: on(t, cSq, 0.5) * (1 - on(t, cBig, 0.4)) });
    }

    /* beat 2: the twelve squares to know, a 4 x 3 grid of numbers */
    var knowO = scrOnly(t, scene, 2);
    if (knowO > 0) {
      var sqs = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
      out += Tx(120, 60, "the squares to know", "lab mid muted readable", "start", { opacity: on(t, cKnow, 0.4) });
      for (k = 0; k < sqs.length; k++) {
        var kp = popIn(t, cUpto == null ? null : cUpto + k * 0.09, 0.4);
        if (!(kp > 0)) continue;
        var kx = 120 + (k % 4) * 240, ky = 110 + Math.floor(k / 4) * 90;
        out += G(MK.pill(kx, ky, String(sqs[k]), 1, { size: 28, col: k === sqs.length - 1 ? P.gold : P.line }),
          { opacity: Math.min(1, kp) * knowO, transform: around(kx, ky, Math.min(kp, 1.08)) });
      }
    }

    /* beats 3-4: a 7 x 7 dot square, asking then answering "how many per side" */
    var gridO = scrFrom(t, scene, 3);
    if (gridO > 0) {
      var GX = 470, GY = 60, GC = 28;
      var built = t >= scrBeatStart(scene, 3);
      var dotsO = popIn(t, cSevenSq, 0.55);
      if (built && dotsO > 0) for (r = 0; r < 7; r++) for (cIx = 0; cIx < 7; cIx++) {
        var gxy = scrDotXY(GX, GY, GC, cIx, r);
        out += C(gxy[0], gxy[1], GC * 0.3, P.blue, null, null, { opacity: Math.min(1, dotsO) });
      }
      out += R(GX - 3, GY - 3, GC * 7 + 6, GC * 7 + 6, 8, "none", P.blue, 2, { opacity: Math.min(1, dotsO) });
      out += MK.pill(GX + GC * 3.5, GY - 30, "49 dots", on(t, cSevenSq, 0.4), { size: 30, col: P.blue });

      var qO = on(t, cRoot, 0.5) * (1 - on(t, cRootAns, 0.4));
      out += MK.qmark(GX + GC * 7 + 40, GY + GC * 3.5, 26, qO);
      out += Tx(GX + GC * 7 + 40, GY + GC * 3.5 + 46, "per side?", "lab mid muted readable", "middle", { opacity: qO });

      var aO = popIn(t, cRootAns, 0.5);
      if (aO > 0) {
        out += G(Tx(GX + GC * 7 + 40, GY + GC * 3.5 + 12, "7", "lab", "middle", { fill: P.gold, "font-size": 64 }),
          { opacity: Math.min(1, aO), transform: around(GX + GC * 7 + 40, GY + GC * 3.5, Math.min(aO, 1.1)) });
        out += MK.pill(GX + GC * 3.5, GY + GC * 7 + 34, "the square root of 49 is 7", Math.min(1, aO), { size: 26, col: P.gold });
      }
      var undoO = on(t, cUndo, 0.6);
      if (undoO > 0) {
        var ux = GX + GC * 7 + 130, uy = GY + GC * 3.5;
        out += scrLoop(ux, uy, 60, undoO);
        out += Tx(ux, uy - 76, "square", "lab mid", "middle", { opacity: undoO, fill: P.blue });
        out += Tx(ux, uy + 84, "root", "lab mid", "middle", { opacity: undoO, fill: P.gold });
      }
    }
    return svg(out);
  }

  /* a small looping double arrow, for "squaring undoes rooting": two curved
     arrows chasing each other round a circle */
  function scrLoop(cx, cy, r, o) {
    if (!(o > 0)) return "";
    var out = "";
    out += Pth("M" + n2(cx - r) + "," + n2(cy) + " A" + n2(r) + "," + n2(r) + " 0 1,1 " + n2(cx + r) + "," + n2(cy), null, P.blue, 4, { opacity: o });
    out += Pth("M" + n2(cx + r) + "," + n2(cy) + " A" + n2(r) + "," + n2(r) + " 0 1,1 " + n2(cx - r) + "," + n2(cy), null, P.gold, 4, { opacity: o });
    return G(out, { opacity: o });
  }

  /* ==== chapter: cube numbers ====================================================
     A stack of flat layers, drawn as offset squares of small blocks so the
     film's flat viewport still reads as depth: layer k sits cbDX * k right and
     cbDY * (layers - 1 - k) up from the bottom layer, exactly the geometry the
     title motif's own cube uses at a smaller scale. One layer in beat 0
     ("multiplies a number by itself"), all three by the end of beat 1
     ("three times", = 27), and it stays built for the rest of the chapter. */
  var CB = { x: 120, y: 130, cell: 34, dx: 30, dy: 24, n: 3 };
  function scrCubeLayer(x0, y0, cell, n, colour, opacity) {
    var s = "", r, cIx;
    for (r = 0; r < n; r++) for (cIx = 0; cIx < n; cIx++) {
      var lxy = scrDotXY(x0, y0, cell, cIx, r);
      s += R(lxy[0] - cell * 0.42, lxy[1] - cell * 0.42, cell * 0.84, cell * 0.84, 3, colour, "#123247", 1.4);
    }
    return G(s, { opacity: opacity });
  }

  function scrCubesChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCubedef = c(0, "cubedef"), cThree = c(0, "three");
    var cThreeCubed = c(1, "threecubed"), cAnswer = c(1, "answer");
    var cNotplus = c(2, "notplus"), cNottimes = c(2, "nottimes");
    var cSquare2 = c(3, "square2"), cLayers = c(3, "layers");
    var cLayer2 = c(4, "layer2"), cNine2 = c(4, "nine2");
    var out = "", layer;

    /* layer 0 (bottom) shows from beat 0; layers 1 and 2 pop in through beat 1 */
    var l0 = on(t, cCubedef, 0.5);
    var l1 = popIn(t, cThreeCubed, 0.5);
    var l2 = popIn(t, cAnswer, 0.5);
    var lo = [l0, l1, l2];
    var colBottom = P.teal, colMid = P.blue, colTop = P.accent;
    var cols = [colBottom, colMid, colTop];
    for (layer = 0; layer < 3; layer++) {
      if (!(lo[layer] > 0)) continue;
      var lx = CB.x + layer * CB.dx, ly = CB.y - layer * CB.dy;
      out += G(scrCubeLayer(lx, ly, CB.cell, 3, cols[layer], Math.min(1, lo[layer])),
        { transform: around(lx + CB.cell * 1.5, ly + CB.cell * 1.5, Math.min(lo[layer], 1.08)) });
    }
    out += MK.pill(CB.x + CB.dx * 2 + CB.cell * 1.5, CB.y - CB.dy * 2 - 40, "3 x 3 x 3", on(t, cThree, 0.4) * (1 - popIn(t, cAnswer, 0.4)), { size: 26, col: P.line });
    var ansO = on(t, cAnswer, 0.5);
    if (ansO > 0) out += MK.pill(CB.x + CB.dx * 2 + CB.cell * 1.5, CB.y - CB.dy * 2 - 40, "= 27", ansO, { size: 34, col: P.accent });

    /* beat 2: the two common wrong answers, crossed out */
    var wrongO = scrOnly(t, scene, 2);
    if (wrongO > 0) {
      var w1 = popIn(t, cNotplus, 0.4), w2 = popIn(t, cNottimes, 0.4);
      if (w1 > 0) {
        out += MK.pill(520, 130, "3 + 3 + 3 = 9", Math.min(1, w1), { size: 26, col: P.bad });
        out += MK.cross(760, 130, 22, w1, P.bad);
      }
      if (w2 > 0) {
        out += MK.pill(520, 210, "3 x 3 = 9", Math.min(1, w2), { size: 26, col: P.bad });
        out += MK.cross(760, 210, 22, w2, P.bad);
      }
    }

    /* beat 3: "a square, stacked three layers high" - a brace up the side */
    var braceO = scrOnly(t, scene, 3);
    if (braceO > 0) {
      var bO = on(t, cLayers, 0.5);
      if (bO > 0) {
        var bx = CB.x + CB.dx * 2 + CB.cell * 3 + 40;
        out += L(bx, CB.y - CB.dy * 2, bx, CB.y + CB.cell * 3, P.gold, 4, { opacity: bO });
        out += L(bx - 8, CB.y - CB.dy * 2, bx + 8, CB.y - CB.dy * 2, P.gold, 4, { opacity: bO });
        out += L(bx - 8, CB.y + CB.cell * 3, bx + 8, CB.y + CB.cell * 3, P.gold, 4, { opacity: bO });
        out += Tx(bx + 20, CB.y + CB.cell * 1.2, "3 layers", "lab big", "start", { opacity: bO, fill: P.gold });
      }
      out += MK.pill(600, 300, "a square, stacked", on(t, cSquare2, 0.4) * braceO, { size: 26, col: P.line });
    }

    /* beat 4: each layer, nine blocks */
    var eachO = scrOnly(t, scene, 4);
    if (eachO > 0) {
      var ringO = on(t, cLayer2, 0.5);
      if (ringO > 0) out += R(CB.x + CB.dx * 2 - 4, CB.y - CB.dy * 2 - 4, CB.cell * 3 + 8, CB.cell * 3 + 8, 6, "none", P.gold, 4, { opacity: ringO });
      out += MK.pill(700, 380, "9 blocks", on(t, cNine2, 0.4) * eachO, { size: 28, col: P.gold });
    }
    return svg(out);
  }
