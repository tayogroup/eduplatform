
  /* ==== chapters: the backbone sort, the fact card, and the recap ==============
     tools/lib/film-scenes/science-g4/backbone-or-not-5.js.

     The sort is the lesson's own step: its ten animals, in its own order, and
     its two bins with its own bin pictures. Each animal leaves the tray for a
     bin as it is named. The fact card is the lesson's secondary source,
     "Living in a suit of armour", in its own words, and then the moult it
     describes. */

  /* ---- the backbone sort ---------------------------------------------------- */
  /* the lesson's ten animals, in the order its step lists them */
  var BN_SORT = [
    { pic: "\u{1F415}", name: "dog", at: "dog", bin: 0, slot: 0 },
    { pic: "\u{1F40C}", name: "snail", at: "snail", bin: 1, slot: 0 },
    { pic: "\u{1F988}", name: "shark", at: "shark", bin: 0, slot: 1 },
    { pic: "\u{1F577}️", name: "spider", at: "spider", bin: 1, slot: 1 },
    { pic: "\u{1F438}", name: "frog", at: "frog", bin: 0, slot: 2 },
    { pic: "\u{1FABC}", name: "jellyfish", at: "jelly", bin: 1, slot: 2 },
    { pic: "\u{1F98E}", name: "lizard", at: "lizard", bin: 0, slot: 3 },
    { pic: "\u{1F41D}", name: "bee", at: "bee", bin: 1, slot: 3 },
    { pic: "\u{1F99C}", name: "parrot", at: "parrot", bin: 0, slot: 4 },
    { pic: "\u{1FAB1}", name: "earthworm", at: "worm", bin: 1, slot: 4 }
  ];
  var BN_TRAY_Y = 110, BN_BIN_Y = 364;
  function bnTrayX(k) { return 110 + k * 105; }
  function bnBinX(bin, slot) { return (bin === 0 ? 156 : 724) + slot * 78; }

  function bnSortPic(t, scene) {
    var cSort = sc(scene, 0, "sort"), cAsk = sc(scene, 0, "ask"), cSpine = sc(scene, 0, "spine");
    var out = "";
    /* the lesson's two bins, with its own bin pictures */
    var bo = on(t, cSort == null ? null : cSort + 0.5, 0.6);
    out += R(96, 300, 432, 128, 18, P.cell, P.blue, 2, { opacity: bo });
    out += R(664, 300, 432, 128, 18, P.cell, P.plum, 2, { opacity: bo });
    out += G(MK.pic(228, 276, 44, "\u{1F9B4}") + Tx(258, 288, "Vertebrate", "lab big", "start", { fill: P.blue }), { opacity: bo });
    out += G(MK.pic(796, 276, 44, "\u{1F6AB}") + Tx(826, 288, "Invertebrate", "lab big", "start", { fill: P.plum }), { opacity: bo });

    var n = tally(t, cSort, 10, 0.9);
    BN_SORT.forEach(function (a, k) {
      if (k >= n) return;
      var born = cSort == null ? null : cSort + 0.9 * k / 9;
      var at = sc(scene, a.bin === 0 ? 1 : 2, a.at);
      var u = at == null ? 0 : ease(clamp((t - at) / 0.55, 0, 1));
      var x = lerp(bnTrayX(k), bnBinX(a.bin, a.slot), u), y = lerp(BN_TRAY_Y, BN_BIN_Y, u);
      var size = lerp(84, 56, u), now = u > 0 && u < 1;
      out += MK.pop(MK.pic(x, y, size, a.pic), x, y, popIn(t, born, 0.35));
      if (now || u >= 1) {
        var mk = a.bin === 0 ? MK.tick : MK.cross;
        out += mk(x + size * 0.46, y - size * 0.52, 12, popIn(t, at == null ? null : at + 0.45, 0.35));
      }
      if (u > 0 && u < 1) out += MK.pill(x, y - size * 0.8, a.name, 1 - u * 0.3, { size: 22, col: P.gold });
    });

    /* the lesson's own question, and the thing to look for */
    var ao = on(t, cAsk, 0.5) * bnOnly(t, scene, 0);
    if (ao > 0) out += G(MK.bubble(374, 176, 400, 92, "Bones inside, or not?", 1, 574, 292), { opacity: ao });
    var so = on(t, cSpine, 0.5) * bnOnly(t, scene, 0);
    if (so > 0) out += G(bnSpine([[790, 236], [1030, 236]], 6, on(t, cSpine, 0.8), 34, 1) +
      MK.pill(910, 160, "a spine of bones", 1, { size: 26, col: P.gold }), { opacity: so });
    return out;
  }

  /* "Size is not the test": the lesson's giant squid */
  function bnSquidPic(t, scene) {
    var cSize = sc(scene, 3, "size"), cSquid = sc(scene, 3, "squid"), cInv = sc(scene, 3, "inv");
    var out = "", p = popIn(t, cSquid, 0.45);
    out += MK.pop(Em(400, 192, 288, "\u{1F991}"), 400, 192, p);
    out += MK.pill(400, 386, "a giant squid", Math.min(1, p), { size: 32, col: P.gold });
    var mo = on(t, cSize, 0.6);
    out += MK.arrow(200, 180, 200, 40, mo, P.muted, 6) + MK.arrow(200, 180, 200, 320, mo, P.muted, 6);
    out += MK.cross(200, 180, 34, popIn(t, cSize == null ? null : cSize + 0.5, 0.4));
    out += MK.pill(860, 76, "size is not the test", mo, { size: 28, col: P.muted });
    /* the bee sits under the measure, beside the squid it is being compared
       with, so the space between the squid and the panel stays empty */
    out += MK.pop(Em(196, 380, 86, "\u{1F41D}"), 196, 380, mo);
    /* the same panel the "No backbone" chapter used, so the answer is read the
       same way here: look inside, there is no chain of bones, so invertebrate */
    var io = on(t, cInv, 0.5);
    out += MK.leader(824, 238, 556, 216, io, P.muted);
    out += R(830, 194, 244, 88, 16, P.cell, P.muted, 2, { opacity: io });
    out += bnGhostSpine([[872, 238], [1032, 238]], 5, on(t, cInv, 0.8), 34, io);
    out += MK.cross(952, 238, 26, popIn(t, cInv == null ? null : cInv + 0.45, 0.4));
    out += Tx(952, 332, "invertebrate", "lab big", "middle", { fill: P.plum, opacity: io });
    return out;
  }

  function bnSortChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 3) {
      var u = into(t, i);
      return svg(bnSquidPic(t, scene) + (u < 1 ? G(bnSortPic(t, scene), { opacity: 1 - u }) : ""));
    }
    return svg(bnSortPic(t, scene));
  }

  /* ---- the fact card, and the moult it describes ------------------------------ */
  var BN_CARD_LINES = [
    "An exoskeleton is a hard skeleton",
    "on the outside of the whole body.",
    "It cannot grow. To get bigger, the",
    "animal must shed it."
  ];
  function bnFactPic(t, scene) {
    var cLook = sc(scene, 0, "look"), cCrab = sc(scene, 0, "crab"), cBig = sc(scene, 0, "bigger");
    var cCard = sc(scene, 1, "card"), cSrc = sc(scene, 1, "source"),
      cFound = sc(scene, 1, "found"), cWrote = sc(scene, 1, "wrote");
    var out = "", o0 = bnOnly(t, scene, 0), o1 = bnOnly(t, scene, 1);
    var co = on(t, cLook, 0.6);
    out += R(300, 36, 568, 352, 20, P.paper, P.gold, 2 + 3 * on(t, cCard, 0.5), { opacity: co });
    out += Tx(584, 98, "Living in a suit of armour", "lab big dark", "middle", { opacity: co });
    out += L(360, 118, 808, 118, "#C9BFA6", 2, { opacity: co });
    var ln = tally(t, cLook, 4, 0.8);
    for (var k = 0; k < ln; k++)
      out += Tx(342, 166 + k * 52, BN_CARD_LINES[k], "lab dark", "start",
        { opacity: co * (cWrote != null && t >= cWrote ? 1 : 0.94) });
    /* beat 0: the lesson's book, and the crab whose shell gets bigger */
    if (o0 > 0) out += G(MK.pop(Em(150, 180, 150, "\u{1F4DA}"), 150, 180, popIn(t, cLook, 0.45)) +
      MK.pop(Em(1018, 176, 172, "\u{1F980}"), 1018, 176, popIn(t, cCrab, 0.45)) +
      E(1018, 176, 122, 112, "none", P.gold, 4, { opacity: on(t, cBig, 0.5), "stroke-dasharray": "12 9" }) +
      MK.pill(1018, 330, "a bigger shell", on(t, cBig, 0.5), { size: 26, col: P.gold }), { opacity: o0 });
    /* beat 1: somebody else found this out and wrote it down */
    if (o1 > 0) out += G(MK.pop(Em(150, 200, 130, "\u{1F9D1}"), 150, 200, popIn(t, cFound, 0.45)) +
      MK.pop(Em(196, 292, 84, "\u{270D}️"), 196, 292, popIn(t, cWrote, 0.45)) +
      MK.arrow(238, 250, 300, 232, on(t, cWrote == null ? null : cWrote + 0.2, 0.5), P.gold, 6) +
      MK.pill(1010, 200, "a secondary", on(t, cSrc, 0.45), { size: 30, col: P.teal }) +
      MK.pill(1010, 268, "source", on(t, cSrc == null ? null : cSrc + 0.15, 0.45), { size: 30, col: P.teal }), { opacity: o1 });
    return out;
  }

  /* it cannot grow, so the crab sheds it and grows a new, bigger one */
  function bnMoultPic(t, scene) {
    var cSays = sc(scene, 2, "says"), cGrow = sc(scene, 2, "grow"),
      cSheds = sc(scene, 2, "sheds"), cBig = sc(scene, 2, "bigger");
    var out = "", p = popIn(t, cSays, 0.45);
    var so = on(t, cSheds, 0.8), bo = on(t, cBig, 0.6);
    /* the case it started in: gold while the crab is in it, then the empty
       shell left behind, grey. There is only ever ONE crab on the screen - it
       walks out of the old case and grows, so the picture says what the line
       says rather than standing two crabs side by side. */
    var go = on(t, cGrow, 0.5);
    out += E(320, 190, 148, 136, "none", so > 0.5 ? P.muted : P.gold, 5,
      { opacity: Math.min(1, p), "stroke-dasharray": so > 0.5 ? "13 10" : null });
    out += G(Em(320, 190, 210, "\u{1F980}"), { opacity: so * 0.30, style: "filter:grayscale(1)" });
    out += E(320, 190, 186, 172, "none", P.muted, 4,
      { opacity: go * (1 - so), "stroke-dasharray": "13 10" });
    out += MK.cross(320, 190, 52, popIn(t, cGrow == null ? null : cGrow + 0.3, 0.4) * (1 - so));
    out += MK.pill(320, 398, "it cannot grow", go * (1 - so), { size: 28, col: P.muted });
    out += MK.pill(320, 44, "the empty case", so, { size: 26, col: P.muted });
    /* the crab itself, walking out of it and growing a new, bigger case */
    var cx = lerp(320, 886, so), size = lerp(210, 268, bo);
    out += MK.arrow(492, 190, 664, 190, so * (1 - bo), P.good, 8);
    out += MK.pop(Em(cx, 190, size, "\u{1F980}"), cx, 190, p);
    out += E(cx, 190, size * 0.70, size * 0.64, "none", P.good, 5, { opacity: bo });
    out += MK.pill(886, 398, "a bigger one", bo, { size: 28, col: P.good });
    return out;
  }

  /* the new case is soft at first, so the crab hides */
  function bnHidePic(t, scene) {
    var cMoult = sc(scene, 3, "moult"), cSoft = sc(scene, 3, "soft"), cHide = sc(scene, 3, "hides");
    var out = "";
    out += MK.pill(250, 76, "moult", popIn(t, cMoult, 0.5), { size: 40, col: P.gold, ink: P.gold });
    out += Tx(250, 148, "shed it, and grow a bigger one", "lab mid muted", "middle", { opacity: on(t, cMoult, 0.5) });
    out += Em(520, 256, 240, "\u{1F980}");
    var so = on(t, cSoft, 0.5);
    out += E(520, 256, 166, 152, "none", P.accent, 5, { opacity: so, "stroke-dasharray": "9 8" });
    out += MK.pill(880, 130, "soft at first", so, { size: 30, col: P.accent });
    var u = on(t, cHide, 0.9);
    if (u > 0) {
      out += G(MK.pic(lerp(996, 566, u), 188, 330, ART.ICONS.rock), { opacity: clamp(u * 3, 0, 1) });
      out += MK.pill(880, 386, "so it hides", on(t, cHide == null ? null : cHide + 0.4, 0.5), { size: 30, col: P.gold });
    }
    return out;
  }

  function bnLookupChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 2) {
      var u = into(t, i);
      return svg(bnMoultPic(t, scene) + (u < 1 ? G(bnFactPic(t, scene), { opacity: 1 - u }) : ""));
    }
    if (k === 3) {
      var v = into(t, i);
      return svg(bnHidePic(t, scene) + (v < 1 ? G(bnMoultPic(t, scene), { opacity: 1 - v }) : ""));
    }
    return svg(bnFactPic(t, scene));
  }

  /* ---- what you now know ----------------------------------------------------- */
  /* Two of the recap's own cues named a phrase and nothing read it: "they shed
     it" (beat 1) and "Size and shells" (beat 3). MK.recapKind's cards take a
     `pic` of a function (cx, cy, size, t) for exactly this - a small ring that
     flashes on the card's own icon - so both cues get one, built fresh from
     the recap scene each frame rather than a module-level variable. The exo
     card's crab flashes gold once, on "they shed it"; every card's icon
     flashes a muted, dashed ring, staggered card to card, on "Size and
     shells", the same wave the vertebrate row's panels use for "with a
     backbone" - a beat later "Look for the backbone" starts the existing
     breathing highlight (opt.goAt), so the two cues read as "not this" then
     "this". */
  function bnRecapCards(scene) {
    var cShed = sc(scene, 1, "shed"), cSize = sc(scene, 3, "size");
    function ring(pic, k, extraAt, extraSpan) {
      return function (cx, cy, size, t) {
        var out = MK.pic(cx, cy, size, pic);
        var sizeFlash = bump(t, cSize == null ? null : cSize + k * 0.08, 0.85);
        if (sizeFlash > 0.04) out += C(cx, cy, size * 0.62, "none", P.muted, 4,
          { opacity: sizeFlash, "stroke-dasharray": "6 5" });
        if (extraAt != null) {
          var f2 = bump(t, extraAt, extraSpan || 0.9);
          if (f2 > 0.04) out += C(cx, cy, size * 0.62, "none", P.gold, 4, { opacity: f2 });
        }
        return out;
      };
    }
    return [
      { beat: 0, at: "vert", title: "Vertebrate", sub: "a backbone inside", pic: ring("\u{1F415}", 0) },
      { beat: 0, at: "inv", title: "Invertebrate", sub: "no backbone", pic: ring("\u{1FAB1}", 1) },
      { beat: 1, at: "exo", title: "Exoskeleton", sub: "a skeleton on the outside", pic: ring("\u{1F980}", 2, cShed, 1.0) },
      { beat: 2, at: "key", title: "A key", sub: "yes-or-no questions", pic: ring("\u{1F511}", 3) }
    ];
  }
  function bnRecapChapter(scene, beat, t, i) {
    return MK.recapKind(bnRecapCards(scene), { goBeat: 3, goAt: "look" })(scene, beat, t, i);
  }

  var KINDS = {
    title: MK.titleKind({ sub: ["Vertebrates have a backbone", "Invertebrates do not", "Some wear a skeleton outside"] }),
    vert: bnVertChapter, invert: bnInvertChapter, exo: bnExoChapter,
    key: bnKeyChapter, sort: bnSortChapter, lookup: bnLookupChapter, recap: bnRecapChapter
  };
