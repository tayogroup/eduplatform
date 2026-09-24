  /* ==== Many Things at Once, part 2 ==========================================
     The chapters "Whose script is this?" and "A static object". See
     many-things-at-once.js for the helpers and for why the stage is drawn
     rather than lifted. */

  /* ==== chapter: whose script is this? ==========================================
     The lesson's own tab step, and the misconception it exists to correct.
     One panel, and which object's script is in it depends on the tab last
     tapped: tap the cat, build two blocks; tap the dog, build two more; press
     Run and both go. Then build BOTH scripts on the cat, and the dog is left
     with nothing to do - which is the child's own mistake, drawn. */

  var MTO_TAB_A = { x: 28, y: 120, w: 180, h: 56 };
  var MTO_TAB_B = { x: 222, y: 120, w: 180, h: 56 };
  var MTO_TAB_PANEL = { x: 28, y: 186, w: 460, h: 236 };
  var MTO_TAB_ROW = { x: 52, w: 412, h: 48, gap: 8, top: 198 };
  var MTO_TAB_STAGE = { x: 530, y: 46, w: 614, h: 290 };
  function mtoTabRowY(k) { return MTO_TAB_ROW.top + k * (MTO_TAB_ROW.h + MTO_TAB_ROW.gap); }

  function mtoTab(box, pic, name, o, active) {
    if (!(o > 0)) return "";
    var col = active ? P.gold : P.line;
    return G(R(box.x, box.y, box.w, box.h, 14, active ? "#2A2414" : P.card, col, active ? 4 : 2) +
      Em(box.x + 34, box.y + box.h / 2, 34, pic) +
      Tx(box.x + 60, box.y + box.h / 2 + 9, name, "lab big", "start", { fill: active ? P.gold : P.muted }),
      { opacity: clamp(o, 0, 1) });
  }

  /* one layer of the panel: the blocks of whichever script is on show */
  function mtoTabScript(ids, o, at, t, col) {
    if (!(o > 0)) return "";
    var out = "";
    ids.forEach(function (id, k) {
      out += mtoBlock(MTO_TAB_ROW.x, mtoTabRowY(k), MTO_TAB_ROW.w, MTO_TAB_ROW.h, id,
        { o: on(t, mtoAt(at, k * 0.32), 0.4), col: col });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function mtoTabsChapter(scene, beat, t, i) {
    var cTab = sc(scene, 0, "tab");
    var cTapcat = sc(scene, 1, "tapcat"), cBuild1 = sc(scene, 1, "build");
    var cTapdog = sc(scene, 2, "tapdog"), cBuild2 = sc(scene, 2, "build");
    var cRun = sc(scene, 3, "run"), cGo = sc(scene, 3, "go");
    var cBoth = sc(scene, 4, "both"), cNothing = sc(scene, 4, "nothing");
    var cCheck = sc(scene, 5, "check"), cWhose = sc(scene, 5, "whose");
    var b = MTO_TAB_STAGE, out = "";

    /* the stage: the cat and the dog stand on it from the first beat */
    out += mtoStage(b, 1);
    var catSq = on(t, cGo, 0.5) * MTO_SQ_RIGHT;
    var catHop = Math.max(mtoHop(t, mtoAt(cGo, 0.6)),
      mtoHop(t, mtoAt(cBoth, 0.4)), mtoHop(t, mtoAt(cBoth, 1.0)), mtoHop(t, mtoAt(cBoth, 1.6)));
    var dogO = 1 - 0.65 * on(t, cNothing, 0.5);
    var dogA = { pic: "\u{1F436}", cx: 940, jump: Math.max(mtoHop(t, cGo), mtoHop(t, mtoAt(cGo, 0.6))), o: dogO };
    out += mtoSprite(b, { pic: "\u{1F431}", cx: 660, sq: catSq, jump: catHop });
    out += mtoSprite(b, dogA);
    /* beside Run, where it says that the press worked - not floating in the
       corner of the stage, where a tick belongs to nothing */
    out += MK.tick(706, 381, 24, popIn(t, mtoAt(cGo, 1.2), 0.4) * (1 - on(t, cBoth, 0.4)));
    out += MK.cross(940, mtoHeadY(b, dogA) - 40, 28, popIn(t, cNothing, 0.4));
    out += mtoRun(530, 356, 140, 50, 1, mtoPast(t, cRun), t, cRun);

    /* a pill that says what the tabs are for, until the question replaces it */
    out += MK.pill(28, 66, "one script per object", on(t, cTab, 0.5) * (1 - into(t, scene.first + 5)),
      { size: 22, anchor: "start", col: P.blue, ink: P.blue });

    /* the tabs. Which one is active is decided by the last tap. */
    var tabO = popIn(t, cTab, 0.45);
    var catTab = mtoPast(t, cTapcat) && (!mtoPast(t, cTapdog) || mtoPast(t, cBoth));
    var dogTab = mtoPast(t, cTapdog) && !mtoPast(t, cBoth);
    out += mtoTab(MTO_TAB_A, "\u{1F431}", "cat", tabO, catTab);
    out += mtoTab(MTO_TAB_B, "\u{1F436}", "dog", tabO, dogTab);
    out += MK.ripple(MTO_TAB_A.x + 90, MTO_TAB_A.y + 28, t, cTapcat, P.gold);
    out += MK.ripple(MTO_TAB_B.x + 90, MTO_TAB_B.y + 28, t, cTapdog, P.gold);
    /* check the tab first: a ring round both of them, breathing */
    var ck = on(t, cCheck, 0.5);
    if (ck > 0) out += R(20, 112, 390, 72, 16, "none", P.gold, 4,
      { opacity: ck * (0.55 + 0.45 * breathe(t)) });

    /* the panel, one layer per script, the later one fading over the earlier */
    var oCat = on(t, cTapcat, 0.45), oDog = on(t, cTapdog, 0.45), oBoth = on(t, cBoth, 0.45);
    out += R(MTO_TAB_PANEL.x, MTO_TAB_PANEL.y, MTO_TAB_PANEL.w, MTO_TAB_PANEL.h, 20, P.card, P.line, 2,
      { opacity: n3(on(t, cTab, 0.45)) });
    var empty = "";
    for (var e = 0; e < 2; e++) empty += mtoSlot(MTO_TAB_ROW.x, mtoTabRowY(e), MTO_TAB_ROW.w, MTO_TAB_ROW.h, 1);
    out += G(empty, { opacity: clamp(on(t, cTab, 0.45) * (1 - oCat), 0, 1) });
    out += mtoTabScript(["right", "jump"], oCat * (1 - oDog), cBuild1, t, null);
    out += mtoTabScript(["jump", "jump"], oDog * (1 - oBoth), cBuild2, t, null);
    out += mtoTabScript(["right", "jump", "jump", "jump"], oBoth, mtoAt(cBoth, 0.1), t, P.bad);

    /* whose program are you building? */
    out += MK.bubble(40, 24, 360, 76, "Whose program is this?", popIn(t, cWhose, 0.45),
      MTO_TAB_A.x + 90, MTO_TAB_A.y - 4);
    return svg(out);
  }

  /* ==== chapter: a static object ================================================
     A third object joins the stage, and it is the one that never moves. Its
     script card fills with the two blocks a static object DOES have - say
     hello and grow - and the tree grows by the kit's own x1.4. Then its
     palette: the four move blocks, every one of them crossed out. */

  var MTO_ST_STAGE = { x: 650, y: 46, w: 494, h: 320 };
  var MTO_ST_CARD = { x: 40, y: 120, w: 400, h: 180 };
  var MTO_ST_ROW = { x: 64, w: 352, h: 44, gap: 8, top: 184 };
  var MTO_ST_CAT = 712, MTO_ST_DOG = 900, MTO_ST_TREE = 1068;
  var MTO_ST_PALETTE = [
    { id: "right", x: 40, y: 342 }, { id: "left", x: 320, y: 342 },
    { id: "jump", x: 40, y: 392 }, { id: "spin", x: 320, y: 392 }
  ];

  function mtoStaticChapter(scene, beat, t, i) {
    var cTree = sc(scene, 0, "tree"), cOthers = sc(scene, 0, "others");
    var cStatic = sc(scene, 1, "static"), cStays = sc(scene, 1, "stays");
    var cScript = sc(scene, 2, "script");
    var cSay = sc(scene, 3, "say"), cGrow = sc(scene, 3, "grow"), cNever = sc(scene, 3, "never");
    var cNomove = sc(scene, 4, "nomove"), cMeans = sc(scene, 4, "means");
    var cThree = sc(scene, 5, "three"), cMovers = sc(scene, 5, "movers"), cOne = sc(scene, 5, "one");
    var b = MTO_ST_STAGE, out = "";

    /* the stage, the two movers, and the tree that joins them */
    out += mtoStage(b, 1);
    var treeScale = 1 + (MTO_GROW - 1) * on(t, cGrow, 0.7);
    var catSq = on(t, cThree, 0.55) * MTO_SQ_RIGHT;
    var catA = { pic: "\u{1F431}", cx: MTO_ST_CAT, size: 74, sq: catSq,
      jump: Math.max(mtoHop(t, cOthers), mtoHop(t, mtoAt(cThree, 0.7))) };
    var dogA = { pic: "\u{1F436}", cx: MTO_ST_DOG, size: 74,
      jump: Math.max(mtoHop(t, mtoAt(cOthers, 0.18)), mtoHop(t, cThree)) };
    var treeA = { pic: "\u{1F333}", cx: MTO_ST_TREE, size: 74, scale: treeScale, o: popIn(t, cTree, 0.45) };
    out += mtoSprite(b, catA) + mtoSprite(b, dogA) + mtoSprite(b, treeA);

    /* it stays where it is: a dashed patch of ground the tree never leaves */
    var anchor = Math.max(on(t, cStays, 0.5), 0);
    if (anchor > 0) {
      var flash = Math.max(bump(t, cStays, 1.4), bump(t, cNever, 1.4), bump(t, cOne, 1.4));
      out += R(MTO_ST_TREE - 55, 300, 110, 22, 8, "none", P.good, 3 + 2 * flash,
        { "stroke-dasharray": "9 8", opacity: anchor * (0.55 + 0.45 * Math.max(flash, breathe(t) * 0.6)) });
    }
    /* it never moves: a move block, crossed out, ON the ground the tree keeps.
       Beat 3 only - beat 5 puts the "static" pill in that same place. */
    var nv = popIn(t, cNever, 0.45) * mtoOnly(t, scene, 3);
    if (nv > 0) {
      out += MK.pop(Em(MTO_ST_TREE, 344, 30, "➡️"), MTO_ST_TREE, 344, nv);
      out += MK.cross(MTO_ST_TREE, 344, 22, nv);
    }
    /* hello, from something that cannot walk over to say it */
    out += MK.bubble(970, 96, 170, 62, "Hello!", Math.max(popIn(t, cSay, 0.45), popIn(t, mtoAt(cThree, 0.4), 0.45)),
      MTO_ST_TREE, 196);
    out += mtoRun(660, 370, 130, 46, 1, mtoPast(t, cThree), t, cThree);

    /* two movers and one static object, named under their own feet */
    var pm = popIn(t, cMovers, 0.4);
    out += MK.pill(MTO_ST_CAT + catSq * MTO_SQ, 340, "mover", pm, { size: 19, col: P.blue, ink: P.blue });
    out += MK.pill(MTO_ST_DOG, 340, "mover", popIn(t, mtoAt(cMovers, 0.2), 0.4), { size: 19, col: P.blue, ink: P.blue });
    out += MK.pill(MTO_ST_TREE, 340, "static", popIn(t, cOne, 0.4), { size: 19, col: P.good, ink: P.good });

    /* the word, and what it means */
    var pulse = mtoPast(t, cMeans) ? 0.6 + 0.4 * breathe(t) : 1;
    out += G(MK.pill(40, 64, "static", on(t, cStatic, 0.45), { size: 30, anchor: "start", col: P.good, ink: P.good }),
      { opacity: pulse });
    out += Tx(200, 76, "stays where it is", "lab big", "start", { opacity: n3(on(t, cStays, 0.5)) });

    /* the tree's own script: two blocks, and neither of them moves it */
    var cardO = on(t, cScript, 0.5);
    out += mtoCard(MTO_ST_CARD.x, MTO_ST_CARD.y, MTO_ST_CARD.w, MTO_ST_CARD.h, "\u{1F333}", "the tree's script",
      cardO, { col: mtoPast(t, cSay) ? P.good : null });
    [{ id: "say", at: cSay }, { id: "grow", at: cGrow }].forEach(function (r, k) {
      var y = MTO_ST_ROW.top + k * (MTO_ST_ROW.h + MTO_ST_ROW.gap), o = on(t, r.at, 0.45);
      out += mtoSlot(MTO_ST_ROW.x, y, MTO_ST_ROW.w, MTO_ST_ROW.h, cardO * (1 - o));
      out += mtoBlock(MTO_ST_ROW.x, y, MTO_ST_ROW.w, MTO_ST_ROW.h, r.id, { o: o });
    });

    /* and its palette: the move blocks are not in it */
    var pal = on(t, cNomove, 0.5);
    out += Tx(40, 332, "the tree's palette", "lab mid muted", "start", { opacity: n3(pal) });
    MTO_ST_PALETTE.forEach(function (c, k) {
      var at = mtoAt(cNomove, k * 0.16);
      out += mtoBlock(c.x, c.y, 268, 44, c.id, { o: on(t, at, 0.35), dim: true,
        mark: "cross", markP: popIn(t, mtoAt(at, 0.3), 0.35) });
    });
    out += MK.tick(616, 330, 20, popIn(t, cMeans, 0.4));
    return svg(out);
  }
