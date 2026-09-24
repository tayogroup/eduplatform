  /* ==== chapters: light bounces off, and bounce it into an eye ================
     tools/lib/film-scenes/science-g4/light-and-seeing-2.js. */

  /* ---- light bounces off --------------------------------------------------------
     The lesson's second lecture part, which has no drawing of its own. Beat 0:
     one ray in, one ray out, and the word. Beats 1 and 2: the contrast the
     lesson draws - a mirror, which sends the light on in ONE new straight line,
     and a book, which scatters it in every direction. Beats 3 and 4: the pale
     surface that sends most of the light back, and the dark one that soaks it
     up, which is why it looks dark. */

  function lasSurfacePic(t, scene) {
    var cHits = sc(scene, 0, "hits"), cBounces = sc(scene, 0, "bounces"), cWord = sc(scene, 0, "word");
    var a = on(t, cHits, 0.7), b = on(t, cBounces, 0.7), out = "";

    out += R(284, 40, 600, 320, 20, P.card, P.line, 2);
    out += R(344, 272, 480, 28, 6, "#5A6B78", LAS_WALL_EDGE, 2);
    out += Tx(584, 96, "a surface", "lab mid muted readable", "middle");
    out += lasRay(420, 124, 572, 266, a, LAS_RAY, 8);
    out += MK.ripple(584, 272, t, cBounces, P.gold);
    out += lasRay(596, 266, 748, 124, b, LAS_RAY, 8);
    out += MK.pill(584, 400, "reflection", on(t, cWord, 0.45), { size: 32, col: P.gold });
    return out;
  }

  var LAS_CARD_L = { x: 40, y: 46, w: 528, h: 348 };
  var LAS_CARD_R = { x: 600, y: 46, w: 528, h: 348 };
  function lasCard(box, lit, o) {
    return R(box.x, box.y, box.w, box.h, 22, lit > 0 ? "#1B3A52" : P.card, lit > 0 ? P.gold : P.line, lit > 0 ? 3 : 2,
      { opacity: n2(clamp(o, 0, 1)) });
  }

  /* the mirror, and the book: neat against rough */
  function lasNeatPic(t, scene) {
    var cMirror = sc(scene, 1, "mirror"), cNeat = sc(scene, 1, "neat");
    var cBook = sc(scene, 2, "book"), cRough = sc(scene, 2, "rough"), cEvery = sc(scene, 2, "every");
    var m = popIn(t, cMirror, 0.5), bk = popIn(t, cBook, 0.5), out = "";

    /* the mirror: one ray in, one ray out */
    if (m > 0) {
      var left = lasCard(LAS_CARD_L, bk > 0 ? 0 : 1, Math.min(1, m));
      left += Tx(304, 92, "A mirror", "lab big", "middle", { opacity: n2(Math.min(1, m)) });
      left += R(164, 286, 280, 18, 4, LAS_GLASS, "#FFFFFF", 2, { opacity: n2(Math.min(1, m)) });
      var neat = on(t, cNeat, 0.7);
      left += lasRay(194, 130, 290, 278, Math.min(1, m), LAS_RAY, 7);
      left += lasRay(314, 278, 410, 130, neat, LAS_RAY, 7);
      left += MK.pill(304, 352, "one new straight line", neat, { size: 24, col: P.gold });
      out += G(left, { opacity: n2(Math.min(1, m)) });
    }
    /* the book: one ray in, many out, in every direction */
    if (bk > 0) {
      var right = lasCard(LAS_CARD_R, 1, Math.min(1, bk));
      right += Tx(864, 92, "A book", "lab big", "middle");
      right += lasRay(690, 128, 806, 236, Math.min(1, bk), LAS_RAY, 7);
      right += Em(864, 290, 96, "\u{1F4D5}");
      right += lasScatter(838, 254, 20, 122, -Math.PI * 0.96, -Math.PI * 0.04, 7,
        Math.max(on(t, cRough, 0.7), on(t, cEvery, 0.7)), LAS_RAY, 5);
      right += MK.pill(864, 352, "in every direction", on(t, cEvery, 0.5), { size: 24, col: P.gold });
      out += G(right, { opacity: n2(Math.min(1, bk)) });
    }
    return out;
  }

  /* pale and shiny, against dark */
  var LAS_SOAK = [[-0.62, 0.2], [-0.2, 0.62], [0.24, 0.24], [0.62, 0.58], [-0.42, 0.8], [0.44, 0.86]];
  function lasPalePic(t, scene) {
    var cPale = sc(scene, 3, "pale"), cMost = sc(scene, 3, "most");
    var cDark = sc(scene, 4, "dark"), cSoak = sc(scene, 4, "soak"), cLook = sc(scene, 4, "look");
    var p = popIn(t, cPale, 0.5), d = popIn(t, cDark, 0.5), look = on(t, cLook, 0.8), out = "";

    if (p > 0) {
      var left = lasCard(LAS_CARD_L, d > 0 ? 0 : 1, Math.min(1, p));
      left += Tx(304, 92, "Pale and shiny", "lab big", "middle");
      left += R(160, 276, 288, 22, 5, LAS_PAPER, "#FFFFFF", 2);
      left += lasRay(196, 124, 290, 264, Math.min(1, p), LAS_RAY, 7);
      left += lasScatter(302, 262, 16, 124, -Math.PI * 0.9, -Math.PI * 0.1, 7, on(t, cMost, 0.7), LAS_RAY, 5);
      left += MK.pill(304, 352, "most of it comes back", on(t, cMost, 0.5), { size: 24, col: P.gold });
      out += G(left, { opacity: n2(Math.min(1, p)) });
    }
    if (d > 0) {
      var right = lasCard(LAS_CARD_R, 1, Math.min(1, d));
      right += Tx(864, 92, "Dark", "lab big", "middle");
      right += R(720, 276, 288, 22, 5, lasDarkMix(look), LAS_WALL_EDGE, 2);
      right += lasRay(756, 124, 850, 264, Math.min(1, d), LAS_RAY, 7);
      /* one faint ray back, and the rest soaked up inside the surface */
      var soak = on(t, cSoak, 0.8);
      right += G(lasRay(862, 262, 918, 206, soak, LAS_RAY, 5), { opacity: n2(0.3 * soak) });
      for (var k = 0; k < LAS_SOAK.length; k++) {
        right += C(864 + LAS_SOAK[k][0] * 130, 286 + LAS_SOAK[k][1] * 9, 5, LAS_RAY, null, null,
          { opacity: n2(0.75 * soak * (1 - LAS_SOAK[k][1])) });
      }
      right += MK.pill(864, 352, "soaks most of it up", soak, { size: 24, col: P.gold });
      out += G(right, { opacity: n2(Math.min(1, d)) });
    }
    return out;
  }
  /* the dark surface gets darker still as the line says why it looks dark */
  function lasDarkMix(u) { return u > 0.5 ? "#191D21" : LAS_DARK_SURF; }

  function lasReflectChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(lasSurfacePic(t, scene));
    if (k < 3) {
      var u = into(t, scene.first + 1);
      return svg(lasNeatPic(t, scene) + (u < 1 ? G(lasSurfacePic(t, scene), { opacity: n2(1 - u) }) : ""));
    }
    var v = into(t, scene.first + 3);
    return svg(lasPalePic(t, scene) + (v < 1 ? G(lasNeatPic(t, scene), { opacity: n2(1 - v) }) : ""));
  }

  /* ---- bounce it into an eye ----------------------------------------------------
     The lesson's own experiment (ART.sim "rayMirror"), at the states its two
     buttons reach: the mirror at its first tilt, where the ray bounces off and
     misses the eye; turned to the tilt that sends it into the eye; and the book
     put in the way, which stops the ray before the mirror. The prediction the
     step asks for stands beside it, and its three answers are ticked or crossed
     by what the experiment does - which is the whole of "did the result support
     your prediction". */
  var LAS_M = { x: 44, y: 24, w: 580, h: 399, k: 1.8125 };
  function lasMX(v) { return LAS_M.x + v * LAS_M.k; }
  function lasMY(v) { return LAS_M.y + v * LAS_M.k; }
  /* The sim draws its reflected ray 420 units long, so at the tilts that miss
     the eye it runs far past its own 320 x 220 viewBox - which clips it, in the
     lesson and here alike. The clip is DECLARED as well, because a nested svg's
     getBoundingClientRect reports the overflow it is about to clip away, and
     --sweep read that as 394 px drawn below the 1168 x 440 box. */
  function lasMirrorCard(angle, blocked) {
    return '<defs><clipPath id="lasMclip"><rect x="' + n2(LAS_M.x) + '" y="' + n2(LAS_M.y) +
      '" width="' + n2(LAS_M.w) + '" height="' + n2(LAS_M.h) + '"/></clipPath></defs>' +
      G(ART.place(ART.sim("rayMirror", "draw", angle, blocked), LAS_M.x, LAS_M.y, LAS_M.w, LAS_M.h),
        { "clip-path": "url(#lasMclip)" });
  }

  function lasMirrorChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTorch = c(0, "torch"), cMirror = c(0, "mirror"), cEye = c(0, "eye"), cWatch = c(0, "watch");
    var cPredict = c(1, "predict"), cBounce = c(1, "bounce"), cStop = c(1, "stop"), cCurve = c(1, "curve");
    var cTurn = c(2, "turn"), cBounces = c(2, "bounces"), cPredicted = c(2, "predicted");
    var cAngle = c(3, "angle"), cReaches = c(3, "reaches"), cSee = c(3, "see");
    var cBook = c(4, "book"), cBlocks = c(4, "blocks"), cNone = c(4, "none");
    var out = "";

    /* The mirror turns through the sim's own tilts, and each tilt belongs to
       the line that describes it: on "Turn the mirror" it reaches tilt 1, where
       the ray bounces off in a new straight line and misses the eye, and only
       on "the right angle" does it reach tilt 2, the one that sends the ray
       into the eye. (Going straight to 2 put the sim's own caption - "the ray
       reaches the eye" - on screen a whole line before the voice said it.) */
    var angle = 0;
    if (cTurn != null && t >= cTurn) angle = 1;
    if (cAngle != null && t >= cAngle) angle = 2;
    var blocked = cBook != null && t >= cBook;

    out += R(36, 16, 596, 415, 18, P.card, P.line, 2);
    out += lasMirrorCard(angle, blocked);

    /* "a torch, a mirror and an eye": each ringed as it is named */
    out += C(lasMX(40), lasMY(166), 52, "none", P.gold, 4, { opacity: n2(bump(t, cTorch, 1.6)) });
    out += R(lasMX(236), lasMY(24), 30 * LAS_M.k, 82 * LAS_M.k, 8, "none", P.gold, 4, { opacity: n2(bump(t, cMirror, 1.6)) });
    out += C(lasMX(110), lasMY(30), 46, "none", P.gold, 4, { opacity: n2(bump(t, cEye, 1.6)) });
    /* "watch what the ray does": the ray in, traced */
    var watch = bump(t, cWatch, 2.0);
    if (watch > 0) out += L(lasMX(62), lasMY(160), lasMX(251), lasMY(65), P.ink, 5,
      { opacity: n2(0.85 * watch), "stroke-dasharray": "14 12" });

    /* the prediction, and what the experiment did to it */
    out += MK.qmark(700, 60, 30, on(t, cPredict, 0.45));
    out += G(MK.list(668, 138, [
      { text: "Bounce off in a new line", at: cBounce, mark: "tick", markAt: cPredicted },
      { text: "Stop dead", at: cStop, mark: "cross", markAt: cPredicted == null ? null : cPredicted + 0.25 },
      { text: "Curve round", at: cCurve, mark: "cross", markAt: cPredicted == null ? null : cPredicted + 0.45 }
    ], t, { lh: 82, cls: "lab big" }), { opacity: n2(1 - 0.55 * on(t, cBook, 0.6)) });

    /* "it bounces off in a new straight line": the bounce itself, at the
       mirror. It must NOT be traced from the mirror to the eye: at this tilt
       the sim's own ray misses the eye and its caption says so, and a line
       drawn to the eye here would contradict the picture under it. */
    out += MK.ripple(lasMX(251), lasMY(65), t, cBounces, P.gold);
    out += C(lasMX(251), lasMY(65), 42, "none", P.gold, 4, { opacity: n2(bump(t, cBounces, 1.8)) });
    /* "at the right angle": the turn the mirror made, marked at the mirror */
    var ang = bump(t, cAngle, 2.0);
    if (ang > 0) out += Pth("M" + n2(lasMX(251) - 56) + "," + n2(lasMY(65) + 22) +
      " A58,58 0 0 1 " + n2(lasMX(251) - 30) + "," + n2(lasMY(65) - 50), null, P.gold, 4,
      { opacity: n2(ang), "stroke-dasharray": "9 8" });
    /* "reaches the eye, and you see the torch" */
    out += MK.ripple(lasMX(110), lasMY(30), t, cReaches, P.gold);
    out += MK.tick(lasMX(178), lasMY(28), 30, popIn(t, cSee, 0.4) * (1 - on(t, cBook, 0.5)));

    /* the book in the way: the ray stops, and the mirror shows no torch */
    out += MK.ripple(lasMX(153), lasMY(110), t, cBook, P.bad);
    out += MK.cross(lasMX(153), lasMY(110), 34, popIn(t, cBlocks, 0.4));
    out += MK.pill(860, 408, "no torch in the mirror", on(t, cNone, 0.45), { size: 26, col: P.muted, ink: P.muted });
    return svg(out);
  }
