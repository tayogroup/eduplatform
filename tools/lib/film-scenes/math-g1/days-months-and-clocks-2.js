
  /* ==== Grade 1 Mathematics, Lesson 6: Days, Months and Clocks, part 2 =========
     The chapters "Short times and long times", "The two hands" and "O'clock and
     half past", the recap cards, and KINDS. Part 1 holds the palette, the clock
     helpers and the first two chapters.

     The clocks here are ART.clock, which works the hour hand out from h AND m,
     so the sweep in the o'clock chapter is real: as the long hand travels from
     twelve round to six, the short hand creeps from the 3 to halfway between
     the 3 and the 4, which is exactly what the lesson's step 10 asks a child to
     read. Nothing in this film draws a hand by hand. */

  /* ==== chapter: short times and long times ===================================
     The lesson's own five units of time, in its own order and with its own
     pictures (step 6 asks the child to tap them shortest to longest: a second,
     a minute, an hour, a day, a week). The cards are all one size on purpose -
     a second and a week cannot be drawn to scale - and the arrow underneath is
     what says which way is longer. */
  var DM_UNITS = [
    { e: "\u{1F44F}", w: "a second", sub: null },
    { e: "\u{1F6B0}", w: "a minute", sub: "60 seconds" },
    { e: "\u{1F4DA}", w: "an hour", sub: "60 minutes" },
    { e: "\u{1F31E}", w: "a day", sub: "sleep to sleep" },
    { e: "\u{1F5D3}️", w: "a week", sub: "7 days" }
  ];
  var DM_CARD = { w: 210, gap: 12, x0: 35, top: 90, h: 220 };
  function dmCardX(k) { return DM_CARD.x0 + k * (DM_CARD.w + DM_CARD.gap); }
  function dmCardMid(k) { return dmCardX(k) + DM_CARD.w / 2; }

  function dmHowLongChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cShort = c(0, "short"), cLong = c(0, "long");
    var pop = [c(1, "clap"), c(2, "minute"), c(3, "lesson"), c(4, "day"), c(5, "week")];
    var ring = [c(1, "shortest"), c(2, "longer"), c(3, "hour"), c(4, "much"), c(5, "longest")];
    var subAt = [null, c(2, "minute"), c(3, "mins"), c(4, "sleep"), c(5, "seven")];
    var cSecond = c(1, "second"), cSixty = c(2, "sixty"), cSeven = c(5, "seven");
    var out = "", k;

    /* the arrow that says which way is longer */
    out += MK.arrow(60, 352, 1108, 352, on(t, cShort, 1.2), P.gold, 7);
    out += MK.pill(120, 402, "shorter", on(t, cShort, 0.5), { size: 24, col: P.gold, ink: P.gold });
    out += MK.pill(1048, 402, "longer", on(t, cLong, 0.5), { size: 24, col: P.gold, ink: P.gold });

    /* "Sixty seconds": sixty dots, counted out over the second card */
    var dots = dmOnly(t, scene, 2) * (cSixty == null ? 0 : 1);
    var nDots = dots > 0 ? tally(t, cSixty, 60, 1.0) : 0;
    /* "seven days": seven dots, on the week card */
    var nWeek = tally(t, cSeven, 7, 0.7);

    /* the five places, waiting: the first beat of the chapter says there are
       short times and long times before it has named one of them */
    var slotU = on(t, cShort, 0.6);
    for (k = 0; k < 5; k++)
      if (!(popIn(t, pop[k], 0.42) > 0))
        out += R(dmCardX(k), DM_CARD.top, DM_CARD.w, DM_CARD.h, 22, P.card, P.line, 2, { opacity: n2(0.45 * slotU) });

    for (k = 0; k < 5; k++) {
      var p = popIn(t, pop[k], 0.42);
      if (!(p > 0)) continue;
      var x = dmCardX(k), cx = dmCardMid(k), hide = 0;
      if (k === 0) hide = dots * clamp(nDots / 6, 0, 1);
      if (k === 4) hide = clamp(nWeek / 2, 0, 1);
      var inner = R(x, DM_CARD.top, DM_CARD.w, DM_CARD.h, 22, P.card, P.line, 2) +
        Em(cx, 150, 74, DM_UNITS[k].e, { opacity: n2(1 - hide) }) +
        Tx(cx, 232, DM_UNITS[k].w, "lab big", "middle",
          { fill: k === 0 && bump(t, cSecond, 1.4) > 0.02 ? P.gold : P.ink });
      if (DM_UNITS[k].sub && subAt[k] != null)
        inner += Tx(cx, 270, DM_UNITS[k].sub, "lab mid muted", "middle", { opacity: on(t, subAt[k], 0.4) });
      out += MK.pop(inner, cx, DM_CARD.top + DM_CARD.h / 2, p);
      var b = bump(t, ring[k], 1.6);
      if (b > 0) out += R(x - 6, DM_CARD.top - 6, DM_CARD.w + 12, DM_CARD.h + 12, 26, "none", P.gold, 4, { opacity: b });
    }

    /* the sixty seconds themselves: ten across, six down, on the second card */
    for (k = 0; k < nDots; k++)
      out += C(dmCardMid(0) - 81 + (k % 10) * 18, 105 + Math.floor(k / 10) * 18, 5, P.gold,
        null, null, { opacity: dots });
    /* the seven days of the week card */
    for (k = 0; k < nWeek; k++)
      out += C(dmCardMid(4) - 78 + k * 26, 150, 7, P.gold);
    return svg(out);
  }

  /* ==== chapter: the two hands ================================================
     One ART.clock at three o'clock, and the lesson's own two claims beside it:
     the short hand is the hour hand (its step 7 and its "spot the mistake"
     step both say so), and the long hand is the bigger one and still never
     tells the hour. */
  var DM_FACE = { x: 150, y: 30, s: 330 };
  var DM_BLK = { x: 660, w: 470, h: 104, up: 36, down: 172 };
  function dmBlock(y, title, sub, frame, text, hot) {
    var out = "";
    if (!(frame > 0)) return "";
    out += R(DM_BLK.x, y, DM_BLK.w, DM_BLK.h, 20, P.card, hot > 0 ? P.gold : P.line, hot > 0 ? 3.5 : 2,
      { opacity: clamp(frame, 0, 1) });
    if (text > 0) {
      out += Tx(DM_BLK.x + 30, y + 46, title, "lab big", "start", { opacity: Math.min(1, text), fill: hot > 0 ? P.gold : P.ink });
      out += Tx(DM_BLK.x + 30, y + 82, sub, "lab mid muted", "start", { opacity: Math.min(1, text) });
    }
    return out;
  }

  function dmHandsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cClock = c(0, "clock"), cTwo = c(0, "two"), cJobs = c(0, "jobs");
    var cShort = c(1, "short"), cHourHand = c(1, "hourhand"), cHour = c(1, "hour");
    var cLong = c(2, "long"), cFar = c(2, "far");
    var cLook = c(3, "look"), cEvery = c(3, "every");
    var cBigger = c(4, "bigger"), cNever = c(4, "never");
    var F = DM_FACE, out = "";
    var mid = dmMid(F.x, F.y, F.s), hTip = dmTip(3, 0, F.x, F.y, F.s, "hour"), mTip = dmTip(3, 0, F.x, F.y, F.s, "minute");
    var k = F.s / 288;

    out += MK.pop(dmClock(3, 0, F.x, F.y, F.s, 1), mid[0], mid[1], popIn(t, cClock, 0.5));

    /* "how far through the hour you are": the long hand's whole journey */
    out += dmArc(mid[0], mid[1], 150, -90, 240, on(t, cFar, 1.3) * dmOnly(t, scene, 2), P.teal, 4);

    /* "two hands": both flash; then each is lit as it is named */
    var flash = bump(t, cTwo, 1.5);
    var hourLit = Math.max(flash, on(t, cHourHand, 0.4), on(t, cLook, 0.4) * (0.6 + 0.4 * breathe(t)));
    out += dmHandLit(3, 0, F.x, F.y, F.s, "hour", hourLit, P.gold);
    out += dmHandLit(3, 0, F.x, F.y, F.s, "minute", Math.max(flash, on(t, cLong, 0.4), on(t, cBigger, 0.4)), P.teal);

    /* "The long hand is bigger": how far each one reaches */
    var bg = on(t, cBigger, 0.6) * dmOnly(t, scene, 4);
    if (bg > 0) {
      out += C(mid[0], mid[1], 90 * k, "none", P.teal, 3, { opacity: bg * 0.9, "stroke-dasharray": "9 9" });
      out += C(mid[0], mid[1], 58 * k, "none", P.gold, 3, { opacity: bg * 0.9, "stroke-dasharray": "9 9" });
    }

    /* the two jobs, one block each */
    var frame = on(t, cJobs, 0.5);
    out += dmBlock(DM_BLK.up, "The long hand", "how far through the hour", frame, on(t, cLong, 0.4), 0);
    out += dmBlock(DM_BLK.down, "The short hand", "tells you the hour", frame, on(t, cShort, 0.4), on(t, cLook, 0.5));
    out += MK.leader(hTip[0], hTip[1], DM_BLK.x - 12, DM_BLK.down + DM_BLK.h / 2, on(t, cShort, 0.6), P.gold);
    out += MK.leader(mTip[0], mTip[1], DM_BLK.x - 12, DM_BLK.up + DM_BLK.h / 2, on(t, cLong, 0.6), P.teal);
    out += MK.tick(1092, DM_BLK.down + 76, 16, popIn(t, cHour, 0.4));

    /* "it never tells the hour": the long hand's line to the hour block, crossed */
    var nv = on(t, cNever, 0.55) * dmOnly(t, scene, 4);
    if (nv > 0) {
      out += G(L(mTip[0], mTip[1], lerp(mTip[0], DM_BLK.x - 12, nv), lerp(mTip[1], DM_BLK.down + DM_BLK.h / 2, nv),
        P.bad, 4, { "stroke-dasharray": "10 8" }), { opacity: nv });
      out += MK.cross((mTip[0] + DM_BLK.x - 12) / 2, (mTip[1] + DM_BLK.down + DM_BLK.h / 2) / 2, 24,
        popIn(t, cNever == null ? null : cNever + 0.45, 0.4));
    }
    out += MK.pill(895, 340, "every time", popIn(t, cEvery, 0.45), { size: 26, col: P.gold, ink: P.gold });
    return svg(out);
  }

  /* ==== chapter: o'clock and half past ========================================
     One face, and the lesson's own two readings on it. The long hand really
     travels from twelve round to six as "At half past" is said, and because
     ART.clock takes the minutes too, the short hand creeps from the 3 to
     halfway between the 3 and the 4 while it goes. The "3 o'clock" caption is
     taken away the moment the hands stop saying it. */
  var DM_SCHOOL = { x: 690, y: 170, s: 210 };
  function dmOclockChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cOclock = c(0, "oclock"), cUp = c(0, "up");
    var cShort = c(1, "short"), cThree = c(1, "three"), cSay = c(1, "say");
    var cSchool = c(2, "school"), cEight = c(2, "eight");
    var cHalf = c(3, "half"), cDown = c(3, "down");
    var cHand = c(4, "hand"), cBetween = c(4, "between");
    var cBetw = c(5, "betw"), cHp = c(5, "hp");
    var F = DM_FACE, S = DM_SCHOOL, out = "";
    var mid = dmMid(F.x, F.y, F.s);

    /* the sweep: 0 minutes until "At half past", then round to 30 */
    var sweep = cHalf == null ? 0 : ease(clamp((t - cHalf) / 1.3, 0, 1));
    var m = Math.round(30 * sweep);

    /* The face steps back while the school clock is up, so a child reading
       "eight o'clock" is not reading the three o'clock one beside it. */
    var dim = 1 - 0.6 * dmOnly(t, scene, 2), face = "";
    face += MK.pop(dmClock(3, m, F.x, F.y, F.s, 1), mid[0], mid[1], popIn(t, cOclock, 0.5));
    face += C(mid[0], mid[1], 143, "none", P.gold, 4, { opacity: bump(t, cOclock, 1.6) });

    /* the long hand: straight up at o'clock, straight down at half past */
    face += dmHandLit(3, m, F.x, F.y, F.s, "minute", Math.max(on(t, cUp, 0.45) * dmUntil(t, scene, 3), on(t, cDown, 0.45)), P.teal);
    face += dmNumRing(12, F.x, F.y, F.s, 26, on(t, cUp, 0.5) * dmUntil(t, scene, 3), P.teal);
    face += dmNumRing(6, F.x, F.y, F.s, 26, on(t, cDown, 0.5), P.teal);

    /* the short hand: on the 3, then between the 3 and the 4 */
    face += dmHandLit(3, m, F.x, F.y, F.s, "hour", Math.max(on(t, cShort, 0.45) * dmUntil(t, scene, 3), on(t, cHand, 0.45)), P.gold);
    face += dmNumRing(3, F.x, F.y, F.s, 26, on(t, cThree, 0.5) * dmUntil(t, scene, 3), P.gold);
    /* "between two numbers": the two it is between, ringed. An arc between them
       as well only crowded the numerals it was drawn to point at. */
    var bw = Math.max(on(t, cBetween, 0.5), bump(t, cBetw, 1.4));
    face += dmNumRing(3, F.x, F.y, F.s, 19, bw, P.gold);
    face += dmNumRing(4, F.x, F.y, F.s, 19, bw, P.gold);
    face += MK.pill(mid[0], 400, "3 o'clock", popIn(t, cSay, 0.45) * dmUntil(t, scene, 3), { size: 32, col: P.gold, ink: P.gold });
    out += G(face, { opacity: n2(dim) });

    /* the two readings, in words */
    out += dmBlock(DM_BLK.up, "Long hand UP", "means o'clock", on(t, cUp, 0.5), on(t, cUp, 0.6), 0);
    out += dmBlock(DM_BLK.down, "Long hand DOWN", "means half past", on(t, cDown, 0.5), on(t, cDown, 0.6), 0);

    /* "School starts at eight o'clock": a second face, for beat 2 alone */
    var sch = popIn(t, cSchool, 0.45) * dmOnly(t, scene, 2);
    if (sch > 0) {
      var smid = dmMid(S.x, S.y, S.s);
      out += MK.pop(dmClock(8, 0, S.x, S.y, S.s, 1), smid[0], smid[1], sch);
      out += MK.pop(Em(1050, 250, 80, "\u{1F3EB}"), 1050, 250, popIn(t, cSchool, 0.5) * dmOnly(t, scene, 2));
      out += dmHandLit(8, 0, S.x, S.y, S.s, "hour", on(t, cEight, 0.45) * dmOnly(t, scene, 2), P.gold);
      out += dmNumRing(8, S.x, S.y, S.s, 17, on(t, cEight, 0.5) * dmOnly(t, scene, 2), P.gold);
      out += MK.pill(795, 405, "8 o'clock", popIn(t, cEight, 0.45) * dmOnly(t, scene, 2), { size: 28, col: P.gold, ink: P.gold });
    }

    /* the second reading, once the hands say it and the first has gone */
    out += MK.pill(mid[0], 400, "half past 3", popIn(t, cHp, 0.45), { size: 32, col: P.gold, ink: P.gold });
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------- */
  function dmRecapClock(h, m, mark) {
    return function (cx, cy, size) { return dmMiniClock(cx, cy, size * 0.5, h, m, mark); };
  }
  var DM_RECAP = MK.recapKind([
    { beat: 0, at: "days", title: "7 days", sub: "make one week", pic: "\u{1F4C5}" },
    { beat: 0, at: "months", title: "12 months", sub: "make one year", pic: "\u{1F5D3}️" },
    { beat: 1, at: "secs", title: "Short and long", sub: "second, minute, hour, day, week", pic: "⌛" },
    { beat: 2, at: "up", title: "Long hand up", sub: "it is o'clock", pic: dmRecapClock(3, 0, "minute") },
    { beat: 2, at: "down", title: "Long hand down", sub: "it is half past", pic: dmRecapClock(3, 30, "minute") },
    { beat: 3, at: "shorthand", title: "Short hand", sub: "it tells the hour", pic: dmRecapClock(8, 0, "hour") }
  ], { goBeat: 3, goAt: "shorthand" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Seven days in a week, twelve months in a year",
      "Short times and long times",
      "O'clock and half past, on a real clock"
    ] }),
    days: dmDaysChapter, months: dmMonthsChapter, howlong: dmHowLongChapter,
    hands: dmHandsChapter, oclock: dmOclockChapter, recap: DM_RECAP
  };
