  /* ==== Grade 2 Computing, Lesson 8: Presenting Data ==========================
     tools/lib/film-scenes/computing-g2/presenting-data.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/presenting-data.json.

     THE CHART AGREES WITH ITSELF BY CONSTRUCTION. There is ONE copy of the
     lesson's data in this film - PD_FRUIT (the party survey) and PD_DAYS
     (PLAYGROUND in content/lesson-8.py) - and every picture is drawn from it:
     a column is exactly `value` blocks tall, the number printed on it is the
     same `value`, the table row prints the same `value`, and the playground
     draws exactly `value` children. Nothing is a literal typed twice. Which
     fruit won, and which day is busiest or quietest, come from the kit's own
     ART.sortRows rather than from a claim of mine.

     Computing has no ART.sim (see the brief), so the graph and the table are
     drawn here, in the engine's idiom, in the layout the lesson's own
     blockGraph uses: the table on the left, one column per category on the
     right, each column labelled with the lesson's picture and word, and a tick
     when it is the right height. The laptop in the last chapter IS the kit's
     own figure.

     This file: the data, the timing helpers, the table, the block graph, the
     title motif and the chapter "The table". Every top-level name starts with
     pd, so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, table: P.gold, graph: P.blue, build: P.accent,
    problem: P.plum, work: P.good, paper: P.gold, recap: P.teal
  };

  /* ---- the lesson's own data, copied once ------------------------------- */

  /* the party survey (content/lesson-8.py, the "Build the party graph" step) */
  var PD_FRUIT = [
    { label: "Apple", pic: "\u{1F34E}", value: 2 },
    { label: "Banana", pic: "\u{1F34C}", value: 4 },
    { label: "Orange", pic: "\u{1F34A}", value: 1 },
    { label: "Grapes", pic: "\u{1F347}", value: 1 }
  ];
  /* PLAYGROUND: children playing football at lunch */
  var PD_DAYS = [
    { label: "Monday", value: 9 }, { label: "Tuesday", value: 4 },
    { label: "Wednesday", value: 7 }, { label: "Thursday", value: 3 },
    { label: "Friday", value: 8 }
  ];

  /* the answers, decided by the kit's own rule and not by me */
  var PD_WINNER = ART.sortRows(PD_FRUIT, "value", "desc")[0].label;      /* Banana */
  var PD_BUSIEST = ART.sortRows(PD_DAYS, "value", "desc")[0].label;      /* Monday */
  var PD_QUIETEST = ART.sortRows(PD_DAYS, "value", "asc")[0].label;      /* Thursday */
  var PD_WIN_I = PD_FRUIT.map(function (f) { return f.label; }).indexOf(PD_WINNER);
  var PD_BUSY_I = PD_DAYS.map(function (d) { return d.label; }).indexOf(PD_BUSIEST);
  var PD_QUIET_I = PD_DAYS.map(function (d) { return d.label; }).indexOf(PD_QUIETEST);

  /* one survey slip per answer: 2 apple, 4 banana, 1 orange, 1 grapes = 8 */
  var PD_ANSWERS = [];
  PD_FRUIT.forEach(function (f, k) {
    for (var v = 0; v < f.value; v++) PD_ANSWERS.push(k);
  });
  /* a fixed scatter so the slips are not already sorted into their columns */
  var PD_ANSWER_ORDER = [2, 0, 5, 3, 7, 1, 4, 6];

  /* ---- timing ------------------------------------------------------------ */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does:
     for a thing that belongs to that beat alone (rule 7) */
  function pdOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function pdFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function pdPast(t, at) { return at != null && t >= at; }
  /* the first of these cues that has been reached, counting backwards */
  function pdLast(t) {
    for (var k = arguments.length - 1; k >= 1; k--) if (pdPast(t, arguments[k])) return k - 1;
    return -1;
  }

  /* ---- the table --------------------------------------------------------
     rows: [{label, pic, value}]. opt: {headL, headR, shown (how many rows have
     their number), litFill (per-row extra opacity), rowCol (k -> a colour or
     null), numberO (0 - 1 on the number column), rowO (k -> 0 - 1)} */
  var PD_T = { headH: 46, rowH: 58 };
  function pdTableH(n) { return PD_T.headH + n * PD_T.rowH; }
  function pdRowY(y, k) { return y + PD_T.headH + k * PD_T.rowH; }

  function pdTable(x, y, w, rows, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var n = rows.length, h = pdTableH(n), out = "";
    out += R(x, y, w, h, 18, P.card, P.line, 3);
    /* the header band: a rounded top, squared off where the rows begin */
    out += R(x + 3, y + 3, w - 6, PD_T.headH - 3, 15, P.cell);
    out += R(x + 3, y + PD_T.headH - 17, w - 6, 14, 0, P.cell);
    out += Tx(x + 22, y + PD_T.headH / 2 + 7, opt.headL || "", "lab mid muted caps", "start");
    out += Tx(x + w - 22, y + PD_T.headH / 2 + 7, opt.headR || "", "lab mid muted caps", "end");

    rows.forEach(function (r, k) {
      var ro = opt.rowO ? opt.rowO(k) : 1;
      if (!(ro > 0)) return;
      var ry = pdRowY(y, k), col = opt.rowCol ? opt.rowCol(k) : null;
      var body = "";
      if (k > 0) body += L(x + 14, ry, x + w - 14, ry, P.line, 1.5, { opacity: 0.7 });
      if (r.pic) body += Em(x + 44, ry + PD_T.rowH / 2, 34, r.pic);
      body += Tx(x + (r.pic ? 76 : 26), ry + PD_T.rowH / 2 + 9, r.label, "lab big", "start");
      var nO = opt.numberO == null ? 1 : opt.numberO;
      var shown = opt.shown == null ? rows.length : opt.shown;
      if (k < shown && nO > 0)
        body += Tx(x + w - 30, ry + PD_T.rowH / 2 + 11, String(r.value), "lab big", "end",
          { fill: col || P.gold, "font-size": 32, opacity: nO });
      else if (nO > 0)
        body += L(x + w - 52, ry + PD_T.rowH / 2, x + w - 30, ry + PD_T.rowH / 2, P.muted, 3, { opacity: 0.6 * nO });
      if (col) body += R(x + 7, ry + 3, w - 14, PD_T.rowH - 6, 13, "none", col, 3.5);
      out += G(body, { opacity: ro });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the block graph ---------------------------------------------------
     The lesson's own shape: one column per category, one block per answer, the
     category's picture and word under it. built[k] is how many blocks of
     column k are drawn; a block that has just arrived pops in.
     opt: {built (k -> number), colCol (k -> colour), tickP (k -> 0-1),
     numberO (k -> 0-1), o, ghost (k, or -1: a refused extra block),
     ghostP, blockMark (k, j -> markup drawn inside block j of column k)} */
  var PD_G = { colW: 84, pitch: 124, blockH: 42, blockGap: 7, base: 322 };
  function pdColX(x0, k) { return x0 + k * PD_G.pitch; }          /* the column's left edge */
  function pdColCx(x0, k) { return pdColX(x0, k) + PD_G.colW / 2; }
  function pdBlockY(j) { return PD_G.base - (j + 1) * PD_G.blockH - j * PD_G.blockGap; }
  function pdColTop(v) { return v > 0 ? pdBlockY(v - 1) : PD_G.base; }

  function pdGraph(x0, rows, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var out = "", wide = (rows.length - 1) * PD_G.pitch + PD_G.colW;
    /* the floor the columns stand on */
    out += L(x0 - 20, PD_G.base + 3, x0 + wide + 20, PD_G.base + 3, P.line, 4);
    rows.forEach(function (r, k) {
      var x = pdColX(x0, k), col = (opt.colCol && opt.colCol(k)) || P.teal;
      var built = opt.built ? opt.built(k) : r.value;
      /* the empty column, so a graph being built has somewhere to build in */
      if (opt.slots) {
        var top = pdColTop(opt.slotMax || 1), sCol = opt.slotCol ? opt.slotCol(k) : null;
        var sO = opt.slotO == null ? 1 : opt.slotO;
        if (sO > 0) out += R(x, top, PD_G.colW, PD_G.base - top, 10, "none", sCol || P.muted, sCol ? 3.5 : 2,
          { "stroke-dasharray": "8 7", opacity: (sCol ? 1 : 0.42) * sO });
      }
      var nb = Math.min(Math.ceil(built - 1e-6), r.value);
      for (var j = 0; j < nb; j++) {
        var p = clamp(built - j, 0, 1);
        out += G(R(x, pdBlockY(j), PD_G.colW, PD_G.blockH, 8, col, "rgba(11,29,44,0.5)", 2),
          { transform: around(x + PD_G.colW / 2, pdBlockY(j) + PD_G.blockH / 2, Math.min(1, p)), opacity: Math.min(1, p) });
        if (opt.blockMark) out += opt.blockMark(k, j, x + PD_G.colW / 2, pdBlockY(j) + PD_G.blockH / 2);
      }
      /* the number this column stands for, above it */
      var nO = opt.numberO ? opt.numberO(k) : 0;
      if (nO > 0) out += Tx(x + PD_G.colW / 2, pdColTop(r.value) - 16, String(r.value), "lab big", "middle",
        { fill: col, "font-size": 32, opacity: nO });
      /* the category, under the floor: the lesson's picture and word */
      out += Em(x + PD_G.colW / 2, PD_G.base + 42, 38, r.pic);
      out += Tx(x + PD_G.colW / 2, PD_G.base + 80, r.label, "lab mid", "middle",
        { fill: opt.colCol && opt.colCol(k) ? col : P.muted });
      if (opt.tickP) out += MK.tick(x + PD_G.colW + 4, pdColTop(r.value) + 10, 15, opt.tickP(k));
    });
    /* the one block the column will not take */
    if (opt.ghost != null && opt.ghost >= 0 && opt.ghostP > 0) {
      var gx = pdColX(x0, opt.ghost), gy = pdBlockY(rows[opt.ghost].value);
      out += G(R(gx, gy, PD_G.colW, PD_G.blockH, 8, "none", P.bad, 3, { "stroke-dasharray": "9 7" }),
        { opacity: Math.min(1, opt.ghostP) });
      out += MK.cross(gx + PD_G.colW / 2, gy + PD_G.blockH / 2, 17, opt.ghostP);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- where the two halves of a chart chapter stand -------------------- */
  var PD_TX = 48, PD_TW = 470, PD_TY = 82;      /* the table */
  var PD_GX = 640;                              /* the graph's first column */

  /* the colour a fruit column is drawn in: gold once it has been declared the
     winner, the lesson's teal until then */
  function pdWinCol(k, won) { return won && k === PD_WIN_I ? P.gold : P.teal; }

  /* ==== the title motif =====================================================
     Four numbers in a row of tiles, and the same four numbers as columns under
     them - the whole lesson in one picture. In the spoken title chapter each
     tile arrives as its number is said, the columns rise on "Draw those four
     numbers as columns", and the winner is ringed on "at a glance". On the two
     cards it stands still. */
  var PD_M = { tileW: 62, tileH: 54, pitch: 76, x0: 34, tileY: 44, base: 300, blockH: 24, blockGap: 4, colW: 46 };
  function pdMotifBlockY(j) { return PD_M.base - (j + 1) * PD_M.blockH - j * PD_M.blockGap; }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var at = PD_FRUIT.map(function (f, k) { return sn ? sc(sn, 0, ["apple", "banana", "orange", "grapes"][k]) : null; });
    var cAsk = sn ? sc(sn, 0, "ask") : null;
    var cDraw = sn ? sc(sn, 1, "draw") : null, cGlance = sn ? sc(sn, 1, "glance") : null;

    out += R(8, 18, 344, 326, 28, P.card, P.line, 3);
    /* the four numbers, as a table would hold them */
    PD_FRUIT.forEach(function (f, k) {
      var p = sn ? popIn(t, at[k], 0.4) : 1;
      if (!(p > 0)) return;
      var x = PD_M.x0 + k * PD_M.pitch;
      out += G(R(x, PD_M.tileY, PD_M.tileW, PD_M.tileH, 12, P.cell, P.line, 2) +
        Em(x + 18, PD_M.tileY + PD_M.tileH / 2, 24, f.pic) +
        Tx(x + 44, PD_M.tileY + PD_M.tileH / 2 + 9, String(f.value), "lab", "middle", { fill: P.gold, "font-size": 26 }),
        { transform: around(x + PD_M.tileW / 2, PD_M.tileY + PD_M.tileH / 2, Math.min(1.08, p)), opacity: Math.min(1, p) });
    });
    out += MK.qmark(320, 130, 22, sn ? on(t, cAsk, 0.4) * (1 - on(t, cDraw, 0.4)) : 0);
    /* the same four numbers as columns */
    var rise = sn ? on(t, cDraw, 0.75) : 1;
    out += L(20, PD_M.base + 3, 340, PD_M.base + 3, P.line, 3, { opacity: sn ? rise : 1 });
    PD_FRUIT.forEach(function (f, k) {
      var x = PD_M.x0 + k * PD_M.pitch + (PD_M.tileW - PD_M.colW) / 2;
      var won = sn ? pdPast(t, cGlance) : true;
      for (var j = 0; j < f.value; j++) {
        var u = clamp(rise * f.value - j, 0, 1);
        if (u <= 0) continue;
        var h = PD_M.blockH * u;
        out += R(x, pdMotifBlockY(j) + (PD_M.blockH - h), PD_M.colW, h, 6,
          won && k === PD_WIN_I ? P.gold : P.teal, "rgba(11,29,44,0.5)", 1.5);
      }
      out += Em(x + PD_M.colW / 2, PD_M.base + 26, 24, f.pic, { opacity: sn ? rise : 1 });
    });
    out += MK.tick(300, 206, 24, sn ? popIn(t, cGlance, 0.4) : 1);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Four numbers in a table, and the same four numbers as columns">' + out + "</svg>";
  }

  /* ==== chapter: the table ====================================================
     Eight survey slips - one per answer, so 2 apple, 4 banana, 1 orange, 1
     grapes - land on the right; the table fills on the left as each fruit is
     named, and its slips light while the rest go dim. On the last beat a
     finger reads down the number column, one number at a time, which is the
     whole point of the chapter: a table is exact and you have to read all
     of it. */
  var PD_SLIP = { w: 96, h: 86, x0: 636, y0: 96, pitch: 118, down: 118 };
  function pdSlipX(k) { return PD_SLIP.x0 + (PD_ANSWER_ORDER[k] % 4) * PD_SLIP.pitch; }
  function pdSlipY(k) { return PD_SLIP.y0 + Math.floor(PD_ANSWER_ORDER[k] / 4) * PD_SLIP.down; }

  function pdTableChapter(scene, beat, t, i) {
    var cSurvey = sc(scene, 0, "survey"), cTable = sc(scene, 0, "table");
    var cRows = sc(scene, 1, "rows"), cApple = sc(scene, 1, "apple"), cBanana = sc(scene, 1, "banana");
    var cOrange = sc(scene, 2, "orange"), cGrapes = sc(scene, 2, "grapes"), cExact = sc(scene, 2, "exact");
    var cRead = sc(scene, 3, "read");
    var at = [cApple, cBanana, cOrange, cGrapes];
    var out = "";

    /* how many rows have their number yet, and which fruit is being named */
    var shown = 0;
    for (var k = 0; k < 4; k++) if (pdPast(t, at[k])) shown = k + 1;
    var active = pdLast(t, cApple, cBanana, cOrange, cGrapes);
    if (pdPast(t, cExact)) active = -1;

    /* the survey slips, one per answer */
    var slipsIn = on(t, cSurvey, 0.5), fade = 1 - 0.75 * on(t, cRead, 0.6);
    var arrived = tally(t, cSurvey, PD_ANSWERS.length, 1.1);
    PD_ANSWERS.forEach(function (fi, k) {
      if (k >= arrived) return;
      var f = PD_FRUIT[fi], x = pdSlipX(k), y = pdSlipY(k);
      var lit = active < 0 ? 1 : fi === active ? 1 : 0.3;
      var p = popIn(t, cSurvey == null ? null : cSurvey + k * (1.1 / PD_ANSWERS.length), 0.35);
      out += G(R(x, y, PD_SLIP.w, PD_SLIP.h, 14, P.card, fi === active ? P.gold : P.line, fi === active ? 3.5 : 2) +
        Em(x + PD_SLIP.w / 2, y + PD_SLIP.h / 2 + 2, 44, f.pic),
        { transform: around(x + PD_SLIP.w / 2, y + PD_SLIP.h / 2, Math.min(1.08, p)),
          opacity: Math.min(1, p) * slipsIn * lit * fade });
    });
    out += Tx(636 + 2 * PD_SLIP.pitch - 11, 372, "every answer", "lab mid muted", "middle",
      { opacity: slipsIn * fade });

    /* the table, filling one row at a time */
    out += pdTable(PD_TX, PD_TY, PD_TW, PD_FRUIT, {
      o: on(t, cTable, 0.5), headL: "Fruit", headR: "How many",
      shown: shown,
      numberO: on(t, cRows, 0.45),
      rowCol: function (k) { return k === active ? P.gold : null; }
    });

    /* reading every single number, one at a time */
    var reading = tally(t, cRead, 4, 1.5);
    if (pdPast(t, cRead)) {
      var r = clamp(reading - 1, 0, 3);
      var ry = pdRowY(PD_TY, r) + PD_T.rowH / 2;
      out += R(PD_TX + 7, pdRowY(PD_TY, r) + 3, PD_TW - 14, PD_T.rowH - 6, 13, "none", P.gold, 3.5);
      out += MK.arrow(PD_TX + PD_TW + 96, ry, PD_TX + PD_TW + 20, ry, 1, P.gold, 7);
    }
    return svg(out);
  }
