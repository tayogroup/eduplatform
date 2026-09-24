
  /* ==== chapters: light and food, three kinds of eater ==========================
     tools/lib/film-scenes/science-g4/energy-for-life-2.js.

     "Light and food" is the lesson's own energy trail, the five frames of its
     demo step in the order the demo shows them: the Sun, a plant, a rabbit, a
     fox, and you. A gold token of energy is stored in the plant and then
     passes along each arrow as the lesson says it does. On the last line the
     trail slides left and you arrive with your food, because the lesson is
     careful that your energy comes from what you eat, not from the fox.

     "Three kinds of eater" is the sort step: its three bins, with its own
     pictures on them (a leaf, meat, a plate), and its own animals dropping in
     as they are named. */

  /* ---- light and food ---------------------------------------------------------- */
  /* The whole trail slides left on the last line to make room for you and your
     food, so every part of it must still be inside the box once it has moved:
     the Sun's glow is the leftmost thing, at sunX - 86 - shift. */
  var EF_L = {
    sunX: 200, sunY: 92, row: 268, size: 112, badge: 188, label: 356,
    plant: 340, rabbit: 580, fox: 820, shift: 110
  };
  var EF_L_PATH = [[236, 140], [340, 244], [580, 244], [820, 244]];

  function efLightChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLight = c(0, "light"), cLeaves = c(0, "leaves"), cCatch = c(0, "catch");
    var cFood = c(1, "food"), cStored = c(1, "stored");
    var cCannot = c(2, "cannot"), cRabbit = c(2, "rabbit"), cGets = c(2, "gets");
    var cFox = c(3, "fox"), cMoves = c(3, "moves");
    var cRunning = c(4, "running"), cThrough = c(4, "through");
    var cYou = c(5, "you"), cWaterAir = c(5, "waterair"), cYourFood = c(5, "yourfood");

    var last = efFrom(t, scene, 5);
    var trail = "", out = "";

    /* the Sun, and its light reaching the leaves */
    var sunO = on(t, cLight, 0.5);
    trail += MK.glow(EF_L.sunX, EF_L.sunY, 86, P.gold, sunO * (0.6 + 0.4 * breathe(t)));
    trail += Em(EF_L.sunX, EF_L.sunY, 104, EF.sun, { opacity: sunO });
    trail += efRays(236, 140, 322, 224, on(t, cCatch, 0.7), 22);

    /* the three living things of the trail, each on the words that name it */
    var plantO = popIn(t, cLeaves, 0.45), rabbitO = popIn(t, cRabbit, 0.45), foxO = popIn(t, cFox, 0.45);
    var foodGlow = on(t, cFood, 0.8) * (0.6 + 0.4 * breathe(t));
    trail += MK.glow(EF_L.plant, EF_L.row, 92, P.good, foodGlow);
    trail += MK.pop(MK.pic(EF_L.plant, EF_L.row, EF_L.size, EF.plant), EF_L.plant, EF_L.row, plantO);
    trail += MK.pop(MK.pic(EF_L.rabbit, EF_L.row, EF_L.size, EF.rabbit), EF_L.rabbit, EF_L.row, rabbitO);
    trail += MK.pop(MK.pic(EF_L.fox, EF_L.row, EF_L.size, EF.fox), EF_L.fox, EF_L.row, foxO);

    /* the arrows: each grows as the eater is named */
    trail += MK.arrow(406, EF_L.row, 518, EF_L.row, on(t, cRabbit, 0.6), P.gold, 9);
    trail += MK.arrow(646, EF_L.row, 758, EF_L.row, on(t, cFox, 0.6), P.gold, 9);

    /* the lesson's words under each */
    trail += Tx(EF_L.plant, EF_L.label, "plant", "lab mid muted", "middle", { opacity: Math.min(1, plantO) });
    trail += Tx(EF_L.rabbit, EF_L.label, "rabbit", "lab mid muted", "middle", { opacity: Math.min(1, rabbitO) });
    trail += Tx(EF_L.fox, EF_L.label, "fox", "lab mid muted", "middle", { opacity: Math.min(1, foxO) });

    /* "Animals cannot use light": the Sun's light, refused, on that line only */
    var noLight = bump(t, cCannot, 1.7);
    if (noLight > 0) {
      trail += L(258, 130, 472, 198, P.bad, 4, { opacity: 0.85 * noLight, "stroke-dasharray": "10 9" });
      trail += MK.cross(496, 206, 28, noLight, P.bad);
    }

    /* the energy: stored in the plant, then passed along each arrow */
    var pb = EF_L.plant + 48, rb = EF_L.rabbit + 48, fb = EF_L.fox + 48;
    if (cStored != null && t >= cStored) trail += efToken(pb, EF_L.badge, 18, popIn(t, cStored, 0.4));
    if (cGets != null && t >= cGets + 0.85) trail += efToken(rb, EF_L.badge, 18, 1);
    trail += efTravel(pb, EF_L.badge, rb, EF_L.badge, inAt(t, cGets == null ? 1e9 : cGets, 0.85), 18);
    if (cMoves != null && t >= cMoves + 0.85) trail += efToken(fb, EF_L.badge, 18, 1);
    trail += efTravel(rb, EF_L.badge, fb, EF_L.badge, inAt(t, cMoves == null ? 1e9 : cMoves, 0.85), 18);

    /* "running on sunlight that came through the plant and the rabbit": one
       token sweeps the whole trail, from the Sun to the fox */
    var sweep = inAt(t, cRunning == null ? 1e9 : cRunning + 0.15, 2.1);
    if (sweep > 0 && sweep < 1) {
      var total = polyLen(EF_L_PATH), at = polyAt(EF_L_PATH, total * sweep);
      trail += efToken(at[0], at[1], 20, Math.min(1, sweep * 8, (1 - sweep) * 8));
    }
    var flash = bump(t, cThrough, 1.4);
    if (flash > 0) {
      trail += C(EF_L.plant, EF_L.row, 74, "none", P.gold, 5, { opacity: flash });
      trail += C(EF_L.rabbit, EF_L.row, 74, "none", P.gold, 5, { opacity: flash });
    }
    if (cRunning != null) trail += C(EF_L.fox, EF_L.row, 76, "none", P.gold, 5,
      { opacity: on(t, cRunning, 0.5) * efOnly(t, scene, 4) * (0.45 + 0.55 * breathe(t)) });

    out += G(trail, { transform: "translate(" + n2(-EF_L.shift * last) + ",0)" });

    /* "You are the same": your own food, on its own side of the line */
    if (last > 0) {
      var you = "";
      you += L(830, 40, 830, 410, P.line, 3, { "stroke-dasharray": "9 10" });
      you += MK.pop(MK.pic(1000, 150, 118, EF.you), 1000, 150, popIn(t, cYou, 0.45));
      you += MK.pic(1000, 324, 84, EF.plate, { opacity: on(t, cYourFood, 0.4) });
      you += efToken(1056, 292, 17, on(t, cYourFood, 0.5));
      you += MK.arrow(1000, 272, 1000, 224, on(t, cYourFood == null ? null : cYourFood + 0.3, 0.6), P.gold, 9);
      you += MK.pill(914, 408, "water", on(t, cWaterAir, 0.4), { size: 22, col: P.line, ink: P.muted });
      you += MK.pill(1078, 408, "air", on(t, cWaterAir == null ? null : cWaterAir + 0.2, 0.4), { size: 22, col: P.line, ink: P.muted });
      out += G(you, { opacity: last });
    }
    return svg(out);
  }

  /* ---- three kinds of eater ------------------------------------------------------ */
  var EF_BIN = { y: 230, h: 196, w: 340, slot: 360, size: 76, drop: 128 };
  var EF_BINS = [
    { x: 32, pic: EF.plant, name: "Herbivore", sub: "plants only" },
    { x: 414, pic: EF.meat, name: "Carnivore", sub: "animals only" },
    { x: 796, pic: EF.plate, name: "Omnivore", sub: "both" }
  ];
  function efBinX(b, slot) { return EF_BINS[b].x + EF_BIN.w / 2 + (slot - 1) * 104; }

  /* one of the lesson's animals, falling into its bin from the words that name it */
  function efDrop(t, at, bin, slot, pic) {
    if (at == null || t < at) return "";
    var u = ease(clamp((t - at - 0.1) / 0.5, 0, 1)), x = efBinX(bin, slot);
    return MK.pic(x, lerp(EF_BIN.drop, EF_BIN.slot, u), EF_BIN.size, pic,
      { opacity: Math.min(1, (t - at) / 0.18) });
  }

  function efEatersChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCannot = c(0, "cannot"), cEat = c(0, "eat"), cConsumer = c(0, "consumer");
    var cHerb = c(1, "herbivore"), cRabbit = c(1, "rabbit"), cHorse = c(1, "horse"), cEleph = c(1, "elephant");
    var cCarn = c(2, "carnivore"), cLion = c(2, "lion"), cOwl = c(2, "owl"), cShark = c(2, "shark");
    var cOmni = c(3, "omnivore"), cBear = c(3, "bear"), cPig = c(3, "pig"), cPeople = c(3, "people");
    var cBig = c(4, "big"), cBiggest = c(4, "biggest"), cEleph2 = c(4, "eleph"), cHerb2 = c(4, "herb");
    var out = "";

    /* which bin is being talked about now */
    var lit = [0, 0, 0];
    lit[0] = Math.max(on(t, cHerb, 0.4) * efOnly(t, scene, 1), on(t, cHerb2, 0.4) * efOnly(t, scene, 4));
    lit[1] = on(t, cCarn, 0.4) * efOnly(t, scene, 2);
    lit[2] = on(t, cOmni, 0.4) * efOnly(t, scene, 3);

    /* the three bins, from the first line on */
    EF_BINS.forEach(function (b, k) {
      var cx = b.x + EF_BIN.w / 2, isLit = lit[k] > 0.5;
      out += efCard(b.x, EF_BIN.y, EF_BIN.w, EF_BIN.h, 1, isLit);
      out += MK.pic(b.x + 56, EF_BIN.y + 42, 46, b.pic);
      out += Tx(b.x + 90, EF_BIN.y + 52, b.name, "lab big", "start", isLit ? { fill: P.gold } : null);
      out += Tx(b.x + 90, EF_BIN.y + 80, b.sub, "lab mid muted", "start");
      if (isLit) out += R(b.x, EF_BIN.y, EF_BIN.w, EF_BIN.h, 20, P.gold, null, null, { opacity: 0.08 });
    });

    /* "An animal cannot make its own food. It has to eat: it is a consumer." */
    var first = efOnly(t, scene, 0);
    if (first > 0) {
      var f = "";
      f += MK.pop(MK.pic(584, 100, 116, EF.fox), 584, 100, popIn(t, cCannot, 0.45));
      var mk = on(t, cCannot == null ? null : cCannot + 0.25, 0.5);
      f += R(344, 58, 124, 84, 16, P.cell, P.line, 2, { opacity: mk });
      f += MK.pic(378, 100, 44, EF.sun, { opacity: mk });
      f += MK.pic(434, 100, 44, EF.plant, { opacity: mk });
      f += MK.cross(406, 100, 36, popIn(t, cCannot == null ? null : cCannot + 0.5, 0.4), P.bad);
      f += MK.pop(MK.pic(754, 100, 76, EF.plate), 754, 100, popIn(t, cEat, 0.45));
      f += MK.pill(584, 196, "consumer", on(t, cConsumer, 0.4), { size: 26, col: P.gold });
      out += G(f, { opacity: first });
    }

    /* the lesson's own animals, into the lesson's own bins */
    out += efDrop(t, cRabbit, 0, 0, EF.rabbit) + efDrop(t, cHorse, 0, 1, EF.horse) + efDrop(t, cEleph, 0, 2, EF.elephant);
    out += efDrop(t, cLion, 1, 0, EF.lion) + efDrop(t, cOwl, 1, 1, EF.owl) + efDrop(t, cShark, 1, 2, EF.shark);
    out += efDrop(t, cBear, 2, 0, EF.bear) + efDrop(t, cPig, 2, 1, EF.pig) + efDrop(t, cPeople, 2, 2, EF.person);

    /* "Big does not mean carnivore": the elephant, in the herbivore bin */
    var fifth = efOnly(t, scene, 4);
    if (fifth > 0) {
      var ex = efBinX(0, 2), b5 = "";
      b5 += MK.cross(EF_BINS[1].x + 56, EF_BIN.y + 42, 32, popIn(t, cBig, 0.4), P.bad);
      b5 += efLabel(t, 306, 190, "the biggest land animal", cBiggest, [ex, EF_BIN.slot - 44], true, 22);
      b5 += C(ex, EF_BIN.slot, 56, "none", P.gold, 5, { opacity: on(t, cEleph2, 0.4) * (0.5 + 0.5 * breathe(t)) });
      b5 += MK.tick(ex + 76, EF_BIN.slot - 30, 22, popIn(t, cHerb2, 0.4));
      out += G(b5, { opacity: fifth });
    }
    return svg(out);
  }
