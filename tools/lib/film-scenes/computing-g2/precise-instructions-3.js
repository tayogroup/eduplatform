  /* ==== Precise Instructions, part 3: the photo, the tower, and the recap =====
     tools/lib/film-scenes/computing-g2/precise-instructions-3.js. See the
     header of precise-instructions.js.

     The photo chapter is the one place this film draws hardware: the tablet is
     the kit's own ART.figure("tablet"), rung on its own tap outlines, with a
     camera view drawn over its screen so that the cat the child is told to
     point at is actually in the viewfinder. The tower is the kit's own
     ART.scene("tower", ids). */

  /* ==== chapter: only the steps you need ==========================================
     The lesson's own five needed steps and its own three extras, each ticked
     or crossed as it is said, beside the tablet the photo is taken on. */
  var PI_NEED = { x: 34, w: 500, h: 40 };
  /* The first row sits 46 px down, not 34: a tap ripple spreads 44 px, and
     from the old first row it reached 10 px above the box, over the heading. */
  var PI_NEED_Y = [26, 69, 112, 155, 198];
  var PI_EXTRA_Y = [262, 305, 348];
  var PI_TAB = { x: 590, y: 20, w: 280, h: 407 };
  function piTX(v) { return PI_TAB.x + v * PI_TAB.w / 260; }
  function piTY(v) { return PI_TAB.y + v * PI_TAB.h / 378; }

  var PI_STEPS = [
    { text: "switch the tablet on", pic: piTabletGlyph },
    { text: "open the camera", pic: "\u{1F4F7}" },
    { text: "point it at the cat", pic: "\u{1F431}" },
    { text: "tap the round button", pic: "\u{1F4F8}" },
    { text: "look at your photo", pic: "\u{1F5BC}️" }
  ];
  var PI_EXTRAS = [
    { text: "put on your coat", pic: "\u{1F9E5}" },
    { text: "sing a song", pic: "\u{1F3B5}" },
    { text: "water the plant", pic: "\u{1F331}" }
  ];

  function piNeedChapter(scene, beat, t, i) {
    var cBefore = sc(scene, 0, "before"), cNeeds = sc(scene, 0, "needs");
    var cTablet = sc(scene, 1, "tablet"), cCamera = sc(scene, 1, "camera");
    var cPoint = sc(scene, 2, "point"), cButton = sc(scene, 2, "button"), cLook = sc(scene, 2, "look");
    var cCoat = sc(scene, 3, "coat"), cSong = sc(scene, 3, "song"), cPlant = sc(scene, 3, "plant");
    var cStep = sc(scene, 4, "step"), cBelong = sc(scene, 4, "belong");
    var cOrder = sc(scene, 5, "order"), cWritten = sc(scene, 5, "written");
    var at = [cTablet, cCamera, cPoint, cButton, cLook];
    var xAt = [cCoat, cSong, cPlant];
    var out = "";

    /* the task, and the question of which steps it takes */
    out += MK.pill(730, 60, "take a photo", on(t, cNeeds, 0.45) * (1 - on(t, cTablet, 0.5)),
      { size: 27, col: P.plum, ink: P.plum });
    out += MK.qmark(730, 220, 74, on(t, cNeeds, 0.5) * (1 - on(t, cTablet, 0.5)));

    /* the tablet, rung on the part being named */
    var tabO = on(t, cTablet, 0.5);
    if (tabO > 0) {
      var fig = ART.figure("tablet");
      fig = ART.ring(fig, "screen", piPast(t, cCamera) ? P.good : P.gold, 6);
      if (piPast(t, cCamera)) fig = ART.ring(fig, "camera", P.gold, 6);
      out += G(ART.place(fig, PI_TAB.x, PI_TAB.y, PI_TAB.w, PI_TAB.h), { opacity: tabO });
      /* the camera, open on the tablet's screen: the viewfinder, the cat in it,
         and the round button that takes the picture */
      var camO = on(t, cCamera, 0.5);
      if (camO > 0) {
        var sx = piTX(36), sy = piTY(44), sw = 188 * PI_TAB.w / 260, sh = 270 * PI_TAB.h / 378;
        var view = R(sx, sy, sw, sh, 6, "#0B1D2C") +
          R(sx + 8, sy + 8, sw - 16, sh * 0.58, 4, "#123044", P.teal, 2);
        var catO = on(t, cPoint, 0.5);
        if (catO > 0) view += Em(sx + sw / 2, sy + sh * 0.32, 92, "\u{1F431}", { opacity: catO });
        view += C(sx + sw / 2, sy + sh * 0.82, 27, "none", P.ink, 6) +
          C(sx + sw / 2, sy + sh * 0.82, 18, P.ink);
        out += G(view, { opacity: camO });
        out += MK.ripple(sx + sw / 2, sy + sh * 0.82, t, cButton, P.gold);
      }
    }
    /* the cat that is being pointed at, and the photo of it */
    out += MK.leader(884, 214, 992, 168, on(t, cPoint, 0.6), P.gold);
    out += MK.pop(Em(1036, 150, 88, "\u{1F431}"), 1036, 150, popIn(t, cPoint, 0.45));
    out += MK.pop(Em(1036, 322, 88, "\u{1F5BC}️"), 1036, 322, popIn(t, cLook, 0.45));
    out += MK.tick(1036, 396, 26, popIn(t, cLook == null ? null : cLook + 0.5, 0.4));

    /* the five slots, and the five needed steps */
    var shown = tally(t, cBefore, 5, 0.9);
    for (var k = 0; k < 5; k++) if (k < shown && !piPast(t, at[k])) out += piSlot(PI_NEED.x, PI_NEED_Y[k], PI_NEED.w, PI_NEED.h, k + 1, 1);
    PI_STEPS.forEach(function (s, k) {
      var o = on(t, at[k], 0.45);
      if (o <= 0) return;
      var sweep = bump(t, cOrder == null ? null : cOrder + k * 0.2, 0.55);
      out += piRow(PI_NEED.x, PI_NEED_Y[k], PI_NEED.w, PI_NEED.h, k + 1, s.text,
        { o: o, fs: 19, pic: s.pic, col: sweep > 0.05 ? P.gold : P.good,
          mark: "tick", markP: popIn(t, at[k] == null ? null : at[k] + 0.45, 0.35) });
      out += MK.ripple(PI_NEED.x + 24, PI_NEED_Y[k] + PI_NEED.h / 2, t, at[k], P.gold);
    });
    /* the three steps the task does not need, and then out they go */
    var keep = 1 - 0.86 * on(t, cBelong, 0.7);
    out += L(PI_NEED.x, 248, PI_NEED.x + PI_NEED.w, 248, P.line, 2,
      { "stroke-dasharray": "9 8", opacity: on(t, cCoat, 0.5) * keep });
    PI_EXTRAS.forEach(function (s, k) {
      var o = on(t, xAt[k], 0.45) * keep;
      if (o <= 0) return;
      /* "a step the task does not need": the three of them light in turn, and
         then they go */
      var lit = bump(t, cStep == null ? null : cStep + k * 0.22, 0.6);
      out += piRow(PI_NEED.x, PI_EXTRA_Y[k], PI_NEED.w, PI_NEED.h, "", s.text,
        { o: o, fs: 19, pic: s.pic, col: lit > 0.05 ? P.gold : P.bad,
          mark: "cross", markP: popIn(t, xAt[k], 0.4) });
    });

    /* the needed steps, in order: that is the algorithm */
    out += MK.arrow(558, PI_NEED_Y[0] + 8, 558, PI_NEED_Y[4] + PI_NEED.h - 8, on(t, cOrder, 0.8), P.teal, 8);
    out += MK.pill(284, 412, "an algorithm!", on(t, cWritten, 0.45), { size: 24, col: P.good, ink: P.ink });
    return svg(out);
  }

  /* ==== chapter: building and drawing =============================================
     The lesson's own brick question. "Add a brick" gets three different
     towers, all three of them ART.scene("tower", ids) obeying it; "put the
     blue brick on top of the red brick" gets exactly one. */
  var PI_CHIPS = ["red", "blue", "yellow", "green", "purple"];
  var PI_WORDS3 = [["precise", 116], ["in order", 300], ["nothing extra", 472]];
  function piTWX(v) { return PI_TOWER.x + v * PI_TOWER.w / 320; }
  function piTWY(v) { return PI_TOWER.y + v * PI_TOWER.h / 260; }

  function piBuildMain(scene, t) {
    var cTower = sc(scene, 0, "tower"), cRed = sc(scene, 0, "red");
    var cBlue = sc(scene, 2, "blue"), cOne = sc(scene, 2, "one");
    var cPrecise = sc(scene, 3, "precise"), cOrder = sc(scene, 3, "order"), cNothing = sc(scene, 3, "nothing");
    var out = "";

    var ids = piPast(t, cBlue) ? ["red", "blue"] : piPast(t, cRed) ? ["red"] : [];
    out += piCanvas(ART.scene("tower", ids), PI_TOWER, on(t, cTower, 0.5),
      piPast(t, cOne) ? P.good : P.line);
    /* "in the right order": which brick went down first */
    var ord = on(t, cOrder, 0.5);
    if (ord > 0) {
      [[205, "1"], [171, "2"]].forEach(function (b, k) {
        var p = on(t, cOrder == null ? null : cOrder + k * 0.3, 0.4);
        if (!(p > 0)) return;
        out += G(C(piTWX(82), piTWY(b[0]), 17, P.card, P.gold, 3) +
          Tx(piTWX(82), piTWY(b[0]) + 8, b[1], "lab", "middle", { fill: P.gold, "font-size": 21 }),
          { opacity: p });
      });
    }

    /* the bricks Robo has to choose from */
    out += Tx(PI_PANEL.x, 58, "Robo's bricks", "lab big muted", "start", { opacity: on(t, cTower, 0.45) });
    var chips = tally(t, cTower, 5, 1.0);
    PI_CHIPS.forEach(function (id, k) {
      var used = id === "red" ? piPast(t, cRed) : id === "blue" ? piPast(t, cBlue) : false;
      var fade = used || !piPast(t, cNothing) ? 1 : 0.22;
      out += piBrick(PI_PANEL.x + k * 112, 80, 96, 44, id, (k < chips ? 1 : 0) * fade, used);
    });

    /* what Robo was told, and whether it was precise */
    var text = piPast(t, cBlue) ? "Put the blue brick on top of the red brick" : "";
    out += piCard(PI_PANEL.x, 158, PI_PANEL.w, 92, text, on(t, cTower, 0.5),
      piPast(t, cOne) ? P.good : piPast(t, cBlue) ? P.gold : null, 23);
    /* one tick, not a "precise" pill: the word already has its own pill in the
       row below, and two of them read as two different claims */
    out += MK.tick(312, 296, 30, popIn(t, cOne, 0.42));
    /* the three things a precise algorithm has */
    var wAt = [cPrecise, cOrder, cNothing];
    PI_WORDS3.forEach(function (w, k) {
      out += MK.pill(w[1], 378, w[0], on(t, wAt[k], 0.4), { size: 22, col: P.gold, ink: P.gold });
    });
    return out;
  }

  /* Three towers, every one of them obeying "add a brick": the kit drew each
     from its own list, so the film draws no guess of its own. */
  var PI_MAYBE = [
    { id: "blue", label: "a blue one?", x: 84 },
    { id: "green", label: "a green one?", x: 434 },
    { id: "purple", label: "a purple one?", x: 784 }
  ];

  function piBuildThree(scene, t) {
    var cAdd = sc(scene, 1, "add"), cVague = sc(scene, 1, "vague"), cAny = sc(scene, 1, "any");
    var out = "", shown = tally(t, cAny, 3, 1.0), base = on(t, cVague, 0.5);
    out += MK.pill(584, 44, "Add a brick", on(t, cAdd, 0.45), { size: 27, col: P.bad, ink: P.bad });
    PI_MAYBE.forEach(function (m, k) {
      if (!(base > 0)) return;
      var cx = m.x + 150, has = k < shown;
      out += piCanvasAt(ART.scene("tower", has ? ["red", m.id] : ["red"]), m.x, 112, 300, 243.75, base, P.bad);
      out += MK.qmark(cx, 214, 30, base * (1 - on(t, cAny == null ? null : cAny + k * 0.3, 0.4)));
      out += Tx(cx, 392, m.label, "lab big", "middle", { opacity: has ? 1 : 0 });
    });
    return out;
  }

  function piBuildChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1) * (1 - into(t, scene.first + 2)), out = "";
    if (u < 1) out += G(piBuildMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(piBuildThree(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own five words, with its own pictures for them. */
  var PI_RECAP = MK.recapKind([
    { beat: 0, at: "precise", title: "Precise", sub: "exact, nothing to guess", pic: "\u{1F3AF}" },
    { beat: 0, at: "vague", title: "Vague", sub: "it leaves things to guess", pic: "\u{1F32B}️" },
    { beat: 1, at: "algorithm", title: "Algorithm", sub: "a precise set of instructions", pic: "\u{1F4DD}" },
    { beat: 2, at: "linear", title: "Linear", sub: "one step after another", pic: "➡️" },
    { beat: 3, at: "needed", title: "Needed", sub: "the task cannot be done without it", pic: "✅" }
  ], { goBeat: 3, goAt: "go" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "What makes an instruction precise",
      "How to follow a linear algorithm",
      "Which steps a task really needs"
    ] }),
    exact: piExactChapter, where: piWhereChapter, linear: piLinearChapter,
    need: piNeedChapter, build: piBuildChapter, recap: PI_RECAP
  };
