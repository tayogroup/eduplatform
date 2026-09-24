
  /* ==== chapters: predator and prey, the model, the sea chain, the recap ========
     tools/lib/film-scenes/science-g4/energy-for-life-3.js.

     "Predator and prey" is the explore step's four cards, in its order and
     with its own labels: predator, prey, both at once, the producer.
     "A model of who eats whom" is the lesson kit's OWN food chain drawing
     (ART.kit.foodChainSvg): grass, then the rabbit, then the fox, then the
     grass taken away, exactly the states the build step reaches.
     "A sea food chain" is the order step's four sea creatures, drawn as the
     diagram the child is asked to draw; the seal is the kit's own drawing,
     because the seal emoji is too new for a school device.

     Every arrow in this film points from the thing eaten to the eater, which
     is what the model chapter names out loud, so no arrow anywhere in it means
     anything else. */

  /* ---- predator and prey ---------------------------------------------------- */
  var EF_H = { y: 58, h: 286, w: 276, pic: 148, title: 268, sub: 306 };
  var EF_H_X = [8, 298, 588, 878];
  function efHCx(k) { return EF_H_X[k] + EF_H.w / 2; }

  function efHuntCard(k, o, lit, title, sub) {
    if (!(o > 0)) return "";
    var cx = efHCx(k);
    return G(efCard(EF_H_X[k], EF_H.y, EF_H.w, EF_H.h, 1, lit) +
      Tx(cx, EF_H.title, title, "lab big", "middle", lit ? { fill: P.gold } : null) +
      Tx(cx, EF_H.sub, sub, "lab mid muted", "middle"),
      { opacity: Math.min(1, o), transform: around(cx, EF_H.y + EF_H.h / 2, Math.min(o, 1.02)) });
  }

  function efHuntChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPred = c(0, "predator"), cOwl = c(0, "owl"), cFox = c(0, "fox"), cShark = c(0, "shark");
    var cPrey = c(1, "prey"), cHunted = c(1, "hunted"), cMouse = c(1, "mouse");
    var cSmall = c(2, "small"), cZebra = c(2, "zebra"), cLion = c(2, "lion"), cHuge = c(2, "huge");
    var cFrog = c(3, "frog"), cBoth = c(3, "both"), cFlies = c(3, "flies"), cHeron = c(3, "heron");
    var cPlant = c(4, "plant"), cNeither = c(4, "neither"), cProducer = c(4, "producer"), cEaten = c(4, "eaten");
    var out = "";

    /* card 0: the predator, and the lesson's other three hunters under it */
    out += efHuntCard(0, popIn(t, cPred, 0.45), efOnly(t, scene, 0) > 0.5, "predator", "hunts other animals");
    out += MK.pop(MK.pic(efHCx(0), EF_H.pic, 100, EF.owl), efHCx(0), EF_H.pic, popIn(t, cOwl, 0.45));
    out += MK.pop(MK.pic(efHCx(0) - 78, 220, 50, EF.fox), efHCx(0) - 78, 220, popIn(t, cFox, 0.4));
    out += MK.pop(MK.pic(efHCx(0), 220, 50, EF.shark), efHCx(0), 220, popIn(t, cShark, 0.4));
    out += MK.pop(MK.pic(efHCx(0) + 78, 220, 50, EF.lion), efHCx(0) + 78, 220, popIn(t, cLion, 0.4));

    /* card 1: the prey. The mouse steps aside for the zebra on the third line. */
    var third = efFrom(t, scene, 2);
    out += efHuntCard(1, popIn(t, cPrey, 0.45), efOnly(t, scene, 1) + efOnly(t, scene, 2) > 0.5, "prey", "gets hunted");
    var mx = lerp(efHCx(1), efHCx(1) - 44, third), ms = lerp(100, 70, third);
    out += MK.pop(MK.pic(mx, 150, ms, EF.mouse), mx, 150, popIn(t, cMouse, 0.45));
    out += MK.pop(MK.pic(494, 150, 96, EF.zebra), 494, 150, popIn(t, cZebra, 0.45));
    if (cHuge != null) out += C(494, 150, 62, "none", P.gold, 5,
      { opacity: on(t, cHuge, 0.4) * efOnly(t, scene, 2) * (0.45 + 0.55 * breathe(t)) });
    /* the mouse is eaten by the owl, and the zebra by the lion: every arrow in
       this film points at the eater */
    out += MK.arrow(mx - ms * 0.56, 150, efHCx(0) + 56, 150, on(t, cHunted, 0.7), P.gold, 8);
    out += MK.arrow(442, 196, 256, 216, on(t, cLion == null ? null : cLion + 0.2, 0.7) * third, P.gold, 8);

    /* card 2: both at once. The fly is eaten by the frog, the frog by the heron. */
    out += efHuntCard(2, popIn(t, cFrog, 0.45), efOnly(t, scene, 3) > 0.5, "both at once", "hunter and hunted");
    out += MK.pop(MK.pic(716, 150, 84, EF.frog), 716, 150, popIn(t, cFrog, 0.45));
    out += efFly(630, 84, 1.3, on(t, cFlies, 0.4));
    out += MK.arrow(646, 94, 678, 122, on(t, cFlies == null ? null : cFlies + 0.15, 0.5), P.gold, 7);
    out += efHeron(822, 112, 0.85, on(t, cHeron, 0.45));
    out += MK.arrow(752, 134, 794, 122, on(t, cHeron == null ? null : cHeron + 0.3, 0.5), P.gold, 7);
    if (cBoth != null) out += C(716, 150, 58, "none", P.plum, 4,
      { opacity: on(t, cBoth, 0.4) * (1 - on(t, cFlies, 0.5)) });

    /* card 3: the producer, which is neither, and still gets eaten */
    out += efHuntCard(3, popIn(t, cPlant, 0.45), efOnly(t, scene, 4) > 0.5, "the producer", "neither");
    out += MK.pop(MK.pic(efHCx(3), EF_H.pic, 100, EF.plant), efHCx(3), EF_H.pic, popIn(t, cPlant, 0.45));
    out += MK.pill(efHCx(3), 34, "not predator, not prey", on(t, cNeither, 0.4), { size: 20, col: P.line, ink: P.muted });
    if (cProducer != null) out += C(efHCx(3), EF_H.pic, 62, "none", P.gold, 5,
      { opacity: on(t, cProducer, 0.4) * (0.45 + 0.55 * breathe(t)) });
    out += MK.pop(MK.pic(1104, 88, 52, EF.rabbit), 1104, 88, popIn(t, cEaten, 0.4));
    out += MK.arrow(1052, 118, 1082, 100, on(t, cEaten == null ? null : cEaten + 0.2, 0.5), P.gold, 7);
    return svg(out);
  }

  /* ---- a model of who eats whom ------------------------------------------------ */
  var EF_M = { x: 288, y: 6, w: 592, h: 370, k: 1.85 };
  function efMX(v) { return EF_M.x + v * EF_M.k; }
  function efMY(v) { return EF_M.y + v * EF_M.k; }
  var EF_M_ITEM = [efMX(60), efMX(160), efMX(260)];

  function efModelChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cChain = c(0, "chain"), cModel = c(0, "model"), cWhom = c(0, "whom");
    var cGrass = c(1, "grass"), cProducer = c(1, "producer"), cLight = c(1, "light");
    var cRabbit = c(2, "rabbit"), cHerb = c(2, "herbivore"), cPrey = c(2, "prey");
    var cFox = c(3, "fox"), cConsumer = c(3, "consumer"), cPredator = c(3, "predator");
    var cArrow = c(4, "arrow"), cEatenBy = c(4, "eatenby"), cEnergy = c(4, "energy");
    var cAway = c(5, "away"), cNothing = c(5, "nothing"), cBreaks = c(5, "breaks");
    var out = "", tokenY = efMY(56);

    /* the lesson's own drawing, in the states its build step reaches */
    var st = {};
    if (cGrass != null && t >= cGrass) st.grass = true;
    if (cRabbit != null && t >= cRabbit) st.rabbit = true;
    if (cFox != null && t >= cFox) st.fox = true;
    if (cAway != null && t >= cAway) st.gone = true;
    out += R(EF_M.x - 8, 0, EF_M.w + 16, EF_M.h + 14, 18, P.card, P.line, 2);
    out += ART.place(ART.kit.foodChainSvg(st), EF_M.x, EF_M.y, EF_M.w, EF_M.h);

    /* the lesson's own words for each part, under it */
    out += MK.pill(EF_M_ITEM[0], 412, "producer", on(t, cProducer, 0.4), { size: 22, col: P.gold });
    out += MK.pill(EF_M_ITEM[1], 412, "herbivore, prey", on(t, cHerb, 0.4), { size: 22, col: P.gold });
    out += MK.pill(EF_M_ITEM[2], 412, "predator", on(t, cPredator, 0.4), { size: 22, col: P.gold });
    /* the grass's energy still comes from light */
    var lightO = on(t, cLight, 0.6) * efOnly(t, scene, 1);
    out += Em(efMX(22), efMY(28), 46, EF.sun, { opacity: lightO });
    out += efRays(efMX(30), efMY(44), efMX(52), efMY(92), lightO, 15);

    /* the first line, while the chain is still empty */
    var first = efOnly(t, scene, 0);
    if (first > 0) {
      var slots = "";
      for (var s3 = 0; s3 < 3; s3++) {
        var so = on(t, cChain == null ? null : cChain + s3 * 0.22, 0.4);
        if (so <= 0) continue;
        slots += R(EF_M_ITEM[s3] - 56, 148, 112, 148, 16, "none", "#7D8FA0", 3,
          { opacity: 0.8 * so, "stroke-dasharray": "12 9" });
        slots += MK.qmark(EF_M_ITEM[s3], 222, 24, so * 0.9);
      }
      out += G(slots + MK.arrow(84, 262, 204, 262, on(t, cChain, 0.5), P.gold, 9) +
        MK.pill(134, 170, "a model", on(t, cModel, 0.4), { size: 26, col: P.gold }) +
        MK.pill(1030, 170, "who eats whom", on(t, cWhom, 0.4), { size: 24, col: P.line }), { opacity: first });
    }

    /* "Each arrow means eaten by, and it shows which way the energy goes" */
    var fifth = efOnly(t, scene, 4);
    if (fifth > 0) {
      var leg = "";
      leg += MK.arrow(944, 150, 1104, 150, on(t, cArrow, 0.5), P.gold, 9);
      leg += MK.pill(1024, 214, "eaten by", on(t, cEatenBy, 0.4), { size: 22, col: P.gold });
      var fl = bump(t, cArrow, 1.3);
      if (fl > 0) {
        leg += C(efMX(110), efMY(110), 40, "none", P.gold, 5, { opacity: fl });
        leg += C(efMX(210), efMY(110), 40, "none", P.gold, 5, { opacity: fl });
      }
      var u = inAt(t, cEnergy == null ? 1e9 : cEnergy, 1.7) * 2;
      if (u > 0 && u < 2) {
        var seg = u < 1 ? 0 : 1, uu = u < 1 ? u : u - 1;
        leg += efTravel(EF_M_ITEM[seg], tokenY, EF_M_ITEM[seg + 1], tokenY, uu, 19);
      }
      out += G(leg, { opacity: fifth });
    }

    /* "Take the grass away ... and the chain breaks" */
    var sixth = efOnly(t, scene, 5);
    if (sixth > 0) {
      out += G(MK.cross(134, 186, 54, popIn(t, cAway, 0.45), P.bad) +
        MK.pill(134, 300, "no grass", on(t, cAway == null ? null : cAway + 0.3, 0.4), { size: 22, col: P.bad, ink: P.bad }) +
        MK.pill(1024, 186, "nothing to eat", on(t, cNothing, 0.4), { size: 22, col: P.bad, ink: P.bad }) +
        MK.cross(1024, 300, 48, popIn(t, cBreaks, 0.45), P.bad), { opacity: sixth });
    }
    return svg(out);
  }

  /* ---- a sea food chain ---------------------------------------------------------- */
  /* Sizes rise with the words: "tiny floating plants" is the smallest icon on
     the row and "seal" the largest, so a growing chain of sizes is visible,
     the way the sentences themselves grow: a small fish, then A BIGGER fish,
     then a seal that eats it. */
  var EF_D = { y: 188, label: 302, role: 340 };
  var EF_D_X = [168, 452, 736, 1020];
  var EF_D_ITEMS = [
    { pic: EF.plant, label: "tiny floating plants", role: "producer", size: 58 },
    { pic: EF.fishSmall, label: "small fish", role: "herbivore, prey", size: 82 },
    { pic: EF.fishBig, label: "bigger fish", role: "predator and prey", size: 106 },
    { pic: EF.seal, label: "seal", role: "predator", size: 130 }
  ];

  function efDiagramChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSea = c(0, "sea"), cTiny = c(0, "tiny");
    var cSmall = c(1, "small"), cHerb = c(1, "herb"), cPrey = c(1, "prey");
    var cBigger = c(2, "bigger"), cSeal = c(2, "seal");
    var cProducer = c(3, "producer"), cArrow = c(3, "arrow"), cEater = c(3, "eater");
    var at = [cTiny, cSmall, cBigger, cSeal];
    var roleAt = [cTiny, cHerb, cBigger, cSeal];
    var out = "";

    out += R(20, 92, 1128, 300, 24, "#0F3348", P.line, 2, { opacity: on(t, cSea, 0.5) });
    EF_D_ITEMS.forEach(function (item, k) {
      var p = popIn(t, at[k], 0.45);
      if (p <= 0) return;
      out += MK.pop(MK.pic(EF_D_X[k], EF_D.y, item.size, item.pic), EF_D_X[k], EF_D.y, p);
      out += Tx(EF_D_X[k], EF_D.label, item.label, "lab mid", "middle", { opacity: Math.min(1, p) });
      out += Tx(EF_D_X[k], EF_D.role, item.role, "lab small muted", "middle", { opacity: on(t, roleAt[k], 0.5) });
      if (k > 0) out += MK.arrow(EF_D_X[k - 1] + EF_D_ITEMS[k - 1].size / 2 + 8, EF_D.y,
        EF_D_X[k] - item.size / 2 - 8, EF_D.y, on(t, at[k], 0.7), P.gold, 9);
      if (k === 1 && cPrey != null) out += C(EF_D_X[1], EF_D.y, item.size / 2 + 14, "none", P.gold, 4,
        { opacity: on(t, cPrey, 0.4) * efOnly(t, scene, 1) });
    });

    /* "Start with the producer, always, and point each arrow at the eater." */
    var last = efOnly(t, scene, 3);
    if (last > 0) {
      var g = "";
      g += C(EF_D_X[0], EF_D.y, EF_D_ITEMS[0].size / 2 + 14, "none", P.gold, 5,
        { opacity: on(t, cProducer, 0.4) * (0.45 + 0.55 * breathe(t)) });
      g += MK.pill(EF_D_X[0], 372, "start here", on(t, cProducer, 0.4), { size: 20, col: P.gold });
      /* the way a child gets it wrong: an arrow back at the plants */
      var w = on(t, cArrow, 0.5);
      g += MK.arrow(EF_D_X[1] - EF_D_ITEMS[1].size / 2 - 8, 130, EF_D_X[0] + EF_D_ITEMS[0].size / 2 + 24, 130, w, P.bad, 7);
      g += MK.cross(EF_D_X[0] + 150, 130, 24, popIn(t, cArrow == null ? null : cArrow + 0.3, 0.4), P.bad);
      /* and the way it is right: a dot runs each arrow to the eater.
         This is the chapter's LAST beat with no following beat to absorb
         overflow, and "eater" (the cue) lands late in a short line: on the
         estimated timeline only 1.5s remains after it, and the review found
         the real voice (measured ~10% faster elsewhere) leaves as little as
         1.33s. 1.0s for all three dots finishes with margin in both cases. */
      var u = inAt(t, cEater == null ? 1e9 : cEater, 1.0);
      for (var k = 1; k < 4; k++) {
        var uu = clamp(u * 3 - (k - 1), 0, 1);
        if (uu > 0 && uu < 1) g += C(lerp(EF_D_X[k - 1] + EF_D_ITEMS[k - 1].size / 2 + 8, EF_D_X[k] - EF_D_ITEMS[k].size / 2 - 8, uu),
          EF_D.y, 12, P.gold, "#7A5A10", 2);
      }
      out += G(g, { opacity: last });
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------- */
  var EF_RECAP = MK.recapKind([
    { beat: 0, at: "energy", title: "Energy", sub: "to grow, move and stay healthy", pic: EF.bolt },
    { beat: 0, at: "light", title: "Plants", sub: "get their energy from light", pic: EF.plant },
    { beat: 0, at: "eating", title: "Animals", sub: "get their energy by eating", pic: EF.fox },
    { beat: 1, at: "eaters", title: "Three kinds of eater", sub: "plants, animals, both", pic: EF.plate },
    { beat: 1, at: "hunt", title: "Predator and prey", sub: "hunter and hunted", pic: EF.owl },
    { beat: 2, at: "chain", title: "Food chain", sub: "the arrow points at the eater", pic: EF.arrow }
  ], { goBeat: 2, goAt: "arrows" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Where the energy for life starts", "Herbivore, carnivore, omnivore", "Predator, prey and a food chain"] }),
    energy: efEnergyChapter, light: efLightChapter, eaters: efEatersChapter,
    hunt: efHuntChapter, model: efModelChapter, diagram: efDiagramChapter, recap: EF_RECAP
  };
