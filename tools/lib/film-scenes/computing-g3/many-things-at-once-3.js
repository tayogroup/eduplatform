  /* ==== Many Things at Once, part 3 ==========================================
     The chapters "Working with others" and "Mistakes teach you", the recap
     cards, and KINDS. See many-things-at-once.js for the helpers. */

  /* ==== chapter: working with others ============================================
     Two children at one laptop - the kit's own laptop drawing, with its own
     screen part rung when the partner finds the bug on it - and the lesson's
     own four benefits filling four cards as each is named. */

  var MTO_LAP = { x: 128, y: 210, w: 266, h: 198 };
  var MTO_KID_A = 66, MTO_KID_B = 452, MTO_KID_Y = 300, MTO_KID_S = 86;
  var MTO_BEN = [
    { x: 568, y: 64, pic: "\u{1F4A1}", label: "more ideas", cls: "lab big" },
    { x: 864, y: 64, pic: "\u{1F440}", label: "a second pair of eyes", cls: "lab mid" },
    { x: 568, y: 252, pic: "\u{1F9E9}", label: "share the work", cls: "lab big" },
    { x: 864, y: 252, pic: "\u{1F5E3}️", label: "say it out loud", cls: "lab big" }
  ];
  var MTO_BEN_W = 276, MTO_BEN_H = 168;

  /* o: how far this benefit has been named; num: how far its number has popped */
  function mtoBenefit(c, o, n, num) {
    var lit = o > 0.05;
    var badge = num > 0 ? G(C(c.x + 32, c.y + 32, 17, P.card, lit ? P.plum : P.line, 2) +
      Tx(c.x + 32, c.y + 39, String(n), "lab mid", "middle", { fill: lit ? P.plum : P.muted }),
      { transform: around(c.x + 32, c.y + 32, Math.min(1.1, num)), opacity: Math.min(1, num) }) : "";
    return G(R(c.x, c.y, MTO_BEN_W, MTO_BEN_H, 20, lit ? "#1B3A52" : P.card, lit ? P.plum : P.line, lit ? 4 : 2) + badge +
      Em(c.x + MTO_BEN_W / 2, c.y + 58, 58, c.pic, { opacity: Math.min(1, 0.25 + o) }) +
      Tx(c.x + MTO_BEN_W / 2, c.y + 126, c.label, c.cls, "middle", { opacity: n3(Math.min(1, 0.3 + o)) }),
      { opacity: 0.4 + 0.6 * Math.min(1, o), transform: around(c.x + MTO_BEN_W / 2, c.y + MTO_BEN_H / 2, 0.97 + 0.03 * Math.min(1, o)) });
  }

  function mtoTogetherChapter(scene, beat, t, i) {
    var cPairs = sc(scene, 0, "pairs"), cFour = sc(scene, 0, "four");
    var cIdeas = sc(scene, 1, "ideas");
    var cEyes = sc(scene, 2, "eyes"), cBug = sc(scene, 2, "bug");
    var cShare = sc(scene, 3, "share"), cCat = sc(scene, 3, "cat"), cDog = sc(scene, 3, "dog");
    var cLoud = sc(scene, 4, "loud"), cClear = sc(scene, 4, "clear");
    var cAsk = sc(scene, 5, "ask"), cReal = sc(scene, 5, "real");
    var out = "";

    /* the laptop the two of them are working on, and the bug on its screen.
       The bug is the second beat's, so it and the ring go with that beat. */
    var found = mtoOnly(t, scene, 2);
    var lap = ART.figure("laptop");
    if (mtoPast(t, cBug) && found > 0.35) lap = ART.ring(lap, "screen", P.bad, 6);
    var lo = on(t, cPairs, 0.5);
    out += G(ART.place(lap, MTO_LAP.x, MTO_LAP.y, MTO_LAP.w, MTO_LAP.h), { opacity: n3(lo) });
    out += MK.pop(Em(310, 296, 32, "\u{1F41B}"), 310, 296, popIn(t, cBug, 0.45) * found);
    out += MK.leader(409, 296, 334, 296, on(t, cBug, 0.55) * found, P.bad);

    /* the two of them */
    out += Em(MTO_KID_A, MTO_KID_Y, MTO_KID_S, "\u{1F9D2}", { opacity: n3(on(t, cPairs, 0.45)) });
    out += Em(MTO_KID_B, MTO_KID_Y, MTO_KID_S, "\u{1F9D2}", { opacity: n3(on(t, mtoAt(cPairs, 0.2), 0.45)) });
    out += MK.pill(MTO_KID_A, 372, "you", on(t, cPairs, 0.5), { size: 19, col: P.plum, ink: P.plum });
    out += MK.pill(MTO_KID_B, 372, "your partner", on(t, mtoAt(cPairs, 0.2), 0.5), { size: 19, col: P.plum, ink: P.plum });

    /* the work shared out: one of them builds the cat, the other the dog */
    var split = mtoOnly(t, scene, 3);
    out += MK.pill(MTO_KID_A, 244, "\u{1F431} cat", popIn(t, cCat, 0.4) * split, { size: 20, col: P.gold, ink: P.gold });
    out += MK.pill(MTO_KID_B, 244, "\u{1F436} dog", popIn(t, cDog, 0.4) * split, { size: 20, col: P.gold, ink: P.gold });

    /* saying the plan out loud, and the plan getting clearer */
    var say = mtoOnly(t, scene, 4);
    out += G(MK.waves(112, 292, t, cLoud, { dir: 0, spread: 0.95, reach: 120, col: P.gold, until: mtoAt(cLoud, 2.4) }),
      { opacity: n3(say) });
    var clear = on(t, cClear, 0.5);
    out += MK.pill(66, 168, "my plan", on(t, cLoud, 0.5) * say,
      { size: 20, col: clear > 0.5 ? P.good : P.muted, ink: clear > 0.5 ? P.good : P.muted });
    out += MK.tick(170, 168, 18, popIn(t, cClear, 0.4) * say);

    /* asking for help */
    out += MK.bubble(296, 84, 244, 70, "Can you help?", popIn(t, cAsk, 0.45), MTO_KID_B, 250);
    out += MK.tick(196, 150, 24, popIn(t, cReal, 0.4));

    /* the four benefits, lit as each is named */
    var lits = [on(t, cIdeas, 0.5), on(t, cEyes, 0.5), on(t, cShare, 0.5), on(t, cLoud, 0.5)];
    var all = mtoPast(t, cReal) ? 0.6 + 0.4 * breathe(t) : 1;
    MTO_BEN.forEach(function (c, k) {
      var o = lits[k];
      out += G(mtoBenefit(c, o, k + 1, popIn(t, mtoAt(cFour, k * 0.16), 0.35)),
        { opacity: n3(on(t, cPairs, 0.6) * (o > 0.05 ? all : 1)) });
    });
    return svg(out);
  }

  /* ==== chapter: mistakes teach you =============================================
     One picture per beat, crossfaded: the three mistakes the lesson names, the
     cat that started in the wrong place, the repeat that repeated a spin (the
     kit's own expandProgram says which), the notebook they are written in, and
     the next program, which starts with go home because of them. */

  var MTO_NOTES = ["start with go home", "check the block after repeat", "check whose tab I am on"];
  var MTO_MIS_TILE = [
    { x: 140, pic: "\u{1F3E0}", label: "wrong place" },
    { x: 459, pic: "\u{1F501}", label: "wrong block" },
    { x: 778, pic: "\u{1F436}", label: "wrong tab" }
  ];

  /* lines: one opacity per note. opt: {cls, lh, pad, col} */
  function mtoBook(x, y, w, h, o, lines, opt) {
    opt = opt || {};
    if (!(o > 0)) return "";
    var cls = opt.cls || "lab mid dark", lh = opt.lh || 56, pad = opt.pad || 50, top = opt.top || 108;
    var out = R(x, y, w, h, 18, P.paper, opt.col || "#C9BFA6", opt.col ? 5 : 2) +
      R(x + 12, y + 12, 15, h - 24, 6, "#D9CFB8") +
      Em(x + w - 42, y + 46, 30, "\u{1F4DD}") +
      Tx(x + pad, y + 54, "my mistakes", (opt.headCls || "lab big") + " dark", "start");
    for (var k = 0; k < MTO_NOTES.length; k++) {
      var ly = y + top + k * lh, lo = clamp(lines[k] || 0, 0, 1);
      out += L(x + pad, ly + 12, x + w - 30, ly + 12, "#D9CFB8", 2);
      if (lo > 0) out += Tx(x + pad, ly + 6, MTO_NOTES[k], cls, "start",
        { opacity: n3(lo), transform: "translate(" + n2((1 - lo) * 12) + ",0)" });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function mtoMisTile(x, y, w, h, pic, label, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 20, P.card, P.accent, 3) + Em(x + w / 2, y + h * 0.36, h * 0.34, pic) +
      Tx(x + w / 2, y + h * 0.80, label, "lab big", "middle"),
      { opacity: Math.min(1, o), transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)) });
  }

  var MTO_MIS_STAGE = { x: 180, y: 90, w: 820, h: 210 };

  function mtoMistakeArt(j, scene, t) {
    var k = j - scene.first, out = "";
    if (k === 0) {
      var cMakes = sc(scene, 0, "makes"), cUse = sc(scene, 0, "use");
      MTO_MIS_TILE.forEach(function (c, n) {
        out += mtoMisTile(c.x, 110, 250, 200, c.pic, c.label, popIn(t, mtoAt(cMakes, n * 0.26), 0.4));
      });
      var u = on(t, cUse, 0.6);
      MTO_MIS_TILE.forEach(function (c) { out += MK.leader(c.x + 125, 318, 584, 340, u, P.gold); });
      out += MK.glow(584, 370, 58, P.gold, u);
      out += MK.pop(Em(584, 370, 56, "\u{1F4A1}"), 584, 370, popIn(t, cUse, 0.45));
      return out;
    }
    /* The wrong start and the repair are two beats, not one: a reset that only
       began when "reset first" was said started 70% of the way through its
       line and its tick landed 0.04 s before the crossfade - inside the
       estimate and outside the real voice, which runs up to 10% shorter. */
    if (k === 1) {
      var cWrong = sc(scene, 1, "wrong"), cNothing = sc(scene, 1, "nothing");
      var b1 = MTO_MIS_STAGE;
      out += mtoStage(b1, 1);
      out += R(400 - 46, mtoGround(b1) - 12, 92, 20, 8, "none", P.good, 3, { "stroke-dasharray": "9 8" });
      out += MK.pill(400, 276, "home", 0.9, { size: 19, col: P.good, ink: P.good });
      var lostA = { pic: "\u{1F431}", cx: 400, sq: MTO_LOST };
      out += mtoSprite(b1, lostA);
      out += MK.cross(400 + MTO_LOST * MTO_SQ, mtoHeadY(b1, lostA) - 34, 26, popIn(t, cWrong, 0.4));
      /* nothing had reset it: the empty slot where a go home block was not */
      var miss = on(t, cNothing, 0.5);
      out += mtoSlot(180, 326, 340, 52, miss);
      out += MK.cross(350, 352, 24, popIn(t, mtoAt(cNothing, 0.25), 0.4));
      out += Tx(540, 360, "no reset at the top", "lab mid muted", "start", { opacity: n3(miss) });
      return out;
    }
    if (k === 2) {
      var cReset = sc(scene, 2, "reset"), cHome = sc(scene, 2, "home");
      var b = MTO_MIS_STAGE;
      out += mtoStage(b, 1);
      /* the home square the cat should have started on */
      out += R(400 - 46, mtoGround(b) - 12, 92, 20, 8, "none", P.good, 3, { "stroke-dasharray": "9 8" });
      out += MK.pill(400, 276, "home", 0.9, { size: 19, col: P.good, ink: P.good });
      var sq = MTO_LOST - (MTO_LOST - MTO_HOME) * on(t, cReset, 0.6);
      var catA = { pic: "\u{1F431}", cx: 400, sq: sq };
      out += mtoSprite(b, catA);
      var drop = popIn(t, cHome, 0.45);
      out += mtoSlot(180, 326, 340, 52, 1 - Math.min(1, drop));
      out += mtoBlock(180, 326, 340, 52, "home", { o: drop, col: P.good });
      out += Tx(540, 360, "at the top of every program", "lab mid muted", "start", { opacity: n3(on(t, mtoAt(cHome, 0.3), 0.5)) });
      out += MK.tick(500, 276, 22, popIn(t, mtoAt(cReset, 0.7), 0.4));
      return out;
    }
    if (k === 3) {
      var cRepeat = sc(scene, 3, "repeat"), cCheck = sc(scene, 3, "check");
      var script = ["repeat2", "spin", "jump"], ry = [100, 164, 228];
      script.forEach(function (id, n) {
        var col = n === 1 ? (mtoPast(t, cCheck) ? P.gold : mtoPast(t, cRepeat) ? P.bad : null) : null;
        out += mtoBlock(200, ry[n], 380, 54, id, { col: col });
      });
      out += MK.leader(600, ry[0] + 27, 600, ry[1] + 27, on(t, cCheck, 0.55), P.gold);
      out += Tx(620, ry[1] + 34, "this one", "lab mid gold", "start", { opacity: n3(on(t, mtoAt(cCheck, 0.3), 0.5)) });
      out += Tx(760, 78, "what really happens", "lab mid muted", "start", { opacity: n3(on(t, cRepeat, 0.5)) });
      MTO_REPEAT.forEach(function (id, n) {
        out += mtoBlock(760, 100 + n * 64, 340, 54, id,
          { o: on(t, mtoAt(cRepeat, 0.2 + n * 0.26), 0.4), col: n < 2 ? P.bad : null });
      });
      out += MK.tick(390, 330, 24, popIn(t, mtoAt(cCheck, 0.8), 0.4));
      return out;
    }
    if (k === 4) {
      var cWrite = sc(scene, 4, "write"), cBook = sc(scene, 4, "book");
      var lines = MTO_NOTES.map(function (_, n) { return on(t, mtoAt(cWrite, n * 0.34), 0.4); });
      out += MK.glow(585, 225, 196, P.gold, on(t, cBook, 0.6) * 0.9);
      out += mtoBook(320, 60, 530, 330, 1, lines, { col: mtoPast(t, cBook) ? P.gold : null });
      out += MK.pop(Em(886, 250, 52, "✏️"), 886, 250, popIn(t, cBook, 0.45));
      return out;
    }
    var cNext = sc(scene, 5, "next"), cInfo = sc(scene, 5, "info");
    out += mtoBook(60, 100, 320, 230, 1, [1, 1, 1], { cls: "lab small dark", lh: 44, pad: 40, top: 84, headCls: "lab mid" });
    out += MK.arrow(404, 214, 500, 214, on(t, cNext, 0.55), P.good, 7);
    var no = on(t, cNext, 0.5);
    out += G(R(540, 90, 480, 250, 20, P.card, P.good, 4) +
      Em(578, 124, 36, "▶️") + Tx(606, 133, "the next program", "lab big", "start", { fill: P.good }),
      { opacity: n3(no) });
    ["home", "right", "jump"].forEach(function (id, n) {
      out += mtoBlock(566, 158 + n * 56, 428, 48, id, { o: on(t, mtoAt(cNext, 0.25 + n * 0.22), 0.4) });
    });
    out += MK.tick(1062, 120, 24, popIn(t, mtoAt(cNext, 1.1), 0.4));
    out += MK.pill(584, 400, "a mistake is information", popIn(t, cInfo, 0.45),
      { size: 24, col: P.gold, ink: P.gold });
    return out;
  }

  function mtoMistakesChapter(scene, beat, t, i) {
    return svg(crossfade(t, i, scene, function (j) { return mtoMistakeArt(j, scene, t); }));
  }

  /* ---- what you now know ---------------------------------------------------- */
  var MTO_RECAP = MK.recapKind([
    { beat: 0, at: "same", title: "At the same time", sub: "nobody waits for anybody", pic: "\u{1F431}" },
    { beat: 0, at: "run", title: "One Run", sub: "it starts every script", pic: "▶️" },
    { beat: 1, at: "static", title: "Static", sub: "it stays where it is", pic: "\u{1F333}" },
    { beat: 2, at: "partner", title: "Partner", sub: "two people, more ideas", pic: "\u{1F91D}" },
    { beat: 2, at: "eyes", title: "Fresh eyes", sub: "they spot your bug", pic: "\u{1F440}" },
    { beat: 3, at: "mistake", title: "Mistake", sub: "it tells you what to change", pic: "\u{1F4A1}" }
  ], { goBeat: 3, goAt: "change" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Two objects, two scripts, one press of Run",
      "A static object that never moves",
      "Why programmers work in pairs, and use their mistakes"
    ] }),
    same: mtoSameChapter, tabs: mtoTabsChapter, static: mtoStaticChapter,
    together: mtoTogetherChapter, mistakes: mtoMistakesChapter, recap: MTO_RECAP
  };
