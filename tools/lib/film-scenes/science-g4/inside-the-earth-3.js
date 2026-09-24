  /* ==== Grade 4 Science, Lesson 11: Inside the Earth, part 3 ==================
     tools/lib/film-scenes/science-g4/inside-the-earth-3.js: the last two
     teaching chapters, "An apple Earth" and "How we know", the recap cards and
     KINDS. The lesson draws no apple (its scale step is a row of pictures), so
     the apple is drawn here, cut the same way the lesson's Earth is cut, and
     stands beside the lesson's own earthLayers figure so a child can see which
     part of the apple stands for which layer. */

  /* ---- chapter: an apple Earth --------------------------------------------------
     The apple on the left, the lesson's Earth on the right, and the pairing in
     the middle: skin to crust, flesh to mantle, core to core. Then the apple's
     limits: the real core reaches more than halfway out (the lesson's own
     words), and the apple has no heat and no metal. */
  var IE_AP = { cx: 250, cy: 226, r: 150 };
  var IE_A = { x: 770, y: 52, s: 340 };
  IE_A.k = IE_A.s / 320;
  IE_A.cx = IE_A.x + 160 * IE_A.k;
  IE_A.cy = IE_A.y + 160 * IE_A.k;
  function ieAR(r) { return r * IE_A.k; }
  /* one of the three layer bands of the Earth drawing on the right, moved with
     it while it still stands nearer the middle (see ox below) */
  function ieABand(k, u, col, ox) {
    var row = IE_ROWS[k];
    return ieBand(IE_A.cx + (ox || 0), IE_A.cy, ieAR(row.rIn), ieAR(row.rOut), u, col);
  }

  /* an apple cut in half: skin, flesh and core, the same way the Earth is cut */
  function ieAppleHalf(cx, cy, r, o) {
    if (!(o > 0)) return "";
    var flesh = r - 9;
    return G(
      L(cx, cy - r + 8, cx - 5, cy - r - 30, "#6B4A2B", 8) +
      E(cx + 24, cy - r - 20, 24, 12, "#3E8E4A", null, null, { transform: "rotate(-22 " + n2(cx + 24) + " " + n2(cy - r - 20) + ")" }) +
      C(cx, cy, r, "#D9473F") +
      C(cx, cy, flesh, "#F6E7B8") +
      E(cx, cy, 24, 46, "#E6D3A0", "#C0A97A", 2) +
      E(cx - 9, cy - 12, 5.5, 9, "#5B4A3A") + E(cx + 9, cy + 12, 5.5, 9, "#5B4A3A"),
      { opacity: clamp(o, 0, 1), transform: around(cx, cy, 0.94 + 0.06 * clamp(o, 0, 1)) });
  }

  /* a lump of metal: the meteorite of the lesson's "weight and meteorites"
     card, and the metal the apple has none of */
  function ieLump(cx, cy, s) {
    return G(Pth("M-54,2 L-44,-22 L-18,-34 L20,-32 L48,-16 L56,6 L36,30 L0,40 L-36,26 Z", "#8D99A6", "#5E6B78", 3) +
      Pth("M-30,-4 L-10,-18 L18,-16 L26,0 L2,12 Z", "#C2CDD8", null, null, { opacity: 0.75 }),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(s) + ")" });
  }

  var IE_PAIRS = [
    { text: "skin = crust", y: 118 },
    { text: "flesh = mantle", y: 226 },
    { text: "core = core", y: 334 }
  ];

  function ieAppleChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cThin = c(0, "thin"), cApple = c(0, "apple");
    var cSkin = c(1, "skin"), cCrust = c(1, "crust"), cThinner = c(1, "thinner");
    var cFlesh = c(2, "flesh"), cMantle = c(2, "mantle"), cMost = c(2, "most");
    var cCore = c(3, "core"), cReal = c(3, "real"), cSmall = c(3, "small");
    var cNo = c(4, "nomodel"), cHeat = c(4, "heat"), cMetal = c(4, "metal");
    var ax = IE_AP.cx, ay = IE_AP.cy, ar = IE_AP.r, out = "";
    var appleIn = on(t, cApple, 0.6), ox = -244 * (1 - appleIn);

    /* the lesson's own Earth, whole; it starts nearer the middle and moves
       right as the apple is named, so no half of the frame stands empty */
    out += R(IE_A.x - 12 + ox, IE_A.y - 12, IE_A.s + 24, IE_A.s + 24, 20, P.card, P.line, 2);
    out += ART.place(ART.figure("earthLayers"), IE_A.x + ox, IE_A.y, IE_A.s, IE_A.s);

    /* the apple, from the moment it is named */
    out += ieAppleHalf(ax, ay, ar, appleIn);

    /* the Earth's layer being talked about, one at a time */
    var lit = [
      Math.max(on(t, cThin, 0.4) * ieOnly(t, scene, 0), on(t, cCrust, 0.4) * ieOnly(t, scene, 1)),
      on(t, cMantle, 0.4) * ieOnly(t, scene, 2),
      on(t, cReal, 0.4) * ieOnly(t, scene, 3)
    ];
    for (var k = 0; k < 3; k++) if (lit[k] > 0) out += ieABand(k, lit[k], P.gold, ox);
    /* what the apple leaves out, pointed at on the real Earth */
    var heatO = on(t, cHeat, 0.5) * ieOnly(t, scene, 4);
    if (heatO > 0) out += ieABand(1, heatO, P.accent, ox);
    var metO = on(t, cMetal, 0.5) * ieOnly(t, scene, 4);
    if (metO > 0) out += ieABand(2, metO, P.gold, ox);

    /* the pairing, in the middle, one row lit as it is said */
    var pairs = ieSpan(t, scene, 1, 3);
    if (pairs > 0) {
      var atPair = [cSkin, cFlesh, cCore];
      var nowPair = cCore != null && t >= cCore ? 2 : cFlesh != null && t >= cFlesh ? 1 : 0;
      for (var p = 0; p < 3; p++) {
        var po = on(t, atPair[p], 0.45) * pairs;
        if (po <= 0) continue;
        out += MK.pill(594, IE_PAIRS[p].y, IE_PAIRS[p].text, po,
          { size: 30, col: nowPair === p ? P.gold : P.line });
      }
    }

    /* beat 1: the skin, and the crust that is thinner still */
    var b1 = ieOnly(t, scene, 1);
    if (b1 > 0) {
      var sk = on(t, cSkin, 0.45) * b1;
      if (sk > 0) out += C(ax, ay, ar - 4.5, "none", P.gold, 8, { opacity: sk });
      out += ieTag(t, 170, 58, "even thinner", cThinner, [ax - 106, ay - 106], true, 26, "down");
    }

    /* beat 2: the flesh, most of the apple, as the mantle is most of the Earth */
    var b2 = ieOnly(t, scene, 2);
    if (b2 > 0) {
      var fl = on(t, cFlesh, 0.5) * b2;
      if (fl > 0) out += C(ax, ay, ar - 9, "#FFFFFF", P.gold, 5, { opacity: 0.2 * fl, "stroke-opacity": fl });
      var mo = on(t, cMost, 0.5) * b2;
      if (mo > 0) out += Tx(940, 424, "most of the Earth", "lab mid gold", "middle", { opacity: mo });
    }

    /* beat 3: the apple's core, and how big the real one would have to be */
    var b3 = ieOnly(t, scene, 3);
    if (b3 > 0) {
      var co = on(t, cCore, 0.5) * b3;
      if (co > 0) out += E(ax, ay, 32, 54, "none", P.gold, 5, { opacity: co });
      var sm = on(t, cSmall, 0.6) * b3;
      if (sm > 0) out += C(ax, ay, 82, "none", P.gold, 4, { opacity: sm, "stroke-dasharray": "12 9" });
      out += ieTag(t, 250, 412, "the real core is this big", cSmall, [ax + 58, ay + 58], true, 24, "up");
    }

    /* beat 4: no model shows everything - this one has no heat and no metal */
    var b4 = ieOnly(t, scene, 4);
    if (b4 > 0) {
      out += MK.pill(594, 96, "a model leaves things out", on(t, cNo, 0.5) * b4, { size: 26, col: P.line });
      out += G(MK.list(470, 200, [
        { text: "the heat", at: cHeat, mark: "cross" },
        { text: "the metal", at: cMetal, mark: "cross" }
      ], t, { lh: 84, cls: "lab big" }), { opacity: b4 });
      out += MK.pop(Em(704, 200, 54, "\u{1F525}"), 704, 200, popIn(t, cHeat, 0.45) * b4);
      out += MK.pop(ieLump(704, 286, 0.5), 704, 284, popIn(t, cMetal, 0.45) * b4);
    }
    return svg(out);
  }

  /* ---- chapter: how we know -----------------------------------------------------
     The lesson's Earth again, with the evidence of its "How we found out" step
     laid on it: earthquake waves that pass through the mantle and stop at the
     outer core, the Earth's weight, and iron meteorites. Nothing here is new:
     each is one of that step's own cards. */
  var IE_E = { x: 56, y: 36, s: 368 };
  IE_E.k = IE_E.s / 320;
  IE_E.cx = IE_E.x + 160 * IE_E.k;
  IE_E.cy = IE_E.y + 160 * IE_E.k;
  function ieER(r) { return r * IE_E.k; }
  function ieEAt(deg, r) {
    var a = deg * Math.PI / 180;
    return [IE_E.cx + ieER(r) * Math.cos(a), IE_E.cy + ieER(r) * Math.sin(a)];
  }
  function ieEBand(k, u, col, wash) {
    var row = IE_ROWS[k];
    return ieBand(IE_E.cx, IE_E.cy, ieER(row.rIn), ieER(row.rOut), u, col, wash);
  }
  /* a wave path from the quake at the top of the Earth, drawn as far as u */
  function ieRay(from, to, u, col, w) {
    if (!(u > 0)) return "";
    return L(from[0], from[1], lerp(from[0], to[0], u), lerp(from[1], to[1], u), col || P.gold, w || 5,
      { opacity: 0.95 });
  }

  function ieEvidChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cNobody = c(0, "nobody"), cHow = c(0, "how");
    var cWaves = c(1, "waves"), cThrough = c(1, "through"), cSolids = c(1, "solids");
    var cPass = c(2, "pass"), cSolid = c(2, "solid");
    var cStop = c(3, "stop"), cOuter = c(3, "outer"), cLiquid = c(3, "liquid");
    var cHeavy = c(4, "heavy"), cRock = c(4, "rock");
    var cMet = c(5, "met"), cIron = c(5, "iron"), cMetal = c(5, "metal");
    var cEv = c(6, "ev"), cChanged = c(6, "changed");
    var src = ieEAt(-90, 140), out = "";

    /* the lesson's own Earth, whole, on the left */
    out += R(IE_E.x - 12, IE_E.y - 12, IE_E.s + 24, IE_E.s + 24, 20, P.card, P.line, 2);
    out += ART.place(ART.figure("earthLayers"), IE_E.x, IE_E.y, IE_E.s, IE_E.s);

    /* beat 0: nobody has seen them, so how do we know? */
    var b0 = ieOnly(t, scene, 0);
    if (b0 > 0) {
      var nb = popIn(t, cNobody, 0.45) * b0;
      if (nb > 0) {
        out += MK.pop(Em(660, 200, 104, "\u{1F441}️"), 660, 200, nb);
        out += MK.cross(660, 200, 50, popIn(t, cNobody == null ? null : cNobody + 0.45, 0.4) * b0);
      }
      out += MK.qmark(920, 200, 62, on(t, cHow, 0.5) * b0);
    }

    /* beat 1: earthquakes send waves right through the Earth */
    var b1 = ieOnly(t, scene, 1);
    if (b1 > 0) {
      out += G(MK.waves(src[0], src[1], t, cWaves, { dir: Math.PI / 2, spread: 2.2, n: 3, period: 1.0, reach: 150, col: P.gold }), { opacity: b1 });
      var th = on(t, cThrough, 0.9) * b1;
      out += ieRay(src, ieEAt(0, 140), th, P.gold, 5);
      out += ieRay(src, ieEAt(180, 140), th, P.gold, 5);
      out += MK.pill(790, 214, "only through solids", on(t, cSolids, 0.5) * b1, { size: 30, col: P.gold });
    }

    /* beat 2: they pass through the mantle, so the mantle is solid */
    var b2 = ieOnly(t, scene, 2);
    if (b2 > 0) {
      var pa = on(t, cPass, 0.8) * b2;
      out += ieRay(src, ieEAt(0, 140), pa, P.gold, 6);
      var so = on(t, cSolid, 0.5) * b2;
      if (so > 0) out += ieEBand(1, so, P.gold);
      out += MK.tick(790, 132, 30, popIn(t, cSolid, 0.4) * b2);
      out += MK.pill(790, 214, "the mantle is solid", on(t, cSolid, 0.5) * b2, { size: 30, col: P.gold });
    }

    /* beat 3: they cannot get through the outer core, so that part is liquid */
    var b3 = ieOnly(t, scene, 3);
    if (b3 > 0) {
      var stop = ieEAt(-45, 77);
      var sp = on(t, cStop, 0.7) * b3;
      out += ieRay(src, stop, sp, P.gold, 6);
      out += MK.cross(stop[0], stop[1], 30, popIn(t, cStop == null ? null : cStop + 0.5, 0.4) * b3);
      var ou = on(t, cOuter, 0.5) * b3;
      if (ou > 0) out += ieBand(IE_E.cx, IE_E.cy, ieER(33), ieER(77), ou, P.gold);
      out += MK.pill(790, 214, "the outer core is liquid", on(t, cLiquid, 0.5) * b3, { size: 30, col: P.gold });
    }

    /* beat 4: the Earth is far too heavy to be rock all the way through */
    var b4 = ieOnly(t, scene, 4);
    if (b4 > 0) {
      out += MK.pill(760, 90, "the Earth is very heavy", on(t, cHeavy, 0.5) * b4, { size: 28, col: P.gold });
      out += MK.arrow(470, 150, 470, 292, on(t, cHeavy, 0.8) * b4, P.gold, 9);
      var ro = popIn(t, cRock, 0.45) * b4;
      if (ro > 0) {
        out += MK.pop(C(760, 236, 92, "#7D6B4A", "#B59A78", 3), 760, 236, ro);
        out += MK.cross(760, 236, 64, popIn(t, cRock == null ? null : cRock + 0.4, 0.4) * b4);
        out += Tx(760, 372, "rock all the way through", "lab mid muted", "middle", { opacity: Math.min(1, ro) });
      }
    }

    /* beat 5: iron meteorites, so the core is metal */
    var b5 = ieOnly(t, scene, 5);
    if (b5 > 0) {
      var mu = cMet == null ? 0 : ease(clamp((t - cMet) / 0.7, 0, 1));
      if (mu > 0) out += G(MK.pic(lerp(1086, 866, mu), lerp(60, 148, mu), 86, "☄️"), { opacity: Math.min(1, mu * 2) * b5 });
      var iro = popIn(t, cIron, 0.45) * b5;
      if (iro > 0) {
        out += MK.pop(ieLump(866, 250, 1), 866, 250, iro);
        out += Tx(866, 324, "iron", "lab big gold", "middle", { opacity: Math.min(1, iro) });
      }
      var me = on(t, cMetal, 0.5) * b5;
      if (me > 0) out += ieEBand(2, me, P.gold);
      out += ieTag(t, 866, 388, "the core is metal", cMetal, ieEAt(-45, 45), true, 28, "left");
    }

    /* beat 6: evidence from enquiry built this model, and changed what people thought */
    var b6 = ieOnly(t, scene, 6);
    if (b6 > 0) {
      out += G(MK.list(500, 118, [
        { text: "earthquake waves", at: cEv, mark: "tick" },
        { text: "the Earth's weight", at: cEv == null ? null : cEv + 0.4, mark: "tick" },
        { text: "iron meteorites", at: cEv == null ? null : cEv + 0.8, mark: "tick" }
      ], t, { lh: 78, cls: "lab big" }), { opacity: b6 });
      var ch = on(t, cChanged, 0.6) * b6;
      if (ch > 0) for (var k = 0; k < 3; k++) out += ieEBand(k, ch * (0.55 + 0.45 * breathe(t + k * 0.5)), P.teal, 0);
      out += MK.pill(740, 372, "knowledge changed", ch, { size: 30, col: P.gold });
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own pictures for its own words: the Earth, the mantle's warm
     disc, the core's flame, the volcano, the earthquake and the apple. */
  var IE_RECAP = MK.recapKind([
    { beat: 0, at: "crust", title: "Crust", sub: "thin, hard rock", pic: "\u{1F30D}" },
    { beat: 0, at: "mantle", title: "Mantle", sub: "thick, hot rock", pic: "\u{1F7E1}" },
    { beat: 0, at: "core", title: "Core", sub: "metal, at the centre", pic: "\u{1F525}" },
    { beat: 1, at: "volc", title: "Volcanoes", sub: "magma through a break", pic: "\u{1F30B}" },
    { beat: 1, at: "quake", title: "Earthquakes", sub: "the crust slips", pic: "\u{1F3DA}️" },
    { beat: 2, at: "apple", title: "An apple model", sub: "and evidence", pic: "\u{1F34E}" }
  ], { goBeat: 2, goAt: "ev" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The crust, the mantle and the core", "Volcanoes and earthquakes", "How anybody knows"] }),
    layers: ieLayersChapter, volcano: ieVolcanoChapter, quake: ieQuakeChapter,
    apple: ieAppleChapter, evid: ieEvidChapter, recap: IE_RECAP
  };
