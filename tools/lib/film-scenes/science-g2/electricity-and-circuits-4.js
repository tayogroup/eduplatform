  /* ==== Electricity and Circuits, part 4 ======================================
     The two chapters that are the lesson's build step: the circuit put
     together a part at a time, and then a gap in the loop.

     Both draw ART.kit.circuitSvg - the lesson's own drawing - again for every
     frame, with the parts that frame has: the cell, then a wire, then the
     lamp, then the second wire, and the lamp lights only when the loop is
     whole, because that is the drawing's own rule and not the film's. */

  var EC_PARTS = ecMap(324, 52, 1.62);
  function ecPlaceMarkup(markup, m) { return ART.place(markup, m.ox, m.oy, 320 * m.s, 220 * m.s); }
  /* which of the named things was named most recently */
  function ecLatest(t, pairs) {
    var best = null, bt = -1;
    pairs.forEach(function (p) { if (p[0] != null && t >= p[0] && p[0] > bt) { bt = p[0]; best = p[1]; } });
    return best;
  }

  /* ==== chapter: the parts of a circuit ========================================
     Beat 0 NAMES the three parts, beats 1 to 4 BUILD them, exactly as the
     lesson's Circuit builder builds them: cell, a wire, the lamp, the second
     wire. The two halves cross-fade.

     Beat 0 used to draw the builder's empty board - the lesson's own
     all-ghost starting state - but "a simple circuit has three parts: a cell,
     wires and a lamp" over four dashed outlines shows a seven-year-old three
     empty spaces, not three parts. It now shows the three parts themselves,
     with the lesson's own pictures for them (its builder's buttons: the cell
     \u{1F50B}, a wire ➰, the lamp \u{1F4A1}), one box each, filling as it
     is named. The board with nothing on it is still the first thing beat 1
     draws, so the build starts where the lesson's builder starts. */
  var EC_NAME = { y: 92, h: 264, w: 300, x: [64, 434, 804] };
  /* The cell and the lamp are the lesson's own builder pictures. The wires are
     drawn (see ecWirePic), and there are TWO of them, because the word the
     voice says is "wires" and the circuit the child builds takes two. */
  var EC_NAME_PIC = ["\u{1F50B}",
    function (cx, cy, size) { return ecWirePic(cx, cy - size * 0.26, size * 1.02) + ecWirePic(cx, cy + size * 0.3, size * 1.02); },
    "\u{1F4A1}"];
  var EC_NAME_WORD = ["cell", "wires", "lamp"];
  function ecPartsNames(scene, t) {
    var cThree = sc(scene, 0, "three");
    var cues = [sc(scene, 0, "cell"), sc(scene, 0, "wires"), sc(scene, 0, "lamp")];
    var box = on(t, cThree, 0.5), flash = bump(t, cThree, 1.2), out = "";
    for (var k = 0; k < 3; k++) {
      var x = EC_NAME.x[k], cx = x + EC_NAME.w / 2, p = popIn(t, cues[k], 0.42), lit = p > 0;
      out += ecCard(x, EC_NAME.y, EC_NAME.w, EC_NAME.h, box, lit ? P.gold : P.line, lit);
      if (flash > 0) out += R(x, EC_NAME.y, EC_NAME.w, EC_NAME.h, 20, "none", P.gold, 4, { opacity: flash });
      if (lit) {
        var art = typeof EC_NAME_PIC[k] === "function"
          ? EC_NAME_PIC[k](cx, EC_NAME.y + 106, 104)
          : MK.pic(cx, EC_NAME.y + 106, 104, EC_NAME_PIC[k]);
        out += MK.pop(art, cx, EC_NAME.y + 106, Math.min(1.08, p));
        out += ecCap(cx, EC_NAME.y + 216, EC_NAME_WORD[k], Math.min(1, p), "lab big");
      }
    }
    return out;
  }

  function ecPartsBuild(scene, t) {
    var m = EC_PARTS;
    var n0c = sc(scene, 0, "cell"), n0w = sc(scene, 0, "wires"), n0l = sc(scene, 0, "lamp");
    var cCell = sc(scene, 1, "cell"), cBatt = sc(scene, 1, "battery"), cPush = sc(scene, 1, "pushes");
    var cWire = sc(scene, 2, "wire"), cLamp = sc(scene, 2, "lamp"), cNot = sc(scene, 2, "not");
    var cSecond = sc(scene, 3, "second"), cClose = sc(scene, 3, "close"), cLights = sc(scene, 3, "lights");
    var cCirc = sc(scene, 4, "circuit"), cOut = sc(scene, 4, "out"), cThru = sc(scene, 4, "through"), cBack = sc(scene, 4, "back");

    var st = { cell: ecAt(t, cCell), lamp: ecAt(t, cLamp), wireTop: ecAt(t, cWire),
      wireBottom: ecAt(t, cSecond), on: ecAt(t, cLights) };
    var pic = ART.kit.circuitSvg(st);

    /* Only the part being named wears the pointer (rule 3) - and the drawing
       has ONE tap outline for its two wires, round the TOP one (science.js:
       data-part="wire" is x 92, y 48, w 136, h 24). So "the second wire", which
       is the BOTTOM run, cannot be shown with the drawing's own outline: it
       rang the top wire while the bottom one appeared. cSecond therefore names
       no part here (ecLatest returns null and nothing is ringed) and the second
       wire gets the film's own ring, on the bottom run, below. */
    var now = ecLatest(t, [[cCell, "cell"], [cWire, "wire"], [cLamp, "lamp"],
      [cSecond, null], [cNot, "lamp"]]);
    if (now) pic = ART.ring(pic, now, now === "lamp" && ecAt(t, cNot) && !ecAt(t, cSecond) ? P.muted : P.gold, 6);

    var out = ecPlaceMarkup(pic, m);

    /* "Add the second wire": the bottom run, ringed where the drawing draws it
       (M60 160 H260), the same shape and inset as the drawing's own outline
       round the top wire, and only while that beat is on screen. */
    var secondOn = ecOnly(t, scene, 3);
    out += R(m.x(92), m.y(148), 136 * m.s, 24 * m.s, 8 * m.s, "none", P.gold, 6,
      { opacity: on(t, cSecond, 0.4) * secondOn * (1 - on(t, cLights, 0.4)) });

    /* the loop closing, and then the loop named */
    out += ecLoopTrace(m, Math.max(on(t, cClose, 0.9), ecAt(t, cCirc) ? 1 : 0), null,
      4 + 3 * on(t, cCirc, 0.5) * breathe(t));
    /* the lamp lighting */
    out += MK.glow(m.x(EC_LAMP[0]), m.y(EC_LAMP[1]), 96, P.gold,
      (ecAt(t, cLights) ? 0.5 + 0.4 * breathe(t) : 0) + 0.7 * bump(t, cLights, 1.2));

    /* "It pushes the electricity round": the push comes out of the cell */
    var pu = on(t, cPush, 0.6) * ecOnly(t, scene, 1);
    out += MK.glow(m.x(EC_CELL[0]), m.y(EC_CELL[1]), 74, P.gold, pu * (0.5 + 0.5 * breathe(t)));
    out += MK.arrow(m.x(60), m.y(104), m.x(60), m.y(44), pu, P.gold, 7);
    /* "It is what people call a battery": the lesson's own picture for a cell */
    var bo = popIn(t, cBatt, 0.4) * ecOnly(t, scene, 1);
    if (bo > 0) out += MK.leader(176, 300, m.x(46), m.y(124), on(t, cBatt, 0.6), P.gold) +
      MK.pop(MK.pic(176, 350, 92, "\u{1F50B}"), 176, 350, bo);
    /* "The lamp is not lit yet" */
    out += MK.qmark(900, 196, 26, popIn(t, cNot, 0.4) * ecOnly(t, scene, 2));

    /* the electricity going round: out of the cell, through the lamp, and back */
    if (ecAt(t, cOut)) {
      var e = spokenEnd(scene.first + 4), u;
      if (cThru != null && t < cThru) u = 0.5 * clamp((t - cOut) / Math.max(cThru - cOut, 0.25), 0, 1);
      else if (cThru != null) u = 0.5 + 0.5 * clamp((t - cThru) / Math.max(e - cThru, 0.5), 0, 1);
      else u = clamp((t - cOut) / 1.6, 0, 1);
      out += ecBead(m, u, P.gold, 11, 1);
      out += MK.glow(m.x(EC_LAMP[0]), m.y(EC_LAMP[1]), 70, P.gold, 0.8 * bump(t, cThru, 1.0));
      out += MK.glow(m.x(EC_CELL[0]), m.y(EC_CELL[1]), 70, P.gold, 0.8 * bump(t, cBack, 1.2));
    }
    /* the word the lesson gives the whole loop */
    out += MK.pill(m.x(160), m.y(110), "circuit", on(t, cCirc, 0.45), { size: 28, col: P.gold });

    /* the three words, beside the three parts */
    /* The cell's leader ends at its own PLATE (the long line, x 40 to 80,
       y 92 to 102), not at drawing point (30, 110): MK.leader finishes in an
       opaque dot of radius 7, which there sat exactly on the drawing's own
       "cell" caption (science.js: x 26, y 118) and ate its c. */
    out += ecLabel(t, 176, 230, "cell", n0c, [m.x(60), m.y(96)], now === "cell");
    out += ecLabel(t, 980, 130, "wires", n0w, [m.x(160), m.y(60)],
      now === "wire" || (ecAt(t, cSecond) && secondOn > 0.5));
    out += ecLabel(t, 980, 340, "lamp", n0l, [m.x(260), m.y(140)], now === "lamp");
    return out;
  }

  function ecPartsChapter(scene, beat, t, i) {
    return svg(crossfade(t, i, scene, function (j) {
      return j === scene.first ? ecPartsNames(scene, t) : ecPartsBuild(scene, t);
    }));
  }

  /* ==== chapter: a gap breaks it ================================================
     The same drawing, with the lesson's own gap state: the bottom wire split,
     its red "a gap" label, and the lamp out. The torch beside it is the thing
     the circuit is a model of, so its lamp goes out and comes back with the
     circuit's. */
  function ecGapChapter(scene, beat, t, i) {
    var m = EC_PARTS;
    var cModel = sc(scene, 0, "model"), cTorch = sc(scene, 0, "torch"), cTake = sc(scene, 0, "take");
    var cOut = sc(scene, 1, "out"), cGap = sc(scene, 1, "gap"), cBroken = sc(scene, 1, "broken");
    var cFlow = sc(scene, 2, "flow"), cComplete = sc(scene, 2, "complete"),
      cAnywhere = sc(scene, 2, "anywhere"), cStops = sc(scene, 2, "stops");
    var cBack = sc(scene, 3, "back"), cDone = sc(scene, 3, "complete"), cAgain = sc(scene, 3, "again");

    /* The wire goes back on "Put the wire back", and the lamp lights with it.
       ONE cue drives both, because the lesson's rule is one thing: "A complete
       loop lights the lamp. A gap anywhere and it goes out." Holding the lamp
       until "The loop is complete" 1.48 s later left the child watching a
       whole, unbroken loop with the lamp dark under the drawing's own "lamp
       off" - the misconception this chapter exists to kill. */
    var broken = ecAt(t, cTake) && !ecAt(t, cBack);
    var lit = !broken;
    var out = ecPlaceCircuit({ cell: true, lamp: true, wireTop: true, wireBottom: true, gap: broken, on: lit }, m);
    out += MK.glow(m.x(EC_LAMP[0]), m.y(EC_LAMP[1]), 96, P.gold,
      (lit ? 0.45 + 0.4 * breathe(t) : 0) + 0.7 * bump(t, cAgain, 1.2));

    /* the torch the circuit is a model of, its lamp following the circuit's */
    var to = on(t, cTorch, 0.5);
    if (to > 0) {
      out += G(ecTorch(168, 150, 0.72, { on: lit, sw: lit ? 1 : 0 }), { opacity: to });
      out += ecCap(168, 238, "a real torch", to, "lab mid");
    }
    var mo = on(t, cModel, 0.45);
    if (mo > 0) out += MK.leader(170 + ecPillHalf("a model of it", 26) + 4, 320, m.x(30), m.y(150), on(t, cModel, 0.7), P.gold) +
      MK.pill(170, 320, "a model of it", mo, { size: 26, col: P.gold });

    /* The wire taken out, and put back: it drops away below the loop and DRIFTS
       LEFT as it goes. Straight down ran both the piece and its arrow through
       the drawing's own red caption for the gap (science.js: "a gap", centred
       on x 160, baseline y 196), so for the second the piece was on its way
       past, the word the beat is about read "a ap" with an arrowhead in it.
       The arrow leans the same way, and clears the caption at every height. */
    var gx1 = m.x(140), gx2 = m.x(180), gy = m.y(160);
    var away = cTake == null ? 0 : clamp((t - cTake) / 1.2, 0, 1);
    if (ecAt(t, cBack)) away = 1 - clamp((t - cBack) / 0.7, 0, 1);
    if (away > 0 && away < 1) {
      var ay = gy + 104 * away * away, adx = 90 * m.s * away;
      out += L(gx1 - 6 - adx, ay, gx2 + 6 - adx, ay, P.gold, 11, { opacity: 1 - away * 0.55 });
      out += MK.arrow(m.x(150), gy + 20, m.x(104), gy + 86, clamp(away * 2, 0, 1), P.gold, 6);
    }

    if (broken) {
      /* the lamp going out, and then the gap itself */
      out += C(m.x(260), m.y(110), 46 + 10 * bump(t, cOut, 0.9), "none", P.muted, 4, { opacity: 0.8 * bump(t, cOut, 0.9) });
      out += C(m.x(160), m.y(160), 44 + 8 * breathe(t), "none", P.bad, 4, { opacity: on(t, cGap, 0.45) });
      out += MK.cross(m.x(160), m.y(110), 30, popIn(t, cBroken, 0.4) * ecOnly(t, scene, 1));

      /* "a complete loop": the piece that is missing, drawn as the lesson draws
         a part that is not there - a grey dashed ghost - so the words are shown
         by what the loop HASN'T got, never by a whole loop over a broken one */
      out += L(m.x(138), m.y(160), m.x(182), m.y(160), P.muted, 9,
        { "stroke-dasharray": "7 7", opacity: 0.95 * bump(t, cComplete, 1.5) });
      out += ecFlowBlocked(m, t, cFlow, 0.7167, P.gold, 11, ecFrom(t, scene, 2));
      out += MK.glow(m.x(180), m.y(160), 66, P.bad, 0.8 * bump(t, cStops, 1.3));
      /* "A gap anywhere": three more places the loop could break */
      if (cAnywhere != null) {
        out += MK.cross(m.x(160), m.y(60), 22, popIn(t, cAnywhere, 0.35) * ecOnly(t, scene, 2));
        out += MK.cross(m.x(60), m.y(72), 22, popIn(t, cAnywhere + 0.3, 0.35) * ecOnly(t, scene, 2));
        out += MK.cross(m.x(260), m.y(74), 22, popIn(t, cAnywhere + 0.6, 0.35) * ecOnly(t, scene, 2));
      }
    } else {
      out += G(ecLoopTrace(m, on(t, cDone, 0.9)), { opacity: ecFrom(t, scene, 3) });
      out += MK.tick(m.x(160), m.y(110), 32, popIn(t, cAgain == null ? null : cAgain + 0.3, 0.4) * ecFrom(t, scene, 3));
    }
    return svg(out);
  }
