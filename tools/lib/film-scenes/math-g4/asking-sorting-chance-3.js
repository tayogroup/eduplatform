  /* ==== Asking, Sorting and Chance, part 3 =====================================
     The chapters "Two classes, one question", "Impossible to certain" and
     "Spin it, and spin it again", then "What you now know" and KINDS.

     The chance line (impossible - unlikely - maybe - likely - certain), the
     bag of ten counters and the coin are drawn here: the picture library has
     no chance line, no bag and no heads-or-tails coin (see the report). */

  /* ==== chapter: Two classes, one question ==================================
     The lesson's two classes, side by side on ONE scale so their bars can be
     compared: 4A walks (9), 4B takes the bus (11), and four come by car in
     each. Both classes have 22 children. */
  var AS_CH = { w: 527, h: 320, y: 40, ax: 30, bx: 611 };
  /* where the top of bar k sits, in the film's own coordinates */
  function asBarTop(x0, counts, k) {
    var S = AS_CH.w / 540;
    return [x0 + (74 + 111 * (k + 0.5)) * S, AS_CH.y + (266 - (counts[k] / 12) * 210) * S];
  }
  function asClassChart(counts, name, hot, x0) {
    return ART.place(ART.barChart({
      title: "Class " + name + " · 22 children", bars: asBars(counts),
      max: 12, step: 2, highlight: hot
    }), x0, AS_CH.y, AS_CH.w, AS_CH.h);
  }

  function asCompareChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cA = c(0, "classa"), cB = c(0, "classb"), cBoth = c(0, "bothhave");
    var cWalk = c(1, "awalk"), cBus = c(1, "bbus");
    var cCar = c(2, "bycar"), cSame = c(2, "samein");
    var cNot = c(3, "notsame"), cEvery = c(3, "everygroup");

    var carOn = cCar != null && t >= cCar, doneCar = cNot != null && t >= cNot;
    var hiA = doneCar ? null : carOn ? 2 : (cWalk != null && t >= cWalk ? 0 : null);
    var hiB = doneCar ? null : carOn ? 2 : (cBus != null && t >= cBus ? 1 : null);
    var out = "";

    var pa = popIn(t, cA, 0.45), pb = popIn(t, cB, 0.45), sameTotal = on(t, cBoth, 0.5) * (1 - on(t, cWalk, 0.5));
    if (pa > 0) out += MK.pop(asClassChart(AS_A, "4A", hiA, AS_CH.ax), AS_CH.ax + AS_CH.w / 2, AS_CH.y + AS_CH.h / 2, Math.min(1, pa));
    if (pb > 0) out += MK.pop(asClassChart(AS_B, "4B", hiB, AS_CH.bx), AS_CH.bx + AS_CH.w / 2, AS_CH.y + AS_CH.h / 2, Math.min(1, pb));

    /* "both have 22 children": each chart's own total, ringed together */
    if (sameTotal > 0.01) {
      out += R(AS_CH.ax + 158, AS_CH.y + 22, 212, 34, 14, "none", P.teal, 3, { opacity: sameTotal });
      out += R(AS_CH.bx + 158, AS_CH.y + 22, 212, 34, 14, "none", P.teal, 3, { opacity: sameTotal });
    }

    /* what is different: the group each class chooses most */
    var wa = asBarTop(AS_CH.ax, AS_A, 0), bb = asBarTop(AS_CH.bx, AS_B, 1);
    out += MK.pill(wa[0], 28, "9 walk", on(t, cWalk, 0.4) * (1 - on(t, cCar, 0.5)), { size: 25, col: P.gold, ink: P.gold });
    out += MK.leader(wa[0], 52, wa[0], wa[1] - 6, on(t, cWalk, 0.6) * (1 - on(t, cCar, 0.5)), P.gold);
    out += MK.pill(bb[0], 28, "11 by bus", on(t, cBus, 0.4) * (1 - on(t, cCar, 0.5)), { size: 25, col: P.gold, ink: P.gold });
    out += MK.leader(bb[0], 52, bb[0], bb[1] - 6, on(t, cBus, 0.6) * (1 - on(t, cCar, 0.5)), P.gold);

    /* what is the same: four by car in each class */
    var ca = asBarTop(AS_CH.ax, AS_A, 2), cb = asBarTop(AS_CH.bx, AS_B, 2);
    out += MK.tick(ca[0], ca[1] - 26, 19, popIn(t, cCar, 0.4));
    out += MK.tick(cb[0], cb[1] - 26, 19, popIn(t, cCar == null ? null : cCar + 0.3, 0.4));
    out += MK.pill(584, 396, "22 children each", on(t, cBoth, 0.4) * (1 - on(t, cWalk, 0.5)), { size: 27, col: P.teal });
    out += MK.pill(584, 396, "4 by car in both", on(t, cSame, 0.4) * (1 - on(t, cNot, 0.5)), { size: 27, col: P.good, ink: P.good });
    out += MK.pill(584, 396, "same total, different answers", on(t, cNot, 0.4), { size: 27, col: P.gold, ink: P.gold });

    /* "look at every group": each pair of groups underlined in turn */
    if (cEvery != null && t >= cEvery) {
      var lit = tally(t, cEvery, 4, 1.1), k, S = AS_CH.w / 540;
      for (k = 0; k < lit; k++) {
        var lx = (74 + 111 * (k + 0.5)) * S, ly = AS_CH.y + 300 * S;
        out += L(AS_CH.ax + lx - 30, ly, AS_CH.ax + lx + 30, ly, P.gold, 4);
        out += L(AS_CH.bx + lx - 30, ly, AS_CH.bx + lx + 30, ly, P.gold, 4);
      }
    }
    return svg(out);
  }

  /* ==== chapter: Impossible to certain ========================================
     The lesson's own chance line, with its five words, and the events it uses:
     a seven on a dice (impossible), any face at all (certain), a bag of nine
     red counters and one blue (likely, unlikely), and a coin (maybe). */
  var AS_STOPS = [120, 352, 584, 816, 1048];
  var AS_CHANCE_WORDS = ["impossible", "unlikely", "maybe", "likely", "certain"];
  var AS_LINE_Y = 372;

  /* the marker's place at t: the last verdict reached, eased from the one before */
  function asChanceMark(t, steps) {
    var cur = -1, prev = -1, at = null, k;
    for (k = 0; k < steps.length; k++) {
      if (steps[k].at == null || t < steps[k].at) break;
      prev = cur; cur = steps[k].idx; at = steps[k].at;
    }
    if (cur < 0) return null;
    var u = ease(clamp((t - at) / 0.55, 0, 1));
    return { x: lerp(AS_STOPS[prev < 0 ? cur : prev], AS_STOPS[cur], u), idx: cur };
  }

  function asChanceLine(t, lit) {
    var out = L(AS_STOPS[0], AS_LINE_Y, AS_STOPS[4], AS_LINE_Y, P.line, 6), k;
    for (k = 0; k < 5; k++) {
      var hot = lit && lit[k] > 0 ? lit[k] : 0;
      out += C(AS_STOPS[k], AS_LINE_Y, 9 + 4 * hot, hot > 0 ? P.gold : P.muted);
      out += Tx(AS_STOPS[k], 414, AS_CHANCE_WORDS[k], "lab mid", "middle",
        { fill: hot > 0 ? P.gold : P.muted, opacity: 0.55 + 0.45 * hot });
    }
    return out;
  }

  /* a bag holding nine red counters and one blue */
  function asBag(t, shown, ringBlue) {
    var out = R(420, 96, 330, 190, 28, P.card, P.line, 3), k, x, y;
    for (k = 0; k < 10; k++) {
      if (k >= shown) break;
      x = 462 + (k % 5) * 61; y = k < 5 ? 152 : 232;
      out += asCounter(x, y, 24, k === 9 ? P.blue : P.bad, 1);
    }
    if (ringBlue > 0) out += C(706, 232, 36, "none", P.gold, 4, { opacity: ringBlue });
    return out;
  }

  /* a coin, heads on the left and tails on the right */
  function asCoin(cx, cy, r, ch, lit) {
    return C(cx, cy, r, P.gold) + C(cx, cy, r * 0.8, "none", "#8A6A12", 3) +
      Tx(cx, cy + r * 0.3, ch, "lab huge", "middle", { fill: "#3A2C05" }) +
      (lit > 0 ? C(cx, cy, r + 11, "none", P.gold, 4, { opacity: lit }) : "");
  }

  function asChanceChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cCannot = c(0, "cannot"), cSure = c(0, "suretodo"), cBetween = c(0, "between");
    var cNoSeven = c(1, "noseven"), cImp = c(1, "impossible");
    var cFace = c(2, "everyface"), cCert = c(2, "certain");
    var cRed = c(3, "ninered"), cBlue = c(3, "oneblue"), cLikely = c(3, "likely"), cUnlikely = c(3, "unlikely");
    var cCoin = c(4, "coin"), cMaybe = c(4, "maybe"), cHeads = c(4, "heads");

    var mark = asChanceMark(t, [
      { at: cImp, idx: 0 }, { at: cCert, idx: 4 },
      { at: cLikely, idx: 3 }, { at: cUnlikely, idx: 1 }, { at: cMaybe, idx: 2 }
    ]);
    var lit = [0, 0, 0, 0, 0], ends = asOnly(t, scene, 0);
    if (mark) lit[mark.idx] = 1;
    else {
      lit[0] = on(t, cCannot, 0.5) * ends; lit[4] = on(t, cSure, 0.5) * ends;
      lit[1] = lit[2] = lit[3] = on(t, cBetween, 0.5) * ends;
    }
    var out = asChanceLine(t, lit);

    /* beat 0: the two ends, then everything between them */
    var first = asOnly(t, scene, 0);
    if (first > 0.01) {
      out += G(MK.cross(AS_STOPS[0], AS_LINE_Y - 66, 22, popIn(t, cCannot, 0.4)) +
        MK.tick(AS_STOPS[4], AS_LINE_Y - 66, 22, popIn(t, cSure, 0.4)) +
        R(AS_STOPS[1] - 24, AS_LINE_Y - 16, AS_STOPS[3] - AS_STOPS[1] + 48, 32, 16, "none", P.gold, 3,
          { opacity: on(t, cBetween, 0.5) }) +
        MK.pill(584, 160, "most sit in between", on(t, cBetween, 0.4), { size: 30, col: P.gold, ink: P.gold }),
        { opacity: first });
    }

    /* beats 1 and 2: the six faces of an ordinary dice */
    var dieShow = asFrom(t, scene, 1) * asUntil(t, scene, 3);
    if (dieShow > 0.01) {
      var d = "", k, n = tally(t, cNoSeven, 6, 1.0);
      for (k = 0; k < 6; k++) {
        if (k >= n) break;
        d += ART.place(ART.dice([k + 1]), 174 + k * 140, 122, 120, 120);
        d += MK.tick(174 + k * 140 + 102, 146, 18, popIn(t, cFace == null ? null : cFace + 0.1 * k, 0.35));
      }
      var no7 = popIn(t, cImp, 0.4) * asOnly(t, scene, 1);
      if (no7 > 0) d += MK.pop(Tx(536, 322, "7", "lab huge", "middle", { fill: P.bad }) +
        MK.cross(602, 306, 27, 1), 566, 306, Math.min(1, no7));
      d += MK.pill(584, 306, "every face is less than 7", on(t, cCert, 0.4), { size: 27, col: P.good, ink: P.good });
      out += G(d, { opacity: dieShow });
    }

    /* beat 3: the bag of nine red counters and one blue */
    var bagShow = asOnly(t, scene, 3);
    if (bagShow > 0.01) {
      var shown = cRed == null ? 0 : (cBlue != null && t >= cBlue ? 10 : tally(t, cRed, 9, 0.8));
      var b = asBag(t, shown, on(t, cUnlikely, 0.5));
      b += MK.pill(250, 152, "9 red", on(t, cRed, 0.4), { size: 27, col: P.bad, ink: P.bad });
      b += MK.pill(250, 232, "1 blue", on(t, cBlue, 0.4), { size: 27, col: P.blue, ink: P.blue });
      b += MK.pill(920, 152, "red: likely", on(t, cLikely, 0.4), { size: 27, col: P.gold, ink: P.gold });
      b += MK.pill(920, 232, "blue: unlikely", on(t, cUnlikely, 0.4), { size: 27, col: P.gold, ink: P.gold });
      out += G(b, { opacity: bagShow });
    }

    /* beat 4: heads or tails */
    var coinShow = asFrom(t, scene, 4);
    if (coinShow > 0.01) {
      var pc = popIn(t, cCoin, 0.45);
      var co = MK.pop(asCoin(494, 186, 66, "H", on(t, cHeads, 0.5)), 494, 186, pc) +
        MK.pop(asCoin(674, 186, 66, "T", 0), 674, 186, popIn(t, cCoin == null ? null : cCoin + 0.2, 0.45));
      co += MK.pill(584, 306, "it might, and it might not", on(t, cMaybe, 0.4), { size: 28, col: P.gold, ink: P.gold });
      out += G(co, { opacity: coinShow });
    }

    /* the marker, sliding along the line to the word the voice just said */
    if (mark) {
      out += C(mark.x, AS_LINE_Y, 19, P.gold, P.ground, 4);
      out += C(mark.x, AS_LINE_Y, 8, P.ground);
    }
    return svg(out);
  }

  /* ==== chapter: Spin it, and spin it again ===================================
     The lesson's spinner of four equal parts, then its own two experiments:
     10 spins (5, 2, 2, 1 - lumpy, when a quarter of ten is two and a half) and
     1000 spins (261, 244, 252, 243 - every one close to 250). Both sets add up
     to their number of spins. */
  var AS_SPIN10 = [5, 2, 2, 1];
  var AS_SPIN1000 = [261, 244, 252, 243];
  function asSpinBars(counts) {
    return counts.map(function (v, k) { return { label: String(k + 1), value: v }; });
  }

  function asSpinChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cFour = c(0, "fourequal"), cQuarter = c(0, "aquarter");
    var cTen = c(1, "tenspins"), cFive = c(1, "cameupfive"), cExpect = c(1, "expected");
    var cThousand = c(2, "athousand"), cClose = c(2, "closeto");
    var cFew = c(3, "fewspins"), cMany = c(3, "manyspins");

    /* the needle turns while the spinner is being named, then rests */
    var spun = cFour == null ? 0 : clamp((t - cFour) / 1.6, 0, 1);
    var out = ART.place(ART.spinner({
      parts: ["1", "2", "3", "4"], pointer: Math.floor(spun * 7) % 4, title: "four equal parts"
    }), 60, 62, 250, 296);
    out += C(184.8, 190.9, 118, "none", P.gold, 4, { opacity: on(t, cFour, 0.5) * asUntil(t, scene, 1) });

    /* beat 0: a quarter of the whole spinner */
    var first = asOnly(t, scene, 0);
    if (first > 0.01) {
      out += G(ART.place(ART.fraction({ shape: "circle", parts: 4, shaded: 1, colour: "teal", label: "one part in four" }), 420, 44, 270, 333) +
        MK.pill(900, 200, "a quarter of the time", on(t, cQuarter, 0.4), { size: 26, col: P.gold, ink: P.gold }),
        { opacity: first });
    }

    /* beat 1: ten spins, lumpy */
    var ten = asOnly(t, scene, 1);
    if (ten > 0.01) {
      var a = ART.place(ART.barChart({
        title: "10 spins", bars: asSpinBars(AS_SPIN10), max: 6, step: 2,
        highlight: cFive != null && t >= cFive ? 0 : null
      }), 420, 44, 600, 364);
      /* two and a half: a quarter of ten, drawn across the same scale */
      var S = 600 / 540, y25 = 44 + (266 - (2.5 / 6) * 210) * S;
      a += L(420 + 74 * S, y25, 420 + 518 * S, y25, P.gold, 3, { "stroke-dasharray": "12 8", opacity: on(t, cExpect, 0.5) });
      a += MK.pill(1092, y25, "2½", on(t, cExpect, 0.4), { size: 26, col: P.gold, ink: P.gold });
      a += MK.pill(185, 396, "lumpy", on(t, cTen, 0.4), { size: 26, col: P.teal });
      out += G(a, { opacity: ten });
    }

    /* beats 2 and 3: a thousand spins, nearly level */
    var many = asFrom(t, scene, 2);
    if (many > 0.01) {
      var m = ART.place(ART.barChart({
        title: "1000 spins", bars: asSpinBars(AS_SPIN1000), max: 300, step: 50
      }), 420, 44, 600, 364);
      var S2 = 600 / 540, y250 = 44 + (266 - (250 / 300) * 210) * S2;
      m += L(420 + 74 * S2, y250, 420 + 518 * S2, y250, P.gold, 4, { "stroke-dasharray": "12 8", opacity: on(t, cClose, 0.5) });
      m += MK.pill(1082, y250, "250", on(t, cClose, 0.4), { size: 26, col: P.gold, ink: P.gold });
      m += MK.pill(185, 26, "few spins: lumpy", on(t, cFew, 0.4), { size: 24, col: P.muted });
      m += MK.pill(720, 26, "many spins: level", on(t, cMany, 0.4), { size: 24, col: P.gold, ink: P.gold });
      m += MK.pill(185, 396, "a thousand", on(t, cThousand, 0.4), { size: 26, col: P.teal });
      out += G(m, { opacity: many });
    }
    return svg(out);
  }

  /* ==== what you now know ======================================================= */
  function asRecapRings(cx, cy, size) {
    var r = size * 0.36;
    return C(cx - r * 0.62, cy, r, P.plum, P.plum, 3, { "fill-opacity": 0.22 }) +
      C(cx + r * 0.62, cy, r, P.gold, P.gold, 3, { "fill-opacity": 0.22 });
  }
  function asRecapPair(cx, cy, size) {
    var out = "", k, hs = [0.9, 0.6, 0.4], hb = [0.5, 1.0, 0.4], w = size * 0.14, g = size * 0.07;
    for (k = 0; k < 3; k++) {
      out += R(cx - size * 0.46 + k * (w + g), cy + size * 0.3 - hs[k] * size * 0.58, w, hs[k] * size * 0.58, 3, P.accent);
      out += R(cx + size * 0.09 + k * (w + g), cy + size * 0.3 - hb[k] * size * 0.58, w, hb[k] * size * 0.58, 3, P.teal);
    }
    return out + L(cx - size * 0.5, cy + size * 0.3, cx + size * 0.5, cy + size * 0.3, P.muted, 3);
  }

  var AS_RECAP = MK.recapKind([
    { beat: 0, at: "planit", title: "Plan it", sub: "names or numbers", pic: "❓" },
    { beat: 0, at: "tallyit", title: "Tally it", sub: "gates of five",
      pic: function (cx, cy, size) { return asGate(cx, cy, size * 0.86, 5, P.teal, 1); } },
    { beat: 1, at: "drawthree", title: "Draw it", sub: "bar, pictogram, dots", pic: "\u{1F4CA}" },
    { beat: 1, at: "sortby", title: "Sort it", sub: "Venn and Carroll", pic: asRecapRings },
    { beat: 1, at: "comparetwo", title: "Compare", sub: "same and different", pic: asRecapPair },
    { beat: 2, at: "chanceword", title: "Chance", sub: "impossible to certain", pic: "\u{1F3B2}" }
  ], { goBeat: 2, goAt: "welldone" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Deciding what to collect", "Tallies, charts and sorting diagrams", "From impossible to certain"] }),
    plan: asPlanChapter,
    pictures: asPicturesChapter,
    sorting: asSortingChapter,
    compare: asCompareChapter,
    chance: asChanceChapter,
    spin: asSpinChapter,
    recap: AS_RECAP
  };
