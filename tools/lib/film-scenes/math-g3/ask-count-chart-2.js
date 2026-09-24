  /* ==== Ask, Count and Chart, part 2 ==========================================
     The three chapters that RECORD the travel survey and read it back:
     the tally (ART.tally, one mark at a time), the pictogram (ART.pictogram,
     with the lesson's key of two children a picture) and the bar chart
     (ART.barChart). Every number drawn here comes from AC_TRAVEL or AC_FRUIT
     in part 1, so the tally's nine, the bar's nine and the voice's nine are
     one number. The film coordinates of each drawing's insides are worked out
     from the library's own layout constants, and are named acT*, acP* and
     acB* so a moved drawing moves its marks with it. */

  /* ---- counting in fives -------------------------------------------------------
     ART.tally draws n marks in bundles of five, and its card is 375 x 124 at
     every n up to 25, so it can be placed once and simply grows. */
  var AC_TALLY = { x: 230, y: 130, w: 600, h: 198 };
  var AC_TS = AC_TALLY.h / 124;                       /* the drawing's own scale */
  function acTX(v) { return AC_TALLY.x + (AC_TALLY.w - 375 * AC_TS) / 2 + v * AC_TS; }
  function acTY(v) { return AC_TALLY.y + v * AC_TS; }
  /* the library's layout: edge 22, gh 46, pitch 11, gw 47, ggap 24, caption at h - 22 */
  var AC_T_GATE = [acTX(16), acTX(61)];               /* the fifth mark, laid across */
  var AC_T_TOP = acTY(22), AC_T_BOT = acTY(68);
  var AC_T_G0 = (AC_T_GATE[0] + AC_T_GATE[1]) / 2;    /* the bundle of five */
  var AC_T_G1 = (acTX(93) + acTX(126)) / 2;           /* the ones left over */
  var AC_T_MID = (AC_T_TOP + AC_T_BOT) / 2;
  var AC_T_CAP = [acTX(187.5), acTY(102)];            /* where the running total is written */

  /* a two-cell frequency-table row: a label and its total, in one boxed row */
  function acFreqRow(x, y, w, h, label, val, o) {
    if (!(o > 0)) return "";
    var half = w / 2;
    return G(R(x, y, w, h, 12, P.card, P.gold, 2.5) +
      L(x + half, y + 6, x + half, y + h - 6, P.line, 2.5) +
      Tx(x + half / 2, y + h / 2 + 8, label, "lab mid", "middle", { fill: P.ink }) +
      Tx(x + half + half / 2, y + h / 2 + 8, String(val), "lab mid", "middle", { fill: P.gold }),
      { opacity: clamp(o, 0, 1) });
  }

  function acTallyChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTally = c(0, "tally"), cHappening = c(0, "happening");
    var cMark = c(1, "mark"), cOne = c(1, "one"), cTwo = c(1, "two"), cThree = c(1, "three"), cFour = c(1, "four");
    var cFifth = c(2, "fifth"), cAcross = c(2, "across"), cGate = c(2, "gate");
    var cBundles = c(3, "bundles"), cLeft = c(3, "left");
    var cBundle = c(4, "bundle"), cMore = c(4, "four"), cNine = c(4, "nine");
    var cTable = c(5, "table"), cFreq = c(5, "freq");
    var out = "";

    /* when each of the nine marks is made. The first five are named one by
       one; the rest of the class arrives as the next beat comes in, so the
       bundle and the leftovers are both there to be counted when they are. */
    var rest = BEATS[scene.first + 3].start - GAP + 0.1;
    var at = [cOne, cTwo, cThree, cFour, cFifth];
    for (var k = 5; k < AC_WALK; k++) at.push(rest + (k - 5) * 0.22);
    var n = 0;
    for (k = 0; k < at.length; k++) if (at[k] != null && t >= at[k]) n = k + 1;

    /* the question this tally answers */
    out += MK.pill(584, 36, "How do we travel to school?", on(t, cTally, 0.5), { size: 26, col: P.line });

    /* the children, one for every mark made */
    for (k = 0; k < AC_WALK; k++)
      out += acChild(250 + k * 70, 95, 46, popIn(t, at[k], 0.3));

    /* the row being counted */
    out += MK.pill(152, AC_T_MID, "Walk", on(t, cMark, 0.4), { size: 28, col: P.teal });

    /* the tally itself */
    out += R(AC_TALLY.x - 8, AC_TALLY.y - 8, AC_TALLY.w + 16, AC_TALLY.h + 16, 22, P.card, P.line, 2);
    out += ART.place(ART.tally(n, { label: true }), AC_TALLY.x, AC_TALLY.y, AC_TALLY.w, AC_TALLY.h);

    /* the counting hand: a tick of light where each new mark lands */
    for (k = 0; k < Math.min(n, AC_WALK); k++) {
      var mx = k < 4 ? acTX(22 + k * 11) : k === 4 ? (AC_T_GATE[0] + AC_T_GATE[1]) / 2 : acTX(93 + (k - 5) * 11);
      out += MK.ripple(mx, AC_T_MID, t, at[k], P.gold);
    }

    /* "still happening": the survey is being taken while it is counted */
    out += MK.pill(950, 95, "as it happens", on(t, cHappening, 0.45) * (1 - on(t, cFifth, 0.6)),
      { size: 24, col: P.line });

    /* the fifth mark, laid across the other four */
    var acr = on(t, cAcross, 0.45) * (1 - on(t, cBundles, 0.6));
    if (acr > 0) out += L(AC_T_GATE[0], AC_T_BOT - 6, AC_T_GATE[1], AC_T_TOP + 6, P.gold, 8, { opacity: acr });
    out += MK.pill(AC_T_G0, 352, "a gate of five", on(t, cGate, 0.4) * (1 - on(t, cBundles, 0.6)),
      { size: 24, col: P.gold });

    /* count the bundles in fives, then the ones left over */
    var bun = on(t, cBundles, 0.45) + 0.6 * bump(t, cBundle, 0.9);
    var lef = on(t, cLeft, 0.45) + 0.6 * bump(t, cMore, 0.9);
    if (bun > 0) out += C(AC_T_G0, AC_T_MID, 60, "none", P.gold, 4, { opacity: Math.min(1, bun) });
    if (lef > 0) out += C(AC_T_G1, AC_T_MID, 48, "none", P.teal, 4, { opacity: Math.min(1, lef) });
    out += MK.pill(AC_T_G0, 352, String(AC_BUNDLES * 5), on(t, cBundles, 0.5), { size: 30, col: P.gold });
    out += MK.pill(AC_T_G1, 352, AC_LEFT + " more", on(t, cLeft, 0.5), { size: 26, col: P.teal });

    /* and the total the caption already carries, said in words */
    var no = on(t, cNine, 0.45);
    if (no > 0) out += MK.leader(880, AC_T_MID, AC_T_CAP[0] + 40, AC_T_CAP[1], on(t, cNine, 0.7), P.gold);
    out += MK.pill(1010, AC_T_MID, AC_WALK + " children walk", no, { size: 26, col: P.gold });

    /* "write it in a table too": the same total, in a frequency-table row */
    var tabO = on(t, cTable, 0.5);
    if (tabO > 0) out += acFreqRow(570, 356, 260, 72, "Walk", AC_WALK, tabO);
    out += MK.pill(700, 336, "a frequency table", on(t, cFreq, 0.5), { size: 24, col: P.gold });

    return svg(out);
  }

  /* ---- reading a pictogram -----------------------------------------------------
     ART.pictogram, the lesson's fruit survey, its key at two children a
     picture. The blown-up glyphs on the right are drawn here so the key, the
     row and the working can be shown large beside the chart. */
  var AC_PICTO = { x: 120, y: 50, w: 430, h: 370 };
  var AC_PS = AC_PICTO.w / 342;
  function acPX(v) { return AC_PICTO.x + v * AC_PS; }
  function acPY(v) { return AC_PICTO.y + (AC_PICTO.h - 294 * AC_PS) / 2 + v * AC_PS; }
  /* the library's layout: edge 22, gut 118, pitch 36, rowH 42, title 34 */
  function acPRow(i) { return [acPY(56 + i * 42), acPY(56 + (i + 1) * 42)]; }
  var AC_P_KEY = [acPX(64), acPY(260)];

  /* one pictogram picture, drawn big: a whole circle, or the left half of one */
  function acGlyph(cx, cy, r, half, o) {
    if (!(o > 0)) return "";
    var s = half
      ? Pth("M" + n2(cx) + "," + n2(cy - r) + " A" + n2(r) + "," + n2(r) + " 0 0,0 " + n2(cx) + "," + n2(cy + r) + " Z", P.teal) +
        C(cx, cy, r, "none", P.teal, 3)
      : C(cx, cy, r, P.teal);
    return G(s, { opacity: clamp(o, 0, 1) });
  }

  function acPictoChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPicto = c(0, "pictogram"), cPics = c(0, "pictures");
    var cKey = c(0, "key"), cTwo = c(0, "two");
    var cApples = c(1, "apples"), cFive = c(1, "five"), cTen = c(1, "ten");
    var cCount = c(2, "counting"), cWrong = c(2, "wrong");
    var cOranges = c(3, "oranges"), cHalf = c(3, "half"), cThree = c(3, "three");
    var out = "", k;

    var card = on(t, cPicto, 0.55);
    out += G(R(AC_PICTO.x - 8, AC_PICTO.y - 8, AC_PICTO.w + 16, AC_PICTO.h + 16, 22, P.card, P.line, 2) +
      ART.place(ART.pictogram({
        rows: AC_FRUIT, each: AC_EACH, shape: "circle", key: ["child", "children"],
        title: "Favourite fruit"
      }), AC_PICTO.x, AC_PICTO.y, AC_PICTO.w, AC_PICTO.h),
      { opacity: clamp(card, 0, 1), transform: around(AC_PICTO.x + AC_PICTO.w / 2, AC_PICTO.y + AC_PICTO.h / 2, 0.94 + 0.06 * clamp(card, 0, 1)) });

    /* "as pictures": the pictures themselves ripple, row by row */
    var pr = on(t, cPics, 0.4);
    if (pr > 0 && cPics != null) for (k = 0; k < AC_FRUIT.length; k++)
      out += MK.ripple(acPX(157 + 18), acPY(77 + k * 42), t, cPics + k * 0.16, P.teal);

    /* the key, ringed on the chart whenever it is spoken of */
    var kr = on(t, cKey, 0.45);
    if (kr > 0) out += R(acPX(28), AC_P_KEY[1] - 30, acPX(196) - acPX(28), 56, 14, "none", P.gold, 3.5,
      { opacity: Math.min(1, kr) });

    /* the right-hand working, one group per pair of beats */
    var visA = 1 - into(t, scene.first + 1);
    var visB = into(t, scene.first + 1) * (1 - into(t, scene.first + 3));
    var visC = into(t, scene.first + 3);

    /* the key, blown up: one picture is two children */
    if (visA > 0.01) {
      var a = "";
      a += acGlyph(720, 190, 34, false, popIn(t, cKey, 0.4));
      a += MK.pop(Tx(792, 204, "=", "lab huge", "middle", { fill: P.muted }), 792, 190, popIn(t, cTwo, 0.35));
      a += acChild(852, 190, 74, popIn(t, cTwo, 0.35));
      a += acChild(958, 190, 74, popIn(t, cTwo == null ? null : cTwo + 0.22, 0.35));
      a += MK.pill(866, 300, "one picture means " + AC_EACH, on(t, cTwo, 0.5), { size: 26, col: P.gold });
      out += G(a, { opacity: clamp(visA, 0, 1) });
    }

    /* apples: five pictures, two each, ten children - and the wrong answer */
    if (visB > 0.01) {
      var b = "", row = acPRow(0);
      b += R(AC_PICTO.x + 6, row[0], AC_PICTO.w - 12, row[1] - row[0], 12, "none", P.gold, 3.5,
        { opacity: on(t, cApples, 0.4) });
      for (k = 0; k < AC_APPLE_PICS; k++) {
        var gx = 700 + k * 80, go = popIn(t, cFive == null ? null : cFive + k * 0.14, 0.32);
        b += acGlyph(gx, 180, 30, false, go);
        b += MK.pop(Tx(gx, 246, String(AC_EACH), "lab big", "middle", { fill: P.muted }), gx, 238, go);
      }
      b += MK.pop(Tx(815, 320, AC_APPLE_PICS + " × " + AC_EACH, "lab huge", "middle", { fill: P.gold }),
        815, 310, popIn(t, cFive == null ? null : cFive + 0.7, 0.4));
      b += MK.pop(Tx(929, 320, "= " + AC_FRUIT[0].count, "lab huge", "middle", { fill: P.gold }),
        929, 310, popIn(t, cTen, 0.4));
      b += MK.tick(1040, 312, 24, popIn(t, cTen == null ? null : cTen + 0.35, 0.35));
      /* counting the pictures instead of reading the key */
      var wo = popIn(t, cCount, 0.4);
      b += MK.pop(Tx(830, 400, String(AC_APPLE_PICS), "lab huge", "middle", { fill: P.bad }), 830, 390, wo);
      b += MK.cross(898, 390, 24, popIn(t, cWrong, 0.4));
      out += G(b, { opacity: clamp(visB, 0, 1) });
    }

    /* oranges: one whole picture and a half */
    if (visC > 0.01) {
      var d = "", ro = acPRow(3);
      d += R(AC_PICTO.x + 6, ro[0], AC_PICTO.w - 12, ro[1] - ro[0], 12, "none", P.gold, 3.5,
        { opacity: on(t, cOranges, 0.4) });
      d += acGlyph(760, 190, 34, false, popIn(t, cOranges, 0.4));
      d += MK.pop(Tx(760, 262, String(AC_EACH), "lab big", "middle", { fill: P.muted }), 760, 254, popIn(t, cOranges, 0.4));
      d += acGlyph(900, 190, 34, true, popIn(t, cHalf, 0.4));
      d += MK.pop(Tx(900, 262, String(AC_EACH / 2), "lab big", "middle", { fill: P.muted }), 900, 254, popIn(t, cHalf, 0.4));
      d += MK.pop(Tx(840, 350, AC_ORANGE_WHOLE * AC_EACH + " + " + (AC_EACH / 2), "lab huge", "middle", { fill: P.gold }),
        840, 340, popIn(t, cHalf == null ? null : cHalf + 0.55, 0.4));
      d += MK.pop(Tx(950, 350, "= " + AC_FRUIT[3].count, "lab huge", "middle", { fill: P.gold }),
        950, 340, popIn(t, cThree, 0.4));
      out += G(d, { opacity: clamp(visC, 0, 1) });
    }

    return svg(out);
  }

  /* ---- reading a bar chart -----------------------------------------------------
     ART.barChart, the same counts as the tally, on a scale that counts in
     ones to ten. The marks on the right are worked out from the chart's own
     geometry, so the arrow that measures the difference is exactly six units
     long on the axis that is drawn. */
  var AC_BARS = { x: 90, y: 56, w: 600, h: 365 };
  var AC_BS = AC_BARS.w / 540;
  var AC_MAX = 10, AC_STEP = 1;
  function acBX(v) { return AC_BARS.x + v * AC_BS; }
  function acBY(v) { return AC_BARS.y + (AC_BARS.h - 328 * AC_BS) / 2 + v * AC_BS; }
  /* the library's layout: W 540, edge 22, gut 52, plotH 210, title 34 */
  var AC_B_X0 = 74, AC_B_X1 = 518, AC_B_Y1 = 266, AC_B_PLOT = 210;
  var AC_B_PITCH = (AC_B_X1 - AC_B_X0) / AC_TRAVEL.length;
  function acBarMid(k) { return acBX(AC_B_X0 + AC_B_PITCH * (k + 0.5)); }
  function acBarTop(k) { return acBY(AC_B_Y1 - (AC_TRAVEL[k].value / AC_MAX) * AC_B_PLOT); }
  var AC_B_BASE = acBY(AC_B_Y1);

  function acBarsChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cBars = c(0, "bars"), cTaller = c(0, "taller");
    var cBottom = c(1, "bottom"), cSide = c(1, "side");
    var cWalk = c(2, "walk"), cNine = c(2, "nine"), cCar = c(2, "car"), cThree = c(2, "three");
    var cTake = c(3, "take"), cSix = c(3, "six");
    var cAlt = c(3, "alt"), cClass = c(3, "class");
    var out = "", k;

    /* which bar the drawing itself paints in accent: one at a time */
    var hi = null;
    if (cWalk != null && t >= cWalk) hi = 0;
    if (cCar != null && t >= cCar) hi = 3;
    if (cTake != null && t >= cTake) hi = 0;
    if (cAlt != null && t >= cAlt) hi = null;

    out += R(AC_BARS.x - 8, AC_BARS.y - 8, AC_BARS.w + 16, AC_BARS.h + 16, 22, P.card, P.line, 2);
    out += ART.place(ART.barChart({
      bars: AC_TRAVEL, step: AC_STEP, max: AC_MAX, highlight: hi,
      title: "How do we travel to school?"
    }), AC_BARS.x, AC_BARS.y, AC_BARS.w, AC_BARS.h);

    /* the bars rise as they are first spoken of */
    var grow = on(t, cBars, 0.6);
    if (grow < 1) out += R(AC_BARS.x + 4, acBY(AC_B_Y1 - AC_B_PLOT) - 4,
      AC_BARS.w - 8, (AC_B_BASE - acBY(AC_B_Y1 - AC_B_PLOT)) * (1 - grow) + 4, 0, P.card);

    /* "Taller bar, more children": an arrow up the side of the tallest */
    var ta = on(t, cTaller, 0.5) * (1 - on(t, cBottom, 0.6));
    if (ta > 0) out += G(MK.arrow(748, 360, 748, 150, ta, P.gold, 7) +
      MK.pill(900, 190, "taller means more", ta, { size: 26, col: P.gold }), {});

    /* along the bottom, and up the side */
    var bo = on(t, cBottom, 0.4) * (1 - on(t, cWalk, 0.6));
    if (bo > 0) out += R(acBX(AC_B_X0), AC_B_BASE + 8, acBX(AC_B_X1) - acBX(AC_B_X0), 42, 10,
      "none", P.gold, 3.5, { opacity: bo });
    var so = on(t, cSide, 0.4) * (1 - on(t, cWalk, 0.6));
    if (so > 0) out += R(acBX(AC_B_X0) - 58, acBY(AC_B_Y1 - AC_B_PLOT) - 12, 56,
      AC_B_BASE - acBY(AC_B_Y1 - AC_B_PLOT) + 24, 10, "none", P.gold, 3.5, { opacity: so });
    if (bo > 0) out += MK.pill(900, 170, "what each bar is", bo, { size: 26, col: P.gold });
    if (so > 0) out += MK.pill(900, 240, "how many", so, { size: 26, col: P.gold });

    /* the tallest, and the shortest */
    var wo = on(t, cNine, 0.4) * (1 - on(t, cAlt, 0.6));
    var co = on(t, cThree, 0.4) * (1 - on(t, cAlt, 0.6));
    if (wo > 0) out += MK.pill(880, 140, "tallest", wo, { size: 26, col: P.gold });
    if (co > 0) out += MK.pill(1040, 140, "shortest", co, { size: 26, col: P.teal });
    if (wo > 0) out += MK.leader(840, 140, acBarMid(0) + 34, acBarTop(0), on(t, cNine, 0.6), P.gold);
    if (co > 0) out += MK.leader(1000, 160, acBarMid(3) + 34, acBarTop(3), on(t, cThree, 0.6), P.teal);

    /* nine take away three is six: the gap between the two bar tops, measured */
    var dg = on(t, cTake, 0.5) * (1 - on(t, cAlt, 0.6));
    if (dg > 0) {
      var mid = (acBarTop(0) + acBarTop(3)) / 2;
      out += L(acBarMid(0), acBarTop(0), 726, acBarTop(0), P.gold, 2.5, { "stroke-dasharray": "8 6", opacity: dg });
      out += L(acBarMid(3), acBarTop(3), 726, acBarTop(3), P.teal, 2.5, { "stroke-dasharray": "8 6", opacity: dg });
      out += MK.arrow(726, mid, 726, acBarTop(0) + 4, dg, P.gold, 6);
      out += MK.arrow(726, mid, 726, acBarTop(3) - 4, dg, P.gold, 6);
      out += MK.pop(Tx(930, 232, AC_WALK + " − " + AC_CAR + " = " + AC_DIFF, "lab huge", "middle", { fill: P.gold }),
        930, 222, popIn(t, cTake, 0.45));
      out += MK.pill(930, 300, AC_DIFF + " more walk", on(t, cSix, 0.45), { size: 26, col: P.gold });
    }

    /* altogether, twenty-two - and the six-more fact again, restated */
    var ao = on(t, cAlt, 0.5);
    if (ao > 0) {
      out += R(acBX(AC_B_X0) + 4, AC_B_BASE - 4, acBX(AC_B_X1) - acBX(AC_B_X0) - 8, 12, 6, P.gold,
        null, null, { opacity: ao * 0.8 });
      for (k = 0; k < AC_TRAVEL.length; k++)
        out += MK.ripple(acBarMid(k), acBarTop(k) - 22, t, cAlt == null ? null : cAlt + k * 0.16, P.gold);
      out += MK.pop(Tx(930, 218, AC_TRAVEL.map(function (r) { return r.value; }).join(" + ") + " = " + AC_TOTAL,
        "lab big", "middle", { fill: P.gold }), 930, 210, popIn(t, cAlt, 0.45));
      out += MK.pill(930, 292, AC_DIFF + " more walk than by car", on(t, cClass, 0.45), { size: 26, col: P.teal });
    }

    return svg(out);
  }
