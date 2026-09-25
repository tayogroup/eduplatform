
  /* ==== Real Life, part 2 ========================================================
     The chapter "Estimating first". REVISED 2026-09-25: the lesson's own
     numbers do not support a rounding-based estimate (its square/cube
     problems use small factors - 4, 5, 7, 8, 12 - and rounding one of those
     to the nearest ten gives an estimate nowhere close to the exact answer).
     What the lesson DOES do, in its own worked solution, is guess and check:
     the orange crate problem tries 4 along each edge (4 x 4 x 4 = 64, too
     few) before trying 5 (5 x 5 x 5 = 125, exact). That is a genuine
     estimate-then-check method, so this chapter teaches it with the lesson's
     own trial, rather than inventing a rounding example the small numbers
     cannot carry. */

  function rlfEstimatingChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cBefore = c(0, "before"), cGuess0 = c(0, "guess0");
    var cCrate125 = c(1, "crate125"), cCube0 = c(1, "cube0");
    var cTry4 = c(2, "try4"), cMakes64 = c(2, "makes64");
    var cToofew = c(3, "toofew"), cTry5 = c(3, "try5");
    var cMakes125 = c(4, "makes125");
    var cNotexact = c(5, "notexact"), cSensible = c(5, "sensible");
    var cCheckq = c(6, "checkq"), cMatchstory = c(6, "matchstory");
    var cCatches = c(7, "catches");
    var out = "";

    var beforeO = on(t, cBefore, 0.5);
    if (beforeO > 0) out += MK.pill(584, 30, "before the exact answer", beforeO, { size: 20, col: P.line });
    var guess0O = on(t, cGuess0, 0.5);
    if (guess0O > 0) out += MK.pill(584, 70, "make a sensible first guess", guess0O, { size: 22, col: P.gold });

    var crateO = popIn(t, cCrate125, 0.5);
    if (crateO > 0) {
      out += MK.pic(170, 150, 78, "\u{1F34A}", { opacity: Math.min(1, crateO) });
      out += Tx(170, 235, "125 oranges", "lab big", "middle", { opacity: Math.min(1, crateO), fill: P.plum });
    }
    var cubeO = on(t, cCube0, 0.5);
    if (cubeO > 0) out += MK.pill(170, 285, "a solid cube", cubeO, { size: 20, col: P.line });

    var try4O = popIn(t, cTry4, 0.5);
    if (try4O > 0) out += MK.pill(560, 120, "Try 4", Math.min(1, try4O), { size: 26, col: P.gold });
    var wrongU = rlfStep(t, cToofew, 0.6);
    var makes64O = popIn(t, cMakes64, 0.5);
    if (makes64O > 0) out += Tx(560, 180, "4 × 4 × 4 = 64", "lab big", "middle",
      { opacity: Math.min(1, makes64O), fill: wrongU > 0 ? P.bad : P.gold });
    if (wrongU > 0) out += MK.cross(560, 230, 26, wrongU, P.bad);
    var toofewO = on(t, cToofew, 0.4);
    if (toofewO > 0) out += MK.pill(560, 275, "too few", toofewO, { size: 20, col: P.bad });

    var try5O = popIn(t, cTry5, 0.5);
    if (try5O > 0) out += MK.pill(950, 120, "Try 5", Math.min(1, try5O), { size: 26, col: P.good });
    var makes125O = popIn(t, cMakes125, 0.5);
    if (makes125O > 0) out += Tx(950, 180, "5 × 5 × 5 = 125", "lab big", "middle", { opacity: Math.min(1, makes125O), fill: P.good });
    var tickO = popIn(t, cMakes125, 0.4);
    if (tickO > 0) out += MK.tick(950, 230, 26, Math.min(1, tickO));

    var notexO = on(t, cNotexact, 0.5);
    if (notexO > 0) out += MK.pill(340, 340, "not the exact answer", notexO, { size: 20, col: P.muted });
    var sensO = on(t, cSensible, 0.4);
    if (sensO > 0) out += MK.pill(340, 385, "just a sensible start", sensO, { size: 20, col: P.gold });

    var checkO = popIn(t, cCheckq, 0.4);
    if (checkO > 0) out += MK.tick(800, 340, 28, Math.min(1, checkO));
    var matchO = on(t, cMatchstory, 0.5);
    if (matchO > 0) out += MK.pill(800, 385, "close to the story?", matchO, { size: 20, col: P.good });

    var catchesO = on(t, cCatches, 0.5);
    if (catchesO > 0) out += MK.pill(584, 415, "catches a mistake before you finish", catchesO, { size: 19, col: P.accent });

    return svg(out);
  }
