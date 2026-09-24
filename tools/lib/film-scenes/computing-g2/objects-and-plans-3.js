  /* ==== Objects and Plans, part 3: repeats, whose bug it is, real programs =====
     tools/lib/film-scenes/computing-g2/objects-and-plans-3.js. See the header
     of objects-and-plans.js.

     The two dogs of the repeats chapter both end on the kit's own answer:
     ART.run(dog, [left, left, left]) and ART.run(dog, [repeat3, left]) are
     worked out at load and are the same square, so "the dog goes just as far"
     is the lesson's arithmetic rather than a claim made here. */

  /* ==== chapter: repeats for objects too ========================================= */
  var RP_S = { x: 244, y: 60, w: 680, h: 230 };
  var RP_DOG = 700;
  var RP_M = { y: 262, w: 520, h: 150 };
  var RP_COL = [
    { x: 40, cx: 400, ids: ["left", "left", "left"], end: OP_LEFT[3], pill: "three blocks" },
    { x: 608, cx: 968, ids: ["repeat3", "left"], end: OP_REPEAT3, pill: "two blocks" }
  ];

  function rpAskPicture(scene, t) {
    /* beat 0 "An object's plan can use the repeat block, like any other
       program." (plan, repeat); beat 1 "The dog must move left three
       times. That is three move left blocks." (three, blocks) - one
       combined phrase, not a separate "move left" and "three times", so
       the count and the reach ride the one cue together. */
    var cPlan = sc(scene, 0, "plan"), cRepeat = sc(scene, 0, "repeat");
    var cThree = sc(scene, 1, "three"), cBlocks = sc(scene, 1, "blocks");
    var out = "", sq = opSQ(RP_S.h);

    out += opStage(RP_S.x, RP_S.y, RP_S.w, RP_S.h, into(t, scene.first), { squares: 3, cx: RP_DOG });

    /* the three squares the dog has to cross, counted as they are asked for */
    var n = tally(t, cThree, 3, 0.7);
    for (var k = 0; k < n; k++) {
      var mx = RP_DOG - (k + 1) * sq;
      out += G(R(mx - 36, 168, 72, 72, 14, "none", P.gold, 3, { "stroke-dasharray": "10 8" }) +
        Tx(mx, 216, String(k + 1), "lab big", "middle", { fill: P.gold }),
        { opacity: on(t, opAfter(cThree, k * 0.3), 0.35) });
    }
    var reach = on(t, cThree, 0.7);
    out += MK.arrow(RP_DOG - 46, 110, RP_DOG - 3 * sq, 110, reach, P.gold, 8);

    out += opSprite(RP_DOG, RP_S.y, RP_S.h, OP_HOME, OP_DOG, 1);
    var look = on(t, cThree, 0.5) * (1 - on(t, cBlocks, 0.5));
    if (look > 0) out += C(RP_DOG, 196, 54, "none", P.gold, 4, { opacity: look });

    /* an object's plan can hold a repeat block, like any other program - the
       slot stays EMPTY through beats 0-1. The finished "repeat 3 times"
       block is the payoff of beat 2 ("Or use repeat 3 times, then move
       left..."), so it must not appear before that is said; popIn never
       resets, so filling it here on cRepeat left it on screen through beat
       1's own naive "three move left blocks" line too. A glow still marks
       the cue where "the repeat block" is named, without showing which one. */
    out += opSlot(434, 320, 302, 64, on(t, cPlan, 0.5));
    /* r 84, not 96: a glow centred on the block reaches 440 at 88 and the svg
       does not clip, so the last 8 px would have been drawn over the words */
    out += MK.glow(584, 352, 84, P.accent, on(t, cRepeat, 0.6) * 0.9);
    return out;
  }

  function rpComparePicture(scene, t) {
    /* beat 2 "Or use repeat 3 times, then move left. That is only two
       blocks." (rep, left, two); beat 3 "Same moves, fewer blocks. The
       repeat block always goes first." (same, fewer, first) - the left
       column (three blocks) was already established in beat 1, so it is on
       screen from the moment this half appears; the right column arrives as
       beat 2 names its own two blocks; both dogs' ticks land together on
       "Same moves", the punchline the picture is proving. */
    var cRep = sc(scene, 2, "rep"), cLeft = sc(scene, 2, "left"), cTwo = sc(scene, 2, "two");
    var cSame = sc(scene, 3, "same"), cFewer = sc(scene, 3, "fewer"), cFirst = sc(scene, 3, "first");
    var out = L(584, 26, 584, 414, P.line, 2);
    var show = [1, on(t, cRep, 0.5)];
    var wentU = [1, on(t, opAfter(cLeft, 0.3), 1.0)];
    var pillO = [1, on(t, cTwo, 0.45)];
    var blockAt = [undefined, cRep];

    RP_COL.forEach(function (c, k) {
      var sq = opSQ(RP_M.h), endX = c.cx + c.end.x * sq;
      out += MK.pill(c.cx - 100, 36, c.pill, pillO[k], { size: 24, col: P.gold, ink: P.gold });
      out += opBlockCol(c.x + 20, 76, 48, c.ids, t, blockAt[k], { fs: 22, gap: 8 });
      out += opStage(c.x, RP_M.y, RP_M.w, RP_M.h, show[k], { squares: 3, cx: c.cx });
      /* where three squares to the left ends up, marked the same on both sides */
      var lit = 0.5 + 0.5 * bump(t, cSame, 1.4);
      out += L(endX, 292, endX, 404, P.gold, 3, { "stroke-dasharray": "9 8", opacity: show[k] * lit });
      out += opSprite(c.cx, RP_M.y, RP_M.h, opTween(OP_HOME, c.end, wentU[k]), OP_DOG, show[k]);
      out += MK.tick(c.x + RP_M.w - 40, 294, 24, popIn(t, cSame, 0.4));
    });
    /* "fewer blocks" - said between the two ticks landing and the repeat
       block being rung, so it gets the gap between them: a tag over the
       right column saying what the tick just proved */
    var fewer = on(t, cFewer, 0.4);
    if (fewer > 0) out += MK.pill(RP_COL[1].cx, 222, "fewer blocks", fewer, { size: 22, col: P.good, ink: P.good });
    /* "the repeat block always goes first" - ring the right column's own
       first block, the repeat3 block itself, matching its own bounds
       rather than a fixed radius so it never over- or under-shoots it */
    var bw = opBlockW("repeat3", 22, 48), glow = on(t, cFirst, 0.5);
    if (glow > 0) out += R(RP_COL[1].x + 14, 70, bw + 12, 60, 14, "none", P.gold, 4, { opacity: glow });
    return out;
  }

  function rpChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 2), out = "";
    if (u < 1) out += G(rpAskPicture(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(rpComparePicture(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: which object is it? =============================================
     Three objects on one stage, one script panel each. They all run at once;
     the dog does the wrong thing; the film looks in the dog's blocks and
     leaves the other two alone. */
  var WH_S = { x: 40, y: 16, w: 1088, h: 170 };
  var WH = [
    { cx: 250, x: 80, pic: OP_CAT, name: "cat", ids: ["right", "say"] },
    { cx: 584, x: 414, pic: OP_DOG, name: "dog", ids: ["spin", "spin"] },
    { cx: 918, x: 748, pic: OP_BALL, name: "ball", ids: ["spin"] }
  ];
  var WH_PY = 206, WH_PW = 340, WH_PH = 218;
  /* the dog's hop on this stage's sprite (WH_S.h = 170) - jump below is 0..1
     and was passed straight into opSprite's PIXEL hop with no amplitude, the
     same fault as buBuildPicture's own dog. Same ratio as dogHop's 34 / 84. */
  var WH_HOP = 23;

  function whChapter(scene, beat, t, i) {
    /* beat 0 "A stage can hold several objects at the same time." (stage,
       several); beat 1 "Each one carries its own blocks, and they all run
       side by side." (own, side); beat 2 "So when something goes wrong, ask
       which object is doing it." (wrong, which); beat 3 "Check that
       object's blocks. Leave the other objects alone." (check, leave). */
    var cStage = sc(scene, 0, "stage"), cSeveral = sc(scene, 0, "several"), cSide = sc(scene, 1, "side");
    var cWrong = sc(scene, 2, "wrong"), cWhich = sc(scene, 2, "which");
    var cSpins = cWrong, cJump = cWrong, cCheck = sc(scene, 3, "check");
    var cLeave = sc(scene, 3, "leave"), cFine = cLeave;
    var out = "", run = on(t, cSide, 1.0);

    out += opStage(WH_S.x, WH_S.y, WH_S.w, WH_S.h, on(t, cStage, 0.5), { squares: 2, cx: WH[0].cx });

    /* all three run side by side; then the dog goes on spinning when it should
       have jumped */
    var jump = run > 0 && run < 1 ? Math.sin(Math.PI * run) : 0;
    var wrong = opPast(t, cWrong) ? ((t - cWrong) / 1.5) * 360 : 0;
    out += opSprite(WH[0].cx, WH_S.y, WH_S.h, opTween(OP_HOME, OP_R1, run), WH[0].pic, on(t, cStage, 0.5));
    /* the cat's second block is say hello, so the cat says it */
    var catX = WH[0].cx + OP_R1.x * opSQ(WH_S.h);
    out += MK.bubble(catX - 56, 22, 112, 46, "Hello!", on(t, opAfter(cSide, 0.8), 0.4) * (1 - on(t, cLeave, 0.5)), catX, 92);
    out += opSprite(WH[1].cx, WH_S.y, WH_S.h, OP_HOME, WH[1].pic, on(t, cStage, 0.5), opPast(t, cWrong) ? 0 : jump * WH_HOP, wrong);
    out += opSprite(WH[2].cx, WH_S.y, WH_S.h, OP_HOME, WH[2].pic, on(t, cStage, 0.5), 0, 360 * run);

    /* the hop the dog's plan asked for, and never made */
    var should = on(t, cJump, 0.5) * (1 - on(t, cLeave, 0.5));
    if (should > 0) out += Pth("M538,120 Q584,46 630,120", null, P.gold, 4,
      { "stroke-dasharray": "10 9", opacity: should });
    out += MK.qmark(584, 52, 32, popIn(t, cWrong, 0.45) * (1 - on(t, cCheck, 0.5)));

    WH.forEach(function (o, k) {
      var mine = k === 1;
      var ring = mine && opPast(t, cCheck) ? P.bad : null;
      var dimmed = !mine && opPast(t, cLeave) ? 0.45 : 1;
      var body = opPanel(o.x, WH_PY, WH_PW, WH_PH, o.pic, o.name, 1, { ring: ring });
      body += opBlockCol(o.x + 24, WH_PY + 64, 44, o.ids, t, undefined,
        { fs: 20, gap: 8, ring: mine && opPast(t, cCheck) ? 0 : -1 });
      out += G(body, { opacity: clamp(popIn(t, opAfter(cSeveral, k * 0.24), 0.4), 0, 1) * dimmed });
      /* a question over every panel, then the search in the dog's alone */
      var q = popIn(t, opAfter(cWhich, k * 0.2), 0.4) * (1 - (mine ? on(t, cCheck, 0.4) : on(t, cLeave, 0.4)));
      out += MK.qmark(o.x + 300, WH_PY + 34, 24, q);
      if (mine) out += MK.pop(Em(o.x + 300, WH_PY + 34, 46, "\u{1F50D}"), o.x + 300, WH_PY + 34, popIn(t, cCheck, 0.4));
      else out += MK.tick(o.x + 300, WH_PY + 34, 22, popIn(t, opAfter(cFine, k * 0.22), 0.4));
    });
    /* the dog is the one doing it, so the dog is the one ringed */
    out += C(WH[1].cx, 118, 46, "none", P.gold, 4, { opacity: on(t, cSpins, 0.5) * (1 - on(t, cLeave, 0.5)) });
    return svg(out);
  }

  /* ==== chapter: real programs ===================================================
     Beats 0-2: the lecture's own three real programs, each opening to show the
     objects inside it. Beats 3-4: the game's three objects, each with its own
     blocks, inside one big program, and the computer that runs it. */
  var RE_CARD = { y: 46, w: 340, h: 348 };
  var RE = [
    { x: 50, pic: "\u{1F3AE}", name: "a game", n: 3, objs: ["\u{1F9D2}", "\u{1F47E}", "\u{1F47E}"] },
    { x: 414, pic: "\u{1F3AC}", name: "an animation", n: 3, objs: ["\u{1F431}", "\u{1F436}", "\u{1F43B}"] },
    { x: 778, pic: "\u{1F6A6}", name: "a traffic light", n: 3, lamps: ["#F0806F", "#F4C95D", "#4FD1A0"] }
  ];
  function reObject(cx, cy, lamp, pic, p) {
    if (!(p > 0)) return "";
    var art = lamp ? C(cx, cy, 25, lamp, "#0B1D2C", 3) : Em(cx, cy, 48, pic);
    return G(art, { transform: around(cx, cy, Math.min(p, 1.1)), opacity: Math.min(1, p) });
  }
  function reCardsPicture(scene, t) {
    /* beat 2 "An animation has several characters. They all run at the
       same time." (anim, chars, once) has no "traffic" or "lights" in it -
       that is beat 3, "A traffic light has three lights: red, amber and
       green." (traffic, three, red, amber, green), which names no single
       "lights" phrase, so "three lights" carries it. */
    var cReal = sc(scene, 0, "real"), cLots = sc(scene, 0, "lots"), cPlan = sc(scene, 0, "plan");
    var cGame = sc(scene, 1, "game"), cPlayer = sc(scene, 1, "player"), cEnemies = sc(scene, 1, "enemies");
    var cAnim = sc(scene, 2, "anim"), cChars = sc(scene, 2, "chars"), cOnce = sc(scene, 2, "once");
    var cTraf = sc(scene, 3, "traffic"), cRed = sc(scene, 3, "red"), cAmber = sc(scene, 3, "amber"), cGreenL = sc(scene, 3, "green");
    var openAt = [cGame, cAnim, cTraf];
    /* when each object inside a card is met: the player is named on its own,
       then the two enemies; the characters come as a set; the three lamps
       come one at a time, in the words' own order: red, amber, green */
    var fillAt = [
      [cPlayer, cEnemies, opAfter(cEnemies, 0.3)],
      [cChars, opAfter(cChars, 0.22), opAfter(cChars, 0.44)],
      [cRed, cAmber, cGreenL]
    ];
    var ring = opPast(t, cTraf) ? 2 : opPast(t, cAnim) ? 1 : opPast(t, cGame) ? 0 : -1;
    var out = "";

    RE.forEach(function (c, k) {
      var p = popIn(t, opAfter(cReal, k * 0.26), 0.4);
      if (!(p > 0)) return;
      var cx = c.x + RE_CARD.w / 2, lit = k === ring, seen = opPast(t, openAt[k]);
      var body = R(c.x, RE_CARD.y, RE_CARD.w, RE_CARD.h, 24, P.card, lit ? P.gold : P.line, lit ? 4 : 2) +
        Em(cx, RE_CARD.y + 78, 78, c.pic) +
        Tx(cx, RE_CARD.y + 148, c.name, "lab", "middle", { "font-size": 24, fill: lit ? P.gold : P.ink });
      for (var j = 0; j < c.n; j++) {
        var ox = cx + (j - (c.n - 1) / 2) * 96;
        /* an object we have not met yet, then the object itself */
        var known = seen ? popIn(t, fillAt[k][j], 0.4) : 0;
        var grey = popIn(t, opAfter(cLots, j * 0.18), 0.4) * (1 - Math.min(1, known));
        body += G(C(ox, RE_CARD.y + 218, 24, P.cell, P.line, 3), { opacity: Math.min(1, grey), transform: around(ox, RE_CARD.y + 218, Math.min(grey, 1.1)) });
        body += reObject(ox, RE_CARD.y + 216, c.lamps ? c.lamps[j] : null, c.objs ? c.objs[j] : null, known);
        /* its own two blocks, the plan each object carries */
        var bars = popIn(t, opAfter(cPlan, j * 0.16), 0.35);
        if (bars > 0) body += G(R(ox - 30, RE_CARD.y + 262, 60, 11, 5, P.teal) +
          R(ox - 30, RE_CARD.y + 282, 60, 11, 5, P.plum), { opacity: Math.min(1, bars) });
      }
      /* "they all run at the same time" - a synchronised pulse behind the
         animation card, right as "once" is said */
      if (k === 1) {
        var onceBump = bump(t, cOnce, 1.0);
        if (onceBump > 0.02) out += MK.glow(cx, RE_CARD.y + RE_CARD.h / 2, 190, P.gold, onceBump * 0.4);
      }
      out += G(body, { opacity: (lit ? 1 : ring < 0 ? 0.92 : opPast(t, openAt[k]) ? 0.82 : 0.5) * Math.min(1, p),
        transform: around(cx, RE_CARD.y + RE_CARD.h / 2, Math.min(p, 1.04)) });
    });
    return out;
  }

  var RE_LP = { x: 646, y: 96, w: 430, h: 320 };
  function reLapX(v) { return RE_LP.x + v * RE_LP.w / 360; }
  function reLapY(v) { return RE_LP.y + v * RE_LP.h / 268; }
  /* beats 3-4 are the traffic light itself - the lesson's own words name
     the three lamps by colour ("red, amber and green") and then say each one
     is an object with its own plan, so these two beats get the traffic
     light's own panels: a lit lamp, not the game's player/enemy sprites.
     The colours are RE[2].lamps - the same three the "real" chapter's first
     half draws, read here rather than copied, so the two halves cannot
     disagree about which lamp is which. */
  var RE_LIGHT = [
    { name: "red light", lamp: RE[2].lamps[0] },
    { name: "amber light", lamp: RE[2].lamps[1] },
    { name: "green light", lamp: RE[2].lamps[2] }
  ];
  function reProgramPicture(scene, t) {
    /* beat 3, "A traffic light has three lights: red, amber and green."
       (traffic, three, red, amber, green), has no "together" or "big" in
       it - "green" is its last word, the natural point the three panels
       are all running. Beat 4, "Each light is an object with its own plan
       for when to be on." (each, object, plan), has no "program",
       "computer" or "algorithm" - each, object and plan carry those three
       beats in turn, and the algorithm card shares the closing "plan". */
    var cTogether = sc(scene, 3, "green"), cBig = sc(scene, 4, "plan");
    var cProg = sc(scene, 4, "each"), cComp = sc(scene, 4, "object"), cAlgo = cBig;
    var out = "", flash = bump(t, cProg, 1.2);

    /* the three panels are there as the chapter turns to them; the cue is what
       sets them running */
    var base = into(t, scene.first + 3);
    RE_LIGHT.forEach(function (o, k) {
      var y = 44 + k * 112, p = base;
      if (!(p > 0)) return;
      var body = R(60, y, 470, 96, 18, P.card, flash > 0.05 ? P.gold : P.line, flash > 0.05 ? 4 : 2) +
        C(98, y + 48, 25, o.lamp, "#0B1D2C", 3) + Tx(132, y + 30, o.name, "lab mid", "start", { fill: P.muted });
      body += MK.pill(300, y + 56, "own plan", 1, { size: 18, col: P.gold, ink: P.gold });
      /* they all run at once */
      body += G(Pth("M" + n2(400) + "," + n2(y + 42) + " L" + n2(400) + "," + n2(y + 70) + " L" + n2(424) + "," + n2(y + 56) + " Z", P.good),
        { opacity: on(t, opAfter(cTogether, 0.3 + k * 0.18), 0.4) });
      out += G(body, { opacity: Math.min(1, p), transform: around(295, y + 48, Math.min(p, 1.04)) });
    });
    /* one big program with all three inside it */
    var big = on(t, cBig, 0.6);
    if (big > 0) out += R(40, 26, 510, 356, 20, "none", P.gold, 4, { "stroke-dasharray": "16 12", opacity: big });
    out += MK.pill(295, 406, "one big program", big, { size: 24, col: P.gold, ink: P.gold });

    /* the computer the program tells what to do */
    var lap = ART.figure("laptop"), lit = on(t, cComp, 0.5);
    if (lit > 0.02) lap = ART.ring(lap, "screen", P.gold, 7);
    out += G(ART.place(lap, RE_LP.x, RE_LP.y, RE_LP.w, RE_LP.h), { opacity: 0.24 + 0.76 * lit });
    out += MK.glow(reLapX(180), reLapY(95), 130, P.gold, lit * 0.8);
    out += MK.arrow(562, reLapY(95), 636, reLapY(95), lit, P.gold, 8);

    /* and the algorithm it is being told to run */
    var algo = popIn(t, cAlgo, 0.45);
    if (algo > 0) {
      var card = R(700, 8, 330, 68, 14, P.paper) +
        Tx(716, 32, "algorithm", "lab dark", "start", { "font-size": 17 }) +
        R(716, 46, 90, 10, 5, "#8E8778") + R(816, 46, 68, 10, 5, "#C2BBAA") + R(894, 46, 116, 10, 5, "#8E8778") +
        R(716, 62, 132, 8, 4, "#C2BBAA") + R(858, 62, 152, 8, 4, "#C2BBAA");
      out += G(card, { transform: around(865, 42, Math.min(algo, 1.06)), opacity: Math.min(1, algo) });
      out += MK.arrow(865, 80, 865, 114, on(t, opAfter(cAlgo, 0.35), 0.4), P.gold, 7);
    }
    return out;
  }

  function reChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(reCardsPicture(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(reProgramPicture(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know --------------------------------------------------------
     The lesson's own four words, with the lesson's own pictures for them.
     Recap beat 0 is "object, plan" (object, plan); beat 1 "build the
     program, then run it and test it" (program, test); beat 2 "On one
     stage, every object quietly does its own job" (stage, job) - it never
     says "tree" or "two" again, so the fifth card (a callback to the
     "plans" chapter's tree) and the closing breathe both ride "job", the
     line's own last word. */
  var OP_RECAP = MK.recapKind([
    { beat: 0, at: "object", title: "Object", sub: "a thing with its own blocks", pic: OP_CAT },
    { beat: 0, at: "plan", title: "Plan", sub: "decide it before you build", pic: "\u{1F4CB}" },
    { beat: 1, at: "program", title: "Program", sub: "the blocks for one object", pic: "\u{1F9E9}" },
    { beat: 1, at: "test", title: "Test", sub: "run it and check the plan", pic: "▶️" },
    { beat: 2, at: "job", title: "No blocks", sub: "for a thing that never moves", pic: OP_TREE }
  ], { goBeat: 2, goAt: "job" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Why every object needs a plan of its own", "How to build one program and test it", "Where the objects of a real program live"] }),
    objects: opObjectsChapter, plans: plChapter, build: buChapter,
    repeats: rpChapter, which: whChapter, real: reChapter, recap: OP_RECAP
  };
