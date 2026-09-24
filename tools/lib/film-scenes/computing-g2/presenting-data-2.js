  /* ==== Presenting Data, part 2: the graph, and building it =================
     tools/lib/film-scenes/computing-g2/presenting-data-2.js. Both chapters keep
     the lesson's own layout - the table on the left, the block graph on the
     right - so the child watches the SAME table become the SAME graph. Every
     column is drawn from PD_FRUIT: apple 2, banana 4, orange 1, grapes 1, and
     the number above a column is the length of the stack under it. */

  /* An eye, drawn rather than the 👀 emoji: on this machine that emoji draws as
     two pale grey ovals, which at this size reads as debris in the gap between
     the table and the graph rather than as "you SAW it". */
  function pdEye(cx, cy, r, o) {
    if (!(o > 0)) return "";
    var w = r * 1.6, h = r * 0.95;
    var d = "M" + n2(cx - w) + "," + n2(cy) +
      " C" + n2(cx - w * 0.5) + "," + n2(cy - h * 1.5) + " " + n2(cx + w * 0.5) + "," + n2(cy - h * 1.5) + " " + n2(cx + w) + "," + n2(cy) +
      " C" + n2(cx + w * 0.5) + "," + n2(cy + h * 1.5) + " " + n2(cx - w * 0.5) + "," + n2(cy + h * 1.5) + " " + n2(cx - w) + "," + n2(cy) + " Z";
    return G(Pth(d, P.card, P.gold, 4) + C(cx, cy, r * 0.44, P.gold) +
      C(cx + r * 0.15, cy - r * 0.15, r * 0.14, P.card), { opacity: Math.min(1, o) });
  }

  /* the pill that names the winner, above its column */
  function pdWinnerPill(x0, p, t, breathing) {
    if (!(p > 0)) return "";
    var cx = pdColCx(x0, PD_WIN_I);
    var o = breathing ? 0.75 + 0.25 * breathe(t) : 1;
    return MK.pill(cx, 58, PD_WINNER, Math.min(1, p) * o, { size: 22, col: P.gold, ink: P.gold, fill: P.card }) +
      MK.tick(cx + 92, 58, 20, p);
  }

  /* ==== chapter: the graph ====================================================
     The table stands still on the left with all four numbers; the graph grows
     beside it. "One column for each fruit" rings each pair - the table row and
     its column - in turn; "One block for each answer" drops one child into
     every block, eight in all, which is exactly how many answers the table
     holds. On "You saw it" the table's numbers go dim and the graph still
     answers the question; on "no more data than the table" they come back. */
  function pdGraphChapter(scene, beat, t, i) {
    var cGraph = sc(scene, 0, "graph"), cColumns = sc(scene, 0, "columns");
    var cOne = sc(scene, 1, "one"), cBlock = sc(scene, 1, "block");
    var cTallest = sc(scene, 2, "tallest"), cAnswer = sc(scene, 2, "answer");
    var cSaw = sc(scene, 3, "saw");
    var cSame = sc(scene, 4, "same"), cEasy = sc(scene, 4, "easy");
    var out = "", won = pdPast(t, cTallest);

    /* how many table rows and columns have been paired up. The rings belong to
       that beat: by "the tallest column" four gold rings would compete with the
       one column the voice is naming. */
    var pairO = 1 - into(t, scene.first + 2);
    var paired = pdPast(t, cOne) && pairO > 0.02 ? tally(t, cOne, PD_FRUIT.length, 1.2) : 0;
    /* the numbers on the table go dim while the graph alone is read */
    var dim = 1 - 0.8 * on(t, cSaw, 0.5) * (1 - on(t, cSame, 0.5));

    out += pdTable(PD_TX, PD_TY, PD_TW, PD_FRUIT, {
      headL: "Fruit", headR: "How many", numberO: dim,
      rowCol: function (k) { return k < paired && pairO > 0.5 ? P.gold : null; }
    });

    var grown = on(t, cColumns, 0.6);
    out += pdGraph(PD_GX, PD_FRUIT, {
      o: on(t, cGraph, 0.5),
      built: function (k) { return PD_FRUIT[k].value * grown; },
      colCol: function (k) { return pdWinCol(k, won); },
      numberO: function () { return on(t, cColumns == null ? null : cColumns + 0.5, 0.5); },
      blockMark: function (k, j, cx, cy) {
        /* one child per block, in column order: the eight answers */
        var idx = j;
        for (var q = 0; q < k; q++) idx += PD_FRUIT[q].value;
        var p = popIn(t, cBlock == null ? null : cBlock + idx * 0.16, 0.3);
        return p > 0 ? G(Em(cx, cy + 1, 25, "\u{1F9D2}"), { transform: around(cx, cy, Math.min(1.1, p)), opacity: Math.min(1, p) }) : "";
      }
    });
    /* the column each table row turns into */
    for (var k = 0; k < paired; k++)
      out += R(pdColX(PD_GX, k) - 5, PD_G.base + 12, PD_G.colW + 10, 86, 14, "none", P.gold, 3, { opacity: 0.9 * pairO });

    /* the tallest column, and the answer it gives */
    if (won) out += L(PD_GX - 24, pdColTop(PD_FRUIT[PD_WIN_I].value) - 2,
      pdColX(PD_GX, PD_WIN_I) + PD_G.colW + 8, pdColTop(PD_FRUIT[PD_WIN_I].value) - 2,
      P.gold, 3, { "stroke-dasharray": "10 8", opacity: on(t, cTallest, 0.5) });
    out += MK.glow(pdColCx(PD_GX, PD_WIN_I), 220, 150, P.gold, on(t, cEasy, 0.6) * 0.9);
    out += pdWinnerPill(PD_GX, popIn(t, cAnswer, 0.4), t, pdPast(t, cEasy));

    /* seen, not read */
    var eye = pdOnly(t, scene, 3) * on(t, cSaw, 0.5);
    if (eye > 0) out += pdEye(578, 200, 30, eye);
    /* the same data, twice over */
    var same = on(t, cSame, 0.55);
    if (same > 0) {
      out += MK.arrow(528, 216, 612, 216, same, P.teal, 6);
      out += MK.arrow(612, 262, 528, 262, same, P.teal, 6);
      out += MK.pill(580, 52, "the same data", same, { size: 19, col: P.teal, ink: P.teal, fill: P.card });
    }
    return svg(out);
  }

  /* ==== chapter: building it ==================================================
     The empty stack areas first, all the same height, as the lesson's own
     grapher draws them; then one column at a time, a block per answer, ticked
     when it is the right height. The fifth block the banana column will not
     take is the lesson's grey button, drawn: it is dashed, crossed and gone
     again by the next beat. */
  var PD_MAXV = Math.max.apply(null, PD_FRUIT.map(function (f) { return f.value; }));

  function pdBuildChapter(scene, beat, t, i) {
    var cBuilds = sc(scene, 0, "builds"), cByCol = sc(scene, 0, "bycol");
    var cApple = sc(scene, 1, "apple"), cBanana = sc(scene, 1, "banana");
    var cOrange = sc(scene, 2, "orange"), cGrapes = sc(scene, 2, "grapes"), cBuilt = sc(scene, 2, "built");
    var cStops = sc(scene, 3, "stops"), cMany = sc(scene, 3, "many");
    var cPattern = sc(scene, 4, "pattern"), cTallest = sc(scene, 4, "tallest");
    var at = [cApple, cBanana, cOrange, cGrapes];
    var out = "", won = pdPast(t, cTallest);

    /* which column is being built now */
    var active = pdLast(t, cApple, cBanana, cOrange, cGrapes);
    if (active < 0 && pdPast(t, cByCol)) active = 0;
    if (pdPast(t, cBuilt)) active = -1;

    out += pdTable(PD_TX, PD_TY, PD_TW, PD_FRUIT, {
      headL: "Fruit", headR: "How many",
      rowCol: function (k) { return k === active || (pdPast(t, cMany) && k === PD_WIN_I) ? P.gold : null; }
    });

    out += pdGraph(PD_GX, PD_FRUIT, {
      o: on(t, cBuilds, 0.5), slots: true, slotMax: PD_MAXV,
      slotO: 1 - 0.8 * on(t, cBuilt, 0.8),
      slotCol: function (k) { return k === active ? P.gold : null; },
      built: function (k) {
        var v = PD_FRUIT[k].value;
        return at[k] == null || t < at[k] ? 0 : v * ease((t - at[k]) / (0.28 + v * 0.16));
      },
      colCol: function (k) { return pdWinCol(k, won); },
      tickP: function (k) { return popIn(t, cBuilt == null ? null : cBuilt + k * 0.18, 0.35); },
      ghost: PD_WIN_I, ghostP: popIn(t, cStops, 0.4) * pdOnly(t, scene, 3)
    });

    /* as many blocks as the table says */
    var many = on(t, cMany, 0.7) * pdOnly(t, scene, 3);
    if (many > 0) out += MK.leader(500, pdRowY(PD_TY, PD_WIN_I) + PD_T.rowH / 2,
      pdColX(PD_GX, PD_WIN_I) - 10, pdBlockY(PD_FRUIT[PD_WIN_I].value - 1) + PD_G.blockH / 2, many, P.gold);

    /* the pattern, and the answer it gives */
    out += MK.glow(pdColCx(PD_GX, PD_WIN_I), 220, 150, P.gold, on(t, cPattern, 0.7) * 0.75);
    out += pdWinnerPill(PD_GX, popIn(t, cTallest, 0.4), t, false);
    return svg(out);
  }
