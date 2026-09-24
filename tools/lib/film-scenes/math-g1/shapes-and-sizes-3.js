  /* ==== Shapes and Sizes, part 3 ==============================================
     The chapters "Long, longer, longest", "Heavy and light" and "Which holds
     more?", then "What you now know" and the KINDS table. */

  /* ==== chapter: long, longer, longest ===========================================
     The lesson's own three ribbons (step 9: short, longer, longest, in its own
     accent, teal and plum). They begin at different places, slide to a common
     start as the voice says to line one end up, and then each is named as it is
     pointed out - shortest first, longest last, as the lesson asks the child to
     tap them. The drawn lengths are 150, 310 and 500, so the one called longest
     IS the longest on screen. */
  var SS_RIB = [
    { len: 150, from: 320, y: 132, col: P.accent, word: "short" },
    { len: 310, from: 250, y: 236, col: P.teal, word: "longer" },
    { len: 500, from: 180, y: 340, col: P.plum, word: "longest" }
  ];
  var SS_RIB_X = 200, SS_RIB_H = 40;

  function ssLengthChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var out = "", k;
    var lined = on(t, c(1, "line"), 0.9);
    var cShort = c(2, "short"), cLonger = c(3, "longer"), cLongest = c(3, "longest");
    var named = [cShort, cLonger, cLongest];
    /* the ribbons are on screen from the chapter's first frame - a stage that
       waits a second for its first cue reads as a blank - and the cue counts
       them: a numbered disc arrives at each as "three ribbons" is said */
    var open = BEATS[scene.first].start, cThree = c(0, "three");
    var appear = [popIn(t, open, 0.45), popIn(t, open + 0.18, 0.45), popIn(t, open + 0.36, 0.45)];

    /* the start line every ribbon slides to */
    var startO = on(t, c(1, "start"), 0.5);
    if (startO > 0) out += L(SS_RIB_X, 82, SS_RIB_X, 392, P.gold, 4, { "stroke-dasharray": "12 9", opacity: startO });

    for (k = 0; k < 3; k++) {
      var r = SS_RIB[k], x = lerp(r.from, SS_RIB_X, lined), o = Math.min(1, appear[k]);
      if (o <= 0) continue;
      var lit = on(t, named[k], 0.4);
      /* the end of each ribbon, shown when the voice asks which goes further */
      var far = on(t, c(2, "further"), 0.6);
      if (far > 0) out += L(x + r.len, r.y - 46, x + r.len, r.y + 46, P.muted, 3, { "stroke-dasharray": "8 7", opacity: 0.8 * far });
      out += ssRibbon(x, r.y, r.len, SS_RIB_H + 8 * lit, r.col, o);
      if (lit > 0) out += R(x - 4, r.y - (SS_RIB_H + 8) / 2 - 8, r.len + 8, SS_RIB_H + 24, (SS_RIB_H + 24) / 2, "none", P.gold, 4, { opacity: lit });
      out += MK.pill(x + r.len + 132, r.y, r.word, lit, { size: 34, col: r.col });
      out += ssCount(x - 44, r.y, k + 1, popIn(t, cThree == null ? null : cThree + k * 0.2, 0.4), P.muted);
    }

    /* the number of ribbons, said at the start */
    out += MK.pill(96, 56, "3 ribbons", on(t, c(0, "diff"), 0.4), { size: 28, col: P.muted });
    return svg(out);
  }

  /* ==== chapter: heavy and light =================================================
     ART.balance draws the pan balance; its two pans are left empty (a space in
     each) and the lesson's own melon and strawberry (step 10, question 1) are
     drawn into them here, big enough to see and so that each can arrive as it
     is named. The beam is level until the voice says the melon side goes down,
     and then the whole picture tips: the card crossfades to the tilted one and
     the fruit travel with their pans. */
  var SS_BAL = { x: 294, y: 22, w: 580 };
  var SS_BAL_S = SS_BAL.w / 540;
  /* the middle of a pan, in the film's space, at a given tilt (the library's
     own geometry: px 270, py 74, arm 158, a 9 degree tip) */
  function ssPan(sign, tilt) {
    var a = tilt === "level" ? 0 : tilt === "right" ? 9 : -9, rad = a * Math.PI / 180;
    var ex = 270 + sign * 158 * Math.cos(rad), ey = 74 + sign * 158 * Math.sin(rad);
    return [SS_BAL.x + ex * SS_BAL_S, SS_BAL.y + (ey + 68) * SS_BAL_S];
  }
  function ssBalCard(tilt) { return ART.place(ART.balance(" ", " ", { tilt: tilt }), SS_BAL.x, SS_BAL.y, SS_BAL.w, SS_BAL.w * 252 / 540); }

  function ssMassChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var out = "", tip = on(t, c(3, "tip"), 0.7);

    /* the balance: level, then tipped to the melon's side */
    if (tip < 1) out += G(ssBalCard("level"), { opacity: 1 - tip });
    if (tip > 0) out += G(ssBalCard("left"), { opacity: tip });

    /* the fruit, each in its own pan, travelling with it as the beam tips */
    var lv = ssPan(-1, "level"), rv = ssPan(1, "level"), lt = ssPan(-1, "left"), rt = ssPan(1, "left");
    var lx = lerp(lv[0], lt[0], tip), ly = lerp(lv[1], lt[1], tip);
    var rx = lerp(rv[0], rt[0], tip), ry = lerp(rv[1], rt[1], tip);
    out += MK.pop(Em(lx, ly, 74, "\u{1F349}"), lx, ly, popIn(t, c(1, "melon"), 0.45));
    out += MK.pop(Em(rx, ry, 62, "\u{1F353}"), rx, ry, popIn(t, c(1, "straw"), 0.45));

    /* beat 0: which one is heavier, and the thing that tells you */
    var b0 = ssOnly(t, scene, 0);
    if (b0 > 0) {
      out += G(MK.qmark(584, 344, 40, on(t, c(0, "heavier"), 0.5)) +
        MK.pill(160, 344, "balance", on(t, c(0, "balance"), 0.4), { size: 32, col: P.teal }), { opacity: b0 });
    }

    /* beat 2: the rule, in the clear column at the left. It goes out at beat 3
       so that the mark for "the melon is heavier" can stand on the melon's own
       side of the frame, which is the side that went down. */
    var b2 = ssFrom(t, scene, 2) * (1 - ssFrom(t, scene, 3));
    if (b2 > 0) {
      var dn = on(t, c(2, "down"), 0.6);
      out += G(MK.arrow(134, 176, 134, 272, dn, P.gold, 9) +
        (dn > 0 ? Pth("M" + n2(134 - 40) + ",286 L" + n2(134 + 40) + ",286 L" + n2(134 + 28) +
          ",316 L" + n2(134 - 28) + ",316 Z", P.tealSoft, P.teal, 3, { opacity: dn }) : "") +
        MK.pill(134, 366, "heavier", on(t, c(2, "heavier"), 0.4), { size: 30, col: P.gold }), { opacity: b2 });
    }

    /* beat 3: the melon is heavier */
    var b3 = ssOnly(t, scene, 3);
    if (b3 > 0) {
      var win = popIn(t, c(3, "heavier"), 0.4);
      out += G(MK.tick(150, 200, 32, win) +
        MK.pill(150, 300, "melon", Math.min(1, win), { size: 32, col: P.good }), { opacity: b3 });
    }

    return svg(out);
  }

  /* ==== chapter: which holds more? ===============================================
     The lesson's own plain jugs (step 11): one full, one empty, and then the
     two in between whose water levels are compared. No numbered scale, because
     Stage 1 capacity is full, empty, more and less. */
  var SS_JUG_W = 190, SS_JUG_Y = 208;

  function ssCapacityChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var out = "";
    var arrive = into(t, scene.first + 2);                       /* the second jug arrives */
    var between = on(t, c(3, "between"), 0.7);                   /* the two in-between levels */
    var ax = lerp(584, 440, arrive);
    var full = lerp(0.62, 1, on(t, c(1, "full"), 0.9));
    var aFill = lerp(full, 0.75, between), bFill = lerp(0, 0.3, between);

    out += ssJug(ax, SS_JUG_Y, SS_JUG_W, aFill, 1);
    out += ssJug(760, SS_JUG_Y, SS_JUG_W, bFill, arrive);

    /* beat 0: what capacity means */
    var b0 = ssOnly(t, scene, 0);
    if (b0 > 0) {
      /* "how much a container can hold": the whole jug measured, rim to base */
      var rim = ssJugLevel(SS_JUG_Y, SS_JUG_W, 1), base = SS_JUG_Y + 140 * (SS_JUG_W / 90) / 2 - 8;
      var hu = on(t, c(0, "hold"), 0.6);
      out += G(MK.pill(584, 400, "capacity", on(t, c(0, "capacity"), 0.4), { size: 34, col: P.teal }) +
        MK.arrow(462, (rim + base) / 2, 462, rim, hu, P.gold, 7) +
        MK.arrow(462, (rim + base) / 2, 462, base, hu, P.gold, 7), { opacity: b0 });
    }

    /* beat 1: full, right up to the top */
    var b1 = ssFrom(t, scene, 1) * (1 - between);
    if (b1 > 0) {
      var topY = ssJugLevel(SS_JUG_Y, SS_JUG_W, 1);
      out += G(MK.pill(ax, 400, "full", on(t, c(1, "full"), 0.4), { size: 34, col: P.teal }) +
        L(ax - 150, topY, ax + 150, topY, P.gold, 4, { "stroke-dasharray": "11 8", opacity: on(t, c(1, "top"), 0.5) }), { opacity: b1 });
    }

    /* beat 2: empty, none at all */
    var b2 = ssFrom(t, scene, 2) * (1 - between);
    if (b2 > 0) {
      out += G(MK.pill(760, 400, "empty", on(t, c(2, "empty"), 0.4), { size: 34, col: P.muted }) +
        MK.pill(1046, 176, "none at all", on(t, c(2, "none"), 0.4), { size: 26, col: P.muted }), { opacity: b2 });
    }

    /* beat 3: the higher water holds more */
    if (between > 0) {
      var ay = ssJugLevel(SS_JUG_Y, SS_JUG_W, 0.75), by = ssJugLevel(SS_JUG_Y, SS_JUG_W, 0.3);
      var hi = on(t, c(3, "higher"), 0.6), mo = popIn(t, c(3, "more"), 0.4);
      out += G(L(340, ay, 602, ay, P.gold, 4, { "stroke-dasharray": "11 8", opacity: hi }) +
        L(598, by, 860, by, P.muted, 4, { "stroke-dasharray": "11 8", opacity: hi }) +
        MK.arrow(600, by, 600, ay, hi, P.gold, 8) +
        MK.tick(288, 196, 30, mo) +
        MK.pill(440, 402, "holds more", Math.min(1, mo), { size: 28, col: P.gold }), { opacity: between });
    }

    return svg(out);
  }

  /* ==== what you now know ========================================================
     One card per idea, each lit as it is said, and on "hunt for shapes" every
     lit card breathes for the film's last line. */
  function ssRecapSquare(cx, cy, size) {
    return ART.place(ART.shape2d("square", { colour: "teal" }), cx - size / 2, cy - size * SS_CH / SS_CARD / 2, size, size * SS_CH / SS_CARD);
  }
  function ssRecapSolid(kind, cx, cy, size) {
    return ART.place(ART.solid(kind), cx - size / 2, cy - size / 2, size, size);
  }
  var SS_RECAP = MK.recapKind([
    { beat: 0, at: "flat", title: "Flat shapes", sub: "sides and corners",
      pic: function (cx, cy, size) { return ssRecapSquare(cx, cy, size * 1.05); } },
    { beat: 0, at: "solid", title: "Solid shapes", sub: "faces and edges",
      pic: function (cx, cy, size) { return ssRecapSolid("cube", cx, cy, size * 1.15); } },
    { beat: 1, at: "hold", title: "Flat or solid?", sub: "could you hold it?",
      pic: function (cx, cy, size) {
        return ssRecapSquare(cx - size * 0.44, cy, size * 0.78) + ssRecapSolid("cube", cx + size * 0.46, cy, size * 0.88);
      } },
    { beat: 2, at: "longer", title: "Longer", sub: "line up the ends",
      pic: function (cx, cy, size) {
        return ssRibbon(cx - size * 0.56, cy - size * 0.24, size * 0.62, size * 0.2, P.accent, 1) +
          ssRibbon(cx - size * 0.56, cy + size * 0.24, size * 1.12, size * 0.2, P.plum, 1);
      } },
    { beat: 2, at: "heavier", title: "Heavier", sub: "that side goes down",
      pic: function (cx, cy, size) { return Em(cx, cy, size, "⚖️"); } },
    { beat: 2, at: "more", title: "Holds more", sub: "the water is higher",
      pic: function (cx, cy, size) { return ssJug(cx, cy, size * 0.72, 0.62, 1); } }
  ], { goBeat: 3, goAt: "hunt" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Flat shapes and solid shapes", "Sides, corners, faces and edges", "Longer, heavier and holds more"] }),
    flat: ssFlatChapter, solid: ssSolidChapter, sort: ssSortChapter,
    length: ssLengthChapter, mass: ssMassChapter, capacity: ssCapacityChapter,
    recap: SS_RECAP
  };
