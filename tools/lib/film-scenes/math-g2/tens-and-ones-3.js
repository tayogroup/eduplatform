  /* ==== Tens and Ones, part 3 =================================================
     The chapters "Arrays" (ART.array, turned round) and "Sharing and grouping"
     (drawn here: the picture library has no pool-into-equal-groups drawing),
     then "What you now know" and the KINDS table the engine's tail reads. */

  /* ==== chapter: arrays =============================================================
     The lesson's own array step: 2 rows of 5, turned round into 5 rows of 2,
     with the repeated addition written beside it. The card is anchored by its
     TOP LEFT corner, because the library adds its caption at the bottom and
     the dots must not move when the caption arrives. */
  function taoArrCard(rows, cols, lab, mr, mc, x0, y0, k) {
    var w = 108 + 36 * cols, h = 102 + 36 * rows + (lab ? 32 : 0);
    var o = { colour: "teal", markColour: "accent", label: lab ? true : false };
    if (mr != null) o.markRow = mr;
    if (mc != null) o.markCol = mc;
    return ART.place(ART.array(rows, cols, o), x0, y0, w * k, h * k);
  }
  var TAO_A25 = { x: 100, y: 14, k: 2 };        /* 2 rows of 5: 576 wide */
  var TAO_A52 = { x: 250, y: 8, k: 1.35 };      /* 5 rows of 2: 243 wide */
  function taoDot(box, r, c) { return [box.x + box.k * (94 + 36 * c), box.y + box.k * (88 + 36 * r)]; }

  function taoArraysChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRC = c(0, "rc"), cSame = c(0, "same");
    var cRows = c(1, "rows"), cHolds = c(1, "holds");
    var cAdd = c(2, "add"), cIs = c(2, "is");
    var cTurn = c(3, "turn"), cNow = c(3, "now");
    var cLots = c(4, "lots"), cStill = c(4, "still");
    var k = i - scene.first, out = "", n;

    /* the turn: the 2 by 5 card squeezes flat and the 5 by 2 card opens out */
    var turn = on(t, cTurn, 0.8);
    var goes = clamp(turn * 2, 0, 1), comes = clamp((turn - 0.5) * 2, 0, 1);
    if (goes < 1) {
      var mr = k === 0 && cRC != null && t >= cRC ? 0 : null;
      var mc = k === 0 && cRC != null && t >= cRC + 0.8 ? 0 : null;
      var cx25 = TAO_A25.x + TAO_A25.k * 144;
      out += G(taoArrCard(2, 5, k === 2, mr, mc, TAO_A25.x, TAO_A25.y, TAO_A25.k),
        { opacity: 1 - goes, transform: "translate(" + n2(cx25) + ",0) scale(" + n3(1 - goes) + ",1) translate(" + n2(-cx25) + ",0)" });
    }
    if (comes > 0) {
      var cx52 = TAO_A52.x + TAO_A52.k * 90;
      out += G(taoArrCard(5, 2, k >= 3, null, null, TAO_A52.x, TAO_A52.y, TAO_A52.k),
        { opacity: comes, transform: "translate(" + n2(cx52) + ",0) scale(" + n3(comes) + ",1) translate(" + n2(-cx52) + ",0)" });
    }

    /* "rows and columns of things. Every row is the same size." */
    var b0 = taoOnly(t, scene, 0);
    if (b0 > 0 && goes <= 0) {
      var sm = on(t, cSame, 0.5) * b0;
      for (n = 0; n < 2; n++) {
        var d0 = taoDot(TAO_A25, n, 0), d4 = taoDot(TAO_A25, n, 4);
        out += R(d0[0] - 32, d0[1] - 32, d4[0] - d0[0] + 64, 64, 18, "none", P.gold, 4, { opacity: sm });
      }
    }
    /* "Here are 2 rows of counters. Each row holds 5 of them." */
    var b1 = taoOnly(t, scene, 1);
    if (b1 > 0 && goes <= 0) {
      for (n = 0; n < 2; n++) {
        var e0 = taoDot(TAO_A25, n, 0), e4 = taoDot(TAO_A25, n, 4);
        out += R(e0[0] - 32, e0[1] - 32, e4[0] - e0[0] + 64, 64, 18, "none", P.gold, 4,
          { opacity: on(t, cRows == null ? null : cRows + n * 0.4, 0.4) * b1 });
        var ho = on(t, cHolds == null ? null : cHolds + n * 0.35, 0.4) * b1;
        out += MK.leader(742, e4[1], e4[0] + 30, e4[1], ho, P.gold);
        out += MK.pill(772, e4[1], "5", ho, { size: 34, anchor: "start", col: P.gold });
      }
    }
    /* "Five and five make ten. So 2 rows of 5 is 10 counters." */
    var b2 = taoOnly(t, scene, 2);
    if (b2 > 0) {
      out += Tx(910, 198, "5 + 5", "lab", "middle", { "font-size": 82, fill: P.ink, opacity: on(t, cAdd, 0.4) * b2 });
      out += Tx(910, 306, "= 10", "lab", "middle", { "font-size": 82, fill: P.gold, opacity: popIn(t, cIs, 0.45) * b2 });
    }
    /* "Turn the whole array round. Now it is 5 rows of 2." */
    var b3 = taoOnly(t, scene, 3);
    if (b3 > 0 && comes > 0.9) {
      for (n = 0; n < 5; n++) {
        var f0 = taoDot(TAO_A52, n, 0), f1 = taoDot(TAO_A52, n, 1);
        out += R(f0[0] - 26, f0[1] - 22, f1[0] - f0[0] + 52, 44, 12, "none", P.gold, 4,
          { opacity: bump(t, cNow == null ? null : cNow + n * 0.24, 0.55) * b3 });
      }
    }
    /* "That is 5 lots of 2. It is still 10 counters altogether." */
    var b4 = taoOnly(t, scene, 4);
    if (b4 > 0) {
      out += Tx(830, 198, "2 + 2 + 2 + 2 + 2", "lab", "middle", { "font-size": 52, fill: P.ink, opacity: on(t, cLots, 0.4) * b4 });
      out += Tx(830, 306, "= 10", "lab", "middle", { "font-size": 82, fill: P.gold, opacity: popIn(t, cStill, 0.45) * b4 });
    }
    return svg(out);
  }

  /* ==== chapter: sharing and grouping ===============================================
     Drawn here, because the picture library has no pool-shared-into-groups
     drawing. The lesson's own step: 12 sweets, 3 friends with the lesson's
     names, one each round and round; then the same 12 put into bags of 4.
     Every frame holds exactly twelve sweets, wherever they are. */
  var TAO_GX = [250, 584, 918];
  var TAO_FRIENDS = ["Amina", "Musa", "Hodan"];
  function taoPoolAt(i) { return [449 + (i % 6) * 54, 84 + Math.floor(i / 6) * 54]; }
  function taoPlateAt(i) {
    var p = i % 3, s = Math.floor(i / 3);
    return [TAO_GX[p] - 30 + (s % 2) * 60, 304 + Math.floor(s / 2) * 40];
  }
  function taoBagAt(i) {
    var b = Math.floor(i / 4), s = i % 4;
    return [TAO_GX[b] - 40 + (s % 2) * 80, 300 + Math.floor(s / 2) * 56];
  }
  function taoSweet(x, y, o) {
    if (!(o > 0)) return "";
    return G(C(x, y, 17, TAOC.accent) + C(x - 5, y - 6, 5.5, "#FFFFFF", null, null, { opacity: 0.7 }),
      { opacity: clamp(o, 0, 1) });
  }
  function taoPlate(p, o) {
    if (!(o > 0)) return "";
    return G(E(TAO_GX[p], 322, 118, 46, TAOC.card, TAOC.line, 3) +
      Tx(TAO_GX[p], 412, TAO_FRIENDS[p], "lab big", "middle", { fill: P.muted }), { opacity: clamp(o, 0, 1) });
  }
  function taoBag(b, o) {
    if (!(o > 0)) return "";
    return G(R(TAO_GX[b] - 92, 262, 184, 140, 22, TAOC.cell, TAOC.teal, 4), { opacity: clamp(o, 0, 1) });
  }

  function taoShareChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cShare = c(0, "share"), cGroups = c(0, "groups");
    var cTwelve = c(1, "twelve"), cThree = c(1, "three"), cEach = c(1, "each");
    var cFour = c(2, "four"), cDiv = c(2, "div");
    var cSame = c(3, "same"), cBags = c(3, "bags");
    var cB = [c(4, "b1"), c(4, "b2"), c(4, "b3")], cNone = c(4, "none");
    var cMakes = c(5, "makes");
    var k = i - scene.first, out = "", n, u, p;

    var plates = k <= 2 ? Math.max(on(t, cShare, 0.5), on(t, cThree, 0.45)) : 1 - on(t, cSame, 0.4);
    var bags = k <= 2 ? 0 : k === 3 ? on(t, cSame == null ? null : cSame + 0.55, 0.5) : 1;
    for (p = 0; p < 3; p++) {
      out += taoPlate(p, plates);
      out += taoBag(p, bags);
    }
    /* "equal groups": the three plates are the same as each other */
    if (k === 0) {
      var eq = on(t, cGroups, 0.5);
      out += Tx(417, 334, "=", "lab", "middle", { "font-size": 52, fill: P.gold, opacity: eq });
      out += Tx(751, 334, "=", "lab", "middle", { "font-size": 52, fill: P.gold, opacity: on(t, cGroups == null ? null : cGroups + 0.3, 0.5) });
    }

    /* the twelve sweets: in the pool, on the plates, or in the bags */
    var dealFrom = cEach, dealSpan = cFour != null && cEach != null ? Math.max(1.2, cFour - cEach) : 2.6;
    for (n = 0; n < 12; n++) {
      var pool = taoPoolAt(n), at = pool;
      if (k === 1 || k === 2) {
        if (dealFrom != null) {
          u = ease(clamp((t - (dealFrom + n * dealSpan / 12)) / 0.38, 0, 1));
          var pl = taoPlateAt(n);
          at = [lerp(pool[0], pl[0], u), lerp(pool[1], pl[1], u)];
        }
      } else if (k === 3) {
        u = ease(clamp((t - (cSame == null ? t + 99 : cSame + (n % 4) * 0.06)) / 0.5, 0, 1));
        var pl3 = taoPlateAt(n);
        at = [lerp(pl3[0], pool[0], u), lerp(pl3[1], pool[1], u)];
      } else if (k === 4 || k === 5) {
        var b = Math.floor(n / 4), bt = cB[b];
        u = ease(clamp((t - (bt == null ? t + 99 : bt + (n % 4) * 0.11)) / 0.4, 0, 1));
        var bg = taoBagAt(n);
        at = [lerp(pool[0], bg[0], u), lerp(pool[1], bg[1], u)];
      }
      out += taoSweet(at[0], at[1], 1);
    }

    /* "Share 12 sweets between 3 friends" */
    if (k === 1) {
      out += R(417, 50, 336, 124, 22, "none", P.gold, 4, { opacity: bump(t, cTwelve, 1.1) });
      out += MK.pill(980, 96, "12 sweets", on(t, cTwelve, 0.4), { size: 28, col: P.gold });
    }
    /* "Everybody ends up with 4 sweets. So 12 shared by 3 is 4." */
    if (k === 2) {
      for (p = 0; p < 3; p++)
        out += MK.pill(TAO_GX[p], 244, "4", popIn(t, cFour == null ? null : cFour + p * 0.28, 0.4), { size: 36, col: P.gold });
      out += Tx(584, 116, "12 ÷ 3 = 4", "lab", "middle", { "font-size": 76, fill: P.gold, opacity: popIn(t, cDiv, 0.5) });
    }
    /* "bags of 4": four empty places show themselves in every bag */
    if (k === 3) {
      var bo = on(t, cBags, 0.5);
      if (bo > 0) for (n = 0; n < 12; n++) {
        var slot = taoBagAt(n);
        out += C(slot[0], slot[1], 19, "none", TAOC.teal, 3, { opacity: bo * 0.9, "stroke-dasharray": "6 6" });
      }
      out += MK.pill(980, 96, "bags of 4", bo, { size: 30, col: P.teal });
    }
    /* "One bag, two bags, three bags. Nothing is left over." */
    if (k === 4) {
      for (p = 0; p < 3; p++)
        out += MK.tick(TAO_GX[p] + 74, 244, 22, popIn(t, cB[p] == null ? null : cB[p] + 0.6, 0.4));
      var done = cB[2] != null && t >= cB[2] ? 3 : cB[1] != null && t >= cB[1] ? 2 : cB[0] != null && t >= cB[0] ? 1 : 0;
      if (done > 0) out += MK.pill(980, 96, done + (done === 1 ? " bag" : " bags"), 1, { size: 30, col: P.gold });
      out += MK.pill(260, 96, "none left", on(t, cNone, 0.4), { size: 30, col: P.muted });
    }
    /* "So 12 in groups of 4 makes 3 bags, with none left." */
    if (k === 5) out += Tx(584, 116, "12 ÷ 4 = 3", "lab", "middle", { "font-size": 76, fill: P.teal, opacity: popIn(t, cMakes, 0.5) });
    return svg(out);
  }

  /* ==== what you now know ===========================================================
     Four cards, one per idea. Each card's drawing reads the SECOND cue of its
     own line, so the picture finishes as the sentence does: the four ones
     arrive on "3 tens and 4 ones", the marker slides to 30 on "rounds down to
     30", the array is ringed on "2 rows of 5 is 10". */
  function taoRecapCue(k, name) {
    var s = F.scenes[F.scenes.length - 1];
    return s && s.first != null ? cue(s.first + k, name) : null;
  }
  function taoRecapTens(cx, cy, size, t) {
    var rw = size * 0.1, rh = size * 0.58, cs = size * 0.17, out = "", k;
    for (k = 0; k < 3; k++) out += taoRod(cx - size * 0.44 + k * (rw + 6), cy - rh / 2, rw, rh, 1);
    var got = tally(t, taoRecapCue(0, "ex"), 4, 0.7);
    for (k = 0; k < got; k++)
      out += taoCube(cx + size * 0.06 + (k % 2) * (cs + 6), cy - cs - 3 + Math.floor(k / 2) * (cs + 6), cs, 1);
    return out;
  }
  function taoRecapRound(cx, cy, size, t) {
    var sp = size * 0.09, x = function (v) { return cx + (v - 35) * sp; };
    var out = L(x(29.4), cy, x(40.6), cy, P.ink, 4), k;
    for (k = 30; k <= 40; k++) out += L(x(k), cy - (k % 10 === 0 ? 11 : 6), x(k), cy + (k % 10 === 0 ? 11 : 6), P.ink, k % 10 === 0 ? 3 : 2);
    out += Tx(x(30), cy + 32, "30", "lab mid muted", "middle") + Tx(x(40), cy + 32, "40", "lab mid muted", "middle");
    var u = on(t, taoRecapCue(1, "ex"), 0.7);
    out += C(x(lerp(34, 30, u)), cy, 10, P.accent, P.ground, 3);
    return out;
  }
  function taoRecapArray(cx, cy, size, t) {
    var g = size * 0.19, x0 = cx - 2 * g, y0 = cy - g / 2, out = "", r, c2;
    for (r = 0; r < 2; r++) for (c2 = 0; c2 < 5; c2++) out += C(x0 + c2 * g, y0 + r * g, size * 0.062, P.teal);
    out += R(x0 - g * 0.6, y0 - g * 0.6, 4 * g + g * 1.2, g + g * 1.2, 12, "none", P.gold, 3.5,
      { opacity: on(t, taoRecapCue(2, "is"), 0.5) });
    return out;
  }
  function taoRecapShare(cx, cy, size) {
    var out = "", p, s, gx;
    for (p = 0; p < 3; p++) {
      gx = cx + (p - 1) * size * 0.33;
      out += R(gx - size * 0.14, cy - size * 0.2, size * 0.28, size * 0.4, 8, "none", P.teal, 3);
      for (s = 0; s < 4; s++)
        out += C(gx - size * 0.07 + (s % 2) * size * 0.14, cy - size * 0.09 + Math.floor(s / 2) * size * 0.18, size * 0.05, P.accent);
    }
    return out;
  }
  var TAO_RECAP = MK.recapKind([
    { beat: 0, at: "tens", title: "Tens and ones", sub: "34 is 3 tens and 4 ones", pic: taoRecapTens },
    { beat: 1, at: "round", title: "Rounding", sub: "34 rounds down to 30", pic: taoRecapRound },
    { beat: 2, at: "array", title: "Arrays", sub: "2 rows of 5 is 10", pic: taoRecapArray },
    { beat: 3, at: "share", title: "Sharing and grouping", sub: "12 shared by 3 is 4", pic: taoRecapShare }
  ], { goBeat: 3, goAt: "go" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What each digit in a 2-digit number is worth", "Rounding to the nearest 10", "Arrays, sharing and grouping"] }),
    tens: taoTensChapter, build: taoBuildChapter, round: taoRoundChapter,
    arrays: taoArraysChapter, share: taoShareChapter, recap: TAO_RECAP
  };
