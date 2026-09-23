  /* ==== chapters: how a fossil forms, and look it up ============================
     tools/lib/film-scenes/science-g3/rocks-and-fossils-3.js. */

  /* ---- how a fossil forms --------------------------------------------------------
     The lesson's own fossil demo (ART.scene "fossil", the four frames its Next
     button steps through), as a card on the left, moving on from frame to frame
     as the line reaches it. On the right, what is happening to the mud: the
     layers pile up, the weight presses them into rock, and the shape left
     behind is an impression, like a footprint. */
  var RF_FOS = { x: 64, y: 22, w: 428, h: 401 };
  function rfFX(v) { return RF_FOS.x + v * RF_FOS.w / 320; }
  function rfFY(v) { return RF_FOS.y + v * RF_FOS.h / 300; }
  function rfFossilCard(state) { return ART.place(ART.scene("fossil", state), RF_FOS.x, RF_FOS.y, RF_FOS.w, RF_FOS.h); }

  function rfFossilChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cMil = c(0, "millions"), cFish = c(0, "fish"), cSea = c(0, "sea");
    var cDies = c(1, "dies"), cSinks = c(1, "sinks"), cMud = c(1, "mud");
    var cMore = c(2, "more"), cLayer = c(2, "layer");
    var cWeight = c(3, "weight"), cRock = c(3, "rock"), cShape = c(3, "shape");
    var cSplit = c(4, "splits"), cThere = c(4, "there");
    var cNot = c(5, "not"), cPrint = c(5, "print"), cFossil = c(5, "fossil");
    var f = RF_FOS, out = "";

    /* the card, whole, with room round it; the frame changes as it is said */
    out += R(f.x - 10, f.y - 10, f.w + 20, f.h + 20, 20, P.card, P.line, 2);
    var steps = [{ at: cSinks, s: 1 }, { at: cMore, s: 2 }, { at: cSplit, s: 3 }];
    var state = 0, prev = 0, fade = 1;
    steps.forEach(function (st) {
      if (st.at != null && t >= st.at) { prev = state; state = st.s; fade = clamp((t - st.at) / 0.6, 0, 1); }
    });
    if (fade < 1) out += G(rfFossilCard(prev), { opacity: 1 - fade });
    out += G(rfFossilCard(state), { opacity: fade });

    /* everything drawn ON the card is kept inside it */
    out += el("clipPath", { id: "rfFosClip" }, R(f.x, f.y, f.w, f.h, 14));
    var on0 = rfOnly(t, scene, 0), on1 = rfOnly(t, scene, 1);
    var over = "";
    over += R(f.x, f.y, f.w, rfFY(150) - f.y, 0, RF_SEA, null, null, { opacity: 0.45 * bump(t, cSea, 1.3) });
    over += C(rfFX(150), rfFY(80), 54, "none", P.gold, 4, { opacity: on(t, cFish, 0.4) * on0 });
    over += MK.arrow(rfFX(225), rfFY(80), rfFX(225), rfFY(178), on(t, cSinks, 0.7) * on1, P.gold, 7);
    over += R(f.x, rfFY(150), f.w, rfFY(300) - rfFY(150), 0, P.gold, null, null, { opacity: 0.2 * bump(t, cMud, 1.3) });
    /* the shape pressed inside, and the rock splitting open */
    over += E(rfFX(150), rfFY(215), 74, 34, "none", P.gold, 4, { opacity: on(t, cShape, 0.5) * rfOnly(t, scene, 3) });
    over += MK.ripple(rfFX(160), rfFY(200), t, cSplit, P.gold);
    over += MK.ripple(rfFX(100), rfFY(200), t, cSplit == null ? null : cSplit + 0.35, P.gold);
    over += E(rfFX(150), rfFY(215), 78, 36, "none", P.good, 4, { opacity: on(t, cThere, 0.5) * rfOnly(t, scene, 4) });
    out += G(over, { "clip-path": "url(#rfFosClip)" });
    /* the words for the two frames that have one; each goes when its frame does */
    var aliveO = clamp(1 - into(t, scene.first + 2), 0, 1), mudO = clamp(1 - into(t, scene.first + 3), 0, 1);
    if (aliveO > 0) out += G(rfLabel(t, 530, rfFY(80), "alive", cFish, [rfFX(228), rfFY(80)], on1 < 0.5, 26), { opacity: aliveO });
    if (mudO > 0) out += G(rfLabel(t, 530, rfFY(246), "mud", cMud, [rfFX(248), rfFY(246)], true, 26), { opacity: mudO });
    /* how long all of this takes, while it is taking it */
    out += MK.pill(886, 76, "millions of years", on(t, cMil, 0.5) * clamp(1 - into(t, scene.first + 4), 0, 1), { size: 28, col: P.plum });

    /* ---- the right: the mud piling up, and being pressed into rock ---- */
    var stack = cMore == null ? 0 : rfFrom(t, scene, 2) * (1 - into(t, scene.first + 4));
    if (stack > 0) {
      var press = on(t, cWeight, 0.8), rocky = on(t, cRock, 0.6);
      var bh = lerp(30, 21, press), n = tally(t, cMore, 4, 1.8), base = 352;
      for (var k = 0; k < n; k++) {
        var o = clamp((t - cMore) / (1.8 / 3) - k + 1, 0, 1);
        var col = rocky > 0.5 ? (k % 2 ? RF_ROCK[3] : RF_ROCK[2]) : RF_ROCK[Math.min(k, 3)];
        out += R(640, base - (k + 1) * (bh + 4), 380, bh, 5, col, "#00000044", 2, { opacity: Math.min(1, o) * stack });
      }
      out += Tx(830, base + 36, "layer after layer", "lab mid muted readable", "middle", { opacity: on(t, cLayer, 0.5) * stack });
      out += MK.arrow(830, base - 5 * (bh + 4) - 66, 830, base - 4 * (bh + 4) - 16, press * stack, P.gold, 9);
      out += MK.pill(1044, base - 52, "rock", on(t, cRock, 0.45) * stack, { size: 26, anchor: "start", col: P.gold });
    }

    /* ---- the last line: not the fish, but the shape it pressed in ---- */
    var last = rfOnly(t, scene, 5);
    if (last > 0) {
      var g = "";
      g += MK.pop(Em(646, 150, 92, "\u{1F41F}"), 646, 150, popIn(t, cNot, 0.45));
      g += MK.cross(700, 104, 23, popIn(t, cNot == null ? null : cNot + 0.35, 0.35));
      /* a shell pressed into clay leaves its shape behind: the lesson's own
         home experiment, and its word for what is left */
      var pu = on(t, cPrint, 1.3);
      g += R(852, 196, 244, 112, 16, RF_CLAY, "#6F472C", 3, { opacity: on(t, cPrint, 0.35) });
      g += E(974, 252, 54, 26, "#6F472C", null, null, { opacity: clamp(pu * 2 - 1, 0, 1) });
      g += Em(974, lerp(104, 214, Math.min(1, pu * 1.5)), 78, "\u{1F463}", { opacity: on(t, cPrint, 0.3) * clamp(1.25 - pu * 1.8, 0, 1) });
      g += Tx(974, 344, "impression", "lab mid muted readable", "middle", { opacity: pu });
      g += MK.pill(700, 300, "fossil", on(t, cFossil, 0.45), { size: 34, col: P.gold });
      out += G(g, { opacity: clamp(last, 0, 1) });
    }
    return svg(out);
  }

  /* ---- look it up ----------------------------------------------------------------
     The lesson's fact card, read for the answer: the card on the left, one line
     of it lit as it is said, and on the right what that line means - who wrote
     it down, the layered rock fossils are found in, the hard parts that last,
     and where to look safely. */
  var RF_CARDP = { x: 48, y: 36, w: 470, h: 372 };
  var RF_LINES = [
    "In rock made of layers: sandstone.",
    "Mostly hard parts: shells, bones, teeth.",
    "Cliffs and beaches, with a grown-up."
  ];
  function rfFactCard(t, appear, liveRow) {
    if (!(appear > 0)) return "";
    var p = RF_CARDP, out = R(p.x, p.y, p.w, p.h, 18, P.paper, P.line, 2);
    out += Tx(p.x + 30, p.y + 62, "Fossil hunting", "lab big dark", "start");
    out += L(p.x + 30, p.y + 82, p.x + p.w - 30, p.y + 82, "#C9C2AE", 3);
    RF_LINES.forEach(function (line, k) {
      var ly = p.y + 140 + k * 76, lit = liveRow === k ? 1 : 0;
      out += R(p.x + 20, ly - 28, p.w - 40, 42, 10, P.gold, null, null, { opacity: 0.38 * lit });
      out += Tx(p.x + 32, ly, line, "lab mid dark readable", "start", { opacity: 0.72 + 0.28 * lit });
    });
    return G(out, { transform: around(p.x + p.w / 2, p.y + p.h / 2, 0.92 + 0.08 * Math.min(1, appear)), opacity: Math.min(1, appear) });
  }

  function rfLookitupChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWhere = c(0, "where"), cUp = c(0, "up");
    var cCard = c(1, "card"), cSource = c(1, "source"), cWrote = c(1, "wrote");
    var cLayers = c(2, "layers"), cStone = c(2, "sandstone");
    var cHard = c(3, "hard"), cShells = c(3, "shells"), cJelly = c(3, "jelly");
    var cCliffs = c(4, "cliffs"), cGrown = c(4, "grown"), cNever = c(4, "never");
    var out = "", k;
    var live = rfOnly(t, scene, 2) > 0.5 ? 0 : rfOnly(t, scene, 3) > 0.5 ? 1 : rfOnly(t, scene, 4) > 0.5 ? 2 : -1;
    out += rfFactCard(t, on(t, cUp, 0.6), live);

    /* beat 1: the question, before the card arrives */
    var q = rfOnly(t, scene, 0) * (1 - on(t, cUp, 0.5));
    if (q > 0) out += G(MK.pic(690, 216, 150, "\u{1F41A}") + MK.qmark(872, 186, 72, on(t, cWhere, 0.5)), { opacity: clamp(q, 0, 1) });

    /* beat 2: somebody found it out, wrote it down, and you read it */
    var who = rfOnly(t, scene, 1);
    if (who > 0) {
      var g = "";
      g += rfThing(650, 176, 92, "\u{1F9D1}‍\u{1F52C}", "found it out", popIn(t, cSource, 0.45));
      g += MK.arrow(716, 176, 792, 176, on(t, cSource == null ? null : cSource + 0.3, 0.45), P.gold, 6);
      g += rfThing(860, 176, 92, "\u{1F4D6}", "wrote it down", popIn(t, cWrote, 0.45));
      g += MK.arrow(926, 176, 1002, 176, on(t, cWrote == null ? null : cWrote + 0.3, 0.45), P.gold, 6);
      g += rfThing(1064, 176, 92, "\u{1F9D2}", "you read it", popIn(t, cWrote == null ? null : cWrote + 0.5, 0.45));
      g += MK.pill(860, 320, "a secondary source", on(t, cSource, 0.45), { size: 26, col: P.good });
      out += G(g, { opacity: clamp(who, 0, 1) });
    }

    /* beat 3: the rock fossils are found in */
    var rock = rfOnly(t, scene, 2);
    if (rock > 0) {
      var u = on(t, cLayers, 1.2), g2 = "";
      g2 += R(596, 78, 472, 268, 12, "#0E2434", P.line, 2);
      g2 += el("clipPath", { id: "rfStoneClip" }, R(596, 78, 472, 268, 12));
      g2 += G(rfLayers(596, 78, 472, 268, 4, u) +
        Pth("M" + 772 + "," + 286 + " q42,-24 84,0 q-42,24 -84,0z M856,286 l24,-13 v26z", "#D9D2C0", "#3A3A3A", 3, { opacity: on(t, cStone, 0.5) }),
        { "clip-path": "url(#rfStoneClip)" });
      g2 += MK.pill(832, 384, "sandstone", on(t, cStone, 0.45), { size: 28, col: P.gold });
      out += G(g2, { opacity: clamp(rock, 0, 1) * on(t, cLayers, 0.5) });
    }

    /* beat 4: hard parts last, soft ones do not */
    var hard = rfOnly(t, scene, 3);
    if (hard > 0) {
      var g3 = "", hp = [{ pic: "\u{1F41A}", word: "shell" }, { pic: "\u{1F9B4}", word: "bone" }, { pic: "\u{1F9B7}", word: "tooth" }];
      for (k = 0; k < 3; k++) {
        var px = 642 + k * 132, p3 = popIn(t, k === 0 ? cShells : cShells == null ? null : cShells + k * 0.4, 0.45);
        g3 += rfThing(px, 178, 84, hp[k].pic, hp[k].word, p3);
        g3 += MK.tick(px + 44, 132, 18, popIn(t, cShells == null ? null : cShells + k * 0.4 + 0.3, 0.35));
      }
      g3 += MK.pill(774, 330, "hard parts last", on(t, cHard, 0.45), { size: 26, col: P.good });
      g3 += rfThing(1054, 178, 84, ART.ICONS.jellyfish, "jellyfish", popIn(t, cJelly, 0.45));
      g3 += MK.cross(1098, 132, 18, popIn(t, cJelly == null ? null : cJelly + 0.3, 0.35));
      out += G(g3, { opacity: clamp(hard, 0, 1) });
    }

    /* beat 5: where to look, and how to stay safe */
    var safe = rfOnly(t, scene, 4);
    if (safe > 0) {
      var g4 = "", gy = 344;
      g4 += R(556, gy, 468, 66, 0, RF_SAND);
      g4 += R(1016, gy - 10, 124, 76, 0, RF_SEA);
      g4 += Pth("M1020,354 q18,-10 36,0 q18,10 36,0 q18,-10 36,0 M1020,384 q18,-10 36,0 q18,10 36,0 q18,-10 36,0", null, "#9FD0EE", 4);
      /* the cliff: layered rock, worn away by the sea, with a fossil in its face */
      g4 += el("clipPath", { id: "rfCliffClip" }, Pth("M556," + gy + " L556,132 L654,116 L730,152 L748,244 L728," + gy + " Z"));
      g4 += G(R(556, 100, 200, 260, 0, RF_ROCK[3]) +
        R(556, 152, 200, 30, 0, RF_ROCK[1]) + R(556, 222, 200, 30, 0, RF_ROCK[1]) + R(556, 292, 200, 30, 0, RF_ROCK[2]) +
        Pth("M626,268 q30,-17 60,0 q-30,17 -60,0z M686,268 l17,-9 v18z", "#D9D2C0", "#3A3A3A", 2.5),
        { "clip-path": "url(#rfCliffClip)" });
      g4 += Pth("M556," + gy + " L556,132 L654,116 L730,152 L748,244 L728," + gy, null, "#2E2E2E", 3);
      g4 += MK.pill(660, 72, "cliff", on(t, cCliffs, 0.45), { size: 26, col: P.gold });
      g4 += MK.pill(852, 392, "beach", on(t, cCliffs == null ? null : cCliffs + 0.3, 0.45), { size: 26, col: P.gold });
      /* a grown-up and a child, well away from the bottom of the cliff */
      var pg = popIn(t, cGrown, 0.5);
      g4 += MK.pop(rfPerson(918, gy, 134, P.teal, 1) + rfPerson(992, gy, 96, P.accent, 1), 952, gy - 60, pg);
      g4 += MK.tick(956, 168, 22, popIn(t, cGrown == null ? null : cGrown + 0.4, 0.35));
      /* never stand under it: a rock falls where nobody is standing */
      var nv = on(t, cNever, 0.9);
      if (nv > 0) {
        g4 += MK.pic(792, lerp(176, 316, nv), 50, "\u{1FAA8}", { opacity: nv });
        g4 += MK.cross(792, 322, 26, popIn(t, cNever == null ? null : cNever + 0.5, 0.35));
      }
      out += G(g4, { opacity: clamp(safe, 0, 1) });
    }
    return svg(out);
  }
