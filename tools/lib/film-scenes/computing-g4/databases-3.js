  /* ==== Databases, part 3: answering a question, whole records, the recap ======
     tools/lib/film-scenes/computing-g4/databases-3.js.

     EVERY FIGURE IN A TABLE IS A CHECKABLE CLAIM, so no count in this chapter
     is typed in: the records a filter keeps come from ART.rowMatches, the
     counter card prints that list's length, and one tick is drawn per record in
     it. "Three records match" and three ticks are the same number, and nothing
     here can make them differ.

     Nothing is re-ordered by a filter - the records stay where they are and the
     ones that do not match turn into dashed outlines, which is what the lesson
     means by hiding, and what "It deletes nothing" is about. */

  var DB_FP = { x: 16, w: 250 };
  var DB_SPECS = [
    { q: ["Who is older", "than 8?"], field: "age", test: "more than", value: "8",
      spec: { field: "age", op: "gt", value: 8 } },
    { q: ["Who has a", "rabbit?"], field: "pet", test: "is", value: "rabbit",
      spec: { field: "pet", op: "eq", value: "rabbit" } }
  ];

  function dbQuestionCard(lines, o, lit) {
    if (!(o > 0)) return "";
    var body = R(DB_FP.x, 24, DB_FP.w, 96, 18, P.card, lit ? P.gold : P.line, lit ? 3 : 2);
    if (lines) {
      body += Tx(DB_FP.x + DB_FP.w / 2, 64, lines[0], "lab", "middle");
      body += Tx(DB_FP.x + DB_FP.w / 2, 98, lines[1], "lab", "middle");
    }
    return G(body, { opacity: clamp(o, 0, 1) });
  }
  function dbFilterRow(k, text, o, lit) {
    if (!(o > 0)) return "";
    var y = 138 + k * 58;
    var body = text == null
      ? R(DB_FP.x, y, DB_FP.w, 50, 14, "none", P.line, 2, { "stroke-dasharray": "10 8" })
      : R(DB_FP.x, y, DB_FP.w, 50, 14, P.cell, lit ? P.blue : P.line, lit ? 3 : 2) +
        Tx(DB_FP.x + 16, y + 32, text, "lab mid", "start", { fill: lit ? P.blue : P.ink });
    return G(body, { opacity: clamp(o, 0, 1) });
  }
  function dbCountCard(n, o, lit) {
    if (!(o > 0)) return "";
    return G(R(DB_FP.x, 318, DB_FP.w, 96, 18, "#1B3A52", lit ? P.gold : P.good, 3) +
      Tx(DB_FP.x + DB_FP.w / 2, 376, String(n), "lab huge good", "middle") +
      Tx(DB_FP.x + DB_FP.w / 2, 402, n === 1 ? "record kept" : "records kept", "lab mid muted", "middle"),
      { opacity: clamp(o, 0, 1) });
  }

  function dbFilterChapter(scene, beat, t, i) {
    var cAnswers = sc(scene, 0, "answers"), cFilter = sc(scene, 0, "filter");
    var cWho = sc(scene, 1, "who"), cFld = sc(scene, 1, "fld"), cTest = sc(scene, 1, "test"), cVal = sc(scene, 1, "val");
    var cStay = sc(scene, 2, "stay"), cHidden = sc(scene, 2, "hidden");
    var cA = sc(scene, 3, "amal"), cZ = sc(scene, 3, "zara"), cL = sc(scene, 3, "leo"), cThree = sc(scene, 3, "three");
    var cAsk = sc(scene, 4, "ask"), cSpec = sc(scene, 4, "spec"), cOne = sc(scene, 4, "one");
    var cOneQ = sc(scene, 5, "oneq"), cOneF = sc(scene, 5, "onef"), cData = sc(scene, 5, "data");
    var out = "";

    var second = dbPast(t, cSpec);
    var S = DB_SPECS[second ? 1 : 0];
    /* the lesson's own rule decides which records are kept */
    var kept = second ? DB_HAS_RABBIT : DB_OLDER_THAN_8;
    var applied = second || dbPast(t, cHidden);
    var counted = second ? dbPast(t, cOne) : dbPast(t, cThree);

    /* the question, the filter and the answer */
    out += dbQuestionCard(dbPast(t, cAsk) ? S.q : dbPast(t, cWho) ? DB_SPECS[0].q : null,
      on(t, cAnswers, 0.5), on(t, cOneQ, 0.4) > 0.5);
    out += MK.qmark(141, 72, 26, on(t, cAnswers, 0.5) * (1 - on(t, cWho, 0.4)));
    var rowLit = on(t, cOneF, 0.4) > 0.5;
    var at = [cFld, cTest, cVal];
    [S.field, S.test, S.value].forEach(function (v, k) {
      var shown = second || dbPast(t, at[k]);
      out += dbFilterRow(k, shown ? ["field: ", "test: ", "value: "][k] + v : null,
        on(t, cFilter, 0.35), rowLit || (!second && k === 2 && dbPast(t, cVal) && !applied));
    });
    out += dbCountCard(kept.length, popIn(t, second ? cOne : cThree, 0.45), on(t, cData, 0.4) > 0.5);

    /* the table: the records that do not match turn into outlines */
    out += dbFrame({ hot: applied ? S.field : null });
    DB_ROWS.forEach(function (row, slot) {
      var isKept = kept.indexOf(row.id) >= 0;
      var lit = isKept && dbPast(t, cStay);
      out += dbRecord(row, dbRowY(slot), {
        ghost: applied && !isKept,
        col: lit ? P.gold : null, fill: lit ? "#1B3A52" : null
      });
    });
    if (applied) out += dbFieldBand(S.field, 1, P.blue);

    /* one tick per record kept, so the ticks and the counter are one number */
    if (!second) {
      var ticks = { amal: cA, zara: cZ, leo: cL };
      DB_OLDER_THAN_8.forEach(function (id) {
        var slot = dbIndexOf(DB_BASE, id);
        out += dbCellRing("age", slot, on(t, ticks[id], 0.4), P.good);
        out += MK.tick(996, dbRowCY(slot), 20, popIn(t, ticks[id], 0.4));
      });
    } else {
      DB_HAS_RABBIT.forEach(function (id) {
        var slot = dbIndexOf(DB_BASE, id);
        out += dbCellRing("pet", slot, on(t, cOne, 0.4), P.good);
        out += MK.tick(996, dbRowCY(slot), 20, popIn(t, cOne, 0.4));
      });
    }
    return svg(out);
  }

  /* ==== chapter: whole records move =============================================
     A sort carries Amal's whole record down the table - and it swings out to
     the right of the table while it travels, with the other records faded to a
     fifth, so no two rows are ever readable on the same spot. Then a filter
     turns three records into outlines without moving or deleting one, and the
     cell that started as "cat" is still "cat". */
  var DB_WCARDS = [
    { title: "Sorting", a: "moves whole", b: "records" },
    { title: "Filtering", a: "hides records,", b: "deletes none" },
    { title: "A cell", a: "never changes", b: "either way" }
  ];
  function dbWholeCard(k, state, p) {
    if (!(p > 0)) return "";
    var c = DB_WCARDS[k], x = DB_FP.x, w = DB_FP.w, y = 30 + k * 132, h = 118;
    var lit = state === 2;
    var body = R(x, y, w, h, 18, lit ? "#1B3A52" : P.card, lit ? P.good : P.line, lit ? 3 : 2) +
      Tx(x + 20, y + 42, c.title, "lab big", "start", { fill: lit ? P.good : P.ink }) +
      Tx(x + 20, y + 74, c.a, "lab mid muted", "start") +
      Tx(x + 20, y + 102, c.b, "lab mid muted", "start");
    return G(body, { opacity: (state ? 1 : 0.4) * Math.min(1, p),
      transform: around(x + w / 2, y + h / 2, Math.min(1.03, p)) });
  }

  function dbWholeChapter(scene, beat, t, i) {
    var cRearr = sc(scene, 0, "rearrange"), cKeeps = sc(scene, 0, "keeps");
    var cHides = sc(scene, 1, "hides"), cDeletes = sc(scene, 1, "deletes");
    var cNeither = sc(scene, 2, "neither"), cStill = sc(scene, 2, "still");
    var out = "";

    var stage = dbPast(t, cNeither) ? 2 : dbPast(t, cHides) ? 1 : 0;
    for (var k = 0; k < 3; k++) out += dbWholeCard(k, k === stage ? 2 : k < stage ? 1 : 0, 1);

    out += dbFrame({ hot: stage >= 1 ? "age" : null });

    /* the sort, with Amal's record swung clear of the others as it travels */
    var raw = cRearr == null ? 0 : clamp((t - cRearr) / DB_SORT, 0, 1);
    var u = ease(raw), travel = Math.sin(Math.PI * raw);
    var kept = DB_OLDER_THAN_8, applied = stage >= 1;
    var amalSlot = dbIndexOf(DB_BY_HEIGHT_DESC, "amal");
    /* Amal alone travels, at full strength and swung 110 px clear of the table,
       because this beat is about a whole record moving in one piece. Every
       other record dissolves early and comes back late (dbBlink), so nothing
       is ever drawn under her - checked at both of her crossings. */
    var ph = dbBlink(raw, 0.32, 0.68);
    DB_BY_HEIGHT_DESC.forEach(function (id) {
      var row = dbRowById(id), star = id === "amal";
      var a = dbIndexOf(DB_BASE, id), b = dbIndexOf(DB_BY_HEIGHT_DESC, id), moved = a !== b;
      var isKept = kept.indexOf(id) >= 0;
      if (star) {
        out += dbRecord(row, dbRowY(lerp(a, b, u)), {
          o: 1, dx: 110 * travel, ghost: applied && !isKept,
          col: raw > 0 ? P.good : null, fill: raw > 0 ? "#1B3A52" : null
        });
        return;
      }
      out += dbRecord(row, dbRowY(moved && ph.going ? a : b), {
        o: moved ? ph.p : 1, dx: moved ? 26 * (1 - ph.p) : 0,
        ghost: applied && !isKept
      });
    });

    if (stage === 0) {
      out += dbCellRing("pet", amalSlot, on(t, cKeeps, 0.5) * (raw >= 1 ? 1 : 0), P.good);
      out += MK.pill(1043, dbRowCY(amalSlot), "still Amal's cat", on(t, cKeeps, 0.5) * (raw >= 1 ? 1 : 0),
        { size: 20, col: P.good, ink: P.good, fill: "#1B3A52" });
    }
    if (stage === 1) {
      out += dbFieldBand("age", on(t, cHides, 0.5), P.blue);
      out += MK.pill(1043, dbRowCY(4), "hidden, not deleted", on(t, cDeletes, 0.5),
        { size: 19, col: P.blue, ink: P.ink, fill: "#1B3A52" });
    }
    if (stage === 2) {
      out += dbCellRing("pet", amalSlot, on(t, cNeither, 0.5), P.good);
      out += dbZoom(dbColCX("pet"), dbRowCY(amalSlot), DB_RIGHT.cx, 150,
        on(t, cNeither == null ? null : cNeither + 0.5, 0.6),
        "\u{1F431}", "cat", "sorted and filtered");
      out += MK.tick(1043, 292, 30, popIn(t, cStill, 0.4));
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------
     The lesson's own six words, with the lesson's own pictures for them. */
  var DB_RECAP = MK.recapKind([
    { beat: 0, at: "record", title: "Record", sub: "one row: one thing", pic: "➡️" },
    { beat: 0, at: "field", title: "Field", sub: "one column: one fact", pic: "⬇️" },
    { beat: 0, at: "data", title: "Data", sub: "one cell: one fact", pic: "\u{1F3AF}" },
    { beat: 1, at: "type", title: "Data type", sub: "text, number, date, currency", pic: "\u{1F524}" },
    { beat: 2, at: "sort", title: "Sort", sub: "put records in order", pic: "\u{1F522}" },
    { beat: 2, at: "filter", title: "Filter", sub: "keep only what matches", pic: "\u{1F50D}" }
  ], { goBeat: 2, goAt: "filter" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "What a record, a field and a piece of data are",
      "How to give every field the right data type",
      "How to sort a table, and how to question it"
    ] }),
    parts: dbPartsChapter,
    types: dbTypesChapter,
    sorting: dbSortingChapter,
    filter: dbFilterChapter,
    whole: dbWholeChapter,
    recap: DB_RECAP
  };
