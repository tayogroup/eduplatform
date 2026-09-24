
  /* ==== Telling the Time, part 3 ==============================================
     The chapters "How long did it last?" and "Over the end of the month", the
     recap, and KINDS.

     The empty number line here is drawn by hand rather than with
     ART.numberLine, because its marks are CLOCK TIMES: 10:40, 11:00, 12:00 and
     12:15 do not sit on a scale of numbers with a whole-number step, and the
     library's line labels its ticks with the numbers themselves. The hops are
     the lesson's own working, in its own order - to the next whole hour, then
     the whole hours, then the minutes left. The month, by contrast, is
     ART.calendar twice, marked here so that each date can be lit as it is
     said. */

  /* ---- the counting-on line ---------------------------------------------- */
  var TT_LN = { y: 320, x0: 180, x1: 990, span: 95 };       /* 10:40 to 12:15 */
  function ttLX(mins) { return TT_LN.x0 + (mins / TT_LN.span) * (TT_LN.x1 - TT_LN.x0); }

  /* one hop of the count, grown to u, landing on the line with a head */
  function ttHop(a, b, h, u, col, label) {
    if (!(u > 0)) return "";
    var x1 = ttLX(a), x2 = ttLX(b), ex = lerp(x1, x2, u), hh = h * u, y = TT_LN.y - 14;
    var c1 = x1 + (ex - x1) * 0.25, c2 = ex - (ex - x1) * 0.25;
    var s = Pth("M" + n2(x1) + "," + n2(y) + " C" + n2(c1) + "," + n2(y - hh * 1.3) + " " +
      n2(c2) + "," + n2(y - hh * 1.3) + " " + n2(ex) + "," + n2(y), null, col, 5);
    if (u >= 1) s += Pth("M" + n2(x2) + "," + n2(TT_LN.y - 2) + " L" + n2(x2 - 10) + "," + n2(y - 13) +
      " L" + n2(x2 + 10) + "," + n2(y - 13) + " Z", col, col, 2);
    var lo = clamp((u - 0.45) / 0.4, 0, 1);
    if (lo > 0) s += Tx((x1 + ex) / 2, y - hh - 16, label, "lab big", "middle", { fill: col, opacity: lo });
    return s;
  }
  /* the dot arrives when the moment is pointed at; its time is written only
     when the time is SAID, so no number is on screen before the voice has it */
  function ttStop(mins, label, o, lo) {
    if (!(o > 0)) return "";
    var x = ttLX(mins), w = lo == null ? o : lo;
    return G(C(x, TT_LN.y, 11, P.gold, P.ground, 3) +
      (label && w > 0 ? Tx(x, TT_LN.y + 46, label, "lab big", "middle", { fill: P.ink, opacity: clamp(w, 0, 1) }) : ""),
      { opacity: clamp(o, 0, 1), transform: around(x, TT_LN.y, 0.7 + 0.3 * Math.min(1, o)) });
  }

  var TT_D_A = ttBox(28, 22, 170), TT_D_B = ttBox(970, 22, 170);

  function ttDurationChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var out = "";

    /* beat 0: the question, and the bare line between two moments */
    var ask = ttOnly(t, scene, 0);
    out += MK.pill(584, 150, "How long?", on(t, c(0, "long"), 0.4) * ask, { size: 40, col: P.gold, ink: P.gold });
    var drawn = on(t, c(0, "count"), 0.8);
    if (drawn > 0) out += L(TT_LN.x0 - 26, TT_LN.y, lerp(TT_LN.x0 - 26, TT_LN.x1 + 26, drawn), TT_LN.y, P.ink, 5);

    /* the clocks stand aside for the last beat's warning */
    var clocks = ttUntil(t, scene, 4);
    out += ttFace(TT_D_A, 10 * 60 + 40, popIn(t, c(1, "starts"), 0.45) * clocks);
    out += ttFace(TT_D_B, 12 * 60 + 15, popIn(t, c(1, "ends"), 0.45) * clocks);

    /* the four moments on the line */
    out += ttStop(0, "10:40", Math.max(popIn(t, c(0, "start"), 0.4), on(t, c(1, "starts"), 0.4)), on(t, c(1, "starts"), 0.4));
    out += ttStop(95, "12:15", Math.max(popIn(t, c(0, "end"), 0.4), on(t, c(1, "ends"), 0.4)), on(t, c(1, "ends"), 0.4));
    out += ttStop(20, "11:00", on(t, c(2, "twenty"), 0.5), on(t, c(2, "twenty"), 0.5));
    out += ttStop(80, "12:00", on(t, c(2, "hour"), 0.5), on(t, c(2, "hour"), 0.5));

    /* the hops, in the lesson's own order */
    out += ttHop(0, 20, 70, on(t, c(2, "twenty"), 0.7), P.teal, "+ 20 min");
    out += ttHop(20, 80, 104, on(t, c(2, "hour"), 0.8), P.gold, "+ 1 hour");
    out += ttHop(80, 95, 70, on(t, c(3, "fifteen"), 0.7), P.teal, "+ 15 min");
    out += MK.pill(584, 404, "1 hour 35 minutes", popIn(t, c(3, "total"), 0.45), { size: 34, col: P.good, ink: P.good });

    /* beat 4: not a take-away sum */
    var last = ttFrom(t, scene, 4);
    var nev = on(t, c(4, "never"), 0.45) * last, six = on(t, c(4, "sixty"), 0.45) * last;
    out += MK.pill(360, 120, "12:15 − 10:40", nev, { size: 34, col: P.bad, ink: P.bad });
    out += MK.cross(566, 120, 26, popIn(t, c(4, "never") == null ? null : c(4, "never") + 0.4, 0.4) * last);
    out += MK.pill(820, 120, "1 hour = 60 minutes", six, { size: 34, col: P.good, ink: P.good });
    out += MK.tick(1062, 120, 26, popIn(t, c(4, "sixty") == null ? null : c(4, "sixty") + 0.4, 0.4) * last);
    return svg(out);
  }

  /* ---- the two months ------------------------------------------------------
     ART.calendar is given the weekday each month starts on, because a film has
     no clock to work one out: April starts on a Monday (start 0) and May on a
     Wednesday (start 2), which is a real pair. No year is printed, so the film
     claims none. The cell arithmetic below is the drawing's own: 52 wide, 44
     high, the grid starting at (20, 92) in its 404 x 346 card. */
  var TT_CAL_W = 404, TT_CAL_H = 346;
  function ttCalBox(x, y, w) { return { x: x, y: y, w: w, h: w * TT_CAL_H / TT_CAL_W, k: w / TT_CAL_W }; }
  function ttCell(box, start, date) {
    var cell = start + date - 1;
    return [box.x + (20 + (cell % 7) * 52 + 26) * box.k, box.y + (92 + Math.floor(cell / 7) * 44 + 20) * box.k];
  }
  function ttCalMark(box, start, date, o, col) {
    if (!(o > 0)) return "";
    var p = ttCell(box, start, date);
    return R(p[0] - 24 * box.k, p[1] - 20 * box.k, 48 * box.k, 40 * box.k, 10, "none", col || P.gold, 4,
      { opacity: clamp(o, 0, 1) });
  }
  var TT_APR = ttCalBox(14, 40, 380), TT_MAY = ttCalBox(774, 40, 380);

  function ttMonthChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var out = "", k;

    var apr = popIn(t, c(0, "same"), 0.5);
    if (apr > 0) out += MK.pop(ART.place(ART.calendar({ month: 4 }), TT_APR.x, TT_APR.y, TT_APR.w, TT_APR.h),
      TT_APR.x + TT_APR.w / 2, TT_APR.y + TT_APR.h / 2, apr);
    var may = popIn(t, c(3, "into"), 0.5);
    if (may > 0) out += MK.pop(ART.place(ART.calendar({ month: 5, start: 2 }), TT_MAY.x, TT_MAY.y, TT_MAY.w, TT_MAY.h),
      TT_MAY.x + TT_MAY.w / 2, TT_MAY.y + TT_MAY.h / 2, may);

    /* "It is 28 April" */
    out += ttCalMark(TT_APR, 0, 28, on(t, c(0, "date"), 0.4), TTC.accent);
    /* "April has 30 days" */
    out += ttCalMark(TT_APR, 0, 30, on(t, c(1, "thirty"), 0.4) * ttOnly(t, scene, 1), TTC.teal);
    /* "There is no 37 April": there is no cell for it */
    var none = on(t, c(1, "none"), 0.45) * ttOnly(t, scene, 1);
    if (none > 0) {
      var p37 = [TT_APR.x + 238 * TT_APR.k, TT_APR.y + 312 * TT_APR.k];
      out += ttPlate(p37[0], p37[1], "37 April", none, 22, TTC.bad);
      out += L(p37[0] - 62, p37[1], p37[0] + 62, p37[1], TTC.bad, 6, { opacity: none });
    }
    /* "Two days take you to the 30th" */
    var two = tally(t, c(2, "two"), 2, 0.7) * (on(t, c(2, "two"), 0.3) > 0 ? 1 : 0);
    for (k = 0; k < two; k++) out += ttCalMark(TT_APR, 0, 29 + k, 1, TTC.gold);
    /* the tick sits on the cell's top-right corner, not over the date: a mark
       centred on the 30 hid the number it was agreeing with */
    var last30 = ttCell(TT_APR, 0, 30);
    out += MK.tick(last30[0] + 26 * TT_APR.k, last30[1] - 19 * TT_APR.k, 14, popIn(t, c(2, "last"), 0.4));
    /* "so they go into May" */
    var seven = tally(t, c(3, "into"), 7, 1.0) * (on(t, c(3, "into"), 0.3) > 0 ? 1 : 0);
    for (k = 1; k <= seven; k++) out += ttCalMark(TT_MAY, 2, k, 1, TTC.gold);
    var may7 = ttCell(TT_MAY, 2, 7);
    out += MK.tick(may7[0] + 26 * TT_MAY.k, may7[1] - 19 * TT_MAY.k, 14, popIn(t, c(3, "answer"), 0.4));

    /* the working, down the middle */
    out += MK.list(410, 126, [
      { text: "28 April + 9 days", at: c(0, "add") },
      { text: "April has 30 days", at: c(1, "thirty") },
      { text: "2 days to the 30th", at: c(2, "two") },
      { text: "7 days into May", at: c(3, "seven") }
    ], t, { lh: 58 });
    out += MK.pill(584, 384, "7 May", popIn(t, c(3, "answer"), 0.45), { size: 40, col: P.good, ink: P.good });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------- */
  var TT_RECAP = MK.recapKind([
    { beat: 0, at: "sixties", title: "Units of time", sub: "60, 60 and 24", pic: "⌛" },
    { beat: 1, at: "hand", title: "The clock face", sub: "short hand first",
      pic: function (cx, cy, size) { return ART.place(ART.clock(4, 40), cx - size / 2, cy - size / 2, size, size); } },
    { beat: 2, at: "add", title: "24-hour time", sub: "add 12 after midday", pic: "\u{1F552}" },
    { beat: 2, at: "table", title: "Timetables", sub: "down, then across", pic: "\u{1F68C}" },
    { beat: 3, at: "count", title: "How long it lasts", sub: "count on in hops",
      pic: function (cx, cy, size) {
        var x1 = cx - size * 0.52, x2 = cx + size * 0.52, y = cy + size * 0.3;
        return L(x1 - 6, y, x2 + 6, y, P.ink, 4) +
          Pth("M" + n2(x1) + "," + n2(y - 6) + " C" + n2(x1 + size * 0.3) + "," + n2(y - size * 0.9) + " " +
            n2(x2 - size * 0.3) + "," + n2(y - size * 0.9) + " " + n2(x2) + "," + n2(y - 6), null, P.gold, 4) +
          C(x1, y, 7, P.gold) + C(x2, y, 7, P.gold);
      } },
    { beat: 3, at: "days", title: "Over a month end", sub: "use up this month", pic: "\u{1F4C5}" }
  ], { goBeat: 3, goAt: "days" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The short hand, the long hand and the fives",
      "12-hour time, 24-hour time and a timetable",
      "How long something lasts, counted on in hops"] }),
    units: ttUnitsChapter,
    face: ttFaceChapter,
    twentyfour: ttTfChapter,
    timetable: ttTimetableChapter,
    duration: ttDurationChapter,
    month: ttMonthChapter,
    recap: TT_RECAP
  };
