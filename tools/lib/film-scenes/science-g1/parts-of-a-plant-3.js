
  /* ==== chapters: light and water, tools, measuring, and the recap ===============
     tools/lib/film-scenes/science-g1/parts-of-a-plant-3.js. */

  /* ---- light and water ------------------------------------------------------------
     The lesson's two pots (ART.pots, the drawing its experiments step through,
     a day at a time): first the water test's pair ("water every day", "no
     water"), then its own light test ("by the window", "in the cupboard"),
     whose cupboard (darkB) darkens as it is named. The window is the kit's own
     drawing; the door is the picture the lesson's quiz gives the dark cupboard. */
  var PP_POTS = { x: 353.6, y: 11, k: 1.44 };          /* 320 x 290 drawn at 460.8 x 417.6 */
  function ppPX(v) { return PP_POTS.x + v * PP_POTS.k; }
  function ppPY(v) { return PP_POTS.y + v * PP_POTS.k; }
  function ppPotsCard(markup) {
    return R(PP_POTS.x - 8, PP_POTS.y - 8, 320 * PP_POTS.k + 16, 290 * PP_POTS.k + 16, 18, P.card, P.line, 2) +
      ART.place(markup, PP_POTS.x, PP_POTS.y, 320 * PP_POTS.k, 290 * PP_POTS.k);
  }
  /* a gold box round one of the card's own labels (pot A or B), as it is said */
  function ppLabelBox(potX, w, o) {
    if (!(o > 0)) return "";
    return R(ppPX(potX) - w / 2, ppPY(272) - 24, w, 33, 12, "none", P.gold, 3, { opacity: clamp(o, 0, 1) });
  }

  /* beat 1: what a plant needs */
  function ppNeedsPic(t, scene) {
    var cW = sc(scene, 0, "water"), cL = sc(scene, 0, "light"), cA = sc(scene, 0, "alive"), out = "";
    var alive = on(t, cA, 0.5), pw = popIn(t, cW, 0.4), pl = popIn(t, cL, 0.4);
    out += MK.glow(584, 250, 170, P.good, alive * (0.6 + 0.4 * breathe(t)));
    out += G(MK.pic(584, 236, 250, ART.ICONS.plant), { transform: around(584, 350, 1 + 0.06 * bump(t, cA, 0.8)) });
    out += MK.pop(Em(300, 180, 118, "\u{1F4A7}"), 300, 180, pw) + MK.pill(300, 296, "water", Math.min(1, pw), { size: 30, col: "#7FC4EA" });
    out += MK.arrow(362, 196, 486, 226, on(t, cW == null ? null : cW + 0.2, 0.5), "#7FC4EA", 7);
    out += MK.pop(Em(868, 180, 118, "☀️"), 868, 180, pl) + MK.pill(868, 296, "light", Math.min(1, pl), { size: 30, col: P.gold });
    out += MK.arrow(806, 196, 682, 226, on(t, cL == null ? null : cL + 0.2, 0.5), P.gold, 7);
    return out;
  }
  /* beat 2: the water test's two pots; the plant with no water droops, a day at a time */
  function ppWaterPic(t, scene) {
    var cAway = sc(scene, 1, "away"), b = 4 * on(t, cAway, 2.4), day = 1 + Math.min(4, Math.round(b));
    return ppPotsCard(ART.pots(0, b, day, { sun: true, labelA: "water every day", labelB: "no water" })) +
      ppLabelBox(230, 132, on(t, cAway, 0.4));
  }
  /* beats 3 to 6: the light test */
  function ppLightPic(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTest = c(2, "test"), cTwo = c(2, "two"), cWin = c(3, "window"), cCup = c(3, "cupboard"),
      cBoth = c(4, "both"), cOne = c(4, "one"), cLight = c(4, "light"), cDark = c(5, "dark"), cPale = c(5, "pale"), cEnough = c(5, "enough");
    var b = 4 * on(t, cDark, 2.6), day = 1 + Math.min(4, Math.round(b)), dark = on(t, cCup, 0.7);
    var opts = function (d) { return { sun: true, sunA: true, labelA: "by the window", labelB: "in the cupboard", darkB: d }; };
    var out = "";
    if (dark < 1) out += ppPotsCard(ART.pots(0, b, day, opts(false)));
    if (dark > 0) out += G(ppPotsCard(ART.pots(0, b, day, opts(true))), dark < 1 ? { opacity: dark } : {});
    /* the window's light, on its side of the test */
    out += MK.glow(ppPX(90), ppPY(140), 88, P.gold, on(t, cLight, 0.5) * (0.8 + 0.2 * breathe(t)));
    /* "test the light": the Sun in the lesson's picture */
    out += MK.glow(ppPX(280), ppPY(40), 58, P.gold, bump(t, cTest, 1.4) * 1.4);
    out += C(ppPX(280), ppPY(40), 24 * PP_POTS.k + 8, "none", P.gold, 4, { opacity: bump(t, cTest, 1.4) });
    /* "two plants" */
    var two = ppOnly(t, scene, 2);
    out += MK.pop(E(ppPX(90), ppPY(150), 84, 150, "none", P.gold, 4), ppPX(90), ppPY(150), popIn(t, cTwo, 0.4) * two);
    out += MK.pop(E(ppPX(230), ppPY(150), 84, 150, "none", P.gold, 4), ppPX(230), ppPY(150), popIn(t, cTwo == null ? null : cTwo + 0.22, 0.4) * two);
    /* "by the window", "a dark cupboard": the kit's window and the lesson's door,
       each with a line to its plant, and the card's own label lit */
    var wo = popIn(t, cWin, 0.4), co = popIn(t, cCup, 0.4);
    out += MK.glow(200, 108, 100, P.gold, on(t, cLight, 0.5) * 0.9) + MK.pop(MK.pic(200, 108, 132, ART.ICONS.window), 200, 108, wo);
    out += MK.leader(272, 128, ppPX(52), ppPY(120), on(t, cWin, 0.6), P.gold);
    out += MK.pop(Em(970, 110, 124, "\u{1F6AA}"), 970, 110, co);
    out += MK.leader(906, 130, ppPX(266), ppPY(120), on(t, cCup, 0.6), P.gold);
    out += ppLabelBox(90, 188, on(t, cWin, 0.4) * ppOnly(t, scene, 3));
    out += ppLabelBox(230, 208, on(t, cCup, 0.4) * ppOnly(t, scene, 3));
    /* "Both get water": two watering cans, one each side, pour together */
    var pour = ppOnly(t, scene, 4), cans = on(t, cBoth, 0.35) * pour;
    if (cans > 0) {
      var tipA = 30 * on(t, cBoth + 0.1, 0.35), spA = ppSpout(300, 222, 92, tipA, false);
      var tipB = -30 * on(t, cBoth + 0.1, 0.35), spB = ppSpout(868, 222, 92, tipB, true);
      out += ppCan(300, 222, 92, tipA, false, cans) + ppCan(868, 222, 92, tipB, true, cans);
      out += ppPour(t, cBoth + 0.3, cBoth + 1.5, spA[0] + 4, spA[1] + 6, ppPY(186), ppPX(70) - spA[0], 6);
      out += ppPour(t, cBoth + 0.3, cBoth + 1.5, spB[0] - 4, spB[1] + 6, ppPY(186), ppPX(250) - spB[0], 6);
    }
    /* "Only one thing is different": the cupboard, outlined */
    out += R(ppPX(152), ppPY(20), 156 * PP_POTS.k, 200 * PP_POTS.k, 10, "none", P.gold, 4,
      { opacity: on(t, cOne, 0.4) * pour, "stroke-dasharray": "14 9" });
    /* "pale and thin"; "Water is not enough": yes by the window, no in the dark */
    var last = ppOnly(t, scene, 5);
    out += E(ppPX(230), ppPY(150), 84, 150, "none", P.gold, 5, { opacity: bump(t, cPale, 1.4) * last });
    out += MK.tick(ppPX(90), ppPY(38), 27, popIn(t, cEnough, 0.35) * last);
    out += MK.cross(ppPX(212), ppPY(38), 27, popIn(t, cEnough == null ? null : cEnough + 0.2, 0.35) * last);
    return out;
  }

  function ppNeedsChapter(scene, beat, t, i) {
    var k = i - scene.first;
    function draw(bi) {
      var kk = bi - scene.first;
      return kk === 0 ? ppNeedsPic(t, scene) : kk === 1 ? ppWaterPic(t, scene) : ppLightPic(t, scene);
    }
    /* needs -> water test: both fade; water test -> light test: the new card
       lies whole underneath and the old one fades off it; the light test then
       carries on as one picture, so nothing flickers between its lines */
    if (k <= 1) return svg(crossfade(t, i, scene, draw));
    if (k === 2) {
      var u = into(t, i);
      return svg(ppLightPic(t, scene) + (u < 1 ? G(ppWaterPic(t, scene), { opacity: 1 - u }) : ""));
    }
    return svg(ppLightPic(t, scene));
  }

  /* ---- using tools safely ------------------------------------------------------------
     The five tools of the lesson's "Use the tools safely" step, in a row: the
     kit's watering can and trowel, and the lesson's magnifying glass, gloves
     and ruler. The one being talked about wears a gold ring. The magnifying
     glass is drawn, not an emoji, because it has to magnify: what is under
     it is drawn again, twice the size, inside its lens. */
  var PP_TOOLS = [ART.ICONS.wateringcan, "\u{1F50D}", ART.ICONS.trowel, "\u{1F9E4}", "\u{1F4CF}"];
  var PP_TOOL_X = [300, 442, 584, 726, 868];

  /* a leaf, big, centred on (cx, cy): the green of the lesson's leaves */
  function ppLeaf(cx, cy, s, rot) {
    var v = "", xs = [-0.6, -0.25, 0.1, 0.45];
    for (var k = 0; k < xs.length; k++) {
      v += L(xs[k] * s, 0, (xs[k] + 0.28) * s, -0.3 * s, "#2F8F45", s * 0.03) + L(xs[k] * s, 0, (xs[k] + 0.28) * s, 0.3 * s, "#2F8F45", s * 0.03);
    }
    return G(L(-1.02 * s, 0, -1.34 * s, 0.14 * s, "#2F8F45", s * 0.06) +
      Pth("M" + n2(-s) + ",0 C" + n2(-0.5 * s) + "," + n2(-0.52 * s) + " " + n2(0.5 * s) + "," + n2(-0.56 * s) + " " + n2(s) + ",0 C" +
        n2(0.5 * s) + "," + n2(0.56 * s) + " " + n2(-0.5 * s) + "," + n2(0.52 * s) + " " + n2(-s) + ",0 Z", "#4CB65C") +
      L(-s, 0, 0.95 * s, 0, "#2F8F45", s * 0.05) + v,
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(rot) + ")" });
  }
  /* the magnifying glass: its lens (radius r) centred on (lx, ly), and inside
     it `under` drawn again at twice the size, blurred by `blur` px */
  function ppMagnifier(lx, ly, r, under, blur, o) {
    if (!(o > 0)) return "";
    var hx = Math.SQRT1_2, out = "";
    out += L(lx + r * hx, ly + r * hx, lx + r * 1.6 * hx + 22, ly + r * 1.6 * hx + 22, "#6B4AA0", 26);
    out += el("clipPath", { id: "ppLens" }, C(lx, ly, r - 5));
    if (blur > 0.05) out += el("filter", { id: "ppBlur", x: "-30%", y: "-30%", width: "160%", height: "160%" }, el("feGaussianBlur", { stdDeviation: n2(blur) }));
    out += G(C(lx, ly, r, "#0F2A3C") + G(under, { transform: around(lx, ly, 2), filter: blur > 0.05 ? "url(#ppBlur)" : null }), { "clip-path": "url(#ppLens)" });
    out += C(lx, ly, r - 5, "#BFE3F5", null, null, { opacity: 0.12 });
    out += Pth("M" + n2(lx - r * 0.62) + "," + n2(ly - r * 0.2) + " A" + n2(r * 0.66) + "," + n2(r * 0.66) + " 0 0 1 " + n2(lx - r * 0.18) + "," + n2(ly - r * 0.62), null, "#FFFFFF", 6, { opacity: 0.55 });
    out += C(lx, ly, r, "none", "#8A63C4", 13);
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* an eye, looking right */
  function ppEye(cx, cy, s, o) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(cx - s) + "," + n2(cy) + " Q" + n2(cx) + "," + n2(cy - s * 0.78) + " " + n2(cx + s) + "," + n2(cy) + " Q" + n2(cx) + "," + n2(cy + s * 0.78) + " " + n2(cx - s) + "," + n2(cy) + " Z", "#FFFFFF", P.edge, 3) +
      C(cx + s * 0.18, cy, s * 0.36, "#6B4A2B") + C(cx + s * 0.22, cy, s * 0.17, "#0B1D2C") + C(cx + s * 0.08, cy - s * 0.12, s * 0.08, "#FFFFFF"), { opacity: clamp(o, 0, 1) });
  }

  function ppToolsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTools = c(0, "tools"), cGlass = c(0, "glass"), cClose = c(0, "closely"), cEye = c(1, "eye"), cLeaf = c(1, "leaf"),
      cNever = c(2, "never"), cBurn = c(2, "burn"), cGloves = c(3, "gloves"), cWash = c(3, "wash");
    var out = "";
    /* which tool is being talked about */
    var cur = cGloves != null && t >= cGloves ? 3 : cGlass != null && t >= cGlass ? 1 : -1;
    for (var k = 0; k < 5; k++) {
      var p = popIn(t, cTools == null ? null : cTools + k * 0.14, 0.35);
      if (p <= 0) continue;
      var x = PP_TOOL_X[k], y = 56, isCur = k === cur;
      var dimTo = cur >= 0 && !isCur ? 0.4 : 1;
      if (isCur) out += C(x, y, 50, "#1B3A52", P.gold, 4, { opacity: on(t, cur === 3 ? cGloves : cGlass, 0.35) });
      out += G(MK.pic(x, y, 70, PP_TOOLS[k]), { transform: around(x, y, Math.min(p, 1.1)), opacity: Math.min(1, p) * dimTo });
    }

    /* the magnifying glass: over the leaf on "look closely", sharp once the
       leaf is moved closer; then pointed at the Sun, and crossed out */
    var glassO = on(t, cGlass, 0.4) * (1 - ppFrom(t, scene, 3));
    if (glassO > 0) {
      var mg = "", leafO = 1 - ppFrom(t, scene, 2), closer = on(t, cLeaf, 1.0), two = ppOnly(t, scene, 2);
      var leaf = ppLeaf(470, 292, 132 * (1 + 0.1 * closer), -16);
      var go = on(t, cClose, 1.0), aim = on(t, cNever, 0.7);
      var lx = lerp(lerp(840, 486, go), 744, aim), ly = lerp(lerp(262, 272, go), 226, aim);
      var blur = lerp(3, 0, closer) * (1 - aim);
      if (leafO > 0) mg += G(leaf, { opacity: leafO });
      mg += MK.pop(ppMagnifier(lx, ly, 96, leafO > 0 ? G(leaf, { opacity: leafO }) : "", blur, 1), lx, ly, popIn(t, cGlass, 0.45));
      /* "near your eye": you look through it */
      var eo = on(t, cEye, 0.4) * leafO, reach = on(t, cEye == null ? null : cEye + 0.15, 0.6);
      if (eo > 0) mg += ppEye(262, 176, 52, eo) +
        L(318, 186, lerp(318, lx - 40, reach), lerp(186, ly - 20, reach), P.gold, 4, { opacity: eo, "stroke-dasharray": "10 8" });
      /* sharp now */
      mg += MK.tick(612, 168, 24, popIn(t, cLeaf == null ? null : cLeaf + 1.0, 0.35) * leafO);
      /* "Never point it at the sun. It can burn." */
      mg += ppSun(1010, 236, 44, on(t, cNever, 0.4) * two, t);
      mg += G(Em(744, 382, 80, "\u{1F525}"), { opacity: on(t, cBurn, 0.35) * two, transform: around(744, 382, 0.9 + 0.1 * breathe(t * 2)) });
      mg += MK.cross(744, 226, 70, popIn(t, cNever == null ? null : cNever + 0.75, 0.4) * two);
      out += G(mg, { opacity: glassO });
    }

    /* gloves keep the soil off; then wash your hands anyway. Both stop before
       the voice does, so the line's last frame shows them done. */
    var go3 = ppFrom(t, scene, 3), stop3 = spokenEnd(scene.first + 3) - 1.3;
    if (go3 > 0) {
      out += MK.pop(Em(430, 292, 196, "\u{1F9E4}"), 430, 292, popIn(t, cGloves, 0.45));
      /* soil falls on the glove and bounces off it: eight specks, one after another */
      for (var s = 0; s < 8; s++) {
        var born = cGloves == null ? null : cGloves + 0.3 + s * 0.15;
        if (born == null || t < born || born + Math.floor((t - born) / 1.2) * 1.2 > stop3) continue;
        var ph = ((t - born) / 1.2) % 1, x0 = 372 + PP_SCATTER[s] * 120, dir = PP_SCATTER[s] < 0.5 ? -1 : 1, x, y, o;
        if (ph < 0.55) { x = x0; y = lerp(118, 206, ph / 0.55); o = Math.min(1, ph * 8); }
        else { var u = (ph - 0.55) / 0.45; x = x0 + dir * 120 * u; y = 206 - 60 * Math.sin(Math.PI * u * 0.8) + 90 * u * u; o = 1 - u; }
        out += C(x, y, 6, "#8B5A2B", null, null, { opacity: o * go3 });
      }
      out += MK.pop(Em(816, 320, 170, "\u{1F450}"), 816, 320, popIn(t, cWash, 0.45));
      out += MK.pop(Em(962, 214, 92, "\u{1F9FC}"), 962, 214, popIn(t, cWash == null ? null : cWash + 0.2, 0.45));
      out += ppPour(t, cWash == null ? null : cWash + 0.35, Math.max(cWash == null ? 0 : cWash + 0.9, stop3 + 0.5), 792, 150, 300, 24, 6);
    }
    return svg(out);
  }

  /* ---- measuring in cubes ---------------------------------------------------------
     The lesson's seedling (the 🌱 of its "How tall is the plant?" step) and a
     tower of cubes beside it, as the lesson's own explain and home project
     stand them: one at a time, stopping exactly at the top, then counted. The
     sprout fills its em box (measured: from -0.48 to +0.50 of the font size),
     so three cubes reach exactly its top. */
  var PP_GROUND = 398, PP_SPROUT = { x: 440, size: 272 };
  function ppSproutTop() { return PP_GROUND - 0.98 * PP_SPROUT.size; }
  function ppCube(x, y, s, o, flash) {
    if (!(o > 0)) return "";
    return G(R(x, y, s, s, s * 0.14, "#43B864", "#2A8A4A", 3) + R(x + s * 0.12, y + s * 0.1, s * 0.76, s * 0.18, s * 0.08, "#7FDB98", null, null, { opacity: 0.8 }) +
      (flash > 0 ? R(x, y, s, s, s * 0.14, "#FFFFFF", null, null, { opacity: 0.55 * flash }) : ""), { opacity: clamp(o, 0, 1) });
  }

  function ppMeasureChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRuler = c(0, "ruler"), cCubes = c(0, "cubes"), cTall = c(0, "tall"), cStack = c(1, "stack"), cTop = c(1, "top"),
      cOne = c(2, "one"), cTwo = c(2, "two"), cThree = c(2, "three"), cAll = c(2, "tall");
    var top = ppSproutTop(), s = (PP_GROUND - top) / 3, cx = 612, out = "";
    out += R(214, PP_GROUND, 760, 12, 6, "#6B4A2B");
    out += Em(PP_SPROUT.x, PP_GROUND - 0.504 * PP_SPROUT.size, PP_SPROUT.size, "\u{1F331}");
    /* "A ruler or cubes": the two things that measure */
    var first = ppOnly(t, scene, 0);
    out += MK.pop(Em(850, 150, 104, "\u{1F4CF}"), 850, 150, popIn(t, cRuler, 0.4) * first);
    out += MK.pop(ppCube(958, 110, 78, 1, 0), 997, 149, popIn(t, cCubes, 0.4) * first);
    /* "how tall": from the ground to the top of the plant */
    var ht = on(t, cTall, 0.7), mid = (PP_GROUND + top) / 2;
    out += MK.arrow(262, mid, 262, lerp(mid, top + 2, ht), ht, P.gold, 6) + MK.arrow(262, mid, 262, lerp(mid, PP_GROUND - 2, ht), ht, P.gold, 6);
    /* "Stack cubes beside it, one at a time": each drops onto the last */
    var nums = [cOne, cTwo, cThree];
    for (var k = 0; k < 3; k++) {
      var land = cStack == null ? null : cStack + 0.5 + k * 0.95;
      if (land == null || t < land - 0.4) continue;
      var u = clamp((t - (land - 0.4)) / 0.4, 0, 1), y = PP_GROUND - (k + 1) * s;
      out += ppCube(cx, lerp(y - 110, y, u * u), s, Math.min(1, u * 3), bump(t, nums[k], 0.6));
      /* counted: one, two, three */
      var no = popIn(t, nums[k], 0.35);
      if (no > 0) out += MK.pop(Tx(cx + s + 34, y + s / 2 + 16, String(k + 1), "lab huge", "middle", { fill: P.teal }), cx + s + 34, y + s / 2, no);
    }
    /* "Stop when they reach the top" */
    var tp = on(t, cTop, 0.5);
    if (tp > 0) out += L(PP_SPROUT.x - 40, top, lerp(PP_SPROUT.x - 40, cx + s + 10, tp), top, P.gold, 4, { "stroke-dasharray": "12 8" }) +
      MK.tick(cx + s + 44, top - 2, 20, popIn(t, cTop == null ? null : cTop + 0.4, 0.35));
    /* "three cubes tall" */
    out += MK.pill(962, (PP_GROUND + top) / 2, "3 cubes tall", on(t, cAll, 0.4), { size: 34, col: P.gold });
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------------- */
  var PP_RECAP = MK.recapKind([
    { beat: 0, at: "roots", title: "Roots", sub: "hold and drink", pic: ART.ICONS.roots },
    { beat: 0, at: "stem", title: "Stem", sub: "holds up, carries water", pic: "\u{1F33F}" },
    { beat: 0, at: "leaves", title: "Leaves", sub: "make food from sunlight", pic: "\u{1F343}" },
    { beat: 0, at: "flower", title: "Flower", sub: "makes seeds", pic: "\u{1F33C}" },
    { beat: 1, at: "need", title: "Light and water", sub: "a plant needs both",
      pic: function (cx, cy, size) { return Em(cx - size * 0.5, cy, size * 0.82, "☀️") + Em(cx + size * 0.5, cy, size * 0.82, "\u{1F4A7}"); } },
    { beat: 2, at: "tools", title: "Tools and cubes", sub: "used safely; measure in cubes",
      pic: function (cx, cy, size) { return Em(cx - size * 0.5, cy, size * 0.82, "\u{1F50D}") + ppCube(cx + size * 0.14, cy - size * 0.36, size * 0.72, 1, 0); } }
  ], { goBeat: 2, goAt: "cubes" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The roots, stem, leaves and flower", "What each part does", "What a plant needs to stay alive"] }),
    seed: ppSeedChapter, parts: ppPartsChapter, needs: ppNeedsChapter,
    tools: ppToolsChapter, measure: ppMeasureChapter, recap: PP_RECAP
  };
