  /* ==== Grade 4 Computing, Lesson 9: Databases ================================
     tools/lib/film-scenes/computing-g4/databases.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/databases.json.

     THERE IS NO ART.sim FOR A DATABASE TABLE - the lesson keeps its table
     inside a closure in an activity - so the table is drawn here, in the
     engine's idiom, and only the RULES are borrowed:

         ART.sortRows(rows, field, dir)   the order a sort puts the records in
         ART.rowMatches(row, spec)        whether a record passes a filter

     so every count the voice says ("Three records match", "One record: Omar")
     is counted off the lesson's own rule rather than typed in here.

     THE ROWS. One table carries the whole film: the lesson's own six children,
     their pets, ages and heights, taken from the datasort step and agreeing
     with the filter step row for row.

     A ROW THAT MOVES STAYS READABLE. A sort fades every travelling row to a
     fifth while it is in flight (dbOrdered below), so two rows crossing are
     never both legible on one spot, and in "Whole records move" Amal's record
     also swings out to the right of the table while the others hold still.

     This file: the palette, the table's data and geometry, the drawings every
     chapter shares, the title motif and the chapter "Records, fields, data".
     Every top-level name here starts with db. */

  var HUE = {
    title: P.teal, parts: P.gold, types: P.plum, sorting: P.accent,
    filter: P.blue, whole: P.good, recap: P.teal
  };

  /* ---- the lesson's six records --------------------------------------------- */

  var DB_ROWS = [
    { id: "amal", name: "Amal", pic: "\u{1F467}\u{1F3FE}", pet: "cat",     petPic: "\u{1F431}", age: 9,  height: 134 },
    { id: "sami", name: "Sami", pic: "\u{1F466}\u{1F3FE}", pet: "dog",     petPic: "\u{1F436}", age: 8,  height: 128 },
    { id: "zara", name: "Zara", pic: "\u{1F467}\u{1F3FD}", pet: "fish",    petPic: "\u{1F420}", age: 10, height: 141 },
    { id: "omar", name: "Omar", pic: "\u{1F466}\u{1F3FD}", pet: "rabbit",  petPic: "\u{1F430}", age: 8,  height: 125 },
    { id: "leo",  name: "Leo",  pic: "\u{1F466}\u{1F3FB}", pet: "budgie",  petPic: "\u{1F426}", age: 9,  height: 137 },
    { id: "nora", name: "Nora", pic: "\u{1F467}\u{1F3FB}", pet: "hamster", petPic: "\u{1F439}", age: 7,  height: 122 }
  ];

  var DB_FIELDS = [
    { id: "name",   label: "name",        w: 175 },
    { id: "pet",    label: "pet",         w: 165 },
    { id: "age",    label: "age",         w: 100 },
    { id: "height", label: "height (cm)", w: 160 }
  ];

  /* ---- the table's geometry --------------------------------------------------
     The outer card is 290..910 across and 20..396 down, so the left panel
     (16..230) and the right panel (926..1160) never touch it. */
  var DB_T = { x: 300, y: 30, w: 600, hdr: 44, rh: 52 };
  var DB_LEFT = { x: 16, w: 214 };
  var DB_RIGHT = { cx: 1043, w: 234 };

  var DB_COLX = (function () {
    var out = [], at = 0;
    DB_FIELDS.forEach(function (f) { out.push(at); at += f.w; });
    return out;
  })();
  function dbFieldIndex(id) {
    for (var k = 0; k < DB_FIELDS.length; k++) if (DB_FIELDS[k].id === id) return k;
    throw new Error("databases: the film's table has no field " + JSON.stringify(id));
  }
  function dbColLeft(id) { return DB_T.x + DB_COLX[dbFieldIndex(id)]; }
  function dbColW(id) { return DB_FIELDS[dbFieldIndex(id)].w; }
  function dbColCX(id) { return dbColLeft(id) + dbColW(id) / 2; }
  function dbRowY(slot) { return DB_T.y + DB_T.hdr + slot * DB_T.rh; }
  function dbRowCY(slot) { return dbRowY(slot) + DB_T.rh / 2; }
  var DB_TABLE_H = DB_T.hdr + DB_ROWS.length * DB_T.rh;

  function dbRowById(id) {
    for (var k = 0; k < DB_ROWS.length; k++) if (DB_ROWS[k].id === id) return DB_ROWS[k];
    throw new Error("databases: no record " + JSON.stringify(id));
  }
  function dbIndexOf(order, id) { return order.indexOf(id); }
  function dbIds(rows) { return rows.map(function (r) { return r.id; }); }

  /* ---- the lesson's own rules, worked out once ------------------------------- */
  var DB_BASE = dbIds(DB_ROWS);
  var DB_BY_HEIGHT_DESC = dbIds(ART.sortRows(DB_ROWS, "height", "desc"));
  var DB_BY_PET_ASC = dbIds(ART.sortRows(DB_ROWS, "pet", "asc"));
  var DB_BY_PET_DESC = dbIds(ART.sortRows(DB_ROWS, "pet", "desc"));
  function dbMatching(spec) {
    return DB_ROWS.filter(function (r) { return ART.rowMatches(r, spec); }).map(function (r) { return r.id; });
  }
  var DB_OLDER_THAN_8 = dbMatching({ field: "age", op: "gt", value: 8 });
  var DB_HAS_RABBIT = dbMatching({ field: "pet", op: "eq", value: "rabbit" });

  /* ---- timing helpers --------------------------------------------------------- */

  /* 1 while the chapter's beats a to b are the current ones, 0 before and after */
  function dbSpan(t, scene, a, b) {
    var inA = a <= 0 ? 1 : into(t, scene.first + a);
    var outB = b + 1 < scene.beats.length ? into(t, scene.first + b + 1) : 0;
    return clamp(inA * (1 - outB), 0, 1);
  }
  /* 0 -> 1 from the chapter's beat k on */
  function dbFrom(t, scene, k) { return k <= 0 ? 1 : k >= scene.beats.length ? 0 : into(t, scene.first + k); }
  function dbPast(t, at) { return at != null && t >= at; }

  /* ---- the table ------------------------------------------------------------ */

  /* the card, the header and the column rules. opt: {o, hot (a field id)} */
  function dbFrame(opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var x = DB_T.x, y = DB_T.y;
    var out = R(x - 10, y - 10, DB_T.w + 20, DB_TABLE_H + 20, 18, P.card, P.line, 2);
    out += R(x, y, DB_T.w, DB_T.hdr, 8, P.cell, P.line, 1.5);
    DB_FIELDS.forEach(function (f, k) {
      var cx = x + DB_COLX[k];
      if (k) out += L(cx - 3, y + 6, cx - 3, y + DB_TABLE_H - 4, P.line, 1.4, { opacity: 0.65 });
      out += Tx(cx + f.w / 2, y + DB_T.hdr / 2 + 7, f.label, "lab mid", "middle",
        { fill: opt.hot === f.id ? P.gold : P.muted });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* one record, drawn at the top y given. opt: {o, dx, col (a lit border),
     fill, ghost (a dashed outline and faint contents), ink} */
  function dbRecord(row, y, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var x = DB_T.x + (opt.dx || 0), h = DB_T.rh, ink = opt.ink || P.ink;
    var body = opt.ghost
      ? R(x + 2, y + 3, DB_T.w - 4, h - 6, 10, "none", P.line, 1.6, { "stroke-dasharray": "9 8" })
      : R(x + 2, y + 3, DB_T.w - 4, h - 6, 10, opt.fill || P.cell, opt.col || P.line, opt.col ? 3 : 1.4);
    var inner = "";
    DB_FIELDS.forEach(function (f, k) {
      var cx = x + DB_COLX[k];
      if (f.id === "name") {
        inner += Em(cx + 28, y + h / 2, 28, row.pic);
        inner += Tx(cx + 52, y + h / 2 + 8, row.name, "lab", "start", { fill: ink });
      } else if (f.id === "pet") {
        inner += Em(cx + 26, y + h / 2, 26, row.petPic);
        inner += Tx(cx + 48, y + h / 2 + 8, row.pet, "lab", "start", { fill: ink });
      } else {
        inner += Tx(cx + f.w / 2, y + h / 2 + 8, String(row[f.id]), "lab", "middle", { fill: ink });
      }
    });
    return G(body + G(inner, { opacity: opt.ghost ? 0.16 : 1 }), { opacity: clamp(o, 0, 1) });
  }

  /* Every record, in the order the table is in. stages is a list of orders,
     each with the time it is taken: [{at: null, order}, {at: cue, order}, ...].
     A record travels to its new slot over DB_SORT seconds AND FADES TO A FIFTH
     while it is in flight, so two rows crossing are never both readable.
     opt: {rowOpt (a function (row, slot) -> the options for that record)} */
  var DB_SORT = 1.05;

  /* A CHANGE OF ORDER IS A DISSOLVE, NOT A SLIDE. Every record that moves fades
     out where it was and fades in where it now is, and the two halves never
     overlap in time, so no two records are ever drawn on one spot at all.

     Sliding the records and fading them while they travelled was tried first
     and is NOT enough: at the earliest crossing of this film's sorts both rows
     were still legible on top of each other - "Amal" over "Leo", cat over
     budgie, 134 over 137 - which is exactly the fault this film was warned
     about. No fade curve fixes that, because the two are at the same opacity by
     construction. Every record that moves drifts by the SAME 26 px, so the
     drift cannot make an overlap either, and a record that is already in the
     right place never fades at all.

     dbBlink(raw) says how much of a moving record is showing, and whether it is
     still at its old slot. */
  function dbBlink(raw, outBy, inFrom) {
    outBy = outBy || 0.4; inFrom = inFrom || 0.6;
    if (raw >= 1) return { p: 1, going: false };
    if (raw < 0.5) return { p: 1 - ease(clamp(raw / outBy, 0, 1)), going: true };
    return { p: ease(clamp((raw - inFrom) / (1 - inFrom), 0, 1)), going: false };
  }
  function dbOrdered(t, stages, opt) {
    opt = opt || {};
    var from = stages[0].order, to = stages[0].order, raw = 1;
    for (var k = 1; k < stages.length; k++) {
      if (stages[k].at == null || t < stages[k].at) break;
      from = to; to = stages[k].order;
      raw = clamp((t - stages[k].at) / DB_SORT, 0, 1);
    }
    var ph = dbBlink(raw), out = "";
    to.forEach(function (id) {
      var a = dbIndexOf(from, id), b = dbIndexOf(to, id), moved = a !== b;
      var ro = opt.rowOpt ? opt.rowOpt(dbRowById(id), b, a) : {};
      if (moved) ro = Object.assign({}, ro, {
        o: (ro.o == null ? 1 : ro.o) * ph.p, dx: (ro.dx || 0) + 26 * (1 - ph.p) });
      out += dbRecord(dbRowById(id), dbRowY(moved && ph.going ? a : b), ro);
    });
    return out;
  }

  /* a gold band down one field, from the header to the last row */
  function dbFieldBand(id, o, col) {
    if (!(o > 0)) return "";
    return R(dbColLeft(id) - 3, DB_T.y - 5, dbColW(id) + 6, DB_TABLE_H + 10, 12,
      "rgba(244,201,93,0.12)", col || P.gold, 3, { opacity: clamp(o, 0, 1) });
  }
  /* a gold ring round one cell of the record in slot `slot` */
  function dbCellRing(fieldId, slot, o, col) {
    if (!(o > 0)) return "";
    return R(dbColLeft(fieldId) - 1, dbRowY(slot) + 1, dbColW(fieldId) + 2, DB_T.rh - 2, 10,
      "rgba(244,201,93,0.14)", col || P.gold, 3, { opacity: clamp(o, 0, 1) });
  }

  /* one of the three left-hand cards: Record, Field, Data.
     state: 0 not yet, 1 already met, 2 the one being named now */
  var DB_PART_CARDS = [
    { title: "Record", sub: "one row", pic: "➡️" },
    { title: "Field", sub: "one column", pic: "⬇️" },
    { title: "Data", sub: "one cell", pic: "\u{1F3AF}" }
  ];
  var DB_CARD = { h: 104, ys: [34, 168, 302] };
  function dbPartCard(k, state, p) {
    var c = DB_PART_CARDS[k], y = DB_CARD.ys[k], x = DB_LEFT.x, w = DB_LEFT.w, h = DB_CARD.h;
    var lit = state === 2;
    var body = R(x, y, w, h, 18, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 3 : 2,
      state ? null : { "stroke-dasharray": "10 8" });
    body += Em(x + 38, y + h / 2, 38, c.pic);
    body += Tx(x + 70, y + h / 2 - 4, c.title, "lab big", "start", { fill: lit ? P.gold : P.ink });
    body += Tx(x + 70, y + h / 2 + 26, c.sub, "lab mid muted", "start");
    return G(body, { opacity: (state === 0 ? 0.32 : state === 1 ? 0.6 : 1) * Math.min(1, p),
      transform: around(x + w / 2, y + h / 2, Math.min(1.04, p)) });
  }

  /* A cell lifted out of the table and grown: the card is built about the
     origin, then carried from the cell to the right-hand panel, so nothing has
     to draw a line across the other columns to say which cell it came from. */
  function dbZoomCard(pic, word, cap) {
    var w = DB_RIGHT.w, h = 150;
    return R(-w / 2, -h / 2, w, h, 18, "#1B3A52", P.gold, 3) +
      Em(0, -h / 2 + 50, 52, pic) +
      Tx(0, h / 2 - 48, word, "lab big gold", "middle") +
      Tx(0, h / 2 - 18, cap, "lab mid muted", "middle");
  }
  function dbZoom(fromCX, fromCY, toCX, toCY, u, pic, word, cap) {
    if (!(u > 0)) return "";
    var cx = lerp(fromCX, toCX, u), cy = lerp(fromCY, toCY, u), s = lerp(0.3, 1, u);
    return G(dbZoomCard(pic, word, cap),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(s) + ")", opacity: Math.min(1, u) });
  }

  /* ==== the title motif =========================================================
     A small table: the grid draws, one record lights gold, the record slides
     down two rows (a sort moving a whole record), and a magnifier pops on for
     the question. Still, on the two cards, it is a table with a lit record, a
     lit field and a magnifier beside it. */
  var DBM = { x: 40, y: 64, cw: 70, ch: 48, cols: 4, rows: 4 };
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cTable = sn ? sc(sn, 0, "table") : null, cRow = sn ? sc(sn, 0, "row") : null;
    var cSort = sn ? sc(sn, 1, "sort") : null, cAns = sn ? sc(sn, 1, "answer") : null;
    var grid = sn ? on(t, cTable, 0.6) : 1;
    var rowP = sn ? popIn(t, cRow, 0.45) : 1;
    var slide = sn ? on(t, cSort, 0.8) : 1;
    var ansP = sn ? popIn(t, cAns, 0.45) : 1;
    var gw = DBM.cols * DBM.cw, gh = DBM.ch + DBM.rows * DBM.ch;

    out += R(14, 30, 332, 300, 26, P.card, P.line, 3);
    /* the field, lit for the whole of the second line */
    out += R(DBM.x + DBM.cw - 4, DBM.y - 4, DBM.cw + 8, gh + 8, 10,
      "rgba(183,139,209,0.16)", P.plum, 3, { opacity: ansP });
    /* the record, gold, sliding down two rows as the sort is named */
    var slot = lerp(0, 2, slide);
    out += R(DBM.x - 4, DBM.y + DBM.ch + slot * DBM.ch - 2, gw + 8, DBM.ch + 4, 10,
      "rgba(244,201,93,0.20)", P.gold, 3, { opacity: rowP });
    /* the grid */
    out += G(R(DBM.x, DBM.y, gw, DBM.ch, 6, P.cell, P.line, 2) +
      R(DBM.x, DBM.y, gw, gh, 6, "none", P.line, 2), { opacity: grid });
    var lines = "";
    for (var c = 1; c < DBM.cols; c++) lines += L(DBM.x + c * DBM.cw, DBM.y, DBM.x + c * DBM.cw, DBM.y + gh, P.line, 1.6);
    for (var r = 1; r <= DBM.rows; r++) lines += L(DBM.x, DBM.y + r * DBM.ch, DBM.x + gw, DBM.y + r * DBM.ch, P.line, 1.6);
    out += G(lines, { opacity: grid * 0.8 });
    out += MK.pop(Em(302, 300, 46, "\u{1F50D}"), 302, 300, ansP);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A table with one record lit gold and one field lit purple, and a magnifier beside it">' +
      out + "</svg>";
  }

  /* ==== chapter: records, fields, data ==========================================
     The table is built, then one part at a time is marked - the record across,
     the field down, the one cell lifted out and grown - with the three cards on
     the left lighting as each is named. The last beat leaves the table for a
     blank grid where the two arrows can cross without covering any words. */
  function dbPartsTable(scene, t) {
    var cThree = sc(scene, 0, "three"), cMeet = sc(scene, 0, "meet");
    var cRecord = sc(scene, 1, "record"), cEvery = sc(scene, 1, "everything");
    var cAmal = sc(scene, 2, "amal"), cValues = sc(scene, 2, "values");
    var cField = sc(scene, 3, "field");
    var cPetf = sc(scene, 4, "petfield"), cList = sc(scene, 4, "list");
    var cData = sc(scene, 5, "data"), cCell = sc(scene, 5, "cell");
    var out = "";

    var rowBand = dbSpan(t, scene, 1, 2);
    var colBand = dbSpan(t, scene, 3, 4);
    var cellSpan = dbSpan(t, scene, 5, 5);

    /* the three cards: dashed until met, dim once met, gold while being named */
    var state = [0, 0, 0];
    if (dbPast(t, cRecord)) state[0] = dbPast(t, cField) ? 1 : 2;
    if (dbPast(t, cField)) state[1] = dbPast(t, cData) ? 1 : 2;
    if (dbPast(t, cData)) state[2] = 2;
    for (var k = 0; k < 3; k++)
      out += dbPartCard(k, state[k], popIn(t, cMeet == null ? null : cMeet + k * 0.26, 0.4));

    out += dbFrame({ o: on(t, cThree, 0.5), hot: colBand > 0.5 ? "pet" : null });
    DB_ROWS.forEach(function (row, slot) {
      var lit = rowBand > 0.5 && slot === 0;
      out += dbRecord(row, dbRowY(slot), {
        o: on(t, cThree == null ? null : cThree + 0.12 * slot, 0.45),
        col: lit ? P.gold : null, fill: lit ? "#1B3A52" : null
      });
    });

    /* the record: the whole of Amal's row, and an arrow from its card */
    if (rowBand > 0) {
      out += G(R(DB_T.x - 4, dbRowY(0) - 1, DB_T.w + 8, DB_T.rh + 2, 12,
        "none", P.gold, 3), { opacity: rowBand });
      out += MK.arrow(238, dbRowCY(0), 286, dbRowCY(0), on(t, cEvery, 0.4) * rowBand, P.gold, 7);
      out += MK.ripple(DB_T.x + 60, dbRowCY(0), t, cAmal, P.gold);
      /* its three facts, ringed one after another as they are read out */
      var vals = ["pet", "age", "height"], gotv = tally(t, cValues, 3, 0.9);
      vals.forEach(function (f, n) {
        if (n >= gotv) return;
        out += dbCellRing(f, 0, popIn(t, cValues == null ? null : cValues + n * 0.3, 0.35) * rowBand);
      });
    }

    /* the field: the whole pet column, then its six values lit one by one */
    if (colBand > 0) {
      out += dbFieldBand("pet", colBand);
      var gotp = tally(t, cList, DB_ROWS.length, 1.5);
      for (var s = 0; s < DB_ROWS.length; s++) {
        if (s >= gotp) continue;
        out += dbCellRing("pet", s, popIn(t, cList == null ? null : cList + s * 0.25, 0.3) * colBand, P.gold);
      }
      out += MK.ripple(dbColCX("pet"), DB_T.y + 22, t, cPetf, P.gold);
    }

    /* the data: one cell, lifted out and grown */
    if (cellSpan > 0) {
      out += dbCellRing("pet", 0, on(t, cData, 0.4) * cellSpan);
      out += G(dbZoom(dbColCX("pet"), dbRowCY(0), DB_RIGHT.cx, 140,
        on(t, cData == null ? null : cData + 0.5, 0.6),
        "\u{1F431}", "cat", "one fact, one thing"), { opacity: cellSpan });
      out += MK.tick(1043, 252, 26, popIn(t, cCell, 0.4) * cellSpan);
    }
    return out;
  }

  /* The last beat: a blank grid, so the two arrows can cross without covering a
     single word. Record goes across it, field goes down it. */
  var DBG = { x: 392, y: 96, cw: 94, ch: 62, cols: 5, rows: 4 };
  function dbAcrossDown(scene, t) {
    var cAcross = sc(scene, 6, "across"), cDown = sc(scene, 6, "down"), cMix = sc(scene, 6, "mix");
    var gw = DBG.cols * DBG.cw, gh = DBG.rows * DBG.ch, out = "";
    var rowY = DBG.y + 1.5 * DBG.ch, colX = DBG.x + 2.5 * DBG.cw;
    var a = on(t, cAcross, 0.5), d = on(t, cDown, 0.5);

    out += R(DBG.x - 4, rowY - DBG.ch / 2 - 4, gw + 8, DBG.ch + 8, 10, "rgba(244,201,93,0.16)", P.gold, 3, { opacity: a });
    out += R(colX - DBG.cw / 2 - 4, DBG.y - 4, DBG.cw + 8, gh + 8, 10, "rgba(183,139,209,0.16)", P.plum, 3, { opacity: d });
    out += R(DBG.x, DBG.y, gw, gh, 8, "none", P.line, 2);
    for (var c = 1; c < DBG.cols; c++) out += L(DBG.x + c * DBG.cw, DBG.y, DBG.x + c * DBG.cw, DBG.y + gh, P.line, 1.6);
    for (var r = 1; r < DBG.rows; r++) out += L(DBG.x, DBG.y + r * DBG.ch, DBG.x + gw, DBG.y + r * DBG.ch, P.line, 1.6);

    out += MK.arrow(DBG.x - 30, rowY, DBG.x + gw + 34, rowY, a, P.gold, 9);
    out += MK.arrow(colX, DBG.y - 30, colX, DBG.y + gh + 34, d, P.plum, 9);
    out += MK.pill(212, rowY, "record: across", a, { size: 22, col: P.gold, ink: P.gold, fill: "#1B3A52" });
    out += MK.pill(colX, 406, "field: down", d, { size: 22, col: P.plum, ink: P.plum, fill: "#1B3A52" });
    out += MK.qmark(966, 96, 34, on(t, cMix, 0.45));
    return out;
  }

  function dbPartsChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 6), out = "";
    if (u < 1) out += G(dbPartsTable(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(dbAcrossDown(scene, t), { opacity: u });
    return svg(out);
  }
