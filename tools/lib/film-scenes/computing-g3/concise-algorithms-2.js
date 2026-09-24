  /* ==== Concise Algorithms, part 2: cutting the waste ==========================
     tools/lib/film-scenes/computing-g3/concise-algorithms-2.js. See the header
     of concise-algorithms.js.

     The lesson's two trim activities, drawn by the lesson's own cake and
     present scenes. The film says the short algorithm does the same job as the
     long one, so the check at the foot of this comment runs as the page loads:
     the kit's picture of the ten-step cake and its picture of the seven-step
     cake are the same markup, and the same for the present's nine and six.
     If a step id ever stops being ignored by a scene, the film refuses to
     render rather than claim a sameness it no longer has. */

  /* ---- a list that loses steps ------------------------------------------------
     Each removed row slides its successors up as it goes (its own progress, 0
     to 1), and the whole list grows taller as it gets shorter, so seven big
     rows fill the same box that ten small ones did. */
  function caFlow(n, removed) {
    var slots = [], acc = 0;
    for (var k = 0; k < n; k++) { slots.push(k - acc); acc += removed[k] || 0; }
    return { slots: slots, gone: acc };
  }
  function caLayout(total, gone, big, small) {
    var u = clamp(gone / Math.max(total - small.n, 1), 0, 1);
    var h = lerp(big.h, small.h, u), gap = lerp(big.gap, small.gap, u);
    var span = (total - gone) * (h + gap) - gap;
    return { h: h, gap: gap, top: (440 - span) / 2, u: u,
      y: function (slot) { return (440 - span) / 2 + slot * (h + gap); } };
  }

  var CA_LIST = { x: 40, w: 502 };

  /* ---- the lesson's two algorithms, exactly as its steps list them ------------ */
  var CA_CAKE = ["bowl", "flour", "phone", "eggs", "mix", "mix2", "hat", "tin", "oven", "cool"];
  var CA_CAKE_WASTE = [2, 5, 6];
  /* the ids the KIT understands; it ignores phone and hat, and a second mix
     changes nothing, which is exactly why the two pictures are the same */
  var CA_CAKE_LONG = ["bowl", "flour", "phone", "eggs", "mix", "mix", "hat", "tin", "oven", "cool"];
  var CA_CAKE_SHORT = ["bowl", "flour", "eggs", "mix", "tin", "oven", "cool"];

  var CA_PRES = ["box", "lid", "paper", "unwrap", "paper2", "tape", "ribbon", "count", "tag"];
  var CA_PRES_WASTE = [3, 4, 7];
  var CA_PRES_LONG = ["box", "lid", "paper", "unwrap", "paper", "tape", "ribbon", "count", "tag"];
  var CA_PRES_SHORT = ["box", "lid", "paper", "tape", "ribbon", "tag"];

  /* THE CHECK. The kit builds each scene's aria-label out of the ids it was
     given, so that one line differs by construction; everything the child sees
     must not. */
  (function () {
    var bare = function (s) { return String(s).replace(/ aria-label="[^"]*"/, ""); };
    [["cake", CA_CAKE_LONG, CA_CAKE_SHORT, "ten", "seven"],
     ["present", CA_PRES_LONG, CA_PRES_SHORT, "nine", "six"]].forEach(function (c) {
      if (bare(ART.scene(c[0], c[1])) !== bare(ART.scene(c[0], c[2])))
        throw new Error("Concise Algorithms: the " + c[3] + "-step " + c[0] + " and the " + c[4] +
          "-step one no longer draw the same picture, so this film must not say they do");
    });
  })();

  /* ==== chapter: cut the waste, a cake ===========================================
     Ten rows on the left and the lesson's cake on the right. The three wasteful
     steps are marked as the voice names them and cut together; the seven that
     are left close up, grow and renumber - and the cake does not move, because
     the kit draws the same cake from either list. */
  var CA_CAKE_BIG = { h: 38, gap: 5 }, CA_CAKE_SMALL = { n: 7, h: 52, gap: 8 };

  function caCakeChapter(scene, beat, t, i) {
    var cAlg = sc(scene, 0, "algorithm"), cTen = sc(scene, 0, "ten");
    var cPhone = sc(scene, 1, "phone"), cNothing = sc(scene, 1, "nothing");
    var cMix = sc(scene, 2, "mix"), cAgain = sc(scene, 2, "again"), cAlready = sc(scene, 2, "already");
    var cSecond = sc(scene, 3, "second"), cHat = sc(scene, 3, "hat"), cCut = sc(scene, 3, "cut");
    var cSeven = sc(scene, 4, "seven"), cEvery = sc(scene, 4, "every");
    var cAsk = sc(scene, 5, "ask"), cBaked = sc(scene, 5, "baked");
    var out = "", cut = on(t, cCut, 0.9);

    /* the lesson's cake, run from the TEN steps and then held by the SEVEN */
    var built = tally(t, cAlg, 10, 1.7);
    out += caScene("cake", caPast(t, cCut) ? CA_CAKE_SHORT : CA_CAKE_LONG.slice(0, built), on(t, cAlg, 0.5));

    var removed = {};
    CA_CAKE_WASTE.forEach(function (k) { removed[k] = cut; });
    var flow = caFlow(CA_CAKE.length, removed);
    var lay = caLayout(CA_CAKE.length, flow.gone, CA_CAKE_BIG, CA_CAKE_SMALL);
    var ticks = tally(t, cEvery, 7, 1.6), kept = -1;

    CA_CAKE.forEach(function (id, k) {
      var waste = CA_CAKE_WASTE.indexOf(k) >= 0;
      if (!waste) kept++;
      var o = on(t, cAlg == null ? null : cAlg + k * 0.13, 0.35);
      if (!(o > 0)) return;
      var slot = flow.slots[k], y = lay.y(slot);
      var col = null, mark = null, mp = 0;
      if (k === 2) { col = caPast(t, cNothing) ? P.bad : caPast(t, cPhone) ? P.gold : null;
        mark = caPast(t, cNothing) ? "cross" : null; mp = popIn(t, cNothing, 0.4); }
      if (k === 4) col = caPast(t, cMix) && !caPast(t, cSecond) ? P.gold : null;
      if (k === 5) { col = caPast(t, cSecond) ? P.bad : caPast(t, cAgain) ? P.gold : null;
        mark = caPast(t, cSecond) ? "cross" : null; mp = popIn(t, cSecond, 0.4); }
      if (k === 6) { col = caPast(t, cHat) ? P.bad : null;
        mark = caPast(t, cHat) ? "cross" : null; mp = popIn(t, cHat, 0.4); }
      if (!waste && caPast(t, cEvery) && ticks > kept) { mark = "tick"; col = P.good;
        mp = popIn(t, cEvery == null ? null : cEvery + kept * 0.22, 0.35); }
      var row = caRow(CA_LIST.x, y, CA_LIST.w, lay.h, Math.round(slot) + 1, id,
        { o: o, col: col, mark: mark, markP: mp });
      if (waste && cut > 0) {
        if (cut >= 1) return;
        out += G(row, { opacity: 1 - cut,
          transform: around(CA_LIST.x + CA_LIST.w / 2, y + lay.h / 2, 1 - 0.4 * cut) });
        return;
      }
      out += row;
    });

    /* "It is already mixed": the two mix steps boxed together, the same mark
       the present chapter puts round its two undoing steps. It used to ring the
       bowl in the lesson's own cake - but by this beat the kit has the batter
       in the tin and the bowl it drew is EMPTY, so the words said "already
       mixed" over a picture of an empty bowl (rule 8). The two rows are what
       the sentence is about. */
    var mixBox = on(t, cAlready, 0.5) * (1 - on(t, cSecond, 0.5));
    if (mixBox > 0) {
      var my4 = lay.y(flow.slots[4]) - 5, my5 = lay.y(flow.slots[5]) + lay.h + 5;
      out += R(CA_LIST.x - 6, my4, CA_LIST.w + 12, my5 - my4, 14, "none", P.gold, 4, { opacity: mixBox });
    }
    /* the scissors that cut all three */
    out += MK.pop(Em(CA_LIST.x + CA_LIST.w - 40, lay.y(flow.slots[5]) + lay.h / 2, 56, "✂️"),
      CA_LIST.x + CA_LIST.w - 40, lay.y(flow.slots[5]) + lay.h / 2, popIn(t, cCut, 0.4) * (1 - cut));
    /* seven left, and a chip that counts them */
    out += MK.pill(caSX(56), caSY(22), "10 steps", on(t, cTen, 0.45) * (1 - on(t, cCut, 0.4)),
      { size: 22, col: P.muted, ink: P.muted });
    out += MK.pill(caSX(56), caSY(22), "7 steps", on(t, cSeven, 0.45), { size: 22, col: P.good, ink: P.good });
    /* the test: cut this, and does the cake still get baked? */
    var ask = on(t, cAsk, 0.5);
    if (ask > 0) out += R(CA_LIST.x - 10, lay.top - 10, CA_LIST.w + 20, 440 - 2 * lay.top + 20, 14,
      "none", P.gold, 3, { "stroke-dasharray": "12 9", opacity: ask });
    out += MK.tick(caSX(282), caSY(36), 32, popIn(t, cBaked, 0.42));
    return svg(out);
  }

  /* ==== chapter: wrap, unwrap, wrap again =========================================
     The present for Nora. The two steps that undo each other are shown UNDOING
     each other first - the kit draws the paper off and then on again, from the
     film handing it the shorter list and then the longer one - and only then
     are they cut. */
  var CA_PRES_BIG = { h: 42, gap: 6 }, CA_PRES_SMALL = { n: 6, h: 60, gap: 10 };

  function caPresentChapter(scene, beat, t, i) {
    var cNora = sc(scene, 0, "nora"), cNine = sc(scene, 0, "nine"), cWaste = sc(scene, 0, "waste");
    var cWrap = sc(scene, 1, "wrap"), cUnwrap = sc(scene, 1, "unwrap"), cAgain = sc(scene, 1, "again");
    var cUndo = sc(scene, 2, "undo"), cCutBoth = sc(scene, 2, "cutboth"), cStays = sc(scene, 2, "stays");
    var cCount = sc(scene, 3, "count"), cNothing = sc(scene, 3, "nothing"), cCutIt = sc(scene, 3, "cutit");
    var cSix = sc(scene, 4, "six"), cList = sc(scene, 4, "list"), cTag = sc(scene, 4, "tag");
    var out = "", cutA = on(t, cCutBoth, 0.85), cutB = on(t, cCutIt, 0.8);

    /* the lesson's present, from whichever list the film is holding */
    var ids = [];
    if (caPast(t, cList)) ids = CA_PRES_SHORT.slice(0, Math.max(3, tally(t, cList, 6, 1.7)));
    else if (caPast(t, cAgain)) ids = ["box", "lid", "paper"];
    else if (caPast(t, cUnwrap)) ids = ["box", "lid"];
    else if (caPast(t, cWrap)) ids = ["box", "lid", "paper"];
    else if (caPast(t, cNine)) ids = ["box", "lid"];
    out += caScene("present", ids, on(t, cNora, 0.5));

    var removed = { 3: cutA, 4: cutA, 7: cutB };
    var flow = caFlow(CA_PRES.length, removed);
    var lay = caLayout(CA_PRES.length, flow.gone, CA_PRES_BIG, CA_PRES_SMALL);
    var ticks = tally(t, cList, 6, 1.7), kept = -1;

    CA_PRES.forEach(function (id, k) {
      var waste = CA_PRES_WASTE.indexOf(k) >= 0;
      if (!waste) kept++;
      var o = on(t, cNine == null ? null : cNine + k * 0.12, 0.35);
      if (!(o > 0)) return;
      var slot = flow.slots[k], y = lay.y(slot);
      var col = null, mark = null, mp = 0;
      if (k === 3 || k === 4) {
        var lit = k === 3 ? cUnwrap : cAgain;
        col = caPast(t, cUndo) ? P.bad : caPast(t, lit) ? P.gold : null;
        mark = caPast(t, cUndo) ? "cross" : null; mp = popIn(t, cUndo == null ? null : cUndo + (k - 3) * 0.2, 0.4);
      }
      if (k === 2) col = caPast(t, cWrap) && !caPast(t, cUndo) ? P.gold : null;
      if (k === 7) { col = caPast(t, cNothing) ? P.bad : caPast(t, cCount) ? P.gold : null;
        mark = caPast(t, cNothing) ? "cross" : null; mp = popIn(t, cNothing, 0.4); }
      if (!waste && caPast(t, cList) && ticks > kept) { mark = "tick"; col = P.good;
        mp = popIn(t, cList == null ? null : cList + kept * 0.24, 0.35); }
      var row = caRow(CA_LIST.x, y, CA_LIST.w, lay.h, Math.round(slot) + 1, id,
        { o: o, col: col, mark: mark, markP: mp });
      var goes = waste ? (k === 7 ? cutB : cutA) : 0;
      if (goes > 0) {
        if (goes >= 1) return;
        out += G(row, { opacity: 1 - goes,
          transform: around(CA_LIST.x + CA_LIST.w / 2, y + lay.h / 2, 1 - 0.4 * goes) });
        return;
      }
      out += row;
    });

    /* the three wasteful steps, flashed as the first line names them */
    var fw = bump(t, cWaste, 1.6);
    if (fw > 0.02) CA_PRES_WASTE.forEach(function (k) {
      out += R(CA_LIST.x - 5, lay.y(flow.slots[k]) - 5, CA_LIST.w + 10, lay.h + 10, lay.h * 0.34,
        "none", P.bad, 4, { opacity: fw });
    });
    /* the two steps that undo each other, boxed together while they are named
       (the brace this replaced sat at x = -4, off the left of the 1168 box) */
    var un = on(t, cUndo, 0.5) * (1 - cutA);
    if (un > 0) {
      var y3 = lay.y(flow.slots[3]) - 5, y4 = lay.y(flow.slots[4]) + lay.h + 5;
      out += R(CA_LIST.x - 6, y3, CA_LIST.w + 12, y4 - y3, 14, "none", P.bad, 4, { opacity: un });
    }
    out += MK.pop(Em(CA_LIST.x + CA_LIST.w - 40, lay.y(flow.slots[3]) + lay.h, 54, "✂️"),
      CA_LIST.x + CA_LIST.w - 40, lay.y(flow.slots[3]) + lay.h, popIn(t, cCutBoth, 0.4) * (1 - cutA));
    out += MK.pop(Em(CA_LIST.x + CA_LIST.w - 40, lay.y(flow.slots[7]) + lay.h / 2, 54, "✂️"),
      CA_LIST.x + CA_LIST.w - 40, lay.y(flow.slots[7]) + lay.h / 2, popIn(t, cCutIt, 0.4) * (1 - cutB));
    /* the paper stays on, and six steps are left */
    out += MK.tick(caSX(282), caSY(36), 30, popIn(t, cStays, 0.42) * (1 - on(t, cCount, 0.4)));
    out += MK.pill(caSX(56), caSY(22), "9 steps", on(t, cNine, 0.45) * (1 - on(t, cCutBoth, 0.4)),
      { size: 22, col: P.muted, ink: P.muted });
    out += MK.pill(caSX(56), caSY(22), "6 steps", on(t, cSix, 0.45), { size: 22, col: P.good, ink: P.good });
    out += MK.tick(caSX(282), caSY(36), 30, popIn(t, cTag, 0.42));
    return svg(out);
  }
