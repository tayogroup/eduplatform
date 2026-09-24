  /* ==== Grade 3 Mathematics, Lesson 7: Time and Direction =====================
     tools/lib/film-scenes/math-g3/time-and-direction.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-3-app/lecture-video/time-and-direction.json.

     Mathematics has no lesson kit, so the manipulatives come from ART
     (tools/lib/ehel-film-art-math.js): ART.clock for every clock face,
     ART.compass for the rose and the quarter turn, ART.grid for the map.
     Three things ART does not carry are drawn here and named in the report:
     a digital time card, a time line labelled in clock times, and a bus
     timetable.

     TWO THINGS THIS FILM MUST NOT GET WRONG, both checked frame by frame:

       * the hands agree with the words AND with each other. Every clock face
         is ART.clock(3, mm), which derives the hour-hand angle from the
         minutes, so at 3:30 the short hand is halfway between 3 and 4 and
         cannot be parked on the 3. mm is a function of t, so the two hands
         move together and the overlays (tdAt, tdHourAngle, tdMinAngle) read the
         same angles the face is drawn with.
       * the turns and the moves run the way the words say. East is +x and
         north is -y on the map (the lesson's own map: Home at column 1 row 3,
         School at column 3 row 1, so Home to School is 2 east then 2 north),
         and the quarter turn clockwise from west is drawn by ART.compass,
         which lands on north.

     This file: the palette, the shared helpers, the title motif and the
     chapter "Reading the clock". Every top-level name here starts with td, so
     nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, clock: P.gold, interval: P.blue, units: P.plum,
    timetable: P.accent, points: P.teal, route: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function tdOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function tdFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 from beat a, back to 0 as beat b comes in */
  function tdBetween(t, scene, a, b) { return tdFrom(t, scene, a) * (1 - tdFrom(t, scene, b)); }

  /* ---- small drawings of the film's own --------------------------------------
     Three things ART has no drawing for. Each is a pure function of what it is
     given, like everything else in a film. */

  /* a digital clock readout, the lesson's own .digi box: centred on (cx, cy) */
  function tdDigital(cx, cy, w, h, text, o, col) {
    if (!(o > 0)) return "";
    return G(R(cx - w / 2, cy - h / 2, w, h, 16, P.cell, col || P.line, 3) +
      Tx(cx, cy + h * 0.17, text, "lab huge", "middle", { fill: col || P.ink }),
      { opacity: clamp(o, 0, 1), transform: around(cx, cy, 0.94 + 0.06 * Math.min(1, o)) });
  }

  /* a ring drawn round something, popping in */
  function tdRing(cx, cy, r, col, p) {
    if (!(p > 0)) return "";
    return C(cx, cy, r, "none", col || P.gold, 4, { opacity: Math.min(1, p), transform: around(cx, cy, 0.8 + 0.2 * Math.min(p, 1)) });
  }

  /* a word in a pill on the right-hand column, with a leader to the thing it
     names. x is the pill's left edge; the leader leaves from just left of it.
     `live` fades the LEADER alone, because a hand that keeps moving would drag
     its line across the whole dial once the beat that named it has gone by. */
  function tdCall(t, x, y, text, at, to, col, size, live) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    col = col || P.gold;
    var lo = live == null ? 1 : clamp(live, 0, 1);
    return (lo > 0 ? G(MK.leader(x - 10, y, to[0], to[1], on(t, at, 0.7), col), { opacity: lo }) : "") +
      MK.pill(x, y, text, o, { size: size || 24, anchor: "start", col: col });
  }

  /* ==== the clock, shared by the title motif and its own chapter ===============
     One place says where the clock is drawn and what its hands are doing, so an
     overlay can never point somewhere the face is not. */
  var TDC = { x: 40, y: 72, s: 1.05 };
  TDC.w = 466 * TDC.s;                /* ART.clock(..., {digital: true}) is 466 x 288 */
  TDC.h = 288 * TDC.s;
  TDC.cx = TDC.x + 144 * TDC.s;
  TDC.cy = TDC.y + 144 * TDC.s;
  TDC.r = 112 * TDC.s;                /* the rim */
  TDC.hourLen = 58 * TDC.s;           /* ART draws the hour hand 58 long */
  TDC.minLen = 90 * TDC.s;            /* and the minute hand 90 */
  TDC.numR = 80 * TDC.s;              /* the hour numerals sit at 112 - 32 */
  TDC.digital = [TDC.x + 377 * TDC.s, TDC.cy];

  /* ART.clock's own angles, in degrees, 0 pointing at 3 o'clock. The hour hand
     creeps: at 3:30 this is 15 degrees, halfway from the 3 to the 4. */
  function tdHourAngle(h, m) { return ((h % 12) / 12 + m / 720) * 360 - 90; }
  function tdMinAngle(m) { return (m / 60) * 360 - 90; }
  /* a point on the face, r from the centre, at a degrees */
  function tdAt(r, deg) {
    var a = deg * Math.PI / 180;
    return [TDC.cx + r * Math.cos(a), TDC.cy + r * Math.sin(a)];
  }

  /* how many minutes past three the face shows at t: 0, then 15, then 30, each
     swept in on the cue that says so */
  function tdMinutes(t, scene) {
    return 15 * on(t, sc(scene, 3, "at3"), 0.9) + 15 * on(t, sc(scene, 4, "six"), 0.9);
  }

  /* ==== the title ===============================================================
     The two things the lesson is about, side by side: the clock at half past
     three (the hour hand halfway to 4, as the chapter teaches) and the four
     point compass. Each lights as it is named. On the two cards they simply
     stand. */
  var TDM = { cx: 98, cy: 96, r: 62.2, kx: 265, ky: 261.1, kr: 56.3 };
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var cClock = o.scene ? sc(o.scene, 0, "clock") : null;
    var cWhen = o.scene ? sc(o.scene, 0, "when") : null;
    var cComp = o.scene ? sc(o.scene, 0, "compass") : null;
    var cWay = o.scene ? sc(o.scene, 0, "way") : null;
    var cBoth = o.scene ? sc(o.scene, 1, "both") : null;
    var cLong = o.scene ? sc(o.scene, 1, "long") : null;
    out += ART.place(ART.clock(3, 30), 18, 16, 160, 160);
    out += ART.place(ART.compass({ points: 4, facing: "N" }), 186, 180, 158, 159);
    out += tdRing(TDM.cx, TDM.cy, TDM.r + 13, P.gold, popIn(t, cClock, 0.45));
    out += tdRing(TDM.kx, TDM.ky, TDM.kr + 13, P.teal, popIn(t, cComp, 0.45));
    out += MK.pill(255, 70, "when", on(t, cWhen, 0.4), { size: 26, col: P.gold });
    out += MK.pill(95, 300, "which way", on(t, cWay, 0.4), { size: 26, col: P.teal });
    /* "use both": a second ring round each, breathing together */
    var bo = on(t, cBoth, 0.55) * (0.72 + 0.28 * breathe(t));
    out += tdRing(TDM.cx, TDM.cy, TDM.r + 25, P.gold, bo);
    out += tdRing(TDM.kx, TDM.ky, TDM.kr + 25, P.teal, bo);
    /* "how long things take": the interval glass the film uses for it later */
    out += MK.pop(Em(310, 140, 58, "⌛"), 310, 140, popIn(t, cLong, 0.45));
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A clock showing half past three, and a four point compass">' + out + "</svg>";
  }

  /* ==== chapter: reading the clock ==============================================
     One face, ART.clock(3, mm), with mm going 0 -> 15 -> 30 on the cues. Every
     overlay reads the same angles: the leader to the minute hand follows the
     minute hand, the leader to the hour hand follows the hour hand, and the
     halfway mark on the dial is drawn between the 3 and the 4 where the short
     hand actually is. */
  function tdClockChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTwo = c(0, "two"), cJobs = c(0, "jobs");
    var cLong = c(1, "long"), cFive = c(1, "five");
    var cShort = c(2, "short"), cPassed = c(2, "passed");
    var cAt3 = c(3, "at3"), cPast3 = c(3, "past3"), cQuarter = c(3, "quarter");
    var cSix = c(4, "six"), cHalf = c(4, "half"), cCrept = c(4, "crept");

    var mm = Math.round(tdMinutes(t, scene));
    var ha = tdHourAngle(3, mm), ma = tdMinAngle(mm);
    var hourTip = tdAt(TDC.hourLen, ha), minTip = tdAt(TDC.minLen, ma);
    var out = "";

    out += ART.place(ART.clock(3, mm, { digital: true }), TDC.x, TDC.y, TDC.w, TDC.h);

    /* beat 0: two hands, and they do different jobs */
    var twoP = bump(t, cTwo, 1.2) * tdOnly(t, scene, 0);
    if (twoP > 0) {
      out += L(TDC.cx, TDC.cy, minTip[0], minTip[1], P.gold, 11, { opacity: twoP * 0.85 });
      out += L(TDC.cx, TDC.cy, hourTip[0], hourTip[1], P.gold, 13, { opacity: twoP * 0.85 });
    }
    /* one question mark in the clear space beside the clock: which does what? */
    out += MK.qmark(800, 220, 34, on(t, cJobs, 0.4) * tdOnly(t, scene, 0));

    /* beat 1: the long hand, and the five minutes between its numbers */
    out += tdCall(t, 610, 112, "long hand: minutes", cLong, minTip, P.accent, 24, tdOnly(t, scene, 1));
    var fiveO = tdOnly(t, scene, 1);
    if (fiveO > 0 && cFive != null) {
      var shown = tally(t, cFive, 12, 1.4);
      for (var k = 1; k <= shown; k++) {
        var p = tdAt(TDC.r + 24, k * 30 - 90);
        out += Tx(p[0], p[1] + 6, String(k * 5), "lab mid", "middle", { fill: P.accent, opacity: fiveO });
      }
    }

    /* beat 2: the short hand, and the number it has just passed */
    /* the hour label sits LOW, because the digital readout occupies the band
       level with the hour hand and a leader drawn straight across would be
       ruled over the time it is reading */
    out += tdCall(t, 610, 340, "short hand: hour", cShort, hourTip, P.gold, 24, tdOnly(t, scene, 2));
    var passedO = on(t, cPassed, 0.45) * tdBetween(t, scene, 2, 4);
    if (passedO > 0) {
      var n3 = tdAt(TDC.numR, 0);
      out += tdRing(n3[0], n3[1], 24, P.gold, passedO);
    }

    /* beat 3: the long hand sweeps to the 3, and it is quarter past three */
    var sweep = on(t, cAt3, 0.9);
    if (sweep > 0 && tdFrom(t, scene, 3) > 0) out += tdArc(TDC.r - 8, -90, tdMinAngle(15 * sweep), P.accent, 5, tdFrom(t, scene, 3));
    var past3 = on(t, cPast3, 0.45) * tdBetween(t, scene, 3, 4);
    if (past3 > 0) out += L(TDC.cx, TDC.cy, hourTip[0], hourTip[1], P.gold, 13, { opacity: past3 * 0.8 });
    out += MK.pill(610, 210, "quarter past three", on(t, cQuarter, 0.4) * tdBetween(t, scene, 3, 4), { size: 26, anchor: "start", col: P.accent });
    out += MK.tick(TDC.digital[0] + 128, TDC.digital[1], 20, popIn(t, cQuarter, 0.4) * tdBetween(t, scene, 3, 4));

    /* beat 4: on to the 6, half past three, and the short hand halfway to 4 */
    var sweep2 = on(t, cSix, 0.9);
    if (sweep2 > 0) out += tdArc(TDC.r - 8, tdMinAngle(15), tdMinAngle(15 + 15 * sweep2), P.accent, 5, 1);
    out += MK.pill(610, 210, "half past three", on(t, cHalf, 0.4) * tdFrom(t, scene, 4), { size: 26, anchor: "start", col: P.accent });
    out += MK.tick(TDC.digital[0] + 128, TDC.digital[1], 20, popIn(t, cHalf, 0.4) * tdFrom(t, scene, 4));

    var crept = on(t, cCrept, 0.5);
    if (crept > 0) {
      /* the stretch of dial between the 3 and the 4, and the middle of it */
      out += tdArc(TDC.numR + 16, 0, 30, P.gold, 5, crept);
      var m3 = tdAt(TDC.numR + 16, 0), m4 = tdAt(TDC.numR + 16, 30), mid = tdAt(TDC.numR + 16, 15);
      out += L(m3[0], m3[1], tdAt(TDC.numR + 30, 0)[0], tdAt(TDC.numR + 30, 0)[1], P.gold, 3, { opacity: crept });
      out += L(m4[0], m4[1], tdAt(TDC.numR + 30, 30)[0], tdAt(TDC.numR + 30, 30)[1], P.gold, 3, { opacity: crept });
      out += C(mid[0], mid[1], 8, P.gold, P.ground, 2, { opacity: crept });
      /* the leader points at the middle of that stretch of dial, which is where
         the short hand is: pointing at the hand itself would cross the face. */
      out += tdCall(t, 610, 406, "halfway between 3 and 4", cCrept, mid, P.gold, 24);
    }
    return svg(out);
  }

  /* an arc of the clock face, from a degrees to b degrees the short way round */
  function tdArc(r, a, b, col, w, o) {
    if (!(o > 0) || Math.abs(b - a) < 0.4) return "";
    var p0 = tdAt(r, a), p1 = tdAt(r, b);
    return Pth("M" + n2(p0[0]) + "," + n2(p0[1]) + " A" + n2(r) + "," + n2(r) + " 0 " +
      (Math.abs(b - a) > 180 ? 1 : 0) + "," + (b > a ? 1 : 0) + " " + n2(p1[0]) + "," + n2(p1[1]),
      null, col, w, { opacity: clamp(o, 0, 1) });
  }
