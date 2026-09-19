
  /* ==== Grade 1 Science, Lesson 2: Parts of a Plant ===========================
     tools/lib/film-scenes/science-g1/parts-of-a-plant.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-1-app/lecture-video/parts-of-a-plant.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later: the seed growing (ART.scene "plant", the demo's Next
     day frames), the tap figure (ART.figure "plant": roots, stem, leaves and
     flower, one named at a time), the two pots of the light test (ART.pots,
     darkB: by the window, in the cupboard) and the kit's own icons (roots,
     watering can, trowel, window, potted plant).

     This file: the palette, the small drawings every chapter shares, the
     title motif and the chapter "A seed wakes up". Every top-level name here
     starts with pp, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, seed: P.gold, rootstem: P.blue, leafflower: P.good,
    needs: P.gold, tools: P.plum, measure: P.accent, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ppOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ppFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var PP_SCATTER = [0.13, 0.71, 0.42, 0.88, 0.27, 0.59, 0.05, 0.94, 0.36, 0.66, 0.19, 0.81];

  /* ---- small drawings of the film's own --------------------------------------- */

  /* a drop of water, its round bottom centred on (x, y) */
  function ppDrop(x, y, r, o) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(x - r * 0.9) + "," + n2(y - r * 0.42) + " L" + n2(x) + "," + n2(y - r * 2.1) +
        " L" + n2(x + r * 0.9) + "," + n2(y - r * 0.42) + " Z", "#7FC4EA") +
      C(x, y, r, "#7FC4EA") + C(x - r * 0.34, y - r * 0.28, r * 0.28, "#FFFFFF", null, null, { opacity: 0.75 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* the Sun, the kit's gold, with eight rays turning slowly */
  function ppSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.3;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.32, cy + Math.sin(a) * r * 1.32, cx + Math.cos(a) * r * 1.78, cy + Math.sin(a) * r * 1.78, P.gold, r * 0.2);
    }
    return G(MK.glow(cx, cy, r * 2.3, P.gold, 1) + rays + C(cx, cy, r, P.gold), { opacity: clamp(o, 0, 1) });
  }

  /* a seed, the colour of the lesson's (SCENES.plant draws #C7A76B) */
  function ppSeed(cx, cy, rx, rot, o) {
    if (!(o > 0)) return "";
    return G(E(0, 0, rx, rx * 0.7, "#C7A76B", "#8B6A3A", Math.max(1, rx * 0.16)), { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(rot || 0) + ")", opacity: clamp(o, 0, 1) });
  }

  /* a small new plant: a stem and two leaves, grown to u (0..1), standing on (x, y) */
  function ppSprout(x, y, h, u) {
    if (!(u > 0)) return "";
    var top = y - h * u, lu = clamp((u - 0.45) / 0.55, 0, 1), s = h * 0.42 * lu;
    return L(x, y, x, top, "#4CB65C", Math.max(2, h * 0.12)) +
      (lu > 0 ? Pth("M" + n2(x) + "," + n2(top + 2) + " q" + n2(-s * 0.9) + "," + n2(-s * 0.1) + " " + n2(-s * 1.1) + "," + n2(-s * 0.8) + " q" + n2(s * 0.8) + "," + n2(0) + " " + n2(s * 1.1) + "," + n2(s * 0.8) + "z", "#4CB65C") +
        Pth("M" + n2(x) + "," + n2(top + 2) + " q" + n2(s * 0.9) + "," + n2(-s * 0.1) + " " + n2(s * 1.1) + "," + n2(-s * 0.8) + " q" + n2(-s * 0.8) + "," + n2(0) + " " + n2(-s * 1.1) + "," + n2(s * 0.8) + "z", "#4CB65C") : "");
  }

  /* The lesson kit's own watering can (lesson-kit/_icons.py), size px, centred
     on (cx, cy), tipped `tip` degrees; flip mirrors it to pour to the left.
     ppSpout says where its water comes out. */
  function ppCan(cx, cy, size, tip, flip, o) {
    if (!(o > 0)) return "";
    var tf = "rotate(" + n2(tip) + " " + n2(cx) + " " + n2(cy) + ")" + (flip ? " translate(" + n2(2 * cx) + ",0) scale(-1,1)" : "");
    return G(MK.pic(cx, cy, size, ART.ICONS.wateringcan), { transform: tf, opacity: clamp(o, 0, 1) });
  }
  function ppSpout(cx, cy, size, tip, flip) {
    var dx = (flip ? -1 : 1) * 0.39 * size, dy = -0.22 * size, a = tip * Math.PI / 180;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
  }
  /* water pouring from (x0, y0) down to y1, drifting dx, between `from` and
     `until`: drops only, each a pure function of t */
  function ppPour(t, from, until, x0, y0, y1, dx, r) {
    if (from == null || t < from || t > until + 0.7) return "";
    var out = "";
    for (var k = 0; k < 5; k++) {
      var born = from + k * 0.14;
      if (t < born) continue;
      var ph = ((t - born) / 0.7) % 1, cycle = Math.floor((t - born) / 0.7);
      if (born + cycle * 0.7 > until) continue;           /* no new drop after the pour stops */
      var x = x0 + dx * ph + (PP_SCATTER[k] - 0.5) * 10, y = lerp(y0, y1, ph * ph);
      out += ppDrop(x, y, r || 6, Math.min(1, (1 - ph) * 4, ph * 8));
    }
    return out;
  }

  /* a word in a pill, with a leader line from it to the thing it names. The
     newest is gold; one named before it keeps its line, quieter. */
  function ppLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: "start", col: now ? P.gold : P.line });
  }

  /* ==== the title =================================================================
     The lesson's tap figure in a round window. In the spoken title chapter
     the four parts light one at a time, from the roots up, on "four main
     parts"; each part's job shows beside it on "a different job"; the whole
     plant glows on "needs all four". On the two cards it simply stands. */
  var PP_PARTS = ["roots", "stem", "leaves", "flower"];
  function ppMotifFigure(t, o) {
    var fig = ART.figure("plant");
    if (!o.scene) return fig;
    var four = sc(o.scene, 0, "four");
    if (four == null || t < four) return fig;
    var step = (t - four) / 0.28, lit = Math.floor(step);
    PP_PARTS.forEach(function (p, n) {
      if (n > lit) fig = ART.dim(fig, p, 0.35);
      else if (n === lit && lit < 4) fig = ART.ring(fig, p, "rgba(244,201,93," + n2(clamp(1 - (step - lit) * 0.6, 0, 1)) + ")", 6);
    });
    return fig;
  }
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var fx = function (v) { return 30 + v * 0.9375; }, fy = function (v) { return 12 + v * 0.9375; };
    var jobAt = o.scene ? sc(o.scene, 1, "job") : null, allAt = o.scene ? sc(o.scene, 1, "all") : null;
    out += el("clipPath", { id: "ppMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 170, 170, P.good, on(t, allAt, 0.6) * (0.7 + 0.3 * breathe(t)));
    out += G(ART.place(ppMotifFigure(t, o), 30, 12, 300, 337.5), { "clip-path": "url(#ppMotifClip)" });
    out += C(180, 180, 172, "none", P.line, 3);
    if (jobAt != null && t >= jobAt) {
      /* each part's job, one after another: drink, hold up, make food, make seeds */
      out += ppDrop(fx(222), fy(304), 11, popIn(t, jobAt, 0.35));
      out += MK.arrow(fx(188), fy(236), fx(188), fy(186), on(t, jobAt + 0.25, 0.4), P.gold, 6);
      out += ppSun(292, 150, 14, popIn(t, jobAt + 0.5, 0.35), t);
      out += ppSeed(263, 54, 10, -20, popIn(t, jobAt + 0.75, 0.35));
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A flowering plant: roots, stem, leaves and flower">' + out + "</svg>";
  }

  /* ==== chapter: a seed wakes up =====================================================
     The lesson's own seed demo (ART.scene("plant", 0..2), the drawing its Next
     day button steps through), as a card. The root, then the shoot, grow into
     it as they are named: each is the NEXT state of the lesson's drawing, laid
     over the last and uncovered by a growing clip, so what grows is the
     lesson's own root and the lesson's own shoot. */
  var PP_SEED = { x: 110, y: 14, s: 412 };
  function ppSX(v) { return PP_SEED.x + v * PP_SEED.s / 320; }
  function ppSY(v) { return PP_SEED.y + v * PP_SEED.s / 320; }
  function ppSeedCard(state) { return ART.place(ART.scene("plant", state), PP_SEED.x, PP_SEED.y, PP_SEED.s, PP_SEED.s); }
  /* the lesson's drawing at `state`, shown only inside `clip` (film coordinates) */
  function ppSeedReveal(state, id, clip, o) {
    if (!(o > 0)) return "";
    return el("clipPath", { id: id }, clip) + G(ppSeedCard(state), { "clip-path": "url(#" + id + ")", opacity: clamp(o, 0, 1) });
  }

  /* the seed, drawn big, with the baby plant and its food packed inside */
  function ppSeedInside(t, cBaby, cFood, cIn, o) {
    if (!(o > 0)) return "";
    var cx = 880, cy = 186, p = popIn(t, cBaby, 0.45), out = "";
    if (p <= 0) return "";
    var zu = on(t, cBaby, 0.5);
    /* the zoom: two lines from the seed in the soil to the seed drawn big */
    out += L(ppSX(166), ppSY(246), lerp(ppSX(166), cx - 128, zu), lerp(ppSY(246), cy - 64, zu), P.gold, 2.5, { opacity: 0.8, "stroke-dasharray": "8 7" });
    out += L(ppSX(166), ppSY(254), lerp(ppSX(166), cx - 128, zu), lerp(ppSY(254), cy + 64, zu), P.gold, 2.5, { opacity: 0.8, "stroke-dasharray": "8 7" });
    var food = 1 + 0.06 * bump(t, cFood, 0.9), coat = bump(t, cIn, 1.0);
    var seed = E(cx, cy, 150, 104, "#C7A76B", "#8B6A3A", 5) +
      E(cx, cy, 150, 104, "none", P.gold, 7, { opacity: coat }) +
      G(E(cx + 22, cy + 6, 104, 70, "#E8D39E"), { transform: around(cx + 22, cy + 6, food) }) +
      /* the baby plant: a curled shoot with two tiny leaves, and its root tip */
      Pth("M" + (cx - 70) + "," + (cy + 44) + " C" + (cx - 96) + "," + (cy + 6) + " " + (cx - 84) + "," + (cy - 48) + " " + (cx - 40) + "," + (cy - 56), null, "#4CB65C", 12) +
      Pth("M" + (cx - 40) + "," + (cy - 56) + " q-6,-34 26,-40 q-2,30 -26,40z", "#5FCB6E") +
      Pth("M" + (cx - 40) + "," + (cy - 56) + " q30,-14 46,6 q-26,14 -46,-6z", "#5FCB6E") +
      Pth("M" + (cx - 70) + "," + (cy + 44) + " q4,18 16,26", null, "#F2E2C4", 9);
    out += G(seed, { transform: around(cx, cy, p), opacity: Math.min(1, p) });
    out += ppLabel(t, 1040, 120, "food", cFood, [cx + 70, cy - 10], true, 24);
    var bo = on(t, cBaby == null ? null : cBaby + 0.3, 0.4);
    if (bo > 0) out += MK.leader(cx - 54, 318, cx - 76, cy - 10, on(t, cBaby + 0.3, 0.6), P.gold) +
      MK.pill(cx - 54, 330, "baby plant", bo, { size: 24, col: P.gold });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function ppSeedChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSeed = c(0, "seed"), cDead = c(0, "dead"), cNot = c(0, "not");
    var cBaby = c(1, "baby"), cFood = c(1, "food"), cIn = c(1, "inside");
    var cWater = c(2, "water"), cWarm = c(2, "warmth"), cWake = c(2, "wake");
    var cRoot = c(3, "root"), cDown = c(3, "down"), cHid = c(3, "hidden");
    var cShoot = c(4, "shoot"), cUp = c(4, "up"), cOut = c(4, "out"), cLight = c(4, "light");

    var rootG = on(t, cRoot, 1.4), shootG = on(t, cShoot, 1.3), sunO = on(t, cLight, 0.6);
    var base = rootG < 1 ? 0 : (shootG < 1 || sunO < 1) ? 1 : 2;
    var seedX = ppSX(160), seedY = ppSY(250), out = "";

    /* the card, whole, with room round it */
    out += R(PP_SEED.x - 10, PP_SEED.y - 10, PP_SEED.s + 20, PP_SEED.s + 20, 20, P.card, P.line, 2);
    out += ppSeedCard(base);
    /* the root grows down into the soil, and then the shoot up out of it */
    if (base === 0 && rootG > 0) out += ppSeedReveal(1, "ppClipRoot", R(ppSX(126), ppSY(250), ppSX(196) - ppSX(126), (ppSY(294) - ppSY(250)) * rootG), 1);
    if (base === 1) {
      out += ppSeedReveal(2, "ppClipShoot", R(ppSX(146), lerp(ppSY(248), ppSY(188), shootG), ppSX(178) - ppSX(146), (ppSY(248) - ppSY(188)) * shootG), shootG > 0 ? 1 : 0);
      out += ppSeedReveal(2, "ppClipSun", C(ppSX(270), ppSY(50), ppSX(300) - ppSX(270)), sunO);
    }

    /* the warmth round the seed, for its own line */
    var warm = on(t, cWarm, 0.6) * ppOnly(t, scene, 2);
    if (warm > 0) out += MK.glow(seedX, seedY, 74, P.accent, warm * (0.75 + 0.25 * breathe(t)));

    /* the seed itself: a ring as it is named, grey while it "looks dead",
       green and breathing once it is not */
    var ringO = on(t, cSeed, 0.4) * (1 - on(t, BEATS[scene.first + 1].start, 0.5));
    if (ringO > 0) {
      var dead = on(t, cDead, 0.4), alive = on(t, cNot, 0.4);
      var col = alive > 0.5 ? P.good : dead > 0.5 ? P.muted : P.gold;
      var rr = 20 + 6 * bump(t, cSeed, 0.8) + (alive > 0 ? 3 * breathe(t) * alive : 0);
      out += C(seedX, seedY, rr, "none", col, 4, { opacity: ringO });
      if (alive > 0) out += MK.glow(seedX, seedY, 46, P.good, alive * ringO * (0.6 + 0.4 * breathe(t)));
      out += MK.qmark(seedX + 44, seedY - 40, 17, dead * (1 - alive) * ringO);
    }
    /* "it wakes up": a burst of short rays from the seed, twice */
    var w1 = bump(t, cWake, 0.7), w2 = bump(t, cWake == null ? null : cWake + 0.55, 0.7), wk = Math.max(w1, w2);
    if (wk > 0) {
      for (var r = 0; r < 8; r++) {
        var a = r * Math.PI / 4 + 0.2;
        out += L(seedX + Math.cos(a) * (18 + 8 * wk), seedY + Math.sin(a) * (14 + 8 * wk), seedX + Math.cos(a) * (30 + 16 * wk), seedY + Math.sin(a) * (24 + 16 * wk), P.gold, 4, { opacity: wk });
      }
    }

    /* water: the kit's watering can pours on the soil above the seed */
    var canO = on(t, cWater, 0.35) * (1 - on(t, BEATS[scene.first + 3].start - GAP, 0.4));
    if (canO > 0) {
      var cx = ppSX(92), cy = ppSY(150), tip = 28 * on(t, cWater == null ? null : cWater + 0.15, 0.4);
      var sp = ppSpout(cx, cy, 108, tip, false);
      out += ppCan(cx, cy, 108, tip, false, canO);
      out += ppPour(t, cWater == null ? null : cWater + 0.35, cWater == null ? 0 : cWater + 1.5, sp[0] + 6, sp[1] + 8, ppSY(214), 18, 6);
    }

    /* "hidden in the soil": the soil lights up round the root */
    var hid = bump(t, cHid, 1.25);
    if (hid > 0) out += R(PP_SEED.x, ppSY(214), PP_SEED.s, ppSY(320) - ppSY(214), 0, P.gold, null, null, { opacity: 0.28 * hid }) +
      R(PP_SEED.x + 3, ppSY(214) + 3, PP_SEED.s - 6, ppSY(320) - ppSY(214) - 6, 6, "none", P.gold, 4, { opacity: hid });

    /* down with the root, up with the shoot: each arrow belongs to its line */
    out += MK.arrow(ppSX(214), ppSY(236), ppSX(214), ppSY(300), on(t, cDown, 0.6) * ppOnly(t, scene, 3), P.gold, 7);
    out += MK.arrow(ppSX(214), ppSY(226), ppSX(214), ppSY(168), on(t, cUp, 0.6) * ppOnly(t, scene, 4), P.gold, 7);
    /* the shoot breaks out of the soil */
    out += MK.ripple(ppSX(161), ppSY(211), t, cOut, P.gold);
    /* towards the light: rays from the Sun to the shoot */
    var lr = on(t, cLight == null ? null : cLight + 0.2, 0.6);
    if (lr > 0) {
      for (var q = 0; q < 3; q++) {
        var ex = ppSX(172 + q * 8), ey = ppSY(186 + q * 10), sx0 = ppSX(252 - q * 6), sy0 = ppSY(70 + q * 6);
        out += L(sx0, sy0, lerp(sx0, ex, lr), lerp(sy0, ey, lr), P.gold, 4, { opacity: 0.85, "stroke-dasharray": "10 8" });
      }
    }

    /* the lesson's words for what grew, each with a line to it */
    var now = cShoot != null && t >= cShoot ? "shoot" : cRoot != null && t >= cRoot ? "root" : "seed";
    out += ppLabel(t, 628, 262, "shoot", cShoot, [ppSX(169), ppSY(214)], now === "shoot");
    out += ppLabel(t, 628, 338, "seed", cSeed, [ppSX(173), ppSY(250)], now === "seed");
    out += ppLabel(t, 628, 410, "root", cRoot, [ppSX(177), ppSY(280)], now === "root");

    /* what is inside a seed, for its own line */
    out += ppSeedInside(t, cBaby, cFood, cIn, ppOnly(t, scene, 1));
    return svg(out);
  }
