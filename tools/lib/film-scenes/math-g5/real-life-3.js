
  /* ==== Real Life, part 3 ========================================================
     The chapters "A square, the other way round", "Reading the story", and
     "What you now know". REVISED 2026-09-25: replaces the invented "estimate,
     then divide" chapter (356 oranges / 4 crates) and the invented "reading
     the story" ticket problem (65 x 6). The lesson's own real square/cube
     problems carry both chapters now: the rug (144 tiles, root the other way
     round) and the square garden (64 sq m) for squares; the block tower
     (4 blocks along every edge) read start to finish for the story. */

  /* ==== chapter: a square, the other way round ===================================
     The rug asks for an edge given the whole square (144, tried at 12); the
     garden asks the same the smaller way (64, at 8) - so the chapter closes on
     "a square number works both ways". ART.array draws both grids at the true
     count, so the 144 and the 64 are dots a learner could count, not only a
     number said. */
  function rlfSquaresChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRug144 = c(0, "rug144");
    var cHowmany = c(1, "howmany"), cTry12 = c(1, "try12");
    var cTwelvesq = c(2, "twelvesq"), cTwelveedge = c(2, "twelveedge");
    var cGarden64 = c(3, "garden64");
    var cEightsq = c(4, "eightsq"), cEightside = c(4, "eightside");
    var cBothways = c(5, "bothways");
    var cItself = c(6, "itself");
    var out = "";

    var rugO = popIn(t, cRug144, 0.5);
    if (rugO > 0) {
      out += MK.pic(150, 60, 60, "\u{1F7E7}", { opacity: Math.min(1, rugO) });
      out += Tx(150, 120, "144 tiles", "lab big", "middle", { opacity: Math.min(1, rugO), fill: P.gold });
    }
    var howmanyO = on(t, cHowmany, 0.5);
    if (howmanyO > 0) out += MK.pill(150, 165, "how many along one edge?", howmanyO, { size: 18, col: P.line });
    var try12O = popIn(t, cTry12, 0.5);
    if (try12O > 0) out += MK.pill(150, 205, "Try 12", Math.min(1, try12O), { size: 24, col: P.teal });

    var gridO = popIn(t, cTwelvesq, 0.5);
    if (gridO > 0) out += G(ART.place(ART.array(12, 12, { colour: P.teal, label: "12 × 12 = 144" }), 340, 20, 300, 300), { opacity: Math.min(1, gridO) });
    var edgeO = on(t, cTwelveedge, 0.5);
    if (edgeO > 0) out += MK.pill(490, 355, "12 tiles along each edge", edgeO, { size: 19, col: P.teal });

    var gardenO = popIn(t, cGarden64, 0.5);
    if (gardenO > 0) {
      out += MK.pic(1000, 60, 56, "\u{1F33F}", { opacity: Math.min(1, gardenO) });
      out += Tx(1000, 115, "64 sq m", "lab big", "middle", { opacity: Math.min(1, gardenO), fill: P.plum });
    }
    var eightsqO = popIn(t, cEightsq, 0.5);
    if (eightsqO > 0) out += Tx(1000, 160, "8 × 8 = 64", "lab mid", "middle", { opacity: Math.min(1, eightsqO), fill: P.good });
    var eightsideO = on(t, cEightside, 0.5);
    if (eightsideO > 0) out += MK.pill(1000, 205, "each side is 8 metres", eightsideO, { size: 17, col: P.good });

    var bothO = on(t, cBothways, 0.5) * (1 - on(t, cItself, 0.5));
    if (bothO > 0) out += MK.pill(584, 405, "a square number works both ways", bothO, { size: 20, col: P.gold });
    var itselfO = on(t, cItself, 0.5);
    if (itselfO > 0) out += MK.pill(584, 405, "a whole number, multiplied by itself", itselfO, { size: 20, col: P.gold });

    return svg(out);
  }

  /* ==== chapter: reading the story ================================================
     The block tower, read start to finish: the numbers found, the question
     named, the method chosen, then worked out exactly the way the lesson does
     it - one layer (4 x 4 = 16), then four layers stacked (16 x 4 = 64). */
  function rlfStoryChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cBlocks4 = c(0, "blocks4");
    var cFindnum = c(1, "findnum");
    var cFindask = c(2, "findask"), cWholecube = c(2, "wholecube");
    var cOnelayer = c(3, "onelayer"), cSixteen = c(3, "sixteen");
    var cFourlayers = c(4, "fourlayers"), cSixtyfour = c(4, "sixtyfour");
    var cMulttool = c(5, "multtool");
    var cReadfirst = c(6, "readfirst"), cChoosetool = c(6, "choosetool");
    var out = "";

    var blocksO = popIn(t, cBlocks4, 0.5);
    if (blocksO > 0) {
      out += MK.pic(150, 70, 68, "\u{1F9F1}", { opacity: Math.min(1, blocksO) });
      out += Tx(150, 140, "4 along every edge", "lab mid", "middle", { opacity: Math.min(1, blocksO), fill: P.gold });
    }
    var numO = on(t, cFindnum, 0.5);
    if (numO > 0) out += MK.pill(150, 190, "find the numbers", numO, { size: 19, col: P.gold });
    var askO = on(t, cFindask, 0.5);
    if (askO > 0) out += MK.pill(150, 235, "find the real question", askO, { size: 19, col: P.teal });
    var wholeO = on(t, cWholecube, 0.5);
    if (wholeO > 0) out += MK.pill(150, 278, "how many blocks in all?", wholeO, { size: 18, col: P.teal });

    var layerO = popIn(t, cOnelayer, 0.5);
    if (layerO > 0) out += G(ART.place(ART.array(4, 4, { colour: P.gold, label: "4 × 4 = 16" }), 420, 30, 250, 250), { opacity: Math.min(1, layerO) });
    var sixteenO = on(t, cSixteen, 0.5);
    if (sixteenO > 0) out += MK.pill(545, 300, "one layer: 16 blocks", sixteenO, { size: 19, col: P.gold });

    var fourO = popIn(t, cFourlayers, 0.5);
    if (fourO > 0) {
      var k;
      for (k = 0; k < 4; k++) out += MK.pic(950, 60 + k * 46, 38, "\u{1F9F1}", { opacity: Math.min(1, fourO) });
    }
    var sixtyfourO = popIn(t, cSixtyfour, 0.5);
    if (sixtyfourO > 0) out += Tx(1050, 150, "16 × 4 = 64", "lab big", "middle", { opacity: Math.min(1, sixtyfourO), fill: P.good });

    var multO = on(t, cMulttool, 0.5);
    if (multO > 0) out += MK.pill(584, 370, "multiplying is the right tool", multO, { size: 20, col: P.accent });
    var readO = on(t, cReadfirst, 0.5);
    if (readO > 0) out += MK.pill(380, 415, "read the story first", readO, { size: 19, col: P.line });
    var chooseO = on(t, cChoosetool, 0.5);
    if (chooseO > 0) out += MK.pill(790, 415, "then choose the tool", chooseO, { size: 19, col: P.line });

    return svg(out);
  }

  /* ==== what you now know =========================================================
     Five cards, laid out the way MK.recapKind would draw them, so a small
     tick can be added inside a card without fighting its private closure.
     Recap beat 0 names all three methods on its own, so each word gets its
     own tick in the card's corner as it is said. */
  var RLF_RECAP_CARDS = [
    { beat: 0, at: "choose3", title: "Choose a method", sub: "mental, jottings, formal",
      pic: function (cx, cy, size) {
        var s = size * 0.32;
        return Em(cx - s, cy, s * 1.7, "\u{1F9E0}") + Em(cx, cy, s * 1.7, "✏️") + Em(cx + s, cy, s * 1.7, "✍️");
      } },
    { beat: 1, at: "guessfirst", title: "Guess first", sub: "then check it", pic: "\u{1F3B2}" },
    { beat: 2, at: "recap144", title: "144", sub: "12 × 12", pic: "\u{1F7E7}" },
    { beat: 2, at: "recap64", title: "64", sub: "4 × 4 × 4", pic: "\u{1F9F1}" },
    { beat: 3, at: "alwaysread", title: "Read first", sub: "then pick the tool", pic: "\u{1F4D6}" }
  ];

  function rlfRecapChapter(scene, beat, t, i) {
    var cards = RLF_RECAP_CARDS;
    var M = 4, n = cards.length, cols = n <= 3 ? n : n === 4 ? 2 : 3, rows = Math.ceil(n / cols), gap = 14;
    var w = (1168 - 2 * M - (cols - 1) * gap) / cols, h = Math.min(212, (440 - 2 * M - (rows - 1) * gap) / rows);
    var top = (440 - rows * h - (rows - 1) * gap) / 2;
    var c = function (k, name) { return sc(scene, k, name); };
    var cMentally3 = c(0, "mentally3"), cJottings3 = c(0, "jottings3"), cFormal3 = c(0, "formal3");
    var cCheckexact = c(1, "checkexact"), cPickfits = c(3, "pickfits");
    var go = c(4, "samesteps");
    var out = "";
    cards.forEach(function (cd, k) {
      var row = Math.floor(k / cols), inRow = row < rows - 1 ? cols : n - cols * (rows - 1);
      var x = (1168 - inRow * w - (inRow - 1) * gap) / 2 + (k % cols) * (w + gap), y = top + row * (h + gap);
      var p = popIn(t, sc(scene, cd.beat, cd.at), 0.4), lit = p > 0;
      var pulse = go != null && t >= go ? 0.6 + 0.4 * breathe(t + k * 0.4) : 1;
      var size = h * 0.44, cx = x + w / 2, cy = y + h * 0.36;
      var art = typeof cd.pic === "function" ? cd.pic(cx, cy, size, t) : MK.pic(cx, cy, size, cd.pic);
      out += G(R(x, y, w, h, 22, lit ? "#1B3A52" : P.card, lit ? P.teal : P.line, lit ? 3 : 2, { "stroke-opacity": lit ? pulse : 1 }) +
        art + Tx(cx, y + h - 42, cd.title, "lab big", "middle") +
        (cd.sub ? Tx(cx, y + h - 15, cd.sub, "lab mid muted readable", "middle") : ""),
        { opacity: 0.32 + 0.68 * Math.min(1, p), transform: around(cx, y + h / 2, lit ? 0.96 + 0.04 * Math.min(p, 1.08) : 0.96) });

      if (k === 0) {
        var mO = popIn(t, cMentally3, 0.35), jO = popIn(t, cJottings3, 0.35), fO = popIn(t, cFormal3, 0.35);
        if (mO > 0) out += MK.tick(x + w - 54, y + 24, 12, Math.min(1, mO));
        if (jO > 0) out += MK.tick(x + w - 30, y + 24, 12, Math.min(1, jO));
        if (fO > 0) out += MK.tick(x + w - 6, y + 24, 12, Math.min(1, fO));
      }
      if (k === 1 && cCheckexact != null) out += MK.tick(x + w - 24, y + 24, 14, popIn(t, cCheckexact, 0.35));
      if (k === 4 && cPickfits != null) out += MK.tick(x + w - 24, y + 24, 14, popIn(t, cPickfits, 0.35));
    });
    return svg(out);
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["Choose a method: mental, jottings or formal", "Make a sensible guess, then check it", "Squares and cubes, the story behind each one"] }),
    choosing: rlfChoosingChapter, estimating: rlfEstimatingChapter,
    squares: rlfSquaresChapter, story: rlfStoryChapter,
    recap: rlfRecapChapter
  };
