
  /* ==== Grade 4 Mathematics, Lesson 5: Telling the Time =======================
     tools/lib/film-scenes/math-g4/telling-the-time.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-4-app/lecture-video/telling-the-time.json.

     Mathematics has no lesson kit, so every drawing comes from ART
     (tools/lib/ehel-film-art-math.page.js): its clock, its bar model and its
     calendar. Two things this film needs are not in ART and are drawn here -
     a bus TIMETABLE (a grid of times with a row and a column to follow) and an
     empty number line whose marks are CLOCK TIMES rather than numbers. Both
     are noted in the report.

     THE HANDS. This film never draws a hand of its own. ART.clock(h, m) is
     given the hour and the minute and computes the hour hand's angle as
     (h/12 + m/720) of a turn, so at 4:40 the short hand stands two thirds of
     the way from the 4 to the 5, which is the whole point of the lesson. The
     helpers below ask that same drawing WHERE its hands and numbers are, so a
     highlight can never disagree with the face underneath it.

     This file: the palette, the shared clock helpers, the title motif, and the
     chapters "Units of time" and "Reading the clock face". Every top-level
     name starts with tt, so nothing here can replace a name of the engine,
     ART or MK. */

  var HUE = {
    title: P.teal, units: P.gold, face: P.blue, twentyfour: P.plum,
    timetable: P.accent, duration: P.teal, month: P.good, recap: P.teal
  };

  /* the light palette of the drawings, for anything written ON one of them */
  var TTC = ART.C;

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ttOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ttFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k arrives, then 0: for a thing that steps aside */
  function ttUntil(t, scene, k) { return k >= scene.beats.length ? 1 : 1 - into(t, scene.first + k); }

  /* ---- the clock ------------------------------------------------------------
     ART.clock draws a 288 x 288 card: centre (144, 144), rim 112, the hour
     numbers at radius 80, a 58-long ink hour hand and a 90-long accent minute
     hand. Drawn with no options the card stays square, so a box of side s
     scales it by s / 288 and every point below is the drawing's own point. */
  var TT_CARD = 288, TT_CX = 144, TT_CY = 144;

  function ttHM(mins) {
    var v = Math.round(mins) % 1440; if (v < 0) v += 1440;
    var h24 = Math.floor(v / 60), mm = v % 60;
    return { h24: h24, m: mm, h: ((h24 + 11) % 12) + 1 };
  }
  function tt24(mins) { var x = ttHM(mins); return pad2(x.h24) + ":" + pad2(x.m); }
  function tt12(mins) {
    var x = ttHM(mins);
    return x.h + ":" + pad2(x.m) + " " + (x.h24 < 12 ? "a.m." : "p.m.");
  }
  function ttBox(x, y, s) { return { x: x, y: y, s: s, k: s / TT_CARD }; }
  function ttFace(box, mins, o) {
    if (!(o > 0)) return "";
    var hm = ttHM(mins);
    return G(ART.place(ART.clock(hm.h, hm.m), box.x, box.y, box.s, box.s), { opacity: clamp(o, 0, 1) });
  }
  /* a point on the face: r in the drawing's own units, deg measured from the 12 */
  function ttAt(box, r, deg) {
    var a = (deg - 90) * Math.PI / 180;
    return [box.x + (TT_CX + r * Math.cos(a)) * box.k, box.y + (TT_CY + r * Math.sin(a)) * box.k];
  }
  function ttCentre(box) { return [box.x + TT_CX * box.k, box.y + TT_CY * box.k]; }
  function ttHourTip(box, mins) { var x = ttHM(mins); return ttAt(box, 58, ((x.h % 12) / 12 + x.m / 720) * 360); }
  function ttMinTip(box, mins) { var x = ttHM(mins); return ttAt(box, 90, (x.m / 60) * 360); }
  /* where the numeral n is written (12 is n = 12) */
  function ttNumAt(box, n) { return ttAt(box, 80, (n % 12) * 30); }

  /* A hand lit up: a soft halo along the SAME two points the drawing used, so
     it cannot drift from the hand under it. It is wide and faint rather than
     narrow and solid, because a solid stroke hid the hand it was naming - and
     it carries no dot at the tip, because a dot there sits exactly on a
     numeral and covered the 8 it was meant to be pointing at. */
  function ttHandLit(box, mins, which, o, col) {
    if (!(o > 0)) return "";
    var c = ttCentre(box), p = which === "hour" ? ttHourTip(box, mins) : ttMinTip(box, mins);
    var w = (which === "hour" ? 26 : 17) * box.k;
    return L(c[0], c[1], p[0], p[1], col || P.gold, w,
      { "stroke-opacity": 0.32 * clamp(o, 0, 1) });
  }
  /* a ring round one of the numerals, wide enough to leave it readable */
  function ttNumRing(box, n, o, col) {
    if (!(o > 0)) return "";
    var p = ttNumAt(box, n);
    return C(p[0], p[1], 22 * box.k, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }
  /* a mark on the numeral n's own radius, out past the rim where it covers
     nothing: the tick that says "this is the hour" and the cross that says
     "not this one" */
  function ttOutside(box, n) { return ttAt(box, 130, (n % 12) * 30); }

  /* ---- small furniture -------------------------------------------------------- */

  /* a light card with two lines of writing on it */
  function ttTile(x, y, w, h, top, bottom, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 18, P.card, col || P.line, 3) +
      Tx(x + w / 2, y + h * 0.48, top, "lab huge", "middle", { fill: P.ink }) +
      Tx(x + w / 2, y + h * 0.85, bottom, "lab big", "middle", { fill: col || P.muted }),
      { opacity: clamp(o, 0, 1), transform: around(x + w / 2, y + h / 2, 0.94 + 0.06 * Math.min(1, o)) });
  }

  /* a word on a light plate, for writing ON one of ART's white drawings */
  function ttPlate(cx, cy, text, o, size, ink) {
    if (!(o > 0)) return "";
    size = size || 24;
    var w = String(text).length * size * 0.6 + size * 1.2, h = size * 1.7;
    return G(R(cx - w / 2, cy - h / 2, w, h, h / 2, TTC.card, ink || TTC.accent, 3) +
      Tx(cx, cy + size * 0.36, text, "lab", "middle", { "font-size": size, fill: ink || TTC.ink }),
      { opacity: clamp(o, 0, 1), transform: around(cx, cy, 0.9 + 0.1 * Math.min(1, o)) });
  }

  /* ---- the title motif -------------------------------------------------------
     The lesson's own face at 4:40, the time the "Read the clock" chapter reads.
     On the cards o carries only t, so every cue is null and the motif is just
     the clock, which is what those cards want. */
  var TT_MOTIF = ttBox(36, 36, 288);
  function titleMotif(o) {
    var t = o.t || 0, sc0 = o.scene || null, out = "";
    var cTwo = sc0 ? sc(sc0, 0, "two") : null, cDiff = sc0 ? sc(sc0, 0, "different") : null;
    var cBus = sc0 ? sc(sc0, 1, "bus") : null, cProg = sc0 ? sc(sc0, 1, "programme") : null;
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 168, P.teal, 0.55 + 0.45 * breathe(t));
    out += ttFace(TT_MOTIF, 4 * 60 + 40, 1);
    /* "two hands": both hands light, one just after the other */
    var lit = popIn(t, cTwo, 0.4);
    out += ttHandLit(TT_MOTIF, 4 * 60 + 40, "hour", lit, P.gold);
    out += ttHandLit(TT_MOTIF, 4 * 60 + 40, "minute", popIn(t, cTwo == null ? null : cTwo + 0.35, 0.4), P.teal);
    /* "something different": each hand's job, named */
    /* each plate sits on ITS OWN hand's side of the face: at 4:40 the short
       hand is down to the right and the long hand down to the left */
    out += ttPlate(282, 262, "hour", popIn(t, cDiff, 0.4), 22, TTC.gold);
    out += ttPlate(98, 300, "minutes", popIn(t, cDiff == null ? null : cDiff + 0.3, 0.4), 22, TTC.teal);
    /* "catch a bus", "time a programme" */
    out += MK.pop(Em(56, 62, 62, "\u{1F68C}"), 56, 62, popIn(t, cBus, 0.4));
    out += MK.pop(Em(306, 306, 62, "\u{1F4FA}"), 306, 306, popIn(t, cProg, 0.4));
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A clock face showing twenty to five">' + out + "</svg>";
  }

  /* ==== chapter: Units of time ================================================
     60 seconds, 60 minutes and 24 hours, then the lesson's own pair of
     conversions on one bar model: 4 hours is 4 lots of 60, and 240 divided by
     60 is 4 hours again - "the same fact used two ways", as the lesson page
     puts it. */
  var TT_TILE = { y: 26, h: 116, w: 320, gap: 44 };
  function ttTileX(i) { return 60 + i * (TT_TILE.w + TT_TILE.gap); }
  /* the day bar: 24 hours end to end, midnight to midnight */
  var TT_DAY = { x: 60, y: 168, w: 1048, h: 30 };
  /* the bar model, drawn 1 : 1 in a 520 x 188 card */
  var TT_BAR = { x: 390, y: 244, w: 520, h: 188 };
  function ttBarWhole() { return { x: TT_BAR.x + 24, y: TT_BAR.y + 24, w: 472, h: 62 }; }

  function ttUnitsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var out = "";

    /* beat 0: time is not tens. The misconception the lesson names: an hour is
       60 minutes, not 100. */
    var first = ttOnly(t, scene, 0);
    if (first > 0) {
      var cTens = c(0, "tens"), cSix = c(0, "sixties");
      var a = on(t, cTens, 0.4), b = on(t, cSix, 0.4);
      out += G(Tx(520, 200, "1 hour = 100 minutes", "lab huge", "middle", { fill: P.muted, opacity: a }) +
        MK.cross(848, 186, 30, popIn(t, cTens == null ? null : cTens + 0.35, 0.4)) +
        Tx(520, 312, "1 hour = 60 minutes", "lab huge", "middle", { fill: P.gold, opacity: b }) +
        MK.tick(830, 298, 30, popIn(t, cSix == null ? null : cSix + 0.35, 0.4)),
        { opacity: first });
    }

    /* beats 1-2: the three facts, each as it is said */
    out += ttTile(ttTileX(0), TT_TILE.y, TT_TILE.w, TT_TILE.h, "60 seconds", "= 1 minute", popIn(t, c(1, "minute"), 0.4), P.teal);
    out += ttTile(ttTileX(1), TT_TILE.y, TT_TILE.w, TT_TILE.h, "60 minutes", "= 1 hour", popIn(t, c(1, "hour"), 0.4), P.teal);
    out += ttTile(ttTileX(2), TT_TILE.y, TT_TILE.w, TT_TILE.h, "24 hours", "= 1 day", popIn(t, c(2, "day"), 0.4), P.gold);

    /* "from midnight to midnight": the day drawn end to end, 24 hours of it */
    var cNight = c(2, "midnight"), night = on(t, cNight, 0.4);
    if (night > 0) {
      var lit = tally(t, cNight, 24, 1.0), seg = TT_DAY.w / 24, k, bar = "";
      for (k = 0; k < 24; k++) {
        bar += R(TT_DAY.x + k * seg + 1.5, TT_DAY.y, seg - 3, TT_DAY.h, 4,
          k < lit ? P.gold : P.cell, null, null, { opacity: k < lit ? 0.85 : 0.5 });
      }
      out += G(bar + R(TT_DAY.x, TT_DAY.y, TT_DAY.w, TT_DAY.h, 6, "none", P.line, 2) +
        Tx(TT_DAY.x, TT_DAY.y + TT_DAY.h + 26, "midnight", "lab", "start", { fill: P.muted }) +
        Tx(TT_DAY.x + TT_DAY.w, TT_DAY.y + TT_DAY.h + 26, "midnight", "lab", "end", { fill: P.muted }) +
        Tx(TT_DAY.x + TT_DAY.w / 2, TT_DAY.y + TT_DAY.h + 26, "24 hours", "lab", "middle", { fill: P.gold }),
        { opacity: night });
    }

    /* beats 3-4: one bar model, read both ways */
    var cLots = c(3, "lots"), cTotal = c(3, "total");
    var bar = popIn(t, cLots, 0.45);
    if (bar > 0) {
      var W = ttBarWhole();
      out += MK.pop(ART.place(ART.barModel({ whole: "240 minutes", parts: [60, 60, 60, 60] }),
        TT_BAR.x, TT_BAR.y, TT_BAR.w, TT_BAR.h), TT_BAR.x + TT_BAR.w / 2, TT_BAR.y + TT_BAR.h / 2, bar);
      /* "which is 240 minutes": the whole flashes */
      var fl = bump(t, cTotal, 1.0);
      if (fl > 0) out += R(W.x, W.y, W.w, W.h, 12, "none", P.gold, 6, { opacity: fl });
    }

    /* "four lots of sixty" is the same amount as 4 hours, so the pill stands
       beside the bar from beat 3 - and beat 4 draws the arrow back to it */
    var mid = TT_BAR.y + 60;
    out += MK.pill(140, mid, "4 hours", popIn(t, cLots == null ? null : cLots + 0.3, 0.45), { size: 34, col: P.teal, ink: P.teal });

    /* beat 4: the same fact the other way round */
    var cBack = c(4, "back"), cDiv = c(4, "divide"), cFour = c(4, "four");
    out += MK.arrow(TT_BAR.x - 14, mid, 240, mid, on(t, cBack, 0.6), P.gold, 9);
    out += MK.pill(302, mid - 52, "÷ 60", on(t, cDiv, 0.4), { size: 30, col: P.gold, ink: P.gold });
    var ring = bump(t, cFour, 1.0);
    if (ring > 0) out += R(48, mid - 34, 184, 68, 34, "none", P.gold, 5, { opacity: ring });
    return svg(out);
  }

  /* ==== chapter: Reading the clock face =======================================
     One face, 4:40, read the way the lesson's own working reads it: the short
     hand first, the hour it has PASSED, then the long hand counted in fives.
     Nothing here is drawn by hand - the ring, the tick and the lit hands all
     ask ART.clock where its own parts are. */
  var TT_FACE = ttBox(70, 60, 300);
  var TT_FACE_T = 4 * 60 + 40;                    /* 4:40, the lesson's example */

  function ttFaceChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var B = TT_FACE, out = "", k;
    out += ttFace(B, TT_FACE_T, popIn(t, c(0, "clock"), 0.5));

    /* beat 0: the two hands, named one at a time, and labelled by colour
       rather than by a line across the face */
    var b0 = ttOnly(t, scene, 0);
    var sh0 = on(t, c(0, "short"), 0.4) * b0, ln0 = on(t, c(0, "long"), 0.4) * b0;
    out += ttHandLit(B, TT_FACE_T, "hour", sh0, P.gold);
    out += ttHandLit(B, TT_FACE_T, "minute", ln0, P.teal);
    out += MK.pill(660, 170, "short hand", sh0, { size: 36, col: P.gold, ink: P.gold });
    out += MK.pill(660, 290, "long hand", ln0, { size: 36, col: P.teal, ink: P.teal });

    /* beats 1-2: the hour hand, and the hour it has passed */
    var b12 = Math.min(1, ttOnly(t, scene, 1) + ttOnly(t, scene, 2));
    out += ttHandLit(B, TT_FACE_T, "hour", on(t, c(1, "hour"), 0.4) * b12, P.gold);
    var btw = on(t, c(1, "between"), 0.4) * b12;
    out += ttNumRing(B, 4, btw, P.gold) + ttNumRing(B, 5, btw, P.gold);
    /* "the hour it has passed": the hours already gone by, swept from the 12
       round to where the short hand actually stands - 140 degrees at 4:40, so
       the sweep goes past the 4 and stops short of the 5 */
    var pas = on(t, c(2, "passed"), 0.8) * b12;
    if (pas > 0) {
      var end = 140 * clamp(pas, 0, 1), r70 = 70 * B.k;
      var q0 = ttAt(B, 70, 0), q1 = ttAt(B, 70, end);
      out += Pth("M" + n2(q0[0]) + "," + n2(q0[1]) + " A" + n2(r70) + "," + n2(r70) + " 0 0 1 " +
        n2(q1[0]) + "," + n2(q1[1]), null, P.gold, 7, { opacity: pas });
      out += C(q1[0], q1[1], 8, P.gold, TTC.card, 2, { opacity: pas });
    }
    /* the verdict, out past the rim on each numeral's own radius */
    var o4 = ttOutside(B, 4), o5 = ttOutside(B, 5);
    out += MK.tick(o4[0], o4[1], 22, popIn(t, c(2, "four"), 0.4) * Math.min(1, ttOnly(t, scene, 2) + ttFrom(t, scene, 3)));
    out += MK.cross(o5[0], o5[1], 22, popIn(t, c(2, "five"), 0.4) * ttOnly(t, scene, 2));

    /* beats 3-4: the long hand, and the minutes counted round in fives. One
       number at a time, at the end of an arc that grows along the rim, so the
       face never carries eight small numbers at once. */
    var b34 = Math.min(1, ttFrom(t, scene, 3));
    /* the halo steps back when the 8 is ringed: at 4:40 the long hand lies
       straight along the 8, so a halo there covers the numeral being named */
    var eight = on(t, c(4, "eight"), 0.4) * b34;
    out += ttHandLit(B, TT_FACE_T, "minute", on(t, c(3, "minutes"), 0.4) * b34 * (1 - eight), P.teal);
    out += ttNumRing(B, 8, eight, TTC.accent);
    /* the 8 itself is UNDER the long hand at 4:40, because that is where the
       hand is pointing, so the number being named is written out beside it */
    var p8 = ttAt(B, 132, 240);
    out += ttPlate(p8[0], p8[1], "8", eight, 24, TTC.accent);
    var cFive = c(3, "five"), cForty = c(4, "forty"), steps = 0, arcO = 0;
    if (cFive != null && t >= cFive) { steps = 1; arcO = ttOnly(t, scene, 3); }
    if (cForty != null && t >= cForty) { steps = tally(t, cForty, 8, 1.4); arcO = 1; }
    if (steps > 0 && arcO > 0) {
      var deg = steps * 30, r118 = 118 * B.k;
      var a0 = ttAt(B, 118, 0), a1 = ttAt(B, 118, deg);
      out += Pth("M" + n2(a0[0]) + "," + n2(a0[1]) + " A" + n2(r118) + "," + n2(r118) + " 0 " +
        (deg > 180 ? 1 : 0) + " 1 " + n2(a1[0]) + "," + n2(a1[1]), null, TTC.accent, 6, { opacity: arcO });
      out += C(a1[0], a1[1], 7, TTC.accent, null, null, { opacity: arcO });
      out += MK.pill(B.x + B.s / 2, 404, String(steps * 5) + " minutes", arcO,
        { size: 34, col: TTC.accent, ink: P.accent });
    }

    /* the working, on the right, a line at a time */
    out += MK.list(470, 118, [
      { text: "short hand → the hour", at: c(1, "hour") },
      { text: "4, the hour it has passed", at: c(2, "four"), mark: "tick" },
      { text: "long hand → the minutes", at: c(3, "minutes") },
      { text: "8 fives = 40 minutes", at: c(4, "forty"), mark: "tick" }
    ], t, { lh: 62 });
    out += MK.pill(790, 382, "4:40", popIn(t, c(4, "time"), 0.45), { size: 48, col: P.gold, ink: P.ink });
    return svg(out);
  }
