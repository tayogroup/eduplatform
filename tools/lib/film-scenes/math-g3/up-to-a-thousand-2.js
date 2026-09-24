  /* ==== chapters: break it apart, and another way to break it ==================
     tools/lib/film-scenes/math-g3/up-to-a-thousand-2.js. Both are 3Np.03. */

  /* ---- break it apart ---------------------------------------------------------
     The lesson's "Break it apart" step. 348 comes apart into 300, 40 and 8 -
     three parts, because 300 + 40 + 8 = 348 - and then the lesson's own zero
     case: 307 has no tens, so its parts are 300 and 7 and the 0 holds the tens
     column open. ART.placeValue({value: 307}) draws 3 flats, no rods and 7
     cubes, which is 307. */
  var UTW_A = {
    big: { x: 584, y: 142, size: 96 },
    parts: [{ x: 330, s: "300" }, { x: 584, s: "40" }, { x: 838, s: "8" }],
    plus: [457, 711],
    boxW: 170, boxH: 82, boxY: 252
  };
  var UTW_307 = { x: 40, y: 50 };

  function utwApartChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cApart = c(0, "apart"), cDec = c(0, "dec");
    var partAt = [c(1, "h"), c(1, "t"), c(1, "o")];
    var cBack = c(2, "back"), cAgain = c(2, "again");
    var cLost = c(3, "lost"), cZero = c(3, "zero"), cN307 = c(3, "n307");
    var cParts = c(4, "parts"), cHold = c(4, "hold");
    var out = "", n;

    /* The two halves of the chapter: 348 taken apart, then the zero in 307. The
       swap waits for "307" rather than for "Watch a zero", so the first half is
       still on screen while the voice is still talking about it; "Watch a zero"
       gets its own mark on the first half instead. */
    var toZero = on(t, cN307, 0.5);
    var a = "", b = "";

    /* --- 348 and its three parts --- */
    var bo = 0.4 + 0.6 * on(t, cApart, 0.5);
    var glow = on(t, cAgain, 0.5);
    /* 104, not 150: a glow is a disc, so a bigger one round a number this high up
       the stage hangs 40 px above the box (--sweep found it, at 49.4 s). */
    a += MK.glow(UTW_A.big.x, UTW_A.big.y - 32, 104, P.gold, glow * (0.6 + 0.4 * breathe(t)));
    a += Tx(UTW_A.big.x, UTW_A.big.y, "348", "lab huge", "middle",
      { "font-size": UTW_A.big.size, opacity: bo, transform: around(UTW_A.big.x, UTW_A.big.y - 32, 1 + 0.06 * bump(t, cAgain, 0.8)) });
    /* above the number, not below it: the three arrows of "back together" all
       converge on the number from below and went straight through it there. */
    a += MK.pill(UTW_A.big.x, 42, "decomposing", popIn(t, cDec, 0.4), { size: 28, col: P.gold, ink: P.gold });

    for (n = 0; n < 3; n++) {
      var po = popIn(t, partAt[n], 0.4);
      if (po <= 0) continue;
      var px = UTW_A.parts[n].x;
      a += MK.pop(R(px - UTW_A.boxW / 2, UTW_A.boxY, UTW_A.boxW, UTW_A.boxH, 18, P.cell, P.blue, 3) +
        Tx(px, UTW_A.boxY + 56, UTW_A.parts[n].s, "lab huge", "middle", { "font-size": 46 }),
        px, UTW_A.boxY + UTW_A.boxH / 2, Math.min(1, po));
      if (n > 0) a += Tx(UTW_A.plus[n - 1], UTW_A.boxY + 54, "+", "lab huge", "middle",
        { "font-size": 40, fill: P.muted, opacity: Math.min(1, po) });
    }
    /* "back together": each part travels back into the number */
    var back = on(t, cBack, 0.6);
    if (back > 0) {
      a += MK.arrow(UTW_A.parts[0].x, UTW_A.boxY - 8, 540, UTW_A.big.y - 6, back, P.gold, 6);
      a += MK.arrow(UTW_A.parts[1].x, UTW_A.boxY - 8, 584, UTW_A.big.y - 6, back, P.gold, 6);
      a += MK.arrow(UTW_A.parts[2].x, UTW_A.boxY - 8, 628, UTW_A.big.y - 6, back, P.gold, 6);
    }
    /* "Nothing is lost", and then "Watch a zero" */
    var lost = popIn(t, cLost, 0.4);
    if (lost > 0) {
      a += Tx(1040, 392, "nothing lost", "lab big", "middle", { fill: P.good, opacity: Math.min(1, lost) });
      a += MK.tick(1040, 336, 26, lost);
    }
    var watch = popIn(t, cZero, 0.4);
    if (watch > 0) {
      a += MK.pop(C(190, 356, 52, P.cell, P.gold, 4) + Tx(190, 378, "0", "lab huge", "middle", { "font-size": 66, fill: P.gold }),
        190, 356, Math.min(1, watch));
      a += Tx(190, 430, "watch a zero", "lab mid muted", "middle", { opacity: Math.min(1, watch) });
    }

    /* --- 307: the holding zero --- */
    var arrive = popIn(t, cN307, 0.5);
    if (arrive > 0) {
      b += G(ART.place(ART.placeValue({ value: 307, lit: "tens", label: "307" }), UTW_307.x, UTW_307.y, UTW_PV.w, UTW_PV.h),
        { transform: around(UTW_307.x + UTW_PV.w / 2, UTW_307.y + UTW_PV.h / 2, Math.min(1, arrive)), opacity: Math.min(1, arrive) });
    }
    var hold = on(t, cHold, 0.5);
    if (hold > 0) {
      var tensMid = UTW_307.x + utwPvMidX(1);
      b += R(UTW_307.x + utwPvColX(1), UTW_307.y + UTW_PV.edge, UTW_PV.cw, 234, 18, "none", P.gold, 3, { opacity: hold });
      b += L(tensMid, 376, tensMid, UTW_307.y + UTW_PV.edge + 240, P.gold, 3, { opacity: hold, "stroke-dasharray": "8 6" });
      b += Tx(tensMid, 412, "the 0 holds the column open", "lab big", "middle", { fill: P.gold, opacity: hold });
    }
    var pr = popIn(t, cParts, 0.4);
    if (pr > 0) {
      b += Tx(880, 180, "300 + 7", "lab huge", "middle", { "font-size": 62, opacity: Math.min(1, pr) });
      b += Tx(880, 224, "no tens at all", "lab mid muted", "middle", { opacity: Math.min(1, pr) });
    }

    out += G(a, { opacity: 1 - toZero }) + G(b, { opacity: toZero });
    return svg(out);
  }

  /* ---- another way to break it ------------------------------------------------
     The lesson's "Another way to break it" step, whose base is 348 and whose
     button moves one hundred across. ART.placeValue takes 0 to 9 in a column,
     so fourteen tens is drawn here, with the blocks from part one.

     THE COUNT, EVERY FRAME. Before: 3 flats, 4 rods, 8 cubes, and 300 + 40 + 8
     = 348. After: 2 flats (the third has crossed), 4 + 10 = 14 rods, 8 cubes,
     and 200 + 140 + 8 = 348. The same total, both times. */
  var UTW_R = {
    bays: [
      { x: 24, w: 320, name: "HUNDREDS" },
      { x: 364, w: 440, name: "TENS" },
      { x: 824, w: 320, name: "ONES" }
    ],
    top: 60, bayH: 290,
    flat: { size: 78, pitch: 88, x0: 57, y: 190 },
    rod: { w: 14, h: 78, pitch: 22, x0: 434, y: 190 },
    cube: { size: 24, pitch: 30, x0: 867, y: 244 }
  };
  function utwBayMid(n) { return UTW_R.bays[n].x + UTW_R.bays[n].w / 2; }
  function utwFlatX(j) { return UTW_R.flat.x0 + j * UTW_R.flat.pitch; }
  function utwRodX(j) { return UTW_R.rod.x0 + j * UTW_R.rod.pitch; }

  function utwRegroupChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cMore = c(0, "more");
    var cOrd = c(1, "ord"), cMove = c(1, "move");
    var cCross = c(2, "cross"), cTen = c(2, "ten");
    var cFourteen = c(3, "fourteen"), cAlso = c(3, "also");
    var cSame = c(4, "same"), cReg = c(4, "reg");
    var out = "", n, j;

    /* the flat's journey, and the moment it becomes ten tens */
    var travel = clamp(on(t, cMove, 1.0) * 0.55 + on(t, cCross, 0.7) * 0.45, 0, 1);
    var fade = on(t, cTen, 0.4);
    var done = cTen != null && t >= cTen;
    var hu = done ? 2 : 3, te = done ? 14 : 4, on8 = 8;

    /* the three bays */
    for (n = 0; n < 3; n++) {
      var B = UTW_R.bays[n], mid = utwBayMid(n);
      out += R(B.x, UTW_R.top, B.w, UTW_R.bayH, 18, P.card, P.line, 2);
      out += Tx(mid, UTW_R.top + 34, B.name, "lab mid caps muted", "middle");
      var cnt = [hu, te, on8][n];
      out += Tx(mid, UTW_R.top + 96, String(cnt), "lab huge", "middle",
        { "font-size": 52, transform: around(mid, UTW_R.top + 80, 1 + 0.14 * bump(t, n === 1 ? cFourteen : null, 0.8)) });
      out += Tx(mid, UTW_R.top + 262, [hu * 100, te * 10, on8][n] + "", "lab big", "middle", { fill: P.gold });
    }

    /* the hundreds: two that stay, and one that crosses over */
    for (j = 0; j < 2; j++) out += utwFlat(utwFlatX(j), UTW_R.flat.y, UTW_R.flat.size, 1);
    /* it arcs high enough to clear the rods it is flying over: at the top of the
       arc it is 120 above its row, which is above the four tens and clear of the
       bay's own heading and count. */
    var fx = lerp(utwFlatX(2), 570, travel), fy = UTW_R.flat.y - 120 * Math.sin(Math.PI * travel);
    var half = UTW_R.flat.size / 2, route = on(t, cMove, 0.5) * (1 - fade);
    if (route > 0) {
      out += Pth("M" + n2(utwFlatX(2) + half) + "," + n2(UTW_R.flat.y + half) +
        " Q" + n2((utwFlatX(2) + 570) / 2 + half) + "," + n2(UTW_R.flat.y + half - 240) +
        " " + n2(570 + half) + "," + n2(UTW_R.flat.y + half), null, P.plum, 3,
        { opacity: 0.5 * route, "stroke-dasharray": "10 9" });
      out += MK.glow(fx + half, fy + half, 78, P.plum, 0.9 * route * (travel > 0 && travel < 1 ? 1 : 0.4));
    }
    out += utwFlat(fx, fy, UTW_R.flat.size, 1 - fade);

    /* the tens: the four that were there, and the ten the hundred became */
    for (j = 0; j < 4; j++) out += utwRod(utwRodX(j), UTW_R.rod.y, UTW_R.rod.w, UTW_R.rod.h, 1);
    if (fade > 0) {
      var pop = clamp(popIn(t, cTen, 0.45), 0, 1);
      for (j = 4; j < 14; j++) {
        out += G(utwRod(utwRodX(j), UTW_R.rod.y, UTW_R.rod.w, UTW_R.rod.h, 1),
          { transform: around(utwRodX(j) + UTW_R.rod.w / 2, UTW_R.rod.y + UTW_R.rod.h / 2, pop), opacity: fade });
      }
    }
    /* the ones: eight, untouched all the way through */
    for (j = 0; j < 8; j++) out += utwCube(UTW_R.cube.x0 + j * UTW_R.cube.pitch, UTW_R.cube.y, UTW_R.cube.size, 1);

    /* the total, which never changes */
    var expr = done ? "200 + 140 + 8 = 348" : "300 + 40 + 8 = 348";
    out += Tx(480, 402, expr, "lab huge", "middle",
      { "font-size": 40, opacity: 0.5 + 0.5 * on(t, cOrd, 0.5),
        transform: around(480, 390, 1 + 0.07 * (bump(t, cAlso, 0.9) + bump(t, cSame, 0.9))) });
    out += MK.qmark(1040, 390, 26, on(t, cMore, 0.5) * (1 - on(t, cOrd, 0.5)));
    out += MK.tick(1040, 390, 24, popIn(t, cSame, 0.4));
    out += MK.pill(846, 390, "regrouping", popIn(t, cReg, 0.4), { size: 28, col: P.plum, ink: P.plum });
    return svg(out);
  }
