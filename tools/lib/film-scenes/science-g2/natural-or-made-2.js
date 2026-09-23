  /* ==== chapters: manufactured materials, and testing for properties ===========
     tools/lib/film-scenes/science-g2/natural-or-made-2.js. */

  /* ---- manufactured materials -------------------------------------------------
     The lesson's other four explore cards (plastic, glass, brick, paper) with
     the factory that makes them; then its two "made from a natural material"
     cards drawn as the journey they describe - sand melted into glass, wood
     mashed into paper - and last its sort step's one question over the two
     bins the child is about to tap. */
  var NM_MADE_X = [200, 466, 732, 998];

  /* the four cards with the factory below: beats 1 and 4 of the chapter */
  function nmMadeRow(scene, t, k) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cues = [c(0, "plastic"), c(0, "glass"), c(0, "brick"), c(0, "paper")];
    var names = ["plastic", "glass", "brick", "paper"];
    var pics = [NM_PIC.plastic, ART.ICONS.glass, NM_PIC.brick, NM_PIC.paper];
    var last = k === 3, ringAt = last ? c(3, "these") : null, out = "";
    for (var q = 0; q < 4; q++) {
      var cx = NM_MADE_X[q], lit = on(t, cues[q], 0.4);
      out += nmTile(cx, 130, 230, 212, lit > 0.5, lit);
      out += MK.pop(MK.pic(cx, 126, 126, pics[q]), cx, 126, popIn(t, cues[q], 0.45));
      out += MK.pill(cx, 268, names[q], lit, { size: 28, col: P.gold });
      if (ringAt != null) out += R(cx - 122, 16, 244, 228, 24, "none", P.accent, 4,
        { opacity: on(t, nmAfter(ringAt, q * 0.16), 0.35) });
    }
    /* the factory that made them */
    var fAt = last ? c(3, "people") : c(0, "people");
    out += MK.glow(310, 352, 86, P.accent, on(t, fAt, 0.6) * 0.9);
    out += MK.pop(MK.pic(310, 352, 104, NM_PIC.factory), 310, 352, popIn(t, fAt, 0.45));
    if (last) out += MK.pill(780, 352, "manufactured", on(t, c(3, "factory"), 0.45), { size: 36, col: P.accent });
    else out += MK.pill(780, 352, "made by people, in a factory", on(t, c(0, "factories"), 0.45), { size: 30, col: P.line });
    return out;
  }

  /* sand, melted very hot, becomes glass */
  function nmGlassMade(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cGl = c(1, "glass"), cMelt = c(1, "melt"), cHot = c(1, "hot"), cBec = c(1, "becomes"), out = "";
    var melt = on(t, cMelt, 0.6), hot = on(t, cHot, 0.6), bec = popIn(t, cBec, 0.5);
    out += nmSand(170, 318, 220, 1 - 0.45 * melt);
    out += MK.pill(170, 374, "sand", 1, { size: 28, col: P.line });
    out += MK.arrow(300, 240, 408, 240, melt, P.gold, 8);
    /* the furnace: a chamber with a flame under it, and the sand melting in it */
    out += R(436, 100, 300, 280, 24, P.cell, P.line, 3);
    out += R(468, 130, 236, 152, 14, "#0A1C29", P.line, 2);
    out += MK.glow(586, 206, 120, "#F0806F", hot * (0.7 + 0.3 * breathe(t)));
    out += E(586, 212, 84, 46, "#E3C98C", "#C9A85F", 3, { opacity: 1 - 0.7 * hot });
    out += E(586, 212, 84, 46, "#FFD98A", "#F4C95D", 3, { opacity: hot });
    out += nmFlame(586, 376, 78, t, melt);
    out += MK.pill(586, 412, "very hot", on(t, cHot, 0.45), { size: 28, col: "#F0806F" });
    out += MK.arrow(760, 240, 856, 240, Math.min(1, bec), P.gold, 8);
    /* the pane of glass it becomes: its place is waiting from the first word */
    out += nmGhost(980, 218, 206, 228, on(t, cGl, 0.5) * (1 - Math.min(1, bec)));
    out += nmTile(980, 218, 206, 228, true, Math.min(1, bec));
    out += MK.pop(MK.pic(980, 214, 136, ART.ICONS.glass), 980, 214, bec);
    out += MK.pill(980, 374, "glass", Math.min(1, bec), { size: 28, col: P.gold });
    return out;
  }

  /* wood, mashed in a factory, becomes paper */
  function nmPaperMade(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cPap = c(2, "paper"), cFac = c(2, "factory"), cMash = c(2, "mash"), cPulp = c(2, "pulp"), out = "";
    var fac = on(t, cFac, 0.5), mash = on(t, cMash, 0.7), pulp = on(t, cPulp, 0.7);
    out += MK.pic(170, 210, 140, NM_PIC.wood);
    out += MK.pill(170, 318, "wood", 1, { size: 28, col: P.line });
    out += MK.arrow(272, 210, 388, 210, mash, P.gold, 8);
    /* the vat: a paddle turns, and the pulp rises as the wood is mashed */
    out += R(430, 84, 300, 300, 24, P.cell, fac > 0.4 ? P.accent : P.line, 3);
    out += G(MK.pic(478, 130, 60, NM_PIC.factory), { opacity: fac });
    var lev = 300 - 96 * pulp;
    out += R(462, lev, 236, 362 - lev, 12, "#9A7B55", null, null, { opacity: 0.4 + 0.6 * pulp });
    for (var q = 0; q < 5; q++) {
      out += E(490 + q * 45, lev + 24 + 11 * Math.sin(t * 2.2 + q * 1.25), 21, 9, "#C7A76B", null, null,
        { opacity: mash * 0.9 });
    }
    var spin = mash * (t * 2.4 % (Math.PI * 2));
    var pad = C(580, 168, 30, "none", "#93AABE", 7);
    for (var r = 0; r < 4; r++) {
      var a = spin + r * Math.PI / 2;
      pad += L(580, 168, 580 + Math.cos(a) * 30, 168 + Math.sin(a) * 30, "#93AABE", 6);
    }
    out += G(L(580, 104, 580, 140, "#93AABE", 8) + pad, { opacity: mash });
    out += MK.pill(580, 412, "pulp", on(t, cPulp, 0.45), { size: 28, col: P.accent });
    out += MK.arrow(754, 210, 852, 210, pulp, P.gold, 8);
    /* the sheet of paper */
    var pAt = popIn(t, cPap, 0.5);
    out += nmTile(978, 204, 204, 224, true, Math.min(1, pAt));
    out += MK.pop(MK.pic(978, 200, 132, NM_PIC.paper), 978, 200, pAt);
    out += MK.pill(978, 356, "paper", Math.min(1, pAt), { size: 28, col: P.gold });
    return out;
  }

  /* the sort step: one question, two bins */
  function nmSortBins(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cSort = c(4, "sort"), cAsk = c(4, "ask"), cNat = c(4, "nature"), out = "";
    var bins = on(t, cSort, 0.5);
    out += MK.bubble(284, 12, 600, 96, "Could you find it in nature?", on(t, cAsk, 0.45), 584, 150);
    var one = function (x, pic, label, col, lit) {
      var cx = x + 240;
      return R(x, 174, 480, 246, 26, P.cell, lit > 0.4 ? col : P.line, lit > 0.4 ? 4 : 2,
          { opacity: 0.4 + 0.6 * bins }) +
        G(MK.pic(cx - 126, 296, 130, pic), { opacity: bins }) +
        MK.pill(cx + 88, 296, label, bins, { size: 32, col: lit > 0.4 ? col : P.line });
    };
    out += one(56, NM_PIC.tree, "Natural", P.good, on(t, cNat, 0.5));
    out += one(632, NM_PIC.factory, "Manufactured", P.accent, on(t, cNat, 0.5));
    /* the lesson's own rule, both ways round: yes puts it in Natural, no puts
       it in Manufactured. One bin ticked on its own would read as the answer */
    var ans = popIn(t, nmAfter(cNat, 0.25), 0.4);
    out += MK.pill(296, 210, "yes", ans, { size: 30, col: P.good });
    out += MK.pill(872, 210, "no", ans, { size: 30, col: P.accent });
    return out;
  }

  var NM_MADE_KIND = ["row", "glass", "paper", "row", "bins"];
  function nmMadePic(scene, t, k) {
    var kind = NM_MADE_KIND[k];
    if (kind === "glass") return nmGlassMade(scene, t);
    if (kind === "paper") return nmPaperMade(scene, t);
    if (kind === "bins") return nmSortBins(scene, t);
    return nmMadeRow(scene, t, k);
  }
  function nmMadeChapter(scene, beat, t, i) {
    var k = i - scene.first;
    var u = k === 0 || NM_MADE_KIND[k] === NM_MADE_KIND[k - 1] ? 1 : into(t, scene.first + k);
    var out = "";
    if (u < 1) out += G(nmMadePic(scene, t, k - 1), { opacity: 1 - u });
    return svg(out + G(nmMadePic(scene, t, k), { opacity: u }));
  }

  /* ---- testing for properties ---------------------------------------------------
     The lesson's material tester: one material on the left, its four tests down
     the right, and each answer filling in as the voice says it. Glass first
     (hard, stiff, see-through, waterproof - four properties, one material),
     then wool, whose first two answers are different; and last both of them
     side by side, which is what "a material has several" looks like.

     The lesson's Bend it button is the emoji arrow U+21A9, which this machine
     draws as a thin text glyph nobody can read at 40 px, so the bend test is
     drawn (nmBendIcon). The other three are the lesson's own emoji. */
  var NM_ROW_Y = [76, 168, 260, 352];

  function nmBendIcon(cx, cy, r) {
    var d = "M" + n2(cx - r * 0.72) + "," + n2(cy + r * 0.44) +
      " Q" + n2(cx) + "," + n2(cy - r * 0.92) + " " + n2(cx + r * 0.72) + "," + n2(cy + r * 0.44);
    return Pth(d, null, P.ink, r * 0.26) +
      Pth("M" + n2(cx - r * 0.72) + "," + n2(cy + r * 0.44) + " l" + n2(r * 0.3) + "," + n2(-r * 0.2) +
        " m" + n2(-r * 0.3) + "," + n2(r * 0.2) + " l" + n2(r * 0.06) + "," + n2(-r * 0.34), null, P.ink, r * 0.16) +
      Pth("M" + n2(cx + r * 0.72) + "," + n2(cy + r * 0.44) + " l" + n2(-r * 0.3) + "," + n2(-r * 0.2) +
        " m" + n2(r * 0.3) + "," + n2(r * 0.2) + " l" + n2(-r * 0.06) + "," + n2(-r * 0.34), null, P.ink, r * 0.16);
  }
  function nmLightIcon(cx, cy, r) {
    var out = C(cx, cy, r * 0.38, P.gold);
    for (var k = 0; k < 8; k++) {
      var a = k * Math.PI / 4;
      out += L(cx + Math.cos(a) * r * 0.58, cy + Math.sin(a) * r * 0.58,
        cx + Math.cos(a) * r * 0.96, cy + Math.sin(a) * r * 0.96, P.gold, r * 0.17);
    }
    return out;
  }
  function nmTestIcon(q, cx, cy, size) {
    if (q === 1) return nmBendIcon(cx, cy, size * 0.5);
    if (q === 2) return nmLightIcon(cx, cy, size * 0.5);
    return Em(cx, cy, size, q === 0 ? NM_PIC.press : NM_PIC.drop);
  }

  /* one test row: its icon, an arrow, and its answer or an empty slot */
  function nmTestRow(q, t, showAt, ansAt, answer, flashAt) {
    var sh = on(t, showAt, 0.4);
    if (sh <= 0) return "";
    var y = NM_ROW_Y[q], ans = on(t, ansAt, 0.4), out = "";
    out += G(C(610, y, 40, P.cell, ans > 0.4 ? P.gold : P.line, ans > 0.4 ? 3 : 2) +
      nmTestIcon(q, 610, y, 48), { opacity: sh });
    out += MK.arrow(658, y, 726, y, on(t, ansAt, 0.45), P.gold, 6);
    if (ans > 0) {
      var fl = flashAt == null ? 0 : bump(t, flashAt, 0.7);
      out += G(MK.pill(748, y, answer, ans, { size: 30, col: P.gold, anchor: "start" }),
        { transform: around(810, y, 1 + 0.07 * fl) });
    } else {
      out += R(748, y - 26, 72, 52, 26, "none", P.line, 3, { opacity: sh * 0.9, "stroke-dasharray": "9 8" }) +
        Tx(784, y + 12, "?", "lab big muted", "middle", { opacity: sh * 0.9 });
    }
    return out;
  }

  /* the material on the left, on its card */
  function nmTestCard(t, pic, name, popAt, squash, bendU) {
    var out = nmTile(286, 194, 400, 356, true, 1);
    out += G(MK.pic(286, 180, 214, pic), { transform: around(286, 264, 1 - 0.14 * squash) +
      (bendU ? " rotate(" + n2(-16 * bendU) + " 286 264)" : "") });
    out += MK.pill(286, 336, name, 1, { size: 32, col: P.gold });
    return G(out, { transform: around(286, 194, Math.min(1.08, popIn(t, popAt, 0.5) || 1)) });
  }

  function nmGlassTest(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cProp = c(0, "property"), cLike = c(0, "like"), cTest = c(0, "test");
    var cGl = c(1, "glass"), cPress = c(1, "press"), cHard = c(1, "hard"), cBend = c(1, "bend"), cStiff = c(1, "stiff");
    var cLight = c(2, "light"), cSee = c(2, "see"), cPour = c(2, "pour"), cWater = c(2, "water");
    var cAll = c(3, "all"), out = "";
    var shows = [cTest, nmAfter(cTest, 0.13), nmAfter(cTest, 0.26), nmAfter(cTest, 0.39)];
    out += G(nmTestCard(t, ART.ICONS.glass, "glass", cProp, 0, 0), { opacity: on(t, cProp, 0.5) });
    /* "what a material is like": the lens, over the card */
    var lk = on(t, cLike, 0.5);
    if (lk > 0) out += MK.glow(286, 194, 188, P.gold, lk * 0.5 * (0.5 + 0.5 * breathe(t))) +
      MK.pop(Em(426, 316, 62, NM_PIC.lens), 426, 316, popIn(t, cLike, 0.4));
    out += nmTestRow(0, t, shows[0], cHard, "hard", c(3, "hard"));
    out += nmTestRow(1, t, shows[1], cStiff, "stiff", c(3, "stiff"));
    out += nmTestRow(2, t, shows[2], cSee, "see-through", c(3, "see"));
    out += nmTestRow(3, t, shows[3], cWater, "waterproof", c(3, "water"));
    /* the tests themselves, each inside its own beat */
    out += MK.ripple(286, 180, t, cGl, P.gold);
    var b1 = nmOnly(t, scene, 1);
    out += MK.finger(286, 54, on(t, cPress, 0.4) * b1);
    var bd = on(t, cBend, 0.5) * b1;
    if (bd > 0) {
      var nudge = 7 * Math.sin(t * 9);
      out += MK.arrow(120, 264 + nudge, 186, 264 + nudge, bd, P.gold, 9);
      out += MK.arrow(452, 264 - nudge, 386, 264 - nudge, bd, P.gold, 9);
    }
    var b2 = nmOnly(t, scene, 2);
    /* light goes in one side of the pane and out the other: see-through */
    var li = on(t, cLight, 0.5) * b2;
    if (li > 0) {
      out += G(nmLightIcon(48, 180, 40), { opacity: li });
      for (var q = 0; q < 3; q++) {
        var y = 132 + q * 48, x1 = 88, x2 = lerp(88, 520, li);
        out += L(x1, y, x2, y, P.gold, 5, { "stroke-dasharray": "14 10", opacity: 0.9 * li });
      }
    }
    var po = on(t, cPour, 0.4) * b2;
    if (po > 0) for (var r = 0; r < 4; r++) {
      var ph = ((t - cPour) / 0.8 + r * 0.25) % 1;
      out += nmDrop(236 + 108 * ph, 62 + 200 * ph * ph, 10, po * Math.min(1, (1 - ph) * 3));
    }
    /* "all at once": a bracket round the four answers */
    var al = on(t, cAll, 0.6);
    if (al > 0) out += R(736, 24, 410, 368, 26, "none", P.gold, 4, { opacity: al }) +
      MK.pill(941, 416, "one material, four properties", al, { size: 24, col: P.gold });
    return out;
  }

  function nmWoolTest(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cWool = c(4, "wool"), cDiff = c(4, "different"), cSoft = c(4, "soft"), cBendy = c(4, "bendy");
    var out = G(nmTestCard(t, NM_PIC.wool, "wool", cWool, on(t, cSoft, 0.5), on(t, cBendy, 0.6)),
      { opacity: on(t, cWool, 0.4) });
    var sh = cWool;
    out += nmTestRow(0, t, sh, cSoft, "soft", null);
    out += nmTestRow(1, t, nmAfter(sh, 0.15), cBendy, "bendy", null);
    out += nmTestRow(2, t, nmAfter(sh, 0.3), null, null, null);
    out += nmTestRow(3, t, nmAfter(sh, 0.45), null, null, null);
    out += MK.pill(941, 416, "different answers", on(t, cDiff, 0.5), { size: 26, col: P.gold });
    out += MK.finger(286, 54, on(t, cSoft, 0.4));
    return out;
  }

  /* both materials, all four tests: "each test finds one property" */
  var NM_ANS = {
    glass: ["hard", "stiff", "see-through", "waterproof"],
    wool: ["soft", "bendy", "not see-through", "soaks water up"]
  };
  function nmBothTest(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cEach = c(5, "each"), cOne = c(5, "one"), cSev = c(5, "several"), out = "";
    out += MK.pic(610, 72, 118, ART.ICONS.glass) + MK.pic(960, 72, 118, NM_PIC.wool);
    out += MK.pill(610, 140, "glass", 1, { size: 28, col: P.line });
    out += MK.pill(960, 140, "wool", 1, { size: 28, col: P.line });
    var ys = [198, 262, 326, 390];
    for (var q = 0; q < 4; q++) {
      var at = nmAfter(cEach, q * 0.3), o = on(t, at, 0.35), row = bump(t, nmAfter(cOne, q * 0.2), 0.8);
      if (o <= 0) continue;
      /* radius 30, not 38: the rows are 64 px apart, so a 38 px ring cut into
         the one below it and the column read as a chain of dented circles */
      out += G(C(226, ys[q], 30, P.cell, P.gold, row > 0.15 ? 3 : 2) + nmTestIcon(q, 226, ys[q], 38), { opacity: o });
      out += MK.leader(260, ys[q], 440, ys[q], o, row > 0.15 ? P.gold : P.line);
      out += MK.pill(610, ys[q], NM_ANS.glass[q], o, { size: 28, col: row > 0.15 ? P.gold : P.line });
      out += MK.pill(960, ys[q], NM_ANS.wool[q], o, { size: 28, col: row > 0.15 ? P.gold : P.line });
    }
    var sv = on(t, cSev, 0.6);
    if (sv > 0) {
      out += R(462, 164, 296, 260, 22, "none", P.gold, 4, { opacity: sv });
      out += R(812, 164, 296, 260, 22, "none", P.gold, 4, { opacity: sv * 0.9 });
    }
    return out;
  }

  var NM_TEST_KIND = ["glass", "glass", "glass", "glass", "wool", "both"];
  function nmTestPic(scene, t, k) {
    var kind = NM_TEST_KIND[k];
    return kind === "wool" ? nmWoolTest(scene, t) : kind === "both" ? nmBothTest(scene, t) : nmGlassTest(scene, t);
  }
  function nmTestingChapter(scene, beat, t, i) {
    var k = i - scene.first;
    var u = k === 0 || NM_TEST_KIND[k] === NM_TEST_KIND[k - 1] ? 1 : into(t, scene.first + k);
    var out = "";
    if (u < 1) out += G(nmTestPic(scene, t, k - 1), { opacity: 1 - u });
    return svg(out + G(nmTestPic(scene, t, k), { opacity: u }));
  }
