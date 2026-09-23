  /* ==== Food Chains, part 3 ====================================================
     A chain you can hold, chains and people, and the recap. See food-chains.js. */

  /* ==== chapter: a chain you can hold ==============================================
     The lesson's own physical model, from the demo step's last two frames: three
     cards, drawn and then tied in a row with string, held up by the grass card -
     and then let go, so the whole chain falls. The cards carry the lesson's own
     three pictures and its own three names. */
  /* The cards are the picture of this chapter, so they are big: the first cut
     drew them 116 x 96 in the left third and they read as postage stamps. */
  /* The column hangs CLEAR of the ground: at the first layout the fox card's
     bottom edge sat 5 px above the grass while the line said the whole chain
     hangs from the grass card, so nothing hung. */
  var FC_MD = {
    w: 180, h: 110, colx: 430,
    col: [[430, 92], [430, 212], [430, 332]],
    row: [[228, 210], [430, 210], [632, 210]],
    land: [[278, 362, -9], [466, 372, 7], [652, 360, -5]],
    ground: 424
  };

  /* one card: the lesson's picture on paper, with its own name under it */
  function fcCard(cx, cy, rot, pic, name, o) {
    if (!(o > 0)) return "";
    var w = FC_MD.w, h = FC_MD.h;
    var inner = R(-w / 2, -h / 2, w, h, 12, P.paper, "#CBB994", 2) +
      MK.pic(0, -h * 0.15, h * 0.58, pic) +
      Tx(0, h * 0.40, name, "lab mid", "middle", { fill: P.dark });
    return G(inner, {
      transform: "translate(" + n2(cx) + "," + n2(cy) + ")" + (rot ? " rotate(" + n2(rot) + ")" : ""),
      opacity: clamp(o, 0, 1)
    });
  }

  /* a length of string between two cards, drawn as it is tied */
  function fcString(x1, y1, x2, y2, u) {
    if (!(u > 0)) return "";
    var ey = lerp(y1, y2, clamp(u, 0, 1));
    return L(x1, y1, x2, ey, "#CBB994", 3) + C(x1, y1, 4, "#CBB994") +
      (u >= 1 ? C(x2, y2, 4, "#CBB994") : "");
  }

  function fcModelChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cMake = c(0, "make"), cDraw = c(0, "draw"), cCards = c(0, "cards");
    var cTie = c(1, "tie"), cUnder = c(1, "under"), cFox = c(1, "fox");
    var cHold = c(2, "hold"), cHangs = c(2, "hangs"), cModel = c(2, "model");
    var cLetGo = c(3, "letgo"), cWatch = c(3, "watch"), cFalls = c(3, "falls");
    var cNoGrass = c(4, "nograss"), cNoRabbit = c(4, "norabbit"), cLink = c(4, "link");
    var pics = [FC.grass, FC.rabbit, FC.fox], names = ["grass", "rabbit", "fox"], out = "";

    /* Each card appears as the lesson names what to draw on it: "Draw grass, a
       rabbit and a fox". They used to wait for "three cards", the last two
       words of the line, so the stage held one card and an empty field for
       most of the beat and the other two arrived after the voice had moved on. */
    var cardAt = [cDraw, cDraw == null ? null : cDraw + 0.55, cDraw == null ? null : cDraw + 1.1];
    var appear = [popIn(t, cardAt[0], 0.45), popIn(t, cardAt[1], 0.45), popIn(t, cardAt[2], 0.45)];
    /* the cards move into a column as they are tied */
    var uTie = on(t, cTie, 0.8), uFox = on(t, cFox, 0.8);
    /* the whole chain falls, a moment after the grass card is let go */
    var fallAt = cWatch != null ? cWatch + 0.2 : (cLetGo == null ? null : cLetGo + 0.9);
    var fu = on(t, fallAt, 0.85); fu = fu * fu;

    out += fcGround(180, FC_MD.ground, 760, 1);

    /* the hand that holds the grass card up, and lets it go */
    var handO = on(t, cHold, 0.45) * (1 - on(t, cLetGo, 0.35));
    if (handO > 0) {
      /* the hand grips the top of the grass card. It used to sit above it with
         a string between, and --sweep caught the emoji 8 px over the top edge. */
      out += G(MK.pic(FC_MD.colx, 40, 52, FC.hand), { opacity: handO });
    }

    /* the three cards: in a row, then in a column, then on the ground */
    var at = [];
    for (var k = 0; k < 3; k++) {
      var u = k === 2 ? uFox : uTie;
      var x = lerp(FC_MD.row[k][0], FC_MD.col[k][0], u), y = lerp(FC_MD.row[k][1], FC_MD.col[k][1], u);
      x = lerp(x, FC_MD.land[k][0], fu); y = lerp(y, FC_MD.land[k][1], fu);
      at.push([x, y, lerp(0, FC_MD.land[k][2], fu)]);
    }
    /* the string is tied before it can hold anything up */
    out += fcString(at[0][0], at[0][1] + FC_MD.h / 2, at[1][0], at[1][1] - FC_MD.h / 2, on(t, cUnder, 0.5));
    out += fcString(at[1][0], at[1][1] + FC_MD.h / 2, at[2][0], at[2][1] - FC_MD.h / 2, on(t, cFox == null ? null : cFox + 0.3, 0.5));
    for (var k2 = 0; k2 < 3; k2++) out += fcCard(at[k2][0], at[k2][1], at[k2][2], pics[k2], names[k2], appear[k2]);

    /* "make a chain you can hold": three empty slots, each fading out as its
       own card is drawn into it, so the stage is never one card in a field */
    var mk = on(t, cMake, 0.5);
    if (mk > 0) for (var k3 = 0; k3 < 3; k3++)
      out += fcSlot(FC_MD.row[k3][0], FC_MD.row[k3][1], 150, mk * (1 - clamp(appear[k3], 0, 1)), null, 0);
    /* "three cards": the count, while they are still a row */
    out += MK.pill(880, 210, "three cards", popIn(t, cCards, 0.45) * (1 - uTie), { size: 28, col: P.line });

    /* "the whole chain hangs from it": a LINE with two ends, never an arrow:
       a gold arrow beside a food chain is the one mark this lesson spends a
       whole step teaching the meaning of. */
    var hang = on(t, cHangs, 0.5) * (1 - on(t, cLetGo, 0.4));
    if (hang > 0) {
      var hx = FC_MD.colx - 124, hy0 = 104, hy1 = lerp(hy0, 388, hang);
      out += L(hx, hy0, hx, hy1, P.gold, 4, { opacity: hang }) +
        L(hx - 11, hy0, hx + 11, hy0, P.gold, 4, { opacity: hang }) +
        L(hx - 11, hy1, hx + 11, hy1, P.gold, 4, { opacity: hang }) +
        Tx(hx - 20, 254, "hangs", "lab mid muted", "end", { opacity: hang });
    }
    /* "watch": a ring round the chain the moment before it drops */
    var wa = on(t, cWatch, 0.35) * (1 - fu);
    if (wa > 0) out += R(FC_MD.colx - 100, 26, 200, 376, 26, "none", P.gold, 4,
      { opacity: wa * (0.55 + 0.45 * breathe(t)) });

    /* "That is a physical model", kept until the last beat takes the right side */
    var keep = 1 - fcFrom(t, scene, 4);
    out += MK.pill(880, 150, "physical model", popIn(t, cModel, 0.45) * keep, { size: 34, col: P.gold, ink: P.gold });

    /* the last beat: no grass, no rabbit; no rabbit, no fox */
    var fin = fcFrom(t, scene, 4);
    if (fin > 0) {
      out += MK.list(700, 128, [
        { text: "No grass, no rabbit", at: cNoGrass, mark: "cross" },
        { text: "No rabbit, no fox", at: cNoRabbit, mark: "cross" }
      ], t, { lh: 84, cls: "lab big" });
      out += MK.pill(880, 312, "every link", popIn(t, cLink, 0.45), { size: 32, col: P.gold, ink: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: chains and people =================================================
     The lesson's own "Breaking the chain" step, three of its four pictures in
     the order the lecture says them: the weedkiller that takes the plants and
     so the caterpillars and so the birds; the oil that blocks the pond's light
     and takes the whole pond chain; and the hedge that plants a producer and
     starts a new one. One chain is on screen at a time. */
  var FC_P = { y: 196, size: 118, x: [280, 584, 888], name: 290 };
  var FC_PD = { top: 140, bot: 340, x: [220, 490, 760, 1010], y: 248, size: 96, name: 322 };

  /* a link of a chain on the stage: the lesson's picture, its name, and a cross
     or a tick when what people do decides it */
  function fcLink(cx, cy, size, pic, name, nameY, o, markAt, t, mark) {
    if (!(o > 0)) return "";
    var out = G(MK.pic(cx, cy, size, pic) + Tx(cx, nameY, name, "lab mid", "middle"), { opacity: clamp(o, 0, 1) });
    var p = popIn(t, markAt, 0.4);
    if (mark === "cross") out += MK.cross(cx, cy, size * 0.42, p);
    else if (mark === "tick") out += MK.tick(cx + size * 0.42, cy - size * 0.36, size * 0.2, p);
    return out;
  }

  /* An oil drum, drawn rather than lifted from the emoji font: this machine
     draws the lesson's picture for "oil in the pond" as a bright BLUE barrel,
     and blue beside a pond reads as water, which is the opposite of the point. */
  function fcDrum(cx, cy, w, o) {
    if (!(o > 0)) return "";
    var h = w * 1.2, top = -h / 2, ry = w * 0.19;
    return G(R(-w / 2, top + ry, w, h - 2 * ry, 3, "#2B2118") +
      R(-w / 2, top + h * 0.3, w, 5, 2, "#6B5B48") +
      R(-w / 2, top + h * 0.62, w, 5, 2, "#6B5B48") +
      E(0, top + h - ry, w / 2, ry, "#1B140E") +
      E(0, top + ry, w / 2, ry, "#3C3026", "#15100A", 2),
      { transform: tr(cx, cy) + " scale(" + n3(Math.min(1, o)) + ")", opacity: clamp(o, 0, 1) });
  }

  /* one ray of sunlight: a plain band from near the Sun towards a point, cut
     short when something blocks it. Not an arrow - see fcModelChapter. */
  function fcRay(sx, sy, tx, ty, reach, o) {
    if (!(o > 0) || !(reach > 0)) return "";
    var dx = tx - sx, dy = ty - sy, len = Math.hypot(dx, dy) || 1;
    var x0 = sx + dx / len * 26, y0 = sy + dy / len * 26;
    return L(x0, y0, lerp(x0, tx, reach), lerp(y0, ty, reach), P.gold, 9,
      { opacity: 0.72 * clamp(o, 0, 1), "stroke-linecap": "butt" });
  }

  /* the weedkiller falling on the plants: the lesson's own test tube, and drops */
  function fcSpray(t, at, x, y) {
    var o = popIn(t, at, 0.45);
    if (!(o > 0)) return "";
    var out = G(MK.pic(x, y, 74, FC.spray), { transform: around(x, y, Math.min(1, o)), opacity: Math.min(1, o) });
    var fall = on(t, at == null ? null : at + 0.35, 0.9);
    for (var k = 0; k < 6; k++) {
      var u = clamp(fall * 1.6 - FC_SCATTER[k] * 0.6, 0, 1);
      if (u <= 0 || u >= 1) continue;
      out += fcDrop(x - 34 + FC_SCATTER[k] * 68, lerp(y + 44, FC_P.y - 40, u), 8, 1 - u * 0.4);
    }
    return out;
  }

  function fcPeopleChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSpray = c(0, "spray"), cDie = c(0, "die"), cCats = c(0, "cats");
    var cBirds = c(1, "birds"), cHungry = c(1, "hungry"), cGone = c(1, "gone");
    var cOil = c(2, "oil"), cLight = c(2, "light"), cWeed = c(2, "weed"), cSnails = c(2, "snails"),
      cFrogs = c(2, "frogs"), cHeron = c(2, "heron");
    var cHedge = c(3, "hedge"), cProducer = c(3, "producer"), cInsects = c(3, "insects"),
      cBirds2 = c(3, "birds"), cNewChain = c(3, "newchain");
    var cScience = c(4, "science"), cActions = c(4, "actions"), cLiving = c(4, "living");
    var out = "";

    var toPond = fcFrom(t, scene, 2), toHedge = fcFrom(t, scene, 3);
    var land = 1 - toPond, pond = toPond * (1 - toHedge), hedge = toHedge;

    /* ---- the land chain: plants, caterpillars, birds ---- */
    if (land > 0) {
      var L1 = "";
      L1 += MK.arrow(348, FC_P.y, 512, FC_P.y, 1, P.muted, 6);
      L1 += MK.arrow(652, FC_P.y, 816, FC_P.y, 1, P.muted, 6);
      L1 += fcLink(FC_P.x[0], FC_P.y, FC_P.size, FC.grass, "plants", FC_P.name, 1, cDie, t, "cross");
      L1 += fcLink(FC_P.x[1], FC_P.y, FC_P.size, FC.caterpillar, "caterpillars", FC_P.name, 1, cCats, t, "cross");
      L1 += fcLink(FC_P.x[2], FC_P.y, FC_P.size, FC.bird, "birds", FC_P.name, 1, cHungry, t, "cross");
      L1 += fcSpray(t, cSpray, FC_P.x[0], 68);
      /* "the birds that eat them": the arrow the birds depend on, lit */
      L1 += MK.arrow(652, FC_P.y, 816, FC_P.y, on(t, cBirds, 0.5), P.gold, 6);
      /* "One spray, three links gone" */
      L1 += MK.pill(584, 396, "three links gone", popIn(t, cGone, 0.5), { size: 30, col: P.bad, ink: P.bad });
      out += G(L1, { opacity: clamp(land, 0, 1) });
    }

    /* ---- the pond chain: pondweed, snails, frogs, heron ---- */
    if (pond > 0) {
      var pics = [FC.grass, FC.snail, FC.frog, FC.heron];
      var names = ["pondweed", "snails", "frogs", "heron"];
      var marks = [cWeed, cSnails, cFrogs, cHeron];
      var oil = on(t, cOil, 0.6), blocked = on(t, cLight, 0.7);
      var P1 = "";
      P1 += R(110, FC_PD.top, 948, FC_PD.bot - FC_PD.top, 22, "#12455E", P.line, 3);
      /* the light the pondweed lives on, and the oil that blocks it. The first
         cut drew three short dashed stubs and they read as stray marks; this is
         a fan of beams from the Sun the lesson's own pond chain starts with. */
      var beam = [430, 584, 738], reach = 1 - 0.52 * blocked;
      P1 += fcSun(584, 40, 16, 1, t);
      for (var r = 0; r < 3; r++) P1 += fcRay(584, 40, beam[r], FC_PD.top - 4, reach, 1);
      P1 += MK.pill(812, 90, "light", on(t, cLight, 0.4), { size: 26, col: P.gold, ink: P.gold });
      P1 += MK.cross(584, 100, 26, popIn(t, cLight == null ? null : cLight + 0.2, 0.4));
      P1 += R(110, FC_PD.top, 948 * oil, 38, 0, "#2B2118", null, null, { opacity: oil });
      P1 += R(110, FC_PD.top + 38, 948, FC_PD.bot - FC_PD.top - 38, 0, "#08222F", null, null, { opacity: 0.55 * blocked });
      /* the lesson's own "oil in the pond", drawn and named */
      P1 += fcDrum(176, 66, 62, popIn(t, cOil, 0.45));
      P1 += MK.pill(268, 66, "oil", popIn(t, cOil == null ? null : cOil + 0.2, 0.4), { size: 26, col: P.gold, ink: P.gold });
      for (var k4 = 0; k4 < 3; k4++)
        P1 += MK.arrow(FC_PD.x[k4] + 52, FC_PD.y, FC_PD.x[k4 + 1] - 52, FC_PD.y, 1, P.muted, 6);
      for (var k5 = 0; k5 < 4; k5++)
        P1 += fcLink(FC_PD.x[k5], FC_PD.y, FC_PD.size, pics[k5], names[k5], FC_PD.name, 1, marks[k5], t, "cross");
      out += G(P1, { opacity: clamp(pond, 0, 1) });
    }

    /* ---- the hedge: a producer planted, and a new chain ---- */
    if (hedge > 0) {
      var H = "", hx = FC_P.x;
      H += MK.arrow(360, FC_P.y, 508, FC_P.y, on(t, cInsects, 0.5), P.good, 6);
      H += MK.arrow(660, FC_P.y, 816, FC_P.y, on(t, cBirds2, 0.5), P.good, 6);
      H += fcLink(hx[0], FC_P.y, 140, FC.oak, "a hedge", FC_P.name, popIn(t, cHedge, 0.45), cProducer, t, "tick");
      H += fcLink(hx[1], FC_P.y, FC_P.size, FC.caterpillar, "insects", FC_P.name, popIn(t, cInsects, 0.45), cInsects == null ? null : cInsects + 0.4, t, "tick");
      H += fcLink(hx[2], FC_P.y, FC_P.size, FC.bird, "birds", FC_P.name, popIn(t, cBirds2, 0.45), cBirds2 == null ? null : cBirds2 + 0.4, t, "tick");
      H += MK.pill(hx[0], 336, "producer", popIn(t, cProducer, 0.45), { size: 28, col: P.good, ink: P.good });
      var nc = on(t, cNewChain, 0.7);
      if (nc > 0) H += R(186, 104, 794, 268, 26, "none", P.good, 4, { opacity: nc * (0.6 + 0.4 * breathe(t)) });
      /* the last beat: science, our actions, the living things */
      H += MK.pill(584, 58, "science", popIn(t, cScience, 0.45), { size: 30, col: P.teal, ink: P.teal });
      for (var k6 = 0; k6 < 3; k6++)
        H += MK.leader(584, 82, hx[k6], FC_P.y - 74, on(t, cActions == null ? null : cActions + k6 * 0.18, 0.5), P.teal);
      var liv = tally(t, cLiving, 3, 0.9);
      for (var k7 = 0; k7 < 3; k7++) {
        if (liv <= k7) continue;
        var at7 = cLiving == null ? null : cLiving + k7 * 0.3;
        H += MK.glow(hx[k7], FC_P.y, 92, P.good, on(t, at7, 0.4) * (0.6 + 0.4 * breathe(t)));
      }
      out += G(H, { opacity: clamp(hedge, 0, 1) });
    }
    return svg(out);
  }

  /* ==== what you now know ========================================================== */
  var FC_RECAP = MK.recapKind([
    { beat: 0, at: "producer", title: "Producer", sub: "a plant makes its own food", pic: FC.grass },
    { beat: 1, at: "consumer", title: "Consumer", sub: "an animal has to eat", pic: FC.rabbit },
    { beat: 2, at: "arrow", title: "The arrow", sub: "means is eaten by", pic: FC.arrow },
    { beat: 2, at: "hold", title: "A model", sub: "draw it, or hold it on cards", pic: FC.link },
    /* the lesson's own picture for the chain falling (the demo's last frame,
       "let go of the grass card") - three pictures in one recap card were a
       smudge at this size, and the roadworks sign said nothing about a chain */
    { beat: 3, at: "falls", title: "Break a link", sub: "the whole chain falls", pic: "\u{1F6AB}" }
  ], { goBeat: 3, goAt: "matters" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Producers, consumers and the arrow", "Build a food chain, then break it", "What people do to living things"] }),
    producers: fcProducersChapter,
    consumers: fcConsumersChapter,
    sort: fcSortChapter,
    arrow: fcArrowChapter,
    model: fcModelChapter,
    people: fcPeopleChapter,
    recap: FC_RECAP
  };
