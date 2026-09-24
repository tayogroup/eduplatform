  /* ==== Asking, Sorting and Chance, part 2 =====================================
     The chapters "One set, three pictures" and "Sorting two ways at once".
     The bar chart and the pictogram are ART's; the dot plot is drawn here,
     because the picture library has no dot plot (see the report). */

  /* ---- the light card the dot plot is drawn on, in ART's own light tokens --- */
  var AS_LIGHT = { card: "#FFFFFF", line: "#D6E3DE", ink: "#1B2A2F", muted: "#6B7F82", teal: "#1E8C86" };

  /* ==== chapter: One set, three pictures ======================================
     Beat 0 names the three ways as three cards. Beats 1, 2 and 3 draw one of
     them large: the bar chart with its tallest bar picked out, the pictogram
     with its key ringed, and the dot plot filling one dot per child. */
  var AS_WAYS = [
    { name: "Bar chart", sub: "compare at a glance" },
    { name: "Pictogram", sub: "a key, so one stands for two" },
    { name: "Dot plot", sub: "one dot per child" }
  ];
  /* the little picture on each of the three cards */
  function asWayGlyph(which, cx, cy) {
    var out = "", k;
    if (which === 0) {
      for (k = 0; k < 4; k++) out += R(cx - 66 + k * 36, cy + 42 - AS_A[k] * 8, 24, AS_A[k] * 8, 4, P.blue);
      return out + L(cx - 74, cy + 42, cx + 62, cy + 42, P.muted, 3);
    }
    if (which === 1) {
      for (k = 0; k < 4; k++) out += C(cx - 54 + k * 36, cy + 12, 15, P.teal);
      return out + Pth("M" + n2(cx + 54) + "," + n2(cy - 3) + " A15,15 0 0,0 " + n2(cx + 54) + "," + n2(cy + 27) + " Z", P.teal) +
        C(cx + 54, cy + 12, 15, "none", P.teal, 2.5);
    }
    for (k = 0; k < 12; k++)
      out += C(cx - 66 + (k % 6) * 26, cy - 4 + Math.floor(k / 6) * 30, 9, P.gold);
    return out;
  }

  /* the dot plot: one dot for each child, drawn in ART's light palette so it
     sits beside the bar chart and the pictogram as one family of pictures */
  function asDotPlot(t, shown, counts) {
    var out = R(120, 40, 928, 360, 22, AS_LIGHT.card, AS_LIGHT.line, 2);
    out += Tx(584, 80, "How we travel", "lab big", "middle", { fill: AS_LIGHT.ink });
    var done = 0, k, j, y;
    for (k = 0; k < 4; k++) {
      y = 140 + k * 72;
      out += Tx(300, y + 9, AS_CATS[k], "lab big", "end", { fill: AS_LIGHT.muted });
      for (j = 0; j < counts[k]; j++) {
        if (done + j >= shown) break;
        out += C(350 + j * 52, y, 16, AS_LIGHT.teal);
      }
      if (done + counts[k] <= shown)
        out += Tx(880, y + 10, String(counts[k]), "lab big", "start", { fill: AS_LIGHT.ink });
      done += counts[k];
    }
    return out;
  }

  function asPicturesChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSame = c(0, "sameanswers"), cThree = c(0, "threeways"), cDiff = c(0, "different");
    var cBar = c(1, "abar"), cScale = c(1, "scale"), cTall = c(1, "tallest");
    var cKey = c(2, "akey"), cTwoEach = c(2, "twoeach"), cHalf = c(2, "andahalf");
    var cDot = c(3, "onedot"), cOneByOne = c(3, "onebyone");
    var out = "";

    /* ---- beat 0: the three ways, named ---- */
    var intro = asOnly(t, scene, 0);
    if (intro > 0.01) {
      var e = MK.pill(584, 38, "the same 22 answers", on(t, cSame, 0.4), { size: 28, col: P.teal });
      AS_WAYS.forEach(function (w, k) {
        var x = 44 + k * 368, p = popIn(t, cThree == null ? null : cThree + 0.2 * k, 0.4);
        if (p <= 0) return;
        e += MK.pop(asCard(x, 92, 340, 290, 0, 1) + asWayGlyph(k, x + 170, 190) +
          Tx(x + 170, 300, w.name, "lab big", "middle") +
          Tx(x + 170, 344, w.sub, "lab mid muted readable", "middle", { opacity: on(t, cDiff, 0.5) }),
          x + 170, 237, Math.min(1, p));
      });
      out += G(e, { opacity: intro });
    }

    /* ---- beat 1: the bar chart ---- */
    var one = asOnly(t, scene, 1);
    if (one > 0.01) {
      var b = ART.place(ART.barChart({ title: "How we travel", bars: asBars(AS_A), max: 10, step: 2, highlight: cTall != null && t >= cTall ? 0 : null }), 120, 66, 540, 328);
      /* the top of the Walk bar, in the film's own coordinates */
      var tallX = 120 + 129.5, tallY = 66 + 77;
      b += MK.leader(tallX, 54, tallX, tallY - 6, on(t, cTall, 0.6), P.gold);
      b += MK.pill(tallX, 29, "tallest, 9", on(t, cTall, 0.4), { size: 26, col: P.gold, ink: P.gold });
      b += MK.pill(880, 140, "one bar for each group", on(t, cBar, 0.4), { size: 28, col: P.line });
      b += MK.pill(880, 226, "a scale, 0 to 10", on(t, cScale, 0.4), { size: 28, col: P.line });
      /* the scale itself: the column of numbers up the left of the chart */
      b += R(146, 108, 54, 242, 10, "none", P.gold, 3, { opacity: on(t, cScale, 0.5) });
      out += G(b, { opacity: one });
    }

    /* ---- beat 2: the pictogram ---- */
    var two = asOnly(t, scene, 2);
    if (two > 0.01) {
      var p2 = ART.place(ART.pictogram({
        title: "How we travel", shape: "circle", each: 2, key: ["child", "children"],
        rows: AS_CATS.map(function (name, k) { return { label: name, count: AS_A[k] }; })
      }), 120, 40, 420, 361);
      /* the key line at the foot of the card, ringed as it is named */
      p2 += R(140, 334, 380, 54, 16, "none", P.gold, 3, { opacity: on(t, cKey, 0.5) });
      p2 += MK.pill(700, 360, "the key", on(t, cKey, 0.4), { size: 28, anchor: "start", col: P.gold, ink: P.gold });
      p2 += MK.leader(692, 360, 528, 360, on(t, cKey, 0.6), P.gold);
      p2 += MK.pill(700, 130, "one circle = 2 children", on(t, cTwoEach, 0.4), { size: 28, anchor: "start", col: P.line });
      p2 += MK.pill(700, 226, "so 9 is 4 and a half", on(t, cHalf, 0.4), { size: 28, anchor: "start", col: P.gold, ink: P.gold });
      p2 += MK.leader(692, 226, 528, 136, on(t, cHalf, 0.6), P.gold);
      out += G(p2, { opacity: two });
    }

    /* ---- beat 3: the dot plot ---- */
    var three = asOnly(t, scene, 3);
    if (three > 0.01) {
      var shown = cDot == null ? 0 : tally(t, cDot, 22, 2.2);
      if (cOneByOne != null && t >= cOneByOne) shown = 22;
      out += G(asDotPlot(t, shown, AS_A), { opacity: three });
    }
    return svg(out);
  }

  /* ==== chapter: Sorting two ways at once =====================================
     One Venn diagram, filling as each of the lesson's four numbers is named -
     12 in the overlap, 8 in "even" alone, 15 in "more than 10" alone, 7
     outside both - and then the same four in a Carroll diagram, which gives
     the one that is neither a box of its own. */
  function asSortItems(t, cTwelve, cEight, cFifteen, cSeven, flip) {
    var out = [];
    function put(label, even, big) {
      out.push({ label: label, a: flip ? big : even, b: flip ? even : big });
    }
    if (cTwelve != null && t >= cTwelve) put("12", true, true);
    if (cEight != null && t >= cEight) put("8", true, false);
    if (cFifteen != null && t >= cFifteen) put("15", false, true);
    if (cSeven != null && t >= cSeven) put("7", false, false);
    return out;
  }

  function asSortingChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cVenn = c(0, "venn"), cTwoQ = c(0, "twoquestions"), cEven = c(0, "iseven"), cMore = c(0, "morethan");
    var cTwelve = c(1, "twelve"), cBoth = c(1, "bothyes"), cOverlap = c(1, "overlap");
    var cEight = c(2, "eight"), cFifteen = c(2, "fifteen");
    var cSeven = c(3, "seven"), cOutside = c(3, "outside"), cCarroll = c(3, "carroll"), cOwnBox = c(3, "ownbox");

    var slide = on(t, cCarroll, 0.8);
    var vx = lerp(314, 26, slide), vy = 62, vw = 540, vh = 315;
    var S = vw / 500;                       /* the Venn card's own 500 x 292 */
    var ax = vx + 192 * S, bx = vx + 308 * S, cy = vy + 140 * S, r = 100 * S;
    var out = "";

    out += ART.place(ART.sortDiagram({
      labels: ["even", "more than 10"],
      items: asSortItems(t, cTwelve, cEight, cFifteen, cSeven, false)
    }), vx, vy, vw, vh);

    /* the two questions, each ringed as it is asked */
    out += C(ax, cy, r + 12, "none", P.gold, 4, { opacity: on(t, cEven, 0.5) * (1 - on(t, cMore, 0.5)) });
    out += C(bx, cy, r + 12, "none", P.gold, 4, { opacity: on(t, cMore, 0.5) * (1 - on(t, cTwelve, 0.5)) });
    out += MK.pill(vx + 270 * S, vy - 22, "two questions at once", on(t, cVenn, 0.4) * (1 - slide),
      { size: 26, col: P.teal });
    out += MK.ripple(vx + 270 * S, vy + 12, t, cTwoQ, P.teal);

    /* 12 sits in the overlap; 7 sits outside both hoops */
    out += C((ax + bx) / 2, cy, 46, "none", P.gold, 4, { opacity: on(t, cOverlap, 0.5) * (1 - on(t, cEight, 0.5)) });
    out += MK.tick((ax + bx) / 2, cy - 78, 18, popIn(t, cBoth, 0.4) * (1 - on(t, cEight, 0.5)));
    out += C(vx + 78 * S, vy + 240 * S, 42, "none", P.gold, 4, { opacity: on(t, cOutside, 0.5) * (1 - slide * 0.55) });

    /* the Carroll diagram slides in beside it, and 7 gets a box of its own */
    if (slide > 0.01) {
      var kx = 600, ky = 70, kw = 540, kh = 299, K = kw / 520;
      var k2 = ART.place(ART.sortDiagram({
        shape: "carroll", labels: ["more than 10", "even"],
        items: asSortItems(t, cTwelve, cEight, cFifteen, cSeven, true)
      }), kx, ky, kw, kh);
      k2 += C(kx + 411 * K, ky + 204 * K, 40, "none", P.gold, 4, { opacity: on(t, cOwnBox, 0.5) });
      k2 += MK.pill(kx + 270 * K, ky + kh + 22, "every number gets one box", on(t, cOwnBox, 0.4),
        { size: 26, col: P.gold, ink: P.gold });
      out += G(k2, { opacity: slide });
    }
    return svg(out);
  }
