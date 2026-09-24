  /* ==== Spreadsheets, part 2: formats, and the filter =========================
     tools/lib/film-scenes/computing-g3/spreadsheets-2.js. Continues
     spreadsheets.js, in the same scope.

     The formats chapter is the lesson's bake-sale sheet: the format word sits
     in the column header, exactly where the lesson's own task puts it ("Tap
     the C at the top and format the column"), and the cells redraw themselves
     through spShow, so the pounds and pence in the picture come from the
     format rather than from a second copy of the number.

     The filter chapter is the lesson's six children. WHICH ROWS LIGHT UP IS
     ART.rowMatches, the kit's own rule, and the count under the button is the
     length of what it selected - so "Two children have a dog" and "Four rows
     match" are read off the same data the lesson filters. */

  /* ---- the four formats, as the lesson names them --------------------------- */
  var SP_FORMATS = [
    { id: "text", pic: "\u{1F524}", why: "words" },
    { id: "number", pic: "\u{1F522}", why: "counts" },
    { id: "date", pic: "\u{1F4C5}", why: "dates" },
    { id: "currency", pic: "\u{1F4B7}", why: "money" }
  ];

  var SP_FG = spGeom(310, 56, SP_BAKE.cols, SP_BAKE.rows, 150, 66);

  function spChip(x, y, f, o, lit) {
    if (!(o > 0)) return "";
    var col = lit > 0.5 ? (SP_INK[f.id] || P.gold) : P.line;
    return G(R(x, y, 244, 54, 14, lit > 0.5 ? "#1B3A52" : P.cell, col, lit > 0.5 ? 3 : 2) +
      Em(x + 32, y + 28, 28, f.pic) +
      Tx(x + 62, y + 35, f.id, "lab", "start", { fill: lit > 0.5 ? col : P.ink }) +
      Tx(x + 232, y + 35, f.why, "lab small muted", "end"),
      { opacity: Math.min(1, o), transform: around(x + 122, y + 27, Math.min(1.04, o)) });
  }

  function spFormatsChapter(scene, beat, t, i) {
    var cSheet = sc(scene, 0, "sheet"), cFormat = sc(scene, 0, "format"), cKind = sc(scene, 0, "kind");
    var cColB = sc(scene, 1, "colb"), cDate = sc(scene, 1, "date"), cSort = sc(scene, 1, "sort");
    var cColC = sc(scene, 2, "colc"), cCurr = sc(scene, 2, "currency"), cPp = sc(scene, 2, "pp");
    var cD4 = sc(scene, 3, "d4"), cBooks = sc(scene, 3, "books"), cText = sc(scene, 3, "text");
    var cAll = sc(scene, 4, "all"), cNoSort = sc(scene, 4, "sort"), cNoAdd = sc(scene, 4, "add");
    var g = SP_FG, out = "";

    var allText = on(t, cAll, 0.6);
    var isDate = spPast(t, cDate) && allText < 0.5;
    var isCurr = spPast(t, cCurr) && allText < 0.5;
    var isText = spPast(t, cText);

    var fmt = {}, tag = {};
    if (isDate) { fmt.B = "date"; tag.B = "date"; }
    if (isCurr) { fmt.C = "currency"; tag.C = "currency"; }
    if (allText >= 0.5) { tag.A = "text"; tag.B = "text"; tag.C = "text"; tag.D = "text"; }
    else if (isText) tag.D = "text";

    var bands = [
      { col: "B", o: spWindow(t, cColB, cColC) * spFrom(t, scene, 1) * (1 - allText), col_: P.blue },
      { col: "C", o: spWindow(t, cColC, cD4) * (1 - allText), col_: P.good }
    ];
    var rings = [{ cell: "D4", o: popIn(t, cD4, 0.45) * (1 - allText), col_: P.ink }];

    out += spSheet(g, {
      cells: SP_BAKE.cells, o: on(t, cSheet, 0.5), fmt: fmt, fmtTag: tag,
      bands: bands, rings: rings,
      hdrRings: [
        { col: "B", o: popIn(t, cDate, 0.4) * spOnly(t, scene, 1), col_: P.blue },
        { col: "C", o: popIn(t, cCurr, 0.4) * spOnly(t, scene, 2), col_: P.good }
      ]
    });
    out += MK.ripple(g.cx(1) + g.cw / 2, g.y + g.hh / 2, t, cDate, P.blue);
    out += MK.ripple(g.cx(2) + g.cw / 2, g.y + g.hh / 2, t, cCurr, P.good);
    out += MK.ripple(spAt(g, "D4").mx, spAt(g, "D4").my, t, cD4, P.ink);

    /* the four formats, down the left */
    var shown = tally(t, cFormat, 4, 0.9);
    var litId = allText >= 0.5 ? "text" : isText ? "text" : isCurr ? "currency" : isDate ? "date" : null;
    /* all four light while "what kind of thing" is said, and after that only
       the one the sheet is being given */
    var pulse = on(t, cKind, 0.45) * spOnly(t, scene, 0);
    SP_FORMATS.forEach(function (f, k) {
      var o = k < shown ? on(t, cFormat == null ? null : cFormat + k * 0.25, 0.4) : 0;
      out += spChip(40, 44 + k * 62, f, o, f.id === litId ? 1 : pulse > 0.5 ? 1 : 0);
    });
    out += Tx(162, 340, "one cell, one kind", "lab mid muted", "middle",
      { opacity: on(t, cKind, 0.5) * (1 - on(t, cColB, 0.5)) });

    /* the word in D4, said and shown */
    out += MK.pill(spAt(g, "D4").mx, 416, "Books is a word", on(t, cBooks, 0.45) * spOnly(t, scene, 3),
      { size: 20, col: P.ink, ink: P.ink });

    /* what the two formats buy, down the right, crossed out when all is text.
       The pills sit close to both the sheet on their left and the 1168 edge on
       their right, with no room to move a radius-26 cross beside either
       without either overlapping the sheet or running off the box - so the
       cross sits just ABOVE its pill instead of centred on it. Centred, it
       blotted half of "in date order" and half of "ready to add up". */
    out += MK.pill(1064, 150, "in date order", on(t, cSort, 0.5), { size: 18, col: P.blue, ink: P.blue });
    out += MK.pill(1064, 250, "ready to add up", on(t, cPp, 0.5), { size: 18, col: P.good, ink: P.good });
    out += MK.cross(1064, 102, 26, popIn(t, cNoSort, 0.4));
    out += MK.cross(1064, 202, 26, popIn(t, cNoAdd, 0.4));
    out += Tx(1050, 330, "text can do neither", "lab mid bad", "middle", { opacity: allText });
    return svg(out);
  }

  /* ==== chapter: pick out the rows you need =======================================
     The lesson's own six children, one row each, and the lesson's own filter
     builder beside them. ART.rowMatches decides which rows light; the number
     under the button is how many it selected. */

  var SP_KIDS = [
    { name: "Amal", pic: "\u{1F467}\u{1F3FE}", pet: "cat", age: 8, club: "art" },
    { name: "Sami", pic: "\u{1F466}\u{1F3FE}", pet: "none", age: 7, club: "football" },
    { name: "Zara", pic: "\u{1F467}\u{1F3FD}", pet: "dog", age: 8, club: "music" },
    { name: "Omar", pic: "\u{1F466}\u{1F3FD}", pet: "dog", age: 7, club: "art" },
    { name: "Leo", pic: "\u{1F466}\u{1F3FB}", pet: "cat", age: 9, club: "football" },
    { name: "Nora", pic: "\u{1F467}\u{1F3FB}", pet: "none", age: 8, club: "art" }
  ];
  var SP_TCOL = [
    { key: "pic", x: 60, w: 56, label: "" },
    { key: "name", x: 116, w: 138, label: "name" },
    { key: "pet", x: 254, w: 118, label: "pet" },
    { key: "age", x: 372, w: 80, label: "age" },
    { key: "club", x: 452, w: 126, label: "club" }
  ];
  var SP_THEAD = { y: 48, h: 44 }, SP_TROW = { y: 92, h: 52 };
  var SP_PANEL = { x: 630, y: 56, w: 500, h: 300 };

  function spRowY(k) { return SP_TROW.y + k * SP_TROW.h; }
  function spMatches(spec) {
    return SP_KIDS.map(function (r) { return ART.rowMatches(r, spec); });
  }
  function spCount(spec) {
    return spMatches(spec).filter(function (v) { return v; }).length;
  }

  function spSlot(x, y, w, h, label, value, o, col) {
    var out = R(x, y, w, h, 12, P.ground, o > 0 ? (col || P.gold) : P.line, o > 0 ? 3 : 2);
    if (o > 0) out += Tx(x + w / 2, y + h / 2 + 9, value, "lab", "middle",
      { fill: col || P.gold, opacity: Math.min(1, o) });
    else out += Tx(x + w / 2, y + h / 2 + 8, label, "lab mid muted", "middle");
    return out;
  }

  function spFilterChapter(scene, beat, t, i) {
    var cSix = sc(scene, 0, "six"), cRowEach = sc(scene, 0, "row"), cPet = sc(scene, 0, "pet"),
      cAge = sc(scene, 0, "age"), cClub = sc(scene, 0, "club");
    var cFilter = sc(scene, 1, "filter"), cShare = sc(scene, 1, "share"), cBlink = sc(scene, 1, "blink");
    var cAsk = sc(scene, 2, "ask"), cField = sc(scene, 2, "field"), cDog = sc(scene, 2, "dog"), cPress = sc(scene, 2, "press");
    var cZara = sc(scene, 3, "zara"), cOmar = sc(scene, 3, "omar"), cTwo = sc(scene, 3, "two");
    var cAge2 = sc(scene, 4, "age"), cMore = sc(scene, 4, "more"), cFour = sc(scene, 4, "four");
    var out = "";

    /* which filter is standing in the builder, and which rows it selects */
    var onAge = spPast(t, cAge2);
    var spec = onAge ? { field: "age", op: "gt", value: 7 } : { field: "pet", op: "eq", value: "dog" };
    var hits = spMatches(spec);
    /* on beat 3 the two rows light one at a time, as they are named: Zara is
       row 3 of the table and Omar row 4, so the cut-off is the row index */
    var litUpto = onAge ? (spPast(t, cMore) ? SP_KIDS.length - 1 : -1)
      : spPast(t, cOmar) ? SP_KIDS.length - 1 : spPast(t, cZara) ? 2 : -1;
    var filtering = litUpto >= 0;

    /* the table */
    var shown = tally(t, cSix, 6, 1.1);
    SP_TCOL.forEach(function (c) {
      out += R(c.x, SP_THEAD.y, c.w - 4, SP_THEAD.h, 10, P.cell, P.line, 1.5, { opacity: on(t, cSix, 0.5) });
      if (!c.label) return;
      var lit = c.key === "pet" ? spWindow(t, cPet, cAge) : c.key === "age" ? spWindow(t, cAge, cClub)
        : c.key === "club" ? on(t, cClub, 0.4) * spOnly(t, scene, 0) : 0;
      lit = Math.max(lit, c.key === spec.field ? on(t, cField, 0.4) * (1 - spOnly(t, scene, 0)) : 0);
      out += Tx(c.x + (c.w - 4) / 2, SP_THEAD.y + 30, c.label, "lab", "middle",
        { fill: lit > 0.1 ? P.gold : P.muted, opacity: on(t, cSix, 0.5) });
      if (lit > 0.1) out += R(c.x, SP_THEAD.y, c.w - 4, SP_THEAD.h, 10, "none", P.gold, 3, { opacity: lit });
    });
    SP_KIDS.forEach(function (r, k) {
      var o = k < shown ? on(t, cSix == null ? null : cSix + k * 0.18, 0.4) : 0;
      if (!(o > 0)) return;
      var y = spRowY(k), hit = hits[k];
      var lit = filtering && hit && k <= litUpto;
      var dull = filtering && !lit ? 0.3 : 1;
      var col = lit ? P.good : P.line;
      var body = "";
      SP_TCOL.forEach(function (c) {
        body += R(c.x, y, c.w - 4, SP_TROW.h - 4, 10, lit ? "#173F35" : P.cell, col, lit ? 3 : 1.5);
        if (c.key === "pic") body += Em(c.x + (c.w - 4) / 2, y + SP_TROW.h / 2 - 2, 30, r.pic);
        else body += Tx(c.x + (c.w - 4) / 2, y + SP_TROW.h / 2 + 6, String(r[c.key]), "lab", "middle",
          { fill: lit ? P.good : P.ink, "font-size": 21 });
      });
      out += G(body, { opacity: Math.min(1, o) * dull });
      if (k === 0) out += R(56, y - 4, 526, SP_TROW.h + 4, 12, "none", P.gold, 3,
        { opacity: on(t, cRowEach, 0.4) * spOnly(t, scene, 0) });
    });

    /* the filter builder */
    var panelO = popIn(t, cFilter, 0.5) * spFrom(t, scene, 1);
    if (panelO > 0) {
      var p = SP_PANEL, body2 = R(p.x, p.y, p.w, p.h, 22, P.card, P.line, 3);
      var ask = onAge ? "Older than 7?" : "Who has a dog?";
      var askO = Math.max(on(t, cAsk, 0.45), on(t, cMore, 0.45));
      var shareO = on(t, cShare, 0.5) * (1 - on(t, cAsk, 0.5));
      body2 += Tx(p.x + p.w / 2, p.y + 48, ask, "lab big gold", "middle", { opacity: askO });
      /* the panel's own name only while nothing has taken its place */
      body2 += Tx(p.x + p.w / 2, p.y + 48, "Filter", "lab big", "middle",
        { opacity: (1 - askO) * (1 - shareO), fill: P.muted });
      body2 += Tx(666, 188, "Field", "lab mid muted", "start");
      body2 += spSlot(770, 156, 330, 48, "choose a field", spec.field,
        Math.max(on(t, cField, 0.4), onAge ? 1 : 0), P.gold);
      body2 += Tx(666, 254, "Is", "lab mid muted", "start");
      body2 += spSlot(770, 222, 330, 48, "choose a value",
        onAge ? "more than 7" : "dog", Math.max(on(t, cDog, 0.4), onAge ? 1 : 0), P.gold);
      var btn = Math.max(on(t, cPress, 0.3), filtering ? 1 : 0);
      body2 += R(770, 286, 330, 54, 27, btn > 0.5 ? P.gold : P.cell, P.gold, 3);
      body2 += Tx(935, 322, "Filter", "lab big", "middle", { fill: btn > 0.5 ? P.ground : P.gold });
      out += G(body2, { opacity: Math.min(1, panelO) });
      out += MK.ripple(935, 313, t, cPress, P.gold);
      out += MK.pill(880, 100, "share a characteristic", shareO, { size: 18, col: P.teal, ink: P.teal });
      out += MK.glow(935, 313, 120, P.gold, bump(t, cBlink, 1.1) * 0.9);
    }

    /* the answer, computed from the rows the kit's own rule selected */
    var n = spCount(spec);
    /* The answer clears while the second filter is being built. Without that,
       the moment "filter age" is said the count jumps to 4 with nothing lit
       yet, so the pill answers a question the table has not been asked. */
    var ansO = Math.max(popIn(t, cTwo, 0.45) * (1 - on(t, cAge2, 0.3)), popIn(t, cFour, 0.45));
    out += MK.pill(880, 396, n + (n === 1 ? " row" : " rows") + " selected", ansO,
      { size: 28, col: P.good, ink: P.good, fill: "#173F35" });
    return svg(out);
  }
