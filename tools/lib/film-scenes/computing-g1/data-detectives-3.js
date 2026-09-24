  /* ==== Data Detectives, part 3 ==============================================
     The chapters "Reading the table", "Sorting into groups" and "Across and
     down", and the KINDS the engine's tail asks for.

     Every number on screen is derived from the lists in data-detectives.js -
     the most and the fewest are found by comparing the rows, and each sorting
     group is a filter of the same twelve things - so the chart agrees with
     itself, and the load-time check ties both to what the voice says. */

  /* ---- chapter: reading the table ----------------------------------------- */

  var DD_TBL = { x: 30, y: 26, w: 560, rh: 66 };
  /* the most and the fewest, found rather than typed */
  var DD_MOST = DD_FRUIT.reduce(function (a, f) { return f.n > a.n ? f : a; });
  var DD_FEWEST = DD_FRUIT.reduce(function (a, f) { return f.n < a.n ? f : a; });

  function ddAnswerPanel(x, y, w, h, f, line, col, o, t, at) {
    if (!(o > 0)) return "";
    var out = ddCard(x, y, w, h, true, 1);
    out += MK.pic(x + 80, y + h / 2, 64, f.pic);
    out += Tx(x + 140, y + h / 2 - 6, f.label, "lab huge", "start");
    out += Tx(x + 140, y + h / 2 + 40, line, "lab big", "start", { fill: col });
    return G(out, { transform: around(x + w / 2, y + h / 2, Math.min(popIn(t, at, 0.4), 1.08)), opacity: Math.min(1, o) });
  }

  function ddTableChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPuts = c(0, "puts"), cTable = c(0, "table");
    var rowCue = [c(1, "apple"), c(1, "banana"), c(1, "mango"), c(1, "orange")];
    var cMost = c(2, "most"), cBanana = c(2, "banana");
    var cOrange = c(3, "orange"), cNobody = c(3, "nobody");
    var cOnly = c(4, "only"), cSong = c(4, "song");
    var here = i - scene.first, out = "";

    /* which row the voice is on, one at a time (rule 3) */
    var lit = -1;
    rowCue.forEach(function (at, k) { if (at != null && t >= at && t < at + 1.25) lit = k; });
    if (here === 2 && cBanana != null && t >= cBanana) lit = DD_FRUIT.indexOf(DD_MOST);
    if (here === 3 && cOrange != null && t >= cOrange) lit = DD_FRUIT.indexOf(DD_FEWEST);

    var tableO = Math.max(popIn(t, cTable, 0.5), ddFrom(t, scene, 1));
    var tab = ddFruitTable(DD_TBL.x, DD_TBL.y, DD_TBL.w, t, Math.min(tableO, 1), {
      rh: DD_TBL.rh, lit: function (f, k) { return k === lit; }
    });
    out += G(tab.markup, { transform: around(DD_TBL.x + DD_TBL.w / 2, DD_TBL.y + tab.h / 2, Math.min(tableO, 1.08)) });

    /* the six answers the form collected, before they are a table */
    var first = ddOnly(t, scene, 0);
    if (first > 0) {
      var pile = "";
      DD_PEOPLE.forEach(function (p, k) {
        var f = DD_FRUIT.filter(function (x) { return x.id === p.answer; })[0];
        pile += MK.pic(700 + k * 74, 128, 50, f.pic, { opacity: popIn(t, cPuts == null ? null : cPuts + k * 0.14, 0.3) });
      });
      pile += Tx(884, 208, "six answers", "lab big muted", "middle", { opacity: on(t, cPuts, 0.5) });
      out += G(pile, { opacity: first });
    }

    /* the most, and the fewest */
    if (here === 2) {
      out += G(MK.qmark(680, 110, 26, on(t, cMost, 0.4)) +
        Tx(724, 120, "Which is the most?", "lab big", "start", { opacity: on(t, cMost, 0.4) }) +
        MK.leader(680, 140, DD_TBL.x + DD_TBL.w - 20, tab.rowY(DD_FRUIT.indexOf(DD_MOST)),
          on(t, cMost == null ? null : cMost + 0.2, 0.6), P.gold), { opacity: ddOnly(t, scene, 2) });
      out += ddAnswerPanel(650, 200, 480, 160, DD_MOST, String(DD_MOST.n) + " children", P.good,
        on(t, cBanana, 0.4) * ddOnly(t, scene, 2), t, cBanana);
      out += MK.tick(1090, 234, 24, popIn(t, cBanana == null ? null : cBanana + 0.3, 0.4) * ddOnly(t, scene, 2));
    }
    if (here === 3) {
      out += G(MK.qmark(680, 110, 26, on(t, cOrange, 0.4)) +
        Tx(724, 120, "Did anyone choose it?", "lab big", "start", { opacity: on(t, cOrange, 0.4) }) +
        MK.leader(680, 140, DD_TBL.x + DD_TBL.w - 20, tab.rowY(DD_FRUIT.indexOf(DD_FEWEST)),
          on(t, cOrange == null ? null : cOrange + 0.2, 0.6), P.gold), { opacity: ddOnly(t, scene, 3) });
      out += ddAnswerPanel(650, 200, 480, 160, DD_FEWEST, String(DD_FEWEST.n) + " - nobody", P.bad,
        on(t, cNobody, 0.4) * ddOnly(t, scene, 3), t, cNobody);
      out += MK.cross(1090, 234, 24, popIn(t, cNobody == null ? null : cNobody + 0.3, 0.4) * ddOnly(t, scene, 3));
    }
    /* what a table can answer, and what it cannot */
    if (here === 4) {
      var last = ddOnly(t, scene, 4);
      var card = function (y, at, mark, pic, text) {
        var o = on(t, at, 0.45);
        if (!(o > 0)) return "";
        var m = mark === "tick" ? MK.tick(706, y + 60, 26, popIn(t, at + 0.25, 0.4))
          : MK.cross(706, y + 60, 26, popIn(t, at + 0.25, 0.4));
        return G(ddCard(650, y, 480, 120, false, 1) + m + MK.pic(770, y + 60, 40, pic) +
          Tx(806, y + 70, text, "lab mid", "start"), { opacity: Math.min(1, o) });
      };
      out += G(card(96, cOnly, "tick", "\u{1F34E}", "How many chose apple?") +
        card(250, cSong, "cross", "\u{1F3B5}", "Amal's favourite song?"), { opacity: last });
    }
    return svg(out);
  }

  /* ---- chapter: sorting into groups ---------------------------------------
     The twelve things lie in a tray ACROSS THE TOP, and the group boxes stand
     below it, empty, until a group's own cue sends its things down into it.
     That separation is the point: an empty box with a colour name, above a
     tray of mixed things, is true - and the first cut, which drew the boxes
     round the scattered things with each box already showing its count, said
     the corn was red. A box's count appears only once its things have
     arrived, and every group is a filter of DD_THINGS, so a box cannot hold
     more or fewer than the number it prints. */

  var DD_SORTBOX = { y: 216, h: 194 };
  var DD_CBOX = { w: 262, gap: 14 };
  var DD_TBOX = { w: 540, gap: 28 };
  function ddCBoxX(k) {
    var total = DD_COLOURS.length * DD_CBOX.w + (DD_COLOURS.length - 1) * DD_CBOX.gap;
    return (1168 - total) / 2 + k * (DD_CBOX.w + DD_CBOX.gap);
  }
  function ddTBoxX(k) {
    var total = DD_TYPES.length * DD_TBOX.w + (DD_TYPES.length - 1) * DD_TBOX.gap;
    return (1168 - total) / 2 + k * (DD_TBOX.w + DD_TBOX.gap);
  }
  /* where a thing sits in the tray, in a colour group, and in a type group.
     Every seat is worked out from the group's own members. */
  function ddMixedAt(k) {
    return [122 + (k % 6) * 168 + (DD_SCATTER[k] - 0.5) * 34,
            (k < 6 ? 100 : 172) + (DD_SCATTER[(k + 5) % 12] - 0.5) * 16];
  }
  function ddSeat(field, boxX, item) {
    var g = ddGroup(field, item[field]), j = g.indexOf(item);
    if (field === "colour") return [boxX + 70 + (j % 2) * 122, 300 + Math.floor(j / 2) * 68];
    return [boxX + 90 + (j % 4) * 120, 302 + Math.floor(j / 4) * 66];
  }
  var DD_GCOL = { red: "#E0483C", yellow: "#E8B93B", green: "#3E9E52", orange: "#E07C2A", fruit: P.teal, vegetable: P.plum };

  /* one group box: the frame, the name and the count, each with its own
     opacity, because the box arrives before its name and its name before its
     count. */
  function ddGroupBox(x, w, field, g, v) {
    if (!(v.o > 0)) return "";
    var named = v.lab > 0.5;
    var out = R(x, DD_SORTBOX.y, w, DD_SORTBOX.h, 18, P.card, named ? DD_GCOL[g] : P.line, 3,
      named ? null : { "stroke-dasharray": "12 9" });
    if (v.lab > 0) out += Tx(x + w / 2, DD_SORTBOX.y + 36, g, "lab big", "middle", { fill: DD_GCOL[g], opacity: clamp(v.lab, 0, 1) });
    if (v.num > 0) out += Tx(x + w - 22, DD_SORTBOX.y + 188, String(ddGroup(field, g).length), "lab mid muted", "end", { opacity: clamp(v.num, 0, 1) });
    return G(out, { opacity: clamp(v.o, 0, 1) });
  }

  /* the whole sorting picture, given how far each thing has moved and how far
     each box has arrived. Beats 0 to 3 pass functions of t; the last beat
     passes fixed numbers and draws the same thing twice, side by side.

     `retreatU`, beats 0 to 3 only: before an item's OWN fruit/veg cue fires,
     it used to stay drawn at its old colour seat while the colour boxes had
     already faded (both gated off the shared "type" cue) - so for 1.5 to 2 s
     it sat, box-less, inside whatever type box happened to occupy that part
     of the row, showing a grouping that was not the one being taught (found
     in review). So the old layout is cleared first: as soon as sorting by
     type starts, every thing lifts back off its colour seat toward the mixed
     tray, and only when its OWN type cue fires does it carry on from there
     into its type seat - it is never seated anywhere without its own box. */
  function ddSortView(t, colourU, typeU, boxC, boxT, itemO, retreatU) {
    var out = "";
    DD_COLOURS.forEach(function (g, k) { out += ddGroupBox(ddCBoxX(k), DD_CBOX.w, "colour", g, boxC(g)); });
    DD_TYPES.forEach(function (g, k) { out += ddGroupBox(ddTBoxX(k), DD_TBOX.w, "type", g, boxT(g)); });
    DD_THINGS.forEach(function (item, k) {
      var o = itemO(k);
      if (o <= 0) return;
      var m = ddMixedAt(k), cs = ddSeat("colour", ddCBoxX(DD_COLOURS.indexOf(item.colour)), item),
        ts = ddSeat("type", ddTBoxX(DD_TYPES.indexOf(item.type)), item);
      var uc = clamp(colourU(item), 0, 1), ut = clamp(typeU(item), 0, 1);
      var re = retreatU ? clamp(retreatU(item), 0, 1) : 0;
      var seatX = lerp(m[0], cs[0], uc), seatY = lerp(m[1], cs[1], uc);
      var baseX = lerp(seatX, m[0], re), baseY = lerp(seatY, m[1], re);
      var x = lerp(baseX, ts[0], ut), y = lerp(baseY, ts[1], ut);
      out += MK.pic(x, y, 52, item.pic, { opacity: Math.min(1, o) });
    });
    return out;
  }
  var DD_ALL = { o: 1, lab: 1, num: 1 }, DD_NONE = { o: 0, lab: 0, num: 0 };

  function ddSortChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSorting = c(0, "sorting"), cGroups = c(0, "groups");
    var cTwelve = c(1, "twelve"), cColour = c(1, "colour");
    var cCol = { red: c(2, "reds"), yellow: c(2, "yellows"), green: c(2, "greens"), orange: c(2, "oranges") };
    var cBlink = c(2, "blink");
    var cType = c(3, "type"), cTyp = { fruit: c(3, "fruit"), vegetable: c(3, "veg") };
    var cNoway = c(4, "noway"), cOrganise = c(4, "organise");
    var out = "";

    var anyType = Math.max(on(t, cTyp.fruit, 0.55), on(t, cTyp.vegetable, 0.55), on(t, cType, 0.45));
    var four = on(t, cNoway, 0.5);

    /* beats 0 to 3: one picture, the things moving from the tray into groups */
    var main = ddSortView(t,
      function (item) { return on(t, cCol[item.colour], 0.55); },
      function (item) { return on(t, cTyp[item.type], 0.55); },
      function (g) {
        var gone = 1 - anyType;
        return { o: Math.max(on(t, cGroups, 0.5) * 0.5, on(t, cColour, 0.45) * 0.9, on(t, cCol[g], 0.5)) * gone,
          lab: Math.max(on(t, cColour, 0.45), on(t, cCol[g], 0.5)) * gone,
          num: on(t, cCol[g] == null ? null : cCol[g] + 0.55, 0.5) * gone };
      },
      function (g) {
        return { o: Math.max(on(t, cType, 0.5) * 0.85, on(t, cTyp[g], 0.5)),
          lab: Math.max(on(t, cType, 0.5), on(t, cTyp[g], 0.5)),
          num: on(t, cTyp[g] == null ? null : cTyp[g] + 0.55, 0.5) };
      },
      function (k) { return Math.max(popIn(t, cSorting == null ? null : cSorting + k * 0.1, 0.3), ddFrom(t, scene, 1)); },
      function () { return on(t, cType, 0.5); });
    out += G(main, { opacity: 1 - four });

    /* twelve things, all mixed up */
    var one = ddOnly(t, scene, 1) * (1 - four);
    if (one > 0) out += G(MK.pill(584, 40, String(DD_THINGS.length) + " things, all mixed up", on(t, cTwelve, 0.4), { size: 28, col: P.line }), { opacity: one });
    /* done in a blink */
    var blink = bump(t, cBlink, 0.8) * (1 - four);
    if (blink > 0) out += R(0, DD_SORTBOX.y - 8, 1168, DD_SORTBOX.h + 16, 20, P.gold, null, null, { opacity: 0.16 * blink });

    /* the last beat: the same twelve things, both ways at once */
    if (four > 0) {
      var one1 = function () { return 1; }, zero = function () { return 0; };
      var allC = function () { return DD_ALL; }, noC = function () { return DD_NONE; };
      var left = ddSortView(t, one1, zero, allC, noC, one1);
      var right = ddSortView(t, one1, one1, noC, allC, one1);
      out += G(Tx(290, 158, "by colour", "lab big", "middle") +
        Tx(874, 158, "by type", "lab big", "middle") +
        G(left, { transform: "translate(16,88.5) scale(0.47)" }) +
        G(right, { transform: "translate(600,88.5) scale(0.47)" }) +
        MK.tick(150, 148, 22, popIn(t, cOrganise, 0.4)) +
        MK.tick(734, 148, 22, popIn(t, cOrganise == null ? null : cOrganise + 0.2, 0.4)) +
        MK.pill(584, 350, "Both are sorted. It depends what you ask.", on(t, cOrganise, 0.5), { size: 26, col: P.good, ink: P.good }),
        { opacity: four });
    }
    return svg(out);
  }

  /* ---- chapter: across and down -------------------------------------------- */

  var DD_RT = { x: 280, y: 20, w: 608, top: 110, rh: 50 };
  function ddRowY(k) { return DD_RT.top + k * DD_RT.rh; }
  function ddRowsChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cRC = c(0, "rowscols"), cAcross = c(0, "across");
    var cDown = c(1, "down"), cFact = c(1, "fact");
    var cAmal = c(2, "amal"), cRow = c(2, "row");
    var cWay = c(3, "way");
    var card = popIn(t, cRC, 0.5), out = "";
    if (card <= 0) return svg("");

    var inner = ddCard(DD_RT.x, DD_RT.y, DD_RT.w, 400, false, 1);
    inner += Tx(DD_RT.x + DD_RT.w / 2, DD_RT.y + 34, "What our class chose", "lab mid muted", "middle");
    inner += Tx(DD_RT.x + 30, DD_RT.y + 82, "Name", "lab mid muted", "start");
    inner += Tx(DD_RT.x + 296, DD_RT.y + 82, "Favourite fruit", "lab mid muted", "start");
    inner += L(DD_RT.x + 12, DD_RT.top, DD_RT.x + DD_RT.w - 12, DD_RT.top, P.line, 2);

    /* the bands: a row across, and a column down */
    var rowU = Math.max(on(t, cAcross, 0.7), on(t, cRow, 0.7), on(t, cWay, 0.7));
    var colU = Math.max(on(t, cDown, 0.7), on(t, cWay, 0.7));
    var rowQuiet = 1 - 0.65 * ddOnly(t, scene, 1);
    if (rowU > 0) inner += R(DD_RT.x + 10, ddRowY(0) + 3, (DD_RT.w - 20) * rowU, DD_RT.rh - 6, 10,
      "rgba(244,201,93,0.20)", P.gold, 2.5, { opacity: rowQuiet });
    if (colU > 0) inner += R(DD_RT.x + 282, DD_RT.top + 4, 310, (6 * DD_RT.rh - 8) * colU, 10,
      "rgba(110,157,232,0.20)", P.blue, 2.5, { opacity: 1 });

    var shown = Math.max(tally(t, cFact, DD_PEOPLE.length, 1.1), ddFrom(t, scene, 2) > 0 ? DD_PEOPLE.length : 0);
    DD_PEOPLE.forEach(function (p, k) {
      var y = ddRowY(k) + DD_RT.rh / 2, f = DD_FRUIT.filter(function (x) { return x.id === p.answer; })[0];
      if (k) inner += L(DD_RT.x + 12, ddRowY(k), DD_RT.x + DD_RT.w - 12, ddRowY(k), P.line, 1);
      inner += MK.pic(DD_RT.x + 42, y, 34, p.pic);
      inner += Tx(DD_RT.x + 70, y + 9, p.name, "lab big", "start");
      inner += MK.pic(DD_RT.x + 300, y, 28, f.pic, { opacity: k < shown ? 1 : 0.35 });
      inner += Tx(DD_RT.x + 324, y + 9, f.label, "lab big", "start", { opacity: k < shown ? 1 : 0.35 });
    });
    out += G(inner, { transform: around(DD_RT.x + DD_RT.w / 2, 220, Math.min(card, 1.08)), opacity: Math.min(1, card) });

    /* across, in the left margin; down, in the right one */
    var aU = Math.max(on(t, cAcross, 0.55), on(t, cWay, 0.55));
    out += G(MK.arrow(110, ddRowY(0) + DD_RT.rh / 2, 264, ddRowY(0) + DD_RT.rh / 2, aU, P.gold, 8) +
      MK.pill(146, 92, "across", aU, { size: 26, col: P.gold }), { opacity: rowQuiet });
    var dU = Math.max(on(t, cDown, 0.55), on(t, cWay, 0.55));
    out += MK.arrow(1000, 150, 1000, 390, dU, P.blue, 8);
    out += MK.pill(1046, 96, "down", dU, { size: 26, col: P.blue, ink: P.blue });

    /* what does Amal like? */
    var two = ddOnly(t, scene, 2);
    if (two > 0) {
      out += G(MK.qmark(146, 210, 30, on(t, cAmal, 0.4)) +
        MK.pill(146, 280, "Amal likes?", on(t, cAmal, 0.4), { size: 24, col: P.line }), { opacity: two });
      out += MK.tick(DD_RT.x + DD_RT.w - 32, ddRowY(0) + DD_RT.rh / 2, 22,
        popIn(t, cRow == null ? null : cRow + 0.55, 0.4) * two);
    }
    return svg(out);
  }

  /* ---- what the engine's tail asks for -------------------------------------- */

  var KINDS = {
    title: MK.titleKind({ sub: ["Data is facts and numbers.", "Collect it, read it, sort it."] }),
    data: ddDataChapter,
    ask: ddAskChapter,
    form: ddFormChapter,
    table: ddTableChapter,
    sort: ddSortChapter,
    rows: ddRowsChapter,
    recap: MK.recapKind([
      { beat: 0, at: "data", title: "Data", sub: "Facts and numbers we collect", pic: "\u{1F4CA}" },
      { beat: 1, at: "ask", title: "Ask the right way", sub: "Each question, its own app", pic: "\u{1F4F1}" },
      { beat: 1, at: "form", title: "A form", sub: "Record what each one said", pic: "\u{1F4DD}" },
      { beat: 2, at: "table", title: "A table", sub: "Across a row, down a column", pic: "\u{1F4CB}" },
      { beat: 3, at: "sort", title: "Sorting", sub: "Groups, in a blink", pic: "⚙️" }
    ], { goBeat: 3, goAt: "detective" })
  };
