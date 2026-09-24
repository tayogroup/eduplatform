  /* ==== Half Past, Quarter To: writing it, timing it, dating it ===============
     tools/lib/film-scenes/math-g2/half-past-quarter-to-3.js - "Clock face and
     digital", "Seconds to years", "Days, months, calendar", and the recap.
     The digital chapter is the one that has to be exact: ART.clock's own
     digital panel is filled from the same h and m that drew the hands, so
     4:45 is shown by a face whose short hand is three quarters of the way
     from the 4 to the 5, which is what the last line says out loud. */

  /* ==== chapter: clock face and digital =========================================
     One face with the lesson's digital panel beside it, at half past two, then
     quarter past seven, then quarter to five. */
  var HP_D = hpBox(300, 40, 360, 466);
  /* the panel, and the two halves of the number in it, in film coordinates */
  var HP_PANEL = { x: HP_D.x + 302 * HP_D.s, y: HP_D.y + 102 * HP_D.s, w: 150 * HP_D.s, h: 84 * HP_D.s };
  var HP_DIG = { hour: HP_D.x + 345 * HP_D.s, colon: HP_D.x + 364 * HP_D.s, min: HP_D.x + 396 * HP_D.s, y: HP_D.y + 144 * HP_D.s };

  function hpDigitalChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDigital = c(0, "digital"), cNumbers = c(0, "numbers"), cHour = c(0, "hour"), cMinutes = c(0, "minutes");
    var cHalfPast = c(1, "halfpast"), cW1 = c(1, "written"), cDot = c(1, "colon");
    var cQPast = c(2, "quarterpast"), cW2 = c(2, "written");
    var cQTo = c(3, "quarterto"), cW3 = c(3, "written"), cStill = c(3, "still");
    var B = HP_D, out = "";

    /* half past two, then quarter past seven, then quarter to five */
    /* the face changes as the time is NAMED, not when it is spelled out in
       numbers, so a pill never says quarter past seven over a half past two
       face */
    var stages = [{ at: null, v: 150 }, { at: cQPast, v: 435 }, { at: cQTo, v: 285 }];
    var now = 0, k;
    for (k = 1; k < stages.length; k++) if (stages[k].at != null && t >= stages[k].at) now = k;
    var u = now === 0 ? 1 : ease(clamp((t - stages[now].at) / 0.5, 0, 1));
    if (u < 1) out += G(ART.place(hpClock(stages[now - 1].v, { digital: true }), B.x, B.y, B.w, B.h), { opacity: 1 - u });
    out += G(ART.place(hpClock(stages[now].v, { digital: true }), B.x, B.y, B.w, B.h), { opacity: u });
    var v = stages[now].v;

    /* the panel itself, named first */
    var panel = Math.max(bump(t, cDigital, 1.4), on(t, cNumbers, 0.5) * 0.9);
    out += R(HP_PANEL.x - 7, HP_PANEL.y - 7, HP_PANEL.w + 14, HP_PANEL.h + 14, 18, null, P.plum, 4, { opacity: clamp(panel, 0, 1) });

    /* the hour half and the minute half of the number, each with a line to the
       hand it came from */
    var oh = on(t, cHour, 0.5) * hpFrom(t, scene, 0);
    if (oh > 0) {
      out += L(HP_DIG.hour - 18, HP_PANEL.y + HP_PANEL.h + 8, HP_DIG.hour + 18, HP_PANEL.y + HP_PANEL.h + 8, P.gold, 6, { opacity: oh });
      out += MK.leader(HP_DIG.hour, HP_PANEL.y - 14, hpHandPt(B, v, "hour")[0], hpHandPt(B, v, "hour")[1], on(t, cHour, 0.7) * (1 - hpFrom(t, scene, 1)), P.gold);
    }
    var om = on(t, cMinutes, 0.5) * hpFrom(t, scene, 0);
    if (om > 0) {
      out += L(HP_DIG.min - 32, HP_PANEL.y + HP_PANEL.h + 8, HP_DIG.min + 32, HP_PANEL.y + HP_PANEL.h + 8, P.teal, 6, { opacity: om });
      out += MK.leader(HP_DIG.min, HP_PANEL.y - 14, hpHandPt(B, v, "min")[0], hpHandPt(B, v, "min")[1], on(t, cMinutes, 0.7) * (1 - hpFrom(t, scene, 1)), P.teal);
    }
    /* the colon that splits them - a single ring round the whole mark, which is
       what ART.clock's digital panel actually draws: one colon, two dots */
    out += C(HP_DIG.colon, HP_DIG.y, 26, "none", P.gold, 4, { opacity: clamp(bump(t, cDot, 1.6), 0, 1) });

    /* the three times in words, each staying once it is said */
    out += MK.pill(150, 118, "half past 2", popIn(t, cHalfPast, 0.45) * hpFrom(t, scene, 1), { size: 28, col: P.gold });
    out += MK.pill(150, 230, "quarter past 7", popIn(t, cQPast, 0.45) * hpFrom(t, scene, 2), { size: 28, col: P.gold });
    out += MK.pill(150, 342, "quarter to 5", popIn(t, cQTo, 0.45) * hpFrom(t, scene, 3), { size: 28, col: P.gold });
    /* the panel flashes as each is read out in numbers */
    out += R(HP_PANEL.x - 7, HP_PANEL.y - 7, HP_PANEL.w + 14, HP_PANEL.h + 14, 18, null, P.gold, 5,
      { opacity: clamp(Math.max(bump(t, cW1, 1.5), bump(t, cW2, 1.5), bump(t, cW3, 1.5)), 0, 1) });

    /* the hour is still four: the 4 in the panel, and the short hand that is
       not at the 5 yet */
    var still = on(t, cStill, 0.5) * hpFrom(t, scene, 3);
    if (still > 0) {
      out += C(HP_DIG.hour, HP_DIG.y, 32, "none", P.accent, 5, { opacity: still });
      out += hpLitHand(B, v, "hour", P.accent, still);
      out += hpArc(B, HP_HOUR / HP_R + 0.16, 20, 25, P.muted, 5, still, "8 7");
      out += hpRingNum(B, 4, P.accent, still);
      out += MK.pill(998, 372, "the hour is 4", Math.min(1, popIn(t, cStill, 0.45)), { size: 28, col: P.accent });
    }
    return svg(out);
  }

  /* ==== chapter: seconds to years ===============================================
     The lesson's own unit cards (60 seconds make 1 minute, and so on), stepped
     up in height from the shortest unit to the longest, each lighting as it is
     said. */
  /* twelve months, drawn, because a second calendar emoji beside the week's
     would be the same picture twice */
  function hpTwelve(cx, cy, size) {
    var w = size * 0.34, g = size * 0.12, out = "", r, c;
    var x0 = cx - (4 * w + 3 * g) / 2, y0 = cy - (3 * w + 2 * g) / 2;
    for (r = 0; r < 3; r++) for (c = 0; c < 4; c++)
      out += R(x0 + c * (w + g), y0 + r * (w + g), w, w, w * 0.26, P.teal, "#0B1D2C", 1.5);
    return out;
  }
  var HP_UNITS = [
    { big: "60 seconds", sub: "make 1 minute", pic: "⏱️" },
    { big: "60 minutes", sub: "make 1 hour", pic: "\u{1F550}" },
    { big: "24 hours", sub: "make 1 day", pic: "\u{1F31E}" },
    { big: "7 days", sub: "make 1 week", pic: "\u{1F4C6}" },
    { big: "12 months", sub: "make 1 year", pic: hpTwelve }
  ];
  var HP_UW = 216.8, HP_UGAP = 14, HP_UX = 14, HP_UBASE = 404;

  function hpUnitCard(k, lit, t) {
    var u = HP_UNITS[k], x = HP_UX + k * (HP_UW + HP_UGAP), h = 150 + k * 42, y = HP_UBASE - h;
    var on1 = Math.min(1, lit), cx = x + HP_UW / 2;
    var out = R(x, y, HP_UW, h, 20, on1 > 0.05 ? "#1B3A52" : P.card, on1 > 0.05 ? P.teal : P.line, on1 > 0.05 ? 3 : 2);
    out += Tx(cx, y + 58, u.big, "lab big", "middle", { fill: on1 > 0.05 ? P.ink : P.muted });
    out += Tx(cx, y + 96, u.sub, "lab mid muted readable", "middle");
    if (h >= 190) out += G(typeof u.pic === "function" ? u.pic(cx, y + h - 54, 52) : MK.pic(cx, y + h - 54, 52, u.pic),
      { opacity: 0.35 + 0.65 * on1 });
    return G(out, { opacity: 0.46 + 0.54 * on1, transform: around(cx, y + h / 2, 0.97 + 0.03 * on1) });
  }

  function hpUnitsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cUnits = c(0, "units"), cShort = c(0, "short"), cLong = c(0, "long");
    var cSec = c(1, "sec"), cMin = c(1, "min"), cHour = c(1, "hour");
    var cDay = c(2, "day"), cWeek = c(2, "week");
    var cYear = c(3, "year"), cBlink = c(3, "blink");
    var lits = [popIn(t, cSec, 0.4), popIn(t, cMin, 0.4), popIn(t, cDay, 0.4), popIn(t, cWeek, 0.4), popIn(t, cYear, 0.4)];
    /* the cards are there from the chapter's first frame, so it never opens on
       an empty stage; "its own units" runs a gold flash along the row */
    var born = into(t, scene.first), flash = bump(t, cUnits, 1.4), out = "", k;
    for (k = 0; k < 5; k++) {
      out += G(hpUnitCard(k, lits[k], t), { opacity: clamp(born * 4 - k * 0.35, 0, 1) });
      var fx = HP_UX + k * (HP_UW + HP_UGAP), fh = 150 + k * 42;
      if (flash > 0) out += R(fx, HP_UBASE - fh, HP_UW, fh, 20, null, P.gold, 3,
        { opacity: clamp(flash * 1.6 - k * 0.22, 0, 1) });
    }

    /* shortest on the left, longest on the right */
    out += MK.pill(123, 60, "shortest", popIn(t, cShort, 0.4) * hpOnly(t, scene, 0), { size: 26, col: P.muted });
    out += MK.arrow(214, 60, 930, 60, on(t, cShort, 0.9) * hpOnly(t, scene, 0), P.teal, 6);
    out += MK.pill(1012, 60, "longest", popIn(t, cLong, 0.4) * hpOnly(t, scene, 0), { size: 26, col: P.teal });

    /* one hour is one whole turn of the long hand, which the film has shown */
    var hr = popIn(t, cHour, 0.4) * hpOnly(t, scene, 1);
    if (hr > 0) out += MK.tick(HP_UX + 1.5 * HP_UW + HP_UGAP, 180, 22, hr);

    /* a blink, beside the shortest unit of all */
    var bl = popIn(t, cBlink, 0.45) * hpFrom(t, scene, 3);
    if (bl > 0) {
      out += MK.pop(MK.pic(104, 176, 58, "\u{1F440}"), 104, 176, Math.min(1, bl));
      out += MK.pill(248, 176, "1 second", Math.min(1, bl), { size: 26, col: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: days, months, calendar =========================================
     One month, laid out the way the lesson lays it out: rows of seven, Monday
     first. June starts on a Monday here, which is what makes the 12th a
     Friday - the film is told the weekday the month starts on rather than
     working one out, exactly as ART.calendar requires. */
  var HP_CAL = { x: 56, y: 30, k: 380 / 346 };
  function hpCx(vx) { return HP_CAL.x + vx * HP_CAL.k; }
  function hpCy(vy) { return HP_CAL.y + vy * HP_CAL.k; }
  var HP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var HP_CHIP = { x: 546, w: 78, gap: 8, y: 190, h: 58 };

  function hpCalendarChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCalendar = c(0, "calendar"), cRows = c(0, "rows");
    var cRow = c(1, "row"), cMonday = c(1, "monday");
    var cTwelfth = c(2, "twelfth"), cFriday = c(2, "friday"), cColumn = c(2, "column");
    var out = "", k;

    out += ART.place(ART.calendar({ month: 6, days: 30, start: 0, mark: 12 }),
      HP_CAL.x, HP_CAL.y, 404 * HP_CAL.k, 346 * HP_CAL.k);
    /* the card itself is what "a calendar" names, so the card is what lights */
    out += R(HP_CAL.x - 8, HP_CAL.y - 8, 404 * HP_CAL.k + 16, 346 * HP_CAL.k + 16, 26, null, P.good, 4,
      { opacity: clamp(Math.max(bump(t, cCalendar, 1.6), 0.45 * hpOnly(t, scene, 0)), 0, 1) });

    /* seven across: the header row lights, and the week's chips arrive one at a
       time on the right */
    var rowsOn = on(t, cRows, 0.5);
    if (rowsOn > 0) out += R(hpCx(18), hpCy(60), hpCx(386) - hpCx(18), hpCy(88) - hpCy(60), 8, null, P.gold, 3, { opacity: rowsOn });
    var arrived = tally(t, cRows, 7, 0.9);
    for (k = 0; k < 7; k++) {
      var cx = HP_CHIP.x + k * (HP_CHIP.w + HP_CHIP.gap), o = k < arrived ? 1 : 0;
      if (!o) continue;
      var lit = k === 0 || k === 6 ? on(t, cMonday, 0.5) : 0;
      out += G(R(cx, HP_CHIP.y, HP_CHIP.w, HP_CHIP.h, 14, lit > 0.4 ? "#1B3A52" : P.card, lit > 0.4 ? P.teal : P.line, lit > 0.4 ? 3 : 2) +
        Tx(cx + HP_CHIP.w / 2, HP_CHIP.y + HP_CHIP.h / 2 + 7, HP_DAYS[k], "lab mid readable", "middle", { fill: lit > 0.4 ? P.ink : P.muted }),
        { opacity: 1, transform: around(cx + HP_CHIP.w / 2, HP_CHIP.y + HP_CHIP.h / 2, 0.9 + 0.1 * clamp((t - (cRows || 0)) * 3, 0, 1)) });
    }
    out += MK.pill(944, 108, "7 days", popIn(t, cRows == null ? null : cRows + 0.5, 0.45), { size: 30, col: P.gold });

    /* each row is one week: the five rows of June light in turn */
    var rows = tally(t, cRow, 5, 1.5);
    for (k = 0; k < rows; k++)
      out += R(hpCx(18), hpCy(90 + k * 44), hpCx(386) - hpCx(18), 44 * HP_CAL.k, 8, P.gold, null, null, { opacity: 0.16 });
    out += MK.pill(843, 300, "one week", popIn(t, cRow, 0.45) * hpFrom(t, scene, 1), { size: 32, col: P.teal });
    out += MK.arrow(586, 288, 1100, 288, on(t, cMonday, 0.8) * hpFrom(t, scene, 1), P.teal, 5);

    /* the 12th of June, and the column it sits under */
    var twelfth = on(t, cTwelfth, 0.5) * hpFrom(t, scene, 2);
    if (twelfth > 0) out += C(hpCx(254), hpCy(156), 28 * HP_CAL.k, "none", P.accent, 4, { opacity: twelfth });
    var col = on(t, cColumn, 0.7) * hpFrom(t, scene, 2);
    if (col > 0) out += L(hpCx(254), hpCy(136), hpCx(254), lerp(hpCy(136), hpCy(88), col), P.accent, 5, { "stroke-dasharray": "9 7", opacity: col });
    var fri = on(t, cFriday, 0.5) * hpFrom(t, scene, 2);
    if (fri > 0) {
      /* the ring goes round the column head and the leader stops on its
         edge, so neither of them covers the word Fri */
      out += C(hpCx(254), hpCy(72), 26 * HP_CAL.k, "none", P.accent, 4, { opacity: fri });
      out += hpTag(t, 660, 104, "Friday", cFriday, [hpCx(254) + 27 * HP_CAL.k, hpCy(58)], P.accent, 30);
      out += MK.tick(790, 104, 22, popIn(t, cFriday == null ? null : cFriday + 0.4, 0.35) * hpFrom(t, scene, 2));
    }
    return svg(out);
  }

  /* ---- what you now know --------------------------------------------------- */
  function hpMiniClock(v) {
    return function (cx, cy, size) { return ART.place(hpClock(v), cx - size / 2, cy - size / 2, size, size); };
  }
  function hpMiniDigital(cx, cy, size) {
    return R(cx - size * 0.82, cy - size * 0.34, size * 1.64, size * 0.68, 12, P.cell, P.line, 2) +
      Tx(cx, cy + size * 0.16, "4:45", "lab big", "middle", { fill: P.gold, "font-size": size * 0.5 });
  }
  var HP_RECAP = MK.recapKind([
    { beat: 0, at: "short", title: "Two hands", sub: "short is the hour", pic: hpMiniClock(180) },
    { beat: 1, at: "quarters", title: "Quarter past, to", sub: "the 3, the 6 and the 9", pic: hpMiniClock(225) },
    { beat: 1, at: "fives", title: "Count in fives", sub: "the 4 means 20 minutes", pic: hpMiniClock(200) },
    { beat: 2, at: "numbers", title: "Digital time", sub: "4:45 is quarter to 5", pic: hpMiniDigital },
    { beat: 2, at: "calendar", title: "The calendar", sub: "rows of seven days", pic: "\u{1F4C5}" },
    { beat: 2, at: "units", title: "Seconds to years", sub: "60, 60, 24, 7 and 12", pic: "⏳" }
  ], { goBeat: 2, goAt: "units" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The short hand and the long hand", "Quarter past, half past and quarter to", "Digital time, units of time and the calendar"] }),
    hands: hpHandsChapter, quarters: hpQuartersChapter, fives: hpFivesChapter,
    digital: hpDigitalChapter, units: hpUnitsChapter, calendar: hpCalendarChapter,
    recap: HP_RECAP
  };
