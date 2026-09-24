  /* ==== Grade 3 Mathematics, Lesson 7: Time and Direction, part 2 ==============
     The chapters "How long did it take?" and "Choosing the unit". See
     time-and-direction.js for what this film is and what it must not get
     wrong. Every name here still starts with td. */

  /* ---- a time line, labelled in clock times -----------------------------------
     ART.numberLine labels its ticks with numbers, and 10:40 to 11:15 is not a
     run of numbers: it crosses the hour, which is the whole point of the
     chapter. So the line is drawn here, from a list of the times it shows.
     Reported to the lead as a picture the library lacks. */
  var TDL = { x0: 150, x1: 1030, y: 336 };
  var TD_TIMES = ["10:40", "10:45", "10:50", "10:55", "11:00", "11:05", "11:10", "11:15"];
  function tdLX(k) { return TDL.x0 + k * (TDL.x1 - TDL.x0) / (TD_TIMES.length - 1); }

  function tdLineBase(t, o, litFrom, litTo, lit) {
    if (!(o > 0)) return "";
    var out = L(TDL.x0 - 14, TDL.y, TDL.x1 + 14, TDL.y, P.ink, 4), k;
    if (lit > 0) out += L(tdLX(litFrom), TDL.y, tdLX(litTo), TDL.y, P.gold, 9, { opacity: lit });
    for (k = 0; k < TD_TIMES.length; k++) {
      var big = k === 0 || k === 4 || k === TD_TIMES.length - 1;
      out += L(tdLX(k), TDL.y - (big ? 16 : 9), tdLX(k), TDL.y + (big ? 16 : 9), P.ink, big ? 4 : 2.5);
      out += Tx(tdLX(k), TDL.y + 40, TD_TIMES[k], big ? "lab mid" : "lab mid muted", "middle");
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* one counting-on jump, growing left to right as u goes 0 -> 1 */
  function tdJump(fromK, toK, u, label, labelO, col) {
    if (!(u > 0)) return "";
    var a = tdLX(fromK), b = tdLX(toK), ah = 72, top = TDL.y - 15;
    var c1 = a + (b - a) * 0.25, c2 = b - (b - a) * 0.25;
    var d = "M" + n2(a) + "," + n2(top) + " C" + n2(c1) + "," + n2(top - ah) + " " +
      n2(c2) + "," + n2(top - ah) + " " + n2(b) + "," + n2(top);
    var len = (Math.hypot(b - a, ah) + (b - a)) * 0.9;
    var out = Pth(d, null, col, 5, { "stroke-dasharray": n2(len), "stroke-dashoffset": n2(len * (1 - clamp(u, 0, 1))) });
    if (u > 0.97) out += MK.arrow(b - 18, top - 16, b, top, 1, col, 5);
    if (labelO > 0) out += MK.pill((a + b) / 2, top - ah * 0.82, label, labelO, { size: 24, col: col });
    return out;
  }

  /* ==== chapter: how long did it take? ==========================================
     Beat 0 contrasts a time with an interval. Beats 1 to 4 put the film's two
     times up, refuse the column subtraction, and count on through 11:00.
     The arithmetic is the lesson's own How do you know? bank: 10:40 to 11:00
     is 20 minutes, 11:00 to 11:15 is 15 more, and 20 + 15 = 35.

     Beat 5 finds an interval in the OTHER units the objective (3Gt.04) names:
     days, weeks, months and years. The lesson's own bank for this is
     round14long (kind 0): w = rnd(2, 8) weeks, answer = w * 7 days; 2 weeks
     is inside that range and 2 x 7 = 14, so this is a real instance of the
     lesson's own question, not an invented one. */
  function tdIntervalChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPoint = c(0, "point"), cLasts = c(0, "lasts");
    var cStart = c(1, "start"), cEnd = c(1, "end"), cHow = c(1, "how");
    var cDont = c(2, "dont"), cSixty = c(2, "sixty"), cHundred = c(2, "hundred");
    var cCount = c(3, "count"), cTwenty = c(3, "twenty");
    var cFifteen = c(4, "fifteen"), cTotal = c(4, "total");
    var cTwoWeeks = c(5, "twoweeks"), cSevenDays = c(5, "sevendays"),
      cSevenMore = c(5, "sevenmore"), cFourteen = c(5, "fourteen");
    var out = "";

    /* beat 0: a time, and a time interval */
    var first = tdOnly(t, scene, 0);
    if (first > 0) {
      var a = "";
      a += G(ART.place(ART.clock(10, 40), 250, 92, 250, 250), { opacity: on(t, cPoint, 0.5) });
      a += MK.pill(375, 372, "a time", on(t, cPoint, 0.4), { size: 28, col: P.blue });
      var lo = on(t, cLasts, 0.5);
      a += MK.pop(Em(830, 176, 104, "⌛"), 830, 176, popIn(t, cLasts, 0.45));
      a += MK.arrow(830, 276, 664, 276, lo, P.gold, 6) + MK.arrow(830, 276, 996, 276, lo, P.gold, 6);
      a += MK.pill(830, 372, "a time interval", lo, { size: 28, col: P.gold });
      out += G(a, { opacity: first });
    }

    /* beats 1 to 4: the film's two times. It clears as beat 5 begins (rather
       than staying up, rule 2's "carries on into the next beat" does not
       apply here: beat 5 is a different example in different units, and
       rule 3 is one thing at a time), so the minutes clock is not still on
       screen while the weeks are being counted. */
    var rest = tdBetween(t, scene, 1, 5);
    if (rest <= 0 && tdOnly(t, scene, 5) <= 0) return svg(out);
    var b = "";
    b += tdDigital(390, 68, 210, 88, "10:40", popIn(t, cStart, 0.4), P.blue);
    b += Tx(584, 80, "to", "lab big muted", "middle", { opacity: on(t, cEnd, 0.4) });
    b += tdDigital(778, 68, 210, 88, "11:15", popIn(t, cEnd, 0.4), P.blue);
    b += MK.qmark(584, 146, 25, on(t, cHow, 0.4) * tdBetween(t, scene, 1, 3));

    /* beat 2: not a column subtraction. An hour is sixty minutes, not a hundred.
       The two strokes go right across the sum rather than a round mark sitting
       on top of it, so the numbers being refused stay readable. */
    var two = tdOnly(t, scene, 2);
    if (two > 0) {
      var s = "", sx = 396, sy = 228, dontO = on(t, cDont, 0.4);
      s += Tx(sx, sy, "11:15", "lab huge", "end", { opacity: dontO });
      s += Tx(sx, sy + 58, "− 10:40", "lab huge", "end", { opacity: dontO });
      s += L(sx - 196, sy + 78, sx + 8, sy + 78, P.muted, 3, { opacity: dontO });
      var kill = popIn(t, cDont == null ? null : cDont + 0.5, 0.45);
      if (kill > 0) {
        var ko = Math.min(1, kill);
        s += L(sx - 204, sy - 34, lerp(sx - 204, sx + 16, ko), lerp(sy - 34, sy + 88, ko), P.bad, 7);
        s += L(sx - 204, sy + 88, lerp(sx - 204, sx + 16, ko), lerp(sy + 88, sy - 34, ko), P.bad, 7);
      }
      s += MK.pill(520, 208, "1 hour = 60 minutes", on(t, cSixty, 0.4), { size: 26, anchor: "start", col: P.good });
      s += MK.pill(520, 290, "not 100", on(t, cHundred, 0.4), { size: 26, anchor: "start", col: P.bad });
      s += MK.cross(700, 290, 24, popIn(t, cHundred == null ? null : cHundred + 0.35, 0.35));
      b += G(s, { opacity: two });
    }

    /* beats 3 and 4: count on, 10:40 to 11:00 to 11:15 */
    var line = tdFrom(t, scene, 3);
    if (line > 0) {
      var totalO = on(t, cTotal, 0.5);
      var l = tdLineBase(t, 1, 0, 7, totalO);
      l += tdJump(0, 4, on(t, cCount, 0.9), "+ 20 minutes", on(t, cTwenty, 0.4), P.teal);
      l += tdJump(4, 7, tdFrom(t, scene, 4), "+ 15 minutes", on(t, cFifteen, 0.4), P.accent);
      l += MK.pill(590, 412, "35 minutes", totalO, { size: 28, col: P.gold });
      b += G(l, { opacity: line });
    }
    out += G(b, { opacity: rest });

    /* beat 5: the same counting-on idea, in weeks and days. Two blocks of
       seven counters arrive as they are named, then the total. Drawn to
       `out` directly (not `b`), so it is not carried by `rest`'s fade. */
    var five = tdOnly(t, scene, 5);
    if (five > 0) {
      var f = "";
      f += MK.pill(584, 56, "2 weeks", on(t, cTwoWeeks, 0.4), { size: 28, col: P.teal });
      f += G(ART.place(ART.counters(7, { cols: 7, colour: "teal", label: "Week 1: 7 days" }), 150, 128, 380, 150),
        { opacity: popIn(t, cSevenDays, 0.45) });
      f += G(ART.place(ART.counters(7, { cols: 7, colour: "gold", label: "Week 2: 7 more" }), 638, 128, 380, 150),
        { opacity: popIn(t, cSevenMore, 0.45) });
      var fourteenO = popIn(t, cFourteen, 0.5);
      f += MK.pill(584, 358, "14 days", fourteenO, { size: 32, col: P.gold });
      f += MK.tick(584, 404, 22, fourteenO);
      out += G(f, { opacity: five });
    }
    return svg(out);
  }

  /* ==== chapter: choosing the unit =============================================
     The lesson's own question: Amina walks to school, and the three answers
     all carry the number 15, so only the unit can decide. */
  var TD_LADDER = ["seconds", "minutes", "hours", "days", "years"];
  var TD_CARDS = [
    { word: "seconds", cx: 640 }, { word: "minutes", cx: 830 }, { word: "hours", cx: 1020 }
  ];
  var TD_CARD = { top: 196, w: 176, h: 176 };

  function tdChoiceCard(cx, o, word, col) {
    if (!(o > 0)) return "";
    var y = TD_CARD.top, h = TD_CARD.h;
    return G(R(cx - TD_CARD.w / 2, y, TD_CARD.w, h, 20, P.card, col || P.line, col ? 3.5 : 2) +
      Tx(cx, y + 78, "15", "lab huge", "middle", { fill: col || P.ink }) +
      Tx(cx, y + 130, word, "lab big", "middle", { fill: P.muted }),
      { opacity: clamp(o, 0, 1), transform: around(cx, y + h / 2, 0.94 + 0.06 * Math.min(1, o)) });
  }

  function tdUnitsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSeconds = c(0, "seconds"), cLadder = c(0, "ladder");
    var cAmina = c(1, "amina"), cAsk = c(1, "ask");
    var cSec = c(2, "sec"), cQuick = c(2, "quick");
    var cHrs = c(3, "hrs"), cDay = c(3, "day");
    var cMin = c(4, "min"), cPicture = c(4, "picture");
    var out = "", k;

    /* the ladder of units across the top, arriving as they are said */
    var widths = [], totalW = 0, gap = 18;
    for (k = 0; k < TD_LADDER.length; k++) {
      widths.push(TD_LADDER[k].length * 22 * 0.56 + 22 * 1.3);
      totalW += widths[k];
    }
    totalW += gap * (TD_LADDER.length - 1);
    var lx = (1168 - totalW) / 2;
    var arrived = 1 + tally(t, cLadder, TD_LADDER.length - 1, 1.1);
    for (k = 0; k < TD_LADDER.length; k++) {
      var o = k === 0 ? popIn(t, cSeconds, 0.4) : (k < arrived ? 1 : 0);
      out += MK.pill(lx + widths[k] / 2, 64, TD_LADDER[k], o, { size: 22, col: k === 0 ? P.plum : P.line });
      lx += widths[k] + gap;
    }

    /* Amina walking to school, and on "Picture the thing happening" she does */
    var walk = on(t, cAmina, 0.5), wx = lerp(168, 392, ease(on(t, cPicture, 1.3)));
    if (walk > 0) {
      out += G(L(212, 312, lerp(212, 396, walk), 312, P.muted, 4, { "stroke-dasharray": "10 10" }), { opacity: walk });
      out += MK.pop(Em(wx, 262, 92, "\u{1F6B6}"), wx, 262, popIn(t, cAmina, 0.45));
      out += MK.pop(Em(440, 258, 96, "\u{1F3EB}"), 440, 258, popIn(t, cAmina == null ? null : cAmina + 0.35, 0.45));
      out += MK.pill(300, 386, "Amina walks to school", walk, { size: 24, col: P.plum });
    }

    /* the three answers, all 15 */
    var shown = tally(t, cAsk, TD_CARDS.length, 0.8);
    var ringSec = on(t, cSec, 0.4), ringHrs = on(t, cHrs, 0.4), ringMin = on(t, cMin, 0.4);
    var cols = [ringSec > 0.5 ? P.bad : null, ringMin > 0.5 ? P.good : null, ringHrs > 0.5 ? P.bad : null];
    for (k = 0; k < TD_CARDS.length; k++) {
      out += tdChoiceCard(TD_CARDS[k].cx, k < shown ? 1 : 0, TD_CARDS[k].word, cols[k]);
    }
    var my = TD_CARD.top + TD_CARD.h + 22;
    out += MK.cross(TD_CARDS[0].cx, my, 24, popIn(t, cQuick, 0.4));
    out += MK.cross(TD_CARDS[2].cx, my, 24, popIn(t, cDay, 0.4));
    out += MK.tick(TD_CARDS[1].cx, my, 24, popIn(t, cMin, 0.4));
    out += MK.glow(TD_CARDS[1].cx, TD_CARD.top + TD_CARD.h / 2, 150, P.good, on(t, cMin, 0.6) * 0.9);
    return svg(out);
  }
