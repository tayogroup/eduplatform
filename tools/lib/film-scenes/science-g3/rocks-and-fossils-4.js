  /* ==== chapters: taking carefully, and what you now know =======================
     tools/lib/film-scenes/science-g3/rocks-and-fossils-4.js. */

  /* ---- taking carefully ----------------------------------------------------------
     The four things the lesson's own Earth and us step asks the child to tap -
     a quarry, an oil well, recycling and a scientist - as a card each, lit as
     it is named, with the geologist and the palaeontologist given a card
     apiece. The last line marks what science does with them: it sees the harm
     (a lens on the two that do harm) and does less of it (a tick on
     recycling). */
  var RF_TAKE = { y: 62, h: 300, gap: 16, m: 10 };
  RF_TAKE.w = (1168 - 2 * RF_TAKE.m - 4 * RF_TAKE.gap) / 5;

  function rfTakeCard(k, pic, title, titleSize, sub, p, mark) {
    var b = RF_TAKE, x = b.m + k * (b.w + b.gap), lit = p > 0.05;
    var cx = x + b.w / 2;
    return G(R(x, b.y, b.w, b.h, 20, lit ? "#1B3A52" : P.card, lit ? P.teal : P.line, lit ? 3 : 2) +
      MK.pic(cx, b.y + 92, 86, pic) +
      Tx(cx, b.y + 186, title, "lab", "middle", { "font-size": titleSize || 24 }) +
      Tx(cx, b.y + 222, sub, "lab mid muted readable", "middle") +
      (mark || ""),
      { opacity: 0.3 + 0.7 * Math.min(1, p), transform: around(cx, b.y + b.h / 2, 0.96 + 0.04 * Math.min(p, 1.08)) });
  }
  function rfTakeSlot(k) { return RF_TAKE.m + k * (RF_TAKE.w + RF_TAKE.gap) + RF_TAKE.w / 2; }

  function rfTakingChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cQuarry = c(0, "quarry"), cHole = c(0, "hole");
    var cSpill = c(1, "spill"), cBirds = c(1, "birds"), cCare = c(1, "careful");
    var cRec = c(2, "recycle"), cLess = c(2, "less");
    var cGeo = c(3, "geo"), cPal = c(3, "pal");
    var cSee = c(4, "see"), cDo = c(4, "do");
    var b = RF_TAKE, out = "", mark;

    /* the quarry: the hill it cuts into, and the hole it leaves */
    var hole = on(t, cHole, 0.8), hx = rfTakeSlot(0);
    mark = Pth("M" + (hx - 84) + "," + (b.y + 288) + " q40,-52 84,-52 q44,0 84,52 z", RF_ROCK[1], null, null, { opacity: on(t, cQuarry, 0.5) }) +
      Pth("M" + (hx - 26) + "," + (b.y + 288) + " l0," + n2(-26 * hole) + " l24,0 l0," + n2(-14 * hole) + " l28,0 l0," + n2(40 * hole) + " z", "#0B1D2C", null, null, { opacity: hole });
    out += rfTakeCard(0, "⛏️", "A quarry", 24, "a big hole left", popIn(t, cQuarry, 0.45), mark);

    /* the oil well: a spill spreading over the sea */
    var sp = on(t, cBirds, 1.0), sx = rfTakeSlot(1);
    mark = R(sx - 88, b.y + 256, 176, 34, 8, RF_SEA, null, null, { opacity: on(t, cSpill, 0.5) }) +
      E(sx + 14, b.y + 275, 62 * sp, 12 * sp, RF_OIL, null, null, { opacity: sp }) +
      Em(sx - 52, b.y + 268, 42, "\u{1F426}", { opacity: sp });
    out += rfTakeCard(1, "\u{1F6E2}️", "An oil well", 24, "a spill harms birds", popIn(t, cSpill, 0.45), mark);

    /* recycling: one can, made into a new can, and less rock dug up */
    var ls = on(t, cLess, 0.8), rx = rfTakeSlot(2);
    mark = MK.pic(rx - 52, b.y + 274, 48, "\u{1F96B}") + MK.arrow(rx - 22, b.y + 274, rx + 22, b.y + 274, on(t, cRec, 0.5), P.good, 6) +
      MK.pic(rx + 52, b.y + 274, 48, "\u{1F96B}", { opacity: on(t, cRec == null ? null : cRec + 0.3, 0.4) }) +
      MK.pic(rx + b.w / 2 - 38, b.y + 36, 40, "\u{1FAA8}", { opacity: ls }) +
      MK.arrow(rx + b.w / 2 - 76, b.y + 20, rx + b.w / 2 - 76, b.y + 52, ls, P.good, 6);
    out += rfTakeCard(2, "♻️", "Recycling", 24, "less digging", popIn(t, cRec, 0.45), mark);

    /* the two people in the lesson who use science at work */
    out += rfTakeCard(3, "\u{1F469}\u{1F3FE}‍\u{1F52C}", "A geologist", 24, "studies rocks",
      popIn(t, cGeo, 0.45), MK.pic(rfTakeSlot(3), b.y + 272, 52, "\u{1FAA8}", { opacity: on(t, cGeo, 0.5) }));
    out += rfTakeCard(4, "\u{1F9D1}‍\u{1F52C}", "A palaeontologist", 19, "studies fossils",
      popIn(t, cPal, 0.45), MK.pic(rfTakeSlot(4), b.y + 272, 52, "\u{1F41A}", { opacity: on(t, cPal, 0.5) }));

    /* the last line: science sees the harm, and does less of it */
    out += MK.pop(Em(rfTakeSlot(0) - b.w / 2 + 32, b.y + 34, 44, "\u{1F50D}"), rfTakeSlot(0) - b.w / 2 + 32, b.y + 34, popIn(t, cSee, 0.4));
    out += MK.pop(Em(rfTakeSlot(1) - b.w / 2 + 32, b.y + 34, 44, "\u{1F50D}"), rfTakeSlot(1) - b.w / 2 + 32, b.y + 34, popIn(t, cSee == null ? null : cSee + 0.25, 0.4));
    out += MK.tick(rfTakeSlot(2) - b.w / 2 + 32, b.y + 30, 20, popIn(t, cDo, 0.4));
    out += MK.glow(rfTakeSlot(2), b.y + b.h / 2, 150, P.good, on(t, cDo, 0.6) * 0.8 * (0.6 + 0.4 * breathe(t)));
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------------- */
  var RF_RECAP = MK.recapKind([
    { beat: 0, at: "earth", title: "Planet Earth", sub: "every material starts here", pic: "\u{1F30D}" },
    { beat: 1, at: "ore", title: "Ore", sub: "metal inside rock", pic: "\u{1FAA8}" },
    { beat: 1, at: "glass", title: "Glass", sub: "melted sand", pic: "\u{1FA9F}" },
    { beat: 1, at: "oil", title: "Oil", sub: "petrol and plastic", pic: "\u{1F6E2}️" },
    { beat: 2, at: "fossil", title: "Fossil", sub: "a shape kept in rock", pic: "\u{1F41F}" },
    { beat: 3, at: "look", title: "Look it up", sub: "a fact card answers", pic: "\u{1F4D6}" },
    { beat: 3, at: "recycle", title: "Recycle", sub: "less digging", pic: "♻️" }
  ], { goBeat: 3, goAt: "recycle" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Where every material comes from", "How a fossil forms in rock", "Taking from the Earth carefully"] }),
    planet: rfPlanetChapter, ores: rfOresChapter, oilgas: rfOilgasChapter,
    fossil: rfFossilChapter, lookitup: rfLookitupChapter, taking: rfTakingChapter, recap: RF_RECAP
  };
