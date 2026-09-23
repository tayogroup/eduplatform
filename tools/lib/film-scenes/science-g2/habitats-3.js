  /* ==== chapters: the desert and the Arctic, and counting and graphing ========
     tools/lib/film-scenes/science-g2/habitats-3.js. */

  /* ---- the desert and the Arctic ---------------------------------------------
     The lesson's own desert and Arctic, each with the animals it draws in them,
     then the camel and the polar bear alone for what suits them; and last all
     four habitats together, because each animal suits its own place. */
  var HB_D_CARD = hbBox(60, 45, 540);
  var HB_D_LIVE = [
    { spot: "desCamel", r: 28, text: "Camels", pic: "\u{1F42A}" },
    { spot: "desLizard", r: 20, text: "Lizards", pic: "\u{1F98E}" },
    { spot: "desCactus", r: 26, text: "Cactus plants", pic: "\u{1F335}" }
  ];
  var HB_A_LIVE = [
    { spot: "arcBear", r: 30, text: "Polar bears", pic: null },
    { spot: "arcSeal", r: 26, text: "Seals", pic: null }
  ];

  /* beat 0: a desert is hot and dry */
  function hbDesertCard(t, scene) {
    var cHot = sc(scene, 0, "hot"), cDry = sc(scene, 0, "dry");
    var names = ["camels", "lizards", "cactus"], b = HB_D_CARD, out = hbCard(b, 1, 1);
    var ats = names.map(function (n) { return sc(scene, 0, n); });
    /* hot: the Sun the lesson draws in its desert, lit */
    var sun = hbAt(b, "desSun"), ho = on(t, cHot, 0.5);
    out += MK.glow(sun[0], sun[1], 92, P.gold, ho * (0.7 + 0.3 * breathe(t)));
    out += hbSun(662, 92, 22, popIn(t, cHot, 0.4), t);
    out += MK.pill(700, 86, "hot", on(t, cHot, 0.4), { size: 28, anchor: "start", col: P.gold });
    /* dry: no water here */
    var dp = popIn(t, cDry, 0.45);
    out += hbDrop(872, 98, 18, Math.min(1, dp));
    out += MK.cross(872, 88, 30, popIn(t, cDry == null ? null : cDry + 0.2, 0.4));
    out += MK.pill(916, 86, "dry", Math.min(1, dp), { size: 28, anchor: "start", col: P.accent });
    var rows = HB_D_LIVE.map(function (r, k) { return { text: r.text, at: ats[k] }; });
    out += MK.list(680, 200, rows, t, { lh: 68, cls: "lab big" });
    for (var k = 0; k < 3; k++) {
      var off = k + 1 < 3 ? on(t, ats[k + 1], 0.5) : 0;
      out += hbRing(b, HB_D_LIVE[k].spot, HB_D_LIVE[k].r, on(t, ats[k], 0.4) * (1 - off));
      out += hbSeen(b, HB_D_LIVE[k].spot, HB_D_LIVE[k].r, off);
      out += MK.pop(MK.pic(1020, 200 + k * 68, 48, HB_D_LIVE[k].pic), 1020, 200 + k * 68, popIn(t, ats[k], 0.4));
    }
    return out;
  }

  /* beat 1: a camel can go for days without water */
  function hbDesertCamel(t, scene) {
    var cCam = sc(scene, 1, "camel"), cDays = sc(scene, 1, "days"), cWat = sc(scene, 1, "water");
    var out = R(120, 356, 460, 44, 22, "#E0B86A");
    out += G(Em(340, 250, 250, "\u{1F42A}"), { transform: around(340, 360, 0.7 + 0.3 * Math.min(1, popIn(t, cCam, 0.5))), opacity: Math.min(1, popIn(t, cCam, 0.5)) });
    /* for days: five days of Sun, one after another */
    var n = tally(t, cDays, 5, 1.2);
    for (var k = 0; k < 5; k++) {
      if (k >= n) continue;
      var x = 640 + k * 100, p = clamp((t - cDays) / 1.2 * 4 - k + 1, 0, 1);
      out += hbSun(x, 152, 24, Math.min(1, p * 2), t);
      out += Tx(x, 226, "day " + (k + 1), "lab mid muted", "middle", { opacity: Math.min(1, p * 2) });
    }
    /* without water: none at all */
    var wp = popIn(t, cWat, 0.45);
    out += hbDrop(840, 330, 34, Math.min(1, wp));
    out += MK.cross(840, 306, 52, popIn(t, cWat == null ? null : cWat + 0.25, 0.4), P.bad);
    return out;
  }

  /* beat 2: the Arctic is icy and very cold */
  function hbArcticCard(t, scene) {
    var cIcy = sc(scene, 2, "icy"), cCold = sc(scene, 2, "cold");
    var names = ["bears", "seals"], b = HB_D_CARD, out = hbCard(b, 3, 1);
    var ats = names.map(function (n) { return sc(scene, 2, n); });
    var io = on(t, cIcy, 0.5);
    out += hbRing(b, "arcSnowA", 20, io) + hbRing(b, "arcSnowB", 20, io);
    out += MK.pop(Em(676, 92, 56, "❄️"), 676, 92, popIn(t, cIcy, 0.42));
    out += MK.pill(716, 86, "icy", on(t, cIcy, 0.4), { size: 28, anchor: "start", col: "#7FC4EA" });
    /* very cold: a frost edge round the lesson's own Arctic */
    var co = on(t, cCold, 0.5);
    out += R(b.x - 9, b.y - 9, b.w + 18, b.h + 18, 18, "none", "#7FC4EA", 4, { opacity: co, "stroke-dasharray": "14 10" });
    out += MK.pill(876, 86, "very cold", Math.min(1, popIn(t, cCold, 0.45)), { size: 28, anchor: "start", col: "#7FC4EA" });
    var pics = [ART.ICONS.polarbear, ART.ICONS.seal];
    var rows = HB_A_LIVE.map(function (r, k) { return { text: r.text, at: ats[k] }; });
    out += MK.list(680, 220, rows, t, { lh: 92, cls: "lab big" });
    for (var k = 0; k < 2; k++) {
      var off = k + 1 < 2 ? on(t, ats[k + 1], 0.5) : 0;
      out += hbRing(b, HB_A_LIVE[k].spot, HB_A_LIVE[k].r, on(t, ats[k], 0.4) * (1 - off));
      out += hbSeen(b, HB_A_LIVE[k].spot, HB_A_LIVE[k].r, off);
      out += MK.pop(MK.pic(1030, 220 + k * 92, 74, pics[k]), 1030, 220 + k * 92, popIn(t, ats[k], 0.4));
    }
    return out;
  }

  /* beat 3: a polar bear's thick fur keeps it warm */
  function hbArcticBear(t, scene) {
    var cBear = sc(scene, 3, "bear"), cFur = sc(scene, 3, "fur"), cWarm = sc(scene, 3, "warm");
    /* the kit's polar bear drawn at 330 puts its own body ellipse here, so the
       fur sits ON the bear instead of in a ring round the whole picture */
    var BX = 465, BY = 258, BRX = 119, BRY = 67;
    var out = R(220, 348, 520, 46, 23, "#EAF4FA");
    out += E(268, 344, 46, 16, "#DDEFF7") + E(690, 346, 54, 18, "#DDEFF7");
    var wo = on(t, cWarm, 0.6);
    out += MK.glow(BX, BY, 152, P.accent, wo * (0.65 + 0.35 * breathe(t)));
    /* thick fur: a deep white coat round the bear's own body, drawn as a ring
       of soft tufts so it reads as fur rather than as spines */
    var fo = on(t, cFur, 0.5);
    if (fo > 0) {
      out += E(BX, BY, BRX + 13, BRY + 13, "none", "#FFFFFF", 20, { opacity: 0.22 * fo });
      for (var k = 0; k < 30; k++) {
        var a = k * Math.PI / 15 + 0.1, s = 1 + HB_SCATTER[k % 12] * 0.18;
        out += C(BX + (BRX + 9) * Math.cos(a), BY + (BRY + 9) * Math.sin(a), 15 * s, "#FFFFFF", null, null, { opacity: 0.9 * fo });
      }
    }
    var bp = popIn(t, cBear, 0.5);
    out += MK.pop(MK.pic(470, 232, 330, ART.ICONS.polarbear), 470, 232, bp);
    /* the leader lands on a tuft of the ring that is actually VISIBLE: the head
       is drawn over the ring's whole right side, so a target there sat on the
       bear's face beside its eye. (BX - 27, BY - 74) is the tuft at the top of
       the ring, left of the head and clear of the body; the pill sits high
       enough that the line to it passes over the ear rather than through it. */
    out += hbLabel(t, 760, 104, "thick fur", cFur, [BX - 27, BY - 74], cWarm == null || t < cWarm, 28);
    out += hbLabel(t, 760, 306, "warm", cWarm, [BX + 36, BY + 26], cWarm != null && t >= cWarm, 28);
    return out;
  }

  /* beat 4: different habitats hold different animals, and each one suits */
  var HB_D_KEY = ["pondFrog", "desCamel", "forDeer", "arcBear"];
  function hbDesertAll(t, scene) {
    var cHab = sc(scene, 4, "habitats"), cAni = sc(scene, 4, "animals"), cSuit = sc(scene, 4, "suits");
    var nC = tally(t, cHab, 4, 1.0), nA = tally(t, cAni, 4, 1.0), nT = tally(t, cSuit, 4, 1.0), out = "";
    for (var k = 0; k < 4; k++) {
      var b = HB_W_ROW[k];
      if (k >= nC) continue;
      var p = clamp((t - cHab) / 1.0 * 3 - k + 1, 0, 1);
      out += hbCard(b, k, Math.min(1, p * 2)) + hbCaption(b, k, Math.min(1, p * 2));
      if (k < nA) out += hbRing(b, HB_D_KEY[k], k === 2 ? 24 : 26, 1);
      if (k < nT) out += MK.tick(b.x + b.w - 6, b.y - 2, 22, popIn(t, cSuit + k * 0.25, 0.35));
    }
    return out;
  }

  function hbDesertChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k === 0 ? hbDesertCard(t, scene) : k === 1 ? hbDesertCamel(t, scene) :
        k === 2 ? hbArcticCard(t, scene) : k === 3 ? hbArcticBear(t, scene) : hbDesertAll(t, scene);
    }
    return svg(crossfade(t, i, scene, draw));
  }

  /* ---- counting and graphing ---------------------------------------------------
     The lecture's own count - six frogs, three ducks, eight fish - counted out
     of the lesson's pond, then stacked into the block graph of its "Count and
     graph the animals" step: one block for each animal, and the tallest column
     the most. */
  var HB_C_POND = hbBox(60, 70, 480);
  var HB_C_KIND = [
    { text: "6", n: 6, pic: "\u{1F438}", cx: 400 },
    { text: "3", n: 3, pic: "\u{1F986}", cx: 584 },
    { text: "8", n: 8, pic: "\u{1F41F}", cx: 768 }
  ];
  var HB_C = { base: 386, bw: 86, bh: 36, gap: 6 };

  /* beat 0: scientists count what lives in a habitat */
  function hbCountOut(t, scene) {
    var cCount = sc(scene, 0, "count");
    var ats = ["frogs", "ducks", "fish"].map(function (n) { return sc(scene, 0, n); });
    var b = HB_C_POND, out = hbCard(b, 0, 1);
    out += MK.ripple(b.x + b.w / 2, b.y + b.h / 2, t, cCount, P.gold);
    out += MK.pill(300, 410, "count", on(t, cCount, 0.4), { size: 26, col: P.gold });
    for (var r = 0; r < 3; r++) {
      var k = HB_C_KIND[r], at = ats[r], y = 130 + r * 110, n = tally(t, at, k.n, 0.7);
      for (var q = 0; q < k.n; q++) {
        if (q >= n) continue;
        var p = clamp((t - at) / 0.7 * (k.n - 1 || 1) - q + 1, 0, 1);
        out += MK.pop(MK.pic(640 + q * 58, y, 46, k.pic), 640 + q * 58, y, Math.min(1.08, p * 1.6));
      }
      out += Tx(600, y + 16, k.text, "lab huge gold", "end", { opacity: on(t, at, 0.45) });
    }
    return out;
  }

  /* beats 1 to 3: the block graph */
  function hbCountGraph(t, scene) {
    var cBlock = sc(scene, 1, "block"), cEach = sc(scene, 1, "each");
    var cTall = sc(scene, 2, "tallest"), cMost = sc(scene, 2, "most"), cFish = sc(scene, 2, "fish");
    var cShort = sc(scene, 3, "shortest"), cLeast = sc(scene, 3, "least"), cDucks = sc(scene, 3, "ducks"), cGl = sc(scene, 3, "glance");
    /* the graph's frame - the line the blocks stand on and the three animals it
       counts - is drawn from the BEAT's own arrival rather than from a cue
       inside the line, so it is whole the moment the dissolve in
       hbCountChapter finishes and nothing waits on a later cue to fill it. */
    var g = HB_C, out = "", ax = hbFrom(t, scene, 1);
    out += L(300, 388, 868, 388, P.line, 4, { opacity: ax });
    /* the side of the graph, with a mark at the top of every block: the empty
       graph then reads AS a graph in the second before its first block lands */
    out += L(300, 46, 300, 390, P.line, 4, { opacity: ax });
    for (var lv = 1; lv <= 8; lv++) {
      var ly = hbTop(g.base, lv, g.bh, g.gap);
      out += L(288, ly, 308, ly, P.line, 3, { opacity: 0.8 * ax });
    }
    var fill = cEach == null ? 0 : clamp((t - cEach) / 1.0, 0, 1) * 17, offs = [0, 6, 9];
    var ups = [Math.max(on(t, cBlock, 0.35), clamp(fill, 0, 6)), clamp(fill - 6, 0, 3), clamp(fill - 9, 0, 8)];
    var glance = on(t, cGl, 0.5);
    var lit = [0, cDucks != null && t >= cShort ? 1 : 0, cFish != null && t >= cTall && t < cShort ? 1 : 0];
    var any = (lit[1] || lit[2]) && glance < 1;
    for (var k = 0; k < 3; k++) {
      var kk = HB_C_KIND[k], alpha = !any || lit[k] ? 1 : 0.34 + 0.66 * glance;
      out += hbColumn(kk.cx, g.base, ups[k], g.bw, g.bh, g.gap, P.teal, alpha);
      out += MK.pop(MK.pic(kk.cx, 414, 42, kk.pic), kk.cx, 414, ax);
      if (ups[k] >= kk.n - 0.01) {
        var top = hbTop(g.base, kk.n, g.bh, g.gap);
        if (lit[k] || glance > 0) out += R(kk.cx - g.bw / 2 - 5, top - 5, g.bw + 10, kk.n * (g.bh + g.gap) - g.gap + 10, 12, "none", P.gold, 4, { opacity: Math.max(lit[k], glance) });
        out += Tx(kk.cx, top - 14, kk.text, "lab big gold", "middle", { opacity: Math.max(lit[k], glance * 0.9) });
      }
    }
    /* the first block, on its own line */
    var one = popIn(t, cBlock, 0.4) * (1 - on(t, cEach, 0.4));
    if (one > 0) out += R(HB_C_KIND[0].cx - g.bw / 2 - 5, g.base - g.bh - 5, g.bw + 10, g.bh + 10, 12, "none", P.gold, 4, { opacity: Math.min(1, one) }) +
      MK.pill(400, g.base - g.bh - 52, "one block", Math.min(1, one), { size: 24, col: P.gold });
    /* the tallest shows the most, the shortest the least */
    var fishTop = hbTop(g.base, 8, g.bh, g.gap), duckTop = hbTop(g.base, 3, g.bh, g.gap);
    var mo = on(t, cTall, 0.6);
    if (mo > 0) out += L(300, fishTop, lerp(300, 900, mo), fishTop, P.gold, 3, { "stroke-dasharray": "13 9", opacity: 0.85 });
    out += MK.pill(1010, 120, "the most", on(t, cMost, 0.4) * (1 - 0.35 * on(t, cShort, 0.5)), { size: 28, col: P.gold });
    out += MK.leader(1010, 146, 830, fishTop + 20, on(t, cMost, 0.6) * (1 - 0.5 * on(t, cShort, 0.5)), P.gold);
    var so = on(t, cShort, 0.6);
    if (so > 0) out += L(300, duckTop, lerp(300, 900, so), duckTop, P.gold, 3, { "stroke-dasharray": "13 9", opacity: 0.85 });
    out += MK.pill(1010, 268, "the least", on(t, cLeast, 0.4), { size: 28, col: P.gold });
    out += MK.leader(1010, 294, 660, duckTop + 20, on(t, cLeast, 0.6), P.gold);
    out += MK.pill(1010, 386, "at a glance", on(t, cGl, 0.4), { size: 26, col: P.teal });
    return out;
  }

  function hbCountChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(hbCountOut(t, scene));
    if (k === 1) {
      /* the counted pond holds until the words "A block graph" and dissolves
         into the graph on them, rather than fading out in the pause before the
         beat: the graph's own blocks wait for "one block" a second later, so
         the ordinary crossfade left the stage standing empty in between */
      var u = on(t, sc(scene, 1, "graph"), 0.6);
      return svg(G(hbCountGraph(t, scene), { opacity: u }) + (u < 1 ? G(hbCountOut(t, scene), { opacity: 1 - u }) : ""));
    }
    return svg(hbCountGraph(t, scene));
  }
