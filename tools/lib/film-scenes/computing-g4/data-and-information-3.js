  /* ==== Data and Information, part 3: the meaning, raw data, the recap, KINDS ===
     tools/lib/film-scenes/computing-g4/data-and-information-3.js. See the
     header of data-and-information.js.

     EVERY FIGURE HERE IS THE FILM'S ONE COUNT. The table's tally marks are
     drawn one per child from diCount(), the number beside them is that same
     count, the eight faces waiting at the top are the eight children, and the
     total row adds them up. Nothing stands for more than one child, so there
     is no key to get wrong.

     The temperature chart is drawn against its own axis by arithmetic: a bar
     of v degrees is v / 30 of the 230 units between the baseline (y 400) and
     the top gridline (y 170), and each bar prints its own number. 21 lands
     just above the 20 line and 19 just below it, which is the check that the
     scale is right. */

  /* ==== chapter: information, the meaning ======================================== */

  var DI_TABLE = { x: 60, y: 30, w: 520, h: 380 };
  var DI_ROW_Y = [146, 208, 270, 332];
  var DI_COUNT_CUE = { walk: "walk3", bus: "bus2", car: "car2", bike: "bike1" };

  function diInfoChapter(scene, beat, t, i) {
    var cOrg = sc(scene, 0, "organise"), cTable = sc(scene, 0, "table"), cCount = sc(scene, 0, "count");
    var cAll8 = sc(scene, 1, "all8");
    var cLook = sc(scene, 2, "look"), cMost = sc(scene, 2, "most");
    var cOne = sc(scene, 3, "one"), cMeans = sc(scene, 3, "means");
    var cActOn = sc(scene, 4, "acton"), cCross = sc(scene, 4, "crossing"), cRack = sc(scene, 4, "rack");
    var out = "", wayCue = {};
    DI_TABLE_ORDER.forEach(function (id) { wayCue[id] = sc(scene, 1, DI_COUNT_CUE[id]); });

    /* ---- the table ---- */
    var to = popIn(t, cOrg, 0.45);
    out += G(R(DI_TABLE.x, DI_TABLE.y, DI_TABLE.w, DI_TABLE.h, 22, P.card, P.line, 2) +
      Tx(96, 82, "Way", "lab mid muted", "start") + Tx(300, 82, "Children", "lab mid muted", "start") +
      L(80, 96, 560, 96, P.line, 2), { opacity: clamp(to, 0, 1) });

    var rows = tally(t, cTable, 4, 0.7);
    DI_TABLE_ORDER.forEach(function (id, k) {
      var ro = clamp(rows - k, 0, 1);
      if (!(ro > 0)) return;
      var y = DI_ROW_Y[k], n = diCount(id), at = wayCue[id], p = popIn(t, at, 0.4);
      /* one row at a time: the walk row lets go as the bike row is named */
      var ringed = k === 0 ? on(t, cMost, 0.5) * (1 - on(t, cOne, 0.45)) : k === 3 ? on(t, cOne, 0.5) : 0;
      if (ringed > 0) out += R(78, y - 28, 484, 56, 12, "none", P.gold, 4, { opacity: ringed * (0.6 + 0.4 * breathe(t)) });
      out += G(Em(112, y, 34, DI_WAY[id].pic) + Tx(142, y + 9, DI_WAY[id].label, "lab", "start"), { opacity: ro });
      /* one mark per child, drawn as that row is counted */
      for (var m = 0; m < n; m++) {
        var mo = clamp(p * 3 - m, 0, 1);
        if (mo > 0) out += L(292 + m * 24, y - 16, 292 + m * 24, y + 16, P.gold, 5, { opacity: mo });
      }
      if (p > 0) out += MK.pop(Tx(500, y + 15, String(n), "lab huge", "middle", { fill: P.gold }), 500, y, p);
    });
    /* the total: the same eight children */
    var ao = popIn(t, cAll8, 0.4);
    if (ao > 0) out += G(L(80, 372, 560, 372, P.line, 2) + Tx(96, 400, "total", "lab mid muted", "start") +
      Tx(500, 402, "8", "lab big", "middle", { fill: P.good }), { opacity: Math.min(1, ao) });
    /* "look at the counts": the column of numbers, until a row is named */
    out += G(R(462, 112, 76, 252, 14, "none", P.teal, 4),
      { opacity: on(t, cLook, 0.5) * (1 - on(t, cMost, 0.5)) * (0.6 + 0.4 * breathe(t)) });

    /* ---- the eight children, counted off one row at a time ---- */
    for (var j = 0; j < 8; j++) {
      var o = popIn(t, cCount == null ? null : cCount + j * 0.09, 0.35);
      if (!(o > 0)) continue;
      var done = diPast(t, wayCue[DI_KIDS[j].ans]);
      out += G(Em(636 + j * 62, 80, 46, DI_KIDS[j].pic), { opacity: Math.min(1, o) * (done ? 0.35 : 1) });
      out += MK.ripple(636 + j * 62, 80, t, wayCue[DI_KIDS[j].ans], P.gold);
    }

    /* ---- what the counts mean ---- */
    out += MK.pill(854, 180, "Most children walk to school", popIn(t, cMost, 0.45), { size: 26, col: P.good, ink: P.good });
    out += MK.pill(854, 248, "Only one child cycles", popIn(t, cOne, 0.45), { size: 26, col: P.good, ink: P.good });
    var mo2 = popIn(t, cMeans, 0.45);
    if (mo2 > 0) out += MK.glow(760, 316, 118, P.good, on(t, cActOn, 0.6)) +
      G(Em(700, 320, 62, "\u{1F4A1}") + Tx(742, 330, "information", "lab big", "start", { fill: P.good }),
        { transform: around(760, 320, Math.min(1.06, mo2)), opacity: Math.min(1, mo2) });
    /* information is what you act on */
    var co = popIn(t, cCross, 0.42), ro2 = popIn(t, cRack, 0.42);
    if (co > 0) out += G(Em(700, 400, 44, "\u{1F6B8}") + Tx(730, 408, "safe crossing", "lab mid", "start"), { opacity: Math.min(1, co) });
    if (ro2 > 0) out += G(Em(900, 400, 44, "\u{1F6B2}") + Tx(930, 408, "one bike rack", "lab mid", "start"), { opacity: Math.min(1, ro2) });
    return svg(out);
  }

  /* ==== chapter: raw data says nothing ===========================================
     Beats 0 and 1: five bare numbers, no labels and no axis. From beat 2 the
     same five numbers against a scale, with what they are and when they were
     taken - the only thing that changed is the meaning. */

  var DI_BASE = 400, DI_TOP = 170, DI_MAX = 30;           /* the chart's own scale */
  function diBarY(v) { return DI_BASE - (v / DI_MAX) * (DI_BASE - DI_TOP); }
  function diTempX(k) { return 184 + k * 200; }

  function diRawBare(scene, t) {
    var cFive = sc(scene, 0, "five"), cNo = sc(scene, 0, "nomeaning");
    var cRaw = sc(scene, 1, "rawdata"), cColl = sc(scene, 1, "collected");
    var out = "";
    out += MK.pill(584, 62, "raw data", on(t, cRaw, 0.45), { size: 26, col: P.blue, ink: P.blue });
    for (var k = 0; k < DI_TEMPS.length; k++) {
      out += diTile(diTempX(k), 200, 160, 110, String(DI_TEMPS[k]),
        popIn(t, cFive == null ? null : cFive + k * 0.2, 0.36), { size: 48 });
    }
    out += MK.qmark(584, 340, 38, popIn(t, cNo, 0.4) * (1 - into(t, scene.first + 1)));
    out += MK.pill(584, 342, "facts as they were collected", on(t, cColl, 0.5), { size: 24, col: P.blue, ink: P.blue });
    return out;
  }

  function diRawChart(scene, t) {
    var cTemps = sc(scene, 2, "temps"), cNine = sc(scene, 2, "nine"), cDays = sc(scene, 2, "days");
    var cLast = sc(scene, 3, "last"), cHeat = sc(scene, 3, "heating"), cMean = sc(scene, 3, "mean");
    var cInfo = sc(scene, 4, "info"), cGiven = sc(scene, 4, "given");
    var out = "", chart = "", dim = 1 - 0.78 * on(t, cInfo, 0.5);

    /* the scale arrives with the words that say what the numbers are */
    var so = on(t, cTemps, 0.55);
    if (so > 0) {
      for (var v = 0; v <= DI_MAX; v += 10) {
        var y = diBarY(v);
        chart += L(128, y, 1044, y, P.line, v === 0 ? 3 : 2, v === 0 ? { opacity: so } : { opacity: so * 0.7, "stroke-dasharray": "8 10" }) +
          Tx(118, y + 7, String(v), "lab small muted", "end", { opacity: so });
      }
    }
    var grow = on(t, cTemps, 0.9);
    for (var k = 0; k < DI_TEMPS.length; k++) {
      var val = DI_TEMPS[k], cx = diTempX(k), top = diBarY(val), h = (DI_BASE - top) * grow;
      var last = k === DI_TEMPS.length - 1, ring = last ? on(t, cLast, 0.5) : 0;
      chart += R(cx - 55, DI_BASE - h, 110, h, 6, last && ring > 0.2 ? P.accent : P.blue);
      if (ring > 0) chart += R(cx - 61, top - 6, 122, DI_BASE - top + 12, 10, "none", P.gold, 4,
        { opacity: ring * (0.6 + 0.4 * breathe(t)) });
      if (grow > 0.6) chart += Tx(cx, top - 14, String(val), "lab big", "middle",
        { opacity: clamp((grow - 0.6) / 0.4, 0, 1), fill: last && ring > 0.2 ? P.accent : P.ink });
      chart += Tx(cx, 428, "Day " + (k + 1), "lab mid muted", "middle", { opacity: clamp(tally(t, cDays, 5, 0.8) - k, 0, 1) });
    }
    out += G(chart, { opacity: dim });

    /* what the numbers are, and when they were taken */
    out += MK.pill(420, 60, "Classroom temperature", on(t, cTemps, 0.45), { size: 24, col: P.blue, ink: P.blue });
    var nn = popIn(t, cNine, 0.42);
    if (nn > 0) out += G(Em(688, 60, 38, "\u{1F558}") + Tx(714, 70, "9 o'clock", "lab", "start"), { opacity: Math.min(1, nn) });
    /* the day the heating stuck on, and the meaning that gives the numbers */
    out += MK.pill(960, 100, "the heating stuck on", popIn(t, cHeat, 0.45) * dim, { size: 22, col: P.accent, ink: P.accent });
    var mo = popIn(t, cMean, 0.45) * dim;
    if (mo > 0) out += G(Em(300, 128, 58, "\u{1F4A1}") + Tx(340, 138, "information", "lab big", "start", { fill: P.good }),
      { transform: around(340, 128, Math.min(1.06, mo)), opacity: Math.min(1, mo) });

    /* raw data plus a meaning is information */
    out += MK.pill(270, 230, "raw data", popIn(t, cInfo, 0.45), { size: 32, col: P.blue, ink: P.blue });
    out += MK.pill(584, 230, "+ a meaning", popIn(t, cGiven, 0.45), { size: 32, col: P.gold, ink: P.gold });
    out += MK.pill(900, 230, "= information", popIn(t, cGiven == null ? null : cGiven + 0.45, 0.45), { size: 32, col: P.good, ink: P.good });
    return out;
  }

  function diRawChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 2), out = "";
    if (u < 1) out += G(diRawBare(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(diRawChart(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own four words, with its own pictures for them. */
  var DI_RECAP = MK.recapKind([
    { beat: 0, at: "database", title: "Database", sub: "organised data, on paper or on a computer", pic: "\u{1F5C4}️" },
    { beat: 1, at: "form", title: "Form", sub: "the same question for everyone", pic: "\u{1F4DD}" },
    { beat: 2, at: "data", title: "Data", sub: "the raw facts", pic: "\u{1F522}" },
    { beat: 2, at: "information", title: "Information", sub: "what the facts mean", pic: "\u{1F4A1}" }
  ], { goBeat: 2, goAt: "information" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Databases on paper and on a computer", "What a form is good and bad at", "Data is the facts; information is the meaning"] }),
    dbase: diDbaseChapter, form: diFormChapter, data: diDataChapter,
    info: diInfoChapter, raw: diRawChapter, recap: DI_RECAP
  };
