  /* ==== Tidy Programs, part 2: same job fewer blocks, and go home first =======
     tools/lib/film-scenes/computing-g3/tidy-programs-2.js. See the header of
     tidy-programs.js. */

  /* ==== chapter: same job, fewer blocks ==========================================
     The lesson's own demo. The five blocks stand in a column on the left; the
     unused wait shrinks out of it, the three duplicated jumps fold into a
     repeat, and the card on the right never changes, because what the cat does
     never changes. The count pill is drawn from the number of blocks ACTUALLY
     in the column at that moment, so "five" and "three" are counted in the
     picture as well as said in the voice. */
  var TP_TIDY_NOTE = 384, TP_TIDY_COUNT = 296, TP_TIDY_EM = 960;

  function tpTidyMain(scene, t) {
    var cProg = sc(scene, 0, "prog"), cList = sc(scene, 0, "list");
    var cWait = sc(scene, 1, "wait"), cUnused = sc(scene, 1, "unused"), cOut = sc(scene, 1, "out");
    var cSame = sc(scene, 2, "same"), cCombine = sc(scene, 2, "combine"), cRepeat = sc(scene, 2, "repeat");
    var cThree = sc(scene, 3, "three"), cDoes = sc(scene, 3, "does");
    var out = "";

    var gone = on(t, cOut, 0.6), fold = on(t, cCombine, 0.7), rep = on(t, cRepeat, 0.5);
    var y5 = function (k) { return tpColY(k, 5); };
    var y4 = function (k) { return tpColY(k, 4); };
    var y3 = function (k) { return tpColY(k, 3); };
    var appear = function (k) { return popIn(t, cList == null ? null : cList + k * 0.30, 0.34); };
    var cx = TP_COL.x + TP_COL.w / 2;

    /* the three duplicated jumps: they close up as the wait leaves, slide
       together as they are combined, and hand over to the repeat pair */
    for (var k = 0; k < 3; k++) {
      var jy = lerp(lerp(y5(k), y4(k), gone), y3(1), fold);
      var s = 1 - 0.22 * fold;
      out += G(tpBlock(TP_COL.x, jy, TP_COL.w, TP_COL.h, "jump",
        { o: appear(k) * (1 - rep), ring: (tpPast(t, cSame) && fold < 0.55) ? P.gold : null }),
        { transform: around(cx, jy + TP_COL.h / 2, s) });
    }
    /* the unused wait, crossed and then taken out */
    if (gone < 1) {
      out += G(tpBlock(TP_COL.x, y5(3), TP_COL.w, TP_COL.h, "wait",
        { o: appear(3) * (1 - gone), ring: tpPast(t, cWait) ? P.bad : null,
          mark: tpPast(t, cUnused) ? "cross" : null, markP: popIn(t, cUnused, 0.35) }),
        { transform: around(cx, y5(3) + TP_COL.h / 2, 1 - 0.38 * gone) });
    }
    /* say hello, which never changes */
    var sy = lerp(lerp(y5(4), y4(3), gone), y3(2), fold);
    out += tpBlock(TP_COL.x, sy, TP_COL.w, TP_COL.h, "say", { o: appear(4) });
    /* the repeat block and the one block it repeats */
    if (rep > 0) {
      ["repeat3", "jump"].forEach(function (id, n) {
        var y = y3(n);
        out += G(tpBlock(TP_COL.x, y, TP_COL.w, TP_COL.h, id, { o: rep, ring: P.good }),
          { transform: around(cx, y + TP_COL.h / 2, 0.74 + 0.26 * rep) });
      });
    }

    /* the job, in the kit's own words, and it is the same line all through */
    out += tpCardBox("The job", TP_JOB, on(t, cProg, 0.5),
      { col: tpPast(t, cDoes) ? P.good : null, mark: TP_SAME ? "tick" : "cross", markP: popIn(t, cDoes, 0.4) });

    /* how many blocks are in the column right now */
    var n = tpPast(t, cRepeat) ? 3 : tpPast(t, cOut) ? 4 : 5;
    out += tpCount(620, TP_TIDY_COUNT, n, on(t, cProg, 0.5), n === 3 ? P.good : n === 5 ? P.bad : P.gold);

    /* the lesson's word for what is wrong, then for what it now is */
    var note = tpPast(t, cThree) ? { text: "clear and concise", at: cThree, col: P.good }
      : tpPast(t, cSame) ? { text: "duplicate", at: cSame, col: P.gold }
        : { text: "unused command", at: cUnused, col: P.bad };
    out += MK.pill(620, TP_TIDY_NOTE, note.text, on(t, note.at, 0.4), { size: 26, col: note.col, ink: note.col });

    out += MK.pop(Em(TP_TIDY_EM, 322, 94, "\u{23F3}"), TP_TIDY_EM, 322,
      popIn(t, cWait, 0.4) * (1 - on(t, cSame, 0.4)));
    out += MK.pop(Em(TP_TIDY_EM, 322, 94, "\u{1F501}"), TP_TIDY_EM, 322,
      popIn(t, cSame, 0.4) * (1 - on(t, cThree, 0.4)));
    out += MK.pop(Em(TP_TIDY_EM, 322, 94, "\u{1F9F9}"), TP_TIDY_EM, 322, popIn(t, cThree, 0.4));
    return out;
  }

  /* the last beat: the two programs side by side, counted, with the one line
     of what the cat does under both of them */
  var TP_CMP = { lx: 118, rx: 750, w: 300, h: 46, gap: 9, top: 30 };
  function tpTidyCompare(scene, t) {
    var cLess = sc(scene, 4, "less"), cEasier = sc(scene, 4, "easier");
    var out = "", ring = on(t, cEasier, 0.5);
    var lh = TP_LONG.length * (TP_CMP.h + TP_CMP.gap) - TP_CMP.gap;
    var rh = TP_SHORT.length * (TP_CMP.h + TP_CMP.gap) - TP_CMP.gap;
    var rtop = TP_CMP.top + (lh - rh) / 2;

    TP_LONG.forEach(function (id, k) {
      out += tpBlock(TP_CMP.lx, TP_CMP.top + k * (TP_CMP.h + TP_CMP.gap), TP_CMP.w, TP_CMP.h, id, {});
    });
    TP_SHORT.forEach(function (id, k) {
      out += tpBlock(TP_CMP.rx, rtop + k * (TP_CMP.h + TP_CMP.gap), TP_CMP.w, TP_CMP.h, id,
        { ring: ring > 0.5 ? P.good : null });
    });
    out += MK.pop(Tx(584, 180, "=", "lab", "middle", { "font-size": 64, fill: P.gold }), 584, 163, popIn(t, cLess, 0.4));
    out += tpCount(TP_CMP.lx + TP_CMP.w / 2, 322, TP_LONG.length, popIn(t, cLess, 0.4), P.muted);
    out += tpCount(TP_CMP.rx + TP_CMP.w / 2, 322, TP_SHORT.length, popIn(t, cLess, 0.4), P.good);
    out += MK.pill(TP_CMP.rx + TP_CMP.w / 2, 272, "easier to read", on(t, cEasier, 0.45),
      { size: 25, col: P.good, ink: P.good });
    var card = popIn(t, cLess == null ? null : cLess + 0.35, 0.4);
    if (card > 0) {
      out += G(R(TP_CMP.lx, 362, 932, 64, 18, P.card, ring > 0.5 ? P.good : P.line, ring > 0.5 ? 3.5 : 2) +
        Tx(TP_CMP.lx + 30, 403, "The cat does: " + TP_JOB, "lab big", "start"),
        { opacity: Math.min(1, card) });
      out += MK.tick(1012, 394, 22, popIn(t, cLess == null ? null : cLess + 0.7, 0.4) * (TP_SAME ? 1 : 0));
    }
    return out;
  }

  function tpTidyChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(tpTidyMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(tpTidyCompare(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: go home first ====================================================
     The lesson's resetter round: the cat was left two squares along and big by
     the program before. Both runs are the KIT'S - ART.run with that start
     state, with and without a go home block at the top - so the cat really
     does finish on square 3 without the reset and square 1 with it. */
  function tpResetCard(scene, t, j) {
    var cLeft = sc(scene, 0, "leftit"), cBig = sc(scene, 0, "big");
    var cMoves = sc(scene, 1, "moves"), cWrong = sc(scene, 1, "wrong");
    var cHome = sc(scene, 2, "home"), cBack = sc(scene, 2, "back");
    var cNow = sc(scene, 3, "now"), cEnds = sc(scene, 3, "ends"), cEvery = sc(scene, 3, "every");
    var cInit = sc(scene, 4, "init");
    var b = TP_CARD;
    if (j === 0)
      return tpCardBox("Where the cat is now", "square " + TP_START.x + ", and bigger than it started",
        1, { sub: "the program before left it there", col: tpPast(t, cBig) ? P.gold : null });
    /* a card never says where the cat stopped until it has stopped there */
    if (j === 1)
      return tpCardBox("Move right, then jump", tpPast(t, cMoves) ? "the cat stops on square " + TP_NOHOME.x : null, 1,
        { sub: tpPast(t, cMoves) ? "the moves are right, the place is wrong" : null, subCol: tpPast(t, cWrong) ? P.bad : P.muted,
          col: tpPast(t, cWrong) ? P.bad : null, ink: tpPast(t, cWrong) ? P.bad : null,
          mark: "cross", markP: popIn(t, cWrong, 0.4) });
    if (j === 2)
      return tpCardBox("Go home, move right, jump", tpPast(t, cBack) ? "the cat starts from square 0 again" : null, 1,
        { sub: tpPast(t, cBack) ? "back at the start, normal size" : null, col: tpPast(t, cBack) ? P.good : null,
          mark: "tick", markP: popIn(t, cBack, 0.4) });
    if (j === 3) {
      var rows = [
        { text: "run 1 stops on square " + TP_WITHHOME.x, at: cNow, mark: "tick" },
        { text: "run 2 stops on square " + TP_WITHHOME.x, at: cEnds, mark: "tick" },
        { text: "run 3 stops on square " + TP_WITHHOME.x, at: cEvery, mark: "tick" }
      ];
      return G(R(b.x, b.y, b.w, b.h, 22, P.card, tpPast(t, cEvery) ? P.good : P.line, tpPast(t, cEvery) ? 3.5 : 2) +
        Tx(b.x + 30, b.y + 40, "Every single time", "lab mid caps muted", "start") +
        MK.list(b.x + 30, b.y + 76, rows, t, { lh: 40, cls: "lab", markR: 14 }), {});
    }
    return G(R(b.x, b.y, b.w, b.h, 22, P.card, P.accent, 3.5) +
      Tx(b.x + 30, b.y + 44, "The word for it", "lab mid caps muted", "start") +
      MK.pill(b.x + 250, b.y + 104, "initialisation", popIn(t, cInit, 0.45), { size: 32, col: P.accent, ink: P.accent }) +
      Tx(b.x + 30, b.y + 156, "setting everything back at the start of a program", "lab mid", "start", { fill: P.muted }), {});
  }

  function tpResetChapter(scene, beat, t, i) {
    var cLeft = sc(scene, 0, "leftit"), cTwo = sc(scene, 0, "two"), cBig = sc(scene, 0, "big");
    var cRun = sc(scene, 1, "run"), cMoves = sc(scene, 1, "moves"), cWrong = sc(scene, 1, "wrong");
    var cHome = sc(scene, 2, "home"), cTop = sc(scene, 2, "top"), cBack = sc(scene, 2, "back");
    var cNow = sc(scene, 3, "now"), cEnds = sc(scene, 3, "ends"), cEvery = sc(scene, 3, "every");
    var cBack2 = sc(scene, 4, "back"), cInit = sc(scene, 4, "init");
    var out = "";

    /* the column: move right and jump, with go home sliding in above them */
    var ins = on(t, cHome, 0.6), cx = TP_COL.x + TP_COL.w / 2;
    var y2 = function (k) { return tpColY(k, 2); };
    var y3 = function (k) { return tpColY(k, 3); };
    ["right", "jump"].forEach(function (id, k) {
      var y = lerp(y2(k), y3(k + 1), ins);
      out += tpBlock(TP_COL.x, y, TP_COL.w, TP_COL.h, id,
        { o: 1, dimmed: !tpPast(t, cRun), ring: (tpPast(t, cMoves) && !tpPast(t, cHome)) ? P.good : null });
    });
    if (ins > 0) {
      out += G(tpBlock(TP_COL.x, y3(0), TP_COL.w, TP_COL.h, "home",
        { o: ins, ring: tpPast(t, cTop) ? P.gold : null, mark: tpPast(t, cBack) ? "tick" : null,
          markP: popIn(t, cBack, 0.35) }),
        { transform: around(cx, y3(0) + TP_COL.h / 2, 0.74 + 0.26 * ins) });
      out += MK.arrow(cx, y3(0) - 54, cx, y3(0) - 8, on(t, cTop, 0.45) * (1 - on(t, cBack, 0.5)), P.gold, 8);
    }

    /* where the cat is, all of it the kit's arithmetic */
    var u1 = on(t, cRun == null ? null : cRun + 0.35, 0.9);
    var u2 = on(t, cBack, 0.7);
    var u3 = on(t, cNow == null ? null : cNow + 0.25, 0.8);
    var u4 = on(t, cBack2, 0.7);
    var x = lerp(TP_START.x, TP_NOHOME.x, u1);
    x = lerp(x, 0, u2);
    x = lerp(x, TP_WITHHOME.x, u3);
    x = lerp(x, 0, u4);
    var scale = lerp(TP_START.scale, TP_WITHHOME.scale, Math.max(u2, u4));
    var hop = Math.max(bump(t, cRun == null ? null : cRun + 1.15, 0.5),
      Math.max(bump(t, cNow == null ? null : cNow + 0.85, 0.5),
        bump(t, cEvery == null ? null : cEvery + 0.2, 0.5)));
    var appear = popIn(t, cLeft, 0.45);

    out += tpStage({ x: x, scale: scale }, { home: true, hop: hop, catPop: appear });
    /* the wrong square, flashed under the cat that stopped on it */
    var wrong = on(t, cWrong, 0.5) * (1 - on(t, cBack, 0.5));
    if (wrong > 0)
      out += R(tpSqX(TP_NOHOME.x) - 38, TP_ST.ground + 5, 76, 30, 8, P.bad, null, null, { opacity: 0.55 * wrong });
    /* how far from home it was left */
    out += MK.arrow(tpSqX(0), TP_ST.ground - 110, tpSqX(TP_START.x) - 26, TP_ST.ground - 110,
      on(t, cTwo, 0.55) * (1 - on(t, cRun, 0.45)), P.gold, 7);
    /* bigger than it started */
    var big = on(t, cBig, 0.5) * (1 - on(t, cRun, 0.5));
    if (big > 0)
      out += C(tpSqX(TP_START.x), TP_ST.ground - 30 * TP_START.scale, 52 + 3 * breathe(t),
        "none", P.gold, 4, { opacity: big });
    out += MK.cross(tpSqX(TP_NOHOME.x), TP_ST.ground - 112, 24, popIn(t, cWrong, 0.4) * (1 - on(t, cBack, 0.5)));
    out += MK.tick(tpSqX(TP_WITHHOME.x), TP_ST.ground - 108, 24, popIn(t, cEnds, 0.4) * (1 - on(t, cBack2, 0.5)));
    out += MK.ripple(tpSqX(0), TP_ST.ground - 22, t, cBack, P.good);
    out += MK.ripple(tpSqX(0), TP_ST.ground - 22, t, cBack2, P.accent);

    out += crossfade(t, i, scene, function (j) { return tpResetCard(scene, t, j - scene.first); });
    return svg(out);
  }
