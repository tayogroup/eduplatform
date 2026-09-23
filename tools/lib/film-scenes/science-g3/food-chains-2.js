  /* ==== Food Chains, part 2 ====================================================
     The consumers, the sorting bins and the arrow. See food-chains.js. */

  /* ==== chapter: the consumers =====================================================
     The lesson's own chain builder (ART.kit.foodChainSvg), built link by link
     exactly as the "Build a food chain" step builds it: the grass is already
     there from the last chapter, the rabbit arrives when it is named and the
     fox after it, and the kit draws its own arrows and its own line "the arrow
     means is eaten by" as each link lands. The card is placed whole and never
     cropped; everything the film adds sits outside it. */
  var FC_C = { x: 290, y: 26, w: 588 };
  function fcCX(v) { return FC_C.x + v * FC_C.w / 320; }
  function fcCY(v) { return FC_C.y + v * FC_C.w / 320; }

  /* a soft gold plate behind one of the card's own "producer"/"consumer" words */
  function fcRole(cx, o) {
    if (!(o > 0)) return "";
    return R(cx - 62, fcCY(24) - 21, 124, 29, 9, P.gold, null, null, { opacity: 0.3 * o }) +
      R(cx - 62, fcCY(24) - 21, 124, 29, 9, "none", P.gold, 2.5, { opacity: o });
  }

  function fcConsumersChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cAnimal = c(0, "animal"), cCannot = c(0, "cannot"), cEat = c(0, "eat");
    var cRabbit = c(1, "rabbit"), cEats = c(1, "eats"), cConsumer = c(1, "consumer");
    var cFox = c(2, "fox"), cEatsR = c(2, "eatsr"), cToo = c(2, "too");
    var cThree = c(3, "three"), cChain = c(3, "chain"), cWhom = c(3, "whom");
    var out = "";

    var hasRabbit = cRabbit != null && t >= cRabbit, hasFox = cFox != null && t >= cFox;
    var state = { grass: true, rabbit: hasRabbit, fox: hasFox };
    var gx = fcCX(60), rx = fcCX(160), fx = fcCX(260), gy = fcCY(102);

    /* the whole chain in a gold frame, for "A food chain" */
    var frame = on(t, cChain, 0.6);
    if (frame > 0) out += R(FC_C.x - 8, FC_C.y - 8, FC_C.w + 16, FC_C.w * 200 / 320 + 16, 24, "none", P.gold, 4, { opacity: frame });
    out += ART.place(ART.kit.foodChainSvg(state), FC_C.x, FC_C.y, FC_C.w, FC_C.w * 200 / 320);

    /* beat 0: an animal on its own, with no way to make food */
    var b0 = fcOnly(t, scene, 0);
    if (b0 > 0) {
      out += G(MK.pic(146, 196, 132, FC.rabbit), { opacity: b0 * popIn(t, cAnimal, 0.45) });
      /* the cross sits UNDER the words, never over them: a cross drawn on top
         of the pill read as "mak(x)ood" in the first preview */
      var no = on(t, cCannot, 0.4) * b0;
      out += MK.pill(1010, 104, "make food", no, { size: 28, col: P.line });
      out += MK.cross(1010, 176, 30, popIn(t, cCannot == null ? null : cCannot + 0.25, 0.4) * b0);
      var ea = popIn(t, cEat, 0.45) * b0;
      out += MK.pill(1010, 258, "has to eat", Math.min(1, ea), { size: 28, col: P.gold, ink: P.gold });
      out += G(MK.pic(1010, 340, 100, FC.plate), { opacity: clamp(ea, 0, 1) });
      out += MK.tick(1058, 382, 24, popIn(t, cEat == null ? null : cEat + 0.3, 0.4) * b0);
    }

    /* beat 1 and 2: each animal joins the chain and its role word lights up */
    if (hasRabbit) {
      out += MK.glow(rx, gy, 98, P.gold, on(t, cRabbit, 0.5) * (1 - on(t, cFox, 0.5)) * 0.9);
      out += C(rx, gy, 58 + 6 * bump(t, cRabbit, 0.7), "none", P.gold, 4, { opacity: on(t, cRabbit, 0.35) * (1 - on(t, cFox, 0.6)) });
    }
    if (hasFox) {
      out += MK.glow(fx, gy, 98, P.gold, on(t, cFox, 0.5) * (1 - fcFrom(t, scene, 3)) * 0.9);
      out += C(fx, gy, 58 + 6 * bump(t, cFox, 0.7), "none", P.gold, 4, { opacity: on(t, cFox, 0.35) * (1 - fcFrom(t, scene, 3)) });
    }
    /* the first arrow of the card lands as "eats the grass" is said, the second on "eats the rabbit" */
    out += MK.ripple(fcCX(110), fcCY(104), t, cEats, P.gold);
    out += MK.ripple(fcCX(210), fcCY(104), t, cEatsR, P.gold);

    /* the lesson's own word, over the animal it belongs to, and big enough to read */
    out += fcRole(rx, on(t, cConsumer, 0.45) * (1 - fcFrom(t, scene, 3)));
    out += fcRole(fx, on(t, cToo, 0.45) * (1 - fcFrom(t, scene, 3)));
    out += MK.pill(1020, 178, "consumer", popIn(t, cConsumer, 0.45) * (1 - fcFrom(t, scene, 3)), { size: 34, col: P.gold, ink: P.gold });
    out += MK.tick(1020, 268, 28, popIn(t, cToo, 0.45) * (1 - fcFrom(t, scene, 3)));

    /* beat 3: grass, rabbit, fox - each named again in turn, then the whole chain */
    var three = tally(t, cThree, 3, 1.0), xs3 = [gx, rx, fx];
    for (var k = 0; k < 3; k++) {
      if (three <= k) continue;
      var at3 = cThree == null ? null : cThree + k * 0.5;
      out += C(xs3[k], gy, 56 + 6 * bump(t, at3, 0.6), "none", P.gold, 4, { opacity: on(t, at3, 0.3) * (1 - on(t, cChain, 0.5)) });
    }
    /* "who eats whom": the card's own line under the chain */
    var wh = on(t, cWhom, 0.7);
    if (wh > 0) out += L(fcCX(76), fcCY(188), lerp(fcCX(76), fcCX(244), wh), fcCY(188), P.gold, 4);
    return svg(out);
  }

  /* ==== chapter: producer, or consumer? ============================================
     The lesson's own sorting step: its two bins (Producer, a seedling; Consumer,
     a plate) and six of its eight living things dropping into them as they are
     named, then the cow that makes milk and is a consumer all the same - the
     misconception the lesson's own explain() names. */
  /* The bins fill the stage: the first cut drew them 300 wide with three 62 px
     pictures 90 px apart, and their names ran into each other. */
  var FC_BIN = { y: 202, h: 208, w: 480, top: 320, lab: 386 };
  var FC_BINS = {
    prod: { x: 56, pic: FC.seedling, name: "Producer", rule: "makes its own food", slots: [176, 296, 416], size: 90 },
    cons: { x: 632, pic: FC.plate, name: "Consumer", rule: "has to eat", slots: [728, 824, 920, 1016], size: 78 }
  };
  function fcBin(b, o, ruleO) {
    if (!(o > 0)) return "";
    var mid = b.x + FC_BIN.w / 2;
    return G(R(b.x, FC_BIN.y, FC_BIN.w, FC_BIN.h, 22, P.card, P.line, 3) +
      MK.pic(b.x + 56, 166, 54, b.pic) +
      MK.pill(b.x + 200, 166, b.name, 1, { size: 30, col: P.line }) +
      Tx(mid, 252, b.rule, "lab mid muted", "middle", { opacity: clamp(ruleO, 0, 1) }), { opacity: clamp(o, 0, 1) });
  }
  /* one thing falling into its bin: it drops in from above and keeps its name */
  function fcDrops(t, at, cx, size, pic, name) {
    var u = on(t, at, 0.5);
    if (u <= 0) return "";
    return MK.pic(cx, lerp(FC_BIN.top - 150, FC_BIN.top, u * u), size, pic, { opacity: Math.min(1, u * 3) }) +
      Tx(cx, FC_BIN.lab, name, "lab mid", "middle", { opacity: on(t, at == null ? null : at + 0.35, 0.4) });
  }

  function fcSortChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPlants = c(0, "plants"), cAnimals = c(0, "animals"), cRule = c(0, "rule");
    var cOak = c(1, "oak"), cSea = c(1, "sea"), cDand = c(1, "dand"), cMake = c(1, "make");
    var cOwl = c(2, "owl"), cFish = c(2, "fish"), cRab = c(2, "rab"), cCons = c(2, "cons");
    var cCow = c(3, "cow"), cMilk = c(3, "milk"), cEats = c(3, "eats"), cCon2 = c(3, "consumer");
    var Pb = FC_BINS.prod, Cb = FC_BINS.cons, out = "", ru = on(t, cRule, 0.5);

    out += fcBin(Pb, popIn(t, cPlants, 0.45), ru);
    out += fcBin(Cb, popIn(t, cAnimals, 0.45), ru);

    out += fcDrops(t, cOak, Pb.slots[0], Pb.size, FC.oak, "oak tree");
    out += fcDrops(t, cSea, Pb.slots[1], Pb.size, FC.grass, "seagrass");
    out += fcDrops(t, cDand, Pb.slots[2], Pb.size, FC.dandelion, "dandelion");
    out += MK.tick(Pb.x + FC_BIN.w - 36, FC_BIN.y + 36, 24, popIn(t, cMake, 0.4));

    out += fcDrops(t, cOwl, Cb.slots[0], Cb.size, FC.owl, "owl");
    out += fcDrops(t, cFish, Cb.slots[1], Cb.size, FC.fish, "fish");
    out += fcDrops(t, cRab, Cb.slots[2], Cb.size, FC.rabbit, "rabbit");
    out += MK.tick(Cb.x + FC_BIN.w - 36, FC_BIN.y + 36, 24, popIn(t, cCons, 0.4));

    /* the cow: it makes milk, it drifts towards the wrong bin, then it eats
       grass and lands in the right one */
    var pop = popIn(t, cCow, 0.45);
    if (pop > 0) {
      /* the cow is in its bin before the line ends: keyed off "eats grass", not
         off "a consumer", which is the last two words of the chapter's last
         beat - a landing hung on that runs past the chapter and is cut off */
      var uM = on(t, cMilk, 0.6), uE = on(t, cEats, 0.5);
      var uC = on(t, cEats == null ? null : cEats + 0.5, 0.7);
      var cx = lerp(584, 470, uM); cx = lerp(cx, 584, uE); cx = lerp(cx, Cb.slots[3], uC);
      /* it travels along ABOVE the bins and only then drops in, so it never
         crosses the Consumer bin's own label on the way */
      var drop = clamp((uC - 0.45) / 0.55, 0, 1);
      /* it travels at 76, not 96: at 96 its feet crossed the Consumer bin's
         own name pill on the way past */
      var cy = lerp(76, FC_BIN.top, drop), size = lerp(112, Cb.size, uC);
      out += G(MK.pic(cx + 92, 68, 60, FC.milk), { opacity: popIn(t, cMilk, 0.4) * (1 - uC) });
      out += MK.qmark(cx - 86, 68, 22, popIn(t, cMilk == null ? null : cMilk + 0.2, 0.4) * (1 - uE));
      out += G(MK.pic(cx - 76, cy + 8, 52, FC.grass), { opacity: popIn(t, cEats, 0.4) * (1 - uC) });
      out += G(MK.pic(cx, cy, size, FC.cow), { opacity: Math.min(1, pop) });
      /* the name and the tick are keyed off "eats grass" too, for the same
         reason the landing is: "a consumer" is the last two words of the
         chapter's last beat, so anything hung on it lands after the chapter
         has gone. Timed this way the tick falls on "Eating makes it a
         consumer" instead of after it. */
      out += Tx(Cb.slots[3], FC_BIN.lab, "cow", "lab mid", "middle", { opacity: on(t, cEats == null ? null : cEats + 0.7, 0.4) });
      out += MK.tick(Cb.slots[3] + 46, FC_BIN.top - 46, 22, popIn(t, cEats == null ? null : cEats + 1.0, 0.4));
    }
    return svg(out);
  }

  /* ==== chapter: the arrow =========================================================
     The chain drawn big as a diagram, the way the lesson's demo draws it:
     grass, arrow, rabbit, arrow, fox. The arrow's meaning is shown by sending
     the grass along it into the rabbit, and the lesson's own misconception -
     "Children draw the arrow the wrong way" - is met with a crossed-out arrow
     pointing back. */
  var FC_A = { y: 160, size: 118, x: [250, 584, 918], names: ["grass", "rabbit", "fox"] };

  function fcArrowChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cDraw = c(0, "draw"), cArrows = c(0, "arrows"), cOne = c(0, "one"), cTwo = c(0, "two");
    var cMeans = c(1, "means"), cEatenBy = c(1, "eatenby");
    var cPoints = c(2, "points"), cEats = c(2, "eats");
    var cFrom = c(3, "from"), cTo = c(3, "to"), cNever = c(3, "never");
    var cDiagram = c(4, "diagram"), cModel = c(4, "model");
    var pics = [FC.grass, FC.rabbit, FC.fox], out = "";

    /* the dashed frame that makes the whole row "a diagram" */
    var fr = on(t, cDiagram, 0.7), mo = on(t, cModel, 0.6);
    if (fr > 0) out += R(172, 56, 836, 344, 26, "none", P.gold, 3,
      { "stroke-dasharray": "14 10", opacity: fr * (mo > 0 ? 0.6 + 0.4 * breathe(t) : 1) });

    var bumps = [Math.max(bump(t, cOne, 0.5), bump(t, cFrom, 0.6)),
      Math.max(bump(t, cOne == null ? null : cOne + 0.45, 0.5), bump(t, cEatenBy == null ? null : cEatenBy + 0.7, 0.6), bump(t, cTo, 0.6)),
      bump(t, cTwo, 0.6)];
    for (var k = 0; k < 3; k++) {
      var p = popIn(t, cDraw == null ? null : cDraw + k * 0.3, 0.4);
      if (p <= 0) continue;
      var s = Math.min(p, 1) * (1 + 0.09 * bumps[k]) * (mo > 0 ? 1 + 0.02 * breathe(t) : 1);
      out += MK.glow(FC_A.x[k], FC_A.y, 92, P.gold, bumps[k] * 0.9);
      out += G(MK.pic(FC_A.x[k], FC_A.y, FC_A.size, pics[k]), { transform: around(FC_A.x[k], FC_A.y, s) });
      out += Tx(FC_A.x[k], 250, FC_A.names[k], "lab big", "middle", { opacity: Math.min(1, p) });
    }

    /* the two arrows, drawn as they are said */
    var a1 = Math.max(on(t, cArrows, 0.6), on(t, cTo, 0.5)), a2 = on(t, cArrows == null ? null : cArrows + 0.35, 0.6);
    out += MK.arrow(326, FC_A.y, 508, FC_A.y, a1, P.gold, 8);
    out += MK.arrow(660, FC_A.y, 842, FC_A.y, a2, P.gold, 8);
    out += MK.pill(417, 92, "is eaten by", popIn(t, cMeans, 0.45), { size: 26, col: P.gold, ink: P.gold });

    /* "Grass is eaten by the rabbit": the grass travels along the arrow into it */
    var uE = on(t, cEatenBy, 0.85);
    if (uE > 0 && uE < 1) out += MK.pic(lerp(340, 500, uE), FC_A.y, 50, FC.grass, { opacity: Math.min(1, uE * 5, (1 - uE) * 5) });

    /* "from the food to the animal that eats it" */
    out += MK.pill(250, 316, "food", popIn(t, cPoints, 0.45), { size: 28, col: P.gold, ink: P.gold });
    out += MK.pill(584, 316, "the eater", popIn(t, cEats, 0.45), { size: 28, col: P.gold, ink: P.gold });

    /* "never the other way": the wrong arrow, crossed out (the lesson's own misconception) */
    var nv = on(t, cNever, 0.5) * (1 - on(t, cDiagram, 0.5));
    if (nv > 0) {
      /* the cross follows the wrong arrow at once: a bare grey arrow with no
         cross on it reads as a stray line (seen in the first preview) */
      out += MK.arrow(508, 378, 326, 378, nv, P.muted, 7);
      out += MK.cross(417, 378, 30, popIn(t, cNever == null ? null : cNever + 0.15, 0.4) * nv);
    }
    out += MK.tick(417, 205, 17, popIn(t, cTo == null ? null : cTo + 0.3, 0.4) * (1 - on(t, cDiagram, 0.5)));
    out += MK.pill(750, 56, "diagram", popIn(t, cDiagram, 0.45), { size: 28, col: P.gold, ink: P.gold });
    return svg(out);
  }
