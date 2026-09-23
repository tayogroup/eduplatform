  /* ==== chapters: rock all around, helping or harming, and the recap ==========
     tools/lib/film-scenes/science-g2/rocks-and-the-earth-4.js.

     Rock all around is the lesson's last demo frame - "Roofs, walls, roads and
     worktops all began in a quarry, a mine or a river" - drawn as the street
     the lesson's home project sends the child out to look at: slate on the
     roof, stone in the wall, gravel on the path, then indoors for the marble
     floor and the chalk board, and last the brick, which is the one thing here
     that people make.

     Helping or harming is the lesson's "Land carer" sort, in its own items and
     its own words - its first harm is "dumping rubbish in a river", so the
     river and the rubbish are drawn rather than a bin emoji - and its
     misconception: a quarry is not only bad. The old
     quarry becoming a lake is drawn with two of the lesson's own scenes,
     ART.scene("extract", 0) and ART.scene("habitat", 0), its pond. */

  /* ---- the street --------------------------------------------------------------- */
  var RK_GY = 396;
  function rkStreet(t, o) {
    if (!(o > 0)) return "";
    var out = "";
    /* the gravel path */
    out += R(150, 402, 880, 34, 10, "#7E7E84", "#5B5B60", 2);
    for (var g = 0; g < 24; g++) {
      out += E(168 + g * 36 + RK_SCATTER[g] * 14, 410 + RK_SCATTER[(g + 7) % 24] * 18, 7, 4.5, g % 2 ? "#B4B4B8" : "#96969B");
    }
    /* the house, with a slate roof */
    out += R(320, 218, 260, RK_GY - 218, 4, "#C9A26B", "#8A6A3A", 3);
    out += R(320, 218, 260, 16, 4, "#DFBC8A", null, null, { opacity: 0.6 });
    out += R(424, 300, 62, RK_GY - 300, 5, "#6B4A2B", "#4A3320", 3);
    out += R(346, 246, 60, 52, 6, "#1E3A4C", "#4A3320", 3);
    out += Pth("M292,224 L450,118 L608,224 Z", "#44515D", "#232C35", 3);
    for (var r2 = 1; r2 < 5; r2++) {
      var u = r2 / 5;
      out += L(lerp(292, 450, u), lerp(224, 118, u), lerp(608, 450, u), lerp(224, 118, u), "#66737F", 3, { opacity: 0.75 });
    }
    /* the stone wall */
    for (var w = 0; w < 4; w++) {
      for (var b = 0; b < 5; b++) {
        out += R(654 + b * 56 + (w % 2 ? 0 : 12), 302 + w * 24, 46, 19, 6, w % 2 ? "#9A9A9E" : "#8A8A8E", "#63636A", 2);
      }
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function rkStreetPic(t, scene, k) {
    var cAround = sc(scene, 0, "around"), cEvery = sc(scene, 0, "everywhere"), cJobs = sc(scene, 0, "jobs");
    var cSlate = sc(scene, 1, "slate"), cStone = sc(scene, 1, "stone"), cGravel = sc(scene, 1, "gravel");
    var out = "";
    out += MK.glow(584, 238, 200, P.plum, on(t, cEvery, 0.8) * 0.6 * (1 - on(t, cSlate, 0.5)));
    out += rkStreet(t, on(t, cAround, 0.7));
    /* each part of the street, named and ringed one at a time */
    var so = on(t, cSlate, 0.4), wo = on(t, cStone, 0.4), go = on(t, cGravel, 0.4);
    /* the outline of the part being named stays gold and the ones already named
       fall back to a quarter, so three dashed boxes never shout together */
    var back = function (o, later) { return o * (later > 0 ? 0.25 : 1); };
    out += Pth("M292,224 L450,118 L608,224 Z", "none", P.gold, 4, { opacity: back(so, wo), "stroke-dasharray": "14 10" });
    out += MK.pill(450, 74, "slate on roofs", so, { size: 24, col: P.gold });
    out += R(648, 298, 284, 98, 10, "none", P.gold, 4, { opacity: back(wo, go), "stroke-dasharray": "14 10" });
    out += MK.pill(790, 254, "stone in walls", wo, { size: 24, col: P.gold });
    out += R(150, 402, 880, 34, 10, "none", P.gold, 4, { opacity: go, "stroke-dasharray": "14 10" });
    out += MK.leader(160, 372, 230, 404, on(t, cGravel, 0.6), P.gold);
    out += MK.pill(160, 356, "gravel on paths", go, { size: 24, col: P.gold });
    out += MK.pill(584, 68, "doing jobs", on(t, cJobs, 0.4) * rkOnly(t, scene, 0), { size: 26, col: P.plum });
    return out;
  }

  /* indoors: a marble floor and a chalk board */
  function rkIndoorPic(t, scene) {
    var cMarble = sc(scene, 2, "marble"), cChalk = sc(scene, 2, "chalk"), out = "";
    var mo = on(t, cMarble, 0.5), ys = [282, 312, 352, 404, 438], out2 = "";
    for (var row = 0; row < 4; row++) {
      var y0 = ys[row], y1 = ys[row + 1], half0 = 150 + row * 108, half1 = 150 + (row + 1) * 108;
      for (var col = 0; col < 5; col++) {
        var a0 = 584 - half0 + col * half0 * 0.4, a1 = 584 - half0 + (col + 1) * half0 * 0.4;
        var b0 = 584 - half1 + col * half1 * 0.4, b1 = 584 - half1 + (col + 1) * half1 * 0.4;
        out2 += Pth("M" + n2(a0 + 2) + "," + n2(y0) + " L" + n2(a1 - 2) + "," + n2(y0) + " L" + n2(b1 - 2) + "," + n2(y1) + " L" + n2(b0 + 2) + "," + n2(y1) + " Z",
          (row + col) % 2 ? "#E9ECF0" : "#D3DAE2", "#A9B6C2", 2);
        out2 += Pth("M" + n2((a0 + a1) / 2 - 20) + "," + n2((y0 + y1) / 2) + " q20," + n2(-(y1 - y0) * 0.22) + " 40,2", null, "#AEBAC6", 2, { opacity: 0.8 });
      }
    }
    out += G(out2, { opacity: mo });
    out += MK.pill(170, 252, "marble on floors", mo, { size: 24, col: P.gold });
    /* the board */
    /* the word is written in 0.85 s, so it is finished while the line is still
       being said rather than on the beat's last frame */
    var co = on(t, cChalk, 0.35), u = on(t, cChalk == null ? null : cChalk + 0.15, 0.85);
    out += G(R(408, 56, 384, 200, 12, "#1E2A22", "#6B4A2B", 10) + R(408, 236, 384, 20, 6, "#6B4A2B"), { opacity: co });
    /* the word written across it, one stroke at a time */
    if (co > 0 && u > 0) {
      /* the lesson's own word, r-o-c-k, written in chalk */
      var word = "M452,190 V126 q0,-22 30,-22" +
        " M534,158 a26,32 0 1,0 0.1,0" +
        " M652,134 a26,32 0 1,0 0,48" +
        " M700,102 V190 M700,160 L738,126 M700,160 L740,190";
      var dash = 760;
      out += Pth(word, null, "#F7F4EC", 9, { "stroke-dasharray": n2(dash), "stroke-dashoffset": n2(dash * (1 - u)), opacity: co });
    }
    out += G(MK.pic(764, 246, 64, ART.ICONS.chalk), { opacity: co });
    out += MK.pill(976, 150, "chalk on the board", co, { size: 24, col: P.gold });
    return out;
  }

  /* where all of it began: three sources above the street */
  function rkRiverBadge(cx, cy, r) {
    return C(cx, cy, r, "#2C6FA8", "#3B7FD1", 3) +
      Pth("M" + n2(cx - r * 0.7) + "," + n2(cy - r * 0.2) + " q" + n2(r * 0.35) + "," + n2(-r * 0.3) + " " + n2(r * 0.7) + ",0 q" + n2(r * 0.35) + "," + n2(r * 0.3) + " " + n2(r * 0.7) + ",0", null, "#7FC4EA", 4) +
      E(cx - r * 0.3, cy + r * 0.34, r * 0.24, r * 0.15, "#C6C6CA") + E(cx + r * 0.26, cy + r * 0.46, r * 0.2, r * 0.12, "#C6C6CA");
  }
  /* Each arrow lands ON the shrunken street below - the house wall, the slate
     roof, the gravel path - because an arrow into the dark beside it says only
     that something is down there. The river's arrow ends on the PATH: the
     lesson says gravel is "scooped from riverbeds" and that the wall's stone
     "came from a quarry", so an arrow from the river to the wall would teach
     the opposite. The path maps to x 324-852, y 416-436 once the street is
     scaled by 0.60 about (584, 436), and the wall to x 633-788, y 356-410: the
     tip is beyond the wall's right edge, so the line never crosses it either. */
  var RK_AIMS = [[440, 322], [516, 262], [820, 428]];
  function rkSourcesPic(t, scene) {
    var cAll = sc(scene, 3, "all"), cQ = sc(scene, 3, "quarry"), cM = sc(scene, 3, "mine"), cR = sc(scene, 3, "river");
    var out = G(rkStreet(t, 1), { transform: around(584, 436, 0.60) });
    out += MK.glow(584, 330, 108, P.plum, on(t, cAll, 0.8) * 0.6);
    var xs = [250, 584, 918], cues = [cQ, cM, cR], names = ["a quarry", "a mine", "a river"];
    for (var k = 0; k < 3; k++) {
      var p = popIn(t, cues[k], 0.4);
      if (p <= 0) continue;
      var cx = xs[k], cy = 96;
      var badge = k === 2 ? rkRiverBadge(cx, cy, 52) : C(cx, cy, 52, "#1B3A52", P.gold, 3) + Em(cx, cy, 54, k === 0 ? "⛏️" : "\u{1F573}️");
      out += MK.pop(badge, cx, cy, Math.min(p, 1.1));
      out += MK.pill(cx, cy + 82, names[k], Math.min(1, p), { size: 24, col: P.gold });
      /* 0.42 s all in: "a river" is the LAST phrase of the line, so a 0.9 s
         arrow was still 4/5 of the way down when the voice stopped */
      out += MK.arrow(cx, cy + 104, RK_AIMS[k][0], RK_AIMS[k][1], on(t, cues[k] == null ? null : cues[k] + 0.06, 0.36), P.gold, 7);
    }
    return out;
  }

  function rkBrickPic(t, scene) {
    var cBrick = sc(scene, 4, "brick"), cNot = sc(scene, 4, "not"), cMake = sc(scene, 4, "make"), out = "";
    out += G(Em(700, 214, 206, "\u{1F9F1}"), { transform: around(700, 214, Math.min(1.1, popIn(t, cBrick, 0.45))), opacity: Math.min(1, popIn(t, cBrick, 0.45)) });
    /* white, not the usual red: a red cross on an orange brick disappears */
    out += MK.cross(700, 214, 58, popIn(t, cNot, 0.45), "#FFFFFF");
    out += MK.pill(700, 374, "a brick is not rock", on(t, cNot, 0.5), { size: 28, col: P.bad, ink: P.muted });
    var mo = on(t, cMake, 0.4);
    out += G(Em(330, 222, 140, "\u{1F477}"), { opacity: mo });
    out += MK.arrow(416, 216, 566, 214, on(t, cMake == null ? null : cMake + 0.25, 0.6), P.gold, 8);
    out += MK.pill(330, 344, "people make bricks", mo, { size: 24, col: P.gold });
    return out;
  }

  function rkAroundChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k <= 1 ? rkStreetPic(t, scene, k) : k === 2 ? rkIndoorPic(t, scene) :
        k === 3 ? rkSourcesPic(t, scene) : rkBrickPic(t, scene);
    }
    var k = i - scene.first;
    if (k === 1) return svg(rkStreetPic(t, scene, 1));   /* the street carries on, unbroken */
    return svg(crossfade(t, i, scene, draw));
  }

  /* ---- helping or harming ---------------------------------------------------------- */

  function rkEnvironmentPic(t, scene) {
    var cEnv = sc(scene, 0, "environment"), cLand = sc(scene, 0, "land"), cWater = sc(scene, 0, "water"),
      cAir = sc(scene, 0, "air"), cLiving = sc(scene, 0, "living"), out = "";
    var eo = on(t, cEnv, 0.6);
    /* the air */
    out += R(60, 40, 1048, 118, 16, "#1C3A50", P.line, 2, { opacity: eo });
    out += G(E(250, 92, 54, 26, "#33566E") + E(300, 86, 40, 22, "#33566E") + E(880, 100, 58, 24, "#33566E"), { opacity: eo });
    /* the land */
    out += Pth("M60,300 q160,-70 320,-14 q180,52 340,-20 q170,-74 388,16 V400 H60 Z", "#3E8E4A", "#2C6B36", 3, { opacity: eo });
    out += R(60, 388, 1048, 34, 0, "#6B4A2B", null, null, { opacity: eo });
    /* the water */
    out += G(E(760, 350, 168, 46, "#2C6FA8", "#3B7FD1", 3) +
      Pth("M616,342 q42,-10 84,0 t84,0 t84,0", null, "#7FC4EA", 4, { opacity: 0.8 }), { opacity: eo });
    /* living things */
    out += G(Em(268, 300, 132, "\u{1F333}") + Em(430, 336, 62, "\u{1F407}") + Em(806, 264, 52, "\u{1F426}"), { opacity: eo });
    /* each word, as it is said */
    [[cAir, "air", 168, 96, [330, 96]], [cLand, "land", 150, 404, [336, 402]],
      [cWater, "water", 962, 246, [812, 330]], [cLiving, "living things", 470, 250, [330, 286]]].forEach(function (row) {
      var o = on(t, row[0], 0.4);
      if (o <= 0) return;
      out += MK.leader(row[2], row[3], row[4][0], row[4][1], on(t, row[0], 0.7), P.gold);
      out += MK.pill(row[2], row[3] - 30, row[1], Math.min(1, o), { size: 26, col: P.gold });
    });
    return out;
  }

  /* ---- rubbish going into a river -------------------------------------------
     The lesson's harm item is the ACT, not a bin: "dumping rubbish in a river"
     (content/lesson-9.py, the Land carer sort, "Rubbish poisons the water and
     the animals in it"). Windows draws the waste-basket emoji as a clean EMPTY
     wire bin, so a red cross under it says "a rubbish bin harms the land" -
     the opposite of the lesson, where tidying up is on the HELP side. The
     river and the rubbish are drawn instead. */
  function rkLitterPiece(n, cx, cy, s) {
    if (n === 0) {
      /* a crumpled sheet of paper */
      var pts = [[-0.90, -0.28], [-0.50, -0.92], [0.14, -0.76], [0.80, -0.94], [0.96, -0.14], [0.70, 0.56], [0.06, 0.96], [-0.70, 0.60]], d = "";
      for (var k = 0; k < pts.length; k++) d += (k ? " L" : "M") + n2(cx + pts[k][0] * s * 0.5) + "," + n2(cy + pts[k][1] * s * 0.5);
      return Pth(d + " Z", "#E6E3DA", "#A9A395", 2) +
        L(cx - s * 0.22, cy - s * 0.18, cx + s * 0.06, cy + s * 0.12, "#A9A395", 1.6) +
        L(cx + s * 0.10, cy - s * 0.26, cx + s * 0.26, cy + s * 0.06, "#A9A395", 1.6);
    }
    if (n === 1) {
      /* a plastic bottle */
      return R(cx - s * 0.30, cy - s * 0.30, s * 0.60, s * 0.82, s * 0.16, "#9FD8C6", "#4E8B79", 2) +
        R(cx - s * 0.13, cy - s * 0.56, s * 0.26, s * 0.30, s * 0.06, "#9FD8C6", "#4E8B79", 2) +
        R(cx - s * 0.17, cy - s * 0.70, s * 0.34, s * 0.16, s * 0.05, "#E8A54A", "#A97120", 2);
    }
    /* a tin can */
    return R(cx - s * 0.32, cy - s * 0.44, s * 0.64, s * 0.90, s * 0.10, "#C8CDD4", "#7F8791", 2) +
      R(cx - s * 0.32, cy - s * 0.08, s * 0.64, s * 0.20, 0, "#E36B5C", null, null, { opacity: 0.85 }) +
      E(cx, cy - s * 0.44, s * 0.32, s * 0.12, "#E4E8ED", "#7F8791", 2);
  }

  /* the river, with three pieces thrown into it. Each piece leaves at its own
     moment and is floating before the line ends, so the action finishes inside
     its beat. */
  function rkRiverLitter(t, cx, at, p) {
    var cy = 232, o = Math.min(1, p), out = "";
    out += G(E(cx, cy, 116, 36, "#2C6FA8", "#3B7FD1", 3) +
      Pth("M" + n2(cx - 90) + "," + n2(cy - 10) + " q22,-12 45,0 t45,0 t45,0", null, "#7FC4EA", 4, { opacity: 0.85 }) +
      Pth("M" + n2(cx - 66) + "," + n2(cy + 17) + " q19,-11 38,0 t38,0", null, "#7FC4EA", 3, { opacity: 0.55 }),
      { opacity: o });
    var lands = [[cx - 52, cy - 6], [cx + 8, cy + 6], [cx + 62, cy - 10]];
    for (var n = 0; n < 3; n++) {
      var born = at == null ? null : at + 0.28 + n * 0.22;
      if (born == null || t < born) continue;
      var u = clamp((t - born) / 0.6, 0, 1);
      var x = lerp(cx - 96 + n * 22, lands[n][0], u), y = lerp(102, lands[n][1], u) - Math.sin(Math.PI * u) * 34;
      out += G(rkLitterPiece(n, x, y, 40), { transform: "rotate(" + n2(-26 + 62 * u + n * 37) + "," + n2(x) + "," + n2(y) + ")" });
      if (u >= 1) out += MK.ripple(lands[n][0], lands[n][1], t, born + 0.6, "#CFE8F7");
    }
    return out;
  }

  /* the same thing small and still, for the recap card */
  function rkDumpMark(cx, cy, s) {
    return E(cx, cy + s * 0.16, s * 0.52, s * 0.19, "#2C6FA8", "#3B7FD1", 2) +
      Pth("M" + n2(cx - s * 0.36) + "," + n2(cy + s * 0.10) + " q" + n2(s * 0.12) + "," + n2(-s * 0.08) + " " + n2(s * 0.24) + ",0 t" + n2(s * 0.24) + ",0", null, "#7FC4EA", 2, { opacity: 0.8 }) +
      rkLitterPiece(0, cx - s * 0.30, cy + s * 0.08, s * 0.34) +
      rkLitterPiece(2, cx + s * 0.28, cy + s * 0.04, s * 0.32) +
      rkLitterPiece(1, cx - s * 0.01, cy - s * 0.12, s * 0.34);
  }

  /* three things people do, each with its mark */
  function rkDeedsPic(t, scene, k, mark) {
    /* the first harm is drawn, not an emoji: see rkRiverLitter above */
    var pics = k === 1 ? [null, "\u{1F4A8}", "\u{1F6E3}️"] : ["\u{1F333}", "♻️", "\u{1F6B0}"];
    var names = k === 1 ? ["rubbish in a river", "smoke", "concrete on a meadow"] : ["planting trees", "recycling", "clean streams"];
    var cues = k === 1 ? ["rubbish", "smoke", "meadow"] : ["trees", "recycling", "clean"];
    var last = k === 1 ? sc(scene, 1, "harm") : sc(scene, 2, "help");
    var xs = [250, 584, 918], out = "";
    for (var n = 0; n < 3; n++) {
      var at = sc(scene, k, cues[n]), p = popIn(t, at, 0.45);
      if (p <= 0) continue;
      if (k === 1 && n === 0) out += rkRiverLitter(t, xs[n], at, p);
      else out += G(Em(xs[n], 200, 140, pics[n]), { transform: around(xs[n], 200, Math.min(p, 1.1)), opacity: Math.min(1, p) });
      out += MK.pill(xs[n], 306, names[n], Math.min(1, p), { size: 22, col: P.line });
      var m = popIn(t, last == null ? null : last + n * 0.18, 0.4);
      if (mark === "cross") out += MK.cross(xs[n], 380, 32, m);
      else out += MK.tick(xs[n], 380, 32, m);
    }
    out += MK.pill(584, 66, k === 1 ? "these harm the environment" : "these help the environment", on(t, last, 0.5), { size: 28, col: mark === "cross" ? P.bad : P.good, ink: mark === "cross" ? P.bad : P.good });
    return out;
  }

  /* the old quarry that becomes a lake: the lesson's own two scenes */
  function rkQuarryLakePic(t, scene) {
    var cQuarry = sc(scene, 3, "quarry"), cBad = sc(scene, 3, "bad"), cOld = sc(scene, 3, "old"),
      cLake = sc(scene, 3, "lake"), cWild = sc(scene, 3, "wildlife"), out = "";
    var qo = on(t, cQuarry, 0.5), lo = on(t, cLake, 0.6);
    out += G(R(54, 122, 420, 272, 18, P.card, P.line, 2) + ART.place(ART.scene("extract", 0), 64, 132, 400, 250), { opacity: qo });
    out += MK.pill(264, 72, "a quarry", qo, { size: 26, col: P.line, ink: P.muted });
    out += MK.pill(264, 412, "not only bad", on(t, cBad, 0.4), { size: 24, col: P.line, ink: P.muted });
    out += MK.arrow(500, 258, 650, 258, on(t, cOld, 0.6), P.gold, 9);
    out += MK.pill(578, 200, "later", on(t, cOld, 0.4), { size: 22, col: P.gold });
    out += G(R(694, 122, 420, 272, 18, P.card, P.teal, 3) + ART.place(ART.scene("habitat", 0), 704, 132, 400, 250), { opacity: lo });
    out += MK.pill(904, 72, "a lake", lo, { size: 26, col: P.gold });
    out += MK.tick(736, 412, 23, popIn(t, cWild, 0.4));
    out += MK.pill(910, 412, "a home for wildlife", on(t, cWild, 0.4), { size: 24, col: P.good, ink: P.good });
    return out;
  }

  /* the question the lesson tells a child to ask */
  function rkAskPic(t, scene) {
    var cAsk = sc(scene, 4, "ask"), cLand = sc(scene, 4, "land"), cWater = sc(scene, 4, "water"),
      cAir = sc(scene, 4, "air"), cBetter = sc(scene, 4, "better"), cWorse = sc(scene, 4, "worse"), out = "";
    out += MK.bubble(384, 24, 400, 96, "Ask about this place:", on(t, cAsk, 0.5), 584, 150);
    var xs = [300, 584, 868], cues = [cLand, cWater, cAir], names = ["the land", "the water", "the air"];
    for (var k = 0; k < 3; k++) {
      var p = popIn(t, cues[k], 0.45);
      if (p <= 0) continue;
      var cx = xs[k], cy = 212, art = k === 0 ?
        C(cx, cy, 64, "#3E8E4A", "#2C6B36", 3) + Pth("M" + n2(cx - 44) + "," + n2(cy + 16) + " q" + n2(22) + "," + n2(-34) + " " + n2(44) + ",0 q" + n2(22) + "," + n2(-30) + " " + n2(44) + ",0", null, "#2C6B36", 5) :
        k === 1 ? C(cx, cy, 64, "#2C6FA8", "#3B7FD1", 3) + Pth("M" + n2(cx - 40) + "," + n2(cy) + " q" + n2(20) + "," + n2(-20) + " " + n2(40) + ",0 q" + n2(20) + "," + n2(20) + " " + n2(40) + ",0", null, "#7FC4EA", 5) :
        C(cx, cy, 64, "#3A6485", "#8FB6D2", 3) + G(E(cx - 14, cy, 34, 18, "#D7E7F2") + E(cx + 16, cy - 8, 26, 15, "#EAF3F9"));
      out += MK.pop(art, cx, cy, Math.min(p, 1.1));
      out += MK.pill(cx, cy + 92, names[k], Math.min(1, p), { size: 24, col: P.gold });
    }
    out += MK.tick(338, 404, 28, popIn(t, cBetter, 0.4));
    out += MK.pill(388, 404, "better?", on(t, cBetter, 0.4), { size: 26, anchor: "start", col: P.good });
    out += MK.cross(700, 404, 28, popIn(t, cWorse, 0.4));
    out += MK.pill(750, 404, "worse?", on(t, cWorse, 0.4), { size: 26, anchor: "start", col: P.bad });
    return out;
  }

  function rkHelpingChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k === 0 ? rkEnvironmentPic(t, scene) : k === 1 ? rkDeedsPic(t, scene, 1, "cross") :
        k === 2 ? rkDeedsPic(t, scene, 2, "tick") : k === 3 ? rkQuarryLakePic(t, scene) : rkAskPic(t, scene);
    }
    return svg(crossfade(t, i, scene, draw));
  }

  /* ---- what you now know ----------------------------------------------------------- */
  var RK_RECAP = MK.recapKind([
    { beat: 0, at: "kinds", title: "Many kinds", sub: "granite, chalk, pumice",
      pic: function (cx, cy, size) {
        return rkRock("granite", cx - size * 0.38, cy + size * 0.06, size * 0.30, 1, { show: 1 }) +
          rkRock("chalk", cx + size * 0.02, cy - size * 0.12, size * 0.26, 1, { show: 1 }) +
          rkRock("pumice", cx + size * 0.40, cy + size * 0.08, size * 0.28, 1, { show: 1 });
      } },
    { beat: 0, at: "testing", title: "Testing finds them", sub: "scratch, water, hand lens",
      pic: function (cx, cy, size) { return MK.pic(cx - size * 0.32, cy, size * 0.66, ART.ICONS.coin) + Em(cx + size * 0.32, cy, size * 0.62, "\u{1F50D}"); } },
    { beat: 1, at: "taken", title: "Out of the Earth", sub: "quarries, mines, riverbeds", pic: "⛏️" },
    { beat: 1, at: "use", title: "Rock does jobs", sub: "roofs, walls, paths, floors", pic: "\u{1F3E0}" },
    { beat: 2, at: "changes", title: "We change the Earth", sub: "the land, water and air", pic: "\u{1F30D}" },
    { beat: 2, at: "help", title: "Help, or harm", sub: "trees help; rubbish harms",
      pic: function (cx, cy, size) { return Em(cx - size * 0.34, cy, size * 0.66, "\u{1F333}") + rkDumpMark(cx + size * 0.34, cy, size * 0.66); } }
  ], { goBeat: 2, goAt: "harm" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Six kinds of rock, and how to test them", "Quarries, mines and riverbeds", "How what we do helps or harms the land"] }),
    kinds: rkKindsChapter, testing: rkTestingChapter, where: rkWhereChapter,
    around: rkAroundChapter, helping: rkHelpingChapter, recap: RK_RECAP
  };
