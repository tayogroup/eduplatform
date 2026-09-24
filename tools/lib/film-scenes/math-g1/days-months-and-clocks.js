
  /* ==== Grade 1 Mathematics, Lesson 6: Days, Months and Clocks =================
     tools/lib/film-scenes/math-g1/days-months-and-clocks.js, with -2.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     mathematics/grade-1-app/g1v2/lecture-video/days-months-and-clocks.json.

     Mathematics has no lesson kit, so the drawings come from the shared maths
     picture library (ART, tools/lib/ehel-film-art-math.js): ART.clock for every
     clock face and ART.calendar for the month page. Both were written for this
     lesson, and ART.clock computes the hour hand from h AND m, so half past
     three really does put the short hand halfway between 3 and 4 - which is the
     one thing this film has to get right.

     This file: the palette, the shared helpers, the title motif, and the
     chapters "Seven days in a week" and "Twelve months in a year". Every
     top-level name here starts with dm, so nothing can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, days: P.blue, months: P.plum, howlong: P.gold,
    hands: P.accent, oclock: P.teal, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function dmOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function dmFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k arrives, then 0: for a thing that must LEAVE */
  function dmUntil(t, scene, k) { return k >= scene.beats.length ? 1 : 1 - into(t, scene.first + k); }

  /* ---- clocks ----------------------------------------------------------------
     ART.clock draws on a 288 x 288 card: centre (144, 144), face radius 112,
     the numerals on radius 80, the short hand 58 long and the long hand 90. A
     film nests one square with ART.place, so every one of those lengths scales
     by s / 288 and the hands can be pointed at from outside the drawing. No
     label is ever passed, because a caption would make the card 288 x 322 and
     a square box would then squash it - captions here are MK.pill instead. */
  function dmClock(h, m, x, y, s, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.clock(h, m), x, y, s, s), { opacity: clamp(o, 0, 1) });
  }
  function dmMid(x, y, s) { var k = s / 288; return [x + 144 * k, y + 144 * k]; }
  /* the tip of a hand, in the film's space. which: "hour" or "minute" */
  function dmTip(h, m, x, y, s, which) {
    var k = s / 288, c = dmMid(x, y, s);
    var deg = which === "hour" ? (((h % 12) / 12 + m / 720) * 360 - 90) : ((m / 60) * 360 - 90);
    var r = (which === "hour" ? 58 : 90) * k, a = deg * Math.PI / 180;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  }
  /* where a numeral sits, 1 to 12, in the film's space */
  function dmNum(n, x, y, s) {
    var k = s / 288, c = dmMid(x, y, s), a = ((n % 12) * 30 - 90) * Math.PI / 180;
    return [c[0] + 80 * k * Math.cos(a), c[1] + 80 * k * Math.sin(a)];
  }
  /* a gold line laid over one of the hands, so the hand being named lights up */
  function dmHandLit(h, m, x, y, s, which, o, col) {
    if (!(o > 0)) return "";
    var c = dmMid(x, y, s), p = dmTip(h, m, x, y, s, which), k = s / 288;
    /* the long hand's tip dot is small: a big one sits on the numeral the hand
       is pointing at and hides it, which is the one thing a child reads here */
    return G(L(c[0], c[1], p[0], p[1], col || P.gold, (which === "hour" ? 11 : 7) * k) +
      C(p[0], p[1], (which === "hour" ? 7 : 4.5) * k, col || P.gold), { opacity: clamp(o, 0, 1) });
  }
  /* a ring round one numeral */
  function dmNumRing(n, x, y, s, r, o, col) {
    if (!(o > 0)) return "";
    var p = dmNum(n, x, y, s);
    return C(p[0], p[1], r, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }

  /* ---- a small clock drawn here, for the recap cards --------------------------
     ART.clock at 92 px would print numerals 6 px high, which rule 4 forbids, so
     the recap cards get a face with ticks and no numerals instead. mark names
     the hand to light: "hour", "minute", or nothing. */
  function dmMiniClock(cx, cy, r, h, m, mark) {
    var s = C(cx, cy, r, ART.C.card, ART.C.ink, Math.max(2, r * 0.07)), k, a;
    for (k = 0; k < 12; k++) {
      a = (k * 30 - 90) * Math.PI / 180;
      s += L(cx + r * 0.82 * Math.cos(a), cy + r * 0.82 * Math.sin(a),
        cx + r * 0.95 * Math.cos(a), cy + r * 0.95 * Math.sin(a), ART.C.ink, r * (k % 3 === 0 ? 0.08 : 0.05));
    }
    var ha = (((h % 12) / 12 + m / 720) * 360 - 90) * Math.PI / 180, ma = ((m / 60) * 360 - 90) * Math.PI / 180;
    var hc = mark === "hour" ? ART.C.accent : mark === "minute" ? ART.C.muted : ART.C.ink;
    var mc = mark === "minute" ? ART.C.accent : mark === "hour" ? ART.C.muted : ART.C.accent;
    s += L(cx, cy, cx + r * 0.46 * Math.cos(ha), cy + r * 0.46 * Math.sin(ha), hc, r * (mark === "hour" ? 0.17 : 0.13));
    s += L(cx, cy, cx + r * 0.76 * Math.cos(ma), cy + r * 0.76 * Math.sin(ma), mc, r * (mark === "minute" ? 0.13 : 0.09));
    return s + C(cx, cy, r * 0.08, ART.C.ink);
  }

  /* ---- a wedge-headed arrow along a circle ------------------------------------
     Used only by the week ring: the week that comes round again, and the step
     from one day to the next. Angles in degrees, clockwise, 0 to the right. */
  function dmHead(x, y, rad, col, size) {
    var p = function (d, s) { var q = rad + d; return n2(x + s * Math.cos(q)) + "," + n2(y + s * Math.sin(q)); };
    return el("polygon", { points: n2(x) + "," + n2(y) + " " + p(2.65, size * 1.7) + " " + p(-2.65, size * 1.7), fill: col });
  }
  function dmArc(cx, cy, r, a0, a1, u, col, w) {
    if (!(u > 0)) return "";
    col = col || P.gold; w = w || 5;
    var a = a0 + (a1 - a0) * clamp(u, 0, 1);
    if (Math.abs(a - a0) < 0.4) return "";
    var big = Math.abs(a - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 1 : 0;
    var r0 = a0 * Math.PI / 180, r1 = a * Math.PI / 180;
    var x0 = cx + r * Math.cos(r0), y0 = cy + r * Math.sin(r0);
    var x1 = cx + r * Math.cos(r1), y1 = cy + r * Math.sin(r1);
    return Pth("M" + n2(x0) + "," + n2(y0) + " A" + n2(r) + "," + n2(r) + " 0 " + big + "," + sweep +
      " " + n2(x1) + "," + n2(y1), null, col, w) +
      dmHead(x1, y1, r1 + (sweep ? 1 : -1) * Math.PI / 2, col, w * 1.5);
  }

  /* ---- the calendar page of the title motif ----------------------------------- */
  function dmPage(x, y, w, h, lit, badge) {
    var hh = h * 0.27, s = "", k;
    s += R(x, y, w, h, 13, "#F7F4EC") + R(x, y, w, hh, 13, "#E9744F") + R(x, y + hh - 13, w, 13, 0, "#E9744F");
    s += R(x + w * 0.2, y - 11, 11, 22, 5, "#93AABE") + R(x + w * 0.68, y - 11, 11, 22, 5, "#93AABE");
    for (k = 0; k < 7; k++) {
      var cx = x + w * 0.11 + k * (w * 0.78 / 6), on7 = k < lit;
      s += C(cx, y + hh + 24, 7.5, on7 ? "#E9744F" : "#C8CFD2");
      s += C(cx, y + hh + 50, 6, "#D6DBDD");
      s += C(cx, y + hh + 74, 6, "#D6DBDD");
    }
    if (badge > 0) s += MK.pop(C(x + w, y + hh * 0.5, 25, P.gold) +
      Tx(x + w, y + hh * 0.5 + 10, "12", "lab big", "middle", { fill: "#142B3E" }), x + w, y + hh * 0.5, badge);
    return s;
  }

  var DM_MOTIF = { x: 168, y: 126, s: 176 };
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var cWeek = o.scene ? sc(o.scene, 0, "week") : null, cYear = o.scene ? sc(o.scene, 0, "year") : null;
    var cClock = o.scene ? sc(o.scene, 1, "clock") : null, cHands = o.scene ? sc(o.scene, 1, "hands") : null;
    out += C(180, 180, 172, "#123247");
    out += G(dmPage(44, 112, 152, 142, tally(t, cWeek, 7, 0.9), popIn(t, cYear, 0.4)),
      { transform: "rotate(-9 120 183)" });
    out += MK.glow(DM_MOTIF.x + DM_MOTIF.s / 2, DM_MOTIF.y + DM_MOTIF.s / 2, 132, P.gold, on(t, cClock, 0.6) * (0.65 + 0.35 * breathe(t)));
    out += dmClock(3, 0, DM_MOTIF.x, DM_MOTIF.y, DM_MOTIF.s, 1);
    var hu = on(t, cHands, 0.45);
    out += dmHandLit(3, 0, DM_MOTIF.x, DM_MOTIF.y, DM_MOTIF.s, "hour", hu);
    out += dmHandLit(3, 0, DM_MOTIF.x, DM_MOTIF.y, DM_MOTIF.s, "minute", hu, P.teal);
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A calendar page and a clock face">' + out + "</svg>";
  }

  /* ==== chapter: seven days in a week =========================================
     The lesson's own seven day cards (its step 4 asks the child to tap them in
     order, starting with Monday), laid round a ring because the lesson's own
     words for them are "round and round": after Sunday the week starts again. */
  var DM_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var DM_RING = { cx: 584, cy: 225, r: 185, w: 150, h: 52 };
  function dmDayAngle(k) { return -90 + k * 360 / 7; }
  function dmDayAt(k) {
    var a = dmDayAngle(k) * Math.PI / 180;
    return [DM_RING.cx + DM_RING.r * Math.cos(a), DM_RING.cy + DM_RING.r * Math.sin(a)];
  }
  function dmDayCard(k, shown, hot) {
    var p = dmDayAt(k), w = DM_RING.w, h = DM_RING.h, out = "";
    var slot = clamp(shown > 0 ? 1 : 0.55, 0, 1);
    out += R(p[0] - w / 2, p[1] - h / 2, w, h, h / 2,
      hot > 0 ? "#1B3A52" : P.card, hot > 0 ? P.gold : P.line, hot > 0 ? 3.5 : 2, { opacity: slot });
    if (shown > 0) out += Tx(p[0], p[1] + 8, DM_DAYS[k], "lab", "middle",
      { fill: hot > 0 ? P.gold : P.ink, opacity: Math.min(1, shown) });
    return out;
  }

  function dmDaysChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOrder = c(0, "order");
    var cDay = [c(1, "mon"), c(1, "tue"), c(1, "wed"), c(1, "thu"), c(1, "fri"), c(2, "sat"), c(2, "sun")];
    var cSeven = c(2, "seven"), cAgain = c(3, "again"), cMonday = c(3, "monday"), cRound = c(3, "round");
    var cAfter = c(4, "after"), cThu = c(4, "thu"), cBefore = c(4, "before"), cFri = c(4, "fri");
    var out = "", k;

    /* the ring the week runs round, drawn as "the same order" is said */
    var ringU = on(t, cOrder, 0.9);
    out += C(DM_RING.cx, DM_RING.cy, DM_RING.r, "none", P.line, 3,
      { opacity: 0.5 * ringU, "stroke-dasharray": "11 13" });

    /* "round and round": one whole turn of the ring, from Monday */
    out += dmArc(DM_RING.cx, DM_RING.cy, 143, dmDayAngle(0), dmDayAngle(0) + 340,
      on(t, cRound, 1.3) * dmOnly(t, scene, 3), P.gold, 5);
    /* "starts again at Monday": the step from Sunday back round to Monday */
    out += dmArc(DM_RING.cx, DM_RING.cy, 112, dmDayAngle(6), dmDayAngle(7),
      on(t, cAgain, 0.7) * dmOnly(t, scene, 3), P.teal, 6);
    /* the two steps of the last beat, one pair at a time (rule 3) */
    var pairA = on(t, cAfter, 0.4) * (1 - on(t, cBefore, 0.4));
    var pairB = on(t, cBefore, 0.4);
    out += dmArc(DM_RING.cx, DM_RING.cy, 112, dmDayAngle(2), dmDayAngle(3), on(t, cThu, 0.6) * pairA, P.gold, 6);
    out += dmArc(DM_RING.cx, DM_RING.cy, 112, dmDayAngle(4), dmDayAngle(5), on(t, cFri, 0.6) * pairB, P.gold, 6);

    /* the seven cards: a slot from the first beat, a name as it is said */
    var hot = [0, 0, 0, 0, 0, 0, 0];
    hot[0] = popIn(t, cMonday, 0.4) * dmOnly(t, scene, 3);
    hot[2] = pairA * on(t, cAfter, 0.3);
    hot[3] = pairA * on(t, cThu, 0.3);
    hot[4] = pairB * on(t, cFri, 0.3);
    hot[5] = pairB * on(t, cBefore, 0.3);
    for (k = 0; k < 7; k++) out += dmDayCard(k, popIn(t, cDay[k], 0.38) * ringU, hot[k]);

    /* "That is seven days": the count, in the middle of the week */
    var sv = popIn(t, cSeven, 0.45);
    if (sv > 0) out += MK.pop(Tx(DM_RING.cx, DM_RING.cy + 4, "7", "lab huge", "middle", { fill: P.gold }) +
      Tx(DM_RING.cx, DM_RING.cy + 44, "days in a week", "lab mid muted", "middle"),
      DM_RING.cx, DM_RING.cy, sv);
    return svg(out);
  }

  /* ==== chapter: twelve months in a year ======================================
     The lesson's own twelve months (its step 5 shows them in a line with one
     missing), in two columns of six so that the two beats that say them fill a
     column each. The calendar beside them is ART.calendar, and it always shows
     the month being named this instant - so the page turns as the voice goes
     January, February, March. Each month's starting weekday and length are the
     real ones for a year whose 1 January is a Thursday; no year is printed, so
     the film dates nothing. */
  var DM_MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var DM_START = [3, 6, 6, 2, 4, 0, 2, 5, 1, 3, 6, 1];
  var DM_MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var DM_CAL = { x: 660, y: 36, w: 380 };
  function dmMonthAt(k) { return [40 + Math.floor(k / 6) * 194 + 90, 30 + (k % 6) * 65 + 28]; }
  function dmMonthPill(k, slot, shown, hot) {
    if (!(slot > 0)) return "";
    var p = dmMonthAt(k), w = 180, h = 56, out = "";
    out += R(p[0] - w / 2, p[1] - h / 2, w, h, 14,
      hot > 0 ? "#1B3A52" : P.card, hot > 0 ? P.gold : P.line, hot > 0 ? 3.5 : 2,
      { opacity: clamp(shown > 0 ? slot : slot * 0.5, 0, 1) });
    if (shown > 0) out += Tx(p[0] + 8, p[1] + 8, DM_MONTHS[k], "lab", "middle",
      { fill: hot > 0 ? P.gold : P.ink, opacity: Math.min(1, shown) });
    return out;
  }
  /* the month the voice has most recently named, and when it named it */
  function dmMonthNow(t, scene) {
    var says = [], k;
    for (k = 0; k < 6; k++) says.push([sc(scene, 1, ["jan", "feb", "mar", "apr", "may", "jun"][k]), k]);
    for (k = 0; k < 6; k++) says.push([sc(scene, 2, ["jul", "aug", "sep", "oct", "nov", "dec"][k]), k + 6]);
    says.push([sc(scene, 3, "start"), 0]);
    says.push([sc(scene, 3, "end"), 11]);
    /* "the first month" is January too: without this the page stayed on
       December while the January pill went gold, which is two answers at once */
    says.push([sc(scene, 4, "first"), 0]);
    says.push([sc(scene, 4, "cal"), 0]);
    var best = 0, when = null;
    for (k = 0; k < says.length; k++) if (says[k][0] != null && t >= says[k][0]) { best = says[k][1]; when = says[k][0]; }
    return [best, when];
  }

  function dmMonthsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cYear = c(0, "year"), cTwelve = c(0, "twelve"), cOrder = c(0, "order");
    var cHodan = c(4, "hodan"), cFirst = c(4, "first"), cCal = c(4, "cal");
    var out = "", k;

    /* "A year": the frame that holds the whole year */
    var yu = on(t, cYear, 0.6);
    out += R(26, 18, 402, 405, 22, "none", P.line, 3, { opacity: 0.55 * yu, "stroke-dasharray": "12 10" });

    /* "twelve months": the twelve slots arrive, then each name as it is said */
    var slots = tally(t, cTwelve, 12, 0.9);
    var now = dmMonthNow(t, scene), m = now[0], mAt = now[1];
    var named = [];
    for (k = 0; k < 6; k++) named.push(c(1, ["jan", "feb", "mar", "apr", "may", "jun"][k]));
    for (k = 0; k < 6; k++) named.push(c(2, ["jul", "aug", "sep", "oct", "nov", "dec"][k]));

    var firstU = on(t, cFirst, 0.35);
    for (k = 0; k < 12; k++) {
      /* the slots arrive one at a time on "twelve months": before that the year
         frame is empty, which is what the line describes */
      var slot = on(t, cTwelve == null ? null : cTwelve + k * 0.082, 0.3);
      var shown = k < slots ? popIn(t, named[k], 0.34) : 0;
      var hot = (mAt != null && k === m) ? 1 : 0;
      if (k === 0 && firstU > 0) hot = 1;
      out += dmMonthPill(k, slot, shown, hot);
    }
    /* "this order": the months numbered 1 to 12, in order */
    var ord = tally(t, cOrder, 12, 1.1);
    for (k = 0; k < ord; k++) {
      var p = dmMonthAt(k);
      out += Tx(p[0] - 72, p[1] + 6, String(k + 1), "lab small muted", "middle",
        { opacity: on(t, cOrder, 0.3) });
    }

    /* the calendar, always open at the month being named */
    var rows = Math.ceil((DM_START[m] + DM_MDAYS[m]) / 7);
    var scale = DM_CAL.w / 404, ch = (92 + rows * 44 + 34) * scale;
    var cu = on(t, cOrder, 0.5);
    if (cu > 0) {
      out += G(ART.place(ART.calendar({ month: m + 1, days: DM_MDAYS[m], start: DM_START[m] }),
        DM_CAL.x, DM_CAL.y, DM_CAL.w, ch), { opacity: clamp(cu, 0, 1) });
      /* "That month is January": the page it ends on, ringed */
      var ru = on(t, cCal, 0.45);
      if (ru > 0) out += R(DM_CAL.x - 8, DM_CAL.y - 8, DM_CAL.w + 16, ch + 16, 24, "none", P.gold, 4,
        { opacity: ru * (0.7 + 0.3 * breathe(t)) });
      /* a line from the month just named to the page it opened */
      if (mAt != null) {
        var mp = dmMonthAt(m);
        out += MK.leader(mp[0] + 92, mp[1], DM_CAL.x - 14, 250, on(t, mAt, 0.25), P.gold);
      }
    }

    /* "twelve months", said once and kept */
    out += MK.pill(537, 380, "12 months", popIn(t, cTwelve, 0.5), { size: 26, col: P.gold, ink: P.gold });
    /* "Hodan was born in the first month" */
    out += MK.pop(Em(472, 296, 76, "\u{1F467}"), 472, 296, popIn(t, cHodan, 0.45));
    /* "starts at January ... ends at December" and "the first month" are shown
       by the pill going gold and the calendar opening at that month (see
       dmMonthNow): a caption under the column read as a label for June. */
    return svg(out);
  }
