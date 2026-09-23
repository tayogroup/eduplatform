  /* ==== chapters: out of the rocks, and oil and gas ==============================
     tools/lib/film-scenes/science-g3/rocks-and-fossils-2.js. */

  /* ---- out of the rocks ---------------------------------------------------------
     The lesson's three "from rocks" materials as one growing table, a row per
     line: the rock the material is in, heat, and the thing the child knows.
     Row 1 is built over three beats (found, dug up and heated, the spoon), rows
     2 and 3 over one line each. Every picture is the lesson's own: the kit's
     rock and window drawings, and its spoon and brick. */
  var RF_ROW = [96, 226, 356];
  var RF_COL = { back: 112, src: 252, a0: 312, a1: 636, heat: 474, out: 706, pill: 804 };

  /* one row of the table: a plate that brightens when its line is reached */
  function rfRowPlate(y, lit) {
    return R(58, y - 64, 1052, 128, 18, P.card, P.line, 2, { opacity: 0.3 + 0.55 * clamp(lit, 0, 1) });
  }

  /* the rock a material comes out of, small, to the left of the source */
  function rfBackRock(y, u, word) {
    if (!(u > 0)) return "";
    var c = RF_COL;
    return MK.pop(MK.pic(c.back, y, 52, "\u{1FAA8}"), c.back, y, Math.min(1, u * 1.4)) +
      Tx(c.back, y + 50, word, "lab mid muted readable", "middle", { opacity: Math.min(1, u) }) +
      MK.arrow(c.back + 32, y, c.src - 50, y, u, P.muted, 5);
  }

  /* the heat between the rock and the thing it becomes */
  function rfHeatStep(y, u, word) {
    if (!(u > 0)) return "";
    var c = RF_COL;
    return MK.arrow(c.a0, y, c.a1, y, u, P.gold, 7) +
      MK.pop(Em(c.heat, y - 44, 40, "\u{1F525}"), c.heat, y - 44, Math.min(1, u * 1.35)) +
      Tx(c.heat, y + 46, word, "lab mid gold readable", "middle", { opacity: Math.min(1, u) });
  }

  function rfOresChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMetal = c(0, "metal"), cOres = c(0, "ores");
    var cDug = c(1, "dug"), cHeat = c(1, "heated"), cOut = c(1, "out"), cSpoon = c(2, "spoon");
    var cGlass = c(3, "glass"), cSand = c(3, "sand"), cBits = c(3, "bits");
    var cBrick = c(4, "bricks"), cClay = c(4, "clay"), cSoft = c(4, "soft");
    var col = RF_COL, out = "";
    out += rfRowPlate(RF_ROW[0], on(t, cMetal, 0.5));
    out += rfRowPlate(RF_ROW[1], rfFrom(t, scene, 3));
    out += rfRowPlate(RF_ROW[2], rfFrom(t, scene, 4));

    /* ---- row 1: an ore, heated, and the metal in a spoon ---- */
    var y0 = RF_ROW[0], rock = popIn(t, cMetal, 0.45);
    out += MK.pop(MK.pic(col.src, y0, 80, "\u{1FAA8}"), col.src, y0, rock);
    out += rfFlecks(col.src, y0, 1, Math.min(1, rock), Math.max(bump(t, cMetal, 1.2), 0.5 * bump(t, cOres, 1.2)));
    out += Tx(col.src, y0 + 56, "ore", "lab mid muted readable", "middle", { opacity: on(t, cOres, 0.4) });
    /* dug up: a pick strikes the rock */
    out += MK.pop(Em(col.src + 54, y0 - 46, 44, "⛏️"), col.src + 54, y0 - 46, popIn(t, cDug, 0.4) * rfOnly(t, scene, 1));
    out += MK.ripple(col.src + 24, y0 - 16, t, cDug, P.gold);
    out += MK.ripple(col.src + 24, y0 - 16, t, cDug == null ? null : cDug + 0.5, P.gold);
    out += rfHeatStep(y0, on(t, cHeat, 0.6), "heated");
    /* separated out: the specks travel along the arrow and gather as metal */
    var sep = on(t, cOut, 1.0);
    if (sep > 0) {
      for (var k = 0; k < 4; k++) {
        var u = clamp(sep * 1.25 - k * 0.08, 0, 1);
        out += E(lerp(col.src + 28, col.out, u), lerp(y0 - 6 + k * 6, y0, u), 8 - k, 6 - k * 0.6, P.gold, P.goldDeep, 1.4, { opacity: Math.min(1, sep * 2) });
      }
    }
    out += MK.pop(MK.pic(col.out, y0, 80, "\u{1F944}"), col.out, y0, popIn(t, cSpoon, 0.45));
    out += MK.pill(col.pill, y0, "metal", on(t, cSpoon == null ? null : cSpoon + 0.2, 0.4), { size: 26, anchor: "start", col: P.gold });

    /* ---- row 2: sand, melted, and glass ---------------------------------------
       "Glass" opens the line, so - exactly as row 1's "Metal" cue lights the
       ore rather than waiting for the finished spoon - it brings the RAW sand
       on screen, not the finished window. The window itself waits: it pops in
       near the end of the line, once the whole line (sand, melted, the rock it
       came from) has been said, so source -> heat -> result reads left to
       right instead of the other way round. */
    var y1 = RF_ROW[1], glassEnd = spokenEnd(scene.first + 3) - 0.7;
    out += rfSandHeap(col.src, y1 + 2, 88, popIn(t, cGlass, 0.45));
    out += Tx(col.src, y1 + 56, "sand", "lab mid muted readable", "middle", { opacity: on(t, cSand, 0.4) });
    out += rfBackRock(y1, on(t, cBits, 0.6), "rock");
    out += rfHeatStep(y1, on(t, cSand == null ? null : cSand + 0.35, 0.6), "melted");
    out += MK.pop(MK.pic(col.out, y1, 80, "\u{1FA9F}"), col.out, y1, popIn(t, glassEnd, 0.45));
    out += MK.pill(col.pill, y1, "glass", on(t, glassEnd + 0.2, 0.4), { size: 26, anchor: "start", col: P.gold });

    /* ---- row 3: clay, baked, and a brick ---------------------------------------
       Same fix as row 2, for the same reason: "Bricks" opens the line, so it
       brings the RAW clay on screen instead of the finished brick. The brick
       waits for the whole line (clay, baked, the soft rock it came from) to
       be said, and pops in near the end. */
    var y2 = RF_ROW[2], brickEnd = spokenEnd(scene.first + 4) - 0.7, clay = popIn(t, cBrick, 0.45);
    if (clay > 0) out += MK.pop(E(col.src, y2 + 8, 48, 31, RF_CLAY, "#6F472C", 3) +
      Pth("M" + (col.src - 24) + "," + (y2 + 2) + " q24,-13 48,0", null, "#6F472C", 3), col.src, y2 + 8, clay);
    out += Tx(col.src, y2 + 56, "clay", "lab mid muted readable", "middle", { opacity: on(t, cClay, 0.4) });
    out += rfBackRock(y2, on(t, cSoft, 0.6), "soft rock");
    out += rfHeatStep(y2, on(t, cClay == null ? null : cClay + 0.35, 0.6), "baked");
    out += MK.pop(MK.pic(col.out, y2, 80, "\u{1F9F1}"), col.out, y2, popIn(t, brickEnd, 0.45));
    out += MK.pill(col.pill, y2, "bricks", on(t, brickEnd + 0.2, 0.4), { size: 26, anchor: "start", col: P.gold });
    return svg(out);
  }

  /* ---- oil and gas --------------------------------------------------------------
     A cut down through the ground: the rock layers, with the oil trapped in the
     bottom one and the gas above it. The well is drilled on the surface, the oil
     travels up the pipe into the drum, and the drum feeds the two things the
     lesson names: petrol for cars, and plastic. */
  var RF_WELL = { x: 36, y: 30, w: 654, h: 390, ground: 170, px: 380 };
  var RF_POCKET = { cx: 378, cy: 352, rx: 118, ry: 32 };

  function rfOilgasChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOil = c(0, "oil"), cGas = c(0, "gas"), cDeep = c(0, "deep");
    var cPump = c(1, "pump"), cPetrol = c(2, "petrol"), cCars = c(2, "cars");
    var cPlastic = c(3, "plastic"), cBottle = c(3, "bottle"), cEarth = c(3, "earth");
    var w = RF_WELL, p = RF_POCKET, out = "";

    /* the ground, cut through */
    out += R(w.x, w.y, w.w, w.h, 18, "#0E2434", P.line, 2);
    out += el("clipPath", { id: "rfWellClip" }, R(w.x, w.y, w.w, w.h, 18));
    var inner = rfLayers(w.x, w.ground, w.w, w.y + w.h - w.ground, 3, 1);
    inner += R(w.x, w.ground - 8, w.w, 10, 0, P.grass);
    /* the oil, and the gas trapped above it */
    inner += rfOilPocket(p.cx, p.cy, p.rx, p.ry, Math.min(1, popIn(t, cOil, 0.5)), on(t, cGas, 0.6));
    /* deep in rocks: the layers flash and a depth arrow runs down to the oil */
    inner += R(w.x, w.ground, w.w, w.y + w.h - w.ground, 0, P.gold, null, null, { opacity: 0.22 * bump(t, cDeep, 1.4) });
    /* the well: a tower on the surface, and the pipe down to the oil */
    var drill = on(t, cPump, 0.7);
    if (drill > 0) {
      inner += G(Pth("M" + (w.px - 34) + "," + w.ground + " L" + w.px + ",92 L" + (w.px + 34) + "," + w.ground, null, P.edge, 5) +
        L(w.px - 22, w.ground - 30, w.px + 22, w.ground - 30, P.edge, 4) +
        L(w.px - 12, w.ground - 56, w.px + 12, w.ground - 56, P.edge, 4), { opacity: drill });
      inner += L(w.px, w.ground - 4, w.px, lerp(w.ground, p.cy, drill), P.plastic, 7, { opacity: drill });
    }
    out += G(inner, { "clip-path": "url(#rfWellClip)" });
    /* the depth arrow, over the layers */
    var dp = on(t, cDeep, 0.8) * clamp(1 - into(t, scene.first + 2), 0, 1);
    out += MK.arrow(96, w.ground + 10, 96, lerp(w.ground + 10, p.cy - 6, dp), dp, P.gold, 6);

    /* the oil rising up the pipe, while the line about pumping is said */
    var rise = rfOnly(t, scene, 1) * on(t, cPump == null ? null : cPump + 0.3, 0.4);
    if (rise > 0) for (var k = 0; k < 4; k++) {
      var ph = ((t - (cPump + 0.3) + k * 0.36) / 1.45) % 1;
      out += C(w.px, lerp(p.cy, w.ground - 30, ph), 7, RF_OIL, P.gold, 2, { opacity: rise * Math.min(1, (1 - ph) * 3) });
    }
    /* the drum it is pumped into */
    var drum = on(t, cPump == null ? null : cPump + 0.5, 0.5);
    out += MK.pop(MK.pic(566, 104, 84, "\u{1F6E2}️"), 566, 104, popIn(t, cPump == null ? null : cPump + 0.5, 0.5));
    out += MK.arrow(w.px + 22, 120, 512, 104, drum, P.gold, 6);

    /* the two words for what is down there */
    var words = clamp(1 - into(t, scene.first + 2), 0, 1);
    if (words > 0) out += G(rfLabel(t, 800, 358, "oil", cOil, [p.cx + p.rx - 8, p.cy], on(t, cGas, 0.4) < 0.5, 30) +
      rfLabel(t, 800, 262, "natural gas", cGas, [p.cx + p.rx * 0.55, p.cy - p.ry - 26], true, 30), { opacity: words });

    /* petrol for cars, and plastic */
    out += rfThing(842, 128, 88, "⛽", "petrol", popIn(t, cPetrol, 0.45));
    out += MK.arrow(704, 118, 786, 126, on(t, cPetrol, 0.5), P.gold, 6);
    out += MK.pop(MK.pic(1044, 128, 88, "\u{1F697}"), 1044, 128, popIn(t, cCars, 0.45));
    out += MK.arrow(904, 128, 986, 128, on(t, cCars, 0.45), P.gold, 5);
    out += rfThing(842, 320, 88, "\u{1F9F4}", "plastic", popIn(t, cPlastic, 0.45));
    out += MK.arrow(704, 212, 786, 292, on(t, cPlastic, 0.55), P.gold, 6);
    /* a plastic bottle, and the line back to the rock it began in */
    out += MK.pop(MK.pic(1044, 320, 88, ART.ICONS.bottle), 1044, 320, popIn(t, cBottle, 0.45));
    out += MK.arrow(904, 320, 986, 320, on(t, cBottle, 0.45), P.gold, 5);
    var back = on(t, cEarth, 0.9);
    if (back > 0) out += Pth("M1044,376 L1044,428 L520,428", null, P.teal, 5, { opacity: back, "stroke-dasharray": "13 9" }) +
      MK.arrow(520, 428, 480, 374, back, P.teal, 6) +
      MK.glow(p.cx, p.cy, 84, P.teal, back * (0.5 + 0.5 * breathe(t)));
    return svg(out);
  }
