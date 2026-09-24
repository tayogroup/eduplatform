  /* ==== How Much, How Long, part 2 ===========================================
     The chapters "Reading a ruler" and "Choosing a unit".

     Both are built on ART.ruler, so the centimetres on screen are the
     library's, the same ones the lesson's own ruler step draws. hmlRX maps a
     centimetre to a place on the film's 1168 x 440 stage THROUGH the ruler's
     own geometry (side margin 34, 42 px a centimetre at length 10), so a ring
     that marks the 8 marks the drawing's own 8 rather than a guess.

     Anything drawn ON the ruler's white card takes a colour from ART.C, the
     lessons' light palette; anything on the film's dark stage takes one from
     P. The film's gold is unreadable on white and the lessons' ink is
     unreadable on the stage. */

  /* ---- the ruler chapter's geometry -----------------------------------------
     ART.ruler at length 10 with something lying on it draws a card 488 x 186,
     placed 820 wide at (174, 40), so it spans x 174 to 994 and y 40 to 352. */
  var HML_R = { x: 174, y: 40, w: 820, s: 820 / 488, edge: 34, pitch: 42, len: 10 };
  function hmlRX(v) { return HML_R.x + (HML_R.edge + v * HML_R.pitch) * HML_R.s; }
  function hmlRY(cardY) { return HML_R.y + cardY * HML_R.s; }
  var HML_RY = {
    item: hmlRY(34),      /* the middle of the thing lying on the ruler */
    top: hmlRY(70),       /* the ruler's own top edge */
    tick: hmlRY(92),      /* where a centimetre tick ends */
    number: hmlRY(107),   /* the row of printed numbers */
    below: hmlRY(150)     /* clear white card under the ruler */
  };

  function hmlRulerCard(item) {
    return ART.place(ART.ruler({ length: HML_R.len, unit: "cm", item: item }),
      HML_R.x, HML_R.y, HML_R.w, HML_R.w * 186 / 488);
  }

  function hmlRulerChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRuler = c(0, "ruler"), cCm = c(0, "cm"), cMarks = c(0, "marks");
    var cZero = c(1, "zero"), cOne = c(1, "one");
    var cRead = c(2, "read"), cEight = c(2, "eight");
    var cLong = c(3, "long"), cMeas = c(3, "measured");
    var cDraw = c(4, "draw"), cStart = c(4, "start"), cStop = c(4, "stop");
    var out = "";

    /* Beats 1 to 4: the pencil. It starts lying on the 1, the mistake the
       lesson names, and slides down to the 0 as "with the 0" is said. */
    var slide = on(t, cZero, 0.6), a = 1 - slide;
    var pencil = { from: a, to: a + 8, colour: "teal",
      label: on(t, cLong, 0.25) > 0.5 ? "8 cm" : "pencil" };

    /* Beat 5: the line the child draws, growing from the 0 to the 6. */
    var grow = cStart == null || cStop == null ? 0 : clamp((t - cStart) / Math.max(cStop - cStart, 0.3), 0, 1);
    var line = { from: 0, to: Math.max(0.05, 6 * grow), colour: "plum", label: grow >= 1 ? "6 cm" : " " };

    var toLine = hmlFrom(t, scene, 4);
    if (toLine < 1) out += G(hmlRulerCard(pencil), { opacity: 1 - toLine });
    if (toLine > 0) out += G(hmlRulerCard(line), { opacity: toLine });

    /* ---- beat 1: it measures in centimetres, and the marks are all alike --- */
    var first = hmlOnly(t, scene, 0);
    var mo = on(t, cMarks, 0.5) * first;
    if (mo > 0) for (var k = 0; k < HML_R.len; k++) {
      out += R(hmlRX(k) + 2, HML_RY.top + 3, hmlRX(1) - hmlRX(0) - 4, HML_RY.tick - HML_RY.top - 6, 3,
        "none", ART.C.accent, 3, { opacity: 0.9 * mo });
    }
    out += MK.pill(hmlRX(5), 396, "centimetres", on(t, cCm, 0.4) * first, { size: 30, col: P.gold });
    out += MK.ripple(hmlRX(0), HML_RY.number, t, cRuler, ART.C.accent);

    /* ---- beat 2: line the end up with the 0, not with the 1 ---- */
    var two = hmlOnly(t, scene, 1);
    if (two > 0) {
      out += G(C(hmlRX(0), HML_RY.number, 25, "none", ART.C.good, 5, { opacity: on(t, cZero, 0.4) }) +
        MK.arrow(hmlRX(1), HML_RY.below, lerp(hmlRX(1), hmlRX(0) + 3, on(t, cZero, 0.5)), HML_RY.below,
          on(t, cZero, 0.5), ART.C.good, 7) +
        MK.cross(hmlRX(1), HML_RY.number, 23, popIn(t, cOne, 0.4)), { opacity: two });
      out += MK.pill(hmlRX(5), 396, "start at the 0", on(t, cZero, 0.4) * two, { size: 29, col: P.good });
    }

    /* ---- beat 3: read the number where the pencil ends ---- */
    var three = hmlOnly(t, scene, 2);
    if (three > 0) {
      out += G(MK.arrow(hmlRX(8), HML_RY.below + 34, hmlRX(8), lerp(HML_RY.below + 34, HML_RY.number + 30, on(t, cRead, 0.6)),
          on(t, cRead, 0.6), ART.C.accent, 7) +
        C(hmlRX(8), HML_RY.number, 25, "none", ART.C.accent, 5, { opacity: on(t, cEight, 0.4) }), { opacity: three });
      out += MK.ripple(hmlRX(8), HML_RY.number, t, cEight, ART.C.accent);
      out += MK.pill(hmlRX(5), 396, "read where it ends", on(t, cRead, 0.4) * three, { size: 29, col: P.accent });
    }

    /* ---- beat 4: so it is 8 centimetres long ---- */
    var four = hmlOnly(t, scene, 3);
    if (four > 0) {
      var so = on(t, cLong, 0.6);
      out += G(L(hmlRX(0), HML_RY.below, lerp(hmlRX(0), hmlRX(8), so), HML_RY.below, ART.C.good, 6) +
        L(hmlRX(0), HML_RY.below - 12, hmlRX(0), HML_RY.below + 12, ART.C.good, 6) +
        L(hmlRX(8), HML_RY.below - 12, hmlRX(8), HML_RY.below + 12, ART.C.good, 6, { opacity: so }), { opacity: four });
      out += MK.pill(hmlRX(5), 396, "8 centimetres long", so * four, { size: 32, col: P.good });
      out += MK.tick(1078, 196, 30, popIn(t, cMeas, 0.4) * four);
    }

    /* ---- beat 5: now draw one yourself, from the 0 to the 6 ---- */
    if (toLine > 0) {
      out += G(MK.pill(hmlRX(5), 396, "draw it yourself", on(t, cDraw, 0.4) * (1 - on(t, cStop, 0.5)),
        { size: 29, col: P.plum }), { opacity: toLine });
      if (grow > 0 && grow < 1) out += C(hmlRX(6 * grow), HML_RY.item, 12, ART.C.plum, ART.C.card, 3);
      out += MK.ripple(hmlRX(6), HML_RY.number, t, cStop, ART.C.plum);
      out += G(MK.pill(hmlRX(5), 396, "6 centimetres long", on(t, cStop == null ? null : cStop + 0.4, 0.4),
          { size: 32, col: P.plum }) +
        MK.tick(1078, 196, 30, popIn(t, cStop == null ? null : cStop + 0.55, 0.4)), { opacity: toLine });
    }
    return svg(out);
  }

  /* ==== chapter: choosing a unit =================================================
     The lesson's "Which unit?" step, in its own pairs: centimetres for a
     LONGER pencil (not the one measured in the ruler chapter - about 15 cm
     against that one's 8 cm, so it is named differently here to avoid
     re-using "the pencil" for two different lengths) and metres for a door,
     grams for an apple and kilograms for a school bag, millilitres for a
     spoonful of medicine and litres for a bath. A strip of the six units sits
     under the whole chapter and each lights as it is said, so the chapter
     ends on the set the child chooses from. */
  var HML_UNITS = ["cm", "m", "g", "kg", "ml", "l"];
  function hmlChipX(k) { return 584 + (k - 2.5) * 122; }

  function hmlUnitStrip(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var lit = [c(0, "cm"), c(1, "m"), c(2, "grams"), c(2, "kg"), c(3, "spoon"), c(3, "bath")];
    var born = on(t, c(0, "choose"), 0.5), out = "";
    if (born <= 0) return "";
    for (var k = 0; k < HML_UNITS.length; k++) {
      var o = on(t, lit[k], 0.4) > 0.5;
      out += MK.pill(hmlChipX(k), 414, HML_UNITS[k], born, {
        size: 28, col: o ? P.gold : P.line, fill: o ? "#3A3016" : P.card, ink: o ? P.gold : P.muted
      });
    }
    return out;
  }

  /* one picture per beat, in the band above the strip (y 52 to 382) */
  function hmlUnitPic(k, t, scene) {
    var c = function (b, n) { return sc(scene, b, n); };
    var out = "";
    if (k === 0) {
      /* a pencil on a 20 cm ruler, lying from the 0 to the 15 */
      out += ART.place(ART.ruler({ length: 15, unit: "cm", item: { from: 0, to: 15, label: "about 15 cm" } }),
        234, 52, 700, 700 * 186 / 503);
      out += MK.pill(584, 356, "a longer pencil: centimetres", on(t, c(0, "pencil"), 0.4), { size: 29, col: P.gold });
      return out;
    }
    if (k === 1) {
      /* a door exactly as tall as the 2 m tick drawn beside it */
      var floor = 330, twoM = 56, oneM = (floor + twoM) / 2;
      out += R(496, twoM, 168, floor - twoM, 10, "#7A5230", "#C08B52", 4);
      out += R(516, twoM + 20, 128, 104, 6, "#8E6138");
      out += R(516, twoM + 144, 128, 148, 6, "#8E6138");
      out += C(640, oneM + 26, 9, P.gold);
      out += L(430, floor, 430, twoM, P.gold, 4);
      out += L(414, floor, 446, floor, P.gold, 4) + L(414, oneM, 446, oneM, P.gold, 3) + L(414, twoM, 446, twoM, P.gold, 4);
      out += Tx(402, floor + 8, "0 m", "lab mid gold", "end");
      out += Tx(402, oneM + 8, "1 m", "lab mid gold", "end");
      out += Tx(402, twoM + 8, "2 m", "lab mid gold", "end");
      out += MK.pill(584, 356, "a door: about 2 metres", on(t, c(1, "door"), 0.4), { size: 29, col: P.gold });
      return out;
    }
    if (k === 2) {
      out += MK.pop(Em(392, 176, 150, "\u{1F34E}"), 392, 176, popIn(t, c(2, "apple"), 0.45));
      out += MK.pill(392, 300, "light: grams", on(t, c(2, "grams"), 0.4), { size: 28, col: P.good });
      out += MK.pop(Em(790, 172, 174, "\u{1F392}"), 790, 172, popIn(t, c(2, "bag"), 0.45));
      out += MK.pill(790, 300, "heavy: kilograms", on(t, c(2, "kg"), 0.4), { size: 28, col: P.accent });
      return out;
    }
    out += MK.pop(Em(392, 176, 150, "\u{1F944}"), 392, 176, popIn(t, c(3, "spoon"), 0.45));
    out += MK.pill(392, 300, "a spoonful: millilitres", on(t, c(3, "spoon"), 0.4), { size: 26, col: P.teal });
    out += MK.pop(Em(790, 172, 174, "\u{1F6C1}"), 790, 172, popIn(t, c(3, "bath"), 0.45));
    out += MK.pill(790, 300, "a bath: litres", on(t, c(3, "bath"), 0.4), { size: 26, col: P.blue });
    return out;
  }

  function hmlUnitChapter(scene, beat, t, i) {
    var out = "";
    for (var k = 0; k < 4; k++) {
      var o = hmlOnly(t, scene, k);
      if (o > 0.002) out += G(hmlUnitPic(k, t, scene), { opacity: clamp(o, 0, 1) });
    }
    return svg(out + hmlUnitStrip(t, scene));
  }
