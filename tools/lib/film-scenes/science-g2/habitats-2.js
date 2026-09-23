  /* ==== chapters: what a habitat is, and the pond ==============================
     tools/lib/film-scenes/science-g2/habitats-2.js. */

  /* ---- what a habitat is ---------------------------------------------------
     The lesson's pond, then all four of its habitats, then what the pond gives
     a frog; and last the rabbit of the lesson's own question - its burrow is
     its HOME, and its habitat is the burrow and the field together. */
  var HB_W_ONE = hbBox(470, 30, 560);          /* the pond, alone */
  var HB_W_ROW = [hbBox(44, 120, 258), hbBox(318, 120, 258), hbBox(592, 120, 258), hbBox(866, 120, 258)];
  var HB_W_POND = hbBox(60, 45, 540);          /* the pond, with its labels */

  /* beat 0: a habitat is where a plant or animal naturally lives */
  function hbWhatOne(t, scene) {
    var cHab = sc(scene, 0, "habitat"), cLive = sc(scene, 0, "lives"), b = HB_W_ONE, out = "";
    out += hbCard(b, 0, 1) + hbCaption(b, 0, on(t, cHab, 0.5));
    out += MK.pill(190, 150, "habitat", popIn(t, cHab, 0.45), { size: 34, col: P.gold });
    var frog = hbAt(b, "pondFrog");
    out += MK.leader(282, 150, frog[0], frog[1], on(t, cLive, 0.7), P.gold);
    out += hbRing(b, "pondFrog", 26, on(t, cLive, 0.4));
    return out;
  }
  /* beat 1: a pond, a desert, a forest and the icy Arctic */
  function hbWhatRow(t, scene) {
    var names = ["pond", "desert", "forest", "arctic"], out = "";
    for (var k = 0; k < 4; k++) {
      var at = sc(scene, 1, names[k]), p = popIn(t, at, 0.42), b = HB_W_ROW[k];
      out += hbCard(b, k, Math.min(1, p), null) + hbCaption(b, k, Math.min(1, p));
    }
    return out;
  }
  /* beat 2: water, insects, plants to hide in */
  function hbWhatNeeds(t, scene) {
    var c = function (n) { return sc(scene, 2, n); };
    var cFrog = c("frog"), cWat = c("water"), cIns = c("insects"), cPl = c("plants");
    var b = HB_W_POND, out = hbCard(b, 0, 1);
    var now = cPl != null && t >= cPl ? "p" : cIns != null && t >= cIns ? "i" : "w";
    out += hbRing(b, "pondFrog", 26, on(t, cFrog, 0.4) * (1 - on(t, cWat, 0.5)));
    out += hbSeen(b, "pondFrog", 26, on(t, cWat, 0.5));
    out += hbLabel(t, 700, 120, "water", cWat, hbAt(b, "pondWater"), now === "w");
    out += hbLabel(t, 700, 230, "insects", cIns, [960, 210], now === "i");
    out += hbLabel(t, 700, 340, "plants to hide in", cPl, hbAt(b, "pondPlant"), now === "p");
    var fo = on(t, cIns, 0.45);
    out += hbFly(960, 210, 1.1, t, fo, 0) + hbFly(1082, 160, 0.95, t, on(t, cIns == null ? null : cIns + 0.25, 0.45), 0.7);
    out += hbRing(b, "pondWater", 22, on(t, cWat, 0.4) * (1 - on(t, cIns, 0.5)));
    out += hbRing(b, "pondPlant", 22, on(t, cPl, 0.4));
    return out;
  }

  /* beats 3 and 4: the rabbit's burrow, then the burrow AND the field */
  function hbBurrowPanel(x, y, w, h, hole, tunnel, ch, chr) {
    var id = "hbBurClip" + Math.round(x) + "x" + Math.round(w);
    var sky = y, grassY = y + h * 0.323, soilY = grassY + h * 0.075;
    var inner = R(x, sky, w, grassY - sky, 0, "#BFE3F5") + R(x, grassY, w, soilY - grassY, 0, "#3E8E4A") +
      R(x, soilY, w, y + h - soilY, 0, "#6B4A2B") +
      Pth(tunnel, null, "#3A2718", 26) + E(hole[0], soilY, hole[1], 12, "#3A2718") +
      E(ch[0], ch[1], chr[0], chr[1], "#3A2718");
    return el("clipPath", { id: id }, R(x, y, w, h, 20)) +
      G(inner, { "clip-path": "url(#" + id + ")" }) + R(x, y, w, h, 20, "none", P.line, 2);
  }
  var HB_BUR = { x: 150, y: 34, w: 600, h: 372, hole: [300, 34], tunnel: "M300,192 C312,250 382,264 452,296", ch: [500, 320], chr: [86, 58] };
  var HB_FLD = { x: 40, y: 34, w: 1088, h: 372, hole: [230, 30], tunnel: "M230,192 C242,246 302,258 366,288", ch: [400, 312], chr: [80, 54] };

  function hbWhatBurrow(t, scene) {
    var c = function (n) { return sc(scene, 3, n); };
    var cSleep = c("sleeps"), cBur = c("burrow"), cHome = c("home"), q = HB_BUR, out = "";
    out += hbBurrowPanel(q.x, q.y, q.w, q.h, q.hole, q.tunnel, q.ch, q.chr);
    /* the grass and the flower STAND ON the grass line, the same baseline the
       field of the next beat uses; standing them on the soil line instead drew
       them wholly inside the green band, dark green on green */
    var grass = q.y + q.h * 0.323;
    out += hbTuft(210, grass + 6, 24, 1) + hbTuft(560, grass + 6, 26, 1) + hbFlower(650, grass + 6, 30, 1);
    out += Em(q.ch[0], q.ch[1] - 2, 64, "\u{1F430}");
    /* asleep: three z's drifting up out of the burrow */
    var zs = [[572, 286, 22], [598, 258, 28], [626, 226, 36]];
    for (var k = 0; k < 3; k++) {
      var zp = popIn(t, cSleep == null ? null : cSleep + k * 0.24, 0.4);
      if (zp > 0) out += Tx(zs[k][0], zs[k][1], "z", "lab gold", "middle", { "font-size": zs[k][2] * Math.min(1.1, zp), opacity: Math.min(1, zp) });
    }
    /* the burrow itself, outlined as it is named */
    var bo = on(t, cBur, 0.5);
    if (bo > 0) out += Pth(q.tunnel, null, P.gold, 7, { opacity: bo * 0.9 }) +
      E(q.ch[0], q.ch[1], q.chr[0] + 5, q.chr[1] + 5, "none", P.gold, 4, { opacity: bo });
    out += MK.pill(790, 330, "burrow", on(t, cBur, 0.4), { size: 26, anchor: "start", col: P.gold });
    out += MK.leader(782, 330, q.ch[0] + 90, q.ch[1] + 4, on(t, cBur, 0.6), P.gold);
    /* the burrow is its HOME: the lesson's own word picture */
    var ho = popIn(t, cHome, 0.45);
    if (ho > 0) {
      out += Tx(940, 344, "=", "lab huge gold", "middle", { opacity: Math.min(1, ho) });
      out += MK.pop(MK.pic(1050, 248, 86, "\u{1F3E0}"), 1050, 248, ho);
      out += MK.pill(1050, 332, "home", Math.min(1, ho), { size: 26, col: P.teal });
    }
    return out;
  }

  function hbWhatField(t, scene) {
    var c = function (n) { return sc(scene, 4, n); };
    var cHab = c("habitat"), cBig = c("bigger"), cBur = c("burrow"), cFld = c("field"), cFeed = c("feeds");
    var q = HB_FLD, grass = q.y + q.h * 0.323, out = "";
    out += hbBurrowPanel(q.x, q.y, q.w, q.h, q.hole, q.tunnel, q.ch, q.chr);
    out += Em(q.ch[0], q.ch[1] - 2, 56, "\u{1F430}");
    /* the field it feeds in: the lesson's grass and flowers */
    var tufts = [110, 320, 490, 560, 632, 704, 776, 848, 920, 992, 1064];
    for (var k = 0; k < tufts.length; k++) out += hbTuft(tufts[k], grass + 6, 26 + HB_SCATTER[k] * 10, 1);
    out += hbFlower(600, grass + 6, 36, 1) + hbFlower(768, grass + 6, 32, 1, "#F0806F") + hbFlower(936, grass + 6, 36, 1);
    var feed = bump(t, cFeed, 1.1);
    out += G(Em(700, 126, 58, "\u{1F430}"), { transform: around(700, 152, 1 + 0.08 * feed) });
    out += MK.ripple(700, 150, t, cFeed, P.good);
    /* the habitat box grows out of the burrow to hold the whole field */
    var g = on(t, cBig, 1.1);
    if (on(t, cHab, 0.4) > 0) {
      var bx = lerp(296, 56, g), by = lerp(250, 50, g), bw = lerp(216, 1056, g), bh = lerp(132, 340, g);
      out += R(bx, by, bw, bh, lerp(16, 22, g), "none", P.gold, 4, { "stroke-dasharray": "16 11", opacity: on(t, cHab, 0.4) });
    }
    out += MK.pill(120, 86, "habitat", popIn(t, cHab, 0.45), { size: 30, anchor: "start", col: P.gold });
    /* the burrow, and the field, each named inside it */
    var bo = on(t, cBur, 0.5);
    if (bo > 0) out += E(q.ch[0], q.ch[1], q.chr[0] + 5, q.chr[1] + 5, "none", P.teal, 4, { opacity: bo });
    out += MK.pill(400, 228, "home", on(t, cBur, 0.4), { size: 22, col: P.teal });
    var fo = on(t, cFld, 0.5);
    if (fo > 0) out += R(520, grass - 4, 592, 34, 8, P.gold, null, null, { opacity: 0.3 * fo });
    out += MK.pill(880, 96, "field", on(t, cFld, 0.4), { size: 26, col: P.teal });
    return out;
  }

  function hbWhatChapter(scene, beat, t, i) {
    function draw(bi) {
      var k = bi - scene.first;
      return k === 0 ? hbWhatOne(t, scene) : k === 1 ? hbWhatRow(t, scene) :
        k === 2 ? hbWhatNeeds(t, scene) : k === 3 ? hbWhatBurrow(t, scene) : hbWhatField(t, scene);
    }
    return svg(crossfade(t, i, scene, draw));
  }

  /* ---- the pond ---------------------------------------------------------------
     The lesson's pond first, with the four living things it draws named one at
     a time; then a frog in side view, because the lesson's frog is the emoji
     face and this chapter talks about its skin, its legs and its webbed feet;
     then the pond beside the desert, which is a camel's habitat and not a
     frog's. */
  var HB_P_POND = hbBox(60, 45, 540);
  var HB_P_SMALL = hbBox(880, 60, 250);
  var HB_P_PAIR = [hbBox(80, 60, 440), hbBox(620, 60, 440)];
  var HB_P_LIVE = [
    { spot: "pondFrog", r: 26, text: "Frogs", pic: "\u{1F438}" },
    { spot: "pondDuck", r: 24, text: "Ducks", pic: "\u{1F986}" },
    { spot: "pondFish", r: 22, text: "Fish", pic: "\u{1F41F}" },
    { spot: "pondPlant", r: 22, text: "Water plants", pic: "\u{1F33F}" }
  ];

  function hbPondLive(t, scene) {
    var names = ["frogs", "ducks", "fish", "plants"], b = HB_P_POND, out = hbCard(b, 0, 1);
    var cWet = sc(scene, 0, "wet"), ats = names.map(function (n) { return sc(scene, 0, n); });
    /* wet: a drop, and the lesson's own word for the pond */
    var wp = popIn(t, cWet, 0.45);
    out += hbDrop(678, 96, 20, Math.min(1, wp));
    out += MK.pill(762, 86, "wet", Math.min(1, wp), { size: 28, anchor: "start", col: "#7FC4EA" });
    var rows = HB_P_LIVE.map(function (r, k) { return { text: r.text, at: ats[k] }; });
    out += MK.list(680, 176, rows, t, { lh: 64, cls: "lab big" });
    for (var k = 0; k < 4; k++) {
      var next = k + 1 < 4 ? ats[k + 1] : null;
      var off = next == null ? 0 : on(t, next, 0.5);
      out += hbRing(b, HB_P_LIVE[k].spot, HB_P_LIVE[k].r, on(t, ats[k], 0.4) * (1 - off));
      out += hbSeen(b, HB_P_LIVE[k].spot, HB_P_LIVE[k].r, off);
      out += MK.pop(MK.pic(1010, 176 + k * 64, 46, HB_P_LIVE[k].pic), 1010, 176 + k * 64, popIn(t, ats[k], 0.4));
    }
    return out;
  }

  /* beats 1 and 2: one picture that carries on, so nothing flickers between
     "long legs" and "webbed feet" */
  function hbPondFrog(t, scene) {
    var cSkin = sc(scene, 1, "skin"), cLegs = sc(scene, 1, "legs"), cSuit1 = sc(scene, 1, "suit");
    var cMeans = sc(scene, 2, "suit"), cRight = sc(scene, 2, "right"), cWeb = sc(scene, 2, "webbed"), cSuit2 = sc(scene, 2, "pond");
    var lit = { skin: on(t, cSkin, 0.4) * (1 - on(t, cLegs, 0.5)), leg: on(t, cLegs, 0.4) * (1 - on(t, cWeb, 0.5)), foot: on(t, cWeb, 0.4) };
    var out = hbFrog(380, 230, 1.45, lit, 1);
    var now = cWeb != null && t >= cWeb ? "f" : cLegs != null && t >= cLegs ? "l" : "s";
    out += hbLabel(t, 640, 110, "smooth skin", cSkin, [351, 155], now === "s", 28);
    out += hbLabel(t, 640, 210, "long legs", cLegs, [235, 250], now === "l", 28);
    out += hbLabel(t, 640, 310, "webbed feet", cWeb, [345, 352], now === "f", 28);
    /* suit: to be right for - the lesson's own word, in its own words */
    var mo = popIn(t, cMeans, 0.45);
    if (mo > 0) out += G(MK.pill(640, 404, "suit: to be right for", Math.min(1, mo), { size: 24, anchor: "start", col: P.teal }),
      { transform: around(640, 404, 1 + 0.06 * bump(t, cRight, 0.9)) });
    /* it suits a POND: the lesson's own pond, ticked */
    var b = HB_P_SMALL;
    out += hbCard(b, 0, on(t, cSuit1, 0.5));
    out += MK.tick(b.x + b.w - 6, b.y - 2, 26, popIn(t, cSuit1, 0.4) * (1 + 0.12 * bump(t, cSuit2, 0.8)));
    return out;
  }

  /* beat 3: a frog needs water, and the dry desert is a camel's */
  function hbPondPair(t, scene) {
    var cNeed = sc(scene, 3, "needs"), cDes = sc(scene, 3, "desert"), cCam = sc(scene, 3, "camel"), cNot = sc(scene, 3, "not");
    var a = HB_P_PAIR[0], b = HB_P_PAIR[1], out = "";
    out += hbCard(a, 0, 1) + hbCaption(a, 0, 1);
    out += MK.tick(a.x + a.w - 8, a.y + 2, 26, popIn(t, cNeed, 0.42));
    out += hbDrop(300, 412, 16, on(t, cNeed, 0.4));
    out += G(hbCard(b, 1, 1) + hbCaption(b, 1, 1), { opacity: 0.4 + 0.6 * on(t, cDes, 0.5) });
    out += hbRing(b, "desCamel", 28, on(t, cCam, 0.4));
    var np = popIn(t, cNot, 0.45);
    if (np > 0) {
      out += MK.pop(Em(790, 150, 96, "\u{1F438}"), 790, 150, np);
      out += MK.cross(836, 116, 40, popIn(t, cNot == null ? null : cNot + 0.25, 0.4), P.bad);
    }
    return out;
  }

  function hbPondChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(hbPondLive(t, scene));
    if (k === 1) {
      var u = into(t, i);
      return svg(G(hbPondFrog(t, scene), { opacity: u }) + (u < 1 ? G(hbPondLive(t, scene), { opacity: 1 - u }) : ""));
    }
    if (k === 2) return svg(hbPondFrog(t, scene));
    var v = into(t, i);
    return svg(G(hbPondPair(t, scene), { opacity: v }) + (v < 1 ? G(hbPondFrog(t, scene), { opacity: 1 - v }) : ""));
  }
