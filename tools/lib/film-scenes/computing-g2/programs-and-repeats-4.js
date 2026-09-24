  /* ==== Programs and Repeats, part 4: ScratchJr, the recap, and the kinds =====
     tools/lib/film-scenes/computing-g2/programs-and-repeats-4.js. See the
     header of programs-and-repeats.js.

     The tablet is the lesson kit's own (ART.figure("tablet")), and the app on
     its screen is drawn on top of it. The two blocks on the left of the
     mapping are the lesson's own; the two on the right are what the lesson
     says ScratchJr calls them - a loop block with a 3 in it, and a green flag
     for Go - drawn rather than borrowed, because the film has no ScratchJr. */

  var PR_TAB = { x: 70, y: 24, w: 270, h: 392 };
  function prTX(u) { return PR_TAB.x + u * PR_TAB.w / 260; }
  function prTY(v) { return PR_TAB.y + v * PR_TAB.h / 378; }
  var PR_SCR = { x: prTX(38), y: prTY(46), w: prTX(222) - prTX(38), h: prTY(312) - prTY(46) };

  /* a green flag, drawn: the emoji flags all carry their own colours */
  function prFlag(x, y, s, o) {
    if (!(o > 0)) return "";
    return G(L(x, y - s * 0.55, x, y + s * 0.55, P.plastic, s * 0.12) +
      Pth("M" + n2(x + s * 0.06) + "," + n2(y - s * 0.52) + " L" + n2(x + s * 0.78) + "," + n2(y - s * 0.22) +
        " L" + n2(x + s * 0.06) + "," + n2(y + s * 0.08) + " Z", P.good, P.good, 2),
      { opacity: Math.min(1, o) });
  }
  /* a patch of sky and grass: the background a child picks */
  function prScene(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 6, P.sky) +
      Pth("M" + n2(x) + "," + n2(y + h) + " L" + n2(x) + "," + n2(y + h * 0.62) +
        " Q" + n2(x + w * 0.32) + "," + n2(y + h * 0.34) + " " + n2(x + w * 0.62) + "," + n2(y + h * 0.60) +
        " Q" + n2(x + w * 0.82) + "," + n2(y + h * 0.74) + " " + n2(x + w) + "," + n2(y + h * 0.58) +
        " L" + n2(x + w) + "," + n2(y + h) + " Z", P.grass),
      { opacity: Math.min(1, o) });
  }
  /* one of the app's own blocks on the tablet screen: too small for words */
  function prAppBlock(x, y, w, h, icon, col, badge, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 7, col, col, 2, { "fill-opacity": 0.28 }) +
      Em(x + h * 0.62, y + h / 2, h * 0.62, icon) +
      (badge ? C(x + w - h * 0.6, y + h / 2, h * 0.30, P.ground, col, 2) +
        Tx(x + w - h * 0.6, y + h / 2 + h * 0.16, badge, "lab", "middle", { fill: col, "font-size": h * 0.44 }) : ""),
      { opacity: Math.min(1, o) });
  }

  /* ==== chapter: where you really build these =================================== */

  var PR_CARD = { x: 400, w: 720, h: 88, y: [58, 176, 294] };

  function prScratchChapter(scene, beat, t, i) {
    var cLike = sc(scene, 0, "like"), cName = sc(scene, 0, "scratchjr"), cTab = sc(scene, 0, "tablet");
    var cChar = sc(scene, 1, "character"), cBack = sc(scene, 1, "background"), cDrag = sc(scene, 1, "drag");
    var cLoop = sc(scene, 2, "loop"), cFlag = sc(scene, 2, "flag");
    var out = "", S = PR_SCR;
    var tab = popIn(t, cName, 0.55), right = into(t, scene.first + 2);

    /* the tablet, and the app open on it */
    if (tab > 0) {
      var fig = ART.figure("tablet");
      if (prPast(t, cTab)) fig = ART.ring(fig, "screen", P.teal, 6);
      out += G(ART.place(fig, PR_TAB.x, PR_TAB.y, PR_TAB.w, PR_TAB.h),
        { opacity: Math.min(1, tab), transform: around(PR_TAB.x + PR_TAB.w / 2, PR_TAB.y + PR_TAB.h / 2, Math.min(1.05, tab)) });
      out += G(R(S.x, S.y, S.w, S.h, 6, P.ground), { opacity: Math.min(1, tab) });
      out += prScene(S.x + 8, S.y + 34, S.w - 16, 108, on(t, cBack, 0.6));
      out += prFlag(S.x + 22, S.y + 18, 26, Math.min(1, tab));
      out += MK.pill(S.x + S.w - 62, S.y + 18, "ScratchJr", Math.min(1, tab), { size: 17, col: P.teal, ink: P.teal, fill: P.card });
      out += MK.pop(Em(S.x + S.w * 0.52, S.y + 108, 46, PR_CAT), S.x + S.w * 0.52, S.y + 108, popIn(t, cChar, 0.45));
      /* the blocks a child drags together */
      var dg = on(t, cDrag, 0.7), slid = tally(t, cDrag, 3, 0.8);
      [{ ic: prIcon("repeat3"), col: P.gold, b: "3" }, { ic: prIcon("jump"), col: P.blue, b: null },
        { ic: prIcon("spin"), col: P.blue, b: null }].forEach(function (bk, k) {
        if (k >= slid) return;
        var y = S.y + 172 + k * 34;
        out += prAppBlock(S.x + 12 + (1 - dg) * 36, y, S.w - 24, 28, bk.ic, bk.col, bk.b, 1);
      });
    }

    /* "these blocks": the two the child has been using all lesson, until the
       cards that describe the app take their place */
    var mine = popIn(t, cLike, 0.5) * (1 - on(t, cChar, 0.5));
    if (mine > 0) {
      out += G(MK.pill(670, 100, "your blocks", 1, { size: 24, col: P.muted, ink: P.muted }) +
        prBlock(460, 156, 420, 72, "repeat3") + prBlock(460, 252, 420, 72, "jump"),
        { opacity: Math.min(1, mine) });
    }

    /* what the child does, one card per thing, while it happens on the screen */
    var cardAt = [cChar, cBack, cDrag], word = ["choose a character", "choose a background", "drag blocks together"];
    if (right < 1) {
      var cards = "";
      cardAt.forEach(function (at, k) {
        var o = popIn(t, at, 0.45);
        if (!(o > 0)) return;
        var y = PR_CARD.y[k];
        cards += G(R(PR_CARD.x, y, PR_CARD.w, PR_CARD.h, 20, P.card, P.line, 3) +
          (k === 1 ? prScene(PR_CARD.x + 28, y + 22, 58, 44, 1)
            : MK.pic(PR_CARD.x + 56, y + PR_CARD.h / 2, 44, k === 0 ? PR_CAT : "\u{1F9E9}")) +
          Tx(PR_CARD.x + 110, y + PR_CARD.h / 2 + 11, word[k], "lab big", "start"),
          { opacity: Math.min(1, o), transform: around(PR_CARD.x + PR_CARD.w / 2, y + PR_CARD.h / 2, Math.min(1.04, o)) });
      });
      out += G(cards, { opacity: 1 - right });
    }

    /* the same two things, in this app's words and in ScratchJr's */
    if (right > 0) {
      var rows = "", pL = popIn(t, cLoop, 0.5), pF = popIn(t, cFlag, 0.5);
      rows += G(prBlock(PR_CARD.x, 96, 300, 66, "repeat3", { size: 22 }) +
        MK.arrow(716, 129, 792, 129, Math.min(1, pL), P.gold, 7) +
        R(812, 96, 300, 66, 20, P.cell, P.gold, 3) +
        Em(852, 129, 34, prIcon("repeat3")) +
        Tx(886, 140, "loop", "lab big", "start") +
        C(1074, 129, 22, P.ground, P.gold, 3) + Tx(1074, 137, "3", "lab", "middle", { fill: P.gold, "font-size": 26 }),
        { opacity: Math.min(1, pL) });
      rows += G(prRunBtn(PR_CARD.x + 150, 296, 220, 1, false) +
        MK.arrow(716, 296, 792, 296, Math.min(1, pF), P.good, 7) +
        R(812, 258, 300, 76, 20, P.cell, P.good, 3) +
        prFlag(866, 296, 46, 1) +
        Tx(910, 307, "green flag", "lab big", "start"),
        { opacity: Math.min(1, pF) });
      out += G(rows, { opacity: right });
    }
    return svg(out);
  }

  /* ==== what you now know =======================================================
     The lesson's own six words, with the lesson's own pictures for them. */
  var PR_RECAP = MK.recapKind([
    { beat: 0, at: "algorithm", title: "Algorithm", sub: "the plan, in words", pic: "\u{1F4CB}" },
    { beat: 0, at: "program", title: "Program", sub: "the plan in blocks", pic: "\u{1F9E9}" },
    { beat: 1, at: "repeat", title: "Repeat", sub: "repeats the block after it", pic: "\u{1F501}" },
    { beat: 2, at: "output", title: "Output", sub: "what the program makes happen", pic: "\u{1F381}" },
    { beat: 2, at: "test", title: "Test", sub: "run it and check", pic: "\u{1F50E}" }
  ], { goBeat: 2, goAt: "test" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "What an algorithm is, and what a program is",
      "How one repeat block says jump three times",
      "Why you test a little bit at a time"
    ] }),
    plan: prPlanChapter, build: prBuildChapter, repeat: prRepeatChapter,
    same: prSameChapter, test: prTestChapter, scratchjr: prScratchChapter,
    recap: PR_RECAP
  };
