  /* ==== Grade 3 Science, Lesson 12: Rocks and Fossils ==========================
     tools/lib/film-scenes/science-g3/rocks-and-fossils.js, with -2.js, -3.js and
     -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/rocks-and-fossils.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later: the Earth from space (ART.scene "globe"), the fossil
     forming (ART.scene "fossil", the four frames its Next button steps through)
     and the kit's own icons for the pictures whose emoji are too new (rock,
     window, wood, bottle).

     This file: the palette, the timing helpers, the small drawings the other
     chapters share, the title motif and the chapter "Only one planet". Every
     top-level name here starts with rf, so nothing can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, planet: P.blue, ores: P.gold, oilgas: P.accent,
    fossil: P.plum, lookitup: P.good, taking: P.blue, recap: P.teal
  };

  /* the lesson's own rock colours (SCENES.fossil draws these four layers) */
  var RF_ROCK = ["#A08060", "#8A6A4A", "#7D7F86", "#5B5D63"];
  var RF_SAND = "#E0C68A", RF_CLAY = "#9C6B4A", RF_OIL = "#17110C", RF_SEA = "#3B7FD1";

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function rfOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function rfFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var RF_SCATTER = [0.17, 0.63, 0.38, 0.91, 0.24, 0.55, 0.08, 0.79, 0.46, 0.7, 0.31, 0.86];

  /* ---- small drawings the chapters share --------------------------------------- */

  /* a card behind one of the lesson's light drawings, with room round it */
  function rfCard(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, P.card, P.line, 2, { opacity: clamp(o, 0, 1) });
  }

  /* bands of rock in a box, the lesson's own four colours, top band first;
     u uncovers them one after another from the top */
  function rfLayers(x, y, w, h, n, u, extra) {
    var out = "", k, bh = h / n, g = clamp(u == null ? 1 : u, 0, 1);
    for (k = 0; k < n; k++) {
      var shown = clamp(g * n - k, 0, 1);
      if (shown <= 0) continue;
      out += R(x, y + k * bh, w, bh * shown, 0, RF_ROCK[Math.min(k, RF_ROCK.length - 1)]);
      out += L(x, y + k * bh, x + w, y + k * bh, "#00000033", 2, { opacity: shown });
    }
    return G(out, extra || {});
  }

  /* grains of sand: a tan heap of fixed dots, centred on (cx, cy) */
  function rfSandHeap(cx, cy, w, o) {
    if (!(o > 0)) return "";
    var base = cy + w * 0.16;
    var out = Pth("M" + n2(cx - w / 2) + "," + n2(base) + " q" + n2(w * 0.25) + "," + n2(-w * 0.52) + " " + n2(w / 2) + ",0" +
      " q" + n2(w * 0.25) + "," + n2(-w * 0.34) + " " + n2(w / 2) + ",0 z", RF_SAND);
    for (var k = 0; k < 9; k++) {
      var a = RF_SCATTER[k], b = RF_SCATTER[(k + 4) % 12];
      out += C(cx - w * 0.4 + a * w * 0.8, base - 3 - b * w * 0.22, w * 0.035, "#B79352");
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* specks of metal inside a rock: fixed gold ellipses about (cx, cy) */
  var RF_FLECK = [[-18, -6, 7, 5], [6, -14, 6, 4], [14, 6, 8, 5], [-6, 10, 5, 4]];
  function rfFlecks(cx, cy, s, o, glowU) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < RF_FLECK.length; k++) {
      var f = RF_FLECK[k];
      out += E(cx + f[0] * s, cy + f[1] * s, f[2] * s, f[3] * s, P.gold, P.goldDeep, Math.max(0.8, s));
    }
    if (glowU > 0) out += MK.glow(cx, cy, 34 * s, P.gold, glowU);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a pocket of oil trapped in rock, with gas bubbles above it */
  function rfOilPocket(cx, cy, rx, ry, o, bubbles) {
    if (!(o > 0)) return "";
    var out = E(cx, cy, rx, ry, RF_OIL, "#4A3A24", 2) +
      E(cx - rx * 0.32, cy - ry * 0.34, rx * 0.22, ry * 0.16, "#3A2F22", null, null, { opacity: 0.7 });
    if (bubbles > 0) for (var k = 0; k < 7; k++) {
      var a = RF_SCATTER[k], bb = RF_SCATTER[(k + 5) % 12], r = ry * (0.16 + a * 0.26);
      out += C(cx - rx * 0.72 + (k / 6) * rx * 1.44 + (bb - 0.5) * rx * 0.12,
        cy - ry - r - bb * ry * 1.5, r, "#DCE9F2", null, null, { opacity: 0.8 * clamp(bubbles, 0, 1) });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a person, feet on (x, y) and h tall, in the kit's own skin colour. The
     person emoji draws as a head alone here, which cannot stand on a beach. */
  function rfPerson(x, y, h, coat, o) {
    if (!(o > 0)) return "";
    var hr = h * 0.13, hy = y - h + hr;
    return G(R(x - h * 0.21, y - h * 0.72, h * 0.07, h * 0.30, h * 0.035, coat) +
      R(x + h * 0.14, y - h * 0.72, h * 0.07, h * 0.30, h * 0.035, coat) +
      R(x - h * 0.12, y - h * 0.38, h * 0.10, h * 0.38, h * 0.04, "#2B3E55") +
      R(x + h * 0.02, y - h * 0.38, h * 0.10, h * 0.38, h * 0.04, "#2B3E55") +
      R(x - h * 0.14, y - h * 0.74, h * 0.28, h * 0.38, h * 0.06, coat) +
      C(x, hy, hr, "#C68642") +
      Pth("M" + n2(x - hr) + "," + n2(hy - hr * 0.16) + " a" + n2(hr) + "," + n2(hr) + " 0 0 1 " + n2(2 * hr) + ",0 z", "#3A2418"),
      { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill, with a leader line from it to the thing it names. The
     newest is gold; one named before it keeps its line, quieter. */
  function rfLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 24, anchor: "start", col: now ? P.gold : P.line });
  }

  /* one of the lesson's pictures with its word under it, popped in together */
  function rfThing(cx, cy, size, pic, word, p, col) {
    if (!(p > 0)) return "";
    return MK.pop(MK.pic(cx, cy, size, pic), cx, cy, p) +
      Tx(cx, cy + size * 0.52 + 24, word, "lab mid muted readable", "middle", { opacity: Math.min(1, p) });
  }

  /* ==== the title ================================================================
     A round window cut into the ground: the lesson's own fossil frame (its
     fourth, the split rock with the fish in it), with the three other things
     the rocks hold drawn into its layers - specks of metal, grains of sand and
     a pocket of oil. In the spoken title chapter each lights as its thing is
     named; on the two cards it simply stands. */
  var RF_MOTIF = { x: 20, y: 30, w: 320, h: 300 };
  function rfMotifInner() { return ART.place(ART.scene("fossil", 3), RF_MOTIF.x, RF_MOTIF.y, RF_MOTIF.w, RF_MOTIF.h); }
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var cSpoon = s ? sc(s, 0, "spoon") : null, cWin = s ? sc(s, 0, "window") : null, cPet = s ? sc(s, 0, "petrol") : null;
    var cRock = s ? sc(s, 1, "rocks") : null, cEarth = s ? sc(s, 1, "earth") : null;
    var lit = function (at, span) { return s ? Math.max(on(t, at, span || 0.5) * 0.55, bump(t, at, 1.3)) : 0; };
    out += el("clipPath", { id: "rfMotifClip" }, C(180, 180, 172));
    out += el("clipPath", { id: "rfMotifCrop" }, R(0, 0, 360, 288));
    out += C(180, 180, 172, "#0E2434");
    var inner = rfMotifInner();
    /* the three things the rock holds, in its own layers */
    inner += rfFlecks(96, 100, 1, 1, lit(cSpoon));
    inner += G(rfSandHeap(258, 86, 62, 1), { opacity: 0.9 });
    inner += MK.glow(258, 86, 52, P.gold, lit(cWin));
    inner += rfOilPocket(262, 152, 48, 19, 1, 0.9);
    inner += MK.glow(262, 152, 62, P.accent, lit(cPet));
    out += G(G(inner, { "clip-path": "url(#rfMotifCrop)" }), { "clip-path": "url(#rfMotifClip)" });
    out += C(180, 180, 172, "none", on(t, cRock, 0.6) > 0 ? P.gold : P.line, 3, { opacity: 1 });
    out += MK.glow(180, 180, 176, P.teal, on(t, cEarth, 0.7) * (0.6 + 0.4 * breathe(t)));
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A round window into the ground: rock layers holding specks of metal, grains of sand, a pocket of oil and a fossil fish">' + out + "</svg>";
  }

  /* ==== chapter: only one planet =================================================
     Beats 1 and 2: the lesson's Earth from space (ART.scene "globe"), with the
     six materials of its Earth's materials step round it, and the Moon and the
     Sun crossed out - the wrong answers its own question offers.
     Beats 3 to 5: the two bins of its sorting step, From rocks and From living
     things, filled as each material is named. */
  var RF_GLOBE = { cx: 584, cy: 212, s: 292 };
  var RF_SIX = [
    { x: 196, y: 84, pic: "\u{1F944}", word: "metal" },
    { x: 148, y: 212, pic: "\u{1FA9F}", word: "glass" },
    { x: 196, y: 340, pic: "\u{1F6E2}️", word: "oil" },
    { x: 972, y: 84, pic: "\u{1F525}", word: "gas" },
    { x: 1020, y: 212, pic: "\u{1F9F1}", word: "bricks" },
    { x: 972, y: 340, pic: "\u{1F9F4}", word: "plastic" }
  ];
  function rfPlanetSpace(t, scene) {
    var cMat = sc(scene, 0, "material"), cEarth = sc(scene, 0, "earth");
    var cNo = sc(scene, 1, "nowhere"), cMoon = sc(scene, 1, "moon"), cSun = sc(scene, 1, "sun");
    var g = RF_GLOBE, out = "";
    out += MK.glow(g.cx, g.cy, 206, P.blue, on(t, cEarth, 0.7) * (0.45 + 0.35 * breathe(t)));
    out += ART.place(ART.scene("globe", 0), g.cx - g.s / 2, g.cy - g.s / 2, g.s, g.s);
    out += MK.pill(g.cx, g.cy + g.s / 2 + 36, "planet Earth", on(t, cEarth, 0.45), { size: 26, col: P.blue });
    /* the six materials of the lesson's first step, and an arrow each to the Earth */
    RF_SIX.forEach(function (m, k) {
      var p = popIn(t, cMat == null ? null : cMat + k * 0.13, 0.4);
      out += rfThing(m.x, m.y, 62, m.pic, m.word, p);
      var dx = g.cx - m.x, dy = g.cy - m.y, d = Math.hypot(dx, dy);
      var u = on(t, cEarth == null ? null : cEarth + k * 0.07, 0.5);
      out += MK.arrow(m.x + dx / d * 52, m.y + dy / d * 52, m.x + dx / d * (d - 156), m.y + dy / d * (d - 156), u, P.blue, 6);
    });
    /* nowhere else: the Moon and the Sun, the lesson's own wrong answers */
    var pm = popIn(t, cMoon, 0.4), ps = popIn(t, cSun, 0.4);
    out += MK.pop(Em(92, 66, 64, "\u{1F315}"), 92, 66, pm) + MK.cross(134, 36, 21, popIn(t, cMoon == null ? null : cMoon + 0.3, 0.35));
    out += MK.pop(Em(1076, 66, 64, "☀️"), 1076, 66, ps) + MK.cross(1118, 36, 21, popIn(t, cSun == null ? null : cSun + 0.3, 0.35));
    out += MK.glow(g.cx, g.cy, 150, P.gold, bump(t, cNo, 1.2) * 0.7);
    return out;
  }

  /* the two bins, as the lesson's sorter draws them */
  var RF_BIN = { y: 62, h: 330, w: 516, lx: 52, rx: 600 };
  function rfBin(x, lit, pic, title, o) {
    if (!(o > 0)) return "";
    var b = RF_BIN;
    return G(R(x, b.y, b.w, b.h, 24, P.card, lit > 0.5 ? P.teal : P.line, lit > 0.5 ? 3 : 2) +
      R(x + 24, b.y + 112, b.w - 48, b.h - 136, 16, "none", P.line, 2, { "stroke-dasharray": "10 9", opacity: 0.75 }) +
      MK.pic(x + 74, b.y + 66, 62, pic) +
      Tx(x + 122, b.y + 78, title, "lab big", "start"), { opacity: clamp(o, 0, 1) });
  }
  function rfPlanetBins(t, scene) {
    var cWood = sc(scene, 2, "wood"), cWool = sc(scene, 2, "wool"), cLive = sc(scene, 2, "living");
    var cMet = sc(scene, 3, "metal"), cGla = sc(scene, 3, "glass"), cOil = sc(scene, 3, "oil"), cGas = sc(scene, 3, "gas"), cRk = sc(scene, 3, "rocks");
    var cTwo = sc(scene, 4, "two"), cRock2 = sc(scene, 4, "rock"), cLife2 = sc(scene, 4, "life");
    var b = RF_BIN, out = "";
    var rockLit = Math.max(on(t, cRk, 0.5), on(t, cRock2, 0.5)), lifeLit = Math.max(on(t, cLive, 0.5), on(t, cLife2, 0.5));
    out += rfBin(b.lx, rockLit, "\u{1FAA8}", "From rocks", 1);
    out += rfBin(b.rx, lifeLit, "\u{1F333}", "From living things", 1);
    /* from rocks: the four the lesson names in this line */
    var rocks = [{ pic: "\u{1F944}", word: "metal", at: cMet }, { pic: "\u{1FA9F}", word: "glass", at: cGla },
      { pic: "\u{1F6E2}️", word: "oil", at: cOil }, { pic: "\u{1F525}", word: "gas", at: cGas }];
    rocks.forEach(function (r, k) {
      out += rfThing(b.lx + 106 + k * 102, b.y + 208, 58, r.pic, r.word, popIn(t, r.at, 0.4));
    });
    /* from living things: wood and wool */
    out += rfThing(b.rx + 168, b.y + 208, 58, "\u{1FAB5}", "wood", popIn(t, cWood, 0.4));
    out += rfThing(b.rx + 340, b.y + 208, 58, "\u{1F9F6}", "wool", popIn(t, cWool, 0.4));
    /* two sources: a tick on each bin */
    out += MK.tick(b.lx + b.w - 46, b.y + 46, 20, popIn(t, cTwo, 0.35));
    out += MK.tick(b.rx + b.w - 46, b.y + 46, 20, popIn(t, cTwo == null ? null : cTwo + 0.25, 0.35));
    return out;
  }

  function rfPlanetChapter(scene, beat, t, i) {
    var swap = into(t, scene.first + 2), out = "";
    if (swap < 1) out += G(rfPlanetSpace(t, scene), { opacity: 1 - swap });
    if (swap > 0) out += G(rfPlanetBins(t, scene), { opacity: swap });
    return svg(out);
  }
