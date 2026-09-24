  /* ==== Databases, part 2: data types, and sorting ============================
     tools/lib/film-scenes/computing-g4/databases-2.js. See databases.js for
     the table, the palette and the shared drawings.

     TYPES. Four bins, the lesson's own - Text, Number, Date, Currency, with the
     lesson's own icons - and the fields drop into them as each is named. Each
     bin fills from the BOTTOM UP with its name underneath, so a falling chip
     covers neither the bin's name nor a chip already in it (see dbSlotXY). The
     last beat leaves the bins for one card, because the misconception is about
     what an age stored as text CANNOT do, and a chip flying back out of Number
     would have had to pass straight over the chip already sitting in Text.

     SORTING. The order comes from ART.sortRows, so the film cannot disagree
     with the lesson about who ends up on top; a record fades to a fifth while
     it travels to its new slot, so two records crossing are never both
     readable. */

  /* ---- the four bins ---------------------------------------------------------- */
  var DB_BIN = { y: 230, h: 196, w: 257, xs: [30, 313, 596, 879] };
  var DB_BINS = [
    { id: "text", label: "Text", pic: "\u{1F524}" },
    { id: "number", label: "Number", pic: "\u{1F522}" },
    { id: "date", label: "Date", pic: "\u{1F4C5}" },
    { id: "currency", label: "Currency", pic: "\u{1F4B7}" }
  ];
  var DB_CHIP = { w: 190, h: 44, topY: 60, xs: [37, 263, 489, 715, 941] };
  /* every one of these fields is one the lesson types in its own Type chooser */
  var DB_CHIPS = [
    { label: "pet", pic: "\u{1F431}", bin: 0, slot: 0 },
    { label: "age", pic: "\u{1F382}", bin: 1, slot: 0 },
    { label: "height", pic: "\u{1F4CF}", bin: 1, slot: 1 },
    { label: "day born", pic: "\u{1F4C5}", bin: 2, slot: 0 },
    { label: "food a week", pic: "\u{1F4B7}", bin: 3, slot: 0 }
  ];
  /* A BIN FILLS FROM THE BOTTOM UP, and its name sits UNDER the chips, so a
     chip that is still falling never covers a word. The first cut put the
     name at the top of the bin and stacked the chips downwards, which broke
     both ways: the falling chip crossed the bin's own name ("Number" was cut
     in half for the whole of its final approach), and the second chip of a bin
     then landed BELOW the first, so it crossed that one too. Dropping to the
     lowest free slot and stacking upwards means a later chip stops short of
     every chip already there, and nothing is ever drawn on a word. */
  function dbSlotXY(bin, slot) {
    return [DB_BIN.xs[bin] + (DB_BIN.w - DB_CHIP.w) / 2, 286 - slot * 46];
  }
  function dbChip(x, y, c, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var w = DB_CHIP.w, h = DB_CHIP.h;
    var body = R(x, y, w, h, 12, opt.fill || P.cell, opt.col || P.line, opt.col ? 3 : 2) +
      Em(x + 26, y + h / 2, 26, c.pic) +
      Tx(x + 48, y + h / 2 + 7, c.label, "lab mid", "start", { fill: opt.ink || P.ink });
    return G(body, { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, Math.min(1.05, opt.p == null ? 1 : opt.p)) });
  }

  function dbTypesBins(scene, t) {
    var cType = sc(scene, 0, "type"), cKind = sc(scene, 0, "kind");
    var cWords = sc(scene, 1, "words"), cText = sc(scene, 1, "text");
    var cCounts = sc(scene, 2, "counts"), cNumber = sc(scene, 2, "number");
    var cDate = sc(scene, 3, "date"), cCurrency = sc(scene, 3, "currency");
    var out = "";

    /* when each chip sets off for its bin */
    var goes = [cText, cNumber, cNumber == null ? null : cNumber + 0.55, cDate, cCurrency];
    var landed = DB_CHIPS.map(function (c, k) { return dbPast(t, goes[k] == null ? null : goes[k] + 0.8); });

    /* the bins, one after another as the data type is named */
    DB_BINS.forEach(function (b, k) {
      var p = popIn(t, cType == null ? null : cType + k * 0.2, 0.4);
      if (!(p > 0)) return;
      var x = DB_BIN.xs[k], full = DB_CHIPS.some(function (c, n) { return c.bin === k && landed[n]; });
      out += G(R(x, DB_BIN.y, DB_BIN.w, DB_BIN.h, 20, full ? "#1B3A52" : P.card, full ? P.teal : P.line, full ? 3 : 2) +
        Em(x + DB_BIN.w / 2, 356, 40, b.pic) +
        Tx(x + DB_BIN.w / 2, 408, b.label, "lab big", "middle", { fill: full ? P.teal : P.ink }),
        { opacity: Math.min(1, p), transform: around(x + DB_BIN.w / 2, DB_BIN.y + DB_BIN.h / 2, Math.min(1.04, p)) });
    });

    DB_CHIPS.forEach(function (c, k) {
      var born = popIn(t, cKind == null ? null : cKind + k * 0.14, 0.4);
      if (!(born > 0)) return;
      var to = dbSlotXY(c.bin, c.slot);
      var u = ease(goes[k] == null ? 0 : clamp((t - goes[k]) / 0.8, 0, 1));
      var x = lerp(DB_CHIP.xs[k], to[0], u), y = lerp(DB_CHIP.topY, to[1], u);
      var lit = u > 0 && u < 1;
      out += dbChip(x, y, c, { p: born, col: lit || u >= 1 ? P.teal : null, fill: u >= 1 ? "#1B3A52" : null });
    });

    out += MK.ripple(DB_CHIP.xs[0] + 26, DB_CHIP.topY + 22, t, cWords, P.gold);
    return out;
  }

  /* The misconception, on a card of its own: an age stored as text cannot be
     sorted and cannot be added. */
  function dbTypesWarning(scene, t) {
    var cStore = sc(scene, 4, "store"), cCannot = sc(scene, 4, "cannot");
    var a = on(t, cStore, 0.55), out = "";
    out += R(214, 70, 740, 300, 24, P.card, P.bad, 3, { opacity: a });
    out += G(R(260, 110, 200, 60, 14, P.cell, P.line, 2) + Em(300, 140, 32, "\u{1F382}") +
      Tx(336, 150, "age", "lab big", "start"), { opacity: a });
    out += Tx(514, 150, "stored as", "lab mid muted", "middle", { opacity: a });
    out += G(R(580, 110, 200, 60, 14, P.cell, P.bad, 3) + Em(620, 140, 32, "\u{1F524}") +
      Tx(656, 150, "text", "lab big bad", "start"), { opacity: a });
    [{ cx: 400, pic: "\u{1F522}", label: "sort" }, { cx: 730, pic: "➕", label: "add" }].forEach(function (c, k) {
      var p = popIn(t, cCannot == null ? null : cCannot + k * 0.35, 0.4);
      out += G(R(c.cx - 120, 240, 240, 96, 18, P.cell, P.line, 2) +
        Em(c.cx - 66, 288, 38, c.pic) + Tx(c.cx - 26, 298, c.label, "lab big", "start"),
        { opacity: a });
      out += MK.cross(c.cx + 92, 262, 24, p);
    });
    return out;
  }

  function dbTypesChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(dbTypesBins(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(dbTypesWarning(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: sorting ========================================================
     The sort control on the left says which field and which way; the table on
     the right is put in that order by ART.sortRows. */
  var DB_SP = { x: 16, w: 250 };
  function dbSortCard(y, label, sub, col, arrowUp, p, grow) {
    if (!(p > 0)) return "";
    var x = DB_SP.x, w = DB_SP.w, h = 96;
    var body = R(x, y, w, h, 18, P.card, col, 3) +
      Tx(x + 72, y + 34, label, "lab mid", "start", { fill: col }) +
      Tx(x + 72, y + 66, sub, "lab mid muted", "start");
    body += arrowUp ? MK.arrow(x + 34, y + 76, x + 34, y + 20, grow, col, 7)
      : MK.arrow(x + 34, y + 20, x + 34, y + 76, grow, col, 7);
    return G(body, { opacity: Math.min(1, p), transform: around(x + w / 2, y + h / 2, Math.min(1.03, p)) });
  }

  function dbSortingChapter(scene, beat, t, i) {
    var cSorting = sc(scene, 0, "sorting"), cOrder = sc(scene, 0, "order");
    var cAsc = sc(scene, 1, "asc"), cSmall = sc(scene, 1, "small");
    var cDesc = sc(scene, 2, "desc"), cBig = sc(scene, 2, "big");
    var cSortDesc = sc(scene, 3, "sortdesc"), cZara = sc(scene, 3, "zara");
    var cSortAsc = sc(scene, 4, "sortasc"), cBudgie = sc(scene, 4, "budgie");
    var cWrong = sc(scene, 5, "wrongway"), cRead = sc(scene, 5, "read");
    var out = "";

    var stage = dbPast(t, cWrong) ? 3 : dbPast(t, cSortAsc) ? 2 : dbPast(t, cSortDesc) ? 1 : 0;
    var fieldTxt = ["", "height (cm)", "pet", "pet"][stage];
    var dirTxt = ["", "descending", "ascending", "descending"][stage];
    var hot = ["", "height", "pet", "pet"][stage];

    /* the control */
    var panel = on(t, cSorting, 0.5);
    if (panel > 0) {
      out += G(Tx(DB_SP.x + 8, 48, "SORT BY", "lab small caps muted", "start") +
        Tx(DB_SP.x + 8, 132, "DIRECTION", "lab small caps muted", "start"), { opacity: panel });
      if (stage === 0) {
        out += G(R(DB_SP.x + 18, 64, 214, 44, 22, "none", P.line, 2, { "stroke-dasharray": "10 8" }) +
          R(DB_SP.x + 18, 146, 214, 44, 22, "none", P.line, 2, { "stroke-dasharray": "10 8" }), { opacity: panel });
      } else {
        out += MK.pill(141, 86, fieldTxt, panel, { size: 24, col: P.accent, ink: P.accent, fill: "#1B3A52" });
        out += MK.pill(141, 168, dirTxt, panel, { size: 24, col: P.gold, ink: P.gold, fill: "#1B3A52" });
      }
    }
    out += dbSortCard(210, "ascending", "smallest first", P.good, true, popIn(t, cAsc, 0.4), on(t, cSmall, 0.5));
    out += dbSortCard(318, "descending", "biggest first", P.accent, false, popIn(t, cDesc, 0.4), on(t, cBig, 0.5));

    /* the table, in whichever order has been asked for */
    out += dbFrame({ hot: hot || null });
    var lit = stage === 1 ? { height: [0] } : stage === 2 ? { pet: [0, 1] } : null;
    out += dbOrdered(t, [
      { at: null, order: DB_BASE },
      { at: cSortDesc, order: DB_BY_HEIGHT_DESC },
      { at: cSortAsc, order: DB_BY_PET_ASC },
      { at: cWrong, order: DB_BY_PET_DESC }
    ], {
      rowOpt: function (row, slot) {
        var mark = stage === 1 ? slot === 0 : stage === 2 ? slot < 2 : stage === 3 && slot === 0;
        var ready = stage === 1 ? dbPast(t, cZara) : stage === 2 ? dbPast(t, cBudgie) : dbPast(t, cWrong);
        return mark && ready ? { col: stage === 3 ? P.bad : P.gold, fill: "#1B3A52" } : {};
      }
    });

    /* the field every sort is by */
    if (hot) out += dbFieldBand(hot, on(t, [null, cSortDesc, cSortAsc, cWrong][stage], 0.5), P.accent);

    /* the headers, lit one at a time: a sort can be by any field */
    var anyField = dbSpan(t, scene, 0, 0);
    if (anyField > 0) {
      DB_FIELDS.forEach(function (f, k) {
        out += R(DB_T.x + DB_COLX[k] + 3, DB_T.y + 3, f.w - 6, DB_T.hdr - 6, 8,
          "rgba(233,116,79,0.20)", P.accent, 2,
          { opacity: on(t, cOrder == null ? null : cOrder + k * 0.22, 0.3) * anyField });
      });
    }

    /* who ended up on top, and why */
    if (stage === 1) {
      var z = on(t, cZara, 0.5);
      out += dbCellRing("height", 0, z);
      out += MK.arrow(950, dbRowCY(0), 916, dbRowCY(0), z, P.gold, 6);
      out += MK.pill(1050, dbRowCY(0), "tallest: 141", z, { size: 22, col: P.gold, ink: P.gold, fill: "#1B3A52" });
    }
    if (stage === 2) {
      var b = on(t, cBudgie, 0.5);
      out += dbCellRing("pet", 0, b);
      out += dbCellRing("pet", 1, b, P.muted);
      out += MK.arrow(950, 126, 916, 126, b, P.gold, 6);
      out += MK.pill(1046, 126, "budgie before cat", b, { size: 20, col: P.gold, ink: P.gold, fill: "#1B3A52" });
    }
    if (stage === 3) {
      out += MK.cross(244, 168, 20, popIn(t, cWrong, 0.4));
      out += MK.bubble(936, 236, 224, 92, "which way?", on(t, cRead, 0.5));
    }
    return svg(out);
  }
