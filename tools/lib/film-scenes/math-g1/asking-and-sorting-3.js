  /* ==== Asking and Sorting, part 3 ==========================================
     tools/lib/film-scenes/math-g1/asking-and-sorting-3.js: the chapters
     "A pictogram", "Hoops and boxes" and "What the graph tells you", the
     recap, and KINDS. See asking-and-sorting.js.

     The pictogram and the two sorting diagrams are ART's own
     (ART.pictogram, ART.sortDiagram), nested with ART.place; the cards that
     move into the hoops are drawn here, over the diagram, at the zone
     centres ART puts them in. */

  /* ---- chapter: a pictogram ---------------------------------------------
     ART.pictogram, one person for one child, redrawn each frame with the
     number of pictures that have arrived. The counts are whole, so the row
     never shows part of a person. */
  var ASO_PP = { x: 430, y: 36, w: 430, h: 370, vw: 342, vh: 294 };
  function asoPX(v) { return ASO_PP.x + v * (ASO_PP.w / ASO_PP.vw); }
  function asoPY(v) { return ASO_PP.y + v * (ASO_PP.h / ASO_PP.vh); }
  function asoGlyphX(j) { return asoPX(157 + 36 * j); }
  function asoRowY(r) { return asoPY(77 + 42 * r); }

  var ASO_MINI = { x: 100, base: 290, bw: 34, bh: 28, pitch: 54, max: 6 };
  function asoPictoChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPicto = c(0, "picto"), cPics = c(0, "pics");
    var cOne = c(1, "one"), cChild = c(1, "child");
    var cRow = c(2, "row"), cChose = c(2, "chose");
    var out = "", j;

    /* the block graph the answers are already in, small, on the left */
    var mini = on(t, cPicto, 0.5) * (1 - on(t, cOne == null ? null : cOne - 0.3, 0.45));
    if (mini > 0) {
      out += asoCard(36, 104, 306, 268, mini);
      out += G(asoGraph({ x: ASO_MINI.x, base: ASO_MINI.base, bw: ASO_MINI.bw, bh: ASO_MINI.bh,
        pitch: ASO_MINI.pitch, max: ASO_MINI.max, cats: ASO_FRUIT, vals: ASO_N, lit: -1,
        emSize: 26, names: false, small: true }), { opacity: mini });
      out += MK.arrow(354, 236, 412, 236, on(t, cPics, 0.6) * mini, P.gold, 7);
    }

    /* the pictogram, filling one picture at a time */
    var shown = ASO_N.map(function (n, k) {
      return cPics == null ? 0 : Math.min(n, tally(t, cPics + k * 0.34, n, 0.46));
    });
    var po = on(t, cPicto, 0.5);
    if (po > 0) {
      out += G(ART.place(ART.pictogram({
        rows: ASO_FRUIT.map(function (f, k) { return { label: f.name, count: shown[k] }; }),
        each: 1, shape: "person", key: ["child", "children"], title: "Fruit we like best"
      }), ASO_PP.x, ASO_PP.y, ASO_PP.w, ASO_PP.h), { opacity: po });
    }

    /* "One picture stands for one child" */
    var ko = on(t, cOne, 0.45) * (1 - on(t, cRow, 0.5));
    if (ko > 0) {
      out += C(asoGlyphX(0), asoRowY(0), 22, "none", P.gold, 4, { opacity: ko });
      out += MK.leader(324, 182, asoGlyphX(0) - 4, asoRowY(0) + 34, on(t, cOne, 0.7), P.gold);
      out += MK.pill(316, 182, "one picture", ko, { size: 28, anchor: "end", col: P.gold });
      out += MK.pop(Em(238, 262, 62, ASO_CLASS[0].face), 238, 262, popIn(t, cChild, 0.4));
      out += MK.pill(238, 320, "one child", popIn(t, cChild, 0.45), { size: 28, col: P.gold });
    }

    /* "four pictures, so four children chose banana" */
    var ro = on(t, cRow, 0.45);
    if (ro > 0) {
      out += R(asoPX(140), asoRowY(1) - 25, asoPX(324) - asoPX(140), 50, 12, "none", P.gold, 4, { opacity: ro });
      for (j = 0; j < ASO_N[1]; j++)
        out += MK.ripple(asoGlyphX(j), asoRowY(1), t, cRow == null ? null : cRow + 0.15 + j * 0.26, P.gold);
      out += MK.pill(880, 186, ASO_N[1] + " pictures", ro, { size: 30, anchor: "start", col: P.gold });
      out += MK.pill(880, 250, ASO_N[1] + " children", on(t, cChose, 0.45), { size: 30, anchor: "start", col: P.gold });
      out += MK.pop(Em(930, 330, 54, ASO_FRUIT[1].em), 930, 330, popIn(t, cChose, 0.45));
    }
    return svg(out);
  }

  /* ---- chapter: hoops and boxes -----------------------------------------
     One hoop, then ART's Venn, then ART's Carroll. The cards are the
     lesson's own attribute cards, laid at the zone centres the drawings put
     their items in. */
  var ASO_VENN = { x: 320, y: 44, k: 1.12 };
  function asoVX(v) { return ASO_VENN.x + v * ASO_VENN.k; }
  function asoVY(v) { return ASO_VENN.y + v * ASO_VENN.k; }
  var ASO_CARR = { x: 300, y: 50, k: 1.12 };
  function asoCX(v) { return ASO_CARR.x + v * ASO_CARR.k; }
  function asoCY(v) { return ASO_CARR.y + v * ASO_CARR.k; }
  /* where a card waits before the narration says where it goes */
  var ASO_HOLD = [172, 208];
  function asoHold(t, at, op) {
    if (!(op > 0)) return "";
    return MK.pill(ASO_HOLD[0], ASO_HOLD[1] + 92, "this card", on(t, at, 0.5) * op, { size: 24, col: P.line, ink: P.muted });
  }

  function asoSortChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cHoop = c(0, "hoop"), cRule = c(0, "rule");
    var cTwo = c(1, "two"), cVenn = c(1, "venn");
    var cRed = c(2, "red"), cCirc = c(2, "circ");
    var cCard3 = c(3, "card"), cBoth = c(3, "both"), cMid = c(3, "mid");
    var cCard4 = c(4, "card"), cOut = c(4, "out");
    var cCarroll = c(5, "carroll"), cBoxes = c(5, "boxes");
    var out = "", k;

    var hoopO = 1 - on(t, cTwo, 0.55);
    var vennO = on(t, cTwo, 0.55) * (1 - on(t, cCarroll, 0.55));
    var carrO = on(t, cCarroll, 0.55);

    /* ---- one hoop, one rule ---- */
    if (hoopO > 0) {
      var g = "";
      g += C(600, 212, 128, "rgba(30,140,134,0.12)", P.teal, 5);
      g += MK.pill(600, 66, "red", on(t, cRule, 0.4), { size: 30, col: P.teal, ink: P.teal });
      var reds = [["circle", 552, 176], ["square", 648, 176], ["triangle", 552, 254], ["circle", 648, 254]];
      for (k = 0; k < reds.length; k++)
        g += asoShape(reds[k][1], reds[k][2], 64, "red", reds[k][0], popIn(t, cHoop == null ? null : cHoop + 0.25 + k * 0.16, 0.34), false);
      var blues = [["circle", 902, 176], ["square", 998, 176], ["triangle", 902, 254], ["circle", 998, 254]];
      for (k = 0; k < blues.length; k++)
        g += asoShape(blues[k][1], blues[k][2], 64, "blue", blues[k][0], popIn(t, cRule == null ? null : cRule + 0.2 + k * 0.12, 0.34), false);
      g += Tx(950, 342, "not red, so outside", "lab mid muted", "middle", { opacity: on(t, cRule, 0.6) });
      g += Tx(600, 368, "a hoop holds what follows the rule", "lab mid muted", "middle", { opacity: on(t, cHoop, 0.6) });
      out += G(g, { opacity: clamp(hoopO, 0, 1) });
    }

    /* ---- the Venn ---- */
    if (vennO > 0) {
      var v = ART.place(ART.sortDiagram({ shape: "venn", labels: ["red", "circles"], items: [] }),
        ASO_VENN.x, ASO_VENN.y, 500 * ASO_VENN.k, 292 * ASO_VENN.k);
      var w = G(v, {}), rr = 100 * ASO_VENN.k, cs = 58 * ASO_VENN.k;
      /* the two rules, one at a time */
      w += C(asoVX(192), asoVY(140), rr, "none", P.teal, 6, { opacity: on(t, cRed, 0.4) * (1 - on(t, cCirc, 0.4)) });
      w += C(asoVX(308), asoVY(140), rr, "none", P.gold, 6, { opacity: on(t, cCirc, 0.4) * (1 - on(t, cCard3, 0.4)) });
      /* a card in each place, arriving as the narration puts it there */
      w += asoShape(asoVX(144), asoVY(140), cs, "red", "square", popIn(t, cVenn == null ? null : cVenn + 0.35, 0.34), false);
      w += asoShape(asoVX(356), asoVY(140), cs, "blue", "circle", popIn(t, cVenn == null ? null : cVenn + 0.6, 0.34), false);
      /* the red circle: it waits beside the diagram, then moves to the middle */
      var m3 = popIn(t, cCard3, 0.36) * (1 - on(t, cCard4, 0.4)), slide = ease(on(t, cMid, 0.55));
      if (m3 > 0) {
        w += asoHold(t, cCard3, m3 * (1 - slide));
        w += asoShape(lerp(ASO_HOLD[0], asoVX(250), slide), lerp(ASO_HOLD[1], asoVY(140), slide),
          cs, "red", "circle", Math.min(m3, 1), true);
      }
      w += MK.pill(1000, 150, "both rules", on(t, cBoth, 0.45) * (1 - on(t, cCard4, 0.45)), { size: 28, col: P.gold });
      /* the blue triangle: the same wait, then out to the corner */
      var m4 = popIn(t, cCard4, 0.36), slid4 = ease(on(t, cOut, 0.55));
      if (m4 > 0) {
        w += asoShape(asoVX(250), asoVY(140), cs, "red", "circle", 1, false);
        w += asoHold(t, cCard4, m4 * (1 - slid4));
        w += asoShape(lerp(ASO_HOLD[0], asoVX(78), slid4), lerp(ASO_HOLD[1], asoVY(230), slid4),
          cs, "blue", "triangle", Math.min(m4, 1), true);
        w += MK.pill(1000, 300, "neither rule", on(t, cOut, 0.5), { size: 28, col: P.gold });
      }
      out += G(w, { opacity: clamp(vennO, 0, 1) });
    }

    /* ---- the Carroll ---- */
    if (carrO > 0) {
      var cg = ART.place(ART.sortDiagram({ shape: "carroll", labels: ["red", "circle"], items: [] }),
        ASO_CARR.x, ASO_CARR.y, 520 * ASO_CARR.k, 288 * ASO_CARR.k);
      var q = G(cg, {}), cw = 174 * ASO_CARR.k, rh = 88 * ASO_CARR.k, sz = 60;
      var cells = [[237, 116, "red", "circle"], [411, 116, "blue", "circle"],
        [237, 204, "red", "square"], [411, 204, "blue", "triangle"]];
      for (k = 0; k < 4; k++) {
        var at4 = cCarroll == null ? null : cCarroll + 0.5 + k * 0.22;
        q += asoShape(asoCX(cells[k][0]), asoCY(cells[k][1]), sz, cells[k][2], cells[k][3], popIn(t, at4, 0.34), false);
        /* "four boxes": each of the four is outlined, one at a time */
        q += R(asoCX(cells[k][0]) - cw / 2, asoCY(cells[k][1]) - rh / 2, cw, rh, 4, "none", P.gold, 4,
          { opacity: on(t, cBoxes == null ? null : cBoxes + k * 0.16, 0.35) * (1 - on(t, cBoxes == null ? null : cBoxes + 1.1, 0.5)) });
      }
      q += Tx(594, 404, "every card has a box of its own", "lab mid muted", "middle", { opacity: on(t, cBoxes, 0.6) });
      out += G(q, { opacity: clamp(carrO, 0, 1) });
    }
    return svg(out);
  }

  /* ---- chapter: what the graph tells you --------------------------------
     The lesson's pet graph: dog 6, cat 4, fish 4, bird 2. */
  var ASO_PG = { x: 352, base: 350, bw: 74, bh: 44, pitch: 112, max: 6 };
  function asoPetGraph() {
    return { x: ASO_PG.x, base: ASO_PG.base, bw: ASO_PG.bw, bh: ASO_PG.bh, pitch: ASO_PG.pitch,
      max: ASO_PG.max, cats: ASO_PET, vals: ASO_PET.map(function (p) { return p.n; }), lit: -1 };
  }
  function asoSayChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPets = c(0, "pets"), cDog = c(0, "dog"), cBird = c(0, "bird");
    var cMore = c(1, "more"), cPoint = c(1, "point");
    var cFour = c(2, "four"), cMatch = c(2, "match");
    var cNever = c(3, "never"), cCounts = c(3, "counts");
    var g = asoPetGraph(), out = "", k;

    out += MK.glow(600, 224, 198, P.gold, on(t, cCounts, 0.7) * (0.6 + 0.4 * breathe(t)));
    /* the graph is a given one, as the lesson shows it, so it is there from
       the chapter's first words rather than waiting for a cue */
    out += G(asoGraph(g), { opacity: into(t, scene.first) });
    /* "about pets": each animal under the axis answers to its own name */
    for (k = 0; k < 4; k++)
      out += MK.ripple(asoTowerX(g, k), g.base + 38, t, cPets == null ? null : cPets + k * 0.16, P.gold);

    /* six have a dog, two a bird */
    out += asoRing(g, 0, on(t, cDog, 0.4) * (1 - on(t, cFour, 0.45)));
    out += asoRing(g, 3, on(t, cBird, 0.4) * (1 - on(t, cFour, 0.45)));

    /* "more children have a dog than a bird": the gap between the two tops */
    var mo = on(t, cMore, 0.5) * (1 - on(t, cFour, 0.45));
    if (mo > 0) {
      var dx = asoTowerX(g, 0), bx = asoTowerX(g, 3);
      var dy = g.base - 6 * g.bh, by = g.base - 2 * g.bh;
      out += L(dx, dy - 22, bx, dy - 22, P.gold, 3, { opacity: mo, "stroke-dasharray": "12 8" });
      out += MK.arrow(bx, by - 8, bx, dy - 18, mo, P.gold, 7);
      out += MK.pill(858, 100, "6 is more than 2", mo, { size: 26, anchor: "start", col: P.gold });
      out += MK.tick(1112, 158, 22, popIn(t, cMore == null ? null : cMore + 0.5, 0.35) * mo);
      out += MK.finger(dx + 60, dy + 8, on(t, cPoint, 0.4) * mo);
    }

    /* cat and fish are both four */
    var fo = on(t, cFour, 0.45) * (1 - on(t, cNever, 0.45));
    if (fo > 0) {
      out += asoRing(g, 1, fo, P.teal);
      out += asoRing(g, 2, fo, P.teal);
      out += L(asoTowerX(g, 1) - 56, g.base - 4 * g.bh, asoTowerX(g, 2) + 56, g.base - 4 * g.bh, P.teal, 4,
        { opacity: fo, "stroke-dasharray": "12 8" });
      out += MK.pill(880, 128, "4 and 4", fo, { size: 30, anchor: "start", col: P.teal });
      out += MK.tick(1112, 196, 22, popIn(t, cMatch, 0.4) * fo);
    }

    /* what the graph never says */
    var no = on(t, cNever, 0.45);
    if (no > 0) {
      out += G(R(838, 120, 310, 92, 20, P.paper, P.bad, 3) +
        Tx(993, 178, "Dogs are best", "lab big dark", "middle"), { opacity: no });
      out += MK.cross(1136, 128, 22, popIn(t, cNever == null ? null : cNever + 0.5, 0.4));
      out += MK.pill(993, 252, "the graph only counts", on(t, cCounts, 0.45), { size: 24, col: P.gold });
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------- */
  function asoRecapAsk(cx, cy, size) {
    return Em(cx - size * 0.24, cy, size * 0.86, ASO_CLASS[0].face) + MK.qmark(cx + size * 0.36, cy - size * 0.1, size * 0.24, 1);
  }
  function asoRecapVenn(cx, cy, size) {
    var r = size * 0.32;
    return C(cx - r * 0.62, cy, r, "rgba(30,140,134,0.30)", P.teal, 4) +
      C(cx + r * 0.62, cy, r, "rgba(244,201,93,0.30)", P.gold, 4);
  }
  function asoRecapSays(cx, cy, size) {
    return MK.tick(cx - size * 0.3, cy, size * 0.26, 1) + MK.cross(cx + size * 0.3, cy, size * 0.26, 1);
  }
  var ASO_RECAP = MK.recapKind([
    { beat: 0, at: "ask", title: "Ask everyone", sub: "each child once", pic: asoRecapAsk },
    { beat: 0, at: "write", title: "List and table", sub: "each answer written down", pic: "\u{1F4CB}" },
    { beat: 1, at: "graph", title: "Block graph", sub: "one block, one child", pic: "\u{1F4F6}" },
    { beat: 1, at: "picto", title: "Pictogram", sub: "one picture, one child", pic: "\u{1F5BC}️" },
    { beat: 2, at: "sort", title: "Hoops and boxes", sub: "sorted by two rules", pic: asoRecapVenn },
    { beat: 2, at: "said", title: "What it tells you", sub: "only what people said", pic: asoRecapSays }
  ], { goBeat: 2, goAt: "said" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Asking everyone the same question", "Lists, tables, block graphs, pictograms", "Sorting with hoops and with boxes"] }),
    ask: asoAskChapter, table: asoTableChapter, graph: asoGraphChapter,
    picto: asoPictoChapter, sort: asoSortChapter, say: asoSayChapter, recap: ASO_RECAP
  };
