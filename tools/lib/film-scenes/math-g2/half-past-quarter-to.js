  /* ==== Grade 2 Mathematics, Lesson 3: Half Past, Quarter To ==================
     tools/lib/film-scenes/math-g2/half-past-quarter-to.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/half-past-quarter-to.json.

     Every clock here is ART.clock(h, m) - the lesson's own face, sixty ticks,
     a short fat ink hour hand and a long thin accent minute hand. ART.clock
     puts the hour hand at (h + m/60) of the way round, so the two hands can
     never disagree: half past three is clock(3, 30) with the short hand
     halfway between the 3 and the 4, and quarter to four is clock(3, 45) with
     it three quarters of the way there. Nothing in this film draws a hand of
     its own; a moving clock is the same drawing asked for a different minute.

     One number runs every clock: v, the minutes since twelve. hpClock(v) draws
     it, hpHour(v) and hpMin(v) say where each hand ended up, so a caption, a
     leader line and the face cannot drift apart.

     This file: the palette, the clock helpers, the title motif and the
     chapter "The two hands". Every top-level name starts with hp. */

  var HUE = {
    title: P.teal, hands: P.blue, quarters: P.gold, fives: P.accent,
    digital: P.plum, units: P.teal, calendar: P.good, recap: P.teal
  };

  /* ---- timing ------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function hpOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function hpFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* how far a move that starts at `at` and lasts `span` has gone */
  function hpRun(t, at, span) { return at == null ? 0 : ease(clamp((t - at) / (span || 1.6), 0, 1)); }
  /* fixed numbers for anything scattered: never Math.random */
  var HP_SCATTER = [0.21, 0.74, 0.39, 0.86, 0.11, 0.62, 0.48, 0.93];

  /* ---- the clock ----------------------------------------------------------
     ART.clock draws into a 288 x 288 card (466 x 288 with a digital panel),
     its face centred on (144, 144) with a radius of 112, the hour hand 58 long
     and the minute hand 90, and the hour numbers at 80. hpBox maps that space
     into the film's 1168 x 440, so a leader line can end on a hand's tip. */
  var HP_FACE = 288, HP_R = 112, HP_HOUR = 58, HP_MIN = 90, HP_NUM = 80;
  /* where a traced journey is drawn: outside the rim, so it never covers the
     ticks or the hour numbers a child is being asked to read */
  var HP_TRACE = 1.06, HP_TRACE_W = 7;

  function hpBox(x, y, size, vw) {
    var s = size / HP_FACE;
    return {
      x: x, y: y, s: s, size: size, w: (vw || HP_FACE) * s, h: size,
      cx: x + 144 * s, cy: y + 144 * s, r: HP_R * s
    };
  }
  /* a point on the face: `frac` of the radius, at minute index `mi` (0 to 60) */
  function hpPt(B, frac, mi) {
    var a = ((mi * 6 - 90) * Math.PI) / 180;
    return [B.cx + B.r * frac * Math.cos(a), B.cy + B.r * frac * Math.sin(a)];
  }
  /* v, minutes since twelve, as the whole hour and minute ART.clock takes */
  function hpHM(v) {
    var w = Math.round(v), m = ((w % 60) + 60) % 60, h = ((((w - m) / 60) % 12) + 12) % 12;
    return { h: h === 0 ? 12 : h, m: m };
  }
  function hpClock(v, o) { var q = hpHM(v); return ART.clock(q.h, q.m, o); }
  /* where each hand points, as a minute index, read back off what was drawn */
  function hpHour(v) { var q = hpHM(v); return ((q.h % 12) * 5 + q.m / 12) % 60; }
  function hpMin(v) { return hpHM(v).m; }
  function hpHandPt(B, v, which) {
    return which === "hour" ? hpPt(B, HP_HOUR / HP_R, hpHour(v)) : hpPt(B, HP_MIN / HP_R, hpMin(v));
  }

  /* an arc of the face, from minute index m0 clockwise to m1, `frac` of the
     radius out. A whole turn stops just short of closing, so the path can
     never collapse onto itself. */
  function hpArc(B, frac, m0, m1, col, w, o, dash) {
    if (!(o > 0) || m1 - m0 < 0.05) return "";
    var r = B.r * frac, hi = Math.min(m1, m0 + 59.6);
    var a0 = ((m0 * 6 - 90) * Math.PI) / 180, a1 = ((hi * 6 - 90) * Math.PI) / 180;
    var extra = { opacity: clamp(o, 0, 1), "stroke-linecap": "round" };
    if (dash) extra["stroke-dasharray"] = dash;
    return Pth("M" + n2(B.cx + r * Math.cos(a0)) + "," + n2(B.cy + r * Math.sin(a0)) +
      " A" + n2(r) + "," + n2(r) + " 0 " + (hi - m0 > 30 ? 1 : 0) + ",1 " +
      n2(B.cx + r * Math.cos(a1)) + "," + n2(B.cy + r * Math.sin(a1)), null, col, w, extra);
  }

  /* a ring round one of the face's hour numbers (12 is hour 12) */
  function hpRingNum(B, hour, col, o) {
    if (!(o > 0)) return "";
    var p = hpPt(B, HP_NUM / HP_R, (hour % 12) * 5);
    return C(p[0], p[1], 27 * B.s, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }
  /* a glow laid along one hand, so the hand being named lights up */
  function hpLitHand(B, v, which, col, o) {
    if (!(o > 0)) return "";
    var p = hpHandPt(B, v, which);
    return L(B.cx, B.cy, p[0], p[1], col || P.gold, (which === "hour" ? 17 : 11) * B.s,
      { opacity: 0.5 * clamp(o, 0, 1), "stroke-linecap": "round" });
  }
  /* a word in a pill, with a leader line from its near edge to what it names */
  function hpTag(t, x, y, text, at, to, col, size, lead) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    size = size || 26;
    var w = String(text).length * size * 0.56 + size * 1.3;
    var sx = to[0] < x ? x - w / 2 : x + w / 2;
    var lu = on(t, at, 0.6) * (lead == null ? 1 : lead);
    return MK.leader(sx, y, to[0], to[1], lu, col || P.gold) +
      MK.pill(x, y, text, o, { size: size, col: col || P.gold });
  }

  /* ==== the title motif ========================================================
     The lesson's own face at quarter to four - the time the lesson is named
     for, and the reading it says children get wrong. In the spoken title
     chapter the hands travel there from three o'clock as "they move" is said;
     on the two cards the face simply stands at quarter to four. */
  function hpMotifV(o) {
    if (!o.scene) return 225;
    var mv = sc(o.scene, 0, "move");
    return mv == null ? 225 : 180 + 45 * hpRun(o.t || 0, mv, 1.8);
  }
  function titleMotif(o) {
    var t = o.t || 0, B = hpBox(26, 26, 308), v = hpMotifV(o), out = "";
    out += el("clipPath", { id: "hpMotifClip" }, C(180, 180, 174));
    out += C(180, 180, 174, "#123247");
    out += G(ART.place(hpClock(v), B.x, B.y, B.w, B.h), { "clip-path": "url(#hpMotifClip)" });
    out += C(180, 180, 174, "none", P.line, 3);
    if (o.scene) {
      /* "a clock face": the rim flashes. "two hands": both hands light, which
         is the thing the next chapter is about. "they move": the hands travel
         (hpMotifV). "read the time": the rim is traced all the way round.
         "five minutes": the whole face glows. */
      out += C(180, 180, 174, "none", P.gold, 5, { opacity: 0.85 * bump(t, sc(o.scene, 0, "face"), 1.2) });
      var hands = bump(t, sc(o.scene, 0, "hands"), 1.5);
      if (hands > 0) {
        out += hpLitHand(B, v, "hour", P.gold, hands);
        out += hpLitHand(B, v, "min", P.teal, hands);
      }
      out += hpArc(B, 1.28, 0, 60 * hpRun(t, sc(o.scene, 1, "read"), 1.4), P.teal, 6, 1);
      out += MK.glow(180, 180, 170, P.gold, 0.7 * on(t, sc(o.scene, 1, "five"), 0.6) * (0.6 + 0.4 * breathe(t)));
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A clock face at quarter to four">' + out + "</svg>";
  }

  /* ==== chapter: the two hands ==================================================
     One face at three o'clock. The short hand is named and lights up, then the
     long one; then the long hand travels a whole turn, its path traced behind
     it, while the short hand creeps from the 3 to the 4 - the same drawing
     asked for a later minute, so the two can only agree. */
  var HP_H = hpBox(64, 40, 360);

  function hpHandsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cShort = c(0, "short"), cHour = c(0, "hour"), cFirst = c(0, "first");
    var cLong = c(1, "long"), cMin = c(1, "minutes"), cNext = c(1, "next");
    var cAt3 = c(2, "at3"), cOc = c(2, "oclock");
    var cWatch = c(3, "watch"), cRound = c(3, "round"), cOneHr = c(3, "hour");
    var cCrept = c(4, "crept"), cMoved = c(4, "moved");
    var B = HP_H, out = "";
    /* three o'clock, and then one whole turn of the long hand */
    var swept = 60 * hpRun(t, cRound, 2.1), v = 180 + swept;

    out += ART.place(hpClock(v), B.x, B.y, B.w, B.h);
    out += hpLitHand(B, v, "hour", P.gold, Math.max(bump(t, cShort, 1.5), 0.5 * hpFrom(t, scene, 0)));
    out += hpLitHand(B, v, "min", P.teal, Math.max(bump(t, cLong, 1.5), 0.5 * hpFrom(t, scene, 1)));

    /* the two words. Their leaders retire when the hands start travelling, so
       a line does not swing across the face while the child watches the turn. */
    var lead = 1 - hpFrom(t, scene, 3);
    out += hpTag(t, 600, 104, "hour", cHour, hpHandPt(B, v, "hour"), P.gold, 30, lead);
    out += hpTag(t, 600, 348, "minutes", cMin, hpHandPt(B, v, "min"), P.teal, 30, lead);

    /* read the short one first, the long one next: a 1 and a 2 beside them */
    var o1 = popIn(t, cFirst, 0.4) * hpFrom(t, scene, 0);
    if (o1 > 0) out += MK.pop(C(690, 104, 24, P.gold) + Tx(690, 114, "1", "lab big", "middle", { fill: "#0B1D2C" }), 690, 104, o1);
    var o2 = popIn(t, cNext, 0.4) * hpFrom(t, scene, 1);
    if (o2 > 0) out += MK.pop(C(716, 348, 24, P.teal) + Tx(716, 358, "2", "lab big", "middle", { fill: "#0B1D2C" }), 716, 348, o2);

    /* "at the 3": the 3 rings, and the hour is said out loud beside it */
    var beat2 = hpOnly(t, scene, 2);
    out += hpRingNum(B, 3, P.gold, Math.max(bump(t, cAt3, 1.6), 0.75 * beat2));
    out += MK.pill(930, 226, "3 o'clock", popIn(t, cOc, 0.4) * beat2, { size: 36, col: P.gold });

    /* the long hand's whole turn, traced behind it, and what the trip is worth */
    var watch = on(t, cWatch, 0.5) * hpFrom(t, scene, 3);
    if (watch > 0) {
      out += hpArc(B, HP_TRACE, 0, swept, P.teal, HP_TRACE_W, watch);
      var top = hpPt(B, HP_TRACE, 0);
      out += C(top[0], top[1], 9, P.teal, null, null, { opacity: watch });
    }
    var oneHr = popIn(t, cOneHr, 0.4) * hpFrom(t, scene, 3);
    if (oneHr > 0) {
      out += MK.pill(930, 142, "once round", Math.min(1, oneHr), { size: 26, col: P.teal });
      out += MK.pill(930, 208, "1 hour", Math.min(1, oneHr), { size: 40, col: P.gold });
    }

    /* the short hand crept: the little arc it covered, from the 3 to the 4 */
    var crept = on(t, cCrept, 0.5) * hpFrom(t, scene, 4);
    if (crept > 0) {
      out += hpArc(B, HP_HOUR / HP_R + 0.16, 15, 20, P.gold, 6, crept, "9 7");
      out += hpRingNum(B, 3, P.muted, crept);
      out += hpRingNum(B, 4, P.gold, on(t, cMoved, 0.5));
    }
    var moved = on(t, cMoved, 0.5) * hpFrom(t, scene, 4);
    if (moved > 0) {
      out += MK.pill(620, 404, "3", Math.min(1, moved), { size: 34, col: P.muted });
      out += MK.arrow(668, 404, 792, 404, moved, P.gold, 7);
      out += MK.pill(840, 404, "4", Math.min(1, moved), { size: 34, col: P.gold });
    }
    return svg(out);
  }
