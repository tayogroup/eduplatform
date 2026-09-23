  /* ==== chapters: fish and amphibians, reptiles and birds, mammals and insects ==
     tools/lib/film-scenes/science-g3/animal-groups-2.js. Three chapters of one
     kind, "pair": the lesson's two groups side by side as two cards, the one
     being talked about lit and the other quiet beside it, so the child sees
     the contrast the lesson's own "Six groups" step draws. Every feature row
     is the lesson's own wording, and every picture is one of the animals the
     lesson uses for that group. */

  /* a row list inside a card whose left edge is x */
  function agRows(x, rows, t) { return MK.list(x + 196, 128, rows, t, { lh: 54, cls: "lab", markR: 15 }); }
  /* the big picture of a card whose left edge is x */
  function agCardPic(x, pic, size, o) { return MK.pic(x + 112, 208, size || 138, pic, { opacity: clamp(o == null ? 1 : o, 0, 1) }); }
  /* a band of water or of ground across the foot of a card */
  function agBand(x, y, w, h, u, col) {
    if (!(u > 0)) return "";
    return R(x, y + h * (1 - u), w, h * u, 16, col, null, null, { opacity: 0.55 });
  }

  /* ---- fish and amphibians --------------------------------------------------- */
  function agFishCard(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cScales = c(0, "scales"), cFins = c(0, "fins"), cGills = c(0, "gills");
    var cWater = c(1, "water"), cLife = c(1, "life"), cSalmon = c(1, "salmon"), cShark = c(1, "shark");
    var x = AG_CARD.lx, out = "";
    var wu = on(t, cWater, 0.9);
    out += agBand(42, 300, 516, 122, wu, "#2E6FA8");
    out += agCardPic(x, "\u{1F41F}", 138, 1 - 0.55 * on(t, cSalmon, 0.5));
    /* "breathe through gills": bubbles rise from the fish while the line lasts */
    var gb = on(t, cGills, 0.4) * agOnly(t, scene, 0);
    if (gb > 0 && cGills != null) for (var k = 0; k < 5; k++) {
      var ph = ((t - cGills) / 1.4 + k * 0.2) % 1;
      out += C(186 + AG_SCATTER[k] * 26, 210 - 92 * ph, 5 + 3 * (k % 2), "#BFE3F5", null, null, { opacity: gb * Math.min(1, ph * 6) * (1 - ph) });
    }
    out += agRows(x, [
      { text: "scales", at: cScales }, { text: "fins", at: cFins },
      { text: "gills", at: cGills }, { text: "in water all its life", at: cWater }
    ], t);
    /* "A salmon. A shark." - the lesson's own two fish, in the water */
    out += MK.pop(MK.pic(168, 352, 80, "\u{1F41F}"), 168, 352, popIn(t, cSalmon, 0.4));
    out += MK.pill(168, 408, "salmon", on(t, cSalmon, 0.4), { size: 21, col: P.gold });
    out += MK.pop(MK.pic(378, 352, 94, "\u{1F988}"), 378, 352, popIn(t, cShark, 0.4));
    out += MK.pill(378, 408, "shark", on(t, cShark, 0.4), { size: 21, col: P.gold });
    /* "all its life": the water stays, and so does the fish */
    out += MK.glow(300, 330, 108, "#6E9DE8", bump(t, cLife, 1.2) * 0.9);
    return out;
  }

  function agAmphCard(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSkin = c(2, "skin"), cNone = c(2, "none");
    var cStart = c(3, "start"), cTad = c(3, "tad"), cNames = c(3, "names");
    var cGrown = c(4, "grown"), cLand = c(4, "land");
    var x = AG_CARD.rx, out = "";
    var hop = on(t, cLand, 0.8), lift = 22 * Math.sin(Math.PI * clamp(hop, 0, 1));
    /* the water they start in and the land they come onto, each WIDER than the
       animal standing on it: a band the frog covers exactly is a band nobody
       sees, which is what the first cut drew */
    out += agBand(718, 302, 148, 118, on(t, cStart, 0.7), "#2E6FA8");
    out += agBand(898, 302, 156, 118, on(t, cLand, 0.7), P.grass);
    out += agCardPic(x, "\u{1F438}", 138, 1 - 0.5 * on(t, cTad, 0.5));
    out += MK.glow(710, 208, 110, P.good, bump(t, cNames, 1.2) * 0.9);
    out += agRows(x, [
      { text: "smooth, damp skin", at: cSkin }, { text: "no scales at all", at: cNone }
    ], t);
    /* the lesson's own life story: a tadpole in the water, then a frog on land */
    var pt = popIn(t, cTad, 0.42);
    out += MK.pop(MK.pic(792, 344, 96, ART.ICONS.tadpole), 792, 344, pt);
    out += MK.pill(792, 408, "tadpole", Math.min(1, pt), { size: 21, col: P.gold });
    out += MK.arrow(852, 344, 918, 344, on(t, cGrown, 0.55), P.gold, 7);
    var pf = popIn(t, cGrown, 0.42);
    out += MK.pop(MK.pic(976, 344 - lift, 84, "\u{1F438}"), 976, 344 - lift, pf);
    out += MK.pill(976, 408, "frog, on land", Math.min(1, on(t, cLand, 0.4)), { size: 21, col: P.gold });
    out += C(976, 344 - lift, 48, "none", P.gold, 4, { opacity: on(t, cLand, 0.5) });
    return out;
  }

  /* ---- reptiles and birds ----------------------------------------------------- */
  function agReptCard(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDry = c(0, "dry"), cNames = c(0, "names");
    var cEggs = c(1, "eggs"), cLand = c(1, "land"), cWater = c(1, "water");
    var x = AG_CARD.lx, out = "";
    out += agCardPic(x, "\u{1F98E}", 136);
    out += MK.glow(142, 208, 106, P.good, bump(t, cNames == null ? null : cNames + 0.3, 1.0) * 0.9);
    out += agRows(x, [
      { text: "dry, scaly skin", at: cDry }, { text: "eggs on land", at: cLand }
    ], t);
    /* "Snakes, lizards and tortoises": the snake, then the lizard above, then
       the tortoise - in the order the line says them */
    out += MK.pop(MK.pic(122, 352, 88, "\u{1F40D}"), 122, 352, popIn(t, cNames, 0.4));
    out += MK.pop(MK.pic(244, 352, 88, "\u{1F422}"), 244, 352, popIn(t, cNames == null ? null : cNames + 0.7, 0.4));
    /* "tough eggs on land, not in water" */
    var ge = on(t, cLand, 0.6);
    out += R(352, 384, 200 * ge, 18, 9, "#6B4A2B", null, null, { opacity: ge });
    [0, 1, 2].forEach(function (k) {
      out += MK.pop(MK.pic(392 + k * 52, 356, 48, "\u{1F95A}"), 392 + k * 52, 356, popIn(t, cEggs == null ? null : cEggs + k * 0.16, 0.38));
    });
    var pw = popIn(t, cWater, 0.4);
    out += MK.pop(MK.pic(500, 256, 66, "\u{1F30A}"), 500, 256, pw);
    out += MK.cross(500, 256, 34, popIn(t, cWater == null ? null : cWater + 0.3, 0.35));
    return out;
  }

  function agBirdCard(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFeath = c(2, "feathers"), cBeak = c(2, "beak"), cEggs = c(2, "eggs");
    var cEvery = c(3, "every"), cPeng = c(3, "peng");
    var x = AG_CARD.rx, out = "";
    out += agCardPic(x, "\u{1F426}", 136);
    out += MK.glow(710, 208, 104, P.gold, Math.max(bump(t, cBeak, 1.0), bump(t, cEvery, 1.2)) * 0.9);
    out += C(710, 208, 74, "none", P.gold, 4, { opacity: on(t, cEvery, 0.4) * agOnly(t, scene, 3) });
    out += agRows(x, [
      { text: "feathers", at: cFeath }, { text: "a beak", at: cBeak }, { text: "lays eggs", at: cEggs }
    ], t);
    /* two of the kit's own feathers drift down as feathers are named */
    [[1032, 0], [1092, 0.4]].forEach(function (f, k) {
      var at = cFeath == null ? null : cFeath + f[1], u = on(t, at, 1.5);
      if (!(u > 0)) return;
      out += G(MK.pic(f[0], 150 + 150 * u, 60, ART.ICONS.feather),
        { transform: "rotate(" + n2(-18 + 36 * u + (k ? 20 : 0)) + " " + n2(f[0]) + " " + n2(150 + 150 * u) + ")", opacity: Math.min(1, u * 3) });
    });
    /* a nest of eggs */
    var ne = on(t, cEggs, 0.5);
    if (ne > 0) {
      out += Pth("M866,372 q44,34 92,0 q-12,26 -46,26 q-34,0 -46,-26z", "#8B5A2B", "#6B4A2B", 3, { opacity: ne });
      out += MK.pop(MK.pic(894, 360, 44, "\u{1F95A}"), 894, 360, popIn(t, cEggs, 0.4));
      out += MK.pop(MK.pic(932, 360, 44, "\u{1F95A}"), 932, 360, popIn(t, cEggs == null ? null : cEggs + 0.22, 0.4));
    }
    /* "even a penguin that cannot fly": it has feathers too */
    var pp = popIn(t, cPeng, 0.42);
    out += MK.pop(MK.pic(1042, 362, 100, "\u{1F427}"), 1042, 362, pp);
    out += MK.pop(MK.pic(1100, 306, 46, ART.ICONS.feather), 1100, 306, popIn(t, cPeng == null ? null : cPeng + 0.3, 0.4));
    out += MK.tick(1100, 408, 24, popIn(t, cPeng == null ? null : cPeng + 0.55, 0.35));
    return out;
  }

  /* ---- mammals and insects ---------------------------------------------------- */
  function agMamCard(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFur = c(0, "fur"), cMilk = c(0, "milk"), cNames = c(1, "names"), cYou = c(1, "you");
    var x = AG_CARD.lx, out = "";
    out += agCardPic(x, "\u{1F415}", 136, 1 - 0.72 * agFrom(t, scene, 1));
    out += agRows(x, [
      { text: "fur or hair", at: cFur }, { text: "milk for the babies", at: cMilk }
    ], t);
    out += MK.pop(MK.pic(506, 122, 66, "\u{1F95B}"), 506, 122, popIn(t, cMilk, 0.42));
    /* "Dogs, whales and bats are mammals. So are you." The row sits high enough
       that the "you" pill under it clears the card's own bottom edge (430). */
    [["\u{1F415}", 120, 0], ["\u{1F40B}", 232, 0.34], ["\u{1F987}", 344, 0.68]].forEach(function (m) {
      out += MK.pop(MK.pic(m[1], 338, 86, m[0]), m[1], 338, popIn(t, cNames == null ? null : cNames + m[2], 0.4));
    });
    var py = popIn(t, cYou, 0.45);
    out += MK.pop(MK.pic(462, 338, 90, "\u{1F9D2}"), 462, 338, py);
    out += C(462, 338, 50, "none", P.gold, 4, { opacity: on(t, cYou, 0.45) });
    out += MK.pill(462, 406, "you", Math.min(1, py), { size: 22, col: P.gold });
    return out;
  }

  /* the beetle of the lesson's own diagram step, inside the insects card */
  var AG_BUG = { x: 658, y: 140, k: 420 / 360 };
  function agBX(v) { return AG_BUG.x + v * AG_BUG.k; }
  function agBY(v) { return AG_BUG.y + v * AG_BUG.k; }
  /* where each of the six legs ends, in the figure's own coordinates */
  var AG_LEG_TIPS = [[110, 44], [162, 33], [232, 44], [110, 206], [162, 217], [232, 206]];
  var AG_BODY = [{ part: "head", at: [122, 125] }, { part: "thorax", at: [170, 125] }, { part: "abdomen", at: [240, 125] }];

  function agInsectCard(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSix = c(2, "six"), cCount = c(2, "count"), cThree = c(3, "three");
    var cHead = c(3, "head"), cThor = c(3, "thorax"), cAbd = c(3, "abdomen");
    var cNames = c(4, "names"), cSpider = c(4, "spider"), cEight = c(4, "eight");
    var out = "", gone = agFrom(t, scene, 4);

    out += MK.pill(740, 108, "six legs", on(t, cSix, 0.4), { size: 24, col: on(t, cSix, 0.4) > 0.5 ? P.gold : P.line });
    out += MK.pill(960, 108, "three body parts", on(t, cThree, 0.4), { size: 24, col: on(t, cThree, 0.4) > 0.5 ? P.gold : P.line });

    if (gone < 1) {
      var legs = on(t, cSix, 0.4);
      /* mark the ONE part being named: the six legs, then each body part in turn */
      var ringed = null, alpha = 0;
      if (cAbd != null && t >= cAbd - 0.2) { ringed = "abdomen"; alpha = on(t, cAbd, 0.35); }
      else if (cThor != null && t >= cThor - 0.2) { ringed = "thorax"; alpha = on(t, cThor, 0.35); }
      else if (cHead != null && t >= cHead - 0.2) { ringed = "head"; alpha = on(t, cHead, 0.35); }
      else if (legs > 0) { ringed = "legs"; alpha = legs; }
      var bug = agBeetle(ringed, alpha, AG_BUG.x, AG_BUG.y, 420, 280);
      /* a pool of light behind the part being named */
      var glow = "";
      AG_BODY.forEach(function (b) {
        var at = b.part === "head" ? cHead : b.part === "thorax" ? cThor : cAbd;
        glow += MK.glow(agBX(b.at[0]), agBY(b.at[1]), 80, P.gold, bump(t, at, 1.5) * 0.9);
      });
      /* "Count them: always six" - a number at every leg tip */
      var nums = "";
      AG_LEG_TIPS.forEach(function (p, k) {
        var at = cCount == null ? null : cCount + k * 0.2, o = popIn(t, at, 0.34);
        if (o <= 0) return;
        var nx = agBX(p[0]), ny = agBY(p[1]) + (k < 3 ? -20 : 26);
        nums += MK.pop(C(nx, ny - 7, 17, "#1B3A52", P.gold, 3) +
          Tx(nx, ny, String(k + 1), "lab mid", "middle", { fill: P.gold }), nx, ny - 7, o);
      });
      out += G(glow + bug + nums, { opacity: 1 - gone });
    }

    /* "Ants, bees and beetles are insects. A spider has eight legs, so it is not." */
    if (gone > 0) {
      var row = "";
      [["\u{1F41C}", 700], ["\u{1F41D}", 868], ["\u{1FAB2}", 1036]].forEach(function (m, k) {
        var at = cNames == null ? null : cNames + k * 0.3;
        row += MK.pop(MK.pic(m[1], 218, 92, m[0]), m[1], 218, popIn(t, at, 0.4));
        row += MK.tick(m[1], 292, 21, popIn(t, at == null ? null : at + 0.25, 0.34));
      });
      row += MK.pop(MK.pic(792, 368, 98, "\u{1F577}️"), 792, 368, popIn(t, cSpider, 0.42));
      row += MK.cross(858, 340, 34, popIn(t, cSpider == null ? null : cSpider + 0.4, 0.36));
      row += MK.pill(964, 372, "eight legs", on(t, cEight, 0.4), { size: 24, col: P.bad, ink: P.bad });
      out += G(row, { opacity: gone });
    }
    return out;
  }

  /* ---- the three pair chapters ------------------------------------------------ */
  function agPairChapter(scene, beat, t, i) {
    var turn = agFrom(t, scene, 2);        /* every pair chapter turns to its second group at beat 3 */
    if (scene.id === "fishamph")
      return svg(agCard(AG_CARD.lx, "Fish", agFishCard(t, scene), 1 - turn) +
        agCard(AG_CARD.rx, "Amphibians", agAmphCard(t, scene), turn));
    if (scene.id === "reptbird")
      return svg(agCard(AG_CARD.lx, "Reptiles", agReptCard(t, scene), 1 - turn) +
        agCard(AG_CARD.rx, "Birds", agBirdCard(t, scene), turn));
    return svg(agCard(AG_CARD.lx, "Mammals", agMamCard(t, scene), 1 - turn) +
      agCard(AG_CARD.rx, "Insects", agInsectCard(t, scene), turn));
  }
