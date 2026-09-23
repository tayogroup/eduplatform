  /* ==== chapters: comparing places, looking after habitats, and the recap =====
     tools/lib/film-scenes/science-g2/habitats-4.js. */

  /* a rounded panel of the film's own, with everything inside it clipped to it */
  function hbPanel(id, x, y, w, h, inner, edge) {
    return el("clipPath", { id: id }, R(x, y, w, h, 20)) +
      G(inner, { "clip-path": "url(#" + id + ")" }) + R(x, y, w, h, 20, "none", edge || P.line, 2);
  }

  /* ---- hot, cold, wet, dry -----------------------------------------------------
     The words the lesson's "Hot, cold, wet, dry" step compares places with, as
     six cards that fill in as they are said; then its own garden and car park;
     then the block graph of the four places its class counted. */
  /* one contrast to a column - hot over cold, wet over dry, many over few -
     so the grid fills in the order the two beats say the words */
  var HB_CHIP = [
    { cx: 264, cy: 135, word: "hot", pic: "☀️", col: P.gold },
    { cx: 264, cy: 305, word: "cold", pic: "❄️", col: "#7FC4EA" },
    { cx: 904, cy: 135, word: "many", pic: null, col: P.good },
    { cx: 584, cy: 135, word: "wet", pic: "\u{1F4A7}", col: "#7FC4EA" },
    { cx: 584, cy: 305, word: "dry", pic: null, col: P.accent },
    { cx: 904, cy: 305, word: "few", pic: null, col: P.muted }
  ];
  function hbChipArt(c, k, o) {
    if (k === 2) return MK.pic(c.cx - 116, c.cy - 16, 44, "\u{1F33F}") + MK.pic(c.cx - 78, c.cy - 34, 44, "\u{1F33F}") +
      MK.pic(c.cx - 100, c.cy + 24, 40, "\u{1F41E}") + MK.pic(c.cx - 56, c.cy + 18, 40, "\u{1F41B}");
    if (k === 5) return MK.pic(c.cx - 98, c.cy - 22, 48, "\u{1F33F}") + MK.pic(c.cx - 84, c.cy + 26, 40, "\u{1F41E}");
    if (k === 4) return hbDrop(c.cx - 84, c.cy + 18, 20, 1) + MK.cross(c.cx - 84, c.cy + 4, 30, 1, P.bad);
    return MK.pic(c.cx - 84, c.cy, 66, c.pic);
  }
  function hbCompareWords(t, scene) {
    var cComp = sc(scene, 0, "compare"), frame = on(t, cComp, 0.5), out = "";
    var ats = [sc(scene, 0, "hot"), sc(scene, 0, "cold"), sc(scene, 1, "many"),
      sc(scene, 0, "wet"), sc(scene, 0, "dry"), sc(scene, 1, "few")];
    for (var k = 0; k < 6; k++) {
      var c = HB_CHIP[k], p = popIn(t, ats[k], 0.42), lit = Math.min(1, p);
      var x = c.cx - 150, y = c.cy - 75;
      out += G(R(x, y, 300, 150, 20, lit > 0 ? "#1B3A52" : P.card, lit > 0 ? c.col : P.line, lit > 0 ? 3 : 2) +
        (lit > 0 ? hbChipArt(c, k, lit) + Tx(c.cx + 42, c.cy + 14, c.word, "lab big", "middle") : ""),
        { opacity: frame * (0.34 + 0.66 * lit), transform: around(c.cx, c.cy, 0.96 + 0.04 * Math.min(1, p)) });
    }
    return out;
  }

  /* beat 2: a garden is wet after rain; a car park is dry */
  function hbComparePlaces(t, scene) {
    var c = function (n) { return sc(scene, 2, n); };
    var cGar = c("garden"), cRain = c("rain"), cPl = c("plants"), cCar = c("car"), cDry = c("dry"), cFew = c("few");
    var go = Math.min(1, popIn(t, cGar, 0.45)), co = Math.min(1, popIn(t, cCar, 0.45)), out = "";
    /* the garden */
    var gin = R(50, 40, 500, 160, 0, "#BFE3F5") + R(50, 200, 500, 126, 0, "#3E8E4A");
    gin += Em(160, 150, 116, "\u{1F333}");
    var np = tally(t, cPl, 6, 0.9), xs = [96, 176, 256, 336, 416, 490];
    for (var k = 0; k < 6; k++) {
      if (k >= np) continue;
      var pp = clamp((t - cPl) / 0.9 * 5 - k + 1, 0, 1);
      out += "";
      gin += k % 2 ? hbFlower(xs[k], 214, 58 * pp, 1, k === 3 ? "#F0806F" : "#F4C95D") : hbTuft(xs[k], 216, 46 * pp, 1);
    }
    if (cRain != null && t >= cRain) {
      for (var r = 0; r < 9; r++) {
        var ph = ((t - cRain) * 0.9 + HB_SCATTER[r]) % 1;
        gin += hbDrop(74 + r * 54, 50 + ph * 168, 8, 0.85);
      }
    }
    out += G(hbPanel("hbGarden", 50, 40, 500, 286, gin), { opacity: go });
    out += Tx(300, 362, "A garden", "lab big", "middle", { opacity: go });
    out += MK.pill(190, 406, "wet", on(t, cRain, 0.4), { size: 24, col: "#7FC4EA" });
    out += MK.pill(390, 406, "many plants", on(t, cPl, 0.4), { size: 24, col: P.good });
    /* the car park */
    var cin = R(618, 40, 500, 286, 0, "#6E737A");
    cin += R(660, 120, 10, 180, 0, "#E8ECEF", null, null, { opacity: 0.8 }) +
      R(830, 120, 10, 180, 0, "#E8ECEF", null, null, { opacity: 0.8 }) +
      R(1000, 120, 10, 180, 0, "#E8ECEF", null, null, { opacity: 0.8 });
    cin += Em(760, 210, 116, "\u{1F697}");
    cin += Pth("M1046,326 L1052,236 L1060,326", null, "#3D4147", 4);
    cin += hbTuft(1053, 318, 34, 1, "#5E8F4A");
    out += G(hbPanel("hbCarPark", 618, 40, 500, 286, cin), { opacity: co });
    out += Tx(868, 362, "A car park", "lab big", "middle", { opacity: co });
    out += MK.pill(760, 406, "dry", on(t, cDry, 0.4), { size: 24, col: P.accent });
    out += MK.pill(940, 406, "few plants", on(t, cFew, 0.4), { size: 24, col: P.muted });
    out += C(1053, 296, 34, "none", P.gold, 4, { opacity: on(t, cFew, 0.5) });
    return out;
  }

  /* beats 3 and 4: what the class counted, and the pattern in it */
  var HB_G = { base: 356, bw: 78, bh: 30, gap: 4 };
  var HB_PLACE = [
    { cx: 330, n: 8, label: "pond", pic: "\u{1F438}" },
    { cx: 520, n: 6, label: "garden", pic: "\u{1F33F}" },
    { cx: 710, n: 4, label: "park", pic: "\u{1F3DE}️" },
    { cx: 900, n: 1, label: "car park", pic: "\u{1F697}" }
  ];
  function hbCompareGraph(t, scene) {
    var cClass = sc(scene, 3, "class"), cFour = sc(scene, 3, "four"), cPond = sc(scene, 3, "pond"), cCar = sc(scene, 3, "car");
    var cWet = sc(scene, 4, "wetter"), cPlants = sc(scene, 4, "plants"), cAni = sc(scene, 4, "animals");
    var g = HB_G, out = "", ax = on(t, cClass, 0.5);
    out += L(250, 358, 980, 358, P.line, 4, { opacity: ax });
    var fill = cClass == null ? 0 : clamp((t - cClass) / 1.6, 0, 1) * 19, offs = [0, 8, 14, 18];
    for (var k = 0; k < 4; k++) {
      var p = HB_PLACE[k], up = clamp(fill - offs[k], 0, p.n);
      var lit = (k === 0 && cPond != null && t >= cPond && (cCar == null || t < cCar)) || (k === 3 && cCar != null && t >= cCar);
      out += hbColumn(p.cx, g.base, up, g.bw, g.bh, g.gap, P.teal, lit ? 1 : 0.9);
      out += MK.pop(MK.pic(p.cx, 388, 42, p.pic), p.cx, 388, popIn(t, cClass, 0.4));
      out += Tx(p.cx, 428, p.label, "lab mid muted readable", "middle", { opacity: ax });
      if (up >= p.n - 0.01) {
        var top = hbTop(g.base, p.n, g.bh, g.gap);
        if (lit) out += R(p.cx - g.bw / 2 - 5, top - 5, g.bw + 10, p.n * (g.bh + g.gap) - g.gap + 10, 12, "none", P.gold, 4);
        out += Tx(p.cx, top - 12, String(p.n), "lab big" + (lit ? " gold" : " muted"), "middle", { opacity: ax });
      }
    }
    /* four places */
    out += R(258, 364, 714, 74, 14, "none", P.gold, 3, { "stroke-dasharray": "15 10", opacity: on(t, cFour, 0.5) * hbOnly(t, scene, 3) });
    /* the pattern: wetter, more plants, more animals */
    var wo = on(t, cWet, 0.5), po = on(t, cPlants, 0.5);
    out += hbDrop(292, 58, 15, wo) + hbDrop(482, 126, 13, wo);
    out += hbDrop(900, 262, 13, wo) + MK.cross(900, 250, 24, popIn(t, cWet == null ? null : cWet + 0.35, 0.35), P.bad);
    out += MK.pop(MK.pic(370, 50, 40, "\u{1F33F}"), 370, 50, popIn(t, cPlants, 0.4));
    out += MK.pop(MK.pic(560, 118, 36, "\u{1F33F}"), 560, 118, popIn(t, cPlants == null ? null : cPlants + 0.2, 0.4));
    var ao = on(t, cAni, 0.7);
    if (ao > 0) out += MK.arrow(378, 92, lerp(378, 856, ao), lerp(92, 312, ao), 1, P.gold, 6);
    out += MK.pill(145, 130, "wetter", wo, { size: 24, col: "#7FC4EA" });
    out += MK.pill(145, 206, "more plants", po, { size: 24, col: P.good });
    out += MK.pill(145, 282, "more animals", on(t, cAni, 0.4), { size: 24, col: P.gold });
    return out;
  }

  function hbCompareChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(hbCompareWords(t, scene));
    if (k === 1) return svg(hbCompareWords(t, scene));
    if (k === 2) {
      var u = into(t, i);
      return svg(G(hbComparePlaces(t, scene), { opacity: u }) + (u < 1 ? G(hbCompareWords(t, scene), { opacity: 1 - u }) : ""));
    }
    if (k === 3) {
      var v = into(t, i);
      return svg(G(hbCompareGraph(t, scene), { opacity: v }) + (v < 1 ? G(hbComparePlaces(t, scene), { opacity: 1 - v }) : ""));
    }
    return svg(hbCompareGraph(t, scene));
  }

  /* ---- looking after habitats --------------------------------------------------
     The five pictures of the lesson's "Looking after habitats" step: rubbish in
     the pond, a forest cut down, flowers planted for bees, a log pile for
     beetles, and what people do, for better or for worse. */
  var HB_CARE_POND = hbBox(60, 45, 540);

  function hbCareRubbish(t, scene) {
    var cRub = sc(scene, 0, "rubbish"), cPond = sc(scene, 0, "pond"), cHurt = sc(scene, 0, "hurt");
    var b = HB_CARE_POND, out = hbCard(b, 0, 1);
    /* the litter falls in */
    var fall = on(t, cRub, 1.1);
    if (fall > 0) {
      out += MK.pic(180, lerp(64, 300, ease(fall)), 84, ART.ICONS.bottle, { transform: "rotate(" + n2(-24 + 60 * fall) + " 180 " + n2(lerp(64, 300, ease(fall))) + ")" });
      var f2 = on(t, cRub == null ? null : cRub + 0.3, 1.1);
      if (f2 > 0) out += MK.pic(420, lerp(60, 320, ease(f2)), 76, ART.ICONS.bottle, { transform: "rotate(" + n2(40 - 70 * f2) + " 420 " + n2(lerp(60, 320, ease(f2))) + ")", opacity: 0.95 });
    }
    /* the pond goes murky */
    var murk = on(t, cPond, 0.8);
    if (murk > 0) out += R(60, hbY(b, 130), b.w, hbY(b, 200) - hbY(b, 130), 0, "#4A4A28", null, null, { opacity: 0.45 * murk });
    out += MK.pill(700, 96, "litter", on(t, cRub, 0.4), { size: 28, anchor: "start", col: P.bad });
    /* the frogs and the fish it hurts */
    var hp = popIn(t, cHurt, 0.45);
    if (hp > 0) {
      out += MK.pop(MK.pic(760, 260, 88, "\u{1F438}"), 760, 260, hp);
      out += MK.pop(MK.pic(980, 260, 88, "\u{1F41F}"), 980, 260, hp);
      out += MK.cross(806, 220, 28, popIn(t, cHurt == null ? null : cHurt + 0.3, 0.35), P.bad);
      out += MK.cross(1026, 220, 28, popIn(t, cHurt == null ? null : cHurt + 0.45, 0.35), P.bad);
    }
    return out;
  }

  function hbCareForest(t, scene) {
    var cCut = sc(scene, 1, "cut"), cDeer = sc(scene, 1, "deer"), cBirds = sc(scene, 1, "birds"), cLose = sc(scene, 1, "lose");
    var b = HB_CARE_POND, cut = on(t, cCut, 1.0), out = "";
    out += G(hbCard(b, 2, 1), { opacity: 1 - 0.75 * cut });
    if (cut > 0) {
      var inner = R(b.x, b.y, b.w, b.h * 0.65, 0, "#A9D3B6") + R(b.x, b.y + b.h * 0.65, b.w, b.h * 0.35, 0, "#7A6242");
      var st = [140, 250, 360, 470];
      for (var k = 0; k < st.length; k++) {
        var sp = clamp(cut * 4 - k, 0, 1);
        inner += R(st[k] - 20 * sp, b.y + b.h * 0.65 - 6, 40 * sp, 30 * sp, 6, "#6B4A2B", "#4A3320", 2);
      }
      inner += G(MK.pic(210, b.y + b.h * 0.79, 96, ART.ICONS.wood) + MK.pic(438, b.y + b.h * 0.88, 88, ART.ICONS.wood), { opacity: clamp(cut * 2 - 1, 0, 1) });
      out += G(hbPanel("hbCleared", b.x, b.y, b.w, b.h, inner), { opacity: cut });
    }
    out += MK.pop(MK.pic(760, 210, 108, "\u{1F98C}"), 760, 210, popIn(t, cDeer, 0.45));
    out += MK.pop(MK.pic(990, 210, 96, "\u{1F426}"), 990, 210, popIn(t, cBirds, 0.45));
    out += MK.cross(812, 166, 28, popIn(t, cLose, 0.35), P.bad);
    out += MK.cross(1038, 166, 28, popIn(t, cLose == null ? null : cLose + 0.2, 0.35), P.bad);
    out += MK.pill(875, 340, "no habitat", on(t, cLose, 0.4), { size: 26, col: P.bad });
    return out;
  }

  function hbCareHelp(t, scene) {
    var cFl = sc(scene, 2, "flowers"), cBee = sc(scene, 2, "bees"), cLog = sc(scene, 2, "logs"), cBeet = sc(scene, 2, "beetles");
    var out = R(60, 70, 500, 260, 20, P.card, P.line, 2) + R(608, 70, 500, 260, 20, P.card, P.line, 2);
    out += R(80, 286, 460, 32, 8, "#6B4A2B");
    var n = tally(t, cFl, 5, 1.0), xs = [130, 210, 290, 370, 450];
    for (var k = 0; k < 5; k++) {
      if (k >= n) continue;
      var p = clamp((t - cFl) / 1.0 * 4 - k + 1, 0, 1);
      out += hbFlower(xs[k], 288, 88 * ease(p), 1, k === 1 || k === 3 ? "#F0806F" : "#F4C95D");
    }
    var bp = popIn(t, cBee, 0.45);
    out += MK.pop(MK.pic(320, 136 + 10 * Math.sin(t * 2.4), 84, "\u{1F41D}"), 320, 136, bp);
    out += MK.tick(534, 96, 24, popIn(t, cBee == null ? null : cBee + 0.3, 0.35));
    out += Tx(310, 360, "flowers for bees", "lab big", "middle", { opacity: on(t, cFl, 0.5) });
    /* the log pile */
    var lg = tally(t, cLog, 3, 0.9), lp = [[780, 252], [928, 252], [854, 168]];
    for (var q = 0; q < 3; q++) {
      if (q >= lg) continue;
      var u = clamp((t - cLog) / 0.9 * 2 - q + 1, 0, 1);
      out += MK.pop(MK.pic(lp[q][0], lp[q][1], 140, ART.ICONS.wood), lp[q][0], lp[q][1], Math.min(1.08, u * 1.5));
    }
    out += MK.pop(MK.pic(854, 120, 88, ART.ICONS.beetle), 854, 120, popIn(t, cBeet, 0.45));
    out += MK.pop(MK.pic(716, 292, 72, ART.ICONS.woodlouse), 716, 292, popIn(t, cBeet == null ? null : cBeet + 0.25, 0.45));
    out += MK.tick(1082, 96, 24, popIn(t, cBeet == null ? null : cBeet + 0.4, 0.35));
    out += Tx(858, 360, "a log pile", "lab big", "middle", { opacity: on(t, cLog, 0.5) });
    return out;
  }

  /* the people of "what people do": three of them, one emoji each */
  var HB_PEOPLE = [[492, 170, 104, "\u{1F9D2}"], [584, 158, 116, "\u{1F9D1}"], [676, 170, 104, "\u{1F467}"]];
  function hbCarePeople(t, scene) {
    var cPe = sc(scene, 3, "people"), cBet = sc(scene, 3, "better"), cWor = sc(scene, 3, "worse"), cSci = sc(scene, 3, "science");
    var out = "";
    /* people, one emoji each: a group joined into one emoji has no single tone */
    for (var k = 0; k < HB_PEOPLE.length; k++) {
      var q = HB_PEOPLE[k], pk = popIn(t, cPe == null ? null : cPe + k * 0.14, 0.45);
      out += MK.pop(MK.pic(q[0], q[1], q[2], q[3]), q[0], q[1], pk);
    }
    /* for worse */
    var wo = on(t, cWor, 0.5);
    out += G(MK.pic(196, 160, 132, ART.ICONS.bottle) + MK.pic(330, 162, 122, "\u{1FA93}"), { opacity: 0.3 + 0.7 * wo });
    out += MK.cross(264, 300, 44, popIn(t, cWor, 0.4), P.bad);
    out += Tx(264, 392, "for worse", "lab big bad", "middle", { opacity: wo });
    /* for better */
    var bo = on(t, cBet, 0.5);
    out += G(R(806, 242, 200, 12, 6, "#6B4A2B") + hbFlower(866, 242, 122, 1) + MK.pic(982, 188, 128, ART.ICONS.wood), { opacity: 0.3 + 0.7 * bo });
    out += MK.tick(918, 320, 44, popIn(t, cBet, 0.4));
    out += Tx(918, 392, "for better", "lab big good", "middle", { opacity: bo });
    /* science shows us how */
    var so = popIn(t, cSci, 0.45);
    out += MK.glow(584, 330, 110, P.teal, on(t, cSci, 0.6) * (0.6 + 0.4 * breathe(t)));
    out += MK.pop(MK.pic(584, 332, 104, "\u{1F50D}"), 584, 332, so);
    out += Tx(584, 418, "Science shows us how", "lab big", "middle", { opacity: on(t, cSci, 0.5) });
    return out;
  }

  function hbCareChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k === 0 ? hbCareRubbish(t, scene) : k === 1 ? hbCareForest(t, scene) :
        k === 2 ? hbCareHelp(t, scene) : hbCarePeople(t, scene);
    }
    return svg(crossfade(t, i, scene, draw));
  }

  /* ---- what you now know ----------------------------------------------------- */
  var HB_RECAP = MK.recapKind([
    { beat: 0, at: "habitat", title: "Habitat", sub: "where it naturally lives", pic: "\u{1F33F}" },
    { beat: 0, at: "suits", title: "Each one suits", sub: "webbed feet, thick fur", pic: "✅" },
    { beat: 1, at: "compare", title: "Compare places", sub: "hot, cold, wet, dry", pic: "\u{1F321}️" },
    { beat: 2, at: "graph", title: "Block graph", sub: "the most and the least", pic: "\u{1F4CA}" },
    { beat: 3, at: "changes", title: "Look after them", sub: "what we do changes them", pic: "\u{1F49A}" }
  ], { goBeat: 3, goAt: "look" });

  var KINDS = {
    title: MK.titleKind({ sub: ["A pond, a desert, a forest and the icy Arctic", "What lives in each, and why it suits it", "Counting, comparing, and looking after them"] }),
    what: hbWhatChapter, pond: hbPondChapter, desert: hbDesertChapter,
    count: hbCountChapter, compare: hbCompareChapter, care: hbCareChapter, recap: HB_RECAP
  };
