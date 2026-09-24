  /* ==== Spreadsheets, part 3: recording, a range, and the recap ===============
     tools/lib/film-scenes/computing-g3/spreadsheets-3.js. Continues
     spreadsheets-2.js, in the same scope.

     THE ARITHMETIC IS COMPUTED, NEVER TYPED TWICE. The total in the range
     chapter is spTotal() over the very cells the sheet is drawing, so when C4
     goes from 30 to 40 the box changes because the column changed. The paper
     table beside it keeps the OLD total on purpose - that is the lesson's
     "a paper table cannot do that" - and it is marked with a cross so no child
     reads it as the answer. */

  /* ==== chapter: recording data ==================================================
     The lesson's own tablet (ART.figure), the lesson's own pocket-money sheet,
     and the lesson's own task: Zara gets four pounds, so a 4 goes into C4. */

  var SP_RC = spGeom(310, 52, SP_POCKET.cols, SP_POCKET.rows, 150, 64);
  var SP_TAB = { x: 56, y: 34, w: 196, h: 285 };
  var SP_DOES = [
    { id: "Format", pic: "\u{1F4B7}" },
    { id: "Filter", pic: "\u{1F50D}" },
    { id: "Sort", pic: "\u{1F522}" },
    { id: "Add", pic: "➕" }
  ];

  function spKindChip(x, y, pic, word, text, col, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, 290, 76, 16, P.card, col, 3) +
      Em(x + 40, y + 38, 32, pic) +
      Tx(x + 74, y + 34, word, "lab", "start", { fill: col }) +
      Tx(x + 74, y + 60, text, "lab small muted", "start"),
      { opacity: Math.min(1, o), transform: around(x + 145, y + 38, Math.min(1.04, o)) });
  }

  function spRecordChapter(scene, beat, t, i) {
    var cTyping = sc(scene, 0, "typing"), cRec = sc(scene, 0, "recording"), cDevice = sc(scene, 0, "device");
    var cTap = sc(scene, 1, "tap"), cTablet = sc(scene, 1, "tablet"), cFour = sc(scene, 1, "four");
    var cNumber = sc(scene, 2, "number"), cWord = sc(scene, 2, "word");
    var cC4 = sc(scene, 3, "c4"), cA4 = sc(scene, 3, "a4"), cBoth = sc(scene, 3, "both");
    var cWork = sc(scene, 4, "work"), cFormat = sc(scene, 4, "format"), cFilter = sc(scene, 4, "filter"),
      cSort = sc(scene, 4, "sort"), cAdd = sc(scene, 4, "add");
    var cWorld = sc(scene, 5, "world");
    var g = SP_RC, out = "", c4 = spAt(g, "C4"), a4 = spAt(g, "A4");

    /* the tablet: the lesson's own drawing, its screen ringed as it is named */
    var tabO = popIn(t, cTyping, 0.5);
    if (tabO > 0) {
      var fig = ART.figure("tablet");
      var ringed = on(t, cDevice, 0.5) + on(t, cTablet, 0.5) * spOnly(t, scene, 1);
      if (ringed > 0.35) fig = ART.ring(fig, "screen", P.plum, 8);
      out += G(ART.place(fig, SP_TAB.x, SP_TAB.y, SP_TAB.w, SP_TAB.h),
        { opacity: Math.min(1, tabO), transform: around(SP_TAB.x + SP_TAB.w / 2, SP_TAB.y + SP_TAB.h / 2, Math.min(1.05, tabO)) });
      out += Tx(SP_TAB.x + SP_TAB.w / 2, 356, "a computing device", "lab mid", "middle",
        { fill: P.plum, opacity: on(t, cDevice, 0.5) });
    }

    /* the sheet, with the 4 the lesson's task puts into C4 */
    var cells = Object.assign({}, SP_POCKET.cells);
    var typed = spPast(t, cFour);
    if (typed) cells.C4 = 4;
    out += spSheet(g, {
      cells: cells, o: on(t, cTyping, 0.5),
      rings: [
        { cell: "C4", o: Math.max(popIn(t, cTap, 0.45) * spOnly(t, scene, 1), popIn(t, cC4, 0.45) * spFrom(t, scene, 3) * (1 - spFrom(t, scene, 4))), col_: P.gold },
        { cell: "A4", o: popIn(t, cA4, 0.45) * spFrom(t, scene, 3) * (1 - spFrom(t, scene, 4)), col_: P.teal }
      ],
      cellInk: { C4: P.gold, A4: spPast(t, cA4) ? P.teal : null }
    });
    out += MK.ripple(c4.mx, c4.my, t, cTap, P.gold);
    out += MK.finger(c4.mx + 6, c4.my + 10, on(t, cTap, 0.35) * (1 - on(t, cFour, 0.5)));
    out += MK.pill(560, 410, "recording data", on(t, cRec, 0.5) * spOnly(t, scene, 0),
      { size: 24, col: P.plum, ink: P.plum });

    /* the two kinds of data, one chip each */
    out += spKindChip(840, 90, "\u{1F522}", "4", "a number you count", P.gold,
      popIn(t, cNumber, 0.45) * spFrom(t, scene, 2));
    out += spKindChip(840, 196, "\u{1F524}", "Zara", "a word that says which kind", P.teal,
      popIn(t, cWord, 0.45) * spFrom(t, scene, 2));
    out += MK.pill(985, 316, "both are data", popIn(t, cBoth, 0.45) * (1 - spFrom(t, scene, 4)),
      { size: 22, col: P.good, ink: P.good });

    /* what the sheet can do with it, once it is in */
    var doesAt = [cFormat, cFilter, cSort, cAdd], world = on(t, cWorld, 0.6);
    SP_DOES.forEach(function (d, k) {
      var o = popIn(t, doesAt[k], 0.4) * (1 - world);
      if (!(o > 0)) return;
      var x = 330 + k * 200;
      out += G(R(x, 392, 180, 44, 22, "#173F35", P.good, 3) +
        Em(x + 30, 415, 22, d.pic) + Tx(x + 54, 422, d.id, "lab", "start", { fill: P.good }),
        { opacity: Math.min(1, o), transform: around(x + 90, 414, Math.min(1.05, o)) });
    });
    out += Tx(985, 360, "the sheet can do the work", "lab mid muted", "middle",
      { opacity: on(t, cWork, 0.5) * (1 - world) });
    if (world > 0)
      out += G(R(300, 390, 832, 46, 23, P.card, P.plum, 3) +
        Em(348, 415, 26, "\u{1F30D}") +
        Tx(730, 422, "so much of the world's data lives in spreadsheets", "lab", "middle", { fill: P.plum }),
        { opacity: world });
    return svg(out);
  }

  /* ==== chapter: a range of cells ================================================
     The bake-sale money column, C2 to C4. The total is the SUM OF THE CELLS
     DRAWN, so changing C4 from 30 to 40 changes it because the column changed. */

  var SP_RG = spGeom(250, 56, SP_BAKE.cols, SP_BAKE.rows, 150, 66);
  var SP_RANGE = ["C2", "C3", "C4"];

  function spRangeChapter(scene, beat, t, i) {
    var cOne = sc(scene, 0, "one"), cRange = sc(scene, 0, "range"), cBlock = sc(scene, 0, "block");
    var cColon = sc(scene, 1, "colon"), cC2C4 = sc(scene, 1, "c2c4"), cEvery = sc(scene, 1, "every");
    var cSelect = sc(scene, 2, "select"), cThree = sc(scene, 2, "three"), cGo = sc(scene, 2, "go");
    var cTotal = sc(scene, 3, "total"), cSum = sc(scene, 3, "sum");
    /* the three amounts, each counted into the box as it is SAID: the box
       fills on "thirty", the moment the last of them is in, so the answer is
       already standing there when the voice says seventy-three. (It used to
       fill on "seventy-three" itself, the last word of the line, and the
       number the whole chapter is about had 1.3 s on screen.) */
    var cCount = [sc(scene, 3, "n18"), sc(scene, 3, "n25"), sc(scene, 3, "n30")];
    var cChange = sc(scene, 4, "change"), cNew = sc(scene, 4, "newtotal");
    var cPaper = sc(scene, 5, "paper"), cRight = sc(scene, 5, "right");
    var g = SP_RG, out = "";

    var changed = spPast(t, cChange);
    var cells = Object.assign({}, SP_BAKE.cells);
    if (changed) cells.C4 = 40;
    var money = spPast(t, cGo) || spPast(t, cThree);
    var shownMoney = tally(t, cThree, 3, 0.8);

    var fmt = {}, tag = {};
    if (money) { fmt.C = "currency"; tag.C = "currency"; }

    /* one cell, then the block of three */
    var oneO = popIn(t, cOne, 0.45) * (1 - on(t, cBlock, 0.5));
    var blockO = Math.max(on(t, cBlock, 0.5), on(t, cC2C4, 0.5));
    var rings = [{ cell: "C2", o: oneO, col_: P.gold }];
    if (blockO > 0) SP_RANGE.forEach(function (n) {
      rings.push({ cell: n, o: blockO, col_: P.good });
    });

    /* No column band here: the whole column is not the range, and a band down
       C beside a bracket round C2:C4 says two different things at once. */
    out += spSheet(g, {
      cells: cells, fmt: fmt, fmtTag: tag, o: 1,
      rings: rings,
      hdrRings: [{ col: "C", o: popIn(t, cGo, 0.4) * spOnly(t, scene, 2), col_: P.good }]
    });
    /* the block bracket down the three cells; it goes solid when selected */
    var selO = on(t, cSelect, 0.5);
    if (blockO > 0) {
      var a = spAt(g, "C2"), b = spAt(g, "C4");
      out += R(a.x - 4, a.y - 4, g.cw + 8, (b.y + g.rh) - a.y + 8, 12, "none", P.good, 4 + 2 * selO,
        { opacity: Math.min(1, blockO), "stroke-dasharray": selO > 0.5 ? null : "12 8" });
    }
    /* "every cell": one tick per cell of the range, counted off */
    var ticked = tally(t, cEvery, 3, 0.8);
    SP_RANGE.forEach(function (n, k) {
      if (k >= ticked) return;
      var c = spAt(g, n);
      out += MK.tick(c.x + g.cw - 16, c.my, 13, popIn(t, cEvery == null ? null : cEvery + k * 0.35, 0.35) * (1 - on(t, cSelect, 0.5)));
    });
    /* the three cells the currency format reaches, counted off as they change */
    SP_RANGE.forEach(function (n, k) {
      if (!money || k >= shownMoney) return;
      var c = spAt(g, n);
      out += MK.ripple(c.mx, c.my, t, cThree == null ? null : cThree + k * 0.3, P.good);
    });
    out += MK.pill(spAt(g, "C2").mx, 412, "one cell: C2", oneO, { size: 24, col: P.gold, ink: P.gold });
    out += Tx(1040, 210, "a block of cells", "lab mid", "middle",
      { fill: P.good, opacity: on(t, cRange, 0.5) * spOnly(t, scene, 0) });
    out += MK.pill(1040, 82, "C2:C4", popIn(t, cColon, 0.45), { size: 30, col: P.good, ink: P.good });
    out += Tx(1040, 124, "from C2 down to C4", "lab small muted", "middle", { opacity: on(t, cC2C4, 0.5) });
    out += MK.ripple(spAt(g, "C1").mx, g.y + g.hh / 2, t, cGo, P.good);

    /* the total, read off the cells the sheet is drawing */
    var boxO = on(t, cTotal, 0.5);
    var total = spTotal(cells, SP_RANGE);
    var filled = Math.max(popIn(t, cCount[2], 0.45), popIn(t, cSum, 0.45), popIn(t, cNew, 0.45));
    if (boxO > 0) {
      out += G(R(940, 160, 200, 140, 18, P.card, P.good, 3) +
        Tx(1040, 198, "Total", "lab mid muted", "middle") +
        Tx(1040, 258, filled > 0 ? spShow(total, "currency") : "–", "lab huge", "middle",
          { fill: P.good, "font-size": filled > 0 ? 40 : 40 }),
        { opacity: Math.min(1, boxO), transform: around(1040, 230, Math.min(1.04, Math.max(boxO, filled))) });
      /* the three cells go into the total one at a time, each as its own
         amount is said. A leader from each cell to the box would be drawn
         straight through column D's words. */
      SP_RANGE.forEach(function (n, k) {
        var c = spAt(g, n);
        out += MK.ripple(c.mx, c.my, t, cCount[k], P.good);
      });
      out += MK.glow(1040, 240, 90, P.good, Math.max(bump(t, cNew, 1.2), bump(t, cSum, 1.2)) * 0.9);
    }
    out += MK.ripple(spAt(g, "C4").mx, spAt(g, "C4").my, t, cChange, P.gold);

    /* the paper table, which keeps the total it was written with */
    var paperO = popIn(t, cPaper, 0.5);
    if (paperO > 0) {
      out += G(R(44, 140, 186, 214, 18, P.card, P.bad, 3) +
        Em(137, 186, 40, "\u{1F4C4}") +
        Tx(137, 232, "on paper", "lab mid muted", "middle") +
        /* the total the paper was WRITTEN with: the sum of the bake-sale
           column before C4 was changed, worked out here rather than typed */
        Tx(137, 278, "total £" + spTotal(SP_BAKE.cells, SP_RANGE), "lab big bad", "middle"),
        { opacity: Math.min(1, paperO), transform: around(137, 246, Math.min(1.04, paperO)) });
      out += MK.cross(137, 322, 24, popIn(t, cPaper == null ? null : cPaper + 0.5, 0.4));
    }
    out += MK.tick(1040, 330, 26, popIn(t, cRight, 0.45));
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own six words, with the lesson's own pictures for them. */
  var SP_RECAP = MK.recapKind([
    { beat: 0, at: "cell", title: "Cell", sub: "column letter, row number", pic: "\u{1F3AF}" },
    { beat: 0, at: "data", title: "Data", sub: "what goes in a cell", pic: "✏️" },
    { beat: 1, at: "format", title: "Format", sub: "the kind of thing it holds", pic: "\u{1F4B7}" },
    { beat: 1, at: "filter", title: "Filter", sub: "pick rows by a characteristic", pic: "\u{1F50D}" },
    { beat: 2, at: "range", title: "Range", sub: "a block of cells", pic: "\u{1F4D0}" },
    { beat: 2, at: "total", title: "Total", sub: "a range added up", pic: "➕" }
  ], { goBeat: 2, goAt: "total" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "How a cell gets its name, from its column and its row",
      "How to format a cell for its purpose",
      "How a filter picks out just the rows you need"
    ] }),
    grid: spGridChapter,
    formats: spFormatsChapter,
    filter: spFilterChapter,
    record: spRecordChapter,
    range: spRangeChapter,
    recap: SP_RECAP
  };
