  /* ==== Grade 3 Computing, Lesson 10: Spreadsheets ===========================
     tools/lib/film-scenes/computing-g3/spreadsheets.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/spreadsheets.json.

     THERE IS NO ART.sim IN THE COMPUTING KIT. The lesson's spreadsheet lives
     inside its activity function and cannot be lifted, so the grid here is the
     film's own, drawn in the engine's idiom. What is NOT the film's own is the
     data: every cell is the lesson's - the class pocket-money sheet, the
     bake-sale sheet, and the six children of the filter table - and every
     number the voice says is COMPUTED from those cells by the picture
     (spTotal, spMatches, spShow), so a total in the band and a column of cells
     cannot disagree. The one rule borrowed from the kit is ART.rowMatches,
     which decides which rows a filter selects.

     This file: the palette, the sheet drawing every chapter shares, the title
     motif and the chapter "Rows, columns, cells". Every top-level name starts
     with sp or SP, so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, grid: P.gold, formats: P.accent, filter: P.blue,
    record: P.plum, range: P.good, recap: P.teal
  };

  /* ---- timing -------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function spOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function spFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function spPast(t, at) { return at != null && t >= at; }
  /* lit from `at`, put out again by `until` */
  function spWindow(t, at, until) { return on(t, at, 0.35) * (1 - on(t, until, 0.35)); }

  /* ---- the lesson's own data ----------------------------------------------- */

  /* the class pocket-money sheet (step "Find, fill, format") */
  var SP_POCKET = {
    cols: ["A", "B", "C"], rows: 4,
    cells: { A1: "Name", B1: "Age", C1: "Pocket money", A2: "Amal", B2: 8, C2: 2, A3: "Sami", B3: 7, C3: 3, A4: "Zara", B4: 8 }
  };
  /* the bake-sale sheet (step "Dates and money"), with the 30 the lesson's own
     task puts into C4 already entered */
  var SP_BAKE = {
    cols: ["A", "B", "C", "D"], rows: 4,
    cells: {
      A1: "Sale", B1: "Date", C1: "Raised", D1: "Stall",
      A2: "Spring", B2: "12 March", C2: 18, D2: "Cakes",
      A3: "Summer", B3: "20 June", C3: 25, D3: "Drinks",
      A4: "Autumn", B4: "3 October", C4: 30, D4: "Books"
    }
  };

  /* ---- the sheet ------------------------------------------------------------
     A spreadsheet in the engine's idiom. spGeom fixes where every cell sits;
     spSheet draws it from a state object, so a chapter says what is lit and
     never where anything is. */

  var SP_INK = { text: P.ink, number: P.gold, date: P.blue, currency: P.good };

  function spGeom(x, y, cols, rows, cw, rh) {
    var hw = Math.round(cw * 0.34), hh = Math.round(rh * 0.92);
    return {
      x: x, y: y, cols: cols, rows: rows, cw: cw, rh: rh, hw: hw, hh: hh,
      w: hw + cols.length * cw, h: hh + rows * rh,
      cx: function (ci) { return x + hw + ci * cw; },
      ry: function (ri) { return y + hh + ri * rh; },
      col: function (name) { return cols.indexOf(name); }
    };
  }
  /* where the cell called "B3" is */
  function spAt(g, name) {
    var ci = g.col(String(name).charAt(0)), ri = parseInt(String(name).slice(1), 10) - 1;
    if (ci < 0 || !(ri >= 0 && ri < g.rows)) throw new Error("spAt: this sheet has no cell " + name);
    return { ci: ci, ri: ri, x: g.cx(ci), y: g.ry(ri), w: g.cw, h: g.rh,
      mx: g.cx(ci) + g.cw / 2, my: g.ry(ri) + g.rh / 2 };
  }
  /* what a cell shows, given its column's format */
  function spShow(v, fmt) {
    if (v == null || v === "") return "";
    if (fmt === "currency") return "£" + Number(v).toFixed(2);
    return String(v);
  }
  /* the sum of a range, read off the cells that are actually drawn */
  function spTotal(cells, names) {
    var s = 0;
    for (var k = 0; k < names.length; k++) s += Number(cells[names[k]] || 0);
    return s;
  }

  /* st: {cells, fmt {col: format}, fmtTag {col: format}, o,
          bands [{col|row, o, col_}], rings [{cell, o, col_}],
          hdrRings [{col|row, o, col_}],
          colHdr(name) -> opacity, rowHdr(n) -> opacity,
          rowO(n) -> opacity, cellO(name) -> opacity, cellInk {cell: colour}} */
  function spSheet(g, st) {
    st = st || {};
    var op = st.o == null ? 1 : st.o;
    if (!(op > 0)) return "";
    var cells = st.cells || {}, fmt = st.fmt || {}, tag = st.fmtTag || {}, out = "", k;
    out += R(g.x - 9, g.y - 9, g.w + 18, g.h + 18, 18, P.card, P.line, 3);

    /* A band down a whole column or across a whole row. The tint goes BEHIND
       the cells and the outline OVER them: the cells are drawn opaque, so a
       tint alone shows only in the 6 px gaps between them and reads as nothing
       at all (measured on the first contact sheets). */
    function bandBox(b) {
      if (b.col != null) {
        var ci = g.col(b.col);
        return ci < 0 ? null : [g.cx(ci) - 3, g.y - 5, g.cw + 6, g.h + 10];
      }
      if (b.row != null) return [g.x - 5, g.ry(b.row - 1) - 3, g.w + 10, g.rh + 6];
      return null;
    }
    (st.bands || []).forEach(function (b) {
      if (!(b.o > 0)) return;
      var q = bandBox(b);
      if (q) out += R(q[0], q[1], q[2], q[3], 10, b.col_ || P.gold, null, null, { opacity: 0.3 * Math.min(1, b.o) });
    });

    /* the letters across the top, with the column's format under each */
    for (k = 0; k < g.cols.length; k++) {
      var nm = g.cols[k], hx = g.cx(k), ho = st.colHdr ? st.colHdr(nm) : 1;
      out += R(hx + 3, g.y + 3, g.cw - 6, g.hh - 6, 8, P.cell, P.line, 1.5);
      if (ho > 0) {
        out += Tx(hx + g.cw / 2, g.y + g.hh * (tag[nm] ? 0.44 : 0.66), nm, "lab big", "middle",
          { fill: P.muted, opacity: ho });
        if (tag[nm]) out += Tx(hx + g.cw / 2, g.y + g.hh * 0.86, tag[nm], "lab small", "middle",
          { fill: SP_INK[tag[nm]] || P.muted, opacity: ho });
      }
    }
    /* the numbers down the side */
    for (k = 0; k < g.rows; k++) {
      var ro = st.rowHdr ? st.rowHdr(k + 1) : 1;
      out += R(g.x + 3, g.ry(k) + 3, g.hw - 6, g.rh - 6, 8, P.cell, P.line, 1.5);
      if (ro > 0) out += Tx(g.x + g.hw / 2, g.ry(k) + g.rh / 2 + 10, String(k + 1), "lab big", "middle",
        { fill: P.muted, opacity: ro });
    }

    /* the cells themselves */
    for (var ri = 0; ri < g.rows; ri++) {
      var rowO = st.rowO ? st.rowO(ri + 1) : 1;
      for (var ci = 0; ci < g.cols.length; ci++) {
        var name = g.cols[ci] + (ri + 1), cx = g.cx(ci), cy = g.ry(ri);
        out += R(cx + 3, cy + 3, g.cw - 6, g.rh - 6, 8, P.ground, P.line, 1.5, { opacity: 0.45 + 0.55 * rowO });
        var v = cells[name];
        if (v == null || v === "") continue;
        var vo = (st.cellO ? st.cellO(name) : 1) * rowO;
        if (!(vo > 0)) continue;
        var f = ri === 0 ? "text" : (fmt[g.cols[ci]] || "text");
        var fs = ri === 0 ? 19 : 24;
        var ink = ri === 0 ? P.muted : ((st.cellInk && st.cellInk[name]) || SP_INK[f] || P.ink);
        out += Tx(cx + g.cw / 2, cy + g.rh / 2 + fs * 0.36, spShow(v, f), "lab", "middle",
          { "font-size": fs, fill: ink, opacity: Math.min(1, vo) });
      }
    }

    /* the band's own outline, over the cells */
    (st.bands || []).forEach(function (b) {
      if (!(b.o > 0.04)) return;
      var q = bandBox(b);
      if (q) out += R(q[0], q[1], q[2], q[3], 10, "none", b.col_ || P.gold, 3,
        { opacity: 0.85 * Math.min(1, b.o) });
    });

    /* the rings the lesson draws round a cell the child has found */
    (st.rings || []).forEach(function (r) {
      if (!(r.o > 0)) return;
      var c = spAt(g, r.cell);
      out += R(c.x + 2, c.y + 2, g.cw - 4, g.rh - 4, 9, "none", r.col_ || P.gold, 4,
        { opacity: Math.min(1, r.o), transform: around(c.mx, c.my, Math.min(1.06, r.o)) });
    });
    (st.hdrRings || []).forEach(function (r) {
      if (!(r.o > 0)) return;
      var col = r.col_ || P.gold;
      if (r.col != null) {
        var ci = g.col(r.col);
        if (ci < 0) return;
        out += R(g.cx(ci) + 2, g.y + 2, g.cw - 4, g.hh - 4, 9, "none", col, 4,
          { opacity: Math.min(1, r.o), transform: around(g.cx(ci) + g.cw / 2, g.y + g.hh / 2, Math.min(1.08, r.o)) });
      } else if (r.row != null) {
        out += R(g.x + 2, g.ry(r.row - 1) + 2, g.hw - 4, g.rh - 4, 9, "none", col, 4,
          { opacity: Math.min(1, r.o), transform: around(g.x + g.hw / 2, g.ry(r.row - 1) + g.rh / 2, Math.min(1.08, r.o)) });
      }
    });
    return G(out, { opacity: clamp(op, 0, 1) });
  }

  /* ==== the title ===============================================================
     A small sheet with its letters across the top and its numbers down the
     side, and cell B3 where column B and row 3 meet: the whole lesson in one
     picture. In the spoken title chapter the letters arrive on "Columns go
     down", the numbers on "rows go across", and the two leaders run in to meet
     at B3 as it is named. On the two cards it stands still. */
  var SP_MOTIF = spGeom(16, 36, ["A", "B", "C"], 3, 94, 74);

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene;
    var cGrid = sn ? sc(sn, 0, "grid") : null, cCols = sn ? sc(sn, 0, "columns") : null,
      cRows = sn ? sc(sn, 0, "rows") : null, cColB = sn ? sc(sn, 1, "colb") : null,
      cRow3 = sn ? sc(sn, 1, "row3") : null, cB3 = sn ? sc(sn, 1, "b3") : null,
      cName = sn ? sc(sn, 1, "name") : null;
    var g = SP_MOTIF, cell = spAt(g, "B3"), out = "";
    var shown = sn ? on(t, cGrid, 0.6) : 1;
    var letters = sn ? on(t, cCols, 0.5) : 1, nums = sn ? on(t, cRows, 0.5) : 1;
    var ring = sn ? popIn(t, cB3, 0.45) : 1, lead = sn ? on(t, cName, 0.6) : 1;
    var bandB = sn ? on(t, cColB, 0.45) : 0.6, band3 = sn ? on(t, cRow3, 0.45) : 0.6;

    out += spSheet(g, {
      o: shown,
      colHdr: function () { return letters; },
      rowHdr: function () { return nums; },
      bands: [{ col: "B", o: bandB, col_: P.gold }, { row: 3, o: band3, col_: P.blue }],
      rings: [{ cell: "B3", o: ring, col_: P.gold }]
    });
    /* the two leaders that say where the name comes from */
    out += MK.leader(g.cx(1) + g.cw / 2, g.y + g.hh / 2, cell.mx, cell.my - 4, lead, P.gold);
    out += MK.leader(g.x + g.hw / 2, cell.my, cell.mx - 4, cell.my, lead, P.blue);
    out += MK.pill(180, 344, "B3", ring, { size: 26, col: P.gold, ink: P.gold });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A spreadsheet grid with cell B3 marked where column B meets row 3">' + out + "</svg>";
  }

  /* ==== chapter: rows, columns, cells =============================================
     The lesson's own class pocket-money sheet. The three columns light as they
     are named, the letters and the numbers arrive as they are counted, and the
     two leaders meet at B3. The last beat sets B3 beside 3B. */

  var SP_G = spGeom(336, 46, SP_POCKET.cols, SP_POCKET.rows, 176, 70);

  function spGridMain(scene, t) {
    var cSheet = sc(scene, 0, "sheet"), cNames = sc(scene, 0, "names"),
      cAges = sc(scene, 0, "ages"), cMoney = sc(scene, 0, "money");
    var cColumn = sc(scene, 1, "column"), cLetter = sc(scene, 1, "letter"), cAbc = sc(scene, 1, "abc");
    var cRow = sc(scene, 2, "row"), cNumber = sc(scene, 2, "number"), cCount = sc(scene, 2, "count");
    var cNamed = sc(scene, 3, "named"), cCol = sc(scene, 3, "col"), cRw = sc(scene, 3, "rw");
    var cColB = sc(scene, 4, "colb"), cRow3 = sc(scene, 4, "row3"), cB3 = sc(scene, 4, "b3"), cSeven = sc(scene, 4, "seven");
    var g = SP_G, cell = spAt(g, "B3"), out = "";

    /* Where the name comes from is shown by the column and the row lighting
       and meeting, not by a line drawn across the cells: a leader from the row
       header to B3 runs straight through "Sami". */
    var live3 = spOnly(t, scene, 3), live4 = spOnly(t, scene, 4);
    var bands = [
      { col: "A", o: spWindow(t, cNames, cAges), col_: P.teal },
      { col: "B", o: Math.max(spWindow(t, cAges, cMoney), on(t, cCol, 0.45) * live3, on(t, cColB, 0.4) * live4), col_: P.gold },
      { col: "C", o: spWindow(t, cMoney, cColumn), col_: P.good },
      { row: 3, o: Math.max(on(t, cRw, 0.45) * live3, on(t, cRow3, 0.4) * live4), col_: P.blue }
    ];
    /* the letters are there from the start; they RING as they are counted out */
    var lettersLit = tally(t, cAbc, 3, 0.9);
    var numsLit = tally(t, cCount, 4, 1.0);
    var hdrRings = [];
    for (var k = 0; k < 3; k++)
      if (k < lettersLit) hdrRings.push({ col: g.cols[k], o: spOnly(t, scene, 1), col_: P.gold });
    for (var j = 0; j < 4; j++)
      if (j < numsLit) hdrRings.push({ row: j + 1, o: spOnly(t, scene, 2), col_: P.blue });
    if (spPast(t, cCol)) hdrRings.push({ col: "B", o: on(t, cCol, 0.4) * spOnly(t, scene, 3), col_: P.gold });
    if (spPast(t, cRw)) hdrRings.push({ row: 3, o: on(t, cRw, 0.4) * spOnly(t, scene, 3), col_: P.blue });

    var ringB3 = Math.max(popIn(t, cNamed, 0.45) * spOnly(t, scene, 3), popIn(t, cB3, 0.45) * live4);
    /* the empty grid is there from the chapter's first frame; the lesson's own
       values arrive as the sheet is named */
    out += spSheet(g, {
      cells: SP_POCKET.cells, o: into(t, scene.first),
      cellO: function () { return on(t, cSheet, 0.5); },
      bands: bands, hdrRings: hdrRings,
      rings: [{ cell: "B3", o: ringB3, col_: P.gold }],
      cellInk: { B3: spPast(t, cSeven) ? P.gold : null }
    });

    /* columns go down: an arrow beside the sheet, and its words on the left */
    var down = on(t, cColumn, 0.6) * spOnly(t, scene, 1);
    out += MK.arrow(306, 60, 306, 376, down, P.gold, 8);
    out += Tx(168, 212, "Columns go down", "lab big gold", "middle", { opacity: down });
    var pop1 = on(t, cLetter, 0.5) * spOnly(t, scene, 1);
    out += Tx(168, 254, "a letter each", "lab mid muted", "middle", { opacity: pop1 });

    /* rows go across: an arrow to the right of the sheet, at row 2 */
    var across = on(t, cRow, 0.6) * spOnly(t, scene, 2);
    out += MK.arrow(952, 218, 1124, 218, across, P.blue, 8);
    /* lab, not lab big: at 30 px this label reaches back over the sheet's edge */
    out += Tx(1046, 176, "Rows go across", "lab", "middle", { fill: P.blue, opacity: across });
    var pop2 = on(t, cNumber, 0.5) * spOnly(t, scene, 2);
    out += Tx(1046, 262, "a number each", "lab mid muted", "middle", { opacity: pop2 });

    /* the name itself, and the age it holds */
    var nameP = Math.max(popIn(t, cNamed, 0.45) * live3, popIn(t, cB3, 0.45) * live4);
    out += MK.pill(168, 212, "B3", nameP * (1 - down), { size: 44, col: P.gold, ink: P.gold });
    var sevenP = popIn(t, cSeven, 0.45) * live4;
    if (sevenP > 0) {
      out += MK.pill(1038, 212, "Sami is 7", sevenP, { size: 24, col: P.gold, ink: P.gold });
      out += MK.ripple(cell.mx, cell.my, t, cSeven, P.gold);
    }
    return out;
  }

  /* the last beat: B3 is a cell, 3B is not */
  function spGridRule(scene, t) {
    var cFirst = sc(scene, 5, "first"), cB3 = sc(scene, 5, "b3"), cNo = sc(scene, 5, "no");
    var out = "", o1 = popIn(t, cB3, 0.45), o2 = popIn(t, cNo, 0.45), hd = on(t, cFirst, 0.5);
    out += Tx(584, 92, "Letter first, then number", "lab big gold", "middle", { opacity: hd });
    [{ x: 186, txt: "B3", col: P.good, sub: "column B, row 3", ok: true, o: o1 },
     { x: 646, txt: "3B", col: P.bad, sub: "no cell is called this", ok: false, o: o2 }].forEach(function (c) {
      if (!(c.o > 0)) return;
      out += G(R(c.x, 140, 336, 196, 22, P.card, c.col, 3) +
        Tx(c.x + 168, 244, c.txt, "lab huge", "middle", { fill: c.col, "font-size": 78 }) +
        Tx(c.x + 168, 306, c.sub, "lab mid muted", "middle"),
        { opacity: Math.min(1, c.o), transform: around(c.x + 168, 238, Math.min(1.05, c.o)) });
      if (c.ok) out += MK.tick(c.x + 300, 158, 26, c.o);
      else out += MK.cross(c.x + 300, 158, 26, c.o);
    });
    return out;
  }

  function spGridChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 5), out = "";
    if (u < 1) out += G(spGridMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(spGridRule(scene, t), { opacity: u });
    return svg(out);
  }
