  /* ==== Ask, Count and Chart, part 3 ==========================================
     Sorting (the lesson's own even / more-than-twenty test, as a Venn and then
     as a Carroll), chance (the likelihood line, and the lesson's own spinner),
     the recap, and the checks that hold every picture to what the voice says. */

  /* ---- hoops and boxes ---------------------------------------------------------
     ART.sortDiagram draws both. The Venn starts in the middle of the stage and
     slides left when the Carroll arrives, so the two can be compared; the film
     coordinates of every zone are worked out from wherever it is standing. */
  var AC_VENN = { mid: 230, left: 40, y: 68, w: 520, h: 304 };
  var AC_VS = AC_VENN.w / 500;
  var AC_CARR = { x: 580, y: 75, w: 560, h: 310 };
  var AC_CS = AC_CARR.h / 288;
  function acCX(v) { return AC_CARR.x + (AC_CARR.w - 520 * AC_CS) / 2 + v * AC_CS; }
  function acCY(v) { return AC_CARR.y + v * AC_CS; }
  /* the library's Venn layout: top 8, r 100, cy 140, ax 192, bx 308, edge 22 */
  var AC_VZONE = [[78, 240], [144, 140], [356, 140], [250, 140]];   /* neither, a, b, both */
  /* the library's Carroll layout: gx 150, gy 18, cw 174, rh 88, hd 54 */
  var AC_CZONE = [[411, 204], [237, 204], [411, 116], [237, 116]];  /* neither, a, b, both */
  function acZoneOf(it) { return (it.a ? 1 : 0) + (it.b ? 2 : 0); }
  /* the same four numbers, with the two questions swapped for the Carroll */
  var AC_CARROLL_ITEMS = AC_ITEMS.map(function (it) {
    return { label: it.label, a: !!it.b, b: !!it.a };
  });
  /* a box round one of the hoop names, wide enough for the words in it */
  function acNameBox(cx, cy, text, col, o) {
    if (!(o > 0)) return "";
    var w = String(text).length * 11.4 + 26;
    return R(cx - w / 2, cy - 21, w, 42, 14, "none", col, 3, { opacity: clamp(o, 0, 1) });
  }

  function acSortChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSort = c(0, "sort"), cCounting = c(0, "counting");
    var cHoops = c(1, "hoops"), cEven = c(1, "even"), cMore = c(1, "more");
    var cEight = c(2, "eight"), cNot = c(2, "not"), cHoop = c(2, "hoop");
    var cThirty = c(3, "thirty"), cOdd = c(3, "odd"), cOther = c(3, "other");
    var cTwentyFour = c(4, "twentyfour"), cMiddle = c(4, "middle"), cOverlap = c(4, "overlap");
    var cSeven = c(5, "seven"), cCarroll = c(5, "carroll"), cBox = c(5, "box");
    var cMany = c(6, "many"), cChoose = c(6, "choose"), cWhy = c(6, "why");
    var out = "", k;

    /* when each number lands in the picture */
    var landed = [cEight, cThirty, cTwentyFour, cSeven];
    var items = [];
    for (k = 0; k < AC_ITEMS.length; k++) if (landed[k] != null && t >= landed[k]) items.push(AC_ITEMS[k]);

    /* the Venn, centred until the Carroll arrives */
    var slide = on(t, cCarroll, 0.7);
    var vx = lerp(AC_VENN.mid, AC_VENN.left, slide);
    var vX = function (v) { return vx + v * AC_VS; };
    var vY = function (v) { return AC_VENN.y + (AC_VENN.h - 292 * AC_VS) / 2 + v * AC_VS; };

    var vo = on(t, cSort, 0.5);
    out += G(R(vx - 8, AC_VENN.y - 8, AC_VENN.w + 16, AC_VENN.h + 16, 22, P.card, P.line, 2) +
      ART.place(ART.sortDiagram({ labels: [AC_SORT_A, AC_SORT_B], items: items }),
        vx, AC_VENN.y, AC_VENN.w, AC_VENN.h), { opacity: clamp(vo, 0, 1) });

    /* the four numbers, waiting in a row until each is sorted */
    for (k = 0; k < AC_ITEMS.length; k++) {
      var chip = popIn(t, cSort == null ? null : cSort + 0.25 + k * 0.18, 0.32) *
        (1 - on(t, landed[k], 0.35)) * (1 - slide);
      out += MK.pill(404 + k * 120, 40, AC_ITEMS[k].label, chip, { size: 30, col: P.gold });
    }

    /* "instead of counting them": the tally, put aside */
    var nc = on(t, cCounting, 0.45) * (1 - on(t, cHoops, 0.6));
    if (nc > 0) out += G(acGate(946, 104, 54, P.muted, 5) + MK.cross(1058, 130, 24, nc), { opacity: nc });

    /* "Two hoops": both rings light as they are counted */
    var two = on(t, cHoops, 0.45) * (1 - on(t, cEven, 0.6)) * (1 - slide);
    if (two > 0) {
      out += MK.glow(vX(192), vY(140), 118, P.teal, two * (0.6 + 0.4 * breathe(t)));
      out += MK.glow(vX(308), vY(140), 118, P.gold, two * (0.6 + 0.4 * breathe(t + 0.5)));
    }

    /* the two questions the hoops ask */
    var qa = on(t, cEven, 0.45) * (1 - slide);
    var qb = on(t, cMore, 0.45) * (1 - slide);
    out += MK.pill(950, 164, "Is it " + AC_SORT_A + "?", qa, { size: 27, col: P.teal });
    out += MK.pill(950, 244, "Is it " + AC_SORT_B + "?", qb, { size: 27, col: P.gold });
    /* each question boxed round the hoop name it belongs to */
    if (qa > 0) out += acNameBox(vX(148), vY(20), AC_SORT_A, P.teal, qa);
    if (qb > 0) out += acNameBox(vX(352), vY(20), AC_SORT_B, P.gold, qb);

    /* each number, ringed where it lands */
    var rings = [
      { at: cEight, hold: cHoop, k: 0 },
      { at: cThirty, hold: cOther, k: 1 },
      { at: cTwentyFour, hold: cOverlap, k: 2 },
      { at: cSeven, hold: cSeven, k: 3 }
    ];
    for (k = 0; k < rings.length; k++) {
      var z = AC_VZONE[acZoneOf(AC_ITEMS[rings[k].k])];
      var ro = popIn(t, rings[k].at, 0.4) * (k < 3 ? 1 - on(t, landed[k + 1], 0.6) : 1);
      if (ro > 0) out += C(vX(z[0]), vY(z[1]), 36, "none", P.gold, 3.5, { opacity: Math.min(1, ro) });
      out += MK.ripple(vX(z[0]), vY(z[1]), t, rings[k].at, P.gold);
    }
    /* where each number ends up: the hoop it lands in, lit as it is named */
    var hoopLit = [
      { at: cHoop, cx: 192, col: P.teal },        /* "the even hoop" */
      { at: cOther, cx: 308, col: P.gold },       /* "The other hoop" */
      { at: cOverlap, cx: 250, col: P.gold }      /* "they overlap" */
    ];
    for (k = 0; k < hoopLit.length; k++) {
      var ho = on(t, hoopLit[k].at, 0.5) * (1 - on(t, landed[Math.min(k + 1, 3)], 0.6)) * (1 - slide);
      if (ho > 0) out += MK.glow(vX(hoopLit[k].cx), vY(140), k === 2 ? 74 : 112, hoopLit[k].col,
        ho * (0.65 + 0.35 * breathe(t)));
    }
    /* the two halves of each yes-or-no, said out loud */
    out += MK.pill(950, 336, "not " + AC_SORT_B, on(t, cNot, 0.45) * (1 - on(t, cThirty, 0.6)) * (1 - slide),
      { size: 26, col: P.muted });
    out += MK.pill(950, 336, "not " + AC_SORT_A, on(t, cOdd, 0.45) * (1 - on(t, cTwentyFour, 0.6)) * (1 - slide),
      { size: 26, col: P.muted });
    out += MK.pill(950, 336, "both at once", on(t, cMiddle, 0.45) * (1 - on(t, cSeven, 0.6)) * (1 - slide),
      { size: 26, col: P.gold });

    /* the Carroll: the same four answers, each with a box of its own */
    if (slide > 0.01) {
      var co = "";
      co += R(AC_CARR.x - 8, AC_CARR.y - 8, AC_CARR.w + 16, AC_CARR.h + 16, 22, P.card, P.line, 2);
      /* The Carroll takes its two questions the other way round, which is how
         the LESSON draws it (round6: t.b across the top, t.a down the side) -
         and it is also the only way round that fits, because sortDiagram paints
         its data cells over the row labels and "not more than 20" is wider than
         a row label's box. */
      co += ART.place(ART.sortDiagram({ shape: "carroll", labels: [AC_SORT_B, AC_SORT_A], items: AC_CARROLL_ITEMS }),
        AC_CARR.x, AC_CARR.y, AC_CARR.w, AC_CARR.h);
      var bz = AC_CZONE[acZoneOf(AC_CARROLL_ITEMS[3])];
      co += C(acCX(bz[0]), acCY(bz[1]), 42, "none", P.gold, 4, { opacity: on(t, cBox, 0.45) });
      out += G(co, { opacity: clamp(slide, 0, 1) });
    }

    /* the Venn and Carroll have made their point; they fade for the closing
       "choose, and say why" beat rather than sit cluttered behind it */
    var wrapFade = 1 - on(t, cMany, 0.6);
    out = G(out, { opacity: clamp(wrapFade, 0, 1) });

    /* "many ways to show it": the forms taught so far, in a row */
    var manyO = on(t, cMany, 0.5);
    if (manyO > 0) {
      var forms = [
        { x: 300, label: "Tally", fn: function (cx, cy) { return acGate(cx - 30, cy - 26, 52, P.teal, 5); } },
        { x: 500, label: "Pictogram", fn: function (cx, cy) { return acGlyph(cx - 24, cy, 24, false, 1) + acGlyph(cx + 24, cy, 24, false, 1); } },
        { x: 720, label: "Bars", fn: function (cx, cy) { return acBars(cx - 36, cy - 30, 72, 60, [9, 6, 4, 3], P.blue, 1); } },
        { x: 920, label: "Hoops", fn: function (cx, cy) { return acHoops(cx, cy, 30, P.good, P.gold); } }
      ];
      for (k = 0; k < forms.length; k++) {
        var fo = popIn(t, cMany + k * 0.18, 0.35);
        if (fo <= 0) continue;
        out += G(forms[k].fn(forms[k].x, 210), { opacity: Math.min(1, fo) });
        out += MK.pill(forms[k].x, 292, forms[k].label, Math.min(1, fo), { size: 22, col: P.line });
      }
      out += MK.pill(610, 96, "many ways to show it", manyO, { size: 26, col: P.line });
    }

    /* "choose the one that fits": a question mark over the row, then a tick
       and "say why" as the beat's second sentence lands */
    var chooseO = on(t, cChoose, 0.45);
    if (chooseO > 0) out += MK.qmark(610, 150, 30, chooseO * (1 - on(t, cWhy, 0.6)));
    var whyO = on(t, cWhy, 0.45);
    if (whyO > 0) {
      out += MK.tick(610, 150, 30, whyO);
      out += MK.pill(610, 380, "choose it, and say why", whyO, { size: 25, col: P.gold });
    }

    return svg(out);
  }

  /* ---- will, might, will not ---------------------------------------------------
     3Sp.01 as the lesson's own line from "it will not happen" to "it will
     happen", with the lesson's own three examples on it; then 3Sp.02 as the
     lesson's own spinner - three parts red, two blue, one gold - spun thirty
     times, with the score kept as it goes. */
  var AC_LINE = { x0: 180, x1: 988, y: 330 };
  var AC_SPOT = [AC_LINE.x0, (AC_LINE.x0 + AC_LINE.x1) / 2, AC_LINE.x1];

  /* the lesson's spinner: SECT red 3, blue 2, gold 1, laid out clockwise from
     up, exactly as the lesson's landOn() reads it */
  var AC_SECT = [
    { name: "red", w: 3, col: P.accent },
    { name: "blue", w: 2, col: P.teal },
    { name: "gold", w: 1, col: P.gold }
  ];
  var AC_TOTW = AC_SECT.reduce(function (s, x) { return s + x.w; }, 0);
  /* thirty spins, fixed: a film may never call Math.random. The first three go
     gold, gold, red, which is the lesson's own point that a few spins prove
     nothing - the smallest colour can easily win them. */
  var AC_SPINS = "ggrbrrgrbrbrrgbrrbgrbrrbrbrrrb";
  var AC_LETTER = { r: 0, b: 1, g: 2 };

  /* the counts after the first n spins */
  function acScore(n) {
    var out = [0, 0, 0], k;
    for (k = 0; k < Math.min(n, AC_SPINS.length); k++) out[AC_LETTER[AC_SPINS.charAt(k)]]++;
    return out;
  }
  /* where the needle stopped on spin k (degrees clockwise from up) */
  function acLanded(k) {
    var idx = AC_LETTER[AC_SPINS.charAt(k)], base = 0, j;
    for (j = 0; j < idx; j++) base += 360 * AC_SECT[j].w / AC_TOTW;
    var span = 360 * AC_SECT[idx].w / AC_TOTW;
    return base + (0.14 + 0.72 * AC_JITTER[k % AC_JITTER.length]) * span;
  }

  function acSpinner(cx, cy, r, deg, litName, litO) {
    var out = "", a0 = -90, k, a1, mid, rad0, rad1;
    for (k = 0; k < AC_SECT.length; k++) {
      var sweep = 360 * AC_SECT[k].w / AC_TOTW;
      a1 = a0 + sweep;
      rad0 = a0 * Math.PI / 180; rad1 = a1 * Math.PI / 180;
      out += Pth("M" + n2(cx) + "," + n2(cy) + " L" + n2(cx + r * Math.cos(rad0)) + "," + n2(cy + r * Math.sin(rad0)) +
        " A" + n2(r) + "," + n2(r) + " 0 " + (sweep > 180 ? 1 : 0) + ",1 " +
        n2(cx + r * Math.cos(rad1)) + "," + n2(cy + r * Math.sin(rad1)) + " Z",
        AC_SECT[k].col, P.ground, 3);
      mid = (a0 + sweep / 2) * Math.PI / 180;
      out += Tx(cx + r * 0.64 * Math.cos(mid), cy + r * 0.64 * Math.sin(mid) + 9, AC_SECT[k].name,
        "lab big", "middle", { fill: "#0B1D2C" });
      if (litName === AC_SECT[k].name && litO > 0)
        out += Pth("M" + n2(cx) + "," + n2(cy) + " L" + n2(cx + r * Math.cos(rad0)) + "," + n2(cy + r * Math.sin(rad0)) +
          " A" + n2(r) + "," + n2(r) + " 0 " + (sweep > 180 ? 1 : 0) + ",1 " +
          n2(cx + r * Math.cos(rad1)) + "," + n2(cy + r * Math.sin(rad1)) + " Z",
          "none", P.ink, 6, { opacity: clamp(litO, 0, 1) });
      a0 = a1;
    }
    out += C(cx, cy, r, "none", P.ink, 4);
    var nr = (deg - 90) * Math.PI / 180;
    out += L(cx, cy, cx + r * 0.52 * Math.cos(nr), cy + r * 0.52 * Math.sin(nr), P.ink, 7);
    out += MK.arrow(cx, cy, cx + r * 0.66 * Math.cos(nr), cy + r * 0.66 * Math.sin(nr), 1, P.ink, 7);
    out += C(cx, cy, 11, P.ink);
    return out;
  }

  /* a coin, heads up, centred on (cx, cy) */
  function acCoin(cx, cy, r, o) {
    if (!(o > 0)) return "";
    return G(C(cx, cy, r, P.gold, P.goldDeep, 4) + C(cx, cy, r * 0.72, "none", P.goldDeep, 2.5) +
      Tx(cx, cy + r * 0.34, "H", "lab huge", "middle", { fill: "#5A4300" }), { opacity: clamp(o, 0, 1) });
  }

  function acChanceChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cCounted = c(0, "counted"), cMight = c(0, "might");
    var cSun = c(1, "sun"), cWill = c(1, "will");
    var cSeven = c(2, "seven"), cNo = c(2, "no");
    var cCoin = c(3, "coin"), cMightNot = c(3, "mightnot");
    var cSpin = c(4, "spin"), cThirty = c(4, "thirty"), cScore = c(4, "score");
    var cRed = c(5, "red"), cBlue = c(5, "blue"), cGold = c(5, "gold"), cRoom = c(5, "room");
    var out = "", k;

    var toSpinner = into(t, scene.first + 4);

    /* ---- the likelihood line ---- */
    if (toSpinner < 0.995) {
      var a = "";
      a += L(AC_LINE.x0, AC_LINE.y, AC_LINE.x1, AC_LINE.y, P.line, 7);
      for (k = 0; k < 3; k++) a += C(AC_SPOT[k], AC_LINE.y, 11, P.muted);
      a += Tx(AC_SPOT[0], AC_LINE.y + 52, "it will not happen", "lab", "middle", { fill: P.muted });
      a += Tx(AC_SPOT[1], AC_LINE.y + 52, "it might happen", "lab", "middle", { fill: P.muted });
      a += Tx(AC_SPOT[2], AC_LINE.y + 52, "it will happen", "lab", "middle", { fill: P.muted });

      /* not everything can be counted */
      var nc = on(t, cCounted, 0.45) * (1 - on(t, cMight, 0.6));
      if (nc > 0) a += G(acBars(476, 96, 168, 86, [9, 6, 4, 3], P.muted, 1), { opacity: nc * 0.75 }) +
        MK.cross(714, 139, 34, nc);
      /* the middle of the line: where most things sit */
      var mo = on(t, cMight, 0.5) * (1 - on(t, cSun, 0.6));
      if (mo > 0) a += MK.glow(AC_SPOT[1], AC_LINE.y, 104, P.gold, mo);

      /* the sun: it will happen */
      var so = popIn(t, cSun, 0.4);
      if (so > 0) a += MK.pop(Em(AC_SPOT[2], 196, 104, "☀️"), AC_SPOT[2], 196, so);
      if (so > 0) a += MK.leader(AC_SPOT[2], 252, AC_SPOT[2], AC_LINE.y - 14, on(t, cSun, 0.7), P.gold);
      a += MK.tick(AC_SPOT[2] + 74, 176, 24, popIn(t, cWill, 0.4));

      /* the dice: it will not happen, because there is no seven on it */
      var doo = popIn(t, cSeven, 0.4);
      if (doo > 0) a += MK.pop(Em(AC_SPOT[0], 196, 104, "\u{1F3B2}"), AC_SPOT[0], 196, doo);
      if (doo > 0) a += MK.leader(AC_SPOT[0], 252, AC_SPOT[0], AC_LINE.y - 14, on(t, cSeven, 0.7), P.gold);
      var noSeven = popIn(t, cNo, 0.4);
      if (noSeven > 0) {
        /* the face the dice has not got, marked the way the sun is ticked */
        var sx = AC_SPOT[0] + 110, sy = 148;
        a += MK.pop(C(sx, sy, 46, P.card, P.line, 3) +
          Tx(sx, sy + 18, "7", "lab huge", "middle", { fill: P.ink }), sx, sy, noSeven);
        a += MK.cross(sx + 44, sy - 36, 22, popIn(t, cNo == null ? null : cNo + 0.3, 0.35));
      }

      /* the coin: it might happen */
      var co = popIn(t, cCoin, 0.4);
      if (co > 0) a += MK.pop(acCoin(AC_SPOT[1], 196, 50, 1), AC_SPOT[1], 196, co);
      if (co > 0) a += MK.leader(AC_SPOT[1], 252, AC_SPOT[1], AC_LINE.y - 14, on(t, cCoin, 0.7), P.gold);
      /* might is not the same as will not */
      var mn = on(t, cMightNot, 0.45);
      if (mn > 0) {
        a += L(AC_SPOT[1], AC_LINE.y - 40, AC_SPOT[0], AC_LINE.y - 40, P.bad, 3.5,
          { "stroke-dasharray": "10 7", opacity: mn });
        a += MK.cross((AC_SPOT[0] + AC_SPOT[1]) / 2, AC_LINE.y - 40, 24, popIn(t, cMightNot, 0.4));
        a += MK.pill((AC_SPOT[0] + AC_SPOT[1]) / 2, AC_LINE.y - 96, "not the same", mn, { size: 26, col: P.bad });
      }
      out += G(a, { opacity: clamp(1 - toSpinner, 0, 1) });
    }

    /* ---- the chance experiment ---- */
    if (toSpinner > 0.005) {
      var b = "", s1 = spokenEnd(scene.first + 4), s0 = cSpin == null ? null : cSpin + 0.2;
      var n = 0;
      if (s0 != null && t >= s0) n = Math.min(AC_SPINS.length,
        Math.floor(clamp((t - s0) / Math.max(s1 - s0, 0.6), 0, 1) * (AC_SPINS.length + 0.999)));
      var last = n > 0 ? n - 1 : 0;
      var deg = n > 0 ? acLanded(last) : 0;
      var score = acScore(n);
      var winner = n > 0 ? AC_SECT[AC_LETTER[AC_SPINS.charAt(last)]].name : null;
      var litO = n > 0 && s0 != null ? clamp(1 - (t - (s0 + (n - 1) * Math.max(s1 - s0, 0.6) / AC_SPINS.length)) / 0.25, 0, 1) : 0;
      var roomO = on(t, cRoom, 0.5);
      if (roomO > 0) { winner = "red"; litO = Math.max(litO, roomO * (0.6 + 0.4 * breathe(t))); }

      b += R(48, 44, 600, 372, 24, P.card, P.line, 2);
      b += acSpinner(348, 230, 146, deg, winner, litO);
      b += MK.pill(348, 396, "spins: " + n, on(t, cThirty, 0.45), { size: 28, col: P.gold });

      /* the score, kept as it goes */
      var flash = [bump(t, cRed, 0.9), bump(t, cBlue, 0.9), bump(t, cGold, 0.9)];
      b += R(700, 44, 424, 372, 24, P.card, P.line, 2);
      b += Tx(912, 88, "the score", "lab mid muted", "middle");
      for (k = 0; k < AC_SECT.length; k++) {
        var ry = 150 + k * 82;
        b += R(736, ry - 26, 52, 52, 12, AC_SECT[k].col);
        b += Tx(810, ry + 11, AC_SECT[k].name, "lab big", "start");
        b += Tx(1082, ry + 16, String(score[k]), "lab huge", "end",
          { fill: flash[k] > 0.05 ? P.gold : P.ink });
        if (flash[k] > 0.05) b += C(1060, ry, 42, "none", P.gold, 3, { opacity: flash[k] });
      }
      b += MK.pill(912, 388, "red has the most room", roomO, { size: 25, col: P.gold });
      if (roomO > 0) b += MK.leader(726, 150, 432, 176, on(t, cRoom, 0.7), P.gold);
      b += MK.pill(348, 70, "keep the score", on(t, cScore, 0.45) * (1 - on(t, cRed, 0.6)),
        { size: 25, col: P.line });
      out += G(b, { opacity: clamp(toSpinner, 0, 1) });
    }

    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------- */
  var AC_RECAP = MK.recapKind([
    { beat: 0, at: "ask", title: "Ask", sub: "answers that vary",
      pic: function (cx, cy, size) { return Em(cx, cy, size, "❓"); } },
    { beat: 0, at: "tally", title: "Tally", sub: "count on in fives",
      pic: function (cx, cy, size) {
        return acGate(cx - size * 0.44, cy - size * 0.4, size * 0.8, P.teal, 5) +
          acGate(cx + size * 0.3, cy - size * 0.4, size * 0.8, P.teal, 2);
      } },
    { beat: 1, at: "key", title: "Pictogram", sub: "read the key first",
      pic: function (cx, cy, size) {
        return C(cx - size * 0.42, cy, size * 0.18, P.plum) + C(cx, cy, size * 0.18, P.plum) +
          Pth("M" + n2(cx + size * 0.42) + "," + n2(cy - size * 0.18) + " A" + n2(size * 0.18) + "," +
            n2(size * 0.18) + " 0 0,0 " + n2(cx + size * 0.42) + "," + n2(cy + size * 0.18) + " Z", P.plum) +
          C(cx + size * 0.42, cy, size * 0.18, "none", P.plum, 3);
      } },
    { beat: 1, at: "height", title: "Bar chart", sub: "taller means more",
      pic: function (cx, cy, size) { return acBars(cx - size * 0.5, cy - size * 0.42, size, size * 0.84, [9, 6, 4, 3], P.blue, 1); } },
    { beat: 2, at: "sort", title: "Venn and Carroll", sub: "sort by two questions",
      pic: function (cx, cy, size) { return acHoops(cx, cy, size * 0.32, P.good, P.gold); } },
    { beat: 2, at: "might", title: "Chance", sub: "will, might, will not",
      pic: function (cx, cy, size) { return Em(cx, cy, size, "\u{1F3B2}"); } }
  ], { goBeat: 2, goAt: "might" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "A question whose answers vary",
      "Tally charts, pictograms and bar charts",
      "Venn and Carroll, and what might happen"
    ] }),
    ask: acAskChapter, tally: acTallyChapter, picto: acPictoChapter,
    bars: acBarsChapter, sort: acSortChapter, chance: acChanceChapter,
    recap: AC_RECAP
  };

  /* ==== the checks =============================================================
     The warning this film was written under: a chart film has to agree with
     ITSELF as well as with its words. Every number the narration says is
     recomputed here from the data the pictures are drawn from, and compared
     with the sentence that says it. A drift stops the page loading, with the
     figure named, instead of shipping a film whose tally and bar disagree. */
  (function acCheck() {
    function says(text, why) {
      var found = F.beats.some(function (b) { return (b.say || "").indexOf(text) >= 0; });
      if (!found) throw new Error("ask-count-chart: no line says \"" + text + "\" - " + why);
    }
    function is(name, got, want) {
      if (got !== want) throw new Error("ask-count-chart: " + name + " is " + got + ", and the film says " + want);
    }
    /* the travel survey: the tally, the bar chart and the voice */
    is("Walk", AC_WALK, 9); is("Car", AC_CAR, 3);
    is("the difference", AC_DIFF, 6); is("the total", AC_TOTAL, 22);
    is("the bundles of five in Walk", AC_BUNDLES, 1); is("the marks left over", AC_LEFT, 4);
    says("nine children", "the tally counts to " + AC_WALK);
    says("at three", "the shortest bar is " + AC_CAR);
    says("is six", "the difference is " + AC_DIFF);
    says("twenty-two", "the four bars total " + AC_TOTAL);
    if (AC_WALK > AC_MAX) throw new Error("ask-count-chart: the tallest bar is off the axis");
    /* the pictogram: the key, and the two rows the film reads aloud */
    is("the apple row's pictures", AC_APPLE_PICS, 5);
    is("apples", AC_FRUIT[0].count, AC_APPLE_PICS * AC_EACH);
    is("oranges", AC_FRUIT[3].count, AC_ORANGE_WHOLE * AC_EACH + AC_EACH / 2);
    says("means two children", "one picture is " + AC_EACH);
    says("make ten children", AC_APPLE_PICS + " pictures of " + AC_EACH + " is " + AC_FRUIT[0].count);
    says("make three", "one picture and a half is " + AC_FRUIT[3].count);
    /* the sorting: every number is where the lesson's own test puts it */
    AC_ITEMS.forEach(function (it) {
      var v = Number(it.label);
      if ((v % 2 === 0) !== !!it.a) throw new Error("ask-count-chart: " + v + " is sorted wrongly by even");
      if ((v > 20) !== !!it.b) throw new Error("ask-count-chart: " + v + " is sorted wrongly by more than twenty");
    });
    /* the spinner: the score the last line reads out */
    is("the spins", AC_SPINS.length, 30);
    var end = acScore(AC_SPINS.length);
    is("red", end[0], 16); is("blue", end[1], 9); is("gold", end[2], 5);
    is("the score's total", end[0] + end[1] + end[2], AC_SPINS.length);
    if (!(end[0] > end[1] && end[1] > end[2]))
      throw new Error("ask-count-chart: red has the most room and has to come up most");
    says("thirty times", "the spinner is spun " + AC_SPINS.length + " times");
    says("Red sixteen", "red came up " + end[0] + " times");
    says("blue nine", "blue came up " + end[1] + " times");
    says("gold five", "gold came up " + end[2] + " times");
  })();
