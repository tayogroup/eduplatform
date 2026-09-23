  /* ==== chapters: attract and repel, magnetic or not, magnets at work ==========
     tools/lib/film-scenes/science-g3/magnets-2.js, after magnets.js and in the
     same scope.

     Two of these three chapters are the lesson's own drawings, moved by the
     film: ART.kit.magnetPair(gap, flipped) is the magnetPoles sim the child
     drives in the next step, and ART.magnet(pic, reach, jump) is the "Will it
     stick?" test, with the same eight things in the same order. The third
     chapter draws the compass and the crane, because the lesson shows them as
     emoji and a compass has to turn. */

  /* ---- attract and repel ---------------------------------------------------------
     The kit's two bar magnets, placed whole with room round them. Only the gap
     and the flip change, exactly as the sim changes them: 60 apart, brought to
     34, snapped to 0 (its label reads "touching"), flipped, pushed to 14 and
     sprung back to 76. The sim itself springs to 90, which would put the left
     magnet 5 units outside its own viewBox; 76 is the same picture, uncut. */
  var MG_CARD = { x: 324, y: 30, w: 520, h: 325 };
  function mgFX(v) { return MG_CARD.x + v * MG_CARD.w / 320; }
  function mgFY(v) { return MG_CARD.y + v * MG_CARD.w / 320; }

  /* one line of the summary: two small magnets pulling together, or pushing apart */
  function mgSummary(bx, t, at, label, repel) {
    var o = popIn(t, at, 0.45);
    if (!(o > 0)) return "";
    var cx = bx + 140, gap = repel ? 30 : 6, col = repel ? P.accent : P.good;
    var lc = cx - 35 - gap / 2, rc = cx + 35 + gap / 2;
    var out = R(bx, 142, 280, 152, 18, P.card, col, 3) +
      mgBar(lc, 206, 70, 28, { flip: true, fs: 18 }) + mgBar(rc, 206, 70, 28, { flip: !repel, fs: 18 });
    if (repel) out += MK.arrow(cx - 22, 166, cx - 66, 166, 1, col, 6) + MK.arrow(cx + 22, 166, cx + 66, 166, 1, col, 6);
    else out += MK.arrow(cx - 66, 166, cx - 22, 166, 1, col, 6) + MK.arrow(cx + 66, 166, cx + 22, 166, 1, col, 6);
    out += Tx(cx, 268, label, "lab big", "middle", { fill: col });
    return G(out, { transform: around(cx, 218, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }
  /* the turn-it-round arc, drawn over the magnet being flipped */
  function mgFlipArc(cx, cy, r, o) {
    if (!(o > 0)) return "";
    var d = "M" + n2(cx - r) + "," + n2(cy) + " A" + n2(r) + "," + n2(r) + " 0 0 1 " + n2(cx + r) + "," + n2(cy);
    return G(Pth(d, null, P.gold, 6) +
      Pth("M" + n2(cx + r) + "," + n2(cy + 2) + " L" + n2(cx + r - 13) + "," + n2(cy - 16) + " L" + n2(cx + r + 13) + "," + n2(cy - 16) + " Z", P.gold, P.gold, 2),
      { opacity: clamp(o, 0, 1) });
  }

  function mgPushChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTwo = c(0, "two"), cTog = c(0, "together");
    var cNorth = c(1, "north"), cSouth = c(1, "south");
    var cSnap = c(2, "snap"), cAttract = c(2, "attract");
    var cFlip = c(3, "flip"), cFaces = c(3, "faces");
    var cPush = c(4, "push"), cBack = c(4, "back"), cRepel = c(4, "repel");
    var cMeans = c(5, "means");

    var gap = lerp(60, 34, on(t, cTog, 0.8));
    gap = lerp(gap, 0, on(t, cSnap, 0.45));
    gap = lerp(gap, 56, on(t, cFlip, 0.5));
    gap = lerp(gap, 14, on(t, cPush, 0.7));
    gap = lerp(gap, 76, on(t, cBack, 0.35));
    var flipped = cFlip != null && t >= cFlip + 0.25;
    var out = R(MG_CARD.x - 10, MG_CARD.y - 10, MG_CARD.w + 20, MG_CARD.h + 20, 20, P.card, P.line, 2);
    out += ART.place(ART.kit.magnetPair(gap, flipped), MG_CARD.x, MG_CARD.y, MG_CARD.w, MG_CARD.h);

    /* the two poles that are facing each other, named and pointed at */
    var lPole = mgFX(130 - gap / 2), rPole = mgFX(190 + gap / 2), py = mgFY(122);
    out += mgLabel(t, 470, 286, "north pole", cNorth, [lPole, py], true, 24, "end", [470, 272]);
    out += mgLabel(t, 700, 286, flipped ? "north pole" : "south pole", cSouth, [rPole, py], true, 24, "start", [700, 272]);

    /* brought together, snapped together, pushed, sprung apart */
    var ay = mgFY(62), inward = Math.max(on(t, cTog, 0.5) * (1 - mgFrom(t, scene, 1)), on(t, cPush, 0.5) * (1 - on(t, cBack, 0.3)));
    if (inward > 0) {
      out += MK.arrow(mgFX(58), ay, mgFX(122), ay, inward, P.gold, 7) +
        MK.arrow(mgFX(262), ay, mgFX(198), ay, inward, P.gold, 7);
    }
    out += MK.ripple(mgFX(160), mgFY(100), t, cSnap, P.gold);
    out += MK.glow(mgFX(160), mgFY(100), 96, P.good, bump(t, cAttract, 1.2) * 0.9);
    var back = on(t, cBack, 0.4);
    if (back > 0) {
      out += MK.arrow(mgFX(122), ay, mgFX(58), ay, back, P.accent, 7) +
        MK.arrow(mgFX(198), ay, mgFX(262), ay, back, P.accent, 7);
    }
    out += mgFlipArc(mgFX(220 + gap / 2), mgFY(96), 62, Math.max(bump(t, cFlip, 1.1), bump(t, cFaces, 0.9)));

    /* the rule, one line for each way round */
    out += mgSummary(20, t, cAttract, "attract", false);
    out += mgSummary(868, t, cRepel == null ? cMeans : cRepel, "repel", true);
    return svg(out);
  }

  /* ---- magnetic or not? -----------------------------------------------------------
     The lesson's own test scene (ART.magnet: the magnet slides up to the thing,
     and a magnetic thing jumps across to it), with its own eight things in its
     own order, and the result written down beside it as each one is tested. */
  var MG_CLIP_ICON = '<svg class="ico" viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true" focusable="false">' +
    '<g transform="translate(32,32) scale(2.1)"><path d="M-7,-13 L-7,7 A7,7 0 0 0 7,7 L7,-9 A4.5,4.5 0 0 0 -2,-9 L-2,9" ' +
    'fill="none" stroke="#7E8B98" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
  var MG_ROWS = [
    { label: "iron nail", pic: null, yes: true, beat: 1, at: "nail" },
    { label: "steel paperclip", pic: MG_CLIP_ICON, yes: true, beat: 2, at: "clip" },
    { label: "steel scissors", pic: "✂️", yes: true, beat: 2, at: "scissors" },
    { label: "copper wire", pic: null, yes: false, beat: 3, at: "copper" },
    { label: "aluminium foil", pic: null, yes: false, beat: 4, at: "foil" },
    { label: "plastic ruler", pic: "\u{1F4CF}", yes: false, beat: 4, at: "ruler" },
    { label: "wooden pencil", pic: "✏️", yes: false, beat: 4, at: "pencil" }
  ];
  function mgRowPic(k) {
    if (k === 0) return ART.ICONS.nail;
    if (k === 3) return ART.ICONS.wire;
    if (k === 4) return ART.ICONS.foil;
    return MG_ROWS[k].pic;
  }
  function mgMaterialsChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTest = c(0, "test"), cPull = c(0, "pull"), cEvery = c(5, "every"), cBoth = c(5, "both");
    var out = "", k, at;

    /* which thing is on the tray now: the last one that has been named */
    var now = -1, nowAt = null;
    for (k = 0; k < MG_ROWS.length; k++) {
      at = sc(scene, MG_ROWS[k].beat, MG_ROWS[k].at);
      if (at != null && t >= at) { now = k; nowAt = at; }
    }
    var reach = now < 0 ? on(t, cTest, 0.6) * 0.15 : on(t, nowAt, 0.55);
    var jump = now >= 0 && MG_ROWS[now].yes ? on(t, nowAt == null ? null : nowAt + 0.5, 0.3) : 0;
    out += R(30, 46, 480, 306, 20, P.card, P.line, 2);
    out += ART.place(ART.magnet(now < 0 ? "" : mgRowPic(now), reach, jump), 40, 55, 460, 288);
    out += MK.qmark(268, 400, 26, on(t, cPull, 0.4) * (1 - mgFrom(t, scene, 1)));

    /* the results, listed from the start and filled in as each one is tested */
    var shown = on(t, cTest, 0.6);
    if (shown > 0) for (k = 0; k < MG_ROWS.length; k++) {
      at = sc(scene, MG_ROWS[k].beat, MG_ROWS[k].at);
      var ry = 68 + k * 50, o = shown * (0.34 + 0.66 * on(t, at, 0.4));
      out += G(MK.pic(600, ry, 40, mgRowPic(k)), { opacity: o });
      out += Tx(692, ry + 11, MG_ROWS[k].label, "lab big", "start", { opacity: o });
      var mp = popIn(t, at == null ? null : at + 0.75, 0.4);
      if (mp > 0) out += (MG_ROWS[k].yes ? MK.tick(654, ry, 17, mp) : MK.cross(654, ry, 17, mp));
      else out += C(654, ry, 6, P.muted, null, null, { opacity: o * 0.7 });
    }

    /* "Copper and aluminium are metals that do nothing": which of them are metals */
    var mo = on(t, cEvery, 0.5);
    if (mo > 0) for (k = 0; k < 5; k++) {
      out += MK.pill(1060, 68 + k * 50, "metal", popIn(t, cEvery == null ? null : cEvery + k * 0.1, 0.35),
        { size: 22, col: P.gold, ink: P.gold });
    }
    var bo = on(t, cBoth, 0.5);
    if (bo > 0) out += R(586, 218 + 25 - 50, 528, 100, 14, "none", P.gold, 4, { opacity: bo * (0.7 + 0.3 * breathe(t)), "stroke-dasharray": "14 10" });
    return svg(out);
  }

  /* ---- magnets at work -------------------------------------------------------------
     The three the lesson shows in its "Magnets at work" step: a compass, a
     fridge door and a scrapyard crane. The compass is drawn rather than taken
     from the lesson because its needle has to swing and settle; the fridge is
     the kit's own drawing (ART.ICONS.fridge). */
  function mgCompass(cx, cy, r, ang, ringO) {
    var face = C(cx, cy, r, P.paper, "#8FA0AE", 4) + C(cx, cy, r * 0.86, "none", "#C9D4DE", 2);
    var marks = ["N", "E", "S", "W"], dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0], k;
    for (k = 0; k < 4; k++) {
      face += Tx(cx + dx[k] * r * 0.68, cy + dy[k] * r * 0.68 + 8, marks[k], "lab mid dark", "middle");
    }
    var nd = r * 0.68, w = r * 0.13;
    var needle = Pth("M0," + n2(-nd) + " L" + n2(-w) + ",0 L" + n2(w) + ",0 Z", MG_RED) +
      Pth("M0," + n2(nd) + " L" + n2(-w) + ",0 L" + n2(w) + ",0 Z", "#7A8896");
    face += G(needle, { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(ang) + ")" });
    face += C(cx, cy, r * 0.09, "#3A4650");
    if (ringO > 0) face += C(cx, cy, r * 0.82, "none", P.gold, 4, { opacity: ringO, "stroke-dasharray": "10 8" });
    return face;
  }
  function mgCrane(t, cCrane, cCar, cHuge, cSteel, cTyres) {
    var out = "";
    var u = on(t, cCar, 1.3), d1 = clamp(u * 2, 0, 1), d2 = clamp(u * 2 - 1, 0, 1);
    var discY = lerp(lerp(150, 256, d1), 168, d2), carY = d2 > 0 ? discY + 58 : 300;
    out += R(795, 340, 325, 10, 4, "#6B4A2B");
    out += R(800, 130, 18, 210, 3, "#8A96A2") + R(788, 332, 42, 12, 3, "#6E7A86") + R(800, 118, 290, 16, 5, "#9AA7B3");
    out += L(1046, 134, 1046, discY, "#5E6A75", 4);
    out += MK.glow(1046, discY + 14, 74, P.gold, Math.max(bump(t, cHuge, 1.3), d2) * 0.85);
    out += R(1000, discY, 92, 26, 7, "#48535D", "#2E373F", 3);
    out += Em(1046, carY, 74, "\u{1F697}");
    /* the rubber tyre the magnet leaves behind */
    var ty = on(t, cTyres, 0.5);
    if (ty > 0) {
      var tyre = C(864, 308, 32, "#181C20") + C(864, 308, 21, "none", "#39424A", 8) + C(864, 308, 12, "#9AA7B3", "#6E7A86", 3);
      for (var q = 0; q < 8; q++) {
        var qa = q * Math.PI / 4 + 0.2;
        tyre += L(864 + Math.cos(qa) * 24, 308 + Math.sin(qa) * 24, 864 + Math.cos(qa) * 31, 308 + Math.sin(qa) * 31, "#39424A", 4);
      }
      out += G(tyre, { opacity: ty }) + MK.cross(864, 248, 20, popIn(t, cTyres == null ? null : cTyres + 0.4, 0.4));
    }
    out += MK.tick(1104, 244, 20, popIn(t, cSteel, 0.4));
    return G(out, { opacity: 1 });
  }
  function mgWorkChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cJobs = c(0, "jobs"), cHouse = c(0, "house");
    var cComp = c(1, "compass"), cTiny = c(1, "tiny"), cSwing = c(1, "swing");
    var cNorth = c(2, "north"), cTurns = c(2, "turns");
    var cFridge = c(3, "fridge"), cStrip = c(3, "strip"), cShut = c(3, "shut");
    var cCrane = c(4, "crane"), cCar = c(4, "car"), cHuge = c(4, "huge");
    var cSteel = c(5, "steel"), cTyres = c(5, "tyres"), cRubber = c(5, "rubber");
    var jobs = popIn(t, cJobs, 0.5), titles = on(t, cHouse, 0.5), out = "";
    if (jobs <= 0) return svg("");
    var lit = function (a, b) { return 0.42 + 0.58 * on(t, a, 0.5) - 0.3 * on(t, b, 0.5); };

    /* the compass: its needle swings, then settles on north */
    var ang = 46 * Math.sin((cSwing == null ? 0 : t - cSwing) * 4.2) * on(t, cSwing, 0.4) * (1 - on(t, cTurns, 0.7));
    var one = R(40, 70, 350, 330, 20, P.card, P.line, 2) +
      mgCompass(215, 208, 100, ang, Math.max(on(t, cTiny, 0.4) * (1 - on(t, cNorth, 0.5)), bump(t, cNorth, 1.2))) +
      Tx(215, 380, "compass", "lab big", "middle", { opacity: titles });
    out += G(one, { opacity: clamp(lit(cComp, cFridge), 0, 1) });

    /* the fridge: its door swings shut onto the magnetic strip */
    var shut = on(t, cShut, 0.8), strip = on(t, cStrip, 0.5);
    var two = R(410, 70, 350, 330, 20, P.card, P.line, 2) +
      MK.pic(585, 205, 200, ART.ICONS.fridge) +
      (strip > 0 ? L(637, 176, 637, 284, P.gold, 5, { opacity: strip, "stroke-dasharray": "9 7" }) + MK.glow(637, 230, 56, P.gold, strip * 0.8) : "") +
      MK.arrow(722, 230, 664, 230, shut * mgOnly(t, scene, 3), P.gold, 7) +
      MK.ripple(637, 230, t, cShut == null ? null : cShut + 0.8, P.gold) +
      MK.tick(700, 320, 22, popIn(t, cShut == null ? null : cShut + 1.0, 0.4)) +
      Tx(585, 380, "fridge door", "lab big", "middle", { opacity: titles });
    out += G(two, { opacity: clamp(lit(cFridge, cCrane), 0, 1) });

    /* the scrapyard crane: it lifts the steel car and leaves the tyre */
    var three = R(780, 70, 350, 330, 20, P.card, P.line, 2) +
      mgCrane(t, cCrane, cCar, cHuge, cSteel, cTyres) +
      Tx(955, 380, "scrapyard crane", "lab big", "middle", { opacity: titles });
    out += G(three, { opacity: clamp(0.42 + 0.58 * on(t, cCrane, 0.5) + 0.2 * on(t, cRubber, 0.5), 0, 1) });
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------------- */
  function mgRecapBar(cx, cy, size) { return mgBar(cx, cy, size * 1.55, size * 0.52, { fs: size * 0.34 }); }
  function mgRecapPair(repel) {
    return function (cx, cy, size) {
      var gap = repel ? size * 0.42 : size * 0.08, w = size * 0.7, col = repel ? P.accent : P.good;
      var lc = cx - w / 2 - gap / 2, rc = cx + w / 2 + gap / 2;
      var out = mgBar(lc, cy, w, size * 0.34, { flip: true, fs: size * 0.22 }) +
        mgBar(rc, cy, w, size * 0.34, { flip: !repel, fs: size * 0.22 });
      var a = size * 0.3, b = size * 0.62;
      if (repel) out += MK.arrow(cx - a, cy - size * 0.42, cx - b, cy - size * 0.42, 1, col, 5) +
        MK.arrow(cx + a, cy - size * 0.42, cx + b, cy - size * 0.42, 1, col, 5);
      else out += MK.arrow(cx - b, cy - size * 0.42, cx - a, cy - size * 0.42, 1, col, 5) +
        MK.arrow(cx + b, cy - size * 0.42, cx + a, cy - size * 0.42, 1, col, 5);
      return out;
    };
  }
  var MG_RECAP = MK.recapKind([
    { beat: 0, at: "poles", title: "Two poles", sub: "north and south, on every magnet", pic: function (cx, cy, size) { return mgRecapBar(cx, cy, size); } },
    { beat: 1, at: "attract", title: "Attract", sub: "unlike poles pull together", pic: mgRecapPair(false) },
    { beat: 1, at: "repel", title: "Repel", sub: "like poles push apart", pic: mgRecapPair(true) },
    { beat: 2, at: "magnetic", title: "Magnetic", sub: "iron and steel; not copper or aluminium", pic: ART.ICONS.nail },
    { beat: 3, at: "jobs", title: "At work", sub: "compasses, fridges and cranes",
      pic: function (cx, cy, size) { return mgCompass(cx, cy, size * 0.5, 0, 0); } }
  ], { goBeat: 3, goAt: "jobs" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The two poles of a magnet", "When magnets attract and when they repel", "Which materials a magnet pulls"] }),
    poles: mgPolesChapter, count: mgCountChapter, push: mgPushChapter,
    materials: mgMaterialsChapter, work: mgWorkChapter, recap: MG_RECAP
  };
