  /* ==== How Much, How Long, part 3 ===========================================
     The chapters "Mass and capacity" and "Between the marks", the recap, and
     the KINDS table the engine's tail reads.

     The two quantities here are the ones the film says out loud, so both are
     drawn by the library rather than by hand: ART.balance carries the apple
     and the weights, and ART.jug's own scale decides where 300 ml sits.
     hmlBX/hmlBY and hmlJX/hmlJY map those cards' coordinates onto the film's
     stage, so a ring on "the 300 mark" is on the drawing's 300 mark. */

  /* ---- the balance ------------------------------------------------------------
     ART.balance draws a card 540 x 252, placed 760 wide at (204, 32). Its
     pivot is (270, 74) in card coordinates and each arm is 158 long, tipped
     9 degrees unless it is level - the same arithmetic the drawing uses. */
  var HML_B = { x: 224, y: 24, w: 720, s: 720 / 540 };
  function hmlBX(cx) { return HML_B.x + cx * HML_B.s; }
  function hmlBY(cy) { return HML_B.y + cy * HML_B.s; }
  function hmlPan(sign, tilt) {
    var a = tilt === "level" ? 0 : tilt === "right" ? 9 : -9, rad = (a * Math.PI) / 180;
    var ex = 270 + sign * 158 * Math.cos(rad), ey = 74 + sign * 158 * Math.sin(rad);
    return { x: hmlBX(ex), y: hmlBY(ey + 69), top: hmlBY(ey + 48) };
  }

  /* ---- the jug ----------------------------------------------------------------
     ART.jug at a capacity of 1000 in steps of 100 draws a card 278 x 328,
     placed 334 wide at (417, 22). Its scale runs Y(v) = 250 - 0.198 v in card
     coordinates, and its numbers are printed from x = 212. */
  var HML_J = { x: 440, y: 16, w: 346, s: 346 / 278 };
  function hmlJY(v) { return HML_J.y + (250 - 0.198 * v) * HML_J.s; }
  var HML_JNUM = 440 + 226 * (346 / 278);   /* the middle of a printed number */

  function hmlMassChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMass = c(0, "mass"), cBal = c(0, "balance");
    var cDown = c(1, "down"), cHeavier = c(1, "heavier");
    var cHun = c(2, "hundred"), cTwo = c(2, "twohundred"), cLevel = c(2, "level");
    var cMatch = c(3, "match"), cThree = c(3, "three");
    var cCap = c(4, "capacity"), cMark = c(4, "mark");
    var cPour = c(5, "pour"), cReach = c(5, "reach");
    var toJug = hmlFrom(t, scene, 4), out = "";

    /* ---- the balance, beats 1 to 4 ---------------------------------------- */
    if (toJug < 1) {
      var b = "";
      /* what is in the right pan: nothing, then 100, then 100 and 200 */
      var got2 = on(t, cTwo, 0.3) > 0.5, got1 = on(t, cHun, 0.3) > 0.5;
      var right = got2 ? "300" : got1 ? "100" : " ";   /* "100 + 200" ran out of the pan */
      var tilt = got2 ? "level" : "left";
      var born = on(t, cBal, 0.6);
      b += G(ART.place(ART.balance(" ", right, { tilt: tilt }), HML_B.x, HML_B.y, HML_B.w, HML_B.w * 252 / 540),
        { opacity: born });
      /* the apple sits in the left pan, wherever the beam has put it */
      var lp = hmlPan(-1, tilt);
      b += G(Em(lp.x, lp.y, 62, "\u{1F34E}"), { opacity: born });
      /* on its own first, while "mass" is said */
      b += MK.pop(Em(584, 214, 150, "\u{1F34E}"), 584, 214, popIn(t, cMass, 0.45) * (1 - born));
      b += MK.pill(584, 400, "mass: how heavy it is", on(t, cMass, 0.4) * hmlOnly(t, scene, 0), { size: 30, col: P.gold });

      /* the apple side goes down, so the apple is heavier */
      var two = hmlOnly(t, scene, 1);
      if (two > 0) {
        var dn = on(t, cDown, 0.6);
        b += G(MK.arrow(lp.x, lp.y + 52, lp.x, lerp(lp.y + 52, lp.y + 122, dn), dn, P.accent, 8), { opacity: two });
        b += MK.pill(lp.x, 408, "heavier", on(t, cHeavier, 0.4) * two, { size: 30, col: P.accent });
      }

      /* the weights going on, one at a time */
      var rp = hmlPan(1, tilt);
      b += MK.pop(MK.pill(rp.x, rp.top - 78, "100 g", 1, { size: 26, col: P.teal }), rp.x, rp.top - 78,
        popIn(t, cHun, 0.4) * (1 - on(t, cLevel, 0.6)));
      b += MK.pop(MK.pill(rp.x + 4, rp.top - 134, "200 g", 1, { size: 26, col: P.teal }), rp.x + 4, rp.top - 134,
        popIn(t, cTwo, 0.4) * (1 - on(t, cLevel, 0.6)));
      /* the beam is level: a rule straight through the pivot */
      var lv = on(t, cLevel, 0.5) * Math.max(hmlOnly(t, scene, 2), hmlOnly(t, scene, 3));
      if (lv > 0) b += L(hmlBX(60), hmlBY(74), hmlBX(480), hmlBY(74), P.good, 3,
        { "stroke-dasharray": "12 9", opacity: 0.9 * lv });
      b += MK.pill(584, 400, "100 + 200 = 300 g", on(t, cLevel, 0.4) * hmlOnly(t, scene, 2), { size: 31, col: P.good });

      /* both sides match: the apple is 300 grams */
      var four = hmlOnly(t, scene, 3);
      if (four > 0) {
        b += MK.pill(584, 400, "the apple is 300 g", on(t, cThree, 0.4) * four, { size: 33, col: P.good });
        b += G(MK.tick(hmlBX(270), hmlBY(24), 28, popIn(t, cMatch, 0.4)), { opacity: four });
      }
      out += G(b, { opacity: 1 - toJug });
    }

    /* ---- the jug, beats 5 and 6 ------------------------------------------- */
    if (toJug > 0) {
      var j = "";
      var ml = 100 * tally(t, cPour, 3, cPour == null || cReach == null ? 1.2 : Math.max(0.9, (cReach - cPour) * 0.72));
      j += ART.place(ART.jug({ capacity: 1000, step: 100, minorPer: 1, level: ml, unit: "ml" }),
        HML_J.x, HML_J.y, HML_J.w, HML_J.w * 328 / 278);
      j += MK.pill(230, 150, "capacity", on(t, cCap, 0.4), { size: 34, col: P.teal });
      j += MK.pill(230, 226, "how much it holds", on(t, cCap == null ? null : cCap + 0.4, 0.4), { size: 25, col: P.teal });
      /* each mark is 100 ml */
      var mo = on(t, cMark, 0.5) * (1 - hmlFrom(t, scene, 5));
      if (mo > 0) {
        j += C(HML_JNUM, hmlJY(100), 34, "none", ART.C.accent, 4, { opacity: mo });
        j += MK.pill(920, hmlJY(100), "one mark = 100 ml", mo, { size: 24, col: P.accent });
      }
      /* the water reaches the 300 mark */
      var ro = on(t, cReach, 0.5);
      if (ro > 0) {
        j += C(HML_JNUM, hmlJY(300), 34, "none", ART.C.good, 4, { opacity: ro });
        j += MK.pill(920, hmlJY(300), "300 ml", ro, { size: 32, col: P.good });
        j += MK.tick(920, hmlJY(300) + 74, 28, popIn(t, cReach == null ? null : cReach + 0.4, 0.4));
      }
      out += G(j, { opacity: toJug });
    }
    return svg(out);
  }

  /* ==== chapter: between the marks ===============================================
     The lesson's last measuring step, with its own scale: numbers every 10,
     one small mark halfway between each pair, and a ribbon that ends on the
     small mark between the 30 and the 40. ART.numberLine is placed at its own
     size, so hmlNX below is the drawing's own map from a value to an x, and
     the ribbon's right edge IS the 35 tick. */
  /* The drawing is asked for at 560 wide and PLACED at 1000, so its own 17 px
     figures arrive on screen at 30: a number line drawn at its natural size
     was legible and small. Card 560 x 108 at (84, 210), scale 25/14. */
  var HML_N = { x: 84, y: 210, w: 1000, cw: 560, s: 1000 / 560 };
  function hmlNX(v) { return HML_N.x + (36 + (v / 50) * 488) * HML_N.s; }
  function hmlNY(cardY) { return HML_N.y + cardY * HML_N.s; }
  var HML_NY = { rail: hmlNY(46), minor: hmlNY(58), number: hmlNY(78) };

  function hmlMarksChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLine = c(0, "line"), cNot = c(0, "not");
    var cThirty = c(1, "thirty"), cForty = c(1, "forty");
    var cSmall = c(2, "small"), cHalf = c(2, "halfway"), cWorth = c(2, "worth");
    var cRib = c(3, "ribbon"), cEnds = c(3, "ends"), cAns = c(3, "answer");
    var out = "";

    out += G(ART.place(ART.numberLine({ from: 0, to: 50, step: 5, labelEvery: 10, width: HML_N.cw }),
      HML_N.x, HML_N.y, HML_N.w, 108 * HML_N.s), { opacity: on(t, cLine, 0.6) });

    /* not every mark has a number: the five small ones, in turn */
    var no = on(t, cNot, 0.4) * hmlOnly(t, scene, 0);
    if (no > 0) for (var k = 0; k < 5; k++)
      out += MK.ripple(hmlNX(5 + k * 10), HML_NY.minor - 8, t, cNot == null ? null : cNot + k * 0.17, ART.C.plum);

    /* the two numbered marks this reading sits between */
    var two = hmlOnly(t, scene, 1);
    if (two > 0) out += G(C(hmlNX(30), HML_NY.number, 30, "none", ART.C.accent, 5, { opacity: on(t, cThirty, 0.4) }) +
      C(hmlNX(40), HML_NY.number, 30, "none", ART.C.accent, 5, { opacity: on(t, cForty, 0.4) }), { opacity: two });

    /* the small mark halfway between them, worth 5 more */
    var three = hmlOnly(t, scene, 2);
    if (three > 0) {
      var so = on(t, cSmall, 0.4), ho = on(t, cHalf, 0.5);
      out += G(C(hmlNX(35), HML_NY.minor - 10, 26, "none", ART.C.plum, 5, { opacity: so }), { opacity: three });
      out += G(MK.arrow(hmlNX(30), 196, lerp(hmlNX(30), hmlNX(35) - 10, ho), 196, ho, P.plum, 7) +
        MK.arrow(hmlNX(40), 196, lerp(hmlNX(40), hmlNX(35) + 10, ho), 196, ho, P.plum, 7), { opacity: three });
      out += MK.pill(hmlNX(35), 150, "halfway", ho * three, { size: 28, col: P.plum });
      out += MK.pill(hmlNX(35), 92, "worth 5 more, so 35", on(t, cWorth, 0.4) * three, { size: 29, col: P.plum });
    }

    /* The ribbon, ending on that mark: its right edge is hmlNX(35), which is
       where the drawing puts its own small tick, so "35" is measured. */
    var four = hmlFrom(t, scene, 3);
    if (four > 0) {
      var ro = on(t, cRib, 0.7);
      out += G(R(hmlNX(0), 140, (hmlNX(35) - hmlNX(0)) * ro, 36, 8, P.plum) +
        MK.pill(hmlNX(0) + 112, 92, "the ribbon", ro, { size: 25, col: P.plum }), { opacity: four });
      out += G(hmlDrop(hmlNX(35), 178, HML_NY.rail - 8, on(t, cEnds, 0.6), P.accent), { opacity: four });
      var ao = on(t, cAns, 0.4);
      out += G(C(hmlNX(35), HML_NY.rail, 14, ART.C.accent, ART.C.card, 4, { opacity: ao }), { opacity: four });
      out += MK.pill(944, 92, "35 centimetres", ao * four, { size: 33, col: P.good });
      out += MK.tick(1092, 184, 30, popIn(t, cAns == null ? null : cAns + 0.4, 0.4) * four);
    }
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------- */
  var HML_RECAP = MK.recapKind([
    { beat: 0, at: "zero", title: "Start at 0", sub: "line the end up first", pic: "\u{1F4CF}" },
    { beat: 0, at: "unit", title: "One unit", sub: "the same all the way", pic: "1️⃣" },
    { beat: 1, at: "small", title: "Small units", sub: "cm, g, ml", pic: "✏️" },
    { beat: 1, at: "big", title: "Big units", sub: "m, kg, l", pic: "\u{1F6AA}" },
    { beat: 2, at: "balance", title: "Mass", sub: "a balance finds it", pic: "⚖️" },
    { beat: 2, at: "jug", title: "Capacity", sub: "a jug finds it", pic: "\u{1F964}" }
  ], { goBeat: 2, goAt: "mark" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Longer, shorter, and how to measure",
      "Centimetres and metres, grams and litres",
      "Reading a scale between its marks"
    ] }),
    compare: hmlCompareChapter,
    cubes: hmlCubesChapter,
    ruler: hmlRulerChapter,
    unit: hmlUnitChapter,
    mass: hmlMassChapter,
    marks: hmlMarksChapter,
    recap: HML_RECAP
  };
