  /* ==== Grade 3 Mathematics, Lesson 6: Measure It ==============================
     tools/lib/film-scenes/math-g3/measure-it.js, with -2.js: the film's
     pictures, after the shared marks (MK) and before the engine's tail, all in
     one scope. The storyboard is
     mathematics/grade-3-app/lecture-video/measure-it.json.

     Mathematics has no lesson kit, so every instrument comes from the shared
     maths library (ART): ART.ruler for the pencil, ART.balance for the mass,
     ART.jug for the capacity and ART.numberLine for the scale being read. The
     rule this film lives or dies by is that EVERY measurement said is readable
     off the scale drawn beside it - so the pencil really does span 0 to 15 and
     then 2 to 9 on a ruler ticked in centimetres, the jugs fill to the 1000,
     300 and 500 marks of a jug whose printed numbers are drawn from those same
     arguments, and the pointer sits on the 350 mark of a line printed in
     hundreds. Nothing is judged by eye: where this file draws on top of one of
     ART's cards it maps the value through the same geometry the card was asked
     for (miLX, misX, minX below), never a guess.

     This file: the palette, the shared timing helpers, the title motif, and
     the chapters "Centimetres, metres, kilometres", "Grams and kilograms" and
     "Millilitres and litres". Every top-level name starts with mi, so nothing
     can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, length: P.blue, mass: P.plum, capacity: P.teal,
    scale: P.gold, startmark: P.accent, angles: P.good, recap: P.teal
  };

  /* ---- timing ------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function miOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function miFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 as beat k comes in, staying until beat j comes in */
  function miBetween(t, scene, k, j) {
    var a = k <= 0 ? 1 : into(t, scene.first + k);
    var z = j < scene.beats.length ? into(t, scene.first + j) : 0;
    return a * (1 - z);
  }

  /* a word in a pill with a leader line to the thing it names */
  function miLabel(t, x, y, text, at, to, opt) {
    opt = opt || {};
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = opt.col || P.gold;
    return MK.leader(x, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: opt.size || 26, anchor: opt.anchor || "middle", col: col, ink: opt.ink });
  }

  /* a double-headed measuring arrow between two points, growing from the middle */
  function miSpan(x1, y1, x2, y2, u, col, w) {
    if (!(u > 0)) return "";
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return MK.arrow(mx, my, lerp(mx, x1, u), lerp(my, y1, u), 1, col || P.gold, w || 6) +
      MK.arrow(mx, my, lerp(mx, x2, u), lerp(my, y2, u), 1, col || P.gold, w || 6);
  }

  /* ==== the title ==============================================================
     The lesson's three questions and the three instruments that answer them:
     a ruler, a balance and a jug, one arriving with each question, and their
     units arriving with "its own units". On the two cards all three stand. */
  var MI_TOOLS = [
    { pic: "\u{1F4CF}", x: 180, y: 96, unit: "cm", ux: 268, uy: 78 },
    { pic: "⚖️", x: 102, y: 244, unit: "g", ux: 40, uy: 160 },
    { pic: "\u{1F964}", x: 258, y: 244, unit: "ml", ux: 322, uy: 160 }
  ];
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var ask = sn ? [sc(sn, 0, "long"), sc(sn, 0, "heavy"), sc(sn, 0, "much")] : [null, null, null];
    var cTool = sn ? sc(sn, 1, "tool") : null, cUnits = sn ? sc(sn, 1, "units") : null,
      cScale = sn ? sc(sn, 1, "scale") : null;
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 168, P.teal, on(t, cScale, 0.7) * (0.6 + 0.4 * breathe(t)));
    MI_TOOLS.forEach(function (T, k) {
      var p = sn ? popIn(t, ask[k], 0.42) : 1;
      if (!(p > 0)) return;
      var ring = sn ? bump(t, cTool == null ? null : cTool + k * 0.22, 0.9) : 0;
      out += MK.pop(C(T.x, T.y, 52, "#17384F", P.line, 2) + Em(T.x, T.y, 62, T.pic), T.x, T.y, p);
      if (ring > 0) out += C(T.x, T.y, 56 + 4 * ring, "none", P.gold, 4, { opacity: ring });
      var uo = sn ? on(t, cUnits == null ? null : cUnits + k * 0.18, 0.4) : 1;
      if (uo > 0) out += MK.pill(T.ux, T.uy, T.unit, uo, { size: 24, col: P.gold, ink: P.gold });
    });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A ruler, a balance and a measuring jug">' + out + "</svg>";
  }

  /* ==== chapter: centimetres, metres, kilometres ================================
     ART.ruler draws a real ruler ticked every centimetre with the pencil lying
     on it from 0 to 15, so "fifteen centimetres" is read off the drawing and
     not asserted. miLX maps a centimetre value onto the film, through the same
     numbers the card was built from (edge 34, pitch floor(440 / 15) = 29). */
  var MI_L = { x: 40, y: 40, w: 700, W: 503, H: 186, pitch: 29, edge: 34 };
  MI_L.k = MI_L.w / MI_L.W;
  MI_L.h = MI_L.H * MI_L.k;
  function miLX(v) { return MI_L.x + (MI_L.edge + MI_L.pitch * v) * MI_L.k; }
  function miLY(yy) { return MI_L.y + yy * MI_L.k; }

  /* the two unit facts, as equations that arrive a pill at a time */
  function miLadder(t, cH, cM, cT, cK, lit) {
    var out = "", rowA = 112, rowB = 224, lx = 812, rx = 1058;
    var oA = on(t, cH, 0.4), oA2 = on(t, cM, 0.4), oB = on(t, cT, 0.4), oB2 = on(t, cK, 0.4);
    if (oA2 > 0 && oB > 0) out += L(rx, rowA + 26, lx, rowB - 26, P.line, 3, { "stroke-dasharray": "7 6", opacity: Math.min(oA2, oB) });
    if (oA > 0) out += MK.pill(lx, rowA, "100 cm", oA, { size: 30, col: P.blue });
    if (oA2 > 0) out += Tx(935, rowA + 11, "=", "lab big", "middle", { opacity: oA2, fill: P.muted }) +
      MK.pill(rx, rowA, "1 m", oA2, { size: 30, col: lit === "m" ? P.gold : P.blue, ink: lit === "m" ? P.gold : null });
    if (oB > 0) out += MK.pill(lx, rowB, "1000 m", oB, { size: 30, col: P.blue });
    if (oB2 > 0) out += Tx(935, rowB + 11, "=", "lab big", "middle", { opacity: oB2, fill: P.muted }) +
      MK.pill(rx, rowB, "1 km", oB2, { size: 30, col: lit === "km" ? P.gold : P.blue, ink: lit === "km" ? P.gold : null });
    return out;
  }

  function miLengthChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cEnds = c(0, "ends"), cRuler = c(1, "ruler"), cRuns = c(1, "runs"), cCm = c(2, "cm");
    var cH = c(3, "hundred"), cM = c(3, "metre"), cT = c(3, "thousand"), cK = c(3, "km");
    var cDoor = c(4, "door"), cTown = c(4, "town");
    var out = "", named = cCm != null && t >= cCm;

    /* the ruler, with the pencil on it from 0 to 15 the whole chapter */
    var dim = 1 - 0.55 * miFrom(t, scene, 4);
    out += G(ART.place(ART.ruler({
      length: 15, unit: "cm",
      item: { from: 0, to: 15, label: named ? "15 cm" : "?" }
    }), MI_L.x, MI_L.y, MI_L.w, MI_L.h), { opacity: dim });

    /* "from one end to the other": the two ends of the pencil light up */
    var ends = on(t, cEnds, 0.6) * miOnly(t, scene, 0);
    if (ends > 0) {
      out += C(miLX(0), miLY(34), 15, "none", P.gold, 4, { opacity: ends });
      out += C(miLX(15), miLY(34), 15, "none", P.gold, 4, { opacity: ends });
    }
    /* "A ruler": a ring round the whole ruler strip */
    var rr = bump(t, cRuler, 1.1);
    if (rr > 0) out += R(miLX(0) - 6, miLY(64), miLX(15) - miLX(0) + 12, miLY(136) - miLY(64), 10, "none", P.gold, 4, { opacity: rr });
    /* "from zero to fifteen": a span under the ruler, and the two tick numbers */
    var runs = on(t, cRuns, 0.7) * miBetween(t, scene, 1, 5);
    if (runs > 0) {
      out += miSpan(miLX(0), miLY(160), miLX(15), miLY(160), runs, P.gold, 5);
      out += MK.pill(miLX(0), miLY(107), "0", runs, { size: 22, col: P.gold, ink: P.gold });
      out += MK.pill(miLX(15), miLY(107), "15", runs, { size: 22, col: P.gold, ink: P.gold });
    }
    /* "fifteen centimetres": the pencil's own label is now the answer */
    var cm = popIn(t, cCm, 0.4);
    if (cm > 0) out += MK.tick(miLX(15) + 46, miLY(34), 20, cm);

    /* the two unit facts */
    out += miLadder(t, cH, cM, cT, cK, cTown != null && t >= cTown ? "km" : cDoor != null && t >= cDoor ? "m" : null);

    /* "two metres" and "five kilometres": a door, and the road to the next town */
    var dO = popIn(t, cDoor, 0.45);
    if (dO > 0) {
      out += MK.pop(Em(276, 356, 102, "\u{1F6AA}"), 276, 356, dO);
      out += miSpan(196, 306, 196, 406, on(t, cDoor, 0.6), P.gold, 5);
      out += MK.pill(120, 356, "2 m", on(t, cDoor == null ? null : cDoor + 0.2, 0.4), { size: 28, col: P.gold, ink: P.gold });
    }
    var tO = popIn(t, cTown, 0.45);
    if (tO > 0) {
      out += MK.pop(Em(700, 356, 98, "\u{1F3D8}️"), 700, 356, tO);
      out += L(460, 392, lerp(460, 632, on(t, cTown, 0.7)), 392, P.gold, 5, { "stroke-dasharray": "14 10" });
      out += MK.pill(546, 336, "5 km", on(t, cTown == null ? null : cTown + 0.2, 0.4), { size: 28, col: P.gold, ink: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: grams and kilograms ============================================
     ART.balance. Every pan carries the word or the number that is said, so
     "a thousand grams balance one kilogram" is the picture and not a caption
     over one. */
  function miBalance(left, right, tilt, label, x, y, w) {
    var h = w * ((label ? 282 : 252) / 540);
    return { markup: ART.place(ART.balance(left, right, { tilt: tilt, label: label || false }), x, y, w, h), h: h };
  }

  function miMassChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cHeavy = c(0, "heavy"), cWeigh = c(0, "weigh");
    var cGrams = c(1, "grams"), cKilo = c(1, "kilo");
    var cApple = c(2, "apple"), cRice = c(2, "rice");
    var cBig = c(3, "big"), cStone = c(3, "stone");
    var out = "", b;

    /* beat 0: what mass is, and the instrument */
    var o0 = miOnly(t, scene, 0);
    if (o0 > 0) {
      out += G(Em(318, 212, 190, "\u{1F34E}") + Em(850, 212, 190, "\u{1F4D5}"), { opacity: o0 });
      out += MK.qmark(584, 206, 44, on(t, cHeavy, 0.5) * o0);
      out += G(MK.pill(584, 368, "how heavy?", on(t, cHeavy, 0.4), { size: 32, col: P.plum }), { opacity: o0 });
      var w0 = popIn(t, cWeigh, 0.45) * o0;
      if (w0 > 0) out += MK.pop(Em(584, 206, 210, "⚖️"), 584, 206, w0);
    }

    /* beat 1: a thousand grams against one kilogram, level */
    var o1 = miOnly(t, scene, 1);
    if (o1 > 0) {
      b = miBalance("1000 g", "1 kg", "level", "the same mass", 314, 66, 540);
      out += G(b.markup, { opacity: o1 });
      /* each pan is ringed as it is named - the pan already carries the words.
         The balance is placed at its own size (540 wide) at (314, 66), so a pan
         hanging at px +/- arm = 270 +/- 158 from a level beam sits here. */
      out += R(362, 180, 128, 58, 12, "none", P.teal, 4, { opacity: on(t, cGrams, 0.45) * o1 });
      out += R(678, 180, 128, 58, 12, "none", P.accent, 4, { opacity: on(t, cKilo, 0.45) * o1 });
    }

    /* beat 2: the two things the lesson weighs */
    var o2 = miOnly(t, scene, 2);
    if (o2 > 0) {
      var a2 = popIn(t, cApple, 0.45), r2 = popIn(t, cRice, 0.45);
      if (a2 > 0) {
        b = miBalance("apple", "100 g", "level", "an apple, about 100 g", 22, 96, 520);
        out += G(b.markup, { opacity: o2 * Math.min(1, a2) });
        out += MK.pop(Em(282, 50, 76, "\u{1F34E}"), 282, 50, a2 * o2);
      }
      if (r2 > 0) {
        b = miBalance("rice", "2 kg", "level", "a bag of rice, 2 kg", 626, 96, 520);
        out += G(b.markup, { opacity: o2 * Math.min(1, r2) });
        out += MK.pop(Em(886, 50, 76, "\u{1F35A}"), 886, 50, r2 * o2);
      }
    }

    /* beat 3: big does not mean heavy */
    var o3 = miOnly(t, scene, 3);
    if (o3 > 0) {
      b = miBalance("feathers", "stone", "right", "the stone is heavier", 314, 62, 540);
      out += G(b.markup, { opacity: o3 });
      var bo = on(t, cBig, 0.4) * o3;
      if (bo > 0) {
        out += MK.pill(160, 128, "big = heavy", bo, { size: 27, col: P.line });
        var strike = on(t, cBig == null ? null : cBig + 0.45, 0.4) * o3;
        if (strike > 0) out += L(58, 128, lerp(58, 262, strike), 128, P.bad, 5, { opacity: strike });
        out += MK.cross(300, 128, 26, popIn(t, cBig == null ? null : cBig + 0.6, 0.4) * o3);
      }
      out += G(MK.pill(1008, 128, "a stone wins", on(t, cStone, 0.4), { size: 27, col: P.gold, ink: P.gold }), { opacity: o3 });
    }
    return svg(out);
  }

  /* ==== chapter: millilitres and litres =========================================
     ART.jug. The numbers printed up its side come from capacity and step, and
     the water is filled to the value that is said, so the reading is read off
     the jug: 1000 at the top mark, 300 on a jug printed in hundreds, 500 on
     the printed 500 of a litre jug. */
  function miJug(o, x, y, w) {
    var W = 278, H = 34 + 216 + 26 + 22 + (o.label === false ? 0 : 30);
    return ART.place(ART.jug(o), x, y, w, w * H / W);
  }

  function miCapacityChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cHolds = c(0, "holds"), cMl = c(1, "ml"), cLitre = c(1, "litre");
    var cSpoon = c(2, "spoon"), cMug = c(2, "mug");
    var cHalf = c(3, "half"), cFive = c(3, "five"), cFifty = c(3, "fifty");
    var out = "";

    /* beats 0 and 1: one litre jug, filling as the words are said */
    var o01 = miBetween(t, scene, 0, 2);
    if (o01 > 0) {
      var u = on(t, cHolds, 1.3);
      var full = cMl != null && t >= cMl;
      out += G(miJug({
        capacity: 1000, step: 500, minorPer: 5, level: full ? 1000 : Math.round(1000 * u),
        unit: "ml", label: full ? "1000 ml" : false
      }, 448, 44, 280), { opacity: o01 });
      out += G(MK.pill(214, 208, "capacity", on(t, cHolds, 0.4), { size: 30, col: P.teal, ink: P.teal }), { opacity: o01 });
      out += G(MK.pill(952, 150, "1000 ml", on(t, cMl, 0.4), { size: 30, col: P.gold, ink: P.gold }) +
        Tx(952, 218, "=", "lab big", "middle", { fill: P.muted, opacity: on(t, cLitre, 0.4) }) +
        MK.pill(952, 276, "1 litre", on(t, cLitre, 0.4), { size: 30, col: P.gold, ink: P.gold }), { opacity: o01 });
    }

    /* beat 2: a teaspoon, and a mug read off a jug printed in hundreds */
    var o2 = miOnly(t, scene, 2);
    if (o2 > 0) {
      var sp = popIn(t, cSpoon, 0.45);
      if (sp > 0) {
        out += MK.pop(Em(248, 196, 170, "\u{1F944}"), 248, 196, sp * o2);
        out += G(MK.pill(248, 330, "about 5 ml", on(t, cSpoon == null ? null : cSpoon + 0.25, 0.4), { size: 30, col: P.teal, ink: P.teal }), { opacity: o2 });
      }
      var mg = popIn(t, cMug, 0.45);
      if (mg > 0) {
        out += G(miJug({ capacity: 500, step: 100, minorPer: 2, level: 300, unit: "ml", label: "a mug of tea" }, 640, 44, 280),
          { opacity: o2 * Math.min(1, mg) });
        out += G(MK.pill(1010, 196, "300 ml", on(t, cMug == null ? null : cMug + 0.3, 0.4), { size: 30, col: P.gold, ink: P.gold }), { opacity: o2 });
      }
    }

    /* beat 3: half a litre, filled to the printed 500 */
    var o3 = miOnly(t, scene, 3);
    if (o3 > 0) {
      out += G(miJug({ capacity: 1000, step: 500, minorPer: 5, level: 500, unit: "ml", label: "half a litre" }, 448, 44, 280), { opacity: o3 });
      out += G(MK.pill(214, 208, "half", on(t, cHalf, 0.4), { size: 32, col: P.teal, ink: P.teal }), { opacity: o3 });
      out += G(MK.pill(952, 168, "500 ml", on(t, cFive, 0.4), { size: 32, col: P.gold, ink: P.gold }), { opacity: o3 });
      var f = on(t, cFifty, 0.4) * o3;
      if (f > 0) {
        out += MK.pill(952, 284, "50 ml", f, { size: 30, col: P.line });
        out += MK.cross(952, 284, 30, popIn(t, cFifty == null ? null : cFifty + 0.35, 0.4) * o3);
      }
    }
    return svg(out);
  }
