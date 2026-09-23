
  /* ==== Grade 3 Science, Lesson 9: Gravity and Friction, part 3 ================
     The chapters "Rough and smooth" and "A bar chart", the recap, and KINDS.

     The three tracks are the lesson's own friction sim, drawn once per surface
     with the block at the mark it reached: ART.sim("friction", "draw", s, x),
     where s is one of SIMS.friction.surfaces - the same three objects, with the
     kit's own wood drawing - and x is the block's position in marks. The
     numbers are the lesson's: ice 9, smooth wood 6, rough carpet 2. */

  var GF_SURF = [
    { id: "ice", label: "ice", pic: "\u{1F9CA}", fill: "#DDEFF7", far: 9 },
    { id: "wood", label: "smooth wood", pic: ART.ICONS.wood, fill: "#C9A26B", far: 6 },
    { id: "carpet", label: "rough carpet", pic: "\u{1F9F6}", fill: "#8E4A5B", far: 2 }
  ];
  var GF_TX = [12, 400, 788], GF_TY = 130, GF_TW = 368, GF_TH = 230, GF_TK = GF_TW / 320;
  function gfTrackX(k, sx) { return GF_TX[k] + sx * GF_TK; }
  function gfTrackY(sy) { return GF_TY + sy * GF_TK; }

  function gfSurfacesChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cRough = c(0, "rough"), cMore = c(0, "more"), cSmooth = c(0, "smooth"), cLess = c(0, "less");
    var cIce1 = c(1, "ice"), cWood1 = c(1, "wood"), cCarp1 = c(1, "carpet");
    var cBlock = c(2, "block"), cPush = c(2, "push"), cSurf = c(2, "surface"), cFair = c(2, "fair");
    var cIce3 = c(3, "ice"), cSlides = c(3, "slides"), cNine = c(3, "nine");
    var cWood4 = c(4, "wood"), cSix = c(4, "six"), cCarp4 = c(4, "carpet"), cTwo = c(4, "two");
    var cIce5 = c(5, "ice"), cLittle = c(5, "little"), cStops5 = c(5, "stops");
    var out = "";

    /* ---- beat 1: rough makes more friction, smooth makes less ----------------- */
    var one = gfOnly(t, scene, 0);
    if (one > 0) {
      var in1 = "";
      in1 += R(150, 58, 380, 312, 22, P.card, P.line, 2);
      in1 += R(174, 298, 332, 52, 8, "#8E4A5B") + gfSaw(176, 504, 298, 11, 0, "#6A3040", 1);
      in1 += gfBlock(302, 1, 298);
      in1 += MK.pill(340, 108, "rough", on(t, cRough, 0.4), { size: 28, col: P.gold });
      in1 += gfRub(306, 374, 298, on(t, cMore, 0.4), 0, P.gold);
      in1 += MK.pill(340, 170, "more friction", on(t, cMore, 0.4), { size: 28, col: P.gold });
      in1 += R(638, 58, 380, 312, 22, P.card, P.line, 2);
      in1 += R(662, 298, 332, 52, 8, "#DDEFF7");
      in1 += gfBlock(790, 1, 298);
      in1 += MK.pill(828, 108, "smooth", on(t, cSmooth, 0.4), { size: 28, col: P.teal });
      in1 += gfSaw(794, 862, 298, 4, 0, P.gold, on(t, cLess, 0.4) * 0.8);
      in1 += MK.pill(828, 170, "less friction", on(t, cLess, 0.4), { size: 28, col: P.teal });
      out += G(in1, { opacity: one });
    }

    /* the red block sits on the floor of each card, 44 px tall, at y 218..262 */
    /* ---- the three tracks ---------------------------------------------------- */
    var b3 = gfOnly(t, scene, 3), b4 = gfOnly(t, scene, 4), b5 = gfOnly(t, scene, 5);
    var at1 = [cIce1, cWood1, cCarp1];
    var slid = [
      GF_SURF[0].far * gfSlide(t, gfAt(cSlides, 0.1), gfAt(cNine, 0.15)),
      GF_SURF[1].far * gfSlide(t, gfAt(cWood4, 0.1), gfAt(cSix, 0.15)),
      GF_SURF[2].far * gfSlide(t, gfAt(cCarp4, 0.1), gfAt(cTwo, 0.15))
    ];
    var lit = [b3 > 0.5 || b5 > 0.5, b4 > 0.5 && cWood4 != null && t >= cWood4, b4 > 0.5 && cCarp4 != null && t >= cCarp4];
    var badge = [popIn(t, cNine, 0.4), popIn(t, cSix, 0.4), popIn(t, cTwo, 0.4)];
    for (var k = 0; k < 3; k++) {
      var p = popIn(t, at1[k], 0.4);
      if (p <= 0) continue;
      var o = Math.min(1, p) * (k === 0 ? 1 : 1 - 0.55 * b5);
      out += G(R(GF_TX[k] - 6, GF_TY - 6, GF_TW + 12, GF_TH + 12, 18, lit[k] ? "#1B3A52" : P.card, lit[k] ? P.gold : P.line, lit[k] ? 3 : 2) +
        ART.place(ART.sim("friction", "draw", GF_SURF[k], slid[k]), GF_TX[k], GF_TY, GF_TW, GF_TH),
        /* grows in to its own size and no further: the popIn overshoot put the
           first and third cards 5 px outside the 1168 box (--sweep found it) */
        { opacity: o, transform: around(GF_TX[k] + GF_TW / 2, GF_TY + GF_TH / 2, 0.94 + 0.06 * Math.min(p, 1)) });
      if (badge[k] > 0)
        out += MK.pop(MK.pill(GF_TX[k] + GF_TW / 2, 396, GF_SURF[k].far + " marks", 1, { size: 28, col: P.gold }),
          GF_TX[k] + GF_TW / 2, 396, badge[k] * (k === 0 ? 1 : 1 - 0.55 * b5));
    }

    /* ---- beat 3: same block, same push, only the surface changes -------------- */
    var two = gfOnly(t, scene, 2);
    if (two > 0) {
      var in3 = MK.pill(584, 36, "a fair test", on(t, cFair, 0.45), { size: 30, col: P.gold });
      for (var m = 0; m < 3; m++) {
        var cx = GF_TX[m] + GF_TW / 2;
        var bp = popIn(t, gfAt(cBlock, m * 0.1), 0.35);
        in3 += MK.pop(R(cx - 78, 76, 40, 34, 6, "#D9473F"), cx - 58, 93, bp);
        in3 += MK.arrow(cx - 26, 93, cx + 26, 93, on(t, cPush, 0.4), P.teal, 8);
        in3 += MK.tick(cx + 58, 93, 18, popIn(t, gfAt(cPush, 0.35), 0.35));
        in3 += R(GF_TX[m] + 4, gfTrackY(140), 360, gfTrackY(200) - gfTrackY(140), 8, "none", P.gold, 4,
          { opacity: on(t, cSurf, 0.4), "stroke-dasharray": "14 9" });
      }
      out += G(in3, { opacity: two });
    }

    /* ---- beat 6: even ice has a little friction ------------------------------- */
    if (b5 > 0) {
      var bxi = gfTrackX(0, 14 + GF_SURF[0].far * 30), bwi = 34 * GF_TK;
      var in6 = gfRub(bxi + 2, bxi + bwi - 2, gfTrackY(140), on(t, cLittle, 0.4), 0, P.gold);
      in6 += MK.pill(196, 96, "a little friction", on(t, cLittle, 0.45), { size: 26, col: P.gold });
      /* the block has stopped: a bar at the edge it reached, the same mark the
         friction chapter uses, rather than a tick with nothing to agree with */
      var sp6 = popIn(t, cStops5, 0.4);
      in6 += L(bxi + bwi, gfTrackY(94), bxi + bwi, gfTrackY(148), P.gold, 4, { opacity: Math.min(1, sp6) });
      out += G(in6, { opacity: b5 });
    }
    return svg(out);
  }

  /* ==== chapter: a bar chart ===================================================
     The lesson's own table and its own bar chart: three surfaces, three
     distances, 9, 6 and 2 marks, against a scale that counts the marks. */
  var GF_BASE = 386, GF_UNIT = 29, GF_BARX = [612, 790, 968], GF_BARW = 112;
  function gfBarTop(far) { return GF_BASE - far * GF_UNIT; }

  function gfChartChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTable = c(0, "table"), cRows = [c(0, "ice"), c(0, "wood"), c(0, "carpet")];
    var cBars = c(1, "bars"), cScale1 = c(1, "scale"), cChart = c(1, "chart");
    var cScale2 = c(2, "scale"), cOne = c(2, "one"), cNine = c(2, "nine");
    var cTall = c(3, "tallest"), cLong = c(3, "longest"), cLeast = c(3, "least");
    var cRead = c(4, "read"), cPat = c(4, "pattern"), cSmoo = c(4, "smoother"), cLonger = c(4, "longer");
    var out = "", k;

    /* ---- the table ----------------------------------------------------------- */
    var tb = on(t, cTable, 0.45);
    if (tb > 0) {
      var tin = R(30, 76, 400, 232, 22, P.card, P.line, 2);
      tin += Tx(62, 118, "Surface", "lab mid muted", "start") + Tx(404, 118, "Marks slid", "lab mid muted", "end");
      tin += L(50, 134, 410, 134, P.line, 2);
      for (k = 0; k < 3; k++) {
        var ry = 178 + k * 52, ro = on(t, cRows[k], 0.4);
        if (ro <= 0) continue;
        tin += G(MK.pic(80, ry - 10, 36, GF_SURF[k].pic) +
          Tx(112, ry, GF_SURF[k].label, "lab big", "start") +
          Tx(406, ry + 4, String(GF_SURF[k].far), "lab huge gold", "end"), { opacity: ro });
      }
      out += G(tin, { opacity: tb });
    }

    /* ---- the chart ----------------------------------------------------------- */
    var ax = on(t, cBars, 0.4);
    if (ax <= 0) return svg(out);
    out += L(556, 104, 556, GF_BASE, P.muted, 3, { opacity: ax });
    out += L(556, GF_BASE, 1104, GF_BASE, P.muted, 3, { opacity: ax });
    var sc1 = on(t, cScale1, 0.45);
    for (k = 1; k <= 9; k++) out += L(544, gfBarTop(k), 556, gfBarTop(k), P.muted, 3, { opacity: sc1 });
    /* the scale counts the marks: one, two, three, up to nine */
    var count = cOne == null ? 0 : tally(t, cOne, 9, Math.max(1.2, (cNine == null ? 2 : cNine - cOne) + 0.7));
    for (k = 1; k <= 9; k++) {
      var shown = k <= count ? 1 : 0;
      out += Tx(540, gfBarTop(k) + 8, String(k), "lab mid muted", "end",
        { opacity: shown, fill: bump(t, cOne == null ? null : cOne + (k - 1) * 0.16, 0.5) > 0.3 ? P.gold : P.muted });
    }
    for (k = 0; k < 3; k++) {
      var u = ease((t - (cBars == null ? t + 9 : cBars + 0.15 + k * 0.2)) / 0.75);
      var h = GF_SURF[k].far * GF_UNIT * clamp(u, 0, 1), cxb = GF_BARX[k] + GF_BARW / 2;
      out += R(GF_BARX[k], GF_BASE - h, GF_BARW, h, 6, GF_SURF[k].fill, P.line, 2);
      out += MK.pic(cxb - 62, 410, 30, GF_SURF[k].pic, { opacity: ax });
      out += Tx(cxb - 42, 418, GF_SURF[k].label, "lab mid", "start", { opacity: ax });
    }
    out += MK.pill(848, 62, "bar chart", on(t, cChart, 0.45) * (1 - gfFrom(t, scene, 2)), { size: 30, col: P.gold });

    /* ---- beat 3: the scale up the side ---------------------------------------- */
    var b2 = gfOnly(t, scene, 2);
    if (b2 > 0) out += R(514, 108, 52, 292, 10, "none", P.gold, 4,
      { opacity: on(t, cScale2, 0.4) * b2, "stroke-dasharray": "14 9" });

    /* ---- beat 4: the tallest bar is the longest slide, the least friction ----- */
    var b3 = gfOnly(t, scene, 3);
    if (b3 > 0) {
      var in4 = R(GF_BARX[0] - 6, gfBarTop(9) - 6, GF_BARW + 12, 9 * GF_UNIT + 12, 8, "none", P.gold, 4,
        { opacity: on(t, cTall, 0.4) });
      in4 += MK.pill(230, 348, "longest slide", on(t, cLong, 0.45), { size: 28, col: P.gold });
      in4 += MK.pill(230, 404, "least friction", on(t, cLeast, 0.45), { size: 28, col: P.good });
      out += G(in4, { opacity: b3 });
    }

    /* ---- beat 5: read the bars, and see the pattern ---------------------------- */
    var b4 = gfOnly(t, scene, 4);
    if (b4 > 0) {
      var in5 = "";
      for (k = 0; k < 3; k++)
        in5 += MK.ripple(GF_BARX[k] + GF_BARW / 2, gfBarTop(GF_SURF[k].far), t, gfAt(cRead, 0.15 + k * 0.28), P.gold);
      var pu = on(t, cPat, 0.9), pts = [[668, gfBarTop(9)], [846, gfBarTop(6)], [1024, gfBarTop(2)]];
      if (pu > 0) {
        var end = polyAt(pts, polyLen(pts) * pu);
        var d = "M" + n2(pts[0][0]) + "," + n2(pts[0][1]);
        for (k = 1; k <= end[2]; k++) d += " L" + n2(pts[k][0]) + "," + n2(pts[k][1]);
        d += " L" + n2(end[0]) + "," + n2(end[1]);
        in5 += Pth(d, null, P.gold, 5, { "stroke-dasharray": "12 9" });
        in5 += C(end[0], end[1], 8, P.gold);
      }
      in5 += MK.pill(230, 376, "smoother surface, longer slide",
        Math.min(1, on(t, cSmoo, 0.45) + on(t, cLonger, 0.45)), { size: 22, col: P.gold });
      out += G(in5, { opacity: b4 });
    }
    return svg(out);
  }

  /* ==== what you now know ====================================================== */
  function gfRecapMeter(cx, cy, size) {
    return ART.place(ART.kit.forcemeterSvg(2, "\u{1F34E}", ""), cx - size * 0.38, cy - size * 0.5, size * 0.76, size);
  }
  function gfRecapEarth(cx, cy, size) {
    return ART.place(ART.scene("gravity", 0), cx - size * 0.533, cy - size * 0.5, size * 1.067, size);
  }
  function gfRecapNewton(cx, cy, size) {
    return Tx(cx, cy + size * 0.34, "N", "lab", "middle", { "font-size": size, fill: P.gold });
  }
  function gfRecapFriction(cx, cy, size) {
    var base = cy + size * 0.34;
    return R(cx - size * 0.62, base, size * 1.24, size * 0.14, 4, "#C9A26B") +
      R(cx - size * 0.24, base - size * 0.42, size * 0.48, size * 0.42, 6, "#D9473F") +
      gfSaw(cx - size * 0.24, cx + size * 0.24, base, size * 0.12, 0, P.gold, 1);
  }
  /* the lesson's own rough-carpet track, with the block stopped at 2 marks.
     The card used the lesson's carpet emoji, which this machine draws as a ball
     of blue wool - not a rough surface to an eight-year-old. */
  function gfRecapCarpet(cx, cy, size) {
    return ART.place(ART.sim("friction", "draw", GF_SURF[2], 2), cx - size * 0.8, cy - size * 0.5, size * 1.6, size);
  }
  function gfRecapChart(cx, cy, size) {
    var base = cy + size * 0.42, tall = size * 0.8, w = size * 0.24, out = "";
    for (var k = 0; k < 3; k++) {
      var h = tall * GF_SURF[k].far / 9;
      out += R(cx + (k - 1.5) * (w + size * 0.07), base - h, w, h, 4, GF_SURF[k].fill, P.line, 2);
    }
    return out + L(cx - size * 0.62, base, cx + size * 0.62, base, P.line, 3);
  }

  var GF_RECAP = MK.recapKind([
    { beat: 0, at: "meter", title: "Forcemeter", sub: "measures a force", pic: gfRecapMeter },
    { beat: 0, at: "newtons", title: "Newtons", sub: "the unit of force", pic: gfRecapNewton },
    { beat: 1, at: "gravity", title: "Gravity", sub: "down, to the centre", pic: gfRecapEarth },
    { beat: 2, at: "friction", title: "Friction", sub: "makes moving harder", pic: gfRecapFriction },
    { beat: 2, at: "rough", title: "Rough surfaces", sub: "more friction, shorter slide", pic: gfRecapCarpet },
    { beat: 3, at: "chart", title: "Bar chart", sub: "ice 9, wood 6, carpet 2", pic: gfRecapChart }
  ], { goBeat: 3, goAt: "pattern" });

  var KINDS = {
    title: MK.titleKind({ sub: ["A forcemeter, and the pull in newtons", "Which way is down", "Rough and smooth: friction"] }),
    force: gfForceChapter,
    gravity: gfGravityChapter,
    friction: gfFrictionChapter,
    surfaces: gfSurfacesChapter,
    chart: gfChartChapter,
    recap: GF_RECAP
  };
