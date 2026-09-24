  /* ==== Precise Instructions, part 2: the house, and the cup of tea ===========
     tools/lib/film-scenes/computing-g2/precise-instructions-2.js. See the
     header of precise-instructions.js.

     Both chapters are the same shape: the algorithm as a numbered list of the
     lesson's own instructions on the left, and the kit's own drawing on the
     right, made from exactly that list. "Draw a roof somewhere" hands
     ART.drawing("house", [...,"roof-corner"]) the roof the lesson draws in the
     corner; pouring the water with no cup hands ART.scene("tea", ["water"])
     the puddle it paints and captions itself. */

  /* ==== chapter: what, how big, where =============================================
     The three things a precise instruction answers, and then the lesson's own
     five instructions for the house, one at a time. The second one is the
     lesson's own vague option - "Draw a roof somewhere" - so the kit puts the
     roof in the corner, and the precise one replaces it in the same slot. */
  var PI_WQ = [
    { word: "what", x: 40 },
    { word: "how big", x: 414 },
    { word: "where", x: 788 }
  ];

  /* a shape, two sizes of a shape, and a shape put in one place: the three
     questions drawn rather than said twice */
  function piWhatGlyph(cx, cy) {
    return Pth("M" + (cx - 92) + "," + (cy + 34) + " L" + (cx - 52) + "," + (cy - 34) +
      " L" + (cx - 12) + "," + (cy + 34) + " Z", P.gold, "#7A2E2E", 3) +
      R(cx + 14, cy - 30, 62, 62, 6, P.accent, "#7A2E2E", 3);
  }
  function piBigGlyph(cx, cy) {
    return R(cx - 86, cy + 2, 32, 32, 5, P.accent, "#7A2E2E", 3) +
      R(cx + 2, cy - 38, 76, 76, 7, P.accent, "#7A2E2E", 3);
  }
  function piWhereGlyph(cx, cy) {
    return R(cx - 96, cy - 42, 192, 88, 8, P.card, P.line, 3, { "stroke-dasharray": "11 8" }) +
      R(cx - 22, cy - 20, 44, 44, 5, P.accent, "#7A2E2E", 3) +
      MK.arrow(cx - 88, cy + 62, cx - 26, cy + 26, 1, P.gold, 6);
  }
  var PI_WGLYPH = [piWhatGlyph, piBigGlyph, piWhereGlyph];

  function piWhereIntro(scene, t) {
    var at = [sc(scene, 0, "what"), sc(scene, 0, "big"), sc(scene, 0, "where")];
    var out = "";
    /* the three cards arrive together, and each lights on its own words: a
       card that waited for the last three words of the line would flash past */
    PI_WQ.forEach(function (q, k) {
      var frame = on(t, at[0] == null ? null : at[0] + k * 0.3, 0.45);
      if (!(frame > 0)) return;
      var p = popIn(t, at[k], 0.42), cx = q.x + 170;
      out += G(R(q.x, 96, 340, 228, 26, P.card, p > 0 ? P.gold : P.line, p > 0 ? 3.5 : 2) +
        Tx(cx, 158, q.word, "lab huge", "middle", { fill: p > 0 ? P.gold : P.muted }) +
        G(PI_WGLYPH[k](cx, 248), { opacity: 0.35 + 0.65 * Math.min(1, p) }),
        { transform: around(cx, 210, 0.94 + 0.06 * Math.min(1.1, Math.max(frame, p))),
          opacity: Math.min(1, frame) * (0.55 + 0.45 * Math.min(1, p)) });
    });
    return out;
  }

  var PI_HOUSE_ROWS = [
    "Draw a big square in the middle",
    "Draw a small door at the bottom",
    "Draw a window on the wall, at the top left",
    "Draw the sun in the top right of the sky"
  ];

  function piWhereMain(scene, t) {
    var cSquare = sc(scene, 1, "square"), cWalls = sc(scene, 1, "walls");
    var cSomewhere = sc(scene, 2, "somewhere"), cAnywhere = sc(scene, 2, "anywhere");
    var cTriangle = sc(scene, 3, "triangle"), cBelongs = sc(scene, 3, "belongs");
    var cDoor = sc(scene, 4, "door"), cWindow = sc(scene, 4, "window");
    var cSun = sc(scene, 5, "sun"), cNothing = sc(scene, 5, "nothing");
    var out = "";

    /* exactly what Robo has been told, in the order it was told */
    var ids = [];
    if (piPast(t, cSquare)) ids.push("walls");
    if (piPast(t, cBelongs)) ids.push("roof");
    else if (piPast(t, cAnywhere)) ids.push("roof-corner");
    if (piPast(t, cDoor)) ids.push("door");
    if (piPast(t, cWindow)) ids.push("window");
    if (piPast(t, cSun)) ids.push("sun");
    out += piCanvas(ART.drawing("house", ids), PI_BOX, 1, piPast(t, cNothing) ? P.good : P.line);
    /* "That is the walls": the square Robo just drew, ringed in its own place */
    var wr = on(t, cWalls, 0.5) * (1 - on(t, cSomewhere, 0.5));
    if (wr > 0) out += R(piBX(100) - 5, piBY(110) - 5, 120 * PI_BOX.w / 320 + 10,
      80 * PI_BOX.h / 240 + 10, 8, "none", P.gold, 5, { opacity: wr });
    /* on the grass, clear of the sun the last instruction just drew */
    out += MK.tick(692, 338, 28, popIn(t, cNothing, 0.4));

    /* slot 0, and slots 2 to 4: the precise instructions, ticked as Robo draws */
    var at = [cSquare, cDoor, cWindow, cSun];
    var slotOf = [0, 2, 3, 4];
    PI_HOUSE_ROWS.forEach(function (text, k) {
      var o = on(t, at[k], 0.45);
      if (o <= 0) return;
      var y = piR5Y(slotOf[k]), done = at[k] == null ? null : at[k] + 0.55;
      out += piRow(PI_PANEL.x, y, PI_PANEL.w, PI_R5.h, slotOf[k] + 1, text,
        { o: o, fs: 19, col: piPast(t, done) ? P.good : P.gold,
          mark: piPast(t, done) ? "tick" : null, markP: popIn(t, done, 0.35) });
      out += MK.ripple(PI_PANEL.x + 30, y + PI_R5.h / 2, t, at[k], P.gold);
    });

    /* slot 1: the vague instruction shrinks away and the precise one grows in */
    var gone = on(t, cTriangle, 0.55), drop = on(t, cTriangle == null ? null : cTriangle + 0.35, 0.5);
    var y1 = piR5Y(1), cxy = [PI_PANEL.x + PI_PANEL.w / 2, y1 + PI_R5.h / 2];
    if (gone < 1) out += G(piRow(PI_PANEL.x, y1, PI_PANEL.w, PI_R5.h, 2, "Draw a roof somewhere",
      { o: on(t, cSomewhere, 0.45), fs: 19, col: P.bad,
        mark: piPast(t, cAnywhere) ? "cross" : null, markP: popIn(t, cAnywhere, 0.4) }),
      { opacity: 1 - gone, transform: around(cxy[0], cxy[1], 1 - 0.3 * gone) });
    out += piSlot(PI_PANEL.x, y1, PI_PANEL.w, PI_R5.h, 2, gone * (1 - drop));
    if (drop > 0) out += G(piRow(PI_PANEL.x, y1, PI_PANEL.w, PI_R5.h, 2, "Draw a triangle on top of the square",
      { o: drop, fs: 19, col: piPast(t, cBelongs) ? P.good : P.gold,
        mark: piPast(t, cBelongs) ? "tick" : null, markP: popIn(t, cBelongs, 0.35) }),
      { transform: around(cxy[0], cxy[1], 0.74 + 0.26 * drop) });
    return out;
  }

  function piWhereChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), out = "";
    if (u < 1) out += G(piWhereIntro(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(piWhereMain(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: a linear algorithm ===============================================
     The lesson's own five tea steps, read out and built one at a time, and
     then the one the lesson warns about: pour the water first and
     ART.scene("tea", ["water"]) paints the puddle and captions it. Nothing
     here draws the mistake; the list does. */

  /* The lesson's own step carries a BASKET emoji for the tea bag; the kit's own
     tea scene draws a brown bag on a string, so the row draws one too. */
  function piBagGlyph(cx, cy, s) {
    return R(cx - s * 0.30, cy - s * 0.20, s * 0.60, s * 0.46, s * 0.08, "#8B5A2B", "#5E3A18", 2) +
      L(cx, cy - s * 0.20, cx + s * 0.34, cy - s * 0.46, P.paper, 2.2);
  }

  var PI_TEA = [
    { id: "cup", text: "Get a cup", pic: "☕" },
    { id: "bag", text: "Put a tea bag in the cup", pic: piBagGlyph },
    { id: "water", text: "Pour in the hot water", pic: "\u{1F4A7}" },
    { id: "milk", text: "Add a little milk", pic: "\u{1F95B}" },
    { id: "stir", text: "Stir it with a spoon", pic: "\u{1F944}" }
  ];

  function piLinearChapter(scene, beat, t, i) {
    var cTea = sc(scene, 0, "tea"), cFive = sc(scene, 0, "five");
    var cCup = sc(scene, 1, "cup"), cBag = sc(scene, 1, "bag");
    var cWater = sc(scene, 2, "water"), cBrown = sc(scene, 2, "brown");
    var cMilk = sc(scene, 3, "milk"), cStir = sc(scene, 3, "stir");
    var cFirst = sc(scene, 4, "first"), cPuddle = sc(scene, 4, "puddle");
    var cFollow = sc(scene, 5, "follow"), cAfter = sc(scene, 5, "after"), cLinear = sc(scene, 5, "linear");
    var at = [cCup, cBag, cWater, cMilk, cStir];
    var out = "";

    /* the cup as the list has built it, and the puddle the wrong order makes */
    var wrong = on(t, cFirst, 0.55) * (1 - on(t, cFollow, 0.55));
    /* The four other rows go first and the water row moves after them, so that
       nothing slides THROUGH a row that is still there (--sample caught two
       rows sitting on top of each other on the way out and again on the way
       back). Coming back, the water row lands before the others return. */
    var faded = on(t, cFirst, 0.3) * (1 - on(t, cFollow == null ? null : cFollow + 0.5, 0.4));
    var slide = on(t, cFirst == null ? null : cFirst + 0.35, 0.5) * (1 - on(t, cFollow, 0.5));
    var done = [];
    PI_TEA.forEach(function (s, k) { if (piPast(t, at[k])) done.push(s.id); });
    if (wrong < 1) out += piCanvas(ART.scene("tea", done), PI_BOX, (1 - wrong) * on(t, cTea, 0.5),
      piPast(t, cStir) ? P.good : P.line);
    if (wrong > 0) {
      out += piCanvas(ART.scene("tea", ["water"]), PI_BOX, wrong, P.bad);
      out += MK.cross(piBX(160), piBY(150), 30, popIn(t, cPuddle, 0.4) * wrong);
    }
    /* "the tea goes brown": the colour in the cup, ringed while it changes */
    var br = bump(t, cBrown, 1.5) * (1 - wrong);
    if (br > 0) out += R(piBX(106) - 5, piBY(112) - 5, 108 * PI_BOX.w / 320 + 10,
      50 * PI_BOX.h / 240 + 10, 6, "none", P.gold, 5, { opacity: br });
    out += MK.ripple(piBX(160), piBY(136), t, cStir, P.gold);

    /* the five steps, as slots and then as rows */
    var shown = tally(t, cFive, 5, 1.0);
    for (var k = 0; k < 5; k++) if (k < shown && !piPast(t, at[k])) out += piSlot(PI_PANEL.x, piR5Y(k), PI_PANEL.w, PI_R5.h, k + 1, 1);
    PI_TEA.forEach(function (s, k) {
      var o = on(t, at[k], 0.45);
      if (o <= 0) return;
      /* while the water goes first, that one step stands alone at the top */
      var slot = k === 2 ? lerp(2, 0, slide) : k;
      var y = piR5Y(slot), fade = k === 2 ? 1 : 1 - 0.85 * faded;
      var sweep = bump(t, cFollow == null ? null : cFollow + k * 0.22, 0.6);
      out += piRow(PI_PANEL.x, y, PI_PANEL.w, PI_R5.h, Math.round(slot) + 1, s.text,
        { o: o * fade, fs: 19, pic: s.pic,
          col: k === 2 && wrong > 0.4 ? P.bad : sweep > 0.05 ? P.gold : P.good,
          mark: k === 2 && wrong > 0.4 ? "cross" : "tick",
          markP: k === 2 && wrong > 0.4 ? popIn(t, cPuddle, 0.4) : popIn(t, at[k] == null ? null : at[k] + 0.5, 0.35) });
      out += MK.ripple(PI_PANEL.x + 30, y + PI_R5.h / 2, t, at[k], P.gold);
    });

    /* one step after another, in a straight line */
    out += MK.arrow(612, piR5Y(0) + 10, 612, piR5Y(4) + PI_R5.h - 10, on(t, cAfter, 0.8) * (1 - wrong), P.teal, 8);
    out += MK.pill(584, 414, "a linear algorithm", on(t, cLinear, 0.45), { size: 24, col: P.teal, ink: P.ink });
    return svg(out);
  }
