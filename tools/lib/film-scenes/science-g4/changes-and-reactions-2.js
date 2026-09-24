  /* ==== Changes and Reactions, part 2: Mixing and A chemical reaction =========
     tools/lib/film-scenes/science-g4/changes-and-reactions-2.js.

     Both chapters stand on the SAME drawing: the lesson's own two beakers,
     ART.sim("reaction", "draw", a, b) - sand in water on the left, vinegar and
     bicarbonate of soda on the right - which is the experiment the child runs
     two steps later. Mixing talks about the left beaker and pales the right
     one; the reaction chapter does the opposite. Nothing is cropped: the whole
     drawing stands on its card in both, and the half not being talked about is
     washed back towards the card's own paper colour.

     The card is drawn at k = 1.65 and centred, so the drawing's own captions
     ("sand and water: a mixture", "bicarbonate of soda") come out at about
     20 px - the smallest size the brief allows for words in a picture. They
     are the lesson's own words, so they are worth being able to read. That
     leaves a column each side and a strip underneath for everything else. */

  /* the lesson's drawing is 320 x 220; here it is 528 x 363 */
  var CR_BK = { x: 250, y: 30, k: 1.65 };
  function crBX(v) { return CR_BK.x + v * CR_BK.k; }
  function crBY(v) { return CR_BK.y + v * CR_BK.k; }
  function crBkFrame() { return R(CR_BK.x - 10, CR_BK.y - 10, 320 * CR_BK.k + 20, 220 * CR_BK.k + 20, 18, P.card, P.line, 2); }
  function crBkCard(a, b, o) {
    if (!(o > 0)) return "";
    return G(ART.place(ART.sim("reaction", "draw", a, b), CR_BK.x, CR_BK.y, 320 * CR_BK.k, 220 * CR_BK.k),
      { opacity: clamp(o, 0, 1) });
  }
  /* the beaker not being talked about, washed back towards the card's paper */
  function crPale(which, o) {
    if (!(o > 0)) return "";
    var x0 = which === "right" ? crBX(160) : crBX(18), x1 = which === "right" ? crBX(302) : crBX(160);
    return R(x0, crBY(32), x1 - x0, crBY(214) - crBY(32), 10, "#F3EFE6", null, null, { opacity: 0.72 * clamp(o, 0, 1) });
  }
  /* where each beaker stands, in the film's space */
  var CR_LEFT = crBX(90), CR_RIGHT = crBX(230);
  var CR_MOUTH = crBY(50), CR_CAPTION = crBY(206);

  /* a gold box round one of the drawing's own captions */
  function crCaptionBox(cx, w, o) {
    if (!(o > 0)) return "";
    return R(cx - w / 2, CR_CAPTION - 22, w, 33, 11, "none", P.gold, 3, { opacity: clamp(o, 0, 1) });
  }

  /* grains of sand falling from (x, y0) to y1, between `from` and `until` */
  function crGrains(t, from, until, x, y0, y1, o) {
    if (from == null || t < from || !(o > 0)) return "";
    var out = "";
    for (var k = 0; k < 8; k++) {
      var born = from + k * 0.09, life = 0.8;
      if (t < born || t > until + life) continue;
      var ph = clamp((t - born) / life, 0, 1);
      var gx = x + (CR_SCATTER[k] - 0.5) * 44, gy = lerp(y0, y1, ph * ph);
      out += C(gx, gy, 4 + 3 * CR_SCATTER[(k + 5) % 12], "#C9A26B", null, null,
        { opacity: clamp(Math.min(1, (1 - ph) * 4), 0, 1) * clamp(o, 0, 1) });
    }
    return out;
  }

  /* ==== chapter: Mixing ========================================================= */
  function crMixChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cStir = c(0, "stir"), cWatch = c(0, "watch");
    var cSinks = c(1, "sinks"), cSand = c(1, "stillsand"), cWater = c(1, "stillwater");
    var cNothing = c(2, "nothing"), cMixture = c(2, "mixture");
    var cFilter = c(3, "filter"), cPhysical = c(3, "physical");

    var stir = on(t, cStir, 0.6);
    var out = crBkFrame() + crBkCard(false, false, 1);
    if (stir > 0) out += crBkCard(true, false, stir);
    out += crPale("right", 1);

    /* "stir sand into water": the sand goes in */
    out += crGrains(t, cStir, cStir == null ? 0 : cStir + 0.7, CR_LEFT, crBY(26), crBY(148), 1);
    /* "watch carefully what the sand does" */
    out += C(CR_LEFT, crBY(116), 82, "none", P.gold, 4, { opacity: on(t, cWatch, 0.5) * crOnly(t, scene, 0) });
    out += MK.ripple(CR_LEFT, crBY(174), t, cWatch, P.gold);

    /* "It sinks to the bottom" */
    out += MK.arrow(CR_LEFT, crBY(100), CR_LEFT, crBY(158), on(t, cSinks, 0.7) * crOnly(t, scene, 1), P.gold, 7);
    /* the two substances, each still itself */
    out += MK.leader(206, 150, 342, crBY(116), on(t, cWater, 0.6), "#6FA8C8");
    out += MK.pill(146, 150, "water", on(t, cWater, 0.4), { size: 26, col: "#6FA8C8" });
    out += MK.leader(198, 268, 342, crBY(174), on(t, cSand, 0.6), "#C9A26B");
    out += MK.pill(146, 268, "sand", on(t, cSand, 0.4), { size: 26, col: "#C9A26B" });

    /* "Nothing new has been made here. This is a mixture." */
    out += crNewBadge(984, 86, 28, popIn(t, cNothing, 0.45), true);
    out += MK.pill(984, 170, "a mixture", on(t, cMixture, 0.4), { size: 34, col: P.good });

    /* "You could filter the sand back out again": the lesson's own sieve, and
       the arrow with a head at each end, because a mixture really does undo */
    var fu = on(t, cFilter, 0.6);
    if (fu > 0) {
      out += G(MK.pic(984, 250, 86, ART.ICONS.sieve), { opacity: fu });
      for (var g = 0; g < 4; g++) out += C(960 + g * 16, 200, 5, "#C9A26B", null, null, { opacity: fu });
      out += crDrop(966, 314, 9, fu) + crDrop(1002, 310, 9, fu);
    }
    out += crWayBack(984, 352, 118, fu, P.good);
    out += MK.pill(984, 406, "physical change", on(t, cPhysical, 0.35), { size: 26, col: P.good });
    out += MK.tick(1140, 406, 18, popIn(t, cPhysical == null ? null : cPhysical + 0.15, 0.3));
    return svg(out);
  }

  /* ==== chapter: A chemical reaction ============================================
     The right beaker now. Vinegar pours in (the lesson kit's own bottle), the
     drawing switches to its fizzing state on the word "fizzes", and the gas is
     followed all the way: named, shown not to have been there a moment ago,
     shown not to be air, and finally shown to have no way back. */
  function crReactChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPour = c(0, "pour"), cBicarb = c(0, "bicarb"), cPredict = c(0, "predict");
    var cFizz = c(1, "fizz"), cGas = c(1, "gas");
    var cNotexist = c(2, "notexist"), cMade = c(2, "made");
    var cNotair = c(3, "notair"), cReact = c(3, "react");
    var cNewsub = c(4, "newsub"), cNoback = c(4, "noback");
    var cMakes = c(5, "makes"), cChem = c(5, "chem");

    var fizz = on(t, cFizz, 0.5);
    var out = crBkFrame() + crBkCard(true, false, 1);
    if (fizz > 0) out += crBkCard(true, true, fizz);
    out += crPale("left", 1);

    /* "pour vinegar": the kit's bottle tips over the beaker and pours */
    var po = on(t, cPour, 0.4) * crOnly(t, scene, 0);
    if (po > 0) {
      var tip = -118 * on(t, cPour == null ? null : cPour + 0.2, 0.5);
      out += G(MK.pic(720, 68, 92, ART.ICONS.bottle), { transform: "rotate(" + n2(tip) + " 720 68)", opacity: po });
      out += crPourDrops(t, cPour == null ? null : cPour + 0.55, cPour == null ? 0 : cPour + 1.5,
        676, 100, crBY(136), CR_RIGHT - 676, 7);
    }
    /* "bicarbonate of soda": the drawing's own caption, boxed */
    out += crCaptionBox(CR_RIGHT, 216, on(t, cBicarb, 0.45) * crOnly(t, scene, 0));
    /* "Predict what will happen" */
    out += MK.bubble(818, 288, 340, 78, "What will happen?", on(t, cPredict, 0.5) * crOnly(t, scene, 0), 756, 320);

    /* "It fizzes at once. Bubbles of a gas pour out of the beaker." */
    out += crBubbles(t, cFizz, null, CR_RIGHT, CR_MOUTH - 6, 76, 9, fizz);
    out += MK.glow(CR_RIGHT, 92, 66, P.gold, fizz * (0.3 + 0.35 * breathe(t)));
    out += MK.leader(898, 72, 706, 48, on(t, cGas, 0.6), P.gold);
    out += MK.pill(984, 68, "a new gas", on(t, cGas, 0.45), { size: 26, col: P.gold });

    /* "That gas did not exist a moment ago. It is being made in front of you." */
    out += MK.list(842, 152, [
      { text: "a moment ago: no gas", at: cNotexist, mark: "cross" },
      { text: "now: a gas, being made", at: cMade, mark: "tick" }
    ], t, { lh: 58, cls: "lab", markR: 16 });

    /* "The fizz is not just air escaping", then the name of what it really is */
    out += MK.cross(830, 268, 23, popIn(t, cNotair == null ? null : cNotair + 0.4, 0.4) * (1 - on(t, cChem, 0.22)));
    out += crSlot(t, 1000, 268, [
      { at: cNotair, text: "just air escaping?", col: P.line },
      { at: cChem, text: "a chemical reaction", col: P.gold }
    ], 24);

    /* "The two substances are reacting": the two of them meet */
    var re = on(t, cReact, 0.5) * crOnly(t, scene, 3);
    if (re > 0) {
      out += MK.pill(150, 414, "vinegar", re, { size: 26, col: P.gold });
      out += MK.pill(1010, 414, "bicarbonate of soda", re, { size: 24, col: P.gold });
      var ra = on(t, cReact == null ? null : cReact + 0.15, 0.5) * crOnly(t, scene, 3);
      out += MK.arrow(218, 414, 543, 414, ra, P.gold, 7);
      out += MK.arrow(860, 414, 625, 414, ra, P.gold, 7);
      out += MK.glow(584, 414, 25, P.gold, re * (0.5 + 0.5 * breathe(t)));
    }

    /* "New substances have been made, and you cannot get the old ones back." */
    var ns = popIn(t, cNewsub, 0.45);
    out += crNewBadge(984, 352, 30, ns * (1 + 0.1 * bump(t, cMakes, 0.9)), false);
    out += crNoWayBack(584, 414, 176, on(t, cNoback, 0.6), on(t, cNoback == null ? null : cNoback + 0.35, 0.5));
    return svg(out);
  }
