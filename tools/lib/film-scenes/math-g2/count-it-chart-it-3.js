  /* ==== Count It, Chart It, part 3 ============================================
     The last four chapters: the pictogram and its key, the Carroll diagram,
     the coin experiment, and what you now know.

     ART.pictogram, ART.sortDiagram and ART.tally draw the charts; the flying
     apple, the coin and the two result strips are drawn here, because the
     library has no picture of them. Everything drawn over a chart is placed
     through ccMap from a point measured inside the library's own layout. */

  /* ---- pictograms and the key ---------------------------------------------------
     Two charts, one after the other. The first is the tally's own numbers with
     one picture for one child, so the answer is the number of pictures. The
     second is the lesson's Spot the mistake: the key says one picture is two
     children, so four pictures is 2, 4, 6, 8 - eight children.

     ART.pictogram's own layout: edge 22, a 118 px gutter for the row names,
     36 px between pictures, rows 42 tall, and with a title the first row's
     centre is at y 77. The key line sits at y 196 (the rule) with its glyph
     and words centred on y 218. */
  var CC_PA = { x: 110, y: 66, w: 600, h: 336 };
  var CC_PAM = ccMap(CC_PA, 450, 252);
  var CC_PB = { x: 140, y: 66, w: 430, h: 354 };
  var CC_PBM = ccMap(CC_PB, 306, 252);
  function ccPicX(m, j) { return m.x(157 + 36 * j); }
  function ccPicY(m, row) { return m.y(77 + 42 * row); }

  function ccPictoChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPicto = c(0, "picto"), cPictures = c(0, "pictures");
    var cOne = c(1, "one"), cCount = c(1, "count");
    var cKey = c(2, "key"), cTwo = c(2, "two");
    var cFour = c(3, "four"), cSteps = c(3, "steps"), cEight = c(3, "eight");
    var out = "", k;

    var swap = on(t, cKey, 0.55);

    /* chart one: one picture, one child */
    if (swap < 1) {
      var rowY = ccPicY(CC_PAM, 0);
      var a = ART.pictogram({
        title: "Favourite fruit", shape: "circle", each: 1, key: ["child", "children"],
        rows: [{ label: "mango", count: 8 }, { label: "banana", count: 5 }, { label: "orange", count: 4 }]
      });
      out += G(ART.place(a, CC_PA.x, CC_PA.y, CC_PA.w, CC_PA.h),
        { opacity: clamp(popIn(t, cPicto, 0.45) * (1 - swap), 0, 1) });

      /* "using pictures": every picture on the chart answers */
      var rip = bump(t, cPictures, 1.4) * (1 - swap);
      for (k = 0; k < 8; k++) out += ccRing(ccPicX(CC_PAM, k), rowY, 16, rip * 0.8);

      /* "one picture is one child" */
      var oneO = on(t, cOne, 0.5) * (1 - swap);
      if (oneO > 0) {
        out += ccRing(ccPicX(CC_PAM, 0), rowY, 18, oneO);
        out += MK.leader(722, rowY, 792, rowY, on(t, cOne, 0.7), P.gold);
        out += C(818, rowY, 16, ART.C.teal, null, null, { opacity: oneO });
        out += MK.pill(934, rowY, "one child", oneO, { size: 26, col: P.gold });
      }
      /* "count the pictures": a ring walks the row and the count keeps up */
      var live = ccOnly(t, scene, 1) * (1 - swap);
      var n = cCount == null || t < cCount ? 0 : tally(t, cCount, 8, 1.2);
      if (n > 0 && live > 0) {
        out += ccRing(ccPicX(CC_PAM, n - 1), rowY, 20, live);
        out += MK.pill(934, 300, String(n), live, { size: 44, col: P.gold });
      }
    }

    /* chart two: the key says one picture is two children */
    if (swap > 0) {
      var walkY = ccPicY(CC_PBM, 0);
      var bch = ART.pictogram({
        title: "How we get to school", shape: "person", each: 2, key: ["child", "children"],
        rows: [{ label: "walk", count: 8 }, { label: "bus", count: 6 }, { label: "bike", count: 4 }]
      });
      out += G(ART.place(bch, CC_PB.x, CC_PB.y, CC_PB.w, CC_PB.h), { opacity: clamp(swap, 0, 1) });
      /* "read the key first", then "stands for two children" */
      var kx = CC_PBM.x(16), ky = CC_PBM.y(194), kw = CC_PBM.w(150), kh = CC_PBM.h(44);
      out += ccBox(kx, ky, kw, kh, on(t, cKey, 0.5));
      /* 66, not 110: a bigger pool of light reaches past the bottom of the
         1168 x 440 box, which --sweep found at 98-105 s. */
      out += MK.glow(kx + kw / 2, ky + kh / 2, 66, P.gold, on(t, cTwo, 0.5) * (0.4 + 0.4 * breathe(t)));

      /* "Walk has four pictures" */
      var fourO = on(t, cFour, 0.5);
      for (k = 0; k < 4; k++) out += ccRing(ccPicX(CC_PBM, k), walkY, 18, fourO);
      /* "Two, four, six, eight": one number for each picture, in turn */
      if (cSteps != null) {
        out += MK.leader(590, walkY, 640, walkY, on(t, cSteps, 0.5), P.gold);
        for (k = 0; k < 4; k++) {
          var at = cSteps + k * 0.34;
          out += MK.pill(690 + k * 112, walkY, String(2 * k + 2), popIn(t, at, 0.35), { size: 30, col: P.gold });
          out += ccRing(ccPicX(CC_PBM, k), walkY, 21, bump(t, at, 0.7));
        }
      }
      out += MK.pill(800, 310, "8 children", popIn(t, cEight, 0.4), { size: 34, col: P.gold });
      out += MK.tick(1000, 310, 24, popIn(t, cEight == null ? null : cEight + 0.3, 0.35));
    }
    return svg(out);
  }

  /* ---- sorting two ways ---------------------------------------------------------
     The lesson's Carroll diagram step, with its own labels: red or not red
     across the top, round or not round down the side. ART.sortDiagram draws
     the grid; the four things are drawn here, so the apple can fly into its
     box at a size the child can see.

     ART.sortDiagram's carroll layout: edge 22, the row names 128 wide, the
     column headings 54 tall from y 52, and two rows 88 tall. */
  var CC_C = { x: 90, y: 40, w: 620, h: 384 };
  var CC_CM = ccMap(CC_C, 520, 322);
  var CC_HEAD_RED = [150, 52, 174, 54];
  var CC_HEAD_NOTRED = [324, 52, 174, 54];
  var CC_SIDE_ROUND = [22, 106, 128, 88];
  var CC_SIDE_NOTROUND = [22, 194, 128, 88];
  var CC_BOX_BOTH = [150, 106, 174, 88];
  function ccCBox(card, o, w2, h2) {
    return ccBox(CC_CM.x(card[0]), CC_CM.y(card[1]), CC_CM.w(card[2] * (w2 || 1)), CC_CM.h(card[3] * (h2 || 1)), o);
  }
  /* the middle of each of the four boxes */
  function ccZone(col, row) { return [CC_CM.x(237 + col * 174), CC_CM.y(150 + row * 88)]; }
  var CC_APPLE_WAIT = [900, 104];

  function ccCarrollChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cCarroll = c(0, "carroll"), cTwo = c(0, "two"), cBoth = c(0, "both");
    var cRed = c(1, "red"), cNotRed = c(1, "notred");
    var cRound = c(2, "round"), cNotRound = c(2, "notround");
    var cApple = c(3, "apple"), cRR = c(3, "redround"), cBox = c(3, "box");
    var out = "";

    var grid = ART.sortDiagram({ shape: "carroll", labels: ["red", "round"], items: [] });
    out += G(ART.place(grid, CC_C.x, CC_C.y, CC_C.w, CC_C.h), { opacity: clamp(popIn(t, cCarroll, 0.45), 0, 1) });

    /* the three things already sorted, each where both its labels are true */
    var placed = on(t, cCarroll, 0.6);
    var zRedNot = ccZone(0, 1), zNotRed = ccZone(1, 0), zNeither = ccZone(1, 1), zBoth = ccZone(0, 0);
    out += Em(zRedNot[0], zRedNot[1], 52, "\u{1F336}\uFE0F", { opacity: placed });
    out += Em(zNotRed[0], zNotRed[1], 52, "⚽", { opacity: placed });
    out += Em(zNeither[0], zNeither[1], 52, "\u{1F4D8}", { opacity: placed });

    /* "two ways at once": the columns, then the rows */
    var colF = bump(t, cTwo, 0.9), rowF = bump(t, cTwo == null ? null : cTwo + 0.85, 0.9);
    out += ccCBox(CC_HEAD_RED, colF, 2, 1);
    out += ccCBox(CC_SIDE_ROUND, rowF, 1, 2);
    /* "Check both labels": one of each, together */
    var bothO = on(t, cBoth, 0.45) * (1 - on(t, cRed, 0.5));
    out += ccCBox(CC_HEAD_RED, bothO);
    out += ccCBox(CC_SIDE_ROUND, bothO);

    /* the four labels, one at a time, each on its own words */
    var one = ccOnly(t, scene, 1), two = ccOnly(t, scene, 2);
    out += ccCBox(CC_HEAD_RED, on(t, cRed, 0.4) * (1 - on(t, cNotRed, 0.4)) * one);
    out += ccCBox(CC_HEAD_NOTRED, on(t, cNotRed, 0.4) * one);
    out += ccCBox(CC_SIDE_ROUND, on(t, cRound, 0.4) * (1 - on(t, cNotRound, 0.4)) * two);
    out += ccCBox(CC_SIDE_NOTROUND, on(t, cNotRound, 0.4) * two);

    /* the apple: named, tested against both labels, then placed */
    var u = cBox == null ? 0 : ease((t - cBox) / 0.6);
    var ax = lerp(CC_APPLE_WAIT[0], zBoth[0], u);
    var ay = lerp(CC_APPLE_WAIT[1], zBoth[1], u) - 40 * Math.sin(Math.PI * u);
    out += Em(ax, ay, lerp(64, 52, u), "\u{1F34E}");
    out += ccRing(ax, ay - 4, 42, on(t, cApple, 0.4) * (1 - u));
    out += MK.list(790, 214, [
      { text: "red", at: cRR, mark: "tick" },
      { text: "round", at: cRR == null ? null : cRR + 0.45, mark: "tick" }
    ], t, { lh: 62 });
    /* the box where both are true */
    out += ccCBox(CC_BOX_BOTH, on(t, cBox, 0.5));
    return svg(out);
  }

  /* ---- regular or random --------------------------------------------------------
     The lesson's Toss a coin step and its Regular or random step, side by
     side: the run it says you might get (six heads and four tails), tallied,
     and the two strips the lesson contrasts - heads, tails, heads, tails
     repeating, against a real run with no repeat in it.

     CC_RUN holds exactly six H and four T, and no unit of one to four
     explains it, which is the lesson's own test for a random pattern. */
  var CC_RUN = ["H", "H", "T", "H", "T", "T", "H", "H", "H", "T"];
  var CC_REG = ["H", "T", "H", "T", "H", "T", "H", "T", "H", "T"];
  var CC_STRIP_X = 618, CC_STRIP_PITCH = 50, CC_TILE = 44;
  var CC_REG_Y = 96, CC_RUN_Y = 290;
  var CC_STRIP_W = 9 * CC_STRIP_PITCH + CC_TILE;

  function ccTile(j, y, face, o, flash) {
    if (!(o > 0)) return "";
    var x = CC_STRIP_X + j * CC_STRIP_PITCH;
    var hot = face === "H";
    var fill = face == null ? P.cell : hot ? "#3C3018" : "#152F45";
    var edge = face == null ? P.line : hot ? P.gold : P.blue;
    return G(R(x, y, CC_TILE, CC_TILE, 9, fill, edge, 3) +
      (face ? Tx(x + CC_TILE / 2, y + CC_TILE / 2 + 11, face, "lab big", "middle",
        { fill: hot ? P.gold : P.blue }) : "") +
      (flash > 0 ? R(x, y, CC_TILE, CC_TILE, 9, "#FFFFFF", null, null, { opacity: 0.4 * flash }) : ""),
      { opacity: clamp(o, 0, 1) });
  }
  function ccCoin(cx, cy, r, face, sx, o) {
    if (!(o > 0)) return "";
    return G(C(cx, cy, r, "#E8C766") + C(cx, cy, r, "none", "#B08F2E", 4) +
      Tx(cx, cy + r * 0.34, face, "lab", "middle", { fill: "#5A4300", "font-size": r * 0.86 }),
      { transform: "translate(" + n2(cx) + ",0) scale(" + n2(sx) + ",1) translate(" + n2(-cx) + ",0)",
        opacity: clamp(o, 0, 1) });
  }

  function ccChanceChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cCoin = c(0, "coin"), cWays = c(0, "ways"), cTen = c(0, "ten");
    var cSix = c(1, "six"), cFour = c(1, "four"), cTenTwo = c(1, "ten");
    var cRepeat = c(2, "repeat"), cRegular = c(2, "regular");
    var cReal = c(3, "real"), cNoRepeat = c(3, "norepeat"), cRandom = c(3, "random");
    var cNobody = c(4, "nobody"), cNext = c(4, "next"), cDue = c(4, "due");
    var out = "", k;

    /* the coin, spinning while the ten tosses land */
    var spinning = cTen != null && t >= cTen && t < cTen + 2.6;
    var sx = spinning ? Math.max(0.12, Math.abs(Math.cos((t - cTen) * 7))) : 1;
    out += ccCoin(108, 138, 46, "?", sx, popIn(t, cCoin, 0.45));
    /* two ways: a head and a tail */
    var waysO = popIn(t, cWays, 0.4);
    out += ccCoin(84, 330, 40, "H", 1, waysO);
    out += ccCoin(184, 330, 40, "T", 1, waysO);

    /* the ten results, landing one at a time */
    var landed = cTen == null || t < cTen ? 0 : tally(t, cTen, 10, 2.2);
    for (k = 0; k < 10; k++) {
      var at = cTen == null ? null : cTen + (k / 9) * 2.2;
      out += ccTile(k, CC_RUN_Y, k < landed ? CC_RUN[k] : null, on(t, cCoin, 0.5), bump(t, at, 0.5));
    }

    /* the tally of that run: six heads, four tails */
    var hN = cSix == null || t < cSix ? 0 : tally(t, cSix, 6, 1.1);
    var tN = cFour == null || t < cFour ? 0 : tally(t, cFour, 4, 0.9);
    var hO = on(t, cSix, 0.45), tO = on(t, cFour, 0.45);
    out += G(ART.place(ART.tally(hN, { label: String(hN) }), 280, 60, 330, 109), { opacity: hO });
    out += G(ART.place(ART.tally(tN, { label: String(tN) }), 280, 200, 330, 109), { opacity: tO });
    out += Tx(266, 118, "heads", "lab big", "end", { opacity: hO });
    out += Tx(266, 258, "tails", "lab big", "end", { opacity: tO });
    out += MK.pill(838, 212, "10 tosses", popIn(t, cTenTwo, 0.4), { size: 26, col: P.gold });

    /* the regular strip: heads, tails, over and over */
    for (k = 0; k < 10; k++) {
      var rAt = cRepeat == null ? null : cRepeat + (k / 9) * 1.1;
      out += ccTile(k, CC_REG_Y, CC_REG[k], on(t, rAt, 0.3), 0);
    }
    /* "a regular pattern": the unit that repeats, boxed five times */
    var unitO = on(t, cRegular, 0.5);
    for (k = 0; k < 5; k++) {
      out += ccBox(CC_STRIP_X + k * 2 * CC_STRIP_PITCH - 5, CC_REG_Y - 5, CC_STRIP_PITCH + CC_TILE + 10, CC_TILE + 10,
        unitO * on(t, cRegular == null ? null : cRegular + k * 0.12, 0.3));
    }

    /* "Your real tosses": the run is looked at again */
    var realO = bump(t, cReal, 1.2);
    if (realO > 0) out += ccBox(CC_STRIP_X - 6, CC_RUN_Y - 6, CC_STRIP_W + 12, CC_TILE + 12, realO * 0.85, P.muted);
    /* "no repeat anywhere": a sweep along it that finds none */
    var third = ccOnly(t, scene, 3), sweep = on(t, cNoRepeat, 1.0) * third;
    if (sweep > 0) {
      out += L(CC_STRIP_X, 350, lerp(CC_STRIP_X, CC_STRIP_X + CC_STRIP_W, sweep), 350,
        P.gold, 4, { opacity: sweep, "stroke-dasharray": "12 8" });
      out += MK.cross(1130, 380, 22, popIn(t, cNoRepeat == null ? null : cNoRepeat + 0.9, 0.35) * third);
    }
    /* "a random pattern": the whole row is named */
    out += ccBox(CC_STRIP_X - 8, CC_RUN_Y - 8, CC_STRIP_W + 16, CC_TILE + 16, on(t, cRandom, 0.5));

    /* the next toss: nobody can say */
    var qO = popIn(t, cNobody, 0.4), qx = CC_STRIP_X + 10 * CC_STRIP_PITCH + CC_TILE / 2;
    out += ccTile(10, CC_RUN_Y, null, qO, 0);
    if (qO > 0) out += Tx(qx, CC_RUN_Y + CC_TILE / 2 + 11, "?", "lab big", "middle",
      { fill: P.gold, opacity: Math.min(1, qO) });
    out += MK.arrow(qx, CC_RUN_Y - 62, qx, CC_RUN_Y - 14, on(t, cNext, 0.5), P.gold, 6);
    /* "Heads is not due" */
    var dueO = popIn(t, cDue, 0.4);
    if (dueO > 0) {
      out += MK.pill(790, 404, "heads is due", Math.min(1, dueO), { size: 24, col: P.muted, ink: P.muted });
      out += MK.cross(790, 404, 26, popIn(t, cDue == null ? null : cDue + 0.3, 0.35));
    }
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------- */
  var CC_RECAP = MK.recapKind([
    { beat: 0, at: "sort", title: "Sort", sub: "one clear rule",
      pic: function (cx, cy, size) {
        return Em(cx - size * 0.4, cy, size * 0.78, "\u{1F34E}") + Em(cx + size * 0.4, cy, size * 0.78, "\u{1F955}");
      } },
    { beat: 0, at: "tally", title: "Tally", sub: "count in fives",
      pic: function (cx, cy, size) {
        return ccGate(cx - size * 0.26, cy - size * 0.35, size * 0.7, 5, P.gold, size * 0.085);
      } },
    { beat: 1, at: "graph", title: "Block graph", sub: "one block, one child", pic: "\u{1F4F6}" },
    { beat: 1, at: "picto", title: "Pictogram", sub: "read the key first", pic: "\u{1F5BC}️" },
    { beat: 2, at: "carroll", title: "Carroll diagram", sub: "two ways at once", pic: "\u{1F5C2}️" },
    { beat: 3, at: "regular", title: "Regular or random", sub: "a repeat, or none",
      pic: function (cx, cy, size) {
        return Em(cx - size * 0.4, cy, size * 0.78, "\u{1F501}") + Em(cx + size * 0.4, cy, size * 0.78, "\u{1F3B2}");
      } }
  ], { goBeat: 3, goAt: "random" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Sorting by one clear rule",
      "Tallies, block graphs and pictograms",
      "Regular patterns, and random ones"
    ] }),
    sort: ccSortChapter, tally: ccTallyChapter, graph: ccGraphChapter,
    picto: ccPictoChapter, carroll: ccCarrollChapter, chance: ccChanceChapter,
    recap: CC_RECAP
  };
